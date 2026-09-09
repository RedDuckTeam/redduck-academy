---
id: 214
title: CLMM
type: lecture
order: 30
faq:
  - question: Why does most of my money in a standard pool earn no fees?
    answer: >-
      It sits at prices that will never trade. A constant-product pool spreads your deposit from
      zero to infinity, and in a SOL/USDC pool under 5 percent of it is typically active.
  - question: Why did the pool take only one of my two tokens?
    answer: >-
      The range decides the mix. Above the current price the pool only ever sells SOL, so you
      deposit SOL. Below it the pool only ever spends USDC, so you deposit USDC. You need both
      only when the range straddles the current price.
  - question: Can I place a limit order on a CLMM?
    answer: >-
      Yes, with a range order. Deposit only the asset you are selling into a tight range just
      above the current price. If price passes through, the position ends up holding the other
      token near your target, plus the fees it earned while filling.
  - question: Why can't I set my range to exactly $217.23?
    answer: >-
      Ranges land on ticks, one basis point apart, each one 1.0001 raised to the tick number.
      The fee tier fixes the spacing, 1 at 0.01 percent, 10 at 0.05, 60 at 0.25, 200 at 1
      percent, and both endpoints must be multiples of it.
  - question: Why is my CLMM position an NFT?
    answer: >-
      Two ranges are not interchangeable, so there is no fungible share to mint. The position
      NFT records the pool, the tick bounds, the liquidity and the fees owed.
---

> Raydium's original AMM is an elegant first design: deposit two tokens in equal value, the pool prices swaps via `x * y = k`, you earn fees proportional to your share. The problem the Concentrated Liquidity Market Maker (CLMM) set out to solve is that the standard AMM wastes most of the capital LPs deposit. Concentrated liquidity is the fix. LPs concentrate their capital in a chosen price range, Raydium represents that range with ticks, and a position set below the current price needs only one token instead of two. The model is not obvious at first, but it explains how concentrated liquidity positions work in every major modern DEX.

## What's wrong with the standard AMM

A constant-product pool prices trades along the hyperbola `x * y = k`. The curve covers every possible price from zero to infinity. As price moves up or down, reserves shift along the curve. The math is simple and the system works.

The trouble is that LPs end up providing depth at prices that will never trade. If the current SOL price is $200 and you deposit $10,000 into a standard SOL/USDC pool, a tiny fraction of your $10,000 is providing liquidity at prices near $200 (where trades actually happen). The rest of your capital is reserved for hypothetical trades at $1, at $5,000, at $100,000. Trades there will never happen, but your dollars are pinned to those price points anyway. They sit idle, earning no fees.

Empirically, in a standard SOL/USDC pool, an LP's capital that's "active" within any reasonable trading band is often less than 5% of their deposit. The other 95% is dead weight. They earn fees proportional to their share of total liquidity, but most of that liquidity isn't doing anything useful.

## CLMM's idea: concentrated liquidity

CLMM lets an LP say: "I think SOL will trade between $180 and $220. Concentrate all my capital in that range." The LP picks a lower price Pl and an upper price Pu. Their capital provides depth only in [Pl, Pu]. If trades happen inside that range, they earn fees. If price moves outside their range, their position earns nothing until either the price comes back or the LP repositions.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Standard AMM liquidity spread vs Raydium CLMM concentrated liquidity in $180-$220</title><desc>The top chart shows a standard AMM spreading a $10,000 deposit across every price from $0 to infinity, so most of the capital sits far from the current price and earns no fees. The bottom chart shows the same $10,000 in a Raydium CLMM, concentrated only between $180 and $220, giving deep liquidity where trades actually happen but earning zero fees if the price moves outside that range.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Standard AMM spreads capital across every price. CLMM lets you concentrate it.</text>
  <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">Standard AMM: same $10,000 deposit spread across all prices</text>
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
  <text x="363" y="93" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="60" y="200" font-family="monospace" font-size="9">$0</text>
  <text x="363" y="200" text-anchor="middle" font-family="monospace" font-size="9">$200</text>
  <text x="666" y="200" text-anchor="end" font-family="monospace" font-size="9">$∞</text>
  <text x="60" y="222" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Most of your money provides liquidity at prices that will never trade.</text>
  <text x="60" y="236" font-family="monospace" font-size="10" fill="#565653" font-style="italic">It's "deployed" but earning no fees.</text>
  <text x="40" y="280" font-family="monospace" font-size="11" font-weight="bold">Raydium CLMM: same $10,000 concentrated in [$180, $220]</text>
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
  <text x="300" y="418" text-anchor="middle" font-family="monospace" font-size="9">$180</text>
  <text x="425" y="418" text-anchor="middle" font-family="monospace" font-size="9">$220</text>
  <line x1="363" y1="280" x2="363" y2="406" stroke="#000000" stroke-width="2" stroke-dasharray="3 3"/>
  <text x="363" y="265" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="60" y="418" font-family="monospace" font-size="9">$0</text>
  <text x="666" y="418" text-anchor="end" font-family="monospace" font-size="9">$∞</text>
  <text x="60" y="440" font-family="monospace" font-size="10" fill="#565653" font-style="italic">All your money provides deep liquidity exactly where trades actually happen.</text>
  <text x="60" y="454" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Fees per dollar deposited are dramatically higher.</text>
  <rect x="40" y="478" width="640" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="498" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">The tradeoff:</text>
  <text x="60" y="516" font-family="monospace" font-size="10">If price leaves your range, your position earns zero fees until it re-enters or you reposition.</text>
</svg>

The same $10,000 deposit in CLMM with a range of `[$180, $220]` provides depth comparable to roughly $100,000+ of standard-AMM liquidity, since none of the capital is wasted at unreachable prices. The exact multiplier depends on how narrow the range is. Narrower range means more concentration, which means more fees per dollar when active, but a higher risk that price leaves the range and the position earns nothing.

CLMM isn't strictly better than the standard AMM. It's a tradeoff: capital efficiency in exchange for active management. An LP who picks a tight range gets great returns when price stays inside, but loses fee income whenever price exits. The standard AMM's passive LPs earn less per dollar but never go "out of range." Which is better depends on the LP's willingness to monitor and adjust.

## Ticks: discrete price levels

Now the implementation question. CLMM lets you pick a range `[Pl, Pu]`. But CLMM doesn't allow arbitrary prices for the boundaries. Ranges must start and end at specific discrete price levels called **ticks**.

A tick is just a price level on a predefined grid. The formula is:

```
price(tick) = 1.0001 ^ tick
```

Each step from one tick to the next changes the price by 0.01% (one basis point). Tick 0 corresponds to price 1.0. Tick 1 corresponds to price 1.0001. Tick -1 to price 0.9999. And so on.

For a SOL/USDC pool with SOL around $200, the corresponding tick is around 52,983. The integer is large because the price ratio is far from 1, but the math handles it cleanly. Frontends and SDKs convert between tick numbers and human-readable prices for you. You almost never compute ticks by hand.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Tick scale 52980-52989 mapped to SOL/USDC prices and fee-tier spacing</title><desc>A number line shows ticks 52980 to 52989 lined up with prices 199.94 to 200.12 USDC per SOL, each step equal to +0.01%. Below it, the formula price(tick) = 1.0001^tick is shown, along with a table of fee tiers (0.01%, 0.05%, 0.25%, 1.00%) and their matching tick spacing (1, 10, 60, 200).</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A tick is just a discrete price level. Each step is 0.01% from the next.</text>
  <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">Possible price levels (a few shown):</text>
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
  <text x="100" y="125" text-anchor="middle" font-family="monospace" font-size="10">52980</text>
  <text x="160" y="125" text-anchor="middle" font-family="monospace" font-size="10">52981</text>
  <text x="220" y="125" text-anchor="middle" font-family="monospace" font-size="10">52982</text>
  <text x="280" y="125" text-anchor="middle" font-family="monospace" font-size="10">52983</text>
  <text x="340" y="125" text-anchor="middle" font-family="monospace" font-size="10">52984</text>
  <text x="400" y="125" text-anchor="middle" font-family="monospace" font-size="10">52985</text>
  <text x="460" y="125" text-anchor="middle" font-family="monospace" font-size="10">52986</text>
  <text x="520" y="125" text-anchor="middle" font-family="monospace" font-size="10">52987</text>
  <text x="580" y="125" text-anchor="middle" font-family="monospace" font-size="10">52988</text>
  <text x="640" y="125" text-anchor="middle" font-family="monospace" font-size="10">52989</text>
  <text x="100" y="182" text-anchor="middle" font-family="monospace" font-size="10">199.94</text>
  <text x="160" y="182" text-anchor="middle" font-family="monospace" font-size="10">199.96</text>
  <text x="220" y="182" text-anchor="middle" font-family="monospace" font-size="10">199.98</text>
  <text x="280" y="182" text-anchor="middle" font-family="monospace" font-size="10">200.00</text>
  <text x="340" y="182" text-anchor="middle" font-family="monospace" font-size="10">200.02</text>
  <text x="400" y="182" text-anchor="middle" font-family="monospace" font-size="10">200.04</text>
  <text x="460" y="182" text-anchor="middle" font-family="monospace" font-size="10">200.06</text>
  <text x="520" y="182" text-anchor="middle" font-family="monospace" font-size="10">200.08</text>
  <text x="580" y="182" text-anchor="middle" font-family="monospace" font-size="10">200.10</text>
  <text x="640" y="182" text-anchor="middle" font-family="monospace" font-size="10">200.12</text>
  <text x="370" y="200" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">price in USDC per SOL</text>
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
  <text x="60" y="398" font-family="monospace" font-size="10">  0.05% fee  →  tick spacing 10    (correlated assets like SOL/jitoSOL)</text>
  <text x="60" y="414" font-family="monospace" font-size="10">  0.25% fee  →  tick spacing 60    (typical pairs like SOL/USDC)</text>
  <text x="60" y="430" font-family="monospace" font-size="10">  1.00% fee  →  tick spacing 200   (exotic pairs, wide ranges)</text>
</svg>

The number 1.0001 was chosen because it makes the per-tick step equal to a clean basis point. The whole tick range CLMM supports runs from roughly -443,636 to +443,636, which corresponds to a price range from about `1e-19` to `1e19`. More than enough to cover every conceivable asset pair.

A few practical things to internalize about ticks:

Tick boundaries are integer-valued. You can't say "my range starts at price $217.23." You say "my range starts at tick 53,820," which the SDK will round to from your input price.

The same range can be expressed by different tick pairs depending on token order. CLMM pools have a notion of `token0` and `token1`, decided by the sort order of the token mint addresses. Price is conventionally `token1 per token0`. If you swap the order, ticks flip sign.

Tick spacing controls granularity. A pool with tick spacing 60 only allows positions whose endpoints are multiples of 60. So instead of using every possible tick from 52,980 to 52,989, you'd be picking from a coarser ladder.

## Fee tiers

The standard AMM has one fee, typically 0.25% on Raydium. CLMM has multiple, each with its own pool and tick spacing:

- **0.01%** for pairs that should trade at almost identical prices, like two stablecoins. Tick spacing 1 (most granular).
- **0.05%** for correlated assets that move closely together, like SOL and a liquid staking derivative such as jitoSOL or mSOL. Tick spacing 10.
- **0.25%** for typical volatile pairs like SOL/USDC. Tick spacing 60.
- **1.00%** for exotic pairs with high volatility. Tick spacing 200.

Each fee tier is a separate pool. So when you talk about "the SOL/USDC pool" on Raydium CLMM, you actually have to specify which one of several pools you mean. Liquidity is split across these tiers, which is a real downside: thin markets fragment further. Aggregators like Jupiter route trades through whichever pool gives the best execution.

LPs choose a fee tier based on the volatility they expect. Higher volatility means higher fee income but also more risk of price moving out of range. The coarser tick spacing for higher fee tiers reflects that fine-grained ranges are less useful for assets that move a lot.

## Three position types: where single-sided liquidity comes from

Now to the part where CLMM starts to feel different from the standard AMM.

In the standard AMM, you always deposit both tokens, in the ratio set by the current pool price. There's no other option. In CLMM, the ratio depends on where your chosen range sits relative to the current price. Sometimes you deposit both tokens. Sometimes only one. And it's not up to you which case applies. The range you pick forces the composition.

<svg role="img" viewBox="0 0 720 700" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>CLMM position types: range below, straddling, or above current price</title><desc>Shows three price ranges around a current price of $200 for a USDC/SOL pool. A range set below current price (like $150-$180) needs only USDC, a range straddling current price (like $180-$250) needs both USDC and SOL, and a range set above current price (like $250-$300) needs only SOL.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Three position types. The range you pick decides which token(s) you deposit.</text>
  <text x="40" y="82" font-family="monospace" font-size="11" font-weight="bold">Range BELOW current price  →  deposit only USDC</text>
  <line x1="60" y1="120" x2="660" y2="120" stroke="#000000" stroke-width="1.5"/>
  <rect x="120" y="110" width="220" height="20" fill="#ed4937" fill-opacity="0.3" stroke="#ed4937" stroke-width="1.5"/>
  <text x="120" y="148" text-anchor="middle" font-family="monospace" font-size="9">$150</text>
  <text x="340" y="148" text-anchor="middle" font-family="monospace" font-size="9">$180</text>
  <line x1="500" y1="100" x2="500" y2="135" stroke="#000000" stroke-width="2"/>
  <text x="500" y="95" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="500" y="148" text-anchor="middle" font-family="monospace" font-size="9">$200</text>
  <text x="660" y="115" text-anchor="end" font-family="monospace" font-size="9">price</text>
  <text x="60" y="172" font-family="monospace" font-size="10" font-weight="bold">You deposit:</text>
  <text x="160" y="172" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">100% USDC</text>
  <text x="60" y="190" font-family="monospace" font-size="10" fill="#565653">Why: for price to enter this range, it must FALL.</text>
  <text x="60" y="204" font-family="monospace" font-size="10" fill="#565653">As price falls, the pool buys SOL from sellers, paying out USDC.</text>
  <text x="60" y="218" font-family="monospace" font-size="10" fill="#565653">Your USDC is the inventory being spent.</text>
  <text x="60" y="240" font-family="monospace" font-size="10" fill="#565653" font-style="italic">If price falls to $150, all your USDC is now SOL. Functionally a "buy SOL at $180 or lower" order.</text>
  <text x="40" y="282" font-family="monospace" font-size="11" font-weight="bold">Range STRADDLING current price  →  deposit BOTH tokens</text>
  <line x1="60" y1="320" x2="660" y2="320" stroke="#000000" stroke-width="1.5"/>
  <rect x="310" y="310" width="340" height="20" fill="#ed4937" fill-opacity="0.3" stroke="#ed4937" stroke-width="1.5"/>
  <text x="310" y="348" text-anchor="middle" font-family="monospace" font-size="9">$180</text>
  <text x="650" y="348" text-anchor="middle" font-family="monospace" font-size="9">$250</text>
  <line x1="420" y1="300" x2="420" y2="335" stroke="#000000" stroke-width="2"/>
  <text x="420" y="295" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="420" y="348" text-anchor="middle" font-family="monospace" font-size="9">$200</text>
  <text x="660" y="315" text-anchor="end" font-family="monospace" font-size="9">price</text>
  <text x="60" y="372" font-family="monospace" font-size="10" font-weight="bold">You deposit:</text>
  <text x="160" y="372" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">both USDC and SOL</text>
  <text x="60" y="390" font-family="monospace" font-size="10" fill="#565653">Why: the range covers prices above AND below current.</text>
  <text x="60" y="404" font-family="monospace" font-size="10" fill="#565653">If price rises, the pool needs SOL to sell. If price falls, USDC to buy.</text>
  <text x="60" y="418" font-family="monospace" font-size="10" fill="#565653">Position needs both, in a ratio determined by where current sits in the range.</text>
  <text x="60" y="440" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Closer to lower bound → more SOL. Closer to upper bound → more USDC.</text>
  <text x="40" y="482" font-family="monospace" font-size="11" font-weight="bold">Range ABOVE current price  →  deposit only SOL</text>
  <line x1="60" y1="520" x2="660" y2="520" stroke="#000000" stroke-width="1.5"/>
  <rect x="440" y="510" width="220" height="20" fill="#ed4937" fill-opacity="0.3" stroke="#ed4937" stroke-width="1.5"/>
  <text x="440" y="548" text-anchor="middle" font-family="monospace" font-size="9">$250</text>
  <text x="660" y="548" text-anchor="middle" font-family="monospace" font-size="9">$300</text>
  <line x1="280" y1="500" x2="280" y2="535" stroke="#000000" stroke-width="2"/>
  <text x="280" y="495" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current</text>
  <text x="280" y="548" text-anchor="middle" font-family="monospace" font-size="9">$200</text>
  <text x="660" y="515" text-anchor="end" font-family="monospace" font-size="9">price</text>
  <text x="60" y="572" font-family="monospace" font-size="10" font-weight="bold">You deposit:</text>
  <text x="160" y="572" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">100% SOL</text>
  <text x="60" y="590" font-family="monospace" font-size="10" fill="#565653">Why: for price to enter this range, it must RISE.</text>
  <text x="60" y="604" font-family="monospace" font-size="10" fill="#565653">As price rises, the pool sells SOL to buyers, collecting USDC.</text>
  <text x="60" y="618" font-family="monospace" font-size="10" fill="#565653">Your SOL is the inventory being sold.</text>
  <text x="60" y="640" font-family="monospace" font-size="10" fill="#565653" font-style="italic">If price rises to $300, all your SOL is now USDC. Functionally a "sell SOL at $250 or higher" order.</text>
  <rect x="40" y="660" width="640" height="30" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="680" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">The deposit ratio is forced by the range, not by you.</text>
</svg>

## Why this works: think in trade flows

The single-sided deposit rule seems strange at first. To make sense of it, watch what the pool actually does when price moves.

**When price rises**, someone is buying SOL. They send USDC into the pool, the pool sends SOL out. The pool gains USDC and loses SOL. From the pool's perspective, it just "sold SOL for USDC."

**When price falls**, someone is selling SOL. They send SOL into the pool, the pool sends USDC out. The pool gains SOL and loses USDC. From the pool's perspective, it just "bought SOL with USDC."

So a pool acts as a market maker that's always taking the other side of trades. To sell SOL (when price rises) it needs SOL inventory. To buy SOL (when price falls) it needs USDC inventory.

Now apply this to a CLMM position with range `[Pl, Pu]`:

**Range entirely above current price** (current price < Pl). For price to ever reach this range, it has to rise from where it is to Pl, then potentially keep rising up to Pu. The entire trip through the range is a rising-price trip. The pool is selling SOL the whole way. Your position needs SOL on hand to participate, so you deposit only SOL. As price rises through your range, your SOL gradually gets sold off in exchange for USDC. By the time price reaches Pu, all your SOL is gone, replaced by USDC at the highest prices in your range.

**Range entirely below current price** (current price > Pu). For price to enter this range, it has to fall from where it is to Pu, then potentially keep falling to Pl. The entire trip is a falling-price trip. The pool is buying SOL the whole way. Your position needs USDC ready to spend, so you deposit only USDC. As price falls through your range, your USDC gradually gets converted to SOL at the falling prices. By the time price reaches Pl, all your USDC is gone, replaced by SOL at the lowest prices in your range.

**Range straddling current** (Pl < current < Pu). The price can move either direction from the current spot. The pool might need SOL inventory (for upward moves) or USDC inventory (for downward moves). Your position needs both, in a ratio that depends on where current sits within the range.

The rule of thumb to remember: at the lower boundary `Pl`, a position holds 100% of token X (SOL in this example). At the upper boundary `Pu`, it holds 100% of token Y (USDC). In between, the position is a mix. Where the current price sits relative to these boundaries dictates the deposit composition.

## Range orders: limit orders in disguise

The single-sided behavior turns CLMM into something the previous AMMs couldn't be: a venue for limit orders.

Suppose SOL is at $200 and you want to sell at $250. In the standard AMM, you'd have to actively monitor the price and execute a swap when it hits your target. In CLMM, you create a tight position with range `[$250, $250.50]`. The position is entirely above current price, so you deposit only SOL. If price never reaches $250, the position sits idle. If price moves through $250 to $250.50, your SOL gets swapped for USDC inside the range, and by the time price exits at the top, your position holds 100% USDC at an average price near $250.

You've effectively placed a sell order that fills around $250. Same logic in reverse for limit buys with a tight range below current.

The fill price isn't exactly the target. There's some spread between Pl and Pu, so the actual execution price is an average within the range. Tighter ranges mean closer-to-exact fills but smaller fee earnings while filling. This is the difference between a true limit order and a CLMM range order: the CLMM version still earns fees during the fill, in exchange for some slippage.

Several Solana limit-order frontends are built on this idea, mounting their UI on top of CLMM positions.

## NFT positions

Standard AMM LP positions are SPL Tokens. Every LP in a standard pool has the same kind of claim, just for different amounts, so fungibility works. You can send your LP tokens to anyone, stake them in another protocol, swap them, anything an SPL Token can do.

CLMM positions can't be fungible SPL Tokens because they're not interchangeable. Two LPs in the same pool with different ranges have completely different exposures. If Alice has range `[$180, $220]` and Bob has range `[$200, $300]`, their positions aren't comparable. You can't have a fungible "SOL/USDC CLMM LP token" because there's no single representative position.

CLMM uses NFTs instead. Each position is a non-fungible token whose metadata records the pool, the range (`tickLower`, `tickUpper`), the liquidity amount, and accumulated fees. The Raydium CLMM program is the standard entry point: LPs mint position NFTs through it, manage liquidity through it, collect fees through it. The position NFT is transferable like any other NFT, so you can sell your position on a secondary market or use it as collateral.

This is one of the things that makes building on CLMM more complex than the standard AMM. Every LP integration has to handle individual positions rather than treating LP shares as fungible balances.

## A better TWAP

Standard AMM oracles use a single cumulative price counter, sampled at whatever times consumers care about. CLMM provides a more refined version.

Each CLMM pool keeps an **observations array**, a circular buffer of past `(timestamp, tick cumulative)` entries. Pools default to a small number of slots but can be extended to cover longer windows. The slots get filled on every state-changing interaction (swap, mint, burn). A consumer reading a TWAP for the last 30 minutes asks the pool to find observations bracketing the start and end of the window, and computes the average from those two readings.

The advantages over the standard AMM's design:

- Consumers don't need to take their own observation. The pool's observations are already there, indexed by time.
- Multiple consumers reading the same window share the cost.
- Pools with extended observation arrays cover hours or days of history.

CLMM computes the TWAP by averaging tick values (log-price) over time rather than averaging raw price. Because the tick is the log of price, the result is the geometric mean of price over the window. The geometric mean of $100 and $400 is $200. The arithmetic mean is $250. The geometric mean treats equal ratio changes as equal distances, which matters when prices can swing by large multiples and makes it more useful for risk-bearing applications.

## When CLMM vs the standard AMM

CLMM strengths:

- Capital efficiency for LPs willing to manage positions
- Limit-order-like behavior via range orders
- Lower slippage for traders, since concentrated liquidity makes pools effectively deeper near current prices
- Stronger oracle for downstream protocols

CLMM weaknesses:

- LPs have to manage active positions, or accept that price will eventually move out of range
- Multiple fee tiers fragment liquidity across pools
- Tick math, NFT positions, and per-position fee accounting make the codebase and integrations more complex
- Less suitable for pairs where price has no natural "center" the LP can target

The standard AMM design is still a reasonable choice for some applications: assets with extreme volatility where any chosen range becomes irrelevant quickly, passive LPs who can't or won't monitor positions, simple integrations where fungible LP tokens make the rest of the program design cleaner. Raydium's standard AMM isn't deprecated. It coexists with CLMM because the tradeoffs go different ways for different use cases.
