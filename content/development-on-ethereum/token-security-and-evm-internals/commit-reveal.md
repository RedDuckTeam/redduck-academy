---
id: 155
title: Commit-reveal
type: coding_task
order: 7
---

Two players play one round of rock-paper-scissors. The problem: if either player just submits their move directly, the other can see it in the mempool and beat it. Commit-reveal solves this. First each player submits `keccak256(move, salt, player)` as a commit. After BOTH commits are in, each reveals their `move` and `salt` and the contract verifies the hash matches.

## Examples

**Example 1: Rock beats Scissors.**

- P1 calls commit(keccak256(abi.encode(Move.Rock, salt1, P1)))
- P2 calls commit(keccak256(abi.encode(Move.Scissors, salt2, P2)))
- P1 calls reveal(Move.Rock, salt1)
- P2 calls reveal(Move.Scissors, salt2)
**winner == P1, settled == true**

**Example 2: Tie when both play the same move.**

- P1 calls commit(keccak256(abi.encode(Move.Rock, salt1, P1)))
- P2 calls commit(keccak256(abi.encode(Move.Rock, salt2, P2)))
- P1 calls reveal(Move.Rock, salt1)
- P2 calls reveal(Move.Rock, salt2)
**winner == address(0), settled == true**

**Example 3: P2 cannot steal P1's reveal.**

- P1 calls commit(keccak256(abi.encode(Move.Rock, salt1, P1)))
- P2 calls commit(someOtherHash)
- P2 calls reveal(Move.Rock, salt1)
**reverts HashMismatch**
