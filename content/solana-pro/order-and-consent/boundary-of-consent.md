---
id: 1362359609
title: Boundary of consent
type: lecture
order: 20
---

On-chain state can change between signing and execution. An exact expected result may already be stale when the transaction arrives.

The boundaries can be signed together with the intended execution data: maximum input, minimum output, limit price, maximum oracle age or deadline. Execution inside the accepted boundaries is valid, but execution outside of them fails. For example, in swaps, this boundary is slippage. It defines acceptable price movement rather than predicting it. The same pattern applies to orders, oracle reads, liquidations etc.

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

## Examples

**Jupiter.** Jupiter is a swap aggregator, and its quote is a prediction. An expected output can be calculated right on the spot, but the user in fact signs the minimum acceptable output they can agree to. In the moments before the transaction executes, other swaps land in the same pool and move the price, so the user gets a little less than quoted, or far less if someone traded in front of them. The swap executes while the result stays above the minimum, but completely fails when it is below the acceptable minimum. A failed swap costs a fee, and the user keeps their tokens. A swap without a minimum would succeed at any price, including the one an attacker arranged.

**Drift.** Drift is a perpetuals exchange, and an order on it is a set of boundaries. A limit order names the worst price the trader accepts. A market order goes through an auction with a start price and an end price, so even a market order has a range it will not leave. An order can carry a deadline after which it cannot fill. The trader does not know which maker will fill them, in which slot, or at which price inside the range, but they signed the range, and no fill outside it can happen.

**Oracle reads.** A program that reads an oracle price gets a value and a timestamp, and the value may be fresh or minutes old, depending on when the last update landed. So the consumer sets a maximum age, and a price older than that is refused, whatever the number says. Pyth's library takes the maximum age as a parameter of every read, and Drift refuses to fill on a stale price. Here the boundary is on the age of the price, not on its value.
