# Blockchain mechanics - Test

_type: test_

This test checks whether you can reason about how a blockchain actually behaves, not just describe what it is. Each question puts you in a specific situation where the right answer requires applying what you learned. Some options sound right but don't survive a careful read.

---

## Questions

### Q1

How can you get a random number on the blockchain?

a. Using a native node function to get a random number
b. By hashing the newest block's content
c. Every node must compute the same value, so you can't.
d. You can't. Generating a random number is too computationally heavy an operation

### Q2

How many competing block branches can a blockchain have at the same time?

a. Only one. Fork choice rule prevents any other
b. Only two. That's why they're called "forks"
c. As many as there are independent producers in the network
d. Any number

### Q3

A chain produces a new block every 10 seconds. A merchant accepts payment after 6 confirmations. An attacker controls 30% of the network's block-production capacity. Is the merchant safe?

a. Yes. 6 confirmations is the industry standard and stops any reasonable attacker
b. Yes. To reverse a 6-deep block, the attacker would need 50%+ capacity
c. No. A 30% attacker has a real chance of reversing a 6-deep transaction
d. No. Confirmations don't actually reduce the chance of reversal

### Q4

Why can't we select the next block by having all nodes vote, like a presidential election?

a. Voting between thousands of nodes would be too slow for a real-time network
b. Anyone can spin up thousands of fake nodes and outvote honest ones
c. We can vote, but each node first needs to verify its identity with a central authority
d. Without a designated leader to count votes, the network has no way to declare a winner

### Q5

Why can't an attacker quietly change one byte in a block from a year ago?

a. The block is moved to long-term storage that cannot be edited
b. The block's hash would change, breaking the prev_hash in every later block
c. Old blocks are signed by a majority of nodes once a year and locked
d. The attacker needs to control 51% of nodes to make a change

### Q6

Three full nodes received the same transaction to validate. Could they produce different results?

a. Yes, if they have different software versions
b. Yes, if they receive the transaction at slightly different times
c. No, validation of the same transaction produces the same result
d. Yes, if they're located in different timezones
