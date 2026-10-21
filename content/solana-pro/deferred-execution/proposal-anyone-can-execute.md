---
title: Proposal that anyone can execute
type: review_task
order: 40
---

A signed transaction on Solana lives for about a minute, so a decision that takes days to approve cannot be a signed transaction. This task gives you a small multisig: a proposal account that stores the target program, the account list and the instruction data, members who approve it one by one, and an execute instruction that only the admin may call and that signs with the admin's key.

Your job is to make the stored action executable by anyone. Once the approvals reach the threshold, any wallet may send the execute transaction, and the vault PDA signs the stored instruction through `invoke_signed`, so no member's key is needed at that moment. The accounts the executor passes have to match the stored list exactly, a proposal executes once and never again, and a proposal that never reaches the threshold can be cancelled or expires, so its rent and locked funds come back.

Clone the template repository, open `programs/06-proposal-anyone-can-execute`, read `TASK.md`, and implement the program until the given test and your own tests pass. Your tests have to show a wallet that is not a member executing an approved proposal, an execute refused below the threshold, a second execute of the same proposal refused, and an execute with a changed account list refused. Then fill in `SOLUTION.md`: why it is safe to let anyone execute, what exactly the PDA signs and what it cannot sign, and what still belongs to the members. Push your work to your own fork and submit the repository URL.

You are graded on your reasoning as much as on the code.
