# The blockchain trilemma

_type: lecture_

> Every blockchain has to make a trade-off between three things it would ideally have all of: security, decentralization, and scalability. Improving any one of them tends to weaken at least one of the others. This trade-off is so consistent across designs that it has a name: the blockchain trilemma. Once you have this framework, every chain you meet becomes a point in the same triangle. You can read its design choices as a specific bet about which two corners to prioritize. This lesson walks through the trilemma, places the major chains inside it, then looks at one of the ways modern designs try to escape it. That way out is called Layer 2.

## The three things every chain wants

Three properties matter for any blockchain. Briefly:

**Security** is how expensive it is for an attacker to overturn confirmed transactions or trick the network into accepting invalid ones. A chain with strong security has a long track record, a large pool of validators or miners with real economic stake, and rules conservative enough that attacks would cost more than they could plausibly earn. Bitcoin's security is the strongest of any chain by this measure.

**Decentralization** is how widely distributed the set of validating parties is. A decentralized chain has many independent nodes run by people in different jurisdictions, on hardware ordinary users can afford, with no single party able to influence the chain's behavior on their own. The classic test is: can a motivated hobbyist run a full node on a laptop? If yes, the chain is decentralized. If no, the chain is at best partially decentralized.

**Scalability** is how many transactions per second the chain can process while preserving the other two properties. A scalable chain can handle the throughput of a real consumer payment system without breaking. By 2025, the major credit card networks handle tens of thousands of transactions per second at peak. Most L1 blockchains handle far fewer.

## Why you can't easily have all three

The trilemma is the empirical observation that improving any of these three tends to weaken at least one of the others. The reasons aren't mysterious. They fall out of the design choices each property requires.

**Wanting more scalability** typically means bigger blocks, faster block times, or both. But bigger blocks take more storage and bandwidth to relay. This raises the cost of running a node, which thins out the set of people willing to run one. Fewer node operators means weaker decentralization. Faster block times mean less time for blocks to propagate across a global network before the next block is produced, which increases the chance of accidental forks and makes consensus less reliable, which weakens security.

**Wanting more decentralization** means keeping hardware requirements low enough that ordinary people can participate. But low hardware requirements cap how much computation, storage, and bandwidth the network can collectively handle, which caps throughput. Decentralization and scalability pull against each other on the base layer.

**Wanting more security** means long confirmation times, conservative upgrades, and heavy economic stake required to be a validator. All of those make the chain feel slow and inflexible. That's the trade-off Bitcoin has been making for more than fifteen years. Security comes from caution, and caution costs speed.

These aren't strict laws. They're observations about how the design choices tend to interact. A clever design might push the trade-off in one direction without hurting the others as much as the typical trade would, but no design has eliminated the trade-off entirely.

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

The diagram is qualitative. There are no scores. Bitcoin sits up near the security/decentralization edge because that's what its design optimizes for, with the well-known cost of base-layer throughput. Solana sits closer to the scalability/security edge, with higher hardware requirements that cap how many people can run a full node. Ethereum tries to balance all three on L1 by being conservative about base-layer throughput. It pushes the scaling work off the base layer entirely, to a category of systems called Layer 2.

Both terms come up in every discussion of blockchain scaling. A **Layer 1** or **L1** is a base blockchain that runs by itself and doesn't depend on any other chain for security. Bitcoin is an L1. Ethereum is an L1. Solana is an L1. When you hear the phrase "base layer," it means the L1. A **Layer 2** or **L2** is a system built on top of an L1 that handles transactions separately but periodically writes its state back down to the L1, inheriting the L1's security in the process. An L2 is not a standalone chain. It relies on an L1 as its foundation for security. Bitcoin has Lightning as its main L2. Ethereum has several. Solana, designed for high base-layer throughput, has fewer.

## Layer 2 as a way out

If the trilemma forces every L1 to compromise on one of the three properties, the natural question is whether you have to do everything on the L1. The answer, increasingly, is no.

The idea is simple. The L1 is slow, expensive, and very secure. So use the L1 for what it's best at: providing strong final settlement that nobody can roll back. Above it, run a faster system that handles the actual transaction volume. That faster system regularly anchors its state back to the L1, inheriting the L1's security guarantees without being constrained by the L1's throughput.

There are three styles of L2 worth knowing by name. Each one approaches the same problem differently.

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

**Optimistic rollups** run on Ethereum and similar smart-contract chains. They execute many transactions off the L1, batch them together, and post the batch to L1 with a summary of the resulting state. The L1 accepts the summary as valid unless someone challenges it within a fixed time window, typically about a week. If a challenge succeeds, the disputed batch is rolled back. The "optimistic" name comes from this assumption that batches are valid unless proven otherwise. They're cheap and fast to operate, but withdrawals from the L2 back to the L1 take the length of the challenge window to finalize.

**ZK rollups** do the same thing but instead of "trust unless challenged," they post a cryptographic proof along with each batch that mathematically demonstrates the off-chain execution was correct. The L1 verifies the proof and either accepts or rejects the batch immediately. ZK rollups are more complex to operate but withdrawals back to L1 are fast because there's no challenge window. The math behind ZK proofs is one of the deepest topics in modern cryptography and gets a proper treatment in the Ethereum track.

The broader idea behind these L2s, sometimes called the **modular blockchain thesis**, is that a chain doesn't have to do everything itself. It can specialize in one job, typically settlement and data storage, and let other layers handle execution, ordering, and fast finality. Each layer trades off the trilemma differently, but when you stack them together, the combined system can be stronger along all three axes than any single chain could be alone.

This is a deliberate escape from the trilemma's hardest limitation. It doesn't break the trade-off, but it lets different layers in the stack make different bets, with the most security-sensitive operations anchored to the slowest and most decentralized layer.
