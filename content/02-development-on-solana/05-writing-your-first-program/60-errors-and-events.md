---
id: 193
title: Errors and events
type: lecture
faq:
  - question: How do I make an Anchor instruction fail with a custom error message?
    answer: 'Define a Rust enum tagged with #[error_code], where each variant has a
      human-readable #[msg("...")] message that clients will see. In your
      handler, guard preconditions with the require! macro, for example
      require!(amount > 0, MyError::ZeroAmount); if the condition is false, the
      named error fires and the whole transaction aborts cleanly. The standard
      pattern is to run all your require! checks first, then change state last.'
  - question: Why does my Anchor custom error come back as code 6000 instead of 0?
    answer: Anchor reserves error codes 0 through 5999 for its own framework errors,
      so your custom variants start numbering at 6000. The variant order is
      positional, which means that once a program is deployed you can safely add
      new variants at the end, but reordering or inserting them will shift the
      codes and break existing clients.
  - question: Can another instruction read a value I emitted with an Anchor event?
    answer: "No. Events (structs marked #[event] and sent with emit!) are written to
      the transaction's logs and can only be read by off-chain consumers like
      indexers, frontends, or Discord bots, never by on-chain code. The rule of
      thumb is: if another instruction needs to read a value, it must live in
      account state; if only humans and dashboards need it, emit it as an
      event."
  - question: When should I use require_keys_eq! instead of plain require! in Anchor?
    answer: Use require_keys_eq! (and require_neq for the opposite) whenever you're
      comparing two Pubkeys, such as an authority check confirming the signer
      matches the stored admin. Its advantage over plain require! is that on
      failure it logs both keys in base58, making debugging far easier. Use
      require_eq! for the same reason when comparing integers or byte arrays,
      and reserve plain require! for simple boolean conditions.
---

> You're about to write a handler. Half the work is the happy path: read accounts, do the operation, write state. The other half is everything else: someone passed a zero amount, the caller isn't authorized, the lockup hasn't expired, the vault is empty. Every one of these conditions needs to abort the transaction cleanly with a message the user can actually read. Separately, when the happy path succeeds, off-chain consumers want to know what changed: who deposited, who withdrew, how much. The first half is errors. The second half is events. This lecture is the practical mechanics of both.

## Defining your error type

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

Three details worth knowing. The numeric error codes start at 6000, because Anchor reserves 0 through 5999 for framework errors. The messages end up in the IDL and are what client tools display when the error fires. The variant order is positional, so once a program is deployed, adding new variants is safe but reordering or inserting breaks every later error code for clients.

That's the whole enum. Now you need to actually raise these errors from your handlers.

## Four ways to throw an error

Anchor gives you a small family of macros for raising errors plus an explicit form for unusual cases.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Four ways to throw an error: require!, require_eq!, require_keys_eq!, return Err(ERR.into())</title><desc>Four boxes show the macros require!, require_eq!, and require_keys_eq!, plus the explicit return Err(ERR.into()) form, each with a short code example and a note on when to use it. A line at the bottom says to default to require! for boolean checks and require_keys_eq! for pubkeys.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Four ways to throw an error</text>
  <rect x="40" y="90" width="310" height="200" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">require!(cond, ERR)</text>
  <text x="55" y="139" font-family="monospace" font-size="10" font-weight="bold">general boolean check</text>
  <text x="55" y="165" font-family="monospace" font-size="10" fill="#565653">require!(</text>
  <text x="65" y="180" font-family="monospace" font-size="10" fill="#565653">amount &gt; 0,</text>
  <text x="65" y="195" font-family="monospace" font-size="10" fill="#565653">VaultError::ZeroAmount</text>
  <text x="55" y="210" font-family="monospace" font-size="10" fill="#565653">);</text>
  <text x="55" y="240" font-family="monospace" font-size="10" font-weight="bold">use for:</text>
  <text x="55" y="256" font-family="monospace" font-size="9" fill="#565653">any condition that must hold,</text>
  <text x="55" y="270" font-family="monospace" font-size="9" fill="#565653">covers ~80% of error checks</text>
  <rect x="370" y="90" width="310" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">require_eq!(a, b, ERR)</text>
  <text x="385" y="139" font-family="monospace" font-size="10" font-weight="bold">equality with diagnostic logs</text>
  <text x="385" y="165" font-family="monospace" font-size="10" fill="#565653">require_eq!(</text>
  <text x="395" y="180" font-family="monospace" font-size="10" fill="#565653">order.size,</text>
  <text x="395" y="195" font-family="monospace" font-size="10" fill="#565653">expected_size,</text>
  <text x="395" y="210" font-family="monospace" font-size="10" fill="#565653">SizeMismatch</text>
  <text x="385" y="225" font-family="monospace" font-size="10" fill="#565653">);</text>
  <text x="385" y="252" font-family="monospace" font-size="10" font-weight="bold">use for:</text>
  <text x="385" y="268" font-family="monospace" font-size="9" fill="#565653">value comparisons where you</text>
  <text x="385" y="282" font-family="monospace" font-size="9" fill="#565653">want both values in the logs</text>
  <rect x="40" y="305" width="310" height="215" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="305" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="326" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">require_keys_eq!(a, b, ERR)</text>
  <text x="55" y="354" font-family="monospace" font-size="10" font-weight="bold">Pubkey comparison</text>
  <text x="55" y="380" font-family="monospace" font-size="10" fill="#565653">require_keys_eq!(</text>
  <text x="65" y="395" font-family="monospace" font-size="10" fill="#565653">ctx.accounts.signer.key(),</text>
  <text x="65" y="410" font-family="monospace" font-size="10" fill="#565653">vault.owner,</text>
  <text x="65" y="425" font-family="monospace" font-size="10" fill="#565653">Unauthorized</text>
  <text x="55" y="440" font-family="monospace" font-size="10" fill="#565653">);</text>
  <text x="55" y="467" font-family="monospace" font-size="10" font-weight="bold">use for:</text>
  <text x="55" y="483" font-family="monospace" font-size="9" fill="#565653">authority checks, account</text>
  <text x="55" y="497" font-family="monospace" font-size="9" fill="#565653">identity verification</text>
  <rect x="370" y="305" width="310" height="215" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="370" y="305" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="326" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">return Err(ERR.into())</text>
  <text x="385" y="354" font-family="monospace" font-size="10" font-weight="bold">explicit error return</text>
  <text x="385" y="380" font-family="monospace" font-size="10" fill="#565653">if vault.balance == 0 {</text>
  <text x="395" y="395" font-family="monospace" font-size="10" fill="#565653">msg!("vault is empty");</text>
  <text x="395" y="410" font-family="monospace" font-size="10" fill="#565653">return Err(</text>
  <text x="405" y="425" font-family="monospace" font-size="10" fill="#565653">Empty.into()</text>
  <text x="395" y="440" font-family="monospace" font-size="10" fill="#565653">);</text>
  <text x="385" y="455" font-family="monospace" font-size="10" fill="#565653">}</text>
  <text x="385" y="478" font-family="monospace" font-size="10" font-weight="bold">use for:</text>
  <text x="385" y="494" font-family="monospace" font-size="9" fill="#565653">paths that need extra logic</text>
  <text x="385" y="508" font-family="monospace" font-size="9" fill="#565653">or logging before erroring</text>
  <text x="360" y="555" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Default to require! for boolean checks, require_keys_eq! for pubkeys. Reach for the others when they fit.</text>
</svg>

### `require!`: the everyday case

The macro that covers most checks. The first argument is a boolean expression that must be true. If it isn't, the named error fires and the transaction aborts.

```rust
require!(amount > 0, CounterError::ZeroIncrement);
require!(!counter.locked, CounterError::Locked);
require!(
    counter.value + by <= counter.max,
    CounterError::WouldExceedMax,
);
```

Read these as assertions: you state what must be true, and if reality disagrees, the named error wins. Three of these stacked at the top of a handler is a perfectly normal pattern. Anchor's macro layer expands each one into the equivalent of an `if !condition { return Err(...) }`, but reads cleaner.

### `require_eq!` and `require_neq!`: equality with diagnostic logs

When the check is equality between two values, the eq form has one advantage over plain `require!`: it logs both values when it fails. That makes debugging much easier. Compare these two failure cases:

```rust
// require! version
require!(order.size == expected_size, CounterError::SizeMismatch);
// log on failure: just "SizeMismatch"

// require_eq! version  
require_eq!(order.size, expected_size, CounterError::SizeMismatch);
// log on failure: "SizeMismatch. Left: 100. Right: 250."
```

When you're chasing down why a test is failing, having the actual values in the log saves a debugging round trip. Use `require_eq!`, or its negation `require_neq!`, when the comparison is equality of two integers, byte arrays, or anything that implements `Debug`.

### `require_keys_eq!` and `require_keys_neq!`: Pubkey comparisons

The most common variant in real handlers. Almost every authority check ends up being "is this signer the right pubkey?" The keys form does the comparison cleanly and logs both pubkeys in base58 on failure.

```rust
// authority check
require_keys_eq!(
    ctx.accounts.admin.key(),
    counter.admin,
    CounterError::Unauthorized,
);

// "is this the expected mint" check
require_keys_eq!(
    token_account.mint,
    expected_mint.key(),
    CounterError::WrongMint,
);
```

This is the form you'll write most often. Auth checks, account-identity checks, "is this the right PDA for this user" checks. All of these are pubkey equalities.

### `return Err(ERR.into())`: when you need extra logic

For the rare path that needs to log diagnostic info, update state, or do anything else before erroring, fall back to the explicit form:

```rust
if vault.balance < amount {
    msg!("requested {} but vault has only {}", amount, vault.balance);
    msg!("partial withdrawals are not supported");
    return Err(CounterError::Insufficient.into());
}
```

The `.into()` converts your enum variant into the `anchor_lang::error::Error` type that handlers return. Use this form sparingly. If a `require!` works, prefer it.

## Events: the off-chain channel

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

That is the program side. The off-chain side is where events do most of their work. Indexers like Helius or Triton subscribe to a program's logs, decode every event they care about, and write rows into a database. Frontend code reads from that database to show "the latest deposits" or "recent trades." Discord bots read the same stream and post announcements as events arrive. None of this would be possible if you had to scan account state to figure out what changed.

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

The rule of thumb is short: **if another instruction needs to read it, put it in state. If only humans and dashboards need it, emit it.**

State is anything that gates program logic. Balances, ownership flags, lockup expiry timestamps, current proposal status. All of these must live on accounts because some future instruction will need to check them. State costs rent and persists across transactions.

Events are anything that off-chain consumers need to know about but no on-chain logic will read. A deposit happened, a trade executed, a vote was cast. Each of these is interesting to analytics and frontends, but if your program needs to know whether a user already deposited, that check lives on an account rather than in a log.

## A complete example

Here's the same counter program's `increment` handler, with all the patterns above working together. Authority is enforced with `require_keys_eq!`. Boolean preconditions use `require!`. The arithmetic overflow check uses `checked_add` and `require!`. On success, state is updated and an event is emitted.

```rust
#[program]
pub mod counter {
    use super::*;

    pub fn increment(ctx: Context<Increment>, by: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;

        // authority check
        require_keys_eq!(
            ctx.accounts.caller.key(),
            counter.admin,
            CounterError::Unauthorized,
        );

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

#[event]
pub struct Incremented {
    pub counter: Pubkey,
    pub by: u64,
    pub new_value: u64,
}

#[error_code]
pub enum CounterError {
    #[msg("Caller lacks admin authority")]
    Unauthorized,

    #[msg("Increment must be greater than zero")]
    ZeroIncrement,

    #[msg("Counter is locked")]
    Locked,

    #[msg("Counter would overflow")]
    Overflow,

    #[msg("Counter would exceed configured maximum")]
    WouldExceedMax,
}
```

A few things to notice in this code. The checks happen up front, before any state changes. If any of them fails, the transaction aborts before `counter.value` is touched. That's the standard pattern: validate first, mutate last. The `checked_add` returns `Option<u64>`, and `ok_or` converts a `None` into your custom error. This is the idiomatic way to handle arithmetic that might overflow. Finally, the event is emitted at the end, after the state update, so the values in the event reflect what's now on chain.

Every handler you write will follow some version of this shape: a few `require!` calls validating inputs, the actual state change, an `emit!` call announcing what happened. Learn the pattern once and you will apply it automatically.
