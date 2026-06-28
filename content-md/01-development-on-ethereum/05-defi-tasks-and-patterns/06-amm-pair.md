# AMM Pair

_type: review_task_

## Background

You've built tokens and you've distributed them. Now you'll build the market that prices them.

Most on-chain trading does not happen on order books. It happens on automated market makers, contracts that hold reserves of two tokens and quote prices algorithmically instead of matching buyers and sellers. The order-book model is expensive on chain: every quote update is a transaction, every cancel is a transaction. An AMM replaces all of that with one math rule applied by the contract on every swap.

You saw the rule in the AMM lecture. A pool holds reserves of two tokens, and the contract enforces that the product of the reserves stays constant across every swap. That single invariant gives you a working market: prices come out of the reserves' ratio, large trades push the pool further along the curve and pay worse rates, and the system needs no external price feed to function. The lecture worked through the math with concrete numbers. This task asks you to make it real.

The pool also has to support liquidity providers. Someone has to put the initial tokens into the pool, and they need a way to get them back out later. The contract represents each LP's share of the pool as a balance in its own ERC-20. The pool itself is a token contract, where holding the pool's tokens represents holding a slice of its reserves. Deposit both underlying tokens, mint LP tokens. Burn LP tokens, withdraw a proportional slice of both reserves. The 0.3% fee on every swap accrues to LPs implicitly: it stays in the pool, the LP supply does not grow, and each LP token claims a bigger share over time.

This task folds two layers of the standard architecture into a single contract. Production systems separate the core, which holds the reserves, from a friendlier wrapper, which pulls user tokens and computes outputs. Here, the contract does both. It pulls input tokens with `transferFrom`, computes the output internally, and transfers the result back to the caller. No external router, no factory, no flash swaps, no native ETH support.

The lecture also flagged one subtle security issue: the first depositor into a fresh pool can manipulate the LP-token share price for the next depositor, unless the contract permanently locks a small amount of LP supply on the first mint. This task requires that defense. The other safety details, including slippage protection, input validation, and k-invariant preservation, are spelled out in the function specs below.

---

## Review grading tasks

1. contract compiles and exposes the expected interface
2. getAmountOut applies the 0.3% fee
3. getAmountOut reverts on zero input and empty pool
4. addLiquidity pulls tokens and emits LiquidityAdded
5. addLiquidity locks MINIMUM_LIQUIDITY on the first deposit
6. addLiquidity uses min-ratio for subsequent depositors
7. addLiquidity rejects zero amounts and zero liquidity
8. removeLiquidity returns pro-rata share and burns LP
9. swap handles both directions correctly
10. swap enforces slippage protection
11. swap rejects invalid tokenIn
12. k invariant does not decrease across swaps
13. reserves stay in sync with balances
14. tests cover liquidity provision and removal
15. tests cover swap behavior
