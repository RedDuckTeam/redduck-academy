---
id: 142
title: Low-level calls
type: lecture
order: 4
faq:
  - question: Why is call now recommended over transfer for sending ETH in Solidity?
    answer: 'The older `transfer` and `send` only forward 2300 gas to the receiver,
      which was meant to block reentrancy. In 2019 the Istanbul hard fork raised
      the cost of some operations, so legitimate contracts doing simple
      bookkeeping in their receive function could no longer afford to accept ETH
      via `transfer`. The modern advice is to use `recipient.call{value:
      amount}("")`, which forwards all gas, and to protect against reentrancy
      explicitly with checks-effects-interactions and reentrancy guards.'
  - question: If a low-level call fails, does my transaction automatically revert?
    answer: 'No. Unlike a normal function call, `call` does not revert on failure.
      It returns a boolean success flag (and any return data), and your code
      keeps running even if the call failed. You must check that flag yourself
      and revert if it is false, for example `(bool ok, ) =
      recipient.call{value: 1 ether}(""); require(ok, "transfer failed");`.
      Forgetting this check is a common bug where you think ETH was sent but it
      silently failed.'
  - question: What is the difference between call and delegatecall?
    answer: "With `call`, the target contract's code runs in the target's own
      context: its storage, its address, and it sees your contract as the
      caller. With `delegatecall`, the target's code runs but in your context:
      it reads and writes your storage, uses your address, and keeps the
      original caller as `msg.sender`. In short, `call` means 'run their
      function on their stuff' while `delegatecall` means 'borrow their code and
      run it on our stuff'. This is why delegatecall is the foundation of
      proxies and libraries."
  - question: How did the Parity wallet lose $150 million to a delegatecall bug?
    answer: Because delegatecall runs another contract's code against your own
      storage, the two contracts must agree on which variable lives in which
      numbered storage slot. If they don't match, the borrowed code can
      overwrite a critical slot such as the one holding the owner address. In
      the 2017 Parity multisig incident, an attacker triggered a library
      function through delegatecall that wrote to a sensitive slot, took
      ownership, and ultimately froze about $150M permanently. The defenses are
      strict storage-layout discipline and never delegatecalling to untrusted
      contracts.
---

> You've already used `.call{value: amount}("")` in the reentrancy lesson to send ETH. You did that without anyone explaining what `call` really is or what alternatives exist. This lesson fills that gap and introduces a sibling function called `delegatecall` that looks similar but works in a way most people find surprising the first time they see it. `delegatecall` is the foundation of every proxy contract and every Solidity library, and it's also the source of one of the more devastating attack patterns in smart contract history. Both functions are important. Both are easy to misuse.

## Why contracts call other contracts

A real protocol is never a single contract. A token might be on one contract. A DEX that trades it might be on another. A staking contract that holds it might be on a third. They all need to talk to each other.

There are three ways one contract can interact with another:

**High-level call.** You import the other contract's interface and call its functions like normal Solidity code: `token.transfer(recipient, amount)`. This is what most code looks like. The compiler handles the encoding for you.

**Low-level ****`call`****.** You build the call manually using `address.call(...)`. You specify the target, the value to send, and the calldata. The compiler does nothing for you. You handle encoding, return values, and errors yourself.

**Low-level ****`delegatecall`****.** Similar to `call`, but executes the target's code in YOUR contract's context. We'll get to what that means.

You usually use the high-level form. The low-level forms exist for cases the high-level form can't handle: sending ETH to addresses that may or may not be contracts, calling functions on contracts whose interface you don't have at compile time, building proxy patterns, or interacting with libraries.

## `call` for sending ETH

The simplest use of `call` is sending ETH:

```solidity
// Solidity 0.8.24, Ethereum mainnet
(bool ok, ) = recipient.call{value: 1 ether}("");
require(ok, "transfer failed");
```

This sends 1 ETH to `recipient`. The empty string `""` is the calldata. Empty means "no function call, just transfer ETH." If `recipient` is a contract, its `receive()` function runs, or its `fallback()` if there's no `receive`. If it's a wallet, the ETH just arrives.

The return value is a tuple of two things:

- `bool ok`: did the call succeed?
- `bytes memory returnData`: whatever the target returned

The comma in `(bool ok, )` discards the second return value because we don't care about it.

**Important**: if the call fails, `call` does NOT revert automatically. It returns `ok = false` and your code continues. You have to check `ok` and revert yourself. Forgetting this check is a common bug. You might think your ETH transfer succeeded when it silently failed.

## `call` vs `transfer` and `send`

Solidity has two other built-in ways to send ETH: `transfer` and `send`. You'll see them in older code. Here's the difference:

```solidity
recipient.transfer(1 ether);          // reverts on failure, forwards 2300 gas
bool ok = recipient.send(1 ether);    // returns bool, forwards 2300 gas
(bool ok, ) = recipient.call{value: 1 ether}("");  // returns bool, forwards all gas
```

The 2300 gas limit on `transfer` and `send` was a deliberate design choice to prevent the receiving contract from doing much work in its `receive()`. The motivation was blocking reentrancy attacks. It worked, but it created a different problem.

In 2019, the Istanbul hard fork increased the gas cost of certain storage operations. Contracts whose `receive()` did simple bookkeeping that used to fit in 2300 gas no longer fit. Suddenly, perfectly legitimate contracts couldn't receive ETH via `transfer`. The 2300 gas budget had become too tight.

The modern recommendation is to use `call` with the full gas forward, and protect against reentrancy explicitly using the patterns from the previous lesson: checks-effects-interactions and reentrancy guards. `transfer` is not safer. It's just more fragile.

## `call` for calling a function

`call` can also invoke a function on the target contract by name. You encode the function signature and arguments into the calldata.

Say there's another contract with this function:

```solidity
contract OtherContract {
    string public name;

    function setName(string memory _name) external returns (bool) {
        name = _name;
        return true;
    }
}
```

You can call it from your contract like this:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract MyContract {
    address public target;

    constructor(address _target) {
        target = _target;
    }

    function callSetName(string memory newName) external returns (bytes memory) {
        (bool ok, bytes memory response) = target.call(
            abi.encodeWithSignature("setName(string)", newName)
        );
        require(ok, "call failed");
        return response;
    }
}
```

`abi.encodeWithSignature("setName(string)", newName)` builds the calldata:

- It takes the function signature as a string
- Hashes it with `keccak256`
- Takes the first 4 bytes, which is the function selector from the loops-and-hashing lesson
- Appends the encoded arguments

The result is a `bytes` value that, when sent to `OtherContract`, triggers `setName(newName)` exactly as if you'd called it directly.

The return value comes back as raw bytes in `response`. To use it as a typed value, you decode it:

```solidity
(bool ok, bytes memory response) = target.call(
    abi.encodeWithSignature("setName(string)", "alice")
);
require(ok, "call failed");
bool result = abi.decode(response, (bool));  // true if setName returned true
```

The decoding has to match what the function actually returned. If `setName` returned a `string` instead of a `bool`, you'd decode with `(string)` instead of `(bool)`.

## When you'd actually do this

In normal code, you wouldn't. If you have access to `OtherContract`'s interface, you import it and call the function directly:

```solidity
interface IOther {
    function setName(string memory _name) external returns (bool);
}

IOther(target).setName("alice");
```

That's shorter, type-safe, and produces the same result.

You reach for low-level `call` when:

- The target's interface isn't known at compile time, for example when the user passes the function name in as a parameter
- You're building a generic forwarder, multicall, or proxy contract
- You're handling cases where the call might fail and you need to inspect the failure

For everyday work, prefer the high-level form. Save `call` for the cases that need it.

## What is `delegatecall`?

`delegatecall` looks almost identical to `call`:

```solidity
(bool ok, bytes memory response) = target.delegatecall(
    abi.encodeWithSignature("doSomething()")
);
```

But it behaves completely differently. The difference is execution context.

When you use `call`, the target's code runs in the target's context: the target's storage, the target's address, the target as `msg.sender` to anyone IT calls.

When you use `delegatecall`, the target's CODE runs but in YOUR context: YOUR storage, YOUR address, YOUR `msg.sender`.

The simplest way to think about this:

```
call:          "Run this function over there, on their stuff"
delegatecall:  "Bring their function here, run it on our stuff"
```

## The phone call analogy

Imagine you have a friend Bob who's good at shopping.

**Call:**
You phone Bob and say "go buy me a book." Bob takes some money, goes to the bookstore, buys a book. The book is now Bob's book, sitting in Bob's house. The bookstore knows Bob as the customer. If Bob needs to write down what he bought, he writes in HIS notebook.

**Delegatecall:**
You bring Bob to your house. You say "use your shopping skills, but use my stuff." Bob looks at YOUR shopping list, takes money from YOUR wallet, and writes the new book into YOUR notebook. The book ends up in YOUR library. The phone calls Bob makes appear to come from YOU.

The key insight: with delegatecall, you're using THEIR knowledge in the form of code logic but YOUR state, meaning your storage, your address, and your balance.

## A concrete example

Here's a delegatecall in action. Two contracts: a `Helper` that knows how to record events, and a `Main` that wants to use Helper's logic but in its own context.

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

When Alice calls `Main.callRecord{value: 2 ether}()`:

```
                  Without delegatecall:                  With delegatecall:
                  (using regular call)                   (what actually happens here)

Alice calls       Main forwards to Helper                Main pulls Helper's code
                  Helper.record() runs                   record() runs INSIDE Main
                  
msg.sender:       Helper sees Main as sender             record() sees ALICE as sender
                  ("Main called me")                     ("Alice called me")
                  
msg.value:        Helper has the 2 ETH                   record() sees 2 ETH in Main
                  (it was forwarded)                     (Main holds the ETH)
                  
Emitted event:    "Recorded by Main, 2 ether"            "Recorded by Alice, 2 ether"
                  fired by Helper                        fired by Main
```

That last point matters. The event is emitted by Main rather than Helper. If you're watching Main's events, you see `Recorded` events from Main even though Main has no `Recorded` event declared. The event was emitted in Main's context, so Main is the one that records the log.

`msg.sender` being preserved as Alice is the key property. It's why proxies work. When you call a proxy, the proxy delegatecalls to the implementation. The implementation's code runs, but to that code, the original caller still looks like the original caller. The user can't tell the proxy is there.

## Storage and the layout problem

`delegatecall` runs code in YOUR storage. This is powerful, but it is also the main source of danger.

Solidity stores state variables in numbered slots, starting at 0:

```
contract Foo {                Slot 0: a
    uint256 public a;         Slot 1: b
    uint256 public b;         Slot 2: c
    address public c;
}
```

The compiler decides which variable goes in which slot based on the ORDER they're declared. The variable's name doesn't matter at the storage level. Slot 0 is just "the first 256 bits of storage."

This is fine when a contract uses its own storage. It becomes dangerous when one contract delegatecalls into another, because the two contracts have to agree on what's in each slot.

Consider:

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

When `Storage.callIncrement()` runs, it delegatecalls into `Logic.increment()`. The `increment` function says "add 1 to `counter`," but Logic thinks `counter` is in slot 0. So it adds 1 to slot 0, which in Storage is `owner`. The `owner` field gets corrupted: adding 1 changes the stored address, so `owner` no longer points to the real owner.

The two contracts have to agree on storage layout. If Logic expects `counter` at slot 0, then Storage must put its `counter` at slot 0 too. If Logic expects `owner` at slot 1, then Storage's `owner` must be at slot 1.

```
Bad layout:                            Good layout:

Logic:                                 Logic:
  Slot 0: counter                        Slot 0: owner    (not used by logic but
                                                          must match)
Storage:                                 Slot 1: counter
  Slot 0: owner    ← gets corrupted
  Slot 1: counter                      Storage:
  Slot 2: logic                          Slot 0: owner
                                         Slot 1: counter
                                         Slot 2: logic
```

Proxy patterns deal with this by being extremely strict about storage layout. The proxy and the implementation are designed together so their slots line up. Even adding a new variable at the wrong position can break a deployed proxy permanently.

## The ownership hijack attack

Now we get to the dangerous version. Imagine a contract that uses delegatecall to a helper, with a mismatched storage layout, and the helper happens to write to a slot that holds something critical:

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

The vulnerable contract delegatecalls into Helper's `doStuff`. Helper writes `timestamp` to its slot 0, which it thinks is `lastTimestamp`. But because this is a delegatecall running in Vulnerable's context, slot 0 is actually `helper`, an address.

An attacker can pass a `uint256` that, when interpreted as an address, points to their own malicious contract. After one call, Vulnerable's `helper` slot now points to the attacker's contract. The next time anyone calls `doStuff`, it delegatecalls into the attacker's contract instead of the original Helper.

The attacker's contract can have a `doStuff(uint256)` that does whatever it wants in Vulnerable's storage. Including:

```solidity
function doStuff(uint256) external {
    // slot 1 is owner in the calling context
    assembly {
        sstore(1, caller())  // write the caller's address to slot 1
    }
}
```

Or simpler, without assembly:

```solidity
contract Attacker {
    address public helper;  // slot 0 in Attacker's own layout
    address public owner;   // slot 1 in Attacker's own layout

    function doStuff(uint256) external {
        owner = msg.sender;  // writes to slot 1 in the delegatecall context
    }
}
```

After the attacker calls `doStuff` again, with the call now delegatecalling into their own contract, the `owner` field in Vulnerable is set to the attacker. The attacker now owns the contract. From there, they can call any owner-only function: withdraw all funds, transfer ownership permanently, change parameters, whatever the contract allows.

This is the **Parity multisig wallet attack**, which happened in 2017 and froze about $150 million worth of ETH permanently. The exact pattern: a delegatecall to a library contract that wasn't expected to be callable externally, but was. An attacker triggered a function that wrote to a critical slot, and the funds became unrecoverable.

## How to defend against the attack

The defense is **strict storage layout discipline**.

1. **Match storage layouts between contracts that delegatecall each other.** If Vulnerable has `helper` at slot 0 and `owner` at slot 1, then Helper should have placeholders at slot 0 and slot 1 that match.
2. **Use storage gaps in upgradeable contracts.** OpenZeppelin's upgradeable contracts include `uint256[50] private __gap;` arrays at the end of each contract to reserve future slots. If you later need to add a variable, you take from the gap rather than shifting other slots.
3. **Prefer pure libraries over delegatecall when possible.** Solidity's `library` keyword uses delegatecall but with compiler-enforced constraints: libraries can't have state variables of their own, so the layout collision risk is removed.
4. **Don't delegatecall to untrusted contracts. Ever.** The target of a delegatecall has full power to modify your storage in arbitrary ways. Only delegatecall to contracts you wrote or contracts whose code you've audited carefully.
5. **Be paranoid about upgradeable proxies.** They depend entirely on storage layout matching between the proxy and every version of the implementation. Tools like OpenZeppelin's `@openzeppelin/upgrades-core` check this automatically. Use them.

## When to use what

A practical summary:

| Need | Use |
| --- | --- |
| Send ETH to a known address | `recipient.call{value: amount}("")` |
| Call a function on a contract whose interface you know | `IContract(addr).functionName(args)` |
| Call a function dynamically when the interface isn't known at compile time | `addr.call(abi.encodeWithSignature(...))` |
| Reuse code from a library | `using Library for Type;` or `library` declarations |
| Build a proxy that delegates to an implementation | `addr.delegatecall(...)` with carefully matched storage |
| Call code in your own context for any other reason | Almost certainly don't. Reconsider. |

The hierarchy of trust: high-level calls are safest, low-level `call` is next, low-level `delegatecall` is the most dangerous. Use each at the level appropriate for the task, and don't reach down a level unless you have a real reason.
