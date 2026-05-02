/** Parse JSON or return null when input is missing/invalid. Never throws. */
export function safeParseJson(text: string | null | undefined): unknown {
  if (text == null) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
