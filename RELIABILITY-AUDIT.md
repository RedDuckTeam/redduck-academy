# Reliability Audit — redduck-academy

**Date:** 2026-08-03
**Method:** multi-agent audit — 8 subsystem finders → 3 adversarial verifiers → 1 synthesizer (29 candidate findings, 28 survived verification, consolidated to 24).
**Scope:** non-obvious ways the platform can break in production (external-dependency failures, race conditions, resource exhaustion, stuck async jobs, silent data corruption). Pure style/nits excluded.

**Deliberately excluded (already known / handled):**

1. Fork-origin validation rejecting valid forks after the GitHub org rename (`RedDuck-Software` → `RedDuckTeam`). Already fixed/removed.
2. The OpenAI key running out of credits breaking grading. Known; Claude fallback planned. _(Note: several findings below are about that fallback being incomplete — see M2, L4, H4.)_

---

## Executive summary

The biggest reliability risks cluster around **unguarded external-dependency single points of failure** and **missing atomicity**. Core submit/grade flows fan out through one shared GitHub token with no throttling/retry, fetch the solc compiler from a hardcoded CDN with no timeout or fallback, and gate coding-task grading on an AI second-layer that fails **closed** — so a GitHub burst, a CDN blip, or a transient provider error takes a whole track's grade flow down (and, for solc, silently records _wrong_ verdicts that also burn students' daily budget).

Concurrency and idempotency gaps compound this: a check-then-insert race 500s every new user's first load, non-atomic rate-limit consumes leak the paid-batch budget, and async review batches have no reconciler — so an ill-timed dyno kill leaves submissions permanently stuck "pending" and un-resubmittable. Content-model integrity is also weak: lesson slugs aren't unique within a course, and reviews are parsed against the _live_ rubric rather than the graded snapshot — both silently attach grades/progress to the wrong lesson or criteria. Finally, IP-scoped submission limits collapse an entire NAT'd classroom onto five shared attempts with an escalating multi-day lockout, making the platform actively hostile to the cohort setting it's built for.

## Severity counts

| Severity | Count |
| -------- | ----- |
| Critical | 0     |
| High     | 8     |
| Medium   | 12    |
| Low      | 4     |

## Index

**High**

- [H1 — Shared GitHub token, no throttling/retry → burst breaks all reviews](#h1)
- [H2 — solc from hardcoded CDN, no timeout/fallback (silent wrong verdicts)](#h2)
- [H3 — ensureAppUser check-then-insert race 500s new users' first load](#h3)
- [H4 — Second-layer AI recheck fails CLOSED, discards passing submissions](#h4)
- [H5 — Lesson slugs not unique within a course → routing/grading corruption](#h5)
- [H6 — Shared NAT/CGNAT IP collapses cohort onto one escalating lockout](#h6)
- [H7 — Rate-limit attempt consumed before validation → common mistakes lock users out](#h7)
- [H8 — Unauthenticated whole-user-base aggregations saturate the 3-conn pool](#h8)

**Medium**

- [M1 — Split-migration drift: backend queries Payload-owned columns](#m1)
- [M2 — env hard-requires OPENAI_API_KEY at boot even on Anthropic failover](#m2)
- [M3 — Batch parsed against live rubric, not the graded snapshot](#m3)
- [M4 — No reconciler for pending batches → permanent "pending" deadlock](#m4)
- [M5 — git.getTree truncation ignored → silent under-fetch on large repos](#m5)
- [M6 — Privy static verification key, no JWKS fallback → total lockout on rotation](#m6)
- [M7 — Hidden+previewable coding tasks are viewable but every submit 404s](#m7)
- [M8 — In-memory limiter keys on spoofable left-most X-Forwarded-For](#m8)
- [M9 — submission checkAndConsume non-atomic, no unique index → budget leak](#m9)
- [M10 — Tag refs / short SHAs unresolvable despite docs claiming support](#m10)
- [M11 — Branch names containing "/" mis-parsed from browser URLs](#m11)
- [M12 — Admin solc compile worker has no timeout → stuck "compiling"](#m12)

**Low**

- [L1 — Concurrent sync polls double-record AI usage/cost](#l1)
- [L2 — Missing index on payload.lessons.slug](#l2)
- [L3 — next-lesson pointer for previewable lesson resolves to first lesson](#l3)
- [L4 — Anthropic review batch 16,384-token cap can truncate into unparseable JSON](#l4)

---

## High

### H1 — Single shared GitHub token with no throttling/retry/backoff — a submission burst exhausts the rate limit and breaks ALL reviews platform-wide.

**Subsystem:** GitHub / Octokit integration · **File:** `apps/backend/src/services/review/github.service.ts:24`

**Failure scenario:** The client is a bare `new Octokit({ auth })` (line 24) with no plugin-throttling/plugin-retry, and every submission fans out ~4+N calls on ONE global token: `resolveRepoRef` (1–2), `getCommit`+`getTree` (2), then one `repos.getContent` PER expected file, all synchronously inside the HTTP request with no queue or concurrency cap. A class submitting near a deadline (a lesson globbing ~20 files ≈ 24 calls/submission → ~200 submissions/hr) exhausts 5000/hr, or a few dozen simultaneous submissions trip GitHub's secondary/abuse limit sooner. `throwGitHubApiError` maps 403 straight to a non-retried 502 and ignores `Retry-After`/`x-ratelimit-reset` (`utils/github.ts:30-31`), so from then on every call 502s and the submit/grade flow is down for all users until the hourly reset — with frustrated resubmits prolonging it.

**Why non-obvious:** The correct anti-abuse plumbing is entirely absent and easy to miss because a single submission in testing never approaches the limit; the failure only appears under real concurrent cohort load and then self-recovers, hiding the root cause.

**Fix:** Register `@octokit/plugin-throttling` and `@octokit/plugin-retry` so the client honors `Retry-After`/`x-ratelimit-reset` and backs off; add a concurrency limiter around submissions; and cut per-submission calls by fetching file contents from the single already-fetched tree (`git.getBlob` by SHA) or one tarball download instead of N `getContent` calls. Surface a user-facing "try again shortly" with retry-after instead of a generic 502.

### H4 — Second-layer AI recheck fails CLOSED: any transient provider error blocks and discards an already-passing coding-task submission

**Subsystem:** Coding-task execution & solc · **File:** `apps/backend/src/services/coding-task/coding-task.review.ts:111`

**Failure scenario:** For any coding task with executable tests, a submission whose browser tests passed (`clientPassed===true`) routes to `secondLayerReview → provider.chatStructured`. On ANY non-credit provider failure — transient 5xx, socket timeout, a 429 burst outlasting SDK retries during a live-class wave, an empty completion, or malformed/truncated model JSON — `secondLayerReview` throws `AppError(502)`. Because `submitCode` awaits the verdict BEFORE `createSubmission`, the throw happens first: the student's genuinely-passing attempt is never recorded and the frontend toasts an error, prompting retries that amplify AI load. The gate ironically fails CLOSED even though the schema instructs the grader to "default to true when uncertain."

**Why non-obvious:** The lenient "default true" prompt implies fail-open, but the surrounding control flow throws on provider unavailability and discards the record before persisting, so an AI hiccup hard-blocks a solution the browser already validated.

**Fix:** Persist the submission before the second-layer call so a passing attempt is never lost, and on provider error/timeout/parse-failure fail OPEN (record as passed, since the browser validated it) with an async re-grade flag rather than throwing 502. Set an explicit per-call timeout and treat AI-unavailable separately from AI-says-cheating.

### H5 — Lesson slugs are not unique within a course, but every read/submit path keys on (courseSlug, lessonSlug) and drops the module — silent routing/grading corruption

**Subsystem:** Content sync & Payload CMS invariants · **File:** `apps/backend/src/services/lessons/lessons.service.ts:15`

**Failure scenario:** An author adds `content/evm/module-2/intro.md` alongside `content/evm/module-1/intro.md` (reusing a natural filename). The lesson slug IS the filename, and `validate-content.mjs` only checks slug FORMAT and per-role ID uniqueness — never lesson-slug uniqueness within a course — so both pass CI and sync as two rows with `slug='intro'` under the same course. Every backend lookup then resolves by course+slug with NO module scope: `#lessonBySlugWhere` has no module condition and `findFirst` has no `orderBy`, so it returns an ARBITRARY one of the two rows. The route is `/:courseSlug/:lessonSlug`, so the module segment shown in the URL never reaches the query. One lesson becomes permanently shadowed/unreachable, and submit-test / submit-coding-task / submit-project / mark-completed can record progress and grading against the WRONG `lesson.id`.

**Why non-obvious:** The frontend route embeds the module (`$courseSlug.$moduleSlug.$lessonSlug`), creating the illusion that (course, module, lesson) is the identity, while both the API and manifest lookup silently key only on (course, slug); validation carefully enforces ID uniqueness yet has no slug-uniqueness check at all, so the collision passes every CI gate.

**Fix:** Enforce course-wide lesson-slug uniqueness in `scripts/validate-content.mjs` (collect lesson slugs per course across all modules and error on any duplicate, mirroring the existing `idOwners` check), optionally backed by a DB partial unique index on (course-of-module, slug). Do NOT rely on `findFirst` ordering.

---

## Medium

### M1 — Split-migration drift: backend queries Payload-owned columns that its own release migrations never create

**Subsystem:** Postgres connections & query load · **File:** `apps/backend/src/db/index.ts:26`

**Failure scenario:** `payloadDb` reads Payload-owned tables (courses/modules/lessons) and the backend's hot queries depend on columns like `is_hidden` and `previewable`, but those tables' DDL is owned by the admin/Payload app. The Heroku release migrator (`migrate.ts:17`) applies only `apps/backend/drizzle`, which contains zero payload references, and backend and admin deploy independently against one DB with no enforced ordering. If a backend release ships code referencing a new/renamed Payload column before the admin app has run its corresponding migration in production (or the two get reordered), lesson/course queries throw `column … does not exist` → 500 → content load blocked platform-wide until the admin migration lands.

**Why non-obvious:** The two apps sharing one Postgres DB but owning disjoint migration sets is an architectural coupling invisible until a specific future schema-changing deploy races ahead of the admin migration; nothing in CI or the release step enforces ordering.

**Fix:** Gate the backend release on the admin Payload migration having run (shared step or version handshake), and/or add a lightweight startup schema-compat check in the backend that fails fast with a clear error instead of serving 500s. At minimum co-version `@redduck/payload-config` with the DB state the backend expects.

### M2 — env schema hard-requires OPENAI_API_KEY at boot even when AI_PROVIDER=anthropic

**Subsystem:** Env parsing / startup · **File:** `apps/backend/src/env.ts:31`

**Failure scenario:** `env.ts` runs `envSchema.parse(process.env)` at module import, and `OPENAI_API_KEY` is `z.string().min(1)` unconditionally while `ANTHROPIC_API_KEY` is `.optional()` ("validated at provider construction, not here"). An operator failing over to Claude (`AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY` set) who ALSO removes/blanks the now-dead `OPENAI_API_KEY` crashes the ENTIRE backend at boot with a `ZodError` — taking down login, content load, and everything — precisely during an AI-provider incident. **This directly undermines the planned Claude fallback.**

**Why non-obvious:** The codebase is clearly designed for provider swapping (lazy `getAiProvider`, per-provider key validation, the explicit "not here" comment), yet the OpenAI key was left as an unconditional boot requirement, so the natural failover action (removing the unused key) breaks boot for a reason unrelated to Anthropic.

**Fix:** Make key requirements conditional on `AI_PROVIDER` via a Zod `superRefine`/discriminated schema: require `OPENAI_API_KEY` only when `AI_PROVIDER!=='anthropic'` and `ANTHROPIC_API_KEY` only when `==='anthropic'`. Keep per-provider construction-time checks as a second line of defense.

### M3 — Batch output is parsed against the LIVE CMS rubric, not the rubric it was graded against — positional mapping cross-assigns and silently corrupts grades

**Subsystem:** AI grading resilience & providers · **File:** `apps/backend/src/services/review/review.service.ts:91`

**Failure scenario:** The prompt is built at submit time from submit-time tasks, but `syncProjectReview` re-loads the lesson and passes the CURRENT `lesson.reviewGradingTasks` to `pollAndParse`; the submission row stores no rubric snapshot. The by-`taskId` mapping path is dead (the JSON schema has no `taskId` property), so `parseReviewFeedback` maps model rows to tasks strictly by array POSITION. If a batch was graded against `[T1,T2,T3]` and an admin inserts a required task at the top in Payload before the next poll (making the live rubric `[T0,T1,T2,T3]`), `pollAndParse` has 3 rows but 4 tasks: row#1 (graded T1) attaches to T0, and so on; verdicts are cross-assigned to the wrong criteria and a student who passed can be silently failed with a normal-looking result.

**Why non-obvious:** Batches can sit up to 24h, and nothing records that positional mapping assumes the rubric is frozen; an ordinary admin rubric edit during the pending window silently re-indexes every row with no error.

**Fix:** Snapshot the rubric (task ids and order/count) into the submission row at `createBatch` time and parse the batch output against that snapshot. If the live rubric no longer matches the snapshot count, fail the submission explicitly rather than positionally remapping.

### M4 — No reconciler for pending review batches: an orphaned or expired batch leaves the submission permanently "pending" and blocks all resubmission

**Subsystem:** AI grading resilience / orphaned jobs · **File:** `apps/backend/src/services/review/review.service.ts:68`

**Failure scenario:** `submitProject` writes state in three non-atomic steps: `createForReview` inserts `status='pending', batchRequestId=NULL`, `createBatch` performs a multi-second billed OpenAI Batch call, then `updateBatch` persists the id. There is no worker/cron dyno and the pending→failed/completed transition happens ONLY inside user-driven `syncProjectReview`, which early-returns forever when `batchRequestId` is null; `createForReview` 409s on every resubmit while any pending row exists. Two ways this sticks: (a) the batch later ends "expired" but nothing polls it; (b) worse, a Heroku SIGTERM force-exit (`FORCE_EXIT_MS=10s`) or OOM SIGKILL fires in the sub-second `createBatch→updateBatch` window — no catch/finally runs, the batch may already exist (wasted spend, output never read), and the row is left `pending/batchRequestId=NULL` PERMANENTLY. The learner can neither advance, fail, nor replace it.

**Why non-obvious:** The path looks safe because the try/catch marks the submission failed on any _thrown_ error — but a process force-exit is not a thrown error, and an expired batch is never re-polled; the pending-guard then converts a transient orphan into a hard, self-inflicted resubmission block.

**Fix:** Never let a "pending" row exist without its batch id (create the batch before inserting, or record `batchRequestId` in the same statement). Add a reconciliation path: in `syncProjectReview`, `markFailed` a pending row that has no `batchRequestId` (or an expired/failed batch) older than a threshold; and/or run a startup/scheduled sweep for such orphans.

### M5 — git.getTree truncation is ignored — glob review paths are silently under-fetched on large repos, producing wrong or failed grades

**Subsystem:** GitHub / Octokit integration · **File:** `apps/backend/src/services/review/github.service.ts:97`

**Failure scenario:** `listBlobPathsAtCommit` returns `(tree.tree ?? [])…` without checking `tree.truncated`. GitHub truncates a recursive tree at ~100k entries / ~7MB and sets `truncated:true`, and the recursive endpoint can't be paginated to recover the rest. `expandReviewPatterns` matches glob rows ONLY against this list, so if a student commits `node_modules`/build output (easily >100k entries) or forks a large monorepo, a review lesson using `contracts/**/*.sol` gets a truncated tree with the student's actual contract omitted — so either `validateFetchResult` throws "No valid files were fetched" (rejecting a valid submission and, per H7, consuming an attempt) or the grader receives an incomplete file set and fails a submission that should pass — silently.

**Why non-obvious:** `truncated` is never inspected and the partial list is treated as authoritative, so a size-based truncation reads exactly like "the file isn't there" — a beginner committing `node_modules` is a realistic trigger.

**Fix:** After `getTree`, check `tree.truncated`; when true, fail loudly with an actionable message ("repository too large to enumerate; remove build artifacts/node_modules") or resolve each glob via a per-directory tree walk / tarball listing so matches aren't silently dropped.

### M6 — Privy token verification uses only a static verification key with no JWKS fallback — key rotation or a misformatted env var locks out all authenticated traffic

**Subsystem:** Auth / Privy · **File:** `apps/backend/src/lib/privy.ts:11`

**Failure scenario:** `verifyPrivyToken` always calls `privy.verifyAuthToken(token, verificationKey)` with a single static PEM from env and has no JWKS fallback. If Privy rotates its signing key, every token fails verification; `resolveUser` catches the throw and returns 401 for EVERY authenticated request, locking all logged-in users out of submitting, progress, and certificates until an operator manually updates `PRIVY_VERIFICATION_KEY`. Similarly, if the key is deployed in an unexpected format, the code only repairs literal `\n` sequences, so an otherwise-encoded key throws on every request.

**Why non-obvious:** A deliberate latency optimization ("avoid a JWKS round-trip per request") trades a rare-but-total failure for saved round-trips, with no alarm or automatic fallback.

**Fix:** On a verification failure that looks like a key mismatch, fall back to Privy's JWKS-based verification (or fetch the current JWKS) and cache the resolved key rather than hard-failing on a stale static key. At minimum validate that the key parses at boot and alert on a sustained spike in Privy verification failures.

### M7 — Hidden+previewable coding tasks are viewable but every submission 404s — getCodingTaskLesson ignores the previewable flag

**Subsystem:** Content sync & Payload CMS invariants · **File:** `apps/backend/src/services/lessons/lessons.service.ts:109`

**Failure scenario:** An author marks a `coding_task` lesson `isHidden=true` + `previewable=true` to preview it pre-launch. The public GET honors `previewable` via `or(ne(isHidden,true), eq(previewable,true))`, so the lesson renders and the editor is shown. On submit, `submitCode → getCodingTaskLesson` uses a hand-rolled WHERE with `ne(lessons.isHidden, true)` and NO `previewable` OR-branch, so `isHidden=true` excludes the row, `findFirst` returns undefined, and it throws `AppError(404)`. A previewable coding task can be opened but never submitted/graded.

**Why non-obvious:** The `previewable` field's own description explicitly promises a previewable lesson "can still be fetched by its direct API/URL and submitted to", and the sibling review path (`getReviewLessonWithRubric`) correctly reuses `#lessonBySlugWhere` — so it's natural to assume the coding-task path does too, but it hand-rolls a stricter WHERE.

**Fix:** Make `getCodingTaskLesson` reuse `#lessonBySlugWhere` (as `getReviewLessonWithRubric` does), or add the same `or(ne(isHidden,true), eq(previewable,true))` branch to its WHERE.

### M8 — In-memory global rate limiter keys unauthenticated requests on the SPOOFABLE left-most X-Forwarded-For, letting attackers bypass the DoS shield

**Subsystem:** Abuse resistance / rate limiting · **File:** `apps/backend/src/lib/rate-limit.ts:36`

**Failure scenario:** The process-wide limiter (`app.use('/api/*', rateLimit({max:1000, windowMs:60_000}))`) derives its unauthenticated key from `ip:${xff.split(',')[0]}` — the LEFT-most `X-Forwarded-For` value. On Heroku the router appends the real client IP as the LAST XFF entry and does not strip a client-supplied header, so the left-most value is fully attacker-controlled (which is why `getClientIp` reads the RIGHT-most entry). A client rotating its own `X-Forwarded-For` per request lands in a fresh bucket each time, fully bypassing the 1000/min shield on all unauthenticated `/api/`_ routes — including the better-auth proxy `/api/auth/_`(login, OAuth, SIWE), enabling credential-stuffing floods — and each distinct spoofed value also grows the module-level`buckets` Map (swept only every 5 min), inflating memory on the single dyno.

**Why non-obvious:** The correct right-most-XFF anti-spoof rule is implemented in the SAME codebase (`getClientIp`), yet this parallel limiter silently uses the opposite side of the same header; it looks correct in any test that sends a single XFF value.

**Fix:** Reuse `getClientIp` (right-most XFF) as the unauthenticated IP source in `defaultKey` instead of `xff.split(',')[0]`; optionally sweep the `buckets` Map more aggressively to bound memory.

### M9 — submission checkAndConsume is non-atomic with no unique index — concurrent submissions create duplicate rows and lose updates, leaking the paid-batch limit

**Subsystem:** Abuse resistance / rate limiting · **File:** `apps/backend/src/services/rate-limit/submission-rate-limit.service.ts:94`

**Failure scenario:** `checkAndConsume` runs SELECT-by-`(ipAddress,lessonId)` then INSERT/UPDATE inside a plain READ COMMITTED transaction with no `FOR UPDATE`, and the `(ipAddress,lessonId)` index is a plain index, not `uniqueIndex`. Two concurrent FIRST submissions both see `!ipRow` and both INSERT → two rows for the same key; every subsequent `.limit(1)` SELECT has no `ORDER BY`, so the peek can read the allowed row while consume increments the other, making the effective per-IP limit a multiple of `WINDOW_SIZE`. Even with a single row, two concurrent consumes both read `attemptsUsed=N` and both write `N+1` (lost update). Because each passing project submission triggers a GitHub file fetch on the shared token plus a billed OpenAI grading batch, leaking the limit directly amplifies third-party API/quota cost.

**Why non-obvious:** A calling comment presents this as "the atomic consume", but wrapping a read-modify-write in a transaction provides neither a row lock nor a uniqueness constraint; the leak only appears under concurrency (double-click, parallel script).

**Fix:** Add a unique index on `(ipAddress, lessonId)` (and `(userId, lessonId)`) and use `INSERT … ON CONFLICT DO UPDATE` with the increment computed in SQL (`attempts_used = attempts_used + 1 WHERE … AND attempts_used < WINDOW_SIZE RETURNING`), or `SELECT … FOR UPDATE` the existing row before mutating.

### M10 — Tag refs and abbreviated commit SHAs cannot be resolved despite docs/types claiming support — valid tagged submissions rejected as "branch not found"

**Subsystem:** GitHub / Octokit integration · **File:** `apps/backend/src/services/review/github.service.ts:46`

**Failure scenario:** A student tags their submission and pastes `github.com/me/repo/tree/v1.0.0` (or a short-SHA `/commit/abc1234` URL). `parseGitHubRepoUrl` extracts `refFromUrl='v1.0.0'`; `resolveRefToSha` calls `octokit.repos.getBranch({branch:'v1.0.0'})` → 404, then falls back to `octokit.git.getCommit({commit_sha:'v1.0.0'})`. The git-database endpoint requires a real 40-char commit-object SHA, so it 404s for tags and short SHAs; the inner catch then rethrows the OUTER branch error, so a valid tagged submission is rejected as "Repository or branch not found" with a log pointing at the wrong cause. Both `types/github.ts` and the `utils/github.ts` doc comment explicitly promise tag support.

**Why non-obvious:** `git.getCommit` looks like a general commit resolver but is the strict git-database endpoint that only accepts full commit-object SHAs; the rethrow of the outer error further hides that a tag was ever attempted.

**Fix:** Resolve refs with a single `octokit.repos.getCommit({owner,repo,ref})` — its `ref` form accepts branches, tags, AND short SHAs and returns `.sha` — or add a `git.getRef('tags/<ref>')` lookup before the commit fallback. Also throw the INNER error in the fallback catch so logs reflect the real cause.

### M11 — Branch names containing "/" are mis-parsed from browser-copied /tree/ and /blob/ URLs — common feature-branch submissions fail as "branch not found"

**Subsystem:** GitHub / Octokit integration · **File:** `apps/backend/src/services/review/utils/github.ts:74`

**Failure scenario:** A student on branch `feature/lesson-3` copies `github.com/me/repo/tree/feature/lesson-3` from the browser address bar and submits. The pathname splits to `[owner,repo,tree,feature,lesson-3]`; the code takes only `parts[treeIdx+1]='feature'`, silently dropping `lesson-3`. `resolveRefToSha('feature')` then 404s and the submission is rejected as "branch not found" even though `feature/lesson-3` is valid. Slash-containing feature branches are an extremely common git convention.

**Why non-obvious:** The parser assumes the ref is exactly one path segment after `tree`/`blob` (matching the `%2F`-encoded form in the doc comment), but browsers put the raw un-encoded slash in the address bar, so a routine feature-branch URL silently loses everything after the first slash.

**Fix:** Reconstruct the ref by joining path segments after `tree`/`blob` and disambiguate against the repo's actual branch/tag list (try progressively longer joined candidates, or longest-prefix match against listed refs). At minimum detect a multi-segment `/tree/` path and return a clear message telling the user to submit the plain repo URL.

### M12 — Admin solc compile worker has no timeout — a hung solc load leaves authoring stuck "compiling" with a leaked worker and a permanently-pending cached promise

**Subsystem:** Coding-task execution & solc · **File:** `apps/admin/src/admin-components/abi-driven-test-case/use-compiled-abi.ts:31`

**Failure scenario:** `compileInWorker()` resolves/rejects ONLY from `worker.onmessage`/`worker.onerror` — no timeout, unlike the student runner which races a `totalTimeout`. If solc-loader's ~10MB CDN fetch stalls (bad network, half-open connection that never errors), the worker never posts a message: the Promise stays pending forever, the worker is never terminated (leaked), and the entry is left cached in the module-level cache map (the `.catch` deletes only on rejection, never on a hang). The ABI-driven test-case editor is stuck on "compiling" for that source until a full page reload.

**Why non-obvious:** `worker.onerror` looks like it handles failures, but it only fires for worker-script errors, not a fetch that simply never completes; the student runner races a timeout, so the asymmetry is easy to overlook.

**Fix:** Add a `setTimeout`/`AbortController` guard in `compileInWorker`: on timeout call `worker.terminate()`, reject with a "compiler load timed out" error, and delete the cache entry so a retry can re-attempt — mirroring the student runner's `totalTimeout`.

---

## Low

### L1 — Concurrent sync polls double-record AI usage/cost because recordAiUsage runs outside complete()'s double-complete guard

**Subsystem:** Review pipeline / cost accounting · **File:** `apps/backend/src/services/review/review.service.ts:105`

**Failure scenario:** `complete()` guards with `WHERE status='pending'` and returns void, but `recordAiUsage` runs unconditionally afterward, and `aiUsageLogs` has only non-unique indexes on `submissionId`. Two concurrent `syncProjectReview` calls for one pending submission (two tabs, or a poll firing before the first finishes) both pass the `status==='pending'` gate, both `pollBatch` (each re-downloads the batch output file), both call `complete()` (one transitions, the other no-ops), and BOTH call `recordAiUsage` — producing duplicate `aiUsageLogs` rows for one grading call, so cost rollups over-report spend.

**Why non-obvious:** The double-complete guard makes the flow look idempotent, but the guard's void return means the cost-capture step downstream runs on every caller regardless of whether it did the work.

**Fix:** Have `complete()` return whether it actually transitioned the row and only call `recordAiUsage` on a real transition; add a partial unique index on `aiUsageLogs(submissionId, submissionType)` with `onConflictDoNothing`; optionally single-flight the sync endpoint.

### L2 — Missing index on payload.lessons.slug forces a sequential scan on the by-slug visibility lookup

**Subsystem:** Postgres connections & query load · **File:** `packages/payload-config/src/collections/Lessons.ts:316`

**Failure scenario:** The lessons `slug` field declares no `index:true` (its sibling `module` field does), and the generated schema shows only module/updated/created indexes. Every by-slug lookup (`#lessonBySlugWhere`, used by `getLesson` and the submit-path lookups) filters `lessons.slug=?` plus a correlated EXISTS, so with no slug index Postgres seq-scans the lessons table. `getLesson` is memory-cached, so this only bites uncached submit flows and cold-cache concurrency (fresh dyno / post-deploy / TTL expiry) on the `max:3` pool.

**Why non-obvious:** A hygiene gap rather than a live breakage: at a realistic table size (hundreds–low-thousands of rows) the seq scan is sub-millisecond, so it won't degrade the platform today — but it silently removes the index-based plan the query obviously expects.

**Fix:** Add `index:true` to the lessons `slug` field (or a composite unique index on `(module, slug)`), regenerate the Payload schema, and run the migration.

### L3 — next-lesson pointer for a previewable lesson resolves to the course's FIRST lesson

**Subsystem:** Content sync & Payload CMS invariants · **File:** `apps/backend/src/services/lessons/lessons.service.ts:200`

**Failure scenario:** `getLesson` serves a hidden+previewable lesson and calls `#getNextLessonSlug`. That query filters `ne(l.isHidden,true)`, so the current previewable-hidden lesson is absent from `orderedLessons`; `findIndex` returns -1, so `orderedLessons[idx+1] = orderedLessons[0]`, and the course's first visible lesson is returned as "next".

**Why non-obvious:** `idx === -1` silently yields `orderedLessons[0]` because `-1 + 1 = 0` is a valid index; the -1 case is never guarded, and only previewable (hidden) lessons hit it.

**Fix:** Guard the not-found case: `if (idx === -1) return null` before indexing, or `return idx >= 0 ? (orderedLessons[idx + 1]?.slug ?? null) : null`.

### L4 — Anthropic review batch capped at 16,384 output tokens can truncate large-rubric reviews into unparseable JSON (OpenAI path has no such cap)

**Subsystem:** AI grading resilience & providers · **File:** `apps/backend/src/services/review/batch.service.ts:15`

**Failure scenario:** OpenAI `createBatch` sends no max-token cap (model default), while Anthropic `createBatch` applies `max_tokens = REVIEW_MAX_OUTPUT_TOKENS` (16,384). With `AI_PROVIDER=anthropic` (the fallback) and a rubric large enough that the structured output exceeds 16,384 tokens, Anthropic returns a succeeded result with truncated JSON; `parseReviewFeedback` `JSON.parse` throws and every resubmit fails identically, so the learner cannot pass that lesson while on Anthropic — even though the same submission grades fine under OpenAI's uncapped default.

**Why non-obvious:** A real provider inconsistency, but 16,384 output tokens is generous (~800 tokens/row across a 20-task rubric), so truncation is a speculative edge that only affects the non-active Anthropic fallback — worth fixing for parity when the fallback ships.

**Fix:** Raise/remove the Anthropic review output cap to parity with OpenAI's effective default, and detect `stop_reason === 'max_tokens'` in the Anthropic provider to surface a distinct retriable error instead of a generic JSON-parse failure.

---

## Notes on themes & suggested order

Several findings share a root cause; fixing the cause knocks out clusters:

- **The Claude fallback you're about to add has three latent traps:** M2 (boot crashes if you remove the dead OpenAI key), L4 (Anthropic output cap truncates large reviews), H4 (second-layer recheck fails closed on any provider error). Fix these _as part of_ wiring the fallback, not after.
- **Rate-limit design (H6, H7, M9):** the submission limiter is IP-primary, non-atomic, consumed too early, and never refunded. A single redesign — user-scoped, atomic `ON CONFLICT`, charged only after validation — resolves all three.
- **GitHub robustness (H1, M5, M10, M11):** one shared token with no throttling, no truncation check, and a brittle ref parser. Adding the throttling/retry plugins + `repos.getCommit({ref})` + a truncation guard covers the cluster.
- **Async batch lifecycle (M3, M4, L1):** no rubric snapshot, no reconciler, non-idempotent cost capture. A small reconciler + a snapshot column + `complete()` returning its transition fixes all three.
- **Quick, isolated wins:** H3 (`onConflictDoNothing`), M7 (reuse `#lessonBySlugWhere`), M8 (reuse `getClientIp`), L3 (`-1` guard), L2 (add index).
