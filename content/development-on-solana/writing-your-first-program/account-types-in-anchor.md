---
id: 189
title: Account types in Anchor
type: lecture
order: 3
faq:
  - question: Why won't my program compile when I use UncheckedAccount?
    answer: >-
      Anchor requires a /// CHECK: doc comment above the field, saying why the account is safe
      and what validates it. No comment, no build.
  - question: Do I have to check an account's owner myself?
    answer: >-
      Not if the type says it. Account<'info, T> verifies your program owns the account, that
      its first 8 bytes are the T discriminator, and that the rest deserializes into T. Signer
      checks only for a signature. UncheckedAccount checks nothing, so there the owner check is
      yours.
  - question: Which type do I use for a wallet that receives SOL but never signs?
    answer: >-
      SystemAccount<'info>. It confirms the slot holds a plain wallet owned by the System
      Program.
  - question: How do I pick the type for a new field?
    answer: >-
      Stop at the first yes. Does it sign? Signer. Is it a program you call into? Program<'info,
      T>. Does it hold your program's state? Account<'info, T>. A plain wallet that does not
      sign? SystemAccount. Nothing fits? UncheckedAccount, justified in the CHECK comment.
  - question: What is AccountInfo, and should I still use it?
    answer: >-
      The raw type the runtime hands a program, carrying the pubkey, owner, lamports, data and
      flags. UncheckedAccount wraps it and adds the compile-time CHECK requirement. Same data
      underneath, so prefer UncheckedAccount.
---

> Every field in an Accounts struct has a type. It tells Anchor what kind of account this slot expects, what checks to run before your handler executes, and what your handler can do with the field once it gets there. There are five types you'll use day to day, and each one verifies something different.

## The type says what the program accepts in a slot

A program does not choose the accounts it runs on. The client that builds the transaction lists every account the instruction touches (see [instructions and transactions](/courses/development-on-solana/the-solana-mental-model/instructions-and-transactions)), and the runtime passes the program those accounts and nothing else. Whoever sends the transaction decides which account sits in each slot, so for every slot the program has to state what it accepts.

The field's type is the first place you state it. When you write `pub vault: Account<'info, Vault>` inside an Accounts struct, you are telling Anchor to perform a specific set of checks on whichever account appears in that slot of the transaction. If any of those checks fail, the transaction is rejected before your handler runs. If all of them pass, the field becomes available inside your handler as a fully typed value, ready to read or write. Each of the five types packages a different set of checks, because what counts as valid depends on the role the account plays in the instruction. Pick the most specific type that fits.

## The five types, one at a time

**Signer<'info>**. The account whose keypair authorized the transaction. Anchor verifies one thing: a signature from this account's public key was attached to the incoming transaction. It does not check the account's owner, its data, or its balance. So the sender cannot put someone else's wallet in this slot without that wallet's signature. Use it for the wallet that's calling your instruction. Anything labeled "authority," "owner," or "user" in your design almost certainly wants this type.

**Account<'info, T>**. It says three things at once: the account is owned by the program that defines `T` (your program, for a type you declare with `#[account]`), its data starts with the 8-byte discriminator that identifies a `T`, and the rest of its data deserializes cleanly into the `T` struct. So the sender cannot pass an account that belongs to another program, or an account of your program that stores a different type. By the time your handler runs, `ctx.accounts.vault` is a reference to a typed `Vault` you can read and write like any Rust struct. Use this for every piece of state your program owns.

**SystemAccount<'info>**. A regular wallet on the chain, owned by the System Program. Use it when an instruction needs to reference a wallet that isn't signing the transaction. A common case is a recipient of a SOL transfer: the recipient doesn't sign, but you want to make sure the slot really holds a plain wallet rather than some random account you'd accidentally clobber.

**Program<'info, T>**. The account is the deployed program of type `T`. Anchor verifies the account's address matches the program's known address and that its executable flag is true. So the sender cannot pass a different program in place of the one you mean to call. Use it when your instruction calls into another program: `Program<'info, System>` to invoke the System Program and create an account, `Program<'info, Token>` to call the Token Program and move tokens.

**UncheckedAccount<'info>**. Anchor performs no checks on it. Whatever account the client sends in this slot is what your handler receives, as a raw `AccountInfo` you have to validate yourself. Use it only when none of the other types fit, and always pair it with a `/// CHECK:` doc comment explaining why it's safe and what you're doing to validate it. `anchor build` refuses to build without that comment. Common legitimate uses include accounts you constrain with a fixed address (`#[account(address = ...)]`), or accounts whose validation is performed by a CPI you're about to make. Older Anchor code uses `AccountInfo<'info>` directly, the raw type that the runtime hands to a program: an account's public key, owner, lamports, data, and flags. Anchor treats an `AccountInfo` field the same way, with no checks and the same `/// CHECK:` requirement. `UncheckedAccount` is a thin wrapper around it whose name says that nothing is checked, so prefer `UncheckedAccount`.

If the manual validation is missing, the slot accepts anything. Wormhole lost about 320 million dollars in 2022 this way. Its program needed the list of the transaction's instructions, which a program reads from the instructions sysvar (a system account with a fixed address that the runtime fills with data). The program read the list from whatever account the caller passed in that slot and never compared its address with the real sysvar address. The [root of trust lecture](/courses/solana-pro/trust-and-identity/root-of-trust) of the Solana Pro course covers the incident.

## A withdrawal struct that uses all five

A withdrawal from a vault can use every type at once. The vault holds program state, the owner signs to authorize the withdrawal, the recipient is a wallet that doesn't need to sign, and the transfer happens by calling into the Token Program. The struct also takes a price oracle account. No Anchor type fits it, but it is constrained to a specific address, so it appears as an `UncheckedAccount<'info>` with a `/// CHECK:` comment explaining the address pin.

<svg role="img" viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Withdraw struct showing Account, Signer, SystemAccount, Program, and UncheckedAccount types</title><desc>The diagram shows Anchor's Withdraw accounts struct, with vault as Account, authority as Signer, recipient as SystemAccount, token_program as Program, and price_oracle as UncheckedAccount. Arrows label each field with its role, such as 'your state', 'the signer', 'a passive wallet', 'an external program', and 'opt out of validation'.</desc>
  <defs>
    <marker id="arrS33bG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">All five types, in one real Accounts struct</text>
  <rect x="190" y="90" width="400" height="370" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="190" y="90" width="400" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="390" y="109" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">#[derive(Accounts)] for Withdraw</text>
  <text x="205" y="138" font-family="monospace" font-size="10">pub struct Withdraw&lt;'info&gt; {</text>
  <text x="215" y="166" font-family="monospace" font-size="10">#[account(mut)]</text>
  <text x="215" y="182" font-family="monospace" font-size="10">pub vault: Account&lt;'info, Vault&gt;,</text>
  <text x="215" y="216" font-family="monospace" font-size="10">pub authority: Signer&lt;'info&gt;,</text>
  <text x="215" y="250" font-family="monospace" font-size="10">#[account(mut)]</text>
  <text x="215" y="266" font-family="monospace" font-size="10">pub recipient: SystemAccount&lt;'info&gt;,</text>
  <text x="215" y="300" font-family="monospace" font-size="10">pub token_program: Program&lt;'info,</text>
  <text x="225" y="316" font-family="monospace" font-size="10">Token&gt;,</text>
  <text x="215" y="350" font-family="monospace" font-size="10">/// CHECK: read-only oracle account,</text>
  <text x="215" y="366" font-family="monospace" font-size="10">/// validated by address constraint</text>
  <text x="215" y="382" font-family="monospace" font-size="10">#[account(address = ORACLE_KEY)]</text>
  <text x="215" y="398" font-family="monospace" font-size="10">pub price_oracle: UncheckedAccount&lt;'info&gt;,</text>
  <text x="205" y="428" font-family="monospace" font-size="10">}</text>
  <text x="40" y="180" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">your state</text>
  <text x="40" y="196" font-family="monospace" font-size="9" fill="#565653">Account&lt;T&gt;</text>
  <line x1="120" y1="180" x2="185" y2="180" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="40" y="216" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">the signer</text>
  <text x="40" y="232" font-family="monospace" font-size="9" fill="#565653">Signer</text>
  <line x1="120" y1="216" x2="185" y2="216" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="40" y="266" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">a passive</text>
  <text x="40" y="280" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">wallet</text>
  <text x="40" y="296" font-family="monospace" font-size="9" fill="#565653">SystemAccount</text>
  <line x1="120" y1="266" x2="185" y2="266" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="610" y="305" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">an external</text>
  <text x="610" y="319" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">program</text>
  <text x="610" y="333" font-family="monospace" font-size="9" fill="#565653">Program&lt;T&gt;</text>
  <line x1="608" y1="305" x2="595" y2="305" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="610" y="395" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">opt out of</text>
  <text x="610" y="409" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">validation</text>
  <text x="610" y="423" font-family="monospace" font-size="9" fill="#565653">Unchecked</text>
  <line x1="608" y1="397" x2="595" y2="397" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="360" y="495" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Each type tells Anchor what to check. Reading the struct tells you what the instruction does.</text>
</svg>

A type says what kind of account the slot holds, but not which one. `Account<'info, Vault>` accepts any `Vault` account your program owns, and `Signer<'info>` accepts any wallet that signed the transaction. Nothing in the types of this struct ties `authority` to the authority recorded in `vault`, so with types alone a stranger could sign as `authority` and pass someone else's vault. Tying accounts to each other is the job of [account constraints](/courses/development-on-solana/writing-your-first-program/account-constraints), the next lesson.

## Pick the type at the first yes

When you add a field to a new instruction, ask the four questions below in order and take the type at the first yes. If every answer is no, you reach for `UncheckedAccount`, and the comment you write next is your justification.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Flowchart for picking an Anchor account type: Signer, Program, Account, SystemAccount, or UncheckedAccount</title><desc>A flowchart asks four yes-or-no questions in order: does it sign, is it a program, does it hold your program's state, and is it a plain wallet. Each yes gives a type (Signer, Program&lt;'info, T&gt;, Account&lt;'info, T&gt;, or SystemAccount), and if every answer is no you land on UncheckedAccount, which needs a CHECK comment.</desc>
  <defs>
    <marker id="arrS33cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Which type should I pick?</text>
  <rect x="200" y="80" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="340" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Does it sign the transaction?</text>
  <text x="340" y="120" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">its keypair authorizes the action</text>
  <line x1="480" y1="105" x2="510" y2="105" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="495" y="98" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">yes</text>
  <rect x="515" y="80" width="165" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="597" y="110" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Signer&lt;'info&gt;</text>
  <line x1="340" y1="132" x2="340" y2="160" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="355" y="150" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">no</text>
  <rect x="200" y="165" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="340" y="188" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Is it a program you call into?</text>
  <text x="340" y="205" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">e.g. System, Token, your own</text>
  <line x1="480" y1="190" x2="510" y2="190" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="495" y="183" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">yes</text>
  <rect x="515" y="165" width="165" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="597" y="195" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Program&lt;'info, T&gt;</text>
  <line x1="340" y1="217" x2="340" y2="245" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="355" y="235" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">no</text>
  <rect x="200" y="250" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="340" y="273" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Does it hold your program's state?</text>
  <text x="340" y="290" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">e.g. a Vault, a Proposal, a UserData</text>
  <line x1="480" y1="275" x2="510" y2="275" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="495" y="268" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">yes</text>
  <rect x="515" y="250" width="165" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="597" y="280" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Account&lt;'info, T&gt;</text>
  <line x1="340" y1="302" x2="340" y2="330" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="355" y="320" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">no</text>
  <rect x="200" y="335" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="340" y="358" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Is it a plain wallet?</text>
  <text x="340" y="375" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">a recipient, a fee payer, a SOL holder</text>
  <line x1="480" y1="360" x2="510" y2="360" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="495" y="353" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">yes</text>
  <rect x="515" y="335" width="165" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="597" y="365" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">SystemAccount</text>
  <line x1="340" y1="387" x2="340" y2="415" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="355" y="405" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">no</text>
  <rect x="200" y="420" width="280" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="340" y="443" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">UncheckedAccount&lt;'info&gt;</text>
  <text x="340" y="460" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">last resort. validate it yourself.</text>
  <text x="340" y="473" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">always pair with /// CHECK: comment</text>
  <text x="360" y="520" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Stop at the first yes. The earlier in the tree, the safer the type.</text>
  <text x="360" y="555" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">If you hit the bottom, take a hard look. Almost every legitimate use has a more specific type above.</text>
</svg>
