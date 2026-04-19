import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { openAPIRouteHandler } from 'hono-openapi'
import { cors } from 'hono/cors'
import { healthCheckDesc } from './descriptions/root'
import authApp from './services/auth/auth.routes'
import coursesApp from './services/courses/courses.routes'
import lessonsApp from './services/lessons/lessons.routes'
import userApp from './services/user/user.routes'
import reviewApp from './services/review/review.routes'
import communityApp from './services/community/community.routes'
import certificatesApp from './services/certificates/certificates.routes'
import adminApp from './services/admin/admin.routes'
import { AppError } from './lib/errors'

const port = Number(process.env.PORT) || 3001
const backendOrigin = `http://localhost:${port}`

const app = new Hono({ strict: false })

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message, ...(err.extra ?? {}) }, err.statusCode as Parameters<typeof c.json>[1])
  }

  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// CORS configuration for auth route
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:8787', 'https://redduck-academy.jeleika.com'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

app.route('/', authApp)
app.route('/api/courses', coursesApp)
app.route('/api/lessons', lessonsApp)
app.route('/api/user', userApp)
app.route('/api/review', reviewApp)
app.route('/api/community', communityApp)
app.route('/api/certificates', certificatesApp)
app.route('/api/admin', adminApp)

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

console.log(`Server is running on ${backendOrigin}`)

serve({
  fetch: app.fetch,
  port,
})

export default app
