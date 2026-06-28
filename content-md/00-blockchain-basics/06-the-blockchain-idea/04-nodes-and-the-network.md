# Nodes and the network

_type: lecture_

> Every lesson in this module so far has referenced "nodes" doing things. Nodes hold copies of the chain. Nodes agree or disagree. Nodes vote in consensus. The word has been doing a lot of work without ever being defined. This lesson defines it. A node is a piece of software running the blockchain's protocol, and the network is the set of nodes all running the same software at the same time, talking to each other. What sounds like one sentence opens up into a surprisingly varied ecosystem of roles, communication patterns, and economic motivations for running anything at all.

## What a node is

At the simplest level, a node is a program. It runs on a computer somewhere in the world. It connects to other instances of the same program running on other computers. Together, they form the network that maintains the blockchain.

A node does four things, all of the time.

It **holds a copy** of the data the network has agreed on, which usually includes the whole history of the chain or some pruned version of it.

It **listens for new data** from other nodes: new blocks proposed, new transactions broadcast, new connection requests from peers it hasn't met before.

It **validates** everything it receives against the rules of the protocol. If something doesn't follow the rules, the node rejects it and refuses to relay it further.

It **forwards** the things it accepts to other nodes it's connected to, so that valid information propagates across the whole network within seconds.

That's the whole job. Hold the chain, listen, validate, forward. Every node on every blockchain in existence does some version of those four operations. The variations between blockchains are in what counts as "valid" and what the data looks like, but the role of the node is universal.

## The main kinds of node

Not every node does the same amount of work. Most blockchains distinguish at least three role types, and the distinctions matter for how the network as a whole behaves.

<svg viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <!-- Header -->
  <rect x="20" y="20" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="110" y="50" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Type</text>

<rect x="200" y="20" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="290" y="50" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Holds</text>

<rect x="380" y="20" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="470" y="50" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Verifies</text>

<rect x="560" y="20" width="140" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="630" y="50" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Proposes blocks</text>

<!-- Full node row -->
  <rect x="20" y="70" width="180" height="70" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="110" y="105" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Full node</text>

<rect x="200" y="70" width="180" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="290" y="100" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">the entire chain</text>
  <text x="290" y="118" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">history + state</text>

<rect x="380" y="70" width="180" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="470" y="100" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">everything,</text>
  <text x="470" y="118" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">independently</text>

<rect x="560" y="70" width="140" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="630" y="110" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">no</text>

<!-- Validator/producer row -->
  <rect x="20" y="140" width="180" height="70" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="110" y="170" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Block producer</text>
  <text x="110" y="190" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">(miner or validator)</text>

<rect x="200" y="140" width="180" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="290" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">the entire chain</text>
  <text x="290" y="188" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">history + state</text>

<rect x="380" y="140" width="180" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="470" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">everything,</text>
  <text x="470" y="188" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">independently</text>

<rect x="560" y="140" width="140" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="630" y="180" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">yes</text>

<!-- Light node row -->
  <rect x="20" y="210" width="180" height="70" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="110" y="245" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Light node</text>

<rect x="200" y="210" width="180" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="290" y="240" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">block headers</text>
  <text x="290" y="258" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">only</text>

<rect x="380" y="210" width="180" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="470" y="240" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">specific items via</text>
  <text x="470" y="258" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Merkle proofs</text>

<rect x="560" y="210" width="140" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="630" y="250" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">no</text>
</svg>

**Full nodes** do the most work and provide the most independence. They download every block, verify every transaction inside it, and keep the entire history on disk. A full node trusts nobody. Whatever it accepts as valid, it accepted because it ran the rules itself. Anyone who wants the strongest possible guarantee that the chain they're seeing is correct runs a full node.

**Block producers** are full nodes with an extra role: they also propose new blocks. Depending on which consensus mechanism a chain uses, these are called miners or validators. The distinction is in how they earn the right to propose: by burning computation in the first case, by locking up stake in the second. Either way, the consensus mechanism from the previous lesson picks them through some costly process, they assemble a block, and the rest of the network either accepts or rejects what they propose. Block producers are usually a small fraction of total nodes.

**Light nodes** sit at the opposite end. They store only block headers instead of full blocks. When they need to verify that a specific transaction was included in a specific block, they ask a full node for a Merkle proof and check it locally. The Merkle-tree primitive from earlier in the course is exactly what makes this efficient. A light node running on a phone can verify membership in a chain that holds terabytes of history.

The reader who wants the strongest guarantees runs a full node. The reader who wants a fast wallet on a low-resource device gets one backed by a light node. The reader who wants to earn the chain's rewards becomes a block producer. The roles cover the space.

## How nodes find each other

A node starting up for the first time has a problem. It doesn't know any other nodes. There's no central directory. It needs peers to talk to, but how does it find them?

The answer is that most chains ship their software with a small list of well-known **bootstrap nodes**, run by the project's developers or core community. When you start a node for the first time, it connects to one or more of those bootstraps and asks "who else is on the network?" The bootstrap responds with a list of peers it knows about. The new node picks some, connects to them, and asks them the same question. Within a few seconds, the new node has discovered dozens or hundreds of peers and the bootstrap is no longer needed.

This is the same pattern peer-to-peer networks have used for decades. The bootstrap is a starting point, not a hub. Once a node is up and running, it doesn't depend on the bootstrap at all. The network is genuinely decentralised in steady state.

## How nodes talk

Once two nodes are connected, they communicate via a **gossip protocol**. The pattern is simple. When a node learns something new, a new transaction, a new block, it tells all the peers it's connected to. Each of those peers, if the information is new to them, tells all *their* peers. Within a few hops, almost every node in the network has heard the news. The cost to any individual node is small, but the total propagation is fast and reaches everyone.

A small refinement matters in practice. Nodes don't blindly send full data to each peer because that would waste bandwidth. Instead, they send a short **announcement** ("I have a new block with this hash, do you want it?"). If the receiving node already has it, it ignores the announcement. If not, it asks for the full content. This two-step pattern keeps the network from drowning in duplicate traffic.

The gossip protocol is why a transaction broadcast to a single node reaches the entire network within seconds, even though no node has a direct connection to most of the others. It's also why "broadcasting a transaction" doesn't require knowing anything about the network's structure. You hand the transaction to any node, and gossip propagation does the rest.

## Why anyone runs a node

The economic question matters. Running a full node costs real money: bandwidth, electricity, disk space, the maintenance time of a human operator. Why does anyone bother?

Three reasons cover most operators.

**Block producers** run nodes because the chain pays them to. Whoever produces a valid block earns the block's rewards, which is the primary financial incentive in any blockchain. This is the reason the network has any block producers at all.

**Service operators** run nodes because they sell access to them. Wallet providers, block explorers, indexing services, and the infrastructure layer for most decentralised applications all need nodes to talk to. They run their own, or they pay specialised companies to run them and expose the data via an API.

**Trust-minimising users** run nodes because they want maximum certainty that the chain they're seeing is correct. A user who runs their own full node trusts nobody else's interpretation of the rules. This is a minority of users in absolute numbers, but it's the population that keeps the network honest in steady state. If anyone tried to push a rule change, the trust-minimising operators would notice and refuse to accept it.

## Where this goes next

You now know what a node is, what kinds exist, how they find each other, and how they share information. You also have, from previous lessons, the cryptographic primitives, the blockchain's structure, and the consensus mechanism that keeps it all honest. The next lesson is the synthesis. It walks through the entire flow of how a change to a blockchain actually happens, step by step, from a user signing something in their wallet to that change being part of the chain's permanent record. Every component referenced in the walkthrough is something you already understand in detail. The lesson is where they finally all snap together into one working picture.
