---
id: 300
title: Find the root of trust
type: review_task
order: 30
---

Every check in a Solana program depends on some account, and every account comes from the caller. This task gives you a vault that pays out only when an oracle has signed the withdrawal. The signature is verified by the Ed25519 program, the vault reads the instructions sysvar to confirm the check ran, and the list of allowed oracle keys sits in an allowlist account. All of it is checked, and all of it comes from the caller: the sysvar account, the allowlist and the config are passed in unchecked.

Your job is to find where the chain of checks ends. Follow every account the withdrawal reads, ask what it is compared with, and write down the chain until it reaches something the caller could not have created, or until it does not. Then give the program a root: the config becomes a PDA of the program with the allowed keys inside it, the sysvar account is compared with the real sysvar address before anything is read from it, and the key and message inside the Ed25519 instruction are compared with the config, not with data from the caller. Every instruction of the program has to use the same root.

Clone the template repository, open `programs/02-find-the-root-of-trust`, read `TASK.md`, and write the exploit test first: a withdrawal that passes with a fake sysvar account and a fake allowlist before your fix. Then implement the fix until the exploit test fails and the given tests pass. Fill in `SOLUTION.md`: the chain of checks as you found it, the account where it ended, and which account is the root now. Push your work to your own fork and submit the repository URL.

You are graded on your reasoning as much as on the code.
