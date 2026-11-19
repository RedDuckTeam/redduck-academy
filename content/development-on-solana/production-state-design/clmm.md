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

> A standard AMM spreads a liquidity provider's deposit over every price from zero to infinity, so most of it never trades. A Concentrated Liquidity Market Maker (CLMM) lets the provider choose a price range instead. On Solana this design raises a state question that Uniswap V3 on Ethereum did not have to answer: where does the pool keep its price levels, when a swap has to list every account before it runs?

## What's wrong with the standard AMM

A [constant-product pool](/courses/development-on-solana/production-state-design/amm) prices trades along the curve `x * y = k`, which covers every price from zero to infinity. As the price moves, the reserves shift along the curve.

The trouble is that LPs end up providing depth at prices that will never trade. If SOL is at $200 and you deposit $10,000 into a standard SOL/USDC pool, a small fraction of it provides liquidity near $200, where trades happen. The rest is reserved for trades at $1, at $5,000, at $100,000. Those dollars sit idle and earn no fees. In a standard SOL/USDC pool, the part of an LP's capital that is active within any reasonable trading band is often less than 5% of the deposit.

## Concentrated liquidity: the LP chooses the range

A CLMM lets an LP say: "I think SOL will trade between $180 and $220. Concentrate all my capital in that range." The LP picks a lower price Pl and an upper price Pu, and the capital provides depth only in [Pl, Pu]. Trades inside the range pay fees to the position. If the price moves outside the range, the position earns nothing until the price comes back or the LP repositions.

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

The range `[$180, $220]` is 10% either side of the current price, so the same $10,000 provides depth comparable to a standard-AMM deposit about 20 times larger, around $200,000, because none of the capital is reserved for unreachable prices (the [Uniswap V3 lesson](/courses/development-on-ethereum/advanced-defi/uniswap-v3) shows the calculation). The narrower the range, the more fees per dollar while the price is inside it, and the higher the risk that the price leaves and the position earns nothing.

So a CLMM pays for capital efficiency with active management: the LP has to watch the price and move the range. A passive LP in the standard AMM earns less per dollar but never goes out of range.

## The range decides which token you deposit

In the standard AMM you always deposit both tokens, in the ratio set by the current pool price. In a CLMM the ratio depends on where your range sits relative to the current price, and you don't choose it: the range forces the composition.

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

To see why, look at what the pool does when the price moves. When the price rises, someone is buying SOL: they send USDC into the pool and the pool sends SOL out. When the price falls, someone is selling SOL: the pool takes SOL and pays USDC. The pool is a market maker that always takes the other side, so it needs SOL to sell while the price rises and USDC to buy while the price falls.

Now apply this to a position with range `[Pl, Pu]`:

**Range entirely above the current price** (current price < Pl). For the price to reach this range it has to rise to Pl, and it crosses the range while rising to Pu. The pool is selling SOL the whole way, so you deposit only SOL. As the price rises through your range, your SOL is gradually sold for USDC. When the price reaches Pu, all your SOL is gone, replaced by USDC.

**Range entirely below the current price** (current price > Pu). For the price to enter this range it has to fall to Pu, and it crosses the range while falling to Pl. The pool is buying SOL the whole way, so you deposit only USDC. As the price falls through your range, your USDC is gradually converted to SOL. When the price reaches Pl, all your USDC is gone, replaced by SOL.

**Range straddling the current price** (Pl < current price < Pu). The price can move in either direction, so the position needs both tokens, in a ratio that depends on where the current price sits within the range.

At the lower boundary `Pl` a position holds only SOL, and at the upper boundary `Pu` it holds only USDC. In between it is a mix.

## A narrow range works as a limit order

Suppose SOL is at $200 and you want to sell at $250. In the standard AMM you would have to watch the price and swap when it hits your target. In a CLMM you create a tight position with range `[$250, $250.50]`. The position is entirely above the current price, so you deposit only SOL. If the price never reaches $250, the position sits idle. If the price moves through $250 to $250.50, your SOL is swapped for USDC inside the range, and when the price exits at the top the position holds only USDC, from SOL sold at an average price near $250.

A limit buy is the same with a tight range below the current price. The fill is an average over the range, not the exact target, so a tighter range gives a fill closer to the target. Unlike a true limit order, the position earns fees while it fills, and the fill is not final. If the price comes back down through the range, the pool buys SOL back with your USDC, and the position is all SOL again. To keep the USDC, you have to withdraw the position after the price has crossed it.

## Ranges end on ticks

For every range boundary, the pool has to remember how much liquidity starts or stops counting when the price crosses it. If a boundary could be any price, every position would add two new boundaries to store. So boundaries are restricted to a fixed grid of price levels called **ticks**, and positions that share a boundary share its record.

The grid is geometric:

```
price(tick) = 1.0001 ^ tick
```

Each step from one tick to the next changes the price by 0.01%, one basis point. Tick 0 corresponds to price 1.0, tick 1 to price 1.0001, tick -1 to price 0.9999. Because the step is a percentage, the same grid fits a token worth cents and a token worth thousands of dollars. Frontends and SDKs convert between tick numbers and prices, so you almost never compute ticks by hand.

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

A pool also has a **tick spacing**. A pool with tick spacing 60 only allows positions whose endpoints are multiples of 60, so there are fewer boundaries to store and to cross. Raydium CLMM pools exist at several fee tiers, from 0.01% for pairs that should trade at almost identical prices, like two stablecoins, to 1.00% for exotic pairs with high volatility, and a higher fee tier has a coarser spacing. Each fee tier is a separate pool, so the liquidity of one pair is split across them and thin markets fragment further. Aggregators like Jupiter route a trade through whichever pool gives the best execution.

## Where the ticks live on Solana

[Uniswap V3](/courses/development-on-ethereum/advanced-defi/uniswap-v3), the concentrated-liquidity DEX on Ethereum, keeps the ticks in the pool contract's own storage, keyed by tick number. During a swap the contract reads whichever ticks the price crosses, and nobody has to name them in advance.

A Solana program cannot do that. Every account a transaction touches is [listed before it runs](/courses/development-on-solana/the-solana-mental-model/instructions-and-transactions), and a swap does not know exactly how far the price will move. The two obvious layouts both fail:

- **One account per tick.** A swap would have to list one account for every tick it crosses, so the list would grow with the size of the trade, and a legacy transaction fits about 35 account addresses in total ([composing programs](/courses/development-on-solana/working-with-other-programs/composing-programs-in-practice)).
- **All ticks in the pool account.** The account would need space for every tick that could ever be used, and rent is paid for every byte whether or not a tick holds liquidity.

Orca Whirlpools and Raydium CLMM use the layout in between, a **tick array**. A tick array is an account that holds a fixed number of consecutive ticks at the pool's spacing, at an address derived from the pool and the array's first tick. The pool account keeps the current price, the current tick, and the liquidity active at that price. The per-tick records are in the arrays.

How a swap works follows from this layout:

- The client computes which tick arrays the price can reach and passes them with the swap. The addresses are derived, so it can do this without asking the program.
- The program starts in the array that contains the current tick and moves through the arrays it was given. It cannot cross a tick in an array that was not passed, so one transaction can move the price only as far as its tick arrays reach.
- A tick array is created the first time someone needs it. Usually the LP who opens the first position in an untouched part of the price range pays the rent for that array.

Solana PRO describes the general form of this layout as [divide and conquer](/courses/solana-pro/state-partitioning/divide-and-conquer): split the state into partitions, and let each transaction touch only the partitions it needs.

## A bin holds liquidity at one fixed price

Meteora's DLMM uses a different unit in place of the tick. The price range is cut into **bins**, and every bin has one fixed price and its own reserves. A swap trades against the active bin at that bin's price until one of its tokens runs out, and then moves to the next bin. Bins are grouped into bin array accounts the same way ticks are grouped into tick arrays, and a swap passes the bin arrays it can reach.

What differs is the meaning of one record. A tick only marks where liquidity starts or stops, and the price moves along a curve between ticks. A bin holds the liquidity itself, at one price. An LP chooses how much to put into each bin, so a position can have any shape across its range. The price then moves in steps of one bin: inside a bin a trade does not move the price, and when the bin is emptied the price jumps to the next one.

## A position is an account, and the NFT is its key

Standard AMM LP positions are SPL tokens. Every LP in a standard pool has the same kind of claim, only for different amounts, so the shares are fungible. CLMM positions are not interchangeable. If Alice has the range `[$180, $220]` and Bob has the range `[$200, $300]`, their exposures are different, and there is no single LP token that could represent both.

So each position is its own account, owned by the CLMM program, that records the pool, the range, the liquidity amount, and the accumulated fees. Its address is derived from the mint of an [NFT](/courses/development-on-solana/production-state-design/solana-nfts) that the program mints when the position is opened. Whoever holds the NFT controls the position, so a position can be transferred, sold on a secondary market, or used as collateral by moving one token. Every integration has to handle individual positions and cannot treat LP shares as a fungible balance, which makes building on a CLMM more work than building on the standard AMM.

## The pool records its own price history

A CLMM pool stores observations: a running total of the tick multiplied by time, updated as swaps move the price. The difference between two observations, divided by the time between them, is the average tick over that window, and the average tick converts back to a price. Because the tick is the logarithm of the price, this average is the geometric mean of the price. The geometric mean of $100 and $400 is $200, while the arithmetic mean is $250. The geometric mean treats equal ratio changes as equal distances, which matters when prices can swing by large multiples. Solana PRO's [internal oracle](/courses/solana-pro/outside-data/internal-oracle) lesson shows how another program can use these observations in place of an external price feed.

## When the standard AMM is still the better choice

The standard AMM is still a reasonable choice for assets with extreme volatility where any chosen range becomes irrelevant quickly, for passive LPs who can't or won't monitor positions, and for integrations where a fungible LP token keeps the rest of the program simple.

Before you choose a CLMM for a pair, ask what happens when the price leaves the range for a week: who notices, who moves the liquidity, and who pays for those transactions. If the answer is nobody, a standard pool will serve that pair better.
