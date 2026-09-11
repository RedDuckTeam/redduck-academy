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

So far we know that web3 is the version of the internet where users actually own their identity and content. But let's see what part makes that possible. There's a whole stack to it: applications sit on top and use smart-contracts, but everything in the end is dependent on the core layer of a blockchain.

## The stack

The diagram below shows the stack. Each layer depends on the one below it:

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Web3 stack: Wallets, Applications, Smart contracts &amp; Blockchain</title><desc>Four stacked layers from top to bottom: Wallets, Applications, Smart contracts &amp; and Blockchain. The bottom Blockchain layer is highlighted as the trust layer, shared and tamper-evident with no central operator, that everything above depends on.</desc>
  <!-- Wallets at top -->
  <rect x="60" y="20" width="600" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="50" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Wallets</text>
  <text x="360" y="70" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Self-custodial and custodial wallets allowing users to perform transaction</text>
<!-- dApps layer -->
  <rect x="60" y="100" width="600" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="125" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">[Decentralized] Applications</text>
  <text x="360" y="145" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Decentralized Finance, Decentralized Governance, Decentralized Gaming</text>
  <text x="360" y="163" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Social, Lending, Identity, Earning, Tokenization, Crowdfunding</text>

<!-- Smart contracts layer -->
  <rect x="60" y="196" width="600" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="226" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Smart Contracts (On-chain programs)</text>
  <text x="360" y="246" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">Programs holding value allowing to perform actions mentioned in applications above</text>

<!-- Blockchain layer (highlighted) -->
  <rect x="60" y="276" width="600" height="80" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="301" text-anchor="middle" font-size="15" fill="#ffffff" font-weight="bold">DLT / Blockchain</text>
  <text x="360" y="321" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">Distributed Ledger, the Core layer</text>
  <text x="360" y="338" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">Handles the shared & tamper-resistant recording of transactions without a central operator</text>
</svg>

## Layer 1: DLT
The DLT <i>(Distributed Ledger Technology)</i> itself is the core layer everything else depends on. Blockchains are one-of-many DLTs types, so even though it's the most frequently used one, it's still worth noting there are many other DLTs that aren't blockchains, such as <a href="https://hedera.com/"></a>. 

A DLT is a shared record of state, replicated across thousands of computers, agreed on by all of them. Because it's a decentralized technology, the ledger is modifiable only by following rules built into the system. The ledger part means that we're not storing the final data itself, we're storing the actions that led to the final data, namely **transactions**.

Blockchains protect data tampering by including a "chain" in which every node is dependent on the previous node, so if any data on the previous nodes is tampered, the following nodes have to be amended as well, which makes it either impossible to do, or very obvious to spot.

## Layer 2: On-Chain PROGRAMS (SMART CONTRACTS)
The smart contract layer depends on the blockchain one, because you can't make an on-chain program without having the chain. Blockchains run these programs and validate their behaviour. It is automatic as the behaviour should adhere to the blockchain protocol's rules, otherwise it would be rejected automatically by the majority of blockchain validators.

## Layer 3: [De]centralized applications

Decentralized applications (also called dApps) utilize the on-chain programs in order to display certain user experience to the end users. For example, a lending dApp such as <a href="https://app.aave.com/">Aave</a> shows a nice and convenient UI to the end users, but at the same time, utilizes on-chain programs that contain the lending and borrowing functionality. There are plenty of dApps - NFT Marketplaces, Decentralized Exchanges, and even decentralized games (such as gambling based on verifiable random functions).

## Layer 4: Wallets

What happens when you attempt to interact with a decentralized application, is it will ask you to confirm the transaction in your wallet. Because Web3 is self-custodial in data and identity, you have to sign your actions yourself. You do that by just clicking "Confirm" on your separate Wallet application, which in turn contains your keys and signs the transactions on your behalf upon your confirmation.

If you were to send a transaction without a valid signature, it just wouldn't be accepted by the network and would be automatically rejected, not even subject to conditions and specifics of the Layers #2 and #3 of this stack. 

This stack is the whole point. Majority, if not everything you've ever heard described as web3 lives inside it. The course you're reading right now is about the bottom layer, because once you understand the bottom layer, every layer above it starts making a lot more sense instantly.

## What a blockchain actually gives you

Blockchains don't do anything magical. They simply achieve a few very specific things that just happen to be achievable with the blockchain architecture better than with anything else:

**Permanent ownership.** When you hold something on the chain, whether it's a coin or a username, or any kind of digital asset, it's recorded in a way that no single party can revoke. This is achieved with the node dependency mechanism (through cryptographic hash functions - more on that later), which makes it extremely difficult in computational sense to revoke anything that you possess. Unless, what you possess has explicit rules of being revokable through a transaction somebody else can perform. Even if your asset were to be revoked, the transactions in which you had the asset would not be reverted, so you would still preserve the history of the events.

**Programmable money.** Money in web2 is database entries at a bank, governed by software you can't read and can't interact with, and bound by banking hours, settlement windows, and rules that change every few years unilaterally. Money on a public blockchain however, is a value within a shared ledger, transferable in seconds at any hour, controlled by on-chain programs that anyone can read. 

A trade that would take a bank settlement system three working days happens in seconds or minutes. A loan that would take a credit check, a meeting, and a signature can be issued by a smart contract in one transaction, because it matches the configured public protocol rules.

With that in mind, anybody can create their own version of a lending system, a governance or insurance protocol, or an earnings one. Hence, the money on-chain are programmable and the only limit is the deterministic nature of a blockchain and your imagination. 

**Global by default.** A new app on a public blockchain is reachable on day one by a teenager in Lagos, a developer in Buenos Aires, a small business in Manila, and a fund manager in Singapore. There is no compliance manager flying around closing deals to make the app legal. The chain doesn't ask where you are. It's just a shared protocol that everyone with an internet connection can use, and so can we use the products inside of it.

Taken together, these properties are built into the layer where apps live, free and unlimited, rather than under control of an organization that can take them away at any moment. They enable categories of products that could not exist before.

## What's next

Next comes the cryptography lesson that explains how cryptography makes the blockchain layer possible at all. 

Hashes, keys, signatures, the actual mathematics of "no one can fake this".

For non-technical people, these words can be scary, but in reality, the high-level concept is very simple and is far away from rocket-science difficulty. 

You'll see!
