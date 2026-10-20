---
id: 1635602097
title: One-way state
type: lecture
order: 10
faq:
  - question: What is one-way state?
    answer: >-
      State that only moves forward: a counter that never goes down, rights that only narrow.
      The program accepts a message by comparing it with the current state, never with other
      messages, so two transactions land on the same final state in either order, and a
      duplicate changes nothing.
  - question: Why can't my program rely on the order of transactions?
    answer: >-
      Solana has no sender nonce. Two transactions sent at the same time can land in either
      order, and one of them can be resent. A program that assumes an order breaks the first
      time the order flips.
  - question: Why not store the last message id in an account?
    answer: >-
      It costs an account and its rent, and it only gives uniqueness. It does not make the result
      the same in both orders. Two steps with ids are still two steps: applied in the wrong order
      they give a wrong intermediate state, and a lost one is lost.
  - question: What should the oracle sign, a step or a total?
    answer: >-
      The total, not the step. A total applied twice is just the total. A step applied twice is double. Bring
      an old total and the program pays nothing, because the paid amount is already above it.
  - question: How does Squads use it?
    answer: >-
      When signers change, one index moves forward, and every older proposal can be cancelled but
      not approved or executed. Rights only narrow, so a late approval of an old proposal is
      rejected by the state, not by timing.
  - question: How do I check my design?
    answer: >-
      Take any two transactions, swap their order, and compare the final state. If it is the
      same, the state is one-way.
---

> Sometimes one transaction has to happen before another, or the state becomes wrong. On Solana there is no sender nonce, so two transactions sent at the same time can land in either order, and either of them can land twice. Restoring the order on Solana is an antipattern.

## Two transactions, either order

Suppose an oracle pays a device its daily reward: 5 tokens today, 7 tokens tomorrow. Each reward is a signed message, and the program adds the amount to what the device may claim.

Now suppose two messages are in flight at once. If one of them is resent, the device is paid twice, and if one is lost, it is lost. When the second lands before the first, the state is wrong until the first arrives. The program cannot tell a late message from a duplicate, because a message says what to add, not where the result should end up.

EVM contracts solve this with the transaction nonce and with message ids. Every message has a number, and the contract accepts the next number only. We could copy this to Solana: an extra account for the number, and rent for it. But it is still not enough. A number proves that a message is new. It does not make A then B equal B then A.

## The message carries the destination

The one-way design flips the problem. Instead of restoring the order, we shape the state so that the order stops mattering.

The message carries the destination, not the step. The oracle signs the total a device has earned so far, not today's reward. A total applied twice is just the total, and a total that arrives late is below the current state and does nothing. A step cannot do this, even one that only moves forward, because +5 applied twice is not +5 applied once.

With **one-way state**, the program accepts only moves in one direction. A counter can go up, never down. A set of rights can shrink, never grow. The program never compares two messages with each other. It compares the message with the current state and checks only whether this has already been taken into account. When you are moving in one direction, you cannot find yourself at 80 after you have passed 100.

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

## Helium: the oracle signs the total, not the reward

Helium pays rewards to about a million devices, and its oracle does not sign daily rewards. It signs the total a device has earned since the beginning.

The device's account stores how much was already paid. A claim pays the difference and moves the paid amount up to the signed total. Send the same claim twice, and the second pays zero, because the paid amount already equals the total. Bring an older signature with a smaller total, and it pays nothing, because the paid amount is already above it. The counter never goes down, so nobody can take back what was paid, and no claim can land in a wrong order.

## Squads: rights only narrow

Squads is a multisig. When its signers or its threshold change, every proposal approved by the old signers has to become invalid.

Squads does not look at when the proposals were created or approved relative to the change. It moves one index, the stale transaction index, up to the latest proposal. Every proposal with a number at or below that index is stale. A stale proposal can be cancelled, but it cannot be approved or executed, in whatever order the transactions arrive. An approval that was in flight when the signers changed lands after the index moved, and the state rejects it. No timestamp is compared.

## Drift: close, but do not open

Drift's markets with an expiry go into reduce-only mode before they expire. A trader can close a position but cannot open a new one or grow an existing one. The set of allowed actions only narrows as the market approaches settlement. So a late order to open does not depend on whether it was signed before or after the switch. It is rejected because the state says the market is reduce-only.

## Swap any two transactions

One-way state survives one test: take any two transactions, swap their order, and the final state is the same. A duplicate is a transaction swapped with itself, and it changes nothing. The program never asks which message came first. It only asks whether the state has already passed this point.
