# AI Code Review System — Architecture & Implementation Plan

> Specification for the AI-powered code review system for Review Task lessons.
> Students submit GitHub repository URLs. The system fetches their code,
> reviews it against a per-task rubric using an LLM, and returns structured feedback.

---

## 1. Summary

### What We're Building

An asynchronous AI code review pipeline that:

1. Accepts a GitHub repo URL from a student
2. Fetches the repository contents via the GitHub API
3. Validates repo structure against expected files
4. Sends relevant code + task rubric to an LLM (via Batch API)
5. Returns a detailed, structured review with per-criterion scoring
6. Stores the review and notifies the student (~15-30 min turnaround)

### Key Design Decisions

| Decision          | Choice                                                | Rationale                                                                                |
| ----------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Submission method | GitHub repo URL (Pull Model)                          | Fits existing `ProjectSubmission` UI, no GitHub App/webhook setup needed                 |
| LLM provider      | OpenAI Batch API (GPT-4.1 or o4-mini)                 | Best structured output support, 50% cost reduction via Batch, reasoning models available |
| Review latency    | Async (~15-30 min)                                    | Enables Batch API pricing and reasoning models for deep analysis                         |
| Rubric format     | Structured checklist (binary pass/fail per criterion) | Consistent scoring, reduces LLM non-determinism                                          |
| Repo access       | Public repos only (Phase 1), GitHub OAuth (Phase 2)   | Simplest start, add private repo support later                                           |

### Cost Estimate

Assuming **20 files, ~250 lines each** per submission (~60k input tokens, ~2.5k output tokens):

| Model                       | Standard | Batch (50% off) |
| --------------------------- | -------- | --------------- |
| GPT-4.1                     | ~$0.14   | **~$0.07**      |
| GPT-4.1 mini                | ~$0.03   | **~$0.014**     |
| o4-mini (reasoning)         | ~$0.15   | **~$0.08**      |
| Gemini 2.5 Flash (thinking) | ~$0.03   | **~$0.015**     |

At **5,000 reviews** (1,000 students × 5 attempts): **$70–$400** depending on model.

---

## 2. System Architecture

### High-Level Flow

```
Student                  Web App                 Hono Backend              External
  │                        │                        │                        │
  │  Paste repo URL        │                        │                        │
  │───────────────────────>│                        │                        │
  │                        │  POST /submit-project  │                        │
  │                        │───────────────────────>│                        │
  │                        │                        │  Fetch repo via        │
  │                        │                        │  GitHub REST API       │
  │                        │                        │───────────────────────>│ GitHub
  │                        │                        │<───────────────────────│
  │                        │                        │                        │
  │                        │                        │  Validate structure    │
  │                        │                        │  Build prompt          │
  │                        │                        │  Submit to Batch API   │
  │                        │                        │───────────────────────>│ OpenAI
  │                        │                        │  Store as "pending"    │
  │                        │  { status: "pending" } │                        │
  │                        │<───────────────────────│                        │
  │  "Review in progress"  │                        │                        │
  │<───────────────────────│                        │                        │
  │                        │                        │                        │
  │        ... 15-30 min ...                        │                        │
  │                        │                        │                        │
  │                        │                        │  Poll / receive result │
  │                        │                        │<───────────────────────│ OpenAI
  │                        │                        │  Parse & store review  │
  │                        │                        │                        │
  │  Notification: ready   │                        │                        │
  │<───────────────────────│  (poll or WebSocket)   │                        │
  │                        │                        │                        │
  │  GET /review           │                        │                        │
  │───────────────────────>│  GET /review           │                        │
  │                        │───────────────────────>│                        │
  │                        │<───────────────────────│                        │
  │  View detailed review  │                        │                        │
  │<───────────────────────│                        │                        │
```

### Component Breakdown

```
apps/backend/src/
├── services/
│   └── review/
│       ├── review.routes.ts        # POST /submit-project, GET /review
│       ├── review.service.ts       # Orchestration: fetch → validate → submit → store
│       ├── github.service.ts       # GitHub API: fetch repo tree & file contents
│       ├── prompt.builder.ts       # Assemble LLM prompt from rubric + code
│       ├── llm.service.ts          # OpenAI Batch API client
│       └── review.poller.ts        # Background job: poll Batch API for results
├── db/
│   └── schema.ts                   # Add project_reviews table
```

---

## 3. Database Schema

**Implementation (this repo):** Submissions are stored in **`project_user_submissions`**, with a foreign key to **`user_lessons`** (which includes **`attempts_left`**). That avoids duplicating `user_id` + `lesson_id` on every submission row. The **`project_reviews`** sketch below remains a useful reference for columns and flow; the canonical Drizzle definitions live in [`apps/backend/src/db/schema.ts`](apps/backend/src/db/schema.ts). Persisted feedback types: [`apps/backend/src/types/review-feedback.ts`](apps/backend/src/types/review-feedback.ts) — each **`criteria`** item includes **`taskId`** (Payload `reviewGradingTasks` row id).

### New Table: `project_reviews`

```typescript
export const projectReviews = pgTable('project_reviews', {
  id: serial('id').primaryKey(),

  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').notNull(),

  // Submission info
  repoUrl: text('repo_url').notNull(),
  commitSha: text('commit_sha'), // Pin to exact commit
  attemptNumber: integer('attempt_number').notNull().default(1),

  // Review status
  status: text('status').notNull().default('pending'),
  // 'pending' | 'fetching' | 'submitted_to_llm' | 'completed' | 'failed'

  // Batch API tracking
  batchRequestId: text('batch_request_id'), // OpenAI batch ID
  llmModel: text('llm_model'), // e.g. 'gpt-4.1', 'o4-mini'
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),

  // Review result (populated on completion)
  score: integer('score'),
  maxPoints: integer('max_points'),
  passed: boolean('passed'),
  feedback: jsonb('feedback'), // Structured review (see below)

  // Error tracking
  errorMessage: text('error_message'),

  // Timestamps
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})
```

### Feedback JSONB Structure

```typescript
interface ReviewFeedback {
  summary: string

  criteria: Array<{
    taskId: string // Payload reviewGradingTasks id — join UI to admin rubric (required when persisting)
    name: string // e.g. "Contract inherits from ERC721"
    points: number // Points awarded
    maxPoints: number // Max possible
    passed: boolean
    comment: string // Explanation of why passed/failed
  }>

  fileReviews: Array<{
    filePath: string // e.g. "contracts/Token.sol"
    comments: Array<{
      line?: number
      type: 'error' | 'warning' | 'suggestion' | 'praise'
      message: string
    }>
  }>

  securityIssues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low'
    title: string
    description: string
    filePath?: string
    line?: number
  }>
}
```

---

## 4. Payload CMS — New Fields for Review Tasks

Extend the Lessons collection with review-task-specific fields that define what the LLM should evaluate.

### New Fields on Lessons Collection

```typescript
// Fields to add (conditional on type === 'review_task')

{
  name: 'templateRepo',
  type: 'text',
  admin: {
    condition: (data) => data?.type === 'review_task',
    description: 'Optional GitHub template repo URL for this task',
  },
},
{
  name: 'expectedFiles',
  type: 'array',
  admin: {
    condition: (data) => data?.type === 'review_task',
    description: 'Files the LLM should review. Only these are sent to the LLM.',
  },
  fields: [
    { name: 'path', type: 'text', required: true },  // e.g. "contracts/Token.sol"
  ],
},
{
  name: 'reviewRubric',
  type: 'array',
  admin: {
    condition: (data) => data?.type === 'review_task',
    description: 'Grading criteria. Each criterion is scored independently by the AI.',
  },
  fields: [
    { name: 'criterion', type: 'text', required: true },
    { name: 'points', type: 'number', required: true, defaultValue: 10 },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Detailed explanation of what the AI should check' },
    },
  ],
},
{
  name: 'maxReviewAttempts',
  type: 'number',
  defaultValue: 5,
  admin: {
    condition: (data) => data?.type === 'review_task',
    description: 'Max number of review submissions allowed per student',
  },
},
```

### Example Task Configuration in Payload Admin

```
Title: "Build an ERC-721 NFT Contract"
Type: Review Task
Max Points: 100
Template Repo: https://github.com/redduck-academy/erc721-template
Max Review Attempts: 5

Expected Files:
  - contracts/MyNFT.sol
  - test/MyNFT.test.js
  - scripts/deploy.js

Review Rubric:
  ┌──────────────────────────────────────────────────┬────────┐
  │ Criterion                                        │ Points │
  ├──────────────────────────────────────────────────┼────────┤
  │ Contract inherits from ERC721 (OpenZeppelin)     │ 10     │
  │ mint() has proper access control (onlyOwner)     │ 15     │
  │ tokenURI returns valid metadata URI              │ 15     │
  │ Transfer events emitted correctly                │ 10     │
  │ No reentrancy vulnerabilities                    │ 15     │
  │ Tests cover mint, transfer, and burn             │ 20     │
  │ Deploy script configures constructor args        │ 10     │
  │ Code compiles with no warnings                   │ 5      │
  └──────────────────────────────────────────────────┴────────┘
  Total: 100 points
```

---

## 5. API Endpoints

### `POST /api/lessons/:courseSlug/:lessonSlug/submit-project`

Submit a GitHub repo for AI review.

**Request:**

```json
{
  "repoUrl": "https://github.com/student/my-nft-project"
}
```

**Response (202 Accepted):**

```json
{
  "reviewId": 42,
  "status": "pending",
  "attemptNumber": 2,
  "estimatedMinutes": 15,
  "message": "Your code has been submitted for review."
}
```

**Error cases:**

- `400` — Invalid GitHub URL
- `400` — Max attempts exceeded
- `404` — Repository not found or not public
- `422` — Missing expected files (returns list of missing files)
- `409` — A review is already in progress for this user/lesson

### `GET /api/lessons/:courseSlug/:lessonSlug/review`

Get the latest review for the current user.

**Response (200):**

```json
{
  "reviewId": 42,
  "status": "completed",
  "repoUrl": "https://github.com/student/my-nft-project",
  "commitSha": "a1b2c3d",
  "attemptNumber": 2,
  "score": 75,
  "maxPoints": 100,
  "passed": true,
  "feedback": {
    /* ReviewFeedback structure */
  },
  "submittedAt": "2026-03-21T10:00:00Z",
  "completedAt": "2026-03-21T10:18:00Z"
}
```

### `GET /api/lessons/:courseSlug/:lessonSlug/review/history`

Get all review attempts for the current user on this lesson.

**Response (200):**

```json
{
  "attempts": [
    { "reviewId": 41, "attemptNumber": 1, "score": 45, "status": "completed", "submittedAt": "..." },
    { "reviewId": 42, "attemptNumber": 2, "score": 75, "status": "completed", "submittedAt": "..." }
  ],
  "remainingAttempts": 3
}
```

---

## 6. GitHub Integration

### Fetching Repository Contents

Use the GitHub REST API (via `octokit`) — no cloning needed.

```typescript
// github.service.ts — Conceptual implementation

import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

interface RepoFile {
  path: string
  content: string
}

async function fetchRepoFiles(
  repoUrl: string,
  expectedFiles: string[],
): Promise<{ files: RepoFile[]; commitSha: string; fileTree: string }> {
  const { owner, repo } = parseGitHubUrl(repoUrl)

  // Get the latest commit SHA (pin the review to this exact version)
  const { data: ref } = await octokit.repos.getBranch({ owner, repo, branch: 'main' })
  const commitSha = ref.commit.sha

  // Get the full file tree
  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: commitSha,
    recursive: 'true',
  })
  const fileTree = tree.tree
    .filter((f) => f.type === 'blob')
    .map((f) => f.path)
    .join('\n')

  // Fetch only the expected files
  const files: RepoFile[] = []
  for (const filePath of expectedFiles) {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: commitSha,
    })
    if ('content' in data) {
      files.push({
        path: filePath,
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
      })
    }
  }

  return { files, commitSha, fileTree }
}
```

### Validation Before LLM Call

Before spending tokens, validate:

1. **URL is a valid GitHub repo** — parse `owner/repo` from the URL
2. **Repo is accessible** — 404 means private or nonexistent
3. **Expected files exist** — return clear error listing which files are missing
4. **Files aren't too large** — reject files > 500 lines or repos > 100 files (configurable)
5. **Not a duplicate** — if same `commitSha` was already reviewed, return cached result

### Rate Limits

GitHub API allows 5,000 requests/hour with a token. Each review uses:

- 1 request for the branch ref
- 1 request for the tree
- N requests for file contents (one per expected file)

For 20 expected files: **~22 requests per review**. At 5,000/hour, that's **~227 reviews/hour** — more than enough.

---

## 7. LLM Prompt Structure

### System Prompt (Cached — Same for All Reviews of a Given Task)

```
You are a blockchain development instructor reviewing a student's project
submission. You must evaluate the code strictly against the provided rubric.

RULES:
- Evaluate each rubric criterion independently as pass/fail
- Award full points or zero points per criterion (no partial credit)
- Provide specific, actionable feedback for each criterion
- Reference exact file paths and line numbers when possible
- Flag any security vulnerabilities with severity levels
- Be encouraging but honest — students learn from clear feedback
- Use temperature 0 for consistent grading

RESPONSE FORMAT:
Return valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overall assessment",
  "criteria": [
    {
      "name": "criterion name from rubric",
      "points": <awarded points>,
      "maxPoints": <max points>,
      "passed": <boolean>,
      "comment": "specific explanation"
    }
  ],
  "fileReviews": [
    {
      "filePath": "path/to/file",
      "comments": [
        { "line": <number>, "type": "error|warning|suggestion|praise", "message": "..." }
      ]
    }
  ],
  "securityIssues": [
    {
      "severity": "critical|high|medium|low",
      "title": "short title",
      "description": "detailed explanation",
      "filePath": "optional",
      "line": <optional>
    }
  ]
}
```

### User Prompt (Unique Per Submission)

````
## Task
Build an ERC-721 NFT Contract

## Task Description
<rich text content from Payload>

## Grading Rubric
1. Contract inherits from ERC721 (OpenZeppelin) — 10 pts
   Check: The main contract uses `is ERC721` or `is ERC721URIStorage`
2. mint() has proper access control — 15 pts
   Check: Uses onlyOwner modifier or equivalent role-based access
...

## Repository Structure
contracts/
  MyNFT.sol
test/
  MyNFT.test.js
scripts/
  deploy.js
hardhat.config.js
package.json
README.md

## File: contracts/MyNFT.sol
```solidity
<file contents>
````

## File: test/MyNFT.test.js

```javascript
<file contents>
```

## File: scripts/deploy.js

```javascript
<file contents>
```

````

---

## 8. Batch API Integration

### OpenAI Batch API Flow

```typescript
// llm.service.ts — Conceptual implementation

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function submitBatchReview(reviewId: number, prompt: string) {
  // 1. Create a JSONL file with the request
  const request = {
    custom_id: `review-${reviewId}`,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model: 'gpt-4.1',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    },
  };

  // 2. Upload the file
  const file = await openai.files.create({
    file: Buffer.from(JSON.stringify(request) + '\n'),
    purpose: 'batch',
  });

  // 3. Create the batch
  const batch = await openai.batches.create({
    input_file_id: file.id,
    endpoint: '/v1/chat/completions',
    completion_window: '24h',
  });

  return batch.id; // Store this as batchRequestId in the DB
}
````

### Polling for Results

```typescript
// review.poller.ts — Runs on an interval (every 60s)

async function pollPendingReviews() {
  const pending = await db.select().from(projectReviews).where(eq(projectReviews.status, 'submitted_to_llm'))

  for (const review of pending) {
    const batch = await openai.batches.retrieve(review.batchRequestId)

    if (batch.status === 'completed') {
      const fileResponse = await openai.files.content(batch.output_file_id)
      const result = JSON.parse(fileResponse.text())
      const feedback = JSON.parse(result.response.body.choices[0].message.content)

      const totalScore = feedback.criteria.reduce((sum, c) => sum + c.points, 0)

      await db
        .update(projectReviews)
        .set({
          status: 'completed',
          score: totalScore,
          passed: totalScore >= review.maxPoints * 0.6,
          feedback,
          completedAt: new Date(),
          promptTokens: result.response.body.usage.prompt_tokens,
          completionTokens: result.response.body.usage.completion_tokens,
        })
        .where(eq(projectReviews.id, review.id))

      // Update user_lessons as completed if passed
      // Send notification to student
    }

    if (batch.status === 'failed') {
      await db
        .update(projectReviews)
        .set({ status: 'failed', errorMessage: batch.errors?.join(', ') })
        .where(eq(projectReviews.id, review.id))
    }
  }
}
```

---

## 9. Multi-Pass Deep Review (Optional Enhancement)

For maximum review quality, use multiple sequential LLM passes:

```
Pass 1 — Structure & Completeness (GPT-4.1 mini, ~$0.003)
  Input:  File tree + expected files list
  Output: { structureValid: bool, missingFiles: [], extraNotes: "" }
  Skip remaining passes if structure is invalid.

Pass 2 — Per-File Analysis (o4-mini, ~$0.05 total for 5 files)
  For each key file individually:
  Input:  Single file + relevant rubric criteria for that file
  Output: Per-file review with line-level comments

Pass 3 — Integration Review (o4-mini, ~$0.03)
  Input:  All per-file analyses + full file tree
  Output: Cross-file issues (tests don't match contracts, deploy
          script references wrong contract name, etc.)

Pass 4 — Final Grading (GPT-4.1 mini, ~$0.003)
  Input:  All previous analyses + full rubric
  Output: Final structured ReviewFeedback JSON with scores

Total cost: ~$0.09 per deep review via Batch API
```

This can be implemented as a sequential chain within a single batch job or as separate batch submissions where each pass triggers the next.

---

## 10. Frontend UX

### Submission Flow

```
┌─────────────────────────────────────────────────────┐
│  YOUR WORK                                          │
│                                                     │
│  📋 Paste link to repository                        │
│  ┌───────────────────────────────────────┐          │
│  │ https://github.com/student/my-nft   📋│          │
│  └───────────────────────────────────────┘          │
│                                                     │
│  ┌───────────────────────────────────────┐          │
│  │         SEND TO REVIEW               │          │
│  └───────────────────────────────────────┘          │
│                                                     │
│  Attempts: 2 of 5 used                              │
└─────────────────────────────────────────────────────┘
```

### Pending State

```
┌─────────────────────────────────────────────────────┐
│  REVIEW IN PROGRESS                                 │
│                                                     │
│  ⏳ Your code is being reviewed by AI...            │
│     Submitted 8 minutes ago                         │
│     Estimated: ~15-30 minutes                       │
│                                                     │
│  You'll be notified when the review is ready.       │
│  You can leave this page — we'll notify you.        │
└─────────────────────────────────────────────────────┘
```

### Completed Review

```
┌─────────────────────────────────────────────────────┐
│  REVIEW RESULTS           Attempt 2/5    75/100 pts │
│                                                     │
│  Overall: Good progress! Your contract implements   │
│  core ERC-721 functionality correctly. Focus on     │
│  access control and test coverage.                  │
│                                                     │
│  ┌─ RUBRIC SCORING ────────────────────────────┐    │
│  │ ✅ ERC721 inheritance          10/10        │    │
│  │ ❌ mint() access control        0/15        │    │
│  │    → mint() is public with no modifier.     │    │
│  │      Add `onlyOwner` or use AccessControl.  │    │
│  │ ✅ tokenURI returns metadata   15/15        │    │
│  │ ✅ Transfer events             10/10        │    │
│  │ ⚠️ No reentrancy vulns         15/15       │    │
│  │ ❌ Test coverage                5/20        │    │
│  │    → Missing tests for burn and transfer.   │    │
│  │ ✅ Deploy script               10/10        │    │
│  │ ✅ Compiles clean               5/5         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ SECURITY ISSUES ──────────────────────────┐     │
│  │ ⚠ MEDIUM: Unrestricted mint function       │     │
│  │   contracts/MyNFT.sol:24                    │     │
│  │   Anyone can call mint(). This allows       │     │
│  │   unlimited token creation.                 │     │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ FILE COMMENTS ────────────────────────────┐     │
│  │ contracts/MyNFT.sol                         │     │
│  │   L12 💡 Consider using ERC721URIStorage    │     │
│  │   L24 🔴 Missing access control on mint()  │     │
│  │   L45 💡 _safeMint is preferred over _mint  │     │
│  │                                             │     │
│  │ test/MyNFT.test.js                          │     │
│  │   L8  ✅ Good: tests deployment correctly   │     │
│  │   L30 🔴 Missing: no transfer test case     │     │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌───────────────────────────────────────┐          │
│  │         SUBMIT AGAIN (3 left)        │          │
│  └───────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

---

## 11. Difficulties & Mitigations

| Difficulty                        | Impact                                     | Mitigation                                                                 |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| **LLM scoring inconsistency**     | Same code gets different scores on re-run  | `temperature: 0`, binary pass/fail criteria, pin to commit SHA for caching |
| **Private repos**                 | Can't fetch code                           | Phase 1: public only. Phase 2: GitHub OAuth via Better Auth                |
| **Students gaming the system**    | Resubmit same code hoping for better score | Cache by `commitSha` — identical code returns cached review                |
| **Large repos exceeding context** | Token overflow or high cost                | Only fetch `expectedFiles`, skip binaries and `node_modules`               |
| **GitHub API rate limits**        | 5,000 req/hr                               | ~22 requests per review = ~227 reviews/hr. Sufficient.                     |
| **Batch API delays**              | Sometimes >30 min                          | Set expectation in UI. Show elapsed time. Allow page navigation.           |
| **Malicious repo content**        | Prompt injection via code comments         | Sanitize system prompt boundaries. Review only code, not markdown/README.  |
| **Cost spikes**                   | Unexpected token usage                     | Set `max_tokens` on LLM call. Log token usage per review. Set alerts.      |

---

## 12. Implementation Phases

### Phase 1 — MVP (Target: 1-2 weeks)

- [ ] Add `reviewRubric`, `expectedFiles`, `templateRepo`, `maxReviewAttempts` fields to Lessons collection in Payload
- [ ] Create `project_reviews` table in backend DB schema
- [ ] Implement `github.service.ts` — fetch repo files via GitHub REST API
- [ ] Implement `prompt.builder.ts` — assemble prompt from rubric + code
- [ ] Implement `llm.service.ts` — submit to OpenAI Batch API
- [ ] Implement `review.poller.ts` — background polling for batch results
- [ ] Add API routes: `POST /submit-project`, `GET /review`, `GET /review/history`
- [ ] Update `ProjectSubmission` component with pending/completed states
- [ ] Build review results UI component
- [ ] Add attempt tracking and limits

### Phase 2 — Enhancements

- [ ] GitHub OAuth integration (Better Auth) for private repos
- [ ] Multi-pass deep review pipeline
- [ ] Real-time status updates via WebSocket/SSE (replace polling)
- [ ] Email notifications when review completes
- [ ] Review comparison view (diff between attempts)
- [ ] Admin dashboard for review analytics (avg scores, common failures, cost tracking)

### Phase 3 — Advanced

- [ ] Sandboxed test execution via E2B (run Hardhat/Foundry tests against student code)
- [ ] Combine automated test results with LLM review
- [ ] Plagiarism detection (compare submissions across students)
- [ ] Template repo auto-creation for students (GitHub Classroom-style)
- [ ] Student-initiated re-review ("I disagree with this criterion" → escalate to better model)

---

## 13. Environment Variables (New)

Add to `apps/backend/.env`:

```bash
# GitHub
GITHUB_TOKEN=ghp_...                  # GitHub PAT for repo API access

# OpenAI
OPENAI_API_KEY=sk-...                 # OpenAI API key for code review

# Review config
REVIEW_LLM_MODEL=gpt-4.1             # Default model for reviews
REVIEW_BATCH_ENABLED=true             # Use Batch API (async) vs standard (sync)
REVIEW_MAX_FILE_LINES=500             # Max lines per file to send to LLM
REVIEW_POLL_INTERVAL_MS=60000         # How often to poll for batch results
```

---

## 14. Dependencies to Add

```bash
# apps/backend
yarn add openai                       # OpenAI SDK (Batch API)
yarn add @octokit/rest                # GitHub REST API client
```

No new dependencies needed for `apps/web` or `apps/admin`.
