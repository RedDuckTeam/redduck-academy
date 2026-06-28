# Outages, lessons, and resilience

_type: lecture_

> Solana has gone down several times. Long enough each time to make the news, short enough that the network has always come back. The outages are an awkward topic to discuss because they're real failures that real money rode through, but they're also some of the most honest education the network has produced about its own architecture. Each outage was a stress test that revealed an assumption the design didn't hold, followed by a specific engineering response. This lecture walks through four notable outages, what each one revealed, and what changed. Treat this as a debugging-the-network exercise. You'll see your own programs in a new light afterward.

## Why outages teach more than uptime does

A network that has never gone down has never been tested. You don't know which assumptions held up because they were correct and which held up because they were never seriously challenged. Outages are where the gap between "the design works" and "the design works under adversarial conditions" gets measured. Every chain that's run real money for years has its list. Bitcoin had its 2010 value-overflow incident. Ethereum had the DAO fork, the Constantinople delay, multiple congestion events. Solana has its outages, and they map cleanly onto specific architectural decisions.

What's worth paying attention to is not the outage itself but the pattern between trigger and fix. Each outage took an aspect of the design that worked under benign conditions and stress-tested it under adversarial ones. The fixes weren't admissions of fundamental flaws, they were upgrades to assumptions. Watching this pattern repeat is what gives you a real sense of how the network evolved into what it is now.

## September 2021: the IDO bot storm

Solana's first major outage came in September 2021 during the launch of a popular token on the Grape Protocol initial DEX offering. Bots flooded the network with swap transactions, trying to position themselves to acquire allocations. The transaction volume hit roughly 400,000 per second at peak, far above what the network was designed to handle smoothly. Validators struggled to keep up, fork choice degraded, and after several hours of escalating problems, the network halted entirely. It took about 17 hours of coordination among validator operators to restart.

The trigger was a flood of nearly-free transactions. The fix had to address the assumption underneath: that transactions arrive at a rate validators can keep up with. The architecture didn't have a transaction-level prioritization mechanism. Every transaction was treated as roughly equal, processed in the order it arrived. When millions of bots were submitting identical-looking transactions, the network had no way to distinguish "this transaction is important" from "this transaction is one of a million spammed copies."

The lesson revealed was that throughput as a benchmark number is not the same as throughput under adversarial conditions. A network can do 50,000 TPS in a clean test environment and still get knocked over when 400,000 transactions per second arrive in a coordinated burst.

The architectural fix took several forms. Solana migrated transaction submission from UDP to QUIC, which provided per-connection backpressure and identity. Stake-weighted Quality of Service was added: validators began prioritizing forwarding traffic from peers based on their stake, making it expensive to spam the network from low-stake or unstaked clients. These changes took months to roll out but they shaped the way transactions flow today. Every RPC node and every wallet you've interacted with uses this revised pipeline.

## 2022: the NFT mint cascades

Throughout 2022, Solana experienced a recurring class of stress events tied to popular NFT mints. The Metaplex Candy Machine system was the dominant Solana NFT minting tool, and each high-profile mint would attract bot armies trying to grab allocations the moment minting opened. The pattern was the same as the IDO storm but lower amplitude and more frequent: a small number of slots saw extreme transaction floods, often degrading the network for 30 minutes to a few hours.

These weren't full halts most of the time, but they were embarrassing. Users couldn't get transactions through. Wallets timed out. The Solana experience for ordinary users during a popular mint was that the chain didn't work.

The trigger was again transaction spam, but the assumption being tested was different. The QUIC and stake-weighted QoS work had partially addressed the "spam arrives at validators" problem, but it didn't address the underlying economic reality: transactions on Solana were essentially free. The base fee of 5,000 lamports per signature is small enough that a bot operator can submit thousands of failed attempts and not feel it.

The fix was the introduction of priority fees as a mainstream pattern. The mechanism had existed for a while, but it wasn't yet the default thing wallets and applications used. Through 2022 and into 2023, priority fees became normalized. Wallets started attaching them by default. Applications started bidding for inclusion. The economic incentive structure shifted: if you wanted your transaction prioritized, you paid for it. Spam transactions still happen, but the cost of doing damage at scale is now much higher, and the priority-fee market gives legitimate users a way to compete.

## February 2023: the block propagation bug

The February 2023 outage was different. It wasn't caused by transaction flooding or external load. It was caused by a bug.

The triggering event involved an unusual block that hit a code path in the deduplication logic of the validator client. The bug caused validators to fail to converge on the same view of the chain. Validators forked into multiple branches, finality stalled, and after several hours of recovery attempts, the network was halted and restarted with a known-good ledger state. Total downtime was around 19 hours.

The trigger was a single-line software issue in the validator implementation. The lesson revealed was harder to fix. Every validator on the Solana network was running the same software, Solana Labs' validator client, which has since been renamed to the Agave client. A bug in that one codebase was a network-wide bug, because there was no second implementation that would have processed the offending block differently.

Compare to Ethereum, which has multiple independent validator clients in production. Geth, Erigon, Nethermind, Besu, Reth on the execution side. Prysm, Lighthouse, Teku, Nimbus, Lodestar on the consensus side. A bug in one client typically affects only the validators running that client rather than the whole network. The network keeps going. Solana didn't have that diversity.

The architectural response was Firedancer. Firedancer is a second Solana validator client, written from scratch by Jump Crypto in C, designed as a high-performance independent implementation. The Feb 2023 outage was widely cited as the moment Firedancer's importance became urgent rather than nice-to-have. Firedancer's development accelerated, and partial versions of it, including a hybrid called Frankendancer that uses Firedancer's networking layer atop Agave's consensus, reached mainnet during 2024 and 2025. As of this writing, full Firedancer is running on mainnet, giving Solana the client diversity that was missing in 2023.

The lesson here was about resilience as a property of the ecosystem rather than the design. The protocol itself was fine. The implementation diversity wasn't. You can have a beautifully designed network and still go down if there's only one program running it.

## Q1 2024: priority fee market degradation

The fourth event isn't a clean outage, but it's worth covering because it taught a different lesson. During the early 2024 memecoin trading surge, Solana experienced a sustained period where the network was technically running but transaction failure rates spiked to high single-digit and sometimes double-digit percentages. Users would attach priority fees, submit transactions, and watch them fail anyway.

The trigger was high transaction volume from memecoin trading, which dwarfed the volumes the network had been tested under. The QUIC and stake-weighted QoS layers from 2021 were doing their job: they were preventing actual halts. But the priority fee market wasn't being respected end-to-end. RPC nodes were forwarding transactions to leaders, but the forwarding pipeline had been built with assumptions that didn't hold under load. Transactions with high priority fees were sometimes dropped in favor of unrelated transactions, the leader's scheduler didn't always order transactions by priority correctly, and various edge cases caused fee-attached transactions to fail at higher rates than expected.

The lesson revealed was about end-to-end semantics. Each individual component of the transaction pipeline was technically correct. But the composition of components had behaviors no single component intended. A transaction could pay a high priority fee, get forwarded correctly by the RPC, arrive at the right leader on time, and still get dropped because the leader's local scheduler made a choice based on different criteria.

The fix was a multi-month effort across several teams. The scheduler in the Agave client was rewritten. Forwarding logic was revised. The priority fee API was extended so that wallets and applications could query expected fees more accurately. The result, by mid-to-late 2024, was a network where priority fees behaved much more predictably. Pay more, get included more reliably.

## What the pattern tells you

<svg viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Four Solana outages and what each revealed</text>
  <rect x="40" y="80" width="640" height="105" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="640" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="55" y="98" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Sept 2021 — IDO bot storm</text>
  <text x="55" y="125" font-family="monospace" font-size="10">Trigger:</text>
  <text x="140" y="125" font-family="monospace" font-size="10" fill="#565653">bots flooded the network with swap txs targeting a popular IDO</text>
  <text x="55" y="145" font-family="monospace" font-size="10">Revealed:</text>
  <text x="140" y="145" font-family="monospace" font-size="10" fill="#565653">no transaction-level prioritization, validators overwhelmed by spam</text>
  <text x="55" y="165" font-family="monospace" font-size="10">Fix:</text>
  <text x="140" y="165" font-family="monospace" font-size="10" fill="#565653">QUIC-based transactions, stake-weighted QoS for forwarding</text>
  <rect x="40" y="200" width="640" height="105" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="200" width="640" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="55" y="218" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">2022 — NFT mint cascades</text>
  <text x="55" y="245" font-family="monospace" font-size="10">Trigger:</text>
  <text x="140" y="245" font-family="monospace" font-size="10" fill="#565653">Candy Machine mints brought repeated transaction-flood events</text>
  <text x="55" y="265" font-family="monospace" font-size="10">Revealed:</text>
  <text x="140" y="265" font-family="monospace" font-size="10" fill="#565653">free transactions made spam economically rational</text>
  <text x="55" y="285" font-family="monospace" font-size="10">Fix:</text>
  <text x="140" y="285" font-family="monospace" font-size="10" fill="#565653">priority fees as an economic spam disincentive</text>
  <rect x="40" y="320" width="640" height="105" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="320" width="640" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="55" y="338" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Feb 2023 — block propagation bug</text>
  <text x="55" y="365" font-family="monospace" font-size="10">Trigger:</text>
  <text x="140" y="365" font-family="monospace" font-size="10" fill="#565653">an unusual block triggered a deduplication bug in the validator client</text>
  <text x="55" y="385" font-family="monospace" font-size="10">Revealed:</text>
  <text x="140" y="385" font-family="monospace" font-size="10" fill="#565653">single-client monoculture, no second implementation to compare against</text>
  <text x="55" y="405" font-family="monospace" font-size="10">Fix:</text>
  <text x="140" y="405" font-family="monospace" font-size="10" fill="#565653">accelerated work on Firedancer as a second validator client</text>
  <rect x="40" y="440" width="640" height="105" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="440" width="640" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="55" y="458" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Q1 2024 — high tx failure rate under load</text>
  <text x="55" y="485" font-family="monospace" font-size="10">Trigger:</text>
  <text x="140" y="485" font-family="monospace" font-size="10" fill="#565653">memecoin trading volumes hit Solana's tx forwarding pipeline harder than expected</text>
  <text x="55" y="505" font-family="monospace" font-size="10">Revealed:</text>
  <text x="140" y="505" font-family="monospace" font-size="10" fill="#565653">QoS biased toward low-stake validators, fee market signal poorly propagated</text>
  <text x="55" y="525" font-family="monospace" font-size="10">Fix:</text>
  <text x="140" y="525" font-family="monospace" font-size="10" fill="#565653">scheduler rewrites, improved priority fee respect throughout the pipeline</text>
</svg>

Look at the four together. The triggers are different: bots, NFT mints, software bug, memecoin volume. The fixes are also different: QUIC and QoS, priority fees, Firedancer, scheduler rewrites. But the underlying lesson each time is the same: the network's design had an assumption that worked in the test environment and broke when reality stressed it differently.

This isn't unique to Solana. Every distributed system has the same lifecycle. You build it. You test it. Some assumptions you didn't realize you were making get tested by the real world. You fix what broke. The system gets stronger. Bitcoin has been through this many times over fifteen years. Ethereum has been through it. So has every traditional financial system, every cloud provider, every major piece of internet infrastructure.

What changes between systems is how the response is structured. Solana's response pattern has been recognizable: an outage happens, root cause is identified within days, a fix is designed within weeks, and rolled out over months. The cadence of fixes has produced a network in 2026 that is structurally more resilient than the network in 2021. Each lesson got internalized.
