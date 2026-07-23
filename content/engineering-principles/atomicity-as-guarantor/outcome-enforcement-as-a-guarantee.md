---
id: 1825950501
title: Outcome enforcement as a guarantee
type: lecture
order: 2
faq:
  - question: Is this lesson required, or can I skip it?
    answer: You can skip it. It is an optional preview for readers going on to the
      security courses. The engineering principle it rests on, all-or-nothing execution,
      was already covered, so skipping the Ethereum details here costs you nothing.
  - question: How is ERC8009 related to a flash loan?
    answer: Both rely on the same guarantee that a transaction either reaches a required
      end state or reverts completely. A flash loan reverts if the borrowed funds are
      not repaid inside the transaction. ERC8009 reverts if the declared balance is not
      present after the call. The enforcing mechanism is the same.
  - question: Why is enforcing the outcome better than simulating the transaction first?
    answer: A simulation predicts what should happen and then asks you to trust that the
      real execution matches the prediction. Enforcing the outcome checks the actual
      state after the call has run, so there is nothing to trust in advance. If the
      promised result is missing, the transaction leaves no trace.
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
