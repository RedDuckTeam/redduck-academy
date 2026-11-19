---
id: 197
title: The SPL Token program in practice
type: lecture
order: 3
faq:
  - question: What's the difference between a mint and a token account?
    answer: >-
      The mint is the currency. It stores the total supply, the decimal precision, and the
      authorities that can mint or freeze. A token account is one holder's balance of that
      currency, naming a mint, an owner, and an amount. One mint, many token accounts.
  - question: My balance reads 100000000 but the wallet shows 100. Why?
    answer: >-
      Balances are stored as raw integers scaled by the mint's decimals. USDC has 6 decimals,
      so 100,000,000 raw is 100 USDC. Multiply by 10^6 to send and divide by 10^6 to display.
      Every amount inside program logic is raw.
  - question: Does holding the mint authority let me move someone else's tokens?
    answer: >-
      No. It only gates MintTo. The SPL Token program's Transfer, Burn and CloseAccount need
      the token account's owner.
  - question: How do I fix a token's supply so no more can ever be minted?
    answer: >-
      Set the mint authority to None. Nobody can call MintTo after that, and the change cannot
      be undone, so the supply you have is the supply you keep.
  - question: Can I get back the rent on token accounts I no longer use?
    answer: >-
      Yes. CloseAccount refunds the deposit, about 0.002 SOL per account. The balance has to
      be zero first, and the owner signs.
---

> On Ethereum every ERC-20 token is its own contract with its own table of balances. On Solana one program, the SPL Token Program, manages every token, and each holder's balance of each token is a separate account. The first follows from programs holding no state, and the second from the limits on a single account.

## One program serves every token, and a token is a Mint account

On Ethereum a new token means a new contract. Someone deploys code that implements the ERC-20 interface, and that contract keeps a mapping from address to balance in its own storage ([What is ERC-20](/courses/development-on-ethereum/token-security-and-evm-internals/what-is-erc-20)). A developer coming from there expects a Solana token to be a program too.

A Solana program holds no state, so nothing ties its code to one token. The SPL Token Program is a Solana program, deployed at a fixed and well-known address (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`), with the same shape as any program you've written, and its code is the same for every token. What makes one token different from another is data. A **Mint** account stores the rules for one specific token: its total supply, its decimal precision, the authority allowed to mint more, and the authority allowed to freeze holdings. Issuing a new token means creating a new Mint account, and no new code is deployed. Every program that touches tokens does so by CPI-ing into this one well-tested codebase. A second token program, Token-2022, runs beside it with the same Mint and TokenAccount model plus extensions, and the [Token-2022 lesson](/courses/development-on-solana/working-with-other-programs/token-2022-and-token-extensions) covers it.

## Balances cannot live in the Mint, so each holder gets a token account

The next thing an ERC-20 developer would try is to keep all balances of a token in its Mint, the way the contract keeps them in one mapping. Two limits rule that out.

An account's data cannot exceed ten megabytes ([accounts](/courses/development-on-solana/the-solana-mental-model/accounts)). A holder's address alone takes 32 bytes, so one account has room for about 300,000 holders at most.

Every transfer would also write the Mint. The runtime runs two transactions in parallel only if they write different accounts, so no two transfers of the same token could run at the same time ([why Solana was built differently](/courses/development-on-solana/the-solana-mental-model/why-solana-built-differently)).

So each balance gets an account of its own. A **TokenAccount** references the mint, names an owner, and tracks a balance, and a holder needs one for each mint. Alice's USDC account holds 100 USDC, Bob's USDC account holds 50 USDC, and a protocol's vault PDA holds 1,000 USDC.

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

The mint is created once, by whoever issues the token. The token accounts are created on demand, as users come to hold the token for the first time.

## The recipient's token account has to exist before the transfer

The price of this design is that a balance has nowhere to go until its account exists. An ERC-20 transfer to a fresh address needs no setup, because in a mapping every address already has a balance of zero ([mappings](/courses/development-on-ethereum/solidity-basics/mappings)). On Solana the recipient needs a token account for that mint before the first transfer, and somebody has to create it and pay its rent deposit, about 0.002 SOL. The sender also has to find the address of that account, which is not the recipient's wallet address. [Associated Token Accounts](/courses/development-on-solana/working-with-other-programs/associated-token-accounts-atas), the next lesson, are the convention for both.

## A transfer writes two token accounts and nothing else

Alice sends Bob 50 USDC. Her transaction carries one Transfer instruction with three accounts: Alice's USDC account as the source, Bob's USDC account as the destination, and Alice's wallet as the authority. The Token Program reads the owner field of the source account, confirms that it equals the authority, and confirms that the authority signed. Then it subtracts 50 USDC from Alice's account and adds 50 USDC to Bob's, which leaves Alice with 50 and Bob with 100. The mint and Alice's wallet are unchanged.

The amounts in these accounts are raw integers scaled by ten to the power of the mint's decimals. USDC has 6 decimals, so the instruction carries `50,000,000`, and Alice's stored balance goes from `100,000,000` to `50,000,000`. Every amount that touches the Token Program is a raw integer. Conversion to and from display values happens only at the edges, in your frontend or in your test setup, never inside program logic.

## Four instructions cover everyday work

The Token Program has dozens of instructions, but for everyday work you'll reach for four of them constantly.

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

- `Transfer` moves tokens from a source token account to a destination. The owner of the source signs: the user's wallet, or a PDA that your program signs for using `invoke_signed`.
- `MintTo` creates new tokens in a destination token account and increases the mint's `supply` field. The mint authority signs. A protocol that issues its own token uses MintTo, gated by a PDA mint authority, to distribute initial supply or ongoing rewards.
- `Burn` decreases a token account's balance and the mint's supply by the same amount, permanently. The owner of the account signs.
- `CloseAccount` closes a token account that has a zero balance and refunds the rent deposit to a destination. The owner of the account signs.

`InitializeMint` creates a new mint with chosen decimals and authorities, and `InitializeAccount` creates a new token account for a specific mint and owner. In Anchor programs, both are usually wrapped by the `init` constraint plus the right type, so you rarely call them directly.

## Two authorities sit on the mint, and neither can move a holder's balance

Three authorities have power over a token. For each one, the question is what it can do to somebody else's balance.

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

The **mint authority** lives on a Mint account and controls one thing: who can call MintTo against that mint. Set it to a wallet, that wallet can mint new tokens. Set it to a PDA your program controls, your program can mint via `invoke_signed`. Set it to `None`, and the supply is permanently fixed, because once mint authority is None, you cannot reinstate it.

The **freeze authority** also lives on a Mint and controls FreezeAccount, an instruction that locks a specific token account from doing transfers. Most tokens you'll work with have no freeze authority, since most token issuers don't want the ability to seize holdings. Regulated tokens like real-world-asset representations often do, and the USDC mint in the first diagram has one. If a mint has a freeze authority, every holder is taking on the risk that their balance could be frozen.

The **token account owner** lives on each individual TokenAccount and controls what can be done with that account's balance: Transfer, Burn, and CloseAccount all require the owner to sign. This is the authority your program will interact with most often, because every time you move tokens, somebody is signing as the source account's owner.

Of the three, only the freeze authority reaches into another holder's account. Holding the mint authority doesn't give you the ability to move other people's tokens, only to create new ones. Holding ownership of a token account doesn't give you the ability to mint new tokens, only to spend that one balance.

## In Anchor, each token constraint rules out one substitution

The `anchor_spl` crate gives you the `Mint` and `TokenAccount` types and CPI helpers for each instruction, so you can declare token accounts in your Accounts struct alongside your own program's accounts.

```rust
use anchor_spl::token::{Mint, Token, TokenAccount};

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

The `token::mint = ...` and `token::authority = ...` constraints are Anchor checks that the token account is for the right mint and owned by the right authority. Each one rules out a substitution that the Token Program itself would carry out without complaint.

`token::authority = vault_pda` on `vault_account` proves that the destination belongs to your vault PDA, and the seeds on `vault_pda` mean the caller could not choose that address. Without the constraint, a depositor can pass a second token account of their own as `vault_account`. The owner of the source signed, so the Token Program moves the tokens there, and your handler continues as if the vault had received them.

`token::mint = mint` proves that both token accounts hold the token whose Mint is in the `mint` slot. Without it, a depositor can pass accounts of a token they minted themselves, and the handler records a deposit of `mint` although a different token moved. The caller chose the `mint` account too, so a vault that accepts one specific token also has to pin that mint's address ([root of trust](/courses/solana-pro/trust-and-identity/root-of-trust)).

For every token account your instruction receives, say which mint it must hold, who must own it, and which constraint stops the caller from passing a different one.
