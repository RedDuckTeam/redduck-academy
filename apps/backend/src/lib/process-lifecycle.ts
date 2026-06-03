import type { serve } from '@hono/node-server'
import { client } from '../db'
import { Logger } from './logger'

/**
 * Process-level safety net + graceful shutdown.
 *
 * Hono's `app.onError` only catches errors thrown *inside* a request's promise
 * chain. Anything that escapes it — a floating promise that rejects, a timer
 * callback, a stream/socket 'error' event, an SDK background task — surfaces at
 * the process level. Without these handlers a single stray async error would
 * take down the whole (single) web process. See RESILIENCE-AUDIT.md → C1.
 *
 * Usage (in index.ts):
 *
 *   const lifecycle = installProcessLifecycle(rootLogger)
 *   const server = serve({ ... })
 *   lifecycle.setServer(server)
 *
 * Handlers are registered immediately so the safety net is live even before the
 * HTTP server finishes binding; `setServer` just lets graceful shutdown close
 * the listener once it exists.
 */

type Server = ReturnType<typeof serve>

export interface ProcessLifecycle {
  /** Attach the HTTP server so shutdown can stop accepting new connections. */
  setServer: (server: Server) => void
}

const FORCE_EXIT_MS = 10_000
const DB_DRAIN_TIMEOUT_S = 5

export function installProcessLifecycle(logger: Logger): ProcessLifecycle {
  let server: Server | undefined
  let shuttingDown = false

  // Graceful shutdown: stop accepting new connections, drain the Postgres pool,
  // then exit. Heroku sends SIGTERM on every deploy / dyno-cycle, so this runs
  // often — it must be idempotent and must never hang forever.
  async function shutdown(signal: string, exitCode = 0): Promise<void> {
    if (shuttingDown) return
    shuttingDown = true
    logger.error(`Received ${signal} — starting graceful shutdown`)

    // Hard cap: if draining stalls, force-exit so a deploy can't wedge forever.
    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit')
      process.exit(exitCode)
    }, FORCE_EXIT_MS)
    forceExit.unref()

    try {
      await new Promise<void>((resolve) => {
        if (!server) return resolve()
        server.close(() => resolve())
      })
      // `timeout` lets in-flight queries finish briefly before sockets close.
      await client.end({ timeout: DB_DRAIN_TIMEOUT_S })
    } catch (err) {
      logger.error('Error during graceful shutdown', err)
    } finally {
      clearTimeout(forceExit)
      process.exit(exitCode)
    }
  }

  // A rejected promise that nobody awaited. The process is NOT in a corrupt
  // state, so the safe move is to log loudly and keep serving everything else.
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection (kept process alive)', reason)
  })

  // A truly uncaught synchronous throw. After this Node considers the process
  // state undefined, so the correct posture is a clean shutdown + non-zero exit
  // so the supervisor (Heroku) replaces this dyno with a fresh one — rather than
  // limping on in a possibly-corrupt state.
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception — shutting down for a clean restart', err)
    void shutdown('uncaughtException', 1)
  })

  process.on('SIGTERM', () => void shutdown('SIGTERM', 0))
  process.on('SIGINT', () => void shutdown('SIGINT', 0))

  return {
    setServer: (s) => {
      server = s
    },
  }
}
