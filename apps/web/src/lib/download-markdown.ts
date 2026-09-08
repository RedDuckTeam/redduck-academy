export function downloadMarkdown(path: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = path.slice(path.lastIndexOf('/') + 1)
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoked on the next task: Safari has not finished reading the blob when `click()` returns.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
