---
id: 217
title: Congratulations
type: lecture
order: 1
faq:
  - question: I finished the Solana track. What should I do next?
    answer: >-
      Read a production program end to end. Jupiter's router, a Drift or Kamino vault. Then
      build something of your own, or apply for an audit role.
  - question: Will this Solana knowledge go out of date?
    answer: >-
      No. Stateless programs with all state in accounts, Anchor, CPI, Token-2022 extensions.
      Every program you read or write after this sits on those.
---

You finished the Solana track. You can now read someone else's program and say which accounts it touches and who is allowed to change them.

Real programs use several ideas from this course in one instruction. Take the vault from the PDAs as signers lesson, which pays a user out of its token account through the SPL Token Program:
* Every balance is a separate token account, and only the Token Program that owns it can change it, which is the **[account model](/courses/development-on-solana/the-solana-mental-model/accounts)**.
* The recipient's token account sits at an address anyone can compute from the wallet and the mint, which is the **[Associated Token Account](/courses/development-on-solana/working-with-other-programs/associated-token-accounts-atas)**.
* Your program cannot change those accounts, so it calls the Token Program's Transfer instruction, which is a **[CPI](/courses/development-on-solana/working-with-other-programs/cross-program-invocation-cpi)**.
* The data of the vault's token account records a PDA as the owner of the balance, and your program signs for that PDA by passing its seeds to `invoke_signed`, which is a **[PDA as signer](/courses/development-on-solana/working-with-other-programs/pdas-as-signers)**.

## What's next

Pick a protocol you like and read its on-chain program end to end. Jupiter's router and a Drift or Kamino vault are good places to start. For each instruction, read the accounts struct before the handler, and say which accounts are writable, which must sign, and what stops the caller from passing a different account in each slot. Then build something of your own, or apply for an audit role.

The Ethereum track is the natural next step if you haven't taken it yet. There a contract reads and writes its own storage as it runs, while a Solana transaction has to list every account before it is sent.
