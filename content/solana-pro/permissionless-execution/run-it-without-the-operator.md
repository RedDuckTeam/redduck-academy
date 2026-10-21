---
title: Run it without the operator
type: review_task
order: 30
---

A protocol that needs its own server is alive exactly as long as that server. This task gives you a rewards program with two such servers built in: an admin-only instruction that pays rewards to users, and a price that only the team's bot may write. Both work on day one, and the protocol stops the day the bot stops.

Your job is to remove the operator. Open the claim to anyone: a random wallet can claim for any user, the reward goes to that user no matter who sent the transaction, and the caller keeps a small part of the payout as the fee for sending it. Then turn the price around: instead of a bot that writes it, whoever needs the price brings a signed update with the transaction, and the program checks the signature against the oracle key it stores and refuses an update that is too old. When you are done, nothing in the program should need the team's key except changing the settings.

Clone the template repository, open `programs/03-run-it-without-the-operator`, read `TASK.md`, and implement the program until the given test and your own tests pass. Your tests have to show a wallet that is not the admin and not the bot claiming for someone else and getting paid for it, and a trade that works with no bot running. Then fill in `SOLUTION.md`: why the result of the claim does not depend on the caller, how you sized the caller's reward, and what still needs the admin and why. Push your work to your own fork and submit the repository URL.

You are graded on your reasoning as much as on the code.
