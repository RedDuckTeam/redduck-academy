---
id: 95
title: Blockchain mechanics - Test
type: test
order: 8
---

This test checks whether you can reason about how a blockchain actually behaves, rather than just describe what it is. Each question puts you in a specific situation where the right answer requires applying what you learned. Some options sound right but don't survive a careful read.

<!-- q:6a0c536b2558efa5eb348bc8 -->
How can you get a random number on the blockchain?

- [ ] Using a native node function to get a random number  <!-- a:6a0c53972558efa5eb348bc9 -->
- [ ] By hashing the newest block's content to get a value no one can predict.  <!-- a:6a0c55862558efa5eb348bca -->
- [x] Every node must compute the same value, so you can't.  <!-- a:6a0c55b12558efa5eb348bcb -->
- [ ] You can't. Generating a random number is too computationally heavy an operation  <!-- a:6a0c56162558efa5eb348bcc -->

<!-- q:6a0c57402558efa5eb348bcd -->
At a given moment, how many competing versions of the chain can exist before the network settles on one?

- [ ] Exactly one. The fork-choice rule stops a second branch from ever forming.  <!-- a:6a0c58dd2558efa5eb348bce -->
- [ ] At most two, which is why a split is called a fork.  <!-- a:6a0c58e32558efa5eb348bcf -->
- [ ] A fixed maximum set by the protocol's configuration.  <!-- a:6a0c590e2558efa5eb348bd0 -->
- [x] Any number. The protocol sets no limit.  <!-- a:6a0c59152558efa5eb348bd1 -->

<!-- q:6a0c6af12558efa5eb348bd2 -->
A chain produces a new block every 10 seconds. A merchant accepts payment after 6 confirmations. An attacker controls 30% of the network's block-production capacity. Is the merchant safe?

- [ ] Yes. 6 confirmations is the industry standard and stops any reasonable attacker  <!-- a:6a0c6af72558efa5eb348bd3 -->
- [ ] Yes. To reverse a 6-deep block, the attacker would need 50%+ capacity  <!-- a:6a0c6b012558efa5eb348bd4 -->
- [x] No. A 30% attacker has a real chance of reversing a 6-deep transaction  <!-- a:6a0c6b0c2558efa5eb348bd5 -->
- [ ] No. Confirmations don't actually reduce the chance of reversal  <!-- a:6a0c6b142558efa5eb348bd6 -->

<!-- q:6a0cb964cec8eb3285202f56 -->
Why can't we select the next block by having all nodes vote, like a presidential election?

- [ ] Voting between thousands of nodes would be too slow for a real-time network  <!-- a:6a0cb968cec8eb3285202f57 -->
- [x] Anyone can spin up thousands of fake nodes and outvote honest ones  <!-- a:6a0cb972cec8eb3285202f58 -->
- [ ] We can vote, but each node first needs to verify its identity with a central authority  <!-- a:6a0cb9bfcec8eb3285202f59 -->
- [ ] Without a designated leader to count votes, the network has no way to declare a winner  <!-- a:6a0cb9d6cec8eb3285202f5a -->

<!-- q:6a0cba85cec8eb3285202f5b -->
Why can't an attacker quietly change one byte in a block from a year ago?

- [ ] The block is moved to long-term storage that cannot be edited  <!-- a:6a0cbb45cec8eb3285202f5c -->
- [x] The block's hash would change, breaking the prev_hash in every later block  <!-- a:6a0cbb47cec8eb3285202f5d -->
- [ ] Old blocks are signed by a majority of nodes once a year and locked  <!-- a:6a0cbb55cec8eb3285202f5e -->
- [ ] The attacker needs to control 51% of nodes to make a change  <!-- a:6a0cbb64cec8eb3285202f5f -->

<!-- q:6a0cbc0bcec8eb3285202f60 -->
Three full nodes running the same client validate the same transaction. Could they reach different results?

- [ ] Yes, if they have different software versions  <!-- a:6a0cbc27cec8eb3285202f61 -->
- [ ] Yes, if they receive the transaction at slightly different times  <!-- a:6a0cbc32cec8eb3285202f62 -->
- [x] No, validation of the same transaction produces the same result  <!-- a:6a0cbc61cec8eb3285202f63 -->
- [ ] Yes, if they're located in different timezones  <!-- a:6a0cbc87cec8eb3285202f64 -->
