---
id: 101
title: The account model
type: lecture
order: 1
faq:
  - question: What does an Ethereum account store?
    answer: >-
      Four fields. A balance in wei, where one ETH is 10^18 wei. A nonce that counts the
      transactions it has sent. A code hash and a storage root, empty for user accounts and
      pointing at the deployed bytecode and the storage tree for contract accounts.
  - question: Why does every transaction need a nonce?
    answer: >-
      To stop replays and fix ordering. The chain accepts a transaction only when its nonce
      matches what it expects from that account. Nonce 6 waits until nonce 5 is in a block.
  - question: Can anyone sign a transaction from a contract account?
    answer: >-
      No. A contract account has no private key. Its code runs only when another account
      calls it, and that code decides what happens to the balance and the storage.
  - question: Do the transactions in a block run in parallel?
    answer: >-
      No. Two of them can touch the same account, so the protocol applies them one after
      another in block order.
---

> Bitcoin tracks money as discrete coins that get consumed and recreated. Ethereum tracks money as account balances that get modified in place. This change cascades into everything else: how transactions look, what state means, how contracts hold funds, why nonces exist.

## A program needs a place to keep its data

Bitcoin's state, as the lesson on [the UTXO model](/courses/blockchain-basics/bitcoin/the-utxo-model) showed, is the set of currently unspent outputs, each locked to an address by a script. A set of locked coins has nowhere for a program's data to live between transactions.

Ethereum uses a different model called the **account model**. Instead of tracking individual coins, the chain tracks accounts. Each account has an address, a balance of ETH, and possibly some additional state. For a contract, that additional state is storage: key-value pairs that persist across calls, which the contract's code reads and writes as transactions come in. Each account has its own slice of storage that the protocol tracks, so a contract can have a million users with a million different balances stored in it. This is hard to express in UTXOs.

## What an Ethereum account contains

An account on Ethereum has four fields:

- A **balance** of ETH, stored as an integer in wei, where one ETH is 10^18 wei
- A **nonce**, which is a counter that increases by one with every transaction the account sends
- A **code hash**, which is empty for regular user accounts and points to the deployed bytecode for contract accounts
- A **storage root**, which is empty for regular user accounts and points to the contract's storage tree for contract accounts

Two kinds of accounts exist. **Externally owned accounts**, or EOAs, are controlled by a private key. Their code hash and storage root are empty. They behave like a Bitcoin address: you sign transactions with the matching key to spend their balance or trigger something else on the chain. **Contract accounts** are controlled by code. They have a balance like any other account, but they also have code that runs when called and storage that persists between calls. They have no private key, so nobody can sign transactions from a contract account. The only way to move a contract's funds or change its state is to call its code from another account, and the code decides what happens.

The chain's state at any moment is the combined state of every account that exists: balances, nonces, and, for contract accounts, code and storage. When a block is produced, every full node applies the block's transactions to this state, computes the new state, and rejects the block if its claimed result doesn't match.

## A payment changes two balances in place

In Bitcoin, if Alice has a single 10 BTC UTXO and wants to send 3 BTC to Bob, her transaction consumes that UTXO and creates two new ones: 3 BTC locked to Bob's address, and 7 BTC locked back to one of her own addresses as change. In Ethereum, if Alice has a balance of 10 ETH and wants to send 3 ETH to Bob, her transaction just says: send 3 ETH to Bob. After the transaction, her balance is 7 and Bob's balance has increased by 3. Nothing gets consumed or created, so there is no change output.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Bitcoin UTXO model vs Ethereum account model for Alice's payment to Bob</title><desc>On the left, Bitcoin's UTXO model spends Alice's 10 BTC UTXO and creates two new UTXOs: 3 BTC for Bob and 7 BTC change back to Alice. On the right, Ethereum's account model just updates balances in place, from Alice 10 ETH and Bob 0 ETH before, to Alice 7 ETH and Bob 3 ETH after.</desc>
  <defs>
    <marker id="arr21u" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<text x="180" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">UTXO model (Bitcoin)</text>
  <text x="540" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Account model (Ethereum)</text>

<line x1="360" y1="20" x2="360" y2="440" stroke="#565653" stroke-width="1" stroke-dasharray="4 4"/>

<text x="20" y="65" font-size="11" fill="#565653" font-style="italic">Before</text>

<rect x="40" y="75" width="280" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="98" text-anchor="middle" font-size="11" fill="#000000">Alice's UTXO</text>
  <text x="180" y="120" text-anchor="middle" font-family="monospace" font-size="13" fill="#ed4937">10 BTC</text>

<text x="380" y="65" font-size="11" fill="#565653" font-style="italic">Before</text>

<rect x="400" y="75" width="280" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="430" y="100" font-family="monospace" font-size="11" fill="#000000">Alice:</text>
  <text x="660" y="100" text-anchor="end" font-family="monospace" font-size="11" fill="#ed4937">10 ETH</text>
  <text x="430" y="122" font-family="monospace" font-size="11" fill="#000000">Bob:</text>
  <text x="660" y="122" text-anchor="end" font-family="monospace" font-size="11" fill="#000000">0 ETH</text>

<text x="20" y="170" font-size="11" fill="#565653" font-style="italic">Transaction</text>

<rect x="40" y="180" width="280" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="205" text-anchor="middle" font-size="11" fill="#000000" font-weight="bold">Alice sends 3 BTC to Bob</text>
  <line x1="60" y1="218" x2="300" y2="218" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="238" font-family="monospace" font-size="10" fill="#565653">input:  Alice's 10 BTC UTXO</text>
  <text x="60" y="256" font-family="monospace" font-size="10" fill="#565653">output: 3 BTC to Bob</text>
  <text x="60" y="272" font-family="monospace" font-size="10" fill="#565653">output: 7 BTC back to Alice</text>

<text x="380" y="170" font-size="11" fill="#565653" font-style="italic">Transaction</text>

<rect x="400" y="180" width="280" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="205" text-anchor="middle" font-size="11" fill="#000000" font-weight="bold">Alice sends 3 ETH to Bob</text>
  <line x1="420" y1="218" x2="660" y2="218" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="420" y="238" font-family="monospace" font-size="10" fill="#565653">from:   Alice</text>
  <text x="420" y="256" font-family="monospace" font-size="10" fill="#565653">to:     Bob</text>
  <text x="420" y="272" font-family="monospace" font-size="10" fill="#565653">value:  3 ETH</text>

<line x1="180" y1="280" x2="180" y2="320" stroke="#565653" stroke-width="2" marker-end="url(#arr21u)"/>
  <line x1="540" y1="280" x2="540" y2="320" stroke="#565653" stroke-width="2" marker-end="url(#arr21u)"/>

<text x="20" y="335" font-size="11" fill="#565653" font-style="italic">After</text>

<rect x="40" y="345" width="135" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="107" y="368" text-anchor="middle" font-size="10" fill="#000000">Bob's UTXO</text>
  <text x="107" y="392" text-anchor="middle" font-family="monospace" font-size="13" fill="#ed4937">3 BTC</text>
  <text x="107" y="412" text-anchor="middle" font-size="9" fill="#565653" font-style="italic">(new)</text>

<rect x="185" y="345" width="135" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="252" y="368" text-anchor="middle" font-size="10" fill="#000000">Alice's UTXO</text>
  <text x="252" y="392" text-anchor="middle" font-family="monospace" font-size="13" fill="#ed4937">7 BTC</text>
  <text x="252" y="412" text-anchor="middle" font-size="9" fill="#565653" font-style="italic">(new, change)</text>

<text x="380" y="335" font-size="11" fill="#565653" font-style="italic">After</text>

<rect x="400" y="345" width="280" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="430" y="370" font-family="monospace" font-size="11" fill="#000000">Alice:</text>
  <text x="660" y="370" text-anchor="end" font-family="monospace" font-size="11" fill="#ed4937">7 ETH</text>
  <text x="430" y="392" font-family="monospace" font-size="11" fill="#000000">Bob:</text>
  <text x="660" y="392" text-anchor="end" font-family="monospace" font-size="11" fill="#ed4937">3 ETH</text>
  <text x="540" y="416" text-anchor="middle" font-size="9" fill="#565653" font-style="italic">(balances updated in place)</text>

<text x="360" y="450" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Same payment. Completely different state representation.</text>
</svg>

## Reading state gets simpler, parallelism and privacy get worse

**State changes are simpler to reason about.** In Bitcoin, "what is Alice's balance" requires scanning the entire UTXO set for outputs locked to her addresses and summing them. In Ethereum, "what is Alice's balance" is one lookup in the state table. This makes contract code simpler. A token contract just keeps a mapping from address to balance and updates it on every transfer. The protocol doesn't need to know what the contract is doing, because the contract manages its own state.

**Parallelism is harder.** Two Bitcoin transactions that touch different UTXOs are independent and can be processed in parallel. Two Ethereum transactions that touch the same account may conflict. The Ethereum protocol processes transactions sequentially within a block to handle this. Most newer chains, including Solana, build elaborate machinery to recover the parallelism Ethereum gave up.

**One address links a whole history.** Every transaction an account sends is tied to the same address, so anyone who knows that the address is Alice's can read everything she has done with it. In the UTXO model Alice can keep her coins under many addresses, and the chain has no permanent identifier that ties them to her.

## The nonce stops a signed transaction from being replayed

Recall the **nonce** from the account fields. It starts at zero, and Alice includes her current value in every transaction she signs. The chain only accepts the transaction if the nonce matches what it expects from Alice's account.

The nonce exists because the account model has a problem the UTXO model doesn't. In Bitcoin, a transaction is uniquely identified by the UTXOs it consumes. If Alice broadcasts the same transaction twice, the second one fails because the first one already consumed the input. Replay is impossible by construction.

In Ethereum, a transaction is "send 3 ETH from Alice to Bob." If someone rebroadcasts that same signed transaction, the network needs a way to tell it's the same one, and the nonce gives it one. The first transaction Alice sends has nonce 0. If the network sees a second transaction from Alice with nonce 0, it rejects it as a duplicate. Alice's next transaction must use nonce 1, the one after that nonce 2, and so on.

The nonce also enforces ordering. If Alice broadcasts transactions with nonces 5, 6, and 7, the network will include them in that order regardless of when they arrive. Transaction 6 can't be processed until transaction 5 is in a block. This matters for contracts that depend on a specific sequence of calls. The nonce is also how a pending transaction gets replaced: Alice sends a new transaction with the same nonce and a higher fee, and whoever produces the next block takes the one that pays more.

## Ask what stops a signed message from being used twice

Whenever a signed message moves value, ask what stops the same signed message from being submitted again. For a transaction, the protocol answers with the account's nonce. When your own contract accepts signatures, as in [gasless approvals](/courses/development-on-ethereum/advanced-defi/gasless-approvals), the contract has to keep that counter itself.
