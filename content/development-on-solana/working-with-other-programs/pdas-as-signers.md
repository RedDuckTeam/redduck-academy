---
id: 196
title: PDAs as signers
type: lecture
order: 2
faq:
  - question: How can a program sign for an address that has no private key?
    answer: >-
      It passes the PDA's seeds to invoke_signed. The runtime appends the calling program's
      ID, re-derives the address, and marks the matching account as a signer. The seeds are
      the signature, and only the program whose ID is in the derivation can produce them.
  - question: I get 'Cross-program invocation with unauthorized signer'. What did I break?
    answer: >-
      Usually the bump. It goes last in the seeds array, and you read it from the account
      where you stored it at init. Any other seed order derives a different address, the
      runtime finds no match, and the call is rejected. Confirm as well that the PDA you sign
      for is in your accounts list.
  - question: Does the vault PDA hold the tokens?
    answer: >-
      No. The tokens sit in a token account owned by the PDA. Your program signs as that
      owner through invoke_signed, and the Token Program sees an ordinary authorized transfer.
  - question: Why do my seeds fail to compile with 'temporary value dropped while borrowed'?
    answer: >-
      Bind the Pubkey to a local first. An inline as_ref call borrows from a temporary that is
      dropped before the seeds are used.
---

> A program cannot keep a private key, so it cannot sign the way a wallet does. It signs for a PDA by passing the PDA's seeds to `invoke_signed`. The runtime re-derives the address with the calling program's ID and, if it matches an account in the call, treats that account as a signer.

## The runtime accepts a re-derived address in place of a signature

A program that holds funds has to authorize moving them, and the Token Program moves tokens only when the owner of the source token account has signed. A normal account signs by producing a cryptographic signature with its private key. The runtime verifies the signature, sees that it matches the account's public key, and marks the account as a signer for the transaction.

A program has no private key to do this with, because its bytecode is public and a key stored in it would be public too. So the accounts it controls sit at PDAs, as the [PDA lesson](/courses/development-on-solana/writing-your-first-program/pdas-addresses-with-no-private-key) showed. A PDA's address is a hash that lands off the ed25519 curve, which means no private key exists that would produce that address.

What the runtime accepts instead is a re-derivation. When a program calls `invoke_signed`, it passes a list of seed sets along with the inner call. The runtime takes each seed set, appends the calling program's ID, runs the PDA derivation, and gets an address back. If that address matches an account in the call, the runtime marks it as a signer in the inner frame, as if a real signature had been provided.

The calling program's ID is mixed into the derivation, so a different program calling with the same seeds would derive a different PDA. The seeds aren't a secret. The program ID is what makes the seeds work for one specific program and nobody else.

<svg role="img" viewBox="0 0 720 600" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Four steps of invoke_signed: seeds, PDA re-derivation, match, signer check</title><desc>Four connected boxes show what invoke_signed does: your program calls invoke_signed with seeds, the runtime re-derives the PDA from the seeds and program ID, the derived PDA is matched against the accounts passed in, and the called program then sees the PDA as a signer. A caption below states that the seeds are the signature, and only your program can produce them under its program ID.</desc>
  <defs>
    <marker id="arrS42aR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">What invoke_signed actually does</text>
  <rect x="40" y="85" width="640" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="108" font-family="monospace" font-size="11" font-weight="bold">1. Your program calls invoke_signed with seeds</text>
  <text x="60" y="130" font-family="monospace" font-size="10">invoke_signed(&amp;ix, &amp;accounts, signer_seeds)</text>
  <text x="60" y="148" font-family="monospace" font-size="10" fill="#565653">signer_seeds = &amp;[&amp;[b"vault", mint.as_ref(), &amp;[bump]]]</text>
  <text x="60" y="168" font-family="monospace" font-size="9" fill="#565653">the seeds plus the bump describe one PDA you're signing as</text>
  <line x1="360" y1="180" x2="360" y2="200" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS42aR)"/>
  <rect x="40" y="205" width="640" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="228" font-family="monospace" font-size="11" font-weight="bold">2. Runtime re-derives the PDA</text>
  <text x="60" y="250" font-family="monospace" font-size="10">pda = sha256(seeds || your_program_id || "ProgramDerivedAddress")</text>
  <text x="60" y="270" font-family="monospace" font-size="9" fill="#565653">your_program_id is whatever program is currently executing.</text>
  <text x="60" y="284" font-family="monospace" font-size="9" fill="#565653">a different program calling with the same seeds would derive a different PDA.</text>
  <text x="60" y="298" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">this is why only your program can sign for PDAs derived under your program's ID.</text>
  <line x1="360" y1="315" x2="360" y2="335" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS42aR)"/>
  <rect x="40" y="340" width="640" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="363" font-family="monospace" font-size="11" font-weight="bold">3. Match against accounts in the call</text>
  <text x="60" y="385" font-family="monospace" font-size="10" fill="#565653">if the derived PDA matches an account passed in &amp;accounts:</text>
  <text x="80" y="401" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">→ mark it as signer for the inner call</text>
  <text x="60" y="421" font-family="monospace" font-size="10" fill="#565653">if not: CPI fails with "unauthorized signer or writable account"</text>
  <line x1="360" y1="440" x2="360" y2="460" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS42aR)"/>
  <rect x="40" y="465" width="640" height="95" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="488" font-family="monospace" font-size="11" font-weight="bold">4. Called program runs and sees the PDA as a signer</text>
  <text x="60" y="510" font-family="monospace" font-size="10" fill="#565653">the Token Program's "is authority a signer?" check passes</text>
  <text x="60" y="526" font-family="monospace" font-size="10" fill="#565653">the inner program has no idea this signer is a PDA</text>
  <text x="60" y="542" font-family="monospace" font-size="10" fill="#565653">to it, the PDA looks like any other authorized account</text>
  <text x="360" y="585" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The seeds are the signature. Only your program can produce them under your program's ID.</text>
</svg>

An Ethereum contract needs no such step. When it calls a token contract, the token sees the contract's own address as `msg.sender` and moves the balance recorded under that address. The Token Program checks signer flags instead, so a Solana program needs an address it can sign for.

## In Anchor the seeds are one more argument to the CPI context

The raw `invoke_signed` syscall is workable but verbose. In practice you use Anchor's `CpiContext::new_with_signer`, which takes the signer seeds as a third argument and otherwise looks like the plain `CpiContext::new` used for non-PDA CPIs. The `&[&[&[u8]]]` type of `signer_seeds` is that list of seed sets, with one entry per PDA you're signing for.

The full pattern for signing as a Vault PDA, whose seeds are `b"vault"` and the mint's address, fits into six small pieces:

```rust
let bump = ctx.accounts.vault.bump;
let mint_key = ctx.accounts.mint.key();
let seeds: &[&[u8]] = &[b"vault", mint_key.as_ref(), &[bump]];
let signer_seeds: &[&[&[u8]]] = &[seeds];

let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    Transfer {
        from: ctx.accounts.vault_token.to_account_info(),
        to: ctx.accounts.user_token.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    },
    signer_seeds,
);
token::transfer(cpi_ctx, amount)?;
```

<svg role="img" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Signing as a PDA in Anchor, line by line</title><desc>A six-step code block shows a Solana handler reading the vault's stored bump, building seeds with the bump last, wrapping them in signer_seeds, and using CpiContext::new_with_signer to call token::transfer. Side callouts flag why each step matters: bump stored on state at init, Rust needing a binding for temporaries, always putting bump last, and the double-reference signer form that is the one change versus a plain CPI.</desc>
  <defs>
    <marker id="arrS42bG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Signing as a PDA in Anchor, line by line</text>
  <rect x="195" y="85" width="425" height="440" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="195" y="85" width="425" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="407" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">inside your handler</text>
  <text x="215" y="135" font-family="monospace" font-size="10">// 1. read the bump stored on the account</text>
  <text x="215" y="151" font-family="monospace" font-size="10">let bump = ctx.accounts.vault.bump;</text>
  <text x="215" y="185" font-family="monospace" font-size="10">// 2. bind values to locals (lifetimes)</text>
  <text x="215" y="201" font-family="monospace" font-size="10">let mint_key = ctx.accounts.mint.key();</text>
  <text x="215" y="235" font-family="monospace" font-size="10">// 3. build the seeds, bump LAST</text>
  <text x="215" y="251" font-family="monospace" font-size="10">let seeds: &amp;[&amp;[u8]] = &amp;[</text>
  <text x="235" y="267" font-family="monospace" font-size="10">b"vault",</text>
  <text x="235" y="283" font-family="monospace" font-size="10">mint_key.as_ref(),</text>
  <text x="235" y="299" font-family="monospace" font-size="10">&amp;[bump],</text>
  <text x="215" y="315" font-family="monospace" font-size="10">];</text>
  <text x="215" y="349" font-family="monospace" font-size="10">// 4. wrap in outer slice (one set per PDA)</text>
  <text x="215" y="365" font-family="monospace" font-size="10">let signer_seeds: &amp;[&amp;[&amp;[u8]]] = &amp;[seeds];</text>
  <text x="215" y="399" font-family="monospace" font-size="10">// 5. build CpiContext with signer</text>
  <text x="215" y="415" font-family="monospace" font-size="10">let cpi_ctx = CpiContext::new_with_signer(</text>
  <text x="235" y="431" font-family="monospace" font-size="10">ctx.accounts.token_program.to_account_info(),</text>
  <text x="235" y="447" font-family="monospace" font-size="10">Transfer { from, to, authority },</text>
  <text x="235" y="463" font-family="monospace" font-size="10">signer_seeds,</text>
  <text x="215" y="479" font-family="monospace" font-size="10">);</text>
  <text x="215" y="503" font-family="monospace" font-size="10">// 6. make the CPI</text>
  <text x="215" y="519" font-family="monospace" font-size="10">token::transfer(cpi_ctx, amount)?;</text>
  <text x="40" y="144" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">stored on</text>
  <text x="40" y="158" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">your state</text>
  <text x="40" y="172" font-family="monospace" font-size="9" fill="#565653">at init</text>
  <line x1="125" y1="148" x2="195" y2="148" stroke="#565653" stroke-width="1" marker-end="url(#arrS42bG)"/>
  <text x="40" y="204" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">Rust needs</text>
  <text x="40" y="218" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">a binding</text>
  <text x="40" y="232" font-family="monospace" font-size="9" fill="#565653">temporaries</text>
  <text x="40" y="246" font-family="monospace" font-size="9" fill="#565653">die too early</text>
  <line x1="125" y1="200" x2="195" y2="200" stroke="#565653" stroke-width="1" marker-end="url(#arrS42bG)"/>
  <text x="40" y="290" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">bump LAST,</text>
  <text x="40" y="304" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">always</text>
  <text x="40" y="318" font-family="monospace" font-size="9" fill="#565653">forget this and</text>
  <text x="40" y="332" font-family="monospace" font-size="9" fill="#565653">you derive</text>
  <text x="40" y="346" font-family="monospace" font-size="9" fill="#565653">the wrong PDA</text>
  <line x1="125" y1="300" x2="195" y2="300" stroke="#565653" stroke-width="1" marker-end="url(#arrS42bG)"/>
  <text x="638" y="365" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">double</text>
  <text x="638" y="379" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">reference</text>
  <text x="638" y="395" font-family="monospace" font-size="9" fill="#565653">awkward</text>
  <text x="638" y="409" font-family="monospace" font-size="9" fill="#565653">but supports</text>
  <text x="638" y="423" font-family="monospace" font-size="9" fill="#565653">many PDAs</text>
  <line x1="635" y1="370" x2="625" y2="370" stroke="#565653" stroke-width="1" marker-end="url(#arrS42bG)"/>
  <text x="638" y="445" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">signer</text>
  <text x="638" y="459" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">form</text>
  <text x="638" y="475" font-family="monospace" font-size="9" fill="#565653">the one</text>
  <text x="638" y="489" font-family="monospace" font-size="9" fill="#565653">change vs</text>
  <text x="638" y="503" font-family="monospace" font-size="9" fill="#565653">plain CPI</text>
  <line x1="635" y1="450" x2="625" y2="450" stroke="#565653" stroke-width="1" marker-end="url(#arrS42bG)"/>
  <text x="360" y="555" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The first time you write this it feels heavy. By the third time it's reflex.</text>
  <text x="360" y="580" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Every Solana program that holds tokens has some version of these six lines.</text>
</svg>

Three rules cover most failures of this code:

- **The bump goes last and comes from the account.** When `find_program_address` originally derived the canonical PDA, the algorithm appended the bump byte after the rest of the seeds and ran the hash. To re-derive that same address, you must replay the same input in the same order. Move the bump to the front, leave it out, or pass a wrong value, and the seeds no longer derive the vault's address. They derive some other address or, if the hash lands on the curve, no address at all. Read the bump from the account where it was stored at init. Re-running `find_program_address` would also work but costs significant compute units.
- **Bind each `Pubkey` to a local variable first.** An inline `ctx.accounts.mint.key().as_ref()` borrows from a `Pubkey` temporary that is dropped before the seeds are used, and the compiler reports "temporary value dropped while borrowed."
- **Use the seeds of the PDA you are acting for.** If your program manages many PDAs of the same kind, such as per-user vaults, the seeds in your CPI must match the specific PDA. Mixing seeds for one user's vault into a transaction acting on another user's vault is a bug that the compiler can't catch, so test these paths.

When PDA signing fails because the seeds derive some other address, the error is `Cross-program invocation with unauthorized signer or writable account`. The runtime is telling you that an account in the inner call needed to be a signer but wasn't, or needed to be writable but wasn't. For PDA signing failures, signer is almost always the missing flag. If the seeds derive no valid address, which happens for about half of wrong seed sets, the call stops earlier with `Could not create program address with signer seeds`. Either way, review the seeds and the bump, and check that the PDA address you are trying to sign for is in your accounts list.

## The Token Program sees an ordinary signed transfer

The canonical use case for PDA signing is a vault that holds tokens on behalf of a program. A Vault PDA is derived from some seeds, and a token account is created with the Vault PDA as its owner. Say the vault's token account holds 1,000 USDC, a user's token account holds 0, and your handler pays the user 300 USDC.

<svg role="img" viewBox="0 0 720 590" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Vault PDA transfer flow: signing via invoke_signed and balance changes</title><desc>A Vault PDA owns a Vault Token Account holding 1,000 USDC, while the User Token Account starts at 0 USDC. To transfer 300 USDC, the program calls invoke_signed with the vault's seeds so the Token Program accepts the PDA as signer, leaving the vault with 700 USDC and the user with 300 USDC.</desc>
  <defs>
    <marker id="arrS42cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The classic pattern: a Vault PDA that holds tokens</text>
  <rect x="40" y="85" width="640" height="150" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">before the transfer</text>
  <text x="60" y="135" font-family="monospace" font-size="10" font-weight="bold">Vault PDA</text>
  <text x="60" y="151" font-family="monospace" font-size="9" fill="#565653">address: 9Hx2...mK3p</text>
  <text x="60" y="165" font-family="monospace" font-size="9" fill="#565653">seeds: [b"vault", mint, [bump]]</text>
  <text x="60" y="179" font-family="monospace" font-size="9" fill="#565653">owns: → Vault Token Account</text>
  <text x="270" y="135" font-family="monospace" font-size="10" font-weight="bold">Vault Token Account</text>
  <text x="270" y="151" font-family="monospace" font-size="9" fill="#565653">mint:    USDC</text>
  <text x="270" y="165" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">owner:   Vault PDA</text>
  <text x="270" y="179" font-family="monospace" font-size="9" fill="#565653">balance: 1,000 USDC</text>
  <text x="490" y="135" font-family="monospace" font-size="10" font-weight="bold">User Token Account</text>
  <text x="490" y="151" font-family="monospace" font-size="9" fill="#565653">mint:    USDC</text>
  <text x="490" y="165" font-family="monospace" font-size="9" fill="#565653">owner:   User</text>
  <text x="490" y="179" font-family="monospace" font-size="9" fill="#565653">balance: 0 USDC</text>
  <text x="360" y="215" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">to move tokens out of the Vault ATA, the Token Program needs Vault PDA to sign</text>
  <line x1="360" y1="245" x2="360" y2="265" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS42cR)"/>
  <rect x="40" y="270" width="640" height="130" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="270" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="289" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">your handler runs transfer(300)</text>
  <text x="60" y="318" font-family="monospace" font-size="10">1. build CpiContext::new_with_signer with vault seeds</text>
  <text x="60" y="336" font-family="monospace" font-size="10">2. Token Program is invoked, sees Vault PDA in the signer set</text>
  <text x="60" y="354" font-family="monospace" font-size="10">3. checks: authority == vault_ata.owner → ✓</text>
  <text x="60" y="372" font-family="monospace" font-size="10">4. checks: authority is signer → ✓ (runtime accepted the seeds)</text>
  <text x="60" y="390" font-family="monospace" font-size="10">5. mutates balances: vault -300, user +300</text>
  <line x1="360" y1="410" x2="360" y2="430" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS42cR)"/>
  <rect x="40" y="435" width="640" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="435" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="454" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">after the transfer</text>
  <text x="120" y="485" font-family="monospace" font-size="10" font-weight="bold">Vault Token Account</text>
  <text x="120" y="503" font-family="monospace" font-size="9" fill="#565653">balance: 700 USDC</text>
  <text x="120" y="519" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">(-300)</text>
  <text x="420" y="485" font-family="monospace" font-size="10" font-weight="bold">User Token Account</text>
  <text x="420" y="503" font-family="monospace" font-size="9" fill="#565653">balance: 300 USDC</text>
  <text x="420" y="519" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">(+300)</text>
  <text x="360" y="572" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">No human signed for the Vault. The seeds passed to invoke_signed were its signature.</text>
</svg>

The handler passes the Vault PDA as the `authority` field in the Transfer instruction and the vault's seeds as signer seeds. The Token Program reads the authority field, looks at the source token account's owner field, confirms they match, and checks the runtime signer set to confirm the authority signed. Both checks pass, so it takes 300 from the vault's token account and adds 300 to the user's, leaving 700 and 300. From the Token Program's perspective, this looks identical to a transfer authorized by a normal wallet. The Token Program has no concept of PDAs.

The Vault PDA itself doesn't hold the tokens. They live in the token account, a separate account that records the Vault PDA as its owner, in the same way it would record a user's wallet. The [next lesson](/courses/development-on-solana/working-with-other-programs/the-spl-token-program-in-practice) covers token accounts.

The only thing your program needed to provide that a wallet-signed transfer would not provide is the seeds. Everything else is identical, including the instruction shape, the accounts list, and the amount.

## Whoever can make your program sign controls the PDA

Every path in your program that reaches `invoke_signed` with the vault's seeds can move the vault's tokens, so the checks that run before that call are all that stands between a caller and the funds. The holder of the program's upgrade authority has the same power: they can deploy new code to the same program ID, and that code derives the same PDAs ([program upgrades](/courses/development-on-solana/working-with-other-programs/program-upgrades)).

For each PDA that owns funds, list the paths in your program that end in a signature by that PDA, and say what each path checks before it signs.
