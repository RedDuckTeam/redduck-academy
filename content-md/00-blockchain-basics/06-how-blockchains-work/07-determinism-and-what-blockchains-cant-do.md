# Determinism and what blockchains can't do

_type: lecture_

> Every node must compute the same result from the same input. That one sentence is the deepest constraint on every blockchain in existence, and it is easy to miss when you come from web2 development, so it is worth stating plainly. The constraint dictates what kinds of programs can run on a blockchain and what kinds cannot. It dictates why on-chain code can't call an external API. It dictates why "give me a random number" on-chain is harder than it sounds. It dictates a whole class of problems that the ecosystem solves with separate mechanisms layered on top. This lesson is about why the constraint exists, what it rules out, and how blockchains work around it.

## Why determinism

Step back and recall what every node on the network is doing. When a new block arrives, every node independently validates it. Every validation must reach the same answer. If half the nodes accept the block and half reject it, the network is split and consensus has failed. The whole system runs on the assumption that every honest node, given the same input, will produce the same answer.

Now imagine the input includes a piece of code. A smart contract. A program that runs as part of processing the block. The contract reads some data, runs some logic, writes some result back. Every node executing the block must execute that contract and arrive at exactly the same result. Same final state of the contract, same return values, same effects on other parts of the chain. Any variation between nodes means the chain forks immediately, every time anyone calls a contract that varies.

So contracts on a blockchain have to be **deterministic**: same code, same inputs, same outputs, every time, on every node, forever. This is the single property that makes on-chain code possible at all.

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

The picture is simple. Every node runs the same code on the same input. The outputs must all match. If they don't, something is wrong with the code, the input, or both. There is no fourth option.

## What this rules out

The determinism requirement immediately rules out an entire category of things developers normally take for granted.

**External API calls.** A program running on the chain cannot call `fetch("https://api.example.com/price")`. The API might return a different price to a node in one city than to a node in another. The API might be down when one node calls it and up when another does. The API might rate-limit some nodes and not others. Any of these would cause nodes to disagree on the result of the contract call, and the chain would fork. Smart contract languages on every chain simply don't expose any network operations. There is no HTTP client. There is no DNS lookup. There is no socket library.

**Wall-clock time.** A program running on the chain cannot read the system clock. Different nodes have slightly different clocks. Even with NTP synchronisation, there's drift on the order of milliseconds, and a contract that asked for the current second would get different answers on different nodes. Smart contract languages don't expose `Date.now()` or its equivalent. They expose only the timestamp recorded in the current block, which is a value the consensus mechanism has already agreed on.

**True randomness.** A program running on the chain cannot call `Math.random()` or read from the operating system's random number generator. Each node would produce different random bytes, the contract would behave differently on each node, and consensus would fail. Smart contract languages don't expose any source of true randomness. Contracts that need randomness have to obtain it from somewhere that every node can agree on.

**File system access.** No reading from disk except for the chain's own state. The contract has no concept of "this node's local files" because every node would have different files.

**Hardware-specific behaviour.** Things that produce different results on different CPUs, different operating systems, or different language versions are unsafe. Some chains go to extraordinary lengths to specify exact bit-level behaviour for every operation a contract can perform, so that no two nodes will ever produce different results even when running on different hardware.

The natural reaction at this point is "so how does anything useful get built?" The answer is that blockchains accept the constraint and the ecosystem has invented mechanisms for the operations contracts genuinely need.

## How the ecosystem works around the limits

Three of the categories above have standard workarounds that you'll meet in every chain ecosystem.

**For time, use block timestamps.** Every block has a timestamp field, set by the block producer when proposing the block. The timestamp is a value the consensus mechanism agrees on. Contracts that need "the current time" read the block timestamp instead. The granularity is the block interval, which is good enough for almost any application that needs a notion of time. The block timestamp is not perfectly accurate, and block producers have some discretion to choose it within a narrow range, but contracts that account for this work fine.

**For randomness, derive it from on-chain sources or use a protocol-level mechanism.** A naive approach is to hash some on-chain data and use the result as a pseudo-random number. This works for low-stakes use cases. For higher-stakes randomness (lotteries, gaming, anything where a participant might profit from biasing the result), chains either include a built-in mechanism that gathers contributions from many participants and combines them, or rely on specialised services that produce verifiable random outputs and submit them via signed transactions. The shared property is that every node ends up reading the same random value from somewhere on the chain, rather than rolling dice locally.

**For external data, use oracles.** An **oracle** is an off-chain service that watches some real-world data source (the price of an asset, the result of a sporting event, the weather in a city, whatever the application needs) and submits transactions to the chain that write the data into a smart contract's state. Contracts that need the external data read from the oracle's on-chain contract instead of trying to fetch the data themselves. The data on the chain came from off-chain, but at the moment a contract reads it, it's already been agreed upon by consensus. Every node reads the same value.

The oracle pattern is worth pausing on. It looks like a workaround, and it is, but it's a workaround that imports a different kind of trust into the system. The chain trusts the contract. The contract trusts the oracle. The oracle is operated by some party off the chain, with all the usual risks of off-chain parties. A blockchain application that depends on an oracle is only as trustworthy as its oracle, no matter how good the on-chain cryptography is. Picking the right oracle, or running your own, is an architectural decision that web2 development never required, and it is easy to overlook.

## What blockchains are really for

A blockchain is not a general-purpose computer that happens to be decentralised. It is a very specific kind of computer that has traded a lot of capability for the ability to be verified by everyone, with no operator. Anything that depends on local conditions, like time, randomness, external data, or hardware, is either banned or pushed off-chain. What's left is pure computation over data that everyone can see.

That's the deal. You get a programmable settlement layer that no one controls. Anyone can write code on it. Anyone can verify that code. It handles real value and produces results no one can fake. You give up the ability to call external services from inside that code, the ability to read the wall clock, and the ability to use true randomness. For the use cases blockchains are good for, the trade is enormously worth it. For use cases that need any of the capabilities the trade gives up, a blockchain is the wrong tool.

This is the constraint at the bottom of everything. Every smart contract you'll ever write, on any chain, lives inside this rule. Every weird design choice in smart contract languages, every reason "just call an API" doesn't work, every pattern you'll learn for handling external data, all of it traces back to one requirement. Every node must compute the same result from the same input. The chain can do nothing else, ever.

## Where this goes next

You have a complete conceptual picture of how a blockchain operates: the structure, the comparison to traditional systems, the consensus mechanism, the nodes and the network, the operation loop that ties everything together, the way the network handles temporary and permanent disagreement, and the deepest constraint on what on-chain code can do. The next module starts the chain-specific work. The first chain you'll meet is the original one, the one that proved all the abstract pieces from this module can actually be assembled into a working system. The cryptographic primitives you've already learned and the consensus mechanism you've already learned are about to meet a specific design that uses them in a specific way.
