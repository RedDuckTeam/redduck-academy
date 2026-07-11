---
id: 135
title: Errors, modifiers, and events
type: lecture
faq:
  - question: What actually happens to my state changes when a transaction reverts?
    answer: A revert stops the function immediately, rolls back every state change
      made during the call, and returns an error to the caller. Storage writes
      are undone, events emitted before the revert are dropped from the log as
      if they never happened, and any ETH forwarded to nested calls is returned.
      If it was the top-level transaction, the user still pays gas for the work
      done up to the revert, but nothing on chain is left changed.
  - question: Should I use require with a string message or a custom error in Solidity?
    answer: For production code, custom errors are preferred. A string revert reason
      costs roughly 50 gas of bytecode plus encoding, while a custom error is
      identified by just a 4-byte selector and is much cheaper. Custom errors
      can also carry typed data, such as the exact amount a user was short, and
      tooling like block explorers decodes them automatically. String messages
      in require are fine for small contracts, tests, and prototypes.
  - question: How do I reuse the same 'only the owner can call this' check across
      many functions?
    answer: Use a modifier, which is a named, reusable block of code that wraps a
      function. You write the check once, for example require(msg.sender ==
      owner, "not owner"), with a special _; placeholder marking where the
      function body gets inserted at compile time, then apply the modifier's
      name to any function. If the rule ever changes, you edit the modifier once
      and every function carrying it updates automatically.
  - question: If a function returns nothing, how does my frontend know a deposit
      happened?
    answer: The contract emits an event, which is a structured record appended to
      the transaction's logs when the function runs. Once the transaction is
      mined, any frontend or indexer that knows the contract address and event
      signature can find and decode it, so the app updates its UI when a
      matching event arrives. Up to three of an event's fields can be marked
      indexed, which lets off-chain tools efficiently filter for events matching
      a specific address or value.
---

> Three mechanisms that together control what a contract permits and what the outside world observes. A revert is how a contract says "no" to a call. State rolls back, the caller sees an error, and any ETH sent is returned. A modifier is how you reuse the same "no" conditions across many functions without duplicating the check. An event is how a successful call publishes what happened to off-chain observers, since state-mutating functions can't return values to wallets and frontends directly. The three handle the lifecycle of every interesting transaction. Should this call happen? What conditions does it need to satisfy? How do we tell the world it did?

## What a revert does

When a contract reverts, three things happen in order. The current function stops executing. Every state change made during the call is rolled back. An error is returned to the caller.

The state rollback covers everything the EVM did since the call began. Storage writes are undone. Memory and stack are discarded. Events emitted before the revert are dropped from the transaction log as if they never happened. ETH that was forwarded to nested calls returns up the call stack.

If the reverting call was the top-level transaction, the user pays gas for the work done up to the revert. The validator keeps the priority fee, but no state on chain has changed. The transaction occupies a slot in a block and consumes gas, but its intended effects do not take place. This is the EVM atomicity guarantee, viewed from the contract's side.

If the reverting call was a nested one made by another contract, the revert propagates up by default. The outer contract's call expression throws, which usually causes the outer call to revert too, all the way up to the top-level transaction.

Solidity gives you four ways to trigger a revert: `require`, `revert`, `assert`, and custom errors.

## `require`: the everyday check

`require` is the most common way to revert. Use it for input validation, authorization checks, and any precondition that callers might violate.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Vault {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function withdraw(address to, uint256 amount) external {
        require(msg.sender == owner, "not owner");
        require(amount <= address(this).balance, "insufficient balance");
        require(to != address(0), "zero address");
        // ... actual transfer logic ...
    }
}
```

`require(condition, "message")` takes a boolean condition and a string. If the condition is true, execution continues. If it's false, the call reverts with the provided message as the error reason.

The string form has a cost. The message has to be stored in the contract's bytecode and emitted as part of the revert data. A 32-byte message adds roughly 50 gas of bytecode to the deployed contract, plus encoding cost on every revert. For frequently-called functions with many require checks, this adds up.

## `revert`: the manual form

`revert` is the lower-level primitive that `require` is built on. It takes a single string argument and always reverts. To use it conditionally, wrap it in an `if`.

```solidity
function withdraw(address to, uint256 amount) external {
    if (msg.sender != owner) {
        revert("not owner");
    }
    // ...
}
```

This is functionally identical to `require(msg.sender == owner, "not owner")`. The `revert` form reads better when the condition for reverting is complex enough that rewriting it as a positive `require` would make it hard to read:

```solidity
function settle(uint256 amount) external {
    if (paused || (amount == 0 && msg.sender != owner)) {
        revert("invalid call");
    }
    // ...
}
```

The two forms compile to the same bytecode. The choice is stylistic.

## Custom errors: the modern form

In Solidity 0.8.4, the language gained **custom errors**. They're the preferred way to revert in production code today, for three reasons.

First, they're dramatically cheaper. A custom error is identified by a 4-byte selector, the first 4 bytes of `keccak256(errorName(types))`, the same way functions are identified in calldata. A typical string revert reason costs around 50 gas of bytecode plus the cost of the revert opcode. A custom error costs around 4 gas to encode and is shorter in deployed bytecode.

Second, they can carry typed data. A string reason is just a string. A custom error can include the values that triggered it: the caller's address, the amount that was short, the deadline that was missed.

Third, they're integrated with off-chain tooling. Block explorers, frontends, and analysis libraries recognize custom error selectors and decode them automatically when the contract's ABI is known.

Here's the same Vault written with custom errors:

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

A frontend reading the revert from a failed transaction sees a structured object, not a raw string. For example, an `InsufficientBalance(1000, 500)` revert tells the frontend exactly how short the user was, which is far more useful than the string `"insufficient balance"`.

`require` was also overloaded to accept a custom error as its second argument starting in 0.8.26 via the via-IR pipeline, with full legacy-pipeline support from 0.8.27:

```solidity
error NotOwner();
require(msg.sender == owner, NotOwner());
```

This combines the readability of `require` with the gas efficiency of custom errors.

OpenZeppelin, Solady, and other production-quality libraries have moved to custom errors throughout. New code should follow.

## `assert`: invariants only

`assert(condition)` reverts if the condition is false, but it produces a different kind of revert from `require`. Where `require` and `revert` produce an `Error(string)` revert, `assert` produces a `Panic(uint256)` revert.

The intent is also different. `assert` is for invariants that should never fail under any circumstances. If `assert(x > 0)` ever fires, it means there's a bug in the contract, not that a user did something wrong. A panic indicates the contract reached a state the developer believed to be unreachable.

In practice, you'll write `assert` rarely. Solidity 0.8 automatically generates `Panic` reverts for arithmetic overflow, division by zero, out-of-bounds array access, and other common conditions that previously needed explicit `assert`. The compiler handles what `assert` used to do.

When you do reach for it, the use case is an arithmetic invariant the compiler can't infer from the surrounding code. `assert` takes no message. The panic code is the only signal.

## When to use which

- **Custom errors** for any revert in code that will go to production. They're the cheapest, the most informative, and the modern standard.
- **`require`**** with a string message** when you're writing a small contract, a test, or a prototype, and gas optimization doesn't matter yet.
- **`revert`**** with a string message** when the predicate is awkward to express as a positive `require`.
- **`assert`** for invariants you genuinely believe cannot fail. Rare in 0.8+ code.

## Modifiers: reusing a check across many functions

Look at the Vault again. In an owner-controlled contract, many state-mutating functions start with the same line: `require(msg.sender == owner, "not owner")`. Across ten functions, that's ten copies of the same check. If the check ever needs to change, you have to remember to update all ten.

Solidity has a feature for exactly this: **modifiers**. A modifier is a named, reusable block of code that wraps a function. You write the check once, give it a name, and apply it to as many functions as you want.

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
        payable(to).transfer(address(this).balance);
    }

    function setOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
```

The `modifier onlyOwner() { ... }` block defines the check. The `_;` placeholder is the spot where the function body gets inserted at compile time. When you write `function withdraw(address to) external onlyOwner`, the compiled function is equivalent to:

```solidity
function withdraw(address to) external {
    require(msg.sender == owner, "not owner");  // from the modifier
    payable(to).transfer(address(this).balance); // the function body
}
```

The check is now declared once and applied wherever needed. If you ever change `onlyOwner` to use a custom error or a different condition, every function carrying the modifier updates automatically.

## Modifiers with arguments

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

This is the foundation of role-based access control. One modifier, many uses, each with a different role identifier.

## Code before and after the body

The `_;` doesn't have to be the last statement in the modifier. You can put code after it as well, which runs after the function body executes:

```solidity
modifier logged() {
    emit CallStarted(msg.sender);
    _;
    emit CallFinished(msg.sender);
}
```

The pre-check pattern uses code before `_;`. The post-check pattern uses code after. The combined pattern, with code on both sides, shows up in production for things like reentrancy guards:

```solidity
modifier nonReentrant() {
    require(!locked, "reentrant call");
    locked = true;
    _;
    locked = false;
}
```

The guard sets a flag, executes the function, and clears the flag. If the function tries to re-enter through an external call, the second entry hits the `require` and reverts.

## Multiple modifiers, and modifier inheritance

A function can have several modifiers. They're applied left to right:

```solidity
function emergencyWithdraw() external onlyOwner whenPaused nonReentrant {
    // ...
}
```

The compiled function checks `onlyOwner`, then `whenPaused`, then `nonReentrant`, then runs the body. After the body, whatever comes after `_;` in each modifier runs in reverse order. Order matters when the modifiers interact: putting `nonReentrant` before `onlyOwner` would lock the contract before checking authorization, which is wasteful when most failed calls are unauthorized.

Modifiers can also be `virtual` and `override`, the same way functions can. This lets a child contract change the behavior of a modifier without duplicating it.

The three canonical production modifier patterns to recognize:

- `onlyOwner` for single-admin contracts
- `whenNotPaused` and `whenPaused` for pausable contracts
- `nonReentrant` for protection against reentrancy via external calls

OpenZeppelin provides all three as ready-to-inherit contracts (`Ownable`, `Pausable`, `ReentrancyGuard`).

## Events: telling the world what happened

When a contract's state changes, the chain itself knows what happened, but applications don't read storage slot by slot. Frontends, indexers, and bots watch for **events**, which are structured records the contract emits as a side effect of execution.

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

An `event` declaration looks like a function signature with no body. To fire one, you write `emit EventName(args)`. The event and its arguments get appended to the transaction's log entries. Once the transaction is mined, anyone who knows the contract's address and the event signature can find and decode the log entry.

This is the primary way state-mutating functions report results to off-chain code. A state-mutating function like `deposit()` can't return a value to its caller off-chain, so it emits an event instead. A frontend listens for `Deposited(address,uint256,uint256)` events from the contract and updates its UI when one arrives.

## Indexed parameters and the topic limit

Up to three of an event's parameters can be marked `indexed`. Indexed parameters are stored in special slots called **topics**, which are the indices that off-chain tools use to filter events.

```solidity
event Deposited(address indexed from, uint256 amount, uint256 indexed timestamp);
```

A frontend can ask "give me every `Deposited` event where `from == 0x1234...`" and get an efficient lookup, because `from` is indexed. The same query for `amount` would require scanning every event, since `amount` is not indexed.

The "three indexed fields" limit comes from how Ethereum stores logs. Each log entry has up to four topics. Topic 0 is automatically the keccak256 hash of the event signature, like `keccak256("Deposited(address,uint256,uint256)")`. That leaves three topics free for indexed parameters.

For value types like `address`, `uint256`, and `bytes32`, the topic stores the value directly. For dynamic types like `string` and `bytes`, the topic stores the keccak256 hash of the value. The original value is not recoverable from the topic alone. This means you can filter by exact match on a string but you can't recover the original string from the log unless it's also passed as a non-indexed parameter.

The non-indexed parameters of an event get packed into the log's `data` field, which is essentially unstructured bytes. Decoding `data` requires knowing the event ABI.

## Why events exist as a separate facility

Events live in transaction receipts, which are part of the chain but distinct from contract storage. Reading an event costs nothing if you're off-chain. The trade-off: contracts cannot read their own events. There's no Solidity opcode that retrieves past log entries. Events are a write-only output channel from contracts to off-chain observers.

This separation is intentional and useful. Storage is expensive because every full node maintains it forever. Logs are cheap because nodes can prune them if they want, though most don't. A contract that recorded every deposit as a storage entry would pay an SSTORE for each one. The same contract emitting a `Deposited` event pays a few hundred gas instead, and an off-chain indexer can reconstruct the full history by reading the logs.

The standard pattern: store what the contract itself needs to read on chain, emit events for everything else. A token contract stores balances, since it needs to check them on every transfer, but emits `Transfer` events for the historical record, since the chain itself doesn't need to remember individual transfers but frontends do.

## Standard events you'll recognize

A handful of events are so common that every Ethereum developer reads them by sight:

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);     // ERC-20
event Approval(address indexed owner, address indexed spender, uint256 value); // ERC-20
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId); // ERC-721
```

The ERC-20 `Transfer` event fires on every token movement. Wallets read it to display balance changes. Indexers like The Graph, Dune, and Etherscan read it to build token databases. ERC-721 reuses the same name but indexes `tokenId` instead of value, since NFTs are unique. Recognizing these signatures lets you understand most token contracts quickly.
