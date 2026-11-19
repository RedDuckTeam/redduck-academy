---
id: 218
title: Detailed Solana architecture
type: lecture
order: 1
faq:
  - question: What are the main parts of Solana's architecture?
    answer: >-
      Proof of History for ordering, Tower BFT for consensus, Gulf Stream for pushing
      transactions to upcoming leaders, Turbine for spreading blocks, and parallel execution
      over non-overlapping accounts.
  - question: Is Proof of History how Solana reaches consensus?
    answer: >-
      No. PoH is a clock. The network runs SHA-256 over its own output again and again, and
      because each hash needs the one before it, the chain proves real time passed. A
      transaction hashed into a step is pinned to that position. Tower BFT picks the canonical
      chain.
  - question: Where do pending transactions wait if there is no mempool?
    answer: >-
      Nowhere public. RPC nodes read the published leader schedule and send each transaction
      straight to the upcoming leaders, so it is queued before the slot opens. With no public
      queue, nobody outside can watch pending transactions and wrap their own around them. The
      ordering power sits with the leader instead.
  - question: How does a block reach thousands of validators in 400 milliseconds?
    answer: >-
      Turbine splits the block into shreds of about 1,000 bytes and sends them down a tree. The
      leader hands shreds to a few neighbors, who forward to the next layer, so the block
      arrives everywhere in about log N hops. Erasure coding lets a validator rebuild it from
      a large enough subset.
  - question: Which transactions can the runtime execute in parallel?
    answer: >-
      Any set whose writable accounts do not overlap. Each transaction declares every account
      it will read or write up front, and non-conflicting groups run on separate cores. The
      price is that access patterns must be known before execution.
  - question: How long until a block is final?
    answer: >-
      About 12.8 seconds, after 32 slots of accumulated Tower BFT lockouts. Most applications
      act sooner, once a supermajority of stake has voted.
---

> A Solana slot lasts 400 milliseconds. Proof of History, Gulf Stream, Turbine, and Tower BFT are each an engineering answer to a step of block production that does not fit into that time when it is done the usual way. Each answer also decides something for your application: whether a transaction arrives at all, where it lands in the block, and when its result can be trusted.

## Why the standard playbook doesn't work at Solana's target throughput

Most chains follow a similar recipe. Users broadcast transactions to a public mempool. A miner or proposer picks transactions, builds a block, and gossips it to the network. Validators receive the block, replay the transactions to check the work, vote on the result, and accumulate enough votes for finality.

Each of those steps assumes a generous time budget. Bitcoin gives itself 10 minutes per block, and Ethereum gives 12 seconds. At those speeds, gossiping the block to every node takes a few seconds at most, voting can be sequential, and the mempool can sit around for as long as the network is congested.

Solana aimed for 400 milliseconds per slot. At that speed, every step has to be rethought:

- Gossiping a block of thousands of transactions through a peer-to-peer network in 400ms requires a different propagation algorithm than naive flooding.
- Validators can't wait around for a mempool to drain. The transaction needs to be at the leader's door the moment its slot opens.
- Voting cannot block production. By the time votes finish for slot N, the leader for slot N+1 has to already be producing.
- The very notion of "what time is it" has to be agreed on cheaply, because every other coordination step depends on it.

The components that answer these constraints are Proof of History (PoH), Tower BFT, Gulf Stream, and Turbine, plus the parallel execution engine that processes transactions inside a slot. The diagram shows where each one sits on the path of a transaction, and the sections below follow that path.

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

## Gulf Stream: no mempool

Most chains have a mempool, a pool of pending transactions waiting to be included. Solana has no shared queue of pending transactions. Instead, RPC nodes forward each transaction directly to the leaders who are about to produce blocks, and this forwarding is called Gulf Stream.

The leader schedule on Solana is public and computed an epoch ahead, as the [leader schedule lesson](/courses/development-on-solana/architecture-details/the-leader-schedule-and-block-production) explains. When an RPC node receives a transaction, it looks up the leaders for the next few slots and sends the transaction directly to them. By the time those leaders' slots open, the transaction is already in their queues, so a leader spends none of its 400ms fetching transactions.

For your application this has two consequences.

Nobody outside can watch pending transactions in a shared pool and insert their own around them, because transactions are not broadcast publicly. They're sent point-to-point to specific leaders.

A sent transaction is not guaranteed to land. The leaders it was forwarded to might include it or might not, and there is no shared pool where it would wait for a later leader. Its recent blockhash stays valid for about 150 slots, roughly a minute ([Proof of History lesson](/courses/development-on-solana/the-solana-mental-model/proof-of-history)), and after that the network rejects it. So the client has to wait for the confirmation and, if it does not come before the blockhash expires, build and sign a new transaction ([client side](/courses/development-on-solana/writing-your-first-program/client-side)). Wallets and SDKs typically do this by retrying with a fresh blockhash.

## The leader orders and executes the transactions of its slot

Execution by the leader is the only step your program takes part in. Every Anchor constraint you wrote, every PDA you derived, every CPI you composed runs while the leader executes the transactions of its slot.

The leader records the order of transactions with Proof of History, a chain of SHA-256 hashes in which each hash is computed from the previous one. Each hash takes some minimum amount of real time to compute, so the chain itself proves that time passed. If someone hands you a PoH chain with 800,000 hashes and your hardware can do 2 million SHA-256 per second, you know at least 0.4 seconds of wall clock elapsed during production. The leader hashes each transaction into the chain, which pins its position in the sequence without anyone needing to agree on what wall-clock time it was. The [Proof of History lesson](/courses/development-on-solana/the-solana-mental-model/proof-of-history) covers the mechanism.

PoH proves the order the leader chose, and the leader is the one who chooses it. The leader sees all transactions arriving at their queue and can decide ordering inside the slot. So MEV, the practice of extracting profit by manipulating transaction ordering, doesn't disappear on Solana. It moves from "everyone watches the mempool" to "leaders have local ordering power." If a leader wants to extract value, they can reorder transactions within their own slot, or buy private order flow from RPC providers.

Your program cannot control where its transaction lands relative to the others in the slot. The client can bid for a place with a priority fee, because the leader controls transaction ordering within its slot and can process higher-fee transactions first ([fees lesson](/courses/development-on-solana/the-solana-mental-model/transaction-fees-and-compute-units)). The [Jito lesson](/courses/development-on-solana/architecture-details/jito-mev-bundles) covers the market that grew around this.

Inside the slot, the runtime can run two transactions simultaneously on different cores if their writable account sets don't overlap. The runtime can tell only because every transaction declares its accounts up front, and the price is that the access pattern has to be known before execution ([why Solana was built differently](/courses/development-on-solana/the-solana-mental-model/why-solana-built-differently)). Even in parallel, the leader must finish executing within one slot, which is why compute units are tightly capped.

## Turbine: getting blocks to thousands of validators fast

Once a leader has produced a block, the block has to reach every validator on the network. The naive approach is gossip: each node, on receiving a block, forwards it to all its peers. This works fine for small networks, but at scale, the total bandwidth used by gossip grows quadratically with the number of validators. In a network of 2,000 validators that is on the order of 2,000 × 2,000 = 4 million block transmissions for each slot, almost all of them redundant.

Turbine solves this with a tree structure inspired by BitTorrent. Each block is shredded into many small fixed-size pieces, typically about a thousand bytes each. The leader sends each shred only to a small fanout of neighbors instead of to everyone. Those neighbors each forward their shreds to the next layer of validators, who forward to the next, and so on. Every validator receives the full block in roughly log(N) hops rather than the leader sending it to all N validators directly. The shreds are also erasure-coded, so a validator can reconstruct the full block from any sufficient subset of them without asking for the missing ones again.

Turbine is part of why a Solana validator needs more hardware than a node on other chains. Every validator has to receive, forward, and reconstruct thousands of shreds per second, which requires real network bandwidth: a 1 Gbps symmetric connection at minimum. Hardware at this level means fewer people can afford to run a validator independently, and the number of distinct Solana validators is in the low thousands. [What Solana traded for what](/courses/development-on-solana/architecture-details/what-solana-traded-for-what) comes back to this trade.

## Tower BFT: consensus that piggybacks on PoH

PoH gives an ordering within a single chain. It does not say which chain is the canonical one. If two leaders were running PoH on different inputs at the same wall-clock time, both chains would be perfectly verifiable as PoH outputs. Consensus is the layer that picks the winning chain.

Tower BFT is Solana's consensus mechanism, in the family of practical Byzantine fault tolerance protocols. The general PBFT pattern is: validators receive a proposed block, run it, and vote on whether to accept. Once enough votes accumulate, the block is final.

The challenge classical PBFT runs into is that votes themselves need to be timestamped. To decide whether a vote was on time, validators have to agree on a clock, which they can't, which leads to elaborate timeout and view-change protocols. Tower BFT avoids this problem by using PoH as the timestamp. Every vote a validator casts references the PoH hash at the moment of the vote. The PoH stream is the same stream the leader produced, so it's globally agreed on, and there's no ambiguity about whether the vote came before or after some other event.

When a validator votes for a block, they commit to not voting against that block for a period that doubles each time they re-vote for it. By the time a block has many vote-rounds behind it, the validators who voted for it would have to wait exponentially long to vote against it, making it effectively final.

So finality on Solana builds up over several seconds, as locked-in votes accumulate to the point where reversing the block would require a coordinated mass slashing. Practical finality is roughly 12.8 seconds, which corresponds to 32 slots of accumulated Tower BFT lockouts, on mainnet today.

Your client chooses how much of this to wait for with the commitment level it passes to the RPC ([client side](/courses/development-on-solana/writing-your-first-program/client-side)). `confirmed` is the level most applications act on: a supermajority of stake has voted on the block, which usually happens within a few seconds. `finalized` is the 12.8-second level. Which one you need depends on what happens if the block is reverted after you acted. A bridge that released funds on another chain cannot take them back, so bridges typically wait for full finality.

## Three questions about every transaction your application sends

What does the client do if the transaction has not landed by the time its blockhash expires? At which commitment level does the application treat the result as done, and what does it lose if that block is reverted? Does anything in your program depend on where the transaction lands inside the slot, given that the leader chooses that order?
