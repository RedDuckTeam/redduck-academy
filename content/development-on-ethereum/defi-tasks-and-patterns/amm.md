---
id: 156
title: AMM
type: lecture
order: 5
faq:
  - question: Why did my large swap get a worse rate than a small one?
    answer: >-
      Price impact. A V2 AMM pool holds x * y = k, so each token you take out makes the next
      one dearer, and a big trade travels the whole curve in one move.
  - question: Where does the 0.3% fee go if there is no claim function?
    answer: >-
      Nowhere. The pool pays out as if only 99.7% arrived, so the fee stays in the reserves,
      and no LP tokens are minted against it.
  - question: Can I lose money as an LP even while collecting fees?
    answer: >-
      Yes, impermanent loss. The pool sells whatever is rising and buys whatever is falling. A
      2x move costs 5.7% against holding, 3x costs 13.4%, 4x costs 20%, and 0.5x costs 5.7%
      again.
  - question: Why does the first deposit burn 1,000 wei of LP tokens?
    answer: >-
      To stop share-price inflation. An attacker otherwise deposits dust, mints one wei of LP,
      donates a large amount straight into the pool, and the next depositor's share rounds down
      to zero.
  - question: Why do I have to wrap ETH into WETH first?
    answer: >-
      A pair holds ERC-20s only, and native ETH is not one.
---

## The problem: trading without an order book

Centralized exchanges work with order books. Buyers post bids, sellers post asks, the exchange matches them. On chain, this is hard. Every post and every cancel is a transaction that costs gas. A market maker who wants to update quotes every block goes bankrupt fast.

Uniswap V2 takes a different approach. Instead of matching orders, it holds a pool of both tokens and uses a formula to set the price. Anyone can swap one token for the other against the pool. Anyone can add tokens to the pool to make it deeper.

The simplest formula would be a fixed price, say 1 token A for 1 token B. It works only while every other market trades at the same price. If token A starts trading at 2 token B elsewhere, traders buy A from the pool for 1 until the pool has no A left. So the price has to rise as the reserve shrinks, and each next token A has to cost more than the one before.

## The pool and its rule

A V2 pool, also called a pair, is a contract that holds two tokens, and every pair of tokens has its own contract. A separate Factory contract deploys new pairs deterministically as people want new markets. Both tokens must be ERC-20s, which gives the pool one code path for moving tokens. Native ETH is not an ERC-20, so anyone trading ETH first wraps it into WETH (the ERC-20 wrapper for ETH).

We'll call the two tokens token A and token B. The contract enforces one rule, under which each next token A costs more than the one before:

```
x * y = k
```

`x` is how much of token B the pool holds. `y` is how much of token A the pool holds. `k` is the product, and the pool keeps `k` constant across every swap.

Suppose the pool currently holds 100 of token A and 100 of token B. Then `x = 100`, `y = 100`, and `k = 10,000`. After any swap, the product of the two reserves must still equal 10,000.

## A swap pays out whatever keeps the product constant

A trader wants to swap token B for token A. They put 10 of token B into the pool. What does the contract give them back?

After the trader's deposit, the pool's reserve of token B has grown by 10.

```
x_new = 100 + 10 = 110
```

To keep `k = 10,000`, the pool's reserve of token A must shrink to whatever value satisfies `110 * y_new = 10,000`.

```
y_new = 10,000 / 110 = 90.91
```

The pool used to have 100 of token A. Now it must have 90.91. The difference goes to the trader.

```
trader receives = 100 - 90.91 = 9.09 of token A
```

The trader put in 10 of token B and got 9.09 of token A. There was no price quote and no order matching. The output was whatever amount keeps the product equal to 10,000.

Written as a formula in general terms, with `Δx` for the input and `Δy` for the output:

```
Δy = y - k / (x + Δx)
```

The new reserve of token A must equal `k` divided by the new reserve of token B, and the trader gets whatever the old reserve was minus that. After simplification:

```
Δy = (y * Δx) / (x + Δx)
```

That's the swap formula. It's the invariant `x * y = k` rearranged to solve for the output.

<svg role="img" viewBox="0 0 720 440" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>AMM swap curve x·y = k moving from point (X, Y) to (X + Δx, Y − Δy)</title><desc>The graph plots reserve of token B (x) against reserve of token A (y) on a curve where x times y equals k. A swap moves the pool from a before point (X, Y) to an after point (X + Δx, Y − Δy), with Δx going in and Δy coming out, while the product x·y stays the same.</desc>

<defs>

<marker id="arrU1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">

<path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>

</marker>

</defs>

<rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>

<text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The pool's reserves always sit on the curve  x * y = k</text>

<line x1="100" y1="380" x2="660" y2="380" stroke="#000000" stroke-width="1.5"/>

<line x1="100" y1="80" x2="100" y2="380" stroke="#000000" stroke-width="1.5"/>

<text x="380" y="408" text-anchor="middle" font-family="monospace" font-size="11">reserve of token B  (x)</text>

<text x="60" y="230" text-anchor="middle" font-family="monospace" font-size="11" transform="rotate(-90, 60, 230)">reserve of token A  (y)</text>

<path d="M 145 80 L 150 103 L 158 132 L 166 155 L 177 184 L 189 206 L 202 226 L 218 245 L 235 261 L 255 275 L 274 287 L 297 298 L 322 308 L 351 317 L 386 325 L 428 333 L 467 339 L 515 344 L 564 349 L 612 353 L 660 356"

fill="none" stroke="#000000" stroke-width="2.5"/>

<text x="500" y="285" font-family="monospace" font-size="16" fill="#000000" font-weight="bold">x · y = k</text>

<circle cx="274" cy="287" r="6" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>

<text x="286" y="265" font-family="monospace" font-size="11" font-weight="bold">before</text>

<text x="286" y="278" font-family="monospace" font-size="10">(X, Y)</text>

<line x1="274" y1="287" x2="274" y2="380" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<line x1="100" y1="287" x2="274" y2="287" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="274" y="395" text-anchor="middle" font-family="monospace" font-size="10">X</text>

<text x="92" y="290" text-anchor="end" font-family="monospace" font-size="10">Y</text>

<circle cx="370" cy="321" r="6" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>

<text x="385" y="302" font-family="monospace" font-size="11" font-weight="bold">after</text>

<text x="385" y="315" font-family="monospace" font-size="10">(X + Δx, Y − Δy)</text>

<line x1="370" y1="321" x2="370" y2="380" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<line x1="100" y1="321" x2="370" y2="321" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="370" y="395" text-anchor="middle" font-family="monospace" font-size="10">X + Δx</text>

<text x="92" y="324" text-anchor="end" font-family="monospace" font-size="10">Y − Δy</text>

<path d="M 285 292 Q 320 305, 360 318" fill="none" stroke="#ed4937" stroke-width="2.5" marker-end="url(#arrU1)"/>

<line x1="274" y1="362" x2="370" y2="362" stroke="#ed4937" stroke-width="1.5"/>

<line x1="274" y1="358" x2="274" y2="366" stroke="#ed4937" stroke-width="1.5"/>

<line x1="370" y1="358" x2="370" y2="366" stroke="#ed4937" stroke-width="1.5"/>

<text x="322" y="375" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">Δx in</text>

<line x1="118" y1="287" x2="118" y2="321" stroke="#ed4937" stroke-width="1.5"/>

<line x1="114" y1="287" x2="122" y2="287" stroke="#ed4937" stroke-width="1.5"/>

<line x1="114" y1="321" x2="122" y2="321" stroke="#ed4937" stroke-width="1.5"/>

<text x="128" y="307" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">Δy out</text>

<text x="360" y="428" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">A swap pushes the pool from one point on the curve to another. The product x · y stays the same.</text>

</svg>

The curve `x * y = k` is a hyperbola. The pool's current state is always one point on this curve. The trader's input pushes the pool to the right along the curve, and the contract gives back enough token A to make the pool's new position satisfy the invariant.

## The price changes after every swap

The pool's reserves change after every swap, which means the next trader doing the same swap gets a different result.

After the first trader's swap, the pool is at `(110, 90.91)`. A second trader wants to do the same thing, putting in another 10 of token B.

```
x_new = 110 + 10 = 120
y_new = 10,000 / 120 = 83.33
second trader receives = 90.91 - 83.33 = 7.58 of token A
```

A third trader puts in the same 10 of token B.

```
x_new = 120 + 10 = 130
y_new = 10,000 / 130 = 76.92
third trader receives = 83.33 - 76.92 = 6.41 of token A
```

9.09, then 7.58, then 6.41. Each trader gets less than the one before, even though they all put in the same amount. The pool has been giving away token A and receiving token B, so token A is becoming scarcer in the pool, and the pool charges more for it.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>AMM price curve x·y=k: three trades of Δx=30 give shrinking A output (23.08, 14.42, 9.87)</title><desc>A curve plots reserve of token A (y) against reserve of token B (x), always keeping x times y equal to k. Three traders each swap in the same amount of token B (Δx = 30) starting from a 100/100 pool, and each one gets less token A than the last: 23.08, then 14.42, then 9.87.</desc>

<defs>

<marker id="arrU2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">

<path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>

</marker>

</defs>

<rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>

<text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Three traders, same input. Each one gets less output than the last.</text>

<line x1="100" y1="380" x2="660" y2="380" stroke="#000000" stroke-width="1.5"/>

<line x1="100" y1="80" x2="100" y2="380" stroke="#000000" stroke-width="1.5"/>

<text x="380" y="408" text-anchor="middle" font-family="monospace" font-size="11">reserve of token B  (x)</text>

<text x="60" y="230" text-anchor="middle" font-family="monospace" font-size="11" transform="rotate(-90, 60, 230)">reserve of token A  (y)</text>

<path d="M 145 80 L 150 103 L 158 132 L 166 155 L 177 184 L 189 206 L 202 226 L 218 245 L 235 261 L 255 275 L 274 287 L 297 298 L 322 308 L 351 317 L 386 325 L 428 333 L 467 339 L 515 344 L 564 349 L 612 353 L 660 356"

fill="none" stroke="#000000" stroke-width="2.5"/>

<text x="540" y="270" font-family="monospace" font-size="14" fill="#000000" font-weight="bold">x · y = k</text>

<circle cx="274" cy="287" r="6" fill="#000000"/>

<text x="286" y="265" font-family="monospace" font-size="11" font-weight="bold">start</text>

<text x="286" y="278" font-family="monospace" font-size="10">100 / 100</text>

<circle cx="332" cy="311" r="5" fill="#ed4937"/>

<circle cx="390" cy="326" r="5" fill="#ed4937"/>

<circle cx="448" cy="336" r="5" fill="#ed4937"/>

<path d="M 282 291 Q 305 300, 325 308" fill="none" stroke="#ed4937" stroke-width="2.5" marker-end="url(#arrU2)"/>

<path d="M 340 313 Q 363 320, 383 324" fill="none" stroke="#ed4937" stroke-width="2.5" marker-end="url(#arrU2)"/>

<path d="M 397 328 Q 420 333, 441 335" fill="none" stroke="#ed4937" stroke-width="2.5" marker-end="url(#arrU2)"/>

<line x1="274" y1="287" x2="660" y2="287" stroke="#565653" stroke-width="0.8" stroke-dasharray="2 3"/>

<line x1="332" y1="311" x2="660" y2="311" stroke="#565653" stroke-width="0.8" stroke-dasharray="2 3"/>

<line x1="390" y1="326" x2="660" y2="326" stroke="#565653" stroke-width="0.8" stroke-dasharray="2 3"/>

<line x1="448" y1="336" x2="660" y2="336" stroke="#565653" stroke-width="0.8" stroke-dasharray="2 3"/>

<line x1="618" y1="287" x2="618" y2="311" stroke="#ed4937" stroke-width="2"/>

<line x1="614" y1="287" x2="622" y2="287" stroke="#ed4937" stroke-width="2"/>

<line x1="614" y1="311" x2="622" y2="311" stroke="#ed4937" stroke-width="2"/>

<text x="625" y="302" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">23.08</text>

<line x1="618" y1="311" x2="618" y2="326" stroke="#ed4937" stroke-width="2"/>

<line x1="614" y1="326" x2="622" y2="326" stroke="#ed4937" stroke-width="2"/>

<text x="625" y="322" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">14.42</text>

<line x1="618" y1="326" x2="618" y2="336" stroke="#ed4937" stroke-width="2"/>

<line x1="614" y1="336" x2="622" y2="336" stroke="#ed4937" stroke-width="2"/>

<text x="625" y="335" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">9.87</text>

<text x="303" y="291" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">trade 1</text>

<text x="361" y="312" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">trade 2</text>

<text x="419" y="325" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">trade 3</text>

<rect x="100" y="430" width="560" height="94" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<text x="120" y="452" font-family="monospace" font-size="11" font-weight="bold">Each trader puts in the same Δx = 30 of token B:</text>

<line x1="116" y1="460" x2="644" y2="460" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="120" y="480" font-family="monospace" font-size="11">  trade 1:  pool was 100 / 100      gets  23.08 of A</text>

<text x="120" y="498" font-family="monospace" font-size="11">  trade 2:  pool was 130 / 76.92    gets  14.42 of A</text>

<text x="120" y="516" font-family="monospace" font-size="11">  trade 3:  pool was 160 / 62.50    gets   9.87 of A</text>

</svg>

The diagram shows the same 100 / 100 pool with larger trades, 30 of token B each. The outputs shrink the same way: 23.08, then 14.42, then 9.87. The curve gets flatter as the pool moves to the right, and a flatter curve means less token A given out per token B taken in.

The ratio of the reserves is the pool's **spot price**, the rate a trade gets when it is much smaller than the reserves. At 100 / 100, one token A costs 1 token B. After the three swaps of 10, at 130 / 76.92, it costs `130 / 76.92 = 1.69` token B.

This is the price discovery mechanism. The pool doesn't ask anyone what the price should be. It just defends the invariant, and the invariant produces prices that respond to supply and demand. If token A is in high demand (lots of traders putting B in to get A out), the reserve of A shrinks fast, and the price of A in B rises fast. If demand fades, no swaps happen, and the price stays put.

The contract does not know the price on other markets. Traders called arbitrageurs keep the pool in line with them. When token A is cheaper in the pool than elsewhere, they buy it from the pool and sell it elsewhere, and every purchase raises the pool's price until it matches the market. When it is more expensive in the pool, they do the opposite. Their profit comes out of the pool's reserves. The section on impermanent loss below counts it.

## Why bigger trades face worse rates

What if a single trader put in 30 of token B in one swap instead of three swaps of 10? The pool goes from 100 / 100 straight to `x = 130` and `y = 10,000 / 130 = 76.92`, so the trader receives `100 - 76.92 = 23.08` of token A. That is the sum of 9.09 + 7.58 + 6.41, and it is the first trade in the diagram. The pool ends at the same point whether you arrive in one big swap or three small ones, so the total output is identical.

The single 30-token trade averaged a rate of `23.08 / 30 = 0.77` token A per token B. The first 10-token trade by itself got `9.09 / 10 = 0.91` token A per token B. The bigger your trade relative to the pool, the worse your average rate, because you push deeper into the unfavorable part of the curve in one move.

This effect is called **price impact**. A trader doing a small swap against a deep pool barely moves the price. A trader doing a swap that's a sizable fraction of the pool gets a noticeably worse rate. There's nothing the contract can do about this: the rate is what the invariant produces.

## Where the reserves come from: liquidity providers

The pool needs reserves before anyone can swap against it. **Liquidity providers** (LPs) supply them.

An LP deposits both tokens. They must deposit them in the same ratio the pool currently holds. If the pool is at 100 of token A and 200 of token B, an LP depositing 1 of token A must also deposit 2 of token B. Depositing out of ratio would change the pool's spot price away from the market price, which would invite arbitrage and effectively let the LP donate value to whoever shows up next.

In exchange for the deposit, the LP receives **LP tokens**. LP tokens are themselves an ERC-20 issued by the pool contract. They represent a share of the pool. If an LP owns 10% of the LP token supply, they own a claim on 10% of the pool's reserves. To take their money out, they burn their LP tokens and the contract sends them their share.

The first deposit into a fresh pool is special, because there's no existing ratio. The first LP sets it. The LP tokens minted to them are computed as `sqrt(x_deposit * y_deposit)`. With the square root, doubling both deposited amounts doubles the LP tokens. The plain product `x_deposit * y_deposit` would quadruple them.

For every later deposit, LP tokens are minted in proportion. If an LP adds 5% to the pool's reserves (in the current ratio), the contract mints 5% of the current LP supply to them.

## How LPs get paid: the fee

LPs take real risk by providing liquidity. The composition of the pool changes as traders swap, which means an LP can end up holding more of whichever token has fallen in value and less of whichever has risen. To compensate for that risk, the pool charges traders a fee on every swap.

The fee is 0.3% of the input amount, and it is not sent anywhere. The trader puts in `Δx`, the contract treats only 99.7% of `Δx` as effective input when computing the output, and the remaining 0.3% stays in the reserves.

The swap formula with the fee becomes:

```
Δy = (y * Δx * 997) / (x * 1000 + Δx * 997)
```

That's the same formula as before, but with `Δx` replaced by `Δx * 997 / 1000`. The `* 1000` factor in the denominator is the standard way to handle the 0.3% in integer arithmetic without using floating point.

No new LP tokens are minted to cover the fee, so the total LP supply stays the same while the reserves grow, and each LP token claims a slightly bigger slice of the pool. LPs don't have to claim anything. The contract has no per-LP fee tracker and no `claimFees` function.

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>LP fee accrual across three stages: deposit, fee growth, withdrawal</title><desc>Alice deposits 100 USDC and 0.1 ETH for 3.16 LP tokens, then swaps grow the pool's reserves to 108 USDC and 0.108 ETH while the LP token supply stays at 3.16, so she later withdraws the full 108 USDC and 0.108 ETH. A side panel explains why: fees stay in the pool and no new LP tokens are minted for them, so value per LP token equals reserves divided by total LP supply.</desc>
  <defs>
    <marker id="arrU3" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Fees accrue to LPs: pool grows, LP supply doesn't</text>
  <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">Stage 1: Alice provides initial liquidity</text>
  <rect x="40" y="92" width="300" height="116" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="114" font-family="monospace" font-size="10">Pool reserves:</text>
  <text x="60" y="132" font-family="monospace" font-size="11">  100 USDC,  0.1 ETH</text>
  <text x="60" y="158" font-family="monospace" font-size="10">LP token total supply:</text>
  <text x="60" y="176" font-family="monospace" font-size="11">  3.16  (= sqrt(100 * 0.1))</text>
  <text x="60" y="198" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Alice owns 100% of LP tokens</text>
  <line x1="190" y1="210" x2="190" y2="244" stroke="#ed4937" stroke-width="2" marker-end="url(#arrU3)"/>
  <text x="200" y="232" font-family="monospace" font-size="10" fill="#ed4937">many swaps over time</text>
  <text x="40" y="264" font-family="monospace" font-size="11" font-weight="bold">Stage 2: Time passes, swaps generate fees</text>
  <rect x="40" y="272" width="300" height="116" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="294" font-family="monospace" font-size="10">Pool reserves grew:</text>
  <text x="60" y="312" font-family="monospace" font-size="11">  108 USDC,  0.108 ETH</text>
  <text x="60" y="338" font-family="monospace" font-size="10">LP token total supply unchanged:</text>
  <text x="60" y="356" font-family="monospace" font-size="11">  3.16</text>
  <text x="60" y="378" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Each LP token is worth more now</text>
  <line x1="190" y1="390" x2="190" y2="424" stroke="#ed4937" stroke-width="2" marker-end="url(#arrU3)"/>
  <text x="200" y="412" font-family="monospace" font-size="10" fill="#ed4937">Alice burns LP tokens</text>
  <text x="40" y="444" font-family="monospace" font-size="11" font-weight="bold">Stage 3: Alice withdraws</text>
  <rect x="40" y="452" width="300" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="476" font-family="monospace" font-size="11">  Alice receives  108 USDC,  0.108 ETH</text>
  <rect x="380" y="92" width="300" height="280" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="118" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Why LP tokens become more valuable</text>
  <line x1="400" y1="132" x2="660" y2="132" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="400" y="158" font-family="monospace" font-size="10">Every swap collects a 0.3% fee.</text>
  <text x="400" y="174" font-family="monospace" font-size="10">The fee stays in the pool.</text>
  <text x="400" y="206" font-family="monospace" font-size="10">No LP tokens are minted for fees.</text>
  <text x="400" y="222" font-family="monospace" font-size="10">Reserves grow, supply stays flat.</text>
  <text x="400" y="254" font-family="monospace" font-size="10">Each LP token's share of the pool</text>
  <text x="400" y="270" font-family="monospace" font-size="10">stays the same percentage, but</text>
  <text x="400" y="286" font-family="monospace" font-size="10">that percentage of a bigger pool</text>
  <text x="400" y="302" font-family="monospace" font-size="10">means more underlying tokens.</text>
  <text x="400" y="334" font-family="monospace" font-size="10" font-weight="bold">value per LP token =</text>
  <text x="400" y="352" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">  reserves / total LP supply</text>
</svg>

## Impermanent loss: the cost LPs pay

The risk that the fee pays for is called **impermanent loss** (IL). In an ETH/USDC pool, if ETH appreciates on the market, arbitrageurs buy ETH from the pool, so the pool loses ETH and gains USDC. By the time price has doubled, the pool holds less ETH than at entry. An LP who owns a fixed share of the pool holds proportionally less ETH too. They missed part of the ETH appreciation.

The same happens in reverse. If ETH falls, the pool buys ETH from sellers and ends up with more of it. Either direction, the pool sells the token that is rising and buys the one that is falling, so holding the original tokens would have done better.

Let's count it for one LP, leaving fees aside. Alice is the only LP in the pool. She deposits 1 ETH and 4,000 USDC when ETH costs $4,000, so her deposit is worth $8,000. Then ETH jumps to $8,000 in one step.

If Alice had kept the tokens in her wallet, she would have 1 ETH worth $8,000 plus 4,000 USDC, $12,000 in total.

In the pool, the product of the reserves is still `1 * 4,000 = 4,000`, and arbitrageurs have traded until the ratio of the reserves is 8,000 USDC per ETH. Multiplying the product by the ratio cancels the ETH reserve and leaves the USDC reserve squared, so the pool holds `sqrt(4,000 * 8,000) = 5,657` USDC and `5,657 / 8,000 = 0.707` ETH. Alice withdraws them, and at the new price they are worth `0.707 * 8,000 + 5,657 = $11,313`. That is $687 less than holding, a loss of 5.7%.

The $687 went to the arbitrageurs. They took 0.293 ETH out of the pool, worth $2,344 at the new price, and paid 1,657 USDC for it.

The same count works for any price move. Let `r` be the new price divided by the entry price. Holding is worth `4,000 * r + 4,000`. In the pool, the USDC reserve is `sqrt(4,000 * 4,000 * r) = 4,000 * sqrt(r)`, and the ETH reserve is worth the same amount, because the ratio of the two is the price. So the position is worth `2 * 4,000 * sqrt(r)`. Dividing it by the holding value and subtracting 1 gives the loss relative to holding:

`IL = 2·√r / (1 + r) − 1`

For `r = 2` this is `2 * 1.414 / 3 - 1 = -5.7%`, the number from Alice's example.

<svg role="img" viewBox="0 0 720 600" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Impermanent loss chart and ETH LP-vs-HODL worked example</title><desc>A line chart plots LP loss versus HODL value as the price ratio moves from 0.25x to 4x, showing no loss at the 1x entry price and losses up to −20% at the extremes (for example 2x gives −5.7%, 4x gives −20%). Below it, a worked example compares HODLing versus providing liquidity when ETH price doubles from $4,000 to $8,000: HODL ends at $12,000 total, while the LP position ends at $11,313, a $687 loss from rebalancing.</desc> <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/> <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Impermanent loss: any price move makes the LP worse off than HODLing</text> <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">LP value vs HODL value, as a function of price change</text> <line x1="100" y1="100" x2="100" y2="270" stroke="#000000" stroke-width="1.5"/> <line x1="100" y1="100" x2="660" y2="100" stroke="#000000" stroke-width="1.5"/> <line x1="100" y1="270" x2="660" y2="270" stroke="#565653" stroke-width="0.5" stroke-dasharray="3 3"/> <text x="92" y="104" text-anchor="end" font-family="monospace" font-size="9">0%</text> <text x="92" y="140" text-anchor="end" font-family="monospace" font-size="9">−5%</text> <line x1="98" y1="137" x2="102" y2="137" stroke="#000000" stroke-width="1"/> <text x="92" y="178" text-anchor="end" font-family="monospace" font-size="9">−10%</text> <line x1="98" y1="175" x2="102" y2="175" stroke="#000000" stroke-width="1"/> <text x="92" y="218" text-anchor="end" font-family="monospace" font-size="9">−15%</text> <line x1="98" y1="215" x2="102" y2="215" stroke="#000000" stroke-width="1"/> <text x="92" y="252" text-anchor="end" font-family="monospace" font-size="9">−20%</text> <line x1="98" y1="249" x2="102" y2="249" stroke="#000000" stroke-width="1"/> <text x="50" y="190" text-anchor="middle" font-family="monospace" font-size="10" transform="rotate(-90, 50, 190)">LP loss vs HODL</text> <line x1="100" y1="97" x2="100" y2="103" stroke="#000000" stroke-width="1"/> <line x1="240" y1="97" x2="240" y2="103" stroke="#000000" stroke-width="1"/> <line x1="380" y1="97" x2="380" y2="103" stroke="#000000" stroke-width="1"/> <line x1="520" y1="97" x2="520" y2="103" stroke="#000000" stroke-width="1"/> <line x1="660" y1="97" x2="660" y2="103" stroke="#000000" stroke-width="1"/> <text x="100" y="92" text-anchor="middle" font-family="monospace" font-size="9">0.25x</text> <text x="240" y="92" text-anchor="middle" font-family="monospace" font-size="9">0.5x</text> <text x="380" y="92" text-anchor="middle" font-family="monospace" font-size="9">1x (entry)</text> <text x="520" y="92" text-anchor="middle" font-family="monospace" font-size="9">2x</text> <text x="660" y="92" text-anchor="middle" font-family="monospace" font-size="9">4x</text> <text x="380" y="290" text-anchor="middle" font-family="monospace" font-size="10">price ratio (current price / entry price)</text> <path d="M 100 251 Q 145 222, 193 193 Q 215 168, 240 143 Q 270 125, 303 113 Q 320 106, 345 102 L 380 100 L 425 105 Q 442 110, 462 115 Q 490 128, 520 143 Q 545 158, 565 175 Q 580 187, 597 200 Q 625 225, 660 251" fill="none" stroke="#ed4937" stroke-width="2.5"/> <circle cx="380" cy="100" r="4" fill="#000000"/> <text x="380" y="118" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">no loss</text> <circle cx="520" cy="143" r="4" fill="#ed4937"/> <text x="540" y="140" font-family="monospace" font-size="9" font-weight="bold">2x → −5.7%</text> <circle cx="240" cy="143" r="4" fill="#ed4937"/> <text x="220" y="140" text-anchor="end" font-family="monospace" font-size="9" font-weight="bold">0.5x → −5.7%</text> <circle cx="597" cy="200" r="4" fill="#ed4937"/> <text x="585" y="218" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">3x → −13.4%</text> <circle cx="660" cy="251" r="4" fill="#ed4937"/> <text x="660" y="263" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">4x → −20%</text> <circle cx="100" cy="251" r="4" fill="#ed4937"/> <text x="100" y="263" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">0.25x → −20%</text> <text x="40" y="330" font-family="monospace" font-size="11" font-weight="bold">Worked example: ETH doubles from $4,000 to $8,000</text> <rect x="40" y="346" width="640" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="60" y="367" font-family="monospace" font-size="10" font-weight="bold">At entry (ETH = $4,000):</text> <text x="60" y="380" font-family="monospace" font-size="10"> Alice has 1 ETH + 4,000 USDC, total value = $8,000. She splits her capital evenly.</text> <rect x="40" y="400" width="310" height="140" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="195" y="422" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Path A: HODL</text> <line x1="60" y1="430" x2="330" y2="430" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/> <text x="60" y="450" font-family="monospace" font-size="10">She keeps her tokens in her wallet.</text> <text x="60" y="475" font-family="monospace" font-size="10">When ETH hits $8,000:</text> <text x="60" y="491" font-family="monospace" font-size="10"> 1 ETH × $8,000 = $8,000</text> <text x="60" y="505" font-family="monospace" font-size="10"> + 4,000 USDC = $4,000</text> <text x="60" y="528" font-family="monospace" font-size="11" font-weight="bold"> total = $12,000</text> <rect x="370" y="400" width="310" height="140" fill="#e0deda" stroke="#ed4937" stroke-width="2"/> <text x="525" y="422" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Path B: LP in V2 pool</text> <line x1="390" y1="430" x2="660" y2="430" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/> <text x="390" y="450" font-family="monospace" font-size="10">Pool rebalances as price rises.</text> <text x="390" y="475" font-family="monospace" font-size="10">When ETH hits $8,000, she now holds:</text> <text x="390" y="491" font-family="monospace" font-size="10"> 0.707 ETH × $8,000 = $5,657</text> <text x="390" y="505" font-family="monospace" font-size="10"> + 5,657 USDC = $5,657</text> <text x="390" y="528" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937"> total = $11,313</text> <rect x="40" y="555" width="640" height="38" fill="#e0deda" stroke="#ed4937" stroke-width="2"/> <text x="360" y="578" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">Difference: $687 lost to rebalancing (the −5.7% in the chart above)</text> </svg>

The chart plots this formula. The loss is symmetric: a 2x move and a 0.5x move both produce 5.7% loss, and a 4x move and a 0.25x move both produce 20%.

### Why "impermanent"

The loss is only impermanent in one specific sense: if price returns to entry before you withdraw, the loss disappears. The pool has rebalanced back to its original composition and you get out what you put in.

If you withdraw at any other price, the loss is realized and permanent. Most LP exits happen at prices different from entry, so the loss is best understood as the cost of providing liquidity, paid in full when you exit.

### Fees vs IL

An LP position beats holding only if the earned fees exceed the impermanent loss. In Alice's example, her fees over the period would have to be more than $687.

For stablecoin pairs the price ratio barely moves, so IL stays negligible and small fee income wins. For volatile pairs the math is closer. ETH/USDC on a 0.3% pool needs enough trading volume to pay back the IL accumulated from price movement. Pools where trading volume is high relative to the pool's total assets earn back impermanent loss and more, and quiet pools do not.

## The first deposit locks 1000 wei of LP tokens

The first LP into a fresh pool gets `sqrt(x_deposit * y_deposit)` LP tokens. V2 mints them slightly less than that, and burns a small amount (1000 wei, the smallest units of the LP token) by sending them to `address(0)`, where nobody can ever spend them. This is the **minimum liquidity lock**.

Without it, the first LP can make one wei of LP so expensive that the next depositor's share is rounded away.

1. The attacker is the first LP. They deposit 1 wei of each token and get `sqrt(1 * 1) = 1` wei of LP tokens.
2. The attacker transfers 1,000 tokens of each kind directly into the pool contract, calling `transfer` on the underlying tokens and bypassing the add-liquidity function. The pool's reserves are now 1,000 of each token, but the LP supply is still 1 wei.
3. A victim deposits 1,500 of each token, which is 150% of the reserves, so their proportional share is 1.5 wei of LP. The contract works in integers and rounds down, so they get 1 wei.
4. The pool holds 2,500 of each token against 2 wei of LP. The attacker burns their 1 wei and withdraws half, 1,250 of each token. They put in 1,000, and the extra 250 is the victim's.

A deposit below 1,000 tokens does worse. Its proportional share rounds down to zero LP tokens, and the depositor loses the whole deposit to the attacker.

Now repeat the attack with the lock. To end up with 1 wei of LP the attacker has to deposit 1,001 wei of each token: `sqrt(1,001 * 1,001) = 1,001`, of which 1,000 are burned. After the same donation the LP supply is 1,001 wei, and the attacker owns 1 of them. The victim's deposit is again 150% of the reserves, and 150% of 1,001 wei is 1,501.5, rounded down to 1,501. Their 1,501 wei out of 2,502 redeem for 1,499.8 of the 2,500 tokens of each kind, so rounding cost them 0.2 of a token instead of 250. The attacker's 1 wei redeems for about 1 token of each kind, and the rest of the 1,000 they donated backs the burned wei, which nobody can redeem.

Burning 1000 wei of LP tokens at the first deposit means there's always a baseline supply that nobody owns and nobody can manipulate around. This caps how much an attacker can inflate the per-share value. The [ERC-4626 lesson](/courses/development-on-ethereum/tokens-beyond-erc-20/erc-4626-tokenized-vaults) shows the same attack on vault shares and a second defense against it.

When you build your own version, check it with one question: if the first LP holds 1 wei of LP and then transfers tokens straight to the pool, how many LP tokens does the next depositor get?
