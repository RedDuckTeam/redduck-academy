# PDAs as signers

_type: lecture_

> A PDA has no private key. Nobody can sign a transaction with it the normal way. But programs need PDAs to be able to act on the chain, to authorize transfers out of vaults, to mint tokens from pools, to approve withdrawals from treasuries. The runtime's resolution is to let a program sign on behalf of any PDA derived under its own program ID, by submitting the seeds. The seeds are the signature. Once that one idea clicks, every pattern in real Solana code involving program-controlled funds works the same way.

## The seeds are the signature

A normal account signs by producing a cryptographic signature with its private key. The runtime verifies the signature, sees that it matches the account's public key, and marks the account as a signer for the transaction. This is what a wallet does every time a user clicks "Approve."

A PDA cannot do this. Its address is a hash that lands off the ed25519 curve, which means no private key exists that would produce that address. There is nothing to sign with.

What the runtime accepts instead is a re-derivation. When a program calls `invoke_signed`, it passes a list of seed sets along with the inner call. The runtime takes each seed set, appends the calling program's ID, runs the PDA derivation, and gets an address back. If that address matches an account in the call, the runtime marks it as a signer in the inner frame, exactly as if a real signature had been provided.

The key property: the calling program's ID is mixed into the derivation. A different program calling with the same seeds would derive a different PDA. So only the program whose ID was used at PDA creation can produce the right address by replaying the seeds. The seeds aren't a secret. The program ID is what makes the seeds work for one specific program and nobody else.

A corporate stamp shows the same idea. Anyone can describe what the stamp says. The seeds are public. But only an Acme employee can apply the Acme stamp, because they are the only ones who run under the Acme identity. The program ID is the identity. The seeds are the description of which stamp.

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

The whole mechanism is those four steps. Your program promises "I am these seeds." The runtime checks the math, accepts the promise, and the inner program gets a signer it can verify like any other.

## The signing pattern in Anchor

The raw `invoke_signed` syscall is workable but verbose. In practice you use Anchor's `CpiContext::new_with_signer`, which takes the signer seeds as a third argument and otherwise looks like the plain `CpiContext::new` used for non-PDA CPIs.

The full pattern for signing as a Vault PDA fits into six small pieces.

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

Three details in this code earn special attention.

The bump goes last in the seeds array, always. When `find_program_address` originally derived the canonical PDA, the algorithm appended the bump byte after the rest of the seeds and ran the hash. To re-derive that same address, you must replay the exact same input, in the exact same order. Move the bump to the front, or leave it out, and you'll derive a different address. The runtime will tell you so by rejecting the CPI, but the error message isn't always clear about which seed was wrong. Always put the bump last to avoid this error.

The double-reference shape `&[&[&[u8]]]` is unusual enough that it's worth saying out loud. The outer slice contains one entry per PDA you're signing for. Each entry is itself a slice, and that inner slice is a list of byte slices, the actual seeds. Almost every program signs for exactly one PDA at a time, so the outer slice contains exactly one entry. The shape supports multiple PDAs because a single instruction can act on behalf of more than one program-derived account, but it's rare.

The lifetime handling for `mint_key` is a Rust-specific issue. Writing `ctx.accounts.mint.key().as_ref()` inline creates a `Pubkey` temporary and immediately calls `as_ref` on it. The resulting `&[u8]` borrows from a value that's already going out of scope by the time you try to use it. Bind the `Pubkey` to a local variable first, and the slice can borrow from the local. The error you'll see if you forget is "temporary value dropped while borrowed."

## A worked example: the Vault transfer

The canonical use case for PDA signing is a vault that holds tokens on behalf of a program. The setup is: a Vault PDA is derived from some seeds. A token account is created with the Vault PDA as its owner. To move tokens out of that account, the Token Program needs the owner to sign. The owner is a PDA, with no key. The program signs on its behalf via `invoke_signed`.

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

A few things are worth pointing out about this pattern.

First, the Vault PDA itself doesn't hold the tokens. The tokens live in a token account, which is a separate account with the mint, owner, and balance fields the SPL Token Program understands. The Vault PDA is the owner of that token account, in the same way a user's wallet would be the owner of their personal token account. The runtime knows which PDA owns which token account because that owner field was set when the token account was created, usually during the program's initialization.

Second, the Vault PDA is what gets passed as the `authority` field in the Transfer instruction. The Token Program reads the authority field, looks at the source token account's owner field, confirms they match, and checks the runtime signer set to confirm the authority signed. From the Token Program's perspective, this looks identical to a transfer authorized by a normal wallet. The Token Program has no concept of PDAs. It just sees a signed authority that owns the source account.

Third, the only thing your program needed to provide that a wallet-signed transfer would not provide is the seeds. Everything else is identical, including the instruction shape, the accounts list, and the amount. Once you internalize that the seeds replace a signature for accounts you control, every program-owned funds pattern in Solana follows the same template.

## What can go wrong

There are a handful of failure modes specific to PDA signing that account for most of the questions developers ask in their first week. Worth naming them.

Forgetting the bump. The most common bug. Your seeds derive a different address, the runtime doesn't find a match in the call's account list, and you get an unauthorized-signer error. The fix is mechanical: put the bump byte at the end of the seeds array, every time.

Using the wrong bump. If you stored a bump on initialization and your account-fetching logic returns a stale or incorrect value, you'll derive a different PDA. Always read the bump from the account itself, never compute it fresh in a signing path. Re-running `find_program_address` would also work but costs significant compute units, so use the stored bump.

Lifetime errors. The `&[&[&[u8]]]` shape is fragile in Rust. Inline `as_ref` calls fail to compile. Bind your Pubkeys to locals before using them in seeds.

Seeds matching the wrong PDA. If your program manages many PDAs of the same kind, such as per-user vaults, per-pool authorities, or per-proposal escrows, the seeds in your CPI must match the specific PDA you're trying to act on behalf of. Mixing seeds for one user's vault into a transaction acting on another user's vault is a real bug that the compiler can't catch. Test these paths carefully.

Wrong program ID at derivation. If a PDA was derived under one program but you try to sign for it from a different program, the derivation produces a different address. This usually only happens during program upgrades where the program ID changed, but it's worth being aware of.

When PDA signing fails, the error is usually `Cross-program invocation with unauthorized signer or writable account`. The runtime is telling you that an account in the inner call needed to be a signer but wasn't, or needed to be writable but wasn't. For PDA signing failures, signer is almost always the missing flag. Review the seeds, confirm the bump is correct and last, and check that the PDA address you are trying to sign for is in your accounts list.

## Why this design is the whole point

A program that can't hold authority on its own state is barely a program. It would have to ask a human to sign every action, the way a contract on a normal smart-contract platform would call out to a privileged caller. Solana's PDA signing model lets programs own state without any human in the loop. Vaults that auto-rebalance, escrows that release on time triggers, lending pools that liquidate undercollateralized positions, governance contracts that execute approved proposals, all of these need the program to act on behalf of accounts it controls. PDA signing is the mechanism that makes any of it possible.

Once you've signed your first transfer this way, every subsequent program you write that holds funds reuses the same six lines, with different seeds. The pattern is small. The implications are large.
