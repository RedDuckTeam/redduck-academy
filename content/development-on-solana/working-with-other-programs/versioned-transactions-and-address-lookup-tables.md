---
id: 207
title: Versioned transactions and address lookup tables
type: lecture
order: 7
faq:
  - question: Why 1,232 bytes?
    answer: >-
      A transaction has to fit in one UDP packet, and 1,232 bytes is what the IPv6 minimum MTU
      leaves after protocol headers. Signatures, header, account list, blockhash and
      instruction data all share that budget. At 32 bytes per address, a legacy transaction
      runs out of room near 30 accounts.
  - question: How does a lookup table fit more accounts into the same packet?
    answer: >-
      It stores up to 256 pubkeys on chain at fixed offsets. A v0 transaction names the table
      once at full size, then points at each address inside it with a 1-byte index. Swapping
      32 bytes for 1 raises the practical ceiling from about 30 accounts to around 256, and
      the runtime resolves the indices before execution, so on-chain code sees no difference.
  - question: Can a signer come from a lookup table?
    answer: >-
      No. Signers stay in the versioned transaction's static account list, because the runtime
      verifies signatures before it resolves any table reference. One transaction can reference
      up to four tables.
  - question: I created a lookup table and my transaction still fails. Why?
    answer: >-
      One slot has to pass before any transaction can reference a new table, which stops
      last-second changes from altering in-flight transactions. Filling a large table also
      takes several calls, since extend is bound by the same 1,232-byte limit and fits roughly
      30 pubkeys at a time.
  - question: When do I get the rent back from a closed table?
    answer: >-
      After a cooldown of about 500 slots, roughly 5 minutes. The cooldown keeps the address
      from being reused while transactions that reference the old table are still in flight.
---

> Solana transactions have a hard 1,232-byte size limit at the wire level. Legacy transactions put every account's full 32-byte pubkey directly in the message, so a 30-account transaction spends close to a kilobyte on pubkeys alone. The v0 transaction format introduced Address Lookup Tables: accounts that store pubkeys at fixed offsets, referenced from the transaction by a 1-byte index instead of a 32-byte pubkey. The same 30-account transaction now fits comfortably with hundreds of bytes to spare.

## The 1,232-byte ceiling

A Solana transaction has to fit in a single UDP packet. The maximum packet size is 1,232 bytes, derived from the IPv6 minimum MTU minus protocol headers. That cap covers the entire transaction: signatures, header, account list, recent blockhash, and instruction data combined.

For simple transactions this is plenty. A wallet sending SOL touches three accounts and uses well under 200 bytes. A token transfer with an ATA touches five and uses around 300. But composing DeFi protocols stacks accounts quickly. A single DEX swap easily reaches ten accounts. Routing through three pools brings you to 25. Adding an oracle, a fee account, and a few sysvars puts you near 30, and each account costs 32 bytes.

Aggregators that route through multiple venues reach this limit quickly. A multi-hop route can reference 40 or 50 accounts. Add the standard headers, signatures, blockhash, and instruction data, and you run out of room before the route is complete. Before versioned transactions existed, the workaround was to split the route across multiple transactions, which breaks atomicity and adds latency.

## What v0 changed

The wire format gained a version prefix. A specific high-bit byte at the start signals "version 0," and everything after follows the v0 layout. Legacy transactions remain valid forever and follow the older layout without a prefix. The runtime distinguishes them by checking the first byte.

The new layout splits the account list into two parts. The static list contains signers, writable accounts that need to be in the message directly, and the program IDs being called. The second part is a set of references to Address Lookup Tables. Each reference identifies an ALT and lists indices into it, marking some as writable and others as readonly.

At execution time, the runtime resolves the references. It reads each referenced ALT, looks up the pubkeys at the specified indices, and assembles the full account list. Your program sees the same `AccountInfo` array it would have seen in a legacy transaction. The compression is invisible to the on-chain code. It is purely a wire-format optimization.

<svg role="img" viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Byte budget for a 30-account transaction: legacy vs v0 with one ALT</title><desc>Two side-by-side breakdowns compare a legacy transaction listing 30 full pubkeys (about 1,110 bytes, 90% of the 1,232-byte limit) with a v0 transaction using one address lookup table, 5 static pubkeys, and 25 indices (about 370 bytes, 30% of the limit). Both encode the same 30 accounts; the v0 version replaces 25 pubkey copies with 25 one-byte indices, leaving room for hundreds more accounts.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Byte budget for a 30-account transaction</text>
  <rect x="40" y="80" width="310" height="295" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Legacy transaction</text>
  <text x="55" y="130" font-family="monospace" font-size="10" fill="#565653">header</text>
  <text x="330" y="130" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">3 bytes</text>
  <text x="55" y="150" font-family="monospace" font-size="10" fill="#565653">signature</text>
  <text x="330" y="150" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">64</text>
  <text x="55" y="170" font-family="monospace" font-size="10" fill="#565653">30 pubkeys in list</text>
  <text x="330" y="170" text-anchor="end" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">32 × 30 = 960</text>
  <text x="55" y="190" font-family="monospace" font-size="10" fill="#565653">recent blockhash</text>
  <text x="330" y="190" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">32</text>
  <text x="55" y="210" font-family="monospace" font-size="10" fill="#565653">instructions</text>
  <text x="330" y="210" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">~50</text>
  <line x1="55" y1="225" x2="335" y2="225" stroke="#565653" stroke-width="1"/>
  <text x="55" y="248" font-family="monospace" font-size="11" font-weight="bold">total</text>
  <text x="330" y="248" text-anchor="end" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">~1,110 bytes</text>
  <text x="55" y="285" font-family="monospace" font-size="9" fill="#565653">budget used:</text>
  <rect x="55" y="293" width="250" height="18" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <rect x="55" y="293" width="225" height="18" fill="#ed4937"/>
  <text x="325" y="306" text-anchor="end" font-family="monospace" font-size="9" fill="#565653">90%</text>
  <text x="195" y="345" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">close to the 1,232-byte ceiling</text>
  <text x="195" y="361" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">one more account and it fails</text>
  <rect x="370" y="80" width="310" height="295" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">v0 with one ALT</text>
  <text x="385" y="130" font-family="monospace" font-size="10" fill="#565653">version + header</text>
  <text x="660" y="130" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">4 bytes</text>
  <text x="385" y="150" font-family="monospace" font-size="10" fill="#565653">signature</text>
  <text x="660" y="150" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">64</text>
  <text x="385" y="170" font-family="monospace" font-size="10" fill="#565653">5 static pubkeys</text>
  <text x="660" y="170" text-anchor="end" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">32 × 5 = 160</text>
  <text x="385" y="190" font-family="monospace" font-size="10" fill="#565653">ALT ref + 25 indices</text>
  <text x="660" y="190" text-anchor="end" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">~60</text>
  <text x="385" y="210" font-family="monospace" font-size="10" fill="#565653">recent blockhash</text>
  <text x="660" y="210" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">32</text>
  <text x="385" y="230" font-family="monospace" font-size="10" fill="#565653">instructions</text>
  <text x="660" y="230" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">~50</text>
  <line x1="385" y1="245" x2="665" y2="245" stroke="#565653" stroke-width="1"/>
  <text x="385" y="268" font-family="monospace" font-size="11" font-weight="bold">total</text>
  <text x="660" y="268" text-anchor="end" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">~370 bytes</text>
  <text x="385" y="303" font-family="monospace" font-size="9" fill="#565653">budget used:</text>
  <rect x="385" y="311" width="250" height="18" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <rect x="385" y="311" width="75" height="18" fill="#ed4937"/>
  <text x="655" y="324" text-anchor="end" font-family="monospace" font-size="9" fill="#565653">30%</text>
  <text x="525" y="358" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">room for hundreds more accounts</text>
  <text x="360" y="430" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The same 30 accounts. The compression comes from replacing 25 pubkey copies with 25 one-byte indices.</text>
</svg>

The practical ceiling jumps from roughly 30 accounts in a legacy transaction to around 256 in a v0 transaction. That covers any composition pattern Solana programs reasonably want to perform.

## How Address Lookup Tables work

An ALT is an account owned by the Address Lookup Table program. It stores up to 256 pubkeys at fixed offsets. Anyone can create one and populate it with whatever pubkeys are useful.

The lifecycle has four steps. **Create** allocates the ALT and stamps it with the current slot, which becomes part of how the table is identified. **Extend** appends pubkeys to the table. Because the 1,232-byte ceiling also applies to the extend instruction itself, adding pubkeys takes multiple transactions to fill a large table, roughly 30 pubkeys per call. **Freeze** is optional and makes the table immutable. **Close** marks the table for deactivation. The rent is not released immediately. A cooldown of about 500 slots, roughly 5 minutes, runs before the close completes. This prevents the ALT's address from being used to create a new table before any in-flight transactions that reference the old one have been processed.

A newly created ALT cannot be used immediately. The runtime requires one slot to pass before transactions can reference it. This protects against last-second changes that would alter the meaning of in-flight transactions.

A single transaction can reference up to four ALTs. Aggregators commonly pull from one ALT for token program IDs and common mints, one for the DEX they're routing through, and one for oracles or supporting accounts.

Signed accounts cannot come from an ALT. Signers always live in the static account list, because the runtime has to verify signatures before any account resolution happens.

## What changes for you

For program authors, nothing changes. You write the same handlers, the same Accounts structs, the same CPIs. The runtime resolves ALT references before your handler runs, so by the time your code looks at `ctx.accounts.foo`, the resolution is already done.

For client authors, the change is meaningful. You build a `VersionedTransaction` instead of a `Transaction`, and you supply the list of ALTs you're referencing along with the instruction data. The `@solana/web3.js` SDK handles the encoding once you provide the right inputs. The harder part is deciding which accounts go into the static list versus which can be pulled from an ALT, and whether to create your own ALT or rely on someone else's.

## When to reach for a lookup table

Most transactions you build don't need ALTs. They fit in a legacy transaction with room to spare. When you hit the size limit, the first response is to look at the account list and identify items that show up in every transaction your protocol issues: program IDs, common mints, shared authority PDAs, oracle accounts. Those are the right candidates for a protocol-specific ALT.

If you're building a protocol that other clients will compose with, publishing an ALT of your protocol's static addresses is a small investment that saves every integrator some bytes. Production Solana protocols often publish an ALT alongside their deployment for exactly this reason.

The mental model is short. A legacy transaction is a list of pubkeys. A v0 transaction is a list of pubkey references, some inline and some by ALT index. The runtime resolves the references before execution, and your program doesn't notice the difference.
