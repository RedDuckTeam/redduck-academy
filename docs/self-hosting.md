# Running & self-hosting RedDuck Academy

This is the operations guide for running the full academy stack locally or deploying your
own copy. **To contribute lecture content you don't need any of this** — see
[`content/README.md`](../content/README.md).

RedDuck Academy is a monorepo with three deployable apps:

| App | Stack | Hosting | Workflow |
|---|---|---|---|
| `apps/web` | TanStack Start + Vite | Cloudflare Workers | `.github/workflows/deploy-web.yml` |
| `apps/backend` | Hono (Node) | Heroku | `.github/workflows/deploy-backend.yml` |
| `apps/admin` | Next.js + Payload CMS | Vercel | `.github/workflows/deploy-admin.yml` |

All apps share one **PostgreSQL** database. Media is stored in **Cloudflare R2**.

Package manager is **yarn 4** (workspaces). Use `corepack enable` once.

---

## 1. Prerequisites

Provision these before deploying:

- **PostgreSQL 15+** (Supabase, Neon, Railway, RDS — any managed Postgres)
- **Cloudflare R2** bucket + API token
- **Google OAuth** client (web app type)
- **OpenAI API** key (used for AI code review)
- **GitHub PAT** with `Contents: Read` and `Metadata: Read` (used to fetch student repos)
- **Heroku** app + API key
- **Vercel** project + token
- **Cloudflare** account + API token (for Workers)

Generate secrets with:

```bash
openssl rand -base64 32
```

You'll need values for `PAYLOAD_SECRET` and `BETTER_AUTH_SECRET`. **`PAYLOAD_SECRET` must be identical across `apps/admin` and `apps/backend`** (they share the same Payload config).

---

## 2. Environment Variables

### `apps/backend`

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://api.yourdomain.com/api/auth

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

PAYLOAD_SECRET=          # same value as admin

OPENAI_API_KEY=
GITHUB_TOKEN=

PORT=8787
```

### `apps/admin`

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PAYLOAD_SECRET=          # same value as backend

R2_BUCKET=redduck-media
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

### `apps/web`

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_URL=https://yourdomain.com
VITE_PRIVY_APP_ID=
VITE_CHAIN_ENV=mainnet   # or testnet
```

### `packages/payload-config` (used by CLI for type generation)

```env
DATABASE_URL=
PAYLOAD_SECRET=
```

---

## 3. Database

Payload uses a dedicated `payload` Postgres schema. The first migration creates it via `CREATE SCHEMA IF NOT EXISTS "payload"`, so a fresh database works out of the box — **no manual `CREATE SCHEMA` step needed**.

Migrations run automatically on deploy:

- **Backend** (Heroku): `release: node apps/backend/dist/migrate.js` in `Procfile`. This is a bundled migration runner (`apps/backend/src/migrate.ts`) that applies the SQL in `apps/backend/drizzle/` — it needs no `node_modules` or `drizzle-kit` at runtime (the deploy slug ships without them; see §4). It uses the same `drizzle.__drizzle_migrations` tracking table as `drizzle-kit migrate`, so it picks up exactly where local runs leave off.
- **Admin** (Vercel): `vercel.json` runs `yarn admin:db:migrate` before `next build`.

To run migrations manually:

```bash
# Backend (Drizzle — Better Auth + user progress tables)
yarn backend:db:migrate

# Admin (Payload collections)
yarn admin:db:migrate
```

When you change Payload collections or backend tables, generate a new migration:

```bash
# Payload
yarn admin:db:generate

# Drizzle (backend)
yarn backend:db:generate
```

> **Backend migrations workflow is unchanged.** `yarn backend:db:generate` writes the new SQL + `meta/_journal.json` entry into `apps/backend/drizzle/`. **Commit that folder** — it is shipped in the deploy slug and read by the bundled migrator on `release`. No other change is needed for new migrations.

After editing `packages/payload-config/src/collections/`, regenerate types:

```bash
yarn payload-config:generate
```

---

## 4. Deploy: `apps/backend` → Heroku

Deployment is push-to-deploy via `.github/workflows/deploy-backend.yml`.

**GitHub Actions secrets:**

| Secret | Value |
|---|---|
| `HEROKU_API_KEY` | from Heroku account settings |
| `HEROKU_APP_NAME` | name of your Heroku app |

**Heroku config vars** (set on the Heroku app, not GitHub):

All variables from the `apps/backend` env section above. `PORT` is set automatically by Heroku — don't override it.

| Config var | Value | Why |
|---|---|---|
| `YARN2_SKIP_PRUNING` | `true` | **Required.** `heroku-postbuild` bundles the backend and then `rm -rf`s all `node_modules` (the bundle is self-contained, so the slug drops from ~700 MB to ~60 MB — the remainder is unused workspace *source*, not deps). Without this var, the Node buildpack's post-build devDependency prune (`Pruning devDependencies → yarn heroku prune`) reinstalls everything *after* the delete, re-bloating the slug back to ~700 MB. This flag skips that step (build log shows `Skipping because YARN2_SKIP_PRUNING is 'true'`). **Set it before the deploy build starts** — config vars are snapshotted at build start, so setting it mid-build has no effect. Note: this is a **buildpack setting**, not an app runtime variable — it is intentionally not in `apps/backend/src/env.ts`. |

**Build & slug:** `git push heroku main` runs the Node buildpack: full `yarn install` → `heroku-postbuild` (esbuild bundles `apps/backend/src/index.ts` and `src/migrate.ts` into self-contained `dist/*.js`, then deletes all `node_modules`). The `Procfile` runs migrations on `release` (`node apps/backend/dist/migrate.js`) and starts the server with `node apps/backend/dist/index.js` — neither needs `node_modules`.

After your first deploy, update production URLs in source:

- `apps/backend/src/lib/auth.ts` — add your frontend URL to `trustedOrigins`
- `apps/backend/src/index.ts` — add your frontend URL to CORS `origin`
- `apps/backend/src/lib/auth.ts` — set `siwe({ domain: 'yourdomain.com', ... })`

---

## 5. Deploy: `apps/admin` → Vercel

Deployment is push-to-deploy via `.github/workflows/deploy-admin.yml`.

**GitHub Actions secrets:**

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Vercel account token |
| `VERCEL_ORG_ID` | from `.vercel/project.json` after first `vercel link` |
| `VERCEL_PROJECT_ID` | from `.vercel/project.json` |
| `PAYLOAD_SECRET` | same value as backend |
| `DATABASE_URL` | Postgres connection string |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |

> **Why these are GitHub secrets and not just Vercel env vars:** the workflow runs `vercel build` on the GitHub runner, not on Vercel's infra. Env vars marked **Sensitive** in Vercel are not decrypted by `vercel pull` to third-party CI, so the build needs them injected directly. Non-sensitive vars (`R2_ENDPOINT`, `R2_BUCKET`, `R2_PUBLIC_URL`) are fine in Vercel only.

**Vercel project env vars** (set in Vercel dashboard, used at runtime):

All variables from the `apps/admin` env section. Sensitive flag is fine — runtime decryption works on Vercel infra.

**First visit:** go to `https://admin.yourdomain.com/admin`. Payload prompts you to create the first admin user.

---

## 6. Deploy: `apps/web` → Cloudflare Workers

Deployment is push-to-deploy via `.github/workflows/deploy-web.yml`.

**GitHub Actions secrets:**

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | token with `Workers Scripts: Edit` |

**GitHub Actions variables** (`vars`, not `secrets` — these end up in the client bundle):

| Variable | Notes |
|---|---|
| `VITE_API_URL` | backend URL |
| `VITE_APP_URL` | frontend URL |
| `VITE_PRIVY_APP_ID` | Privy project ID |
| `VITE_CHAIN_ENV` | `mainnet` or `testnet` |

Worker config lives in `apps/web/wrangler.jsonc`. The workflow runs `yarn deploy` which builds and `wrangler deploy`s.

**Reown AppKit project ID** is hardcoded in `apps/web/src/constants/wallet-config.ts`. The current ID is for `redduck.academy` — create a new one at [cloud.reown.com](https://cloud.reown.com) for a different domain.

---

## 7. First-time deploy order

1. Provision Postgres, R2, Google OAuth, OpenAI key, GitHub PAT.
2. Set Heroku config vars + GitHub secrets for the backend workflow. Push to `main` (or trigger workflow). Note the deployed URL.
3. Update `BETTER_AUTH_URL`, `trustedOrigins`, CORS origins, and SIWE domain in backend source. Push again.
4. Set Vercel env vars + GitHub secrets for the admin workflow. Push.
5. Visit `/admin` on the admin URL → create first Payload admin user → add courses/modules/lessons.
6. Set Cloudflare token + GitHub vars for the web workflow. Push.
7. Verify: Google sign-in, wallet sign-in, media uploads, lessons render.

---

## 8. Local development

```bash
corepack enable
yarn install

# Generate Payload types after pulling
yarn payload-config:generate

# Run migrations locally
yarn backend:db:migrate
yarn admin:db:migrate

# Start everything (separate terminals)
yarn backend:dev   # :8787
yarn admin:dev     # :3001
yarn web:dev       # :3000
```

Each app has a `.env` (gitignored). Copy values from your dev Postgres + R2.
