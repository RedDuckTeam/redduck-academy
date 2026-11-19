---
id: 92
title: Public and private chains
type: lecture
order: 1
faq:
  - question: What is the real difference between a public and a private blockchain?
    answer: >-
      Permission. On a public chain anyone can run a node, validate, and submit transactions,
      and no operator can ban them. A private chain hands all three decisions to an operator,
      which makes it closer to a shared database with cryptographic auditing.
  - question: Which private chain platforms will I meet in enterprise work?
    answer: >-
      Hyperledger Fabric and R3 Corda. Fabric is a modular permissioned framework from IBM,
      now hosted by the Linux Foundation, with a separate ordering service that decides
      transaction order. Corda targets financial institutions and shares each transaction only
      with the parties involved and their regulators.
  - question: What is the difference between a coin chain and a smart-contract chain?
    answer: >-
      What a transaction is allowed to do. Bitcoin, a coin chain, only moves value, so its
      rules cover double-spends, supply, and signatures. Ethereum and Solana also run programs
      that read shared state, compute, and write new state back.
  - question: What exactly is a smart contract?
    answer: >-
      A program with its own address on the chain, its own storage, and the ability to hold
      funds. Tokens, NFTs, decentralized exchanges, and lending markets are all smart
      contracts.
---

> Bitcoin is one blockchain among many. They differ in dozens of ways, but two questions capture the differences that matter most and let you place any chain you meet. First: who is allowed to run a node, validate transactions, and submit data to the chain? Second: what is the chain designed to do?

## The first question: who can participate?

Every blockchain has rules about who is allowed to take part. Those rules sort chains into two broad camps.

A **public** blockchain lets anyone participate without permission. You can download the node software, run it on any computer, and start validating blocks. You can submit transactions without registering an identity. There is no operator who can ban you or revoke your access. Bitcoin and Ethereum are public, and so are most of the chains you'll encounter as a web3 developer.

A **private** blockchain, also called a **permissioned** one, restricts participation. Some operator controls who is allowed to run a node, who can validate, and who can submit transactions. The operator might be a company, a government, or a consortium. If you want in, you ask the operator, and the operator can refuse. Private chains are used inside companies and industry groups for shared record-keeping where the participants are known to each other but want the data structure of a blockchain.

## An operator removes Bitcoin's costs together with its guarantees

Bitcoin's design started from five constraints, and all five came from having no operator, as [The Bitcoin design philosophy](/courses/blockchain-basics/bitcoin/the-bitcoin-design-philosophy) showed. A private chain has an operator, so each constraint changes.

| Bitcoin's constraint | Without an operator | With an operator |
| --- | --- | --- |
| Sybil resistance without identity | Adding a block costs proof of work, so fake participants cost real money | The operator admits only known members, so fake participants can't join and proof of work isn't needed |
| Public verifiability | All data is public, so any node can check it | The operator decides who sees the data, and it can stay closed to outsiders |
| Convergence despite network delay | Blocks are ten minutes apart, so each one reaches the whole network | Blocks only have to reach a few known nodes, so the chain doesn't need a ten-minute margin |
| Censorship resistance | No single party can keep a participant or a transaction out | The operator can refuse a participant or a transaction |
| Permanence | Rewriting history means redoing the proof of work | Nothing makes rewriting expensive, so the validating members can do it if they agree |

The first three rows are what a private chain gets: no energy bill, data closed to outsiders, and no need for a ten-minute gap between blocks. The last two rows are what it pays. Its members have to trust the operator not to shut them out and not to rewrite the record, and Bitcoin was designed so that nobody has to be trusted with that.

This makes private chains essentially shared databases with cryptographic auditing, run by a small group that trusts each other. What they keep over an [ordinary database](/courses/blockchain-basics/the-blockchain-idea/blockchain-vs-database) is the hash-linked record. Members hold their own copies, so an edit to past records shows up as a mismatch between copies.

When the operator is a group rather than a single company, the chain is called a **consortium** chain. Examples are banks running a shared settlement network, or a group of supply-chain participants tracking shipments together. The mechanics are the same as in any private chain, and the governance is shared.

You'll encounter two private-chain platforms in industry contexts. In **Hyperledger Fabric** approved participants run the validating nodes, and a separate ordering service decides transaction order in place of mining. It's used in supply chains, food traceability, and a number of inter-bank pilots. **R3 Corda** is built for financial institutions and goes further in closing the data: instead of every node holding the full chain, each transaction is shared only between the parties involved and the regulators who need to see it. If you end up at a bank or a large enterprise doing "blockchain," it'll usually be one of these.

## The second question: what is the chain for?

Among public chains, there's a second distinction that matters more for developers than the first.

A **coin chain** is designed to track money. The transactions on it move value from one address to another. The chain's protocol cares about preventing double-spending, enforcing a supply schedule, and verifying signatures. Bitcoin is the canonical coin chain. Everything Bitcoin's protocol enforces is in service of "is this spend allowed, yes or no."

A **smart contract** is a program that lives at its own address on the chain, has its own storage, and can hold funds. You'll see the term constantly from here on. Anyone can call it by submitting a transaction that points at its address. When called, it runs whatever code its creator deployed and updates its own state accordingly. The chain enforces the contract's rules: whatever the code says happens, happens, and nobody can override that. Tokens, NFTs, decentralised exchanges, and lending markets are all smart contracts, or collections of them working together. These are the familiar things you've heard about on smart-contract chains. 

A **smart-contract chain** is designed to run these programs. Transactions on a smart-contract chain can do more than move money. They can invoke contracts that read shared state, perform computations, conditionally move money, and write new state back. The chain's protocol cares about all the same things a coin chain cares about, plus a whole layer of execution: which contracts get called, what they're allowed to do, how much computation costs, and how the resulting state changes get committed. Ethereum is the canonical smart-contract chain, and Solana is another. Most of the public chains active today fall on this side.

The distinction matters because it determines what's possible on the chain. On Bitcoin you can build payment systems and little else, because the locking conditions on UTXOs are deliberately limited.

Take a lending market, where many people deposit coins into one pool and others borrow from the pool against collateral. Say Alice leaves 150 dollars' worth of one token as collateral and borrows 100 dollars' worth of another. The market has to remember both numbers, and when Alice repays the 100, it has to find her record, check the amount, and release her collateral. A Bitcoin locking condition has nowhere to keep such a record. It belongs to one coin, it is checked once, when that coin is spent, and it answers one question, whether this spend is allowed. A smart contract has its own storage and holds the funds itself. It can keep a record for every depositor and borrower, update it on each deposit, loan and repayment, and pay out by its own rules.

Exchanges, prediction markets, in-game economies and ownership records need the same thing, a program that keeps its own state, so they are built on smart-contract chains.

## Both questions on one map

<svg role="img" viewBox="0 0 720 340" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Public vs private chains: coin, smart-contract, and enterprise uses</title><desc>A 2x2 grid splits public chains, where anyone can join, from private chains, where an operator decides who joins. Public chains cover coin chains like Bitcoin and smart-contract chains like Ethereum and Solana, while private chains cover industry settlement (Hyperledger, Corda) and internal record-keeping for company enterprise deployments.</desc>
  <text x="360" y="25" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Public and private chains, and what they're for</text>

<text x="180" y="60" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Public chains</text>
  <text x="180" y="78" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">anyone can join</text>

<text x="540" y="60" text-anchor="middle" font-size="13" fill="#ed4937" font-weight="bold">Private chains</text>
  <text x="540" y="78" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">an operator decides who joins</text>

<line x1="360" y1="100" x2="360" y2="310" stroke="#000000" stroke-width="2" stroke-dasharray="4 3"/>

<rect x="40" y="100" width="280" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="125" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Coin chains</text>
  <text x="180" y="143" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">designed for tracking money</text>
  <text x="180" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Bitcoin</text>

<rect x="400" y="100" width="280" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="125" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Industry settlement</text>
  <text x="540" y="143" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">banks, supply chains, trade finance</text>
  <text x="540" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Hyperledger, Corda</text>

<rect x="40" y="210" width="280" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="235" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Smart-contract chains</text>
  <text x="180" y="253" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">designed for running programs</text>
  <text x="180" y="280" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Ethereum, Solana, and others</text>

<rect x="400" y="210" width="280" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="235" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Internal record-keeping</text>
  <text x="540" y="253" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">company-internal chains</text>
  <text x="540" y="280" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">enterprise deployments</text>
</svg>

Every public chain on this map runs into the same limit when it tries to be fast, secure and open to everyone at once. The next lesson is about that limit, which is called the blockchain trilemma.
