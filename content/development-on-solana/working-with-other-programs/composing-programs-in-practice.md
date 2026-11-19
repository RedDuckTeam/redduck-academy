---
id: 200
title: Composing programs in practice
type: lecture
order: 6
faq:
  - question: Why does a swap transaction carry so many accounts?
    answer: >-
      Every account any layer of the call will touch has to be named in the outer transaction,
      because inner programs never request accounts at runtime. An aggregator calling a swap
      that calls the Token Program therefore lists the pool state, the pool authority PDA,
      every token account and every program ID. That up-front naming is what lets the runtime
      schedule transactions in parallel.
  - question: My aggregator transaction is too large. What is the limit?
    answer: >-
      1,232 bytes for the whole legacy transaction, with each account address costing 32
      bytes. That caps you around 35 accounts, and a multi-hop route passes 40 easily.
      Versioned transactions with address lookup tables reference an account by a 1-byte index
      and raise the ceiling to roughly 256.
  - question: Do I need to change my program to support lookup tables?
    answer: >-
      No. The runtime expands the indices into full pubkeys before your handler runs, so your
      Accounts struct still sees a complete AccountInfo for every account. Only the client
      changes, building a VersionedTransaction and supplying the tables it references.
  - question: How many lookup tables can one transaction reference?
    answer: >-
      Several. Production transactions commonly use two or three, one global table of token
      programs and common mints plus protocol-specific ones for pool addresses.
---

> When a program calls a program that calls another program, every account any of them touches has to be listed in the one transaction the client sends. The list grows with each layer and each pool, and the whole transaction has to fit in 1,232 bytes.

## The outer transaction lists the accounts of every layer

Take an aggregator program that calls a swap program, which in turn calls the Token Program.

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

When the user signs a transaction calling your aggregator's `aggregate_swap` handler, they have to supply every account the call will touch. In practice this work is done by the user's frontend constructing the transaction, but the principle is the same: every account that any layer of the call will read or write has to be in the outer transaction's accounts list.

The aggregator needs three accounts of its own: the user's wallet as signer, the aggregator's state, and its fee account. The swap needs six more: the pool state, the pool authority PDA, the user's ATAs for the input and output tokens, and the pool's two ATAs. The Token Program moves tokens between the four token accounts already on the list and adds one entry, its own program ID. Those are the ten accounts in the diagram, and the frontend has to know all ten before it sends anything.

Your aggregator handler receives all of these in its own `ctx.accounts`. It picks out the ones the swap needs and assembles them into a `CpiContext` for the swap CPI. The swap handler receives them, validates them with its own constraints, picks out the four token accounts plus the pool authority, and assembles its own `CpiContext` for the Token Program CPI. The Token Program receives a strict subset, executes the transfer, and returns.

None of the inner programs ever requests accounts dynamically. They expect specific accounts in specific positions, and the caller supplies them, so the outermost caller has to know them all. That's the trade Solana made for determinism and parallelism: every account is named explicitly up front, so the runtime can schedule transactions safely without surprise dependencies.

## A two-DEX route needs 27 accounts, and about 35 fit

Three layers and ten accounts is a toy example. Consider a user who swaps USDC for BONK through SOL, with the aggregator sending half of the trade through Raydium and half through Orca to get better pricing.

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

The list has four accounts on the user's side, three for the aggregator, seven for each DEX leg (the DEX program, the pool states, the pool vaults, and the pool authority PDA), three mints, and three shared programs: 4 + 3 + 7 + 7 + 3 + 3 = 27. Twenty-seven accounts is the conservative count for a relatively simple two-leg aggregator route. Real Jupiter-style routes that pass through three or four DEXes on the way to an exotic token easily exceed forty distinct accounts.

Each transaction has to encode every account address, each one 32 bytes, plus the instruction data, plus signatures, plus the message header. The 27 addresses of this route take 864 bytes. A transaction is capped at 1,232 bytes for the entire payload. In the original (legacy) format, where every address is written out in full, that works out to about 35 accounts in the best case, less when the instruction data is anything other than trivial.

For a long time, this ceiling shaped what protocols could release. Aggregators had to split routes across multiple transactions. Composite operations that should logically happen atomically got broken into pieces with intermediate state. Anything that wanted to compose more than two or three layers of programs could not fit in a single transaction.

Versioned transactions with address lookup tables raise the ceiling without any change to programs: a transaction refers to an account by a 1-byte index into a table stored on chain instead of its 32-byte address. The [next lesson](/courses/development-on-solana/working-with-other-programs/versioned-transactions-and-address-lookup-tables) covers the format in detail.

## The layers also share a compute budget and a depth limit, and any of them can be upgraded

The CU limit belongs to the transaction, and every operation in every layer is counted against it ([transaction fees and compute units](/courses/development-on-solana/the-solana-mental-model/transaction-fees-and-compute-units)). If the aggregator, the swaps on both DEXes, and the Token Program transfers together pass the limit, the whole transaction reverts, whichever layer was running at that moment.

The depth of a call chain is limited to four levels ([CPI lesson](/courses/development-on-solana/working-with-other-programs/cross-program-invocation-cpi)). Aggregator, swap, and Token Program already use three.

Each layer is also code that someone else can replace. A program keeps its address when its upgrade authority deploys new bytecode, so the swap your aggregator calls today can run different code tomorrow, with the signers and writable accounts your handler forwards to it. The [program upgrades lesson](/courses/development-on-solana/working-with-other-programs/program-upgrades) covers who can do that and how to check.

## Every account your instruction requires costs your integrators 32 bytes

If other programs will call yours, your instruction's accounts list becomes part of their callers' transactions, next to the accounts of every other program on the route. The 27-account route above leaves room for about eight more addresses in a legacy transaction at best, and for fewer once instruction data is counted, so an instruction that brings fifteen new accounts cannot be added to it. A lookup table shortens an address to one byte only if someone has put that address into a table ahead of time.

Before you publish an instruction that other programs will call, count the accounts it requires and ask of each one whether the instruction can work without it.
