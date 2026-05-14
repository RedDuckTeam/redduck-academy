import { randomBytes } from 'crypto'

// Crockford base32 — omits I, L, O, U to avoid visual ambiguity.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ID_LENGTH = 8

export const HUMAN_ID_REGEX = /^RD-[0-9A-HJKMNP-TV-Z]{8}$/

export function generateCertificateHumanId(): string {
  const bytes = randomBytes(ID_LENGTH)
  let suffix = ''
  for (let i = 0; i < ID_LENGTH; i++) {
    suffix += ALPHABET[bytes[i] & 0x1f]
  }
  return `RD-${suffix}`
}
