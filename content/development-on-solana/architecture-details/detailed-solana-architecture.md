---
id: 218
title: Detailed Solana architecture
type: lecture
order: 1
faq:
  - question: What is Proof of History, and is it how Solana reaches consensus?
    answer: "Proof of History is a verifiable clock: the network runs SHA-256 over
      and over, feeding each hash's output into the next to form a long chain
      that takes real time to compute, so the chain itself proves that time
      passed. Transactions are woven in by being hashed into a step, which pins
      each one to a fixed position in the sequence without anyone agreeing on
      wall-clock time. Crucially, PoH is not consensus; it only orders events
      within a single chain, and a separate mechanism (Tower BFT) decides which
      chain is the canonical one."
  - question: Why doesn't Solana have a mempool like Ethereum?
    answer: "Instead of a shared pool of pending transactions, Solana uses Gulf
      Stream: RPC nodes look up the publicly known upcoming leaders and forward
      each transaction straight to them, so it is already queued when their slot
      opens. This removes startup latency inside the 400ms slot and eliminates
      mempool front-running, because there is no public queue for others to
      watch and wrap transactions around. The trade-off is that ordering power
      moves to the leader, who sees every incoming transaction and can order
      them within their own slot."
  - question: How does Solana get a block to thousands of validators in 400 milliseconds?
    answer: "It uses Turbine, which splits each block into many small (~1,000-byte)
      pieces called shreds and sends them down a tree: the leader gives shreds
      to a few neighbors, who forward to the next layer, so every validator
      receives the block in about log(N) hops instead of the leader mailing it
      to everyone. The shreds are erasure-coded, meaning a validator can rebuild
      the full block from a sufficient subset even if some shreds are dropped,
      without asking for retransmissions. This tree propagation is also part of
      why Solana validators need substantial network bandwidth."
  - question: How can Solana execute many transactions at the same time?
    answer: Every Solana transaction declares up front every account it will read or
      write, so the runtime can group transactions whose writable account sets
      do not overlap and run each group on a different CPU core simultaneously.
      Two SOL transfers between unrelated wallets, or a token swap and an NFT
      mint that share no accounts, run in parallel. The cost is that access
      patterns must be known statically, which makes patterns like walking a
      linked list of unknown shape awkward on Solana; in exchange, throughput
      scales with CPU cores rather than being capped at single-threaded
      execution.
---

> This lecture zooms out to the protocol layer underneath. How does a transaction actually get from your wallet into a block, and how do thousands of validators agree on the result, in 400 milliseconds? These names may have come up before without a full explanation: Proof of History, Tower BFT, Turbine, Gulf Stream. None of them are magic. Each is an engineering answer to a specific bottleneck that other chains hit and didn't solve. Putting them together shows why Solana looks the way it does and what trade-offs the design accepted along the way.

## Why the standard playbook doesn't work at Solana's target throughput

Most chains follow a similar recipe. Users broadcast transactions to a public mempool. A miner or proposer picks transactions, builds a block, and gossips it to the network. Validators receive the block, replay the transactions to check the work, vote on the result, and accumulate enough votes for finality.

Each of those steps assumes a generous time budget. Bitcoin gives itself 10 minutes per block. Ethereum gives 12 seconds. At those speeds, gossiping the block to every node takes a few seconds at most, voting can be sequential, and the mempool can sit around for as long as the network is congested.

Solana aimed for 400 milliseconds per slot. At that speed, every step has to be rethought:

- Gossiping a block of thousands of transactions through a peer-to-peer network in 400ms requires a different propagation algorithm than naive flooding.
- Validators can't wait around for a mempool to drain. The transaction needs to be at the leader's door the moment its slot opens.
- Voting cannot block production. By the time votes finish for slot N, the leader for slot N+1 has to already be producing.
- The very notion of "what time is it" has to be agreed on cheaply, because every other coordination step depends on it.

Solana's architecture results from taking each of these constraints seriously. The components are PoH, Tower BFT, Gulf Stream, and Turbine, plus the parallel execution engine that processes transactions inside a slot. Everything else is built on top.

## Proof of History: the clock the network can verify

The first problem is time. In a distributed system, "what time is it" is a non-trivial question. Validator A might say 12:00:00.100 and validator B might say 12:00:00.150, with no way to tell which one is right. Any coordination that depends on agreed-on time, like "this transaction came before that one," has to gossip timestamps around and reconcile them.

Solana's answer is to not use clock time at all. Instead, the network agrees on a synthetic clock based on computational work that anyone can verify.

The mechanic is straightforward. Take a SHA-256 hash. Hash it. Hash the result. Hash that. Keep going. Each hash output becomes the next hash's input, forming a long chain.

<svg role="img" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Proof of History hash chain from hash_0 to hash_5 with tx_A and tx_B embedded</title><desc>A row of six boxes, hash_0 through hash_5, linked by arrows shows each hash computed from the one before it; tx_A is mixed in at hash_2 and tx_B is mixed in later at hash_4. A panel below lists three properties of the chain: sequential, verifiable in parallel, and tamper-evident timestamps.</desc>
  <defs>
    <marker id="arrA1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">PoH: a chain of hashes that proves time passed</text>
  <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">Each hash is a SHA-256 of the previous hash. The chain cannot be parallelized.</text>
  <rect x="40" y="105" width="80" height="40" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="80" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">hash_0</text>
  <text x="80" y="136" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">starting seed</text>
  <line x1="120" y1="125" x2="148" y2="125" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrA1)"/>
  <rect x="150" y="105" width="80" height="40" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="190" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">hash_1</text>
  <text x="190" y="136" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">= SHA(hash_0)</text>
  <line x1="230" y1="125" x2="258" y2="125" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrA1)"/>
  <rect x="260" y="105" width="80" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="300" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">hash_2</text>
  <text x="300" y="136" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">+ tx_A</text>
  <line x1="340" y1="125" x2="368" y2="125" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrA1)"/>
  <rect x="370" y="105" width="80" height="40" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="410" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">hash_3</text>
  <line x1="450" y1="125" x2="478" y2="125" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrA1)"/>
  <rect x="480" y="105" width="80" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="520" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">hash_4</text>
  <text x="520" y="136" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">+ tx_B</text>
  <line x1="560" y1="125" x2="588" y2="125" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrA1)"/>
  <rect x="590" y="105" width="80" height="40" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="630" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">hash_5</text>
  <line x1="300" y1="148" x2="300" y2="175" stroke="#565653" stroke-width="1"/>
  <text x="300" y="190" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">tx_A came in</text>
  <text x="300" y="204" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">at this point</text>
  <line x1="520" y1="148" x2="520" y2="175" stroke="#565653" stroke-width="1"/>
  <text x="520" y="190" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">tx_B came in</text>
  <text x="520" y="204" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">later</text>
  <rect x="40" y="235" width="640" height="220" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="258" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">Three properties that make this a verifiable clock</text>
  <line x1="60" y1="270" x2="660" y2="270" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="294" font-family="monospace" font-size="11" font-weight="bold">1. Sequential</text>
  <text x="60" y="312" font-family="monospace" font-size="10">Computing hash_N requires hash_(N-1). You cannot parallelize the chain.</text>
  <text x="60" y="326" font-family="monospace" font-size="10">N hashes takes at least N × (one hash time) of real wall clock.</text>
  <text x="60" y="358" font-family="monospace" font-size="11" font-weight="bold">2. Verifiable in parallel</text>
  <text x="60" y="376" font-family="monospace" font-size="10">Anyone can check the chain by hashing in parallel: split the chain into ranges</text>
  <text x="60" y="390" font-family="monospace" font-size="10">and verify each independently. Verification is fast even though production is not.</text>
  <text x="60" y="422" font-family="monospace" font-size="11" font-weight="bold">3. Tamper-evident timestamps</text>
  <text x="60" y="440" font-family="monospace" font-size="10">A tx mixed in at hash_N proves it existed by hash_N's slot. It cannot be backdated.</text>
</svg>

The three properties in the diagram are what turn a chain of hashes into a clock. Each hash takes some minimum amount of real time to compute, so the chain itself proves that time passed. If someone hands you a PoH chain with 800,000 hashes and your hardware can do 2 million SHA-256 per second, you know at least 0.4 seconds of wall clock elapsed during production, regardless of when you receive the chain or how fast you verify it.

Transactions get woven into the chain by being included in a hash input. When the leader is producing a slot and a transaction arrives, the leader hashes it into the next PoH step. From that point on, any node verifying the chain sees that transaction appearing at a specific position in the sequence. The transaction has a place in time that's cryptographically pinned, without anyone needing to agree on what wall-clock time it actually was.

The standard misunderstanding to clear up: PoH is not consensus. PoH gives an ordering within a single chain. It does not say which chain is the canonical one. If two leaders were running PoH on different inputs at the same wall-clock time, both chains would be perfectly verifiable as PoH outputs, and PoH alone could not tell you which one the network should accept. Consensus is the layer that picks the winning chain. That's the next piece.

## Tower BFT: consensus that piggybacks on PoH

Tower BFT is Solana's consensus mechanism, in the family of practical Byzantine fault tolerance protocols. The general PBFT pattern is: validators receive a proposed block, run it, and vote on whether to accept. Once enough votes accumulate, the block is final.

The challenge classical PBFT runs into is that votes themselves need to be timestamped. To decide whether a vote was on time, validators have to agree on a clock, which they can't, which leads to elaborate timeout and view-change protocols. Tower BFT avoids this problem entirely by using PoH as the timestamp.

Every vote a validator casts references the PoH hash at the moment of the vote. The PoH stream is the same stream the leader produced, so it's globally agreed on. There's no ambiguity about whether the vote came before or after some other event. The vote either happened at PoH position N or it didn't.

The second piece is the lockout mechanic. When a validator votes for a block, they commit to not voting against that block for a period that doubles each time they re-vote for it. The first vote locks them out for 2 slots, the second for 4, the third for 8, and so on. The longer the chain of confirming votes, the longer the lockout. By the time a block has many vote-rounds behind it, the validators who voted for it would have to wait exponentially long to vote against it, making it effectively final.

Finality on Solana is not a single moment. It's the accumulation of locked-in votes to the point where reversing the block would require a coordinated mass slashing. Practical finality is roughly 12.8 seconds, which corresponds to 32 slots of accumulated Tower BFT lockouts, on mainnet today, though the network often considers blocks "confirmed enough" much sooner for most purposes.

## Gulf Stream: no mempool

Most chains have a mempool, a pool of pending transactions waiting to be included. Users broadcast to the mempool, and miners or proposers fish out the transactions they want.

Solana doesn't have one. There's no shared queue of pending transactions. Instead, RPC nodes forward each transaction directly to the leaders who are about to produce blocks. This is Gulf Stream.

The leader schedule on Solana is public and known in advance. At any moment, every node knows who the leader will be for the next 100 or so slots. When an RPC node receives a transaction, it doesn't put it in a pool. It looks up the upcoming leaders for the next few slots and sends the transaction directly to them. By the time those leaders' slots open, the transaction is already in their queues.

This has three consequences.

First, the leader doesn't waste time during their slot fetching transactions. They have a queue. They process. Tiny startup latency, important when slots are 400ms long.

Second, "front-running the mempool" is impossible because there is no mempool. You cannot see pending transactions in a shared pool and insert your own transactions around them to extract profit, because transactions are not broadcast publicly. They're sent point-to-point to specific leaders. This eliminates one major class of MEV — the practice of extracting profit by manipulating transaction ordering — that Ethereum has to contend with.

Third, it shifts MEV pressure elsewhere. The leader sees all transactions arriving at their queue and can decide ordering inside the slot. If a leader wants to extract value, they can reorder transactions within their own slot, or buy private order flow from RPC providers. The MEV problem doesn't disappear, it moves from "everyone watches the mempool" to "leaders have local ordering power."

## Turbine: getting blocks to thousands of validators fast

Once a leader has produced a block, the block has to reach every validator on the network. The naive approach is gossip: each node, on receiving a block, forwards it to all its peers. This works fine for small networks, but at scale, the total bandwidth used by gossip grows quadratically with the number of validators. A network with thousands of validators would have hundreds of millions of redundant block transmissions for each slot.

Turbine solves this with a tree structure inspired by BitTorrent. Each block is shredded into many small fixed-size pieces, typically about a thousand bytes each. The leader sends each shred only to a small fanout of neighbors instead of to everyone. Those neighbors each forward their shreds to the next layer of validators, who forward to the next, and so on. Every validator receives the full block in roughly log(N) hops rather than the leader sending it to all N validators directly.

The shreds are also erasure-coded. Instead of sending exactly the bytes of the block, Turbine sends a slightly inflated version where any sufficient subset of shreds can reconstruct the full block. If some shreds are dropped or delayed, validators can still recover the block from what they have. This makes the propagation resilient to packet loss without needing retransmissions to ask "did you get shred 482?"

Turbine is the answer to "how do you propagate a block to 2,000 nodes in 400ms?" It's also part of why Solana's hardware requirements are higher than other chains. Every validator has to receive, forward, and reconstruct thousands of shreds per second, which requires real network bandwidth.

## Parallel execution

The last piece worth naming, because it's why throughput inside a slot is high in the first place. Solana programs execute in parallel based on the accounts they declare in the transaction's account list. The runtime can run two transactions simultaneously on different cores if their writable account sets don't overlap.

This is the design choice that drove the entire programming model you spent six modules learning. Every transaction declares its accounts up front. The runtime sorts transactions into non-conflicting groups and runs each group on a different CPU core. Two SOL transfers between unrelated wallets run at the same time. A token swap and an NFT mint that share no accounts run at the same time. A program upgrade and any unrelated transaction run at the same time.

The trade-off, as you've internalized by now, is that the access pattern has to be known statically. Walking a linked list whose shape you don't know in advance, or branching to a different program based on data you haven't read yet, are awkward patterns on Solana. In exchange, you get the parallel-execution thesis: throughput scales with cores rather than being capped at single-threaded execution.

## The transaction lifecycle, end to end

Now, putting it together. Here's what actually happens when a user signs a transaction.

<svg role="img" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The life of a Solana transaction, from RPC submission to finalized block</title><desc>Six stacked boxes connected top to bottom show the steps of a Solana transaction: a user signs and submits it via an RPC node, Gulf Stream forwards it to upcoming leaders, the leader builds a block using Proof of History, Turbine fans the block out to all validators, validators verify and vote with Tower BFT, and the block is finalized once supermajority votes accumulate.</desc>
  <defs>
    <marker id="arrA2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The life of a Solana transaction</text>
  <rect x="40" y="80" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="100" font-family="monospace" font-size="11" font-weight="bold">1. User signs and submits via RPC</text>
  <text x="60" y="118" font-family="monospace" font-size="10" fill="#565653">The user's wallet sends the signed tx to an RPC node, which forwards it to the network.</text>
  <text x="60" y="132" font-family="monospace" font-size="10" fill="#565653">No mempool. The tx is not waiting in any shared pool.</text>
  <line x1="360" y1="142" x2="360" y2="158" stroke="#ed4937" stroke-width="2" marker-end="url(#arrA2)"/>
  <rect x="40" y="168" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="188" font-family="monospace" font-size="11" font-weight="bold">2. Gulf Stream forwards directly to upcoming leaders</text>
  <text x="60" y="206" font-family="monospace" font-size="10" fill="#565653">RPC nodes know the leader schedule in advance. They send the tx to the next few</text>
  <text x="60" y="220" font-family="monospace" font-size="10" fill="#565653">leaders, so by the time a leader's slot starts, the tx is already in their queue.</text>
  <line x1="360" y1="230" x2="360" y2="246" stroke="#ed4937" stroke-width="2" marker-end="url(#arrA2)"/>
  <rect x="40" y="256" width="640" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="276" font-family="monospace" font-size="11" font-weight="bold">3. Leader produces the slot using PoH</text>
  <text x="60" y="294" font-family="monospace" font-size="10" fill="#565653">The current leader runs PoH, executes txs in parallel based on the accounts they touch,</text>
  <text x="60" y="308" font-family="monospace" font-size="10" fill="#565653">and weaves them into the PoH stream with timestamps. Output: a sequence of "entries"</text>
  <text x="60" y="322" font-family="monospace" font-size="10" fill="#565653">that, combined, form a block. Slot duration: 400 ms.</text>
  <line x1="360" y1="336" x2="360" y2="352" stroke="#ed4937" stroke-width="2" marker-end="url(#arrA2)"/>
  <rect x="40" y="362" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="382" font-family="monospace" font-size="11" font-weight="bold">4. Turbine fans the block out to all validators</text>
  <text x="60" y="400" font-family="monospace" font-size="10" fill="#565653">The block is shredded into many small pieces, erasure-coded, and propagated in a tree</text>
  <text x="60" y="414" font-family="monospace" font-size="10" fill="#565653">structure: leader → small fanout → each receives forwards to next layer. Tens of thousands</text>
  <text x="60" y="428" font-family="monospace" font-size="10" fill="#565653">of validators receive the block in roughly one round-trip time, not N round-trips.</text>
  <line x1="360" y1="442" x2="360" y2="458" stroke="#ed4937" stroke-width="2" marker-end="url(#arrA2)"/>
  <rect x="40" y="468" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="488" font-family="monospace" font-size="11" font-weight="bold">5. Validators verify and vote via Tower BFT</text>
  <text x="60" y="506" font-family="monospace" font-size="10" fill="#565653">Each validator replays the PoH stream, verifies tx signatures and execution, and votes.</text>
  <text x="60" y="520" font-family="monospace" font-size="10" fill="#565653">Vote lockouts double each time a validator votes for a block, making it economically</text>
  <text x="60" y="534" font-family="monospace" font-size="10" fill="#565653">expensive to revote against a deep block. Finality emerges from accumulated lockouts.</text>
  <line x1="360" y1="548" x2="360" y2="564" stroke="#ed4937" stroke-width="2" marker-end="url(#arrA2)"/>
  <rect x="40" y="574" width="640" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="597" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">6. Block is finalized once supermajority votes accumulate</text>
</svg>

Each step exists because of one of the bottlenecks named at the start. No mempool, because mempool gossip eats time and creates MEV exposure. PoH, because every other step needs an agreed-on clock. Parallel execution, because slots are short and you can't process thousands of transactions sequentially in 400ms. Turbine, because gossip doesn't scale to thousands of validators. Tower BFT, because consensus needs to be fast enough to keep up with block production.

## What this means for you as a programmer

You spent six modules learning to write code that runs inside step 3. Every Anchor constraint you wrote, every PDA you derived, every CPI you composed, runs as part of "leader executes transactions in parallel based on their account lists." That part of the architecture is the only part your program directly interacts with.

But the other parts shape the world your program lives in. Slots are 400 ms because of the propagation budget Turbine provides. Compute units are tightly capped because the leader must finish executing within one slot. Versioned transactions and Address Lookup Tables exist because the 1,232-byte transaction size limit comes from the UDP-packet shape that Turbine uses for shreds. Priority fees matter because the leader controls transaction ordering within their slot and can process higher-fee transactions first. The leader having scheduling power is what makes priority-fee tipping meaningful.

You don't have to remember every component. You do need the high-level picture: a Solana transaction is signed off-chain, forwarded directly to known upcoming leaders, executed in parallel under a verifiable clock, propagated via a tree to all validators, voted on with exponentially-doubling lockouts, and finalized over the next several seconds. Everything else, including all the constraints you internalized as a programmer, falls out of that pipeline.
