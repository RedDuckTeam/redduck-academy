---
id: 36
title: Structs
type: lecture
order: 6
faq:
  - question: Why didn't my change to a struct get saved?
    answer: >-
      You bound it with memory. Profile memory p = profiles[user] copies every field, and
      the copy is discarded when the function returns. Profile storage p = profiles[user] is
      a pointer into storage, so writes through it are SSTOREs against real state.
  - question: Does the order of fields in a struct change gas cost?
    answer: >-
      Yes. A 20-byte address declared next to a 1-byte bool shares one 32-byte slot. Move a
      uint256 between them and the same struct costs three slots instead of two.
  - question: Why won't the compiler let me make my struct public?
    answer: >-
      A public state variable generates a getter that returns the whole value, and a struct
      holding a mapping cannot be returned. It has no memory form either, so it lives only
      in storage. Mark the variable internal and write your own view function.
  - question: Can a struct contain a field of its own type?
    answer: >-
      No, that is a compile error. A struct's size is the sum of its field sizes, and a
      self-containing type would be infinite. Hold TreeNode[] children instead.
  - question: Can I use a struct as a mapping key?
    answer: >-
      No. Keys have to be hashable value types.
---

If you've used Go, Rust, TypeScript, or C, the basic model is the same. What is specific to Solidity is how structs interact with storage and memory. A struct read from storage is either a reference or a copy, depending on one keyword, and changes made to the copy are not saved. This reference-vs-copy distinction is the single most common source of bugs for developers new to the language. The order of fields also decides how many storage slots a struct takes, which affects gas cost.

## Defining a struct

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Marketplace {
    struct Order {
        uint256 amount;
        address buyer;
        uint64 placedAt;
        bool fulfilled;
    }

    Order public lastOrder;
}
```

**Field types can be almost anything.** Primitives, arrays, mappings, and other structs are all allowed.

**No storage qualifiers inside the definition.** When you have a `string` field inside a struct, you write `string message;`, not `string memory message;`. Storage location is determined by where the struct instance lives rather than by where each field is declared. A struct instance in storage stores its strings in storage, and a struct instance in memory stores them in memory.

**No recursion.** A struct cannot contain a field of its own type directly. This is a compile error:

```solidity
struct TreeNode {
    uint256 value;
    TreeNode left;   // compile error: recursive struct
    TreeNode right;
}
```

A struct's storage layout is computed at compile time by summing the sizes of its fields, and a recursive type would have an infinite size. The workaround is to hold an array or a mapping of the type instead of the type itself.

```solidity
struct TreeNode {
    uint256 value;
    TreeNode[] children;   // ok: array introduces indirection
}
```

An array breaks the cycle because it's just a length and a pointer to a separate region of storage. The struct itself remains finite-sized.

## `storage` is a reference, `memory` is a copy

A struct retrieved from a storage location with the `storage` keyword is a reference. With `memory`, it's a copy.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Bug {
    struct Profile {
        bool verified;
        uint256 score;
    }

    mapping(address => Profile) public profiles;

    function brokenVerify(address user) external {
        Profile memory p = profiles[user];  // COPY
        p.verified = true;                  // mutates the copy
        // copy is discarded at function exit. profiles[user] unchanged.
    }

    function workingVerify(address user) external {
        Profile storage p = profiles[user]; // REFERENCE
        p.verified = true;                  // mutates the underlying storage
    }
}
```

The `storage` keyword declares `p` as a pointer into the same storage location as `profiles[user]`. Mutations through `p` are written to the underlying state with SSTORE.

Memory exists only for the duration of a single call ([the EVM lesson](/courses/development-on-ethereum/how-ethereum-works/the-evm)), so a struct read from storage into memory can only be a copy. The `memory` keyword allocates a fresh memory region and copies every field of the struct into it. Mutations to that copy are local, and when the function returns, the copy is discarded.

This is identical to the reference-vs-value distinction in many languages, but Solidity makes you pick explicitly every time you bind a name. `Order o = ...` does not compile. You must write `Order memory o` or `Order storage o`, and the `storage` form is only valid when assigning from an existing storage location. The choice has both correctness implications, since the changes only persist if you used `storage`, and gas implications, since memory copies cost gas to allocate and write.

## What structs cannot do

Some operations don't exist for structs, each for its own reason:

- You can't compare two structs with `==`, because there's no general definition of equality across all field types.
- You can't have a struct as a mapping key, because keys have to be hashable value types and structs aren't.
- You can't return a struct that contains a mapping, because the mapping has no enumerable content to copy out.

## Creating and writing structs

Construct a struct by naming each field:

```solidity
Order memory o = Order({
    amount: 100,
    buyer: msg.sender,
    placedAt: uint64(block.timestamp),
    fulfilled: false
});
```

This form is verbose, but safe against reordering and self-documenting. The positional form, `Order(100, msg.sender, uint64(block.timestamp), false)`, passes values in the order the fields were declared. If you ever reorder or insert fields in the struct definition, every positional construction silently becomes wrong.

A field of a struct in storage can be written directly:

```solidity
lastOrder.amount = 200;    // SSTORE: writes directly to storage
lastOrder.fulfilled = true; // another SSTORE
```

Each field write to a storage struct is a separate SSTORE, which is one of the most expensive EVM operations. To keep this cost down, design your structs so the common write paths modify only a small number of fields.

`delete lastOrder` resets every field to its type's zero value. For a struct that contains a mapping, the mapping isn't cleared, since the EVM can't enumerate its keys, but every non-mapping field is reset.

## Field order decides how many slots a struct takes

Solidity packs struct fields into 32-byte storage slots whenever consecutive fields fit together, so field order matters for gas. Consider these two definitions:

```solidity
// 3 storage slots: each field uses its own slot
struct Bad {
    address owner;   // 20 bytes, slot 0 (12 unused trailing bytes)
    uint256 amount;  // 32 bytes, slot 1
    bool active;     // 1 byte, slot 2 (31 unused trailing bytes)
}

// 2 storage slots: owner + active pack together
struct Good {
    address owner;   // 20 bytes, slot 0
    bool active;     // 1 byte, slot 0 (packed)
    uint256 amount;  // 32 bytes, slot 1
}
```

The `Good` version uses one less storage slot per instance. Writing to a fresh storage slot costs 22,100 gas, and the first read of a slot in a transaction costs 2,100 gas ([contracts and gas lesson](/courses/development-on-ethereum/how-ethereum-works/contracts-and-gas)). Storing one new `Bad` record costs 3 × 22,100 = 66,300 gas in storage writes, and one `Good` record costs 2 × 22,100 = 44,200 gas. Reading the whole record for the first time costs 6,300 gas for `Bad` and 4,200 gas for `Good`.

As a guideline, declare larger fields together, and group smaller fields so they can share a slot. This becomes a real optimization for contracts that create many struct instances, like NFT contracts, vaults, and order books. The [storage layout lesson](/courses/development-on-ethereum/token-security-and-evm-internals/storage-layout) covers the full packing rules.

## Structs as mapping values

The most common use of structs is as the value type of a mapping.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Registry {
    struct Profile {
        string name;
        bool verified;
        uint256 reputation;
    }

    mapping(address => Profile) public profiles;

    function register(string calldata name) external {
        profiles[msg.sender] = Profile({
            name: name,
            verified: false,
            reputation: 0
        });
    }
}
```

The `register` function builds a fresh `Profile` in memory, then assigns it into the mapping. The assignment copies every field from the right-hand side into storage, which costs at least one SSTORE for every slot the struct occupies. For large structs, batching writes this way is sometimes cleaner than mutating fields one at a time.

## A struct with a mapping lives only in storage

The pattern below is the structural template for crowdfunding contracts, donation pools, vesting schedules, voting records, and most other accounting-style contracts.

```solidity
// SPDX-License-Identifier: MIT
// Solidity 0.8.24, Ethereum mainnet
pragma solidity 0.8.24;

contract PaymentsLedger {
    struct Payment {
        uint256 amount;
        uint64 timestamp;
        bytes32 ref;
    }

    struct Account {
        uint256 paymentCount;
        mapping(uint256 => Payment) byIndex;
    }

    mapping(address => Account) internal accounts;

    function pay(bytes32 ref) external payable {
        Account storage acc = accounts[msg.sender];
        acc.byIndex[acc.paymentCount] = Payment({
            amount: msg.value,
            timestamp: uint64(block.timestamp),
            ref: ref
        });
        acc.paymentCount += 1;
    }

    function getPayment(address user, uint256 i) external view returns (Payment memory) {
        return accounts[user].byIndex[i];
    }
}
```

The `Account` struct holds a counter and a nested mapping. Mappings inside structs are allowed, but the struct can only ever live in storage. There is no such thing as a memory mapping, so the compiler will not let you declare a memory `Account`. For the same reason `accounts` is `internal` rather than `public`: the auto-generated public getter would need to return an `Account`, which the compiler refuses to do because of the embedded mapping. `getPayment` takes the getter's place and returns one `Payment` by value, so the caller receives a copy.

## Check that the change was saved

For every function that is supposed to change a struct, write a test that reads the state back after the call and checks that the values changed. If they did not, look for a `memory` binding where `storage` was needed.
