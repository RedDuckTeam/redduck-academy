---
id: 299
title: Write the exit
type: review_task
order: 3
---

Every protocol stands on things it does not control. This task gives you a round-based game with three of them: an ephemeral rollup that runs the rounds, an external DEX for paying with another token, and an upgrade key held in a third-party multisig with no timelock. All three work on day one, and none of them has a way out.

Your job is to write the exits. For each dependency, decide whether the product would make sense without it. Where it would, give it an exit that exists before it is needed. The players' stakes must come back even if the rollup never settles the round. The swap venue must be replaceable without an upgrade, with a delay, so a stolen admin key cannot switch it at once. For the rollup, also decide whether the rounds should run there at all, and justify it with a Solana limit, not with speed.

Clone the template repository, open `programs/09-write-the-exit`, read `TASK.md`, implement the exits in the program and add tests for them. In `SOLUTION.md`, answer the questions for all three dependencies, including the upgrade key, which has no code. Push your work to your own fork and submit the repository URL.

You are graded on your reasoning as much as on the code.
