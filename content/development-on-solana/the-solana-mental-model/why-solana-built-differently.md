---
id: 181
title: Why Solana was built differently
type: lecture
order: 1
faq:
  - question: Where does a Solana program keep its state?
    answer: >-
      In separate accounts, passed in on every call. The program itself is pure code with no
      storage of its own.
  - question: Why does a transaction have to list the accounts it will touch in advance?
    answer: >-
      The runtime has to know before execution which state each transaction reads and
      writes, so it can put non-conflicting ones on different threads. Running the
      transaction to find out would defeat the point. The client supplies the list, marking
      each account read-only or writable, before submitting it.
  - question: Can another program write to my account?
    answer: >-
      No. Only the owner program can, and the runtime blocks everyone else before any code
      runs. Reads stay open to anyone.
  - question: How does a client know which accounts a program needs?
    answer: >-
      The program author documents the access pattern or ships an IDL, a machine-readable
      Interface Definition Language file describing what each instruction expects.
---

> Solana was built to run as many transactions at the same time as possible. This single decision shapes the rest of the programming model: where state lives, what a transaction has to declare, who owns an account, and what you pay to store a byte on chain.

## On Ethereum the contract finds its state while it runs

Ethereum is a serial chain: one transaction at a time, a single thread of execution. Each contract has its own storage attached to its address, and the contract's code decides while it runs which entries to read and write. A token such as USDC is one contract that keeps a table of balances.

Take two payments: Alice sends 10 USDC to Bob, and Carol sends 10 USDC to Dave. On Ethereum both transactions call the same contract and write to that contract's storage. This is simple to program. The developer treats the state as a database that the contract reads and modifies, and never has to say in advance what a call will touch, because there is only one thread.

## Parallel execution needs to know in advance what each transaction touches

The two payments move money between different people, so in principle they could run at the same time on different threads. To schedule them that way, the runtime has to know in advance which pieces of state each one will read and write. Otherwise it cannot schedule them safely, since a race condition between two threads writing the same byte produces inconsistent state and breaks consensus. Ethereum's model cannot answer that question before execution. Both payments write to the storage of one contract, and which entries they write is known only after the code has run.

## Running transactions in parallel forces four choices

**Programs hold no state.** If balances were stored inside the token program, the smallest thing a transaction could declare would be the whole program, and any two transfers of the same token would conflict. So a Solana program is pure code. Its data lives in separate accounts that get passed to it on every call, and the program never knows what state exists on the chain except the state the current transaction handed it. Alice's, Bob's, Carol's and Dave's USDC balances are four separate accounts.

**Every transaction declares its accounts.** Every transaction lists every account it intends to touch, marked as read-only or writable. The runtime reads the list before execution begins and uses it to decide which transactions are safe to run in parallel and which conflict. Alice's payment marks her balance and Bob's as writable, and Carol's payment marks hers and Dave's. No writable account appears in both lists, so the two payments run on different threads. The list cannot be discovered by running the transaction, because then a conflict would show up only after execution. So the client building the transaction needs to know in advance what the program will need. The program author either documents the access pattern or exposes it through a machine-readable interface called an IDL (Interface Definition Language), covered in [a later lesson](/courses/development-on-solana/writing-your-first-program/the-idl).

**Every account has one owner program.** Once data is separated from code, something has to say which code may change which data. Every account on Solana is owned by one program, and the runtime lets only that program modify the account's data. Reads are open to anyone. The four USDC balances are owned by the Token Program, so an attacker's program cannot modify them.

**Every account pays for its bytes.** Storing data on the chain takes space that every validator has to hold in memory, and the network charges for that. Solana asks each account to deposit enough lamports up front to cover its storage permanently, in proportion to the bytes it occupies, and refunds the deposit when the account is closed. An account that holds this deposit, the rent, is called rent-exempt. Every account is sized at creation, and growing it takes a deliberate call that pays for the new bytes, so a program cannot quietly accumulate state. [Lamports, rent, and account lifecycle](/courses/development-on-solana/the-solana-mental-model/lamports-rent-and-account-lifecycle) has the numbers.

## The price is paid in account checks, transaction size, and shared accounts

What you get is a chain where a token swap on one decentralized exchange does not have to wait for an unrelated NFT mint, and where the network can process thousands of independent transactions per second without one of them blocking the rest. What you pay is a programming model with more pieces than Ethereum's, and three costs that come with the account list.

**Every account is an untrusted input.** The caller builds the account list, so the caller chooses which accounts the program sees. The runtime stops another program from changing your account's data, but it does not check that the account passed in is the one your instruction expects. Your program has to check that itself, and the [account constraints lesson](/courses/development-on-solana/writing-your-first-program/account-constraints) shows how.

**The account list has to fit in the transaction.** A transaction is limited to 1,232 bytes and every account address takes 32 of them, so the practical ceiling is roughly 30 accounts. [Address lookup tables](/courses/development-on-solana/working-with-other-programs/versioned-transactions-and-address-lookup-tables) raise it.

**Transactions that write the same account still run one after another.** If Erin pays Bob at the same moment as Alice does, both transactions write Bob's balance, and one of them waits for the other. An account that every user writes puts all of them in one queue. Jito, which lets a transaction tip the validator producing the block, spreads those tips over eight accounts for this reason, as the [Jito lesson](/courses/development-on-solana/architecture-details/jito-mev-bundles) explains.

## Ask which accounts each instruction writes

When you design an instruction, list the accounts it writes and ask who else writes them. Every transaction that writes one of the same accounts will run before or after yours and not alongside it.
