---
id: 84
title: The UTXO model
type: lecture
order: 2
faq:
  - question: What is a UTXO?
    answer: >-
      An unspent transaction output. One coin created by an earlier transaction, with its own
      value and owner, waiting to be used as the input of a later one.
  - question: Where is my Bitcoin balance actually stored?
    answer: >-
      Nowhere as a single number. Bitcoin tracks individual unspent coins, and your balance
      is the sum of the ones you can spend.
  - question: What is a satoshi?
    answer: >-
      One hundred-millionth of a bitcoin. Output values are stored as whole satoshis.
  - question: Why does my wallet send part of a payment back to me?
    answer: >-
      You cannot split a coin. Paying 0.3 BTC out of a 1.0 BTC coin destroys the 1.0 coin
      and creates 0.3 for the recipient plus a change coin of nearly 0.7 for you.
  - question: How does the miner get paid if there is no fee field?
    answer: >-
      Inputs minus outputs. The gap goes to whoever includes the transaction in a block.
  - question: Why does Bitcoin use the UTXO model instead of account balances?
    answer: >-
      Validation stays local. A node checks that the input coins are still unspent, that
      each unlocking script satisfies the coin's locking script, and that the outputs do not
      exceed the inputs. No balance table to scan, no ordering problem, and transactions
      touching different coins can be validated in parallel.
---

## Two ways to track money

Imagine you want to build a digital payment system. 

The first way is the **account model**: the payment keeps a table where each row has a user and a balance. To send money, you decrement one row and increment another; to check a balance, you look up the row. 

The second way is the **UTXO model**, the one Bitcoin uses. Here, the system keeps a set of coins where each coin has a specific value and a specific owner. To send money, you destroy some of your coins and create new ones for the recipient; to check a balance, you scan for every coin still belonging to you and add them up.

UTXO stands for **Unspent Transaction Output**. Every coin in Bitcoin started life as the output of some past transaction and has not yet been spent by being used as the input of a later one. The set of every UTXO across the chain is what Bitcoin nodes actually track. 

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Account balance table compared to Bitcoin's UTXO set of coins</title><desc>On the left, the account model is a table of balances: Alice has 2.5 BTC, Bob has 0.8 BTC, Carol has 1.2 BTC; paying means updating two rows, and reading a balance means looking up a row. On the right, the UTXO model is a set of coins, such as a 1.0 BTC coin owned by Alice or a 0.3 BTC coin owned by Bob; paying means destroying some coins and creating new ones, and reading a balance means summing your coins.</desc>
  <!-- Account model column -->
  <text x="180" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Account model</text>
  <text x="180" y="50" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">a table of balances</text>

<rect x="40" y="70" width="280" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="95" font-size="12" fill="#000000" font-weight="bold">Account</text>
  <text x="240" y="95" font-size="12" fill="#000000" font-weight="bold">Balance</text>
  <line x1="50" y1="105" x2="310" y2="105" stroke="#565653" stroke-width="1"/>

<text x="60" y="130" font-family="monospace" font-size="11" fill="#000000">Alice</text>
  <text x="240" y="130" font-family="monospace" font-size="11" fill="#000000">2.5 BTC</text>

<text x="60" y="160" font-family="monospace" font-size="11" fill="#000000">Bob</text>
  <text x="240" y="160" font-family="monospace" font-size="11" fill="#000000">0.8 BTC</text>

<text x="60" y="190" font-family="monospace" font-size="11" fill="#000000">Carol</text>
  <text x="240" y="190" font-family="monospace" font-size="11" fill="#000000">1.2 BTC</text>

<text x="60" y="220" font-family="monospace" font-size="11" fill="#565653">...</text>

<text x="180" y="295" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">to pay: update two rows</text>
  <text x="180" y="312" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">to read balance: look up the row</text>

<!-- UTXO model column -->
  <text x="540" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">UTXO model</text>
  <text x="540" y="50" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">a set of coins</text>

<rect x="400" y="70" width="280" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<rect x="415" y="85" width="120" height="40" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="475" y="102" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">coin: 1.0 BTC</text>
  <text x="475" y="118" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff">owner: Alice</text>

<rect x="545" y="85" width="120" height="40" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="605" y="102" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">coin: 1.5 BTC</text>
  <text x="605" y="118" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff">owner: Alice</text>

<rect x="415" y="135" width="120" height="40" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="475" y="152" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">coin: 0.3 BTC</text>
  <text x="475" y="168" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">owner: Bob</text>

<rect x="545" y="135" width="120" height="40" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="605" y="152" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">coin: 0.5 BTC</text>
  <text x="605" y="168" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">owner: Bob</text>

<rect x="415" y="185" width="120" height="40" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="475" y="202" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">coin: 1.2 BTC</text>
  <text x="475" y="218" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">owner: Carol</text>

<text x="605" y="210" font-family="monospace" font-size="11" fill="#565653">...</text>

<text x="540" y="295" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">to pay: destroy some, create new</text>
  <text x="540" y="312" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">to read balance: sum your coins</text>
</svg>

In the account model, "Alice has 2.5 BTC" is a fact stored in one place. In the UTXO model, Alice has 2.5 BTC because she happens to hold two unspent coins worth 1.0 and 1.5. Her balance is a derived quantity that the system computes by summing her coins. The chain only knows about those two specific coins.

## How a payment actually works

The UTXO model produces a way of paying that feels strange the first time you see it. A transaction takes one or more existing coins as inputs, destroys them, and creates one or more new coins as outputs. The total value of the new coins has to equal the total value of the old coins, minus a small fee that goes to whoever includes the transaction in a block.

Now imagine Alice wants to send 0.3 BTC to Bob. She holds the 1.0 BTC coin from the example above. The only viable option here is "destroy old coins, create new coins". So Alice's payment has to be structured as follows:

Her transaction takes her 1.0 BTC coin as the input; that coin is destroyed in the process. She creates two new coins as outputs: one coin worth 0.3 BTC, owned by Bob; the other's worth a little less than 0.7 BTC, owned by Alice. The difference between both the input and the output value is the fee.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>UTXO transaction: 1.0 BTC input splits into 0.3 BTC and 0.699 BTC outputs</title><desc>A 1.0 BTC coin owned by Alice is destroyed as the input and replaced by two new output coins: 0.3 BTC for Bob and 0.699 BTC change for Alice. The transaction box shows in: 1.0 BTC, out: 0.3 + 0.699 BTC, fee: 0.001 BTC, and the rule in = out + fee.</desc>
  <defs>
    <marker id="arr42" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<!-- Input -->
  <text x="120" y="40" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Inputs (destroyed)</text>

<rect x="40" y="60" width="160" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="120" y="85" text-anchor="middle" font-family="monospace" font-size="12" fill="#ffffff">coin: 1.0 BTC</text>
  <text x="120" y="103" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">owner: Alice</text>

<!-- Transaction node -->
  <rect x="280" y="60" width="160" height="180" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="90" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Transaction</text>
  <text x="360" y="115" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">in: 1.0 BTC</text>
  <text x="360" y="133" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">out: 0.3 + 0.699 BTC</text>
  <text x="360" y="158" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">fee: 0.001 BTC</text>
  <line x1="295" y1="175" x2="425" y2="175" stroke="#565653" stroke-width="1" stroke-dasharray="3 2"/>
  <text x="360" y="200" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">in = out + fee</text>

<!-- Outputs -->
  <text x="600" y="40" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Outputs (created)</text>

<rect x="520" y="60" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="600" y="85" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000">coin: 0.3 BTC</text>
  <text x="600" y="103" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">owner: Bob</text>

<rect x="520" y="140" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="600" y="165" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000">coin: 0.699 BTC</text>
  <text x="600" y="183" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">owner: Alice (change)</text>

<!-- Arrows -->
  <line x1="200" y1="90" x2="280" y2="120" stroke="#565653" stroke-width="2" marker-end="url(#arr42)"/>
  <line x1="440" y1="120" x2="520" y2="90" stroke="#565653" stroke-width="2" marker-end="url(#arr42)"/>
  <line x1="440" y1="160" x2="520" y2="170" stroke="#565653" stroke-width="2" marker-end="url(#arr42)"/>
</svg>

That second output, the one going back to Alice, is called a **change output**. It exists for exactly the same reason change exists in cash. If you owe someone three dollars and you only have a ten in your wallet, you hand over the ten and the other party hands you back seven. UTXOs are the same - you hand the whole coin to the transaction and the transaction hands you a new, smaller coin in return.

After this transaction settles, that  coin is destroyed forever. In its place Alice has a fresh 0.699 BTC coin she didn't have a moment ago, and Bob has a fresh 0.3 BTC coin he didn't have either. The chain's UTXO set has changed: one coin removed, two coins added.

## What's actually inside a transaction

A transaction is a small record with three significant parts: a list of inputs, a list of outputs, and some housekeeping fields like a version number and an optional time lock.

Each **input** has two essential pieces. The first is a pointer back to the specific UTXO being spent. That pointer is the **txid** of the past transaction that created the coin, plus an index into that transaction's output list (called **vout** for "output index"). Together those two values uniquely identify a coin anywhere in the chain's history. The second piece is the data that satisfies the coin's lock, called the **unlocking script** or **scriptSig**, typically a signature and the public key that the signature was produced from.

Each **output** has two essential pieces: the first is the value of the new coin, stored as an integer in **satoshis** (the smallest unit of Bitcoin, one hundred-millionth of one BTC); the second is the **locking script** or **scriptPubKey**, a small program defining the condition the future spender will have to satisfy. The typical condition is "prove ownership of the private key corresponding to this address". 

The "small program" framing is worth pausing on. Each locking condition is written in a stack-based language called **Bitcoin Script**, deliberately limited so that every node can run it cheaply and deterministically. The language only exists to answer one question per transaction: is this spend allowed, yes or no? The most common locking pattern, used in almost every routine payment, is called **Pay-to-Public-Key-Hash**. It locks the coin to a specific public key hash, and the spender unlocks it by providing a signature plus their public key. Other patterns exist, but the shape is always the same: the output sets a condition, the input satisfies it. Bitcoin's intentional choice to keep this language small is one of its defining design decisions. 

<svg role="img" viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Transaction input referencing output 1 of an earlier transaction</title><desc>An earlier transaction has three outputs, and output 1 sends 1.0 BTC to Alice. Alice's new transaction has input 0, which points back to that output using prev_txid and prev_vout, and unlocks it with an unlocking script containing a signature and public key.</desc>
  <defs>
    <marker id="arr42b" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<text x="180" y="25" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Earlier transaction</text>

<rect x="40" y="40" width="280" height="150" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="62" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">txid: d7a52b9c...</text>
  <line x1="55" y1="72" x2="305" y2="72" stroke="#565653" stroke-width="1"/>

<rect x="55" y="82" width="250" height="30" fill="#e0deda" stroke="#565653" stroke-width="1"/>
  <text x="65" y="102" font-family="monospace" font-size="10" fill="#565653">output 0: 0.5 BTC</text>

<rect x="55" y="117" width="250" height="30" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="65" y="137" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">output 1: 1.0 BTC (Alice)</text>

<rect x="55" y="152" width="250" height="30" fill="#e0deda" stroke="#565653" stroke-width="1"/>
  <text x="65" y="172" font-family="monospace" font-size="10" fill="#565653">output 2: 0.3 BTC</text>

<text x="540" y="25" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Alice's new transaction</text>

<rect x="400" y="60" width="280" height="110" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="415" y="85" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">input 0:</text>
  <text x="430" y="105" font-family="monospace" font-size="10" fill="#565653">prev_txid: d7a52b9c...</text>
  <text x="430" y="125" font-family="monospace" font-size="10" fill="#565653">prev_vout: 1</text>
  <text x="430" y="145" font-family="monospace" font-size="10" fill="#565653">unlocking_script: &lt;sig&gt; &lt;pubkey&gt;</text>

<line x1="305" y1="132" x2="400" y2="125" stroke="#565653" stroke-width="2" marker-end="url(#arr42b)"/>
  <text x="352" y="115" text-anchor="middle" font-size="10" fill="#565653" font-style="italic">references</text>

<text x="360" y="220" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">An input points back at a specific output of a specific past transaction.</text>
</svg>

This pointer-based structure is why the chain is best thought of as a directed graph rather than a list of balances. Every coin in existence traces back through a chain of references all the way to a mining reward, and every transaction is a node in that graph that consumes some incoming edges and produces some outgoing ones.

Note that the fee paid to the miner is a computed implicitly as the difference between the total input value and the total output value. If a transaction has 1.0 BTC of inputs and 0.999 BTC of outputs, the 0.001 BTC difference goes to whoever includes the transaction in a block. This is one place where developers writing transaction-construction code go wrong: forget to leave a fee, and your transaction either gets rejected or pays an enormous one to the miner.

## Why this is not as strange as it looks

If you're meeting the UTXO model for the first time, your reaction is probably "this is a complicated way to do something simple". Why not just update Alice's balance and Bob's balance directly, like every database in the world?

The answer goes back to the Bitcoin design philosophy lesson. Bitcoin is designed for a network where there's no operator, every node has to validate every transaction independently, and the validation has to be cheap and deterministic. UTXOs are a way of structuring state that makes that validation easy.

To validate a UTXO transaction, a node has to check three things: the inputs exist as unspent outputs in the current UTXO set; the signature on each input is valid against the coin's owner condition; the output values add up to no more than the input values. Each one is independent of everything else happening on the chain. 

The same validation in an account model has to look up balances, possibly across many accounts, and worry about ordering: if Alice tries to spend her balance in two different transactions at almost the same time, the system has to decide which one wins. The UTXO model can't have that problem because the coins themselves are the unit of state, and each coin can only be spent once.

This local-validation property pays off in three more ways:

**Parallelism.** Two transactions that touch different UTXOs are independent. The network can validate them in parallel without coordination. An account-model transaction touching Alice's balance and another transaction also touching Alice's balance cannot be processed in parallel without locking.

**Privacy.** Each coin has its own owner condition. The chain doesn't have a permanent identifier for a user. Alice can have a hundred different addresses, each holding different coins, and there's no on-chain record that they're all hers. In an account model, every transaction Alice makes is tied to the same account identifier, so her whole history is linked together. The UTXO model has no such per-user identifier, so it never forces that link.

**Audit clarity.** Every coin's history can be traced exactly. This specific coin was created by this transaction, which was funded by these earlier coins, which were created by these even earlier transactions, all the way back to a mining reward. The provenance is built into the data structure rather than bolted on as an audit log.

The trade is that the UTXO model is unfamiliar and uses more storage for the same number of users, because the chain has to track every unspent coin separately rather than a single balance per user; Bitcoin accepts that trade. Meanwhile, several other chains made the opposite trade and use account models instead which works perfectly as well however both optimise for different things.
