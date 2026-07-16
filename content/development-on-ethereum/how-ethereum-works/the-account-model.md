---
id: 101
title: The account model
type: lecture
order: 1
faq:
  - question: What is the difference between Bitcoin's UTXO model and Ethereum's
      account model?
    answer: "Bitcoin tracks money as discrete coins (UTXOs) that get consumed and
      recreated: spending references old outputs as inputs and creates new
      outputs, often including change back to yourself. Ethereum instead tracks
      account balances that change in place, so sending 3 ETH just subtracts 3
      from one balance and adds 3 to another, with no outputs, change addresses,
      or coins consumed. The account model is what lets contracts hold their own
      persistent state."
  - question: Why do Ethereum transactions need a nonce?
    answer: The nonce is a per-account counter that stops transactions from being
      replayed. In Bitcoin, replaying a transaction fails because its inputs
      were already spent, but in Ethereum a message like "send 3 ETH from Alice
      to Bob" could otherwise be rebroadcast. The network only accepts a
      transaction whose nonce matches what it expects, rejecting duplicates, and
      it also enforces ordering, since a transaction with nonce 6 cannot be
      processed until nonce 5 is in a block.
  - question: Why can contracts store their own data on Ethereum but not on Bitcoin?
    answer: "In Bitcoin's UTXO model there is nowhere for a program's data to live
      between transactions, since the chain's state is just a set of locked
      coins. In Ethereum's account model each account has its own slice of
      storage that the protocol tracks, so a contract account can keep key-value
      pairs that persist across calls. That is what makes Ethereum programmable:
      a single contract can hold a million users' balances in its own storage."
---

> Bitcoin tracks money as discrete coins that get consumed and recreated. Ethereum tracks money as account balances that get modified in place. This change cascades into everything else: how transactions look, what state means, how contracts hold funds, why nonces exist. If you only take one new idea from this module, take this one.

## Two ways to track who has what

In the previous module you learned how Bitcoin tracks state with UTXOs: unspent transaction outputs. Every coin in existence is a UTXO sitting in the chain's database, locked to some address by a script. To spend it, you reference it as the input to a new transaction, prove you can satisfy its lock, and create new UTXOs as outputs. The old UTXO is consumed. The new ones are created. The chain's state at any moment is the full set of currently-unspent outputs across all addresses.

Ethereum uses a different model called the **account model**. Instead of tracking individual coins, the chain tracks accounts. Each account has an address, a balance of ETH, and possibly some additional state. When Alice sends 3 ETH to Bob, the chain subtracts 3 from Alice's balance and adds 3 to Bob's balance. Nothing gets consumed or created. The balances just change.

This sounds simpler. It is, conceptually. The implications take longer to absorb.

## What an Ethereum account contains

An account on Ethereum has four fields:

- A **balance** of ETH, stored as an integer in wei, where one ETH is 10^18 wei
- A **nonce**, which is a counter that increases by one with every transaction the account sends
- A **code hash**, which is empty for regular user accounts and points to the deployed bytecode for contract accounts
- A **storage root**, which is empty for regular user accounts and points to the contract's storage tree for contract accounts

Two kinds of accounts exist. **Externally owned accounts**, or EOAs, are controlled by a private key. Their code hash and storage root are empty. They behave like a Bitcoin address: you sign transactions with the matching key to spend their balance or trigger something else on the chain. **Contract accounts** are controlled by code. They have a balance like any other account, but they also have code that runs when called and storage that persists between calls. They have no private key. Nobody can directly sign transactions from a contract account. The only way to move a contract's funds or change its state is to call its code from another account, and the code decides what happens.

The chain's state at any moment is the combined state of every account that exists. Every EOA and every contract. Their balances, their nonces, and, for contract accounts, their code and their storage. When a block is produced, every full node applies the block's transactions to this state, computes the new state, and rejects the block if its claimed result doesn't match.

## Comparing the two models

The same payment looks completely different in the two models.

In Bitcoin, if Alice wants to send 3 BTC to Bob and she has a single 10 BTC UTXO, her transaction consumes that UTXO as its input and creates two outputs: 3 BTC locked to Bob's address, and 7 BTC locked back to one of her own addresses as change. After the transaction, her old UTXO no longer exists. In its place are two new UTXOs, one belonging to Bob and one belonging to her.

In Ethereum, if Alice wants to send 3 ETH to Bob and she has a balance of 10 ETH, her transaction just says: send 3 ETH to Bob. After the transaction, her balance is 7 and Bob's balance has increased by 3. There are no outputs, no change addresses, no UTXOs being consumed.

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

The Bitcoin transaction is a graph operation: it removes one node from the UTXO set and adds two new ones. The Ethereum transaction is a mutation: it changes two existing entries in the account state table. The Bitcoin version preserves nothing. The inputs and outputs are entirely new objects. The Ethereum version preserves the accounts. Only their balances move.

## What the account model gives you

Three things follow from this choice that matter for the rest of this course.

**Contracts can have their own state.** A contract account stores key-value pairs that persist across calls. The contract's code reads and writes this storage as transactions come in. This is what makes Ethereum programmable. In the UTXO model, there is nowhere for a program's data to live between transactions. The chain's state is just a set of locked coins. In the account model, the chain's state has structure: each account has its own slice of storage that the protocol tracks. A contract can have a million users with a million different balances stored in it. This is impossible to express cleanly in UTXOs.

**State changes are simpler to reason about.** In Bitcoin, "what is Alice's balance" requires scanning the entire UTXO set for outputs locked to her addresses and summing them. In Ethereum, "what is Alice's balance" is one lookup in the state table. This makes contract code dramatically simpler. A token contract just keeps a mapping from address to balance and updates it on every transfer. The protocol doesn't need to know what the contract is doing. The contract manages its own state.

**Parallelism is harder.** Two Bitcoin transactions that touch different UTXOs are independent and can be processed in parallel. Two Ethereum transactions that touch the same account may conflict. The Ethereum protocol processes transactions sequentially within a block to handle this. Most newer chains, including Solana, build elaborate machinery to recover the parallelism Ethereum gave up.

## Why nonces exist

There's one more piece of the account that needs explaining.

Recall the **nonce** from the account fields. It starts at zero, and Alice includes her current value in every transaction she signs. The chain only accepts the transaction if the nonce matches what it expects from Alice's account.

The nonce exists because the account model has a problem the UTXO model doesn't. In Bitcoin, a transaction is uniquely identified by the UTXOs it consumes. If Alice broadcasts the same transaction twice, the second one fails because the first one already consumed the input. Replay is impossible by construction.

In Ethereum, a transaction is "send 3 ETH from Alice to Bob." If someone rebroadcasts that same signed transaction, the network needs a way to tell it's the same one. The nonce solves this. The first transaction Alice sends has nonce 0. If the network sees a second transaction from Alice with nonce 0, it rejects it as a duplicate. Alice's next transaction must use nonce 1. Then nonce 2. And so on.

The nonce also enforces ordering. If Alice broadcasts transactions with nonces 5, 6, and 7, the network will include them in that order regardless of when they arrive. Transaction 6 can't be processed until transaction 5 is in a block. This matters for contracts that depend on a specific sequence of calls.

## What this means for the rest of the course

Most of the code you write in this course will assume the account model without naming it. When a token contract does `balances[alice] -= 3` and `balances[bob] += 3`, that's the account model at work, inside a contract. When a transaction reverts halfway through and the chain rolls back the state, that's the account model at work, at the protocol level. When you debug why a transaction "stuck" with the wrong nonce, that's the account model at work, at the wallet level.

The UTXO model produces a kind of cryptocurrency that's good at being money. The account model produces a kind of cryptocurrency that's good at being a platform for running arbitrary programs. Ethereum picked the second one. The rest of this module is what follows from that choice.
