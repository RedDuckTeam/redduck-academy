---
id: 142
title: Low-level calls
type: lecture
order: 4
faq:
  - question: Why is a low-level call preferred over transfer for sending ETH?
    answer: >-
      `transfer` and `send` forward only 2300 gas, a limit meant to block reentrancy. The 2019
      Istanbul hard fork raised the cost of some storage operations, and contracts doing
      ordinary bookkeeping in `receive` stopped fitting inside it. Use
      `recipient.call{value: amount}("")` and handle reentrancy with checks-effects-interactions
      and a guard.
  - question: My call failed but the transaction succeeded. Why?
    answer: >-
      `call` does not revert on failure. It returns a success flag and your code keeps running,
      so you check the flag and revert yourself with `require(ok)`.
  - question: What is the difference between call and delegatecall?
    answer: >-
      Whose context the code runs in. `call` runs the target's code in the target's storage
      with your contract as `msg.sender`. `delegatecall` runs the target's code in your
      storage, at your address, keeping the original `msg.sender`. Proxies and libraries are
      built on the second.
  - question: How did a delegatecall bug freeze $150 million in the Parity wallet?
    answer: >-
      Storage layout. Delegatecall writes by slot number, so borrowed code expecting its
      counter at slot 0 overwrites whatever the calling contract keeps there, such as the owner
      address. In the 2017 Parity multisig incident an attacker reached a library function that
      way, took ownership, and about $150M in ETH was frozen permanently.
---

> You've already used `.call{value: amount}("")` in the reentrancy lesson to send ETH. `call` forwards all but 1/64 of the remaining gas and returns a success flag instead of reverting, so checking the result is your job. `delegatecall` looks almost the same but runs the target's code on the calling contract's storage. It is the foundation of every proxy contract and every Solidity library, and one write to the wrong slot can give the contract to an attacker.

There are three ways one contract can call another. With a **high-level call** you import the other contract's interface and call its functions like normal Solidity code: `token.transfer(recipient, amount)`. The compiler handles the encoding for you. With a **low-level call** you build the call manually using `address.call(...)`. You specify the target, the value to send, and the calldata, and you handle encoding, return values, and errors yourself. A **low-level delegatecall** is built the same way, but executes the target's code in the calling contract's context.

You usually use the high-level form. The low-level forms exist for cases the high-level form can't handle: sending ETH to addresses that may or may not be contracts, calling functions on contracts whose interface you don't have at compile time, building proxy patterns, or interacting with libraries.

## `call` returns a flag instead of reverting

The simplest use of `call` is sending ETH:

```solidity
// Solidity 0.8.24, Ethereum mainnet
(bool ok, ) = recipient.call{value: 1 ether}("");
require(ok, "transfer failed");
```

This sends 1 ETH to `recipient`. The empty string `""` is the calldata. Empty means "no function call, just transfer ETH." If `recipient` is a contract, its `receive()` function runs, or its `fallback()` if there's no `receive`. If it's a wallet, the ETH just arrives.

`call` returns two values: `bool ok`, which says whether the call succeeded, and `bytes memory returnData`, which holds whatever the target returned.

If the call fails, `call` does not revert. It returns `ok = false` and your code continues, so you have to check `ok` and revert yourself. If you forget the check, your transaction succeeds although the ETH never left the contract.

## `call` vs `transfer` and `send`

Solidity has two other built-in ways to send ETH: `transfer` and `send`. You'll see them in older code. Here's the difference:

```solidity
recipient.transfer(1 ether);          // reverts on failure, forwards 2300 gas
bool ok = recipient.send(1 ether);    // returns bool, forwards 2300 gas
(bool ok, ) = recipient.call{value: 1 ether}("");  // returns bool, forwards all but 1/64 of gas
```

The 2300 gas limit on `transfer` and `send` was a deliberate design choice to prevent the receiving contract from doing much work in its `receive()`. The motivation was blocking reentrancy attacks. It worked, but it created a different problem.

In 2019, the Istanbul hard fork increased the gas cost of certain storage operations. Contracts whose `receive()` did simple bookkeeping that used to fit in 2300 gas no longer fit, so legitimate contracts couldn't receive ETH via `transfer`.

The modern recommendation is to use `call` without a gas limit, and protect against reentrancy explicitly using the patterns from the [previous lesson](/courses/development-on-ethereum/token-security-and-evm-internals/reentrancy-and-denial-of-service): checks-effects-interactions and reentrancy guards. `transfer` is not safer, only more fragile.

## Calling a function through `call`

`call` can also invoke a function on the target contract by name. You encode the function signature and arguments into the calldata. Say the target has a function `setName(string)` that returns a `bool`:

```solidity
(bool ok, bytes memory response) = target.call(
    abi.encodeWithSignature("setName(string)", "alice")
);
require(ok, "call failed");
bool result = abi.decode(response, (bool));  // true if setName returned true
```

`abi.encodeWithSignature` takes the function signature as a string, hashes it with `keccak256`, takes the first 4 bytes, which is the function selector from the [loops and hashing lesson](/courses/development-on-ethereum/solidity-basics/loops-and-hashing), and appends the encoded arguments. The return value comes back as raw bytes in `response`, and the type you pass to `abi.decode` has to match what the function actually returned.

A successful `call` does not prove that any code ran. If `target` is an address with no contract deployed, the call still returns `ok = true`, because the EVM does not check whether code exists at the target. When the target address comes from configuration or from a user, `require(ok)` will not catch a wrong address.

If you have the target's interface, you import it and call the function directly:

```solidity
interface IOther {
    function setName(string memory _name) external returns (bool);
}

IOther(target).setName("alice");
```

That's shorter and type-safe, and the compiler does the encoding. You reach for low-level `call` when:

- The target's interface isn't known at compile time, for example when the user passes the function name in as a parameter
- You're building a generic forwarder, multicall, or proxy contract
- You're handling cases where the call might fail and you need to inspect the failure

## `delegatecall` runs the target's code on your storage

`delegatecall` looks almost identical to `call`:

```solidity
(bool ok, bytes memory response) = target.delegatecall(
    abi.encodeWithSignature("doSomething()")
);
```

The difference is execution context. When you use `call`, the target's code runs in the target's context: the target's storage, the target's address, and your contract as its `msg.sender`. When you use `delegatecall`, the target's code runs in your contract's context: your storage, your address, and the same `msg.sender` and `msg.value` that your contract received.

`Helper` below knows how to record events, and `Main` uses Helper's logic in its own context:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Helper {
    event Recorded(address sender, uint256 amount);

    function record() external payable {
        emit Recorded(msg.sender, msg.value);
    }
}

contract Main {
    address public helper;

    constructor(address _helper) {
        helper = _helper;
    }

    function callRecord() external payable {
        (bool ok, ) = helper.delegatecall(
            abi.encodeWithSignature("record()")
        );
        require(ok, "delegatecall failed");
    }
}
```

When Alice calls `Main.callRecord{value: 2 ether}()`, `record()` runs inside Main. It sees Alice as `msg.sender` and 2 ETH as `msg.value`, and the ETH stays in Main. The event is emitted by Main rather than Helper. If you're watching Main's events, you see `Recorded` events from Main even though Main has no `Recorded` event declared. With a regular `call`, Helper would have seen Main as `msg.sender` and emitted the event itself.

Proxies rely on `msg.sender` being preserved. When you call a proxy, the proxy delegatecalls to the implementation, and to the implementation's code the original caller still looks like the original caller. The [proxies lesson](/courses/development-on-ethereum/token-security-and-evm-internals/upgradeable-contracts-and-proxies) covers how they are built.

## Both contracts must agree on what each slot holds

Storage is the flat array of numbered slots from the [mappings lesson](/courses/development-on-ethereum/solidity-basics/mappings), and the compiler decides which variable goes in which slot based on the order they're declared, starting at slot 0. The variable's name doesn't matter at the storage level, because source code that says `counter` compiles to reads and writes of a slot number. The [storage layout lesson](/courses/development-on-ethereum/token-security-and-evm-internals/storage-layout) covers the rules in detail.

This is fine when a contract uses its own storage. When one contract delegatecalls into another, the two contracts have to agree on what's in each slot. Consider:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Logic {
    uint256 public counter;

    function increment() external {
        counter += 1;
    }
}

contract Storage {
    address public owner;  // slot 0
    uint256 public counter;  // slot 1
    address public logic;  // slot 2

    function callIncrement() external {
        (bool ok, ) = logic.delegatecall(
            abi.encodeWithSignature("increment()")
        );
        require(ok);
    }
}
```

When `Storage.callIncrement()` runs, it delegatecalls into `Logic.increment()`. The `increment` function says "add 1 to `counter`," but Logic thinks `counter` is in slot 0. So it adds 1 to slot 0, which in Storage is `owner`. Adding 1 changes the stored address, so `owner` no longer points to the real owner.

The fix is to make the layouts match. Storage keeps `owner` at slot 0 and `counter` at slot 1, so Logic has to declare an `owner` at slot 0 too, even though it never uses it, and its `counter` then lands at slot 1. The price is that the two contracts can no longer change independently. Proxy patterns deal with this by being extremely strict about storage layout. The proxy and the implementation are designed together so their slots line up, and even adding a new variable at the wrong position can break a deployed proxy permanently.

## A write to the wrong slot can replace the code you delegate to

A mismatch becomes an attack when the slot holds something critical and the caller chooses the value written to it:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Vulnerable {
    address public helper;  // slot 0
    address public owner;   // slot 1

    constructor(address _helper) {
        helper = _helper;
        owner = msg.sender;
    }

    function doStuff(uint256 timestamp) external {
        (bool ok, ) = helper.delegatecall(
            abi.encodeWithSignature("doStuff(uint256)", timestamp)
        );
        require(ok);
    }
}

contract Helper {
    uint256 public lastTimestamp;  // slot 0

    function doStuff(uint256 timestamp) external {
        lastTimestamp = timestamp;
    }
}
```

Helper writes `timestamp` to its slot 0, which it thinks is `lastTimestamp`. But because this is a delegatecall running in Vulnerable's context, slot 0 is actually `helper`, an address.

An attacker can pass a `uint256` that, when interpreted as an address, points to their own malicious contract. After one call, Vulnerable's `helper` slot now points to the attacker's contract. The next time anyone calls `doStuff`, it delegatecalls into the attacker's contract instead of the original Helper.

The attacker's contract can have a `doStuff(uint256)` that does whatever it wants in Vulnerable's storage:

```solidity
contract Attacker {
    address public helper;  // slot 0 in Attacker's own layout
    address public owner;   // slot 1 in Attacker's own layout

    function doStuff(uint256) external {
        owner = msg.sender;  // writes to slot 1 in the delegatecall context
    }
}
```

After the attacker calls `doStuff` again, with the call now delegatecalling into their own contract, the `owner` field in Vulnerable is set to the attacker. From there, they can call any owner-only function: withdraw all funds, transfer ownership permanently, change parameters, whatever the contract allows.

## Know whose code writes to your storage

Two things went wrong in `Vulnerable`. Helper wrote to a slot that Vulnerable used for something else, and after that write the delegatecall target was no longer the code the author had deployed.

Matching the layouts prevents the first write. If Vulnerable has `helper` at slot 0 and `owner` at slot 1, then Helper should have placeholders at slot 0 and slot 1 that match, so that `lastTimestamp` lands in a slot Vulnerable does not use. When all you need is shared code, prefer a `library`. Solidity's `library` keyword uses delegatecall but with compiler-enforced constraints: libraries can't have state variables of their own, so the layout collision risk is removed.

But matching layouts only helps with code that you control. The target of a delegatecall has full power to modify your storage in arbitrary ways, whatever layout it declares, and `Attacker` declared the layout that let it reach `owner`. So only delegatecall to contracts you wrote or contracts whose code you've audited carefully, and make sure no outside caller can overwrite the target address.

In the 2017 **Parity multisig wallet** incident, the wallets delegatecalled to a library contract that wasn't expected to be callable externally, but was. An attacker triggered a function that wrote to a critical slot, and about $150 million worth of ETH was frozen permanently.

Before you write a `delegatecall`, answer three questions. Whose code will write to your storage? Can the target address change, and who can change it? Can you show that the code writes only to the slots it is meant to? If you can't answer all three, don't use `delegatecall`.
