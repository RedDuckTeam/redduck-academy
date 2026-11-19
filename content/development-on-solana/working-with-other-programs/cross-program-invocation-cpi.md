---
id: 195
title: Cross-Program Invocation (CPI)
type: lecture
order: 1
faq:
  - question: Why can't my program just overwrite a token balance?
    answer: >-
      Every account has exactly one owner program, and only that owner may change its data.
      SPL token balances live in accounts the Token Program owns, so your program asks it to
      move them through a Cross-Program Invocation.
  - question: Can a program I call escalate privileges on the accounts I pass it?
    answer: >-
      No. A read-only account stays read-only in the called program, and a non-signer never
      becomes a signer. The runtime checks. You can go the other way and pass a writable
      account as read-only to a program that only needs to read it.
  - question: What's the difference between invoke and invoke_signed?
    answer: >-
      invoke forwards the signers your transaction already has. invoke_signed forwards those
      and lets your program sign as a PDA it controls. You pass the PDA's seeds, the runtime
      re-derives the address, confirms it belongs to your program, and adds it to the signer
      set.
  - question: How deep can CPIs nest?
    answer: >-
      Four levels. Your handler is depth one, and the runtime rejects any call past depth
      four.
---

> In a Cross-Program Invocation (CPI), a program calls another program in the middle of its own execution, passes it accounts, and observes the result before continuing. The accounts keep the signer and writable flags they had in the caller, and the called program never gets more than that.

## Only the owner program can change an account, so you ask the owner

The programs you've written so far operate on accounts owned by your own program. What you can't do, alone, is move SPL tokens, mint NFTs, place an order on a DEX, or do anything else that requires touching state owned by a different program.

Each account has one owner program, and only that owner can mutate the account's data. So if you want to move tokens out of a vault, you can't write zeros over the source balance and write a higher number into the destination. The tokens live in accounts owned by the Token Program, and only the Token Program can mutate them.

The way you make changes to accounts you don't own is to ask the program that owns them to do it on your behalf. You construct a request, you hand it to the runtime, and the runtime hands it to the owning program. If your request is well-formed and you have the right authority, the owning program performs the mutation and returns success. That request is a CPI.

## A CPI is an instruction built inside your program

A CPI happens in four phases. Your handler builds an `Instruction` describing what it wants the called program to do. It calls the `invoke` syscall, passing the instruction along with references to the accounts the called program will need. The runtime suspends your program, switches execution to the called program, and runs it with those accounts. When the called program returns, control comes back to your handler with the state changes already applied.

The `Instruction` struct is the same shape as the instructions a wallet builds and submits in a transaction. The CPI version is built inside another program and sent through the syscall instead of arriving from the network, but the runtime treats them the same way once they're being executed.

## Privileges propagate, and they never grow

When your handler runs, each account in its frame carries flags: was this account a signer in the transaction, and is it marked writable. When you CPI to another program, those flags travel through.

<svg role="img" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>CPI account flags: alice, vault, and mint keep the same signer and writable status</title><desc>Two account tables compare program A's frame with the called program B's frame for accounts alice, vault, and mint, and their signer and writable flags match exactly. A rules list below states that privileges never grow across a CPI, except a program can sign as a PDA it controls via invoke_signed.</desc>
  <defs>
    <marker id="arrS41bR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Privileges propagate, but never grow</text>
  <rect x="40" y="85" width="640" height="155" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Your handler's frame (program A)</text>
  <line x1="50" y1="135" x2="670" y2="135" stroke="#565653" stroke-width="1"/>
  <text x="60" y="129" font-family="monospace" font-size="10" font-weight="bold">account</text>
  <text x="280" y="129" font-family="monospace" font-size="10" font-weight="bold">signer?</text>
  <text x="430" y="129" font-family="monospace" font-size="10" font-weight="bold">writable?</text>
  <text x="60" y="155" font-family="monospace" font-size="10">alice (Signer)</text>
  <text x="280" y="155" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="430" y="155" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="60" y="178" font-family="monospace" font-size="10">vault (mut Account)</text>
  <text x="280" y="178" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="430" y="178" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="60" y="201" font-family="monospace" font-size="10">mint (Account)</text>
  <text x="280" y="201" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="430" y="201" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="60" y="227" font-family="monospace" font-size="9" fill="#565653" font-style="italic">these are the flags your accounts carry in your handler</text>
  <line x1="360" y1="250" x2="360" y2="280" stroke="#ed4937" stroke-width="3" marker-end="url(#arrS41bR)"/>
  <text x="380" y="270" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">CPI to Token Program</text>
  <rect x="40" y="290" width="640" height="155" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="290" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="309" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">The called program sees (program B)</text>
  <line x1="50" y1="340" x2="670" y2="340" stroke="#565653" stroke-width="1"/>
  <text x="60" y="334" font-family="monospace" font-size="10" font-weight="bold">account</text>
  <text x="280" y="334" font-family="monospace" font-size="10" font-weight="bold">signer?</text>
  <text x="430" y="334" font-family="monospace" font-size="10" font-weight="bold">writable?</text>
  <text x="60" y="360" font-family="monospace" font-size="10">alice</text>
  <text x="280" y="360" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="430" y="360" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="60" y="383" font-family="monospace" font-size="10">vault</text>
  <text x="280" y="383" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="430" y="383" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="60" y="406" font-family="monospace" font-size="10">mint</text>
  <text x="280" y="406" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="430" y="406" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="60" y="432" font-family="monospace" font-size="9" fill="#565653" font-style="italic">the same flags propagate through. nothing was upgraded.</text>
  <rect x="40" y="465" width="640" height="115" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="487" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">The rules</text>
  <line x1="55" y1="495" x2="665" y2="495" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="515" font-family="monospace" font-size="10">→ Signers from your frame stay signers in the called program's frame.</text>
  <text x="60" y="533" font-family="monospace" font-size="10">→ Writability is preserved, or you can drop it (pass writable as readonly).</text>
  <text x="60" y="551" font-family="monospace" font-size="10">→ A non-signer can never become a signer mid-call. Privileges never grow.</text>
  <text x="60" y="569" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">→ Exception: your program can sign as a PDA it controls, via invoke_signed.</text>
  <text x="360" y="605" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A program can only delegate authority it already has. This is the entire security model of CPI.</text>
</svg>

Take the three accounts in the diagram. Alice signed the transaction, `vault` is marked writable, and `mint` is read-only. When your handler makes a CPI to the Token Program with these accounts, the Token Program sees Alice as a signer, can write to `vault`, and can only read `mint`.

What you cannot do is escalate authority. If your handler marked `mint` as writable or `vault` as a signer in the inner instruction, the runtime would reject the CPI. A program can only delegate authority it already has. If the runtime allowed a new signer, a program could mark any wallet passed to it as a signer and have the Token Program move that wallet's tokens. If it allowed a new writable account, a program could write to an account that the transaction declared read-only, and the runtime uses those declarations to decide which transactions run in parallel ([instructions and transactions](/courses/development-on-solana/the-solana-mental-model/instructions-and-transactions)).

You can drop authority: if your handler can write to an account, you can pass it to a CPI as readonly, telling the called program it may read the account but not write to it. This lets you call programs that need to read state without granting them write access they don't need.

## invoke forwards signers, invoke_signed adds a PDA your program controls

The runtime exposes two syscalls. `invoke` forwards existing signers downstream. `invoke_signed` does the same, plus it lets your program sign as one or more PDAs, which is the one exception to the rule that a CPI adds no signers. Your program passes the PDA's seeds, the runtime re-derives the PDA, confirms it belongs to your program, and treats it as a signer in the called program's frame. A vault PDA authorizes a token transfer out of its own token account this way.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>invoke vs invoke_signed: forwarding signers vs signing as a PDA</title><desc>Two side-by-side panels compare the syscalls invoke and invoke_signed for calling another program. The invoke panel shows it forwarding existing signers, like Alice's signature used to move her tokens via a CPI to the Token Program; the invoke_signed panel shows it forwarding existing signers plus letting the program sign as a PDA, like a vault PDA authorizing a token transfer with seeds.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Two ways to call another program</text>
  <rect x="40" y="90" width="310" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">invoke</text>
  <text x="55" y="142" font-family="monospace" font-size="10" font-weight="bold">syscall:</text>
  <text x="55" y="158" font-family="monospace" font-size="10">invoke(&amp;ix, &amp;accounts)?;</text>
  <line x1="55" y1="175" x2="335" y2="175" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="197" font-family="monospace" font-size="10" font-weight="bold">what propagates:</text>
  <text x="55" y="215" font-family="monospace" font-size="10" fill="#565653">signers that signed your tx</text>
  <text x="55" y="231" font-family="monospace" font-size="10" fill="#565653">are still signers downstream</text>
  <text x="55" y="259" font-family="monospace" font-size="10" font-weight="bold">use when:</text>
  <text x="55" y="277" font-family="monospace" font-size="10" fill="#565653">a human or wallet signed,</text>
  <text x="55" y="293" font-family="monospace" font-size="10" fill="#565653">and that signature is enough</text>
  <text x="55" y="321" font-family="monospace" font-size="10" font-weight="bold">example:</text>
  <text x="55" y="339" font-family="monospace" font-size="10" fill="#565653">Alice signs your handler.</text>
  <text x="55" y="355" font-family="monospace" font-size="10" fill="#565653">You CPI to Token Program</text>
  <text x="55" y="371" font-family="monospace" font-size="10" fill="#565653">to move tokens from Alice's</text>
  <text x="55" y="387" font-family="monospace" font-size="10" fill="#565653">account. Alice is still the</text>
  <text x="55" y="403" font-family="monospace" font-size="10" fill="#565653">signer in the inner call.</text>
  <text x="195" y="445" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">forwarding existing signatures</text>
  <rect x="370" y="90" width="310" height="380" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">invoke_signed</text>
  <text x="385" y="142" font-family="monospace" font-size="10" font-weight="bold">syscall:</text>
  <text x="385" y="158" font-family="monospace" font-size="10">invoke_signed(&amp;ix,</text>
  <text x="395" y="174" font-family="monospace" font-size="10">&amp;accounts, signer_seeds)?;</text>
  <line x1="385" y1="190" x2="665" y2="190" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="385" y="212" font-family="monospace" font-size="10" font-weight="bold">what propagates:</text>
  <text x="385" y="230" font-family="monospace" font-size="10" fill="#565653">existing signers, PLUS</text>
  <text x="385" y="246" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">your program signs as a PDA</text>
  <text x="385" y="274" font-family="monospace" font-size="10" font-weight="bold">use when:</text>
  <text x="385" y="292" font-family="monospace" font-size="10" fill="#565653">an account is owned by a PDA</text>
  <text x="385" y="308" font-family="monospace" font-size="10" fill="#565653">your program controls, and you</text>
  <text x="385" y="324" font-family="monospace" font-size="10" fill="#565653">need to authorize on its behalf</text>
  <text x="385" y="352" font-family="monospace" font-size="10" font-weight="bold">example:</text>
  <text x="385" y="370" font-family="monospace" font-size="10" fill="#565653">a vault PDA owns a token</text>
  <text x="385" y="386" font-family="monospace" font-size="10" fill="#565653">account. you CPI to transfer</text>
  <text x="385" y="402" font-family="monospace" font-size="10" fill="#565653">from it. pass seeds; runtime</text>
  <text x="385" y="418" font-family="monospace" font-size="10" fill="#565653">re-derives, accepts as signer.</text>
  <text x="525" y="445" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">programs signing on their own behalf</text>
  <text x="360" y="510" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Both syscalls forward signers. invoke_signed adds one capability: your program acting as a PDA.</text>
</svg>

The signer seeds passed to `invoke_signed` are an array of seed arrays. Each inner array re-derives one PDA, so you can sign on behalf of multiple PDAs in a single call. A concrete shape for the seeds, with the bump appended at the end:

```rust
let bump = ctx.accounts.vault.bump;
let mint_key = ctx.accounts.mint.key();
let seeds: &[&[u8]] = &[b"vault", mint_key.as_ref(), &[bump]];
let signer_seeds: &[&[&[u8]]] = &[seeds];

invoke_signed(&ix, &account_infos, signer_seeds)?;
```

The [PDAs as signers](/courses/development-on-solana/working-with-other-programs/pdas-as-signers) lesson explains why the runtime accepts seeds in place of a signature.

## Anchor's CpiContext builds the instruction for you

Writing raw `Instruction` structs and calling `invoke` directly is verbose and easy to get wrong. Anchor provides a typed wrapper called `CpiContext` that builds the instruction and account structures for you when calling known programs, and the SPL Token bindings in `anchor_spl` give you typed structs for every Token Program instruction.

A token transfer through Anchor looks like this:

```rust
use anchor_spl::token::{self, Transfer};

let cpi_accounts = Transfer {
    from: ctx.accounts.source.to_account_info(),
    to: ctx.accounts.destination.to_account_info(),
    authority: ctx.accounts.authority.to_account_info(),
};
let cpi_ctx = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
);
token::transfer(cpi_ctx, amount)?;
```

The `Transfer` struct names every account the Token Program's transfer instruction expects, with the correct field names. `CpiContext::new` packages the program reference together with the accounts. `token::transfer` builds the right `Instruction`, calls `invoke`, and returns the result.

For `invoke_signed`, the equivalent constructor is `CpiContext::new_with_signer`, which takes the same arguments plus a signer seeds slice. The call to `token::transfer` is the same.

The raw syscall form exists so you can use it directly when no typed wrapper exists for the program you're calling. For the popular SPL programs, the typed wrappers cover the common operations.

## The called program can do everything the forwarded signers can

Because authority never grows through a CPI, a program you call cannot do anything with the accounts you gave it that you couldn't have done yourself. The cost is that the called program gets all of that authority. It receives every signer and writable account you forward and can pass them on to any other program. With Alice's signature and her token account, it can ask the Token Program to move her tokens somewhere else.

On Ethereum, when contract A calls contract B, B sees A as `msg.sender`, not the wallet that started the transaction, and a contract that B calls sees B. On Solana, a wallet that signed the transaction is a signer in every program it is forwarded to.

Your program also has to be sure which program it is calling. The program to call is an account in a slot that the client fills. If your code does not check that slot, the client can pass their own program in place of the Token Program. That program can return success without moving any tokens, and your handler continues as if the transfer happened. Declaring the slot as `Program<'info, Token>` pins its address ([account types](/courses/development-on-solana/writing-your-first-program/account-types-in-anchor)), and the [classic exploits lesson](/courses/development-on-solana/production-state-design/the-classic-solana-exploits) goes through this bug in code.

A transaction can invoke up to four levels deep: your handler is depth one, a CPI from it is depth two, a CPI from that is depth three, and one more layer is allowed. Beyond that, the runtime rejects the call. If an aggregator calls your program and your program calls the Token Program, your handler already runs at depth two and its transfer at depth three.

For each CPI in your program, name the signers and writable accounts it forwards, and name what in your Accounts struct fixes the address of the program that receives them.
