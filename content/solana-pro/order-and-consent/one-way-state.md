---
id: 1635602097
title: One-way state
type: lecture
order: 10
---

Sometimes the program logic requires one transaction to happen strictly before another, otherwise the state becomes invalid. On Solana there is no sender nonce, so two transactions can land in either order if sent simultaneously.

EVM contracts rely on transaction nonces to enforce sequential order, and track message ids natively. Trying to replicate this on Solana would be an antipattern. You would allocate a separate account to store the number and pay rent for it, and it still wouldn't be bullet-proof: used ids and nonces give uniqueness, but they do not guarantee commutativity (A + B = B + A).

The **One-Way State** pattern flips the design: instead of attempting to restore message delivery order, you design in a way that order stops mattering at all. The message carries the destination, not the step: the total earned so far, not today's reward. Deltas break this even when they only move forward: +5 applied twice is not +5 applied once. A total applied twice is just the total.

<svg role="img" viewBox="0 0 720 382" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The same message arrives twice</title><desc>Two boxes. On the left, the message is a step: paid starts at 0, a plus five message makes it 5, and the same message arriving again makes it 10, which is wrong. On the right, the message is a destination: paid starts at 0, a total of 5 makes it 5, and the same total arriving again leaves it at 5.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The same message arrives twice</text>
  <rect x="40" y="70" width="300" height="254" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Message = step</text>
  <rect x="80" y="110" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="132" text-anchor="middle" font-family="monospace" font-size="9.5" fill="#565653">paid 0</text>
  <line x1="190" y1="146" x2="190" y2="160" stroke="#000000" stroke-width="2"/>
  <polygon points="184,158 196,158 190,168" fill="#000000"/>
  <rect x="80" y="168" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="190" text-anchor="middle" font-family="monospace" font-size="9.5" fill="#565653">+5 arrives: paid 5</text>
  <line x1="190" y1="204" x2="190" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="184,216 196,216 190,226" fill="#000000"/>
  <rect x="80" y="226" width="220" height="36" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="190" y="248" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="bold">+5 arrives again: paid 10</text>
  <text x="190" y="306" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">paid twice</text>
  <rect x="380" y="70" width="300" height="254" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Message = destination</text>
  <rect x="420" y="110" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="132" text-anchor="middle" font-family="monospace" font-size="9.5" fill="#565653">paid 0</text>
  <line x1="530" y1="146" x2="530" y2="160" stroke="#000000" stroke-width="2"/>
  <polygon points="524,158 536,158 530,168" fill="#000000"/>
  <rect x="420" y="168" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="190" text-anchor="middle" font-family="monospace" font-size="9.5" fill="#565653">total 5 arrives: paid 5</text>
  <line x1="530" y1="204" x2="530" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="524,216 536,216 530,226" fill="#000000"/>
  <rect x="420" y="226" width="220" height="36" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="248" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="bold">total 5 arrives again: paid 5</text>
  <text x="530" y="306" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">same state</text>
  <text x="360" y="360" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A total applied twice is the total. A step applied twice is double.</text>
</svg>

The program only accepts actions that move state progress forward or restrict capabilities, strictly rejecting attempts to roll back the value or broaden access. When the state can only move in one direction (never down, never wider), a delayed, re-submitted transaction is no longer a security risk. The program never compares two messages with each other, it only checks the message against the current state. You don't have to ask the question "which one came later" when you can ask the question "has this already been taken into account". When you're moving in one direction, you can't suddenly find yourself at point 80 if you've already passed point 100.

## Examples

**Helium rewards.** Helium pays rewards to about a million devices, and its oracle signs the total a device has earned since the beginning, not the daily reward. The device's account stores how much was already paid. A claim pays the difference and moves the paid amount up to the signed total. Send it twice, and the second claim pays zero, because the paid amount already equals the total. Bring an older signature with a smaller total, and it pays nothing, because the paid amount is already above it. The counter never goes down, so nobody can take back what was paid, and no claim can land in a wrong order.

**Squads** does the same with rights. When its signers or its threshold change, it moves one index, the stale transaction index, up to the latest proposal, and every proposal with a number at or below that index is stale: it can be cancelled, but it cannot be approved or executed, in whatever order the transactions arrive. An approval that was in flight when the signers changed lands after the index moved, and the state rejects it. No timestamp is compared.

**Drift's** markets with an expiry turn reduce-only before they expire: you can close a position but not open or grow one. The set of allowed actions only narrows as the market approaches settlement, so a late order to open does not depend on whether it was signed before or after the switch. It is rejected because the state says the market is reduce-only.

The One-Way State survives a simple test: any two transactions, swapped, land on the same final state.
