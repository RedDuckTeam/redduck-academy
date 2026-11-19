---
id: 93
title: The blockchain trilemma
type: lecture
order: 2
faq:
  - question: What is the blockchain trilemma?
    answer: >-
      A chain trades security, decentralization, and scalability against each other, and
      pushing one usually costs at least one of the others. Bigger blocks raise throughput and
      also raise the cost of running a node, which reduces the number of node operators.
  - question: What is the difference between Layer 1 and Layer 2 in blockchain?
    answer: >-
      An L1 runs by itself and secures itself. Bitcoin, Ethereum, and Solana are L1s. An L2
      sits on top of an L1, handles transactions separately, and periodically writes its state
      back down to inherit the L1's security. Lightning is Bitcoin's main L2.
  - question: What is the difference between optimistic rollups and ZK rollups?
    answer: >-
      How they prove a batch is correct. An optimistic rollup treats each batch as valid
      unless someone challenges it inside a window of about a week, so a withdrawal to L1
      takes that long to finalize. A ZK rollup posts a cryptographic proof that the L1
      verifies immediately, so withdrawals are fast and the system is harder to operate.
  - question: Does Layer 2 break the trilemma?
    answer: >-
      No. It lets each layer trade the three properties differently, with the most
      security-sensitive operations anchored to the slowest and most decentralized layer.
  - question: How do I tell whether a chain is really decentralized?
    answer: >-
      Ask whether a motivated hobbyist can run a full node on a laptop. If the hardware rules
      that out, the chain is at best partially decentralized.
---

> Every blockchain has to make a trade-off between three things it would ideally have all of: security, decentralization, and scalability. Improving any one of them tends to weaken at least one of the others.

## The three things every chain wants

**Security** is how expensive it is for an attacker to overturn confirmed transactions or trick the network into accepting invalid ones. A chain with strong security has a large pool of validators or miners with real economic stake, and rules conservative enough that attacks would cost more than they could plausibly earn. Bitcoin's security is the strongest of any chain by this measure.

**Decentralization** is how widely distributed the set of validating parties is. A decentralized chain has many independent nodes run by people in different jurisdictions, on hardware ordinary users can afford, with no single party able to influence the chain's behavior on their own. The classic test is: can a motivated hobbyist run a full node on a laptop? If yes, the chain is decentralized. If no, the chain is at best partially decentralized.

**Scalability** is how many transactions per second the chain can process while preserving the other two properties. A scalable chain can handle the throughput of a real consumer payment system without breaking. By 2025, the major credit card networks handle tens of thousands of transactions per second at peak. Most blockchains handle far fewer.

## Why you can't easily have all three

The trilemma is the empirical observation that improving any of these three tends to weaken at least one of the others. The reasons follow from the design choices each property requires.

**Wanting more scalability** typically means bigger blocks, faster block times, or both. But bigger blocks take more storage and bandwidth to relay. This raises the cost of running a node, which thins out the set of people willing to run one. Fewer node operators means weaker decentralization. Faster block times mean less time for blocks to propagate across a global network before the next block is produced, which increases the chance of accidental forks and makes consensus less reliable, which weakens security.

**Wanting more decentralization** means keeping hardware requirements low enough that ordinary people can participate. But low hardware requirements cap how much computation, storage, and bandwidth the network can collectively handle, which caps throughput. Decentralization and scalability pull against each other on the base layer.

**Wanting more security** means making a confirmed transaction more expensive to reverse. On a proof-of-work chain that cost grows with every block built on top of the transaction, so a safer payment is one that has waited longer, and six Bitcoin blocks take about an hour. On a proof-of-stake chain the cost is the stake that validators lock up, and the larger the required stake, the fewer people can afford to be validators. So more security is paid for in waiting time or in decentralization. That's the trade-off Bitcoin has been making for more than fifteen years.

These are observations about how the design choices tend to interact, not strict laws. A clever design might push the trade-off in one direction without hurting the others as much as the typical trade would, but no design has eliminated the trade-off entirely.

<svg role="img" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Blockchain trilemma triangle plotting Bitcoin, Ethereum, and Solana</title><desc>A triangle has Security, Decentralization, and Scalability at its three corners. Bitcoin is placed near security and decentralization with a slow base layer, Ethereum sits balanced on L1 and pushes scaling to L2, and Solana sits near scalability with high throughput but heavier hardware needs.</desc>
  <text x="360" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">The blockchain trilemma</text>

<polygon points="360,80 140,420 580,420" fill="none" stroke="#000000" stroke-width="2"/>

<text x="360" y="65" text-anchor="middle" font-size="13" fill="#ed4937" font-weight="bold">Security</text>
  <text x="100" y="435" text-anchor="middle" font-size="13" fill="#ed4937" font-weight="bold">Decentralization</text>
  <text x="620" y="435" text-anchor="middle" font-size="13" fill="#ed4937" font-weight="bold">Scalability</text>

<circle cx="290" cy="220" r="6" fill="#000000"/>
  <text x="305" y="217" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Bitcoin</text>
  <text x="305" y="232" font-family="monospace" font-size="9" fill="#565653">strong security and</text>
  <text x="305" y="244" font-family="monospace" font-size="9" fill="#565653">decentralization,</text>
  <text x="305" y="256" font-family="monospace" font-size="9" fill="#565653">slow base layer</text>

<circle cx="370" cy="290" r="6" fill="#000000"/>
  <text x="385" y="287" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Ethereum</text>
  <text x="385" y="302" font-family="monospace" font-size="9" fill="#565653">balanced on L1,</text>
  <text x="385" y="314" font-family="monospace" font-size="9" fill="#565653">pushes scaling to L2</text>

<circle cx="450" cy="370" r="6" fill="#000000"/>
  <text x="435" y="367" font-family="monospace" font-size="11" fill="#000000" font-weight="bold" text-anchor="end">Solana</text>
  <text x="435" y="382" font-family="monospace" font-size="9" fill="#565653" text-anchor="end">high throughput,</text>
  <text x="435" y="394" font-family="monospace" font-size="9" fill="#565653" text-anchor="end">heavier hardware</text>

<text x="360" y="465" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Closer to a corner means a chain prioritizes that property more.</text>
</svg>

The diagram is qualitative and has no scores. Bitcoin sits up near the security/decentralization edge. Its blocks are ten minutes apart, it handles about seven transactions per second, and a full node runs on consumer hardware. Solana sits closer to the scalability/security edge. It produces a block every 400 milliseconds and handles 1,000 to 3,000 transactions per second, and a validator needs at least 256 GB of RAM, which caps how many people can run one, as [What Solana traded for what](/courses/development-on-solana/architecture-details/what-solana-traded-for-what) explains. Ethereum sits between them, keeping its own throughput low so that a node stays cheap to run, and pushes the scaling work to a category of systems built on top of it, called Layer 2.

## Layer 2 as a way out

A **Layer 1** or **L1** is a base blockchain that runs by itself and doesn't depend on any other chain for security. Bitcoin, Ethereum and Solana are L1s. When you hear the phrase "base layer," it means the L1. A **Layer 2** or **L2** is a system built on top of an L1 that handles transactions separately but periodically writes its state back down to the L1, inheriting the L1's security in the process. An L2 is not a standalone chain, and it relies on an L1 as its foundation for security. Bitcoin has Lightning as its main L2, Ethereum has several, and Solana, designed for high base-layer throughput, has fewer. These are different layers from the numbered ones in [Where blockchain fits in web3](/courses/blockchain-basics/what-is-web3/where-blockchain-fits-in-web3), which counted the parts of the web3 stack.

The trilemma forces every L1 to compromise on one of the three properties, but not everything has to happen on the L1. The L1 is slow, expensive, and very secure. So use the L1 for what it's best at: providing strong final settlement that nobody can roll back. Above it, run a faster system that handles the actual transaction volume. That faster system regularly anchors its state back to the L1.

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Layer 2 on top of Layer 1, with periodic summaries settling to L1</title><desc>A top box labeled Layer 2 is fast, cheap, and handles everyday activity, sitting above a bottom box labeled Layer 1 that is slow, expensive, and provides final settlement. An arrow points down from Layer 2 to Layer 1, labeled periodic summaries written down to L1.</desc>
  <defs>
    <marker id="arr52" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<text x="360" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">How Layer 2 sits on top of Layer 1</text>

<rect x="40" y="60" width="640" height="90" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="90" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Layer 2</text>
  <text x="360" y="110" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">fast, cheap, lots of transactions</text>
  <text x="360" y="135" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">handles the everyday activity</text>

<line x1="360" y1="160" x2="360" y2="200" stroke="#565653" stroke-width="2" marker-end="url(#arr52)"/>
  <text x="370" y="183" font-family="monospace" font-size="10" fill="#565653" font-style="italic">periodic summaries written down to L1</text>

<rect x="40" y="210" width="640" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="240" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Layer 1</text>
  <text x="360" y="260" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">slow, expensive, very secure</text>
  <text x="360" y="285" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">provides final settlement</text>
</svg>

**Payment channels** are Bitcoin's primary L2 approach. Two parties open a "channel" by jointly locking up some bitcoin on the L1. Once the channel is open, they can exchange any number of transactions privately between themselves, with each transaction updating the balance inside the channel. None of these intermediate transactions touch the L1. When the parties are done, they close the channel by writing the final balance back to Bitcoin. The L1 sees two transactions, open and close, regardless of how many transactions happened inside. The Lightning Network is the largest deployed example of this pattern.

Ethereum and similar smart-contract chains use **rollups**, which execute many transactions off the L1, batch them together, and post the batch to the L1. An optimistic rollup treats a batch as valid unless someone challenges it within about a week, and a ZK rollup attaches a cryptographic proof that the L1 verifies immediately. The Ethereum track returns to the idea behind them, doing the computation off the chain and checking the result on it, in [off-chain computation, on-chain verification](/courses/development-on-ethereum/defi-tasks-and-patterns/off-chain-computation-on-chain-verification).

The second layer has its own price. In a channel the bitcoin stays locked until the channel is closed, and the payments in between are seen and checked only by the two parties. On an optimistic rollup a withdrawal back to the L1 takes the length of the challenge window to finalize. On a rollup, between two writes to the L1 the user also depends on the rollup itself, a separate system that can stop or fail.

So Layer 2 doesn't break the trade-off. It lets different layers in the stack make different bets, with the most security-sensitive operations anchored to the slowest and most decentralized layer.
