# RedDuck Academy — Architecture

> Internal learning platform for RedDuck Software.
> This document describes the current state, planned features, and architectural decisions.
> Use it as context when working with AI agents on this codebase.

---

## 1. Project Overview

A learning platform where employees complete structured courses consisting of modules and lessons. The platform supports Web3 wallet authentication alongside traditional OAuth, and tracks user progress through courses.

### Lesson Types

Each lesson in a module is one of four types:

| Type | Description | Content Format |
|---|---|---|
| **Lecture** | SEO-optimized reading material with rich text, images, code blocks | MDX / Rich Text |
| **Test** | Multiple-choice quiz (a, b, c, d). Auto-graded | JSON (question + options + correct answer) |
| **Coding Task** | LeetCode-style problem with code editor, tests, and validation | MDX description + test suite config |
| **Review Task** | Large open-ended task submitted for AI review | MDX description + rubric / acceptance criteria |

---

## 2. Monorepo Structure

```
redduck-academy/
├── apps/
│   ├── web/              # Frontend — TanStack Start (React 19)
│   ├── backend/          # API server — Hono (single API for the frontend)
│   └── admin/            # CMS admin — Next.js + Payload CMS 3
├── package.json          # Yarn 4 workspaces
└── yarn.lock
```

No shared packages yet. Each app is independent.

---

## 3. Tech Stack

### `apps/web` — Frontend

| Concern | Technology |
|---|---|
| Framework | TanStack Start (React 19, SSR) |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v4 |
| Auth (client) | Better Auth client |
| Wallet | Wagmi 3 + Viem 2 + Reown AppKit |
| Content rendering | Payload Lexical React serializer (for rich text from DB) |
| Build | Vite 7 |
| Deployment | Cloudflare Pages (via Wrangler) |
| UI primitives | Radix UI, Lucide icons, Sonner toasts |

### `apps/backend` — API Server

| Concern | Technology |
|---|---|
| Framework | Hono 4 |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | Better Auth (Google OAuth + SIWE) |
| Validation | Zod |
| API docs | OpenAPI via hono-openapi |
| Runtime | Node.js (@hono/node-server) |

### `apps/admin` — Content Admin (Payload CMS 3)

| Concern | Technology |
|---|---|
| Framework | Next.js (App Router) — required by Payload |
| CMS | Payload CMS 3 |
| Database | PostgreSQL (shared with `apps/backend`) |
| Rich text editor | Lexical (Payload built-in) |
| File storage | Cloudflare R2 (via Payload S3 plugin) |
| Deployment | Vercel |

> **Important**: Payload CMS 3 requires Next.js for its admin panel and API routes.
> The admin panel is an internal tool used only by content editors — it is NOT the user-facing frontend.
> The user-facing frontend (`apps/web`) runs on TanStack Start and communicates exclusively with the Hono backend.

---

## 4. Current Data Model

### Database (PostgreSQL via Drizzle)

Currently only Better Auth tables exist:

- `user` — id, name, email, emailVerified, image, timestamps
- `session` — id, expiresAt, token, userId, ipAddress, userAgent
- `account` — OAuth provider accounts (Google, SIWE)
- `verification` — email verification tokens
- `wallet_address` — userId, address, chainId, isPrimary

**No course/lesson/progress tables exist yet.** Content is currently file-based only.

### Content (File-based)

Courses are MDX files at `apps/web/src/content/courses/*.mdx` with YAML frontmatter:

```yaml
title: Course Title
modules:
  - title: { name: "Module Name", slug: "module-slug" }
    lessons:
      - title: { name: "Lesson Name", slug: "lesson-slug" }
        content: "inline content or reference"
        links:
          - title: "Link Title"
            url: "https://..."
```

Loaded at build time via `import.meta.glob` and parsed with `gray-matter`.

### TypeScript Types (current)

```typescript
interface ParsedCourse {
  slug: string
  title: string
  description: string
  modules: CourseModule[]
}

interface CourseModule {
  id: number
  title: { name: string; slug: string }
  lessons: CourseLecture[]
}

interface CourseLecture {
  id: number
  title: { name: string; slug: string }
  content: string
  links: LectureLink[]
}
```

---

## 5. Authentication & Authorization

- **Better Auth** on the backend (`apps/backend`)
- **Sign-in methods**: Google OAuth, SIWE (Sign-In with Ethereum)
- Anonymous SIWE is enabled (wallet-first flow)
- Client uses `@better-auth/client` in the web app
- Session tokens stored in cookies
- CORS configured for `http://localhost:3000` (dev)

---

## 6. Deployment

| App | Platform |
|---|---|
| `apps/web` | Cloudflare Pages |
| `apps/backend` | Node.js server (TBD hosting) |
| `apps/admin` | Vercel |

---

## 7. CMS Decision: Payload CMS 3

### Why Not Keystatic (Previous Approach)

1. **No database connection** — Keystatic stores content as files in Git. Keeping files and DB in sync is fragile.
2. **No R2 / S3 image upload** — only local files or GitHub-hosted images.
3. **Only one content type** — no support for structured data like tests, coding tasks, or review rubrics.
4. **Two content directories** — `apps/lecture-admin/src/content/` and `apps/web/src/content/` needed manual syncing.

### Why Payload CMS 3

- **Content in PostgreSQL** — no file/DB sync problem. Single source of truth.
- **S3/R2 plugin** — native support for Cloudflare R2 image uploads.
- **Polymorphic collections** — can model all 4 lesson types (lecture, test, coding task, review task) with conditional fields.
- **Lexical rich text editor** — built-in, supports custom blocks, embeds, and code blocks.
- **TypeScript-first** — type generation from schema for type-safe API consumption.
- **Access control** — built-in roles and permissions for admin users.
- **Open-source, self-hosted** — no vendor lock-in.

### Payload's Relationship to Next.js

Payload CMS 3 requires Next.js **only for the admin panel and its own API routes**. It cannot run on Hono, Express, or other frameworks natively. The admin panel (editing UI, REST API, GraphQL) is a Next.js app deployed separately.

---

## 8. Architecture — Shared Database Pattern

### Core Principle

Payload CMS and the Hono backend share **the same PostgreSQL database**. Payload writes content (courses, lessons, media). Hono reads that content and also manages user-specific data (auth, progress, submissions). The web frontend only talks to Hono — it never calls Payload's API directly.

```
                  ┌───────────────────┐
                  │  apps/admin       │
                  │  Payload CMS      │
                  │  (Next.js)        │
                  │                   │
                  │  Used by editors  │
                  │  to manage content│
                  │                   │
                  │  Vercel           │
                  └─────────┬─────────┘
                            │ writes content
                            ▼
┌──────────────────┐  ┌─────────────────────────────────────┐
│  apps/web        │  │            PostgreSQL                │
│  TanStack Start  │  │                                     │
│                  │  │  Payload-managed tables:             │
│  User-facing     │  │    courses, modules, lessons,       │
│  frontend        │  │    media, test_questions,            │
│                  │  │    coding_tasks, review_tasks        │
│  Cloudflare      │  │                                     │
│  Pages           │  │  Hono-managed tables:                │
│                  │  │    user, session, account,           │
└────────┬─────────┘  │    wallet_address, user_progress,   │
         │            │    code_submissions,                 │
         │            │    review_submissions                │
         │            └──────────────────┬──────────────────┘
         │                               ▲
         │  all requests                 │ reads content + writes user data
         │                               │
         │            ┌──────────────────┴──────────────────┐
         └───────────▶│  apps/backend                       │
                      │  Hono API                           │
                      │                                     │
                      │  Single API for the frontend:       │
                      │  - Auth (Better Auth)               │
                      │  - Content (reads Payload tables)   │
                      │  - User progress & submissions      │
                      │                                     │
                      │  Node.js server                     │
                      └─────────────────────────────────────┘

                      ┌─────────────────────────────────────┐
                      │           Cloudflare R2              │
                      │  Images & assets uploaded via        │
                      │  Payload S3 plugin. Served via       │
                      │  public R2 URL / CDN.                │
                      └─────────────────────────────────────┘
```

### Why This Pattern

- **Single API surface** — The frontend only talks to Hono. No juggling two base URLs.
- **No content sync** — Payload writes to the same DB that Hono reads. No webhooks, no file sync, no eventual consistency.
- **Clean separation** — Payload owns the editing experience. Hono owns the user-facing API. They share data through PostgreSQL.
- **Hono stays lean** — Hono reads Payload's tables with Drizzle (read-only for content). It writes to its own tables for auth/progress.

### Data Flow

1. **Admin creates content** → Payload CMS writes to PostgreSQL + uploads images to R2
2. **User browses courses** → Web app calls Hono API → Hono reads Payload's content tables via Drizzle
3. **User completes a lesson** → Web app calls Hono API → Hono writes progress to `user_progress` table
4. **User submits a test** → Hono validates answers against `test_questions` table → writes result
5. **User submits code** → Hono runs tests (or calls external judge) → stores result in `code_submissions`
6. **User submits review task** → Hono sends to AI for review → stores feedback in `review_submissions`

### Drizzle Schema Strategy

Payload auto-generates database tables from its collections config. The Hono backend needs Drizzle schema definitions that match those tables for read access. Two approaches:

1. **Mirror Payload's tables in Drizzle** — Manually define Drizzle schemas that match Payload's generated table structure. Keep them in sync when Payload collections change.
2. **Use Payload's generated types** — Payload generates TypeScript types from its config. Import these in a shared package and use them to type Hono's raw SQL queries.

Approach 1 is recommended for now (explicit Drizzle schemas) because it keeps the Hono backend self-contained and avoids importing Payload as a dependency.

### Proposed Database Schema

Payload manages content tables (auto-generated from collections config). Hono manages user tables. Both live in the same PostgreSQL database.

**Payload collections** (defined in `apps/admin/payload.config.ts`):
- `courses` — slug, title, description, coverImage
- `modules` — courseId, slug, title, order
- `lessons` — moduleId, slug, title, type (discriminator), order
- `media` — R2 file references (handled by Payload S3 plugin)
- `test-questions` — lessonId, question, options, correctOptionId, order
- `coding-tasks` — lessonId, description, language, boilerplate, testSuite
- `review-tasks` — lessonId, description, rubric, maxScore

**Hono-managed tables** (defined in `apps/backend/src/db/schema.ts` via Drizzle):

```typescript
// Auth tables (already exist — managed by Better Auth)
// user, session, account, verification, wallet_address

// Content tables (read-only mirrors of Payload's tables — for Drizzle type safety)
export const course = pgTable("course", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"), // R2 URL
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const module = pgTable("module", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => course.id),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const lesson = pgTable("lesson", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => module.id),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "lecture" | "test" | "coding_task" | "review_task"
  order: integer("order").notNull(),
  // Type-specific content stored in related tables
});

export const lectureContent = pgTable("lecture_content", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lesson.id),
  body: text("body").notNull(), // Rich text / HTML from editor
});

export const testQuestion = pgTable("test_question", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lesson.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // [{id, label}]
  correctOptionId: text("correct_option_id").notNull(),
  order: integer("order").notNull(),
});

export const codingTask = pgTable("coding_task", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lesson.id),
  description: text("description").notNull(), // Rich text
  language: text("language").notNull(), // "typescript" | "rust" | "solidity" etc.
  boilerplate: text("boilerplate").notNull(),
  testSuite: text("test_suite").notNull(), // Test code to validate submission
});

export const reviewTask = pgTable("review_task", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lesson.id),
  description: text("description").notNull(), // Rich text
  rubric: text("rubric").notNull(), // Criteria for AI review
  maxScore: integer("max_score").default(100),
});

// User progress tables
export const userProgress = pgTable("user_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  lessonId: text("lesson_id").notNull().references(() => lesson.id),
  status: text("status").notNull(), // "not_started" | "in_progress" | "completed"
  score: integer("score"),
  completedAt: timestamp("completed_at"),
});

export const codeSubmission = pgTable("code_submission", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  lessonId: text("lesson_id").notNull().references(() => lesson.id),
  code: text("code").notNull(),
  passed: boolean("passed").default(false),
  output: text("output"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const reviewSubmission = pgTable("review_submission", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  lessonId: text("lesson_id").notNull().references(() => lesson.id),
  submission: text("submission").notNull(),
  aiFeedback: text("ai_feedback"),
  aiScore: integer("ai_score"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
```

---

## 10. Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| CMS | Payload CMS 3 | Solves DB sync, R2 uploads, polymorphic lessons |
| Database | Single shared PostgreSQL | Payload writes content, Hono reads it. No sync needed |
| Content delivery | Hono reads Payload tables via Drizzle | Single API for the frontend. No direct Payload API calls from web |
| Admin framework | Next.js (required by Payload) | Admin is a separate internal app. Does not affect the frontend |

## 11. Key Decisions Still Needed

| Decision | Options | Notes |
|---|---|---|
| Code execution | Self-hosted judge (Docker sandbox) vs external service (Judge0) | Depends on security/cost requirements |
| AI review | OpenAI API vs self-hosted LLM | Cost vs privacy tradeoff |
| Frontend rich text rendering | Payload's Lexical serializer vs custom React renderer | Payload provides `@payloadcms/richtext-lexical` with a React serializer |
| SEO for lectures | SSR via TanStack Start (already configured) | Already supported — just need proper meta tags |
| Payload table naming | Match Drizzle conventions or use Payload defaults | Payload allows custom `dbName` on collections to control table names |

---

## 12. Environment & Configuration

### Environment Variables

**Backend** (`apps/backend`):
- `DATABASE_URL` — PostgreSQL connection string (shared with Payload)
- `BETTER_AUTH_SECRET` — Auth secret
- `BETTER_AUTH_URL` — Auth callback URL
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth

**Admin** (`apps/admin`):
- `DATABASE_URI` — Same PostgreSQL connection string
- `PAYLOAD_SECRET` — Payload encryption key
- `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_ENDPOINT` — Cloudflare R2 credentials
- `S3_REGION` — R2 region (typically `auto`)

**Web** (`apps/web`):
- `VITE_API_URL` — Hono backend API URL (single API for all frontend needs)
- `VITE_APP_URL` — Frontend URL

### Build & Dev

```bash
# Root
yarn install                    # Install all workspaces

# Per-app
cd apps/web && yarn dev         # TanStack Start dev server
cd apps/backend && yarn dev     # Hono dev server (tsx watch)
cd apps/admin && yarn dev       # Payload CMS admin (Next.js)
```

---

## 13. File Conventions

- **Routes**: File-based in `apps/web/src/routes/` (TanStack Router)
- **Components**: `apps/web/src/components/` — `ui/` for primitives, `pages/` for route-level, `common/` for shared
- **Types**: `apps/web/src/types/`
- **DB schema**: `apps/backend/src/db/` (auth tables + read-only mirrors of Payload tables)
- **API routes**: `apps/backend/src/` (Hono route handlers)
- **Payload config**: `apps/admin/payload.config.ts` (collections, fields, uploads)
- **Content**: Stored in PostgreSQL (managed by Payload). Legacy MDX files in `apps/web/src/content/` to be removed
