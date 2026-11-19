---
id: 99
title: What Ethereum is
type: lecture
order: 2
faq:
  - question: What is gas on Ethereum and why do I pay it?
    answer: >-
      The unit of cost for running an operation. Adding numbers is cheap, writing storage is
      expensive. Your fee is gas used times gas price, paid in ETH. Gas pays every node for
      the work and keeps a transaction from running forever.
  - question: How does a contract account differ from a user account?
    answer: >-
      An externally owned account, the user kind, is controlled by a private key and holds an
      ETH balance and a nonce. A contract account is controlled by code deployed at its
      address and has storage of its own.
  - question: If my transaction runs out of gas, do I get that gas back?
    answer: >-
      No. Every state change it made is undone and the block producer keeps what you spent.
---

> Bitcoin is a network for moving one specific asset. Ethereum is a network for running arbitrary programs that touch any asset. Accounts, gas, and the Ethereum Virtual Machine all follow from that one decision.

## Ethereum made the opposite trade

Bitcoin keeps its scripting minimal so the protocol stays small, the security argument stays simple, and the surface area for bugs stays narrow. A Bitcoin script has no loops and no state of its own, and it only decides whether a coin may be spent. The lesson on [what Bitcoin gave up](/courses/blockchain-basics/bitcoin/what-bitcoin-gave-up-and-what-it-gained) covered this choice.

On Ethereum anyone can deploy a program, called a **smart contract**, to an address on the chain. The program keeps its own data between calls, can hold funds, can call other contracts, and runs whenever a transaction calls it. Once deployed, the code stays at that address for as long as the chain runs, and no one else can change it or take it down. The one historical exception is selfdestruct: for years a contract could erase its own code with that operation, though a later change to the protocol has since removed almost all of its effect.

A token is the simplest example. It is a contract that stores a table of balances and changes two entries on every transfer. A Uniswap V2 pool, covered in the [AMM lesson](/courses/development-on-ethereum/defi-tasks-and-patterns/amm), is a contract that holds two tokens and lets anyone swap one for the other at a price set by a formula.

## What arbitrary programs force on the protocol

As on any blockchain, every node executes every transaction, and all nodes have to end up with the same state. Arbitrary programs raise three problems for such a network, and each one is solved by a mechanism that has its own lesson in the next module.

**A program's data needs a place to live between calls.** Bitcoin's state is a set of unspent coins, and a set of coins has nowhere to put a program's table of balances. So Ethereum's state is a set of accounts. A user account is controlled by a private key. A contract account is controlled by its code and has storage of its own. More in [the account model](/courses/development-on-ethereum/how-ethereum-works/the-account-model).

**A program with loops may never stop.** A node cannot tell in advance whether it will. So every operation costs some amount of a unit called **gas**, and the sender pays for gas in ETH, Ethereum's native coin. A transaction brings a limited amount of gas, and when the gas runs out, execution stops and every change the transaction made is undone. More in [contracts and gas](/courses/development-on-ethereum/how-ethereum-works/contracts-and-gas).

**Every node has to compute the same result.** So contracts run on the **Ethereum Virtual Machine**, or EVM. The EVM exists only as a specification that every node implements, and the same code with the same input gives the same result on every node. Dozens of other chains adopted the same specification and are called EVM-compatible, so what you learn in this course carries over to them with small variations. More in [the EVM lesson](/courses/development-on-ethereum/how-ethereum-works/the-evm).

## The price is a larger protocol and more room for bugs

In exchange for hosting programs that look like real applications, Ethereum accepted a much larger protocol and a much bigger bug surface. A bug in a contract is a bug in a program that holds funds, that anyone can call, and whose code cannot be changed. In 2016 an attacker used a bug in one contract, The DAO, to move about 3.6 million ETH out of it. The [next lesson](/courses/development-on-ethereum/welcome-to-ethereum/where-ethereum-came-from) shows what the network did about it.
