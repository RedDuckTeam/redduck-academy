---
id: 197
title: The SPL Token program in practice
type: lecture
order: 3
faq:
  - question: What's the difference between a Mint and a token account on Solana?
    answer: "A Mint account describes the token itself, like a currency: its total
      supply, its decimal precision, and the authorities allowed to mint or
      freeze. A token account (TokenAccount) is one holder's balance of that
      token; it references a mint, names an owner, and tracks an amount. The
      relationship is one-to-many: a single USDC mint has many token accounts
      pointing at it, one per wallet, each holding that wallet's balance."
  - question: Why does my token balance show a huge number like 100000000 instead of 100?
    answer: Token balances are stored as raw integers scaled by ten to the power of
      the mint's decimal precision, not as display values. USDC has 6 decimals,
      so a stored balance of 100,000,000 means 100 USDC on screen. To convert,
      divide by 10^6 to display and multiply by 10^6 to send. Do this conversion
      only at the edges (frontend or tests); inside program logic every amount
      is a raw integer.
  - question: Does holding a token's mint authority let me move other people's tokens?
    answer: "No. The mint authority only controls MintTo, which creates new tokens,
      and it lives on the Mint account. Moving or burning an existing balance
      requires the token account owner, which is a separate authority set on
      each individual token account. These are independent powers: minting
      tokens and spending someone's balance are gated by different keys, and
      blurring them leads to broken access control."
  - question: How do I permanently fix a token's supply so no more can ever be minted?
    answer: "Set the mint authority to None. Once the mint authority is None, no one
      can call MintTo against that mint, so the supply is frozen at whatever it
      currently is. This is a one-way change: you cannot reinstate a mint
      authority afterward, so the supply you have becomes the supply you will
      always have."
---

> Most of what makes Solana useful flows through one program: the SPL Token Program. USDC, USDT, every project's governance token, every meme coin, every staking receipt, every wrapped asset, every position token from every protocol. The same program manages all of them. You've already called it twice through CPI without seeing its formal shape. This lecture is the formal shape: what state lives in its accounts, what instructions it accepts, and what authorities gate what actions. Once you have these pieces, working with tokens in your own programs becomes mechanical.

## The Token Program is just a program

The first thing to understand about the SPL Token Program is that there is nothing special about it. It is a Solana program, deployed at a fixed and well-known address (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`), with the same shape as any program you've written. It has accounts that store its state. It exposes a set of instructions. Anyone can call those instructions from a wallet or from another program via CPI. The runtime treats it like any other program.

What makes it foundational is that everyone agreed to use it. Rather than each token contract on Solana writing its own state machine for tracking balances and approving transfers, the entire ecosystem standardized on one program. The Token Program owns the accounts that store every token's supply and every wallet's holdings. Every program that touches tokens does so by CPI-ing into this one well-tested codebase.

Two account types matter. A **Mint** account describes a token. A **TokenAccount** describes one holder's balance of a token. Almost every interaction with the Token Program boils down to those two account types and how a handful of instructions relate them.

## Mint and TokenAccount: the central split

Think of a Mint as a currency itself. The U.S. dollar has rules about who can print new ones, how many decimal places it uses, and what its total circulation is. A Mint account stores the equivalent rules for one specific token: its total supply, its decimal precision, the authority allowed to print more, and the authority allowed to freeze holdings.

A TokenAccount is one person's bank account holding that currency. It references the mint, names an owner, and tracks a balance. Alice's USDC account holds 100 USDC, Bob's USDC account holds 50 USDC, and a protocol's vault PDA holds 1,000 USDC. Three accounts, three balances, all denominated in the same Mint.

<svg role="img" viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>USDC mint with Alice, Bob, and Vault PDA token accounts</title><desc>One USDC Mint holds the supply, decimals, and authorities for the currency. Three separate token accounts point to that same mint: Alice holds 100 USDC, Bob holds 50 USDC, and the Vault PDA holds 1,000 USDC, each stored as raw integer amounts.</desc>
  <defs>
    <marker id="arrS43aG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">One Mint, many Token Accounts</text>
  <rect x="230" y="90" width="260" height="125" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="230" y="90" width="260" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="109" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Mint (USDC)</text>
  <text x="245" y="138" font-family="monospace" font-size="10">address:           USDC mint pubkey</text>
  <text x="245" y="156" font-family="monospace" font-size="10">supply:            1,150 USDC</text>
  <text x="245" y="174" font-family="monospace" font-size="10">decimals:          6</text>
  <text x="245" y="192" font-family="monospace" font-size="10">mint_authority:    Circle's wallet</text>
  <text x="245" y="208" font-family="monospace" font-size="10">freeze_authority:  Circle's wallet</text>
  <line x1="140" y1="225" x2="140" y2="270" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS43aG)"/>
  <line x1="360" y1="225" x2="360" y2="270" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS43aG)"/>
  <line x1="580" y1="225" x2="580" y2="270" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS43aG)"/>
  <rect x="40" y="275" width="200" height="135" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="275" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="140" y="294" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Alice's USDC account</text>
  <text x="55" y="322" font-family="monospace" font-size="10">mint:    USDC</text>
  <text x="55" y="340" font-family="monospace" font-size="10">owner:   Alice</text>
  <text x="55" y="358" font-family="monospace" font-size="10">balance: 100 USDC</text>
  <text x="55" y="376" font-family="monospace" font-size="9" fill="#565653">stored as</text>
  <text x="55" y="390" font-family="monospace" font-size="9" fill="#565653">100,000,000 raw</text>
  <rect x="260" y="275" width="200" height="135" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="260" y="275" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="294" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Bob's USDC account</text>
  <text x="275" y="322" font-family="monospace" font-size="10">mint:    USDC</text>
  <text x="275" y="340" font-family="monospace" font-size="10">owner:   Bob</text>
  <text x="275" y="358" font-family="monospace" font-size="10">balance: 50 USDC</text>
  <text x="275" y="376" font-family="monospace" font-size="9" fill="#565653">stored as</text>
  <text x="275" y="390" font-family="monospace" font-size="9" fill="#565653">50,000,000 raw</text>
  <rect x="480" y="275" width="200" height="135" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="480" y="275" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="580" y="294" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Vault PDA's account</text>
  <text x="495" y="322" font-family="monospace" font-size="10">mint:    USDC</text>
  <text x="495" y="340" font-family="monospace" font-size="10">owner:   Vault PDA</text>
  <text x="495" y="358" font-family="monospace" font-size="10">balance: 1,000 USDC</text>
  <text x="495" y="376" font-family="monospace" font-size="9" fill="#565653">stored as</text>
  <text x="495" y="390" font-family="monospace" font-size="9" fill="#565653">1,000,000,000 raw</text>
  <rect x="40" y="430" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="452" font-family="monospace" font-size="10">The mint is the currency itself: design, supply, decimals, authorities.</text>
  <text x="60" y="470" font-family="monospace" font-size="10">A token account is one holder's balance of that currency.</text>
  <text x="60" y="488" font-family="monospace" font-size="10">Multiple holders, each with their own account, all pointing at the same mint.</text>
  <text x="360" y="520" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Mint is the currency. Token account is the bank account holding it.</text>
</svg>

The relationship is one-to-many. One mint, many token accounts referencing it. The mint is created once, by whoever issues the token. The token accounts are created on demand, one per wallet per mint, as users come to hold the token for the first time. Most wallets you'd recognize hold dozens of token accounts: one for each different token in the wallet.

A common new-developer confusion is conflating these two layers. People will say "transfer 50 USDC from Alice to Bob" and assume Alice's wallet directly holds tokens. It doesn't. Alice's wallet owns a token account, and that token account holds the balance. To transfer, the Token Program updates two token accounts. The mint, and Alice's wallet, are unchanged. Keep this split clear from the start and the rest of the lesson will follow.

## Decimals: raw amounts versus display values

A balance stored in a token account is not a display value. It's a raw integer scaled by ten to the power of the mint's decimal precision. USDC has 6 decimals, which means a stored balance of `100,000,000` represents `100.000000` USDC when displayed. To take a user-friendly input like "I want to send 100 USDC" and turn it into the right transfer amount, you multiply by `10^6` to get `100,000,000`. To display a balance from the chain, you divide by `10^6`.

The decimals are stored on the mint rather than on the token account. So to convert correctly between raw and display values, you need to know which mint a balance belongs to. SOL uses 9 decimals, so 1 SOL is 1,000,000,000 lamports in raw units. Most fungible tokens use 6 or 9. NFTs typically use 0 decimals, since you can't have half of one.

This is the most common source of scale errors in early Solana programs. A new developer reads a balance, treats it as a display value, multiplies it by some factor in their handler, and ends up moving the wrong amount of tokens. The fix is discipline: every amount that touches the Token Program is a raw integer. Conversion to and from display values happens only at the edges, in your frontend or in your test setup, never inside program logic.

## The four instructions you'll use

The Token Program has dozens of instructions, but for everyday work you'll reach for four of them constantly: Transfer, MintTo, Burn, and CloseAccount.

<svg role="img" viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Transfer, MintTo, Burn, and CloseAccount: the four SPL Token instructions</title><desc>Four boxes show the SPL Token instructions Transfer, MintTo, Burn, and CloseAccount, each listing its accounts and which one must sign. A note below says every instruction needs one signer plus a few accounts, and Anchor's anchor_spl wraps each one.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The four instructions you'll reach for</text>
  <rect x="40" y="90" width="310" height="200" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Transfer</text>
  <text x="55" y="138" font-family="monospace" font-size="10" font-weight="bold">moves tokens between accounts</text>
  <text x="55" y="165" font-family="monospace" font-size="10">accounts:</text>
  <text x="65" y="181" font-family="monospace" font-size="10" fill="#565653">from   (mut)</text>
  <text x="65" y="197" font-family="monospace" font-size="10" fill="#565653">to     (mut)</text>
  <text x="65" y="213" font-family="monospace" font-size="10" fill="#565653">authority</text>
  <text x="55" y="237" font-family="monospace" font-size="10">signer:</text>
  <text x="65" y="253" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">authority must sign</text>
  <text x="55" y="278" font-family="monospace" font-size="9" fill="#565653" font-style="italic">authority = owner of "from"</text>
  <rect x="370" y="90" width="310" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">MintTo</text>
  <text x="385" y="138" font-family="monospace" font-size="10" font-weight="bold">creates new tokens, +supply</text>
  <text x="385" y="165" font-family="monospace" font-size="10">accounts:</text>
  <text x="395" y="181" font-family="monospace" font-size="10" fill="#565653">mint            (mut)</text>
  <text x="395" y="197" font-family="monospace" font-size="10" fill="#565653">to              (mut)</text>
  <text x="395" y="213" font-family="monospace" font-size="10" fill="#565653">mint_authority</text>
  <text x="385" y="237" font-family="monospace" font-size="10">signer:</text>
  <text x="395" y="253" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">mint_authority must sign</text>
  <text x="385" y="278" font-family="monospace" font-size="9" fill="#565653" font-style="italic">authority = mint's mint_authority</text>
  <rect x="40" y="305" width="310" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="305" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="326" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Burn</text>
  <text x="55" y="353" font-family="monospace" font-size="10" font-weight="bold">destroys tokens, -supply</text>
  <text x="55" y="380" font-family="monospace" font-size="10">accounts:</text>
  <text x="65" y="396" font-family="monospace" font-size="10" fill="#565653">from   (mut)</text>
  <text x="65" y="412" font-family="monospace" font-size="10" fill="#565653">mint   (mut)</text>
  <text x="65" y="428" font-family="monospace" font-size="10" fill="#565653">authority</text>
  <text x="55" y="452" font-family="monospace" font-size="10">signer:</text>
  <text x="65" y="468" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">authority must sign</text>
  <text x="55" y="493" font-family="monospace" font-size="9" fill="#565653" font-style="italic">authority = owner of "from"</text>
  <rect x="370" y="305" width="310" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="370" y="305" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="326" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">CloseAccount</text>
  <text x="385" y="353" font-family="monospace" font-size="10" font-weight="bold">closes empty account, refunds rent</text>
  <text x="385" y="380" font-family="monospace" font-size="10">accounts:</text>
  <text x="395" y="396" font-family="monospace" font-size="10" fill="#565653">account     (mut)</text>
  <text x="395" y="412" font-family="monospace" font-size="10" fill="#565653">destination (mut)</text>
  <text x="395" y="428" font-family="monospace" font-size="10" fill="#565653">owner</text>
  <text x="385" y="452" font-family="monospace" font-size="10">signer:</text>
  <text x="395" y="468" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">owner must sign</text>
  <text x="385" y="493" font-family="monospace" font-size="9" fill="#565653" font-style="italic">balance must be 0 first</text>
  <text x="360" y="540" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Every instruction is one signer plus a few accounts. Anchor's anchor_spl wraps each one.</text>
</svg>

`Transfer` is what you call to move tokens. Pass the source and destination token accounts, plus the authority that's allowed to spend from the source. The authority must sign. In simple cases the authority is the user's wallet, the same wallet that owns the source token account. In program-controlled cases the authority is a PDA, and your program signs for it using `invoke_signed`. The Token Program treats both the same way.

`MintTo` creates new tokens. Pass the mint, the destination token account that will receive them, and the mint authority. The mint authority must sign. The mint's `supply` field increases. This is how new tokens enter circulation. A protocol that issues its own token uses MintTo, gated by a PDA mint authority, to distribute initial supply or ongoing rewards.

`Burn` is the inverse. Pass a token account, the mint, and the authority that owns the account. The authority must sign. The token account's balance decreases, and the mint's supply decreases by the same amount. Burning is permanent. Users burn tokens to redeem them for something else in a wrapped-asset protocol, to remove voting power, or to retire stale receipts.

`CloseAccount` closes a token account that has a zero balance and refunds the rent deposit to a destination. The owner of the account must sign. This matters because every token account costs about 0.002 SOL in rent. Users who've accumulated many dust accounts can reclaim that rent by closing each empty one. Protocols often close their own PDAs' token accounts when they're no longer needed, to keep the chain tidy and reclaim rent.

There are initialization instructions too. `InitializeMint` creates a new mint with chosen decimals and authorities. `InitializeAccount` creates a new token account for a specific mint and owner. In Anchor programs, both are usually wrapped by the `init` constraint plus the right type, so you rarely call them directly.

## Three authorities, three different jobs

Tokens involve three distinct authority concepts, and developers who blur them tend to write incorrect access control. Each one gates a different action, lives on a different account, and has a different scope.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Three SPL token authorities: mint, freeze, and account owner</title><desc>Three columns compare mint authority, freeze authority, and token account owner, showing where each is stored, what it controls, and its scope. Two authorities live on the mint, one per currency, while the token account owner is set separately on each token account.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Three authorities, three different jobs</text>
  <rect x="40" y="90" width="205" height="380" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="90" width="205" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="142" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Mint authority</text>
  <text x="55" y="140" font-family="monospace" font-size="10" font-weight="bold">stored on:</text>
  <text x="55" y="156" font-family="monospace" font-size="10" fill="#565653">the Mint</text>
  <text x="55" y="184" font-family="monospace" font-size="10" font-weight="bold">controls:</text>
  <text x="55" y="200" font-family="monospace" font-size="10" fill="#565653">MintTo: who can</text>
  <text x="55" y="214" font-family="monospace" font-size="10" fill="#565653">create new tokens</text>
  <text x="55" y="242" font-family="monospace" font-size="10" font-weight="bold">typically:</text>
  <text x="55" y="258" font-family="monospace" font-size="10" fill="#565653">- a wallet (USDC)</text>
  <text x="55" y="272" font-family="monospace" font-size="10" fill="#565653">- a PDA (protocol</text>
  <text x="55" y="286" font-family="monospace" font-size="10" fill="#565653">  tokens)</text>
  <text x="55" y="300" font-family="monospace" font-size="10" fill="#565653">- None (fixed supply)</text>
  <text x="55" y="328" font-family="monospace" font-size="10" font-weight="bold">setting to None:</text>
  <text x="55" y="344" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">permanent. supply</text>
  <text x="55" y="358" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">can never grow again.</text>
  <text x="55" y="395" font-family="monospace" font-size="10" font-weight="bold">scope:</text>
  <text x="55" y="411" font-family="monospace" font-size="10" fill="#565653">the whole currency</text>
  <text x="142" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">"who creates tokens"</text>
  <rect x="265" y="90" width="190" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="265" y="90" width="190" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Freeze authority</text>
  <text x="280" y="140" font-family="monospace" font-size="10" font-weight="bold">stored on:</text>
  <text x="280" y="156" font-family="monospace" font-size="10" fill="#565653">the Mint</text>
  <text x="280" y="184" font-family="monospace" font-size="10" font-weight="bold">controls:</text>
  <text x="280" y="200" font-family="monospace" font-size="10" fill="#565653">FreezeAccount: lock</text>
  <text x="280" y="214" font-family="monospace" font-size="10" fill="#565653">a specific account</text>
  <text x="280" y="242" font-family="monospace" font-size="10" font-weight="bold">typically:</text>
  <text x="280" y="258" font-family="monospace" font-size="10" fill="#565653">- an issuer's wallet</text>
  <text x="280" y="272" font-family="monospace" font-size="10" fill="#565653">  (regulated tokens)</text>
  <text x="280" y="286" font-family="monospace" font-size="10" fill="#565653">- None (most tokens)</text>
  <text x="280" y="314" font-family="monospace" font-size="10" font-weight="bold">when frozen:</text>
  <text x="280" y="330" font-family="monospace" font-size="9" fill="#565653">no transfers in or</text>
  <text x="280" y="344" font-family="monospace" font-size="9" fill="#565653">out of that account</text>
  <text x="280" y="372" font-family="monospace" font-size="10" font-weight="bold">scope:</text>
  <text x="280" y="388" font-family="monospace" font-size="10" fill="#565653">one account at a time</text>
  <text x="360" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">"who can freeze a holder"</text>
  <rect x="475" y="90" width="205" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="475" y="90" width="205" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="577" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Token account owner</text>
  <text x="490" y="140" font-family="monospace" font-size="10" font-weight="bold">stored on:</text>
  <text x="490" y="156" font-family="monospace" font-size="10" fill="#565653">the Token Account</text>
  <text x="490" y="184" font-family="monospace" font-size="10" font-weight="bold">controls:</text>
  <text x="490" y="200" font-family="monospace" font-size="10" fill="#565653">Transfer, Burn,</text>
  <text x="490" y="214" font-family="monospace" font-size="10" fill="#565653">CloseAccount</text>
  <text x="490" y="242" font-family="monospace" font-size="10" font-weight="bold">typically:</text>
  <text x="490" y="258" font-family="monospace" font-size="10" fill="#565653">- a user's wallet</text>
  <text x="490" y="272" font-family="monospace" font-size="10" fill="#565653">- a PDA (program-</text>
  <text x="490" y="286" font-family="monospace" font-size="10" fill="#565653">  controlled vault)</text>
  <text x="490" y="314" font-family="monospace" font-size="10" font-weight="bold">scope:</text>
  <text x="490" y="330" font-family="monospace" font-size="10" fill="#565653">one specific account,</text>
  <text x="490" y="344" font-family="monospace" font-size="10" fill="#565653">one specific balance</text>
  <text x="490" y="372" font-family="monospace" font-size="10" font-weight="bold">most common:</text>
  <text x="490" y="388" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">this is what your</text>
  <text x="490" y="402" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">program touches daily</text>
  <text x="577" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">"who controls this balance"</text>
  <text x="360" y="510" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Two authorities live on the mint (one per currency). One lives on each token account.</text>
</svg>

The **mint authority** lives on a Mint account and controls one thing: who can call MintTo against that mint. Set it to a wallet, that wallet can mint new tokens. Set it to a PDA your program controls, your program can mint via `invoke_signed`. Set it to `None`, and the supply is permanently fixed. The supply-frozen case is one-way. Once mint authority is None, you cannot reinstate it. The supply you have is the supply you'll always have.

The **freeze authority** also lives on a Mint and controls FreezeAccount, an instruction that locks a specific token account from doing transfers. Most tokens you'll work with have no freeze authority, since most token issuers don't want the ability to seize holdings. Regulated tokens like real-world-asset representations often do. If a mint has a freeze authority, every holder is taking on the implicit risk that their balance could be frozen.

The **token account owner** lives on each individual TokenAccount and controls what can be done with that account's balance: Transfer, Burn, and CloseAccount all require the owner to sign. This is the authority your program will interact with most often, because every time you move tokens, somebody is signing as the source account's owner. Most of your CPIs to the Token Program are about getting the right owner to sign for the right token account.

The split between mint authorities and token account owners is what people miss. Holding the mint authority doesn't give you the ability to move other people's tokens, only to create new ones. Holding ownership of a token account doesn't give you the ability to mint new tokens, only to spend that one balance. They're independent powers.

## Working with tokens in Anchor

The `anchor_spl` crate gives you typed Rust bindings for everything above. The Mint type, the TokenAccount type, and CPI helpers for each instruction. You add it to your `Cargo.toml`, import the pieces you need, and you can declare token accounts in your Accounts struct alongside your own program's accounts.

```rust
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(mut, token::mint = mint, token::authority = depositor)]
    pub user_account: Account<'info, TokenAccount>,

    #[account(mut, token::mint = mint, token::authority = vault_pda)]
    pub vault_account: Account<'info, TokenAccount>,

    /// CHECK: this is a PDA, validated by seeds constraint
    #[account(seeds = [b"vault"], bump)]
    pub vault_pda: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}
```

Notice the `token::mint = ...` and `token::authority = ...` constraints. These are Anchor checks that the token account in question is for the right mint and owned by the right authority. Adding them means a malicious caller cannot substitute a token account for the wrong token or one they do not own. The Token Program would eventually catch most such mistakes, but Anchor catches them earlier with cleaner error messages.

A final note on Token-2022. There's a newer version of the Token Program with the same conceptual model but extra features: transfer fees, transfer hooks, interest-bearing accounts, metadata pointers, and more. Adoption is growing but classic SPL Token still dominates by a wide margin, and most ecosystem tooling assumes it. The conceptual split into Mints and TokenAccounts, and the four core instructions, work identically in both. Token-2022 is its own topic worth its own treatment when you get there.

Everything above is foundational. When you write a program that holds funds, you're writing accounts of types you've now seen. When you check whether a withdrawal is authorized, you're checking the token account's owner. When you mint protocol rewards, you're calling MintTo with a mint authority your program controls. The patterns repeat. Internalize this once and you'll recognize the shape of every token-touching protocol on Solana.
