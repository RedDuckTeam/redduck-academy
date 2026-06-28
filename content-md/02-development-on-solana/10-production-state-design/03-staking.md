# Staking

_type: review_task_

Time for your second Solana program. The RDDK Staking task is small in shape: four instructions, three account types, a three-day lock. If you understand stake → wait → claim → burn, you understand the flow. The logic is straightforward.

The real point of this milestone is the design work. The first task handed you everything: the field names, the seeds, the exact instruction signatures. This one hands you the four instruction names and the lock duration. The account layouts, the errors, the Accounts contexts, the handler bodies, and most of the tests are yours to design. There's no checklist to follow line by line. You have to read the flow, think about what state each instruction needs to read and write, and decide where it lives.

The interesting constraint sits at the token layer. vRDDK is the receipt token users get back when they claim, and it has to be non-transferable. If it could be moved between wallets, anyone holding it could drain the vault, regardless of who originally deposited.

---

## Review grading tasks

1. Config account stores both mint pubkeys
2. stake transfers RDDK from the user to the vault
3. stake records the amount and the current time on a fresh position account
4. each stake call creates a distinct position addressable later
5. claim rejects calls before the lock has elapsed
6. claim mints vRDDK 1:1
7. claim consumes the position so it cannot be claimed twice
8. unstake burns vRDDK and releases an equal amount of RDDK
9. unstake's burn amount and transfer amount are tied together
10. stake and unstake reject zero amounts
11. A test exercising the full stake → claim → unstake cycle
12. Tests for additional error cases
13. initialize is one-time and cannot be re-run on the same config
14. claimed test coverage matches actual test behavior
