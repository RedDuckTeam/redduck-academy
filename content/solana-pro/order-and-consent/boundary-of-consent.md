---
id: 1362359609
title: Boundary of consent
type: lecture
order: 20
---

On-chain state can change between signing and execution. An exact expected result may already be stale when the transaction arrives.

The boundaries can be signed together with the intended execution data: maximum input, minimum output, limit price, maximum oracle age or deadline. Execution inside the accepted boundaries is valid, but execution outside of them fails. For example, in swaps, this boundary is slippage. It defines acceptable price movement rather than predicting it. The same pattern applies to orders, oracle reads, liquidations etc.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Boundary of consent</title><desc>A horizontal bar marks the range the user signed, from a minimum to a maximum. The expected result is a hollow point inside it. Two actual results inside the range are marked with checks, one outside is marked with a cross.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Boundary of consent</text>
  <line x1="60" y1="160" x2="660" y2="160" stroke="#565653" stroke-width="1"/>
  <rect x="220" y="140" width="280" height="40" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="360" y="128" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">signed range</text>
  <text x="220" y="196" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">min</text>
  <text x="500" y="196" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">max</text>
  <circle cx="360" cy="160" r="7" fill="#e0deda" stroke="#565653" stroke-width="2"/>
  <text x="360" y="216" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">expected</text>
  <circle cx="300" cy="160" r="7" fill="#000000" stroke="#000000" stroke-width="2"/>
  <path d="M 292 110 l 6 6 l 11 -13" fill="none" stroke="#ed4937" stroke-width="3"/>
  <text x="300" y="96" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">result</text>
  <circle cx="440" cy="160" r="7" fill="#000000" stroke="#000000" stroke-width="2"/>
  <path d="M 432 110 l 6 6 l 11 -13" fill="none" stroke="#ed4937" stroke-width="3"/>
  <text x="440" y="96" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">result</text>
  <circle cx="590" cy="160" r="7" fill="#000000" stroke="#000000" stroke-width="2"/>
  <line x1="583" y1="107" x2="597" y2="121" stroke="#ed4937" stroke-width="3"/>
  <line x1="583" y1="121" x2="597" y2="107" stroke="#ed4937" stroke-width="3"/>
  <text x="590" y="96" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">result</text>
  <text x="360" y="250" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The user signs how far the result may move, not the result itself. Outside the range the transaction fails.</text>
</svg>

## Examples

**Jupiter:** an expected output can be calculated right on the spot, but the user in fact signs the minimum acceptable output they can agree to. The swap executes while the result stays above that minimum, but completely fails when it is below the acceptable minimum.

## In code

The boundary is an argument the user signs with the action. The program runs the action and fails if the result falls outside it.

```rust
pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
    let amount_out = run_swap(&ctx, amount_in)?;
    // min_amount_out is the boundary the user signed, below it the swap fails
    require!(amount_out >= min_amount_out, SwapError::SlippageExceeded);
    settle(ctx, amount_out)
}
```
