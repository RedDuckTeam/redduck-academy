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

## What Bitcoin gave up

**Throughput.** Bitcoin handles roughly seven transactions per second on the base layer. A small bank handles thousands; a credit card network handles tens of thousands. The 10-minute block time and the conservative block size limit are deliberate, but they cap how much business the base layer can do. Bitcoin is slow on purpose, and it will stay slow on purpose. Faster throughput on Bitcoin happens off the base layer, via Layer 2 systems like Lightning that settle to Bitcoin periodically rather than living on it.

**Expressiveness.** Script is intentionally limited. No loops, recursion, persistent state, or general computation. The kinds of applications most developers think of as "programming" cannot be written in Script. You can only write conditions for spending coins.

**Feature velocity.** Bitcoin upgrades on a four-year cadence at best. The discussion that produced Taproot started in 2018, and the upgrade activated in late 2021. Other chains release comparable features in months. Bitcoin's slowness is the source of its stability, but the cost is that ideas which could improve the system either wait years to be released or end up released on other chains first.

**Programmability of state.** Bitcoin tracks coins rather than arbitrary state. There's no concept of a contract that has its own balance and code that other transactions can call. The decentralised-finance applications already mentioned above exist on chains with a different state model, because Bitcoin's design intentionally rules out contracts that hold their own state.

**Privacy by default.** Every Bitcoin transaction is permanently visible to anyone with internet access. Tools and patterns (CoinJoin, Lightning, fresh addresses) can improve privacy, but the base layer is public. Some chains made privacy a first-class design goal; Bitcoin didn't.

Each one is the direct consequence of a design choice.

## What Bitcoin gained

**The deepest security record of any blockchain.** Bitcoin has run continuously since January 2009 without a successful attack on its consensus layer. No other chain has anything close to that record, because no other chain has been around as long under that much economic pressure. Security is partly a measurement that only time can produce, and Bitcoin has the most of it.

**Credible neutrality of monetary policy.** The supply schedule (50 BTC subsidy halving every 210,000 blocks, asymptotically capping at 21 million) is enforced by every node and effectively impossible to change. Whether or not the specific schedule is the right one is a separate debate. What is not debatable is that the schedule will continue to do exactly what it says. A monetary asset whose supply policy is fixed and verifiable is a rare thing.

**Operational simplicity.** A full Bitcoin node can be run by one person on consumer hardware. The whole protocol is small enough for one developer to understand. Bitcoin's narrow design surface is what makes it auditable by a global community of developers, and it's what makes node operation accessible to ordinary users.

**Conservatism as a feature.** A protocol that's hard to change is a protocol that's hard to break. Bitcoin's deliberate slowness around upgrades is the source of the predictability that makes long-term contracts and trust possible on the chain. If the rules could change rapidly, the asset's reliability as a store of value would erode along with the rules.

**Permissionless participation.** Anyone can run a node, mine a block, send a transaction, receive a payment, all without asking anyone's permission, anywhere on the planet, at any time. No KYC at the protocol level or an allowlist. The system runs on the same terms for everyone. This property has been preserved through more than fifteen years of regulatory pressure, technical change, and contentious internal debate. That preservation is itself evidence of how seriously the community treats it.

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

## The design space

Bitcoin sits in the design space with several axes:

**Throughput vs decentralisation.** The 10-minute block time and small blocks keep Bitcoin verifiable by ordinary hardware. Chains that increased block sizes or reduced block times to handle more transactions usually had to accept that fewer participants could run full nodes. Throughput and decentralisation pull in opposite directions, and every chain picks a point on this axis.

**Expressiveness vs validation simplicity.** Bitcoin Script is intentionally weak. Chains with Turing-complete smart-contract languages can express richer programs but at the cost of more complex validation rules, more attack surface, and more cases where the protocol's behaviour is hard to reason about. 

**Feature velocity vs predictability.** Bitcoin moves slowly and changes very little. Other chains release new features regularly and accept that their rules will evolve. Both approaches are defensible as they optimise for different users.

**Issuance schedule.** Bitcoin's fixed supply is a choice rather than a law of nature. Other chains have continuous low inflation, deflationary mechanisms, dynamic issuance keyed to network activity, or no native token at all. Each model implies different assumptions about who should be compensated for securing the chain and how.

**Consensus mechanism.** Bitcoin chose proof of work and bought security through energy expenditure. Proof-of-stake chains buy similar properties (often less of them, often more efficiently) through bonded capital. The argument over which mechanism is "better" is really an argument about which costs and risks you'd rather pay.
