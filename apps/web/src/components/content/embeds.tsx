import type { ReactElement } from 'react'
import { EmbedFrame } from '@/components/ui/embed-frame'

export const BLOCK_MINING_SHORTCODE = '[[block-mining]]'

function youtubeEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim())
    if (url.hostname === 'youtu.be') return `https://www.youtube.com/embed/${url.pathname.slice(1).split('?')[0]}`
    if (url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com') {
      const v = url.searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    return null
  } catch {
    return null
  }
}

function YouTubeEmbed({ url }: { url: string }): ReactElement {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl my-4">
      <iframe
        src={url}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}

export function detectEmbed(href: string): ReactElement | null {
  let host = ''
  try {
    host = new URL(href).hostname
  } catch {
    return null
  }
  if (host === 'plgrnd.io' || host.endsWith('.plgrnd.io')) {
    return <EmbedFrame src={href} title="plgrnd.io interactive flow" />
  }
  if (host === 'eth.build' || host === 'sandbox.eth.build') {
    return <EmbedFrame src={href} title="eth.build interactive flow" />
  }
  const yt = youtubeEmbedUrl(href)
  return yt ? <YouTubeEmbed url={yt} /> : null
}
