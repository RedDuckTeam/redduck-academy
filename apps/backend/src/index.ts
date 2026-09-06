import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { openAPIRouteHandler } from 'hono-openapi'
import { bodyLimit } from 'hono/body-limit'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { rateLimit } from './lib/rate-limit'
import authApp from './services/auth/auth.routes'
import coursesApp from './services/courses/courses.routes'
import lessonsApp from './services/lessons/lessons.routes'
import userApp from './services/user/user.routes'
import reviewApp from './services/review/review.routes'
import communityApp from './services/community/community.routes'
import certificatesApp from './services/certificates/certificates.routes'
import adminApp from './services/admin/admin.routes'
import proposalsApp from './services/proposals/proposals.routes'
import { AppError, GENERIC_ERROR_MESSAGE } from './lib/errors'
import { Logger } from './lib/logger'
import { env } from './env'
import { isAllowedOrigin, parseAllowedOrigins } from './lib/allowed-origins'
import { installProcessLifecycle } from './lib/process-lifecycle'

const port = Number(process.env.PORT) || 3001
const backendOrigin = `http://localhost:${port}`
const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS)

const app = new Hono({ strict: false })
const rootLogger = new Logger('HonoApp')

// Process-level safety net + graceful shutdown (see lib/process-lifecycle.ts).
// Registered before the server binds so stray async errors can't crash the
// single web process. See RESILIENCE-AUDIT.md → C1.
const lifecycle = installProcessLifecycle(rootLogger)

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message, ...(err.extra ?? {}) }, err.statusCode as Parameters<typeof c.json>[1])
  }

  rootLogger.error('Unhandled error', err, { method: c.req.method, path: c.req.path })
  return c.json({ error: GENERIC_ERROR_MESSAGE }, 500)
})

// CORS configuration for auth route
app.use(
  '/api/*',
  cors({
    origin: (origin) => (origin && isAllowedOrigin(origin, allowedOrigins) ? origin : null),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

app.use('/api/*', compress())

// 1000 req/min per key per dyno.
app.use('/api/*', rateLimit({ windowMs: 60_000, max: 1000 }))

// 5MB request body cap.
app.use(
  '/api/*',
  bodyLimit({
    maxSize: 5 * 1024 * 1024,
    onError: (c) => c.json({ error: 'Request body too large' }, 413),
  }),
)

app.get('/healthz', (c) => c.json({ ok: true }))

app.route('/', authApp)
app.route('/api/courses', coursesApp)
app.route('/api/lessons', lessonsApp)
app.route('/api/user', userApp)
app.route('/api/review', reviewApp)
app.route('/api/community', communityApp)
app.route('/api/certificates', certificatesApp)
app.route('/api/admin', adminApp)
app.route('/api/proposals', proposalsApp)

if (env.NODE_ENV !== 'production') {
  app.get(
    '/openapi',
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: 'Hono API',
          version: '1.0.0',
          description: 'Redduck Academy backend API',
        },
        servers: [
          { url: backendOrigin, description: 'Backend (this server)' },
          { url: 'http://localhost:3000', description: 'Web app origin (if proxied)' },
        ],
      },
    }),
  )

  /** Swagger-like UI: GET /docs on this server (spec URL uses PORT from env). */
  app.get('/docs', (c) => {
  const specUrl = `${backendOrigin}/openapi`
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>API docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" crossorigin />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    SwaggerUIBundle({
      url: ${JSON.stringify(specUrl)},
      dom_id: '#swagger-ui',
    });
  </script>
</body>
</html>`)
  })
}

console.log(`Server is running on ${backendOrigin}`)

const server = serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
})

lifecycle.setServer(server)

export default app
