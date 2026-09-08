---
id: 92
title: Public and private chains
type: lecture
order: 1
faq:
  - question: What is the real difference between a public and a private blockchain?
    answer: "A public blockchain lets anyone participate without permission: you can
      download the node software, validate blocks, and submit transactions with
      no operator able to ban you. A private blockchain restricts all of that to
      whoever the operator approves, whether a company, government, or
      consortium. Almost everything that makes blockchains interesting comes
      from being public. Private chains are essentially shared databases with
      cryptographic auditing, run by a small group that already trusts each
      other."
  - question: What is the difference between a coin chain and a smart-contract chain?
    answer: "A coin chain, like Bitcoin, is designed only to track money: its
      protocol cares about preventing double-spends, enforcing supply, and
      verifying signatures, and nothing else. A smart-contract chain, like
      Ethereum or Solana, can also run programs that read shared state, do
      computation, conditionally move money, and write new state back. That is
      why smart-contract chains can host lending markets, exchanges, and games,
      while coin chains are limited to payment systems."
  - question: What exactly is a smart contract?
    answer: A smart contract is a program that lives at its own address on the
      chain, has its own storage, and can hold funds. Anyone can call it by
      sending a transaction that points at its address, and when called it runs
      the code its creator deployed and updates its own state. The chain
      enforces the contract's rules exactly as written, and nobody can override
      that. Tokens, NFTs, decentralized exchanges, and lending markets are all
      smart contracts.
---

> Bitcoin is one specific blockchain. There are many others. They differ in dozens of ways, but two questions capture the differences that matter most and let you place any chain you meet. First: who is allowed to run a node, validate transactions, and submit data to the chain? Second: what is the chain designed to do? This lesson walks through those two questions and where the major chains land on each.

## The first question: who can participate?

Every blockchain has rules about who is allowed to take part. Those rules sort chains into two broad camps.

A **public** blockchain lets anyone participate without permission. You can download the node software, run it on any computer, and start validating blocks. You can submit transactions without registering an identity. There is no operator who can ban you or revoke your access. Bitcoin is public. Ethereum is public. Most of the chains you'll encounter as a web3 developer are public.

A **private** blockchain restricts participation. Some operator controls who is allowed to run a node, who can validate, and who can submit transactions. The operator might be a company, a government, or a consortium. If you want in, you ask the operator. If they don't approve, you don't get in. Private chains are used inside companies and industry groups for shared record-keeping where the participants are known to each other but want the data structure of a blockchain.

The reason this distinction matters is bigger than it sounds. Almost everything that makes blockchains interesting comes from being public. Private chains keep the data structure of a blockchain but give up most of the guarantees that come from open participation. They are essentially shared databases with cryptographic auditing, run by a small group that trusts each other.

A subtype worth knowing exists in the middle: **consortium** or **permissioned** chains. These are private chains where the operator is a group rather than a single company. Banks running a shared settlement network, for instance, or a group of supply-chain participants tracking shipments together. The mechanics are the same as private chains. The governance is shared.

Two private-chain platforms are worth knowing by name because you'll encounter them in industry contexts. **Hyperledger Fabric** is a modular framework for building permissioned chains where participants run validating nodes and a separate ordering service decides transaction order. It was originally contributed by IBM and is now hosted by the Linux Foundation. It's used in supply chains, food traceability, and a number of inter-bank pilots. **R3 Corda** is built specifically for financial institutions and works a bit differently from most blockchains: instead of every node holding the full chain, each transaction is shared only between the parties involved and the regulators who need to see it. Both are mature, both have real production deployments, and both live in a world that almost never overlaps with the public chains the rest of this course teaches. If you end up at a bank or a large enterprise doing "blockchain," it'll usually be one of these.

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

The rest of this course assumes public chains. The chain-specific tracks that follow teach development on public chains. If you end up working in enterprise blockchain (banks, logistics companies, government tracking systems), the patterns transfer but the deployment model is different.

## The second question: what is the chain for?

Within the public side of the map, there's a second distinction that matters more for developers than the first.

A **coin chain** is designed to track money. The transactions on it move value from one address to another. The chain's protocol cares about preventing double-spending, enforcing a supply schedule, and verifying signatures. It doesn't care about anything else, because there isn't anything else. Bitcoin is the canonical coin chain. Everything Bitcoin's protocol enforces is in service of "is this spend allowed, yes or no."

A **smart-contract chain** is designed to run programs. Transactions on a smart-contract chain can do more than move money. They can invoke contracts that read shared state, perform computations, conditionally move money, and write new state back. The chain's protocol cares about all the same things a coin chain cares about, plus a whole layer of execution: which contracts get called, what they're allowed to do, how much computation costs, and how the resulting state changes get committed. Ethereum is the canonical smart-contract chain. Solana is another. Most of the public chains active today fall on this side.

A **smart contract** is a program that lives at its own address on the chain, has its own storage, and can hold funds. You'll see the term constantly from here on. Anyone can call it by submitting a transaction that points at its address. When called, it runs whatever code its creator deployed and updates its own state accordingly. The chain enforces the contract's rules: whatever the code says happens, happens, and nobody can override that. Tokens, NFTs, decentralised exchanges, and lending markets are all smart contracts, or collections of them working together. These are the familiar things you've heard about on smart-contract chains. 

The distinction matters because it determines what's possible on the chain. On Bitcoin you can build payment systems. That's it. The locking conditions on UTXOs are deliberately limited. They can express payment rules and little else. On a smart-contract chain you can build payment systems. You can also build lending markets, exchanges, identity systems, prediction markets, in-game economies, ownership records, and arbitrary applications that combine those. The range of what you can build is far larger.

It also matters because it determines what kind of developer you'll be. Bitcoin development is a specialty focused on payment infrastructure and protocols built on top of Bitcoin. Smart-contract development is general-purpose application development on shared state, and it's where the bulk of web3 jobs are. The Solidity track this course leads into is smart-contract development on Ethereum. The Solana track is smart-contract development on Solana.

## Where to put any chain you meet

Whenever you come across a new chain, you now have the vocabulary to ask the first two questions about it.

**Is it public or private?** If public, it's part of the open web3 ecosystem and the patterns you've learned apply. If private, treat it as enterprise software with a blockchain data structure underneath.

**If public, is it a coin chain or a smart-contract chain?** Coin chains are payment-focused and intentionally limited. Smart-contract chains are general-purpose and run programs.

Those two questions categorize 95% of what you'll encounter. There are more axes but they sit underneath these two. The next lesson takes the smart-contract chain side of this map and asks a harder question: if smart-contract chains can do so much more than coin chains, why are they slower, more expensive, and harder to scale? That question has a name. It's called the blockchain trilemma.
