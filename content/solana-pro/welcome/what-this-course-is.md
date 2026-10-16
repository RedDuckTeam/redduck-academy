---
id: 1897637822
title: What this course is
type: lecture
order: 1
faq:
  - question: Where do the patterns in this course come from?
    answer: >-
      From the TOP-50 protocols in the Solana ecosystem by TVL and volume, grouped by the protocol nature. We read their code, looked for the
      design decisions that the engineers made, and gave those decisions names.
      Nothing here is invented for the course; every pattern is something that already runs in
      production.
  - question: Do I need to have finished the Development on Solana course first?
    answer: >-
      You need to be comfortable writing and reading Solana programs: accounts, PDAs, CPI,
      signers, and how a transaction is built. The course does not re-teach those. There are patterns that you'd understand without even knowing how to code, but it is highly preferrable that you can read an Anchor program and say what it checks and what it trusts.
  - question: What does the course cover?
    answer: >-
      The most repeated patterns across Solana's TOP protocols, similarly to the design patterns (dependency injection, dependency rejection, inversion of control), but Solana/Web3 style.
  - question: Why name a pattern at all?
    answer: >-
      A pattern that has no name lives in one engineer's head and is rediscovered, badly, by
      everyone else. A named pattern can be taught, recognized in a code review, and argued
      about. Naming is what turns an instinct into a tool.
---

This is a course about the decisions that the best Solana engineers make without being told. We received a grant from Solana Superteam Ukraine for its implementation. The work behind the course included reading how the protocols are built, what trade-offs they had and what issues they faced due to their architecture later on. We inferred the mindset that many top engineers seemed to share, and that mindset shows up in the code as patterns.

## Patterns nobody wrote down

Whether the subject is tokenomics, engineering or software architecture, the best decisions almost never come from copying what a book says. They come from a strong intrinsic sense of how a system should be shaped, backed by knowledge of patterns that have already survived contact with real users and real money. Most of those patterns go unnamed. They live in people's heads are rediscovered from scratch by everyone who was not in the room.

We decided to change that. We analyzed the protocols, inferred the patterns they share, and gave each one a name. That is what you will find here. You no longer need to have been in a room with a Raydium or Pump.fun developer in order to know a pattern. Most of them are here already. There might be many that are still unnamed, but the ones that are named in this course are seen across TOP-50 Solana protocols, which makes them some of the most important ones. Each lesson takes one pattern, says exactly what it is, shows where it comes from, and explains what it lets you do and what it costs.

## How it's written

Straight to the point. You will not find formal or padded language here. It will be heavy on logical and engineering thinking. You will find precise definitions and explanations with live protocol examples.