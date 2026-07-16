---
id: 138
title: What is ERC-20
type: lecture
order: 1
faq:
  - question: What does the decimals value on an ERC-20 token actually mean?
    answer: The EVM only handles whole integers, so tokens store balances as large
      integers and use `decimals` to know where the decimal point goes for
      display. The displayed amount is the stored amount divided by 10 to the
      power of `decimals`. Most tokens use 18, so one whole token is stored as 1
      followed by 18 zeros, but USDC uses 6 and WBTC uses 8. Because this
      varies, code that works with arbitrary tokens must read each token's
      `decimals()` rather than assuming 18.
  - question: Why does ERC-20 need both approve and transferFrom instead of just a
      transfer?
    answer: Smart contracts cannot start their own transactions; they can only react
      when called. So a contract like a decentralized exchange cannot reach into
      your wallet and take your tokens. Instead you call `approve` to authorize
      that contract to spend up to a certain amount, and the contract later
      calls `transferFrom` to actually move the tokens during the swap. This
      two-step approval is the only way to let one address spend tokens that
      belong to another.
  - question: Is it safe to lower an existing ERC-20 allowance?
    answer: Increasing an allowance is safe, but decreasing it has a known risk
      called the approval race condition. If you lower a spender's allowance,
      the spender can watch the pending transaction and quickly spend the old,
      larger amount before your change is mined, then spend the new amount
      afterward, taking more than you intended. The common workaround is to
      first set the allowance to zero, then set the new value in a second
      transaction, or to use EIP-2612 `permit` if the token supports it.
  - question: Why does an ERC-20 token contract emit a Transfer event from the zero
      address?
    answer: By convention, creating (minting) new tokens is represented as a
      `Transfer` event from `address(0)`, the zero address. Block explorers and
      indexers rely on this to display where a token's initial supply came from.
      If a token contract mints tokens without emitting this transfer, explorers
      will show no initial supply at all, even though the balances exist.
---

> You just built one. Now the conceptual frame. ERC-20 is the standard that defines what a fungible token contract looks like on Ethereum. Every common token you've heard of (USDC, DAI, UNI, LINK, WETH) implements the same six functions and two events you just wrote. This lesson covers what makes ERC-20 the standard, why standardization mattered for Ethereum's growth, what the `decimals` system actually means, what production implementations add beyond the bare spec, and the one security quirk in the standard you should know about before deploying anything to mainnet.

## What a token actually is

Tokens existed long before Ethereum. Casino chips. Arcade tokens you bought at the door to spend on machines. Loyalty points on a coffee shop card. Concert tickets. Theater tickets. Gift certificates. All of these are tokens. They represent value, they can be exchanged, and they're issued by some entity that defines what they're good for.

A token is not quite money. Its value depends on what someone is willing to accept it for. Casino chips have value because the casino will exchange them for currency. Arcade tokens have value because the machines accept them. Fan tokens for a sports club have value because the club uses them for voting on minor decisions, or because other fans want them.

The pattern works because the issuer commits to a meaning for the token, and other parties accept that meaning. A token without an issuer who stands behind it is worth nothing. A token whose issuer has a credible commitment to redeem it for something is worth roughly what it can be redeemed for.

On Ethereum, the issuer is a smart contract. The contract decides who has how many tokens, who can transfer them, and what they represent. The contract you wrote in the last task is exactly this: an issuer that tracks balances and lets holders move tokens around.

## Fungible and non-fungible

Two casino chips of the same denomination are interchangeable. If you have one and your friend has one, and you swap them, nothing has changed. They have the same purchasing power, the same physical form, the same value. This property is called **fungibility**. Two units of a fungible thing are equivalent.

Now consider rare coins. Most one-euro coins are fungible: each is worth one euro, you swap them, nothing changes. But a rare collector's edition one-euro coin from a limited mint run might be worth fifty euros because of its rarity. The face value is one euro, but the coin itself has an identity that makes it different from other one-euro coins. This is **non-fungible**: each unit has its own identity and can't be substituted for another.

ERC-20 is the standard for **fungible** tokens. Every unit is identical to every other unit. If you hold 100 ACAD tokens, those 100 units are interchangeable with any other 100 units anywhere else. Token #47 and token #48 don't exist as concepts. There are just balances.

The non-fungible counterpart is ERC-721. ERC-721 is what NFTs use: each token has a unique ID, and a contract tracks who owns which specific ID. The two standards have different shapes for fundamentally different use cases.

## Why a standard exists at all

Imagine Ethereum without ERC-20. Someone deploys a token contract. It has functions to track balances and transfer tokens, but the function names and parameter orders are whatever the developer chose. Maybe their `transfer` function takes the amount before the recipient address. Maybe their balance lookup is called `getBalance` instead of `balanceOf`. Maybe they don't emit events at all.

Now you want to build a wallet that displays token balances. Every token contract works differently, so your wallet needs custom code for each one. Every time a new token launches, your wallet needs an update to support it. A new exchange listing a new token needs new integration work for every wallet that wants to display it. Building anything on top of tokens is very hard because there's no shared vocabulary.

ERC-20 fixes this by defining an interface. Any contract that implements these six functions and emits these two events is an ERC-20 token. Any wallet that knows ERC-20 can interact with any ERC-20 token without further work. Any exchange that knows ERC-20 can list any ERC-20 token without writing token-specific code. The standard turned tokens from custom integrations into a commodity, which is exactly what made Ethereum's token ecosystem possible.

The number 20 comes from EIP-20, which is the formal specification document on Ethereum's improvement proposal site. ERC stands for "Ethereum Request for Comments," historically the section of EIPs dealing with application-layer standards. Today the names are used interchangeably. The token standard is EIP-20 to the spec writers and ERC-20 to everyone else.

## The interface

You implemented this in the last task. As a quick reference:

```solidity
// Solidity 0.8.24, Ethereum mainnet
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
```

Three of these handle direct holder actions: `transfer` moves tokens from the caller, `approve` authorizes a third party to spend on the caller's behalf, `transferFrom` is how that third party then spends. Two are view functions for querying state: `balanceOf` and `allowance`. One reports total supply.

The two events tell off-chain observers what happened. `Transfer` fires whenever tokens move. `Approval` fires whenever someone changes an allowance. Wallets and indexers read these events to build their view of the world without needing to query storage directly.

Three things about this interface are worth noting.

First, every state-mutating function returns `bool`. The spec inherits this from a time when reverting was less common in Solidity. A modern implementation reverts on failure and returns `true` on success, but the return type stays for backward compatibility.

Second, `transferFrom` exists because contracts can't initiate transactions, only respond to them. If a DEX wants to swap your tokens for ETH, it can't reach into your wallet and take them. Instead, you call `approve` to authorize the DEX, the DEX then calls `transferFrom` during the swap. The two-step process is the only way to let one contract move tokens that belong to another address.

Third, the `Transfer` event from `address(0)` represents minting. By convention, when a token contract creates new tokens, it emits a transfer from the zero address. Block explorers and indexers use this to display the initial supply distribution. Forget this transfer when minting, and block explorers will show no initial supply at all.

## Decimals and the integer-only world

The EVM has no floating-point arithmetic. Everything is integers. A contract storing balances can't represent "0.5 tokens" the way Python would. It can only store integer values.

ERC-20 handles this with a convention: tokens have a `decimals` value, and the displayed amount is the stored amount divided by `10**decimals`. By tradition, this value is 18, which matches the wei-to-ether ratio on Ethereum itself. One whole token is `1 * 10**18` raw units. Half a token is `0.5 * 10**18 = 5 * 10**17` raw units.

The contract only ever sees the raw integer. When a wallet displays "100 ACAD," it's showing you `100_000_000_000_000_000_000` divided by `10**18`. When you type "0.5" in a transfer field, the wallet multiplies by `10**18` before sending the transaction. The contract works in the raw units the whole time, oblivious to the display layer.

This is why your contract returns `1000 * 10**18` from `totalSupply` even though you'd think of it as "1000 tokens." The raw value in storage is one followed by 21 zeros. The display value is `1000`. Both are correct. They describe the same balance at different layers.

Some tokens use different decimals values. USDC uses 6, so one USDC is `10**6` raw units. WBTC uses 8, matching Bitcoin's satoshi denomination. The 18-decimals convention isn't universal, but it's what wallets default to and what almost all new tokens follow. Picking a non-standard value means every interface needs to handle your token specifically, which is exactly what the standard was meant to avoid.

A consequence worth internalizing: when you write code that interacts with arbitrary ERC-20 tokens, you cannot assume 18 decimals. You read the `decimals()` function and scale accordingly. Production contracts that hardcode 18 will misbehave with USDC.

## What OpenZeppelin adds beyond the bare standard

The contract you wrote implements EIP-20 correctly. It's deployable. It would work in any wallet that understands ERC-20. So what does OpenZeppelin's implementation do that yours doesn't?

A few things, and they're worth understanding even if you never use OpenZeppelin directly.

**Custom errors with structured data.** Where your contract probably uses `require` strings or simple custom errors, OpenZeppelin's errors carry the values that caused the failure: `ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)`. A frontend reading the revert data sees exactly how much was short, which makes debugging dramatically easier.

**A unified ****`_update`**** internal function.** OpenZeppelin factors transfer, mint, and burn into a single internal function that handles balance changes, total supply tracking, and event emission. Mint is "transfer from `address(0)`," burn is "transfer to `address(0)`," and regular transfers are both addresses being non-zero. The single helper means there's only one place to audit and only one place to add functionality.

**Hooks for extension.** Contracts that inherit from OpenZeppelin's `ERC20` can override `_update` to add behavior before or after every balance change: pausing, blacklisting, fee-on-transfer, tax mechanisms. The base contract calls these hooks at well-defined points, and extension contracts plug into those points without rewriting the core logic.

**The infinite-allowance optimization.** When a holder sets allowance to `type(uint256).max`, OpenZeppelin's `transferFrom` recognizes this as "approve forever" and skips the allowance decrement, saving gas on every transfer. This is the standard pattern that most wallets use for "approve" buttons today.

**Defensive checks against zero addresses.** OpenZeppelin reverts on transfers to or from `address(0)` in places the bare standard doesn't strictly require. This prevents accidental token burns and helps users avoid losing tokens to typos.

None of this is required by EIP-20. Your bare implementation is conformant. But these additions are what production token contracts include, and they're the reason most projects inherit from OpenZeppelin rather than writing their own.

## The approval race condition

ERC-20 has one well-known design flaw, and it's worth understanding before you deploy anything.

Suppose Alice has approved Bob to spend 100 ACAD. She changes her mind and wants to reduce his allowance to 50. She calls `approve(bob, 50)`. The transaction enters the mempool.

Before the transaction is mined, Bob sees it pending. He front-runs Alice by calling `transferFrom(alice, bob, 100)` with a higher gas price. His transaction mines first. He receives 100 tokens. Then Alice's `approve(bob, 50)` mines, setting his allowance to 50. He then calls `transferFrom(alice, bob, 50)` and receives 50 more.

Bob ended up with 150 tokens when Alice intended to allow only 50 in total.

The flaw is structural. The `approve` function overwrites the allowance, but there's no way to atomically transition from "old value" to "new value" while ensuring the old value isn't used in between. The standard pattern for working around this is to first approve zero, then approve the new amount in a second transaction. This forces the spender to either use the original allowance fully before the zero, or be left with nothing. But it requires two transactions and two gas payments for every allowance change.

EIP-2612 (`permit`) provides a more elegant solution by replacing approvals with cryptographic signatures. It's a separate standard layered on top of ERC-20 and is its own topic.

For now: be aware that increasing an allowance is safe, decreasing it is not, and any frontend that lets users change allowances should either zero-out first or use `permit` if the token supports it.

## Where ERC-20 fits in the wider ecosystem

ERC-20 is the foundation of Ethereum's token economy, but it's not the only standard. A brief preview of what builds on or around it.

**ERC-721**, the non-fungible standard introduced earlier, has a different interface shape: instead of `balanceOf(owner)` returning a token count, you have `ownerOf(tokenId)` returning the address that owns a specific ID. The spirit is the same as ERC-20, though, in that the standardization is what lets wallets and marketplaces integrate any compliant token.

**ERC-1155** is a hybrid standard that supports both fungible and non-fungible tokens in a single contract. Game economies use it heavily: gold pieces are fungible, but each rare sword has its own ID. ERC-1155 is more gas-efficient for these mixed cases than running separate ERC-20 and ERC-721 contracts.

**EIP-2612 (****`permit`****)** adds a function to ERC-20 tokens that lets users approve spending via a signed message instead of an on-chain transaction. USDC, DAI, and most modern tokens implement it; older tokens like WETH do not.

**ERC-4626** is the standard for tokenized vaults. A vault that takes ERC-20 deposits and issues shares as ERC-20 tokens itself, used by DeFi protocols like Aave, Yearn, and Morpho. Built on top of ERC-20 rather than replacing it.

Each of these is a substantial topic in its own right. The point for now is that ERC-20 is the foundation. Understanding it is the prerequisite for everything else.

## Further reading

The official [EIP-20 specification](https://eips.ethereum.org/EIPS/eip-20) is short and worth reading in full once you've implemented a token. The [OpenZeppelin ERC20 source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol) is the production reference implementation. Compare it to your own to see the patterns described in this lesson. For the approval race condition history, the original [issue thread](https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729) on the EIP-20 repository documents the discovery and the failed attempts to fix it within the standard itself.
