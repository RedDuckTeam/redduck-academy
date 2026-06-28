# What Ethereum is

_type: lecture_

> Bitcoin is a network for moving one specific asset. Ethereum is a network for running arbitrary programs that touch any asset. The mental model that helps most is this. Think of Ethereum as a single computer that the entire world shares. Every program written for it runs forever, and nobody can shut it down.

## The shape of the thing

You already know what a blockchain is. A network of nodes that hold the same data, agree on what gets added next, and chain blocks together with hashes so nothing can be quietly changed. Bitcoin is one chain built on that idea, optimised for one job: moving its native coin around securely.

Ethereum starts from the same architecture and asks for more: arbitrary state, and arbitrary programs that touch that state. Same gossip network, same consensus mechanism conceptually, same hash-linked blocks. The protocol just makes room for a lot more to live on the chain.

The way to picture this: imagine a single global computer. It has memory, storage, and a CPU. Anyone can read its state. Anyone can submit a request to change its state, as long as they pay for the work. The computer runs the request, updates its state, and the change is permanent. There is no operator, no admin, no off-switch. The whole computer is replicated across thousands of machines worldwide that all agree on what the state currently is.

That picture is what people mean when they call Ethereum the "world computer." It's a useful shorthand, even if it leaves out a lot of detail.

## What lives on it

Two kinds of things have addresses on Ethereum and can hold state.

The first is a regular user account, called an **externally owned account** or EOA. It's controlled by a private key, exactly like a Bitcoin address. You sign transactions with the key to spend your ETH or trigger something else on the chain. EOAs hold a balance of ETH and a counter called a nonce. Nothing else.

The second is a **smart contract** account. It's controlled by code, not by a private key. When a contract is created, its code gets deployed to a new address on the chain. That code lives at that address forever. Anyone can send a transaction to a contract's address. When they do, the contract's code runs. It can read and write its own storage, send ETH around, and call other contracts. The result of the code's execution becomes part of the global state.

The state of Ethereum at any moment is the combined state of every account, EOA and contract, that has ever existed on the chain. Balances, nonces, contract code, contract storage. Every node holds this state, updates it as new blocks arrive, and rejects any block whose transactions don't transition the state correctly.

## What you pay for and why

Running code on a global shared computer is not free. Every operation a contract performs costs something. Adding two numbers is cheap. Writing to storage is expensive. Reading from storage is somewhere in the middle.

The unit of cost is called **gas**. Every transaction declares a maximum amount of gas it's willing to consume, and a price it's willing to pay per unit. The fee paid is gas-used × gas-price, denominated in ETH. The fee goes to whoever produces the block that includes the transaction, with a portion burned out of circulation since 2021.

Gas exists for two reasons. First, computation on every full node has to be paid for or the network gets spammed. Second, gas bounds execution. A transaction cannot run forever because it cannot consume more gas than it brought with it. When the gas runs out, the transaction is reverted, the state changes it made are undone, and the gas spent so far is kept by the producer as the cost of the attempt.

ETH is what gas is paid in. ETH is also what most things on Ethereum are denominated in. New ETH enters circulation as block rewards to validators, and a portion of every transaction fee is burned, which means total supply moves around rather than only growing.

## What you can do that you couldn't do with Bitcoin

The point of the smart-contract layer is that you can put logic on the chain that anyone can interact with and that runs by its own rules forever.

Some examples of what's been built:

- Tokens that aren't ETH, with their own balances and rules
- Stablecoins pegged to fiat
- Decentralised exchanges where users swap tokens without an exchange company holding their funds
- Lending markets where deposits earn yield and borrows post collateral
- Governance systems where token holders vote on parameter changes that the chain applies automatically
- Identity records, ownership records, on-chain games, prediction markets

The common thread: anything that can be expressed as a program whose rules are public and whose execution cannot be censored.

None of this is possible on Bitcoin's protocol, by design. Bitcoin keeps its scripting minimal so the protocol stays small, the security argument stays simple, and the surface area for bugs stays narrow. Ethereum made the opposite trade. It accepted a much larger protocol and a much bigger bug surface in exchange for being able to host programs that look like real applications. You will see the cost of this trade as you learn what can go wrong in smart contracts, but you will also see what it unlocks.

## Where this fits

Ethereum is one specific design for a smart-contract chain, not the only one. Solana, Aptos, Sui, Sei, Avalanche, BNB Chain, and many others are also smart-contract chains, each with different choices about account models, consensus, gas pricing, throughput, and developer experience.

Ethereum matters disproportionately for two reasons. It got there first as a general-purpose smart-contract chain, which is why the design vocabulary the whole industry uses is mostly Ethereum's. And it's where the most valuable applications live by a wide margin: at the time of writing, hundreds of billions of dollars sit in contracts on Ethereum or on chains that copied Ethereum's execution model. Those copies are what people mean when they say "EVM-compatible." When you learn Ethereum, you learn a model that runs on dozens of other chains too, with small variations.

The chain you'll actually write code for in this course is Ethereum. The patterns you learn will transfer, with some adjustment, to the rest of the EVM world. The deeper differences with non-EVM chains like Solana belong to a separate track.
