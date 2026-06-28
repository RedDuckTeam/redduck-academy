# Anchor and program structure

_type: lecture_

> A Solana program written from scratch is a single function that reads raw bytes, decides what to do with them, validates a list of accounts by hand, and writes raw bytes back out. Anchor is the framework most teams use to skip the boilerplate and write Solana programs the way you'd write a normal Rust API: typed handler functions, declared account schemas, generated error types. The macros in the middle do the conversion between what you wrote and what the runtime needs. Once the shape of a typical Anchor program is in your head, most of the rest of the course is filling in the details.

## What Anchor is for

The Solana runtime expects a program to be a single entry point. You pass it a buffer of bytes for instruction data, a list of accounts, and the program's address, and it returns a success or failure code. Everything else, including which function the bytes are meant to call, whether the right accounts are present, whether they have the right ownership, whether the data inside them matches the type you expect, is your responsibility.

You can write programs at that level. The Solana SDK gives you the tools. But almost no production team does, because the resulting code is mostly plumbing. Reading bytes, validating accounts, deserializing structs, serializing them again, returning numeric error codes. The actual business logic is buried under five layers of mechanical work, and any mistake in the mechanical work is a security bug.

Anchor is the Rust framework that handles all of that for you. You declare what each instruction takes, what accounts it touches, and what it does. Anchor's procedural macros expand at compile time into the same boilerplate you'd write by hand, except correct by construction. The framework that web developers know best as Express or FastAPI plays a similar role for Solana programs: declarative routing and typed handlers on top of an underlying protocol you don't want to write directly.

<svg viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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

The version of Anchor this course targets is 0.30 or later. Earlier versions had different idioms, particularly around account types and the `init` constraint, so older tutorials sometimes do not work without adjustment.

## The three pieces of every Anchor program

A typical Anchor program lives in `lib.rs` inside a Rust crate. Three pieces show up in every one.

The first is `declare_id!`. Every program has an address, and the address is hard-coded into the program's binary. The `declare_id!` macro takes a Base58 string and writes it into the right place. The Anchor CLI generates this address when you create a new project, and you keep it the same through development. When you deploy, the runtime checks that the address in the binary matches the address the program is being deployed to, which is one of several integrity checks Anchor adds for you.

The second is the `#[program]` module. This is where the instruction handlers live. Each handler is a public function that takes a `Context` parameter plus whatever arguments the instruction passed. The function body is your logic, and the return type is `Result<()>`, which is Anchor's wrapper around Solana's result type.

The third is one `#[derive(Accounts)]` struct for each instruction. The struct lists every account the handler needs, in order, with type annotations describing what each one must be. These structs are how you declare the access pattern from the lecture on instructions. They are also how you tell Anchor what validation to perform before your handler runs.

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
    pub fn initialize(
        ctx: Context<Initialize>,
        amount: u64,
    ) -> Result<()> {
        // your logic here
        Ok(())
    }
}

// One Accounts struct per handler. Lists the accounts the handler
// needs and what each one must be.
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
```

That is the entire shape. A few imports at the top, a program address, a module with instruction handlers, and one accounts struct per handler. Everything else you'll learn in this course is detail that fits inside this skeleton.

## How handlers and accounts structs pair up

The handler function and the accounts struct are not two separate things that happen to coexist. They are two halves of one instruction, linked by the `Context` type.

When you write `Context<Initialize>` as the first argument of your handler, you are telling Anchor that this handler operates on the accounts described by the `Initialize` struct. Before your handler runs, Anchor walks the struct, pulls each account out of the incoming transaction in order, validates it against the type and any constraints attached, and assembles a `ctx.accounts` object whose fields are already typed and verified. Inside the handler, you write `ctx.accounts.signer`, `ctx.accounts.system_program`, and you have real Rust types to work with rather than indices into a raw account array.

```rust
// The handler: what the instruction does.
pub fn deposit(
    ctx: Context<Deposit>,
    amount: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.total += amount;
    Ok(())
}

// The Accounts struct: what the instruction needs.
// Linked to the handler above by the `Context<Deposit>` parameter.
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
```

The Accounts struct declares which accounts the instruction touches and how. Before your handler runs, Anchor validates every account against the struct's rules. Inside the handler, `ctx.accounts.vault` is already a typed `Vault`. You write business logic. Anchor handles the plumbing on either side.

The accounts struct is the function signature. It declares what the instruction needs, in the same way a normal function declaration says what arguments it takes. The handler is the function body. It says what to do with what was passed in. Anchor wires the two together so cleanly that after a few hours of writing programs you stop thinking of them as separate pieces. Each instruction is one logical unit with two halves.

The struct fields can be more than just account references. They can be types that carry validation rules. `Signer<'info>` means "this account must have signed the transaction." `Account<'info, Vault>` means "this account must be owned by the program, and its data must deserialize cleanly into the `Vault` struct." `Program<'info, System>` means "this account must be the System Program." These types are checked by Anchor before your handler runs, and any failure produces a clear error rather than a runtime panic in the middle of your logic.

## What's next inside this skeleton

The shape above is the whole frame. To turn it into a real program, you need to know what types you can put inside an accounts struct, what constraints you can attach to fields, how to define your own account data structures, how to compute the address of an account derived from a seed, and how to return useful errors. Each of those is a piece of detail that fits into the skeleton you've already seen.

When you sit down to write a Solana program, you'll open `lib.rs`, type `declare_id!` and a program address, sketch the instruction handlers you need as empty functions, write the accounts struct for each one, and then fill in the logic. The skeleton is your starting template. Most of the work is deciding, instruction by instruction, what each one does and which accounts it needs to do it. The macros take care of the rest.
