import { env } from '@/env'

/** Resolves Payload media paths to an absolute URL for img/src. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = env.VITE_API_URL.replace(/\/$/, '')
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}
