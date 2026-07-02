# TWAP oracles

_type: lecture_

> The previous lecture argued that production protocols use Chainlink because reading prices from a single AMM pool is dangerous. That's true. But Chainlink doesn't have a feed for every asset, and even when it does, sometimes you want an oracle that lives inside your own protocol, on the same chain, with no external dependency. The pattern that makes that workable is the **time-weighted average price**, or TWAP. This lecture covers what a TWAP is, why it's harder to manipulate than spot price, exactly how Uniswap V2's TWAP works, and where it still falls short.

## The spot price problem, restated

Reading the spot price from an AMM pool means computing the ratio of its current reserves. The number is right there, in storage, for anyone to read. The issue is that anyone can also *move* it, by swapping into the pool. A swap big enough to push the price 20% in one direction costs the swapper most of that 20% in slippage, but if a lending protocol is about to read the post-swap price, that's a manageable cost relative to the loan they'd extract against inflated collateral.

A flash loan removes even the capital constraint. The attacker borrows enough to make a market-moving swap, exploits the manipulated price, reverses the swap, and repays the loan. The attack fits in one transaction and one block. It's been done, repeatedly, for tens of millions of dollars at a time.

## The TWAP idea

Take the average price over a window of time instead of the instantaneous price. If the window is 30 minutes, then to manipulate what the oracle reports, the attacker has to keep the pool's price away from the true market price for roughly 30 minutes. That's not something a flash loan can do.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Flash-loan spot-price spike versus 30-minute TWAP oracle response</title><desc>A chart shows the pool's spot price spiking to $7,000 for one block during a flash-loan attack, while the 30-minute TWAP line stays near $3,510. Below it, the spot oracle reports Alice as under-collateralized and liquidates her, but the TWAP oracle sees the spike averaged out and takes no action.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">TWAP smooths out the manipulation spike that a spot oracle would believe</text>
  <text x="60" y="180" text-anchor="middle" font-family="monospace" font-size="11" transform="rotate(-90, 60, 180)">price ($)</text>
  <line x1="100" y1="280" x2="660" y2="280" stroke="#000000" stroke-width="1.5"/>
  <line x1="100" y1="80" x2="100" y2="280" stroke="#000000" stroke-width="1.5"/>
  <text x="380" y="308" text-anchor="middle" font-family="monospace" font-size="11">time  (blocks)</text>
  <text x="92" y="245" text-anchor="end" font-family="monospace" font-size="9">$3,500</text>
  <line x1="98" y1="242" x2="102" y2="242" stroke="#000000" stroke-width="1"/>
  <text x="92" y="105" text-anchor="end" font-family="monospace" font-size="9">$7,000</text>
  <line x1="98" y1="102" x2="102" y2="102" stroke="#000000" stroke-width="1"/>
  <polyline points="105,242 200,245 280,240 320,243 360,102 365,102 405,245 480,242 560,244 640,242" fill="none" stroke="#ed4937" stroke-width="2.5"/>
  <polyline points="105,242 200,242 280,242 320,242 360,241 405,239 480,240 560,241 640,242" fill="none" stroke="#565653" stroke-width="2.5" stroke-dasharray="6 3"/>
  <text x="430" y="100" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">Pool spot price</text>
  <line x1="425" y1="103" x2="370" y2="103" stroke="#ed4937" stroke-width="1"/>
  <text x="500" y="232" font-family="monospace" font-size="10" fill="#565653" font-weight="bold">30-min TWAP</text>
  <line x1="495" y1="235" x2="475" y2="240" stroke="#565653" stroke-width="1"/>
  <text x="362" y="76" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">attacker manipulates pool</text>
  <text x="362" y="88" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">for 1 block via flash loan</text>
  <rect x="60" y="335" width="290" height="110" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="205" y="356" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">Spot oracle says:</text>
  <line x1="80" y1="364" x2="330" y2="364" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="80" y="384" font-family="monospace" font-size="10">"ETH is worth $7,000.</text>
  <text x="80" y="402" font-family="monospace" font-size="10">Alice's collateral is now</text>
  <text x="80" y="420" font-family="monospace" font-size="10">2x what she borrowed."</text>
  <text x="80" y="438" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">-> liquidates Alice</text>
  <rect x="370" y="335" width="290" height="110" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="515" y="356" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">TWAP oracle says:</text>
  <line x1="390" y1="364" x2="640" y2="364" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="390" y="384" font-family="monospace" font-size="10">"ETH averaged $3,510</text>
  <text x="390" y="402" font-family="monospace" font-size="10">over the last 30 minutes.</text>
  <text x="390" y="420" font-family="monospace" font-size="10">Spike doesn't move it."</text>
  <text x="390" y="438" font-family="monospace" font-size="10" font-weight="bold">-> no action</text>
</svg>

The price spike a flash loan creates lasts one block. Averaged over a 30-minute window (roughly 150 blocks on Ethereum), the contribution of that single block to the average is about 0.7%. Even a 100% price spike for one block barely shifts the average. The protocol reading the TWAP sees a number very close to the real market price, and the attack fails.

## How the math works without storing every price

The naive way to compute an average price over time is to store every observation. Every time the pool's price changes, write down the new price along with the timestamp. To compute the average at any point, sum the stored prices weighted by how long each one held, and divide by total time.

This is unworkable on chain. Each observation is a storage write. Active pools change price many times per block. Storing every observation would make every swap dramatically more expensive, and the contract would have to keep paying for unbounded storage.

There's a better approach. Instead of storing each individual price, store a single running total: the integral of price over time — `priceCumulative`. Every time the pool's price changes, do one update: add `oldPrice × (now − lastUpdate)` to the accumulator, then set `lastUpdate = now`. That's one storage slot, one read, one write per change.

To compute the average price between two times T₁ and T₂, you don't need to know any of the prices in between. You only need the value of `priceCumulative` at those two times. The average is:

```
TWAP[T₁, T₂] = (priceCumulative(T₂) - priceCumulative(T₁)) / (T₂ - T₁)
```

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>priceCumulative curve showing TWAP as the slope between two readings</title><desc>A line chart plots priceCumulative rising over time as price moves from low to high. A dashed line connects two sample points, T1 and T2, and its slope equals TWAP, calculated as (cum2 minus cum1) divided by (T2 minus T1) from just two stored readings.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">priceCumulative grows by (price × time). TWAP is the slope between two readings.</text>
  <text x="50" y="240" text-anchor="middle" font-family="monospace" font-size="11" transform="rotate(-90, 50, 240)">priceCumulative</text>
  <line x1="100" y1="380" x2="660" y2="380" stroke="#000000" stroke-width="1.5"/>
  <line x1="100" y1="80" x2="100" y2="380" stroke="#000000" stroke-width="1.5"/>
  <text x="380" y="408" text-anchor="middle" font-family="monospace" font-size="11">time</text>
  <line x1="100" y1="350" x2="200" y2="320" stroke="#000000" stroke-width="2"/>
  <line x1="200" y1="320" x2="320" y2="260" stroke="#000000" stroke-width="2"/>
  <line x1="320" y1="260" x2="450" y2="160" stroke="#000000" stroke-width="2"/>
  <line x1="450" y1="160" x2="660" y2="100" stroke="#000000" stroke-width="2"/>
  <text x="135" y="365" font-family="monospace" font-size="9" fill="#565653" font-style="italic">price=low</text>
  <text x="260" y="295" font-family="monospace" font-size="9" fill="#565653" font-style="italic">price=med</text>
  <text x="430" y="225" font-family="monospace" font-size="9" fill="#565653" font-style="italic">price=high</text>
  <text x="600" y="148" font-family="monospace" font-size="9" fill="#565653" font-style="italic">price=med-high</text>
  <line x1="200" y1="320" x2="540" y2="130" stroke="#ed4937" stroke-width="2.5" stroke-dasharray="8 4"/>
  <circle cx="200" cy="320" r="6" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>
  <circle cx="540" cy="130" r="6" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>
  <line x1="200" y1="320" x2="200" y2="380" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="100" y1="320" x2="200" y2="320" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="540" y1="130" x2="540" y2="380" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="100" y1="130" x2="540" y2="130" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="200" y="395" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">T₁</text>
  <text x="540" y="395" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">T₂</text>
  <text x="92" y="324" text-anchor="end" font-family="monospace" font-size="10">cum₁</text>
  <text x="92" y="134" text-anchor="end" font-family="monospace" font-size="10">cum₂</text>
  <text x="182" y="345" text-anchor="end" font-family="monospace" font-size="10" font-weight="bold">obs₁</text>
  <text x="558" y="115" font-family="monospace" font-size="10" font-weight="bold">obs₂</text>
  <rect x="100" y="425" width="560" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="380" y="447" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">TWAP[T₁, T₂]  =  (cum₂ − cum₁) / (T₂ − T₁)  =  slope of the dashed line</text>
  <text x="380" y="470" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Two storage reads. The contract never has to remember each price along the way.</text>
</svg>

The geometric interpretation: each segment of the cumulative curve has a slope equal to the price during that segment. The average price between two times is the slope of the straight line connecting the two endpoints. The pool's `priceCumulative` works exactly like an odometer. The pool tells you "total price-time so far"; you sample it twice and divide to get average speed.

To use it as an oracle, your contract has to do two things:

1. Read `priceCumulative` at the moment you want the window to *start*, and store that value.
2. Wait the window duration. Then read `priceCumulative` again, subtract, and divide by elapsed time.

Step 1 is sometimes called "taking an observation." It's the only thing you store on your side. The pool stores the running total.

## Uniswap V2's implementation

Uniswap V2 was the first AMM to introduce this design. The relevant additions to the `Pair` contract are two storage slots:

```solidity
uint256 public price0CumulativeLast;
uint256 public price1CumulativeLast;
uint32  private blockTimestampLast;
```

These are updated inside the pair's `_update()` function, which is called on every swap, mint, and burn. The update is:

```solidity
uint32 timeElapsed = blockTimestamp - blockTimestampLast;
if (timeElapsed > 0 && reserve0 != 0 && reserve1 != 0) {
    price0CumulativeLast += uint(UQ112x112.encode(reserve1).uqdiv(reserve0)) * timeElapsed;
    price1CumulativeLast += uint(UQ112x112.encode(reserve0).uqdiv(reserve1)) * timeElapsed;
}
```

Two things worth noting in this code.

First, the prices are stored in a fixed-point format called `UQ112x112` — an unsigned 224-bit number where the top 112 bits are the integer part and the bottom 112 bits are the fractional part. Solidity has no native decimals, and a price like 3500.84291 needs more precision than integer math gives. The UQ format encodes fractions as integers by scaling everything up by 2^112. Any contract reading these cumulatives has to know this and shift back down before interpreting the result.

Two cumulatives exist because each token in the pair can be priced in the other. `price0CumulativeLast` accumulates "how much of token1 a unit of token0 buys"; `price1CumulativeLast` is the inverse. Use whichever one points the direction you need.

Second, this update only happens when `_update()` runs, which only happens when someone trades or modifies liquidity. If nobody touches the pair for ten minutes, the cumulative doesn't move during those ten minutes, but the price during those ten minutes is still the *last* price the pair recorded, and that price should have contributed to the cumulative as time passed.

There's a workaround. Anyone reading TWAP can compute what the cumulative *would* be if it were updated *now*, by taking the stored cumulative and adding `lastPrice × (block.timestamp - blockTimestampLast)`. Uniswap's `UniswapV2OracleLibrary.currentCumulativePrices()` helper does exactly this. So reading current TWAP doesn't require triggering a trade to refresh the pair. You read the storage and compute the extension yourself.

## A reader contract

A minimal V2 TWAP consumer maintains its own observation and computes the average against the pair's current cumulative.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IUniswapV2Pair} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import {UniswapV2OracleLibrary} from "@uniswap/v2-periphery/contracts/libraries/UniswapV2OracleLibrary.sol";

contract SimpleV2TWAP {
    IUniswapV2Pair public immutable pair;
    uint256 public constant PERIOD = 30 minutes;

    uint256 public price0CumulativeLast;
    uint32  public blockTimestampLast;
    uint224 public price0Average;   // UQ112x112 format

    constructor(IUniswapV2Pair _pair) {
        pair = _pair;
        // Anchor the first observation.
        (price0CumulativeLast, , blockTimestampLast) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(_pair));
    }

    function update() external {
        (uint256 price0Cumulative, , uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        require(timeElapsed >= PERIOD, "period not elapsed");

        price0Average = uint224((price0Cumulative - price0CumulativeLast) / timeElapsed);
        price0CumulativeLast = price0Cumulative;
        blockTimestampLast = blockTimestamp;
    }

    function consult(uint256 amountIn) external view returns (uint256 amountOut) {
        // price0Average is in UQ112x112 divide by 2^112 to use it as an integer ratio.
        return (uint256(price0Average) * amountIn) >> 112;
    }
}
```

Anyone calls `update()` at most once per period. `consult()` then returns the most recently computed average for any input amount. The pattern is two-step on purpose: TWAP is a function of *past* state, so the read is decoupled from the trade. A consumer can call `consult()` thousands of times against a single stored observation without paying for any oracle work.

## Why the cost of attack scales with the window

Spot price manipulation works because the cost of the manipulation is bounded by the size of one swap and recovered when the swap reverses. TWAP changes the economics by forcing the attacker to keep the pool's price away from the true market price for the duration of the window.

<svg role="img" viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Spot oracle attack vs 30-min TWAP attack: one block vs ~150 blocks</title><desc>Two side-by-side panels compare a spot oracle attack, done in one block with free flash-loan capital and ending in a bad loan plus huge profit, against a 30-minute TWAP attack, which needs about 150 blocks of locked-up real capital while arbitrageurs repeatedly extract value. Each panel walks through the block-by-block steps, the cost incurred, and the net result, showing the TWAP attack is often unprofitable.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Why a 30-minute TWAP forces the attacker to bleed real money</text>
  <rect x="40" y="80" width="310" height="450" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="105" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">Spot oracle</text>
  <text x="195" y="122" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">attack lasts one block</text>
  <line x1="60" y1="135" x2="330" y2="135" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <rect x="60" y="155" width="270" height="30" fill="#e0deda" stroke="#ed4937" stroke-width="1"/>
  <text x="195" y="174" text-anchor="middle" font-family="monospace" font-size="10">flash-loan capital, free</text>
  <text x="60" y="208" font-family="monospace" font-size="10" font-weight="bold">block N:</text>
  <text x="80" y="226" font-family="monospace" font-size="9">push pool price to $7,000</text>
  <text x="80" y="244" font-family="monospace" font-size="9">protocol reads $7,000</text>
  <text x="80" y="262" font-family="monospace" font-size="9">borrow against fake collateral</text>
  <text x="80" y="280" font-family="monospace" font-size="9">reverse the swap</text>
  <text x="80" y="298" font-family="monospace" font-size="9">repay flash loan</text>
  <rect x="60" y="320" width="270" height="40" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="195" y="338" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">cost: gas + pool slippage</text>
  <text x="195" y="352" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">recovered when swap reverses</text>
  <rect x="60" y="380" width="270" height="130" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="195" y="400" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">net result:</text>
  <line x1="80" y1="408" x2="310" y2="408" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="80" y="428" font-family="monospace" font-size="10">attacker walks away with</text>
  <text x="80" y="445" font-family="monospace" font-size="10">the full bad loan extracted</text>
  <text x="80" y="475" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">+ huge profit</text>
  <text x="80" y="495" font-family="monospace" font-size="9" fill="#565653" font-style="italic">contained inside one block</text>
  <rect x="370" y="80" width="310" height="450" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="105" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">30-min TWAP</text>
  <text x="525" y="122" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">attack must last ~150 blocks</text>
  <line x1="390" y1="135" x2="660" y2="135" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <rect x="390" y="155" width="270" height="30" fill="#e0deda" stroke="#ed4937" stroke-width="1"/>
  <text x="525" y="174" text-anchor="middle" font-family="monospace" font-size="10">real capital, locked up</text>
  <text x="390" y="208" font-family="monospace" font-size="10" font-weight="bold">block N:</text>
  <text x="410" y="226" font-family="monospace" font-size="9">push pool price to $7,000</text>
  <text x="390" y="248" font-family="monospace" font-size="10" font-weight="bold">block N+1:</text>
  <text x="410" y="266" font-family="monospace" font-size="9">arbitrageurs sell into the pool</text>
  <text x="410" y="280" font-family="monospace" font-size="9">at the fake price, take profit</text>
  <text x="410" y="294" font-family="monospace" font-size="9">attacker must re-push the price</text>
  <text x="390" y="316" font-family="monospace" font-size="10" font-weight="bold">block N+2 ... N+150:</text>
  <text x="410" y="334" font-family="monospace" font-size="9">repeat. every block.</text>
  <text x="410" y="348" font-family="monospace" font-size="9">arbitrageurs keep extracting.</text>
  <rect x="390" y="360" width="270" height="35" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="525" y="378" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">cost: arb losses × 150 blocks</text>
  <text x="525" y="390" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">unrecoverable</text>
  <rect x="390" y="408" width="270" height="105" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="525" y="428" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">net result:</text>
  <line x1="410" y1="436" x2="640" y2="436" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="410" y="456" font-family="monospace" font-size="10">arbitrage losses often</text>
  <text x="410" y="471" font-family="monospace" font-size="10">exceed extractable value</text>
  <text x="410" y="496" font-family="monospace" font-size="10" font-weight="bold">often unprofitable</text>
</svg>

The longer the TWAP window, the more blocks of manipulation the attacker has to sustain, and the more arbitrage value bleeds out during that time. 5-minute windows have been broken by determined attackers with deep liquidity behind them. 30-minute and longer windows have generally held up, but only against pools with reasonable trading volume.

## What TWAP doesn't solve

TWAP changes the economics of manipulation, but it does not eliminate manipulation. Several specific limitations remain.

**A TWAP is only as deep as its underlying pool.** If the pool has low liquidity, the cost of moving the price for a few blocks can be small enough that even a 30-minute window is affordable to attack. TWAP shifts the manipulation budget upward, but it doesn't make a thinly traded pool safe to read.

**TWAP lags the real price.** That's the entire point. The smoothing is the defense. But if you need to know the actual current price, TWAP isn't the right oracle. Use it for collateral valuation, liquidation thresholds, fee calculations, anything that benefits from stability and can tolerate latency. Don't use it for "what price do I quote this swap at" because the answer will be wrong by minutes.

**Stale TWAPs across inactive periods.** The cumulative only advances when someone interacts with the pair. A pool that goes hours without a trade has a cumulative that hasn't moved, and the computed extension uses whatever the last trade's price was. That last price might already be far from the true market.

**Choosing the right window is a tradeoff.** Shorter windows track price changes more quickly but are cheaper to manipulate. Longer windows are harder to attack but lag farther behind the real market. There is no universally right answer. Lending protocols using TWAP typically pick 10 minutes to 1 hour depending on volume and risk tolerance.

**Two-token denomination.** A V2 TWAP gives you the price of one token in the pair, denominated in the other. ETH/USDC tells you the ETH price in USDC. To get "ETH/USD" you have to either trust that USDC equals USD (usually fine, sometimes not) or chain multiple TWAPs together. Chainlink feeds give you USD directly because they aggregate across markets.

## When to use TWAP

Chainlink price feeds are the right answer when they're available, because they aggregate across exchanges and don't depend on any single pool's liquidity. TWAP fills three specific gaps.

The first is long-tail assets without Chainlink coverage. If you're building a protocol that takes some obscure ERC-20 as collateral, there's no feed for it. The TWAP of its largest liquid pool is the best you can do.

The second is internal protocol pricing of derived assets. Pricing LP tokens, liquid staking tokens, or any token whose value is *defined* by an on-chain protocol is something TWAP can do that off-chain oracles can't. The canonical source of truth is the on-chain math, and TWAP just gives you a smoothed read of it.

The third is cross-checks. Production protocols sometimes consume both a Chainlink price and a TWAP, and revert if they diverge significantly. The TWAP catches the rare case where a Chainlink feed is misconfigured, suspended, or otherwise wrong, while Chainlink catches the case where the pool is thinly traded or under attack.
