/**
 * Single source of truth for the built-in caller aliases used by Solidity test
 * cases. Each alias maps to a fixed 20-byte address whose last hex chars spell
 * the name with a little leetspeak (o→0, i/l→1, s→5, t→7, r→2, v→7/b). Tests
 * reference them via `@-prefixed` syntax (`@alice`); raw 0x-prefixed 40-hex
 * addresses are accepted everywhere an address is expected.
 *
 * This is a zero-dependency leaf module: import it directly
 * (`@redduck/solc-utils/src/caller-aliases`) rather than through the package
 * barrel, so the EVM/solc toolchain (and the ~1 MB bundled stdlib) never leaks
 * into the display path, the admin UI, or the Payload backend that only need
 * the alias names. Consumers:
 *   - apps/web    — runner (`run-test-case.ts`) + result display
 *   - apps/admin  — `address-input` widget help text
 *   - packages/payload-config — `Lessons` save-time validation + field help
 */
export const CALLER_ALIAS_ADDRESSES = {
  deployer: '0x000000000000000000000000000000000000c0de',
  alice: '0x00000000000000000000000000000000000a11ce',
  bob: '0x0000000000000000000000000000000000000b0b',
  carol: '0x00000000000000000000000000000000000ca201',
  dave: '0x000000000000000000000000000000000000dabe',
  eve: '0x0000000000000000000000000000000000000e7e',
  fred: '0x000000000000000000000000000000000000f2ed',
  cleo: '0x000000000000000000000000000000000000c1e0',
  dale: '0x000000000000000000000000000000000000da1e',
  oscar: '0x0000000000000000000000000000000000005ca2',
} as const satisfies Record<string, `0x${string}`>

export type CallerAlias = keyof typeof CALLER_ALIAS_ADDRESSES

/** Built-in EOA alias names (no `@`), in declaration order. */
export const CALLER_ALIAS_NAMES = Object.keys(CALLER_ALIAS_ADDRESSES) as CallerAlias[]

/** Lowercased address → alias name, for mapping decoded return values back to names. */
const ADDRESS_TO_ALIAS: Record<string, CallerAlias> = Object.fromEntries(
  Object.entries(CALLER_ALIAS_ADDRESSES).map(([name, addr]) => [addr.toLowerCase(), name as CallerAlias]),
)

/**
 * The alias name for a known built-in EOA address, or `null` if `value` isn't
 * one. Case-insensitive (checksummed addresses match). Fixture / `@self`
 * addresses are runtime-specific and intentionally not covered here.
 */
export function aliasForAddress(value: string): CallerAlias | null {
  return ADDRESS_TO_ALIAS[value.trim().toLowerCase()] ?? null
}
