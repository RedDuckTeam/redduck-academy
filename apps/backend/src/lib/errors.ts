import { StatusCode } from 'hono/utils/http-status'
import app from '..'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

// middleware
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.statusCode as StatusCode)
  }
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
