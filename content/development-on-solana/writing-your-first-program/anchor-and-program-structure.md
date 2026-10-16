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

> A Solana program written from scratch is a single function that reads raw bytes, decides what to do with them, validates a list of accounts by hand, and writes raw bytes back out. Anchor is the framework most teams use to skip the boilerplate and write Solana programs the way you'd write a normal Rust API: typed handler functions, declared account schemas, generated error types. The macros in the middle do the conversion between what you wrote and what the runtime needs. Once the shape of a typical Anchor program is in your head, most of the rest of the course is filling in the details.

## What Anchor is for

The Solana runtime expects a program to be a single entry point. You pass it a buffer of bytes for instruction data, a list of accounts, and the program's address, and it returns a success or failure code. Everything else, including which function the bytes are meant to call, whether the right accounts are present, whether they have the right ownership, whether the data inside them matches the type you expect, is your responsibility.

You can write programs at that level. The Solana SDK gives you the tools. But almost no production team does, because the resulting code is mostly plumbing: reading bytes, validating accounts, deserializing structs, serializing them again, returning numeric error codes. The actual business logic is buried under six layers of mechanical work, and any mistake in the mechanical work is a security bug.

Anchor is the Rust framework that handles all of that for you. You declare what each instruction takes, what accounts it touches, and what it does. Anchor's procedural macros expand at compile time into the same boilerplate you'd write by hand, except correct by construction. Anchor plays a role for Solana programs similar to the one Express or FastAPI plays for web developers: declarative routing and typed handlers on top of an underlying protocol you don't want to write directly.

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
  <text x="60"
