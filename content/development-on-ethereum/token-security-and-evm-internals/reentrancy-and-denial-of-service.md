---
id: 140
title: Reentrancy and denial-of-service
type: lecture
order: 3
faq:
  - question: How does an attacker withdraw more than they deposited?
    answer: >-
      Reentrancy. If `withdraw` sends ETH before zeroing the caller's recorded balance, and the
      caller is a contract, the transfer triggers its `receive()`, which calls `withdraw` again
      while the balance still reads the full amount. The loop repeats until the contract is
      empty. This drained about $60M from The DAO in June 2016.
  - question: What order should a function that sends ETH follow?
    answer: >-
      Checks, effects, interactions. Validate inputs and permissions, then write every state
      change your own contract needs, and make the external call last. A callback then finds
      the operation already finished. A `nonReentrant` guard on top gives defense in depth.
  - question: Can one user block a payout for everyone else?
    answer: >-
      Yes, when the payout loops over recipients and reverts everything if one transfer fails.
      That is a denial-of-service. A contract whose `receive()` always reverts sits in the
      list and rolls the batch back every time. Use pull over push: record what each address
      is owed and let each one claim it.
  - question: Does a nonReentrant modifier on one function protect the rest?
    answer: >-
      No. A lock on one function does not stop a callback entering a different unguarded
      function that touches the same state. OpenZeppelin's `ReentrancyGuard` shares one lock
      across every `nonReentrant` function.
  - question: Is requiring tx.origin == msg.sender a real defense?
    answer: >-
      Barely. It forces the caller to be an externally owned account, blocking the simple
      attack contracts along with every multisig and smart-contract wallet. ERC-4337 account
      abstraction makes that worse each year. Real protection is checks-effects-interactions
      plus a reentrancy guard.
---

> You just fixed two bugs in a Vault contract. Eva drained the vault by calling `withdraw` again before the first call had finished, and John blocked the admin's emergency refund just by sitting in the depositors list.

## An external call runs the receiver's code before your function finishes

A contract calls into another contract. Normally the called contract returns and execution continues in the first contract. But the called contract runs arbitrary code: it can do anything before returning, including calling back into the first contract. Calling back in this way is called **reentrancy**. If the first contract hasn't finished updating its own state before the external call, the callback observes inconsistent state and can exploit it.

This is what Eva did. Here's the vulnerable `withdraw` from the Vault you just fixed:

```solidity
// Solidity 0.8.24, Ethereum mainnet
function withdraw() external {
    uint256 amount = balances[msg.sender];

    (bool ok, ) = msg.sender.call{value: amount}("");
    if (!ok) revert TransferFailed();

    balances[msg.sender] = 0;

    emit Withdrawn(msg.sender, amount);
}
```

The function looks reasonable. Read the depositor's balance, send them their ETH, zero out their entry to prevent double-withdrawals. The bug is the order of those last two steps.

The line `msg.sender.call{value: amount}("")` transfers ETH. If `msg.sender` is a regular wallet, the ETH arrives and execution returns to the next line. But if `msg.sender` is a contract, the ETH transfer triggers that contract's `receive()` function, and at that moment the line `balances[msg.sender] = 0;` has not yet executed.

## Eva withdraws again while her balance still shows the deposit

Eva is a contract whose `receive()` calls back into the vault:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Eva {
    receive() external payable {
        if (attacking && address(vault).balance >= depositAmount) {
            vault.withdraw();
        }
    }
}
```

First, Eva deposits 1 ETH into the vault legitimately. The vault now records `balances[eva] = 1 ether`.

Second, Eva sets her `attacking` flag and calls `vault.withdraw()`. The vault reads Eva's balance, sees 1 ether, then transfers 1 ETH to Eva via the low-level call. The transfer triggers Eva's `receive()`.

Third, Eva's `receive()` checks if the vault still has at least 1 ETH. It does, so `receive()` calls `vault.withdraw()` again. The vault reads `balances[eva]`, which is still 1 ether because the original `withdraw` call hasn't reached the zero-out line yet. The vault transfers another 1 ETH, and Eva's `receive()` triggers again. The recursion continues until the vault is drained.

When the vault's balance finally drops below 1 ETH, `receive()` returns without re-entering, and the recursion unwinds. Each layer finally executes `balances[msg.sender] = 0;`, but at that point the vault is empty. Eva has extracted the entire vault balance for a single 1 ETH deposit.

## The same order of operations drained The DAO

This attack pattern destroyed The DAO in June 2016, the largest crowdfunded project in Ethereum's early history. The DAO was a decentralized investment fund holding around $150M in ETH at the time, contributed by thousands of investors. Its withdrawal function had the same reentrancy bug: it sent ETH before zeroing out the investor's balance. An attacker exploited it on June 17, 2016, draining about $60M worth of ETH. The [history lesson](/courses/development-on-ethereum/welcome-to-ethereum/where-ethereum-came-from) covers the hard fork that followed.

## Updating state before the call leaves the callback nothing to take

The simplest fix is to reorder the function so state updates happen before the external call.

```solidity
function withdraw() external {
    uint256 amount = balances[msg.sender];

    balances[msg.sender] = 0;

    (bool ok, ) = msg.sender.call{value: amount}("");
    if (!ok) revert TransferFailed();

    emit Withdrawn(msg.sender, amount);
}
```

If your fix moved the balance zero-out above the external call, this is what you did. The depositor's recorded balance is cleared BEFORE the ETH transfer. When Eva re-enters via `receive`, the inner `withdraw` call reads `balances[eva] = 0` and sends Eva zero ETH. That call still runs her `receive`, which re-enters again, and the nesting goes on until a call deep in the chain runs out of gas. The failure unwinds through every `withdraw` in the chain, so Eva's whole transaction reverts and her 1 ETH stays in the vault.

This pattern has a name: **checks-effects-interactions**. The order of operations in any function that makes external calls should be:

1. **Checks.** Validate inputs and authorization.
2. **Effects.** Update the contract's own state. All storage writes happen here.
3. **Interactions.** Call out to other contracts or send ETH.

By the time an external call happens, all the state relevant to the callback has already been updated to reflect the operation as complete. This is the cheapest defense, because it only reorders lines and adds no gas, and it should be the default everywhere you make external calls.

## A lock rejects any re-entry into the function

Some functions are complex enough that the right ordering isn't obvious. A reentrancy guard is a backup mechanism that blocks any re-entry into a guarded function, regardless of state.

The pattern uses a lock variable that tracks whether the function is currently executing:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Vault {
    mapping(address => uint256) public balances;
    bool private locked;

    error Reentrant();

    modifier nonReentrant() {
        if (locked) revert Reentrant();
        locked = true;
        _;
        locked = false;
    }

    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        balances[msg.sender] = 0;
    }
}
```

A modifier like `nonReentrant` is the other fix you may have written. The first call to `withdraw` sets `locked = true` and runs the function body. If the body triggers a callback that tries to re-enter `withdraw`, the modifier hits `if (locked) revert` and the re-entry reverts. When the original call finishes, `locked` is set back to `false`. The lock costs two storage writes on every call, one to set it and one to clear it.

OpenZeppelin's `ReentrancyGuard` is the production-quality version of this. It uses a `uint256` instead of a `bool` for gas efficiency, since the storage slot transitions are cheaper, and exposes the modifier as `nonReentrant`. Most production contracts that hold value inherit from it.

## A lock on one function leaves the stale balance usable everywhere else

The guarded `withdraw` above still sends ETH before it zeroes the balance. The lock stops Eva from entering `withdraw` again, but while her `receive` runs, the vault has already paid her 1 ETH and `balances[eva]` still says 1 ether. She can use that stale balance in two ways without entering `withdraw`.

**Cross-function reentrancy** re-enters a different function in the same contract. Suppose the Vault also has `moveBalance`, which moves part of a depositor's recorded balance to another address:

```solidity
function moveBalance(address to, uint256 amount) external {
    balances[msg.sender] -= amount;
    balances[to] += amount;
}
```

It sends no ETH, so it is easy to leave without a guard. In her `receive`, Eva calls `moveBalance` and moves her 1 ether to a second address she controls. `withdraw` then finishes and zeroes Eva's entry, which is already zero. The second address then withdraws another 1 ETH against the same deposit, so Eva has taken 2 ETH for a 1 ETH deposit, and the second one belonged to other depositors. The fix is to apply the guard to every function that touches the same state. With `nonReentrant` on `moveBalance` as well, Eva's call to it from `receive` reverts, her `receive` reverts with it, and `withdraw` reverts with `TransferFailed`. OpenZeppelin's `ReentrancyGuard` uses a single shared lock across all `nonReentrant` functions, so any guarded function blocks re-entry into any other guarded function in the same contract.

**Read-only reentrancy** goes through a view function. In her `receive`, Eva calls another protocol that reads her balance from the vault and uses that value to make a decision. That protocol sees 1 ether for ETH that has already left. The view function doesn't change anything, so `nonReentrant` on it would be unusual. Several DeFi protocols were exploited through this in 2022. The defense is to either avoid making external calls when state is inconsistent, which is what checks-effects-interactions enforces, or to apply guards more broadly, including on view functions that read state used during transitions.

Most reentrancy bugs in production today are of the cross-function or read-only variety. The classic same-function pattern is well known enough that fresh code rarely has it. So use both defenses together. Reentrancy guards catch cases where checks-effects-interactions was missed, and the ordering discipline means you never have to depend on the guards alone.

## One recipient that rejects ETH reverts the refund for everyone

John attacked `emergencyRefundAll`, the vault's emergency refund:

```solidity
function emergencyRefundAll() external onlyOwner {
    for (uint256 i = 0; i < depositors.length; i++) {
        address user = depositors[i];
        uint256 amount = balances[user];

        if (amount == 0) continue;

        balances[user] = 0;

        (bool ok, ) = user.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit EmergencyRefund(user, amount);
    }
}
```

The bug is `if (!ok) revert TransferFailed();`. If any single transfer fails, the entire function reverts. Every refund that happened in previous iterations gets rolled back along with the failed one. Reverting on a failed transfer is correct in a function that pays one address. In a loop over many addresses, it lets any one of them cancel the payments to all the others.

John is a contract whose `receive()` function deliberately reverts:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract John {
    receive() external payable {
        revert("not accepting");
    }
}
```

John deposits a small amount through his contract. The vault now has John's address in its `depositors` array. When the admin calls `emergencyRefundAll`, the loop eventually reaches John, tries to send him ETH, John's `receive` reverts, the `if (!ok)` check triggers, and the entire transaction is rolled back.

No matter how many times the admin calls `emergencyRefundAll`, it always reverts when it reaches John, so honest depositors can never get their refunds via the emergency path. John doesn't gain anything financially. He denies everyone else the use of the function, which is why this is called a **denial-of-service** attack. The same attack blocks auction settlement and distribution of rewards in contracts that pay out in a loop.

## Skipping the failed transfer is not enough

The first thing to try is to catch the failure and continue where the loop used to revert:

```solidity
        (bool ok, ) = user.call{value: amount}("");
        if (!ok) {
            pendingRefunds[user] = amount;
        } else {
            emit EmergencyRefund(user, amount);
        }
```

Some fixes for the task replaced `if (!ok) revert` with logic like this. When a transfer fails, the function records the amount in a `pendingRefunds` mapping, from which the user can claim it later through a separate function (the next section shows both), and the loop continues with the remaining users. A `receive` that reverts can no longer block anyone else.

A `receive` that burns gas still can, because `call` forwards all but 1/64 of the remaining gas to the recipient. If John's `receive` uses it up where it used to revert, the loop is left with 1/64 of the gas it had, which may not be enough to finish the loop, and then the whole refund reverts. The [low-level calls lesson](/courses/development-on-ethereum/token-security-and-evm-internals/low-level-calls) covers how much gas each way of sending ETH forwards. The loop also still makes one external call per depositor, so deposits from enough addresses push it past the block gas limit, as in the [loops and hashing lesson](/courses/development-on-ethereum/solidity-basics/loops-and-hashing).

## Pull over push takes the external call out of the loop

The right design avoids loops that send value to many recipients. Instead, record what each user is owed and let them claim it themselves:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Vault {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public pendingRefunds;

    function emergencyRefundAll() external onlyOwner {
        for (uint256 i = 0; i < depositors.length; i++) {
            address user = depositors[i];
            uint256 amount = balances[user];

            if (amount == 0) continue;

            balances[user] = 0;
            pendingRefunds[user] = amount;

            emit EmergencyRefund(user, amount);
        }
    }

    function claimRefund() external {
        uint256 amount = pendingRefunds[msg.sender];
        if (amount == 0) revert NothingToClaim();

        pendingRefunds[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
```

If your fix restructured `emergencyRefundAll` to mark balances claimable and added a separate `claimRefund` function, this is what you did. The vault never tries to push ETH to anyone during the batch. It marks each user's owed amount internally, and users call `claimRefund` to pull their own funds. John's malicious `receive` only blocks John from claiming, and everyone else can claim normally.

This is the same pull-over-push pattern that came up in the [loops and hashing lesson](/courses/development-on-ethereum/solidity-basics/loops-and-hashing). It applies any time a contract needs to distribute value to many recipients. The work moves from the contract to the recipients: each depositor sends their own transaction and pays its gas, and a depositor who never calls `claimRefund` never receives the refund.

The batch above still loops over every depositor to fill `pendingRefunds`, so a long enough `depositors` array still pushes it past the block gas limit. The loop adds nothing that `balances` did not already record. `withdraw` already lets each depositor take their own balance, so the refund needs no batch at all.

## Banning contract callers also blocks legitimate users

You'll sometimes see contracts try to prevent attacks by requiring that the caller be an externally owned account rather than a contract:

```solidity
require(tx.origin == msg.sender, "no contracts allowed");
```

`tx.origin` is the address that signed the original transaction. `msg.sender` is whoever's currently calling. If they're the same, the caller must be an EOA, because contracts are never the original signer.

This prevents the simple attack patterns shown in this lesson, because Eva and John both needed to be contracts in order to have malicious `receive` functions.

But legitimate users who want to interact with your contract through a multisig or a smart wallet are also blocked, because multisigs and smart wallets are contracts. Account abstraction (ERC-4337) makes this restriction much more user-hostile: more and more wallets are themselves contracts, and many users have no EOA at all.

The check is also bypassable. Since EIP-7702, an EOA can run contract code at its own address, so an account that passes the check can still have a `receive` function like Eva's. The [account abstraction lesson](/courses/development-on-ethereum/advanced-defi/account-abstraction) covers EIP-7702.

`tx.origin == msg.sender` catches the most obvious attacks at the cost of blocking some legitimate users. Defense should rely on checks-effects-interactions and reentrancy guards as the primary protection.

## Check every external call and every loop that pays

For every external call in your contract, ask what the called code would see if it read your contract's state at that moment, through any function or view. If it would see a value that is about to change, move the change above the call. For every loop that sends value, ask what happens to the other recipients if one of them reverts or burns the gas.
