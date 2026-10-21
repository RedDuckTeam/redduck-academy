---
id: 305
title: Claims in any order
type: review_task
order: 30
---

Two transactions sent at the same time can land on Solana in either order, and either of them can land twice. This task gives you a rewards program where an oracle signs each day's reward as a delta and the program adds it to the device's balance, guarded by a nonce stored in an account. Replay the message and the device is paid twice. Lose a message and the reward is gone. The nonce gives uniqueness and nothing else.

Your job is to make the order stop mattering. The oracle signs the total a device has earned since the beginning, not the day's reward. The device's account stores how much was already paid, and a claim pays the difference and moves the paid amount up to the signed total. A message with a total at or below the paid amount changes nothing. The paid amount never goes down, there is no nonce and no account that remembers which messages were seen, and the signature is checked against the oracle key stored in the program's config with the sysvar address compared before anything is read from it.

Clone the template repository, open `programs/07-claims-in-any-order`, read `TASK.md`, and implement the program until the given test and your own tests pass. Your tests have to send two claims, an older total and a newer one, in both orders, and send the same claim twice, and show that every run ends in the same state. Then fill in `SOLUTION.md`: why a total commutes and a delta does not, what the program compares the message with, and why the nonce account could be removed. Push your work to your own fork and submit the repository URL.

You are graded on your reasoning as much as on the code.
