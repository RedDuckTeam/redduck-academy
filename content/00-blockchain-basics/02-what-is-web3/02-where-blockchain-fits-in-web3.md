---
id: 69
title: Where blockchain fits in web3
type: lecture
faq:
  - question: What is the bottom layer that everything in web3 depends on?
    answer: The blockchain itself. It is a shared record of state, copied across
      thousands of computers that all agree on it and that no single company
      runs. Wallets, smart contracts, exchanges, NFTs, and every other web3
      application sit on top of this trust layer, and without it the rest of the
      stack collapses.
  - question: What does a blockchain give you that a normal web2 service can't?
    answer: Four things at once. Permanent ownership that no single party can
      revoke, programmable money that moves in seconds and is controlled by code
      anyone can read, no deplatforming because there is no central operator
      deciding who may participate, and global reach where anyone with an
      internet connection gets the same product on day one.
  - question: What is a smart contract in plain terms?
    answer: A smart contract is a small program that the blockchain runs and whose
      behaviour every node in the network agrees on. Applications like
      decentralised exchanges, NFT marketplaces, and lending protocols are just
      collections of these contracts, combined with wallets that hold the
      cryptographic keys letting you act on the chain.
---

The last lesson described web3 as the version of the internet where users actually own things. This one zooms in on the part that makes that possible. There's a stack, and at the very bottom of it sits one piece of infrastructure that everything else depends on. Wallets sit on top of it. Smart contracts sit on top of it. NFTs, decentralised exchanges, lending protocols, governance systems, on-chain games, decentralised social networks, every single one of them sits on top of it. Pull that piece out and the rest of the stack collapses. That piece is the blockchain.

## The stack

The diagram below shows the stack.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Web3 stack: Users, Applications, Smart contracts &amp; wallets, Blockchain</title><desc>Four stacked layers from top to bottom: Users, Applications, Smart contracts &amp; wallets, and Blockchain. The bottom Blockchain layer is highlighted as the trust layer, shared and tamper-evident with no central operator, that everything above depends on.</desc>
  <!-- Users at top -->
  <rect x="60" y="20" width="600" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="50" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Users</text>

<!-- dApps layer -->
  <rect x="60" y="90" width="600" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="115" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Applications</text>
  <text x="360" y="138" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">DeFi, NFT marketplaces, on-chain games, DAOs,</text>
  <text x="360" y="156" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">decentralised social, lending, exchanges, identity</text>

<!-- Smart contracts layer -->
  <rect x="60" y="190" width="600" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="215" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Smart contracts &amp; wallets</text>
  <text x="360" y="237" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">programs that hold value, keys that authorise actions</text>

<!-- Blockchain layer (highlighted) -->
  <rect x="60" y="270" width="600" height="80" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="298" text-anchor="middle" font-size="15" fill="#ffffff" font-weight="bold">Blockchain</text>
  <text x="360" y="320" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">the trust layer: shared, tamper-evident, no central operator</text>
  <text x="360" y="338" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">everything above depends on this layer being honest</text>
</svg>

Read it bottom up.

The blockchain itself is the deepest layer. It's a shared record of state, replicated across thousands of computers, agreed on by all of them, modifiable only by following rules built into the system. No company runs it. No government can shut it off. No bug in an app on top can corrupt it. That's the trust layer.

Smart contracts and wallets are the layer immediately above. A smart contract is a small program that the blockchain runs and whose behaviour every node agrees on. A wallet is software that holds the cryptographic keys that let you act on the chain. Together, contracts and wallets are how you actually do things with the blockchain.

Applications sit above that. A decentralised exchange is a few smart contracts that let people trade tokens without a broker. An NFT marketplace is a few smart contracts that let people buy and sell digital ownership records. A lending protocol is smart contracts that let people lend and borrow without a bank. An on-chain game is smart contracts whose state is the game state. The variety is enormous, but every one of them is built out of contracts and wallets, which are themselves built out of the blockchain.

Users are at the top. They interact with the applications, sign transactions with their wallets, and never have to think about the layers below unless something breaks.

This stack is the whole point. Everything you've ever heard described as web3 lives inside it. The course you're reading is about the bottom layer, because once you understand the bottom layer, every layer above it gets dramatically easier to learn.

## What the blockchain actually gives you

The blockchain isn't doing anything magical. It's doing a small number of very specific things that no other piece of technology has ever quite been able to do at once. Four of those things matter more than the rest.

**Permanent ownership.** When you hold something on the chain, a coin, a token, an NFT, a username, any kind of digital asset, it's recorded in a way that no single party can revoke. The platform doesn't store it for you. Your bank doesn't hold it. Your government, even the one whose passport you carry, can't reach into the chain and remove it. The asset exists for as long as the chain exists, and only you (with your keys) can move it. This is the thing web2 cannot offer.

**Programmable money.** Money in web2 is database entries at a bank, governed by software you can't read, run by people you can't audit, and bound by banking hours, settlement windows, and rules that change every few years. Money on a public blockchain is a number in a shared ledger, transferable in seconds at any hour, controlled by smart-contract code anyone can read. A trade that would take a bank settlement system three working days happens in seconds or minutes. A loan that would take a credit check, a meeting, and a signature can be issued by a smart contract in one transaction. None of this is hypothetical. It's the everyday substrate of an industry that already moves trillions of dollars a year in on-chain settlement volume.

**No deplatforming.** A YouTuber can be demonetised. A Twitter account can be banned. A merchant can be cut off by their payment processor. A protest can be debanked. The web2 version of every one of these systems has a central operator who decides who is allowed to participate. The web3 version doesn't have an operator at all. The protocol runs itself, and your access to it comes from holding the right keys, not from being on a list someone curates.

**Global by default.** A new app on a public blockchain is reachable on day one by a teenager in Lagos, a developer in Buenos Aires, a small business in Manila, and a fund manager in Singapore. There is no rollout, no per-country negotiation, no banking partner per region, no compliance manager flying around closing deals to make the app legal. The chain doesn't ask where you are. Everyone with an internet connection gets the same product.

Taken individually, each of these properties is incremental. Taken together — and built into the layer where apps live, rather than promised by an app that can take them away at any moment — they enable categories of products that could not exist before.

## Why this layer is the right thing to learn first

The pattern across every era of the internet has been the same. The biggest fortunes, the most interesting careers, and the most consequential companies have been built by people who understood the layer below the layer everyone else was using. Web1 belonged to the people who understood TCP/IP and HTTP. Web2 belonged to the people who understood databases, caching, and how a request actually travelled across the network. Web3 will reward the people who understand what a transaction is, what a block is, what a signature really proves, and what a smart contract actually does when it runs.

A web3 developer who only knows the framework on top is competing with everyone else who only knows the framework on top. A web3 developer who understands the layer below the framework is solving problems the framework wasn't designed for and will be the one writing the next framework.

That's the whole reason this course exists. The next module gets into the cryptography that makes the blockchain layer possible at all. Hashes, keys, signatures, the actual mathematics of "no one can fake this." It's the most technically dense part of the course, but it's also the most rewarding, because by the end of it the rest of the stack starts looking like ordinary software again.
