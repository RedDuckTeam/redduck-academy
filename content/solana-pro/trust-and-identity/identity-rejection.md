---
title: Identity rejection
type: lecture
order: 20
faq:
  - question: What is identity rejection?
    answer: >-
      The program does not care who sent the transaction, when, or why, only what it does to
      the state. A new address costs nothing, so an address check is easy to pass. A state
      check costs the same for every caller, and the only way to pass it is a transaction that
      keeps the state correct.
  - question: Does this mean my program should not check signers?
    answer: >-
      No. A withdrawal moves someone's tokens, and only the owner can agree to that, so the
      owner has to sign. A signer check answers whose tokens these are. It does not answer
      whether the action is safe for the protocol, and that second question is what this
      lecture is about.
  - question: How do launchpads stop snipers without a blacklist?
    answer: >-
      With a fee that depends on the trade, not the wallet. Meteora's fee scheduler starts
      high and drops over the first seconds or minutes of a launch, and its rate limiter adds
      an extra fee that grows with the size of a single purchase. Heaven has a sniper tax that
      goes down over the first six seconds. A bot with a fresh wallet pays the same as everyone
      else.
  - question: What went wrong with Meteora's "one swap per transaction" rule?
    answer: >-
      The check looked for other instructions named swap in the transaction. Later a second
      instruction, swap2, was added that does the same job, and nobody added it to the check.
      So a transaction could contain many swap2 calls. The rule was about the pool, but the
      check was about an instruction's name.
  - question: Why not keep a list of trusted bots for price updates?
    answer: >-
      Because then the protocol has a price only while those bots are running. A program that
      checks the update's signature and age can accept it from anyone, so the update arrives
      as long as anyone wants the trade that needs it.
  - question: When is a trusted address the right design?
    answer: >-
      For ownership. The owner signs for their tokens, and the admin signs for a fee change.
      The smaller this set of actions is, the less the protocol depends on any single address.
---

> Many of the problems on Solana come from identity. Every protocol decides who may call an instruction, which addresses it trusts, and who runs its bots, and most of them make the same mistake. What if the program rejected identity altogether?

## The simplest check

The simplest check is a list of addresses, for example the admin, an allowlist, or the bot that the team runs. The problem is that anyone can create a new address without any effort. So the protocol has to maintain a list, and the caller only needs a new address to pass the check.

There is a second problem. If the protocol accepts price updates only from its own bot, it has a price only while that bot is running. If only its own server can trigger payouts, payouts happen only while that server is up. Every trusted bot, server or address is a dependency. Protocols go on-chain to be decentralized, and these dependencies break the whole idea of decentralization.

## Check what the transaction does

The most important goal of a program is to stay integral and produce the intended results, whether it is a DEX that has to keep its pools in full integrity or any other protocol. Who, when, or why sends a transaction is not that goal. It is a peripheral question that should not affect anything most of the time.

With **identity rejection**, the question is "Is this transaction good for the protocol and its integrity?", not "Is this a trustworthy address?". The one exception is the instructions that must be available only to the owner. Nothing else depends on who is calling.

## Snipers: a list or a fee

Sniper bot protection is designed with this principle. A bad solution is to block the sniper wallets. It would not last, because one address can be replaced with another one in seconds. A good solution does not depend on identity and prevents the bad action itself. Meteora and Heaven use a launch tax, a fee that starts at 99% and drops over the first seconds of the launch, or one that grows with the size of a single purchase. A sniper who buys at a 99% fee keeps 1% of what they paid for and cannot sell at a profit. The time since launch and the size of the trade stay true no matter which address is trading. The fee has a downside. An early buyer who is not a bot pays it too.

## Meteora: a check on the name of an instruction

Meteora's Dynamic Bonding Curve had a hole in its sniper protection, and an audit found it before anyone lost money. The rule was one swap per transaction, so that a sniper cannot split a big buy into many small ones that each stay under the fee. The check looked for other instructions named `swap` in the transaction. Later Meteora added a second instruction, `swap2`, which does the same swap, and nobody added it to the check. So a transaction could contain one `swap` and fifteen `swap2` calls, and the check saw one swap. The rule was about the number of swaps on the pool. The check was about the name of an instruction, and a new instruction is as cheap as a new address. A check that counts every instruction that writes to the pool, whatever its name, would not have this hole.

## The same idea in other protocols

The same principle works in protocol design, not only in security. In Helium, anyone can claim rewards for any device, because the money always goes to the device owner. In Monaco, anyone can call the instruction that pays out a filled trade. In governance programs, anyone can execute a proposal once the vote has passed. Pyth accepts a price update from any wallet and checks the signature and the age of the update, not who sent it. None of these programs cares who is calling, because the result is the same for every caller.

## The action, not the address

A check on an address asks who is calling, and anyone can pass it with a new address. A check on the state asks what the transaction does, and nothing the caller creates changes the answer. Identity stays only for ownership. Everywhere else, the program looks at the action.
