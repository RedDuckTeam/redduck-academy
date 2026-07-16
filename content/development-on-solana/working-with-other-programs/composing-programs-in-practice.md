---
id: 200
title: Composing programs in practice
type: lecture
order: 6
faq:
  - question: Why does a single swap transaction have to pass so many accounts?
    answer: On Solana every account that any layer of a call will read or write must
      be listed in the outer transaction up front; inner programs never request
      accounts dynamically. So when an aggregator calls a swap, which calls the
      Token Program, the transaction must include the pool state, the pool
      authority PDA, all the token accounts, and every program ID involved. This
      explicit, up-front naming is the trade Solana made so the runtime can
      schedule transactions in parallel without surprise dependencies.
  - question: Why do complex Solana transactions fail with a too-many-accounts or
      size error?
    answer: A legacy transaction must fit in 1,232 bytes, and each account address
      costs 32 bytes, which works out to a hard ceiling of roughly 35 accounts,
      fewer once you add instruction data. Multi-hop aggregator routes can
      reference 27, 40, or more accounts and blow past that. The fix is
      versioned transactions plus Address Lookup Tables, which reference
      accounts by a 1-byte index instead of a full 32-byte address and raise the
      practical ceiling to about 256 accounts.
  - question: Do I need to change my program code to support address lookup tables?
    answer: "No. For program authors nothing changes: you write the same handlers,
      Accounts structs, and CPIs, and the runtime expands the lookup-table
      indices into full pubkeys before your handler runs, so your code still
      sees the complete AccountInfo for every account. The change is only on the
      client side, where you build a VersionedTransaction and supply the lookup
      tables you're referencing. It's purely a wire-format optimization, not a
      new programming model."
---

> The pieces in this module add up to one capability: a program on Solana can call another program, which can call another, with strict rules about authority and a complete accounting of which accounts each call touches. That capability is what makes Solana an ecosystem rather than a collection of isolated contracts. A swap calls the Token Program. A lending protocol calls the swap. An aggregator calls the lending protocol. The composition runs deep, and what reaches the chain is a single transaction that carries every account every layer needs. This closing lecture walks through a worked example, exposes the practical problem the composition pattern runs into, and explains why versioned transactions and address lookup tables exist as the answer.

## Composition is the whole point

Every concept from the rest of this module exists to support composition. Cross-program invocation lets one program call another. PDA signing lets a program act on its own behalf inside that call. The Token Program standardizes the operation everyone calls into. Associated Token Accounts make the addresses of those operations predictable. Token-2022 widens the set of behaviors any of those programs can request. None of these pieces is interesting in isolation. They become interesting because they compose.

A swap program is two hundred lines of code because the actual token movement happens in the Token Program through a CPI. A lending protocol can plug into multiple price oracles by making CPI calls into Pyth or Switchboard. An aggregator can route a single user trade across half a dozen DEXes by orchestrating CPIs into each one. Every protocol on Solana sits somewhere on a stack, with simpler programs below it doing primitive operations and more sophisticated programs above it stitching those primitives into product features.

If you've written or used HTTP middleware, the pattern will feel familiar. Each layer wraps the layer beneath, adds its own behavior, and passes what's left through to the next layer. CPI composition is the on-chain version of the same idea: each program wraps the layer beneath, adds orchestration, and what reaches the bottom carries the cumulative accounts and the cumulative authority.

## A worked example: aggregator calls swap calls Token Program

Concrete numbers help. Take an aggregator program that calls a swap program, which in turn calls the Token Program. Three layers, each doing real work.

<svg role="img" viewBox="0 0 720 590" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Aggregator calls Swap calls Token Program: three CPI layers, 10 accounts</title><desc>Three stacked layers show Aggregator calling Swap via CPI, and Swap calling the Token Program via CPI. Each layer lists its handler and accounts, with a running total that reaches 10 distinct accounts needed in the outer transaction.</desc>
  <defs>
    <marker id="arrS46aR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A worked example: Aggregator → Swap → Token Program</text>
  <rect x="40" y="85" width="640" height="130" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="85" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Layer 1: Your Aggregator program (the outermost call)</text>
  <text x="55" y="132" font-family="monospace" font-size="10" font-weight="bold">handler: aggregate_swap(amount, route)</text>
  <text x="55" y="152" font-family="monospace" font-size="10">accounts it needs:</text>
  <text x="65" y="168" font-family="monospace" font-size="10" fill="#565653">user (Signer), aggregator_state, fee_account</text>
  <text x="65" y="184" font-family="monospace" font-size="10" fill="#565653">+ everything the inner Swap needs (passed through)</text>
  <text x="65" y="200" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">running total: 3 of its own, more to come</text>
  <line x1="360" y1="225" x2="360" y2="248" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS46aR)"/>
  <text x="380" y="240" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">CPI to Swap</text>
  <rect x="40" y="253" width="640" height="130" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="253" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="272" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Layer 2: Swap program (called via CPI)</text>
  <text x="55" y="300" font-family="monospace" font-size="10" font-weight="bold">handler: swap(amount_in, min_out)</text>
  <text x="55" y="320" font-family="monospace" font-size="10">accounts it needs:</text>
  <text x="65" y="336" font-family="monospace" font-size="10" fill="#565653">pool_state, pool_authority (PDA),</text>
  <text x="65" y="352" font-family="monospace" font-size="10" fill="#565653">user_in_ata, user_out_ata, pool_in_ata, pool_out_ata</text>
  <text x="65" y="368" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">running total: 3 + 6 = 9 accounts</text>
  <line x1="360" y1="393" x2="360" y2="416" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS46aR)"/>
  <text x="380" y="408" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">CPI to Token Program</text>
  <rect x="40" y="421" width="640" height="105" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="421" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="440" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Layer 3: Token Program (does the actual transfers)</text>
  <text x="55" y="468" font-family="monospace" font-size="10" font-weight="bold">two transfers: in (user→pool) and out (pool→user)</text>
  <text x="55" y="488" font-family="monospace" font-size="10">accounts: the four token accounts above + Token Program ID itself</text>
  <text x="55" y="508" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">running total: 9 + 1 (Token Program) = 10 accounts</text>
  <text x="360" y="555" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Three nested calls. Ten distinct accounts that all must appear in the outer transaction.</text>
</svg>

When the user signs a transaction calling your aggregator's `aggregate_swap` handler, they have to supply every account the call will touch. In practice this work is done by the user's frontend constructing the transaction, but the principle is the same: every account that any layer of the call will read or write has to be in the outer transaction's accounts list. That means the user side needs to know every account the swap will need, including the pool state, the pool authority PDA, both pool ATAs, and the user's own ATAs for the input and output tokens. The user side also needs to know the Token Program will be called eventually, which means the Token Program's program ID has to be in the accounts list too.

Your aggregator handler receives all of these in its own `ctx.accounts`. It picks out the ones the swap needs and assembles them into a `CpiContext` for the swap CPI. The swap handler receives them, validates them with its own constraints, picks out the four token accounts plus the pool authority, and assembles its own `CpiContext` for the Token Program CPI. The Token Program receives a strict subset, executes the transfer, and returns. Control unwinds back up the stack.

Accounts propagate upward through the call chain in the sense that the outermost caller has to know them all. None of the inner programs ever "request" accounts dynamically. They expect specific accounts in specific positions, and the caller supplies them. That's the trade Solana made for determinism and parallelism: every account is named explicitly up front, so the runtime can schedule transactions safely without surprise dependencies.

## Real-world transactions: the accounts list balloons

Three layers and ten accounts is a toy example. Production aggregator transactions reach much further. Consider what happens when a user routes a single trade across two DEXes simultaneously to get better pricing.

<svg role="img" viewBox="0 0 720 590" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Aggregator swap of USDC to BONK via Raydium and Orca: 27 accounts</title><desc>A user swaps USDC for BONK routed through SOL, split half through Raydium and half through Orca. Listing every user, aggregator, pool, mint, and program account needed gives 27 accounts, close to the roughly 35-account cap for legacy transactions.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A real aggregator transaction: the accounts list balloons</text>
  <rect x="40" y="85" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="108" font-family="monospace" font-size="11" font-weight="bold">scenario: user wants to swap USDC for BONK, routed through SOL</text>
  <text x="60" y="126" font-family="monospace" font-size="10" fill="#565653">aggregator splits the trade across two AMMs: half through Raydium, half through Orca</text>
  <text x="60" y="142" font-family="monospace" font-size="10" fill="#565653">two pools, three tokens, two-hop routing per leg</text>
  <rect x="40" y="170" width="640" height="320" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="170" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="189" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">the accounts the transaction has to carry</text>
  <text x="55" y="218" font-family="monospace" font-size="10" font-weight="bold">user-side:</text>
  <text x="65" y="234" font-family="monospace" font-size="9" fill="#565653">1.  user wallet (Signer)</text>
  <text x="65" y="248" font-family="monospace" font-size="9" fill="#565653">2.  user USDC ATA</text>
  <text x="65" y="262" font-family="monospace" font-size="9" fill="#565653">3.  user SOL account</text>
  <text x="65" y="276" font-family="monospace" font-size="9" fill="#565653">4.  user BONK ATA</text>
  <text x="55" y="304" font-family="monospace" font-size="10" font-weight="bold">aggregator:</text>
  <text x="65" y="320" font-family="monospace" font-size="9" fill="#565653">5.  aggregator program</text>
  <text x="65" y="334" font-family="monospace" font-size="9" fill="#565653">6.  aggregator state PDA</text>
  <text x="65" y="348" font-family="monospace" font-size="9" fill="#565653">7.  aggregator fee account</text>
  <text x="55" y="376" font-family="monospace" font-size="10" font-weight="bold">Raydium leg:</text>
  <text x="65" y="392" font-family="monospace" font-size="9" fill="#565653">8.  raydium program</text>
  <text x="65" y="406" font-family="monospace" font-size="9" fill="#565653">9.  pool USDC/SOL state</text>
  <text x="65" y="420" font-family="monospace" font-size="9" fill="#565653">10. pool USDC vault</text>
  <text x="65" y="434" font-family="monospace" font-size="9" fill="#565653">11. pool SOL vault</text>
  <text x="65" y="448" font-family="monospace" font-size="9" fill="#565653">12. pool authority PDA</text>
  <text x="65" y="462" font-family="monospace" font-size="9" fill="#565653">13. pool SOL/BONK state</text>
  <text x="65" y="476" font-family="monospace" font-size="9" fill="#565653">14. pool SOL vault (2nd)</text>
  <text x="380" y="218" font-family="monospace" font-size="10" font-weight="bold">Orca leg:</text>
  <text x="390" y="234" font-family="monospace" font-size="9" fill="#565653">15. orca program</text>
  <text x="390" y="248" font-family="monospace" font-size="9" fill="#565653">16. pool USDC/SOL state</text>
  <text x="390" y="262" font-family="monospace" font-size="9" fill="#565653">17. pool USDC vault</text>
  <text x="390" y="276" font-family="monospace" font-size="9" fill="#565653">18. pool SOL vault</text>
  <text x="390" y="290" font-family="monospace" font-size="9" fill="#565653">19. pool authority PDA</text>
  <text x="390" y="304" font-family="monospace" font-size="9" fill="#565653">20. pool SOL/BONK state</text>
  <text x="390" y="318" font-family="monospace" font-size="9" fill="#565653">21. pool BONK vault</text>
  <text x="380" y="346" font-family="monospace" font-size="10" font-weight="bold">tokens involved:</text>
  <text x="390" y="362" font-family="monospace" font-size="9" fill="#565653">22. USDC mint</text>
  <text x="390" y="376" font-family="monospace" font-size="9" fill="#565653">23. wSOL mint</text>
  <text x="390" y="390" font-family="monospace" font-size="9" fill="#565653">24. BONK mint</text>
  <text x="380" y="418" font-family="monospace" font-size="10" font-weight="bold">required programs:</text>
  <text x="390" y="434" font-family="monospace" font-size="9" fill="#565653">25. SPL Token Program</text>
  <text x="390" y="448" font-family="monospace" font-size="9" fill="#565653">26. Associated Token Program</text>
  <text x="390" y="462" font-family="monospace" font-size="9" fill="#565653">27. System Program</text>
  <text x="455" y="480" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">27 accounts.</text>
  <rect x="40" y="505" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="528" font-family="monospace" font-size="10">Legacy transactions cap at around 35 accounts due to a 1232-byte total size limit.</text>
  <text x="60" y="546" font-family="monospace" font-size="10">Add one more hop or one more pool, and the transaction stops fitting.</text>
  <text x="60" y="562" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">This is the wall that versioned transactions and ALTs were designed to break.</text>
</svg>

Twenty-seven accounts is the conservative count for a relatively simple two-leg aggregator route. Real Jupiter-style routes that pass through three or four DEXes on the way to an exotic token easily exceed forty distinct accounts. Each transaction has to encode every account address, each one 32 bytes, plus the instruction data, plus signatures, plus the message header. A legacy transaction format puts a hard cap at 1232 bytes for the entire payload. That works out to about 35 accounts in the best case, less when the instruction data is anything other than trivial.

For a long time, this ceiling shaped what protocols could release. Aggregators had to split routes across multiple transactions. Composite operations that should logically happen atomically got broken into pieces with intermediate state. Anything that wanted to compose more than two or three layers of programs could not fit in a single transaction.

## The fix: versioned transactions and address lookup tables

Solana's answer to the size ceiling is a new transaction format and a new on-chain primitive that work together. The transaction format is called the versioned transaction, sometimes referred to as v0 messages in contrast to the original legacy format. The primitive is called an Address Lookup Table, or ALT.

<svg role="img" viewBox="0 0 720 600" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>How Address Lookup Tables compress the accounts list</title><desc>Compares a legacy transaction, where each of 27 accounts needs a full 32-byte pubkey (864 bytes total), with a versioned transaction that references an on-chain Address Lookup Table holding up to 256 pubkeys. The versioned transaction uses a 1-byte index per account instead of the full address, raising the practical ceiling to about 256 accounts per transaction.</desc>
  <defs>
    <marker id="arrS46cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">How ALTs compress the accounts list</text>
  <rect x="40" y="85" width="640" height="105" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">legacy transaction: every account is a full 32-byte pubkey</text>
  <text x="55" y="132" font-family="monospace" font-size="10">accounts: [pubkey_1, pubkey_2, pubkey_3, ..., pubkey_27]</text>
  <text x="55" y="152" font-family="monospace" font-size="10" fill="#565653">size per account in tx:  32 bytes</text>
  <text x="55" y="170" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">27 accounts × 32 bytes = 864 bytes just for addresses. tx fills up fast.</text>
  <rect x="40" y="210" width="640" height="130" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="210" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="229" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Address Lookup Table: an on-chain array of pubkeys</text>
  <text x="55" y="258" font-family="monospace" font-size="10">an ALT is just an account that stores a list of up to 256 pubkeys.</text>
  <text x="55" y="276" font-family="monospace" font-size="10">aggregators and protocols create them ahead of time with their common addresses.</text>
  <text x="55" y="294" font-family="monospace" font-size="10" fill="#565653">example contents: [raydium_program, orca_program, USDC_mint, wSOL_mint,</text>
  <text x="55" y="310" font-family="monospace" font-size="10" fill="#565653">                   pool_a_state, pool_a_vault, ..., system_program]</text>
  <text x="55" y="328" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">created once, referenced from many transactions afterwards</text>
  <line x1="360" y1="350" x2="360" y2="375" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS46cR)"/>
  <rect x="40" y="380" width="640" height="155" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="380" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="399" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">versioned transaction: reference ALT entries by 1-byte index</text>
  <text x="55" y="428" font-family="monospace" font-size="10">tx references: ALT address (32 bytes, once) + indices into it (1 byte each)</text>
  <text x="55" y="446" font-family="monospace" font-size="10">accounts in tx: [user_wallet (32B), index_3, index_7, index_12, ...]</text>
  <text x="55" y="464" font-family="monospace" font-size="9" fill="#565653">the runtime expands indices to full pubkeys before executing</text>
  <text x="55" y="488" font-family="monospace" font-size="10" font-weight="bold">size per ALT-referenced account in tx:</text>
  <text x="395" y="488" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">1 byte (vs 32 bytes)</text>
  <text x="55" y="508" font-family="monospace" font-size="10" font-weight="bold">practical ceiling per tx:</text>
  <text x="395" y="508" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">~256 accounts</text>
  <text x="360" y="572" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Same accounts, same execution. The wire format is what changed.</text>
</svg>

An ALT is just an on-chain account that stores up to 256 pubkeys in an array. An aggregator creates one ahead of time, populates it with the addresses it expects to reference repeatedly, such as DEX program IDs, common pool states, common mints, the System Program, and the Token Program. From that point forward, any transaction that knows the ALT's address can refer to entries in it by a one-byte index. The transaction itself still names the ALT once, at the full 32 bytes, but every reference into the table after that is a single byte.

A transaction can reference multiple ALTs. Real production transactions often reference two or three: a global one with universal addresses such as token programs, system program, and common mints, plus one or two protocol-specific ones for the addresses unique to that protocol's pools.

The runtime expands the indices into full pubkeys before executing. From a program's perspective, nothing changes. Your handler still receives the full `AccountInfo` for every account it expected. The compression is purely a wire-format optimization, with no impact on how programs are written or how privileges propagate. Versioned transactions are not a new programming model. They're a more compact way to encode the same thing.

The practical ceiling is somewhere around 256 accounts per transaction, depending on how many of them come from lookup tables and how big the instruction data is. That's enough headroom for any composition pattern Solana programs reasonably want to do. Routes spanning a dozen DEXes, complex DeFi positions touching multiple lending markets and oracles, NFT marketplaces batching transfers across many collections, all of these fit, where they wouldn't have fit in legacy transactions.

## Working with versioned transactions

For programs, nothing changes. You write the same handlers, the same Accounts structs, the same CPIs. The runtime takes care of the lookup table expansion before your handler runs.

For clients, the change is that you build a `VersionedTransaction` instead of a `Transaction` and pass a list of resolved lookup tables to the SDK. The `@solana/web3.js` library has full support, and so does the Rust client SDK. The aggregator or wallet building the transaction has to fetch the relevant ALTs from the chain, decide which accounts come from where, and emit the right indices. Most of this is hidden by SDK helpers. If you're building a frontend that submits trades, you're working with versioned transactions almost by default. If you're writing tests with bankrun, you're probably still building legacy transactions for simplicity, and the test stack handles that fine.

The one operational concern with ALTs is that creating and activating a new lookup table takes some on-chain work and a slot or two before it is usable. Protocols that intend to use ALTs in their hot path create them at deployment time and reuse them indefinitely. Aggregators dynamically maintain a set of ALTs covering the venues they route to, refreshing them periodically as pool addresses change.

## What the module added up to

Every program on Solana has the same shape underneath. It defines accounts, accepts instructions, validates inputs with constraints, and uses CPI to delegate work it can't do alone. Composition is what turns that small primitive set into an ecosystem. A simple program at the bottom of the stack, like the Token Program, does one thing well and exposes a small instruction set. A more sophisticated program above it, like a swap, calls it through CPI to do the basic work and adds its own value through price calculation, pool state, and fees. A program above that, like an aggregator, orchestrates multiple swaps and adds another layer of value through route optimization, MEV protection, and gas savings. The layers can compose four or five deep before the practical limits become relevant.

If you've followed the whole module, you can now read any program on Solana and recognize its shape. Where are its accounts defined. What constraints does each one carry. What CPIs does it make. Which of its accounts are signers, which are writable, which are PDAs that sign on its own behalf. The mechanics no longer feel like magic. They're a small set of patterns that compose in deep ways.

Reading other programs is the fastest path from here. Open any open-source Solana protocol. The shape will be familiar. The patterns will be recognizable. The places where the protocol added its own clever thing on top of the primitives will be visible. That's what the whole track has been building toward: a working mental model that lets you read the chain rather than just write isolated examples on it.
