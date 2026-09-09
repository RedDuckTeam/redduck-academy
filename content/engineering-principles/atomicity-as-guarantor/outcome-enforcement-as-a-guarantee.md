---
id: 1825950501
title: Outcome enforcement as a guarantee
type: lecture
order: 2
faq:
  - question: Do I need ERC8009 to understand all-or-nothing execution?
    answer: >-
      No. It is one Ethereum application of the guarantee, aimed at the security courses.
  - question: What does ERC8009 check after a call?
    answer: >-
      The caller declares the outcome it requires, that after this call address X holds at
      least Y of token Z. When the call finishes, the EVM compares that declaration against
      real state and reverts the whole transaction if the outcome is missing. BalanceProxy,
      the proxy that runs it, sits at one deterministic address per chain.
  - question: Is this the same mechanism as a flash loan?
    answer: >-
      Yes. One revert, two different declared outcomes. A flash loan enforces that the
      borrowed funds came back by the end of the transaction. ERC8009 enforces that address X
      holds at least Y of token Z.
  - question: Why enforce the outcome instead of simulating the transaction first?
    answer: >-
      A simulation is a prediction you then have to trust. Checking afterwards reads the state
      that exists once the call has run, and a missing result reverts everything.
---

> This lesson is optional. It is for readers going on to the security courses, and it shows how the all-or-nothing guarantee becomes a concrete tool on Ethereum. If you only wanted the principle, you already have it, and you can stop here.

## Handing control to code you did not write

A wallet or a proxy contract often has to hand control to some external application to carry out an action, then confirm the action did what was promised. The common way to check is to simulate the whole transaction off-chain first and read what the simulation says the result would be. The weak point is the trust that the simulation matches what actually runs on-chain. A result that looked right in the preview is only a prediction until the real call executes.

## Declare the outcome, let the chain enforce it

ERC8009 removes the prediction. The caller declares the outcome it requires: after this call, address X holds at least Y of token Z. The EVM is the enforcer. When the call finishes, the real state is checked against that declaration, and if the outcome is not there, the whole transaction reverts as though it never happened.

The proxy at the center of this design, BalanceProxy, does not trust the application it called, the user who initiated the call, or any off-chain simulation. It trusts the state that actually exists once the call has run. The same declared amounts drive a plain balance-diff display, so a person approving the action sees the exact change it will make to their holdings before they sign. BalanceProxy lives at one deterministic address on each chain, so every caller checks outcomes against the same known contract.

## The same revert that powers flash loans

This is all-or-nothing execution applied directly. Rather than adding a permission system or a trusted simulator, the design uses what the platform already guarantees: a transaction either produces the required end state or reverts completely. That is the identical mechanism behind a flash loan, where the transaction reverts if the funds are not repaid within it. A flash loan enforces "the loan was repaid by the end of the transaction". ERC8009 enforces "address X holds at least Y of token Z by the end of the transaction". Two different outcomes, one revert.

## Bypassing the trusted simulation

Seen through [**constraint bypass**](/courses/engineering-principles/constraint-bypass/bypassing-a-constraint), the constraint here is that you cannot verify an outcome without simulating the full transaction off-chain and trusting that simulation. Instead of building a better simulator or a tighter permission list to work around that constraint, ERC8009 enforces the outcome on-chain, which makes the constraint irrelevant. There is no prediction to trust, because the guarantee reads the result after execution and discards everything if the result is wrong. The full design is examined in depth in [the clear signing module](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack).
