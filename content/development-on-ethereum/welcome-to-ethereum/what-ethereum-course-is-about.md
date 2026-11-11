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

## What's in the course

This track starts with the language – syntax, types, and pieces that hold a contract together: functions, errors, events, modifiers, inheritance. Once the language is in place, the course moves to the patterns that production contracts are built from: tokens, access control, upgradeability, oracles, AMMs, lending, governance. 

## How it works

You are going to test runs throughout every project. First, simple unit tests; later, fuzz and invariant tests. Security runs through the whole course so you'll be building vulnerable versions of real patterns, watching them get drained, and fixing them with the test that would have caught the original bug. The point is to develop the mental models that let you reason about what your contract does when an attacker runs it on a chain you do not control.
