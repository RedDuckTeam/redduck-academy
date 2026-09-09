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

> Every program you've written so far does its own work. The program receives an instruction, computes a result inside the BPF runtime, and writes the answer to an account. That works as long as the work is cheap. The moment the work gets expensive, or scales with user-controlled inputs, or requires iteration over data of unknown size, the naive approach breaks. Compute unit costs become prohibitive. Loops become denial-of-service vectors. Operations that are routine off the chain become impossible on it. This lesson teaches you the most important pattern for working around this limit. You'll see it in airdrops, in compressed NFTs, in oracles, in proofs of identity, and in dozens of places you haven't met yet. Once you internalize it, problems that looked impossible become straightforward.

## The fundamental constraint

The BPF runtime charges compute units for every operation. A simple arithmetic step costs a few CU. A SHA-256 hash costs about 85 CU per byte hashed. An account read is essentially free once the account is loaded into the runtime's memory. A loop iteration costs whatever the body costs, multiplied by the number of iterations.

The compute budget per instruction is capped. By default, an instruction gets 200,000 CU. With an explicit budget extension, you can push that to a maximum of 1.4 million CU per transaction. These limits are tighter than you might expect, which makes the pattern in this lesson more important on Solana than on most other chains.

This pricing is fine for short, deterministic computation. It becomes a problem in three situations.

First, when the work is unbounded. A loop over a `Vec` whose length depends on user input can grow until any handler that iterates over it exceeds the CU limit and reverts. If the vector is attacker-controlled, an attacker can fill it with garbage until your function becomes unusable. The program becomes a brick. This is denial-of-service through unbounded iteration.

Second, when the work is large but bounded. Iterating over 10,000 known elements doesn't risk DoS but easily exceeds 200,000 CU. Real users won't pay the priority fee on a transaction that has to bump its compute budget that high.

Third, when the work requires data the program doesn't have. The program knows nothing outside the accounts passed to it and the instruction's arguments. If you need to know what's in a database, on another chain, or in a dataset too large to fit in a transaction, the program is blind.

In each case, doing the work on-chain is the wrong approach. The work has to happen somewhere else, and the program has to be convinced the work was done correctly.

## The reframe

Off-chain computation is essentially free. A JavaScript program in a browser can sort a million elements in milliseconds. A backend can query a database, compute hashes, run cryptographic operations, and produce any answer you want. The cost is whatever the user's own machine consumes, which is nothing as far as the chain is concerned.

The chain, in contrast, has powerful verification primitives. Hashing, signature recovery, arithmetic, account reads: each is cheap on its own. The chain is bad at long computation but good at checking specific claims.

This suggests a split: do the hard work off-chain, then submit the result to the chain along with whatever the chain needs to verify the work was done correctly. The program no longer computes anything expensive. It receives a claim and checks the claim. If the claim is valid, the program uses the result. If the claim is invalid, the program reverts.

This is the pattern. The user does work, the program verifies.

The important property: the program never trusts the user's claim blindly. The verification step is the security boundary. A user can submit any claim they want, but if it doesn't pass verification, nothing happens. They can lie, but lying only causes their own transaction to revert. They can't corrupt state by lying. The cost of trying and failing is just their priority fee and the base fee for the signature.

## Worked example 1: Merkle proofs for airdrop eligibility

Suppose you want to airdrop tokens to 10,000 users. Storing 10,000 records on chain means creating 10,000 PDA accounts up front. Each rent-exempt account locks roughly 2 million lamports of SOL just to exist. Multiply by 10,000 and you're locking around 20 SOL of capital just to track who is eligible, before you've moved a single token. For larger user sets it gets absurd quickly.

The off-chain trick: build a Merkle tree of the 10,000 (address, amount) pairs off-chain. The tree's root is a single 32-byte hash. Store only the root in a Config PDA. When a user wants to claim their airdrop, they prove they're in the tree by submitting their amount and the path of sibling hashes that connect their leaf to the root.

Here's the verification logic:

```rust
use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

#[program]
pub mod airdrop {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, merkle_root: [u8; 32]) -> Result<()> {
        ctx.accounts.config.merkle_root = merkle_root;
        Ok(())
    }

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
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = claimer,
        space = 8,
        seeds = [b"claim", claimer.key().as_ref()],
        bump,
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    #[account(mut)]
    pub claimer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account] pub struct Config       { pub merkle_root: [u8; 32] }
#[account] pub struct ClaimRecord  {}

#[error_code]
pub enum AirdropError {
    InvalidProof,
}
```

The Config stores one 32-byte root. The user submits their address implicitly (as the Signer), the amount they're claiming, and a proof vector of around `log2(10000) ≈ 14` sibling hashes. The program reconstructs the root from the leaf and the proof, then checks it matches the stored root.

Two things deserve attention. The Merkle verification itself is straightforward: hash each sibling with the running value as you walk up the tree, and compare the result to the stored root. The interesting Solana detail is the ClaimRecord PDA. We use `init` on a PDA whose seeds derive from the claimer's address. The PDA's existence IS the "already claimed" flag. If the user has already claimed, the PDA exists, and the second `claim` call fails because `init` errors when the account already exists. No `mapping(address => bool)` is needed, no boolean flag, no explicit storage. The account's existence carries the bit of information.

If the user is in the tree, they can produce a valid proof. The program recomputes the root, sees it matches, and lets them claim. If the user is not in the tree, no proof exists that would lead back to the root. Whatever they submit will produce a hash that doesn't match, and the program reverts.

The user did the hard work of building the tree off-chain. The program did 14 hashes of verification work. The information needed to support 10,000 eligible users fits in a single 32-byte field on a single account.

This is the pattern at its purest. The same construction is how every modern Solana airdrop works, how Metaplex's compressed NFTs scale to millions of mints, and how state compression operates as a general technique. Once you can verify a Merkle proof, you can prove set membership cheaply, no matter how large the set.

## Worked example 2: square root verification

Some Solana programs need to compute square roots. AMMs use them for invariant calculations. Bonding curves use them for pricing. Constant-product math like `x * y = k` often needs `sqrt(k)` for the initial liquidity tokens minted to the first depositor.

Computing `sqrt(n)` for a `u64` requires an iterative algorithm, typically Newton's method or a binary search. A good implementation takes around 20-30 iterations and costs a few thousand CU. Not catastrophic, but not free either.

The off-chain trick: the user computes `sqrt(n)` themselves, without any compute unit constraint, and submits the answer. The program verifies the answer with two multiplications, costing about 50 CU total.

```rust
pub fn consume_sqrt(_ctx: Context<NoAccounts>, n: u64, claimed_root: u64) -> Result<u64> {
    let lower = claimed_root
        .checked_mul(claimed_root)
        .ok_or(MathError::Overflow)?;
    let next = claimed_root.checked_add(1).ok_or(MathError::Overflow)?;
    let upper = next.checked_mul(next).ok_or(MathError::Overflow)?;

    require!(lower <= n && n < upper, MathError::InvalidSqrt);

    Ok(claimed_root)
}

#[error_code]
pub enum MathError {
    InvalidSqrt,
    Overflow,
}
```

The user computes `r = floor(sqrt(n))` off-chain using whatever method they want, then calls the program with both `n` and `r`. The program checks two things: that `r * r` is at most `n`, and that `(r + 1) * (r + 1)` is greater than `n`. If both hold, `r` is exactly the integer square root of `n`.

The verification is two multiplications and two comparisons. Constant work. The user pays nothing for computing the root because they did it on their own machine. The program spends roughly 50 CU instead of a few thousand.

A user who submits a wrong answer can't corrupt anything. The check fails, the transaction reverts, and the user pays the priority fee for the failed attempt. There's no path through the program that uses an unverified root.

This same trick works for any function with a cheap verification. Modular inverse. Discrete logarithm checks. Bounded factorization. Any operation where checking is much cheaper than computing.

## The general shape

Look at both examples. The structural similarity is obvious once you see it:

- The user does the expensive work in their own environment, producing both a **value** they want the program to use and possibly some **proof** that helps the program verify the value.
- The user submits both pieces of data in a single instruction call.
- The program performs **verification logic** that's much cheaper than the original computation. Hashing for Merkle proofs. Multiplication for sqrt. Signature recovery for permits. The exact verification depends on the problem, but it's always cheap.
- If verification succeeds, the program trusts the value and uses it.
- If verification fails, the program reverts. The user's lie has cost them priority fees but accomplished nothing else.

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

This is the shape. Internalize it. Most non-trivial Solana engineering involves recognizing situations that fit this pattern and applying it.

## Why malicious users can't break this

A natural concern: if the user is computing the answer, what stops them from lying? The answer is that they're free to lie, but lying doesn't help them.

A lie has to pass verification. The verification logic is the program's own code, running deterministically on the chain. The user can't influence it. They can only submit inputs, and whatever they submit gets fed into the verification function. If the inputs don't produce a passing result, the program reverts.

Reverting is harmless to the program. State doesn't change. Other users aren't affected. The lying user pays for a failed transaction and gets nothing in return. There's no path where a wrong answer is accepted and used.

The security model only works if the verification is correct. A buggy Merkle verification that accepts invalid proofs is a disaster. A buggy sqrt verification that accepts wrong roots silently corrupts whatever consumes the root. The verification step is the security boundary, and it has to be airtight.

This is why production protocols often use verification libraries that have been reviewed and proven in production. Writing your own verification is a higher bar than writing application logic, because every edge case in the verifier is a potential exploit. When you can use a well-known verifier, do.

## Where else this pattern appears

A short tour of where you'll meet this pattern as you keep learning:

**Compressed NFTs.** Metaplex's Bubblegum standard stores millions of NFTs as leaves in a concurrent Merkle tree. The tree's root lives on chain. Every mint, transfer, or burn includes a proof showing the leaf's current state. The on-chain program verifies the proof and updates the root. This is how protocols fit a million NFTs into the rent cost of one account, instead of paying for a million separate accounts.

**Signatures.** A user signs a message off-chain with their wallet's private key. The program verifies the signature using ed25519 natively, or secp256k1 via a syscall. This is how off-chain orderbooks, gasless transactions, and proof-of-ownership systems work. One signature verification on chain replaces whatever computation the signer did to authorize the action.

**Oracle attestations.** Pyth, Switchboard, and other oracles have validators sign price observations off-chain. The aggregated signatures land on chain, and any program that needs the price verifies the signatures and trusts the data. The expensive part, gathering price observations from many sources, happens off-chain.

**ZK proofs.** A user computes a complex statement off-chain with a SNARK or STARK, producing a tiny proof. The program verifies the proof in fixed-size constant work, regardless of how complex the underlying statement is. ZK applications on Solana use this for privacy-preserving operations and verifiable computation.

**State compression generally.** Solana's state compression machinery is built around exactly this pattern. Data lives in off-chain Merkle trees with on-chain roots. Any read or modification submits a proof, and the program verifies it. The Solana SDK exposes concurrent Merkle trees as a first-class primitive precisely because the pattern is so common.

In every case, the structure is the same: heavy computation off-chain, cheap verification on-chain, malicious actors only burn their own fees.

## When the pattern doesn't apply

Not every problem fits. Three situations where you can't or shouldn't reach for this pattern:

**When verification is as expensive as computation.** If checking the answer takes the same work as computing it, there's no savings. Sorting is usually like this: verifying an array is sorted takes O(n) reads, cheaper than O(n log n) sorting, but still too expensive on-chain for large arrays. The pattern shines when verification is asymptotically cheaper than computation, like the difference between O(log n) Merkle verification and O(n) iteration.

**When the user can't be expected to do the work.** If your program is a black box that users interact with through a wallet, asking them to "compute a Merkle proof of inclusion" requires the wallet or the dApp frontend to do it for them. That's usually fine in practice. Every airdrop dApp does this. But it shifts complexity into the frontend, which may not be where you want it.

**When the off-chain answer changes faster than the chain can verify.** Time-sensitive answers like current prices can't be off-chain-computed and then verified, because by the time the verification runs, the answer is stale. This is the oracle problem in disguise.

For everything else, the pattern is your friend. If you ever find yourself looking at a loop that could DoS or a computation that's too expensive, ask yourself: can I move this work off-chain and verify a result?
