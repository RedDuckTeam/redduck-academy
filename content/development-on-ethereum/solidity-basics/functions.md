---
id: 134
title: Functions
type: lecture
order: 8
faq:
  - question: What is the difference between a public and an external function in
      Solidity?
    answer: "Both can be called from outside the contract, but an external function
      cannot be called by the contract's own code directly (only via
      this.functionName(), which costs extra). The key difference is gas:
      external functions read their arguments straight from calldata, while
      public functions may copy arguments into memory in case an internal caller
      uses them, which is more expensive for large inputs. Use external when a
      function is only meant to be called from the outside."
  - question: Why can I call a view function for free but a normal function costs gas?
    answer: A function marked view or pure does not change anything on chain, so any
      node can compute its answer locally in memory using the eth_call RPC
      method, with no transaction, no block, and no gas. A function that
      modifies state must go through a real transaction that is mined into a
      block and re-run by every full node, which is where the gas cost comes
      from. So reading state from a frontend is free and instant, while writing
      state costs gas and takes seconds.
  - question: Why can't my frontend read the value returned by a function that
      changes state?
    answer: This is a property of how Ethereum transactions work rather than a Solidity
      limitation. When a state-changing transaction is mined, the network only
      records whether it succeeded or reverted, so off-chain
      code never sees the return value. To send results back to a frontend, the
      contract emits an event, which is written to the transaction receipt where
      wallets and indexers can read it.
  - question: What is the difference between receive and fallback in a Solidity contract?
    answer: receive() runs when ETH is sent to the contract with no data attached,
      like a plain wallet transfer, and it must be external payable. fallback()
      runs when a call targets a function the contract does not define, or when
      ETH arrives with data that matches no function. If a contract has neither,
      plain ETH transfers and calls to unknown functions both revert, which is
      why contracts that accept deposits usually define at least an empty
      receive().
---

A Solidity function signature is dense. Every keyword in it, from visibility to mutability to data location, decides who can call the function, whether it can touch state, and what it costs to run. Once you can read those keywords, you can predict any function's behavior from its declaration alone.

## The shape of a function

A function declaration has the form:

```solidity
function name(parameters) visibility [mutability] [modifiers] [returns (types)] {
    // body
}
```

Visibility is required. The brackets denote optional pieces. The mutability annotation is one of them: add `view` if the function only reads state, `pure` if it reads nothing, and leave it off if the function modifies state. Names follow `mixedCase` convention: first word lowercase, subsequent words capitalized, no underscores.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Counter {
    uint256 public count;

    function increment() external {
        count += 1;
    }

    function getCount() external view returns (uint256) {
        return count;
    }
}
```

`increment` is an external state-mutating function. `getCount` is an external view function. Both have no parameters and no modifiers. The difference between them, and what each piece of the signature actually means, is what the rest of this lesson covers.

## Visibility: who can call this

Every function declares one of four visibility levels. The choice affects what code can call the function and how the arguments are passed internally.

**`public`** functions can be called from anywhere. Off-chain callers can invoke them via transactions. Other contracts can call them. The contract's own code can call them. This is the most permissive option. Production code rarely needs it.

**`external`** functions can only be called from outside the contract. An off-chain transaction or a call from another contract works. The contract calling its own `external` function does not, unless it goes through `this.functionName()` which is itself an external call and costs extra gas. The key reason `external` exists is gas efficiency. It lets the compiler read arguments directly from calldata. This is significantly cheaper than the `public` case, where arguments have to be copied into memory in case an internal caller passes them. For functions with large reference-type parameters like `bytes calldata` or `uint256[] calldata`, this difference can be hundreds of gas per call.

**`internal`** functions can be called from inside the contract and from contracts that inherit from it. They cannot be called from outside. This is the right visibility for helper functions, shared logic that subclasses extend, and any code you want exposed to the contract family but not to external callers.

**`private`** functions are even more restrictive. They can only be called from inside the same contract. Inheriting contracts cannot reach them. Use `private` when you want to be explicit that no subclass should call this function, but note that `private` is not a security boundary. The bytecode is still on chain. Anyone reading the contract's bytecode can see what private functions do.

For state variables, the same four keywords apply with slightly different effects. A `public` state variable auto-generates a getter function. An `internal` one is accessible to inheriting contracts. A `private` one is not. There is no `external` for state variables.

If you don't specify a visibility for a function, the compiler refuses to compile. There is no implicit default.

## State mutability: what this can touch

A function that doesn't modify state has options for advertising that fact, which unlocks cheaper invocation patterns. The two relevant modifiers are `view` and `pure`.

**`view`** declares that the function reads state but doesn't modify it. Reading state variables is fine. Reading `block.number`, `block.timestamp`, the contract's own balance, or another contract's storage via a view function call is fine. Writing anything, emitting events, calling non-view functions on other contracts, or sending ETH is forbidden. The compiler enforces this.

**`pure`** is stricter. A pure function reads neither state nor the chain. It can compute results from its arguments and local variables only. Pure functions are essentially regular language functions that happen to be written in Solidity. They take inputs, return outputs, touch nothing.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Tokens {
    uint256 public totalSupply;
    uint256 public price;

    function balanceLeft() external view returns (uint256) {
        return totalSupply - 1000;   // reads state, allowed in view
    }

    function quote(uint256 tokens) external view returns (uint256) {
        return tokens * price;       // reads state, allowed in view
    }

    function tokensFor(uint256 amount, uint256 rate) external pure returns (uint256) {
        return amount * rate;        // no state, pure is fine
    }
}
```

`balanceLeft` and `quote` both read state, so they need `view`. `tokensFor` is a calculation over its arguments only, so it can be `pure`.

The mutability annotation is checked at compile time. A `view` function that tries to write state, or a `pure` function that tries to read state, is a compile error.

If a function modifies state, you don't write any mutability modifier at all. The absence is the marker.

## Why view and pure functions are free to call

A function annotated `view` or `pure` doesn't change anything on chain. That means a node can answer the question "what does this function return?" by running it locally, in memory, without making it part of any block. There's no transaction, no consensus, no gas paid by anyone. The RPC method `eth_call` does exactly this.

A function that modifies state can't work that way. To change the chain's state, the operation has to go through a transaction, get mined into a block, and be applied by every full node. That's where the gas cost comes from: every node runs the function as part of validating the block.

The practical consequence: calling `getCount` from your frontend is free, instant, and doesn't need a connected wallet. Calling `increment` costs gas, requires a signed transaction, and takes a few seconds to be mined. The mutability annotation `view` or `pure` is the signal that switches between these two worlds.

The same function can be called either way from contract code. When contract A calls `B.getCount()` from inside its own state-mutating function, it costs gas as part of A's transaction. When the same function is called from a frontend's `eth_call`, it's free. The cost depends on the calling context rather than the function itself.

## Return values

A function that returns something declares the return type after the keyword `returns`:

```solidity
function getCount() external view returns (uint256) {
    return count;
}
```

The return value is computed and passed back to the caller. For off-chain callers of a view function, this is the value that arrives in your frontend. For internal callers, it's the value of the function call expression.

Solidity supports multiple return values with the same syntax:

```solidity
function getPair() external view returns (address token, uint256 amount) {
    return (tokenAddress, balance);
}
```

The caller can destructure the result:

```solidity
(address t, uint256 a) = getPair();
```

There's also a less common form called **named returns**. You declare the return values with names in the `returns` clause, then assign to those names inside the function. An implicit `return` happens at the end of the function.

```solidity
function getCount() external view returns (uint256 result) {
    result = count;
    // no explicit return needed
}
```

The two forms produce the same compiled output. Named returns can be useful when the function has multiple exit points and you want to set the return value in one place. Explicit `return` statements are clearer for short functions. Both are used in production code.

One subtle but important point about state-mutating functions. They can declare return values, and other contracts calling them can read those return values. But **off-chain callers cannot read the return value of a state-mutating transaction**. This is a property of how Ethereum transactions work rather than of Solidity. At the moment a transaction is signed and broadcast, its eventual return value is unknown. By the time the transaction is mined, the network only records whether it succeeded or reverted, never what it returned. To communicate results from state-mutating functions to off-chain code, contracts emit events, which are written to the transaction receipt and are readable by frontends and indexers.

## Function arguments

Function parameters are declared in parentheses, with a type for each:

```solidity
function transfer(address to, uint256 amount) external returns (bool) {
    // ...
}
```

For value type parameters, that's all you need. For reference type parameters, you must specify a data location. `string`, `bytes`, dynamic arrays, and structs all need `memory` or `calldata`:

```solidity
function process(uint256[] calldata items, string memory note) external {
    // ...
}
```

`calldata` is the cheapest option for read-only inputs in `external` functions. The data is read directly from the transaction's input bytes without being copied. `memory` works in any context and is required if you intend to modify the parameter inside the function. For `internal` and `public` functions, `calldata` is not always allowed and `memory` is the safe default.

Function parameters are positional. Solidity does not support named arguments at the call site. The order in the declaration is the order callers must use.

## Constructors

A constructor is a special function that runs exactly once, when the contract is deployed. It's the right place to set immutable values, initial state, and the owner address.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Owned {
    address public immutable owner;
    uint256 public createdAt;

    constructor() {
        owner = msg.sender;
        createdAt = block.timestamp;
    }
}
```

The constructor uses the keyword `constructor`, not `function`. It has no name, no visibility annotation, and no return type. It can take arguments, which are supplied at deployment time. It can be marked `payable` to accept ETH on deployment, but it's rarely necessary.

After the constructor finishes, it's gone. The bytecode of the deployed contract does not include the constructor. This is why a constructor's code is sometimes called the "creation code" and the post-constructor bytecode is called the "runtime code." The two are distinct.

## Payable: accepting ETH

By default, a function rejects any ETH attached to the call. If a transaction with non-zero value calls a non-payable function, the EVM reverts.

To accept ETH, mark the function `payable`:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Tipping {
    mapping(address => uint256) public totalTipped;

    function tip() external payable {
        totalTipped[msg.sender] += msg.value;
    }
}
```

Inside a `payable` function, `msg.value` is the amount of ETH in wei that the caller sent. Outside a `payable` function, `msg.value` is always zero. The ETH is automatically credited to the contract's balance the moment the function is entered. There's no explicit transfer.

A `payable` function can also be marked with other modifiers. `external payable` is the most common combination. `public payable` is also valid. You can't combine `payable` with `view` or `pure`, since accepting ETH is itself a state change.

## Receive and fallback: handling untargeted calls

Two special functions handle cases where a transaction arrives at the contract without targeting a specific function.

**`receive()`** runs when ETH is sent to the contract with no data, like a plain transfer from a wallet. It must be marked `external payable` and takes no arguments. It returns nothing.

```solidity
contract Vault {
    receive() external payable {
        // optional: emit an event, update state, etc.
    }
}
```

If a contract has no `receive` function, plain ETH transfers to it revert. Most contracts that hold ETH define `receive` even if its body is empty, just to permit deposits via wallet UIs.

**`fallback()`** runs when a transaction calls a function the contract doesn't define, or when ETH is sent with data that doesn't match any function. It can be marked `external` or `external payable`. If marked `payable`, it also handles ETH sent with arbitrary data.

```solidity
contract Proxy {
    fallback() external payable {
        // typically used in proxy patterns to forward calls
    }
}
```

The two functions exist because the EVM doesn't have a built-in notion of "method not found." Without a fallback, any call to an unknown function selector reverts. With a fallback, the contract gets a chance to handle it. This is what proxy contracts use to forward calls to an implementation contract.

The relationship: if a transaction arrives with no data, `receive` is preferred over `fallback`. If it arrives with data but no matching function, `fallback` is used. If neither exists, the call reverts.

A note on older code: in early Solidity, both behaviors were handled by a single unnamed function. The split into `receive` and `fallback` happened in 0.6.0. You'll occasionally see legacy contracts that use the older form, and modernization just means splitting them into the two new ones.
