---
id: 134
title: Functions
type: lecture
order: 8
faq:
  - question: What is the difference between a public and an external function?
    answer: >-
      Both are callable from outside. An external function reads its arguments straight from
      calldata, while a public one may copy them into memory for internal callers, costing
      hundreds of gas on a large array. The contract's own code reaches an external function
      only through this.functionName().
  - question: Why can I call a view function for free?
    answer: >-
      It changes nothing, so any node runs it locally through eth_call. No transaction, no
      block, no gas. Writing state needs a transaction that every full node re-executes, and
      that is what gas pays for.
  - question: Why can't my frontend read the value a state-changing function returned?
    answer: >-
      The network records only whether the transaction succeeded or reverted. Emit an event
      instead, which lands in the transaction receipt where wallets and indexers read it.
  - question: What is the difference between receive and fallback?
    answer: >-
      receive() runs when ETH arrives with no calldata and must be external payable.
      fallback() runs when a call names no function the contract defines, or when ETH
      arrives with data. With neither, both revert. The two were split apart in Solidity
      0.6.0.
  - question: Can a payable function also be view?
    answer: >-
      No. Accepting ETH is itself a state change.
---

A Solidity function signature is dense. Every keyword in it, from visibility to mutability to data location, decides where the function can be called from, whether it can touch state, and what it costs to run. Once you can read those keywords, you can answer these questions for any function from its declaration alone.

## The shape of a function

A function declaration has the form:

```solidity
function name(parameters) visibility [mutability] [modifiers] [returns (types)] {
    // body
}
```

Visibility is required. If you don't specify it, the compiler refuses to compile, and there is no implicit default. The brackets denote optional pieces. The mutability annotation is one of them: add `view` if the function only reads state, `pure` if it reads nothing, and leave it off if the function modifies state. Names follow `mixedCase` convention: first word lowercase, subsequent words capitalized, no underscores.

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

`increment` is an external state-mutating function. `getCount` is an external view function.

## Visibility: where a function can be called from

The EVM has no notion of functions. A deployed contract is one sequence of bytecode, and a call from outside brings calldata whose first 4 bytes, the selector, tell the contract's code which function to run. The [loops and hashing lesson](/courses/development-on-ethereum/solidity-basics/loops-and-hashing) shows how a selector is computed. Visibility says whether a function can be called this way from outside, and whether the contract's own code can call it directly.

| Visibility | From outside the contract | From the contract's own code | From inheriting contracts |
| --- | --- | --- | --- |
| `public` | yes | yes | yes |
| `external` | yes | only through `this.functionName()` | only through `this.functionName()` |
| `internal` | no | yes | yes |
| `private` | no | yes | no |

Outside means an off-chain transaction or a call from another contract. `this.functionName()` is itself an external call and costs extra gas.

`public` is the most permissive option. Production code rarely needs it. The key reason `external` exists is gas efficiency. It lets the compiler read arguments directly from calldata. This is significantly cheaper than the `public` case, where arguments may be copied into memory in case an internal caller passes them. For functions with large reference-type parameters like `bytes calldata` or `uint256[] calldata`, this difference can be hundreds of gas per call.

`internal` is the right visibility for helper functions, shared logic that subclasses extend, and any code you want exposed to the contract family but not to external callers. Use `private` when you want to be explicit that no subclass should call this function, but note that `private` is not a security boundary. The bytecode is still on chain, and anyone reading it can see what private functions do.

Visibility is not access control. It says where a call can come from, not who makes it, so an `external` or `public` function can be called by any account and any contract. Who is allowed to call it is decided by a check on `msg.sender`, which the [next lesson](/courses/development-on-ethereum/solidity-basics/errors-modifiers-and-events) covers. In the 2017 Parity multisig incident, a library contract could be called externally although nobody expected it to be. An attacker triggered a function in it, and about $150 million worth of ETH was frozen permanently. The wallets reached that library through `delegatecall`. The [low-level calls lesson](/courses/development-on-ethereum/token-security-and-evm-internals/low-level-calls) explains `delegatecall` and comes back to this incident.

For state variables, the same four keywords apply with slightly different effects. A `public` state variable auto-generates a getter function. An `internal` one is accessible to inheriting contracts. A `private` one is not. There is no `external` for state variables.

## State mutability: what this can touch

A function that doesn't modify state has options for advertising that fact, which unlocks cheaper invocation patterns. The two relevant modifiers are `view` and `pure`.

**`view`** declares that the function reads state but doesn't modify it. Reading state variables is fine. Reading `block.number`, `block.timestamp`, the contract's own balance, or another contract's storage via a view function call is fine. Writing anything, emitting events, calling non-view functions on other contracts, or sending ETH is forbidden.

**`pure`** is stricter. A pure function reads neither state nor the chain. It can compute results from its arguments and local variables only.

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

The mutability annotation is checked at compile time. A `view` function that tries to write state, or a `pure` function that tries to read state, is a compile error.

## Why view and pure functions are free to call

A function annotated `view` or `pure` doesn't change anything on chain. That means a node can answer the question "what does this function return?" by running it locally, in memory, without making it part of any block. No transaction is sent and nobody pays gas. The RPC method `eth_call` does this.

A function that modifies state can't work that way. To change the chain's state, the operation has to go through a transaction, get mined into a block, and be applied by every full node. That's where the gas cost comes from: every node runs the function as part of validating the block.

So calling `getCount` from your frontend is free, instant, and doesn't need a connected wallet. Calling `increment` costs gas, requires a signed transaction, and takes a few seconds to be mined.

The cost depends on the calling context rather than the function itself. When contract A calls `B.getCount()` from inside its own state-mutating function, it costs gas as part of A's transaction. When the same function is called from a frontend's `eth_call`, it's free.

## Return values

Solidity supports multiple return values:

```solidity
function getPair() external view returns (address token, uint256 amount) {
    return (tokenAddress, balance);
}
```

The caller can destructure the result:

```solidity
(address t, uint256 a) = getPair();
```

The `returns` clause can also name the values, as `getPair` does. With such **named returns** you can assign to the names inside the function, and an implicit `return` happens at the end.

State-mutating functions can declare return values, and other contracts calling them can read those return values. But **off-chain callers cannot read the return value of a state-mutating transaction**. This is a property of how Ethereum transactions work rather than of Solidity. At the moment a transaction is signed and broadcast, its eventual return value is unknown. By the time the transaction is mined, the network only records whether it succeeded or reverted, never what it returned. To communicate results from state-mutating functions to off-chain code, contracts emit events, which are written to the transaction receipt and are readable by frontends and indexers.

## Function arguments

Value type parameters need only a type. For reference type parameters, you must specify a data location. `string`, `bytes`, dynamic arrays, and structs all need `memory` or `calldata`:

```solidity
function process(uint256[] calldata items, string memory note) external {
    // ...
}
```

`calldata` is the cheapest option for read-only inputs in `external` functions. The data is read directly from the transaction's input bytes without being copied. `memory` works in any context and is required if you intend to modify the parameter inside the function. A `uint256[] calldata` parameter also compiles on `public` and `internal` functions, but an internal call that passes it a `memory` array does not compile.

Arguments are normally passed by position, in the order of the declaration. A call can also name them, as in `f({to: a, amount: 1})`, and named arguments can go in any order.

## Constructors

A constructor is a special function that runs once, when the contract is deployed. It's the right place to set immutable values, initial state, and the owner address.

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

The bytecode of the deployed contract does not include the constructor. The constructor is part of the creation code, which runs at deployment and returns the runtime code that stays on chain, as the [contracts and gas lesson](/courses/development-on-ethereum/how-ethereum-works/contracts-and-gas) describes.

## Payable: accepting ETH

By default, a function rejects any ETH attached to the call. If a transaction with non-zero value calls a non-payable function, a check that Solidity adds to the function reverts the call.

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

The ETH is automatically credited to the contract's balance the moment the function is entered, with no explicit transfer.

`external payable` is the most common combination. `public payable` is also valid. You can't combine `payable` with `view` or `pure`, since accepting ETH is itself a state change.

## Receive and fallback: handling untargeted calls

Two special functions handle cases where a transaction arrives at the contract without targeting a specific function.

**`receive()`** runs when ETH is sent to the contract with no data, like a plain transfer from a wallet. It must be marked `external payable`, takes no arguments, and returns nothing.

```solidity
contract Vault {
    receive() external payable {
        // optional: emit an event, update state, etc.
    }
}
```

If a contract has neither `receive` nor a payable `fallback`, plain ETH transfers to it revert. Most contracts that hold ETH define `receive` even if its body is empty, just to permit deposits via wallet UIs.

**`fallback()`** runs when a transaction calls a function the contract doesn't define, or when ETH is sent with data that doesn't match any function. It can be marked `external` or `external payable`. If marked `payable`, it also handles ETH sent with arbitrary data.

```solidity
contract Proxy {
    fallback() external payable {
        // typically used in proxy patterns to forward calls
    }
}
```

The two functions exist because the EVM doesn't have a built-in notion of "method not found." Without a fallback, any call to an unknown function selector reverts. With a fallback, the contract gets a chance to handle it. Proxy contracts use it to forward calls to an implementation contract.

If a transaction arrives with no data, `receive` is preferred over `fallback`. If it arrives with data but no matching function, `fallback` is used. If neither exists, the call reverts.

## Read a function from its signature

Three questions can be answered from the keywords alone: where the function can be called from, whether it can change state, and whether it accepts ETH. Answer them for these signatures from the lesson:

- `function tip() external payable`
- `function tokensFor(uint256 amount, uint256 rate) external pure returns (uint256)`
- `receive() external payable`

None of these keywords says who is allowed to make the call. An `external` function with no check on `msg.sender` is open to everyone.
