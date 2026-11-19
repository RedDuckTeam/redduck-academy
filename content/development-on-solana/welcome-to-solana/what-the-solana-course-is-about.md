---
id: 178
title: What the Solana course is about
type: lecture
order: 1
faq:
  - question: What will I build in the Solana course?
    answer: >-
      Real programs that run on Solana, including the parts of an application that hold
      funds, with a working project released at the end of every module. The path runs from
      how Solana stores state and executes code, through the language and framework, into
      accounts, instructions, errors, events and calls between programs, then into tokens,
      fees, time-locked balances and sales.
  - question: Is security taught as one chapter at the end?
    answer: >-
      No. Security sits inside every module, attached to whatever building block that module
      introduces. You write code that compiles cleanly and is still broken, watch it fail,
      then add the check that would have caught it.
  - question: Do I have to write tests, or just get the code working?
    answer: >-
      Tests for everything you build. Small ones at the start, full lifecycles and
      attacker-style cases by the end.
---

The Blockchain basics course gave you the vocabulary of blocks, transactions, signatures, fees and validators. This course turns that vocabulary into working code. You will write programs that run on Solana and build the parts of an application that hold funds.

## What's in the course

The opening modules cover the way Solana represents state and runs code. On Ethereum a contract keeps its own storage and decides what to read while it runs. On Solana a program holds no state of its own. The data lives in separate accounts, and every transaction lists in advance the accounts it will touch. The rest of the course depends on this model. From there the course moves into the language and framework, then through the building blocks of a real program: accounts, instructions, errors, events, calls between programs. The second half is the patterns that production code uses: tokens, staking, an automated market maker, price oracles, a Merkle airdrop, on-chain randomness, and the security checks that make the rest of it safe to deploy. The last module before the conclusion covers how the network produces blocks and the outages it went through.

Tests check the theory, and four review tasks ask you to write a complete program: a donor vault, a staking program, a Merkle airdrop and a raffle. Each task builds on the lessons before it.

## How it works

You'll be writing tests for everything you build, small ones at the start, full lifecycles and attacker-style cases by the end. Security checks are part of every module, attached to whichever primitive that module introduces. You'll write code that compiles cleanly and is still broken, watch it fail in the way that real programs fail in production, and rewrite the check that would have caught it. By the end you can predict what your program will do when somebody who is not you sends it a transaction designed to take its money.
