# Proxies - Test

_type: test_

---

## Questions

### Q1

In the off-chain-compute pattern, a user computes a value off-chain and submits it to the contract. The user can submit any value they want, including a wrong one.

a. The contract trusts only signed values, so unsigned submissions are ignored.
b. Other users monitor the chain and report bad submissions.
c. The contract automatically rolls back any transaction that produces unexpected state changes.
d. The verification step runs deterministically on the chain. A wrong value fails verification.

### Q2

A UUPS implementation has a function that calls `selfdestruct(payable(msg.sender))` under certain conditions. An attacker manages to trigger this on the implementation contract directly (calling it at its own address, not through the proxy). The implementation contract is destroyed. What happens to the proxy?

a. The proxy is permanently bricked. The implementation address still points to a destroyed contract, and the upgrade function is no longer callable through the proxy.
b. The proxy automatically points to address(0) and reverts all calls until reconfigured by the admin.
c. The proxy's storage is wiped because selfdestruct propagates through delegatecall relationships.
d. Nothing. The proxy is independent and continues delegating to the same address. The next call will simply fail and the owner can upgrade to a new implementation.

### Q3

A team deploys their UUPS proxy in two separate transactions. First, they call the factory to deploy the proxy + implementation. The deployment script then calls `initialize()` on the proxy as a follow-up transaction:

```typescript
const proxy = await factory.deployProxy(implementation);
await proxy.initialize(deployerAddress);  // sets owner
```

A bot watching the mempool sees the proxy contract deployed. Before the team's `initialize()` transaction confirms, the bot front-runs it by calling `initialize(botAddress)` itself. What is the outcome?

a. The bot's call reverts because only the proxy's deployer can call `initialize`.
b. Both calls succeed in some order, and the second call overwrites the first. The team's call lands last, so the deployer is the owner.
c. The bot's call reverts because the proxy's implementation address is not yet set.
d. The bot's call succeeds and sets the bot as the owner. The team's follow-up `initialize` call then reverts.

### Q4

A function declared as `function f(uint256[] memory arr) external` differs from `function f(uint256[] calldata arr) external` in what way?

a. They behave identically
b. `memory` makes a copy, `calldata` reads in place from the transaction data
c. `calldata` is faster but can be modified, `memory` is read-only
d. `memory` is required for external functions, `calldata` is for public

### Q5

When upgrading a UUPS proxy, who initiates the upgrade?

a. The proxy contract
b. The implementation contract
c. The user by calling `upgrade` on a validator node
