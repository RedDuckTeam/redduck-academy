---
id: 179
title: What Solana is
type: lecture
order: 2
faq:
  - question: How does Solana run transactions in parallel?
    answer: >-
      Every transaction declares up front which accounts it will read and which it will
      write. The runtime runs groups whose account sets do not overlap on separate threads.
  - question: What do I pay for when I send a Solana transaction?
    answer: >-
      A base fee of 5,000 lamports per signature, half burned and half paid to the validator
      that produced the block. Computation is metered separately in compute units, with a
      limit each transaction cannot exceed. The priority fee on top is optional, priced in
      micro-lamports per compute unit.
  - question: Is a program an account?
    answer: >-
      Yes. Its data field holds executable code and its owner is a loader program. A wallet
      and a token balance are the same kind of object with different owners and contents.
  - question: Do I have to keep paying to store an account on Solana?
    answer: >-
      No. A one-time lamport deposit sized to the data makes an account permanently
      rent-exempt.
---

> Most blockchains run transactions one after another. Solana was designed to run them at the same time wherever it can. Every other choice in the system (the way state is stored, the way fees are priced, the cryptographic clock that orders the work) follows from that single decision. Picturing Solana as a world computer built for parallel execution is the mental model that makes the rest of the course make sense.

## The shape of the thing

You already know what a blockchain is: a network of nodes that hold the same data, agree on what gets added next, and chain blocks together with hashes so nothing can be quietly changed. Solana starts from that same architecture and adds one constraint that shapes everything else: the runtime should be able to execute unrelated work in parallel.

The way to picture this: imagine a global computer where the state is broken into millions of small, independently owned cells. Anyone can read any cell. Writing to a cell requires permission. Every transaction that wants to run on the chain has to declare up front which cells it will read and which it will write. The runtime takes those declarations, sorts the incoming transactions into groups whose cell-sets do not overlap, and runs the groups on different threads at the same time.

That is the picture worth holding: a world
