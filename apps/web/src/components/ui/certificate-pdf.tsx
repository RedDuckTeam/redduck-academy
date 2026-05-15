import { jsPDF } from 'jspdf'
import { renderCertificateImage } from '@/lib/render-certificate-image'

// Certificate aspect is 1920×1080. We render to 1920px wide JPEG and embed
// it in a same-ratio PDF page (downsized to fit a single A4-ish landscape).
const PDF_W = 960
const PDF_H = 540

export async function downloadCertificatePdf(
  recipientName: string,
  courseName: string,
  completionDate: string,
  humanId: string,
  filename: string,
) {
  const imageDataUrl = await renderCertificateImage({
    recipientName,
    courseName,
    completionDate,
    humanId,
  })

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [PDF_W, PDF_H] })
  doc.addImage(imageDataUrl, 'JPEG', 0, 0, PDF_W, PDF_H, undefined, 'FAST')
  doc.save(filename)
}
