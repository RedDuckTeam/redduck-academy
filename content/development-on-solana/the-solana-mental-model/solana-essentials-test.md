---
id: 208
title: Solana essentials - Test
type: test
order: 7
---

<!-- q:6a1caea73c68b19723964312 -->
When you deploy a Solana program, its compiled BPF bytecode lives where?

- [ ] In a special program registry maintained by validators  <!-- a:6a1caf963c68b19723964313 -->
- [x] In an account on chain, with the BPF loader as the account's owner  <!-- a:6a1caf9a3c68b19723964314 -->
- [ ] Distributed across validators' memory only, fetched from a network index  <!-- a:6a1cafb23c68b19723964315 -->
- [ ] Hashed and stored off-chain, with only the hash on chain  <!-- a:6a1cafbb3c68b19723964316 -->

<!-- q:6a1cafc53c68b19723964317 -->
Your program needs a counter that persists across calls. Where does the counter live?

- [ ] As a global variable inside the program's code  <!-- a:6a1cafda3c68b19723964318 -->
- [ ] Embedded in the program's account data, alongside the bytecode  <!-- a:6a1cafe63c68b19723964319 -->
- [x] In a separate account that the program creates and owns  <!-- a:6a1cafe83c68b1972396431a -->
- [ ] In a per-validator local cache, synchronized across nodes  <!-- a:6a1caff03c68b1972396431b -->

<!-- q:6a1caffb3c68b1972396431c -->
Why does every Solana transaction list, in advance, every account it will read or write?

- [ ] To estimate compute fees before execution begins  <!-- a:6a1cb00b3c68b1972396431d -->
- [ ] To prevent unauthorized account access by enforcing a whitelist  <!-- a:6a1cb00f3c68b1972396431e -->
- [ ] Because the validator needs to verify the caller has access for each one  <!-- a:6a1cb01f3c68b1972396431f -->
- [x] So the runtime can schedule non-conflicting transactions in parallel  <!-- a:6a1cb03a3c68b19723964320 -->

<!-- q:6a1cb0453c68b19723964321 -->
Two transactions are submitted in the same slot. Both invoke the same program. Both read from the same global config account. Can they run in parallel?

- [ ] No, because they invoke the same program  <!-- a:6a1cb0613c68b19723964322 -->
- [ ] No, because they share the global config account  <!-- a:6a1cb06c3c68b19723964323 -->
- [x] Yes, because the global config is read-only for both  <!-- a:6a1cb0723c68b19723964324 -->
- [ ] No, Solana transactions are processed strictly sequentially within a slot  <!-- a:6a1cb0823c68b19723964325 -->

<!-- q:6a1cb0a13c68b19723964327 -->
Your program tries to create a 200-byte account, funding it with 1,000 lamports. The rent-exempt minimum for 200 bytes is roughly 2.2 million lamports. What happens?

- [ ] The account is created in "rent-paying" mode and slowly drains until empty  <!-- a:6a1cb0f03c68b19723964328 -->
- [x] The transaction fails because modern Solana requires accounts to be rent-exempt at creation  <!-- a:6a1cb0f23c68b19723964329 -->
- [ ] The account is created, but then immediately deleted due to insufficient balance for rent  <!-- a:6a1cb0fc3c68b1972396432a -->
- [ ] The account is created, but to perform a transaction that interacts with that account you have to fund it to 2.2 million lamports  <!-- a:6a1cb14c3c68b1972396432b -->

<!-- q:6a1cb1983c68b1972396432c -->
A transaction is signed by three distinct wallets. Ignoring priority fees, what is the base fee in lamports?

- [ ] 5,000  <!-- a:6a1cb1ea3c68b1972396432d -->
- [ ] 0 because only priority fees are charged in modern Solana  <!-- a:6a1cb1ec3c68b1972396432e -->
- [x] 15,000  <!-- a:6a1cb1f33c68b1972396432f -->
- [ ] 30,000  <!-- a:6a1cb1fb3c68b19723964330 -->

<!-- q:6a1cb2123c68b19723964331 -->
Solana programs cannot make external network calls during execution. What is the fundamental reason?

- [x] Different validators would observe different responses, breaking consensus  <!-- a:6a1cb2463c68b19723964332 -->
- [ ] The BPF runtime could support networking, but the team disabled it for performance.  <!-- a:6a1cb25f3c68b19723964333 -->
- [ ] Network calls would be too slow to fit in a 400ms slot  <!-- a:6a1cb2683c68b19723964334 -->

<!-- q:6a1cb2933c68b19723964337 -->
Proof of History is best described as:

- [ ] A consensus algorithm that selects leaders for each slot  <!-- a:6a1cb2983c68b19723964338 -->
- [x] A verifiable delay function that produces a clock all validators can independently check  <!-- a:6a1cb29f3c68b19723964339 -->
- [ ] A signature scheme proving transactions were received in a specific order  <!-- a:6a1cb2a83c68b1972396433a -->
- [ ] An optimization that lets a validator skip keeping full blockchain history  <!-- a:6a1cb2af3c68b1972396433b -->
