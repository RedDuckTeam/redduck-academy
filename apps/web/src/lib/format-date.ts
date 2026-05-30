export const formatLongDate = (iso: string | null | undefined): string | null => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Medium-style date ("Jan 1, 2026"), guarded against invalid input.
 * `Intl.DateTimeFormat().format(new Date(bad))` throws a RangeError on an invalid
 * date and would crash the rendering component; this returns '' instead.
 */
export const formatMediumDate = (value: string | number | Date | null | undefined): string => {
  if (value == null) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d)
}
