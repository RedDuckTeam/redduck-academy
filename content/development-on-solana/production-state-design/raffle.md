---
id: 223
title: Raffle
type: review_task
order: 40
---

The Raffle is a deceptively small program: deposit tokens to enter, more tokens means better odds, after the deadline a winner gets the whole pot. The interesting part is making "better odds proportional to deposit" actually true on chain, in a way that's verifiable, fair, and doesn't require the program to loop over thousands of entries to figure out who won.

The randomness piece is mostly wired for you. MagicBlock VRF is already integrated through the starter, and you have an oracle that calls back with a random value. What you have to design is everything that uses that value. The "puzzle" the TASK mentions is the data structure question: how do you store entries so that a single random number unambiguously identifies one winner, weighted by deposit size, without the program having to walk every entry to find them?
