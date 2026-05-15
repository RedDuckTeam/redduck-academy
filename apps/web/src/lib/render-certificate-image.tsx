import { createRoot } from 'react-dom/client'
import { toJpeg } from 'html-to-image'
import { flushSync } from 'react-dom'
import { Certificate } from '@/components/ui/certificate'
import { env } from '@/env'

interface RenderInput {
  recipientName: string
  courseName: string
  completionDate: string
  humanId: string
}

const RENDER_WIDTH = 1920

export async function renderCertificateImage(input: RenderInput): Promise<string> {
  const qrUrl = `${env.VITE_APP_URL.replace(/\/$/, '')}/certificates/${input.humanId}`

  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.top = '0'
  host.style.left = '0'
  host.style.width = `${RENDER_WIDTH}px`
  // Move off-screen so it never flashes on the page, but keep it laid out so styles compute.
  host.style.transform = 'translate(-100000px, -100000px)'
  host.style.pointerEvents = 'none'
  host.style.zIndex = '-1'
  document.body.appendChild(host)

  const root = createRoot(host)
  try {
    flushSync(() => {
      root.render(
        <Certificate
          recipientName={input.recipientName}
          courseName={input.courseName}
          completionDate={input.completionDate}
          humanId={input.humanId}
          qrUrl={qrUrl}
        />,
      )
    })

    // Wait for fonts + two animation frames so SVGs and computed styles settle.
    if (document.fonts?.ready) await document.fonts.ready
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

    return await toJpeg(host, {
      width: RENDER_WIDTH,
      height: Math.round((RENDER_WIDTH * 1080) / 1920),
      pixelRatio: 1,
      quality: 0.85,
      cacheBust: true,
      backgroundColor: '#E0DEDA',
    })
  } finally {
    root.unmount()
    host.remove()
  }
}
