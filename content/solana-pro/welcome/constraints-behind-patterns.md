---
title: Constraints behind patterns
type: lecture
order: 12
faq:
  - question: Why does a course about patterns start with a list of constraints?
    answer: >-
      Because the patterns are answers, and the constraints are the questions. Every protocol
      in the TOP-50 faced the same questions: a Web3 protocol doesn't run on its own, a transaction has a size and a compute ceiling,
      the client supplies every account, transactions have no guaranteed order and no account nonce to make a signed message single-use, etc.
  - question: Are these constraints specific to Solana?
    answer: >-
      Some are shared by every public blockchain: atomic transactions, public state, paid
      execution, anyone can call anything, no access to the outside world. Others are
      Solana-specific: the client brings every account to the transaction, the 1232-byte transaction limit, the compute
      unit budget, no account nonce, parallel execution with per-account locks.
  - question: What does "nothing happens by itself" mean in practice?
    answer: >-
      A program only runs when someone sends a transaction that invokes it. There is no cron,
      no scheduler, no callback. If a protocol needs something to happen at a point in time,
      either it runs a bot that triggers the protocol (also called a keeper), or it needs to be designed so that anyone who touches the protocol does that work
      as part of their own call.
  - question: Why does "the client brings the accounts" matter so much?
    answer: >-
      Because every account the program reads or writes arrives in the instruction, chosen by the caller.
      That makes every account an input that has to be verified.
---

> Patterns are not invented. They are forced. Every protocol we read for this course hit the same set of challenges, and the patterns in the following modules are the ways they got past them. This lecture lists the typical challenges unique to Web3 and Solana.

## Constraints come first

A design pattern is a repeated answer to a repeated problem. The reason the TOP-50 Solana protocols use the same approaches is not that their engineers read the same book. It is that they all build within the same environment, namely the Solana Virtual Machine. Most of the constraints below are familiar if you have written a Solana program. So let's recall which challenges Web3 and Solana developers face daily:

## Nothing happens by itself

A program has no main loop. It executes only inside a transaction that somebody signed, paid for, and sent. There is no scheduler, no timer, no "when the price crosses X, call me". If a loan has to be liquidated, a reward has to be distributed, an order has to expire, something external has to send a transaction at that moment.

The obvious answer is a bot (also called a keeper) run by the development team. The obvious problem is that the protocol now depends on that bot: its uptime, its keys, its funding. Every protocol faces this, and the answers differ. Some accept the keeper and make it replaceable. Some design the protocol so that anyone who acts as a keeper gets paid, which incentivizes independent people to continuously monitor the protocol. Some restructure the work so that the next user to touch the protocol performs the necessary work as a side effect of their own transaction without even knowing it. <!-- TODO: The modules on **permissionless execution** and **deferred execution** are about this constraint. -->

## A transaction is small and bounded

A Solana transaction fits in 1232 bytes. That includes every signature, every account address, and every instruction's data.

The consequence is that a program cannot do a lot in one call. It cannot iterate over all stakers to distribute rewards. It cannot walk a long orderbook to find the right slot. It cannot perform hundreds of swaps in a single transaction. And such operations are sometimes necessary because of the protocol's nature: an index of hundreds of tokens has to be rebalanced, a lending market has to accrue interest on every position.

This is a constraint, and the way it is resolved depends on the protocol. <!-- TODO: The modules on **cost distribution** and **state partitioning** exist because of this ceiling. -->

## The client brings every account

A Solana program does not read state for the user. It is handed state by the user. Every account the instruction touches is listed by the caller, and the runtime passes exactly those accounts, nothing more. The program cannot look something up by address if the caller did not include it.

This is a trade-off in Solana's design: it brings parallelism in block validation, but it also makes every account an untrusted input. The caller chooses which oracle account, which config and which vault to pass. Every protocol has to decide where its chain of trust starts, and that has to be something the caller cannot substitute: a program-derived address, a hardcoded key, an owner check. <!-- TODO: The module on **trust and identity** is about this. -->

It's worth noting that the same constraint has a useful property. Because the caller already does the work of finding the right accounts, the program can offload search to the client and keep only verification for itself. The client says "here is the position", and the program only has to agree or disagree.

## There is no account nonce and no order

An Ethereum account has a nonce, so transactions from one signer are serialized and a signed message can be made single-use by construction. Solana has no such thing. A transaction is unique by its recent blockhash and its content, and nothing in the runtime says that your transaction A lands before your transaction B, or lands at all.

So two of your users' transactions can be included in either order. Even worse: a signed update from an oracle can be submitted twice. The protocol cannot ask the runtime to sort this out. <!-- TODO: The module on **order and consent** addresses this. -->

## A transaction is atomic

Just like in any blockchain and probably most decentralized systems, either every instruction in a transaction succeeds, or the whole transaction is rolled back. There is no partial state. A protocol can rely on this: if the last instruction checks an invariant and fails, everything before it is undone.

## Everything is public for anyone to read and call

Every account's content is readable by anyone. Every program's logic is readable by anyone. And any program's instruction can be invoked by any wallet, so the program itself has to reject the callers it does not want.

There is no "internal" function and no private variable. Any issue in the code or the state would be found sooner or later. This is why protocols don't trust by default. If anyone can send a transaction, the program makes sure the outcome is correct no matter who did it. <!-- TODO: **Permissionless execution** and **trust and identity** both grow from this. -->

## Execution costs money and state costs rent

Just like in other blockchains, every transaction has to be paid for with a fee. In Solana, you also lock a rent-exempt deposit for every account you create, proportional to its size. There is no free computation and no free storage.

The question "who pays" is a design decision in every protocol. Does the protocol pre-create an account for every user, or create it lazily on first use, funded by that user? Does the team pay for a distribution across ten thousand holders, or does each holder pay to claim their own share, sometimes unknowingly? Does the program do expensive work up front, or defer it until the moment someone actually needs the result and is willing to pay for it? <!-- TODO: **Cost distribution** is the module for this. -->

## Programs are deterministic

Blockchains have to be deterministic, otherwise there would be no consensus among validators. That is also true for Solana: programs cannot make HTTP requests or check any other information available outside of the blockchain. Everything a program knows about the outside is what it learns from accounts that someone wrote on-chain, such as prices in oracle accounts that were updated by someone.

So every external value is a claim made by a third party, and the protocol has to decide how much to believe it. Sometimes, protocols can infer some values from on-chain state rather than asking an oracle. <!-- TODO: The module on **outside data** covers this. -->

## Reading the rest of the course

Each pattern in the following modules is a recurring answer to one or more of these constraints. When you meet a pattern, ask which constraint forced it. If you can name the constraint, you can also tell when the pattern does not apply: when the constraint is absent, applying the pattern anyway is a pattern for the sake of having one.