# Voting on token price, with withdrawal

_type: review_task_

In the previous voting task, voters locked their tokens for the entire voting period. After voting ended, the price with the most accumulated weight won.

This task removes that constraint. Voters can withdraw their locked tokens at any point during voting, including before it ends. They can vote, change their mind, withdraw, vote again for something else. This is closer to how real on-chain voting and prediction markets work.

## Changes

How does the contract shape change? That's the design challenge of this task. The exact shape is up to you. There are several valid designs. The spec describes the BEHAVIOR your contract must produce. The implementation is your choice.

You can reuse the contract from the previous voting task as a starting point. Most of the vote/locked-balance bookkeeping carries over. The interesting work is in how you handle the leader question in the presence of withdrawals.

---

## Review grading tasks

1. voting function locks tokens correctly
2. voting function rejects calls after voting end
3. voting function rejects zero amount
4. weights accumulate correctly across votes
5. withdrawal returns tokens and reduces weight
6. withdrawal rejects amounts greater than locked
7. winning price is correct after a simple sequence of votes
8. winning price is correct after a withdrawal that changes who would win
9. tie-breaking rule is documented and applied consistently
10. withdrawal follows checks-effects-interactions
11. voting and withdrawal handle ERC-20 return values
12. no unbounded iteration on voter-controlled data
13. required behaviors are exposed
14. winning price is correct when many distinct prices have been voted on
15. voting is covered by tests
16. withdrawal is covered by tests
17. winning-price correctness is covered by tests
