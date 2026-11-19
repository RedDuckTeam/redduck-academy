---
id: 167
title: Oracles and Chainlink Price Feeds
type: lecture
order: 1
faq:
  - question: Why does the ETH/USD feed return 350000000000?
    answer: >-
      Eight implied decimals. That is 3,500.00000000 USD.
  - question: How do I use an 8-decimal price with an 18-decimal token amount?
    answer: >-
      Multiply the price by 1e10, and require it is positive before casting to uint256.
  - question: How stale can a Chainlink price legitimately be?
    answer: >-
      Up to the heartbeat, an hour for ETH/USD on mainnet, which also publishes on a 0.5% move.
      Quieter feeds run 24 hours or longer. Compare block.timestamp against updatedAt.
  - question: Why can't my contract fetch a price from an API itself?
    answer: >-
      Every node runs every transaction and has to reach the same result, and an HTTP call
      would answer differently on each one.
  - question: Why not run my own oracle from one exchange?
    answer: >-
      Three ways it breaks. The exchange glitches. The keys are compromised and push a fake
      price, which has drained protocols of tens of millions in one transaction. Or the
      operator goes offline.
---

> Smart contracts are sandboxed. They cannot fetch a stock price, call a REST API, or read a database. Anything that comes from outside the chain has to be put on chain by something, and that something is called an oracle.

## The oracle problem

The EVM is a deterministic state machine. Every node must execute every transaction and arrive at the same result, otherwise consensus breaks. That requirement rules out anything that could return different values to different nodes: HTTP requests, random number generators, file system reads, system clocks beyond `block.timestamp`. None of these are available inside Solidity, and no compiler flag will give them to you.

This is a problem because most interesting financial applications depend on real-world data. A lending protocol needs to know what its collateral is worth, in dollars, right now, so it can liquidate undercollateralized loans.

This data does not exist on chain natively. The only way to get it there is for someone outside to write a transaction that puts it there. That someone is an oracle.

## An oracle is a contract and an operator who writes to it

An oracle is two things:

1. A contract on chain that holds some data in storage.
2. An off-chain operator who sends transactions that update that storage.

Your contract reads from the oracle contract the same way you read from any other contract: a normal `view` call. The read is an ordinary function call, so the question that matters is who you trust to do the writing.

The simplest possible oracle is one contract, one operator. The operator queries one data source, signs a transaction with the result, and writes it on chain. Your contract has no way to check the number it reads, so this oracle fails in three ways:

1. **The source is wrong.** Even reputable exchanges have brief glitches. An API returns the price of a different asset for a few seconds. Volume thins out and the last trade is far from fair value. If your oracle pulls from one place, you inherit every glitch from that place. A single source can also be moved on purpose. In 2020 Harvest Finance lost $24M because its contracts took the price from a single on-chain market, and an attacker moved that price with borrowed money, as the [flash loans lesson](/courses/development-on-ethereum/oracles/flash-loans) describes.
2. **The operator is malicious.** A single party with the ability to push any number on chain has every incentive to do so when the payoff is large enough. The history of DeFi exploits includes cases where compromised oracle keys were used to drain protocols of tens of millions of dollars in single transactions.
3. **The operator goes offline.** The oracle stops updating. Your contract continues to operate using an increasingly stale price. By the time anyone notices, positions that should have been liquidated have moved against the protocol.

The engineering effort around production oracle systems is about reducing how much you have to trust any single party.

## How Chainlink answers each failure

A Chainlink price feed replaces the single source with many exchanges and the single operator with many independent nodes.

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Chainlink price feed: data sources, oracle nodes, aggregator, consumer contract</title><desc>Exchanges like Binance, Coinbase, Kraken, and Bitstamp send prices to many independent oracle nodes, which aggregate them off-chain via OCR. The aggregator contract then stores the median price and round metadata on-chain, and the consumer contract reads it through an interface.</desc>
  <defs>
    <marker id="arrO1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A Chainlink price feed aggregates across sources AND across nodes</text>
  <text x="95" y="88" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Data sources</text>
  <text x="95" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(off chain)</text>
  <text x="285" y="88" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Oracle nodes</text>
  <text x="285" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(off chain)</text>
  <text x="475" y="88" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Aggregator contract</text>
  <text x="475" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(on chain)</text>
  <text x="630" y="88" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Your contract</text>
  <text x="630" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(on chain)</text>
  <rect x="40" y="120" width="110" height="30" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="139" text-anchor="middle" font-family="monospace" font-size="10">Binance</text>
  <rect x="40" y="158" width="110" height="30" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="177" text-anchor="middle" font-family="monospace" font-size="10">Coinbase</text>
  <rect x="40" y="196" width="110" height="30" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="215" text-anchor="middle" font-family="monospace" font-size="10">Kraken</text>
  <rect x="40" y="234" width="110" height="30" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="95" y="253" text-anchor="middle" font-family="monospace" font-size="10">Bitstamp</text>
  <text x="95" y="280" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">...and others</text>
  <rect x="230" y="135" width="110" height="30" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="285" y="154" text-anchor="middle" font-family="monospace" font-size="10">Node 1</text>
  <rect x="230" y="173" width="110" height="30" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="285" y="192" text-anchor="middle" font-family="monospace" font-size="10">Node 2</text>
  <rect x="230" y="211" width="110" height="30" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="285" y="230" text-anchor="middle" font-family="monospace" font-size="10">Node 3</text>
  <text x="285" y="258" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">...up to 31 nodes</text>
  <line x1="155" y1="150" x2="225" y2="150" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrO1)"/>
  <line x1="155" y1="188" x2="225" y2="188" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrO1)"/>
  <line x1="155" y1="226" x2="225" y2="226" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrO1)"/>
  <rect x="420" y="170" width="110" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="475" y="192" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Aggregator</text>
  <text x="475" y="208" text-anchor="middle" font-family="monospace" font-size="9">stores median</text>
  <text x="475" y="222" text-anchor="middle" font-family="monospace" font-size="9">+ round metadata</text>
  <line x1="345" y1="150" x2="415" y2="190" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrO1)"/>
  <line x1="345" y1="188" x2="415" y2="200" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrO1)"/>
  <line x1="345" y1="226" x2="415" y2="210" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrO1)"/>
  <text x="380" y="265" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937" font-style="italic">OCR aggregation:</text>
  <text x="380" y="277" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937" font-style="italic">one tx, median answer</text>
  <rect x="590" y="175" width="90" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="635" y="195" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Consumer</text>
  <text x="635" y="212" text-anchor="middle" font-family="monospace" font-size="9">reads via</text>
  <text x="635" y="222" text-anchor="middle" font-family="monospace" font-size="9">interface</text>
  <line x1="535" y1="200" x2="585" y2="200" stroke="#ed4937" stroke-width="2" marker-end="url(#arrO1)"/>
  <rect x="40" y="320" width="640" height="160" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="342" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Three levels of decentralization protect against bad data:</text>
  <line x1="60" y1="354" x2="660" y2="354" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="378" font-family="monospace" font-size="10">1. Each node pulls from MANY exchanges. One exchange going down does not break the feed.</text>
  <text x="60" y="402" font-family="monospace" font-size="10">2. MANY independent nodes pull in parallel. One malicious node cannot push a fake price.</text>
  <text x="60" y="426" font-family="monospace" font-size="10">3. Nodes aggregate off-chain via OCR, then ONE transaction writes the median on-chain.</text>
  <text x="60" y="454" font-family="monospace" font-size="10" fill="#565653">Gas cost: paid once per update, regardless of how many nodes contributed.</text>
</svg>

**The source is wrong.** Each node pulls the price from many exchanges, so one exchange that glitches or goes down does not decide the answer.

**The operator is malicious.** Many independent nodes report in parallel, and the feed stores the median of their answers, which is the middle value after sorting. If four nodes report 3,499, 3,500, 3,500 and 3,501 and a fifth reports 1,000,000, the average is 202,800 and the median is still 3,500. As long as fewer than half of the answers are false, the median stays inside the range of the honest ones.

**The operator goes offline.** There is no single operator: many nodes report, and one of them writes the agreed answer. If the feed stops updating anyway, your contract can notice, because every answer carries the time it was written.

The OCR step (Off-Chain Reporting) is the part that matters for cost. Without it, every node would have to write its own answer on chain, paying gas, and your contract would have to read all of them and compute the median itself. OCR lets the nodes do the median calculation off chain via a peer-to-peer protocol, agree on a single answer, and have one of them write that answer to the aggregator in one transaction. The on-chain footprint is a single write per update, regardless of how many nodes participated.

The on-chain side is split into two contracts: an **aggregator** that does the actual storage and verification, and a **proxy** that consumers point at. The proxy address never changes, and the aggregator behind it can be swapped out for upgrades, so production code always reads from the proxy address rather than the aggregator directly. The full list of proxy addresses per network is on the [supported networks page](https://docs.chain.link/data-feeds/price-feeds/addresses).

## Reading a feed

Consuming a price feed is one interface and one function call. Your contract wraps the feed's proxy address in Chainlink's `AggregatorV3Interface` and calls [`latestRoundData()`](https://docs.chain.link/data-feeds/api-reference). The function returns five values, and most consumers need two of them: `answer`, the price itself, and `updatedAt`, the time the answer was last updated.

The price comes back as `int256`, not `uint256`, because the interface also serves feeds whose values can legitimately be negative (interest rate differentials, for example). Price feeds for assets like ETH/USD will never return a negative number, but the type allows one, so require `answer > 0` once at the read site. The check makes converting to `uint256` safe, and it catches the edge case where a misconfigured feed reports zero or negative.

The `answer` returned is an integer, with the decimal point implicit. Each feed has a `decimals()` function that tells you how many digits to interpret as decimals. For ETH/USD, the convention is 8 decimals. If the feed returns `answer = 350000000000`, the actual price is `3500.00000000` USD. To use this in computation alongside an 18-decimal token amount, you have to either scale the price up or scale the token amount down. The typical approach is to multiply the price by `10^10` to bring it to 18-decimal precision. Decimals do not change for a given feed, so if you call `decimals()` once at construction and store it, you avoid one external call on every price read.

## The on-chain price can be stale

Every update is a transaction that costs gas, so a feed does not write a new price in every block. It updates when either the price moves enough or enough time has passed. It does not need both.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>ETH/USD feed update triggers: 0.5% deviation or 1-hour heartbeat</title><desc>A chart plots ETH price against time, comparing the real-world price line to the on-chain feed, which updates in steps. Two boxes explain the triggers: a deviation threshold (price moves more than 0.5% for ETH/USD on mainnet) and a heartbeat interval (maximum 1 hour between updates), and the feed publishes when either one fires first.</desc>
  <defs>
    <marker id="arrO2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A feed publishes when EITHER trigger fires: heartbeat OR deviation</text>
  <text x="60" y="190" text-anchor="middle" font-family="monospace" font-size="11" transform="rotate(-90, 60, 190)">ETH price ($)</text>
  <line x1="100" y1="300" x2="660" y2="300" stroke="#000000" stroke-width="1.5"/>
  <line x1="100" y1="90" x2="100" y2="300" stroke="#000000" stroke-width="1.5"/>
  <text x="380" y="328" text-anchor="middle" font-family="monospace" font-size="11">time</text>
  <path d="M 100 200 Q 160 195, 200 198 T 280 205 T 360 210 Q 400 240, 440 248 T 520 252 Q 560 230, 600 220 T 660 218" fill="none" stroke="#565653" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="615" y="208" text-anchor="end" font-family="monospace" font-size="9" fill="#565653" font-style="italic">real-world price</text>
  <line x1="100" y1="200" x2="380" y2="200" stroke="#ed4937" stroke-width="2.5"/>
  <line x1="380" y1="200" x2="380" y2="245" stroke="#ed4937" stroke-width="2.5"/>
  <line x1="380" y1="245" x2="560" y2="245" stroke="#ed4937" stroke-width="2.5"/>
  <line x1="560" y1="245" x2="560" y2="225" stroke="#ed4937" stroke-width="2.5"/>
  <line x1="560" y1="225" x2="660" y2="225" stroke="#ed4937" stroke-width="2.5"/>
  <text x="640" y="262" text-anchor="end" font-family="monospace" font-size="9" fill="#ed4937" font-style="italic">on-chain feed</text>
  <circle cx="100" cy="200" r="4" fill="#ed4937"/>
  <circle cx="380" cy="245" r="5" fill="#ed4937"/>
  <line x1="380" y1="245" x2="380" y2="100" stroke="#ed4937" stroke-width="1" stroke-dasharray="2 3"/>
  <rect x="305" y="76" width="150" height="22" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="380" y="91" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">DEVIATION trigger</text>
  <circle cx="560" cy="225" r="5" fill="#ed4937"/>
  <line x1="560" y1="225" x2="560" y2="100" stroke="#ed4937" stroke-width="1" stroke-dasharray="2 3"/>
  <rect x="490" y="76" width="140" height="22" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="560" y="91" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">HEARTBEAT trigger</text>
  <rect x="60" y="350" width="300" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="210" y="370" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Deviation threshold</text>
  <line x1="80" y1="378" x2="340" y2="378" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="80" y="395" font-family="monospace" font-size="10">Real price moved more than X%</text>
  <text x="80" y="411" font-family="monospace" font-size="10">since last on-chain answer.</text>
  <text x="80" y="431" font-family="monospace" font-size="9" fill="#565653">ETH/USD on mainnet: 0.5%</text>
  <rect x="380" y="350" width="300" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="370" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Heartbeat interval</text>
  <line x1="400" y1="378" x2="660" y2="378" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="400" y="395" font-family="monospace" font-size="10">Maximum time between updates,</text>
  <text x="400" y="411" font-family="monospace" font-size="10">even if the price has not moved.</text>
  <text x="400" y="431" font-family="monospace" font-size="9" fill="#565653">ETH/USD on mainnet: 1 hour</text>
</svg>

For ETH/USD on mainnet the deviation threshold is 0.5% and the heartbeat is one hour. So in normal operation the on-chain price can sit almost 0.5% away from the real price without triggering an update, and it can be up to an hour old if the price hasn't moved enough. For less active feeds, heartbeats can be 24 hours or longer.

This means stale data is a real possibility, even under normal operation. Your contract must validate that the data is recent enough for its purposes. In the code below, `priceFeed` is the feed's proxy typed as `AggregatorV3Interface`, which you import from `@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol`:

```solidity
function getValidatedPrice() public view returns (uint256) {
    (, int256 answer, , uint256 updatedAt, ) = priceFeed.latestRoundData();
    require(answer > 0, "invalid price");
    require(block.timestamp - updatedAt < 1 hours + 10 minutes, "stale price");
    return uint256(answer);
}
```

The staleness threshold depends on the feed's heartbeat and your protocol's tolerance. A lending protocol that liquidates on small price moves needs fresher data than a settlement contract that runs once a day. Here the threshold is the one-hour ETH/USD heartbeat plus ten minutes. Because an update can arrive slightly after the heartbeat under normal operation, production code usually sets the threshold a little above the heartbeat so a late-but-healthy update is not rejected as stale. Setting it too low causes false reverts during normal operation. Setting it too high lets your protocol act on data that may no longer reflect reality.

## What you still trust

Chainlink reduces how much you trust any single party, but your contract still trusts the feed as a whole. It trusts that most of the nodes report honestly. It also trusts whoever can swap the aggregator behind the proxy, because a new aggregator can report any number to every contract that reads the proxy.

Chainlink also doesn't have a feed for every asset. For a token without one, the [TWAP lesson](/courses/development-on-ethereum/oracles/twap-oracles) builds a price from an AMM pool.

Before you ship a contract that reads a feed, answer two questions about it. What does the contract do if the price stops updating for longer than the heartbeat? Can it lose money when the real price is a deviation threshold away from the price it read?
