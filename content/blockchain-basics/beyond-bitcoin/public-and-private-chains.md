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

## Two rules for participation

A **public** blockchain lets anyone participate without permission. You download the node software, run it on a computer, and start validating blocks. You can submit transactions without registering an identity. Bitcoin is public, Ethereum is public, most of the chains you'll encounter as a web3 developer are public.

A **private** blockchain restricts participation. Some operator controls who is allowed to run a node, who can validate, and who can submit transactions. The operator might be a company, a government, or a consortium. If you want in, you ask the operator; if they don't approve, you don't get in. Private chains are used inside companies and industry groups for shared record-keeping where the participants know each other ans want the data structure of a blockchain.

Almost everything that makes blockchains interesting comes from being public. Private chains give up most of the guarantees that come from open participation. They are essentially shared databases with cryptographic auditing, run by a small group that trusts each other.

There are also subtypes: **consortium** or **permissioned** chains. These are private chains where the operator is a group rather than a single company. Banks running a shared settlement network, for instance, or a group of supply-chain participants tracking shipments together. The mechanics are the same as private chains where the governance is shared.

Let's learn about two private-chain platforms to get more context. 

**Hyperledger Fabric** is a modular framework for building permissioned chains where participants run validating nodes and a separate ordering service decides transaction order. It was originally contributed by IBM and is now hosted by the Linux Foundation. It's used in supply chains, food traceability, and a number of inter-bank pilots. <br><br/>
**R3 Corda** is built specifically for financial institutions and works a bit differently from most blockchains: instead of every node holding the full chain, each transaction is shared only between the parties involved and the regulators who need to see it. Both are mature, both have real production deployments, and both live in a world that almost never overlaps with the public chains the rest of this course teaches. 

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

## What is the chain for?

A **coin chain** is designed to track money. The transactions on it move value from one address to another. The chain's protocol cares about preventing double-spending, enforcing a supply schedule, and verifying signatures. Bitcoin is the canonical coin chain so its protocol enforces "is this spend allowed, yes or no."

A **smart-contract chain** is designed to run programs. Transactions on a smart-contract chain can invoke contracts that read shared state, perform computations, conditionally move money, and write new state back. The chain's protocol cares about all the same things a coin chain cares about, plus a whole layer of execution: which contracts get called, what they're allowed to do, how much computation costs, and how the resulting state changes get committed. Ethereum and Solana are canonical smart-contract chains. 

A **smart contract** is a program that lives at its own address on the chain, has its own storage, and can hold funds. Anyone can call it by submitting a transaction that points at its address. When called, it runs whatever code its creator deployed and updates its own state accordingly. The chain enforces the contract's rules: whatever the code says happens, happens, and nobody can override that. Tokens, NFTs, decentralised exchanges, and lending markets are all smart contracts, or collections of them working together. 

The distinction is important because it determines what's possible on the chain which is building payment systems, lending markets, exchanges, identity systems, prediction markets, in-game economies, ownership records, and arbitrary applications that combine those. 

It also matters because it determines what kind of developer you'll be. Bitcoin development is a specialty focused on payment infrastructure and protocols built on top of Bitcoin. Smart-contract development is general-purpose application development on shared state, and it's where the bulk of web3 jobs are. 
