---
title: Dependency Independency
type: lecture
order: 1
---

You reached the end of Solana PRO. Now you know the patterns that the top Solana protocols share, the constraint behind each of them, and the point where each one stops working.

Real protocols use several patterns in one feature. Helium, for example:
* The oracles' keys are stored in the protocol's own account, and a reward update counts only if one of those keys signed it, which is the *root of trust*. 
* Anyone can send the transaction that pays, which is the *untrusted executor*. 
* The device's account stores how much was already paid, and the payout is the difference to the signed total, which is *lazy loading*. 
* The paid amount only goes up. A repeated payout sends zero, and a total smaller than what was already paid is rejected, which is *one-way state*. 

The developers of such protocols are usually pretty smart, and all of these patterns were integrated in one feature not because they just wanted to do it, but because each pattern was the answer to a particular constraint.

## What to do with it

Try to pick a protocol you use and read its program end to end. It doesn't matter if it will be Drift (Velocity), Kamino, Squads or Helium, they all are good places to start, and every one of them appeared in this course. Give yourself a moment to find the patterns we discussed. If you've found more patterns - feel free to submit a PR to this academy and describe the pattern you've found.

But don’t be an overengineering engineer: write the constraints you have first and only after this try to apply the patterns. Each pattern you bring to the protocol simply because you learned it would only add complexity to your protocol and make the likelyhood of making a mistake higher.

***As a team that spent multiple months researching and describing the patterns that you've learned throughout this module, we'd like to thank you for your dedication in getting to this point.***

***Good luck!***
