---
id: 98
title: What Ethereum course is about
type: lecture
order: 1
faq:
  - question: What does the Ethereum track cover?
    answer: >-
      Solidity first, from syntax and types through functions, errors, events, modifiers, and
      inheritance. Then the patterns production contracts are built from: tokens, access
      control, upgradeability, oracles, AMMs, lending, governance.
  - question: Is security a separate module or part of every topic?
    answer: >-
      Part of every topic. You build vulnerable versions of real patterns, watch them get
      drained, and fix them with the test that would have caught the bug. Testing runs
      alongside every project, unit tests early, fuzz and invariant tests later.
---

There is a gap between understanding a blockchain and being able to build something on one that holds funds without losing them. The Blockchain basics course gave you the understanding. This course teaches you how to write the contracts that run on Ethereum.

## You build the vulnerable version first

You'll build vulnerable versions of real patterns, watch them get drained, and fix them with the test that would have caught the original bug. Testing runs alongside every project. Security runs through the whole course rather than appearing as one lecture at the end. The point is to develop the mental models that let you reason about what your contract does when an attacker runs it on a chain you do not control.

## Each topic builds on the previous ones

Before any code, the first two modules explain what Ethereum is and how it works: accounts, gas, the EVM, and consensus. Then comes Solidity, from types to the pieces that hold a contract together: functions, errors, events, modifiers, inheritance. Once the language is in place, the course moves to the patterns that production contracts are built from: tokens, upgradeability, AMMs, oracles, lending, and clear signing. By the time you reach the harder material you already have the vocabulary to read it.
