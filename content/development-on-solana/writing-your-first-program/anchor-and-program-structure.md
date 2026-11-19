---
id: 187
title: Anchor and program structure
type: lecture
order: 1
faq:
  - question: Why use Anchor instead of writing a Solana program from scratch?
    answer: >-
      Almost everything in a raw program is plumbing, and a mistake in plumbing is a security
      bug. Anchor's macros generate that plumbing at compile time.
  - question: What goes in every Anchor program?
    answer: >-
      Three pieces, all in lib.rs. declare_id! writes the program's Base58 address into the
      binary, and the runtime checks it against the address you deploy to. The #[program] module
      holds one public handler per instruction, each returning Result<()>. Then one
      #[derive(Accounts)] struct per handler, listing the accounts that instruction touches.
  - question: How does my handler get typed accounts instead of a raw account array?
    answer: >-
      The Context<T> parameter. Anchor walks the struct it names before the handler runs, pulls
      each account out of the transaction in order, validates it, and fills ctx.accounts with
      typed fields.
  - question: Which Anchor version does this course target?
    answer: >-
      0.30 or later. Earlier versions used different idioms around account types and the init
      constraint, so older tutorials often need adjustment.
---

> A Solana program written from scratch is a single function that reads raw bytes, decides what to do with them, validates a list of accounts by hand, and writes raw bytes back out. Anchor is the framework most teams use to skip the boilerplate and write Solana programs the way you'd write a normal Rust API: typed handler functions, declared account schemas, generated error types. The macros in the middle do the conversion between what you wrote and what the runtime needs.

## What Anchor is for

The Solana runtime expects a program to be a single entry point. You pass it a buffer of bytes for instruction data, a list of accounts, and the program's address, and it returns a success or failure code. Everything else, including which function the bytes are meant to call, whether the right accounts are present, whether they have the right ownership, whether the data inside them matches the type you expect, is your responsibility.

You can write programs at that level, and the Solana SDK gives you the tools. But almost no production team does, because the resulting code is mostly plumbing: reading bytes, validating accounts, deserializing structs, serializing them again, returning numeric error codes. The actual business logic is buried under six layers of mechanical work, and any mistake in the mechanical work is a security bug.

Anchor is the Rust framework that handles all of that for you. You declare what each instruction takes, what accounts it touches, and what it does. Anchor's procedural macros expand at compile time into the same boilerplate you'd write by hand, except correct by construction.

<svg role="img" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>What Anchor handles for you: manual steps vs Anchor macros</title><desc>Two columns compare handling a Solana instruction without a framework and with Anchor, across seven steps from reading raw instruction bytes to returning errors. The left column shows the manual code each step needs; the right column shows Anchor macros like #[program], #[derive(Accounts)], Account&lt;T&gt;, and #[error_code] doing that work, leaving only step 5, running your own logic, for you to write.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">What Anchor handles for you</text>
  <rect x="40" y="90" width="310" height="330" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">without a framework</text>
  <text x="60" y="143" font-family="monospace" font-size="10">1. Read raw instruction bytes</text>
  <text x="75" y="158" font-family="monospace" font-size="9" fill="#565653">manual deserialization</text>
  <text x="60" y="180" font-family="monospace" font-size="10">2. Parse the discriminator</text>
  <text x="75" y="195" font-family="monospace" font-size="9" fill="#565653">decide which function to run</text>
  <text x="60" y="217" font-family="monospace" font-size="10">3. Validate every account:</text>
  <text x="75" y="232" font-family="monospace" font-size="9" fill="#565653">- right owner?</text>
  <text x="75" y="246" font-family="monospace" font-size="9" fill="#565653">- right signer?</text>
  <text x="75" y="260" font-family="monospace" font-size="9" fill="#565653">- right size, right type?</text>
  <text x="60" y="282" font-family="monospace" font-size="10">4. Deserialize account data</text>
  <text x="75" y="297" font-family="monospace" font-size="9" fill="#565653">turn bytes into typed structs</text>
  <text x="60" y="319" font-family="monospace" font-size="10">5. Run your logic</text>
  <text x="60" y="341" font-family="monospace" font-size="10">6. Serialize and write back</text>
  <text x="75" y="356" font-family="monospace" font-size="9" fill="#565653">turn typed structs into bytes</text>
  <text x="60" y="378" font-family="monospace" font-size="10">7. Return raw error codes</text>
  <text x="75" y="393" font-family="monospace" font-size="9" fill="#565653">no nice messages</text>
  <text x="195" y="412" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">most of this is boilerplate</text>
  <rect x="370" y="90" width="310" height="330" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">with Anchor</text>
  <text x="390" y="143" font-family="monospace" font-size="10">1. Read raw instruction bytes</text>
  <text x="405" y="158" font-family="monospace" font-size="9" fill="#565653">#[program] handles it</text>
  <text x="390" y="180" font-family="monospace" font-size="10">2. Parse the discriminator</text>
  <text x="405" y="195" font-family="monospace" font-size="9" fill="#565653">#[program] handles it</text>
  <text x="390" y="217" font-family="monospace" font-size="10">3. Validate every account</text>
  <text x="405" y="232" font-family="monospace" font-size="9" fill="#565653">#[derive(Accounts)] handles it</text>
  <text x="390" y="254" font-family="monospace" font-size="10">4. Deserialize account data</text>
  <text x="405" y="269" font-family="monospace" font-size="9" fill="#565653">Account&lt;T&gt; handles it</text>
  <text x="390" y="291" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">5. Run your logic</text>
  <text x="405" y="306" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">this is what you write</text>
  <text x="390" y="328" font-family="monospace" font-size="10">6. Serialize and write back</text>
  <text x="405" y="343" font-family="monospace" font-size="9" fill="#565653">Account&lt;T&gt; handles it</text>
  <text x="390" y="365" font-family="monospace" font-size="10">7. Typed error enums</text>
  <text x="405" y="380" font-family="monospace" font-size="9" fill="#565653">#[error_code] handles it</text>
  <text x="525" y="412" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937" font-style="italic" font-weight="bold">one line of boilerplate, six of business logic</text>
  <text x="360" y="460" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Anchor's macros expand at compile time into the same code you'd write by hand, only correct.</text>
</svg>

Anchor's convenience costs compute units. By default it deserializes an account's data into a Rust struct before the handler runs and, for an account marked `mut`, serializes it back at the end, which becomes a bottleneck for large accounts, as [zero-copy accounts](/courses/development-on-solana/production-state-design/zero-copy-accounts) explains. It also moves the checks into generated code you never see. Anchor performs only the checks you declare, and nothing in the handler shows that one is missing.

This course targets Anchor 0.30 or later. Earlier versions had different idioms, particularly around account types and the `init` constraint, so older tutorials sometimes do not work without adjustment.

## The three pieces of every Anchor program

A typical Anchor program lives in `lib.rs` inside a Rust crate. Three pieces show up in every one.

The first is `declare_id!`. Every program has an address, and the address is hard-coded into the program's binary. The `declare_id!` macro takes a Base58 string and writes it into the right place. The Anchor CLI generates this address when you create a new project, and you keep it the same through development. The runtime does not compare it with anything when you deploy, so the binary deploys to any address. The check happens in the entry point that Anchor generates: on every call it compares the address the program was called at with the one in `declare_id!` and fails with `DeclaredProgramIdMismatch` if they differ, so a program deployed to the wrong address rejects every instruction.

The second is the `#[program]` module, where the instruction handlers live. Each handler is a public function that takes a `Context` parameter plus whatever arguments the instruction passed. The function body is your logic, and the return type is `Result<()>`, which is Anchor's wrapper around Solana's result type.

The third is one `#[derive(Accounts)]` struct for each instruction. The struct lists every account the handler needs, in order, with type annotations describing what each one must be. These structs tell Anchor which accounts the instruction reads or writes and what validation to perform on each one before your handler runs.

Here are the three pieces in a program with one instruction, `deposit`, which adds an amount to a vault's `total`. The `#[account]` attribute on `Vault` declares the layout of the vault's data:

```rust
use anchor_lang::prelude::*;

// The program's address, hard-coded into the binary.
declare_id!("Fg6PaFpoGXkYsidMpWxqSWPg2J9eRMK8RnPwYxNb8nN");

// The module containing every instruction handler.
#[program]
pub mod my_program {
    use super::*;

    // One handler per instruction. The Context generic tells Anchor
    // which Accounts struct describes the accounts this handler expects.
    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.total += amount;
        Ok(())
    }
}

// One Accounts struct per handler. Lists the accounts the handler
// needs and what each one must be.
#[derive(Accounts)]
pub struct Deposit<'info> {
    // `mut` means this account will be written to.
    // `Account<'info, Vault>` requires it to be owned by this program
    // and to deserialize cleanly into a `Vault` struct.
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    // `Signer<'info>` means this account must have signed the transaction.
    pub depositor: Signer<'info>,
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub total: u64,
}
```

## `Context` links a handler to its accounts struct

When you write `Context<Deposit>` as the first argument of your handler, you are telling Anchor that this handler operates on the accounts described by the `Deposit` struct. Before your handler runs, Anchor walks the struct, pulls each account out of the incoming transaction in order, validates it against the type and any constraints attached, and assembles a `ctx.accounts` object whose fields are already typed and verified. Inside the handler, you write `ctx.accounts.vault`, `ctx.accounts.depositor`, and you have real Rust types to work with rather than indices into a raw account array.

`ctx.accounts.vault` is already a typed `Vault`. The types in the struct are checked by Anchor before your handler runs, and any failure produces a clear error rather than a runtime panic in the middle of your logic. [Account types in Anchor](/courses/development-on-solana/writing-your-first-program/account-types-in-anchor) covers what each type checks.

## Check every account in the struct

When you read or write an accounts struct, go field by field and ask who could have supplied this account and what stops them from supplying a different one. In `Deposit`, `depositor` must have signed, and `vault` must be a `Vault` that this program owns, but nothing in the struct says which vault, so the caller chooses. Whether that is acceptable is a decision you make for every field, and [account constraints](/courses/development-on-solana/writing-your-first-program/account-constraints) shows how to write the answer down.
