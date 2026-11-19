---
id: 220
title: What Solana traded for what
type: lecture
order: 8
faq:
  - question: What hardware does a validator need?
    answer: >-
      A 12-core CPU and 256GB of RAM as a floor, several NVMe SSDs in RAID, and a 1 Gbps
      symmetric connection, which runs to four figures a month. Fewer people can afford that,
      which is real centralization pressure. The bet is that hardware keeps getting cheaper.
  - question: Why is walking a linked list awkward in a Solana program?
    answer: >-
      Every transaction names every account it will read or write before it runs, so anything
      whose shape you only discover mid-execution has no way to be declared. That same rule is
      what lets the runtime run non-conflicting transactions on separate cores. Programmer
      flexibility was traded for execution parallelism.
  - question: Why is the compute budget so tight?
    answer: >-
      Because slots are 400ms and the leader has to finish executing inside one. You get
      200,000 compute units per instruction by default and 1.4 million at most. Heavy work
      gets split across instructions and transactions, or moved off chain with on-chain
      verification. What you buy is confirmation in seconds.
  - question: Is my transaction final as soon as it confirms?
    answer: >-
      No. Most applications treat a block as good once a supermajority of stake has voted,
      which takes a few seconds. Full cryptoeconomic finality from accumulated Tower BFT
      lockouts takes about 12.8 seconds on mainnet. Bridges and exchanges pick their own
      level, and bridges usually wait for full finality.
  - question: Does having no mempool mean no MEV?
    answer: >-
      No. The ordering power moved to the leader, who can reorder inside their window or
      accept private bundles for tips.
---

> Every design choice behind Solana came with a cost. You've seen the wins throughout the track: 400ms slots, parallel execution, low fees, high throughput.

## Throughput in exchange for validator hardware

Solana's target throughput is orders of magnitude above what Bitcoin or Ethereum mainnet handles. The actual sustained throughput today on mainnet is around 1,000-3,000 transactions per second in real workloads, with theoretical peaks much higher. That's possible because validators run on hardware that's far more demanding than what Bitcoin or Ethereum require.

A Solana validator needs a 12+ core CPU, 256GB+ of RAM, multiple NVMe SSDs in RAID, and a 1 Gbps symmetric network connection at minimum, with monthly costs in the four-figure range. Running a Bitcoin or Ethereum full node, by contrast, can be done on a Raspberry Pi.

Higher hardware requirements mean fewer people can afford to run validators independently, and fewer independent validators means more centralization pressure. The number of distinct Solana validators is in the low thousands, compared to tens of thousands for Ethereum and well over ten thousand for Bitcoin. Solana's defense is that stake distribution matters more than raw node count, but Solana still sacrificed some decentralization headroom to get its throughput.

The other defense is a bet that the cost of validator hardware will fall faster than Solana's requirements rise. Network bandwidth keeps growing, and storage keeps getting cheaper and faster, so the requirements that look high in 2026 might look modest in 2030.

## Parallel execution in exchange for flexibility and composability

Every transaction on Solana declares, in advance, every account it will read or write. This lets the runtime schedule non-conflicting transactions across multiple cores, as [Why Solana was built differently](/courses/development-on-solana/the-solana-mental-model/why-solana-built-differently) showed. The runtime can execute a SOL transfer between two wallets and a token swap between two other wallets at the same time, on different cores. Every Ethereum transaction runs sequentially on a single execution thread, regardless of how unrelated the transactions are. As CPU core counts have grown, Solana's design captures that growth and Ethereum's doesn't.

The first cost is flexibility inside a program. Walking a linked list whose shape you don't know in advance, dynamic dispatch to programs based on runtime data, and iterating over collections of unknown size are all awkward. Patterns that are routine in EVM programming require workarounds in Solana programming.

The second cost is composability. Ethereum's `CALL` opcode lets any contract call any other contract with arbitrary data, so a contract can interact with three protocols its author has never heard of, and a flash loan that touches twelve different contracts in one transaction is routine. Solana's CPI is more constrained. Cross-program calls require declaring the callee's accounts in the outer transaction, as [composing programs in practice](/courses/development-on-solana/working-with-other-programs/composing-programs-in-practice) showed, and the 1,232-byte transaction size limit caps how many accounts can appear, even with address lookup tables raising the practical ceiling. Deep recursive composition exists but is rarer than on Ethereum, and the cost in compute units scales faster than the call depth would suggest. A model where transactions could touch arbitrary accounts at runtime would defeat the static-scheduling premise.

Whether this trade is worth it depends on the application. For DeFi-style applications with predictable access patterns, it's a clear win. For applications that need dynamic data structures and runtime program discovery, it's a tax. Most of what's deployed falls in the first category, and Solana has rich composability in practice. An aggregator like Jupiter routes one swap through three or four DEXes in a single transaction, as [composing programs in practice](/courses/development-on-solana/working-with-other-programs/composing-programs-in-practice) showed. Lending protocols compose with DEXes. The cost is felt more by developers reaching for patterns they're used to from EVM than by end users.

## 400ms slots in exchange for tighter compute budgets

The leader has to finish executing a block inside one 400ms slot, so compute units are tightly capped. The cost is felt every time you hit the 200,000 compute unit default per instruction, or have to request the maximum 1.4 million CU for a complex transaction.

This forces design patterns that aren't necessary on slower chains. [Off-chain computation with on-chain verification](/courses/development-on-solana/production-state-design/off-chain-computation-on-chain-verification) becomes essential rather than optional. Heavy computation has to be split across multiple instructions in multiple transactions. Loops over data structures have to be bounded tighter than they would be on Ethereum. State machines that fit naturally in a single EVM call sometimes need multiple Solana instructions chained together.

The win is that user-perceived latency on Solana is measured in seconds rather than minutes. A swap on a Solana DEX confirms before the user has finished moving their mouse, and the same swap on Ethereum mainnet involves a noticeable wait. For consumer-facing applications this difference is large. For protocols that don't need real-time responsiveness, the trade matters less.

## No mempool in exchange for leader-controlled MEV

Solana has no public mempool, as the [architecture lesson](/courses/development-on-solana/architecture-details/detailed-solana-architecture) explained, so there's no public queue of pending transactions to front-run. That eliminated an entire class of MEV that plagues Ethereum: the sandwich attack, in which someone watching the public pool surrounds a user's trade with their own orders, a buy right before it and a sell right after it.

The cost is that MEV moved to the leader. Transaction ordering is the exclusive privilege of whoever is leader, and a leader running MEV-aware software like Jito's client can accept private bundles from searchers (bots that identify and exploit profitable transaction orderings) in exchange for tips and reorder transactions within their window to extract value. The [Jito lesson](/courses/development-on-solana/architecture-details/jito-mev-bundles) covers how that market works.

The net effect is that Solana's MEV is more concentrated in leaders' hands and less visible to public observers. The Ethereum MEV ecosystem is more competitive, with hundreds of searchers competing in the public mempool for every opportunity. The Solana model is less wasteful in terms of failed transactions and gas spent on losing bids, but the value extracted accrues more narrowly.

A user-facing consequence: the median Solana transaction is cheaper than a comparable Ethereum transaction because failed-tx waste is lower. A user-facing cost: when MEV does affect a Solana user, the tools for detecting and mitigating it are less mature than those available on Ethereum.

## Speed of consensus in exchange for finality complexity

Bitcoin's finality story is simple: wait for six confirmations and consider the transaction final. Ethereum after the Merge has a clear finality moment, when a checkpoint two epochs back gets cryptoeconomically locked in.

Solana's finality is harder to describe in one sentence. There's optimistic confirmation, meaning a slot has been voted on by enough validators that reverting is unlikely. There's rooted, meaning the slot has been further confirmed. There's full finality, which requires accumulated lockouts across many votes. For practical purposes, most applications consider a block confirmed when it's been voted on by a supermajority of stake, which usually happens within a few seconds. Full cryptoeconomic finality takes 12.8 seconds or so on mainnet today.

The Tower BFT lockout mechanic, which is what makes Solana's consensus fast enough to keep up with 400ms slots, also makes finality probabilistic in a way that's harder to reason about than Ethereum's discrete finality moments. Every level of confirmation gives you exponentially more security.

So the cost falls on the application, which has to choose a level for each use. In client code this is the commitment level from the [client-side lesson](/courses/development-on-solana/writing-your-first-program/client-side): `confirmed` means a supermajority of stake has voted on the block, the point most applications act on, and `finalized` is the 12.8-second level. Which one you need depends on what happens if the block is reverted after you acted, as the [architecture lesson](/courses/development-on-solana/architecture-details/detailed-solana-architecture) put it. Bridges to Solana have to decide what level of confirmation they accept before crediting funds on the other side, and they typically wait for full finality to be safe. Exchanges set their own thresholds. The win is that "good enough" confirmation happens fast enough to feel instant.

## Which of these costs your protocol pays

Every chain that exists made similar trades. Bitcoin chose maximum decentralization at the cost of throughput. Ethereum chose composability and a richer programming model at the cost of execution parallelism. Solana chose throughput and low latency at the cost of validator hardware requirements, programmer flexibility, and finality simplicity.

For your own protocol, go through the trades above. Does it need accounts that cannot be listed before the transaction runs? Does any instruction not fit the compute budget? Does an outcome depend on the order the leader chooses? Does anything act on a transaction before it is final?
