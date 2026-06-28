# Academy token

_type: review_task_

You have the toolkit. The last module walked you through every piece of Solidity you need to write a real, useful contract: mappings keyed by address, structs, events, custom errors, modifiers, inheritance, payable functions. You've built two contracts already, but both were exercises designed to drill specific lessons. This one is different. The contract you write here is the contract future lessons in this course will actually use.

## The story

The academy is launching its own token. Future lessons will deploy it in worked examples: a staking contract that pays rewards in this token, a vesting schedule for the team, a DEX where it trades against ETH. Before any of that can happen, the token itself has to exist. That's what you're building now.

Call it whatever you want. The name and symbol are constructor parameters.

## What to do

Fork the repository and read `TASK.md` for the full setup. The starter contract is there with the function signatures, the interface it inherits from, and the test suite. Your job is to fill in the bodies so every test passes. The tests double as the spec: every behavior the contract must exhibit is encoded in a test.

The contract is small. Around 80-120 lines depending on how concise your code is.

## The one rule

**Don't look up someone else's implementation.** Not OpenZeppelin, not Solmate, not Solady, not a tutorial blog. Not "just to understand the structure." Not for five seconds while you're stuck.

The reason isn't moral. It's that every line you copy from an existing implementation is a line you don't understand. When you later have to debug a token contract in production, modify one for a specific use case, or audit one written by someone else, you'll need to actually know how every piece works. The OpenZeppelin implementation is excellent code. It's also written by people who already understood the standard before they wrote it. You're trying to become one of those people. Copying skips the only step that matters.

Everything you need is in the tests and in this course's prior lessons. The Solidity documentation is fine. The academy chat is fine when you're truly stuck. Someone else's contract is not.

## What you've actually built

When you finish, you'll have written ERC-20, the most widely used smart contract standard on Ethereum. Every fungible token on Ethereum implements the same interface you just implemented: USDC, DAI, UNI, LINK, all of them. The next lesson covers what ERC-20 is, why it's structured the way it is, and how the rest of the ecosystem builds on top of it. By then, you'll already know the answer from the inside.

Good luck.

---

## Review grading tasks

1. Contract inherits from IERC20
2. Storage for balances and allowances exists
3. transfer works correctly
4. approve works correctly
5. transferFrom works correctly
6. Constructor sets up initial state
7. No copying from existing implementations
8. Uses custom errors instead of require strings
9. State variables are ordered for storage packing
10. Function visibility is appropriate.
11. Internal helpers used to reduce duplication 
12. No dead code, unused imports, or unused variables.
