---
id: 209
title: Solana basics - Test
type: test
order: 100
---

<!-- q:6a1cb8233c68b1972396433c -->
In Anchor, what is the primary purpose of the IDL?

- [x] It describes the program’s instructions, accounts, and types so clients and tests can call the program in a type-safe way  <!-- a:6a1cb87a3c68b1972396433d -->
- [ ] It replaces Rust source code during deployment so validators can execute the program without a `.so` file  <!-- a:6a1cb8813c68b1972396433e -->
- [ ] It is a Solana runtime file that assigns compute unit budgets to each instruction automatically  <!-- a:6a1cb8843c68b1972396433f -->
- [ ] It stores program metadata  <!-- a:6a1cb8893c68b19723964340 -->

<!-- q:6a1cb8a23c68b19723964341 -->
You write `#[account(init, payer = user, space = 8 + MyAccount::INIT_SPACE)]`. What does the `8 +` part represent?

- [ ] The size of a Solana account’s lamport balance field  <!-- a:6a1cb8ac3c68b19723964342 -->
- [x] Anchor’s account discriminator prefix  <!-- a:6a1cb8ce3c68b19723964343 -->
- [ ] The bump seed stored on-chain for PDAs  <!-- a:6a1cb8d33c68b19723964344 -->
- [ ] The length prefix of a dynamic `String` field  <!-- a:6a1cb8d63c68b19723964345 -->
- [ ] The length prefix of `init` macro  <!-- a:6a1cb8e33c68b19723964346 -->

<!-- q:6a1cb8f43c68b19723964347 -->
Why might a Solana program store each item in a list as its own account instead of growing one big account?

- [x] Solana accounts have a max size. Unbounded in-account arrays can hit that limit  <!-- a:6a1cb9a23c68b19723964348 -->
- [ ] Solana forbids dynamic arrays in accounts  <!-- a:6a1cb9ae3c68b19723964349 -->
- [ ] Clients cannot read data from a single large account  <!-- a:6a1cb9b93c68b1972396434a -->
- [ ] Iteration of the unbounded arrays is really slow  <!-- a:6a1cb9be3c68b1972396434b -->

<!-- q:6a1cbaea3c68b1972396434c -->
Two different developers derive an address for their programs using the same seed bytes `[b"vault", user_pubkey]`. What happens?

- [ ] They get the same address, because seeds are deterministic  <!-- a:6a1cbafc3c68b1972396434d -->
- [x] They get different addresses. The program ID is part of the derivation  <!-- a:6a1cbb133c68b1972396434e -->
- [ ] Derivation fails. Seeds should be unique  <!-- a:6a1cbb463c68b1972396434f -->

<!-- q:6a1cbb6e3c68b19723964350 -->
A client builds a transaction where the fee payer is a PDA derived from your program. Will Solana accept it?

- [ ] Yes, if the PDA holds enough SOL and the program approves the spend  <!-- a:6a1cbc093c68b19723964353 -->
- [ ] Yes, but only when the PDA is marked `isSigner: true` in the transaction  <!-- a:6a1cbc0c3c68b19723964354 -->
- [x] No. The fee payer must be a normal keypair that can sign the transaction  <!-- a:6a1cbc123c68b19723964355 -->
- [ ] Yes, only if caller is owner of the PDA  <!-- a:6a1cbc213c68b19723964356 -->

<!-- q:6a1cbc5d3c68b19723964357 -->
You create an account at a PDA address derived from your program’s ID. Which statement is correct?

- [x] PDA owner is your program  <!-- a:6a1cbc793c68b19723964358 -->
- [ ] PDA doesn't have an owner because it's not on curve  <!-- a:6a1cbc833c68b19723964359 -->
- [ ] The System Program owns all PDAs  <!-- a:6a1cbca03c68b1972396435a -->
- [ ] You own a PDA  <!-- a:6a1cbcab3c68b1972396435b -->
