---
id: 143
title: Solidity gotchas - Test
type: test
order: 5
---

<!-- q:6a0f8c97fca4de7177649927 -->
A contract has these modifiers and a function:

```solidity
contract X {
    bool public paused = true;
    address public owner;

    modifier whenNotPaused() {
        require(!paused, "paused");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function adminAction() external whenNotPaused onlyOwner {
        // body
    }
}

```

A non-owner calls `adminAction()` while the contract is paused. What is the revert message?

- [ ] "not owner"  <!-- a:6a0f8cd6fca4de7177649928 -->
- [x] "paused"  <!-- a:6a0f8ce1fca4de7177649929 -->
- [ ] Both messages are included in the revert data  <!-- a:6a0f8ce7fca4de717764992a -->
- [ ] Neither, the function succeeds because the body still runs  <!-- a:6a0f8cf4fca4de717764992b -->

<!-- q:6a0f8d09fca4de717764992c -->
A contract has this function:

```solidity
function trySend(address payable to, uint256 amount) external {
    (bool ok, ) = to.call{value: amount}("");
    // no further code
}
```

The `to` address is a contract whose `receive()` always reverts. A user calls `trySend` with `amount = 1 ether`. What happens?

- [x] The transaction succeeds. 1 ETH stays in the calling contract because the transfer silently failed  <!-- a:6a0f8dc9fca4de717764992d -->
- [ ] The transaction succeeds and 1 ETH is sent to `to` despite the revert  <!-- a:6a0f8dddfca4de717764992e -->
- [ ] The transaction succeeds and the 1 ETH is sent back to the original caller as a refund  <!-- a:6a0f8decfca4de717764992f -->
- [ ] The transaction reverts and the 1 ETH stays with the caller  <!-- a:6a0f8df4fca4de7177649930 -->

<!-- q:6a0f9138c53e8c549713cc6b -->
A developer writes this modifier to track call counts and applies it to several functions:

```solidity
uint256 public callCount;

modifier counted() {
    callCount += 1;
}

function doStuff() external counted {
    // important logic here
}
```

The contract deploys without errors. What happens when a user calls `doStuff()`?

- [ ] The function works normally and `callCount` is incremented after the body runs  <!-- a:6a0f9150c53e8c549713cc6c -->
- [ ] The transaction reverts because the modifier never reaches the function body  <!-- a:6a0f915ec53e8c549713cc6d -->
- [x] `callCount` is incremented but the function body never executes, so "important logic here" never runs  <!-- a:6a0f9165c53e8c549713cc6e -->
- [ ] The function body runs first and the modifier code is appended afterward  <!-- a:6a0f916bc53e8c549713cc6f -->

<!-- q:6a0f91d7c53e8c549713cc70 -->
A vault contract reverts all direct ETH transfers via `receive`

```solidity
contract Vault {
    uint256 public trackedBalance;

    function deposit() external payable {
        trackedBalance += msg.value;
    }

    receive() external payable {
        revert("use deposit()");
    }
}
```

An attacker creates a separate contract, sends 5 ETH to it, then calls `selfdestruct` on it with the Vault's address as the recipient. What is the state of the Vault afterwards?

- [x] The Vault has 5 ETH in its balance, but `trackedBalance` is still 0  <!-- a:6a0f91fcc53e8c549713cc71 -->
- [ ] The Vault's `trackedBalance` is automatically updated to include the forced 5 ETH  <!-- a:6a0f9203c53e8c549713cc72 -->
- [ ] The 5 ETH is burned because the Vault refuses to accept it  <!-- a:6a0f9209c53e8c549713cc73 -->
- [ ] The Vault's `receive` reverts, so the selfdestruct fails and no ETH moves  <!-- a:6a0f9211c53e8c549713cc74 -->

<!-- q:6a0f97e9f81a4e01ee9fd960 -->
**Approve without sufficient balance.** Alice has a balance of 50 USDC. She calls `usdc.approve(bob, 1000)`. What is the result?

- [ ] The transaction reverts because Alice cannot approve more than her balance  <!-- a:6a0f97eff81a4e01ee9fd961 -->
- [x] Alice's allowance to Bob is set to 1000, even though her balance is only 50.  <!-- a:6a0f97f5f81a4e01ee9fd962 -->
- [ ] The allowance is automatically capped at 50  <!-- a:6a0f9807f81a4e01ee9fd963 -->

<!-- q:6a0f98a5f81a4e01ee9fd965 -->
A protocol integrates a new token and uses this code:

```solidity
function notify(address token, address user) external {
    (bool ok, ) = token.call(
        abi.encodeWithSignature("notifyDeposit(address)", user)
    );
    require(ok, "notify failed");
}
```

The `token` address is set by an admin. Through misconfiguration, the admin sets `token` to an address that has no contract deployed. What happens when `notify` is called?

- [ ] The transaction reverts because the function selector doesn't match anything  <!-- a:6a0f98b8f81a4e01ee9fd966 -->
- [ ] The transaction reverts because you can't call an address with no code  <!-- a:6a0f98bef81a4e01ee9fd967 -->
- [ ] The transaction succeeds but `ok` is set to `false`  <!-- a:6a0f98c1f81a4e01ee9fd968 -->
- [x] The transaction succeeds with `ok == true`, even though no code ran, because the EVM does not check whether code exists at the target  <!-- a:6a0f98ddf81a4e01ee9fd969 -->
