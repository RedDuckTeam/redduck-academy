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

> Once deployed, the code at an address cannot change, so users can audit a contract once and trust that what they read is what they're interacting with forever. It also means you can't patch a bug or add a feature. The proxy pattern gets around this by separating where a contract's data lives from where its code lives, and the price is that users have to trust whoever is allowed to replace the code.

## Moving users to a new address does not scale

The naive workaround is to deploy a new version and tell users to start using the new contract address. For a small project with a handful of users, this works. For a protocol with thousands of users and millions of dollars locked, it doesn't. State doesn't migrate automatically: balances, mappings, and configuration all live in the old contract's storage and are invisible to the new one. You'd need to write migration logic that reads from the old contract and writes to the new one, which itself requires gas and user transactions.

A real solution would let you update the code while keeping the same address, the same storage, and the same user-facing interface.

## A proxy holds the state and borrows the code

A proxy is a contract that holds your state but delegates all logic to a separate implementation contract. Users interact with the proxy. The proxy forwards every call to the implementation with `delegatecall`, which runs the implementation's code against the proxy's storage, as the [low-level calls lesson](/courses/development-on-ethereum/token-security-and-evm-internals/low-level-calls) showed. So all state changes the implementation makes happen to the proxy's storage.

When you want to upgrade, you don't redeploy the proxy. You deploy a new implementation, then update the address the proxy delegates to. The proxy's storage stays put, the new implementation runs against it, and users see the same proxy address with new behavior.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>User, proxy, and implementation contract linked by delegatecall</title><desc>The user sends a transaction to the proxy address. The proxy holds all state, such as balances and owners, and stores the implementation address, then uses delegatecall on any unknown function so the implementation runs its code in the proxy's own storage context.</desc> <!-- User --> <rect x="30" y="150" width="150" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="105" y="175" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">USER</text> <text x="105" y="195" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">tx to proxy address</text> <!-- Arrow user to proxy --> <line x1="180" y1="180" x2="225" y2="180" stroke="#565653" stroke-width="1.5"/> <polygon points="233,180 223,175 223,185" fill="#565653"/> <!-- Proxy --> <rect x="235" y="100" width="200" height="160" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="335" y="125" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">PROXY</text> <text x="335" y="148" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">holds all state:</text> <text x="335" y="165" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">balances, owners, ...</text> <text x="335" y="190" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">stores implementation</text> <text x="335" y="207" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">address</text> <text x="335" y="232" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">delegatecall on any</text> <text x="335" y="248" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">unknown function</text> <!-- Arrow proxy to implementation --> <line x1="435" y1="180" x2="510" y2="180" stroke="#565653" stroke-width="1.5"/> <polygon points="518,180 508,175 508,185" fill="#565653"/> <text x="485" y="170" text-anchor="middle" font-family="monospace" font-size="9" fill="#000000">delegatecall</text> <!-- Implementation --> <rect x="520" y="120" width="170" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="605" y="145" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">IMPLEMENTATION</text> <text x="605" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">code only, no state</text> <text x="605" y="195" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">runs in proxy's</text> <text x="605" y="211" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">storage context</text> </svg>

## The simplest proxy is about 20 lines

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

This version is not safe for production, for two reasons.

## The proxy's variables share slots with the implementation's

The implementation can have state variables declared in its source code, but at runtime those variables resolve to slots in the proxy. The naive proxy stores `implementation` at slot 0 and `owner` at slot 1, and the implementation's first state variable is also at slot 0. Whatever the implementation thinks is its first state variable will overwrite the proxy's implementation pointer.

You could start every implementation with two placeholder variables that match the proxy's, but then every future version has to repeat them in the same order. EIP-1967 moves the proxy's own variables out of the way instead, to specific high-numbered slots derived from hashes. The implementation address slot, for example, is:

```
keccak256("eip1967.proxy.implementation") - 1
= 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
```

Subtracting 1 from the hash makes it virtually impossible for a Solidity compiler to ever assign a state variable to that slot, because storage slots for normal variables start at 0 and increment by 1. As long as the implementation declares its own state variables normally, none of them will ever collide with the proxy's reserved slots. OpenZeppelin's proxy contracts use EIP-1967 slots automatically, so you don't have to compute these hashes yourself or write the assembly.

## The proxy's functions can hide the implementation's

A call picks its function by the function selector, the first 4 bytes of calldata, which is `bytes4(keccak256(functionSignature))`. The proxy's compiled bytecode contains a dispatcher that checks the selector against each function the proxy defines. If the selector matches one of the proxy's own functions, the dispatcher routes the call there. If not, the call falls through to the fallback, which delegatecalls the implementation.

A selector is only 4 bytes, so two different signatures can hash to the same one, which is called a selector collision. Suppose the implementation has a function with the same selector as the proxy's `upgrade(address)`. A user sends a transaction to call that function on the implementation. The proxy's dispatcher matches the selector against its own `upgrade` and routes the call to the proxy itself, so the implementation's function is never reached. An ordinary user gets a `not owner` revert. If the owner sends the call, the proxy reads arguments meant for the implementation's function as a new implementation address.

Two patterns solve the selector collision in different ways, and both are used in production.

## Transparent proxy: the admin sees the proxy, everyone else sees the implementation

In the transparent proxy pattern, admin functions like `upgrade` and `changeAdmin` exist directly on the proxy, and the dispatcher looks at `msg.sender` to decide where a call goes.

If the caller is the proxy's admin, the dispatcher only considers the proxy's own functions. If the admin calls a function that doesn't exist on the proxy, it reverts.

If the caller is anyone other than the admin, the dispatcher only considers the implementation's functions. Even if a non-admin sends a selector that would have matched `upgrade` on the proxy, the call gets delegatecalled instead.

The proxy and the implementation can now have functions with the same selectors, because `msg.sender` determines which one runs.

The cost is that the admin can't use the contract like a normal user. If you're the admin and you want to call a function on the implementation, you have to use a different wallet.

## UUPS: the upgrade function lives in the implementation

UUPS stands for Universal Upgradeable Proxy Standard. All the upgrade logic lives in the implementation rather than in the proxy. The proxy has no admin functions at all and does nothing except `delegatecall`, so it has no selectors of its own for the implementation to collide with.

The implementation contract inherits from a base contract that provides upgrade machinery. In OpenZeppelin 5 the upgrade function is `upgradeToAndCall(address newImplementation, bytes data)`, where `data` is an optional function call that runs with the new code right after the switch. When you want to upgrade, you call `upgradeToAndCall` on the proxy, which delegatecalls into the implementation's `upgradeToAndCall` function. The implementation, executing in the proxy's storage context, updates the proxy's stored implementation pointer.

The proxy contract itself contains only the fallback, so a UUPS proxy costs less gas to deploy than a transparent one. When you're deploying many copies of the same proxy, common in account abstraction wallets where each user gets their own proxy, the cumulative gas savings are significant.

It also gives you flexibility the transparent pattern doesn't: you can deploy a new implementation that intentionally removes the upgrade function, making the contract permanently non-upgradeable.

That same flexibility is the failure mode of UUPS. If you accidentally upgrade to an implementation without the upgrade logic, the contract keeps working but can never be upgraded again. The proxy has no upgrade function of its own, and the current implementation can't be replaced because the upgrade machinery is gone. OpenZeppelin's `upgradeToAndCall` catches the usual mistake, an implementation that forgot to inherit `UUPSUpgradeable`. Before the switch it calls `proxiableUUID()` on the new implementation, a function `UUPSUpgradeable` provides, and reverts if that call fails or returns a slot other than the EIP-1967 implementation slot.

## OpenZeppelin recommends UUPS for new projects

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

UUPS is cheaper to deploy, it doesn't require admin-vs-user routing, and the implementation has more control over its own upgrade lifecycle. The transparent pattern is still in use because many existing protocols deployed it years ago and continue using it for stability.

## A constructor cannot set up the proxy's storage

A constructor runs once at deployment time and only affects the contract being deployed. If your implementation contract has a constructor, it runs when the implementation is deployed, in the implementation's storage context rather than the proxy's. The proxy never sees the result.

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
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
```

`Initializable` is the base contract that provides the `initializer` modifier. `ERC20Upgradeable` and `OwnableUpgradeable` are constructor-free variants of ERC20 and Ownable that provide their own initializer functions (`__ERC20_init`, `__Ownable_init`), and `initialize` calls each of them. `_authorizeUpgrade` is the access-control hook that UUPS requires. Whenever someone calls `upgradeToAndCall`, the UUPS base calls `_authorizeUpgrade` first, and the `onlyOwner` modifier on it means only the owner can upgrade.

## Whoever calls `initialize` first becomes the owner

`initialize` is a public function, and the `initializer` modifier only blocks the second call. In the listing above the first caller becomes the owner, because `initialize` passes `msg.sender` to `__Ownable_init`, and the owner is the one who can upgrade.

A constructor runs inside the deployment transaction, so nobody can call the contract before it. An initializer is a separate call. If a script deploys the proxy in one transaction and calls `initialize` in the next, a bot watching the mempool (see [front-running](/courses/development-on-ethereum/token-security-and-evm-internals/front-running-and-mev)) can send its own `initialize` first. The bot's call succeeds and makes the bot the owner, and the team's call reverts. So the proxy has to be deployed and initialized in one transaction. OpenZeppelin's `ERC1967Proxy` does this: its constructor takes the encoded `initialize` call as its second argument and runs it against the proxy's storage.

The implementation has the same problem at its own address. It is a deployed contract with its own storage, and in that storage `initialize` was never called, because the call through the proxy wrote to the proxy's storage. Anyone can call `initialize` on the implementation directly and become its owner there. That changes nothing in the proxy's storage, but it lets a stranger pass the `onlyOwner` checks when calling the implementation at its own address.

The dangerous case is an implementation that can be made to run `selfdestruct` there. Before the Dencun upgrade of March 2024, `selfdestruct` destroyed the code at the implementation address. The proxy still pointed at the destroyed contract, and with UUPS the upgrade function was gone along with the rest of the code, so the proxy was permanently bricked. Since EIP-6780, `selfdestruct` removes a contract only when it runs in the same transaction that created that contract, so an already-deployed implementation can no longer be destroyed this way. The listing above still leaves the implementation open to a stranger's `initialize`.

To close it, give the implementation a constructor that calls `_disableInitializers()` from `Initializable`:

```solidity
/// @custom:oz-upgrades-unsafe-allow constructor
constructor() {
    _disableInitializers();
}
```

Here a constructor is the right tool, because the storage that needs locking is the implementation's own. `_disableInitializers()` marks that storage as initialized for good, so any later `initialize` call on the implementation reverts with `InvalidInitialization()`. The proxy's storage is not touched, and the proxy is initialized as before. OpenZeppelin's upgrades plugin rejects an implementation whose constructor runs any code, and the annotation line above the constructor tells the plugin that this one is intended.

## A new implementation must keep every existing variable in its slot

The proxy's storage outlives every implementation, and the compiler assigns slots in declaration order, starting from slot 0 (see the [storage layout lesson](/courses/development-on-ethereum/token-security-and-evm-internals/storage-layout)). Suppose version 1 declares `uint256 totalSupply` and then `uint256 cap`. In the proxy, slot 0 holds the total supply, say 100, and slot 1 holds the cap, 1000. Version 2 adds `uint256 fee` as its first variable, so the compiler now puts `fee` at slot 0, `totalSupply` at slot 1 and `cap` at slot 2. The upgrade changes the code and leaves the storage as it was. After it, `fee` reads 100, `totalSupply` reads 1000, and `cap` reads 0. Nothing reverts, and the bookkeeping is silently corrupted.

The same happens whenever an existing variable ends up at a different slot, so the rules for a new implementation are:

- You can add new state variables at the end.
- You cannot remove existing state variables.
- You cannot reorder existing state variables.
- You cannot change the type of an existing variable in a way that changes its size.
- For inherited contracts, you must keep the inheritance order the same.

Inheritance makes the first rule harder to follow. All contracts in an inheritance chain share one sequence of slots, so a variable added at the end of a base contract shifts the variables of every contract that comes after it. A base contract written for upgrades therefore ends with an array such as `uint256[50] private __gap;` that reserves slots for the future. A later version declares its new variable before the gap and shortens the gap by as many slots as the variable takes, so the base contract still takes the same number of slots and nothing after it moves. OpenZeppelin's upgradeable contracts did this up to version 4. Since version 5 each of them keeps its variables in a struct at a slot derived from a hash of a name (ERC-7201 namespaced storage), much as EIP-1967 places the proxy's variables, so they need no gaps.

## Use an existing proxy implementation

Don't write your own proxy from scratch. The naive proxy at the start of this lesson is missing storage slot management, the selector collision fix, checks against bricking, and initialization safety. When you see a real proxy contract on Etherscan, it's almost always either an OpenZeppelin TransparentUpgradeableProxy or an OpenZeppelin ERC1967Proxy, the UUPS variant.

OpenZeppelin's upgrades plugin for Hardhat checks the storage layout rules above on every upgrade and refuses to deploy one that would corrupt storage. You should never bypass this check. The plugin also deploys the proxy and the implementation and calls the initializer.

## Whoever holds the upgrade key can replace all of the logic

Without a proxy, users can read a contract once and know what they are interacting with. A proxy removes that guarantee. Whoever is allowed to change the implementation address can replace all of the contract's logic in one transaction, including the logic that moves users' funds. So users have to trust whoever holds that right, the upgrade key, as much as the code, and a stolen key gives the thief everything the contract holds.

In February 2025 the exchange Bybit lost about 1.46 billion dollars to a replaced implementation. Its wallet was a Safe, which is a proxy. The attackers got its signers to approve a transaction that wrote a new address into the slot where the Safe keeps its implementation address. After that the wallet ran the attackers' code, and they emptied it. The [Bybit lesson](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack) later in the course covers how the signers were deceived.

Two measures make the key harder to misuse. The first is a multisig, a wallet that needs several signers to approve each transaction, so one stolen key cannot upgrade the contract. It does not help when the signers approve what they cannot read: Bybit's Safe was a multisig, and three signers approved that transaction. The second is a timelock, a delay between submitting an upgrade and applying it. The change becomes visible before it takes effect, so users and monitors have time to react. A UUPS contract can also give the key up for good by upgrading to an implementation without the upgrade function.

## Three questions for any upgradeable contract

For an upgradeable contract, yours or one you are about to trust, answer three questions. Who can change the implementation address? Which call does it, and what does that call check? What is left of the contract if the new implementation does not have that function?
