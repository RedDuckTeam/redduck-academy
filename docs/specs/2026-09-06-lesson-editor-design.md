# In-browser lesson editor with GitHub pull requests

**Status:** implemented. Blocks marked *Changed in implementation* record where the built thing
deliberately differs from this design, and why.
**Date:** 2026-09-06
**Branch:** `feat/lesson-editor`

Reviewed by four independent adversarial passes (repo fact-check, simplicity, security/abuse,
requirements fidelity). Their findings are folded in; the significant reversals from the first
draft are called out inline as **Reversed after review**.

## 1. What we are building

A Markdown editor on `academy.redduck.io` that lets anyone improve a lesson without leaving the
site and without a local checkout. Saving does not publish — it opens a **pull request** against
`content/`, which goes through the review and CI we already have.

Two ways in, deliberately equal where it counts:

| Door | Who | Gate | Attribution |
|---|---|---|---|
| `signed_in` | Privy session (Google or wallet) | none | `Proposed-by: <display name>` |
| `anonymous` | no session at all | Turnstile | `Proposed-by: <display name>` |

> **Scope decision (owner).** No GitHub login in v1. It was going to buy contribution-graph credit
> via a `Co-authored-by` trailer, at the cost of a `loginMethods` change, a linked-account read and
> a verified-identity path through the whole pipeline. Dropped until the editor itself is proven.
> Nothing here forecloses it: adding a third door later only adds a trailer branch (§2.2).

**Equal means:** same branch, same CI, same PR state, same review queue. The doors differ only in
the attribution trailer and the gate. In particular the anonymous door does **not** get a draft PR
— a draft is excluded from the default review queue and would quietly reintroduce the moderation
queue the owner rejected. The distinction is carried by labels (`community-proposal`, plus
`unverified-author` on the anonymous door).

> **Reversed after review.** The first draft had two doors and opened anonymous PRs as drafts.
> The site's live login is `loginMethods: ['google', 'wallet']`
> (`apps/web/src/components/providers/privy-provider.tsx:74`), so *every existing learner* is a
> signed-in user with no GitHub link — the most common case had no design at all.

### 1.1 Publication is automatic, with one gap

Lesson prose is baked into the build: `apps/web/vite.config.ts` emits every `content/**/*.md` into
`dist/client/_content/` at `vite build`, and `lib/content/lesson-body.ts:24` reads it back through
the ASSETS binding. `content-sync.yml` only writes DB rows; it never rebuilds the site.

There is no web deploy *workflow* in `.github/workflows/`, which initially read as a gap. It is
not: **the web app is built and deployed by the Cloudflare Git integration**, confirmed by the
owner and corroborated by the comment at `apps/web/wrangler.jsonc:3-4` ("Cloudflare build installs
only this workspace's tree via `yarn workspaces focus`"). A merge to `main` rebuilds and publishes
on its own. (`docs/self-hosting.md:195` still says otherwise and is stale — worth a one-line fix.)

**The gap is narrower and only affects new lessons.** `content-sync.yml:66` commits the assigned
ids back with `chore: assign content ids [skip ci]`, and Cloudflare Workers Builds honours
`[skip ci]`. So the build that publishes a brand-new lesson runs on the *merge* commit, before its
`id` exists, and `build-manifest.ts:68-72` gives it a **negative synthetic id** — which is not the
id the DB row got. Until the next unrelated deploy, that lesson's progress and test submission
point at an id that does not exist.

The fix is to drop `[skip ci]` from that commit message. It is redundant for its stated purpose:
the workflow's own header comment records that a `GITHUB_TOKEN` push does not re-trigger workflows
by design, so the loop it guards against cannot happen. Milestone 4 (new lessons) depends on this.

## 2. Decisions, and why

### 2.1 Editor surface: CodeMirror 6 with live-preview decorations, not a WYSIWYG

The ask was "something like Notion". We measured instead of guessing — a round-trip
(`remark-parse` → `remark-stringify`) over `content/`:

| Configuration | Byte-identical |
|---|---|
| Tuned remark options (`bullet:'-'`, `fences:true`, `listItemIndent:'one'`, `setext:false`, `tablePipeAlign:false`) | 86 / 199 |
| Same, plus opaque masking of `<svg>` and HTML comments, plus escaping disabled | 191 / 199 |

Corpus facts, re-verified: 199 `.md` files, **94 contain raw `<svg>`**, 11 contain a `<!-- q -->`
marker, 34 contain an HTML comment, and 19–20 have HTML comments nested *inside* an `<svg>` block.
The middle row of the original table ("0/21 on the files that matter") could not be reproduced
from any stated predicate and has been removed — the two rows above are the defensible ones, and
the qualitative result stands on its own. The measurement script is not reproducible from the repo
either (remark is not a dependency anywhere in the workspace); **commit it under `scripts/` before
relying on it again.**

Three failure classes, all present here:

1. **Escaping rewrites prose.** `mdast-util-to-markdown`'s `unsafe` table turns `~70 SOL` into
   `\~70 SOL`, `init_if_needed` into `init\_if\_needed`, `[$2,000, $3,000]` into `\[$2,000, …`,
   `Q&As` into `Q\&As`. This repo is Rust/Solidity/Solana prose; it hits every one.
2. **A blank line inside a raw HTML block splits it.** CommonMark ends an HTML block at the first
   blank line, so a multi-line `<svg>` becomes several `html` nodes, indentation is lost, and in
   the measurement one `<path d="…"/>` was re-emitted as `\<path d=…` — the diagram silently became
   escaped literal text. Multi-line indented SVG is normal here
   (`content/development-on-solana/working-with-other-programs/pdas-as-signers.md:46-60`), and
   HTML comments live inside SVG as layout notes
   (`content/development-on-solana/production-state-design/solana-nfts.md:52,66,84,97`).
3. **GFM tables reformat wholesale** (`tableCellPadding` and `tablePipeAlign` default to true), so
   a one-character edit rewrites every row.

Prior art says this is not solvable once. GitLab's Content Editor hit it on Tiptap and shipped a
feature-flagged `preserve_unchanged_markdown` that re-serialises only changed subtrees. Decap CMS
closed its equivalent (#4537) as *not planned*. BlockNote names its own API
`blocksToMarkdownLossy()`. Every WYSIWYG candidate had a concrete blocker: `@platejs/markdown`
does not process raw HTML and its `remark-mdx` dependency parses `<!-- q -->` as invalid JSX;
`@lexical/markdown` has no table, raw-HTML, HTML-comment or frontmatter transformers;
`@remirror/react` peer-declares React ≤18 and we are on 19.2; `@tiptap/markdown`'s open issues are
our exact failure mode (#7147, #7539, #7731) and its frontmatter discussion (#7155) has no
maintainer reply.

**With CodeMirror 6 there is no AST, no serialiser and no escaping policy.** The submitted file is
the buffer the contributor typed, byte for byte. Byte-stability stops being a mitigation we
maintain and becomes a property of the design.

The Notion feel is then three cheap pieces, following Obsidian's live-preview model:

- **Live-preview decorations** — headings at heading size; `#`, `**`, `_`, `[]()` hidden on every
  line the cursor is not on, reappearing when you enter the line.
- **A `/` slash menu** via `@codemirror/autocomplete`, triggered only at start-of-line or after
  whitespace, never inside a fence, dismissed by a space with an empty query, every item carrying
  a `keywords` synonym string (Outline's rule).
- **Atomic widgets** — `<svg>…</svg>` collapses to its rendered thumbnail with an "edit source"
  toggle; a `<!-- q -->` block collapses to a question card. The underlying text is untouched.

Deliberately **not** built: drag handles. Decorative on touch, fail WCAG 2.2 SC 2.5.7 alone, and
`Alt+↑/↓` line moves are what a source-of-truth model wants.

Frontmatter is not hand-edited in the buffer: a collapsed widget backed by a small form, written
through the `yaml` package's Document API so key order, comments and folded multi-line `faq:`
blocks survive (`content/blockchain-basics/cryptography/hashing.md` has wrapped `faq:` blocks a
naive `dump()` would reflow).

### 2.2 Attribution: a `Proposed-by:` trailer, no forks, no user tokens

All three doors write the same way: our GitHub App pushes a branch **in this repository** (not a
fork) and opens the PR. Only the trailer differs.

Both doors get `Proposed-by: <display name>`, single-line and sanitised (§3.5). No email is ever
written into git. CC BY-SA 4.0 §3(a)(1) permits attribution by pseudonym, so a handle is
licence-compliant and publishes no personal data into a history we cannot rewrite.

The bot stays the git `author` and `committer`, which keeps commits GitHub-signed — a custom author
turns a signed bot commit into `verified: false, reason: "unsigned"`.

Two hard rules that outlive the scope cut, because a future GitHub door would reintroduce both:

- **Never put a submitted email in a `Co-authored-by` trailer.** An unverified address resolves to
  whoever owns it on GitHub; there is a documented incident where a placeholder co-author email was
  registered by a real user and unrelated commits were credited to them.
- **Never accept a caller-supplied author** — including *indirectly*. A `display_name` containing
  `"x\n\nCo-authored-by: victim@example.com"` injects a trailer the commit was never meant to
  carry, which is why §3.5 rejects newlines in that field rather than trusting prose.

**Session source: Privy, and only Privy.** `apps/backend/src/lib/middleware.ts:21-37` verifies
Privy bearer tokens on every `/api/*` business route; the `signed_in` door is simply a request that
carries one. No `loginMethods` change is needed now that the GitHub door is out of scope.

A caution for whoever touches auth next: **better-auth is mounted but unused as a login path.**
Nobody signs in through it, but its routes are live (`apps/backend/src/index.ts:72` mounts
`services/auth/auth.routes.ts`, serving `auth.handler` on `['POST','GET','OPTIONS'] /api/auth/*`),
and the `user` table it generated (`db/auth-schema.ts`, a plain Drizzle table with no import from
`lib/auth.ts`) **is** the identity table `requireAuth` / `requireAdmin` / `requireNotBanned` and
`lib/ensure-app-user.ts` read and write. Retiring it is a separate cleanup with its own blast
radius; nothing in this design authorises it. The browser client `apps/web/src/lib/auth-client.ts`
has no importers at all.

> **Reversed after review.** The first draft told the next engineer to "confirm `lib/auth.ts` is
> dead" — following that would have taken down `/api/auth/*`.

### 2.3 Branch in this repository, not a fork

The usual objection is that an untrusted branch in your own repo runs `pull_request` workflows with
your secrets. **Checked:** the only content-path PR workflow is `content-verify.yml`, which
declares `permissions: contents: read` (`:24-25`) and uses no secrets; `claude.yml` is gated on
`author_association ∈ {OWNER, MEMBER, COLLABORATOR}` plus an explicit `@claude` mention (`:21-25`).
`content-verify.yml` also triggers on `push` to any non-`main` branch (`:9-16`), so **every
proposal branch is validated automatically** — and a GitHub App installation token *does* trigger
workflows, unlike the default `GITHUB_TOKEN`. Avoiding forks also avoids the asynchronous fork
endpoint and stale-fork handling.

Two standing invariants this design creates, both of which must be written into the workflow files
as comments:

1. **No `pull_request`-triggered workflow may carry secrets.** (Already true; keep it true.)
2. **No privileged workflow may read a `community-proposal` diff or body.** `claude.yml`'s gate is
   on who *triggers* the run, not on whose text it *reads*. The moment a maintainer types
   `@claude review this` on a stranger's PR — the single most likely thing a maintainer will do —
   the job starts with `contents: write`, `pull-requests: write`, `issues: write`, `id-token:
   write` and `ANTHROPIC_API_KEY` (`claude.yml:27-32,43`) and ingests attacker-controlled prose as
   instructions. Add a label exclusion to the `if:` conditions
   (`!contains(github.event.issue.labels.*.name, 'community-proposal')`, and the
   `pull_request.labels` equivalent), with the reason in a comment. This makes applying the label a
   **hard failure** in the submit path, not best-effort.

### 2.4 The write runs on the Hono backend, not the Cloudflare Worker

| | Worker route in `apps/web` | Hono backend |
|---|---|---|
| GitHub plumbing | none | `@octokit/rest` 22.0.1, `throwGitHubApiError`, `parseGitHubRepoUrl` (`services/review/utils/github.ts:23,46`) |
| Durable state | none — the Workers rate-limit binding is per-colo and documented as *not* an accounting system | Postgres + Drizzle, two precedents in `services/rate-limit/` |
| Secret custody | Worker secrets; PKCS#1→PKCS#8 for `crypto.subtle`; installation token must live in KV because each request may be a fresh isolate | long-lived dyno already holding `GITHUB_TOKEN`, `OPENAI_API_KEY`, `R2_*` |
| Auth | no session on `apps/web` server routes | `requireAuth` / `requireNotBanned` / `getClientIp` in `lib/middleware.ts` |

`createServerFn` appears nowhere in this repo outside `dist/`, so the Worker path would also be a
new pattern. Decision: **the backend.**

### 2.5 CI is the validator; the backend checks only what CI cannot catch in time

> **Reversed after review.** The first draft proposed extracting `packages/content-schema` — every
> validator rule, the question grammar and the course-index generator — as a shared workspace
> package, and gave it a whole blocking milestone. Two reviewers independently called it the
> largest cost in the design for almost no product gain, and they are right: `content-verify.yml`
> already runs the *real* validator on every proposal-branch push, within a minute.

v1 therefore has **no shared package**. Instead:

- **`apps/backend/src/services/proposals/content-rules.ts`** (~150 lines) enforces exactly the five
  rules whose failure is destructive or invisible, all of which must be caught *before* the write:
  1. the three legal path shapes and the slug regex (§4);
  2. no `README.md` inside a module directory (§4);
  3. frontmatter parses as a YAML map starting at byte 0;
  4. an existing `id:` line is byte-identical, and a new file declares no `id:`;
  5. no `<!-- q -->`-shaped line in a non-`test` lesson, and every existing `<!-- q:ID -->` /
     `<!-- a:ID -->` trailer is preserved (§2.6).
- **CI on the proposal branch is the authority for everything else** — allowed keys, numeric
  `order`, `<svg>` balance, the full question grammar, corpus-wide id uniqueness. It fails *safe*:
  if `content-rules.ts` and the real validator ever disagree, CI goes red and nobody merges.
> **Changed in implementation.** This branch workflow was built and then removed. It had to push a
> second bot commit, and a `GITHUB_TOKEN` push creates no workflow run — so the pull request's head
> ended up with *no checks at all*, which also makes it unmergeable once `content-verify` becomes a
> required check. Outline regeneration moved into `content-sync.yml`, which already writes assigned
> ids back to `main` after a merge, and `content-verify.yml` now skips only the outline check for
> proposal branches and labelled pull requests. One mechanism instead of two, and no commit without
> a check run.

- ~~**A new workflow `proposal-index.yml`**~~ regenerates `content/<course>/README.md` on the branch
  instead of the backend doing it. `on: push: branches: ['proposal/**'], paths: ['content/**']`,
  one job that runs `yarn content:index`, commits the regenerated outlines back, then runs
  `validate-content.mjs` and `generate-course-index.mjs --check` **in the same job**, so the run
  that pushes is also the run that proves green (a `GITHUB_TOKEN` push does not re-trigger
  workflows). This is the pattern `content-sync.yml:55-66` already uses for ids.

  Trade-off to record in the workflow header: the job needs `contents: write`, which relaxes §2.3's
  "no content-path workflow has write permission". It is acceptable because the job runs no
  contributor-supplied code (`yaml.parse` does not execute), and the backend only ever writes tree
  entries under `content/**` (§3.5), so the lockfile and scripts are not contributor-reachable.

This deletes the shared package, the GraphQL bulk-blob fetch, the tree-SHA cache and a whole
milestone. **What makes it safe is §2.7.**

### 2.6 IDs stay with CI — answering "can the editor assign them?"

**No, and it would not simplify anything.** `scripts/sync-content-db.ts` mints ids from the
reserved band `[1_000_000_000, 2_000_000_000)` (`:47-48`, `newId` at `:62-69`, `scanUsedIds` at
`:90-99`, `idFor` at `:114-120`) after merge, and `content-sync.yml:55-74` commits them back before
any DB write. The editor's job is the opposite:

- **Omit `id` entirely on new files.** CI assigns it.
- **Preserve every existing `id:` byte for byte.** A client-invented id that collides with a live
  row makes `sync-content-db.ts:241-243` classify the file as *not new*, so **no row is inserted**
  and the file silently points at someone else's lesson. If the hijacked row is a `type: test`
  lesson, `sync-tests.mjs:239-244,297-306` then deletes that lesson's real questions and prunes
  every learner's stored answers in the same transaction. Unrecoverable without a DB restore.
  Note the narrowing: `validate-content.mjs:112-119` only detects collisions against ids declared
  in other `content/` files, so a collision with a **CMS-authored row** below the reserved band
  validates clean. CI cannot catch that case — which is why rule 4 in §2.5 is a submit-time check.

**The same rule applies to question and option ids, and the first draft got this wrong.**
`scripts/lib/tests-md.mjs:11` defines `OPTION_ID_RE = /\s*<!--\s*a:\s*([^\s>]+)\s*-->\s*$/`: every
live option line ends in a trailing `<!-- a:ID -->` comment, and question ids ride in
`<!-- q:ID -->`. Verified in the corpus, e.g.
`content/development-on-solana/working-with-other-programs/solana-basics-test.md:11-13`. Dropping,
reordering or regenerating those trailers reaches the same destructive prune. The atomic
question-card widget (§2.1) re-emits option lines *by definition*, so:

> **Rule.** The submit endpoint parses base and submitted bodies with the question grammar and
> rejects any submission where the multiset of question ids or option ids in the base file is not a
> subset of the submission's. This is milestone-5 acceptance, not a later nicety.

### 2.7 `main` gets a required status check

`content-sync.yml:15` records "`main` is NOT a protected branch" as a hard requirement, because
`GITHUB_TOKEN` cannot push to a protected branch. That premise is what makes §2.5 safe *only if
nobody merges red* — an advisory control on the one path whose failure §2.6 calls unrecoverable.

Replace it with a **repository ruleset** on `main` requiring `content-verify` as a status check,
with `github-actions[bot]` as a **bypass actor** so the id write-back still pushes, and with the
proposals App explicitly *not* a bypass actor. This is a change to a documented premise and needs
its own line in the milestone plan and an updated comment in `content-sync.yml`.

Defence in depth in the destructive script itself: make `sync-tests.mjs` abort and require an
explicit `--force` when one run would delete more than N questions or touch more than M
`user_lessons` rows. It already computes the delete plan before the transaction, so this is a few
lines at that point.

## 3. Architecture

```
lesson page ──"Improve this lesson"──▶ /edit/:course/:module/:lesson  (apps/web, ssr:false)
                                            │
                   buffer loaded from the SAME static asset the lesson page uses
                            (/_content/<c>/<m>/<l>.md, vite.config contentAssets)
                                            │
                              client-side content-rules check, continuous
                                            │
        POST /api/proposals { course, module, lesson, content, baseHash, … }
                                            ▼
                            ┌───────────────────────────────────┐
                            │ apps/backend — proposals.service   │
                            │  1 rate limit (Postgres)           │
                            │  2 content-rules.ts                │
                            │  3 base check vs main HEAD → 409   │
                            │  4 Turnstile (anonymous door only) │
                            │  5 tree-path allowlist assertion   │
                            │  6 blobs→tree→commit→ref→PR (App)  │
                            └───────────────┬───────────────────┘
                                            ▼
                       proposal/<c>/<m>/<l>/<8hex>  →  PR (labelled)
                                            │
                    content-verify.yml + proposal-index.yml run on the push
```

### 3.1 Loading the file: no `GET /source` endpoint

> **Reversed after review.** The first draft added `GET /api/proposals/source` so the editor could
> read the file and its blob SHA from GitHub. That is an unauthenticated GitHub proxy spending the
> App's 5,000/hr primary limit on every editor page-open, and — as specified — an unauthenticated
> read of *any* repo path at any ref.

The editor loads the same CDN asset the lesson page already loads
(`contentAssetPath()` in `apps/web/src/lib/content/paths.ts`, emitted by `vite.config.ts`,
fetched today by `lib/content/lesson-body.ts:21-24` with frontmatter intact). Zero new endpoints,
zero new tokens, zero new abuse surface.

Staleness is handled where it matters — at submit:

> **Base check.** The client sends `baseHash`, the SHA-256 of the buffer it loaded. The server
> re-reads the file at `main` HEAD, hashes it, and aborts with
> `AppError(409, 'This lesson changed while you were editing', { theirs })` if they differ, before
> any write. On success the commit's parent and `base_tree` are `main` HEAD, so there is no
> possibility of silently reverting someone else's merged change.

This replaces the first draft's blob-SHA plumbing and the "`POST git/refs` fails if the branch
exists" conflict story, which could never fire — every proposal gets a fresh random branch suffix.

### 3.2 Editor (`apps/web`)

Route `apps/web/src/routes/edit.$courseSlug.$moduleSlug.$lessonSlug.tsx`, matching the flat dotted
convention of `routes/courses/$courseSlug.$moduleSlug.$lessonSlug.tsx`; new lessons at
`edit.$courseSlug.$moduleSlug.new.tsx`. Declared `ssr: false`, CodeMirror lazy-imported:
`@codemirror/lang-markdown` transitively pulls `lang-html` → `lang-javascript`/`lang-css`
(~171 KB gzipped), and this app already ships Monaco plus per-grammar Shiki imports specifically to
stay under the Worker size limit.

```
apps/web/src/components/editor/
  lesson-editor.tsx           # layout, submit bar, draft restore
  markdown-editor.tsx         # CodeMirror 6 host
  frontmatter-form.tsx        # title / type / order / isHidden / faq
  submit-dialog.tsx           # door choice, display name, rationale, licence, Turnstile
  preview-pane.tsx
  toolbar.tsx                 # bold / italic / link / heading / list / code
  extensions/live-preview.ts
  extensions/slash-menu.ts
  extensions/svg-widget.ts
  extensions/question-card.ts
apps/web/src/lib/editor/
  draft-store.ts              # IndexedDB, flushed on visibilitychange
  frontmatter-patch.ts        # yaml Document API
  content-rules.ts            # same five checks as the server, run continuously
```

Per `CLAUDE.md`: props/types stay in their component files, no barrel `index.ts`, comments explain
why. `content-rules.ts` is duplicated deliberately in v1 (client copy for instant feedback, server
copy as the authority) — extract a shared package only if the two actually drift.

**The preview must run the whole site pipeline, not just the renderer.** That is
`stripFrontmatter` → `stripTestQuestions` (`lib/content/lesson-body.ts:24`) → `MarkdownContent`
(with `markdown-sanitize.ts` and `embeds.tsx`). Naming only `MarkdownContent`, as the first draft
did, would render a test lesson's `<!-- q -->` block as GFM task-list prose — content the live site
never shows, because the lesson route renders `MarkdownContent` for the intro only
(`routes/courses/$courseSlug.$moduleSlug.$lessonSlug.tsx:156-157`) and the questions come from the
**database** via `LessonsService`. Milestone 5 therefore renders the parsed questions from the
buffer with the site's question component, plus a note that questions do not appear on the site
until `content-sync.yml` runs post-merge.

Drafts go to **IndexedDB**, not localStorage (synchronous, blocks the main thread), flushed on
`visibilitychange`. `beforeunload` is not a save guard: it needs sticky activation, does not
reliably fire on mobile, and in Firefox disqualifies the page from bfcache.

**Mobile is read-only in v1.** Android `contenteditable` needs platform-level Chrome fixes,
`contenteditable=false` atoms are undeletable and dismiss the keyboard, and Notion itself removed
slash commands on mobile.

### 3.3 Interaction design

The first draft specified the editor and forgot the contributor. Required for milestone 2:

- **Entry point** — a persistent "Improve this lesson" button in the lesson header (there is no
  edit affordance anywhere on the lesson page today), repeated at the end of the article, visible
  to logged-out visitors.
- **Formatting affordances** — a `Cmd+B` / `Cmd+I` / `Cmd+K` keymap *and* a small always-visible
  toolbar. GitBook, HackMD and Medium all keep a toolbar as the discoverable fallback for people
  who will never learn a slash menu.
- **Paste** — convert `text/html` to Markdown (pasting from Google Docs into a raw CodeMirror
  buffer yields `text/plain` and loses every heading, list and link), and wrap a pasted URL around
  the selection as `[selection](url)`. This does not violate §2.1: it only touches newly inserted
  text.
- **New lesson** — buffer seeded from `content/TEMPLATE.md` with its instruction comments stripped;
  slug derived from the title, editable, validated against the slug regex **and against every
  lesson slug in the whole course** (§4).
- **Draft restore** — "restore your unsaved draft?" on reopening a lesson with a stored draft.
- **Error recovery** — an explicit table, buffer never discarded. *Changed in implementation:* the
  409 path offers **"Load their version"**, not "keep mine". Advancing `baseHash` while leaving the
  buffer on the old base let the next submit pass the server's check and produce a pull request that
  silently reverted whatever had merged — the exact failure the base check exists to prevent,
  reproduced in a real repository. Buffer, baseline and hash now move together, and the
  contributor's own text is returned beside the editor to re-apply deliberately. Original wording:
  `409` base moved → keep-mine /
  view-theirs; `429` → show `retryAfterMs` from `AppError.extra`; Turnstile failure → re-challenge
  in place; network drop → retry with the same idempotency key.
- **After submit** — the PR link, a copy button, and plain wording about what happens next
  (review, then a rebuild before it is live — §1.1).

### 3.4 Backend API

New namespace `/api/proposals`, following the existing convention: contracts in
`packages/api-contracts/src/proposals/` → `describeRoute` in `apps/backend/src/descriptions/` →
routes → service → `apps/web/src/lib/api/proposals.ts` via `api()` → a TanStack hook.

**One endpoint in v1: `POST /api/proposals`.** It returns `{ prUrl, prNumber, branch }`.

> **Reversed after review.** `GET /source` is gone (§3.1) and `PATCH /:id` with an `editToken` is
> deferred (§3.7) — the first draft paid for the resume feature in the v1 contract (endpoint,
> response shape, migration column, `?ref=` search param) while scheduling the feature last.

Errors are `AppError(status, message, extra?)`; `extra` is how `retryAfterMs` reaches the client
(`apps/backend/src/index.ts:36` → `apps/web/src/lib/api/errors.ts:46-49`).

**The door is derived from a successfully verified Privy bearer and from nothing else.** A body
field claiming `door: "signed_in"` without a bearer is a 401. No bearer ⇒ Turnstile is mandatory.

### 3.5 Submit pipeline

Order matters, and it changed after review: **rate limit → validate → base check → Turnstile →
write.** Turnstile tokens are single-use with a 300-second TTL, so verifying *before* validation
burns a solved challenge on every fixable mistake and can rate-limit a contributor out of their own
typo fix.

1. **Reserve a quota slot** (Postgres). *Changed in implementation:* this is a **write**, not a
   read. The read-then-record ordering below was exploitable — the counting row was written only
   after seven GitHub round-trips, so a burst fired inside that window had every request read a
   count of zero and open a pull request; measured at 50 admitted against a limit of 5. The row is
   now inserted before any GitHub call, inside a transaction holding an advisory lock, and deleted
   again if the submission never reaches a pull request. A conditional `INSERT` alone was not
   enough: under `READ COMMITTED` each statement counts against its own snapshot, which still
   admitted 6 of 50. With the lock it is exactly 5, verified against Postgres. Three buckets:
   - anonymous: `HMAC-SHA256(ip_prefix, PROPOSALS_IP_PEPPER)` where the prefix is the IPv4 /32 or
     the IPv6 **/64** — hashing a full /128 hands one attacker 2^64 free buckets, and a bare
     SHA-256 of an IPv4 address is trivially reversed, so a peppered HMAC is the minimum.
   - signed-in: keyed on the Privy user id, a much higher limit, **no IP bucket**, so a school or
     office NAT cannot lock out identified contributors.
   - per-target: at most N open proposals per lesson path, so one lesson cannot be swarmed.
   - **plus a per-IP limiter on the route itself.** A reservation released after a failed validation
     stops counting, so without this a caller who never succeeds is never throttled while still
     spending two GitHub calls per attempt.
   - **plus a simple global repo-wide budget** (e.g. 60 creations/hour) checked before any GitHub
     call, returning 429 with `retryAfterMs`. 500 content-generating requests/hour ÷ ~4 per
     proposal ≈ 125/hour before the App is locked out for *everyone*, so the cap exists to stop one
     burst starving every other contributor — not to squeeze the quota. The owner accepts GitHub's
     limits as they are at current traffic; no circuit breaker, no retry queue.

   **The IP source is `getClientIp` as it stands.** It returns the right-most XFF entry
   (`lib/middleware.ts:74-84`), which is correct for exactly one trusted proxy, and the backend
   runs directly on Heroku with no CDN in front — confirmed by the owner. Record that as a
   dependency: **if a proxy is ever put in front of the API, every anonymous quota collapses into
   one bucket** (the right-most value becomes a constant edge IP), so revisit this before doing so.
   Note `lib/rate-limit.ts:37` already falls back to `cf-connecting-ip`, which is where the
   first draft's doubt came from. Separately: `lib/rate-limit.ts:35-36`'s `defaultKey` reads the *first* XFF entry
   and is client-spoofable — this is `RELIABILITY-AUDIT.md:172-180` finding **M8**, and it should be
   fixed to reuse `getClientIp` with or before this work. (Finding **H6**, shared NAT collapsing a
   cohort onto one bucket, is the separate risk the per-target and per-user buckets above address.)

2. **Validate** with `content-rules.ts` (§2.5). The client runs the identical checks continuously
   and disables the submit button with inline, line-anchored errors until they pass; the server
   re-runs them as the authority.

3. **Field sanitisation — enforced, not merely stated.** `display_name` and `rationale` are
   untrusted free text from an unauthenticated caller:
   - `display_name`: match `/^[\p{L}\p{N} ._-]{1,64}$/u`; **reject** (do not strip) anything with
     `\r`, `\n`, `<`, `>`, `@` or `#`, so the contributor sees the problem. Only then may it enter
     the `Proposed-by:` trailer.
   - `rationale`: required, capped at 2,000 characters, **never** placed in a commit message.
   - Both go into the PR body inside a fenced block whose fence is a backtick run one longer than
     the longest run in the input. GitHub does not linkify mentions, cross-references or closing
     keywords inside a code fence — without this, `@org/team` pings a whole team from our bot,
     `owner/repo#1` turns the bot into a cross-repo spam relay, and `Closes #42` **auto-closes a
     real issue on merge**. Prefix the body with a plain-text banner marking the content as
     unreviewed.
   - `content` is capped at 256 KB in the contract (the global cap is 5 MB at `index.ts:62-68`, and
     every blob on a proposal branch is a permanent git object reachable via `refs/pull/N/head`
     even after the branch is deleted).

4. **Base check** (§3.1) → 409 before any write. Also reject content identical to the published
   lesson: normalisation can erase a difference the editor still counted as an edit, and the result
   was a pull request with one commit, no changed files and no CI — nothing under `content/` moved,
   so both workflows' path filters skipped it.

5. **Turnstile** (anonymous door only) — one `fetch` to `siteverify` with `remoteip` from the
   established client IP. Assert `result.hostname` matches the expected host **and**
   `result.action === 'submit-proposal'`, otherwise a token minted with our public sitekey on any
   other host that sitekey permits is accepted in production. On `internal-error`, retry
   server-side with the same token (2 attempts, 250 ms apart) — Cloudflare does not consume the
   token on that outcome; never bounce the client back to resubmit with a used token, which would
   fail as `timeout-or-duplicate`. `timeout-or-duplicate` is a hard reject (replay).

   **`TURNSTILE_SECRET_KEY` must fail closed.** It is a security control, not a feature flag: if it
   is unset, the anonymous branch throws `AppError(503, 'Proposals are temporarily unavailable')`.
   It must never be `if (!secret) return`.

6. **Tree-path allowlist — the last line of defence.** The request carries `{ course, module,
   lesson }` slugs, **never a path**; the server constructs `content/${course}/${module}/${lesson}.md`
   itself. Immediately before `POST git/trees`, assert independently that every tree entry's `path`
   matches
   `/^content\/[a-z0-9-]+\/(?:_course\.md|[a-z0-9-]+\/(?:_module\.md|[a-z0-9-]+\.md)|README\.md)$/`,
   contains no `..`, backslash, leading `/` or NUL, and that the array holds at most two entries.
   Assert `ref.startsWith('refs/heads/proposal/')` before every `POST`/`PATCH git/refs`.

   This is not belt-and-braces. `validate-content.mjs` never checks the `content/` prefix, because
   it was never asked to: `:74` calls `classify(relative(CONTENT, file))` and `classify` at `:59-68`
   only counts path segments and inspects the basename. Reusing it on a caller-supplied string
   accepts `foo/bar/baz.md` and `apps/backend/src.md` as valid lessons. And a `git/trees` entry
   `path` is a literal repo-root-relative string, so anything the endpoint can be tricked into
   putting in the tree is written — including `scripts/validate-content.mjs` or `.yarnrc.yml`
   (whose plugin entries survive `yarn install --immutable`), both of which `content-verify.yml`
   then executes in a runner. `.github/workflows/**` is separately backstopped by GitHub refusing an
   App without `workflows:` scope, but that is GitHub's control, not ours.

7. **Write** via the Git Data API: `POST git/blobs` per file → `POST git/trees` **with
   `base_tree`** → `POST git/commits` → `POST git/refs`. Omitting `base_tree` produces a PR that
   deletes the entire repository. `PUT /contents/{path}` is not usable: one commit per file, with
   self-conflicting concurrency.

8. **Open the PR** ready-for-review on every door, labelled `community-proposal` (plus
   `unverified-author` on the anonymous door). Applying the label is a hard requirement — §2.3's
   `claude.yml` exclusion depends on it. The body carries the fenced rationale, the attribution
   line, the licence-acceptance record, and a **token-free** link to the editor for that lesson.

9. **Persist** the proposal row and return `{ prUrl, prNumber, branch }`.

### 3.6 Data model

> **Reversed after review.** The first draft's fifteen-column table duplicated into Postgres what
> the commit trailer and PR body already record durably and publicly, including free-text
> `rationale` and `display_name` — a privacy cost with no described reader, and against the
> codebase's own precedent (`coding-task-rate-limit.service.ts:47-73` derives quotas from the
> domain table's timestamps rather than a denormalised copy).

`content_proposals`, created via `yarn backend:db:generate` / `backend:db:migrate`:

| Column | Notes |
|---|---|
| `id` | ULID, not a serial — proposals must not be enumerable |
| `path` | the constructed content path |
| `branch` | `proposal/<course>/<module>/<lesson>/<8hex>` |
| `pr_number` | Null between reserving the slot and the pull request existing |
| `door` | `anonymous` \| `signed_in` |
| `ip_hash` | peppered HMAC of the IP prefix; anonymous door only; document a retention period |
| `privy_user_id` | nullable |
| `licence_version`, `licence_accepted_at` | clickwrap record we control, independent of GitHub |
| `created_at` | |

Everything else about a proposal lives in the commit trailer and the PR body, which are the durable
record. This row is a quota counter and a pointer. Drizzle migrations are additive, so later
milestones add their own columns.

### 3.7 Continuing an open proposal

**The Cloudflare per-PR preview the owner had in mind does not exist.** Verified: `apps/web` is a
single Cloudflare **Worker** (`apps/web/wrangler.jsonc` — `main: @tanstack/react-start/server-entry`,
an `assets` binding, no `preview_urls`, no `env.*` sections), deployed manually
(`apps/web/package.json:11`), with no workflow (§1.1). There are no Pages projects and no per-PR
previews. Building them is not a small addition either: lesson prose is baked in at build time, so a
preview of a proposal branch is a **full web rebuild per PR**, and a preview workflow needs
`CLOUDFLARE_API_TOKEN` — which collides head-on with §2.3's safety argument while anonymous
strangers push branches into this repo.

**v1 therefore does close-and-reopen**, which the owner explicitly authorised: submitting again for
the same lesson opens a new PR; the maintainer closes the old one. The PR body links to the editor
for that lesson, so "please tweak X" is one click from a fresh edit.

**A later milestone adds true resume**, and it needs two things the first draft missed:

1. **A notification channel.** §2.2 keeps email out of git — but that is a rule about
   `Co-authored-by`, not about contact data. Resume without a way to learn that changes were
   requested is a feature with no trigger. Add an *optional* email on the proposal row, used only
   for a review-requested notification, never written into git.
2. **A token that is not a URL parameter.** 32 bytes from `crypto.randomBytes`, base64url, stored
   as SHA-256, compared with `timingSafeEqual`, carried in the URL **fragment** (`#t=…`, never sent
   to a server, never in `Referer`) and moved into `sessionStorage` with `history.replaceState` on
   load. `edit_token_expires_at` (90 days, or when the PR closes). `PATCH` gets its own limiter,
   runs the identical §3.5 pipeline from step 1 onward except Turnstile, returns 409 once the PR is
   not `open`, and is **rejected once the PR carries an approving review** — otherwise it is a
   classic approve-then-swap primitive, and because `main` is unprotected today the usual
   `dismiss_stale_reviews` mitigation is not even available. Every post-review push must also
   trigger a visible bot comment.

If per-PR previews are ever wanted, §2.3 constrains their shape: `pull_request_target` and
`workflow_run` are forbidden; use a `push`-triggered job on `proposal/**` running
`wrangler versions upload` with a token scoped to Workers Scripts: Edit and no other secret.

### 3.8 GitHub App

A dedicated App, `redduck-academy-proposals[bot]`, installed on this repository only, with
`contents: write` and `pull_requests: write`.

**Do not reuse `GITHUB_TOKEN`** (`apps/backend/src/env.ts:8`) — a single shared PAT consumed by
`services/review/github.service.ts:23,190` to grade student projects. A proposal burst on it would
take down grading.

GitHub Apps cannot scope `contents: write` by path or branch, so the App *can* push to `main`. The
only things between an anonymous HTTP request and the default branch are §3.5 step 6's ref
assertion and §2.7's ruleset (which does not list the App as a bypass actor). Both are required;
neither is optional.

New env vars: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID`,
`TURNSTILE_SECRET_KEY`, `PROPOSALS_IP_PEPPER`, and `PROPOSALS_ENABLED`
(defaults to off). Declare them `.optional()` in `env.ts` and validate at the use site — `env.ts:43`
parses `process.env` eagerly at import, so a new *required* var not set on Heroku before the deploy
crash-loops every dyno. Follow the `ANTHROPIC_API_KEY` precedent (`env.ts:32-33`) for the App vars,
but **not** for `TURNSTILE_SECRET_KEY`, whose use site fails closed (§3.5 step 5).

## 4. Hard constraints

Enforcing file in parentheses. **Submit-time** rules are checked by `content-rules.ts` before any
write; **CI-time** rules are enforced by `content-verify.yml` on the proposal branch (§2.5). The
first draft claimed the endpoint checked all of them; three are whole-tree checks it provably
cannot perform.

**Path and naming — submit-time**

- Exactly three legal shapes: `content/<course>/_course.md`,
  `content/<course>/<module>/_module.md`, `content/<course>/<module>/<lesson>.md`
  (`validate-content.mjs:59-68,76-82`) — *plus* the `content/` prefix, which that code does not
  check (§3.5 step 6).
- Every slug segment matches `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` (`:20,84-86`).
- **Never create a `README.md` inside a module directory.** The validator skips `README.md` by
  basename at any depth (`:18,38`), but `sync-content-db.ts:161` and `build-manifest.ts:101` filter
  only on `!startsWith('_')`. It would validate clean, render on the site as a lesson **titled
  `README`** (`build-manifest.ts:161` falls back to the slug) that joins the module sidebar and the
  `next` chain, and get a DB row with an empty title (`sync-content-db.ts:173`) and a freshly
  minted reserved-band id.
- **A new lesson's slug must not exist anywhere else in the same course**, not merely in its module
  (`validate-content.mjs:143-151`) — the runtime resolves lessons by `(course, slug)` and ignores
  the module segment, so two same-slug lessons shadow each other. Check this live in the editor
  against the already-served `/_content/<course>/_manifest.json`.

**Frontmatter**

- Byte 0 is `---\n`. No BOM, no leading blank line (`validate-content.mjs:45-51`). *Submit-time.*
- Required: non-empty `title`, numeric `order`; `type ∈ {lecture, test, coding_task, review_task}`
  on lessons (`:104-107,126-128`). `isHidden` boolean; `faq` a list of `{question, answer}`
  (`:129-138`). *CI-time.*
- Allowed keys (`:27-31`) are a **warning**, not an error (`:121-123`). The editor warns; it must
  not reject, or it would refuse to save files already on `main`.
- **Key order is preserved as-found.** Nothing in CI checks it — `dump-content.mjs:285-292` is a
  one-way DB→files exporter that validates no incoming PR. Keys the form *adds* are inserted in the
  order `id, title, type, order, isHidden, faq`. Do not add an order check; it would reject
  already-committed files and contradict §2.1's promise to leave frontmatter alone.

> **Reversed after review.** The first draft listed canonical key order and the blank-line rule as
> hard constraints "the submit endpoint rejects on", citing a file that enforces nothing.

**IDs** — §2.6. Never author one; never modify an existing one; preserve `<!-- q:ID -->` and
`<!-- a:ID -->` trailers. *Submit-time.*

> **Changed in implementation.** All three of these checks were first written against the *text*,
> and each had a working bypass. The id rule matched the shape of the line, so `"id": 42`, a flow
> mapping and an explicit-key form all passed while yaml still resolved them to `id`; it compares
> the parsed value now, with the byte comparison kept on top so CI's write-back still matches. The
> question-marker rule used a single-line pattern while the renderer's lets `\s*` span newlines, so
> a marker split across lines passed and still truncated the published lecture; it runs the
> renderer's own regex over the whole body now. Option ids were collected from any line, so an id
> moved onto a question stem counted as present while `sync-tests.mjs` saw it deleted and pruned the
> answers; only real option lines count now.

**Test-question grammar** — *CI-time except where noted*

- `<!-- q -->` or `<!-- q:ID -->` must be the entire trimmed line (`tests-md.mjs:9`).
- Option lines anchor at column 0: `^- \[([ xX])\]\s+(.*)$` (`:12`), optionally followed by
  `<!-- a:ID -->` (`:11`). An indented `  - [x] foo` is **not** silently dropped — `:64-67` catches
  it as `malformed option line`, which `validate-content.mjs:160` turns into a hard CI failure. The
  editor should surface it as a blocking error.
- The genuinely silent losses are option lines swallowed by an unbalanced ``` fence (`:50`) and
  prose placed after the first option (`:69`). Warn on both.
- Per question: non-empty stem, ≥2 options, ≥1 `- [x]`, no empty or duplicate labels
  (case-insensitive), ids unique across all test files (`validate-content.mjs:158-196,229-240`).
- More than one correct answer requires a cue matching
  `/select all|choose all|all that apply|select every|select each/i` (`tests-md.mjs:14`).
- **A `<!-- q -->`-shaped line must never appear in a non-test lesson** — `stripTestQuestions`
  truncates the rendered body at the first match for *every* lesson type
  (`apps/web/src/lib/content/frontmatter.ts:17,26-30`), so one stray marker deletes the rest of the
  lesson from the site. Nothing in CI catches this. ***Submit-time.***
- **One malformed test file fails the entire repo's test sync** — `sync-tests.mjs:37-41,138` exits
  before any DB access.

**Body — CI-time**

- `<svg` and `</svg>` counts must be equal (`validate-content.mjs:154-156`).
- Bodies start at `##`; `title` is the page's only H1 (`content/README.md:133`).
- Raw HTML is bounded by the sanitiser: `markdown-sanitize.ts:28` extends
  `defaultSchema.tagNames` (53 HTML tags) with **22** SVG tags (`:8-12`), and `:35` applies the
  62-entry `SVG_ATTRS` to each. See §7 — **`style` is in that list and it is a live hole.**
- **Never put a complete `<svg>…</svg>` inside a fenced code block** — the newline-collapsing regex
  at `markdown-content.tsx:40` runs over the whole body including fences.
- Embeds are a paragraph whose only child is an `<a>` to `plgrnd.io`, `eth.build` or
  `youtube.com`/`youtu.be` (`embeds.tsx:45-60`).

**Generated files — handled by `proposal-index.yml` (§2.5)**

`content/<course>/README.md` must be regenerated whenever a PR adds, renames, retitles,
**retypes**, reorders, hides or removes a lesson or module, or edits a `_course.md` body.
`generate-course-index.mjs:118-120` renders the lesson `type` into every line, so a `lecture ↔ test`
flip changes the README bytes — a trigger the first draft omitted while putting `type` on the
frontmatter form. `content-verify.yml:44-45` compares by exact string equality.

## 5. Explicitly out of scope

- **Renaming or moving a lesson.** `sync-content-db.ts:8-11,287-303` is insert-only plus
  `isHidden`; it never updates `slug`, `title`, `order`, `type` or a parent. A rename moves the site
  URL with no redirect layer anywhere in `apps/web`, leaves the DB row on the old slug, and
  `LessonsService.getLesson` resolves by slug (`lessons.service.ts:13-30`) — so progress reads,
  completion and test submission all 404 and sidebar ticks vanish. Needs a redirect layer and a
  slug-update path first. The editor hides the filename field on existing lessons.
- **Creating `coding_task` or `review_task` lessons.** Not file-synced at all
  (`sync-content-db.ts:169`), so a new one gets no id and no DB row while still rendering with a
  negative synthetic id (`build-manifest.ts:70-74`). Editing their existing prose is fine.
- **Image and binary uploads.** Diagrams are inline `<svg>`, as they already are.
- **Real-time collaboration.** **Mobile editing** (§3.2). **Per-PR preview deployments** (§3.7).

## 6. Testing

`apps/backend` has **no test runner, no lint and no typecheck in CI** — only deploy-on-merge. Do not
assume CI catches a regression there; this design adds vitest to `apps/backend`.

- **`content-rules.ts`** (both copies) — unit tests per rule. Path fixtures that must all be
  rejected: `.github/workflows/x.yml`, `package.json`, `scripts/validate-content.mjs`,
  `content/a/b/../../../package.json`, `apps/backend/src.md`, `content/a/b/README.md`.
- **Corpus test** — over the **193** content files (all 199 `.md` minus the 5 generated course
  outlines and `TEMPLATE.md`, mirroring `SKIP` at `validate-content.mjs:18`; the READMEs have no
  frontmatter and `TEMPLATE.md` is an illegal path shape, so a literal "all 199" test fails on day
  one and someone would "fix" it by loosening the validator). Every one validates, and the
  frontmatter patch helper applied with **no changes** returns all 193 byte-identical.
  `TEMPLATE.md` gets its own case — comment-preserving round-trip through the yaml Document API,
  since it is the file that proves comments survive.
- **Question-id preservation** — for every `type: test` file, editing a label through the
  question-card widget preserves all `<!-- q:ID -->` and `<!-- a:ID -->` trailers. Milestone-5
  acceptance.
- **`apps/backend` proposal service**, mocked Octokit — happy path asserted against the exact
  request bodies (`base_tree` present, trailer format, ref prefix, label applied, **ready-for-review
  not draft**), plus: every §4 submit-time rule; `main` as a target ref is rejected; a tree entry
  outside `content/**` is rejected; `TURNSTILE_SECRET_KEY` unset ⇒ 503 and nothing written; no
  `cf-turnstile-response` ⇒ 400 and nothing written; `door: "signed_in"` with no bearer ⇒ 401;
  `display_name` containing `\nCo-authored-by: x@y.z` ⇒ rejected and no second trailer; rationale
  containing `@org/team`, `Closes #1`, `owner/repo#1` and a triple-backtick run ⇒ fenced and inert;
  base moved ⇒ 409 before any write; global budget exhausted ⇒ 429 with `retryAfterMs`.
- **`apps/web`** — vitest + testing-library for `frontmatter-patch`, `draft-store`, the slash-menu
  source and the decoration builders. `components/content/markdown-content.test.tsx` already renders
  the whole corpus but **is not run by any workflow** — wire it into CI as part of this work, since
  the editor makes lesson bodies mutable by strangers.
- **CI wiring.** `content-verify.yml`'s trigger `paths` name the scripts by exact filename at
  `:14-15` (push) and `:20-21` (pull_request). Any script rename must change all four entries in the
  same commit or the workflow silently stops firing. Add `apps/web/src/components/content/**` to
  both lists so the corpus test runs when the renderer changes, not only when content does.

## 7. The sanitiser hole (fixed — commit `097825e`)

Found during review, present on production, not created by this design — but the editor would have
made it routine, so it was fixed before any editor code was written.

`markdown-sanitize.ts` granted `style` **and** `className` to all 22 SVG tags including `<svg>`
itself, while the comment directly above the schema explained that `style` was deliberately kept
off `*` so contributor HTML could not cover the page. So
`<svg style="position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647">` rebuilt exactly
that overlay, and `class="fixed inset-0 z-50"` did the same — those utilities ship in the compiled
stylesheet. `svgWrapperClass` does not contain it: `overflow` cannot clip a `position:fixed` child,
and class rules lose to an inline `style`.

**Resolution (owner's call): keep `style`, constrain its value.** Removing it outright would have
forced a migration of 182 diagrams for no gain the owner wanted. Measurement made the middle path
cheap — across all of `content/` there is exactly **one** distinct inline style,
`background:#e0deda; font-family: system-ui, sans-serif;`, used 182 times. `style` is now matched
against a property allowlist (`background`, `background-color`, `color`, `fill`, `stroke`,
`font-family`, `font-size`, `font-style`, `font-weight`, `letter-spacing`, `opacity`) with brackets
forbidden in values, which excludes `url()` and every other CSS function. Every real diagram passes;
`position`, `inset`, `z-index`, `width`, `height` and `transform` are unexpressible.

Also shipped in the same commit: `className` dropped (no lesson has ever used `class` on an `<svg>`);
an `ancestors` rule so SVG children cannot render outside an `<svg>`, which hardens the stray-element
assertion the corpus test already made; and `fontStyle` **added** — it was missing from the
allowlist, so all 351 `font-style="italic"` attributes in the corpus were being silently stripped.

The judgement worth keeping: an overlay is not something PR review reliably catches. 182 diagrams
already carry a `style` attribute, so the malicious one reads as ordinary. `<script>` gets spotted;
this would not.

## 8. Milestones

> **Reversed after review.** The first draft spent two milestones on infrastructure before the first
> user-visible byte, gated by a pure-refactor package, and scheduled the owner's resume requirement
> dead last.

0. **Prerequisites — done in `097825e`, except (d).** (a) Dropped `[skip ci]` from the id
   write-back at `content-sync.yml`, so Cloudflare rebuilds once ids exist (§1.1), and fixed the
   stale deploy claim in `docs/self-hosting.md`. (b) Fixed the sanitiser hole (§7).
   (c) Add the `community-proposal` exclusion to `claude.yml` (§2.3). (d) Add the `main` ruleset with
   `content-verify` required and `github-actions[bot]` bypassing, and update the comment at
   `content-sync.yml:15` (§2.7). (e) Delete `@keystatic/core` and `@markdoc/markdoc` from
   `apps/web/package.json:21-22` — zero imports anywhere, 8.6 MB of dead `node_modules`
   (6.2 MB `@keystatic`, 2.4 MB `@markdoc`, both under `apps/web/node_modules`). Keystatic would not
   have helped anyway: it never calls the PR API — its "open a PR" button is a plain
   `<a href="…/pull/new/<branch>">`. (f) Fix `rate-limit.ts:36` to reuse `getClientIp`
   (`RELIABILITY-AUDIT.md` M8), and add the `--force` blast-radius guard to `sync-tests.mjs` (§2.7).
1. **Backend write path.** GitHub App auth, `content-rules.ts`, the §3.5 pipeline end to end,
   `content_proposals`, rate limits, Turnstile, `proposal-index.yml`. Behind `PROPOSALS_ENABLED`,
   exercised by tests. One PR of plumbing, not two.
2. **Editor v1 — the first shippable milestone.** CodeMirror with **live-preview decorations
   included**, preview pane through the full site pipeline, frontmatter form, toolbar and keymap,
   paste handling, draft restore, submit dialog, all three doors, the §3.3 interaction design.
   Definition of done: *a non-technical author completes a typo fix and a paragraph rewrite without
   seeing Markdown syntax they did not type.* The decorations are a release gate, not polish — they
   are the entire difference between this and github.dev, which is what the owner asked to move away
   from.
3. **Slash menu and atomic widgets.** `<svg>` thumbnails, question cards.
4. **New lessons** — `TEMPLATE.md` seeding, slug derivation, course-wide uniqueness check.
5. **Test-lesson editing** — question/option UI over the `<!-- q -->` grammar, with id-preservation
   tests as acceptance (§2.6).
6. **Continue-an-open-proposal** — optional notification email, fragment-carried token, `PATCH`
   (§3.7).
7. **New modules and courses.**
8. *If, and only if, real duplication pain appears:* extract `packages/content-schema` and give the
   submit dialog full in-form validation. The frontmatter regex is copy-pasted in **seven places
   across six files in three distinct shapes** — capturing-with-trailing-newline
   (`validate-content.mjs:45`, `sync-tests.mjs:35`, `sync-content-db.ts:43`,
   `generate-course-index.mjs:23`, `build-manifest.ts:20`), non-capturing (`frontmatter.ts:7`), and
   capturing-*without*-trailing-newline (`frontmatter.ts:8`), plus an id-splicing `/^---\r?\n/` at
   `sync-content-db.ts:73`. A single exported constant that ignores those differences changes what
   `raw.slice(m[0].length)` returns and silently breaks the byte-identity test — export a
   `parse()` returning `{ data, body, raw, endOffset }` instead.

## 9. Open decisions and risks

1. ~~Which session mechanism owns the GitHub identity~~ — **moot: no GitHub door in v1** (§1).
   Privy is the only session source; better-auth stays untouched.
2. ~~Trusted proxy hop count~~ — **decided: none.** The backend is on Heroku with nothing in front,
   so `getClientIp` is correct as written (§3.5 step 1). Revisit if a CDN is ever added.
3. ~~How many SVG files use inline `style`~~ — **measured: 182 occurrences of one identical
   declaration across 93 files.** Resolved by constraining the value rather than removing the
   attribute (§7).
4. **`main` branch protection** (§2.7) changes a documented premise of `content-sync.yml`. Confirm
   a ruleset bypass actor really does let `github-actions[bot]` push the id write-back before
   relying on it.
5. **Licence clickwrap wording** needs whoever owns legal to look at it (§10).

## 10. Licence clickwrap

The submit dialog carries a **checkbox**, not fine print — browsewrap terms fail in court roughly
86% of the time. Wording follows Wikipedia's two-sentence model plus DCO 1.1 clause (d): an
irrevocable CC BY-SA 4.0 grant for content (MIT for code), a warranty of the right to license, "a
hyperlink or URL is sufficient attribution", and explicit notice that the record is public and
permanent and that no email is published. The checkbox state, the notice version string and the
timestamp are recorded on the proposal row (§3.6).

No CLA. A signature ceremony for a three-word typo fix destroys conversion, and CLA-assistant-lite
is archived. `CONTRIBUTING.md`'s one-line licensing clause is fine for GitHub PRs, where GitHub ToS
D.6 backstops it, but does no work for web submissions — it needs a subsection, added in milestone 2.
