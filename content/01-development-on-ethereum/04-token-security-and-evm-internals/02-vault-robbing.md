---
id: 141
title: Vault robbing
type: coding_task
---

This contract has two security vulnerabilities. Your job is to find them and fix them.

You haven't been formally taught how to defend against these specific attacks yet. That's intentional. Read the code carefully, run the tests, observe what happens when they fail, and try to reason about what's going wrong. The lesson that follows this task explains the attacks formally, and you'll understand it much more deeply if you've already wrestled with the problem.

## What the contract does

`Vault` is a simple ETH deposit contract. Anyone can call `deposit()` to send ETH and get credited with a balance. Depositors can call `withdraw(amount)` to pull their funds back at any time. The contract tracks all depositors in an array so the owner can call `emergencyRefundAll()` to refund every depositor in one transaction if something goes wrong. There's also a view function `getBalance(address)` for inspecting balances, and a `receive()` that rejects direct ETH transfers to force everything through `deposit()`.

## A note on the experience

You will get stuck. That's part of the design. If you've tried for a while and feel like you're not making progress, look at WHICH test is failing and what its name implies about what's being tested. Form a theory. Try something. Run the tests again. The struggle is where the learning happens.
