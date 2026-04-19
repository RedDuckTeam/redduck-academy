import { Document, Page, View, Text, Image, Font, StyleSheet, pdf } from '@react-pdf/renderer'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@4/files/inter-latin-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@4/files/inter-latin-500-normal.woff',
      fontWeight: 500,
    },
  ],
})

// All values are proportional to a 960×540 pt page (0.5× of the 1920×1080 Figma canvas)
const W = 960
const H = 540

const C = {
  bg: '#E0DEDA',
  primary: '#ed4937',
  border: '#9b9b9b',
  dark: '#000000',
  muted: '#565653',
  light: '#9b9b9b',
}

const s = StyleSheet.create({
  page: {
    width: W,
    height: H,
    backgroundColor: C.bg,
    fontFamily: 'Inter',
  },
  certificate: {
    width: W,
    height: H,
    flexDirection: 'column',
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 30,
    paddingRight: 90,
    position: 'relative',
  },

  // Header
  header: { flexDirection: 'row' },
  logoCell: {
    paddingLeft: 10,
    paddingTop: 10,
    paddingBottom: 20,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  logo: { width: 93, height: 12 },
  headerLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },

  // Body
  body: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 60,
    paddingTop: 90,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    borderRightWidth: 1,
    borderRightColor: C.border,
    overflow: 'hidden',
  },
  date: { fontSize: 14, color: C.muted, marginBottom: 5 },
  recipient: { fontSize: 23, fontWeight: 500, color: C.dark, marginBottom: 20 },
  hasCompleted: { fontSize: 14, color: C.muted, marginBottom: 5 },
  course: { fontSize: 23, fontWeight: 500, color: C.dark, marginBottom: 60 },

  // Signature block
  signatureBlock: { flexDirection: 'column', width: 200 },
  signatureImg: { width: 200 },
  signatureLine: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4 },
  signatureName: { fontSize: 12, color: C.light },
  signatureTitle: { fontSize: 12, color: C.light },

  // Right panel
  rightPanel: {
    position: 'absolute',
    top: 0,
    right: 30,
    width: 183,
    height: 450,
    backgroundColor: C.primary,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 65,
    paddingBottom: 65,
  },
  rightPanelTitle: {
    fontSize: 14,
    color: C.dark,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 500,
  },
  stamp: { width: 131 },

  // Decorative square
  decoSquare: {
    position: 'absolute',
    bottom: 30,
    right: 222,
    width: 48,
    height: 48,
    backgroundColor: C.primary,
  },
})

interface Assets {
  logo: string
  signature: string
  stamp: string
}

interface CertificatePdfDocProps {
  recipientName: string
  courseName: string
  completionDate: string
  assets: Assets
}

function CertificatePdfDoc({ recipientName, courseName, completionDate, assets }: CertificatePdfDocProps) {
  return (
    <Document>
      <Page size={[W, H]} style={s.page}>
        <View style={s.certificate}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.logoCell}>
              <Image style={s.logo} src={assets.logo} />
            </View>
            <View style={s.headerLine} />
          </View>

          {/* Body */}
          <View style={s.body}>
            <Text style={s.date}>{completionDate}</Text>
            <Text style={s.recipient}>{recipientName}</Text>
            <Text style={s.hasCompleted}>has successfully completed</Text>
            <Text style={s.course}>{courseName}</Text>

            <View style={s.signatureBlock}>
              <Image style={s.signatureImg} src={assets.signature} />
              <View style={s.signatureLine}>
                <Text style={s.signatureName}>Mark Virchenko</Text>
              </View>
              <Text style={s.signatureTitle}>Chief Executive Officer & Co-Founder</Text>
            </View>
          </View>

          {/* Right panel */}
          <View style={s.rightPanel}>
            <Text style={s.rightPanelTitle}>Course certificate</Text>
            <Image style={s.stamp} src={assets.stamp} />
          </View>

          {/* Decorative square */}
          <View style={s.decoSquare} />
        </View>
      </Page>
    </Document>
  )
}

// react-pdf's internal image fetcher uses Node Buffer and doesn't handle webp/svg extensions.
// Pre-fetch each asset in the browser and convert to a PNG data URL via canvas.
async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${url}`))
    }
    img.src = objectUrl
  })
}

export async function downloadCertificatePdf(
  recipientName: string,
  courseName: string,
  completionDate: string,
  filename: string,
) {
  const base = `${window.location.origin}/certificate-assets`
  const [logo, signature, stamp] = await Promise.all([
    toDataUrl(`${base}/redduck-logo.svg`),
    toDataUrl(`${base}/mark-signature.webp`),
    toDataUrl(`${base}/certificate-stamp.webp`),
  ])

  const blob = await pdf(
    <CertificatePdfDoc
      recipientName={recipientName}
      courseName={courseName}
      completionDate={completionDate}
      assets={{ logo, signature, stamp }}
    />,
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
