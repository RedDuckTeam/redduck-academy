---
id: 149
title: Voting on token price, with withdrawal
type: review_task
---

In the previous voting task, voters locked their tokens for the entire voting period. After voting ended, the price with the most accumulated weight won.

This task removes that constraint. Voters can withdraw their locked tokens at any point during voting, including before it ends. They can vote, change their mind, withdraw, vote again for something else. This is closer to how real on-chain voting and prediction markets work.

## Changes

How does the contract shape change? That's the design challenge of this task. The exact shape is up to you. There are several valid designs. The spec describes the BEHAVIOR your contract must produce. The implementation is your choice.

You can reuse the contract from the previous voting task as a starting point. Most of the vote/locked-balance bookkeeping carries over. The interesting work is in how you handle the leader question in the presence of withdrawals.
