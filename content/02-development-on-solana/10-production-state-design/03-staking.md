---
id: 204
title: Staking
type: review_task
---

Time for your second Solana program. The RDDK Staking task is small in shape: four instructions, three account types, a three-day lock. If you understand stake → wait → claim → burn, you understand the flow. The logic is straightforward.

The real point of this milestone is the design work. The first task handed you everything: the field names, the seeds, the exact instruction signatures. This one hands you the four instruction names and the lock duration. The account layouts, the errors, the Accounts contexts, the handler bodies, and most of the tests are yours to design. There's no checklist to follow line by line. You have to read the flow, think about what state each instruction needs to read and write, and decide where it lives.

The interesting constraint sits at the token layer. vRDDK is the receipt token users get back when they claim, and it has to be non-transferable. If it could be moved between wallets, anyone holding it could drain the vault, regardless of who originally deposited.
