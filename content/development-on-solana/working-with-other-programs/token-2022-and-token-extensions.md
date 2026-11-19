---
id: 199
title: Token-2022 and token extensions
type: lecture
order: 5
faq:
  - question: Can I add a transfer fee to a token I already minted?
    answer: >-
      No. Extensions live only on Token-2022, and a mint's token program is fixed at creation.
  - question: I sent 100 tokens and only 98 arrived. Where did the rest go?
    answer: >-
      The mint carries the transfer fee extension. It takes a cut of every transfer, set in
      basis points where one basis point is 0.01%, and withholds it on the destination account
      for the withdraw-withheld authority to collect later. It applies to every transfer,
      whatever app started it.
  - question: Classic SPL Token or Token-2022?
    answer: >-
      Classic SPL unless you need an extension. Transfer fees, transfer hooks,
      interest-bearing balances, default-frozen accounts and on-mint metadata exist only on
      Token-2022. Everything else in the ecosystem assumes classic SPL, and extension support
      in wallets, DEXes and indexers is uneven, so test against every system your token will
      touch.
  - question: How do I write one program that accepts both token programs?
    answer: >-
      Use anchor_spl::token_interface. InterfaceAccount replaces Account, and Interface<'info,
      TokenInterface> accepts either program and routes the CPI, so your handler never
      branches. The transfer call there is transfer_checked, which also takes the mint and the
      expected decimals.
  - question: Does Token-2022 change how a plain transfer works?
    answer: >-
      No. Mint and TokenAccount keep the same fields, the four core instructions behave the
      same, and the three authorities mean the same thing. Extension data is appended in a
      type-length-value tail, so several extensions can sit on one account.
---

> Token-2022 is a second token program, deployed alongside the original, in which a mint can switch on optional behaviors called extensions. For a program that accepts a token it did not issue, an extension can change what a transfer of that token does.

## A token on Solana has no contract of its own

On Ethereum every token is its own contract, and the issuer writes what a transfer does. A token that inherits OpenZeppelin's `ERC20` can override one internal function to add pausing, blacklisting, or a fee on every transfer ([ERC-20 lesson](/courses/development-on-ethereum/token-security-and-evm-internals/what-is-erc-20)).

On Solana a token is a Mint account owned by the Token Program, and the same program moves the balances of every token ([SPL Token lesson](/courses/development-on-solana/working-with-other-programs/the-spl-token-program-in-practice)). An issuer who wants a fee on every transfer has no code of their own in that path. The behavior has to be built into the shared program, as an option that each mint switches on or leaves off.

Token-2022 is built this way. For logic it does not have built in, one extension, the transfer hook, makes it call a program of the issuer's choice during every transfer.

## Token-2022 is the same model with an extensions slot

Token-2022 is a separate program from classic SPL Token. It has its own program ID (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`), its own on-chain accounts, and its own deployed bytecode. It does not supersede classic SPL Token. Both programs run side by side on mainnet. Each new mint is created under one program or the other, and the choice is permanent.

The Mint and TokenAccount struct shapes are the same, and the four core instructions and the three authorities from the SPL Token lesson work the same way.

The difference shows up in two places. Token-2022 mints and token accounts can carry a tail of extension data after the standard fields, in a format called TLV, short for type-length-value, that lets several extensions coexist on one account. And Token-2022 exposes extension-specific instructions on top of the standard ones, for things like setting transfer fee rates or withdrawing accumulated fees.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Classic SPL Token vs Token-2022: same fields plus TLV extensions</title><desc>Two side-by-side panels compare Classic SPL Token and Token-2022, each listing its program ID, Mint fields, TokenAccount fields, instructions, extensibility, and tool support. Token-2022 adds "+ extensions (TLV)" to the Mint and TokenAccount fields plus extension-specific instructions, and a caption notes both share the same Mint/TokenAccount shape, instructions, and authorities, with extensions simply appended.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Classic SPL Token vs Token-2022: same model, extensions added</text>
  <rect x="40" y="90" width="310" height="430" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Classic SPL Token</text>
  <text x="55" y="142" font-family="monospace" font-size="10" font-weight="bold">program ID:</text>
  <text x="55" y="158" font-family="monospace" font-size="9" fill="#565653">TokenkegQfeZyiNw...</text>
  <text x="55" y="186" font-family="monospace" font-size="10" font-weight="bold">Mint fields:</text>
  <text x="55" y="204" font-family="monospace" font-size="9" fill="#565653">mint_authority</text>
  <text x="55" y="218" font-family="monospace" font-size="9" fill="#565653">supply</text>
  <text x="55" y="232" font-family="monospace" font-size="9" fill="#565653">decimals</text>
  <text x="55" y="246" font-family="monospace" font-size="9" fill="#565653">freeze_authority</text>
  <text x="55" y="274" font-family="monospace" font-size="10" font-weight="bold">TokenAccount fields:</text>
  <text x="55" y="292" font-family="monospace" font-size="9" fill="#565653">mint, owner, amount</text>
  <text x="55" y="306" font-family="monospace" font-size="9" fill="#565653">delegate, state, ...</text>
  <text x="55" y="334" font-family="monospace" font-size="10" font-weight="bold">instructions:</text>
  <text x="55" y="352" font-family="monospace" font-size="9" fill="#565653">Transfer, MintTo,</text>
  <text x="55" y="366" font-family="monospace" font-size="9" fill="#565653">Burn, CloseAccount,</text>
  <text x="55" y="380" font-family="monospace" font-size="9" fill="#565653">FreezeAccount, ...</text>
  <text x="55" y="408" font-family="monospace" font-size="10" font-weight="bold">extensibility:</text>
  <text x="55" y="426" font-family="monospace" font-size="9" fill="#565653">none. fields are fixed.</text>
  <text x="195" y="470" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">universal support</text>
  <text x="195" y="486" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">every wallet, DEX, indexer</text>
  <text x="195" y="500" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">handles it correctly</text>
  <rect x="370" y="90" width="310" height="430" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Token-2022</text>
  <text x="385" y="142" font-family="monospace" font-size="10" font-weight="bold">program ID:</text>
  <text x="385" y="158" font-family="monospace" font-size="9" fill="#565653">TokenzQdBNbLqP5VE...</text>
  <text x="385" y="186" font-family="monospace" font-size="10" font-weight="bold">Mint fields:</text>
  <text x="385" y="204" font-family="monospace" font-size="9" fill="#565653">mint_authority</text>
  <text x="385" y="218" font-family="monospace" font-size="9" fill="#565653">supply</text>
  <text x="385" y="232" font-family="monospace" font-size="9" fill="#565653">decimals</text>
  <text x="385" y="246" font-family="monospace" font-size="9" fill="#565653">freeze_authority</text>
  <text x="385" y="262" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">+ extensions (TLV)</text>
  <text x="385" y="288" font-family="monospace" font-size="10" font-weight="bold">TokenAccount fields:</text>
  <text x="385" y="306" font-family="monospace" font-size="9" fill="#565653">mint, owner, amount</text>
  <text x="385" y="320" font-family="monospace" font-size="9" fill="#565653">delegate, state, ...</text>
  <text x="385" y="334" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">+ extensions (TLV)</text>
  <text x="385" y="362" font-family="monospace" font-size="10" font-weight="bold">instructions:</text>
  <text x="385" y="380" font-family="monospace" font-size="9" fill="#565653">all the classic ones, PLUS</text>
  <text x="385" y="394" font-family="monospace" font-size="9" fill="#565653">extension-specific calls</text>
  <text x="385" y="422" font-family="monospace" font-size="10" font-weight="bold">extensibility:</text>
  <text x="385" y="440" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">opt into extensions at</text>
  <text x="385" y="454" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">mint creation time</text>
  <text x="525" y="486" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">growing support</text>
  <text x="525" y="500" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">most tools handle base case,</text>
  <text x="525" y="513" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">extensions are spottier</text>
  <text x="360" y="555" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Same Mint/TokenAccount shape, same instructions, same authorities. Extensions are appended.</text>
</svg>

An extension is switched on when the mint is created, and it stays for the life of the mint. There's no upgrade path that adds extensions to an existing classic SPL mint. Extensions can stack, so a single mint can carry a transfer fee, an interest-bearing rate, and metadata, all at once. Most extensions are immutable once set. Others let the issuer change parameters later through a configured authority.

## An extension can change what your program can assume about a transfer

Token-2022 has more than a dozen extensions, and new ones land in the program over time. The issuer picks them, and your program meets them when a user deposits the token. The diagram shows five of them the way the issuer sees them.

<svg role="img" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Five Token-2022 extensions: Transfer Fee, Transfer Hook, Interest-Bearing, Default Account State, Metadata</title><desc>Four boxes arranged in a 2x2 grid describe the Transfer Fee, Transfer Hook, Interest-Bearing, and Default Account State extensions, each with what it does, who controls it, and a use case. A fifth box below covers on-mint Metadata, and a footer note says extensions are chosen at mint creation and can be immutable or controlled by an authority.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Five extensions worth knowing</text>
  <rect x="40" y="85" width="310" height="165" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="85" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Transfer Fee</text>
  <text x="55" y="132" font-family="monospace" font-size="10">a percentage of each transfer</text>
  <text x="55" y="148" font-family="monospace" font-size="10">is automatically diverted to</text>
  <text x="55" y="164" font-family="monospace" font-size="10">accumulated fees on the mint</text>
  <text x="55" y="190" font-family="monospace" font-size="10" font-weight="bold">controlled by:</text>
  <text x="55" y="206" font-family="monospace" font-size="9" fill="#565653">withdraw_withheld_authority</text>
  <text x="55" y="226" font-family="monospace" font-size="10" font-weight="bold">use case:</text>
  <text x="55" y="242" font-family="monospace" font-size="9" fill="#565653">royalties, protocol fees</text>
  <rect x="370" y="85" width="310" height="165" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="370" y="85" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Transfer Hook</text>
  <text x="385" y="132" font-family="monospace" font-size="10">every transfer triggers a CPI</text>
  <text x="385" y="148" font-family="monospace" font-size="10">to a designated program before</text>
  <text x="385" y="164" font-family="monospace" font-size="10">the transfer completes</text>
  <text x="385" y="190" font-family="monospace" font-size="10" font-weight="bold">controlled by:</text>
  <text x="385" y="206" font-family="monospace" font-size="9" fill="#565653">hook program's own logic</text>
  <text x="385" y="226" font-family="monospace" font-size="10" font-weight="bold">use case:</text>
  <text x="385" y="242" font-family="monospace" font-size="9" fill="#565653">compliance, custom rules</text>
  <rect x="40" y="265" width="310" height="165" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="265" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="284" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Interest-Bearing</text>
  <text x="55" y="312" font-family="monospace" font-size="10">displayed balance grows over</text>
  <text x="55" y="328" font-family="monospace" font-size="10">time at a set rate. raw amount</text>
  <text x="55" y="344" font-family="monospace" font-size="10">in the account doesn't change.</text>
  <text x="55" y="370" font-family="monospace" font-size="10" font-weight="bold">controlled by:</text>
  <text x="55" y="386" font-family="monospace" font-size="9" fill="#565653">rate_authority on the mint</text>
  <text x="55" y="406" font-family="monospace" font-size="10" font-weight="bold">use case:</text>
  <text x="55" y="422" font-family="monospace" font-size="9" fill="#565653">yield-bearing stablecoins</text>
  <rect x="370" y="265" width="310" height="165" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="370" y="265" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="284" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Default Account State</text>
  <text x="385" y="312" font-family="monospace" font-size="10">new token accounts start frozen.</text>
  <text x="385" y="328" font-family="monospace" font-size="10">freeze authority must explicitly</text>
  <text x="385" y="344" font-family="monospace" font-size="10">unfreeze them.</text>
  <text x="385" y="370" font-family="monospace" font-size="10" font-weight="bold">controlled by:</text>
  <text x="385" y="386" font-family="monospace" font-size="9" fill="#565653">freeze_authority on the mint</text>
  <text x="385" y="406" font-family="monospace" font-size="10" font-weight="bold">use case:</text>
  <text x="385" y="422" font-family="monospace" font-size="9" fill="#565653">KYC-gated tokens, RWAs</text>
  <rect x="200" y="445" width="320" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="200" y="445" width="320" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="464" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Metadata (on-mint)</text>
  <text x="215" y="492" font-family="monospace" font-size="10">name, symbol, URI live</text>
  <text x="215" y="508" font-family="monospace" font-size="10">directly on the mint, with</text>
  <text x="215" y="524" font-family="monospace" font-size="10">no separate metadata account.</text>
  <text x="215" y="552" font-family="monospace" font-size="9" fill="#565653">use case: simpler than Metaplex Token Metadata</text>
  <text x="360" y="600" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Extensions are chosen at mint creation. Some are immutable once set, others have a configured authority.</text>
</svg>

The **transfer fee** extension takes a percentage cut on every transfer, specified in basis points where one basis point equals 0.01%, and withholds it in a hidden balance on the destination token account. The mint's withdraw-withheld authority collects the withheld fees later. The fee applies to every transfer regardless of which dApp or wallet initiated it, with no way for senders or receivers to avoid it.

So less arrives than was sent. Take a mint with a 2% fee, which is 200 basis points. A user deposits 100 tokens into your vault. The vault's balance grows by 98, and the other 2 are withheld for the withdraw-withheld authority. If the handler credits the user with the 100 it passed to the transfer, the vault owes 100 and holds 98. After a second deposit of 100 it owes 200 and holds 196. The first user's withdrawal takes 100 out of the vault, and the second user, who is also owed 100, finds 96 left. A program that accepts such a mint has to credit what arrived, which is the change in the vault's balance, and not the amount it asked to transfer.

The **transfer hook** extension makes the Token-2022 program perform a CPI into a program of the mint creator's choice on every transfer, passing details about the transfer. The hook program can run arbitrary validation logic before the transfer is allowed to complete. An issuer can use it to allow transfers only between accounts on an approved list, to require a royalty payment alongside a transfer, or to keep its own records current, the way Fragmetric's hook updates the holder's reward balance at the moment of the transfer ([lazy loading](/courses/solana-pro/cost-distribution/lazy-loading)).

For your program a hook means two things. A program you did not write runs in the middle of every transfer your program makes, and it can reject the transfer. The hook program also needs accounts of its own. Every account a transaction touches has to be declared up front ([instructions and transactions](/courses/development-on-solana/the-solana-mental-model/instructions-and-transactions)), so the client that calls your program has to bring the hook's extra accounts, and your program has to pass them on in the transfer CPI. Most existing infrastructure does not do this, and many production protocols refuse hooked tokens to keep their integration surface small.

The **default account state** extension makes new token accounts start in the frozen state automatically. Anyone can call `InitializeAccount` to create the token account, but the resulting account can't send or receive tokens until the freeze authority explicitly unfreezes it. Real-world-asset tokens often need to verify KYC before letting a wallet hold the asset, and with this extension the chain enforces that gate. The vault token account your program creates for such a mint starts frozen too, so deposits into it fail until the issuer's freeze authority unfreezes it.

The other two extensions in the diagram do not change how tokens move. The **interest-bearing** extension keeps the raw `amount` field in a token account static and changes only the display value: the program's `amount_to_ui_amount` instruction returns the amount with interest accrued at a configurable rate stored on the mint. A program that keeps all its accounting in raw amounts is unaffected, and code that compares raw amounts with display amounts gets wrong results. The **metadata** extension lets a mint carry name, symbol, and URI directly, removing the need for a separate account in the Metaplex Token Metadata program.

## Extensions cost compatibility

Classic SPL Token has been the standard for years, and wallets, DEXes, aggregators, and indexers assume it. Token-2022 has been growing in support since 2023, but the picture is uneven. Most tools handle the base case: a Token-2022 mint with no extensions behaves like a classic SPL mint, and most software gets that right. Extensions are where the breakage happens, because each behavior in the previous section is a case that software written for classic SPL does not handle.

So if you issue a mint yourself, classic SPL remains the right default. If you need a specific extension, Token-2022 is the only option, and you have to test against every system your token is going to touch: the major wallets, the DEXes you're targeting, and your own indexers.

## `token_interface`: writing programs that handle both

When you're writing a program that needs to work with either classic SPL or Token-2022 mints, Anchor's `anchor_spl::token_interface` module provides a unified type that abstracts over the program ID. Instead of `Account<'info, TokenAccount>` from `anchor_spl::token`, you use `InterfaceAccount<'info, TokenAccount>` from `anchor_spl::token_interface`. The type accepts token accounts from either program.

```rust
use anchor_spl::token_interface::{
    Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked,
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = user,
        token::token_program = token_program,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}
```

The `Interface<'info, TokenInterface>` accepts either the classic SPL Token Program or the Token-2022 program, and the client decides which one goes in the slot. A `transfer_checked` CPI goes to whatever program is in `token_program`, and if that program does not own the mint, the CPI fails inside it. The constraints `mint::token_program = token_program` and `token::token_program = token_program` check during validation that the mint and the token account are owned by the program in the slot, so a client that pairs a classic mint with Token-2022 fails with `ConstraintMintTokenProgram` before the handler runs. With those checks in place, your handler doesn't need to branch on the token program.

In `token_interface` the plain `transfer` is deprecated in favor of `transfer_checked`. The "checked" version requires you to pass the mint and the expected decimals as part of the call, and the Token Program verifies the values match. This protects against bugs where the wrong mint or wrong decimals got plumbed through, and it's the recommended pattern for any new code regardless of which token program you're targeting. Classic SPL also has `transfer_checked`. The reason older code tends to use plain `transfer` is historical inertia.

Choosing between `token` and `token_interface` decides which mints can reach your handler. A program built on `anchor_spl::token` accepts only classic SPL mints, so it never meets an extension. A program built on `token_interface` accepts Token-2022 mints as well, and with them transfer fees, hooks, and accounts that start frozen. Pick `token_interface` for any new program that might encounter Token-2022 mints, which is most new programs. Pick `token` only if you're certain you'll never need to work with Token-2022, which usually means you're targeting a specific known mint that's classic SPL.

A program built on `token_interface` can still refuse the extensions it was not written for. The mint lists its extensions in its TLV tail, and the handler can read their types with the Token-2022 crate and fail on any type that is not on its own list. Here the list holds only the two metadata extensions:

```rust
use anchor_spl::token_2022::spl_token_2022::{
    extension::{BaseStateWithExtensions, ExtensionType, StateWithExtensions},
    state::Mint as MintState,
};
const ALLOWED: [ExtensionType; 2] = [ExtensionType::MetadataPointer, ExtensionType::TokenMetadata];

let mint_info = ctx.accounts.mint.to_account_info();
let mint_data = mint_info.try_borrow_data()?;
let mint = StateWithExtensions::<MintState>::unpack(&mint_data)?;
for ext in mint.get_extension_types()? {
    require!(ALLOWED.contains(&ext), VaultError::UnsupportedMint);
}
```

A classic SPL mint has no TLV tail, so it passes with an empty list. A mint with a transfer fee, a transfer hook, or the default account state extension fails, and so does a mint with an extension added to Token-2022 after the program was written.

## Three questions before your program accepts Token-2022 mints

What does the program record when 100 tokens are sent and 98 arrive? Who brings the hook program's accounts, and what happens to your users when the hook rejects a transfer? What happens when the token account your program creates starts frozen? Until the program has an answer to each of them, build it on `anchor_spl::token`, which accepts only classic SPL mints, or refuse those extensions with a check like the one above.
