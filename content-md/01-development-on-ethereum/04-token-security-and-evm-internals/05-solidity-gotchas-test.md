# Solidity gotchas - Test

_type: test_

---

## Questions

### Q1

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

a. The transaction reverts because the function selector doesn't match anything
b. The transaction reverts because you can't call an address with no code
c. The transaction succeeds but `ok` is set to `false`
d. The transaction succeeds with `ok == true`, even though no code ran, because the EVM does not check whether code exists at the target

### Q2

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

a. "not owner"
b. "paused"
c. Both messages are included in the revert data
d. Neither, the function succeeds because the body still runs

### Q3

A contract has this function:

```solidity
function trySend(address payable to, uint256 amount) external {
    (bool ok, ) = to.call{value: amount}("");
    // no further code
}
```

The `to` address is a contract whose `receive()` always reverts. A user calls `trySend` with `amount = 1 ether`. What happens?

a. The transaction succeeds. 1 ETH stays in the calling contract because the transfer silently failed
b. The transaction succeeds and 1 ETH is sent to `to` despite the revert
c. The transaction succeeds and the 1 ETH is sent back to the original caller as a refund
d. The transaction reverts and the 1 ETH stays with the caller

### Q4

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

a. The function works normally and `callCount` is incremented after the body runs
b. The transaction reverts because the modifier never reaches the function body
c. `callCount` is incremented but the function body never executes, so "important logic here" never runs
d. The function body runs first and the modifier code is appended afterward

### Q5

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

a. The Vault has 5 ETH in its balance, but `trackedBalance` is still 0
b. The Vault's `trackedBalance` is automatically updated to include the forced 5 ETH
c. The 5 ETH is burned because the Vault refuses to accept it
d. The Vault's `receive` reverts, so the selfdestruct fails and no ETH moves

### Q6

**Approve without sufficient balance.** Alice has a balance of 50 USDC. She calls `usdc.approve(bob, 1000)`. What is the result?

a. The transaction reverts because Alice cannot approve more than her balance
b. Alice's allowance to Bob is set to 1000, even though her balance is only 50.
c. The allowance is automatically capped at 50
