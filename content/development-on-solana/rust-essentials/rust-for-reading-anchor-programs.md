---
id: 215
title: Rust for reading Anchor programs
type: lecture
order: 1
faq:
  - question: Do I need to be a Rust expert to write Solana programs?
    answer: >-
      No. Read Rust, write inside the patterns Anchor sets up, and skip async runtimes,
      smart pointers and unsafe Rust. The basic syntax, the borrow checker and the Anchor
      macros built on both are what you need.
  - question: What does the ? operator do in Rust and Anchor code?
    answer: >-
      It handles a Result in one character. On success it unwraps the value and continues.
      On failure it returns early with that error. Writing token::transfer(cpi_ctx, amount)?
      means do the transfer and bail out of the handler if it fails.
  - question: What do Option and Result mean in Rust?
    answer: >-
      Both are enums. Option<T> is either Some(value) or None. Result<T, E> is either
      Ok(value) or Err(error). Anchor instruction handlers return Result<()>.
  - question: Why do some Rust variables use let mut and others just let?
    answer: >-
      Bindings are immutable by default, so a plain let cannot be reassigned. Adding mut
      makes it reassignable. There is a third form, const, for fixed compile-time values,
      and it needs a type annotation.
  - question: What does Ok(()) at the end of a handler mean?
    answer: >-
      Success, returning nothing. Anchor handlers return Result<()>, where () is the empty
      value.
---

> Anchor programs are written in Rust. You don't need to be a Rust expert to write Solana programs, but you do need to be able to read Rust. The syntax you'll meet is a small, fixed set: variables, types, structs, enums, functions, traits, the question-mark operator, pattern matching, and module imports. Learn to read those and almost every Anchor program becomes readable.

## Why Rust, specifically

Solana programs compile to BPF bytecode. The runtime needs to execute that bytecode deterministically across hundreds of validators with bounded resource use. Rust has no garbage collector and no hidden memory allocation, so the compute units a handler spends are predictable. It's the language Solana chose, and Anchor was built on top of it.

You read Rust to understand Anchor programs, and you write Rust inside the patterns Anchor establishes. You don't need to know async runtimes, smart pointers, or unsafe Rust. You need the syntax in this lecture, the borrow checker in the next, and the Anchor macros that build on both.

## Variables and mutability

Rust splits variables into immutable and mutable at the binding level, and the default is immutable.

```rust
let count = 5;        // immutable, cannot be reassigned
let mut total = 0;    // mutable, can be reassigned

total = 10;           // OK
count = 6;            // compile error
```

You'll see `let mut` in handler bodies because most state updates need to reassign or modify something.

There's also a third form, `const`, for compile-time constants. Anchor programs use these for fixed values like seed strings:

```rust
const LOCK_DURATION_SECONDS: i64 = 3 * 24 * 60 * 60;
const VAULT_SEED: &[u8] = b"vault";
```

Constants need a type annotation and can only hold values the compiler can evaluate before the program runs.

## The types you'll see

Every integer type in Rust has a fixed width, and on-chain code depends on that. An account's data is a blob of bytes sized at creation, as the [accounts lesson](/courses/development-on-solana/the-solana-mental-model/accounts) showed, so every field has to take a known number of bytes. A `u64` always takes 8 and a `u8` always takes 1.

```rust
let a: u8 = 255;              // unsigned 8-bit, 0 to 255
let b: u64 = 1_000_000;       // unsigned 64-bit, by far the most common
let c: i64 = -42;             // signed 64-bit, used for timestamps
let d: bool = true;
let e: [u8; 32] = [0; 32];    // fixed-size array of 32 bytes
```

The `_` in `1_000_000` is a visual separator that the compiler ignores. The `[0; 32]` syntax creates an array of 32 zeros. Fixed-size arrays show up everywhere: 32-byte hashes, 64-byte signatures, Solana `Pubkey` values internally.

A fixed width means a value can overflow. By default Rust's debug builds panic on integer overflow and release builds wrap, and a program is built in release mode. The workspace `Cargo.toml` that `anchor init` generates turns the check back on with `overflow-checks = true`, so in a program built from that template an unchecked `+` that passes the maximum panics and the transaction fails. The setting is one line in that file, and a project without it gets wrapping arithmetic. In a build that wraps, an unchecked `+` on a `u64` that passes the maximum leaves a small number with no error. Handlers therefore add with `checked_add`, which returns `None` on overflow in either build and lets the handler return its own error, as the handler at the end of this lecture does. [The classic Solana exploits](/courses/development-on-solana/production-state-design/the-classic-solana-exploits) comes back to this bug.

Token amounts in this course are integers. A fraction such as a 0.3 percent fee is computed in integer arithmetic, without floating point, as in the [AMM lesson](/courses/development-on-solana/production-state-design/amm).

For variable-length data:

```rust
let v: Vec<u8> = vec![1, 2, 3, 4];    // growable byte vector
let s: String = String::from("hello"); // growable UTF-8 string
let p: Pubkey = ctx.accounts.user.key(); // a Solana public key
```

`Vec<T>` is the heap-allocated growable list. `String` is the same, but for UTF-8 text. Both are sized at runtime and stored on the heap. An account's data field does not grow when you push to one of them, so an account that stores a `Vec` or a `String` reserves room for a maximum length up front, which [account space and layout](/courses/development-on-solana/writing-your-first-program/account-space-and-layout) covers.

You'll also see `&str` (string slice) and `&[u8]` (byte slice) in function signatures. These are borrowed views into someone else's data, which is covered in the next lecture.

## Functions

```rust
fn add(a: u64, b: u64) -> u64 {
    a + b
}
```

The last expression in the function body is the return value, with no `return` keyword needed and no semicolon. If a function returns nothing, you omit the `->` clause, and the body's last line ends with a semicolon.

The `pub` keyword exposes the function outside its module. In Anchor, every instruction handler is `pub fn` because the Anchor macro layer needs to call it from outside.

## Structs

Anchor accounts are defined as structs:

```rust
pub struct Config {
    pub rddk_mint: Pubkey,
    pub vrddk_mint: Pubkey,
    pub bump: u8,
}
```

The `pub` on each field makes it readable from outside the struct's defining module. To create an instance:

```rust
let config = Config {
    rddk_mint: some_pubkey,
    vrddk_mint: another_pubkey,
    bump: 254,
};
```

To modify a field, the binding must be mutable, and then `config.bump = 253;` works.

## Enums

An enum is a type that can be one of several variants. The two enums you'll meet daily are `Option<T>` and `Result<T, E>`, both built into the language.

```rust
pub enum Option<T> {
    Some(T),
    None,
}

pub enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Option<T>` represents "maybe a value of type T." `Result<T, E>` represents "either a successful T or an error E." Anchor handlers return `Result<()>` or sometimes `Result<SomeType>`, where the success type might be empty `()` and the error type is provided by Anchor itself.

You can also define your own enums. Anchor's `#[error_code]` macro takes one:

```rust
#[error_code]
pub enum StakingError {
    ZeroAmount,
    StakeStillLocked,
    InvalidMint,
}
```

Each variant becomes an error your program can return. The macro generates the boilerplate for converting these into Anchor's error type.

## The attribute syntax

Rust uses attributes for compiler metadata, written as `#[name]` or `#[name(args)]` above a function, struct, or module, and Anchor uses them heavily.

```rust
#[program]              // marks the module containing instruction handlers
pub mod staking { ... }

#[derive(Accounts)]     // generates the Accounts trait implementation
pub struct Stake<'info> { ... }

#[account]              // marks a struct as a Solana account layout
pub struct UserState { ... }
```

You don't need to understand how attributes are implemented. You need to recognize that something annotated with `#[program]` or `#[account]` is being processed by an Anchor macro, and the macro is generating code you never see. The `<'info>` after `Stake` is a lifetime, which the next lecture explains.

## Traits and `#[derive]`

A trait is Rust's version of an interface. It defines a set of methods that a type can implement.

```rust
pub trait Clone {
    fn clone(&self) -> Self;
}
```

When you write `impl SomeTrait for MyStruct`, you're providing the implementation yourself. When you write `#[derive(Clone)]`, you're asking the compiler to generate the `Clone` implementation. `#[derive(Clone, Debug)]` gives you a clonable, printable type without writing the trait methods yourself. Anchor extends this with custom derives like `#[derive(Accounts)]` that generate the validation and deserialization code for an instruction's account list.

## The `?` operator

The `?` after an expression returning `Result` does one of two things:

- If the result is `Ok(value)`, unwrap it to `value` and continue.
- If the result is `Err(e)`, return early from the current function with `Err(e)`.

```rust
pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    require!(amount > 0, StakingError::ZeroAmount);

    // Each `?` here means "if this returns Err, bail out of stake()."
    let clock = Clock::get()?;
    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.position.amount = amount;
    ctx.accounts.position.staked_at = clock.unix_timestamp;
    Ok(())
}
```

Without `?`, you'd write:

```rust
let clock = match Clock::get() {
    Ok(c) => c,
    Err(e) => return Err(e),
};
```

The `?` operator compresses that pattern into a single character. Every `?` you see in a handler is one possible early-return point. The handler's final line is usually `Ok(())`, which returns success with an empty success value.

## Pattern matching

The `match` expression branches on the shape of a value. It's exhaustive: the compiler requires you to handle every possible case, or use `_` as a catch-all.

```rust
match Clock::get() {
    Ok(clock) => msg!("current time: {}", clock.unix_timestamp),
    Err(_) => msg!("could not read clock"),
}
```

Each arm has the pattern on the left of `=>` and the body on the right. Patterns can destructure: `Ok(clock)` binds the inner value to `clock` for use in the body.

For the common case of caring about only one variant, `if let` is shorter:

```rust
if let Some(value) = optional_thing {
    msg!("got value: {}", value);
}
```

This runs the block only if `optional_thing` is `Some(...)`, binding the inner value to `value`.

## Modules and `use`

A Rust project is organized into modules. Each `.rs` file is a module by default. Inside a file, the `mod` keyword can create a submodule:

```rust
pub mod state {
    pub mod config { ... }
    pub mod user_state { ... }
}
```

To reach into another module, you use a path with `::` as the separator:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::Config;
```

The first line pulls in everything from Anchor's `prelude` module, which is the standard set of imports every Anchor program needs. The second pulls specific items from `anchor_spl::token`. The third reaches into your own crate, your program itself, and pulls the `Config` type from a state module you defined.

`use` statements live at the top of a file. Once imported, you can refer to a type by its short name (`Config`) instead of its full path (`crate::state::Config`).

The `*` glob, as in `use anchor_lang::prelude::*;`, imports everything from a module. The convention is to use it sparingly. Most imports name the items they want.

## Reading a real handler

Here is a typical Anchor instruction handler:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[program]
pub mod staking {
    use super::*;

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::ZeroAmount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

        let position = &mut ctx.accounts.position;
        position.amount = amount;
        position.staked_at = Clock::get()?.unix_timestamp;

        let user_state = &mut ctx.accounts.user_state;
        user_state.stake_count = user_state
            .stake_count
            .checked_add(1)
            .ok_or(StakingError::Overflow)?;

        Ok(())
    }
}

#[error_code]
pub enum StakingError {
    ZeroAmount,
    Overflow,
}
```

Most of it is syntax from the sections above. The rest:

- `use super::*` inside the `staking` module imports everything from the parent module, which here is the rest of the file: the names its two `use` lines bring in and `StakingError`.
- `Context<Stake>` is Anchor's wrapper around the validated accounts.
- `require!(...)` is an Anchor macro that returns the given error if the condition is false.
- The `Transfer` struct and `CpiContext::new` produce the context for an SPL Token transfer, and `token::transfer(...)?` does the transfer, returning early if it fails. The [CPI lesson](/courses/development-on-solana/working-with-other-programs/cross-program-invocation-cpi) covers these calls.
- `&mut ctx.accounts.position` takes a mutable reference to the position account, which is covered next.
- `checked_add(1).ok_or(...)?` does a checked addition, converting a `None`, which signals overflow, into an error, then unwrapping the result.

If that reads cleanly now, you have the Rust you need to start writing Anchor handlers. The only remaining concept you need is the borrow checker, which is the next lecture.
