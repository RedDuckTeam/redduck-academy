---
id: 1635602097
title: One-way state
type: lecture
order: 10
---

Sometimes the program logic requires one transaction to happen strictly before another, otherwise the state becomes invalid. On Solana there is no sender nonce, so two transactions can land in either order if sent simultaneously.

EVM contracts rely on transaction nonces to enforce sequential order, and track message ids natively. Trying to replicate this on Solana would be an antipattern. You would allocate a separate account to store the number and pay rent for it, and it still wouldn't be bullet-proof: used ids and nonces give uniqueness, but they do not guarantee commutativity (A + B = B + A).

The **One-Way State** pattern flips the design: instead of attempting to restore message delivery order, you design in a way that order stops mattering at all. The message carries the destination, not the step: the total earned so far, not today's reward. Deltas break this even when they only move forward: +5 applied twice is not +5 applied once. A total applied twice is just the total.

The program only accepts actions that move state progress forward or restrict capabilities, strictly rejecting attempts to roll back the value or broaden access. When the state can only move in one direction (never down, never wider), a delayed, re-submitted transaction is no longer a security risk. The program never compares two messages with each other, it only checks the message against the current state. You don't have to ask the question "which one came later" when you can ask the question "has this already been taken into account". When you're moving in one direction, you can't suddenly find yourself at point 80 if you've already passed point 100.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>One-way state</title><desc>A number line pointing right with the state at 100. A message with 80 arrives late and bounces off, rejected. A message with 100 arrives twice and changes nothing. A message with 120 moves the state forward.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">One-way state</text>
  <line x1="60" y1="170" x2="669.0" y2="170.0" stroke="#000000" stroke-width="3"/>
  <polygon points="669.0,164.0 669.0,176.0 680,170" fill="#000000"/>
  <line x1="220" y1="162" x2="220" y2="178" stroke="#000000" stroke-width="2"/>
  <text x="220" y="196" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">80</text>
  <line x1="370" y1="162" x2="370" y2="178" stroke="#000000" stroke-width="2"/>
  <text x="370" y="196" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">100</text>
  <line x1="520" y1="162" x2="520" y2="178" stroke="#000000" stroke-width="2"/>
  <text x="520" y="196" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">120</text>
  <circle cx="370" cy="170" r="12" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="390" y="150" text-anchor="start" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">state</text>
  <line x1="220" y1="95" x2="220.0" y2="139.0" stroke="#565653" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="226.0,139.0 214.0,139.0 220,150" fill="#565653"/>
  <text x="220" y="85" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">80 arrives late</text>
  <line x1="213" y1="111" x2="227" y2="125" stroke="#ed4937" stroke-width="3"/>
  <line x1="213" y1="125" x2="227" y2="111" stroke="#ed4937" stroke-width="3"/>
  <line x1="330" y1="95" x2="356.5" y2="140.5" stroke="#565653" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="361.7,137.5 351.3,143.5 362,150" fill="#565653"/>
  <text x="300" y="85" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">100 again</text>
  <text x="312" y="130" text-anchor="end" font-size="9" fill="#565653" font-family="monospace">= same</text>
  <line x1="520" y1="95" x2="520.0" y2="139.0" stroke="#ed4937" stroke-width="3"/>
  <polygon points="526.0,139.0 514.0,139.0 520,150" fill="#ed4937"/>
  <text x="520" y="85" text-anchor="middle" font-size="9" fill="#ed4937" font-family="monospace" font-weight="bold">120</text>
  <path d="M 532 118 l 6 6 l 11 -13" fill="none" stroke="#ed4937" stroke-width="3"/>
  <text x="640" y="196" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">only forward</text>
  <text x="360" y="250" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The message carries the destination, not the step. Order and duplicates stop mattering.</text>
</svg>

## Examples

**Helium rewards**. The oracle signs the total a device has earned since the beginning. The device's account stores how much was already paid. A claim pays the difference and moves the paid amount up to the signed total. Send it twice, and the second claim pays zero. Bring an older signature with a smaller total, and it pays nothing, because the paid amount is already above it. The counter never goes down, so nobody can take back what was paid.

**Squads** does the same with rights: when signers change, one counter moves to the latest proposal, and every older proposal can be cancelled but not approved.

**Drift's** binary markets turn reduce-only near expiry: you can close a position but not open or grow one.

The One-Way State survives a simple test: any two transactions, swapped, land on the same final state.
