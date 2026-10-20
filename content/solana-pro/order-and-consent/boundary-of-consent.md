---
id: 1362359609
title: Boundary of consent
type: lecture
order: 20
faq:
  - question: What is the boundary of consent?
    answer: >-
      The limits the user signs together with the action: the maximum they will pay, the minimum
      they will receive, the latest moment the transaction may run, the oldest price it may use.
      Execution inside the limits is valid. Outside them it fails.
  - question: Why not sign the exact expected result?
    answer: >-
      Because the state changes between signing and execution, so the exact result is almost
      never what arrives. A check for equality fails nearly every time, and no check at all lets
      anyone move the result against the user.
  - question: What is slippage in these terms?
    answer: >-
      It is the boundary for a swap. The user signs the minimum output they accept, not a prediction of
      the price. The swap runs while the output stays above the minimum and fails when it drops
      below.
  - question: Where else does the pattern apply?
    answer: >-
      Orders carry a limit price and a deadline. Oracle reads carry a maximum age. Liquidations
      carry the maximum amount the liquidator takes. Anything that runs against moving state gets
      a boundary.
  - question: Who enforces the boundary?
    answer: >-
      The program, on-chain, in the same transaction. A boundary the client checks before sending
      proves nothing, because the state moves after the check.
  - question: Can the boundary itself be wrong?
    answer: >-
      Yes, in both directions. A boundary that is too loose lets the result be moved against the user, and one that is
      too tight makes every transaction fail. Setting it is the user's or the client's choice.
      The program only enforces it.
---

> On-chain state changes between the moment a user signs and the moment the transaction executes. A swap is signed at one price and runs at another, and a position is signed as liquidatable and is topped up a slot later. The exact result the user expected is stale by the time the transaction arrives, so the user cannot consent to an exact result at all.

## The result moves while the transaction waits

Suppose a user swaps SOL for USDC. The client computes the output they will get, and the transaction goes out.

In the moments before it executes, other swaps land in the same pool and move the price. The user gets a little less than computed, or far less if someone saw the transaction coming and traded in front of it.

The program has two bad options. It can check that the output equals the computed one. Then it fails almost every swap, because the exact number is never the same twice. Or it can check nothing and give the user whatever comes out. Then anyone can move the price against them.

The same happens to every action that runs against moving state. An order signed at one price meets another price, and an oracle price that was fresh at signing is a minute old at execution.

## Sign the boundary, not the result

The user signs the limits together with the action, and those limits are the **boundary of consent**: the maximum input, the minimum output, the limit price, the maximum oracle age, the deadline. The program executes inside those limits and fails outside them.

This means the boundary does not predict the result but defines what the user agrees to. For a swap this boundary is called slippage. The user does not promise that the price will stay, but says how far it may move before the swap is no longer what they wanted.

The check has to happen on-chain, in the same transaction as the action, because the state moves after any check the client could do. A limit that the client verified before sending proves nothing by the time the transaction lands.

<svg role="img" viewBox="0 0 720 382" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Signed at one price, executed at another</title><desc>Two boxes. On the left, the user signs a swap with no boundary, the price moves against them before execution, and the swap passes with 60 out. On the right, the user signs the swap with a minimum of 148 out: an execution with 149.6 out passes, and one with 60 out fails.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Signed at one price, executed at another</text>
  <rect x="40" y="70" width="300" height="254" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">No boundary</text>
  <rect x="80" y="110" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="132" text-anchor="middle" font-family="monospace" font-size="9.5" fill="#565653">signed: swap 1 SOL, expect 150</text>
  <line x1="190" y1="146" x2="190" y2="160" stroke="#000000" stroke-width="2"/>
  <polygon points="184,158 196,158 190,168" fill="#000000"/>
  <rect x="80" y="168" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="190" text-anchor="middle" font-family="monospace" font-size="9.5" fill="#565653">price moves before execution</text>
  <line x1="190" y1="204" x2="190" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="184,216 196,216 190,226" fill="#000000"/>
  <rect x="80" y="226" width="220" height="36" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="190" y="248" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="bold">executed: 60 out, passes</text>
  <text x="190" y="306" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">any result is accepted</text>
  <rect x="380" y="70" width="300" height="254" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Boundary signed with the swap</text>
  <rect x="420" y="110" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="132" text-anchor="middle" font-family="monospace" font-size="9.5" fill="#565653">signed: swap 1 SOL, min 148 out</text>
  <line x1="530" y1="146" x2="530" y2="160" stroke="#000000" stroke-width="2"/>
  <polygon points="524,158 536,158 530,168" fill="#000000"/>
  <rect x="420" y="168" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="190" text-anchor="middle" font-family="monospace" font-size="9.5" fill="#565653">149.6 out: passes</text>
  <line x1="530" y1="204" x2="530" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="524,216 536,216 530,226" fill="#000000"/>
  <rect x="420" y="226" width="220" height="36" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="248" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="bold">60 out: fails</text>
  <text x="530" y="306" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">only the agreed range</text>
  <text x="360" y="360" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The user signs how far the result may move. The program enforces it.</text>
</svg>

## Jupiter: the user signs the minimum, not the quote

Jupiter is a swap aggregator, and its quote is a prediction.

The client computes the expected output and shows it to the user. But the transaction the user signs carries the minimum output they accept. The swap executes while the result stays above that minimum, and fails when it drops below. A failed swap costs a fee, and the user keeps their tokens. A swap without a minimum would succeed at any price, including the one an attacker arranged.

## Drift: an order carries its price and its deadline

Drift is a perpetuals exchange, and an order on Drift is a set of boundaries.

A limit order names the worst price the trader accepts. A market order goes through an auction with a start price and an end price, so even a market order has a range it will not leave. An order can carry a deadline after which it cannot fill. The trader does not know which maker will fill them, in which slot, or at which price inside the range. They signed only the range, and no fill outside it can happen.

## Oracles: a price has an age

A program that reads an oracle price gets a value and a timestamp. The value may be fresh or minutes old, depending on when the last update landed.

So the consumer sets a maximum age, and a price older than that is refused, whatever the number says. Drift refuses to fill on a stale price, and Pyth's library takes the maximum age as a parameter of every read. Here the boundary is on the age of the price, not on its value.

## Sign what you agree to, not what you expect

The user never knows the state at the moment their transaction runs, so an exact expected result is useless. Every action that runs against moving state gets a boundary signed with it: how much at most, how little at least, how old, how late. Inside the boundary the transaction runs. Outside it the transaction fails, and that is what the user asked for.
