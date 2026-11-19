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

Strings carry text from humans. Addresses carry identifiers from the chain itself. Both behave in ways that catch developers coming from other languages. Strings lack operations you'd expect to work, and a function must be marked `payable` to accept ETH.

## A string is a sequence of UTF-8 bytes

A string in Solidity is not an array of characters the way it is in higher-level languages. It's a sequence of UTF-8 bytes. When you write a Latin letter, you get one byte. A Cyrillic letter takes two. An emoji takes three or four. The string type stores the bytes faithfully and refuses to commit to any single answer for "how long is this."

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

## Store strings, do not process them on-chain

The following all fail to compile, despite being routine in JavaScript or Python:

```solidity
string memory a = "hello";
uint len = a.length;             // no .length on string
string memory b = a + " world";  // no + concatenation
if (a == "hello") { ... }        // no == on string
bytes1 first = a[0];             // no index access
```

`string.length` would be ambiguous. It could count bytes, Unicode code points, or grapheme clusters, and each answer is defensible. The same goes for `a[0]`. Solidity exposes neither rather than commit to a wrong one. `==` and `+` are not defined for strings either. All four have workarounds:

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

Comparison and concatenation cost gas in proportion to the length of the data. Hashing a long string is O(n) in its byte length, and concatenation allocates fresh memory. For anything string-heavy, ask whether the work belongs off-chain.

Strings are good for token names, token symbols, URIs pointing to off-chain metadata, event payloads, and human-readable error messages. Store the string, emit it, return it, but do not manipulate it on-chain. NFT projects almost never store full metadata on-chain. They store an IPFS or HTTPS URI as a string, and the actual data lives off-chain at that URI.

If you find yourself wanting to slice, search, lowercase, or compare strings on-chain, either restructure so the comparison happens off-chain and the result is passed in, or use `bytes32` for short fixed-length identifiers, which gives you a value type with proper comparison operators.

## An address is 20 bytes that identify an account

An address in Solidity is a 20-byte value that identifies an account on Ethereum. The type does not distinguish externally owned accounts from contracts. You can call into either, transfer ETH to either, query the balance of either.

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

Addresses are written as hex literals without quotes. They are not strings, and they are not interchangeable with `bytes20` despite being the same size in bytes. The `.balance` property reads the current balance of any address in wei. All balance data on Ethereum is public, which is why you can query any address's balance, including ones your contract does not own. The `view` keyword on these functions is a promise that they don't modify state, which lets them be called for free without sending a transaction.

Even though an address is 20 bytes logically, on the EVM stack it occupies a full 32-byte word with the top 12 bytes zeroed, which is why you'll occasionally see code cast between `address` and `uint160`. The cast is well-defined because `uint160` is the bit width an address fits into.

## A function must be marked `payable` to accept ETH

For your contract to accept ETH sent with a call or a plain transfer, the function that receives it has to be marked `payable`. The keyword is the signal to both the compiler and the EVM that this function accepts attached value.

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

A contract with no payable function rejects incoming ETH transfers. That default protects the sender. The only way to move a contract's funds is to call its code, as the [account model lesson](/courses/development-on-ethereum/how-ethereum-works/the-account-model) showed, so ETH sent to a contract that has no function for sending it out stays there for good.

Inside a `payable` function, `msg.value` is the amount of ETH, in wei, sent with the call. It's typed as `uint256` and is only non-zero inside `payable` functions, since non-payable functions reject value transfers. `address(this)` is the current contract's own address, and `.balance` works on it the same way it works on any other address. This is the standard way for a contract to ask how much ETH it is holding.

Solidity also has two special functions called `receive()` and `fallback()` that handle ETH sent without naming a specific function to call. They come up again in the [low-level calls lesson](/courses/development-on-ethereum/token-security-and-evm-internals/low-level-calls).

## Send ETH with `call`

To send ETH from your contract to an address, use a low-level `call` with a value attached:

```solidity
(bool ok, ) = payable(target).call{value: amount}("");
require(ok, "send failed");
```

`call` reports a failed send by returning `false` in `ok`, so the `require` is what makes the transaction revert. `call` works on a plain `address`, so the `payable(target)` cast in this snippet is optional. The cast is required by `.transfer()`, described next. The low-level calls lesson covers this form in detail.

## Older code sends ETH with `.transfer()`

Sending ETH from your contract to an address used to be done with a method called `.transfer()`. It exists only on a specialized version of the address type called `address payable`. A plain `address` does not have it.

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

Both patterns appear in production code. Declaring the field as `address payable` makes the intent clear at the storage level. You can't always do that, since some sources of addresses give you a plain `address`, like function arguments from external callers or `msg.sender`, which [the EVM lesson](/courses/development-on-ethereum/how-ethereum-works/the-evm) introduced as the address that made the current call. The `payable(addr)` cast converts a plain address at the call site.

`.transfer()` forwards a fixed 2300 gas stipend to the recipient. That used to be enough for the recipient's `receive()` function to log an event and return. Since EIP-1884 raised the cost of certain opcodes in 2019, the 2300 stipend has become unreliable, and `.transfer()` to a contract recipient can fail when the recipient is a multisig or a proxy that runs extra logic on receipt. So new code sends ETH with `call`, even though `.transfer()` still appears in older tutorials.
