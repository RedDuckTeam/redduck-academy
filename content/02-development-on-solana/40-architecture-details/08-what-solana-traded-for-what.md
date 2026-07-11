---
id: 220
title: What Solana traded for what
type: lecture
faq:
  - question: Why is running a Solana validator so much more expensive than a
      Bitcoin node?
    answer: "Solana targets far higher throughput, and that speed requires demanding
      hardware: at minimum a 12+ core CPU, 256GB+ of RAM, multiple NVMe SSDs in
      RAID, and a 1 Gbps symmetric connection, with monthly costs in the
      four-figure range. A Bitcoin or Ethereum full node, by contrast, can run
      on a Raspberry Pi. The cost of Solana's choice is that fewer people can
      afford to run validators independently, creating more centralization
      pressure; the bet is that hardware keeps getting cheaper and faster, so
      today's high requirements will look modest later."
  - question: Why is Solana programming harder than Ethereum for dynamic data structures?
    answer: Every Solana transaction must declare in advance every account it will
      read or write, which is exactly what lets the runtime run non-conflicting
      transactions in parallel across CPU cores. The cost is that patterns
      needing data discovered at runtime, such as walking a linked list of
      unknown shape, dispatching to a program chosen at runtime, or iterating a
      collection of unknown size, are awkward and often need workarounds. In
      short, Solana trades some programmer flexibility for execution
      parallelism, which is a clear win for predictable DeFi-style access
      patterns and a tax on more dynamic ones.
  - question: Why does Solana cap compute so tightly compared to Ethereum's gas?
    answer: Solana chose 400ms slots, and you cannot have both very fast slots and
      generous compute budgets, so the leader must finish executing within the
      slot. That gives a 200,000 compute-unit default per instruction and a 1.4
      million maximum, more than an order of magnitude tighter than Ethereum's
      roughly 30 million gas per block. This forces patterns like off-chain
      compute with on-chain verification and splitting heavy work across
      multiple instructions and transactions. The payoff is user-perceived
      latency measured in seconds rather than minutes.
  - question: Is a Solana transaction final instantly?
    answer: No. "Good enough" confirmation is fast, but true finality is layered and
      harder to describe than Bitcoin's or Ethereum's. Most applications treat a
      block as confirmed once a supermajority of stake has voted on it, which
      usually happens within a few seconds, but full cryptoeconomic finality
      (from accumulated Tower BFT lockouts) takes around 12.8 seconds on
      mainnet. Because each level of confirmation just adds exponentially more
      security with no single clear threshold, bridges and exchanges pick their
      own confirmation levels, and bridges typically wait for full finality
      before crediting funds.
---

> Every design choice in this module came with a cost. You've seen the wins throughout the track: 400ms slots, parallel execution, low fees, throughput that no other L1 has matched. This lecture is the honest accounting of what was given up to get those wins. Every design decision in distributed systems has a cost. Solana made specific trades, and understanding them is what separates a developer who can reason about chains from one who just picks whichever chain is currently popular.

## Throughput in exchange for validator hardware

The biggest single trade. Solana's target throughput is orders of magnitude above what Bitcoin or Ethereum mainnet handles. The actual sustained throughput today on mainnet is around 1,000-3,000 transactions per second in real workloads, with theoretical peaks much higher. That's possible because validators run on hardware that's far more demanding than what Bitcoin or Ethereum require.

A Solana validator needs a 12+ core CPU, 256GB+ of RAM, multiple NVMe SSDs in RAID, and a 1 Gbps symmetric network connection at minimum. Recommended specs are higher. Running a Solana validator is comparable to running a small data-center node, with monthly costs in the four-figure range. Running a Bitcoin or Ethereum full node, by contrast, can be done on a Raspberry Pi.

This is a real cost. Higher hardware requirements mean fewer people can afford to run validators independently. Fewer independent validators means more centralization pressure. The number of distinct Solana validators is in the low thousands, compared to tens of thousands for Ethereum and well over ten thousand for Bitcoin. Solana's defense is that stake distribution matters more than raw node count, but the comparison is honest: Solana sacrificed some decentralization headroom to get its throughput.

The defense is also that the hardware curve runs in Solana's favor over time. Network bandwidth keeps growing. Storage keeps getting cheaper and faster. The requirements that look high in 2026 might look modest in 2030. Bitcoin and Ethereum's lower requirements are partly an explicit design choice and partly a freeze from an earlier era. Solana bet that the long-term cost of validator hardware will fall faster than its requirements rise.

## Parallel execution in exchange for static account declaration

The defining programming-model trade. Every transaction on Solana declares, in advance, every account it will read or write. This is what lets the runtime schedule non-conflicting transactions across multiple cores. It's also what drove the entire mental model you spent module 2 internalizing.

The cost is real. Walking a linked list whose shape you don't know in advance is awkward. Dynamic dispatch to programs based on runtime data is awkward. Iterating over collections of unknown size is awkward. Patterns that are routine in EVM programming feel awkward or require workarounds in Solana programming.

The win is also real. The runtime can execute a SOL transfer between two wallets and a token swap between two other wallets at literally the same time, on different cores. Ethereum cannot do this. Every Ethereum transaction runs sequentially on a single execution thread, regardless of how unrelated the transactions are. As CPU core counts have grown, Solana's design captures that growth and Ethereum's doesn't.

The trade is essentially: programmer flexibility for execution parallelism. Solana chose to make some programming patterns harder in exchange for letting the chain scale with CPU cores. Whether this trade is "worth it" depends on your priorities. For DeFi-style applications with predictable access patterns, it's a clear win. For applications that need dynamic data structures and runtime program discovery, it's a tax. Most of what's actually deployed falls in the first category.

## 400ms slots in exchange for tighter compute budgets

You can have fast slots. You can have generous compute budgets. You cannot have both indefinitely. Solana chose fast slots.

The cost is felt every time you hit the 200,000 compute unit default per instruction, or have to request the maximum 1.4 million CU for a complex transaction. Ethereum gives a single transaction up to 30 million gas in a block, and a single contract call can use most of that. Solana's per-instruction cap is more than an order of magnitude tighter.

This forces design patterns that aren't necessary on slower chains. Off-chain compute with on-chain verification, which the course covered earlier, becomes essential rather than optional. Heavy computation has to be split across multiple instructions in multiple transactions. Loops over data structures have to be bounded tighter than they would be on Ethereum. State machines that fit naturally in a single EVM call sometimes need multiple Solana instructions chained together.

The win, of course, is that user-perceived latency on Solana is measured in seconds rather than minutes. A swap on a Solana DEX confirms before the user has finished moving their mouse. The same swap on Ethereum mainnet involves a noticeable wait. For consumer-facing applications, this difference is enormous. For protocols that don't need real-time responsiveness, the trade matters less.

## No mempool in exchange for leader-controlled MEV

Solana's lack of a public mempool eliminated an entire class of MEV that plagues Ethereum: the sandwich attack mounted by anyone watching the public pool. Front-running on Solana doesn't work the same way because there's no public queue of pending transactions to front-run.

The cost is that MEV didn't disappear. It moved. Without a public mempool, transaction ordering becomes the exclusive privilege of whoever is leader. A leader running standard validator software accepts transactions roughly in order of priority fee per CU. A leader running MEV-aware software like Jito's client can accept private bundles from searchers in exchange for tips, and can reorder transactions within their window to extract value.

The net effect is that Solana's MEV is more concentrated in leaders' hands and less visible to public observers. Whether this is better or worse than Ethereum's model is a genuine debate. The Ethereum MEV ecosystem is more competitive, with hundreds of searchers competing in the public mempool for every opportunity. The Solana model is less wasteful in terms of failed transactions and gas spent on losing bids, but the value extracted accrues more narrowly.

A user-facing consequence: the median Solana transaction is cheaper than a comparable Ethereum transaction precisely because failed-tx waste is lower. A user-facing cost: when MEV does affect a Solana user, the tools for detecting and mitigating it are less mature than those available on Ethereum.

## A single execution model in exchange for less composability

Ethereum's `CALL` opcode lets any contract call any other contract with arbitrary data. The composability is total. Build a contract that interacts with three protocols you've never heard of? Possible. Build a flash loan that touches twelve different contracts in one transaction? Routine.

Solana's CPI is more constrained. Cross-program calls require declaring the callee's accounts in the outer transaction. The 1,232-byte transaction size limit caps how many accounts can appear, even with address lookup tables raising the practical ceiling. Deep recursive composition exists but is rarer than on Ethereum, and the gas-equivalent cost in compute units scales faster than the call depth would suggest.

The trade is composability versus parallelism. Ethereum's any-call-any model is what makes its DeFi ecosystem so deeply interconnected, with positions across many protocols being usable in single transactions. Solana's account-list model puts a brake on this, which limits some patterns but makes the parallel execution scheduler's job possible. A model where transactions could touch arbitrary accounts at runtime would defeat the entire static-scheduling premise.

Solana has rich composability in practice. Jupiter routes through hundreds of pools in a single transaction. Lending protocols compose with DEXes. The cost is felt more by developers reaching for patterns they're used to from EVM than by end users.

## Speed of consensus in exchange for finality complexity

Bitcoin's finality story is simple: wait for six confirmations and consider the transaction final. Ethereum after the Merge has a clear finality moment, when a checkpoint two epochs back gets cryptoeconomically locked in.

Solana's finality is harder to describe in one sentence. There's optimistic confirmation, meaning a slot has been voted on by enough validators that reverting is unlikely. There's rooted, meaning the slot has been further confirmed. There's full finality, which requires accumulated lockouts across many votes. For practical purposes, most applications consider a block confirmed when it's been voted on by a supermajority of stake, which usually happens within a few seconds. Full cryptoeconomic finality takes 12.8 seconds or so on mainnet today.

The Tower BFT lockout mechanic, which is what makes Solana's consensus fast enough to keep up with 400ms slots, also makes finality probabilistic in a way that's harder to reason about than Ethereum's discrete finality moments. Every level of confirmation gives you exponentially more security, but there is no single clear threshold where a block becomes "finalized."

This shows up in user-facing applications. Bridges to Solana have to decide what level of confirmation they accept before crediting funds on the other side, and they typically wait for full finality to be safe. Exchanges set their own thresholds. The variability in finality semantics is a real cognitive cost. The win, of course, is that "good enough" confirmation happens fast enough to feel instant.

## What this all adds up to

Every chain that exists made similar trades. Bitcoin chose maximum decentralization at the cost of throughput. Ethereum chose composability and a richer programming model at the cost of execution parallelism. Solana chose throughput and low latency at the cost of validator hardware requirements, programmer flexibility, and finality simplicity.

None of these are wrong. They're answers to different optimization problems. Bitcoin is optimizing for a world where you want money that anyone with a Raspberry Pi can verify independently. Ethereum is optimizing for maximum composability and a permissionless application platform. Solana is optimizing for the user experience of an application running on a global computer: fast, cheap, and responsive.

When you read someone's "Solana vs Ethereum" opinion piece, the question to ask is which set of trade-offs the author is implicitly weighing. Most arguments are really arguments about which trades matter most for a specific use case. Once you internalize that, you stop having opinions about which chain is "better" in some absolute sense and start having useful opinions about which chain fits which problem.

You finished module 7. You finished the Solana track, at least the substantive part. What you built over these seven modules is the working knowledge of how a high-throughput chain actually works at every level, from the BPF runtime executing your code to the consensus mechanism that puts that code's outputs into the canonical chain history. That picture, more than any specific syntax or library, is what you take away.
