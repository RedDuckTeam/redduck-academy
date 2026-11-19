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

## A check before the action is only a prediction

A program often has to hand control to code it did not write, then confirm the code did what was promised. One way to check is to simulate the whole operation first and read what the simulation says the result would be. The weak point is the trust that the simulation matches what actually runs. A result that looked right in the simulation is only a prediction until the real call executes.

## Declare the outcome and check it in the same transaction

**Outcome enforcement** moves the check after the action. The caller declares the outcome it requires. The action runs, and then, inside the same transaction, the real state is checked against that declaration. A transaction is the all-or-nothing unit from [the previous lesson](/courses/engineering-principles/atomicity-as-guarantor/atomicity-as-a-security-primitive), so if the outcome is not there, the whole transaction rolls back as though it never happened. The check trusts neither the called code nor any simulation, only the state that exists once the call has run.

Say the caller's balance is 500 and it requires at least 600 after the call. If the call leaves 590, everything the called code did is undone and the balance is 500 again.

## Only the declared outcome is guaranteed

The check reads what was declared and nothing else, so anything the called code changed that the declaration does not mention goes through. Before you rely on an enforced outcome, list what the called code is able to change and compare the list with what you declared.

## Blockchain application

A flash loan, described in the previous lesson, is outcome enforcement with the declared outcome "the loan was repaid by the end of the transaction". ERC-8009, a proposed Ethereum standard, uses the same revert for "the balance of address X in token Z changed by at least Y by the end of the transaction". The call goes through a proxy contract, BalanceProxy, at one canonical address on each chain, and a hardware wallet shows the declared amounts before the user signs. [ERC-8009: sign the outcome](/courses/development-on-ethereum/clear-signing/erc-8009-sign-the-outcome) covers the design, and [The core and its routers](/courses/development-on-ethereum/clear-signing/the-core-and-its-routers) covers what stays unchecked, such as an NFT moved by a transaction that met every declared balance requirement.
