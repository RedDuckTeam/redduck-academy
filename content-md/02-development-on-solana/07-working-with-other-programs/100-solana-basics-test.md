# Solana basics - Test

_type: test_

---

## Questions

### Q1

In Anchor, what is the primary purpose of the IDL?

a. It describes the program’s instructions, accounts, and types so clients and tests can call the program in a type-safe way
b. It replaces Rust source code during deployment so validators can execute the program without a `.so` file
c. It is a Solana runtime file that assigns compute unit budgets to each instruction automatically
d. It stores program metadata

### Q2

You write `#[account(init, payer = user, space = 8 + MyAccount::INIT_SPACE)]`. What does the `8 +` part represent?

a. The size of a Solana account’s lamport balance field
b. Anchor’s account discriminator prefix
c. The bump seed stored on-chain for PDAs
d. The length prefix of a dynamic `String` field
e. The length prefix of `init` macro

### Q3

Why might a Solana program store each item in a list as its own account instead of growing one big account?

a. Solana accounts have a max size. Unbounded in-account arrays can hit that limit
b. Solana forbids dynamic arrays in accounts
c. Clients cannot read data from a single large account
d. Iteration of the unbounded arrays is really slow

### Q4

Two different developers derive an address for their programs using the same seed bytes `[b"vault", user_pubkey]`. What happens?

a. They get the same address, because seeds are deterministic
b. They get different addresses. The program ID is part of the derivation
c. Derivation fails. Seeds should be unique

### Q5

A client builds a transaction where the fee payer is a PDA derived from your program. Will Solana accept it?

a. Yes, if the PDA holds enough SOL and the program approves the spend
b. Yes, but only when the PDA is marked `isSigner: true` in the transaction
c. No. The fee payer must be a normal keypair that can sign the transaction
d. Yes, only if caller is owner of the PDA

### Q6

You create an account at a PDA address derived from your program’s ID. Which statement is correct?

a. PDA owner is your program
b. PDA doesn't have an owner because it's not on curve
c. The System Program owns all PDAs
d. You own a PDA
