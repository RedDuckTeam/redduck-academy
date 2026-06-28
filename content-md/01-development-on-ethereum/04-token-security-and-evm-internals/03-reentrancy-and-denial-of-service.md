# Reentrancy and denial-of-service

_type: lecture_

> You just spent time wrestling with two bugs in a Vault contract. Eva drained the vault by doing something clever during withdraw. John blocked the admin's emergency refund just by sitting in the depositors list. This lesson explains what those attacks actually are, why they work, and why your fixes worked. The patterns are old, well-known, and still cause real losses in production every year. Every smart contract developer needs to recognize them by sight.

## What reentrancy is

A contract calls into another contract. The second contract responds. Normally the response returns and execution continues in the first contract. But the response is arbitrary code: it can do anything before returning, including calling back into the first contract. If the first contract hasn't finished updating its own state before the external call, the callback observes inconsistent state and can exploit it.

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

The line `msg.sender.call{value: amount}("")` transfers ETH. If `msg.sender` is a regular wallet, the ETH arrives and execution returns to the next line. But if `msg.sender` is a contract, the ETH transfer triggers that contract's `receive()` function, which can run arbitrary code before returning. Crucially, at the moment `receive()` runs, the line `balances[msg.sender] = 0;` has not yet executed. The depositor's recorded balance is still the original amount.

## How Eva exploited this

Eva is a contract that looks something like this:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Eva {
    IVault public vault;
    uint256 public depositAmount;
    bool public attacking;

    function deposit() external payable {
        depositAmount = msg.value;
        vault.deposit{value: msg.value}();
    }

    function startAttack() external {
        attacking = true;
        vault.withdraw();
        attacking = false;
    }

    receive() external payable {
        if (attacking && address(vault).balance >= depositAmount) {
            vault.withdraw();
        }
    }
}
```

The attack runs in three steps.

First, Eva deposits 1 ETH into the vault legitimately. The vault now records `balances[eva] = 1 ether`.

Second, Eva calls `startAttack`, which calls `vault.withdraw()`. The vault reads Eva's balance, sees 1 ether, then transfers 1 ETH to Eva via the low-level call. The transfer triggers Eva's `receive()`.

Third, Eva's `receive()` checks if the vault still has at least 1 ETH. It does. So `receive()` calls `vault.withdraw()` again. The vault reads `balances[eva]`, which is still 1 ether because the original `withdraw` call hasn't reached the zero-out line yet. The vault transfers another 1 ETH. Eva's `receive()` triggers again. The recursion continues until the vault is drained.

When the vault's balance finally drops below 1 ETH, `receive()` returns without re-entering. The recursion unwinds. Each layer finally executes `balances[msg.sender] = 0;`, but at that point the vault is empty. Eva has extracted the entire vault balance for a single 1 ETH deposit.

## The DAO hack

This attack pattern destroyed The DAO in June 2016, the largest crowdfunded project in Ethereum's early history. The DAO was a decentralized investment fund holding around $150M in ETH at the time, contributed by thousands of investors. Its withdrawal function had exactly this reentrancy bug: it sent ETH before zeroing out the investor's balance.

An attacker exploited it on June 17, 2016, draining about $60M worth of ETH over several hours. The recursive nature of the attack meant the attacker had to do almost nothing once it started: each call into `receive` triggered another withdrawal automatically.

The aftermath split Ethereum permanently. The community voted to perform a hard fork that reversed the attack, returning the stolen ETH to investors. A minority disagreed, arguing that the chain's history shouldn't be edited regardless of the circumstances. They continued mining the original chain, which became Ethereum Classic (ETC). The fork happened on July 20, 2016. Today's Ethereum is the version with the rolled-back transactions, and ETC is the version that preserved them.

The DAO hack is the most important security incident in Ethereum's history. Every developer should know it, both as a technical case study and as the event that defined Ethereum's social contract about immutability.

## Defense 1: checks-effects-interactions

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

If your fix moved the balance zero-out above the external call, this is what you did. The depositor's recorded balance is cleared BEFORE the ETH transfer. When Eva re-enters via `receive`, the inner `withdraw` call reads `balances[eva] = 0`, sends Eva zero ETH, and returns. There's nothing left for Eva to drain. Her recursion still runs, but each re-entry finds an empty balance and accomplishes nothing.

This pattern has a name: **checks-effects-interactions**. The order of operations in any function that makes external calls should be:

1. **Checks.** Validate inputs and authorization.
2. **Effects.** Update the contract's own state. All storage writes happen here.
3. **Interactions.** Call out to other contracts or send ETH.

If you follow this order religiously, reentrancy through your own state becomes impossible. By the time an external call happens, all the state relevant to the callback has already been updated to reflect the operation as complete.

This is the cheapest defense and should be the default. Use it everywhere you make external calls.

## Defense 2: reentrancy guards

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

If your fix added a modifier like `nonReentrant`, this is what you did. The first call to `withdraw` sets `locked = true` and runs the function body. If the body triggers a callback that tries to re-enter `withdraw`, the modifier hits `if (locked) revert`, which now fails because `locked` is true. The re-entry reverts. When the original call finishes, `locked` is set back to `false` so future calls work normally.

OpenZeppelin's `ReentrancyGuard` is the production-quality version of this. It uses a `uint256` instead of a `bool` for gas efficiency, since the storage slot transitions are cheaper, and exposes the modifier as `nonReentrant`. Most production contracts that hold value inherit from it.

**Use both defenses, not just one.** Reentrancy guards catch cases where checks-effects-interactions slipped, and the ordering discipline keeps the guards from being load-bearing. Defense in depth is the right approach when funds are on the line.

## Cross-function and read-only reentrancy

The simple guard above protects against re-entering the same function. It doesn't protect against re-entering a **different** function in the same contract.

Imagine the Vault has two functions that both transfer ETH and both read `balances[msg.sender]`. If only one of them is guarded, an attacker can call the guarded one, trigger their `receive`, and from there call the unguarded one. The attacker re-enters the contract through a different function, and the guard on the first doesn't fire.

The fix is to apply the guard to every function that touches the same state. OpenZeppelin's `ReentrancyGuard` uses a single shared lock across all `nonReentrant` functions, so any guarded function blocks re-entry into any other guarded function in the same contract.

A subtler variant is **read-only reentrancy**. A view function is called during a callback, returns a value computed from inconsistent state, and the caller uses that value to make a decision. The view function doesn't change anything, so `nonReentrant` on it would be unusual. But the value it returns is wrong because the contract is in the middle of an update.

This attack class became prominent in 2022 when several DeFi protocols were exploited through it. The defense is to either avoid making external calls when state is inconsistent, which is what checks-effects-interactions enforces, or to apply guards more broadly, including on view functions that read state used during transitions.

Most reentrancy bugs in production today are of the cross-function or read-only variety. The classic same-function pattern is well known enough that fresh code rarely has it.

## Denial-of-service through failed external calls

John's attack is structurally different. He isn't trying to steal funds. He's trying to make the vault unusable for everyone else.

Here's the vulnerable `emergencyRefundAll` from the Vault:

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

The bug is `if (!ok) revert TransferFailed();`. If any single transfer fails, the entire function reverts. Every refund that happened in previous iterations gets rolled back along with the failed one.

John is a contract whose `receive()` function deliberately reverts:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract John {
    IVault public vault;

    function deposit() external payable {
        vault.deposit{value: msg.value}();
    }

    receive() external payable {
        revert("not accepting");
    }
}
```

John deposits a small amount through his contract. The vault now has John's address in its `depositors` array. When the admin calls `emergencyRefundAll`, the loop eventually reaches John, tries to send him ETH, John's `receive` reverts, the `if (!ok)` check triggers, and the entire transaction is rolled back.

No matter how many times the admin calls `emergencyRefundAll`, it always reverts when it reaches John. The vault is bricked. Honest depositors can never get their refunds via the emergency path.

John doesn't gain anything financially. He just denies everyone else the use of the function. This is enough of an attack on its own in many real situations: blocking refunds, blocking auction settlement, blocking distribution of rewards.

## Defense: pull over push

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

If your fix restructured `emergencyRefundAll` to mark balances claimable and added a separate `claimRefund` function, this is what you did. The vault never tries to push ETH to anyone during the batch. It marks each user's owed amount internally, and users call `claimRefund` to pull their own funds. John's malicious `receive` only blocks John from claiming, and that's John's problem, not the vault's. Everyone else can claim normally.

This is the same pull-over-push pattern that came up in the loops and hashing lesson. It applies any time a contract needs to distribute value to many recipients. The work moves from the contract to the recipients, which sidesteps the gas-limit and DoS problems together.

## Alternative defense: track failures

In cases where you really do need to push payments, the defense is to catch failures and continue rather than reverting the whole batch:

```solidity
function emergencyRefundAll() external onlyOwner {
    for (uint256 i = 0; i < depositors.length; i++) {
        address user = depositors[i];
        uint256 amount = balances[user];

        if (amount == 0) continue;

        balances[user] = 0;

        (bool ok, ) = user.call{value: amount}("");
        if (!ok) {
            pendingRefunds[user] = amount;
        } else {
            emit EmergencyRefund(user, amount);
        }
    }
}
```

If your fix replaced `if (!ok) revert` with logic that records the failure and keeps going, this is what you did. When a transfer fails, the function doesn't revert. It records the failure in `pendingRefunds`, which the affected user can then claim manually later. The loop continues with the remaining users. John can't block anyone else.

This is a hybrid pattern: push by default, fall back to pull only for failures. It keeps the convenience of push-based distribution for the common case while preserving the safety of pull-based recovery for edge cases.

## The `tx.origin` defense and its limits

You'll sometimes see contracts try to prevent attacks by requiring that the caller be an externally owned account, not a contract:

```solidity
require(tx.origin == msg.sender, "no contracts allowed");
```

`tx.origin` is the address that signed the original transaction. `msg.sender` is whoever's currently calling. If they're the same, the caller must be an EOA, because contracts are never the original signer.

This prevents the simple attack patterns shown in this lesson. Eva and John both needed to be contracts in order to have malicious `receive` functions. The check stops them from interacting with the protected function at all.

The mitigation is partial, however. It blocks the naive attack class but creates new problems. Legitimate users who want to interact with your contract through a multisig or a smart wallet are also blocked, because multisigs and smart wallets are contracts. Account abstraction (ERC-4337) makes this restriction much more user-hostile: more and more wallets are themselves contracts, and many users have no EOA at all.

The check is also bypassable by attackers who use account-abstraction wallets or by sophisticated MEV-style attacks where the contract isn't the direct attacker.

The honest position: `tx.origin == msg.sender` is a small defensive measure that catches the most obvious attacks at the cost of blocking some legitimate users. Use it only when the threat model genuinely calls for it. Defense should rely on checks-effects-interactions and reentrancy guards as the primary protection.
