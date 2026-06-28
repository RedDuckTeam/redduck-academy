# Rust for reading Anchor programs

_type: lecture_

> Anchor programs are written in Rust. You don't need to be a Rust expert to write Solana programs, but you do need to be able to read Rust. This lecture covers the syntax you'll see in every Anchor program: variables, types, structs, enums, functions, traits, the question-mark operator, pattern matching, and module imports. 

## Why Rust, specifically

Solana programs compile to BPF bytecode. The runtime needs to execute that bytecode deterministically across hundreds of validators with bounded resource use, no garbage collector, and no hidden memory allocation. Rust hits exactly those constraints: zero-cost abstractions, no runtime, predictable memory layout, and a type system strict enough to catch entire classes of bugs at compile time. It's the language Solana chose, and Anchor was built on top of it.

For your purposes, Rust is a means to an end. You read Rust to understand Anchor programs, and you write Rust inside the patterns Anchor establishes. You don't need to know async runtimes, smart pointers, or unsafe Rust. You need the syntax in this lecture, the borrow checker in the next, and the Anchor macros that build on both.

## Variables and mutability

Rust splits variables into immutable and mutable at the binding level. The default is immutable.

```rust
let count = 5;        // immutable, cannot be reassigned
let mut total = 0;    // mutable, can be reassigned

total = 10;           // OK
count = 6;            // compile error
```

You'll see `let mut` constantly in handler bodies because most state updates need to reassign or modify something. Outside of `let mut`, the default is immutable, meaning you can read a value but not change it.

There's also a third form, `const`, for compile-time constants. Anchor programs use these for fixed values like seed strings:

```rust
const LOCK_DURATION_SECONDS: i64 = 3 * 24 * 60 * 60;
const VAULT_SEED: &[u8] = b"vault";
```

Constants need a type annotation and can only hold values the compiler can evaluate before the program runs.

## The types you'll see

Rust has fixed-width integer types, which is exactly what you want for chain code:

```rust
let a: u8 = 255;              // unsigned 8-bit, 0 to 255
let b: u64 = 1_000_000;       // unsigned 64-bit, by far the most common
let c: i64 = -42;             // signed 64-bit, used for timestamps
let d: bool = true;
let e: [u8; 32] = [0; 32];    // fixed-size array of 32 bytes
```

The `_` in `1_000_000` is just a visual separator that the compiler ignores. The `[0; 32]` syntax creates an array of 32 zeros. Fixed-size arrays show up everywhere: 32-byte hashes, 64-byte signatures, Solana `Pubkey` values internally.

For variable-length data:

```rust
let v: Vec<u8> = vec![1, 2, 3, 4];    // growable byte vector
let s: String = String::from("hello"); // growable UTF-8 string
let p: Pubkey = ctx.accounts.user.key(); // a Solana public key
```

`Vec<T>` is the heap-allocated growable list. `String` is its text-typed cousin. Both are owned, sized at runtime, and stored on the heap.

You'll also see `&str` (string slice) and `&[u8]` (byte slice) in function signatures. These are borrowed views into someone else's data, which is covered in the next lecture.

## Functions

A Rust function declares its parameters with types and uses `->` for the return type:

```rust
fn add(a: u64, b: u64) -> u64 {
    a + b
}
```

A few things worth noting. The last expression in the function body is the return value, with no `return` keyword needed and no semicolon. You can write `return a + b;` with the keyword if you prefer, but most Rust code uses the implicit form. If a function returns nothing, you omit the `->` clause entirely, and the body's last line ends with a semicolon.

You'll see `pub fn` constantly. The `pub` keyword exposes the function outside its module. In Anchor, every instruction handler is `pub fn` because the Anchor macro layer needs to call it from outside.

## Structs

A struct groups several fields under one name. This is how Anchor accounts are defined:

```rust
pub struct Config {
    pub rddk_mint: Pubkey,
    pub vrddk_mint: Pubkey,
    pub bump: u8,
}
```

Each field has a name and a type. The `pub` on each field makes it readable from outside the struct's defining module. To create an instance:

```rust
let config = Config {
    rddk_mint: some_pubkey,
    vrddk_mint: another_pubkey,
    bump: 254,
};
```

To read a field, dot syntax: `config.rddk_mint`. To modify a field, the binding must be mutable, and then `config.bump = 253;` works.

You'll occasionally see tuple structs, where the fields don't have names:

```rust
pub struct Wrapper(pub u64);
```

The single field is accessed as `wrapper.0`. These are uncommon in Anchor code but show up in some library types.

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

Rust uses attributes for compiler metadata, written as `#[name]` or `#[name(args)]` above a function, struct, or module. Anchor uses these heavily.

```rust
#[program]              // marks the module containing instruction handlers
pub mod staking { ... }

#[derive(Accounts)]     // generates the Accounts trait implementation
pub struct Stake<'info> { ... }

#[account]              // marks a struct as a Solana account layout
pub struct UserState { ... }
```

The `#[derive(...)]` form is special. It tells the compiler "automatically generate an implementation of these traits for this type." `#[derive(Clone, Debug)]` gives you a clonable, printable type without writing the trait methods yourself. Anchor extends this with custom derives like `#[derive(Accounts)]` that generate the validation and deserialization code for an instruction's account list.

You don't need to understand how attributes are implemented. You just need to recognize that something annotated with `#[program]` or `#[account]` is being processed by an Anchor macro, and the macro is generating code you never see.

## Traits

A trait is Rust's version of an interface. It defines a set of methods that a type can implement. Most Rust code uses traits indirectly through derives.

```rust
pub trait Sized {
    // ... required methods ...
}

pub trait Clone {
    fn clone(&self) -> Self;
}
```

When you write `#[derive(Clone)]`, you're asking the compiler to generate the `Clone` implementation. When you write `impl SomeTrait for MyStruct`, you're providing the implementation yourself.

In Anchor code, you'll mostly encounter traits when looking at function signatures like:

```rust
pub fn process<T: AccountSerialize>(...) { ... }
```

The `T: AccountSerialize` is a trait bound: "T can be any type, as long as that type implements the `AccountSerialize` trait." You won't write code like this in handlers, but you'll read it in Anchor's source when something goes wrong and you need to understand what an error means.

## The `?` operator

This is the single most common Rust idiom in Anchor code. The `?` after an expression returning `Result` does:

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

This runs the block only if `optional_thing` is `Some(...)`, binding the inner value to `value`. If you only want to act on one case and ignore everything else, use `if let`. If you need to handle multiple cases, use `match`.

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

A few path conventions:

- `crate::` is the root of your own program
- `self::` is the current module
- `super::` is the parent module
- `anchor_lang::`, `anchor_spl::`, and `solana_program::` are common external crates

The `*` glob, as in `use anchor_lang::prelude::*;`, imports everything from a module. The convention is to use it sparingly. Most imports name the items they want.

## Reading a real handler

Putting it all together, here's a typical Anchor instruction handler. You should now be able to read every line:

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

Walking through:

- The `use` statements import the Anchor prelude, the SPL Token types, and through `super::*` everything from the parent.
- `#[program]` marks the module as containing instruction handlers.
- `stake` is a public function returning `Result<()>`, taking a `Context<Stake>`, which is Anchor's wrapper around the validated accounts, and a `u64` amount.
- `require!(...)` is an Anchor macro that returns the given error if the condition is false.
- A `Transfer` struct is built with three fields (`from`, `to`, `authority`).
- `CpiContext::new` produces the context for an SPL Token transfer.
- `token::transfer(...)?` does the transfer, returning early if it fails.
- `&mut ctx.accounts.position` takes a mutable reference to the position account, which is covered next.
- `position.amount = amount` and the next line write to fields.
- `Clock::get()?.unix_timestamp` reads the current unix time, with `?` bailing out on failure.
- `checked_add(1).ok_or(...)?` does a checked addition, converting a `None`, which signals overflow, into an error, then unwrapping the result.
- `Ok(())` signals success.

If that reads cleanly now, you have the Rust you need to start writing Anchor handlers. The one thing still in the way is the borrow checker, which is the next lecture.
