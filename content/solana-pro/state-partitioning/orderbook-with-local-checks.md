---
title: Orderbook with local checks
type: review_task
order: 30
---

A sorted list costs O(n) to insert into, and on-chain O(n) over data that anyone can add is an invitation to fill the list until nobody can use it. This task gives you an order book kept as a fixed array of cells in one account, where every order points to its price neighbors by cell number. Placing an order walks the list from the head to find the right place, so every new order pays for every order before it.

Your job is to move the search off-chain and leave the program only the check. The client finds the place and sends the cell number of the order the new one goes after. The program checks the two neighbors: the one before is not cheaper, the one after is cheaper, both are alive, and refuses the order otherwise, including the case where another order landed first and the neighbors changed. Cancelling relinks the neighbors and frees the cell. The program must read only the cells it needs, not the whole book, and each order has to lock funds, so that filling every free cell costs the attacker real money.

Clone the template repository, open `programs/05-orderbook-with-local-checks`, read `TASK.md`, and implement the program until the given test and your own tests pass. Your tests have to show an insertion at the head, in the middle and at the tail, a wrong hint refused, a hint that went stale after another insertion refused, and a cancel that relinks correctly. Then fill in `SOLUTION.md`: the complexity of placing an order on-chain and off-chain, why the capacity is fixed, and what an attacker could do if it were not. Push your work to your own fork and submit the repository URL.

You are graded on your reasoning as much as on the code.
