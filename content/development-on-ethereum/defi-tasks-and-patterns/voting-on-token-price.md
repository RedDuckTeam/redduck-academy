---
id: 147
title: Voting on token price
type: review_task
order: 2
---

In this project you'll build a real piece of governance infrastructure. The contract lets holders of your ERC-20 token decide the next price. This is the same primitive used in DAOs, prediction markets, and on-chain auctions, scaled down to a single decision: what should the token's price be?

You'll use the ERC-20 token from your previous capstone task. That token represents voting power. Anyone holding it can lock some of their tokens during the voting period, attached to a price they're proposing. After voting ends, the price with the most tokens behind it wins and is applied to the contract's state.

Two things make this task more than just an exercise. First, the option space is unbounded. Voters can propose ANY uint256 as a price rather than picking from a fixed list. Second, you'll write the tests yourself. The previous lesson taught you how to test Solidity contracts with Hardhat 3 and viem. This is where you apply that skill to a contract you wrote.

After your contract and tests pass, take 5 minutes to write a short note, either in a markdown file or as comments at the top of your contract, answering: **what would break if voters could withdraw their locked tokens DURING the voting period, before ****`votingEnd`****?  **Be specific about which state variable would go wrong and why. This question sets up the next lesson, which is about solving exactly this problem.
