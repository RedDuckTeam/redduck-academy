---
id: 138
title: What is ERC-20
type: lecture
order: 1
faq:
  - question: My wallet shows 1000 tokens but totalSupply returns a huge number. Why?
    answer: >-
      Balances are stored as integers, and the ERC-20 `decimals` value says where the display
      point sits. 1000 tokens at 18 decimals is stored as 1000 * 10**18. Most tokens use 18,
      USDC uses 6, WBTC uses 8. Code that handles arbitrary tokens reads `decimals()` instead
      of assuming 18.
  - question: Why can't a DEX just take my tokens directly?
    answer: >-
      Contracts cannot start their own transactions, so a DEX cannot reach into your wallet.
      You `approve` a spender for an amount, and the spender calls `transferFrom` to move the
      tokens when the swap runs.
  - question: Is it safe to lower an allowance I already gave?
    answer: >-
      Not directly. This is the approval race condition. A spender who sees your `approve`
      pending can spend the old, larger allowance first, then the new amount once it lands.
      Zero the allowance first, then set the new value, or use EIP-2612 `permit`.
  - question: Why does my token emit a Transfer from address(0)?
    answer: >-
      Minting. Creating tokens is emitted as a `Transfer` from `address(0)`, and explorers read
      that to show a token's initial supply. Skip it and the supply exists but no explorer
      shows it.
  - question: What does approving type(uint256).max do?
    answer: >-
      It sets an unlimited allowance. OpenZeppelin's `transferFrom` treats `type(uint256).max`
      as approve forever and skips the allowance write, which saves gas on every transfer.
---

> ERC-20 fixes the interface of a fungible token (one where every unit is interchangeable with any other), so a wallet or an exchange can work with any token without token-specific code. A contract that accepts tokens depends on more than the interface: how many decimals the token has, what its transfer does besides moving a balance, and what happens when an allowance changes.

## One interface replaced per-token integration

On Ethereum, a token is a smart contract. The contract decides who has how many tokens and who can transfer them.

Imagine Ethereum without ERC-20. Someone deploys a token contract. It has functions to track balances and transfer tokens, but the function names and parameter orders are whatever the developer chose. Their `transfer` function might take the amount before the recipient address, their balance lookup might be called `getBalance` instead of `balanceOf`, and they might not emit events at all. A wallet that displays token balances then needs custom code for each token, and an update every time a new token launches.

ERC-20 fixes this by defining an interface, the one you implemented in the [Academy token task](/courses/development-on-ethereum/solidity-basics/academy-token):

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

Any contract that implements these six functions and emits these two events is an ERC-20 token, and any wallet or exchange that knows ERC-20 can work with it without token-specific code.

## Why the interface has events, a `bool` return, and `transferFrom`

The two events tell off-chain observers what happened: `Transfer` fires whenever tokens move, and `Approval` fires whenever someone changes an allowance. Wallets and indexers read these events to build their view of the world without needing to query storage directly.

The `Transfer` event from `address(0)` represents minting. By convention, when a token contract creates new tokens, it emits a transfer from the zero address. Block explorers and indexers use this to display the initial supply distribution. Forget this transfer when minting, and block explorers will show no initial supply at all.

Every state-mutating function returns `bool`. The spec inherits this from a time when reverting was less common in Solidity. A modern implementation reverts on failure and returns `true` on success, but the return type stays for backward compatibility. So a contract that calls a token it did not write cannot assume that a failed transfer reverts, and has to check the returned value.

`transferFrom` exists because contracts can't initiate transactions, only respond to them. If a DEX wants to swap your tokens for ETH, it can't reach into your wallet and take them. Instead, you call `approve` to authorize the DEX, the DEX then calls `transferFrom` during the swap. The two-step process is the only way to let one contract move tokens that belong to another address.

## Balances are integers, and `decimals` is not always 18

The EVM has no floating-point arithmetic, so a contract can only store integer balances. ERC-20 handles this with a convention: tokens have a `decimals` value, and the displayed amount is the stored amount divided by `10**decimals`. By tradition, this value is 18, which matches the wei-to-ether ratio on Ethereum itself. So your contract returns `1000 * 10**18` from `totalSupply` even though you'd think of it as 1000 tokens. When you type 0.5 in a transfer field, the wallet multiplies by `10**18` before sending the transaction.

Some tokens use different decimals values. USDC uses 6, so one USDC is `10**6` raw units. WBTC uses 8, matching Bitcoin's satoshi denomination. So when you write code that interacts with arbitrary ERC-20 tokens, you cannot assume 18 decimals. You read the `decimals()` function and scale accordingly. A contract that hardcodes 18 reads one USDC, stored as `10**6`, as one trillionth of a token.

## A token can implement the interface and still behave differently from yours

The contract you wrote implements ERC-20 correctly, and it would work in any wallet that understands the standard. Most projects don't write their own token. They inherit from OpenZeppelin's `ERC20`, which factors transfer, mint, and burn into a single internal function, `_update`, that handles balance changes, total supply tracking, and event emission. A contract that inherits from it can override `_update` to add behavior before or after every balance change: pausing, blacklisting, fee-on-transfer, tax mechanisms.

None of these additions shows in the interface, so a contract that accepts arbitrary tokens has to expect them. A `transfer` can revert because the token is paused or the address is blacklisted. With a fee on transfer, the recipient gets less than the amount the sender passed, so a contract that credits a depositor with the `amount` argument records more than it received.

OpenZeppelin's `transferFrom` also treats an allowance of `type(uint256).max` as unlimited and skips the allowance decrement, saving gas on every transfer. This is the standard pattern that most wallets use for "approve" buttons today. The price is that the spender can move the holder's whole balance of that token at any time, so a vulnerability in the spender contract drains all of it. The [gasless approvals lesson](/courses/development-on-ethereum/advanced-defi/gasless-approvals) comes back to this with EIP-2612 `permit`, which sets an allowance from a signed message instead of an `approve` transaction.

## Changing an allowance lets the spender use the old value and the new one

ERC-20 has one well-known design flaw. Suppose Alice has approved Bob to spend 100 ACAD. She changes her mind and wants to reduce his allowance to 50, so she calls `approve(bob, 50)`, and the transaction enters the mempool.

Before the transaction is mined, Bob sees it pending. He front-runs Alice by calling `transferFrom(alice, bob, 100)` with a higher gas price. His transaction mines first, and he receives 100 tokens. Then Alice's `approve(bob, 50)` mines, setting his allowance to 50. He then calls `transferFrom(alice, bob, 50)` and receives 50 more. Bob ended up with 150 tokens when Alice intended to allow only 50 in total.

The `approve` function overwrites the allowance, and there's no way to move from the old value to the new value while ensuring the old value isn't used in between. Raising an allowance has the same race: if Alice changes 100 to 150 and Bob spends the old 100 first, he ends up with 250.

The standard pattern for working around this is to first approve zero, then approve the new amount in a second transaction. Zeroing does not stop Bob from spending the old 100 before the zero is mined. What it gives Alice is a moment when the allowance is zero, so she can check how much Bob has already taken before she sends the second `approve`. If she sends both transactions without checking, Bob spends 100 before the first and 50 after the second, and ends up with the same 150. So every allowance change costs two transactions, two gas payments, and a check between them.

## Check a contract that accepts any token

Before your contract accepts a token it did not deploy, ask three questions. What does it compute if `decimals()` returns 6 and not 18? What does it record if the token takes a fee and less arrives than was sent? What happens to its users if a transfer reverts because the token is paused, or returns `false` where your own token would revert?

## Further reading

The official [EIP-20 specification](https://eips.ethereum.org/EIPS/eip-20) is short and worth reading in full once you've implemented a token. The [OpenZeppelin ERC20 source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol) is the production reference implementation, and you can now compare it to your own. For the approval race condition history, the original [issue thread](https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729) on the EIP-20 repository documents the discovery and the failed attempts to fix it within the standard itself.
