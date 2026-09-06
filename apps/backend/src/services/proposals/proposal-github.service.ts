import { Octokit } from '@octokit/rest'
import { randomBytes } from 'crypto'
import { AppError, GENERIC_ERROR_MESSAGE } from '../../lib/errors'
import { Logger } from '../../lib/logger'
import { httpStatus, throwGitHubApiError } from '../review/utils/github'
import { PROPOSAL_PATH_RE } from './content-rules'
import { githubAppAuth } from './github-app-auth'
import { BASE_BRANCH, PROPOSAL_BRANCH_PREFIX, proposalsRepoConfig } from './proposals.config'

const logger = new Logger('ProposalGitHubService')

/** Non-executable file. A tree entry carries its own mode; nothing is inherited from `base_tree`. */
const BLOB_MODE = '100644'

const REJECTED_PATH = 'That file cannot be edited through a lesson proposal'

interface TreeEntry {
  path: string
  mode: typeof BLOB_MODE
  type: 'blob'
  sha: string
}

/** The commit a proposal is built on. Read once, then carried through the write unchanged. */
export interface BaseCommit {
  commitSha: string
  treeSha: string
}

export interface OpenProposalInput {
  /** The commit `readBase` returned, NOT the branch head at write time. See `openProposal`. */
  base: BaseCommit
  path: string
  content: string
  branch: string
  commitMessage: string
  prTitle: string
  prBody: string
  labels: string[]
}

/**
 * Re-raises our own errors untouched. The App auth hook runs inside the Octokit request, so a 503
 * from a missing config var or a failed token mint arrives at these `catch` blocks looking like a
 * GitHub failure and would otherwise be flattened into a generic 502.
 */
function rethrowGitHubError(e: unknown, context?: Record<string, unknown>): never {
  if (e instanceof AppError) throw e
  throwGitHubApiError(e, context)
}

/**
 * A `git/trees` entry path is a literal repo-root-relative string: whatever reaches this call is
 * written verbatim, so `.github/workflows/*` or `scripts/*` would land on the branch and then be
 * executed by Actions on the very push that creates it.
 *
 * The route validates the path long before this point, and that is precisely why this guard exists
 * separately rather than being folded into it — it is the copy with nothing left between it and the
 * write, so it still holds if a later caller, refactor or reordering skips the earlier one.
 *
 * The `git/blobs` call that produces `sha` runs before this: a blob is content-addressed and
 * unreachable until a tree names it, so this is still the first call that can put a file anywhere.
 */
function assertWritableTree(tree: TreeEntry[]): void {
  // One proposal edits one file. Anything else means the tree was assembled somewhere this service
  // does not know about, and the surplus entries are exactly the ones nobody checked.
  if (tree.length !== 1) {
    logger.error('Refusing a proposal tree that is not a single file', undefined, { entries: tree.length })
    throw new AppError(500, GENERIC_ERROR_MESSAGE)
  }

  for (const { path } of tree) {
    // `..`, backslashes, a leading slash and NUL are rejected in their own right rather than left to
    // the pattern: each is a shape that makes the same string mean something different to git, to a
    // Windows checkout, or to the scripts that read the path back after the merge.
    const safe =
      PROPOSAL_PATH_RE.test(path) &&
      !path.includes('..') &&
      !path.includes('\\') &&
      !path.startsWith('/') &&
      !path.includes('\0')
    if (!safe) {
      logger.error('Refusing a proposal tree entry outside content/', undefined, { path })
      throw new AppError(400, REJECTED_PATH)
    }
  }
}

/**
 * A GitHub App cannot scope `contents: write` to a set of branches, so the token that creates
 * `refs/heads/proposal/…` is equally entitled to write `refs/heads/main`. GitHub will not refuse it;
 * this prefix check is the only thing that does.
 */
function assertProposalRef(ref: string): void {
  if (!ref.startsWith(`refs/heads/${PROPOSAL_BRANCH_PREFIX}`)) {
    logger.error('Refusing a ref outside the proposal namespace', undefined, { ref })
    throw new AppError(500, GENERIC_ERROR_MESSAGE)
  }
}

/**
 * The random suffix keeps two people editing the same lesson from claiming one ref — `git/refs` is
 * a create, so the second would fail rather than open its own pull request.
 */
export function buildProposalBranch(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `${PROPOSAL_BRANCH_PREFIX}${courseSlug}/${moduleSlug}/${lessonSlug}/${randomBytes(4).toString('hex')}`
}

export class ProposalGitHubService {
  private readonly octokit: Octokit

  constructor() {
    this.octokit = new Octokit()
    // Installation tokens rotate hourly, so the header is attached per request. `new Octokit({ auth })`
    // would bind whichever token was current when this singleton was constructed at import time.
    this.octokit.hook.before('request', async (options) => {
      options.headers.authorization = `token ${await githubAppAuth.token()}`
    })
  }

  /** The file as of a single base commit, returned alongside that commit so the write can pin to it. */
  async readBase(path: string): Promise<{ content: string | null; base: BaseCommit }> {
    const { owner, repo } = proposalsRepoConfig()
    const base = await this.#baseHead(owner, repo)

    try {
      const { data } = await this.octokit.repos.getContent({ owner, repo, path, ref: base.commitSha })
      if (Array.isArray(data) || data.type !== 'file') {
        throw new AppError(400, REJECTED_PATH)
      }
      // Above 1 MB GitHub answers with `encoding: 'none'` and an empty `content`. Accepting that
      // would show the contributor a blank lesson and turn their next save into a wholesale delete.
      if (data.encoding !== 'base64') {
        logger.error('Base file came back without inline content', undefined, { path, encoding: data.encoding })
        throw new AppError(413, 'That lesson is too large to edit in the browser')
      }
      return { content: Buffer.from(data.content, 'base64').toString('utf-8'), base }
    } catch (e) {
      // A lesson that does not exist yet is the create case, not a failure.
      if (httpStatus(e) === 404) return { content: null, base }
      rethrowGitHubError(e, { path })
    }
  }

  /**
   * Builds on `input.base` rather than re-reading the branch head.
   *
   * Re-resolving here would open a window between the read and the write: if anything merged in
   * between, the new commit's parent would already contain that change while its blob is the whole
   * file as the contributor loaded it, so the pull request would revert the merged edit and git
   * would report no conflict — the diff looks like an ordinary edit to a reviewer. Pinning to the
   * commit the contributor actually started from means a concurrent change surfaces as a real merge
   * conflict on the pull request instead.
   */
  async openProposal(input: OpenProposalInput): Promise<{ prNumber: number; prUrl: string }> {
    const { owner, repo } = proposalsRepoConfig()

    const commitSha = await this.#commitFile(owner, repo, input.base, input)
    await this.#createBranch(owner, repo, input.branch, commitSha)
    const pullRequest = await this.#openPullRequest(owner, repo, input)
    await this.#applyLabels(owner, repo, pullRequest.prNumber, input.labels)

    return pullRequest
  }

  /** Both shas come from one call: `git/trees` needs the tree, `git/commits` needs the commit. */
  async #baseHead(owner: string, repo: string): Promise<BaseCommit> {
    try {
      const { data } = await this.octokit.repos.getBranch({ owner, repo, branch: BASE_BRANCH })
      return { commitSha: data.commit.sha, treeSha: data.commit.commit.tree.sha }
    } catch (e) {
      rethrowGitHubError(e, { branch: BASE_BRANCH })
    }
  }

  /**
   * The Git Data API rather than `PUT /repos/{owner}/{repo}/contents/{path}`, which would create the
   * blob, the tree, the commit and the branch in a single call — leaving no point at which the tree
   * and the ref still exist as values this service can refuse to write.
   */
  async #commitFile(owner: string, repo: string, base: BaseCommit, input: OpenProposalInput): Promise<string> {
    try {
      const { data: blob } = await this.octokit.git.createBlob({
        owner,
        repo,
        content: input.content,
        encoding: 'utf-8',
      })

      const tree: TreeEntry[] = [{ path: input.path, mode: BLOB_MODE, type: 'blob', sha: blob.sha }]
      assertWritableTree(tree)

      const { data: created } = await this.octokit.git.createTree({
        owner,
        repo,
        // Without `base_tree` the entries below are the entire repository rather than a change to it,
        // so the commit reads as a deletion of every file this proposal does not name.
        base_tree: base.treeSha,
        tree,
      })

      const { data: commit } = await this.octokit.git.createCommit({
        owner,
        repo,
        message: input.commitMessage,
        tree: created.sha,
        parents: [base.commitSha],
        // No `author` or `committer` on purpose. A commit the App makes under its own identity is
        // signed by GitHub and shows as verified; naming a contributor we have not authenticated
        // drops that signature and attributes unreviewed content to an identity nobody proved.
      })

      return commit.sha
    } catch (e) {
      rethrowGitHubError(e, { path: input.path })
    }
  }

  async #createBranch(owner: string, repo: string, branch: string, commitSha: string): Promise<void> {
    const ref = `refs/heads/${branch}`
    assertProposalRef(ref)

    try {
      await this.octokit.git.createRef({ owner, repo, ref, sha: commitSha })
    } catch (e) {
      rethrowGitHubError(e, { ref })
    }
  }

  async #openPullRequest(
    owner: string,
    repo: string,
    input: OpenProposalInput,
  ): Promise<{ prNumber: number; prUrl: string }> {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title: input.prTitle,
        body: input.prBody,
        base: BASE_BRANCH,
        head: input.branch,
        // Both doors produce an ordinary reviewable pull request. Draft state is a signal maintainers
        // use among themselves, and `unverified-author` already carries the distinction between them.
        draft: false,
      })
      return { prNumber: data.number, prUrl: data.html_url }
    } catch (e) {
      rethrowGitHubError(e, { branch: input.branch })
    }
  }

  /**
   * `community-proposal` is not decoration: the workflow that would otherwise run against this
   * branch checks for the label and stands down. An unlabelled pull request therefore looks like
   * ordinary reviewed work while being the one thing it must not be, which is worse than no pull
   * request at all — so a labelling failure closes what was just opened instead of returning it.
   */
  async #applyLabels(owner: string, repo: string, prNumber: number, labels: string[]): Promise<void> {
    try {
      await this.octokit.issues.addLabels({ owner, repo, issue_number: prNumber, labels })
    } catch (e) {
      logger.error('Could not label a proposal pull request, closing it', e, { prNumber })
      try {
        await this.octokit.pulls.update({ owner, repo, pull_number: prNumber, state: 'closed' })
      } catch (closeError) {
        // Nothing else can be done here; the log is what makes the orphan findable by a maintainer.
        logger.error('Could not close the unlabelled proposal pull request', closeError, { prNumber })
      }
      rethrowGitHubError(e, { prNumber })
    }
  }
}

export const proposalGitHubService = new ProposalGitHubService()
