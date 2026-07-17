---
id: 168
title: Raffle
type: review_task
order: 4
---

Combine the two Chainlink primitives from this module into one working contract: a price feed values each player's deposit in USD at entry time, and a VRF draw picks the winner after a deadline. Winning probability is proportional to USD weight.

This is your first task with two oracle services working together, and your first asynchronous on-chain flow. The random number does not exist when the draw is requested. It arrives in a separate callback some blocks later, and only the winner can claim the prize pool after that.

The contract design is largely yours. The spec describes what should happen rather than how to build it.
