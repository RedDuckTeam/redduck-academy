/** The fallback covers insecure contexts and denied permissions, where `navigator.clipboard` is unusable. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {}

  try {
    const area = document.createElement('textarea')
    area.value = text
    // Off-screen rather than `display: none` — a hidden element cannot hold a selection. `readOnly`
    // keeps iOS from raising the on-screen keyboard.
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const copied = document.execCommand('copy')
    area.remove()
    return copied
  } catch {
    return false
  }
}
