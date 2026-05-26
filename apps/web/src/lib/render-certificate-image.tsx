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
const RENDER_HEIGHT = Math.round((RENDER_WIDTH * 1080) / 1920)

export async function renderCertificateImage(input: RenderInput): Promise<string> {
  const qrUrl = `${env.VITE_APP_URL.replace(/\/$/, '')}/certificates/${input.humanId}`

  // The off-screen offset MUST live on the host wrapper, never on the captured node.
  // html-to-image clones the captured node and copies its computed styles into an
  // <foreignObject>; if that node carries `transform: translate(-100000px, …)`, the
  // whole render is pushed off-canvas and you get only the background color back.
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.top = '0'
  host.style.left = '-100000px'
  host.style.width = `${RENDER_WIDTH}px`
  host.style.pointerEvents = 'none'
  host.style.zIndex = '-1'

  // The captured node: exact pixel box, no transform.
  const stage = document.createElement('div')
  stage.style.width = `${RENDER_WIDTH}px`
  stage.style.height = `${RENDER_HEIGHT}px`
  host.appendChild(stage)
  document.body.appendChild(host)

  const root = createRoot(stage)
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

    return await toJpeg(stage, {
      width: RENDER_WIDTH,
      height: RENDER_HEIGHT,
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
