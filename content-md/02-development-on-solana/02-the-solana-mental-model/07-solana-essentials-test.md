# Solana essentials - Test

_type: test_

---

## Questions

### Q1

When you deploy a Solana program, its compiled BPF bytecode lives where?

a. In a special program registry maintained by validators
b. In an account on chain, with the BPF loader as the account's owner
c. Distributed across validators' memory only, fetched from a network index
d. Hashed and stored off-chain, with only the hash on chain

### Q2

Your program needs a counter that persists across calls. Where does the counter live?

a. As a global variable inside the program's code
b. Embedded in the program's account data, alongside the bytecode
c. In a separate account that the program creates and owns
d. In a per-validator local cache, synchronized across nodes

### Q3

Why does every Solana transaction list, in advance, every account it will read or write?

a. To estimate compute fees before execution begins
b. To prevent unauthorized account access by enforcing a whitelist
c. Because the validator needs to verify the caller has access for each one
d. So the runtime can schedule non-conflicting transactions in parallel

### Q4

Two transactions are submitted in the same slot. Both invoke the same program. Both read from the same global config account. Can they run in parallel?

a. No, because they invoke the same program
b. No, because they share the global config account
c. Yes, because the global config is read-only for both
d. No, Solana transactions are processed strictly sequentially within a slot

### Q5

Your program tries to create a 200-byte account, funding it with 1,000 lamports. The rent-exempt minimum for 200 bytes is roughly 2.2 million lamports. What happens?

a. The account is created in "rent-paying" mode and slowly drains until empty
b. The transaction fails because modern Solana requires accounts to be rent-exempt at creation
c. The account is created, but then immediately deleted due to insufficient balance for rent
d. The account is created, but to perform a transaction that interacts with that account you have to fund it to 2.2 million lamports

### Q6

A transaction is signed by three distinct wallets. Ignoring priority fees, what is the base fee in lamports?

a. 5,000
b. 0 because only priority fees are charged in modern Solana
c. 15,000
d. 30,000

### Q7

Solana programs cannot make external network calls during execution. What is the fundamental reason?

a. Different validators would observe different responses, breaking consensus
b. The BPF runtime doesn't include networking syscalls
c. Network calls would be too slow to fit in a 400ms slot

### Q8

Proof of History is best described as:

a. A consensus algorithm that selects leaders for each slot
b. A verifiable delay function that produces a clock all validators can independently check
c. A signature scheme proving transactions were received in a specific order
d. An optimization that lets a validator skip keeping full blockchain history
