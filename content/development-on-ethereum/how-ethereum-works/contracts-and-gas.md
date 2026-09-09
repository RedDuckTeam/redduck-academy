---
id: 102
title: Contracts and gas
type: lecture
order: 2
faq:
  - question: Why do I pay gas for a transaction that failed?
    answer: >-
      Every node already did the work. The validator keeps the priority fee, the base fee is
      burned, and the reverted transaction still took a slot in a block.
  - question: What does a transaction cost in ETH?
    answer: >-
      Gas used times gas price. Prices are quoted in gwei, one billionth of an ETH. A plain
      transfer uses about 21,000 gas and a complex DeFi call 200,000 to 500,000, at 10 to 50
      gwei per unit on mainnet in 2025.
  - question: What is the difference between the base fee and the priority fee?
    answer: >-
      The base fee is set by the protocol and burned, so nobody receives it. It targets blocks
      that are 50% full and moves up or down by at most 12.5% per block. The priority fee is
      your tip and goes to the validator who produced the block. EIP-1559 introduced the split
      in August 2021.
  - question: My transaction is stuck pending. Can I cancel it?
    answer: >-
      Yes. Send a new transaction with the same nonce and a higher fee, and validators take
      the more profitable one. A do-nothing transaction cancels the original. Until that nonce
      clears, everything behind it from the same account is stuck.
  - question: Why does storing a value cost so much more than adding two numbers?
    answer: >-
      Every full node holds stored data forever until something overwrites it, while a
      computation disappears when the transaction ends. Adding two numbers costs 3 gas,
      multiplying 5, writing a new word to storage 22,100. Clearing a slot back to zero earns
      a partial refund.
  - question: How is a contract's address decided?
    answer: >-
      The lowest 20 bytes of keccak256 over the sender and the sender's nonce. CREATE2
      substitutes a salt you choose, so the address can be computed before deploying.
---

> A smart contract is a piece of code that lives at an address on the chain, has its own storage, and runs whenever someone calls it. Running it is not free. Every operation the code performs costs a small amount of a metering unit called gas, and gas is paid in ETH. These two facts, contracts and gas, are inseparable: gas exists because contracts exist, and contracts only work because gas keeps their execution bounded.

## What a contract is at runtime

A contract is a kind of account. Like any account on Ethereum, it has a balance of ETH and a nonce. Unlike an EOA, it also has code and storage. The code was deployed once when the contract was created, and from that point onward it lives at the contract's address. The storage is a mapping from 256-bit keys to 256-bit values that the contract's code reads and writes as it runs.

A contract is created by sending a special transaction whose `to` field is empty and whose `data` field contains creation code. When the transaction is mined, the EVM runs that creation code, which returns the contract's runtime bytecode. The protocol computes the contract's address as the lowest 20 bytes of `keccak256(sender, sender_nonce)`, places the bytecode there, and from then on the contract exists. There's a second deployment opcode called `CREATE2` that lets you choose a salt instead of using the sender's nonce, which is how you compute a contract's address in advance for things like factory patterns.

**A contract does nothing on its own.** It has no scheduler, no listener, no background process. It only runs when called, either by a transaction from an EOA or by another contract that decides to call it mid-execution. Between calls it sits dormant in the chain's state.

**Each execution is atomic.** Either the entire call succeeds and its state changes are committed, or the call reverts and all its state changes are rolled back, including changes made earlier in the same call. There is no partial commit.

**A contract can call other contracts.** Each nested call has its own arguments, its own gas budget allocated from the caller's remaining gas, and its own opportunity to revert. This property is called **composability**, and it's why a token contract you write today can be called next year by a lending protocol you've never heard of. The interface lives on chain. Any contract can use it.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Alice calls Exchange contract, which calls Token A contract</title><desc>Alice signs a transaction that calls Exchange's swap function, which reads pool reserves and calls Token A's transferFrom to subtract from Alice and add to Exchange, then updates reserves and returns. All these nested calls share one transaction's atomic scope, so a revert anywhere rolls back every state change.</desc>
  <defs>
    <marker id="arr22" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
    <marker id="arr22r" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>

<rect x="20" y="100" width="120" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="80" y="125" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">EOA: Alice</text>
  <text x="80" y="145" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">signs tx</text>

<line x1="140" y1="130" x2="208" y2="130" stroke="#ed4937" stroke-width="2" marker-end="url(#arr22r)"/>
  <text x="174" y="120" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">call</text>

<rect x="210" y="60" width="220" height="140" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="210" y="60" width="220" height="30" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="320" y="80" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Contract A: Exchange</text>
  <text x="220" y="108" font-family="monospace" font-size="9" fill="#565653">code: swap(tokenA, tokenB, amount)</text>
  <text x="220" y="126" font-family="monospace" font-size="9" fill="#565653">storage: pool_reserves</text>
  <line x1="225" y1="138" x2="425" y2="138" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="220" y="156" font-family="monospace" font-size="9" fill="#000000">1. read reserves</text>
  <text x="220" y="172" font-family="monospace" font-size="9" fill="#000000">2. call Token A transferFrom</text>
  <text x="220" y="190" font-family="monospace" font-size="9" fill="#000000">3. update reserves</text>

<line x1="432" y1="110" x2="500" y2="110" stroke="#565653" stroke-width="2" marker-end="url(#arr22)"/>
  <text x="466" y="100" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">call</text>

<line x1="500" y1="170" x2="432" y2="170" stroke="#565653" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arr22)"/>
  <text x="466" y="185" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">return</text>

<rect x="502" y="60" width="200" height="140" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="502" y="60" width="200" height="30" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="602" y="80" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Contract B: Token A</text>
  <text x="512" y="108" font-family="monospace" font-size="9" fill="#565653">code: transferFrom(...)</text>
  <text x="512" y="126" font-family="monospace" font-size="9" fill="#565653">storage: balances[address]</text>
  <line x1="517" y1="138" x2="697" y2="138" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="512" y="156" font-family="monospace" font-size="9" fill="#000000">subtract from Alice</text>
  <text x="512" y="172" font-family="monospace" font-size="9" fill="#000000">add to Exchange</text>

<rect x="20" y="230" width="680" height="60" fill="#e0deda" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="360" y="253" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">All of this runs inside one transaction's execution scope.</text>
  <text x="360" y="273" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">If anything reverts, every state change made above is rolled back atomically.</text>

<text x="360" y="320" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">One transaction can touch many contracts. They run in sequence, sharing one atomic scope.</text>
</svg>

This composition is the source of nearly all the interesting applications on Ethereum, and the source of nearly all the spectacular failures. A simple-looking call to contract A can quietly reach into contracts B, C, and D, and a bug in any of them can break the whole chain of operations. You'll see this in detail when you write code that calls external contracts, and again when you study security.

## Why gas exists

Every operation a contract performs costs **gas**. Adding two numbers costs 3 gas. Multiplying them costs 5. Reading a word from a contract's storage costs 100 or 2,100 depending on whether the slot has been touched recently in the transaction. Writing a new word to storage costs 22,100. The exact numbers don't matter yet. What matters is the shape: cheap operations cost a few gas, expensive ones cost thousands or tens of thousands.

Notice that storage operations dominate the numbers above. That gap between writing a word and adding two numbers isn't arbitrary. Storage has to be held by every full node on the network, forever, until something explicitly overwrites it. Adding two numbers is a one-time computation that disappears as soon as the transaction ends. The protocol prices storage to reflect that asymmetry. A side effect of this is that clearing a storage slot, setting it from non-zero back to zero, gives the sender a partial gas refund, because the network no longer has to hold that value.

Gas exists for two reasons.

**Computation has to be paid for.** Every full node on Ethereum runs every transaction in every block. If running a transaction could cost the network thousands of dollars in electricity and CPU time without the sender paying anything, the network would get spammed into uselessness within hours. Gas is the protocol's way of charging the sender for the work their transaction makes every node do, with pricing that roughly tracks how much work each operation actually takes.

**Execution has to be bounded.** Without a limit, a contract could run forever. The protocol can't ask each node to detect infinite loops, because deciding whether a program halts is undecidable in general. The solution is blunt. Every transaction declares the maximum amount of gas it's willing to spend, called the **gas limit**. Execution halts when that limit is reached. If the transaction was going to complete legitimately within the limit, it completes. If it was going to loop forever, it gets cut off and its state changes are reverted.

Pricing keeps the cost of computation fair, and limits stop execution from running forever. Together they're what makes Ethereum work as a general-purpose execution platform.

## What you actually pay

Every transaction includes two numbers related to gas. The first is the gas limit you already met, the maximum amount of gas the transaction may use. The second is the **gas price**, how much they're willing to pay per unit. The actual fee is `gas used × gas price`, paid in ETH.

Gas prices are usually denominated in **gwei**, where one gwei is `10^-9` ETH, or one billionth of an ETH. A typical mainnet transaction in 2025 might pay something like 10 to 50 gwei per unit of gas. At current ETH prices, that translates to a fraction of a cent per gas unit. A simple transfer costs about 21,000 gas, so the total fee is small. A complex DeFi interaction might use 200,000 to 500,000 gas, which is where transaction costs start being something the user notices.

Since August 2021, Ethereum has used a fee market called **EIP-1559**. It splits the gas price into two parts.

The **base fee** is determined by the protocol. Each block carries a base fee, and the next block's base fee is adjusted based on how full the current block was. The protocol targets a fullness of 50%. If a block goes above that, the next block's base fee rises by up to 12.5%. If it goes below, the base fee falls by up to 12.5%. So the base fee tracks demand in near-real time. When the network is congested it climbs quickly. When it's quiet it falls quickly. The base fee is **burned**, meaning it's destroyed and removed from circulation. The validator who included the transaction does not receive it.

The **priority fee**, sometimes called the tip, is what the sender adds on top of the base fee to incentivize validators to include their transaction faster. The priority fee goes to the validator who produced the block. In quiet times the priority fee can be a fraction of a gwei. In congested times it climbs into the tens.

This design has two effects worth naming. First, it makes fees predictable. Before EIP-1559, fees were a blind auction and users routinely overpaid. Now the base fee is set by the protocol and only the priority fee is negotiable, which lets wallets give accurate estimates. Second, it burns ETH over time. Combined with PoS issuance, this means the supply of ETH can rise or fall depending on network usage.

## Where transactions wait

A signed transaction doesn't go straight into a block. It enters a holding area called the **mempool**, where it waits to be picked up by whoever is building the next block.

Every node on the network keeps its own mempool of pending transactions. When your wallet sends a transaction, it goes to one node, typically a hosted RPC provider, which adds it to its mempool and gossips it to peers. Within a second or two, most of the network has the transaction in their mempools. When a validator's turn comes to propose a block, the builder assembling that block picks transactions from the mempool, generally ordered by priority fee, until the block is full.

A few things follow from this that matter for builders.

**The mempool is public.** Anyone running a node, or paying for access to one, can read pending transactions before they're included. This is the foundation of MEV: bots watch the mempool for profitable opportunities and submit their own transactions to capture them, sometimes by paying higher priority fees to get ordered ahead of the original. We'll come back to this in the security module.

**Transactions can be replaced.** If you submit a transaction with too low a priority fee and it sits in the mempool unconfirmed, you can resubmit a new transaction with the same nonce and a higher fee. Validators pick the more profitable one. Wallets expose this as a "speed up" button. You can also "cancel" a stuck transaction by submitting a no-op transaction with the same nonce and higher fee.

**Nonces enforce ordering.** A transaction with nonce 5 cannot be included until the transaction with nonce 4 from the same account has been. If you have transactions sitting at nonce 4 stuck on low fees, every later transaction from that account is also stuck until you bump the nonce-4 fee.

## What happens when gas runs out

If a transaction's gas limit is too low, execution halts partway through. The transaction reverts. Every state change it made is rolled back. The sender does not get a refund of the gas they spent. The validator still keeps the priority fee for the work it did, and the base fee is still burned. From the chain's perspective, the transaction happened: it occupied a slot in a block, it consumed gas, but its intended effect did not take place. Setting the gas limit too low means you fail and pay anyway. Setting it too high is mostly harmless: the unused portion is refunded. Wallets estimate the gas needed and add a safety margin.

When contract A calls contract B, A passes some of its remaining gas to B. If B runs out of gas, B reverts. A can choose to catch this revert and continue, or let it propagate and revert itself. This is composability at the gas level: one part of a transaction can fail without bringing the whole thing down, if the calling code chose to handle that case.

## How gas shapes the code you write

The first is that **storage is precious**. The most expensive opcode by a wide margin is the one that writes to a new storage slot. Every byte you store on Ethereum costs gas at deployment, and every subsequent change costs gas again. This shapes how Solidity code is written. Variables get packed into structs. State that doesn't need to be on chain stays off chain. Patterns like emitting events instead of storing values get used everywhere. You will spend a measurable share of your development time thinking about storage layout.

The second is that **transactions cost users money**. A user calling your contract is paying for every operation it performs. If your contract does too much work per call, it becomes too expensive to use. The cheaper your contract is to interact with, the wider the audience that can afford to use it. This is the single biggest constraint on Ethereum application design, and it's why so much of advanced Solidity is about gas optimization.
