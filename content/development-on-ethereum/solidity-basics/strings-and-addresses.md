---
id: 2
title: Strings and addresses
type: lecture
order: 3
faq:
  - question: Why can't I compare two strings with == in Solidity?
    answer: >-
      Solidity defines no == for strings. Hash the bytes, keccak256(bytes(a)) ==
      keccak256(bytes(b)). A string is a sequence of UTF-8 bytes, so .length, indexing and +
      are left out too. To join two strings, use string.concat, added in 0.8.12.
  - question: When do I need payable(addr) instead of a plain address?
    answer: >-
      Whenever you call .transfer() on it. Only address payable carries that method.
      msg.sender and function arguments from external callers arrive as plain addresses, so
      the cast at the call site is common.
  - question: Why is .transfer() no longer the recommended way to send ETH?
    answer: >-
      It forwards a fixed 2300 gas stipend, and EIP-1884 raised opcode costs in 2019. A
      multisig or proxy that runs logic on receipt now needs more, so the send fails. Use a
      low-level call, (bool ok, ) = payable(target).call{value: amount}(""), then require ok.
  - question: Why does sending ETH to my contract revert?
    answer: >-
      The contract has no function marked payable. Without one, every incoming ETH transfer
      is rejected.
---

Two types you'll meet in the first hour of any non-trivial contract. They handle the two kinds of external data a contract sees. Strings carry text from humans. Addresses carry identifiers from the chain itself. Both behave in ways that catch developers coming from other languages. Strings have limitations: operations you'd expect to work simply don't. Addresses come in two forms, and you have to pick the right one to move money.

## What strings actually are

A string in Solidity is not an array of characters the way it is in higher-level languages. It's a sequence of UTF-8 bytes. When you write a Latin letter, you get one byte. A Cyrillic letter takes two. An emoji takes three or four. The string type stores the bytes faithfully and refuses to commit to any single answer for "how long is this."

This single fact explains every limitation that follows. Solidity did not decide to make strings weak. It decided not to pick a wrong answer for length, equality, or concatenation when the right answer depends on what you mean by "character."

Strings are reference types: the variable holds a reference to data that lives somewhere, and that somewhere has to be named. State variables declared at the contract level live in `storage` automatically. Function arguments and local variables require an explicit data-location keyword:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Example {
    string public name = "MyToken";   // storage, by default

    function setName(string memory newName) public {
        name = newName;               // memory string copied into storage
    }
}
```

`calldata` is more efficient for arguments you only read from, since it avoids the copy into memory. `memory` works in any situation and is the safe default if you're not sure which to use.

## What strings can't do

The following all fail to compile, despite being routine in JavaScript or Python:

```solidity
string memory a = "hello";
uint len = a.length;             // no .length on string
string memory b = a + " world";  // no + concatenation
if (a == "hello") { ... }        // no == on string
bytes1 first = a[0];             // no index access
```

The reason traces back to the byte-array nature. `string.length` would be ambiguous: bytes? Unicode code points? Grapheme clusters? Different answers depending on what you mean, all of them defensible. Solidity exposes none of these operations rather than commit to a wrong one.

The workarounds, when you actually need them:

```solidity
// Compare strings by hashing their underlying bytes.
bool equal = keccak256(bytes(a)) == keccak256(bytes(b));

// Read individual bytes by casting the string to bytes.
bytes1 firstByte = bytes(a)[0];

// Concatenate with string.concat, available since 0.8.12.
string memory greeting = string.concat(a, " world");

// Get length in bytes (not characters) by casting first.
uint byteLength = bytes(a).length;
```

All of these are expensive in gas. Hashing a long string is O(n) in its byte length. Concatenation allocates fresh memory. For anything string-heavy, ask whether the work belongs off-chain.

## What strings are good for

Token names, token symbols, URIs pointing to off-chain metadata, event payloads, and human-readable error messages. The pattern is: store the string, emit it, return it, but do not manipulate it on-chain. NFT projects almost never store full metadata on-chain. They store an IPFS or HTTPS URI as a string, and the actual data lives off-chain at that URI.

If you find yourself wanting to slice, search, lowercase, or compare strings on-chain, step back. Either restructure so the comparison happens off-chain and the result is passed in, or use `bytes32` for short fixed-length identifiers, which gives you a value type with proper comparison operators.

## What addresses identify

An address in Solidity is a 20-byte value that identifies an account on Ethereum. Both externally owned accounts and contracts have addresses. Externally owned accounts are the wallets people use. From the type system's perspective they're identical. You can call into either, transfer ETH to either, query the balance of either.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Example {
    address public owner = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;

    function ownerBalance() public view returns (uint256) {
        return owner.balance;
    }

    function balanceOf(address target) public view returns (uint256) {
        return target.balance;
    }
}
```

Addresses are written as hex literals without quotes. They are not strings, and they are not interchangeable with `bytes20` despite being the same size in bytes. The `.balance` property reads the current balance of any address in wei, the smallest ETH denomination. One ETH equals `10**18` wei. ETH amounts are stored in `uint256`, the EVM's native 256-bit word.

All balance data on Ethereum is public, which is why you can query any address's balance, including ones your contract does not own. The `view` keyword on these functions is a promise that they don't modify state, which lets them be called for free without sending a transaction.

One implementation detail worth knowing. Even though an address is 20 bytes logically, on the EVM stack it occupies a full 32-byte word with the top 12 bytes zeroed. This is why you'll occasionally see code cast between `address` and `uint160`. The cast is well-defined because `uint160` is exactly the bit width an address fits into.

## The payable capability

Here's where the type system steps in. Sending ETH from your contract to an address used to be done with a method called `.transfer()`. But `.transfer()` exists only on a specialized version of the address type called `address payable`. A plain `address` does not have it.

Why two address types? Sending ETH is a state-changing action with real consequences. Solidity makes you opt into that capability explicitly. Every time you touch a payable address, the type system reminds you that money can flow this way.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Wallet {
    // Option 1: declare the field as address payable from the start.
    address payable public recipient;

    constructor(address payable initialRecipient) {
        recipient = initialRecipient;
    }

    function sendOne() public {
        recipient.transfer(1 ether);
    }

    // Option 2: keep a plain address, cast when sending.
    address public otherRecipient;

    function sendTwo() public {
        payable(otherRecipient).transfer(1 ether);
    }
}
```

Both patterns appear in production code. Declaring the field as `address payable` makes the intent clear at the storage level. You can't always do that, since some sources of addresses give you a plain `address`, like function arguments from external callers or return values from certain operations. The `payable(addr)` cast lets you opt into the capability at the call site.

A word on `.transfer()` itself. The method forwards a fixed 2300 gas stipend to the recipient. That used to be enough for the recipient's `receive()` function to log an event and return. Since EIP-1884 raised the cost of certain opcodes in 2019, the 2300 stipend has become unreliable, and `.transfer()` to a contract recipient can fail when the recipient is a multisig or a proxy that runs extra logic on receipt. Modern Solidity style is to send ETH using a low-level `call` instead:

```solidity
(bool ok, ) = payable(target).call{value: amount}("");
require(ok, "send failed");
```

Low-level calls have meaningful depth beyond what this lesson covers. The takeaway here is just that `.transfer()` is no longer the default recommendation, despite still appearing in older tutorials.

## Receiving ETH

The other side. For your contract to receive ETH at all, it needs at least one function marked `payable`. The keyword is the signal to both the compiler and the EVM that this function accepts attached value.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Vault {
    function deposit() public payable {
        // body can be empty; the ETH is credited automatically
    }

    function balance() public view returns (uint256) {
        return address(this).balance;
    }
}
```

A contract with no payable function rejects incoming ETH transfers. Solidity also has two special functions called `receive()` and `fallback()` that handle ETH sent without naming a specific function to call. Both have quirks of their own. For now, if you want a contract to be able to receive ETH at a named function, expose one marked `payable`.

Notice `address(this).balance` in the second function. `address(this)` is the current contract's own address. `.balance` works on it the same way it works on any other address, returning the ETH balance in wei. This is the standard way for a contract to ask "how much ETH am I holding right now?"

## Where the two meet: `msg.sender` and `msg.value`

Every function call has access to a global `msg` object that describes the incoming call. Two of its fields tie this lecture together.

`msg.sender` is the address that called the current function. For an EOA-initiated transaction, that's the wallet. For a contract-to-contract call, it's the calling contract. Either way, it's typed as plain `address`, not `address payable`. If you want to send ETH back to `msg.sender`, you have to cast: `payable(msg.sender)`.

`msg.value` is the amount of ETH, in wei, sent with the call. It's typed as `uint256` and is only non-zero inside `payable` functions, since non-payable functions reject value transfers.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Logger {
    address public lastSender;
    uint256 public lastValue;

    function log() public payable {
        lastSender = msg.sender;
        lastValue = msg.value;
    }
}
```

Inside `log`, `msg.sender` is whoever called this transaction. `msg.value` is whatever ETH they attached. The state writes commit if the function returns normally. They roll back if anything in the function reverts.

## A small contract using both

A near-minimal demonstration. This contract receives ETH from anyone, records who deployed it, and lets the deployer forward funds elsewhere.

```solidity
// SPDX-License-Identifier: MIT
// Solidity 0.8.24, Ethereum mainnet
pragma solidity 0.8.24;

contract ForwardingWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {}

    function forward(address target, uint256 amount) external {
        // Production code needs access control and balance checks here.
        (bool ok, ) = payable(target).call{value: amount}("");
        require(ok, "send failed");
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
```

The constructor captures the deployer's address as `msg.sender`. The `deposit` function is external `payable` with an empty body. The ETH is credited automatically when the function is called with attached value. The `forward` function casts the target to `payable` and sends the requested amount via a low-level `call`. Production code would add access control on `forward` and check that the requested amount is actually available before sending, but the skeleton you see here is the minimum that compiles and runs.

## Things that catch developers

A few patterns to internalize.

**Forgetting the data-location keyword on a string argument.** `function set(string newName)` fails to compile. You need `string memory newName` or `string calldata newName`. The reflex from other languages is to omit the keyword entirely.

**Trying to compare strings with ****`==`****.** Compile error. Use `keccak256(bytes(a)) == keccak256(bytes(b))` when comparison is genuinely needed, but first ask whether the comparison should happen off-chain.

**Storing large strings on-chain when an off-chain pointer would do.** Storage is expensive. NFT metadata, large configs, anything text-heavy: store a URI to off-chain data rather than the data itself.

**Calling ****`.transfer()`**** on a plain ****`address`****.** Compile error. Either declare the field as `address payable` or cast at the call site with `payable(addr)`.

**Sending ETH to a contract that has no payable function.** The transaction reverts. If you control the receiving contract, expose a payable function. If you don't, the contract cannot accept the transfer.

**Treating ****`address`**** and ****`address payable`**** as interchangeable.** They aren't. Every cast between them is a place where money can move. Auditors look at exactly those points.

**Defaulting to ****`.transfer()`**** because every old tutorial uses it.** The 2300 gas stipend is unreliable post-EIP-1884. The modern pattern is `(bool ok, ) = payable(target).call{value: amount}(""); require(ok);`. Older Solidity code in production uses `.transfer()` and mostly works fine, but new code should default to the call form.
