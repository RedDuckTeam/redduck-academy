---
id: 69
title: Where blockchain fits in web3
type: lecture
order: 2
faq:
  - question: Which layer does everything else in web3 depend on?
    answer: >-
      The DLT / Blockchain layer, the trust layer. Smart-contracts (On-chain programs) sit on top of it.
  - question: What is a smart contract?
    answer: >-
      An on-chain program, that runs on a blockchain.
  - question: What can a blockchain do that a normal web service cannot?
    answer: >-
      Immutable transactions, censorship-resistance and self-custodial ownership with global reach.
---

We've established that web3 is the version of the internet where users actually own their identity and content. What makes that possible is a stack of layers built on top of blockchain, with smart contracts as the connective layer between them. For any of it to work, everything has to start with the core layer: the blockchain itself.

## The stack

The diagram below shows the stack. Each layer depends on the one beneath it:

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Web3 stack: Wallets, Applications, Smart contracts, and Blockchain</title><desc>Four stacked layers from top to bottom: Wallets, Applications, Smart contracts, and Blockchain. The bottom Blockchain layer is highlighted as the trust layer, shared and tamper-evident with no central operator, that everything above depends on.</desc>
  <!-- Wallets at top -->
  <rect x="60" y="20" width="600" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="50" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Wallets</text>
  <text x="360" y="70" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Self-custodial and custodial wallets that let users make transactions</text>
<!-- dApps layer -->
  <rect x="60" y="100" width="600" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="125" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">[Decentralized] applications</text>
  <text x="360" y="145" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Decentralized finance, governance, gaming,</text>
  <text x="360" y="163" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">social, lending, identity, earning, tokenization, crowdfunding</text>

<!-- Smart contracts layer -->
  <rect x="60" y="196" width="600" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="226" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Smart contracts (on-chain programs)</text>
  <text x="360" y="246" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Programs that hold value and execute the actions the applications above them request</text>

<!-- Blockchain layer (highlighted) -->
  <rect x="60" y="276" width="600" height="80" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="301" text-anchor="middle" font-size="15" fill="#ffffff" font-weight="bold">DLT / Blockchain</text>
  <text x="360" y="321" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">The distributed ledger, the core layer</text>
  <text x="360" y="338" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">Handles the shared, tamper-resistant recording of transactions without a central operator</text>
</svg>

## Layer 1: DLT

DLT <i>(Distributed Ledger Technology)</i> is the core layer everything else depends on. Blockchain is the most common type of DLT; however, plenty of DLTs aren't blockchains at all.

A DLT is a shared record of state, replicated and agreed upon across thousands of computers. It's decentralized, and it can only be modified according to a set of in-system rules. The ledger doesn't store final data; it stores the actions, which are **transactions**, that lead to that data.

Blockchain protects data from tampering with a "chain" where every block depends on the one before it. If someone tampers with an earlier block, every block after it would need to be changed too, which makes tampering either practically impossible or immediately obvious.

## Layer 2: On-Chain Programs (Smart Contracts)

The smart contract layer depends on the blockchain layer: you can't have an on-chain program without having a chain to run it on. Blockchains execute these programs and validate their behaviour automatically. Every action has to follow the blockchain's protocol rules, or it gets rejected immediately by the majority of the blockchain validators.

## Layer 3: [De]centralized applications

Decentralized applications, or dApps, use on-chain programs to give end users an actual interface to interact with. For example, a lending dApp like <a href="https://app.aave.com/">Aave</a> shows users a straightforward interface and uses on-chain programs that contain the lending and borrowing features. dApps also include NFT marketplaces, decentralized exchanges, and even decentralized games, like gambling based on verifiable random functions.

## Layer 4: Wallets

When you interact with a decentralized application, it asks you to confirm the transaction. Web3 is self-custodial: your data and identity belong to you, not the platform, so all you have to do is click Confirm in the wallet application. The wallet holds the keys that sign the transactions on your behalf once you confirm them.

If a transaction is sent without a valid signature, it is automatically rejected; the network won't even get as far as checking it against the rules of layers 2 and 3.

The stack is the whole point. Nearly everything you've ever heard described as web3 lives somewhere inside it. This course is about the bottom layer. Once you understand that layer, everything above it starts making a lot more sense.

## What a blockchain actually gives you

Blockchains don't do anything magical. What they do is achieve certain things better, through their architecture, than any alternative can.

**Permanent ownership.** When you hold something on the chain (a coin, a username, or any kind of digital asset), it's recorded in a way that no single party can revoke. The block dependency mechanism helps achieve that (more on that later), which makes it extremely difficult, in a computational sense, to revoke anything that you possess, unless what you possess has explicit rules making it revocable through a transaction somebody else can perform. Even if your asset is revoked, the transactions in which you had the asset will not be reverted, so you will still preserve the history of the events.

**Programmable money.** Money in web2 is a database entry at a bank, governed by software you can't read and can't interact with. The software is bound by banking hours, settlement windows, and rules that change every few years. Money on a public blockchain is a value in a shared ledger: transferable in seconds, at any hour, governed by on-chain programs that anyone can read.

A trade that would take a bank's settlement system three working days happens in seconds or minutes. A loan that would normally take a credit check, a meeting, and a signature can be issued by a smart contract in a single transaction, because it meets the protocol's public, pre-configured rules.

That's why anyone can build their own version of a lending system, a governance protocol, an insurance protocol, or a yield-generating one. Money on-chain is programmable, and the only real limits are the deterministic nature of blockchains and your own imagination.

**Global by default.** A new app on a public blockchain is reachable on day one by a teenager in Lagos, a developer in Buenos Aires, a small business in Manila, and a fund manager in Singapore. There's no compliance manager flying around the world closing deals to make the app legal in each country. The chain doesn't ask where you're from; it's just a shared protocol that anyone with an internet connection can use, along with the products built on top of it.

These properties are built directly into the layer where apps live, free and unrestricted, rather than under the control of an organization that could take them away at any moment. That's what makes entirely new categories of products possible, ones that couldn't have existed before.

## What's next

Next up is the cryptography lesson, which explains how cryptography makes the blockchain layer possible in the first place.

Hashes, keys, signatures: the actual mathematics behind "no one can fake this."

These words can sound intimidating if you're not technical, but the underlying concepts are simple, nowhere near rocket-science territory.

See you there!
