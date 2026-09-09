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

> Most blockchains run transactions one after another. Solana was designed to run them at the same time wherever it can. Every other choice in the system, the way state is stored, the way fees are priced, the cryptographic clock that orders the work, follows from that single decision. Picturing Solana as a world computer built for parallel execution is the mental model that makes the rest of the course make sense.

## The shape of the thing

You already know what a blockchain is. A network of nodes that hold the same data, agree on what gets added next, and chain blocks together with hashes so nothing can be quietly changed. Solana starts from that same architecture and adds one constraint that shapes everything else: the runtime should be able to execute unrelated work in parallel.

The way to picture this: imagine a global computer where the state is broken into millions of small, independently-owned cells. Anyone can read any cell. Writing to a cell requires permission. Every transaction that wants to run on the chain has to declare up front which cells it will read and which it will write. The runtime takes those declarations, sorts the incoming transactions into groups whose cell-sets do not overlap, and runs the groups on different threads at the same time.

That is the picture worth holding. A world computer where every transaction comes with a manifest of what it touches, so the runtime never has to guess.

<svg role="img" viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Declared account lists let Solana run non-overlapping transactions in parallel</title><desc>Three transactions each declare which accounts they touch: Tx 1 uses A and B, Tx 2 uses C and D, Tx 3 uses B and E. The runtime runs Tx 1 and Tx 2 in parallel since they share no accounts, but makes Tx 3 wait because it overlaps with Tx 1 on account B.</desc>
  <defs>
    <marker id="arrS12R" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
    <marker id="arrS12G" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Why declared accounts let the runtime parallelize</text>

<rect x="40" y="90" width="200" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="112" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Transaction 1</text>
  <line x1="55" y1="122" x2="225" y2="122" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="140" y="142" text-anchor="middle" font-family="monospace" font-size="10">accounts: A, B</text>
  <text x="140" y="158" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">Alice sends tokens to Bob</text>

<rect x="260" y="90" width="200" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="112" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Transaction 2</text>
  <line x1="275" y1="122" x2="445" y2="122" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="142" text-anchor="middle" font-family="monospace" font-size="10">accounts: C, D</text>
  <text x="360" y="158" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">Carol updates her NFT listing</text>

<rect x="480" y="90" width="200" height="90" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="580" y="112" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Transaction 3</text>
  <line x1="495" y1="122" x2="665" y2="122" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="580" y="142" text-anchor="middle" font-family="monospace" font-size="10">accounts: B, E</text>
  <text x="580" y="158" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">Dave reads from Bob's account</text>

<line x1="140" y1="180" x2="140" y2="220" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS12G)"/>
  <line x1="360" y1="180" x2="360" y2="220" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS12G)"/>
  <line x1="580" y1="180" x2="580" y2="220" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrS12R)"/>

<rect x="40" y="225" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="248" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Runtime checks the declared account lists</text>
  <text x="360" y="268" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">Tx 1 touches {A, B}. Tx 2 touches {C, D}. Tx 3 touches {B, E}. Tx 3 overlaps with Tx 1.</text>

<rect x="40" y="305" width="420" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="250" y="328" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Tx 1 and Tx 2 run in parallel</text>
  <text x="250" y="349" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">no overlap, different threads, same slot</text>

<rect x="480" y="305" width="200" height="65" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="580" y="328" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">Tx 3 waits for Tx 1</text>
  <text x="580" y="349" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">runs after, on B's new state</text>

<text x="360" y="400" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Declared access lets the runtime sort transactions into batches that can run side by side.</text>
</svg>

## What lives on it

The cells in the picture above are called **accounts**. Every account has an address, a balance in lamports, which is Solana's smallest unit at one billionth of a SOL, some bytes of data, and an owner. The owner is what makes the model work. Each account is owned by exactly one program, and only that program is allowed to change the account's data. Reads are open to anyone. Writes go through the owner.

There are no separate categories the way other chains split user accounts from contract accounts. Programs are accounts too. A program is just an account whose data is executable code and whose owner is the special loader program that knows how to run it. A user's wallet is an account owned by the System Program. A token balance is an account owned by the Token Program. Everything is the same kind of object with different ownership.

State stored on-chain takes up space on every validator that keeps a copy. If accounts could exist for free indefinitely, the network would accumulate data nobody uses. Rent prevents this: storing data costs a small ongoing fee, scaled to the size of the data. In practice, every account avoids continuous rent payments by depositing enough lamports up front to be permanently exempt. Every wallet and program does this automatically.

## What you pay for and why

Running code on a shared computer costs something. On Solana every transaction pays a small base fee in lamports for each signature it carries, half of which is burned and half of which goes to the validator that produces the block. The base fee is fixed, currently five thousand lamports per signature.

Computation itself is metered in **compute units**. Each operation a program performs costs a fixed number of compute units, and every transaction comes with a limit on how many it may consume. Hitting the limit causes the transaction to revert. The fee for execution is optional and called a priority fee, paid in micro-lamports per compute unit. Raising the price tells the validator currently producing the block, called the leader, that your transaction should be scheduled ahead of competing ones. During congestion the priority fee dominates. When the network is quiet you can set it to zero and your transaction will still be included in a block.

SOL is what the fees are paid in. SOL is also what every account's rent-exempt balance is held in, and what stakers post when they help secure the network.

## What you can do with it

Anything an application can express as a program that operates on accounts. Tokens with custom rules. Decentralized exchanges that hold pools of liquidity in accounts and let traders swap between them. Lending markets, on-chain games, prediction markets, governance systems, identity records. The same capabilities as any general-purpose smart-contract chain.

The thing Solana is built to do faster than most chains is to run all of those at the same time. When the runtime can schedule a swap on one DEX in parallel with a vote on a governance proposal in parallel with a token transfer between two wallets, throughput climbs. That design comes with trade-offs that the rest of this course addresses. You have to think about state differently, you have to declare your access patterns up front, and you have to be careful about what your program assumes when other transactions touched the same accounts a millisecond before yours.

## Where this fits

Solana is one specific design for a smart-contract chain. It made one choice, parallel execution as the central goal, and the rest of the system follows. Ethereum made a different choice, a global serial computer with a simpler programming model, and got a different system. Both are valid. Both host real applications worth hundreds of millions of dollars. The concepts you learn here apply to other parallel-execution chains like Sui, Aptos, or Sei, but the details will differ. When you finish this track you will be able to read a Solana program and reason about what it does. Everything else builds on that.
