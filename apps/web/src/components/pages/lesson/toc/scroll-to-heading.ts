export function scrollToHeading(id: string, offset: number, attempt = 0): void {
  const el = document.getElementById(id)
  if (!el) {
    if (attempt < 5) requestAnimationFrame(() => scrollToHeading(id, offset, attempt + 1))
    return
  }
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
  history.replaceState(null, '', `#${id}`)
}
