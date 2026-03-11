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
    const code = err.statusCode as 400 | 401 | 403 | 404 | 500
    return c.json({ error: err.message }, code)
  }
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
