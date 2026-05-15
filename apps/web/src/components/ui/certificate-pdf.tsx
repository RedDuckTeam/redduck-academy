import { jsPDF } from 'jspdf'
import { toJpeg } from 'html-to-image'

// PDF page size in points. 1920×1080 image gets downsampled into this.
const PDF_W = 960
const PDF_H = 540

export async function downloadCertificatePdf(certificateElement: HTMLElement, filename: string) {
  if (document.fonts?.ready) await document.fonts.ready

  const rect = certificateElement.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    throw new Error('Certificate element has no size — cannot capture')
  }

  const imageDataUrl = await toJpeg(certificateElement, {
    width: rect.width,
    height: rect.height,
    pixelRatio: 1920 / rect.width,
    quality: 0.92,
    cacheBust: true,
    backgroundColor: '#E0DEDA',
  })

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [PDF_W, PDF_H] })
  doc.addImage(imageDataUrl, 'JPEG', 0, 0, PDF_W, PDF_H, undefined, 'FAST')
  doc.save(filename)
}
