---
id: 216
title: Ownership, borrowing, and the borrow checker
type: lecture
faq:
  - question: What is the Rust borrow checker actually doing?
    answer: It tracks who owns each piece of memory at compile time and enforces a
      small set of rules about how memory can be shared, rejecting code that
      would cause a runtime bug in a language like C. There is no garbage
      collector and no runtime cost. The price is that you sometimes have to
      restructure code so the compiler can prove it is safe.
  - question: What are the two borrowing rules in Rust?
    answer: First, you can have any number of immutable (read-only) references to a
      value at the same time. Second, if you have a mutable reference, you can
      have no other references to that value at once. These rules prevent data
      races and aliasing bugs at compile time, and nearly every borrow-checker
      error comes down to breaking one of them.
  - question: Why does Rust say "cannot borrow ctx.accounts as mutable more than once"?
    answer: "Taking a &mut reference to one field and then another (like &mut
      ctx.accounts.user_state and &mut ctx.accounts.position) makes the compiler
      treat the whole ctx.accounts as borrowed twice. The simplest fix is to not
      create separate references: just write ctx.accounts.user_state.count += 1
      and ctx.accounts.position.amount = 100 directly, and the compiler scopes
      each access narrowly enough to avoid the conflict. You can also
      destructure the accounts struct once."
  - question: What does the 'info lifetime in every Anchor Accounts struct mean?
    answer: A lifetime is the span during which a reference stays valid. 'info says
      that every account reference in the struct lives for the same span, namely
      the duration of the instruction. It is mostly boilerplate that Anchor's
      convention established, so you write 'info when you copy an Accounts
      struct and let the macro tie it to the right thing.
---

> Rust's borrow checker is the part of the language that feels like it's fighting you. It rejects code that looks fine, with errors that mention "lifetimes" and "cannot borrow as mutable more than once" without explaining how to fix it. This lecture walks through what the borrow checker is actually doing, the two rules it enforces, what the `'info` lifetime in every Anchor account means, and the three specific borrow patterns that trip up almost every new Solana developer. If you understand what's in this lecture, the compiler error messages will start making sense and you'll spend fewer hours fighting the compiler.

## What the borrow checker is for

Most languages let you do whatever you want with memory and crash at runtime if you make a mistake. C and C++ are notorious for this. Garbage-collected languages like JavaScript and Go hide the problem by making memory management automatic, at the cost of a runtime garbage collector you can't easily reason about.

Rust takes a third approach. It tracks who owns each piece of memory at compile time, enforces a small number of rules about how that memory can be shared, and rejects code at compile time that would have caused a runtime bug in C. There's no garbage collector. There's no runtime cost. The price is that you have to write code the compiler can prove is safe, which sometimes means restructuring code that would have been fine in another language.

For Solana programs specifically, the borrow checker matters because Anchor handlers receive a `Context<T>` containing references to a set of accounts. The runtime has loaded those accounts into memory and is letting your code read and write them. Anchor uses Rust's references and lifetimes to model who can touch which account, when, and for how long. Most of the time this is invisible. Occasionally you'll write code the compiler rejects, and you'll need to understand why.

## The ownership rule

Every value in Rust has exactly one owner. When the owner goes out of scope, the value is dropped (freed). If you assign one variable to another, ownership moves. The original binding is no longer usable.

```rust
let s1 = String::from("hello");
let s2 = s1;             // ownership moves from s1 to s2
// println!("{}", s1);   // compile error: s1 has been moved
println!("{}", s2);      // fine: s2 owns the string now
```

For "primitive" types like integers and booleans, this rule is relaxed via the `Copy` trait. Copying a `u64` makes a duplicate, so `let a = 5; let b = a;` leaves both usable. But for owned types that hold heap data, the move is real, and you can't use the original binding afterward.

In Anchor code, you mostly don't move things around. You operate on accounts via references, which is the next concept.

## References: borrowing without taking ownership

Most of the time you don't want to move ownership. You want to look at a value, or modify it, then give it back. Rust calls this borrowing, and uses the `&` syntax.

```rust
let config = &ctx.accounts.config;          // immutable reference
let position = &mut ctx.accounts.position;  // mutable reference

let mint = config.rddk_mint;                // read through immutable ref
position.amount = 42;                       // write through mutable ref
```

`&T` is an immutable (shared) reference. You can read but not modify. `&mut T` is a mutable (exclusive) reference. You can read and modify.

The two rules of references:

1. You can have any number of immutable references to a value at the same time.
2. If you have a mutable reference, you can have no other references (mutable or immutable) at the same time.

These rules are what the borrow checker enforces. They prevent data races and aliasing bugs at compile time. They are also the source of nearly every borrow-checker error you'll see.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Rust borrowing rules: many readers, no writer vs one writer, no readers</title><desc>Two side-by-side panels compare Rust's reference rules with code examples. The left panel shows three shared references (&amp;config) compiling fine, and the right panel shows a mutable reference (&amp;mut config) alongside another reference being rejected with a borrow error.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The two reference rules, side by side</text>
  <rect x="40" y="80" width="310" height="280" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Many readers, no writer</text>
  <text x="55" y="130" font-family="monospace" font-size="10" fill="#565653">Any number of &amp;T at once.</text>
  <rect x="55" y="145" width="280" height="100" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="65" y="165" font-family="monospace" font-size="10">let a = &amp;config;</text>
  <text x="65" y="180" font-family="monospace" font-size="10">let b = &amp;config;</text>
  <text x="65" y="195" font-family="monospace" font-size="10">let c = &amp;config;</text>
  <text x="65" y="215" font-family="monospace" font-size="10">// all three can read</text>
  <text x="65" y="230" font-family="monospace" font-size="10">// none can write</text>
  <text x="195" y="275" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#2a8a3e">✓ compiles</text>
  <text x="195" y="310" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">No two threads can disagree</text>
  <text x="195" y="325" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">about a read-only value.</text>
  <rect x="370" y="80" width="310" height="280" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">One writer, no readers</text>
  <text x="385" y="130" font-family="monospace" font-size="10" fill="#565653">If &amp;mut T exists, nothing else.</text>
  <rect x="385" y="145" width="280" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="1"/>
  <text x="395" y="165" font-family="monospace" font-size="10">let m = &amp;mut config;</text>
  <text x="395" y="180" font-family="monospace" font-size="10">let r = &amp;config;</text>
  <text x="395" y="200" font-family="monospace" font-size="10" fill="#ed4937">// ERROR: can't borrow</text>
  <text x="395" y="215" font-family="monospace" font-size="10" fill="#ed4937">// while m is alive</text>
  <text x="525" y="275" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">✗ rejected</text>
  <text x="525" y="310" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">The writer would race</text>
  <text x="525" y="325" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">against any reader.</text>
</svg>

In Anchor code, you typically write `let user_state = &mut ctx.accounts.user_state;` when you need to modify a field, and `let config = &ctx.accounts.config;` when you only need to read. Anchor's `#[account(mut)]` constraint marks an account as writable at the runtime level. The `&mut` in your handler is the matching declaration at the language level.

## Lifetimes and the `'info` you see everywhere

Every reference has a lifetime: the span of time during which the reference is valid. Usually the compiler figures this out for you, a process called lifetime elision. Sometimes it needs help, and that's when you see explicit lifetime annotations like `'a` or `'info`.

In Anchor, the lifetime you'll see in every Accounts struct is `'info`:

```rust
#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_state: Account<'info, UserState>,

    pub system_program: Program<'info, System>,
}
```

The `'info` lifetime says: "every reference in this struct lives for the same span of time, namely the duration of the instruction." When Anchor loads accounts from the transaction, it gives them all the same lifetime, and you tag your struct with `'info` to say "I'm holding references to those accounts."

You don't invent your own lifetime names in normal Anchor code. You write `'info` because that's the convention Anchor established, and the macro layer ties it to the right thing. The lifetime parameter is mostly boilerplate. When you copy an Accounts struct from documentation, the `'info` is part of the template.

## Three borrow-checker errors you will hit

Here are the patterns that cause borrow-checker errors for most Solana developers in their first week. Each produces a specific error message, and the fix is straightforward once you know the pattern.

### 1. Two mutable borrows of `ctx.accounts`

The error message:

```
error[E0499]: cannot borrow `ctx.accounts` as mutable more than once at a time
```

The pattern that triggers it:

```rust
pub fn process(ctx: Context<Process>) -> Result<()> {
    let user_state = &mut ctx.accounts.user_state;
    let position = &mut ctx.accounts.position;  // ERROR

    user_state.count += 1;
    position.amount = 100;
    Ok(())
}
```

You took a mutable borrow of `ctx.accounts.user_state`, then while it was still alive, tried to take another mutable borrow of `ctx.accounts.position`. Both borrows go through `ctx.accounts`, which the compiler treats as borrowing the whole accounts struct.

The fix: split-borrow them through a destructuring pattern, or do the mutations in separate scopes.

```rust
pub fn process(ctx: Context<Process>) -> Result<()> {
    // Destructure once. Both fields become independent &mut references.
    let Process { user_state, position, .. } = ctx.accounts;

    user_state.count += 1;
    position.amount = 100;
    Ok(())
}
```

The `..` pattern means "ignore the rest of the fields." The compiler is smart enough to see that `user_state` and `position` are disjoint fields, so it allows the two mutable borrows when they come from a destructuring.

A simpler version, the one you'll see in most Anchor code: bind to a single mutable reference and do the work through it.

```rust
pub fn process(ctx: Context<Process>) -> Result<()> {
    ctx.accounts.user_state.count += 1;
    ctx.accounts.position.amount = 100;
    Ok(())
}
```

If you don't bind separate `&mut` references, the compiler scopes each access narrowly enough that there's no conflict. Reach into `ctx.accounts.field` once per assignment and let the compiler handle the rest.

### 2. Borrowing while iterating

The error message:

```
error[E0502]: cannot borrow `vec` as mutable because it is also borrowed as immutable
```

The pattern:

```rust
let votes = &ctx.accounts.poll.votes;
for vote in votes {
    if vote.invalid {
        ctx.accounts.poll.votes.remove(some_index);  // ERROR
    }
}
```

You're iterating over `votes`, which holds an immutable borrow of `ctx.accounts.poll.votes`, while also trying to take a mutable borrow of the same vector to remove from it. The compiler refuses because modifying the vector during iteration would invalidate the iterator.

The fix: collect the indices to remove first, then remove them after the loop ends.

```rust
let mut to_remove = Vec::new();
for (i, vote) in ctx.accounts.poll.votes.iter().enumerate() {
    if vote.invalid {
        to_remove.push(i);
    }
}
// Iteration is done, the immutable borrow is released.
for i in to_remove.iter().rev() {
    ctx.accounts.poll.votes.remove(*i);
}
```

The `.rev()` matters because removing from a `Vec` shifts later indices down. Removing from the end first keeps the earlier indices valid.

### 3. Holding a reference past when its owner moves

The error message:

```
error[E0382]: borrow of moved value
```

The pattern:

```rust
let name = String::from("alice");
let name_ref = &name;
let new_owner = name;       // moves `name` into new_owner
msg!("{}", name_ref);       // ERROR: name has been moved
```

You had a reference to `name`, then you moved `name` somewhere else, then you tried to use the reference. The compiler tracks that `name_ref` is no longer pointing at a valid value, and refuses.

The fix: pick one approach, either pass references everywhere, or move ownership and drop the reference. Don't mix.

```rust
let name = String::from("alice");
let new_owner = name;
msg!("{}", new_owner);      // use the new owner directly
```

Or:

```rust
let name = String::from("alice");
let name_ref = &name;
msg!("{}", name_ref);       // use the reference
// `name` still owned here; can be moved after if needed
```

This error pattern is less common in Anchor code than the first two, because account references all share the same `'info` lifetime and aren't moved around. You'll see it more often in helper functions that work with `Vec` and `String` values you constructed yourself.

## The mental model for daily work

You don't need to track lifetimes by hand. The compiler does that. What you need is the rule of thumb that catches 90% of cases:

If you need to write to an account, reach `ctx.accounts.the_account.field = value` directly, or take one `&mut` reference and do all the work through it. Don't take two mutable references to the same struct.

If you need to read an account, just read it. `ctx.accounts.config.rddk_mint` works without ceremony.

If you need to iterate over a collection and modify it, collect the changes first, then apply them after iteration ends.

If the compiler complains about a borrow, the first question to ask is: how long am I holding each reference, and do any of them overlap with another reference to the same data? Almost every borrow error reduces to "two things claim exclusive access at the same time" or "a reference outlived its owner."

In your first few days writing Anchor handlers, you will get borrow-checker errors regularly. After a week or two, the patterns become automatic. You'll start writing code that compiles the first time, because you'll think about ownership and borrows as you write rather than after the compiler rejects you.

That's the goal. Not to memorize lifetime syntax, but to internalize the two reference rules well enough that you write code the compiler accepts without thinking about it.
