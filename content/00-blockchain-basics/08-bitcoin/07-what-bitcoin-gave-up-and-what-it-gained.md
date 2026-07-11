---
id: 91
title: What Bitcoin gave up and what it gained
type: lecture
faq:
  - question: Why can't you build a lending market or exchange directly on Bitcoin?
    answer: Bitcoin's scripting language, Script, is intentionally limited with no
      loops, no recursion, no persistent state, and no general computation. You
      can write conditions for spending coins, but not the kind of programs most
      developers think of, so lending markets, automated exchanges, and complex
      multi-party agreements cannot be built on Bitcoin's base layer. Those
      applications live on smart-contract chains with a different state model.
  - question: If Bitcoin gave up so much, what did it actually gain in return?
    answer: It gained the deepest security record of any blockchain, having run
      since 2009 without a successful attack on its consensus layer, plus a
      credibly neutral and fixed monetary policy that no one can vote to
      inflate. It also gained operational simplicity, since a full node runs on
      consumer hardware, and permissionless participation, meaning anyone can
      run a node, mine, or transact without asking permission. Its slow,
      conservative upgrade process is the source of that predictability.
  - question: How can I quickly compare any new blockchain against Bitcoin?
    answer: "Read the chain as a set of explicit choices along a few axes:
      throughput versus decentralization, expressiveness versus validation
      simplicity, feature velocity versus predictability, its issuance schedule,
      and its consensus mechanism. Bitcoin sits at one specific point, favoring
      security and decentralization at the cost of throughput and
      expressiveness. For any new chain, ask where it lands on each axis, what
      it gained by choosing that way, and what it accepted losing."
---

Every design choice is a trade. Bitcoin made specific choices about what to optimise for, and those choices closed certain doors permanently while opening others. To finish this module honestly, we need to name both halves of the trade. What did Bitcoin sacrifice to become what it is? What did it get in return? And what does the rest of the blockchain world look like when you sit at a different point in the same design space? This lesson is the synthesis. By the end you'll have a working framework for thinking about any chain you meet later in the course, including the ones that chose almost the opposite of what Bitcoin chose.

## What Bitcoin gave up

The honest list is short and consequential.

**Throughput.** Bitcoin handles roughly seven transactions per second on the base layer. A small bank handles thousands. A credit card network handles tens of thousands. The 10-minute block time and the conservative block size limit are deliberate, but they cap how much business the base layer can do. Bitcoin is slow on purpose, and it will stay slow on purpose. Faster throughput on Bitcoin happens off the base layer, via Layer 2 systems like Lightning that settle to Bitcoin periodically rather than living on it.

**Expressiveness.** Script is intentionally limited. There are no loops, no recursion, no persistent state, no general computation. The kinds of applications most developers think of as "programming" cannot be written in Script. You can't build a lending market, an automated exchange, or a complex multi-party agreement in Bitcoin Script. You can write conditions for spending coins. That's it.

**Feature velocity.** Bitcoin upgrades on a four-year cadence at best. The discussion that produced Taproot started in 2018, and the upgrade activated in late 2021. Other chains release comparable features in months. Bitcoin's slowness is the source of its stability, but the cost is that ideas which could improve the system either wait years to be released or end up released on other chains first.

**Programmability of state.** Bitcoin tracks coins, not arbitrary state. There's no concept of a contract that has its own balance and code that other transactions can call. The decentralised-finance applications already mentioned above exist on chains with a different state model, because Bitcoin's design intentionally rules out contracts that hold their own state.

**Privacy by default.** Every Bitcoin transaction is permanently visible to anyone with internet access. Tools and patterns (CoinJoin, Lightning, fresh addresses) can improve privacy, but the base layer is public. Some chains made privacy a first-class design goal. Bitcoin did not.

None of these are accidents. Each one is the direct consequence of a design choice from earlier in this module. Throughput is bounded by the conservative block time. Expressiveness is bounded by Script's deliberate limits. Feature velocity is bounded by Bitcoin's social conservatism around upgrades. And so on. To get the things Bitcoin lacks, you have to make different choices than the ones Bitcoin made.

## What Bitcoin gained

The other half of the trade.

**The deepest security record of any blockchain.** Bitcoin has run continuously since January 2009 without a successful attack on its consensus layer. The hash-linked chain has not been rewritten. The 21-million cap has not been violated. The signature scheme has not been broken. No other chain has anything close to that record, because no other chain has been around as long under that much economic pressure. Security is partly a measurement that only time can produce, and Bitcoin has the most of it.

**Credible neutrality of monetary policy.** The supply schedule (50 BTC subsidy halving every 210,000 blocks, asymptotically capping at 21 million) is enforced by every node and effectively impossible to change. No one can vote to issue more. No central party can decide to inflate. Whether or not the specific schedule is the right one is a separate debate. What is not debatable is that the schedule will continue to do exactly what it says. A monetary asset whose supply policy is fixed and verifiable is a rare thing.

**Operational simplicity.** A full Bitcoin node can be run by one person on consumer hardware. The whole protocol is small enough for one developer to understand fully. The validation rules are stable. The data structures are simple. This matters more than it sounds, because every additional complexity is somewhere a bug can hide. Bitcoin's narrow design surface is what makes it auditable by a global community of developers, and it's what makes node operation accessible to ordinary users.

**Conservatism as a feature.** A protocol that's hard to change is a protocol that's hard to break. Bitcoin's deliberate slowness around upgrades is the source of the predictability that makes long-term contracts and trust possible on the chain. If the rules could change rapidly, the asset's reliability as a store of value would erode along with the rules.

**Permissionless participation.** Anyone can run a node, mine a block, send a transaction, receive a payment, all without asking anyone's permission, anywhere on the planet, at any time. There's no KYC at the protocol level. There's no allowlist. The system runs on the same terms for everyone. This property has been preserved through more than fifteen years of regulatory pressure, technical change, and contentious internal debate. That preservation is itself evidence of how seriously the community treats it.

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

The two columns are connected. Bitcoin couldn't have the security record without the conservatism. Couldn't have the operational simplicity without the limited Script. Couldn't have the credible monetary policy without the unchangeable supply schedule. You cannot keep the strengths while discarding the limitations. The strengths and the limitations are different views of the same set of choices.

## The design space

Bitcoin sits at one specific point in a design space with several axes. Other chains sit at different points. Once you've internalised this, you can read any blockchain's design as a series of explicit choices about where on each axis to land.

**Throughput vs decentralisation.** The 10-minute block time and small blocks keep Bitcoin verifiable by ordinary hardware. Chains that increased block sizes or reduced block times to handle more transactions usually had to accept that fewer participants could run full nodes. Throughput and decentralisation pull in opposite directions, and every chain picks a point on this axis.

**Expressiveness vs validation simplicity.** Bitcoin Script is intentionally weak. Chains with Turing-complete smart-contract languages can express richer programs but at the cost of more complex validation rules, more attack surface, and more cases where the protocol's behaviour is hard to reason about. The two values trade off.

**Feature velocity vs predictability.** Bitcoin moves slowly and changes very little. Other chains release new features regularly and accept that their rules will evolve. Both approaches are defensible. They optimise for different users.

**Issuance schedule.** Bitcoin's fixed supply is a choice, not a law of nature. Other chains have continuous low inflation, deflationary mechanisms, dynamic issuance keyed to network activity, or no native token at all. Each model implies different assumptions about who should be compensated for securing the chain and how.

**Consensus mechanism.** Bitcoin chose proof of work and bought security through energy expenditure. Proof-of-stake chains buy similar properties (often less of them, often more efficiently) through bonded capital. The argument over which mechanism is "better" is really an argument about which costs and risks you'd rather pay.

These axes are the framework you'll take with you into the rest of the course. When you meet a new chain in a later module, ask: where does it sit on each of these? What did it gain by choosing as it did? What did it accept losing?

## Why Bitcoin still matters

Even after the rest of the blockchain world built things Bitcoin can't do, Bitcoin remains the largest, most valuable, most decentralised, and most thoroughly tested blockchain in existence. Its market capitalisation has been larger than the next chain by a wide margin for almost its entire history. Its hashrate is orders of magnitude larger than any competing proof-of-work chain. Its node count is the highest. Its developer community is the most distributed.

These facts aren't decorative. They're evidence that Bitcoin's specific set of choices has produced something genuinely valuable in the world, even as other chains have produced different valuable things by making different choices. A complete blockchain education starts here because Bitcoin is the first chain to have worked, and it's the chain every other chain measures itself against. Every later track in this course assumes you've done this one first.
