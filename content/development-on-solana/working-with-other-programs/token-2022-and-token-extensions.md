---
id: 199
title: Token-2022 and token extensions
type: lecture
order: 5
faq:
  - question: Can I add transfer fees or other extensions to an existing SPL token?
    answer: "No. Extensions only exist on Token-2022, which is a separate program
      from classic SPL Token, and there's no upgrade path that adds them to an
      existing classic mint. You have to create the mint under Token-2022 from
      the start, and the program choice is permanent. The good news is the base
      model is unchanged: Mint and TokenAccount shapes, the four core
      instructions, and the three authorities all work the same in both."
  - question: Why did fewer tokens arrive than I sent with a Token-2022 token?
    answer: 'The mint probably uses the transfer fee extension, which takes a
      percentage cut (specified in basis points, where one basis point is 0.01%)
      on every transfer and withholds it on the destination account. It applies
      to every transfer regardless of which app initiated it, like an on-chain
      sales tax. This is a common integration bug: code that assumes "send 100,
      receive 100" breaks, so with Token-2022 you must account for the fee.'
  - question: Should I use classic SPL Token or Token-2022 for my mint?
    answer: If you need a specific extension, such as transfer fees, a transfer
      hook, interest-bearing balances, default-frozen accounts, or on-mint
      metadata, Token-2022 is the only option. If you don't, classic SPL Token
      remains the safer default because every wallet, DEX, indexer, and
      dashboard assumes it. Extensions are where ecosystem support gets uneven,
      so before shipping a Token-2022 mint, test that the wallets, DEXes, and
      indexers you target handle it correctly.
  - question: How do I write one Anchor program that works with both classic SPL and
      Token-2022 mints?
    answer: Use Anchor's anchor_spl::token_interface module instead of
      anchor_spl::token. Swap Account<'info, TokenAccount> for
      InterfaceAccount<'info, TokenAccount> and use Interface<'info,
      TokenInterface> for the program, which accepts either token program and
      routes the CPI automatically so your handler doesn't branch. Note that
      token_interface exposes transfer_checked (which also takes the mint and
      expected decimals) rather than plain transfer, and it's the recommended
      pattern for any new program that might meet a Token-2022 mint.
---

> The classic SPL Token Program covers about ninety-five percent of what most projects need. The remaining five percent led to a second token program, deployed alongside the original, that supports the same conceptual model with optional behaviors layered on top. Token-2022 lets a mint opt into features like transfer fees, transfer hooks, frozen-by-default accounts, interest-bearing balances, and on-mint metadata. The base model is unchanged. The new capabilities sit in a tagged area on each mint and each token account, activated only when the mint creator chooses them. Knowing which extensions exist, when to reach for them, and what they cost in ecosystem compatibility is the whole job of this lecture.

## Token-2022 is the same model with an extensions slot

Token-2022 is a separate program from classic SPL Token. It has its own program ID (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`), its own on-chain accounts, and its own deployed bytecode. It does not supersede classic SPL Token. Both programs run side by side on mainnet. Each new mint is created under one program or the other, and the choice is permanent.

What makes Token-2022 worth understanding is the relationship between the two programs. The Mint and TokenAccount struct shapes are the same. The four core instructions, Transfer, MintTo, Burn, and CloseAccount, work identically. The three authority concepts, mint authority, freeze authority, and token account owner, mean the same thing. If you perform a routine token operation against a Token-2022 mint, the code looks almost identical to the same operation against a classic SPL mint.

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

You can think of Token-2022 as the same library with optional feature flags. The base case is identical to classic SPL. The flags add capabilities, each one a small piece of behavior built into the mint at creation time. Once a flag is set, it's set for the life of the mint. There's no upgrade path that adds extensions to an existing classic SPL mint. You have to mint under Token-2022 from the start to have any extensions at all.

## Five extensions worth knowing

Token-2022 has more than a dozen extensions, and new ones land in the program over time. Five of them cover most of the cases real protocols reach for.

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

The **transfer fee** extension takes a percentage cut — specified in basis points, where one basis point equals 0.01% — on every transfer and routes it into a hidden balance on each token account. The mint's withdraw-withheld authority can periodically harvest the accumulated fees from many accounts at once and consolidate them into a single destination. This is the on-chain equivalent of a sales tax: it applies to every transfer regardless of which dApp or wallet initiated it, with no way for senders or receivers to avoid it. Royalty tokens and protocol-fee tokens are the obvious uses. Less obviously, projects that wanted to fund a treasury automatically without trusting any single dApp to remit fees now have a way to do it at the token layer.

The **transfer hook** extension is the most powerful and the most disruptive. When a transfer happens, the Token-2022 program performs a CPI into a program of the mint creator's choice, passing details about the transfer. The hook program can run arbitrary validation logic before the transfer is allowed to complete. This enables compliance gates, such as allowing transfers only between accounts on an approved list. It enables custom royalty enforcement, like requiring a royalty payment alongside any NFT-like transfer. It enables audit trails, where every transfer is logged to an on-chain analytics PDA. The problem is that every protocol downstream of the token needs to know how to invoke the hook with the right accounts, which makes transfer-hooked tokens incompatible with most existing infrastructure.

The **interest-bearing** extension changes how balances are displayed, while keeping the underlying account data static. The raw `amount` field in a token account never changes due to interest. But when a client or program calls the program's `amount_to_ui_amount` instruction, the result includes accrued interest at a configurable rate stored on the mint. The clean way to think about this: the mint exposes a function from raw amount and current time to display amount, and clients are expected to use that function. A yield-bearing stablecoin can be implemented without ever actually moving balances around. Holders see their displayed balance increase, and the mint's supply function computes the implied total.

The **default account state** extension makes new token accounts start in the frozen state automatically. Anyone can call `InitializeAccount` to create the token account, but the resulting account can't send or receive tokens until the freeze authority explicitly unfreezes it. This gives token issuers a built-in onboarding gate. Real-world-asset tokens often need to verify KYC before letting a wallet hold the asset. Without this extension, you'd have to track approval off-chain and rely on every distribution path to check it. With the extension, the chain enforces the gate.

The **metadata** extension lets a mint carry name, symbol, and URI directly, removing the need for a separate account in the Metaplex Token Metadata program. The shape is simpler, the lookup is faster, and the cost is lower. For new projects starting on Token-2022, this is usually preferable to setting up a metadata account in another program. For existing tokens already using Metaplex, the cost of migration usually outweighs the simplification.

Extensions can stack. A single mint can carry a transfer fee, an interest-bearing rate, and metadata, all at once. The decision is per-extension at mint creation. Most extensions are immutable once set. Others let you change parameters later through a configured authority.

## Choosing between classic SPL and Token-2022

The decision rule is simpler than the menu of options suggests.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Choosing classic SPL Token vs Token-2022 for your mint</title><desc>A flowchart asks if your mint needs extensions like transfer fees, transfer hooks, interest-bearing balances, default-frozen accounts, or on-mint metadata. A yes answer points to Token-2022, a no answer points to classic SPL Token, and a checklist below reminds you to test DEX, wallet, indexer, and transfer hook support before shipping a Token-2022 mint.</desc>
  <defs>
    <marker id="arrS45cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Which program should your mint use?</text>
  <rect x="160" y="85" width="400" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="108" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Do you need one of these behaviors?</text>
  <text x="360" y="128" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">transfer fees, transfer hooks, interest-bearing,</text>
  <text x="360" y="142" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">default-frozen accounts, on-mint metadata</text>
  <line x1="220" y1="167" x2="220" y2="200" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS45cR)"/>
  <text x="180" y="190" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">yes</text>
  <line x1="500" y1="167" x2="500" y2="200" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS45cR)"/>
  <text x="510" y="190" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">no</text>
  <rect x="40" y="205" width="350" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="205" width="350" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="215" y="224" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Token-2022 is your only option</text>
  <text x="55" y="252" font-family="monospace" font-size="10" fill="#565653">enable just the extensions you need</text>
  <text x="55" y="268" font-family="monospace" font-size="10" fill="#565653">at mint creation. base behavior is</text>
  <text x="55" y="284" font-family="monospace" font-size="10" fill="#565653">identical to classic SPL.</text>
  <rect x="410" y="205" width="270" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="410" y="205" width="270" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="545" y="224" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Use classic SPL Token</text>
  <text x="425" y="252" font-family="monospace" font-size="10" fill="#565653">simpler, universally supported,</text>
  <text x="425" y="268" font-family="monospace" font-size="10" fill="#565653">battle-tested. the default for</text>
  <text x="425" y="284" font-family="monospace" font-size="10" fill="#565653">almost every new token.</text>
  <rect x="40" y="345" width="640" height="170" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="345" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="364" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">before shipping a Token-2022 mint, check this</text>
  <text x="60" y="392" font-family="monospace" font-size="10">→ does the major DEX you're targeting handle the extensions you picked?</text>
  <text x="60" y="412" font-family="monospace" font-size="10">→ does the wallet your users will use display Token-2022 balances correctly?</text>
  <text x="60" y="432" font-family="monospace" font-size="10">→ does your indexer or analytics pipeline decode Token-2022 accounts?</text>
  <text x="60" y="452" font-family="monospace" font-size="10">→ if you use transfer hooks, are downstream protocols ready to call them?</text>
  <text x="60" y="482" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">transfer fees and transfer hooks break naive integrations the most.</text>
  <text x="60" y="500" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">test against every system your token will touch.</text>
  <text x="360" y="555" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Pick Token-2022 for capability. Pick classic SPL for compatibility. Most projects pick the latter.</text>
</svg>

The ecosystem-support caveat deserves a paragraph of its own. Classic SPL Token has been the standard for years. Every wallet, every DEX, every aggregator, every indexer, every analytics dashboard assumes it. Token-2022 has been growing in support since 2023, but the picture is uneven. Most tools handle the base case: a Token-2022 mint with no extensions behaves identically to classic SPL, and most software gets that right. Extensions are where the breakage happens.

Transfer fees are the most common source of integration bugs because a transfer that withholds a fee changes the amount that lands at the destination. Naive code that says "send 100 USDC and assume 100 USDC arrives" breaks. Transfer hooks are the most disruptive because every program downstream of a hooked token needs to know how to invoke the hook with the right extra accounts, and many production protocols simply refuse hooked tokens to keep their integration surface small. Default-frozen accounts cause initialization flows to fail at the unfreeze step if the dApp doesn't know to wait. Interest-bearing balances confuse code that compares raw amounts versus display amounts inconsistently.

The solution is the same in all cases: test against every system your token is going to touch. If you're issuing a Token-2022 mint, verify the major wallets show it correctly, verify the DEXes you're targeting will list it, verify your own indexers decode the right fields. The capabilities are real and valuable. The compatibility cost is also real.

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

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut, token::mint = mint, token::authority = user)]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}
```

The `Interface<'info, TokenInterface>` accepts either the classic SPL Token Program or the Token-2022 program. The runtime resolves which one the mint belongs to and routes the CPI accordingly. Your handler doesn't need to branch.

A meaningful change in the API is that `token_interface` exposes `transfer_checked` rather than `transfer`. The "checked" version requires you to pass the mint and the expected decimals as part of the call, and the Token Program verifies the values match. This protects against bugs where the wrong mint or wrong decimals got plumbed through, and it's the recommended pattern for any new code regardless of which token program you're targeting. Classic SPL also has `transfer_checked`. The reason older code tends to use plain `transfer` is just historical inertia.

For a program author choosing between `token` and `token_interface`: pick `token_interface` for any new program that might encounter Token-2022 mints, which is most new programs. Pick `token` only if you're certain you'll never need to work with Token-2022, which usually means you're targeting a specific known mint that's classic SPL.

## The summary

Token-2022 is the same program with a feature-flag layer for behaviors classic SPL can't express. The conceptual model from your earlier work with classic SPL carries over directly. The new things are the extensions, the slightly different program ID, and the unified `token_interface` shim for writing programs that handle both. For most projects most of the time, classic SPL remains the right default. For projects that need a specific extension, Token-2022 is the only option, and the right next step is checking that the ecosystem support is sufficient before committing. Once you have deployed a mint under either program, the day-to-day operations of moving tokens around, signing as PDAs, creating ATAs, and burning supply, all work the same way.
