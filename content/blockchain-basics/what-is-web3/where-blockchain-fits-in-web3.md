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

## The stack
What makes owning your identity and content on the web3 possible? Correct, the blockchain.

Please take a look at ahe diagram below, illustrating the stack where each layer depends on the one below:

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
DLT, Distributed Ledger Technology, is a shared record of state, replicated across thousands of computers, agreed on by all of them. The ledger part means that we're storing the actions that lead to the final data, namely **transactions**. Because it's a decentralized technology, the ledger is modifiable only by certain rules. Blockchains are one of the DLT types, yet many other DLTs aren't blockchains, such as <a href="https://hedera.com/"></a>. Blockchains protect data tampering by including a "chain" in which every node is dependent on the previous node. If any data on the previous nodes is tampered, the following nodes have to be amended as well. 

## Layer 2: On-Chain programs (Smart Contracts)
The smart contract layer depends on the blockchain layer, because you can't make an on-chain program without having the chain. Blockchains run these programs and validate their behaviour. It's automatic as the behaviour should adhere to the blockchain protocol's rules, otherwise, it will be rejected automatically by the majority of blockchain validators.

## Layer 3: [De]centralized applications

Decentralized applications, or dApps, utilize the on-chain programs in order to display certain user experience to the end users. For example, a lending dApp such as <a href="https://app.aave.com/">Aave</a> shows a nice and convenient UI to the end users. At the same time, the application utilizes on-chain programs that contain the lending and borrowing functionality. There are plenty of dApps: NFT Marketplaces, Decentralized Exchanges, and even decentralized games (such as gambling based on verifiable random functions).

## Layer 4: Wallets

What happens when you attempt to interact with a decentralized application is it will ask you to confirm the transaction in your wallet. Because Web3 is self-custodial in data and identity, you have to sign your own actions. You do that by clicking **Confirm** on your Wallet application, which contains your keys and signs the transactions on your behalf upon your confirmation.

If you were to send a transaction without a valid signature, it just wouldn't be accepted by the network and get automatically rejected; not even subject to conditions and specifics of Layers #2 and #3 of this stack. 

Majority, if not everything you've ever heard described as web3, lives inside it. The **Blockchain Basics** course is about the bottom layer, because once you understand it, every layer above will make a lot more sense.

## What a blockchain actually gives you

**Permanent ownership.** When you hold something on the chain (a coin, a username, any kind of digital asset) – no single party can reject it thanks to the node dependency mechanism (more on that later). Theoretically, what you own can be withdrawn through a transaction performed by somebody else however again, you need the asset to preserve such situations.

**Programmable money.** Money in web2 is database entries at a bank, governed by software you can't read or interact with, and bound by banking hours, settlement windows, and rules that change every few years. Money on a public blockchain is a value within a shared ledger, transferable in seconds at any hour, controlled by on-chain programs that anyone can read. 

**Global by default.** A new app on a public blockchain is reachable on day one by a teenager in Lagos, a developer in Buenos Aires, a small business in Manila, and a fund manager in Singapore. The chain doesn't ask where you are because it's a shared protocol that everyone with an internet connection can use.
