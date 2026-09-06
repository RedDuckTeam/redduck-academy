import { createHmac } from 'crypto'
import { ipPepper } from './proposals.config'

/**
 * The bucket every un-attributable caller shares. `getClientIp` returns '' when no proxy header can
 * be trusted; minting a fresh key for each such request would turn the anonymous quota into
 * something a caller opts out of by arranging for us not to see an address.
 */
const UNATTRIBUTED_KEY = 'unattributed'

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
const HEXTET_RE = /^[0-9a-f]{1,4}$/

function ipv4Octets(value: string): number[] | null {
  const match = IPV4_RE.exec(value)
  if (!match) return null
  const octets = match.slice(1, 5).map(Number)
  return octets.every((octet) => octet <= 255) ? octets : null
}

/** Expands an address to its eight groups, folding a trailing dotted-quad into the low two. */
function ipv6Groups(value: string): number[] | null {
  if (!value.includes(':')) return null

  const halves = value.split('::')
  if (halves.length > 2) return null

  const expand = (half: string): number[] | null => {
    if (!half) return []
    const chunks = half.split(':')
    const groups: number[] = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!
      if (chunk.includes('.')) {
        // A dotted-quad is only legal last, standing in for the final two groups.
        if (i !== chunks.length - 1) return null
        const octets = ipv4Octets(chunk)
        if (!octets) return null
        groups.push((octets[0]! << 8) | octets[1]!, (octets[2]! << 8) | octets[3]!)
        continue
      }
      if (!HEXTET_RE.test(chunk)) return null
      groups.push(parseInt(chunk, 16))
    }
    return groups
  }

  const head = expand(halves[0]!)
  if (!head) return null
  if (halves.length === 1) return head.length === 8 ? head : null

  const tail = expand(halves[1]!)
  if (!tail) return null
  const elided = 8 - head.length - tail.length
  if (elided < 1) return null

  return [...head, ...Array<number>(elided).fill(0), ...tail]
}

/**
 * The network the caller sits on, not the individual address.
 *
 * An IPv6 subscriber is delegated a /64 at minimum — frequently a /56 or /48 — so keying on the
 * /128 would hand one household 2^64 free buckets and make the anonymous quota decorative against
 * most mobile and residential traffic. IPv4 is scarce and usually shared through carrier NAT, so it
 * keeps its full /32 and the quota is knowingly per-gateway there.
 *
 * Unrecognised syntax keeps its literal rather than collapsing into `UNATTRIBUTED_KEY`: the value
 * comes from our own router, so an unparseable one means a proxy change affecting every request,
 * and folding all of them into one bucket would take the anonymous door offline entirely.
 */
function networkPrefix(ip: string): string {
  // Zone ids and brackets are addressing syntax, not identity — two spellings of one network must
  // not produce two buckets.
  const bare = ip
    .replace(/^\[|\]$/g, '')
    .split('%')[0]!
    .toLowerCase()

  // Re-join from the parsed octets rather than echoing the input: `01.2.3.4` and `1.2.3.4` are the
  // same host, and returning them verbatim would give one address two quota buckets.
  const octets = ipv4Octets(bare)
  if (octets) return octets.join('.')

  const groups = ipv6Groups(bare)
  if (!groups) return `raw:${bare}`

  // ::ffff:a.b.c.d is an IPv4 client on a dual-stack socket. Its first four groups are zero, so the
  // /64 rule below would file the entire IPv4 internet under one key.
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return [groups[6]! >> 8, groups[6]! & 0xff, groups[7]! >> 8, groups[7]! & 0xff].join('.')
  }

  return groups
    .slice(0, 4)
    .map((group) => group.toString(16))
    .join(':')
}

/**
 * The quota key stored on every anonymous proposal.
 *
 * HMAC rather than a bare digest: the whole IPv4 space is 2^32 preimages, so `sha256(ip)` is
 * exhaustible in seconds and is not pseudonymisation — which matters because these rows are
 * retained. With the pepper held only in config, a leaked database reverses nothing on its own.
 */
export function hashContributorIp(ip: string): string {
  const address = ip.trim()
  if (!address) return UNATTRIBUTED_KEY

  return createHmac('sha256', ipPepper()).update(networkPrefix(address)).digest('base64url')
}
