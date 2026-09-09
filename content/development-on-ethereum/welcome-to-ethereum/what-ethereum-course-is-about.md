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

This is the part of the course where you stop reading about blockchains and start building on one. The basics module taught you what Ethereum is and how it works. This track teaches you how to write the contracts that run on it. It is a separate track because there is a real gap between understanding a blockchain and being able to build something on one that holds funds without losing them. Closing that gap is what these lessons are for.

## What's in the course

This track starts with the language itself. Syntax first, then types, then the pieces that hold a contract together: functions, errors, events, modifiers, inheritance. Once the language is in place, the course moves to the patterns that production contracts are built from. Tokens, access control, upgradeability, oracles, AMMs, lending, governance. Each topic builds on the previous ones, so by the time you reach the harder material you already have the vocabulary to read it.

## How it works

Testing runs alongside every project. Simple unit tests early, fuzz and invariant tests later. Security runs through the whole course rather than appearing as one lecture at the end. You'll build vulnerable versions of real patterns, watch them get drained, and fix them with the test that would have caught the original bug. The point is not to memorize Solidity syntax. The point is to develop the mental models that let you reason about what your contract does when an attacker runs it on a chain you do not control.
