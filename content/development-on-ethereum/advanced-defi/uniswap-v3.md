---
id: 172
title: Uniswap V3
type: lecture
order: 2
faq:
  - question: How much more capital efficient is a V3 range than a V2 position?
    answer: >-
      In V2 your deposit covers every price from zero to infinity, and often under 5% of it
      sits near the current price. The same $10,000 concentrated into $3,000 to $4,000 gives
      the depth of roughly $100,000 in V2. Out of range you earn nothing.
  - question: Why are there four ETH/USDC pools on V3 instead of one?
    answer: >-
      One per fee tier, each with its own tick spacing. 0.01% with spacing 1 for pairs that
      should trade at almost the same price, 0.05% with 10 for correlated assets, 0.30% with
      60 for typical pairs, 1.00% with 200 for exotic ones. A tick is one 0.01% price step.
  - question: Why did Uniswap only let me deposit one of the two tokens?
    answer: >-
      Your range sits entirely on one side of the current price.
  - question: Can I use a V3 position as a limit order?
    answer: >-
      Close to one. A narrow range above the current price, funded with only ETH, comes out as
      USDC once price crosses it.
  - question: Why is my LP position an NFT?
    answer: >-
      Ranges differ, so no two positions are alike. Each one is an ERC-721 minted through the
      NonfungiblePositionManager.
---

## What's wrong with V2

A V2 pool prices trades along the hyperbola `x * y = k`. The curve covers every possible price from zero to infinity.

The trouble is that LPs end up providing depth at prices that will never trade. If the current ETH price is $3,500 and you deposit $10,000 into a V2 ETH/USDC pool, a small fraction of your $10,000 is providing liquidity at prices near $3,500, where trades happen. The rest is reserved for trades at $1, at $100,000, at $1,000,000, and earns no fees.

You can count the fraction. With price `P` in USDC per ETH, the rule `x * y = k` makes the ETH reserve `√(k / P)` and the USDC reserve `√(k * P)`, as the [AMM lesson](/courses/development-on-ethereum/defi-tasks-and-patterns/amm) showed when it counted impermanent loss. If price rises from $3,500 to $4,000, the ETH reserve shrinks by a factor of `√(3,500 / 4,000) ≈ 0.935`, so the pool sells 6.5% of its ETH. If price falls from $3,500 to $3,000, the USDC reserve shrinks by `√(3,000 / 3,500) ≈ 0.926`, so the pool spends 7.4% of its USDC. Half of your deposit is ETH and half is USDC, so while price stays between $3,000 and $4,000 the pool uses about 7% of it, roughly $700. For a band of 10% either side of the current price it uses under 5%.

## V3's idea: concentrated liquidity

V3 lets an LP say: "I think ETH will trade between $3,000 and $4,000. Concentrate all my capital in that range." The LP picks a lower price `Pl` and an upper price `Pu`. Their capital provides depth only in `[Pl, Pu]`. If trades happen inside that range, they earn fees. If price moves outside their range, their position earns nothing until either the price comes back or the LP repositions.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Uniswap V2 liquidity spread across all prices vs V3 concentrated in $3,000 to $4,000</title><desc>Two bar charts compare a $10,000 deposit: in Uniswap V2 it spreads evenly across every price from $0 to infinity, while in Uniswap V3 the same $10,000 concentrates only between $3,000 and $4,000. A boxed note states the tradeoff: if price leaves the V3 range, the position earns zero fees until it re-enters or the LP repositions.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">V2 spreads your capital across every price. V3 lets you concentrate it.</text>
  <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">Uniswap V2: same $10,000 deposit spread across all prices</text>
  <line x1="50" y1="180" x2="680" y2="180" stroke="#000000" stroke-width="1.5"/>
  <text x="685" y="184" font-family="monospace" font-size="9">price</text>
  <rect x="60" y="158" width="6" height="22" fill="#ed4937"/>
  <rect x="90" y="155" width="6" height="25" fill="#ed4937"/>
  <rect x="120" y="152" width="6" height="28" fill="#ed4937"/>
  <rect x="150" y="148" width="6" height="32" fill="#ed4937"/>
  <rect x="180" y="144" width="6" height="36" fill="#ed4937"/>
  <rect x="210" y="140" width="6" height="40" fill="#ed4937"/>
  <rect x="240" y="135" width="6" height="45" fill="#ed4937"/>
  <rect x="270" y="130" width="6" height="50" fill="#ed4937"/>
  <rect x="300" y="125" width="6" height="55" fill="#ed4937"/>
  <rect x="330" y="120" width="6" height="60" fill="#ed4937"/>
  <rect x="360" y="118" width="6" height="62" fill="#ed4937"/>
  <rect x="390" y="120" width="6" height="60" fill="#ed4937"/>
  <rect x="420" y="125" width="6" height="55" fill="#ed4937"/>
  <rect x="450" y="130" width="6" height="50" fill="#ed4937"/>
  <rect x="480" y="135" width="6" height="45" fill="#ed4937"/>
  <rect x="510" y="140" width="6" height="40" fill="#ed4937"/>
  <rect x="540" y="144" width="6" height="36" fill="#ed4937"/>
  <rect x="570" y="148" width="6" height="32" fill="#ed4937"/>
  <rect x="600" y="152" width="6" height="28" fill="#ed4937"/>
  <rect x="630" y="155" width="6" height="25" fill="#ed4937"/>
  <rect x="660" y="158" width="6" height="22" fill="#ed4937"/>
  <line x1="363" y1="100" x2="363" y2="190" stroke="#000000" stroke-width="2" stroke-dasharray="3 3"/>
  <text x="363" y="95" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="60" y="200" font-family="monospace" font-size="9">$0</text>
  <text x="363" y="200" text-anchor="middle" font-family="monospace" font-size="9">$3,500</text>
  <text x="666" y="200" text-anchor="end" font-family="monospace" font-size="9">$∞</text>
  <text x="60" y="222" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Most of your money provides liquidity at prices that will never trade.</text>
  <text x="60" y="236" font-family="monospace" font-size="10" fill="#565653" font-style="italic">It's "deployed" but earning no fees.</text>
  <text x="40" y="277" font-family="monospace" font-size="11" font-weight="bold">Uniswap V3: same $10,000 concentrated in [$3,000, $4,000]</text>
  <line x1="50" y1="396" x2="680" y2="396" stroke="#000000" stroke-width="1.5"/>
  <text x="685" y="400" font-family="monospace" font-size="9">price</text>
  <rect x="300" y="296" width="6" height="100" fill="#ed4937"/>
  <rect x="315" y="296" width="6" height="100" fill="#ed4937"/>
  <rect x="330" y="296" width="6" height="100" fill="#ed4937"/>
  <rect x="345" y="296" width="6" height="100" fill="#ed4937"/>
  <rect x="360" y="296" width="6" height="100" fill="#ed4937"/>
  <rect x="375" y="296" width="6" height="100" fill="#ed4937"/>
  <rect x="390" y="296" width="6" height="100" fill="#ed4937"/>
  <rect x="405" y="296" width="6" height="100" fill="#ed4937"/>
  <rect x="420" y="296" width="6" height="100" fill="#ed4937"/>
  <line x1="300" y1="296" x2="300" y2="406" stroke="#000000" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="425" y1="296" x2="425" y2="406" stroke="#000000" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="300" y="418" text-anchor="middle" font-family="monospace" font-size="9">$3,000</text>
  <text x="425" y="418" text-anchor="middle" font-family="monospace" font-size="9">$4,000</text>
  <line x1="363" y1="280" x2="363" y2="406" stroke="#000000" stroke-width="2" stroke-dasharray="3 3"/>
  <text x="363" y="263" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="60" y="418" font-family="monospace" font-size="9">$0</text>
  <text x="666" y="418" text-anchor="end" font-family="monospace" font-size="9">$∞</text>
  <text x="60" y="440" font-family="monospace" font-size="10" fill="#565653" font-style="italic">All your money provides deep liquidity exactly where trades actually happen.</text>
  <text x="60" y="454" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Fees per dollar deposited are dramatically higher.</text>
  <rect x="40" y="478" width="640" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="498" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">The tradeoff:</text>
  <text x="60" y="516" font-family="monospace" font-size="10">If price leaves your range, your position earns zero fees until it re-enters or you reposition.</text>
</svg>

A V3 position holds only the tokens the pool uses inside the range. In the example that was about $700 of every $10,000, so $10,000 in the range `[$3,000, $4,000]` gives the same depth as a V2 deposit about 14 times larger, well over $100,000. For a range of 10% either side of the current price the multiplier is about 20. Traders get a pool that is deeper near the current price, so the same trade moves the price less.

A narrower range earns more fees per dollar while price is inside it, but price leaves it sooner, and then the LP has to move the position. V2's passive LPs earn less per dollar but never go out of range. So V3 isn't strictly better than V2: it trades capital efficiency for active management.

## Range boundaries sit on a grid of ticks

The obvious design lets each LP pick any two prices as boundaries, and it breaks in the swap. Call a position's depth its liquidity: twice the liquidity trades twice as many tokens for the same price move, and where ranges overlap their liquidity adds up. To price a trade, the pool needs the total liquidity in range at the current price, and that total changes every time price crosses a boundary of some position. A pool can hold thousands of positions, and a swap that looped over them would cost more gas with every position opened.

So a swap never looks at positions. The pool keeps one number, the liquidity in range at the current price, and for each boundary a record of how much liquidity starts or stops counting when price crosses it. Opening a position updates the two records at its boundaries. A swap trades against the current liquidity until price reaches the next boundary, applies the change recorded there, and continues. Its cost depends on the number of boundaries it crosses, not on the number of positions.

This only helps if positions share boundaries. If a boundary could be any price, every position would add two records of its own and a swap would stop at each. So V3 restricts boundaries to a fixed grid of price levels called **ticks**, and positions that share a boundary share its record.

The grid is geometric:

```
price(tick) = 1.0001 ^ tick
```

Moving from one tick to the next multiplies the price by 1.0001, a change of 0.01% (one basis point). Tick 0 corresponds to price 1.0, tick 1 to price 1.0001, tick -1 to price 0.9999. A fixed step in dollars would not fit every pair: one cent is too coarse for a token worth two cents and needlessly fine for one worth $3,500. A percentage step fits both. The number 1.0001 was chosen because it makes the per-tick step equal to a clean basis point, the unit traders already use for price changes.

Ticks around 81,800 correspond to prices around 3,566. A pool has a `token0` and a `token1`, and its price is `token1` per `token0`, so if you swap the order, ticks flip sign. Frontends and SDKs convert between tick numbers and human-readable prices for you.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Uniswap V3 ticks 81797-81806 mapped to ETH/USDC prices, formula, and fee-tier spacing</title><desc>A number line shows ticks 81797 to 81806, each 0.01% apart, next to the matching ETH/USDC prices from 3565.07 to 3568.28. Below it, the formula price(tick) = 1.0001^tick appears, along with a table of fee tiers (0.01% to 1.00%) and their tick spacing (1, 10, 60, 200).</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A tick is just a discrete price level. Each step is 0.01% from the next.</text>
  <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">Possible price levels:</text>
  <line x1="60" y1="160" x2="680" y2="160" stroke="#000000" stroke-width="1.5"/>
  <line x1="100" y1="155" x2="100" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="160" y1="155" x2="160" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="220" y1="155" x2="220" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="280" y1="155" x2="280" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="340" y1="155" x2="340" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="400" y1="155" x2="400" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="460" y1="155" x2="460" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="520" y1="155" x2="520" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="580" y1="155" x2="580" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="640" y1="155" x2="640" y2="165" stroke="#000000" stroke-width="1.5"/>
  <text x="100" y="142" text-anchor="middle" font-family="monospace" font-size="9">tick</text>
  <text x="100" y="125" text-anchor="middle" font-family="monospace" font-size="10">81797</text>
  <text x="160" y="125" text-anchor="middle" font-family="monospace" font-size="10">81798</text>
  <text x="220" y="125" text-anchor="middle" font-family="monospace" font-size="10">81799</text>
  <text x="280" y="125" text-anchor="middle" font-family="monospace" font-size="10">81800</text>
  <text x="340" y="125" text-anchor="middle" font-family="monospace" font-size="10">81801</text>
  <text x="400" y="125" text-anchor="middle" font-family="monospace" font-size="10">81802</text>
  <text x="460" y="125" text-anchor="middle" font-family="monospace" font-size="10">81803</text>
  <text x="520" y="125" text-anchor="middle" font-family="monospace" font-size="10">81804</text>
  <text x="580" y="125" text-anchor="middle" font-family="monospace" font-size="10">81805</text>
  <text x="640" y="125" text-anchor="middle" font-family="monospace" font-size="10">81806</text>
  <text x="100" y="182" text-anchor="middle" font-family="monospace" font-size="10">3565.07</text>
  <text x="160" y="182" text-anchor="middle" font-family="monospace" font-size="10">3565.42</text>
  <text x="220" y="182" text-anchor="middle" font-family="monospace" font-size="10">3565.78</text>
  <text x="280" y="182" text-anchor="middle" font-family="monospace" font-size="10">3566.14</text>
  <text x="340" y="182" text-anchor="middle" font-family="monospace" font-size="10">3566.49</text>
  <text x="400" y="182" text-anchor="middle" font-family="monospace" font-size="10">3566.85</text>
  <text x="460" y="182" text-anchor="middle" font-family="monospace" font-size="10">3567.21</text>
  <text x="520" y="182" text-anchor="middle" font-family="monospace" font-size="10">3567.56</text>
  <text x="580" y="182" text-anchor="middle" font-family="monospace" font-size="10">3567.92</text>
  <text x="640" y="182" text-anchor="middle" font-family="monospace" font-size="10">3568.28</text>
  <text x="370" y="200" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">price in USDC per ETH</text>
  <line x1="100" y1="220" x2="160" y2="220" stroke="#ed4937" stroke-width="1.5"/>
  <line x1="100" y1="217" x2="100" y2="223" stroke="#ed4937" stroke-width="1.5"/>
  <line x1="160" y1="217" x2="160" y2="223" stroke="#ed4937" stroke-width="1.5"/>
  <text x="130" y="237" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937">+0.01%</text>
  <line x1="160" y1="220" x2="220" y2="220" stroke="#ed4937" stroke-width="1.5"/>
  <line x1="220" y1="217" x2="220" y2="223" stroke="#ed4937" stroke-width="1.5"/>
  <text x="190" y="237" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937">+0.01%</text>
  <rect x="40" y="260" width="640" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="282" font-family="monospace" font-size="11">The formula:</text>
  <text x="200" y="282" font-family="monospace" font-size="12" font-weight="bold" fill="#ed4937">price(tick) = 1.0001 ^ tick</text>
  <text x="60" y="298" font-family="monospace" font-size="9" fill="#565653" font-style="italic">Each tick is one 0.01% step away from the next. The math doesn't need to be memorized.</text>
  <rect x="40" y="330" width="640" height="110" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="352" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Not every tick is usable: fee tier sets the spacing</text>
  <line x1="60" y1="362" x2="660" y2="362" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="382" font-family="monospace" font-size="10">  0.01% fee  →  tick spacing 1     (stablecoin pairs, tight ranges)</text>
  <text x="60" y="398" font-family="monospace" font-size="10">  0.05% fee  →  tick spacing 10    (correlated assets like ETH/staked-ETH)</text>
  <text x="60" y="414" font-family="monospace" font-size="10">  0.30% fee  →  tick spacing 60    (typical pairs like ETH/USDC)</text>
  <text x="60" y="430" font-family="monospace" font-size="10">  1.00% fee  →  tick spacing 200   (exotic pairs, wide ranges)</text>
</svg>

## Every crossed boundary costs gas, so pools space their ticks

Each boundary a swap crosses costs gas, because the pool reads the record stored there and updates its liquidity. So a pool does not allow a boundary on every tick. A pool with **tick spacing** 60 only allows positions whose endpoints are multiples of 60. With a coarser spacing a swap crosses fewer boundaries, and LPs pick their ranges from a coarser ladder.

V2 had one fee, 0.30%. V3 has four fee tiers, from 0.01% to 1.00%, and each tier is a separate pool with its own tick spacing. The 0.01% tier is for pairs that should trade at almost identical prices, like two stablecoins. Such a price stays within a few ticks, and this tier has spacing 1. The 1.00% tier is for exotic pairs with high volatility, where one swap can move price across many ticks, and it has spacing 200. Liquidity is split across these tiers, which is a real downside: thin markets fragment further. The Uniswap router handles this by routing trades through whichever pool gives the best execution.

## Fees are shared without visiting positions

Fees raise the same problem. In V2 the fee stays in the reserves and every LP token becomes worth a little more, so the pool tracks nothing per LP (see the [AMM lesson](/courses/development-on-ethereum/defi-tasks-and-patterns/amm)). In V3 a swap's fee belongs only to the positions in range at that price, in proportion to their liquidity, and the swap cannot visit them.

The pool uses the technique from the [TWAP lesson](/courses/development-on-ethereum/oracles/twap-oracles), where one running total replaced a stored history of prices. Here the running total is the fee collected per unit of liquidity. A swap divides its fee by the liquidity in range and adds the result to the total. Each position stores a marker, the value the total had when the position was last updated. When the LP adds liquidity, removes it, or collects, the position is owed the growth of the total since then, counted only while price was inside its range, times the position's liquidity.

## The range decides which tokens you deposit

In V2, you always deposit both tokens, in the ratio set by the current pool price. In V3, the ratio depends on where your chosen range sits relative to the current price, and it's not up to you: the range you pick forces the composition.

<svg role="img" viewBox="0 0 720 700" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Three Uniswap V3 position types by price range: below, straddling, above</title><desc>Shows three Uniswap V3 price ranges compared to a current price of $3,500. A range below current price needs only USDC, a range straddling it needs both USDC and ETH, and a range above it needs only ETH, because the chosen range forces the deposit ratio.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Three position types. The range you pick decides which token(s) you deposit.</text>
  <text x="40" y="82" font-family="monospace" font-size="11" font-weight="bold">Range BELOW current price  ->  deposit only USDC</text>
  <line x1="60" y1="120" x2="660" y2="120" stroke="#000000" stroke-width="1.5"/>
  <rect x="120" y="110" width="220" height="20" fill="#ed4937" fill-opacity="0.3" stroke="#ed4937" stroke-width="1.5"/>
  <text x="120" y="148" text-anchor="middle" font-family="monospace" font-size="9">$2,000</text>
  <text x="340" y="148" text-anchor="middle" font-family="monospace" font-size="9">$3,000</text>
  <line x1="500" y1="100" x2="500" y2="135" stroke="#000000" stroke-width="2"/>
  <text x="500" y="95" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="500" y="148" text-anchor="middle" font-family="monospace" font-size="9">$3,500</text>
  <text x="660" y="115" text-anchor="end" font-family="monospace" font-size="9">price</text>
  <text x="60" y="172" font-family="monospace" font-size="10" font-weight="bold">You deposit:</text>
  <text x="160" y="172" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">100% USDC</text>
  <text x="60" y="190" font-family="monospace" font-size="10" fill="#565653">Why: for price to enter this range, it must FALL.</text>
  <text x="60" y="204" font-family="monospace" font-size="10" fill="#565653">As price falls, the pool buys ETH from sellers, paying out USDC.</text>
  <text x="60" y="218" font-family="monospace" font-size="10" fill="#565653">Your USDC is the inventory being spent.</text>
  <text x="60" y="240" font-family="monospace" font-size="10" fill="#565653" font-style="italic">If price falls to $2,000, all your USDC is now ETH. Functionally a "buy ETH at $3,000 or lower" order.</text>
  <text x="40" y="282" font-family="monospace" font-size="11" font-weight="bold">Range STRADDLING current price  ->  deposit BOTH tokens</text>
  <line x1="60" y1="320" x2="660" y2="320" stroke="#000000" stroke-width="1.5"/>
  <rect x="310" y="310" width="340" height="20" fill="#ed4937" fill-opacity="0.3" stroke="#ed4937" stroke-width="1.5"/>
  <text x="310" y="348" text-anchor="middle" font-family="monospace" font-size="9">$3,000</text>
  <text x="650" y="348" text-anchor="middle" font-family="monospace" font-size="9">$4,500</text>
  <line x1="420" y1="300" x2="420" y2="335" stroke="#000000" stroke-width="2"/>
  <text x="420" y="295" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="420" y="348" text-anchor="middle" font-family="monospace" font-size="9">$3,500</text>
  <text x="660" y="315" text-anchor="end" font-family="monospace" font-size="9">price</text>
  <text x="60" y="372" font-family="monospace" font-size="10" font-weight="bold">You deposit:</text>
  <text x="160" y="372" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">both USDC and ETH</text>
  <text x="60" y="390" font-family="monospace" font-size="10" fill="#565653">Why: the range covers prices above AND below current.</text>
  <text x="60" y="404" font-family="monospace" font-size="10" fill="#565653">If price rises, the pool needs ETH to sell. If price falls, USDC to buy.</text>
  <text x="60" y="418" font-family="monospace" font-size="10" fill="#565653">Position needs both, in a ratio determined by where current sits in the range.</text>
  <text x="60" y="440" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Closer to lower bound → more ETH. Closer to upper bound → more USDC.</text>
  <text x="40" y="482" font-family="monospace" font-size="11" font-weight="bold">Range ABOVE current price  ->  deposit only ETH</text>
  <line x1="60" y1="520" x2="660" y2="520" stroke="#000000" stroke-width="1.5"/>
  <rect x="440" y="510" width="220" height="20" fill="#ed4937" fill-opacity="0.3" stroke="#ed4937" stroke-width="1.5"/>
  <text x="440" y="548" text-anchor="middle" font-family="monospace" font-size="9">$4,500</text>
  <text x="660" y="548" text-anchor="middle" font-family="monospace" font-size="9">$5,500</text>
  <line x1="280" y1="500" x2="280" y2="535" stroke="#000000" stroke-width="2"/>
  <text x="280" y="495" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="280" y="548" text-anchor="middle" font-family="monospace" font-size="9">$3,500</text>
  <text x="660" y="515" text-anchor="end" font-family="monospace" font-size="9">price</text>
  <text x="60" y="572" font-family="monospace" font-size="10" font-weight="bold">You deposit:</text>
  <text x="160" y="572" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">100% ETH</text>
  <text x="60" y="590" font-family="monospace" font-size="10" fill="#565653">Why: for price to enter this range, it must RISE.</text>
  <text x="60" y="604" font-family="monospace" font-size="10" fill="#565653">As price rises, the pool sells ETH to buyers, collecting USDC.</text>
  <text x="60" y="618" font-family="monospace" font-size="10" fill="#565653">Your ETH is the inventory being sold.</text>
  <text x="60" y="640" font-family="monospace" font-size="10" fill="#565653" font-style="italic">If price rises to $5,500, all your ETH is now USDC. Functionally a "sell ETH at $4,500 or higher" order.</text>
  <rect x="40" y="660" width="640" height="30" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="680" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">The deposit ratio is forced by the range, not by you.</text>
</svg>

To see why, look at what the pool does when price moves. When price rises, someone is buying ETH: they send USDC into the pool, the pool sends ETH out. When price falls, someone is selling ETH: they send ETH into the pool, the pool sends USDC out. So the pool needs ETH to sell while price rises and USDC to buy while price falls.

Take a range entirely above the current price, `[$4,500, $5,500]` with ETH at $3,500. For price to reach this range it has to rise to $4,500, then keep rising to cross it. The pool is selling ETH the whole way, so you deposit only ETH. As price rises through your range, your ETH gradually gets sold off in exchange for USDC. By the time price reaches $5,500, all your ETH is gone, replaced by USDC.

A range entirely below the current price, such as `[$2,000, $3,000]`, is the mirror image: you deposit only USDC, and the pool spends it buying ETH as price falls through the range.

A range that straddles the current price can be crossed in either direction, so it needs both tokens. The $10,000 position in `[$3,000, $4,000]` at $3,500 holds about $4,650 of ETH to sell on the way up to $4,000 and about $5,350 of USDC to spend on the way down to $3,000. In every case a position holds only ETH at its lower boundary `Pl` and only USDC at its upper boundary `Pu`.

## A narrow range works like a limit order

Suppose ETH is at $3,500 and you want to sell at $4,000. In V2, you'd have to monitor the price and execute a swap when it hits your target. In V3, you create a tight position with range `[$4,000, $4,005]`. The position is entirely above current price, so you deposit only ETH. If price never reaches $4,000, the position sits idle. If price moves through $4,000 to $4,005, your ETH gets swapped for USDC inside the range, and by the time price exits at the top, your position holds 100% USDC at an average price near $4,000. A limit buy is the same with a tight range below current.

Unlike a true limit order, the position earns fees while it fills, and the fill is not final. If price comes back down through the range, the pool buys ETH back with your USDC, and the position is all ETH again. To keep the USDC, you have to withdraw the position after price has crossed it.

## Positions are not interchangeable, so each one is an NFT

V2 LP positions were ERC-20 tokens. Every LP in a V2 pool had the same kind of claim, just for different amounts, so fungibility worked. V3 positions are not interchangeable. An LP with range `[$3,000, $4,000]` and an LP with range `[$3,500, $5,000]` have different exposures. Even two positions with the same range and the same liquidity each carry their own fee marker, because they were opened and collected at different times.

V3 uses ERC-721 NFTs instead. Each position is a non-fungible token whose metadata includes the pool, the range (`tickLower`, `tickUpper`), the liquidity amount, and accumulated fees. The `NonfungiblePositionManager` contract is the standard entry point: LPs mint NFTs through it, manage liquidity through it, collect fees through it. Position NFTs are transferable like any ERC-721, so you can sell your position on a secondary market or use it as collateral. Every LP integration has to handle individual positions rather than treating LP shares as fungible balances, which makes building on V3 more complex than building on V2.

## The pool stores its own price history

In V2 the pool keeps one running total of price, and each consumer has to store its own earlier reading to compute an average (see the [TWAP lesson](/courses/development-on-ethereum/oracles/twap-oracles)). V3 changes two things about this.

First, the pool stores the readings itself. Each V3 pool keeps an **observations array**, a circular buffer of past `(timestamp, tick cumulative)` entries. The slots get filled on every state-changing interaction (swap, mint, burn). A consumer reading a TWAP for the last 30 minutes asks the pool to find observations bracketing the start and end of the window, and computes the average from those two readings. Pools default to 1 slot, and a pool whose array has been extended covers hours or days of history.

Second, the running total is of the tick, not of the price. Ticks are log-scale price values, so the average tick converts back to the geometric mean of the price, where V2 gives the arithmetic mean. The two react differently to a one-block spike. Take a price of $100 for 99 blocks and $10,000 for one block: the arithmetic mean is $199, and the geometric mean is about $105. With the one block at $1 instead, they are $99 and about $95. So a 100x move for one block moves the price read from the average tick by about 5% in either direction, while the arithmetic mean almost doubles on the move up and barely notices the move down.

The [V3 oracle documentation](https://docs.uniswap.org/concepts/protocol/oracle) covers the specifics of how to read observations and compute windows.

## What concentration costs the LP

Concentration multiplies the LP's loss along with the fees. Inside its range the $10,000 position behaves like a V2 position 14 times larger, so its [impermanent loss](/courses/development-on-ethereum/defi-tasks-and-patterns/amm) in dollars is 14 times larger too. If ETH goes from $3,500 to $4,000, a $10,000 V2 deposit ends about $24 behind holding the two tokens, and the V3 position ends about $340 behind. Once price leaves the range, the position holds only the token that lost value against the other: only USDC after ETH rose above $4,000, because the pool sold all of the position's ETH on the way up, and only ETH after it fell below $3,000. It stays that way and earns nothing until price returns or the LP moves it.

V2's design is still a reasonable choice for assets with extreme volatility where any chosen range becomes irrelevant quickly, for passive LPs who can't or won't monitor positions, and for simple integrations where V2's fungible LP tokens make the rest of the contract design cleaner.

Before you choose V3 for a pair, ask whether its price has a center that an LP is willing to hold a range around, and who will move the range when price leaves it. If nobody will, V2 serves that pair better.
