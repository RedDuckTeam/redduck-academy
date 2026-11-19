---
id: 210
title: Off-chain computation, on-chain verification
type: lecture
order: 5
faq:
  - question: Why does my loop run out of compute units?
    answer: >-
      An instruction gets 200,000 CU by default and 1.4 million at the most. A user-controlled
      list can blow past that, and an attacker who keeps growing it makes the handler unusable.
  - question: How does an airdrop check 10,000 addresses without 10,000 accounts?
    answer: >-
      One 32-byte Merkle root in a config account. The claimer submits their amount and about 14
      sibling hashes, the program rehashes its way to the root, and a mismatch reverts.
  - question: How do I record that someone already claimed?
    answer: >-
      The claim PDA's existence is the flag. init on a PDA seeded with the claimer's address
      fails the second time.
  - question: What stops the user from faking the off-chain computation?
    answer: >-
      Nothing, and it gains them nothing. A claim that fails the program's own verification
      reverts, changing no state. That makes the verifier the security boundary, so it has to be
      airtight.
  - question: Can I have the user sort the array and just verify the order?
    answer: >-
      Not usefully. Checking order still costs one read per element, cheaper than sorting but
      too much on chain for a large array. Compare a claimed square root, which the program
      confirms with two multiplications for about 50 CU.
  - question: Does an off-chain signature fit this pattern?
    answer: >-
      Yes. The wallet signs off chain and the program verifies with Ed25519 natively, or
      secp256k1 through a syscall.
---

> When work is too expensive to run inside a program, the client does it off-chain and submits the result, and the program only verifies it. This works when checking an answer is much cheaper than computing it.

## The compute budget rules out long work on chain

The BPF runtime charges compute units for every operation, and the compute budget per instruction is capped ([transaction fees and compute units](/courses/development-on-solana/the-solana-mental-model/transaction-fees-and-compute-units)). By default, an instruction gets 200,000 CU. With an explicit budget extension, you can push that to a maximum of 1.4 million CU per transaction. This is fine for short, deterministic computation. It becomes a problem in three situations.

First, when the work is unbounded. A loop over a `Vec` whose length depends on user input can grow until any handler that iterates over it exceeds the CU limit and reverts, so an attacker can fill the vector with garbage until your function becomes unusable. This is a denial of service (DoS) through unbounded iteration.

Second, when the work is large but bounded. Iterating over 10,000 known elements doesn't risk DoS but easily exceeds 200,000 CU, and real users won't pay the priority fee on a transaction that has to bump its compute budget that high.

Third, when the work requires data the program doesn't have. The program knows nothing outside the accounts passed to it and the instruction's arguments, so it cannot see what's in a database, on another chain, or in a dataset too large to fit in a transaction.

In each case the work has to happen somewhere else, and the program has to be convinced the work was done correctly.

## The client computes, the program verifies

Off-chain computation is free as far as the chain is concerned. A JavaScript program in a browser can sort a million elements in milliseconds. The chain is bad at long computation but good at checking specific claims: hashing, signature verification, arithmetic and account reads are each cheap on their own.

So the user does the hard work off-chain and submits, in a single instruction call, a **value** they want the program to use and possibly some **proof** that helps the program verify the value. The program performs verification logic that's much cheaper than the original computation. If verification succeeds, the program uses the value. If verification fails, the program reverts.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Off-chain user submits value and proof to on-chain program for verification</title><desc>The off-chain user does the expensive work and submits a value with a proof. The on-chain program runs cheap verification: if it passes, the program uses the value and changes state; if it fails, the program reverts and the attacker pays the fees.</desc>
  <rect x="40" y="30" width="280" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="55" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">USER (off-chain)</text>
  <text x="180" y="80" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">does the expensive work,</text>
  <text x="180" y="98" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">produces value + proof</text>
  <text x="180" y="118" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">unbounded resources, free</text>
  <line x1="180" y1="130" x2="180" y2="170" stroke="#565653" stroke-width="1.5"/>
  <polygon points="180,178 175,168 185,168" fill="#565653"/>
  <text x="195" y="158" font-family="monospace" font-size="11" fill="#000000">submits (value, proof)</text>
  <rect x="40" y="180" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="205" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">PROGRAM (on-chain)</text>
  <text x="360" y="228" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">runs verification logic on the claim</text>
  <text x="360" y="246" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">bounded compute, cheap O(1) or O(log n)</text>
  <line x1="240" y1="260" x2="180" y2="300" stroke="#565653" stroke-width="1.5"/>
  <polygon points="178,308 174,297 184,295" fill="#565653"/>
  <text x="120" y="290" font-family="monospace" font-size="11" fill="#000000">verification</text>
  <text x="120" y="306" font-family="monospace" font-size="11" fill="#000000">PASSES</text>
  <line x1="480" y1="260" x2="540" y2="300" stroke="#565653" stroke-width="1.5"/>
  <polygon points="542,308 536,295 546,297" fill="#565653"/>
  <text x="560" y="290" font-family="monospace" font-size="11" fill="#000000">verification</text>
  <text x="560" y="306" font-family="monospace" font-size="11" fill="#000000">FAILS</text>
  <rect x="60" y="310" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="332" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">program uses the value</text>
  <text x="180" y="350" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">state changes, event emits</text>
  <rect x="420" y="310" width="240" height="50" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="540" y="332" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">program reverts</text>
  <text x="540" y="350" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">no state changes, attacker pays fees</text>
</svg>

A user can submit any claim they want, but a wrong one gains them nothing. The verification logic is the program's own code, and a claim that doesn't pass it reverts: state doesn't change, other users aren't affected, and the user has paid the fee for a failed transaction.

This makes the verification step the security boundary, and it has to be airtight. A verifier that accepts an invalid proof or a wrong value corrupts whatever consumes the result. Writing your own verification is a higher bar than writing application logic, because every edge case in the verifier is a potential exploit. When you can use a well-known verifier, do.

## An airdrop to 10,000 users stores one Merkle root

Suppose you want to airdrop tokens to 10,000 users. The most direct way is to send the tokens yourself. That is 10,000 transfers spread over many transactions, and you pay the fee for each one. You also pay a rent deposit of about 0.002 SOL for every recipient who has no token account for your mint yet ([the SPL Token program in practice](/courses/development-on-solana/working-with-other-programs/the-spl-token-program-in-practice)), up to 20 SOL in total.

The next idea is to let users claim and to keep a record of who is eligible. Storing 10,000 records on chain means creating 10,000 PDA accounts up front. Each rent-exempt account locks roughly 2 million lamports of SOL just to exist. Multiply by 10,000 and you're locking around 20 SOL of capital just to track who is eligible, before you've moved a single token.

Instead, build a [Merkle tree](/courses/blockchain-basics/cryptography/merkle-trees) of the 10,000 (address, amount) pairs off-chain. The tree's root is a single 32-byte hash. Store only the root in a Config PDA. When a user wants to claim their airdrop, they prove they're in the tree by submitting their amount and the path of sibling hashes that connect their leaf to the root.

```rust
    pub fn claim(ctx: Context<Claim>, amount: u64, proof: Vec<[u8; 32]>) -> Result<()> {
        let claimer = ctx.accounts.claimer.key();
        let leaf = keccak::hashv(&[claimer.as_ref(), &amount.to_le_bytes()]).0;

        let mut computed = leaf;
        for sibling in proof.iter() {
            if computed <= *sibling {
                computed = keccak::hashv(&[&computed, sibling]).0;
            } else {
                computed = keccak::hashv(&[sibling, &computed]).0;
            }
        }

        require!(computed == ctx.accounts.config.merkle_root, AirdropError::InvalidProof);

        // ... transfer `amount` tokens to claimer ...
        Ok(())
    }
```

The claimer's address comes from the Signer, and the proof is a vector of around `log2(10000) ≈ 14` sibling hashes. The program reconstructs the root from the leaf and the proof, then checks it matches the stored root. If the user is not in the tree, no proof exists that would lead back to the root. Whatever they submit will produce a hash that doesn't match, and the program reverts.

A second account stops a user from claiming twice:

```rust
    #[account(
        init,
        payer = claimer,
        space = 8,
        seeds = [b"claim", claimer.key().as_ref()],
        bump,
    )]
    pub claim_record: Account<'info, ClaimRecord>,
```

We use `init` on a PDA whose seeds derive from the claimer's address. If the user has already claimed, the PDA exists, and the second `claim` call fails because `init` errors when the account already exists. The PDA's existence is the "already claimed" flag. On Ethereum this flag would be a `mapping(address => bool)` in the contract's storage.

The program did 14 hashes of verification work, and the list of 10,000 eligible users fits in a single 32-byte field on a single account. The 10,000 accounts do not disappear, though, because every claim creates a `ClaimRecord`. What changes is who pays and when. A record is 8 bytes and locks about 0.001 SOL, it is created only when someone claims, and its rent comes from the claimer (`payer = claimer`), not from the protocol.

The scheme has three more costs. The tree is not on chain, so someone has to keep the full list off-chain and give every user their proof. Changing one entry changes the root, so a correction means building a new tree and storing a new root. And the program believes whatever root it stores, so whoever is allowed to write the root decides who can claim and how much.

## A found value is cheaper to check than to find

Constant-product math like `x * y = k` needs `sqrt(k)` for the initial liquidity tokens minted to the first depositor. Computing `sqrt(n)` for a `u64` requires an iterative algorithm, typically Newton's method or a binary search. A good implementation takes around 20-30 iterations and costs a few thousand CU. Instead the user computes `claimed_root = floor(sqrt(n))` off-chain and submits it, and the program checks two things: that `claimed_root * claimed_root` is at most `n`, and that `(claimed_root + 1) * (claimed_root + 1)` is greater than `n`. The verification is two multiplications and two comparisons, about 50 CU.

```rust
    let lower = claimed_root
        .checked_mul(claimed_root)
        .ok_or(MathError::Overflow)?;
    let next = claimed_root.checked_add(1).ok_or(MathError::Overflow)?;
    let upper = next.checked_mul(next).ok_or(MathError::Overflow)?;

    require!(lower <= n && n < upper, MathError::InvalidSqrt);
```

The saving on a square root is small. The same move matters more when the on-chain work grows with the data. Monaco, a prediction market, keeps its order book sorted, and finding the place for a new order on-chain means iterating through the book one order at a time. So the client reads the order book off-chain, finds the place, and tells the program "put my order after this one". The program checks only the two neighboring orders, which costs the same whether the book holds ten orders or ten thousand. If another order lands first and changes the neighbors, the check fails and the client has to retry with a fresh position. Solana PRO covers this in [role inversion](/courses/solana-pro/permissionless-execution/role-inversion).

## Where else this pattern appears

**Compressed NFTs.** Metaplex's Bubblegum standard stores millions of NFTs as leaves in a concurrent Merkle tree. The tree's root lives on chain. Every mint, transfer, or burn includes a proof showing the leaf's current state. The on-chain program verifies the proof and updates the root. A million NFTs fit into the rent cost of one account, instead of a million separate accounts. The price is the same as in the airdrop: the full tree lives off-chain with an indexer, and a transfer cannot be built without a proof fetched from it ([Solana NFTs](/courses/development-on-solana/production-state-design/solana-nfts)).

**Signatures.** A user signs a message off-chain with their wallet's private key. The program verifies the signature using ed25519 natively, or secp256k1 via a syscall. Off-chain orderbooks, gasless transactions, and proof-of-ownership systems work this way. A signature answers the third situation above: the program cannot see what happened off-chain, but it can check who signed for it.

**Oracle attestations.** Pyth, Switchboard, and other oracles have validators sign price observations off-chain. The aggregated signatures land on chain, and any program that needs the price verifies the signatures. The expensive part, gathering price observations from many sources, happens off-chain. The program verifies who signed the price, not the price itself, so it trusts the signers. [Pyth price feeds](/courses/development-on-solana/production-state-design/pyth-price-feeds) covers what a program still has to check.

**ZK proofs.** A user computes a complex statement off-chain with a SNARK or STARK, producing a tiny proof. The program verifies the proof in fixed-size constant work, regardless of how complex the underlying statement is.

## When the pattern doesn't apply

**When verification is as expensive as computation.** If checking the answer takes the same work as computing it, there's no savings. Sorting is usually like this: verifying an array is sorted takes O(n) reads, cheaper than O(n log n) sorting, but still too expensive on-chain for large arrays. The pattern pays off when verification is asymptotically cheaper than computation, like the difference between O(log n) Merkle verification and O(n) iteration.

**When the user can't be expected to do the work.** A user who interacts with your program through a wallet will not compute a Merkle proof by hand, so the wallet or the dApp frontend has to do it for them. Every airdrop dApp does this, but it shifts complexity into the frontend, which may not be where you want it.

**When the program has nothing to check the answer against.** A user cannot compute the current price off-chain and have the program verify it. The program holds nothing to compare the number with, and by the time the verification runs, the answer is stale. Prices come from signers the program trusts, as in the oracle case above.

If you ever find yourself looking at a loop that could DoS or a computation that's too expensive, ask yourself: can I move this work off-chain and verify a result?
