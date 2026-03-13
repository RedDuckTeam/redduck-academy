import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { openAPIRouteHandler } from 'hono-openapi'
import { cors } from 'hono/cors'
import { healthCheckDesc } from './descriptions/root'
import authApp from './routes/auth'
import coursesApp from './routes/courses'
import userApp from './routes/user'

const app = new Hono({ strict: false })

app.get('/', healthCheckDesc, (c) => {
  return c.text('Hello Hono!')
})

// CORS configuration for auth routes
app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

app.route('/', authApp)
app.route('/api/courses', coursesApp)
app.route('/api/user', userApp)

app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Hono API',
        version: '1.0.0',
        description: 'Greeting API',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local Server' }],
    },
  }),
)

const port = Number(process.env.PORT) || 3001

console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

export default app
