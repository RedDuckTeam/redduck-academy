---
id: 151
title: Proxies - Test
type: test
order: 10
---

<!-- q:6a11e9737cdfe4cdf9b09e44 -->
In the off-chain-compute pattern, a user computes a value off-chain and submits it to the contract. The user can submit any value they want, including a wrong one.

- [ ] The contract trusts only signed values, so unsigned submissions are ignored.  <!-- a:6a11e9797cdfe4cdf9b09e45 -->
- [ ] Other users monitor the chain and report bad submissions.  <!-- a:6a11ea4d7cdfe4cdf9b09e46 -->
- [ ] The contract automatically rolls back any transaction that produces unexpected state changes.  <!-- a:6a11ea987cdfe4cdf9b09e47 -->
- [x] The verification step runs deterministically on the chain. A wrong value fails verification.  <!-- a:6a11eaa47cdfe4cdf9b09e48 -->

<!-- q:6a11eeaf7cdfe4cdf9b09e49 -->
This scenario reflects Ethereum before the Dencun upgrade of March 2024. A UUPS implementation has a function that calls `selfdestruct(payable(msg.sender))` under certain conditions. An attacker manages to trigger this on the implementation contract directly (calling it at its own address rather than through the proxy), and back then the code at the implementation address was destroyed. Since EIP-6780, `selfdestruct` removes a contract only when it runs in the same transaction that created that contract, so an already-deployed implementation can no longer be destroyed this way. Assuming the pre-Dencun behavior, what happens to the proxy?

- [x] The proxy is permanently bricked. The implementation address still points to a destroyed contract, and the upgrade function is no longer callable through the proxy.  <!-- a:6a11eebd7cdfe4cdf9b09e4a -->
- [ ] The proxy automatically points to address(0) and reverts all calls until reconfigured by the admin.  <!-- a:6a11f4b17cdfe4cdf9b09e4b -->
- [ ] The proxy's storage is wiped because selfdestruct propagates through delegatecall relationships.  <!-- a:6a11f4b47cdfe4cdf9b09e4c -->
- [ ] Nothing. The proxy is independent and continues delegating to the same address. The next call will simply fail and the owner can upgrade to a new implementation.  <!-- a:6a11f4c07cdfe4cdf9b09e4d -->

<!-- q:6a1230b87cdfe4cdf9b09e4e -->
A team deploys their UUPS proxy in two separate transactions. First, they call the factory to deploy the proxy + implementation. The deployment script then calls `initialize()` on the proxy as a follow-up transaction:

```typescript
const proxy = await factory.deployProxy(implementation);
await proxy.initialize(deployerAddress);  // sets owner
```

A bot watching the mempool sees the proxy contract deployed. Before the team's `initialize()` transaction confirms, the bot front-runs it by calling `initialize(botAddress)` itself. What is the outcome?

- [ ] The bot's call reverts because only the proxy's deployer can call `initialize`.  <!-- a:6a1230d47cdfe4cdf9b09e4f -->
- [ ] Both calls succeed in some order, and the second call overwrites the first. The team's call lands last, so the deployer is the owner.  <!-- a:6a1231777cdfe4cdf9b09e50 -->
- [ ] The bot's call reverts because the proxy's implementation address is not yet set.  <!-- a:6a1231867cdfe4cdf9b09e51 -->
- [x] The bot's call succeeds and sets the bot as the owner. The team's follow-up `initialize` call then reverts.  <!-- a:6a12319a7cdfe4cdf9b09e52 -->

<!-- q:6a1237997cdfe4cdf9b09e54 -->
A function declared as `function f(uint256[] memory arr) external` differs from `function f(uint256[] calldata arr) external` in what way?

- [ ] They behave identically  <!-- a:6a1237a27cdfe4cdf9b09e55 -->
- [x] `memory` makes a copy, `calldata` reads in place from the transaction data  <!-- a:6a1237a97cdfe4cdf9b09e56 -->
- [ ] `calldata` is faster but can be modified, `memory` is read-only  <!-- a:6a1237b97cdfe4cdf9b09e57 -->
- [ ] `memory` is required for external functions, `calldata` is for public  <!-- a:6a1237c87cdfe4cdf9b09e58 -->

<!-- q:6a12384d7cdfe4cdf9b09e59 -->
When upgrading a UUPS proxy, who initiates the upgrade?

- [ ] The proxy contract  <!-- a:6a1238517cdfe4cdf9b09e5a -->
- [x] The implementation contract  <!-- a:6a12385b7cdfe4cdf9b09e5b -->
- [ ] The user by calling `upgrade` on a validator node  <!-- a:6a1238637cdfe4cdf9b09e5c -->
