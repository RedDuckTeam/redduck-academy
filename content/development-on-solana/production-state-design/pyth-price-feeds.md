---
id: 212
title: Pyth price feeds
type: lecture
order: 7
faq:
  - question: Why can't my program just call a price API?
    answer: >-
      Every validator must reach the same result, and an HTTP call could hand each one a
      different value. Outside data arrives only in an account an oracle wrote.
  - question: My program acted on an hours-old price. How do I prevent that?
    answer: >-
      Call get_price_no_older_than with the Clock sysvar and a window such as 60 seconds. It
      returns the price only if publish_time falls inside that window. The account itself holds
      whatever was written last, and congestion or a publisher outage can stall updates for far
      longer.
  - question: What is the conf value next to a Pyth price?
    answer: >-
      A one-sigma confidence interval, in the same units as the price, measuring how far the
      publishers disagree. It widens during a flash crash or an exchange outage. Reject anything
      wider than your threshold, commonly one percent of the price.
  - question: The feed returned 350000000000. Where is the decimal point?
    answer: >-
      In expo. The raw value times ten to the power of expo gives the price, so at expo -8 that
      reading is 3500.00.
  - question: Why is one price source not enough for a protocol holding funds?
    answer: >-
      Three failure modes. The source glitches and reports a wrong price. The operator is
      compromised and pushes a fake number. The operator goes offline and your program reads a
      stale value. Pyth answers all three by aggregating dozens of first-party publishers and
      rejecting outliers.
---

> A Solana program cannot fetch a price. Someone has to bring it on chain, and the program has to decide how much to believe it. On Solana there is one more question, because the account that holds the price is also passed in by the caller: is this the feed I meant to read?

## A price is a claim made by someone else

Every validator has to execute a transaction and arrive at the same result, so a program [cannot make an HTTP request](/courses/blockchain-basics/the-blockchain-idea/determinism-and-what-blockchains-cant-do) or read anything outside the chain. A lending protocol still needs to know what its collateral is worth in dollars. The only way that number gets on chain is that someone outside sends a transaction that writes it into an account. That someone is an oracle.

Reading an oracle is an ordinary account read. The design question is who you trust to do the writing. If the writer publishes a fake price, your program cannot tell. If the writer goes offline, your program reads an old value. Production oracle systems exist to reduce how much you have to trust any single party.

## Why one source is not enough

The simplest oracle is one operator who queries one data source and writes the result on chain. Three failure modes break it:

1. **The source is wrong.** Even reputable exchanges have brief glitches. An API returns the price of a different asset for a few seconds, or volume thins out and the last trade is far from fair value. An oracle that pulls from one place inherits every glitch from that place.
2. **The operator is malicious.** A single party that can push any number on chain has an incentive to do so when the payoff is large enough.
3. **The operator goes offline.** The oracle stops updating and your program keeps operating on an increasingly stale price. By the time anyone notices, positions that should have been liquidated have moved against the protocol.

## How Pyth produces a price

In Pyth the data sources themselves are the publishers. Jane Street, Wintermute, Binance, OKX, Cboe Global Markets, and dozens of others run publisher software that posts their own internal prices directly to Pyth, so there are no third-party nodes scraping a public API.

The aggregation happens on **Pythnet**, a Solana-fork appchain dedicated to oracle data. Each publisher writes its price observation as a transaction on Pythnet. Pythnet validators aggregate the observations into a single price plus a confidence interval, after deduplication, outlier rejection, and confidence-weighted averaging across many publishers. Without Pythnet every publisher would have to write its own price to Solana mainnet and pay fees for it, and the aggregation would run on chain at a large compute cost.

## Who brings the price to Solana: from push to pull

The obvious design is for the oracle to write every new price into an account on Solana, and for programs to read that account. This is the push model, and Pyth used to work this way. It has two costs. The oracle pays for a transaction on every update of every feed, whether or not anyone reads that price. And a program reads whatever was written last, so the price is only as fresh as the last update that landed.

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Pyth data flow: publishers to Pythnet to Solana price account to consumer</title><desc>The diagram shows first-party publishers like Jane Street, Wintermute, Binance, OKX, and Cboe (80+ for major feeds) sending prices off chain to Pythnet, which aggregates them every 400ms slot into a price and confidence value written to a Pyth price account on Solana, which a consumer program then reads via SDK. Below, a box lists three layers of decentralization that protect against bad data: many publishers per feed, outlier-rejecting aggregation on Pythnet, and one paid update per slot on Solana.</desc>
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

Today Pyth works in the pull model, where the user who needs the price brings it. The client downloads the latest signed price update from Pyth's off-chain service, Hermes, and puts it in the same transaction as the action that needs it. The transaction first posts the update to an account, where Pyth's program verifies the signatures, and then your instruction reads it. The price is seconds old at the moment it is used, and nobody pays for updates that nobody reads. In exchange, the user pays for the update, and the client has to fetch it before it can build the transaction. Solana PRO covers this move as an example of [role inversion](/courses/solana-pro/permissionless-execution/role-inversion).

So the price your program reads can sit in two kinds of accounts. A price update account is temporary: anyone can create one for a transaction and close it afterwards. A price feed account has a fixed address and holds a sequence of prices for one feed that only moves forward in time; the Pyth Data Association keeps a set of commonly used feeds updated this way and pays for those updates, as in the push model. Both look the same to your program, and in both cases the caller chooses which account to pass.

## Three checks before you use the price

**Is this the feed I meant?** On Ethereum the contract itself holds the address of the price feed, fixed at deployment. On Solana the caller passes the account. Typing it as `Account<'info, PriceUpdateV2>` proves that the account is owned by Pyth's program, and so that Pyth's program accepted the price it holds, for some feed at some point in time. The program also accepts updates with only part of the signatures checked and records the verification level in the account, and `get_price_no_older_than` refuses an update that is not fully verified. Neither the owner nor the verification level says which feed, and a caller could pass a real, verified update for a different asset. The feed id has to come from your program, as a constant or a field in your own config account, and the read has to fail if the update is for another feed.

**Is it recent enough?** A verified update does not expire, and the caller chooses which one to pass, so without an age check the caller can pass an old price that suits them. A price feed account can also fall behind, because Solana congestion can delay updates and publishers can lag during market stress. Nothing forces a minimum update frequency on readers, so your program is responsible for checking the age of the price. `get_price_no_older_than` accepts the price only if its `publish_time` is within the window you pass. A window of 60 seconds is appropriate for most active DeFi use cases on Solana. Setting it tighter, say 10 seconds, gives you fresher data at the cost of more false rejections during brief network delays. Setting it looser, say 300 seconds, lets your protocol act on data that may no longer reflect reality. A liquidation engine needs a tight window, while a program that settles once a day can accept far older data.

<svg role="img" viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Pyth staleness check vs confidence check, with fresh/stale and tight/wide examples</title><desc>The left panel shows the staleness check: publish_time versus the current time, with a fresh example (20 sec gap under the 60 sec threshold) and a stale example (70 sec gap over it), guarding against network outages, publisher dropout, and Solana congestion. The right panel shows the confidence check: price versus conf, with a tight example (0.003% ratio under the 1% threshold) and a wide example (1.20% ratio over it), guarding against flash crashes, exchange outages, and publisher disagreement.</desc>
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

**Do the publishers agree?** Pyth reports a price and a confidence interval in the same units. A value of `price = 350000000000, conf = 10000000` with exponent `-8` means that ETH/USD is about 3500.00, give or take 0.10. The interval reflects how much publishers disagree. In a calm market they converge on nearly the same price and the interval is tight. During a flash crash, an exchange outage, or a lagging publisher, they diverge and the interval widens. A program can refuse to act when the interval is wider than a threshold. The threshold depends on the application: a lending protocol with conservative liquidation parameters might require confidence within 0.5%, and a perpetual exchange willing to take a wider price band might accept 2%. A program that skips this check treats every price as equally reliable.

The price itself is an integer with an exponent, and the real value is `price * 10^exponent`. Check that it is positive before you cast it to an unsigned type: for a USD-quoted asset it should never be zero or negative, and a misconfigured feed is cheaper to reject here than everywhere downstream.

## In code

The handler below reads BTC/USD and does all three checks. `get_price_no_older_than` fails if the update is older than 60 seconds, belongs to a different feed, or is not fully verified, and the last `require!` rejects a confidence interval wider than 1% of the price.

```rust
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

const BTC_USD_FEED_ID: &str =
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

#[derive(Accounts)]
pub struct ReadPrice<'info> {
    pub price_update: Account<'info, PriceUpdateV2>,
}

pub fn read_price(ctx: Context<ReadPrice>) -> Result<()> {
    let feed_id = get_feed_id_from_hex(BTC_USD_FEED_ID)?;
    let current = ctx
        .accounts
        .price_update
        .get_price_no_older_than(&Clock::get()?, 60, &feed_id)?;

    require!(current.price > 0, OracleError::NegativePrice);
    let price = current.price as u64;
    require!(
        current.conf.checked_mul(100).ok_or(OracleError::Overflow)? <= price,
        OracleError::ConfidenceTooWide
    );
    Ok(())
}
```

## What to decide for every price you read

For each price your program uses, answer three questions before writing the handler. Where does the feed id come from, and can the caller influence it? How old can the price be before the action it triggers becomes unsafe? How wide can the confidence interval be? Then decide what the program does when a check fails, because refusing to act is also an outcome the protocol has to be designed for. Solana PRO's [fail-fast](/courses/solana-pro/outside-data/fail-fast) lesson shows how Drift and Kamino set different thresholds for different actions.
