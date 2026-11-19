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

> Ethereum runs transactions one after another. Solana was designed to run them at the same time wherever it can. To make that possible, every transaction declares up front which state it will read and which it will write.

## Every transaction declares what it touches

Solana starts from the same architecture as any blockchain and adds one constraint: the runtime should be able to execute unrelated work in parallel.

On Ethereum a contract decides which storage to read and write while its code runs. A node cannot tell before execution whether two transactions will touch the same state, so the transactions of a block are processed one after another. Solana requires that information in advance.

Picture a global computer where the state is broken into millions of small, independently-owned cells. Anyone can read any cell. Writing to a cell requires permission. Every transaction has to declare up front which cells it will read and which it will write, a manifest of what it touches. The runtime takes those declarations, sorts the incoming transactions into groups whose cell-sets do not overlap, and runs the groups on different threads at the same time.

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

## Programs and wallets are the same kind of account

The cells in the picture above are called **accounts**. Every account has an address, a balance in lamports, which is Solana's smallest unit at one billionth of a SOL, some bytes of data, and an owner. Each account is owned by one program, and only that program is allowed to change the account's data. Reads are open to anyone.

Ethereum has two kinds of accounts: user accounts controlled by a private key, and contract accounts controlled by code. Solana has one kind, and a program is an account whose data is executable code and whose owner is the special loader program that knows how to run it. A user's wallet is an account owned by the System Program. A token balance is an account owned by the Token Program.

Creating an account locks a deposit in lamports sized to its data, called rent, and every transaction pays a fee in lamports. The lessons on [rent](/courses/development-on-solana/the-solana-mental-model/lamports-rent-and-account-lifecycle) and [fees](/courses/development-on-solana/the-solana-mental-model/transaction-fees-and-compute-units) cover both.

## The price is hardware and a harder programming model

Ethereum made a different choice, a global serial computer with a simpler programming model. On Solana you have to know every account a transaction will touch before you send it, and the throughput depends on validators running far more demanding hardware than an Ethereum node needs. [Why Solana was built differently](/courses/development-on-solana/the-solana-mental-model/why-solana-built-differently) derives the rest of the programming model from the parallel-execution choice, and [What Solana traded for what](/courses/development-on-solana/architecture-details/what-solana-traded-for-what) goes through the costs.
