import { createHash, randomUUID } from 'node:crypto'
import type { CreateProposalBody } from '@redduck/api-contracts'
import { AppError } from '../../lib/errors'
import { PROPOSAL_LABEL, UNVERIFIED_AUTHOR_LABEL, assertProposalsEnabled, siteOrigin } from './proposals.config'
import { checkContentRules, normaliseContent } from './content-rules'
import { buildCommitMessage, buildPullRequestBody, buildPullRequestTitle } from './pull-request-content'
import { buildProposalBranch, proposalGitHubService } from './proposal-github.service'
import { TurnstileService } from './turnstile.service'
import { hashContributorIp } from './contributor-key'
import { ProposalsRepository, type ProposalDoor } from './proposals.repository'

export interface SubmitProposalContext {
  /** Privy user id when the request carried a verified session; null makes this the anonymous door. */
  privyUserId: string | null
  clientIp: string
}

export interface SubmittedProposal {
  prUrl: string
  prNumber: number
  branch: string
}

function lessonPath(body: CreateProposalBody): string {
  return `content/${body.courseSlug}/${body.moduleSlug}/${body.lessonSlug}.md`
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export const ProposalsService = {
  /**
   * Turns a browser edit into a pull request.
   *
   * The step order is load-bearing, not incidental:
   *
   *  - **Quotas first**, because they are the cheapest check and the one an attacker is trying to
   *    exhaust.
   *  - **Content rules before Turnstile**, because a Turnstile token is single-use with a
   *    300-second lifetime. Spending it on a submission that was never going to be accepted means
   *    a contributor with a fixable mistake solves a fresh challenge for every attempt, and the
   *    retry lands as `timeout-or-duplicate` if they do not.
   *  - **The base check before the write**, because every proposal gets a fresh branch, so
   *    `POST git/refs` can never collide and git would report no conflict — the pull request would
   *    simply revert whatever was merged while the contributor was typing, and the diff would look
   *    entirely ordinary to a reviewer.
   *  - **The row last**, so a failed submission costs the contributor nothing from their quota.
   */
  async submit(body: CreateProposalBody, context: SubmitProposalContext): Promise<SubmittedProposal> {
    assertProposalsEnabled()

    const door: ProposalDoor = context.privyUserId ? 'signed_in' : 'anonymous'
    const path = lessonPath(body)
    // Only the anonymous door is keyed on the network. A signed-in contributor has a durable
    // identity, and adding an IP bucket on top would let one shared office or campus address lock
    // out everyone behind it.
    const ipHash = door === 'anonymous' ? hashContributorIp(context.clientIp) : null

    await ProposalsRepository.assertWithinQuotas({ door, ipHash, privyUserId: context.privyUserId, path })

    const content = normaliseContent(body.content)
    const { content: base, base: baseCommit } = await proposalGitHubService.readBase(path)

    const violations = checkContentRules({ path, base, submitted: content })
    if (violations.length > 0) {
      throw new AppError(422, 'This change cannot be proposed yet', { violations })
    }

    if (base !== null && sha256(base) !== body.baseHash) {
      throw new AppError(409, 'This lesson changed while you were editing it', { theirs: base })
    }
    if (base === null && body.baseHash !== sha256('')) {
      throw new AppError(409, 'This lesson no longer exists on main', {})
    }

    if (door === 'anonymous') {
      if (!body.turnstileToken) throw new AppError(400, 'Please complete the challenge before submitting')
      await TurnstileService.verify(body.turnstileToken, context.clientIp)
    }

    const branch = buildProposalBranch(body.courseSlug, body.moduleSlug, body.lessonSlug)
    const narrative = {
      courseSlug: body.courseSlug,
      moduleSlug: body.moduleSlug,
      lessonSlug: body.lessonSlug,
      path,
      rationale: body.rationale,
      displayName: body.displayName,
      door,
      licenseVersion: body.licenseVersion,
      isNewLesson: base === null,
      editorUrl: `${siteOrigin()}/edit/${body.courseSlug}/${body.moduleSlug}/${body.lessonSlug}`,
    }

    const { prNumber, prUrl } = await proposalGitHubService.openProposal({
      // Pinned to the commit the file was read from, so a merge landing mid-edit becomes a visible
      // conflict on the pull request rather than a silent revert.
      base: baseCommit,
      path,
      content,
      branch,
      commitMessage: buildCommitMessage(narrative),
      prTitle: buildPullRequestTitle(narrative),
      prBody: buildPullRequestBody(narrative),
      // The community-proposal label is a security control, not decoration: a privileged workflow
      // refuses to run on pull requests carrying it, so unreviewed prose never reaches a job that
      // holds write permissions and an API key.
      labels: door === 'anonymous' ? [PROPOSAL_LABEL, UNVERIFIED_AUTHOR_LABEL] : [PROPOSAL_LABEL],
    })

    await ProposalsRepository.record({
      id: randomUUID(),
      path,
      branch,
      prNumber,
      door,
      ipHash,
      privyUserId: context.privyUserId,
      licenseVersion: body.licenseVersion,
      licenseAcceptedAt: new Date(),
    })

    return { prUrl, prNumber, branch }
  },
}
