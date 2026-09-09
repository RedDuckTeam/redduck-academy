---
id: 150
title: Upgradeable contracts and proxies
type: lecture
order: 9
faq:
  - question: How do projects upgrade code that is supposed to be immutable?
    answer: >-
      With a proxy. The proxy holds the state and `delegatecall`s every call to a separate
      implementation contract, so that code runs against the proxy's storage. To upgrade,
      deploy a new implementation and point the proxy at it. Address, storage, and balances all
      stay.
  - question: Why can't a contract behind a proxy use a constructor?
    answer: >-
      A constructor writes to the implementation's own storage, and the proxy never reads that
      storage. Upgradeable contracts call an `initialize` function after deployment, with an
      `initializer` modifier so it runs once.
  - question: Transparent proxy or UUPS?
    answer: >-
      OpenZeppelin recommends UUPS for new projects. A transparent proxy keeps the upgrade and
      admin functions on the proxy and routes by caller. UUPS, the Universal Upgradeable Proxy
      Standard, puts the upgrade function in the implementation, so the proxy is minimal and
      cheaper to deploy, and an implementation deployed without upgrade logic bricks it
      permanently.
  - question: What breaks if I reorder variables in a new implementation?
    answer: >-
      Your data. Proxies hold the storage that every version shares, and variables map to slots
      in declaration order, so a moved variable makes a slot change meaning silently. Only add
      new variables at the end. Never remove, reorder, or resize an existing one, and keep the
      inheritance order. OpenZeppelin's plugin refuses an upgrade that breaks the layout.
---

> Smart contracts are immutable. Once deployed, the code at an address cannot change. This is a security feature: users can audit a contract once and trust that what they read is what they're interacting with forever. But it's also a real limitation. If you find a bug in production, you can't patch it. If you want to add a new feature, you can't add it. If the protocol evolves, your users are stuck with the version you released. The proxy pattern solves this by separating where a contract's data lives from where its code lives. Once you understand it, you'll see it underneath almost every major DeFi protocol, every NFT collection designed with future upgrades in mind, and every account abstraction wallet. This lesson covers what proxies are, how they work, the two production patterns Transparent and UUPS, and the rules you have to follow to use them safely.

## The problem

Solidity contracts are deployed once. The bytecode at a contract address is the bytecode forever. There's no `git push` that updates the code. No deploy command that swaps the implementation. The code you release is the code that runs until the contract is no longer used.

This causes three problems for any contract that needs to evolve.

**Bug fixes.** If you find a bug after deployment, you can't patch it. The bug stays in production until you either tolerate it or replace the contract entirely.

**New features.** If the protocol adds a feature, existing contracts can't include it. You'd have to deploy a new version and convince users to migrate.

**Migration is hard.** Suppose you do deploy a new version. Existing users have to learn the new address, update wallets, move tokens. State doesn't migrate automatically. Balances, mappings, configuration: all of that lives in the old contract's storage and is invisible to the new one.

The naive workaround is to tell users to start using a new contract address. For a small project with a handful of users, this works. For a protocol with thousands of users and millions of dollars locked, it doesn't. Even getting all your users to update their bookmarks is a slow, error-prone process. Migrating their actual on-chain state is worse: you'd need to write migration logic that reads from the old contract and writes to the new one, which itself requires gas and user transactions.

A real solution would let you update the code while keeping the same address, the same storage, and the same user-facing interface. That's what the proxy pattern provides.

## The trick: separate storage from logic

A proxy is a contract that holds your state but delegates all logic to a separate implementation contract. Users interact with the proxy. The proxy forwards every call to the implementation using a special opcode called `delegatecall`. Because `delegatecall` executes the implementation's code in the proxy's storage context, all state changes the implementation makes happen to the proxy's storage. The implementation is just borrowed code.

When you want to upgrade, you don't redeploy the proxy. You deploy a new implementation, then update the address the proxy delegates to. The proxy's storage stays put. The new implementation runs against it. Users see the same proxy address with new behavior.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>User, proxy, and implementation contract linked by delegatecall</title><desc>The user sends a transaction to the proxy address. The proxy holds all state, such as balances and owners, and stores the implementation address, then uses delegatecall on any unknown function so the implementation runs its code in the proxy's own storage context.</desc> <!-- User --> <rect x="30" y="150" width="150" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="105" y="175" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">USER</text> <text x="105" y="195" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">tx to proxy address</text> <!-- Arrow user to proxy --> <line x1="180" y1="180" x2="225" y2="180" stroke="#565653" stroke-width="1.5"/> <polygon points="233,180 223,175 223,185" fill="#565653"/> <!-- Proxy --> <rect x="235" y="100" width="200" height="160" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="335" y="125" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">PROXY</text> <text x="335" y="148" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">holds all state:</text> <text x="335" y="165" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">balances, owners, ...</text> <text x="335" y="190" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">stores implementation</text> <text x="335" y="207" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">address</text> <text x="335" y="232" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">delegatecall on any</text> <text x="335" y="248" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">unknown function</text> <!-- Arrow proxy to implementation --> <line x1="435" y1="180" x2="510" y2="180" stroke="#565653" stroke-width="1.5"/> <polygon points="518,180 508,175 508,185" fill="#565653"/> <text x="485" y="170" text-anchor="middle" font-family="monospace" font-size="9" fill="#000000">delegatecall</text> <!-- Implementation --> <rect x="520" y="120" width="170" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="605" y="145" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">IMPLEMENTATION</text> <text x="605" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">code only, no state</text> <text x="605" y="195" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">runs in proxy's</text> <text x="605" y="211" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">storage context</text> </svg>

The user only knows the proxy's address. The implementation could be anything. The proxy could swap its implementation a hundred times and the user keeps interacting with the same address as if nothing changed.

## A minimal proxy

The simplest proxy you can write is about 20 lines. We'll walk through it to make the mechanics concrete, then explain why this version is not safe for production.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract NaiveProxy {
    address public implementation;
    address public owner;

    constructor(address _implementation) {
        implementation = _implementation;
        owner = msg.sender;
    }

    function upgrade(address newImplementation) external {
        require(msg.sender == owner, "not owner");
        implementation = newImplementation;
    }

    fallback() external payable {
        address impl = implementation;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
```

The `fallback` function runs whenever the proxy receives a call for a function it doesn't define. Since the proxy only defines `upgrade` and the auto-generated getters for `implementation` and `owner`, almost every call from a user hits the fallback. Inside the fallback, the assembly does four things: copy the incoming calldata into memory, `delegatecall` the implementation with that calldata, copy whatever the implementation returned, and either return it or revert.

The `delegatecall` opcode is the heart of the proxy pattern. A regular `call` executes the target contract's code in the target's storage. A `delegatecall` executes the target's code in the CALLING contract's storage. So when the proxy delegatecalls the implementation, the implementation's code reads and writes the proxy's storage. The implementation can have state variables declared in its source code, but at runtime those variables resolve to slots in the proxy.

To make this work, the storage layout in the implementation must match what the proxy expects. If the proxy stores `implementation` at slot 0 and `owner` at slot 1, the implementation's first state variable will collide with `implementation` because they share slot 0. Whatever the implementation thinks is its first state variable will overwrite the proxy's implementation pointer.

This is one of several reasons the naive proxy above is dangerous. Even if you reserve the first two slots for the proxy's own variables and start your implementation's state at slot 2, you've still got the next problem: function selector collisions.

## Function selector collisions

When a user calls a function on the proxy, the EVM looks at the first 4 bytes of calldata, called the function selector. The selector is `bytes4(keccak256(functionSignature))`. The proxy's compiled bytecode contains a dispatcher that checks the selector against each function it knows about. If the selector matches one of the proxy's own functions, the dispatcher routes the call there. If not, the call falls through to the fallback, which delegatecalls the implementation.

Now consider this scenario. The proxy has a function `upgrade(address)`. Its selector is some specific 4-byte value. By coincidence, the implementation has a function that hashes to the SAME 4-byte selector. A user wants to call that function on the implementation. They send a transaction with the colliding selector. The proxy's dispatcher matches the selector against its own `upgrade` function and routes the call to the proxy itself. The implementation's function is never reached.

Worse: the user thought they were calling the implementation. They might be calling `upgrade` with arguments that the implementation's function would have accepted but that the proxy interprets completely differently. This is a real security issue rather than a mere annoyance.

Two patterns solve the collision problem in different ways. They're both production-grade and you should always use one of them rather than writing your own proxy.

## Transparent proxy

In the transparent proxy pattern, the proxy contract has admin functions like `upgrade` and `changeAdmin`. These functions exist directly on the proxy.

The dispatcher uses a single rule to decide whether to route a call to a proxy-defined function or to delegatecall the implementation: it looks at `msg.sender`.

If the caller is the proxy's admin, the dispatcher only considers the proxy's own functions. The proxy never delegates an admin's call to the implementation. If the admin calls a function that doesn't exist on the proxy, it reverts.

If the caller is anyone other than the admin, the dispatcher only considers the implementation's functions. The proxy never executes its own admin functions for non-admins. Even if a non-admin sends a selector that would have matched `upgrade` on the proxy, the call gets delegatecalled instead.

This neatly avoids the selector collision problem. The proxy and the implementation can have functions with the same selectors, and the dispatcher's rule based on `msg.sender` determines which one runs.

The cost is that the admin can't use the contract like a normal user. If you're the admin and you want to call a function on the implementation, you have to use a different wallet, because calling from the admin address will only hit admin functions and revert if no admin function matches.

## UUPS proxy

UUPS stands for Universal Upgradeable Proxy Standard. It takes a different approach: all the upgrade logic lives in the implementation rather than in the proxy. The proxy is minimal. It does nothing except `delegatecall`. It has no admin functions at all.

The implementation contract inherits from a base contract that provides upgrade machinery. The upgrade function looks something like `upgradeTo(address newImplementation)`, and it's a function on the implementation rather than the proxy. When you want to upgrade, you call `upgradeTo` on the proxy, which is the user-facing address, which delegatecalls into the implementation's `upgradeTo` function. The implementation, executing in the proxy's storage context, updates the proxy's stored implementation pointer.

This is more compact than the transparent proxy because the proxy contract itself contains only the fallback. Deploying a UUPS proxy is cheaper. When you're deploying many copies of the same proxy, common in account abstraction wallets where each user gets their own proxy, the cumulative gas savings are significant.

It also gives you flexibility the transparent pattern doesn't: you can deploy a new implementation that intentionally removes the upgrade function, making the contract permanently non-upgradeable. The next upgrade attempt would fail because the new implementation has no `upgradeTo`.

That same flexibility is the failure mode of UUPS. If you accidentally deploy an implementation without the upgrade logic, the contract is bricked. The proxy has no upgrade function of its own, and the current implementation can't be replaced because the upgrade machinery is gone. There's a real historical incident where this happened to several OpenZeppelin UUPS deployments.

## How they differ at the routing level

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Transparent proxy vs UUPS proxy: where upgrade and admin logic live</title><desc>Side by side, the Transparent proxy holds storage plus admin functions (upgrade, changeAdmin) that run when the caller is the admin, while its separate Implementation contract has only application logic. The UUPS proxy holds just storage and always delegates calls, while its Implementation contract has the application logic plus the upgrade function and access control.</desc>
  <!-- Transparent (left) -->
  <text x="180" y="25" text-anchor="middle" font-family="monospace" font-size="14" fill="#000000" font-weight="bold">TRANSPARENT</text>

<rect x="40" y="40" width="280" height="140" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="65" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">PROXY</text>
  <text x="180" y="88" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">storage</text>
  <text x="180" y="108" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">+ admin functions</text>
  <text x="180" y="124" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">(upgrade, changeAdmin)</text>
  <text x="180" y="148" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">if msg.sender == admin:</text>
  <text x="180" y="164" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">  hit proxy, never delegate</text>

<rect x="40" y="200" width="280" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="225" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">IMPLEMENTATION</text>
  <text x="180" y="250" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">application logic only</text>
  <text x="180" y="270" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">no upgrade code, no admin</text>

<!-- UUPS (right) -->
  <text x="540" y="25" text-anchor="middle" font-family="monospace" font-size="14" fill="#000000" font-weight="bold">UUPS</text>

<rect x="400" y="40" width="280" height="140" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="65" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">PROXY</text>
  <text x="540" y="88" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">storage</text>
  <text x="540" y="108" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">no admin functions,</text>
  <text x="540" y="124" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">just delegatecall</text>
  <text x="540" y="148" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">always delegate, never</text>
  <text x="540" y="164" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">execute proxy logic</text>

<rect x="400" y="200" width="280" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="225" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">IMPLEMENTATION</text>
  <text x="540" y="248" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">application logic</text>
  <text x="540" y="268" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">+ upgrade function</text>
  <text x="540" y="284" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">+ access control</text>
</svg>

OpenZeppelin recommends UUPS for new projects. It's cheaper to deploy, it doesn't require admin-vs-user routing, and the implementation has more control over its own upgrade lifecycle. The transparent pattern is still in use because many existing protocols deployed it years ago and continue using it for stability. Both are well-supported in production tooling.

## Storage slot collisions and EIP-1967

Recall the slot collision from the naive proxy. The proxy needs to store the implementation address and the admin address, but if it keeps them at slots 0 and 1, the implementation's own first two state variables land on those same slots and overwrite them.

EIP-1967 solves this by reserving specific high-numbered slots derived from hashes for proxy-internal state. The implementation address slot, for example, is:

```
keccak256("eip1967.proxy.implementation") - 1
= 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
```

Subtracting 1 from the hash makes it virtually impossible for a Solidity compiler to ever assign a state variable to that slot, because storage slots for normal variables start at 0 and increment by 1. As long as the implementation declares its own state variables normally, none of them will ever collide with the proxy's reserved slots.

OpenZeppelin's proxy contracts use EIP-1967 slots automatically. You don't have to compute these hashes yourself or write the assembly. Just inherit from their proxy base contracts and the slot bookkeeping is handled.

## Writing upgradeable contracts

Now for the rules you have to follow when authoring a contract that will live behind a proxy.

**No constructors.** A constructor runs once at deployment time and only affects the contract being deployed. If your implementation contract has a constructor, it runs when the implementation is deployed, but it runs in the implementation's storage context rather than the proxy's. The proxy never sees the result. Whatever the constructor was supposed to set up never gets set up in the proxy.

Instead of constructors, upgradeable contracts use **initializer functions**. An initializer is a regular function that does what a constructor would do, but it's called separately after deployment. To prevent it from being called more than once, OpenZeppelin provides an `initializer` modifier that tracks whether the function has been called and reverts on subsequent calls.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract UpgradeableToken is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    function initialize(string memory name_, string memory symbol_)
        public
        initializer
    {
        __ERC20_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
```

A few things going on. The contract inherits from `Initializable`, the base contract that provides the `initializer` modifier. It also inherits from upgradeable versions of ERC20 and Ownable, which are constructor-free variants that provide their own initializer functions (`__ERC20_init`, `__Ownable_init`). The `UUPSUpgradeable` base provides the `upgradeTo` machinery.

The `initialize` function calls each parent's initializer to set up its state. The `initializer` modifier on `initialize` itself ensures this whole function can only be called once.

`_authorizeUpgrade` is the access-control hook that UUPS requires. Whenever someone calls `upgradeTo`, the UUPS base calls `_authorizeUpgrade` first. The implementation must override this function and put its access check inside. The `onlyOwner` modifier here means only the owner can upgrade. The function body is empty because there's nothing else to do once the check passes.

**Storage layout must be preserved across upgrades.** This is non-negotiable. If your first state variable is `uint256 totalSupply`, it's stored at slot 0 of the proxy. When you upgrade to a new implementation, the new implementation's first state variable also lives at slot 0. If the new implementation reorders or removes variables, slot 0 now means something different. The same memory that used to be `totalSupply` is now read as something else: bookkeeping silently corrupts.

Rules for safe upgrades:

- You can add new state variables at the end.
- You cannot remove existing state variables.
- You cannot reorder existing state variables.
- You cannot change the type of an existing variable in a way that changes its size.
- For inherited contracts, you must keep the inheritance order the same.

OpenZeppelin's upgrade tooling checks these invariants automatically and refuses to deploy an upgrade that would corrupt storage. You should never bypass this check.

## Deploying with hardhat-upgrades

The OpenZeppelin upgrades plugin for Hardhat handles proxy deployment and upgrade in a few lines. You point it at your implementation contract. The plugin deploys both the proxy and the implementation, calls the initializer, and returns a handle that talks to the proxy as if it were your contract directly.

```typescript
import { ethers, upgrades } from "hardhat";

async function deploy() {
  const Token = await ethers.getContractFactory("UpgradeableToken");

  const proxy = await upgrades.deployProxy(
    Token,
    ["My Token", "MTK"],          // initializer args
    { initializer: "initialize", kind: "uups" }
  );

  await proxy.waitForDeployment();
  return proxy;
}
```

The returned `proxy` object behaves like a normal contract object. Calling `proxy.transfer(...)` sends a transaction to the proxy address, which delegatecalls the implementation, which runs `transfer` in the proxy's storage context.

To upgrade later:

```typescript
const TokenV2 = await ethers.getContractFactory("UpgradeableTokenV2");
await upgrades.upgradeProxy(proxyAddress, TokenV2);
```

The plugin deploys the new implementation, checks that the storage layout is compatible with the previous one, then calls the proxy's upgrade function to point at the new implementation. The proxy's address doesn't change. Users continue interacting with the same address. The behavior changes. The state stays.

## The Diamond pattern

One more pattern worth knowing exists, even though we won't use it. The diamond pattern (EIP-2535) is a more advanced proxy structure where instead of one implementation, you have many. The proxy routes each function call to whichever implementation contract handles that function. This is used when a single contract's logic exceeds the 24KB bytecode size limit, or when you want different parts of a system to be upgradeable independently.

Diamond proxies are complex and not what you'd reach for first. The transparent and UUPS patterns cover the vast majority of upgrade needs. It is worth knowing it exists in case you encounter it in a real project. Ignore it until you have a specific reason to use it.

## Use the tooling, don't write your own

The single most important takeaway: don't write your own proxy from scratch. The naive proxy at the start of this lesson is missing storage slot management, missing the selector collision fix, missing checks against bricking, missing initialization safety. Each gap is a potential exploit.

OpenZeppelin's upgradeable contracts library and the hardhat-upgrades plugin solve all of these correctly. The base classes like `UUPSUpgradeable`, `OwnableUpgradeable`, and `ERC20Upgradeable` handle EIP-1967 slot management, initializer modifiers, storage gap reservations for future variables, and authorization hooks. The deploy plugin checks storage layout compatibility on every upgrade. Use them.

When you see a real proxy contract on Etherscan, it's almost always either an OpenZeppelin TransparentUpgradeableProxy or an OpenZeppelin ERC1967Proxy, the UUPS variant. You'll see the same patterns again and again, which is exactly what you want: widely used, heavily audited code.
