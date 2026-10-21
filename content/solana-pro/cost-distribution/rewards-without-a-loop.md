---
title: Rewards without a loop
type: review_task
order: 30
---

A staking pool has to pay every staker their share of every reward, and on Solana there is no transaction that can visit every staker. This task gives you a pool where rewards are distributed by a loop: the instruction takes the stakers as remaining accounts and credits each of them. It works for three stakers in a test and fails for three hundred.

Your job is to pay any number of stakers without a loop. The pool keeps one number, the reward per staked token, and a reward only moves that number. Each staker's account keeps the value of that number at their last claim, and a claim pays the difference times their stake. A deposit or a withdrawal settles what the staker is owed before the stake changes, never after. A staker who never claims has to be owed exactly the right amount whenever they come.

Clone the template repository, open `programs/04-rewards-without-a-loop`, read `TASK.md`, and implement the program until the given test and your own tests pass. Your tests have to show three stakers with rewards arriving between their actions, each paid the right amount in whatever order they claim, and a deposit that does not change what was owed before it. Then fill in `SOLUTION.md`: the two numbers and the formula, why the order of settling and changing the stake matters, what happens to a staker nobody touches, and which action in this design would still need a paid executor. Push your work to your own fork and submit the repository URL.

You are graded on your reasoning as much as on the code.
