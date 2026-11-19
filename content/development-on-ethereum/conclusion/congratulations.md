---
id: 206
title: Congratulations
type: lecture
order: 1
faq:
  - question: I finished the Ethereum track. What should I do next?
    answer: >-
      Keep building. Read one protocol's codebase end to end, build something of your own, or
      apply for an audit role.
---

You reached the end of Development on Ethereum.

A real protocol answers several of the course's constraints in one swap. Take a swap on Uniswap V2, whose pair contract you rebuilt in the [AMM Pair task](/courses/development-on-ethereum/defi-tasks-and-patterns/amm-pair):

* The pair holds two tokens and keeps `x * y = k`, so the price comes out of the reserves and nobody maintains an order book, which is the **[AMM](/courses/development-on-ethereum/defi-tasks-and-patterns/amm)**.
* A pending swap is visible before it executes, and whoever builds the block chooses the order of transactions. So the swap takes a minimum output and a deadline from the user and reverts if it cannot meet them, which is the defense from **[front-running and MEV](/courses/development-on-ethereum/token-security-and-evm-internals/front-running-and-mev)**.
* One large swap moves the ratio of the reserves, and a **[flash loan](/courses/development-on-ethereum/oracles/flash-loans)** supplies the capital for it inside one transaction. So no other contract should trust the pair's current price.
* Every swap therefore adds the last price, multiplied by the time it held, to a running total, and a reader takes the average over a window. This is the **[TWAP oracle](/courses/development-on-ethereum/oracles/twap-oracles)**, and its cost is a price that lags the market.

## What to do with it

Read the Uniswap V2 contracts end to end, starting with the pair. You have written your own version, so look for what yours left out: the factory, the router, flash swaps. For each one, work out which constraint it answers before you read how it is done.

If you continue with Development on Solana, its [AMM lesson](/courses/development-on-solana/production-state-design/amm) builds the same pool differently. A Solana program is stateless code, so the pool is a set of accounts that every transaction has to name in advance, not a contract that holds its own tokens.
