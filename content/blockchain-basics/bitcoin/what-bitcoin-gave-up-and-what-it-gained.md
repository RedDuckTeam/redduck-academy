---
id: 91
title: What Bitcoin gave up and what it gained
type: lecture
order: 7
faq:
  - question: How many transactions per second does Bitcoin handle?
    answer: >-
      Roughly seven on the base layer, capped by the ten-minute block time and a
      conservative block size. Lightning and other Layer 2 systems carry more volume and
      settle back to Bitcoin periodically.
  - question: Why can't you build a lending market or an exchange on Bitcoin?
    answer: >-
      Script has no loops, no recursion, no persistent state, and no general computation. It
      expresses conditions for spending a coin and nothing more. There is no contract that
      holds its own balance and code, so those applications live on chains with a different
      state model.
  - question: Is Bitcoin private?
    answer: >-
      No. Every transaction is permanently public. CoinJoin, Lightning, and fresh addresses
      help, but the base layer hides nothing.
  - question: What did Bitcoin get in return for all those limits?
    answer: >-
      Continuous operation since January 2009 with no successful attack on its consensus
      layer. A supply schedule of 50 BTC halving every 210,000 blocks toward a 21 million
      cap, enforced by every node and beyond anyone's vote. A full node small enough for
      consumer hardware. And participation open to anyone, with no allowlist and no identity
      check at the protocol level.
  - question: What should I compare when a new chain claims to beat Bitcoin?
    answer: >-
      Five axes. Throughput against decentralisation, expressiveness against validation
      simplicity, feature velocity against predictability, the issuance schedule, and the
      consensus mechanism. Bitcoin sits at one specific point on each. For any other chain,
      ask where it lands and what it accepted losing to get there.
---

Every design choice is a trade. Bitcoin made specific choices about what to optimise for, and those choices closed certain doors permanently while opening others.

## Small blocks trade throughput for a node anyone can run

A Bitcoin block arrives every ten minutes, which is 600 seconds, and has room for a few thousand transactions. That gives about seven transactions per second on the base layer. A credit card network handles tens of thousands. Faster throughput on Bitcoin happens off the base layer, via Layer 2 systems like Lightning that settle to Bitcoin periodically rather than living on it.

The 10-minute block time and the conservative block size limit are deliberate. Every full node has to download, check and store every block. Bigger or more frequent blocks need more bandwidth and disk, so a node costs more to run and fewer people run one. The [trilemma lesson](/courses/blockchain-basics/beyond-bitcoin/the-blockchain-trilemma) goes through this in more detail. With small blocks, a full Bitcoin node can be run by one person on consumer hardware.

Solana chose the other way. It handles 1,000 to 3,000 transactions per second, and its validators need at least 256 GB of RAM and a 1 Gbps connection, with monthly costs in the four-figure range. Solana has validators in the low thousands, against well over ten thousand nodes for Bitcoin, as [What Solana traded for what](/courses/development-on-solana/architecture-details/what-solana-traded-for-what) explains.

## A limited Script trades applications for simple validation

Script, the language a coin's spending condition is written in, is intentionally limited. There are no loops, no recursion, no persistent state, no general computation. You can write conditions for spending coins and nothing else. There's no concept of a contract that has its own balance and code that other transactions can call, so you can't build a lending market or an automated exchange on Bitcoin.

In return, every node can run every script cheaply and reach the same answer, which is the public verifiability requirement from the [design philosophy lesson](/courses/blockchain-basics/bitcoin/the-bitcoin-design-philosophy). The whole protocol is small enough for one developer to understand fully, and every additional complexity is somewhere a bug can hide.

Ethereum chose the other way. It was designed in 2013 to run arbitrary programs, because Bitcoin's scripting language could not express the applications people wanted to build on it. Richer programs come with more attack surface. In 2016 a bug in one of them, a contract called The DAO, let an attacker move about 3.6 million of Ethereum's coin, ETH, out of it. [Where Ethereum came from](/courses/development-on-ethereum/welcome-to-ethereum/where-ethereum-came-from) tells that story.

## Slow upgrades trade new features for predictability

No central party can update Bitcoin's rules, and the people who run nodes adopt changes slowly. Taproot took roughly four years from proposal to activation, as the [previous lesson](/courses/blockchain-basics/bitcoin/bitcoin-specific-forks) showed. Other chains release comparable features in months. The cost is that ideas which could improve the system either wait years to be released or end up released on other chains first.

Bitcoin's deliberate slowness around upgrades is the source of the predictability that makes long-term contracts and trust possible on the chain. If the rules could change rapidly, the asset's reliability as a store of value would erode along with the rules.

The DAO story shows the other side here too. Ethereum's community changed the rules within weeks to reverse the attacker's transactions and return the ETH. The price was a permanent split into two chains, Ethereum and Ethereum Classic, and the knowledge that the community can step in and change an outcome on the chain.

## A fixed supply trades a lasting miner subsidy for a policy nobody can change

The supply schedule (50 BTC subsidy halving every 210,000 blocks, capped at 21 million) is enforced by every node and effectively impossible to change. No one can vote to issue more. A monetary asset whose supply policy is fixed and verifiable is a rare thing.

The cost is that the subsidy cannot keep paying miners. The block reward is what pays them to protect the chain, and its subsidy part halves every four years, so fees have to cover a growing part of it, as the [economics lesson](/courses/blockchain-basics/bitcoin/the-economics-of-proof-of-work) showed. Other chains have continuous low inflation, deflationary mechanisms, or dynamic issuance keyed to network activity. Each model implies different assumptions about who should be compensated for securing the chain and how.

## A public ledger trades privacy for verification by anyone

Every Bitcoin transaction is permanently visible to anyone with internet access. With no operator to vouch for transactions, every node has to verify every transaction itself, and it can only verify what it can read. So anyone can trace any coin back through its whole history, and nobody has privacy by default. Tools and patterns (CoinJoin, Lightning, fresh addresses) can improve privacy, but the base layer is public. Some chains made privacy a first-class design goal, and Bitcoin did not.

## Proof of work trades energy for entry without identity

Bitcoin chose proof of work and bought security through energy expenditure. Miners spend on hardware and electricity roughly what the block reward pays them, for every block, whether or not anyone attacks. In return, the network needs no list of participants. Anyone can run a node, mine a block, send a transaction, receive a payment, all without asking anyone's permission, anywhere on the planet, at any time. There is no allowlist and no identity check at the protocol level. Bitcoin has run this way continuously since January 2009 without a successful attack on its consensus layer.

Proof-of-stake chains buy similar properties through bonded capital. Ethereum switched to proof of stake in September 2022. Its validators lock up 32 ETH each in place of spending electricity, and the network's electricity use fell by about 99.95%. The price is more moving parts, and many validators are run by staking services, exchanges, or pools, so what matters is how much stake the largest operators hold. [Consensus on Ethereum](/courses/development-on-ethereum/how-ethereum-works/consensus-on-ethereum) covers this.

## Ask the same questions of any chain

<svg role="img" viewBox="0 0 720 405" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Bitcoin's trade-off: what it gave up vs. what it gained</title><desc>A two-column chart titled "The trade in one picture." The left column, Gave up, lists throughput, expressiveness, feature velocity, stateful applications, and privacy by default, each with a short note explaining the limit. The right column, Gained, lists deepest security record, credible monetary policy, operational simplicity, predictability, and permissionless participation, each with a short note explaining the benefit.</desc>
  <text x="360" y="25" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">The trade in one picture</text>

<rect x="40" y="60" width="320" height="305" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="200" y="90" text-anchor="middle" font-size="13" fill="#ed4937" font-weight="bold">Gave up</text>
  <line x1="50" y1="100" x2="350" y2="100" stroke="#565653" stroke-width="1"/>

<text x="55" y="130" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Throughput</text>
  <text x="55" y="148" font-family="monospace" font-size="10" fill="#565653">~7 base-layer transactions per second</text>

<text x="55" y="180" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Expressiveness</text>
  <text x="55" y="198" font-family="monospace" font-size="10" fill="#565653">no general-purpose programmability</text>

<text x="55" y="230" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Feature velocity</text>
  <text x="55" y="248" font-family="monospace" font-size="10" fill="#565653">years between major upgrades</text>

<text x="55" y="280" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Stateful applications</text>
  <text x="55" y="298" font-family="monospace" font-size="10" fill="#565653">no contracts that hold balances or run code</text>

<text x="55" y="325" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Privacy by default</text>
  <text x="55" y="343" font-family="monospace" font-size="10" fill="#565653">every transaction is public</text>

<rect x="380" y="60" width="320" height="305" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="90" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Gained</text>
  <line x1="390" y1="100" x2="690" y2="100" stroke="#565653" stroke-width="1"/>

<text x="395" y="130" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Deepest security record</text>
  <text x="395" y="148" font-family="monospace" font-size="10" fill="#565653">15+ years of continuous operation</text>

<text x="395" y="180" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Credible monetary policy</text>
  <text x="395" y="198" font-family="monospace" font-size="10" fill="#565653">21M cap, enforced structurally</text>

<text x="395" y="230" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Operational simplicity</text>
  <text x="395" y="248" font-family="monospace" font-size="10" fill="#565653">runs on consumer hardware, auditable</text>

<text x="395" y="280" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Predictability</text>
  <text x="395" y="298" font-family="monospace" font-size="10" fill="#565653">rules are slow to change and well understood</text>

<text x="395" y="325" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Permissionless participation</text>
  <text x="395" y="343" font-family="monospace" font-size="10" fill="#565653">anyone can run a node, mine, or transact</text>
</svg>

The two columns are connected. You cannot keep the strengths while discarding the limitations, because each strength comes from the same choice as one of the limitations.

Bitcoin sits at one specific point in a design space with several axes, and each trade above is one axis. Other chains sit at different points. These axes are the framework you'll take with you into the rest of the course. When you meet a new chain later, ask: where does it sit on each of these? What did it gain by choosing as it did? What did it accept losing?
