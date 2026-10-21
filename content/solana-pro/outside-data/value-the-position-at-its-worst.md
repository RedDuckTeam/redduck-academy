---
id: 298
title: Value the position at its worst
type: review_task
order: 4
---

Every number a lending market gets from outside the chain is a guess, and the program has to act on it inside one transaction. This task gives you a small market with one collateral token and one debt token, both priced by Pyth, and leaves out exactly the part the last three lectures were about: how the position is valued.

The deposit, the accounts and the token flows are done. You write the price reading and the two checks. Collateral is valued at the low end of its band and debt at the high end. A price older than the market allows is refused. Borrowing stops at one line and liquidation starts at a looser one, so a liquidation is never refused by a rule that only protects new loans. And one value comes from the market's own state instead of the oracle: the market keeps its own average of the collateral price, so a short spike cannot be borrowed against before it has lasted.

Clone the template repository, open `programs/08-value-the-position`, read `TASK.md`, and implement the program until the given test and your own tests pass. Then fill in `SOLUTION.md`: which end of the band each value uses and why, why the two lines differ, and what the market's own average protects against. Push your work to your own fork and submit the repository URL.

You are graded on your explanation as much as on the code.
