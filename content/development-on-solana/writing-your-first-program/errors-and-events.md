---
id: 193
title: Errors and events
type: lecture
order: 60
faq:
  - question: How do I make an instruction fail with my own error message?
    answer: >-
      Define a Rust enum tagged with #[error_code], each variant carrying the #[msg("...")] line
      clients display. Guard the handler with require!(amount > 0, MyError::ZeroAmount). A false
      condition aborts the transaction, so run every check before you touch state.
  - question: Why is my custom error code 6000 instead of 0?
    answer: >-
      Anchor reserves 0 through 5999 for its own errors, so your first variant is 6000. Codes
      follow variant order, so append new variants and never reorder them.
  - question: My require! failure only logs the error name. How do I see the values?
    answer: >-
      Switch to the comparing forms. require_eq! logs both sides, "SizeMismatch. Left: 100.
      Right: 250." require_keys_eq! does the same for two Pubkeys and prints them in base58,
      which is what an authority check needs.
  - question: Can another instruction read a value I emitted with emit!?
    answer: >-
      No. An #[event] struct goes to the transaction's logs, and on-chain code cannot read logs.
      Anything a later instruction has to check belongs in account state.
  - question: How do I add to a u64 without overflowing?
    answer: >-
      checked_add returns an Option, so chain ok_or onto it:
      counter.value.checked_add(by).ok_or(CounterError::Overflow)?
---

> A handler has to deal with more than the happy path: someone passed a zero amount, the caller isn't authorized, the lockup hasn't expired, the vault is empty. Every one of these conditions needs to abort the transaction with a message the user can read. Separately, when the happy path succeeds, off-chain consumers want to know what changed: who deposited, who withdrew, how much. The first is the job of errors, the second of events.

## Errors are an enum, and the order of its variants is fixed

A program's errors are a Rust enum tagged with `#[error_code]`. Each variant is one failure case, with a human-readable message. The macro turns the enum into something Anchor can return and the IDL can describe.

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum CounterError {
    #[msg("Increment must be greater than zero")]
    ZeroIncrement,

    #[msg("Caller lacks admin authority")]
    Unauthorized,

    #[msg("Counter would overflow")]
    Overflow,

    #[msg("Counter would exceed configured maximum")]
    WouldExceedMax,

    #[msg("Counter is locked")]
    Locked,
}
```

The numeric error codes start at 6000, because Anchor reserves 0 through 5999 for framework errors. The messages end up in the IDL and are what client tools display when the error fires. The variant order is positional, so once a program is deployed, appending new variants is safe but reordering or inserting breaks every later error code for clients.

## require! aborts the transaction when a condition is false

`require!` covers most checks. The first argument is a boolean expression that must be true. If it isn't, the transaction aborts with the named error.

```rust
require!(by > 0, CounterError::ZeroIncrement);
require!(!counter.locked, CounterError::Locked);
require!(
    counter.value + by <= counter.max,
    CounterError::WouldExceedMax,
);
```

Anchor's macro layer expands each one into the equivalent of an `if !condition { return Err(...) }`. Three of these stacked at the top of a handler is a normal pattern.

The other forms exist for the sake of the log. A failed `require!` logs only the error name. When the check is equality between two values, `require_eq!`, or its negation `require_neq!`, also logs both values as two lines, for example `Left: 100` and `Right: 250`, which saves a debugging round trip when a test fails. It works for integers and any other type that implements `Display`. A byte array or a type that only implements `Debug` does not compile with it. `require_keys_eq!` and `require_keys_neq!` do the same for two pubkeys and log them in base58:

```rust
// authority check
require_keys_eq!(
    ctx.accounts.admin.key(),
    counter.admin,
    CounterError::Unauthorized,
);
```

For the rare path that needs to log diagnostic info before erroring, fall back to the explicit form: an `if` that calls `msg!` and ends with `return Err(ERR.into())`. The `.into()` converts your enum variant into the `anchor_lang::error::Error` type that handlers return. If a `require!` works, prefer it.

## Account checks go in the struct, argument checks in the handler

The authority check above compares the key of the `admin` account with the key stored in `counter`, and the [constraints lesson](/courses/development-on-solana/writing-your-first-program/account-constraints) already has a place for that: `has_one = admin` on the `counter` field does the same comparison before the handler runs:

```rust
#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = admin @ CounterError::Unauthorized)]
    pub counter: Account<'info, Counter>,
    pub admin: Signer<'info>,
}
```

The `@ CounterError::Unauthorized` part makes a failed check return your `Unauthorized` error instead of Anchor's generic `ConstraintHasOne`. Who an account is and whether it is the right one belongs in the Accounts struct, as `has_one`, `seeds`, or `constraint = expr @ MyError::SomeReason`. What stays in the handler are the rules that depend on the instruction's arguments: the amount is greater than zero, the maximum is not exceeded. A rule about stored state alone, such as the counter not being locked, can be written either way, as `require!` in the handler or as `constraint = expr` in the struct.

## Events report what a successful transaction did

Errors stop a transaction. Events report what a successful one did. The mechanism is a structured log entry: you define a Rust struct with `#[event]`, then emit it from your handler.

```rust
#[event]
pub struct Incremented {
    pub counter: Pubkey,
    pub by: u64,
    pub new_value: u64,
}

// inside the handler:
emit!(Incremented {
    counter: counter.key(),
    by,
    new_value: counter.value,
});
```

The `#[event]` macro registers the struct's schema in the IDL, so off-chain code knows how to decode it. The `emit!` macro inside the handler serializes one instance of the struct and writes it to the transaction's logs.

Indexers like Helius or Triton subscribe to a program's logs, decode every event they care about, and write rows into a database. Frontend code reads from that database to show "the latest deposits" or "recent trades." Discord bots read the same stream and post announcements as events arrive. Account state cannot serve this purpose, because it shows the current values and not how the account got there. The [off-chain state lesson](/courses/development-on-solana/production-state-design/off-chain-state-events-logs-and-indexers) covers indexers in detail.

## State vs events: where each piece of data belongs

The most common mistake new developers make in this area is treating events as a substitute for on-chain state. They emit an event for some piece of data, then try to read it back from another instruction. It doesn't work, because events are not on-chain readable.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>State vs events: two different output channels</title><desc>Two side-by-side panels compare state (on accounts) and events (emit!) across written by, lives, cost, readable by, and good for. State lives in the account's data field and is readable by on-chain and off-chain code, while events live in the transaction's logs and can only be read by off-chain consumers, never by on-chain code.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">State vs events: two different output channels</text>
  <rect x="40" y="90" width="310" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">state (on accounts)</text>
  <text x="55" y="142" font-family="monospace" font-size="10">written by:</text>
  <text x="55" y="158" font-family="monospace" font-size="10" fill="#565653">vault.total += amount;</text>
  <line x1="55" y1="175" x2="335" y2="175" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="197" font-family="monospace" font-size="10">lives:</text>
  <text x="55" y="213" font-family="monospace" font-size="10" fill="#565653">in the account's data field</text>
  <text x="55" y="237" font-family="monospace" font-size="10">cost:</text>
  <text x="55" y="253" font-family="monospace" font-size="10" fill="#565653">rent + compute</text>
  <text x="55" y="267" font-family="monospace" font-size="9" fill="#565653">paid once at allocation</text>
  <text x="55" y="291" font-family="monospace" font-size="10">readable by:</text>
  <text x="55" y="307" font-family="monospace" font-size="10" fill="#565653">on-chain code (other programs,</text>
  <text x="55" y="321" font-family="monospace" font-size="10" fill="#565653">later instructions in this tx)</text>
  <text x="55" y="335" font-family="monospace" font-size="10" fill="#565653">off-chain code (RPC, indexers)</text>
  <text x="55" y="365" font-family="monospace" font-size="10">good for:</text>
  <text x="55" y="381" font-family="monospace" font-size="10" fill="#565653">- the source of truth</text>
  <text x="55" y="395" font-family="monospace" font-size="10" fill="#565653">- anything that gates logic</text>
  <text x="55" y="409" font-family="monospace" font-size="10" fill="#565653">- balances, ownership, status</text>
  <text x="195" y="445" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">the chain's enforcement layer</text>
  <rect x="370" y="90" width="310" height="380" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">events (emit!)</text>
  <text x="385" y="142" font-family="monospace" font-size="10">written by:</text>
  <text x="385" y="158" font-family="monospace" font-size="10" fill="#565653">emit!(Deposited { ... });</text>
  <line x1="385" y1="175" x2="665" y2="175" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="385" y="197" font-family="monospace" font-size="10">lives:</text>
  <text x="385" y="213" font-family="monospace" font-size="10" fill="#565653">in the transaction's logs</text>
  <text x="385" y="237" font-family="monospace" font-size="10">cost:</text>
  <text x="385" y="253" font-family="monospace" font-size="10" fill="#565653">compute only</text>
  <text x="385" y="267" font-family="monospace" font-size="9" fill="#565653">no rent, no allocation</text>
  <text x="385" y="291" font-family="monospace" font-size="10">readable by:</text>
  <text x="385" y="307" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">only off-chain consumers</text>
  <text x="385" y="323" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">on-chain code can never read</text>
  <text x="385" y="337" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">events back</text>
  <text x="385" y="365" font-family="monospace" font-size="10">good for:</text>
  <text x="385" y="381" font-family="monospace" font-size="10" fill="#565653">- analytics, indexers</text>
  <text x="385" y="395" font-family="monospace" font-size="10" fill="#565653">- frontend notifications</text>
  <text x="385" y="409" font-family="monospace" font-size="10" fill="#565653">- structured logs</text>
  <text x="525" y="445" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">the chain's notification layer</text>
  <text x="360" y="500" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">If another instruction needs to read it, put it in state. If only humans and dashboards need it, emit it.</text>
</svg>

**If another instruction needs to read it, put it in state. If only humans and dashboards need it, emit it.**

State is anything that gates program logic. Balances, ownership flags, lockup expiry timestamps, current proposal status. All of these must live on accounts because some future instruction will need to check them. State costs rent and persists across transactions.

Events are anything that off-chain consumers need to know about but no on-chain logic will read. A deposit happened, a trade executed, a vote was cast. Each of these is interesting to analytics and frontends, but if your program needs to know whether a user already deposited, that check lives on an account rather than in a log.

## A handler checks first, then writes state, then emits

Most handlers have the shape of this `increment`: a few `require!` calls validating inputs, the state change, and an `emit!` call announcing what happened. The `Increment` struct already ties the signer to `counter.admin` with `has_one`, so the handler checks only the argument and the counter's state.

```rust
#[program]
pub mod counter {
    use super::*;

    pub fn increment(ctx: Context<Increment>, by: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;

        // preconditions
        require!(by > 0, CounterError::ZeroIncrement);
        require!(!counter.locked, CounterError::Locked);

        // overflow-safe arithmetic
        let new_value = counter.value
            .checked_add(by)
            .ok_or(CounterError::Overflow)?;

        require!(new_value <= counter.max, CounterError::WouldExceedMax);

        // happy path: update state, emit event
        counter.value = new_value;

        emit!(Incremented {
            counter: counter.key(),
            by,
            new_value: counter.value,
        });

        Ok(())
    }
}
```

The checks happen up front, before any state changes. If any of them fails, the transaction aborts before `counter.value` is touched. The `checked_add` returns `Option<u64>`, and `ok_or` converts a `None` into your custom error, which is the idiomatic way to handle arithmetic that might overflow. The event is emitted at the end, after the state update, so the values in the event reflect what's now on chain.
