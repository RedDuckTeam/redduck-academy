# Deployment Guide — RedDuck Academy

## Overview

| App | Framework | Hosting target | Port |
|-----|-----------|---------------|------|
| `apps/web` | TanStack Start (Vite + React 19) | Cloudflare Pages | 3000 |
| `apps/backend` | Hono 4 (Node.js) | Any Node host (Railway / Render / Fly.io) | 8787 |
| `apps/admin` | Next.js 15 + Payload CMS 3 | Vercel | 3001 |

All three apps share one **PostgreSQL** database. Media is stored in **Cloudflare R2**.

---

## 1. Prerequisites

### Required services to provision before deploying

| Service | Purpose |
|---------|---------|
| PostgreSQL 15+ | Primary database (shared by all apps) |
| Cloudflare R2 bucket | Media uploads |
| Google OAuth app | Sign-in with Google |
| OpenAI API key | AI code/project review |
| GitHub Personal Access Token | Fetch student repo files for review |

### Tool versions
- **Node.js** 20+
- **Yarn** 4.9.2 — `corepack enable && corepack prepare yarn@4.9.2 --activate`

---

## 2. Environment Variables

### apps/backend

Create `apps/backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Better Auth
BETTER_AUTH_SECRET=<random 32+ byte base64 string>
BETTER_AUTH_URL=https://api.yourdomain.com/api/auth

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Payload (must match apps/admin)
PAYLOAD_SECRET=<random 32+ byte string>

# Integrations
OPENAI_API_KEY=
GITHUB_TOKEN=<PAT with Contents + Metadata read>

# Server
PORT=8787
```

### apps/admin

Create `apps/admin/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
PAYLOAD_SECRET=<same value as backend>

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
R2_BUCKET=redduck-media
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

### apps/web

Create `apps/web/.env`:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_URL=https://yourdomain.com
```

### packages/payload-config

Create `packages/payload-config/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
PAYLOAD_SECRET=<same value as backend and admin>
```

---

## 3. Service Setup

### PostgreSQL

Any managed PostgreSQL works (Supabase, Neon, Railway, RDS, etc.).

```bash
# After provisioning, set DATABASE_URL in all three .env files.
# Migrations are applied in the Database Setup step below.
```

### Cloudflare R2

1. Go to **Cloudflare Dashboard → R2 → Create Bucket**
2. Note the bucket name → `R2_BUCKET`
3. **Account ID** is in the URL and sidebar → `CLOUDFLARE_ACCOUNT_ID`
4. Go to **R2 → Manage R2 API Tokens → Create Token** (Object Read & Write)
   - Copy Access Key ID → `R2_ACCESS_KEY_ID`
   - Copy Secret Access Key → `R2_SECRET_ACCESS_KEY`
5. Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` → `R2_ENDPOINT`
6. For the public URL, either:
   - Enable **R2 Public Access** on the bucket → copy the `pub-*.r2.dev` URL
   - Or configure a custom domain → use that URL
   - Set as `R2_PUBLIC_URL` (no trailing slash)

### Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use existing)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Application type: **Web application**
5. Add authorized redirect URIs:
   - `https://api.yourdomain.com/api/auth/callback/google`
   - `http://localhost:8787/api/auth/callback/google` (dev)
6. Copy Client ID → `GOOGLE_CLIENT_ID`
7. Copy Client Secret → `GOOGLE_CLIENT_SECRET`

### GitHub Personal Access Token

1. Go to **GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens**
2. Permissions needed:
   - **Contents**: Read
   - **Metadata**: Read
3. Copy the token → `GITHUB_TOKEN`

### OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key → `OPENAI_API_KEY`
3. The backend uses **GPT-4.1** — ensure your account has access.

### Better Auth Secret

Generate a secure random string:

```bash
openssl rand -base64 32
```

Use the same value for `BETTER_AUTH_SECRET`.

---

## 4. Database Setup

Run once before first deploy (and after each schema change).

```bash
# Install dependencies
yarn install

# 1. Apply Drizzle migrations (Better Auth + user progress tables)
cd apps/backend
yarn db:push

# 2. Payload CMS tables are created automatically on first admin boot.
#    No manual step needed.

# If you add new Payload collections or fields later:
cd apps/admin
yarn payload migrate:create   # generate migration
yarn payload migrate          # apply migration
```

---

## 5. Generate Payload Config

Run after any change to `packages/payload-config/src/collections/` or before first build:

```bash
# From repo root
yarn payload-config:generate
```

This regenerates:
- `packages/payload-config/src/payload-types.ts`
- `packages/payload-config/src/payload-generated-schema.ts`

---

## 6. Deploying apps/backend

### Build & run

```bash
cd apps/backend
yarn build          # compiles TypeScript → dist/
yarn start          # node dist/index.js
```

### Railway / Render / Fly.io

- **Build command**: `yarn install && yarn backend:build`
- **Start command**: `node apps/backend/dist/index.js`
- **Port**: set `PORT` env var (default `8787`)
- Set all backend environment variables in the platform dashboard.

### Updating CORS & Auth origins

After setting your production URLs, update two places in source:

**`apps/backend/src/lib/auth.ts`** — add your frontend URL:
```ts
trustedOrigins: ['https://yourdomain.com'],
```

**`apps/backend/src/index.ts`** — add your frontend URL to CORS:
```ts
origin: ['https://yourdomain.com'],
```

---

## 7. Deploying apps/admin (Vercel)

### Via Vercel CLI

```bash
npm i -g vercel

cd apps/admin
vercel login
vercel --prod
```

### Via GitHub Actions (CI/CD)

The workflow at `.github/workflows/` can be adapted. Set these secrets in GitHub:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |

### First visit

1. Navigate to `https://admin.yourdomain.com/admin`
2. Payload will prompt you to create the first admin user.
3. After login, create courses, modules, and lessons via the admin UI.

### Build notes

- Requires `NODE_OPTIONS=--max-old-space-size=8000` (already in `package.json` build script)
- Output mode is `standalone` — compatible with Docker and Vercel

### Docker (optional)

A `Dockerfile` is available at `apps/admin/Dockerfile` (Node 22.17.0-alpine, multi-stage):

```bash
cd apps/admin
docker build -t redduck-admin .
docker run -p 3001:3001 --env-file .env redduck-admin
```

---

## 8. Deploying apps/web (Cloudflare Pages)

### Build

```bash
cd apps/web
yarn build     # outputs to dist/
```

### Deploy via Wrangler

```bash
yarn deploy    # runs: yarn build && wrangler deploy
```

### Via Cloudflare Dashboard

1. Go to **Cloudflare Pages → Create a project → Connect to Git**
2. Select the repository
3. **Build settings**:
   - Framework preset: None
   - Build command: `cd apps/web && yarn build`
   - Build output directory: `apps/web/dist`
4. Add environment variables: `VITE_API_URL`, `VITE_APP_URL`

---

## 9. Full Deploy Sequence (first time)

```bash
# 1. Install
yarn install

# 2. Provision PostgreSQL, R2, Google OAuth, OpenAI, GitHub PAT
#    Fill in all .env files (sections 2-3 above)

# 3. Generate Payload schema
yarn payload-config:generate

# 4. Apply database migrations
cd apps/backend && yarn db:push && cd ../..

# 5. Deploy backend first (get the URL)
#    e.g. https://api.yourdomain.com
#    Update BETTER_AUTH_URL, CORS, trustedOrigins

# 6. Deploy admin
cd apps/admin && vercel --prod && cd ../..

# 7. Create first Payload admin user at https://admin.yourdomain.com/admin

# 8. Add content (courses, modules, lessons) via admin UI

# 9. Deploy web (set VITE_API_URL to backend URL)
cd apps/web && yarn deploy
```

---

## 10. Schema Changes Workflow

### Adding a field to a Payload collection

```bash
# 1. Edit packages/payload-config/src/collections/<Name>.ts

# 2. Regenerate types and schema
yarn payload-config:generate

# 3. Create and apply Payload migration
cd apps/admin
yarn payload migrate:create
yarn payload migrate

# 4. If you also need to extend payload-schema-extended.ts,
#    add the new export from payload-generated-schema.ts there.
```

### Adding a backend-only table (Drizzle)

```bash
# 1. Edit apps/backend/src/db/schema.ts

# 2. Generate migration
cd apps/backend
yarn db:generate

# 3. Apply migration
yarn db:push
```

---

## 11. Wallet Authentication (SIWE)

Sign-In with Ethereum is enabled via `better-auth/plugins/siwe` and `wagmi`.

- No backend credentials needed — message signing is handled client-side.
- **Production**: update the `domain` in `apps/backend/src/lib/auth.ts`:
  ```ts
  siwe({ domain: 'yourdomain.com', ... })
  ```
- **Reown AppKit** project ID is set in `apps/web/src/constants/wallet-config.ts`.
  The current ID `4c4c2a7f33e1d9a1294e20812d929a59` is for `redduck.academy`.
  If deploying under a different domain, create a new project at [cloud.reown.com](https://cloud.reown.com).

---

## 12. Checklist

```
Infrastructure
[ ] PostgreSQL database created + DATABASE_URL set in all three apps
[ ] Cloudflare R2 bucket created + all R2_* vars set
[ ] Google OAuth app created + GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET set
[ ] GitHub PAT created + GITHUB_TOKEN set
[ ] OpenAI API key created + OPENAI_API_KEY set
[ ] BETTER_AUTH_SECRET generated (32+ bytes)
[ ] PAYLOAD_SECRET generated (same value in backend, admin, payload-config)

Code
[ ] yarn payload-config:generate run after last collection change
[ ] BETTER_AUTH_URL set to production backend URL
[ ] trustedOrigins in auth.ts updated to production frontend URL
[ ] CORS origins in index.ts updated to production frontend URL
[ ] SIWE domain updated to production domain

Database
[ ] yarn db:push run (Drizzle migrations applied)
[ ] First admin user created at /admin

Deployment
[ ] Backend deployed + health check passes (GET /)
[ ] Admin deployed + /admin loads
[ ] First admin user created, content added
[ ] Web deployed + VITE_API_URL points to production backend
[ ] Sign in with Google works
[ ] Sign in with wallet works
[ ] Media uploads work (R2)
[ ] Lesson content displays correctly
```
