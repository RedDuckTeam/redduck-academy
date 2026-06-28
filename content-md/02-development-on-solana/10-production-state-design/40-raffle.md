# Raffle

_type: review_task_

The Raffle is a deceptively small program: deposit tokens to enter, more tokens means better odds, after the deadline a winner gets the whole pot. The interesting part is making "better odds proportional to deposit" actually true on chain, in a way that's verifiable, fair, and doesn't require the program to loop over thousands of entries to figure out who won.

The randomness piece is mostly wired for you. MagicBlock VRF is already integrated through the starter, and you have an oracle that calls back with a random value. What you have to design is everything that uses that value. The "puzzle" the TASK mentions is the data structure question: how do you store entries so that a single random number unambiguously identifies one winner, weighted by deposit size, without the program having to walk every entry to find them?

---

## Review grading tasks

1. initialize creates the raffle config with a deadline and the trusted oracle
2. vault is a token account owned by a program-controlled PDA
3. deposit enforces the deadline
4. deposit transfers tokens to the vault and records the entry
5. request_randomness enforces the deadline and single-use semantics
6. claim transfers the entire vault balance to the winner
7. claim enforces single-use semantics
8. there is a test for a winning claim
9. there is a test for an invalid claim
10. claim verifies the winner without unbounded iteration
11. initialize is one-time and cannot be re-run on the same config
12. claimed test coverage matches actual test behavior
