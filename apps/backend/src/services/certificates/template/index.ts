import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), 'assets')

const redduckLogoSvg = readFileSync(join(assetsDir, 'redduck-logo.svg'), 'utf8')
const markSignatureB64 = readFileSync(join(assetsDir, 'mark-signature.webp')).toString('base64')
const certificateStampB64 = readFileSync(join(assetsDir, 'certificate-stamp.webp')).toString('base64')

export function buildCertificateHtml(userName: string, courseTitle: string, issuedAt: Date): string {
  const date = issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src https://fonts.googleapis.com https://fonts.gstatic.com; img-src data:; script-src 'none';">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 960px;
      height: 540px;
      overflow: hidden;
      background: #E0DEDA;
    }

    .scale-wrapper {
      transform: scale(0.5);
      transform-origin: top left;
      width: 1920px;
      height: 1080px;
    }

    /* Certificate root — matches: relative aspect-[1920/1080] flex flex-col w-full overflow-hidden bg-[#E0DEDA] py-[3.125%] pl-[3.125%] pr-[9.375%] */
    .certificate {
      position: relative;
      width: 1920px;
      height: 1080px;
      background: #E0DEDA;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      /* py=3.125% of 1920=60px, pl=3.125%=60px, pr=9.375%=180px */
      padding: 60px 180px 60px 60px;
      font-family: 'Inter', sans-serif;
    }

    /* ── Header ── */
    .header {
      display: flex;
      flex-shrink: 0;
    }

    /* pl-[1.042%]=20px pt-[1.042%]=20px pb-[2.083%]=40px pr-[2.083%]=40px border-b border-[#9b9b9b] */
    .logo-cell {
      padding: 20px 40px 40px 20px;
      border-bottom: 1px solid #9b9b9b;
      flex-shrink: 0;
    }

    /* w-full flex-1 border-t border-l border-[#9b9b9b] */
    .header-line {
      flex: 1;
      border-top: 1px solid #9b9b9b;
      border-left: 1px solid #9b9b9b;
    }

    /* ── Body ── */
    /* pl-[6.25%]=120px pt-[9.375%]=180px border-b border-x border-[#9b9b9b] */
    .body {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      padding-left: 120px;
      padding-top: 180px;
      border-bottom: 1px solid #9b9b9b;
      border-left: 1px solid #9b9b9b;
      border-right: 1px solid #9b9b9b;
      overflow: hidden;
    }

    /* 1.458cqw at 1920px = 28px | mb-[0.521%]=10px */
    .date {
      font-size: 28px;
      line-height: 1.143;
      color: #565653;
      margin-bottom: 10px;
    }

    /* 2.396cqw at 1920px = 46px | mb-[2.083%]=40px */
    .recipient {
      font-size: 46px;
      font-weight: 500;
      color: #000;
      margin-bottom: 40px;
    }

    /* 1.458cqw = 28px | mb-[0.521%]=10px */
    .has-completed {
      font-size: 28px;
      color: #565653;
      margin-bottom: 10px;
    }

    /* 2.396cqw = 46px | mb-[6.25%]=120px */
    .course {
      font-size: 46px;
      font-weight: 500;
      color: #000;
      margin-bottom: 120px;
    }

    /* w-[20.833%] of 1920=400px */
    .signature-block {
      display: flex;
      flex-direction: column;
      width: 400px;
    }

    .signature-block svg {
      width: 100%;
      height: auto;
    }

    /* 1.25cqw = 24px | border-t border-[#9b9b9b] */
    .signature-name {
      font-size: 24px;
      color: #9b9b9b;
      border-top: 1px solid #9b9b9b;
      padding-top: 4px;
    }

    .signature-title {
      font-size: 24px;
      color: #9b9b9b;
    }

    /* ── Right panel ── */
    /* right-[3.125%]=60px w-[19.0625%]=366px h-[83.333%]=900px */
    /* px-[1.458%]=28px py-[6.771%]=130px */
    .right-panel {
      position: absolute;
      top: 0;
      right: 60px;
      width: 366px;
      height: 900px;
      background: #ed4937;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 130px 28px;
    }

    /* 1.458cqw = 28px | uppercase font-medium leading-tight */
    .right-panel-title {
      font-size: 28px;
      color: #000;
      text-align: center;
      text-transform: uppercase;
      font-weight: 500;
      line-height: 1.2;
    }

    /* w-[71.585%] of 366px = 262px */
    .stamp {
      width: 262px;
      height: auto;
    }

    /* ── Decorative square ── */
    /* bottom-[5.556%]=60px right-[23.073%]=443px w-[4.948%]=95px h-[8.796%]=95px */
    .deco-square {
      position: absolute;
      bottom: 60px;
      right: 443px;
      width: 95px;
      height: 95px;
      background: #ed4937;
    }
  </style>
</head>
<body>
  <div class="scale-wrapper">
  <div class="certificate">

    <!-- Header -->
    <div class="header">
      <div class="logo-cell">
        ${redduckLogoSvg}
      </div>
      <div class="header-line"></div>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="date">${escapeHtml(date)}</p>
      <p class="recipient">${escapeHtml(userName)}</p>
      <p class="has-completed">has successfully completed</p>
      <p class="course">${escapeHtml(courseTitle)}</p>

      <div class="signature-block">
        <img src="data:image/webp;base64,${markSignatureB64}" style="width:100%;height:auto;" alt="signature">
        <p class="signature-name">Mark Virchenko</p>
        <p class="signature-title">Chief Executive Officer &amp; Co-Founder</p>
      </div>
    </div>

    <!-- Right panel -->
    <div class="right-panel">
      <p class="right-panel-title">Course certificate</p>
      <div class="stamp">
        <img src="data:image/webp;base64,${certificateStampB64}" style="width:100%;height:auto;" alt="stamp">
      </div>
    </div>

    <!-- Decorative square -->
    <div class="deco-square"></div>

  </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
