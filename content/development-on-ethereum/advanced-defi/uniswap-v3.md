---
id: 172
title: Uniswap V3
type: lecture
order: 2
faq:
  - question: What is concentrated liquidity and why does it make Uniswap V3 more
      capital efficient than V2?
    answer: In Uniswap V2 your deposit is spread across every possible price from
      zero to infinity, so most of it sits idle at prices that will never trade.
      Empirically, often under 5% is active near the current price. V3 lets you
      concentrate your capital in a chosen price range, say $3,000 to $4,000, so
      all of it provides depth where trading actually happens. The same $10,000
      in a tight V3 range can provide the depth of roughly $100,000 or more in
      V2. The tradeoff is that if the price leaves your range, your position
      earns no fees until it returns or you reposition.
  - question: Why does Uniswap V3 sometimes let me add liquidity with only one token?
    answer: The token mix you must deposit is forced by where your chosen range sits
      relative to the current price, because the pool sells whichever token the
      market is buying. If your whole range is above the current price, the
      price must rise through it, meaning the pool will be selling that token
      the entire time, so you deposit only that token. If your range is entirely
      below, you deposit only the other token. Only a range that straddles the
      current price needs both tokens. At the lower boundary a position holds
      100% of one token and at the upper boundary 100% of the other.
  - question: Can I place a limit order on Uniswap V3?
    answer: Yes, using a 'range order', which exploits the single-sided deposit
      behavior. To sell ETH at $4,000 you create a tight position just above the
      current price and deposit only ETH. If the price passes through that
      narrow range your ETH is swapped to USDC, and by the time the price exits
      the top your position is all USDC at roughly your target. It isn't an
      exact fill, since the execution price is an average across the range, but
      unlike a true limit order it also earns fees while filling. Tighter ranges
      give closer fills but smaller fee income.
  - question: Why are Uniswap V3 LP positions NFTs instead of fungible ERC-20 tokens
      like in V2?
    answer: In V2 every liquidity provider in a pool has the same kind of claim, so
      LP shares could be a fungible ERC-20. In V3 two providers can pick
      completely different price ranges and therefore have completely different
      exposures, so there is no single representative position to tokenize. Each
      V3 position is instead a non-fungible ERC-721 whose data includes the
      pool, the range, the liquidity, and accrued fees, managed through the
      NonfungiblePositionManager. This makes positions transferable and usable
      as collateral, but it also makes integrations more complex than V2's
      fungible LP tokens.
---

## What's wrong with V2

A V2 pool prices trades along the hyperbola `x * y = k`. The curve covers every possible price from zero to infinity. As price moves up or down, reserves shift along the curve. The math is simple and the system works.

The trouble is that LPs end up providing depth at prices that will never trade. If the current ETH price is $3,500 and you deposit $10,000 into a V2 ETH/USDC pool, a tiny fraction of your $10,000 is providing liquidity at prices near $3,500 (where trades actually happen). The rest of your capital is reserved for hypothetical trades at $1, at $100,000, at $1,000,000. Trades there will never happen, but your dollars are pinned to those price points anyway. They sit idle, earning no fees.

Empirically, in a V2 ETH/USDC pool, an LP's capital that's "active" within any reasonable trading band is often less than 5% of their deposit. The other 95% is dead weight. They earn fees proportional to their share of total liquidity, but most of that liquidity isn't doing anything useful.

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

The same $10,000 deposit in V3 with a range of `[$3,000, $4,000]` provides depth comparable to roughly $100,000+ of V2 liquidity, since none of the capital is wasted at unreachable prices. The exact multiplier depends on how narrow the range is. Narrower range = more concentration = more fees per dollar when active, but a higher risk that price leaves the range and the position earns nothing.

V3 isn't strictly better than V2. It's a tradeoff: capital efficiency in exchange for active management. An LP who picks a tight range gets great returns when price stays inside, but loses fee income whenever price exits. V2's passive LPs earn less per dollar but never go "out of range." Which is better depends on the LP's willingness to monitor and adjust.

## Ticks: discrete price levels

Now the implementation question. V3 lets you pick a range `[Pl, Pu]`. But V3 doesn't allow arbitrary prices for the boundaries. Ranges must start and end at specific discrete price levels called **ticks**.

A tick is just a price level on a predefined grid. The formula is:

```
price(tick) = 1.0001 ^ tick
```

Moving from one tick to the next multiplies the price by 1.0001, a change of 0.01% (one basis point). Tick 0 corresponds to price 1.0. Tick 1 corresponds to price 1.0001. Tick -1 to price 0.9999. And so on.

For an ETH/USDC pool with ETH around $3,500, the corresponding tick is around 81,800. The integer is large because the price ratio is far from 1, but the math handles it cleanly. Frontends and SDKs convert between tick numbers and human-readable prices for you. You almost never compute ticks by hand.

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

The number 1.0001 was chosen because it makes the per-tick step equal to a clean basis point. The whole tick range V3 supports runs from roughly -887,272 to +887,272, which corresponds to a price range from about `1e-38` to `1e38`. More than enough to cover every conceivable asset pair.

A few practical things to internalize about ticks:

Tick boundaries are integer-valued. You can't say "my range starts at price $3,517.23." You say "my range starts at tick 81,802," which the SDK will round to from your input price.

The same range can be expressed by different tick pairs depending on token order. V3 pools have a notion of `token0` and `token1`. Price is conventionally `token1 per token0`. If you swap the order, ticks flip sign. ETH/USDC at $3,500 has positive ticks, USDC/ETH at 1/3,500 has the same magnitude with negative ticks.

Tick spacing controls granularity. A pool with tick spacing 60 only allows positions whose endpoints are multiples of 60. So instead of using every possible tick from 81,797 to 81,806, you'd be picking from a coarser ladder.

## Fee tiers

V2 had one fee: 0.30%. V3 has four, each with its own pool and tick spacing:

- **0.01%**: for pairs that should trade at almost identical prices, like two stablecoins. Tick spacing 1 (most granular).
- **0.05%**: for correlated assets that move closely together, like ETH and a liquid staked ETH derivative. Tick spacing 10.
- **0.30%**: the V2 standard, used for typical volatile pairs like ETH/USDC. Tick spacing 60.
- **1.00%**: for exotic pairs with high volatility. Tick spacing 200.

Each fee tier is a separate pool. So when you talk about "the ETH/USDC pool" on V3, you actually have to specify which one of three or four pools you mean. Liquidity is split across these tiers, which is a real downside: thin markets fragment further. The Uniswap router handles this by routing trades through whichever pool gives the best execution.

LPs choose a fee tier based on the volatility they expect. Higher volatility means higher fee income but also more risk of price moving out of range. The coarser tick spacing for higher fee tiers reflects that fine-grained ranges are less useful for assets that move a lot.

## Three position types: where single-sided liquidity comes from

In V2, you always deposit both tokens, in the ratio set by the current pool price. There's no other option. In V3, the ratio depends on where your chosen range sits relative to the current price. Sometimes you deposit both tokens. Sometimes only one. And it's not up to you which case applies. The range you pick forces the composition.

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

## Why this works: think in trade flows

The single-sided deposit rule seems strange at first. To make sense of it, watch what the pool actually does when price moves.

**When price rises**, someone is buying ETH. They send USDC into the pool, the pool sends ETH out. The pool gains USDC and loses ETH. From the pool's perspective, it just "sold ETH for USDC."

**When price falls**, someone is selling ETH. They send ETH into the pool, the pool sends USDC out. The pool gains ETH and loses USDC. From the pool's perspective, it just "bought ETH with USDC."

So a pool acts as a market maker that's always taking the other side of trades. To sell ETH (when price rises) it needs ETH inventory. To buy ETH (when price falls) it needs USDC inventory.

Now apply this to a V3 position with range `[Pl, Pu]`:

**Range entirely above current price** (current price < Pl). For price to ever reach this range, it has to rise from where it is to Pl, then potentially keep rising up to Pu. The entire trip through the range is a rising-price trip. The pool is selling ETH the whole way. Your position needs ETH on hand to participate, so you deposit only ETH. As price rises through your range, your ETH gradually gets sold off in exchange for USDC. By the time price reaches Pu, all your ETH is gone, replaced by USDC at the highest prices in your range.

**Range entirely below current price** (current price > Pu). For price to enter this range, it has to fall from where it is to Pu, then potentially keep falling to Pl. The entire trip is a falling-price trip. The pool is buying ETH the whole way. Your position needs USDC ready to spend, so you deposit only USDC. As price falls through your range, your USDC gradually gets converted to ETH at the falling prices. By the time price reaches Pl, all your USDC is gone, replaced by ETH at the lowest prices in your range.

**Range straddling current** (Pl < current < Pu). The price can move either direction from the current spot. The pool might need ETH inventory (for upward moves) or USDC inventory (for downward moves). Your position needs both, in a ratio that depends on where current sits within the range.

The rule of thumb to remember: at the lower boundary `Pl`, a position holds 100% of token X (ETH in this example). At the upper boundary `Pu`, it holds 100% of token Y (USDC). In between, the position is a mix. Where the current price sits relative to these boundaries dictates the deposit composition.

## Range orders: limit orders in disguise

The single-sided behavior turns V3 into something the previous AMMs couldn't be: a venue for limit orders.

Suppose ETH is at $3,500 and you want to sell at $4,000. In V2, you'd have to actively monitor the price and execute a swap when it hits your target. In V3, you create a tight position with range `[$4,000, $4,005]`. The position is entirely above current price, so you deposit only ETH. If price never reaches $4,000, the position sits idle. If price moves through $4,000 to $4,005, your ETH gets swapped for USDC inside the range, and by the time price exits at the top, your position holds 100% USDC at an average price near $4,000.

You've effectively placed a sell order that fills around $4,000. Same logic in reverse for limit buys with a tight range below current.

The fill price isn't exactly the target. There's some spread between Pl and Pu, so the actual execution price is an average within the range. Tighter ranges mean closer-to-exact fills but smaller fee earnings while filling. This is the difference between a true limit order and a V3 range order: the V3 version still earns fees during the fill, in exchange for some slippage.

This was a real user-facing feature when V3 launched. It led several limit-order protocols to build on top of V3 positions.

## NFT positions

V2 LP positions were ERC-20 tokens. Every LP in a V2 pool had the same kind of claim, just for different amounts, so fungibility worked. You could send your LP tokens to anyone, stake them in another protocol, swap them, anything ERC-20s do.

V3 positions can't be ERC-20s because they're not interchangeable. Two LPs in the same pool with different ranges have completely different exposures. If Alice has range `[$3,000, $4,000]` and Bob has range `[$3,500, $5,000]`, their positions aren't comparable. You can't have a fungible "ETH/USDC V3 LP token" because there's no single representative position.

V3 uses ERC-721 NFTs instead. Each position is a non-fungible token whose metadata includes the pool, the range (`tickLower`, `tickUpper`), the liquidity amount, and accumulated fees. The `NonfungiblePositionManager` contract is the standard entry point: LPs mint NFTs through it, manage liquidity through it, collect fees through it. Position NFTs are transferable like any ERC-721, so you can sell your position on a secondary market or use it as collateral.

This is one of the things that makes building on V3 more complex than V2. Every LP integration has to handle individual positions rather than treating LP shares as fungible balances.

## A better TWAP

V2 oracles use a single cumulative price counter, sampled at whatever times consumers care about. V3 introduces a more refined version.

Each V3 pool keeps an **observations array**, a circular buffer of past `(timestamp, tick cumulative)` entries. Pools default to 1 slot but can be extended up to 65,535 slots. The slots get filled on every state-changing interaction (swap, mint, burn). A consumer reading a TWAP for the last 30 minutes asks the pool to find observations bracketing the start and end of the window, and computes the average from those two readings.

The advantages over V2's design:

- Consumers don't need to take their own observation. The pool's observations are already there, indexed by time.
- Multiple consumers reading the same window share the cost.
- Pools with extended observation arrays cover hours or days of history.

V3 uses the geometric mean of prices (computed by averaging ticks, which are log-scale price values) rather than the arithmetic mean of raw prices. This matters when prices can swing in large ratios. The geometric mean of $100 and $400 is $200. The arithmetic mean is $250. The geometric version is symmetric around the true price, which is more useful for risk-bearing applications.

The [V3 oracle documentation](https://docs.uniswap.org/concepts/protocol/oracle) covers the specifics of how to read observations and compute windows.

## When V3 vs V2

V3's strengths:

- Capital efficiency for LPs willing to manage positions
- Limit-order-like behavior via range orders
- Lower slippage for traders, since concentrated liquidity makes pools effectively deeper near current prices
- Stronger oracle for downstream protocols

V3's weaknesses:

- LPs have to manage active positions, or accept that price will eventually move out of range
- Multiple fee tiers fragment liquidity across pools
- Tick math, NFT positions, and per-position fee accounting make the codebase and integrations more complex
- Less suitable for pairs where price has no natural "center" the LP can target

V2's design is still a reasonable choice for some applications: assets with extreme volatility where any chosen range becomes irrelevant quickly, passive LPs who can't or won't monitor positions, simple integrations where V2's fungible LP tokens make the rest of the contract design cleaner. V2 isn't deprecated. It coexists with V3 because the tradeoffs go different ways for different use cases.
