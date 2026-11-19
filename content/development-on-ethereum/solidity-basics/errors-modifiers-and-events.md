---
id: 135
title: Errors, modifiers, and events
type: lecture
order: 9
faq:
  - question: What happens to my state changes when a transaction reverts?
    answer: >-
      All of them are undone. Storage writes roll back, events emitted before the revert are
      dropped from the log, and ETH forwarded to nested calls returns up the call stack. The
      caller still pays gas for the work done up to that point.
  - question: require with a string message, or a custom error?
    answer: >-
      Custom errors for production. A string reason costs roughly 50 gas of bytecode plus
      encoding on every revert. A custom error is a 4-byte selector from keccak256 of
      errorName(types), around 4 gas to encode, and it can carry typed data such as the
      amount a caller was short. They arrived in 0.8.4, and require accepts one since
      0.8.27.
  - question: How do I apply the same owner check to ten functions?
    answer: >-
      Write a modifier. The check goes in its body, and _; marks where the function body is
      inserted at compile time.
  - question: Why can only three event parameters be indexed?
    answer: >-
      A log entry holds four topics and topic 0 is the keccak256 hash of the event
      signature, which leaves three. An indexed value type stores the value itself. An
      indexed string or bytes stores a keccak256 hash, so the original cannot be recovered
      from the topic.
---

> A revert is how a contract says no to a call. State rolls back, the caller sees an error, and any ETH sent is returned. A modifier is how you reuse the same check across many functions without duplicating it. An event is how a successful call publishes what happened to off-chain observers.

## What a revert does

When a contract reverts, three things happen in order. The current function stops executing. Every state change made during the call is rolled back. An error is returned to the caller.

The state rollback covers everything the EVM did since the call began. Storage writes are undone, and memory and stack are discarded. Events emitted before the revert are dropped from the transaction log as if they never happened. ETH that was forwarded to nested calls returns up the call stack.

If the reverting call was the top-level transaction, the user pays gas for the work done up to the revert, but no state on chain has changed. This is the EVM atomicity guarantee, viewed from the contract's side.

If the reverting call was a nested one made by another contract, the revert propagates up by default. The outer contract's call expression throws, which usually causes the outer call to revert too, all the way up to the top-level transaction.

Solidity gives you three ways to trigger a revert: custom errors, `require`, and `assert`.

## Custom errors: the default way to revert

**Custom errors** arrived in Solidity 0.8.4. They're the preferred way to revert in production code today. Use them for input validation, authorization checks, and any precondition that callers might violate.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Vault {
    address public owner;

    error NotOwner(address caller);
    error InsufficientBalance(uint256 requested, uint256 available);
    error ZeroAddress();

    constructor() {
        owner = msg.sender;
    }

    function withdraw(address to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        if (amount > address(this).balance) {
            revert InsufficientBalance(amount, address(this).balance);
        }
        if (to == address(0)) revert ZeroAddress();
        // ...
    }
}
```

Each error declaration looks like a function signature without a body. To trigger one, you write `revert ErrorName(args)`. The error and its arguments are encoded into the transaction's revert data and propagated up.

The alternative is to revert with a string message, and custom errors are better in three ways.

First, they are cheaper in gas. A custom error is identified by a 4-byte selector, the first 4 bytes of `keccak256(errorName(types))`, the same way functions are identified in calldata. A failing `require(msg.sender == owner, "not owner")` costs about 50 gas more than the same check written as `revert NotOwner(msg.sender)`, and the string makes the deployed contract longer.

Second, they can carry typed data. A custom error can include the values that triggered it: the caller's address, the amount that was short, the deadline that was missed. A frontend reading the revert from a failed transaction sees a structured object rather than a raw string. For example, an `InsufficientBalance(1000, 500)` revert tells the frontend how short the user was, which is far more useful than the string `"insufficient balance"`.

Third, they're integrated with off-chain tooling. Block explorers, frontends, and analysis libraries recognize custom error selectors and decode them automatically when the contract's ABI is known.

OpenZeppelin, Solady, and other production-quality libraries have moved to custom errors throughout.

## `require` with a string: the short form

`require(condition, "message")` takes a boolean condition and a string. If the condition is true, execution continues. If it's false, the call reverts with the provided message as the error reason. The first check in `withdraw` above becomes `require(msg.sender == owner, "not owner")`. `if (msg.sender != owner) revert("not owner");` is the same check written with `revert` and a string. The message has to be stored in the contract's bytecode and emitted as part of the revert data, and for frequently-called functions with many checks this adds up. Use a string message when you're writing a small contract, a test, or a prototype, and gas optimization doesn't matter yet.

## `assert`: invariants only

`assert(condition)` reverts if the condition is false, but it produces a different kind of revert from `require`. Where `require` and `revert` with a string produce an `Error(string)` revert, `assert` produces a `Panic(uint256)` revert.

The intent is also different. `assert` is for invariants that should never fail under any circumstances. If `assert(x > 0)` ever fires, it means there is a bug in the contract rather than a mistake by the user.

In practice, you'll write `assert` rarely. Solidity 0.8 automatically generates `Panic` reverts for arithmetic overflow, division by zero, out-of-bounds array access, and other common conditions that previously needed explicit `assert`. When you do reach for it, the use case is an arithmetic invariant the compiler can't infer from the surrounding code. `assert` takes no message, so the panic code is the only signal.

## Modifiers: reusing a check across many functions

In an owner-controlled contract, many state-mutating functions start with the same line: `require(msg.sender == owner, "not owner")`. Across ten functions, that's ten copies of the same check. If the check ever needs to change, you have to remember to update all ten.

A **modifier** is a named, reusable block of code that wraps a function. You write the check once, give it a name, and apply it to as many functions as you want.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Vault {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function withdraw(address to) external onlyOwner {
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "send failed");
    }

    function setOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
```

The `modifier onlyOwner() { ... }` block defines the check. The `_;` placeholder is the spot where the function body gets inserted at compile time. When you write `function withdraw(address to) external onlyOwner`, the compiled function is equivalent to:

```solidity
function withdraw(address to) external {
    // from the modifier
    require(msg.sender == owner, "not owner");
    // the function body
    (bool ok, ) = to.call{value: address(this).balance}("");
    require(ok, "send failed");
}
```

If you ever change `onlyOwner` to use a custom error or a different condition, every function carrying the modifier updates automatically.

## Arguments, code after the body, and several modifiers

A modifier can take parameters, just like a function:

```solidity
modifier onlyRole(bytes32 role) {
    require(hasRole(role, msg.sender), "missing role");
    _;
}

function adminAction() external onlyRole(ADMIN_ROLE) {
    // ...
}

function pauserAction() external onlyRole(PAUSER_ROLE) {
    // ...
}
```

This is the foundation of role-based access control.

The `_;` doesn't have to be the last statement in the modifier. Code after it runs after the function body executes. Reentrancy guards put code on both sides:

```solidity
modifier nonReentrant() {
    require(!locked, "reentrant call");
    locked = true;
    _;
    locked = false;
}
```

The guard sets a flag, executes the function, and clears the flag. If the function tries to re-enter through an external call, the second entry hits the `require` and reverts. The [reentrancy and denial-of-service lesson](/courses/development-on-ethereum/token-security-and-evm-internals/reentrancy-and-denial-of-service) explains the attack this guards against.

A function can have several modifiers. They're applied left to right:

```solidity
function emergencyWithdraw() external onlyOwner whenPaused nonReentrant {
    // ...
}
```

The compiled function checks `onlyOwner`, then `whenPaused`, then `nonReentrant`, then runs the body. After the body, whatever comes after `_;` in each modifier runs in reverse order. Order matters when the modifiers interact: putting `nonReentrant` before `onlyOwner` would lock the contract before checking authorization, which is wasteful when most failed calls are unauthorized.

Modifiers can also be `virtual` and `override`, the same way functions can. This lets a child contract change the behavior of a modifier without duplicating it. The [inheritance lesson](/courses/development-on-ethereum/solidity-basics/inheritance) covers both keywords.

OpenZeppelin provides `onlyOwner`, `whenNotPaused` and `whenPaused`, and `nonReentrant` as ready-to-inherit contracts (`Ownable`, `Pausable`, `ReentrancyGuard`).

## A modifier protects only the functions that carry it

Nothing forces you to apply a modifier. A function that should carry `onlyOwner` and doesn't still compiles, and any account can call it, because visibility is not access control (see the [functions lesson](/courses/development-on-ethereum/solidity-basics/functions)).

Modifiers have two smaller costs. The modifier's code is inserted into every function that uses it, so each use adds a copy to the contract's bytecode. And a modifier that changes state, like `nonReentrant`, does so outside the function body, where someone reading the function does not see it.

## Events are a write-only output for off-chain code

A state-mutating function can't return a value to its caller off-chain, as the [functions lesson](/courses/development-on-ethereum/solidity-basics/functions) explained, and applications don't read storage slot by slot. Frontends, indexers, and bots watch for **events**, which are structured records the contract emits as a side effect of execution.

Events live in transaction receipts, which are part of the chain but distinct from contract storage. Reading an event costs nothing if you're off-chain. In exchange, contracts cannot read their own events. There's no Solidity opcode that retrieves past log entries. Events are a write-only output channel from contracts to off-chain observers.

Storage is expensive because every full node maintains it forever. Logs are cheap because nodes can prune them if they want, though most don't. A contract that recorded every deposit as a storage entry would pay an SSTORE for each one. The same contract emitting the `Deposited` event below pays under 2,000 gas instead, and an off-chain indexer can reconstruct the full history by reading the logs.

## Declaring and emitting an event

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Bank {
    mapping(address => uint256) public balances;

    event Deposited(address indexed from, uint256 amount, uint256 timestamp);

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }
}
```

An `event` declaration looks like a function signature with no body. To fire one, you write `emit EventName(args)`. The event and its arguments get appended to the transaction's log entries. Once the transaction is mined, anyone who knows the contract's address and the event signature can find and decode the log entry. A frontend listens for `Deposited(address,uint256,uint256)` events from the contract and updates its UI when one arrives.

## Indexed parameters and the topic limit

Up to three of an event's parameters can be marked `indexed`. Indexed parameters are stored in special slots called **topics**, which are the indices that off-chain tools use to filter events.

```solidity
event Deposited(address indexed from, uint256 amount, uint256 indexed timestamp);
```

A frontend can ask "give me every `Deposited` event where `from == 0x1234...`" and get an efficient lookup, because `from` is indexed. The same query for `amount` would require scanning every event, since `amount` is not indexed.

The limit of three indexed fields comes from how Ethereum stores logs. Each log entry has up to four topics. Topic 0 is automatically the keccak256 hash of the event signature, like `keccak256("Deposited(address,uint256,uint256)")`. That leaves three topics free for indexed parameters.

For value types like `address`, `uint256`, and `bytes32`, the topic stores the value directly. For dynamic types like `string` and `bytes`, the topic stores the keccak256 hash of the value. This means you can filter by exact match on a string but you can't recover the original string from the log unless it's also passed as a non-indexed parameter.

The non-indexed parameters of an event get packed into the log's `data` field, which is unstructured bytes. Decoding `data` requires knowing the event ABI.

## Store what the contract reads, emit the rest

For each piece of data, ask whether the contract itself needs to read it on chain. If it does, store it, and if only off-chain code needs it, emit an event. A token contract stores balances, since it needs to check them on every transfer, but emits `Transfer` events for the historical record, since the chain itself doesn't need to remember individual transfers but frontends do. The [ERC-20 lesson](/courses/development-on-ethereum/token-security-and-evm-internals/what-is-erc-20) covers the standard `Transfer` and `Approval` events.
