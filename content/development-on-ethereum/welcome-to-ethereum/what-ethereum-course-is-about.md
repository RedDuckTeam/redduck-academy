---
id: 98
title: What Ethereum course is about
type: lecture
order: 1
faq:
  - question: Why is Ethereum development taught as a separate track from the
      blockchain basics?
    answer: Because there is a real gap between understanding how a blockchain works
      and being able to build something on one that holds funds without losing
      them. The basics module explains what Ethereum is; this track teaches you
      to actually write the contracts that run on it. Closing that gap between
      knowledge and safe, working code is the whole point of these lessons.
  - question: How is security taught in this Ethereum course?
    answer: Security runs through the entire course rather than being a single
      lecture at the end. You build vulnerable versions of real patterns, watch
      them get drained, and then fix them with the test that would have caught
      the original bug. Testing runs alongside every project too, starting with
      simple unit tests and moving to fuzz and invariant tests, so the goal is
      developing mental models for what your contract does when an attacker runs
      it, not memorizing syntax.
---

This is the part of the course where you stop reading about blockchains and start building on one. The basics module taught you what Ethereum is and how it works. This track teaches you how to write the contracts that run on it. It is a separate track because there is a real gap between understanding a blockchain and being able to build something on one that holds funds without losing them. Closing that gap is what these lessons are for.

## What's in the course

This track starts with the language itself. Syntax first, then types, then the pieces that hold a contract together: functions, errors, events, modifiers, inheritance. Once the language is in place, the course moves to the patterns that production contracts are built from. Tokens, access control, upgradeability, oracles, AMMs, lending, governance. Each topic builds on the previous ones, so by the time you reach the harder material you already have the vocabulary to read it.

## How it works

Testing runs alongside every project. Simple unit tests early, fuzz and invariant tests later. Security runs through the whole course rather than appearing as one lecture at the end. You'll build vulnerable versions of real patterns, watch them get drained, and fix them with the test that would have caught the original bug. The point is not to memorize Solidity syntax. The point is to develop the mental models that let you reason about what your contract does when an attacker runs it on a chain you do not control.
