---
id: 83
title: Determinism and what blockchains can't do
type: lecture
order: 7
faq:
  - question: What does determinism mean for a blockchain?
    answer: >-
      Same code, same inputs, same output on every node, every time.
  - question: Why can't a smart contract call an external API?
    answer: >-
      Every node has to compute the same result from the same input. An API can answer one
      node differently from another, and the chain would fork. Contract languages have no HTTP
      client, no DNS, no sockets.
  - question: How does a smart contract know what time it is?
    answer: >-
      It reads the timestamp in the current block, a value consensus has already agreed on.
      The machine's own clock is off limits, since node clocks drift by milliseconds.
  - question: Can a smart contract generate a random number?
    answer: >-
      Not from the machine, since every node would roll a different number. Low-stakes
      contracts hash on-chain data. Where someone could profit from biasing the result, chains
      use a built-in mechanism that combines many contributions, or a service that submits
      verifiable random values.
  - question: What is an oracle?
    answer: >-
      An off-chain service that watches something real, an asset price or a match result, and
      writes it into a contract's state with a transaction. Contracts read the stored value,
      which consensus has already agreed on. A contract is only as trustworthy as its oracle.
---

> Every node must compute the same result from the same input. This lesson is about why the constraint exists, what it rules out, and how blockchains work around it.

## Every node has to reach the same answer

Recall what every node on the network is doing. When a new block arrives, every node independently validates it. Every validation must reach the same answer. If half the nodes accept the block and half reject it, the network is split and consensus has failed.

Now imagine the input includes a piece of code: a smart contract, a program that runs as part of processing the block. The contract reads some data, runs some logic, writes some result back. Every node executing the block must execute that contract and arrive at the same result. Any variation between nodes means the chain forks every time anyone calls a contract that varies.

So contracts on a blockchain have to be **deterministic**: the same code with the same inputs produces the same outputs on every node, every time.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Same input and code run on node 1, 2, 3 give all equal outputs</title><desc>One input, the same on every node, flows into a single deterministic code block. That code runs separately on node 1, node 2, and node 3, and each produces an output. Arrows point from the code to all three outputs, labeled all equal.</desc>
  <defs>
    <marker id="arr3" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<!-- Input -->
  <rect x="40" y="110" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="100" y="135" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Input</text>
  <text x="100" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">same on every node</text>

<!-- Code -->
  <rect x="240" y="110" width="120" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="300" y="135" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Code</text>
  <text x="300" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">deterministic only</text>

<!-- Output -->
  <rect x="440" y="40" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="500" y="65" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Output</text>
  <text x="500" y="85" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">node 1</text>

<rect x="440" y="110" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="500" y="135" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Output</text>
  <text x="500" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">node 2</text>

<rect x="440" y="180" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="500" y="205" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Output</text>
  <text x="500" y="225" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">node 3</text>

<!-- Arrows -->
  <line x1="160" y1="140" x2="240" y2="140" stroke="#565653" stroke-width="2" marker-end="url(#arr3)"/>
  <line x1="360" y1="130" x2="440" y2="70" stroke="#565653" stroke-width="2" marker-end="url(#arr3)"/>
  <line x1="360" y1="140" x2="440" y2="140" stroke="#565653" stroke-width="2" marker-end="url(#arr3)"/>
  <line x1="360" y1="150" x2="440" y2="210" stroke="#565653" stroke-width="2" marker-end="url(#arr3)"/>

<!-- Equality note -->
  <text x="610" y="125" font-size="14" fill="#ed4937" font-weight="bold">all</text>
  <text x="610" y="145" font-size="14" fill="#ed4937" font-weight="bold">equal</text>
</svg>

## A contract cannot use anything that differs between nodes

The determinism requirement rules out several things that ordinary programs do all the time.

**External data.** A program running on the chain cannot ask a website or any other service on the internet for data, such as the current price of a coin. The service might return a different price to a node in one city than to a node in another, or be down when one node calls it and up when another does. Say a contract pays out 1 coin when the price is above 100. A node that got 100 pays nothing and a node that got 101 pays 1 coin, so the two nodes disagree on the result of the contract call and the chain forks. So smart contract languages on every chain don't expose any network operations.

**Wall-clock time.** A program running on the chain cannot read the clock of the machine it runs on. Different nodes have slightly different clocks. Even when the clocks are synchronised, there's drift on the order of milliseconds, and a contract that asked for the current second would get different answers on different nodes. Contracts can read only the timestamp recorded in the current block, which is a value the consensus mechanism has already agreed on.

**True randomness.** A program running on the chain cannot ask the machine for a random number. Each node would produce a different number, the contract would behave differently on each node, and consensus would fail. Contracts that need randomness have to obtain it from somewhere that every node can agree on.

The same goes for files on a node's own disk and for anything that produces different results on different hardware or operating systems.

## How the ecosystem works around the limits

Time, randomness and external data each have a standard workaround. In all three the contract reads a value that is already on the chain, so every node reads the same one.

**For time, use block timestamps.** Every block has a timestamp field, set by the block producer when proposing the block. Contracts that need the current time read the block timestamp. The granularity is the block interval, which is good enough for almost any application that needs a notion of time. The block timestamp is not perfectly accurate, and block producers have some discretion to choose it within a narrow range, but contracts that account for this work fine.

**For randomness, derive it from on-chain sources or use a protocol-level mechanism.** A naive approach is to hash some on-chain data and use the result as a pseudo-random number. Every node gets the same number, but whoever produces the block sees the data before publishing it and can predict the result or bias it. So this works only for low-stakes use cases. For higher-stakes randomness (lotteries, gaming, anything where a participant might profit from biasing the result), chains either include a built-in mechanism that gathers contributions from many participants and combines them, or rely on specialised services such as Chainlink VRF, which submit a random value in a transaction together with a proof that anyone can check. The [randomness lesson](/courses/development-on-ethereum/oracles/randomness-on-chain) of the Ethereum course covers both the attack and the service.

**For external data, use oracles.** An **oracle** is an off-chain service that watches some real-world data source (the price of an asset, the result of a sporting event, the weather in a city) and submits transactions to the chain that write the data into a smart contract's state. Contracts that need the external data read from the oracle's on-chain contract. The data came from off-chain, but at the moment a contract reads it, it's already been agreed upon by consensus. [Chainlink price feeds](/courses/development-on-ethereum/oracles/oracles-and-chainlink-price-feeds) work this way: many independent operators collect prices from several exchanges, and the median is stored in a contract on the chain.

An oracle brings a different kind of trust into the system. The contract trusts the oracle, and the oracle is operated by some party off the chain, with all the usual risks of off-chain parties. A blockchain application that depends on an oracle is only as trustworthy as its oracle, no matter how good the on-chain cryptography is. Picking the right oracle, or running your own, is an architectural decision, and it is easy to overlook. In 2020 Harvest Finance lost $24M because its contracts took the price from a single on-chain market, and an attacker moved that price with borrowed money, as the [flash loans lesson](/courses/development-on-ethereum/oracles/flash-loans) describes.

## A blockchain trades capability for being verifiable by everyone

A blockchain is not a general-purpose computer that happens to be decentralised. It is a very specific kind of computer that has traded a lot of capability for the ability to be verified by everyone, with no operator. You get a programmable settlement layer that no one controls, where anyone can write code and anyone can verify that code. You give up the ability to call external services from inside that code, the ability to read the wall clock, and the ability to use true randomness. For use cases that need any of the capabilities the trade gives up, a blockchain is the wrong tool.

Every real chain is a specific set of choices layered on top of the pieces from this module, and you now have the vocabulary to take any of them apart.
