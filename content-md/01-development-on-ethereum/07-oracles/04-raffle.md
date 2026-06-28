# Raffle

_type: review_task_

Combine the two Chainlink primitives from this module into one working contract: a price feed values each player's deposit in USD at entry time, and a VRF draw picks the winner after a deadline. Winning probability is proportional to USD weight.

This is your first task with two oracle services working together, and your first asynchronous on-chain flow. The random number does not exist when the draw is requested. It arrives in a separate callback some blocks later, and only the winner can claim the prize pool after that.

The contract design is largely yours. The spec describes what should happen, not how to build it.

---

## Review grading tasks

1. contract compiles and the required functions exist
2. deposit pulls tokens, snapshots USD weight, and records the entry
3. deposit rejects zero amount and unsafe prices
4. deposit rejects after the deadline and after the draw has been requested
5. drawWinner requests randomness after the deadline
6. drawWinner rejects bad timing and double draws
7. fulfillRandomWords is minimal and validates the request id
8. claim verifies entry ownership and winning position
9. claim transfers the full pot once
10. no unbounded iteration in claim or the callback
