# Pyth price feeds

_type: lecture_

> Solana programs are sandboxed. They cannot fetch a stock price, call a REST API, or read a database. Anything that comes from outside the chain has to be put on chain by something, and that something is called an oracle. This lecture covers what oracles actually are, why they matter for any serious DeFi protocol, how Pyth's first-party publisher architecture solves the trust problem, and how to consume a feed safely from a Solana program.

## The oracle problem

The Solana runtime is a deterministic state machine. Every validator must execute every transaction and arrive at the same result, otherwise consensus breaks. That requirement rules out anything that could return different values to different validators: HTTP requests, random number generators, file system reads, system clocks beyond the Clock sysvar. None of these are available inside a Solana program, and no compiler flag will give them to you.

This is a problem because most interesting financial applications depend on real-world data. A lending protocol needs to know what its collateral is worth, in dollars, right now, so it can liquidate undercollateralized loans. A stablecoin needs to know what the dollar is doing to maintain its peg. A derivatives platform needs to know the price of whatever asset its contracts settle against. An insurance program needs to know whether a flight was delayed, whether a hurricane hit, whether a parametric trigger condition was met.

None of this data exists on chain natively. The only way to get it there is for someone outside to write a transaction that puts it there. That someone is an oracle.

## What "an oracle" actually is

The word makes oracles sound mysterious. They are not. An oracle, mechanically, is two things:

1. A program on chain that owns accounts holding some data.
2. An off-chain operator who sends transactions that update that data.

Your program reads the oracle's account the same way you read any other account, by deserializing it through an SDK or directly. The interesting question is not how the read works, since it's just an account read. The interesting question is who you trust to do the writing.

That trust question is the entire field. If the operator decides to publish a fake price, your program has no way to tell. If the operator's infrastructure goes down, your program reads a stale value. If the operator is compromised, your protocol is compromised. The whole engineering effort around production oracle systems is about reducing how much you have to trust any single party.

## Why single-source oracles are dangerous

The simplest possible oracle is one program, one operator. The operator queries one data source, signs a transaction with the result, and writes it on chain. This works fine for a hobby project. It is unacceptable for anything holding real funds.

Three failure modes break a single-source oracle:

1. **The source is wrong.** Even reputable exchanges have brief glitches. An API returns the price of a different asset for a few seconds. Volume thins out and the last trade is far from fair value. If your oracle pulls from one place, you inherit every glitch from that place.
2. **The operator is malicious.** A single party with the ability to push any number on chain has every incentive to do so when the payoff is large enough. The history of DeFi exploits includes cases where compromised oracle keys were used to drain protocols of tens of millions of dollars in single transactions.
3. **The operator goes offline.** The oracle stops updating. Your program continues to operate using an increasingly stale price. By the time anyone notices, positions that should have been liquidated have moved against the protocol.

Any one of these is enough to lose the entire treasury. Real protocols cannot use a single-source oracle and expect to survive a market move.

## How Pyth solves it

Pyth attacks the problem with a different architecture from most oracles. Where Chainlink and similar systems use third-party nodes that pull data from public APIs, Pyth has the data sources themselves as publishers. Jane Street, Wintermute, Binance, OKX, Cboe Global Markets, and dozens of others run publisher software that posts their internal prices directly to Pyth. These are first-party publishers writing their own books to the oracle, rather than third-party nodes scraping a public API.

<svg viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <defs>
    <marker id="arrP1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Pyth aggregates first-party publishers via Pythnet</text>
  <text x="95" y="88" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Publishers</text>
  <text x="95" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(first-party, off chain)</text>
  <text x="285" y="88" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Pythnet</text>
  <text x="285" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(separate appchain)</text>
  <text x="475" y="88" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Pyth price account</text>
  <text x="475" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(on Solana)</text>
  <text x="630" y="88" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Your program</text>
  <text x="630" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(on Solana)</text>
  <rect x="40" y="120" width="110" height="28" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="138" text-anchor="middle" font-family="monospace" font-size="10">Jane Street</text>
  <rect x="40" y="155" width="110" height="28" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="173" text-anchor="middle" font-family="monospace" font-size="10">Wintermute</text>
  <rect x="40" y="190" width="110" height="28" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="208" text-anchor="middle" font-family="monospace" font-size="10">Binance</text>
  <rect x="40" y="225" width="110" height="28" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="243" text-anchor="middle" font-family="monospace" font-size="10">OKX</text>
  <rect x="40" y="260" width="110" height="28" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="278" text-anchor="middle" font-family="monospace" font-size="10">Cboe</text>
  <text x="95" y="305" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">...80+ for major feeds</text>
  <rect x="230" y="170" width="110" height="85" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="285" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Pythnet</text>
  <text x="285" y="208" text-anchor="middle" font-family="monospace" font-size="9">aggregates every</text>
  <text x="285" y="220" text-anchor="middle" font-family="monospace" font-size="9">400ms slot:</text>
  <text x="285" y="238" text-anchor="middle" font-family="monospace" font-size="9">price + confidence</text>
  <line x1="155" y1="134" x2="225" y2="180" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrP1)"/>
  <line x1="155" y1="169" x2="225" y2="200" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrP1)"/>
  <line x1="155" y1="204" x2="225" y2="220" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrP1)"/>
  <line x1="155" y1="239" x2="225" y2="235" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrP1)"/>
  <line x1="155" y1="274" x2="225" y2="250" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrP1)"/>
  <rect x="420" y="180" width="110" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="475" y="200" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Price account</text>
  <text x="475" y="218" text-anchor="middle" font-family="monospace" font-size="9">price, conf,</text>
  <text x="475" y="232" text-anchor="middle" font-family="monospace" font-size="9">expo, publish_time</text>
  <line x1="345" y1="212" x2="415" y2="212" stroke="#ed4937" stroke-width="2" marker-end="url(#arrP1)"/>
  <rect x="590" y="190" width="90" height="48" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="635" y="210" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Consumer</text>
  <text x="635" y="226" text-anchor="middle" font-family="monospace" font-size="9">reads via SDK</text>
  <line x1="535" y1="212" x2="585" y2="212" stroke="#ed4937" stroke-width="2" marker-end="url(#arrP1)"/>
  <rect x="40" y="340" width="640" height="140" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="362" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Three layers of decentralization protect against bad data:</text>
  <line x1="60" y1="372" x2="660" y2="372" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="394" font-family="monospace" font-size="10">1. Each feed has MANY first-party publishers. The data sources ARE the market makers.</text>
  <text x="60" y="416" font-family="monospace" font-size="10">2. Pythnet aggregates with outlier rejection and confidence-weighted averaging.</text>
  <text x="60" y="438" font-family="monospace" font-size="10">3. One update lands on Solana per slot. Cost paid once, regardless of publisher count.</text>
  <text x="60" y="464" font-family="monospace" font-size="10" fill="#565653">No single publisher, single source, or single Pythnet validator can corrupt the price.</text>
</svg>

The aggregation happens on **Pythnet**, a Solana-fork appchain dedicated to oracle data. Each publisher writes their price observation as a transaction on Pythnet. Pythnet validators aggregate the observations into a single price plus a confidence interval, and the aggregate is propagated to Solana mainnet every slot. By the time your program reads a Pyth price account, the data has been through deduplication, outlier rejection, and confidence-weighted averaging across many publishers.

The Pythnet layer is the cost-saving move equivalent to Chainlink's OCR. Without it, every publisher would have to write their own price to Solana mainnet, paying fees, and the aggregation would happen on-chain at enormous compute cost. Pythnet lets the publishers do their work on a separate chain and lets only the final aggregate touch Solana.

The on-chain side on Solana is a set of accounts owned by the Pyth program. Each price feed has its own account at a stable address. Your program reads from that account just like any other Anchor account read.

## Reading a feed

Consuming a Pyth price feed is one account read and a deserialize call. Add `pyth-sdk-solana` to your `Cargo.toml`, and the consumer looks like this:

```rust
use anchor_lang::prelude::*;
use pyth_sdk_solana::load_price_feed_from_account_info;

declare_id!("...");

#[program]
pub mod price_consumer {
    use super::*;

    pub fn read_price(ctx: Context<ReadPrice>) -> Result<()> {
        let price_account_info = &ctx.accounts.price_feed;

        let price_feed = load_price_feed_from_account_info(price_account_info)
            .map_err(|_| OracleError::InvalidPriceFeed)?;

        // Get the current price, rejecting it if older than 60 seconds
        let current = price_feed
            .get_price_no_older_than(&Clock::get()?, 60)
            .ok_or(OracleError::StalePrice)?;

        msg!(
            "price: {} (conf {}) x 10^{}",
            current.price,
            current.conf,
            current.expo
        );

        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReadPrice<'info> {
    /// CHECK: validated by the Pyth SDK loader
    pub price_feed: AccountInfo<'info>,
}

#[error_code]
pub enum OracleError {
    InvalidPriceFeed,
    StalePrice,
}
```

The `load_price_feed_from_account_info` call deserializes the account, verifies it is owned by the Pyth program, and returns a `PriceFeed` struct. `get_price_no_older_than` returns the current price if `publish_time` is within the threshold, or `None` if not. Combining both checks into one call is the recommended pattern, since it handles validity and staleness together.

The result has four fields you care about:

- `price`: the price as a signed integer (`i64`)
- `conf`: the confidence interval, also `u64`, expressed in the same scale as the price
- `expo`: the exponent, almost always negative, so the actual price is `price * 10^expo`
- `publish_time`: when the price was last updated, as a unix timestamp

The price comes back as `i64`. Pyth uses signed integers because some feeds report values that can legitimately be negative, like interest rate differentials. For ETH/USD, the value will always be positive, but the type accommodates the full range.

## Decimals via the exponent

Pyth feeds use an exponent rather than a fixed decimals count. Each feed has its own `expo` value, accessible on the price struct.

For ETH/USD, the exponent is typically `-8`. If the feed returns `price = 350000000000`, the actual price is `350000000000 * 10^-8 = 3500.00000000` USD. To use this in computation alongside an SPL Token amount, whose decimals live on the mint, you need to align the exponents:

```rust
let raw_price = current.price;
require!(raw_price > 0, OracleError::NegativePrice);
let price_u64 = raw_price as u64;

// Scale to 18 decimal places for downstream math
// If expo = -8, we multiply by 10^(18 - 8) = 10^10
let adjustment = (18 + current.expo) as u32;
let price_18_dec = price_u64
    .checked_mul(10u64.pow(adjustment))
    .ok_or(OracleError::Overflow)?;
```

The `require!(raw_price > 0)` check guards against the edge case of a misconfigured feed returning zero or negative. For a USD-quoted equity or crypto feed, the price should never reach zero. Doing this once at the read site is much cheaper than verifying everywhere downstream.

If you call the feed's metadata once at initialization and cache the exponent on your config account, you save the read on every consumption. The exponent does not change for a given feed.

## Confidence intervals

Pyth reports more than just a price. It reports a price AND a confidence interval, expressed in the same units as the price. A return value of `price = 350000000000, conf = 10000000` at `expo = -8` means "ETH/USD is approximately 3500.00, with a one-sigma confidence of about 0.10."

This is unique among major oracles and matters more than it sounds. The confidence interval reflects how much publishers disagree. In a calm market with deep liquidity across exchanges, publishers converge on nearly the same price and confidence is tight. During a market dislocation, like a flash crash, a major exchange going offline, or a publisher's price feed lagging, publishers diverge and confidence widens.

A wide confidence interval is a signal that the price you're reading may not reflect a single coherent market reality. A risk-conscious protocol can refuse to act on data with confidence wider than some threshold:

```rust
let price = current.price as u64;
let conf = current.conf;

// Reject if confidence is wider than 1% of the price
// conf * 100 <= price  is equivalent to  conf / price <= 0.01
require!(
    conf.checked_mul(100).ok_or(OracleError::Overflow)? <= price,
    OracleError::ConfidenceTooWide
);
```

Setting the threshold is application-specific. A lending protocol with conservative liquidation parameters might require confidence within 0.5%. A perpetual exchange willing to take a wider price band might accept 2%. What matters is that the check exists. A price without a confidence check assumes the oracle is always trustworthy, which is exactly the assumption Pyth's architecture was designed to avoid.

## Staleness checks

A Pyth feed publishes continuously. Every Solana slot, the aggregator on Pythnet emits a new price, and the updated value lands on Solana mainnet shortly after. The on-chain price tracks the real-world price within a few hundred milliseconds under normal conditions.

<svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Two checks a Pyth consumer must make</text>
  <rect x="40" y="80" width="310" height="320" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">1. Staleness check</text>
  <text x="55" y="130" font-family="monospace" font-size="10" fill="#565653">price.publish_time vs Clock::get()</text>
  <rect x="55" y="145" width="280" height="80" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="65" y="163" font-family="monospace" font-size="9">publish_time = 1700000060</text>
  <text x="65" y="178" font-family="monospace" font-size="9">now          = 1700000080</text>
  <text x="65" y="193" font-family="monospace" font-size="9">gap          = 20 sec</text>
  <text x="65" y="208" font-family="monospace" font-size="9">threshold    = 60 sec</text>
  <text x="220" y="218" font-family="monospace" font-size="11" font-weight="bold" fill="#2a8a3e">FRESH ✓</text>
  <rect x="55" y="240" width="280" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="65" y="258" font-family="monospace" font-size="9">publish_time = 1700000010</text>
  <text x="65" y="273" font-family="monospace" font-size="9">now          = 1700000080</text>
  <text x="65" y="288" font-family="monospace" font-size="9">gap          = 70 sec</text>
  <text x="65" y="303" font-family="monospace" font-size="9">threshold    = 60 sec</text>
  <text x="220" y="313" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">STALE ✗</text>
  <text x="195" y="345" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">guards against:</text>
  <text x="195" y="361" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">network outage, publisher dropout,</text>
  <text x="195" y="377" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Solana congestion stopping updates</text>
  <rect x="370" y="80" width="310" height="320" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">2. Confidence check</text>
  <text x="385" y="130" font-family="monospace" font-size="10" fill="#565653">price.conf relative to price.price</text>
  <rect x="385" y="145" width="280" height="80" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="395" y="163" font-family="monospace" font-size="9">price = $3,500.00</text>
  <text x="395" y="178" font-family="monospace" font-size="9">conf  = $0.10</text>
  <text x="395" y="193" font-family="monospace" font-size="9">ratio = 0.003%</text>
  <text x="395" y="208" font-family="monospace" font-size="9">threshold = 1%</text>
  <text x="555" y="218" font-family="monospace" font-size="11" font-weight="bold" fill="#2a8a3e">TIGHT ✓</text>
  <rect x="385" y="240" width="280" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="395" y="258" font-family="monospace" font-size="9">price = $3,500.00</text>
  <text x="395" y="273" font-family="monospace" font-size="9">conf  = $42.00</text>
  <text x="395" y="288" font-family="monospace" font-size="9">ratio = 1.20%</text>
  <text x="395" y="303" font-family="monospace" font-size="9">threshold = 1%</text>
  <text x="555" y="313" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">WIDE ✗</text>
  <text x="525" y="345" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">guards against:</text>
  <text x="525" y="361" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">flash crash, exchange outage,</text>
  <text x="525" y="377" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">publisher disagreement</text>
</svg>

That said, updates can stop. Solana network congestion can delay them. Publishers can lag during market stress. The Pyth program itself does not enforce a minimum update frequency on its readers. The price account just sits at whatever value was last written. Your program is responsible for checking the data is recent enough.

This is what `get_price_no_older_than(&Clock::get()?, 60)` in the consumer code does. It accepts the price if `publish_time` is within the last 60 seconds, and returns `None` if not. A threshold of 60 seconds is appropriate for most active DeFi use cases on Solana, since updates are sub-second under normal conditions. Setting it tighter, say 10 seconds, gives you fresher data at the cost of more frequent false rejections during minor network hiccups. Setting it looser, say 300 seconds, lets your protocol act on data that may no longer reflect reality.

The exact threshold depends on your protocol's tolerance. A liquidation engine running every block needs tight freshness. A daily settlement program that runs once a day can accept far older data.

## A note on the pull oracle model

Everything above describes Pyth's continuous-push model on Solana. Pyth's infrastructure continuously updates the price account, and your program just reads it. This is the path most Solana programs use today, and it is the simpler mental model.

Pyth also offers a pull oracle model where the price update message itself is included in the user's transaction. The user fetches a signed price update off-chain from Pyth's Hermes service, attaches it to their transaction, and your program posts the update to the price account before reading. The pull model uses the `pyth-solana-receiver-sdk` crate and a slightly different consumer pattern. It is useful when you want the freshest possible data at the exact moment of a transaction, or when you want to atomically tie a price observation to a specific user action. For most consumer use cases, the push model is simpler and sufficient.
