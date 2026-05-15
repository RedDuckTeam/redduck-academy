import QRCode from 'qrcode'

export interface QrSvgData {
  path: string
  size: number
}

export function createQrSvgPath(text: string): QrSvgData {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const { data, size } = qr.modules
  const parts: Array<string> = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) {
        parts.push(`M${x} ${y}h1v1H${x}z`)
      }
    }
  }
  return { path: parts.join(''), size }
}

export function createQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 0, scale: 8 })
}
