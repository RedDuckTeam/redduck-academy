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

If you've used Go, Rust, TypeScript, or C, the basic model is the same. Two things make Solidity structs distinctive. First, they have rules about what can go inside them, including no recursion and no storage qualifiers on fields. Second, they interact with storage and memory in ways that affect both correctness and gas cost. The reference-vs-copy distinction in particular is the single most common source of bugs for developers new to the language.

## The model

A struct is a named bundle of fields. Two things to internalize before any syntax.

First, field access is by name rather than by position. This is the main difference from arrays, which use positions, and from mappings, which use keys. When you have a `Payment` struct with an `amount` field, you read it as `payment.amount`. The compiler maps the name to the field's location and reads it for you. You never work with positions directly. Structs are the right choice when the things you're bundling are different in kind rather than in position.

Second, structs are templates that only become values once instantiated. Declaring `struct Payment { ... }` only defines the shape. To actually have a payment, you need to create an instance, either as a state variable, a local variable, or as a value sitting inside a mapping or array. The instance is where the data lives. The struct definition is just the recipe.

These two ideas explain why some operations don't exist. You can't compare two structs with `==`, because there's no general definition of equality across all field types. You can't have a struct as a mapping key, because keys have to be hashable value types and structs aren't. You can't return a struct that contains a mapping, because the mapping has no enumerable content to copy out.

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

A few rules.

**Field types can be almost anything.** Primitives, arrays, mappings, other structs. The one restriction is that a struct can't contain a field of its own type directly. More on that below.

**No storage qualifiers inside the definition.** When you have a `string` field inside a struct, you write `string message;`, not `string memory message;`. Storage location is determined by where the struct instance lives rather than by where each field is declared. A struct instance in storage stores its strings in storage. A struct instance in memory stores them in memory. The fields don't get a separate choice.

**No recursion.** A struct cannot contain a field of its own type directly. This is a compile error:

```solidity
struct TreeNode {
    uint256 value;
    TreeNode left;   // compile error: recursive struct
    TreeNode right;
}
```

The reason is mechanical. A struct's storage layout is computed at compile time by summing the sizes of its fields, and a recursive type would have an infinite size. The workaround is indirection. Hold an array or a mapping of the type instead of the type itself.

```solidity
struct TreeNode {
    uint256 value;
    TreeNode[] children;   // ok: array introduces indirection
}
```

An array breaks the cycle because it's just a length and a pointer to a separate region of storage. The struct itself remains finite-sized.

## Storage packing

Solidity packs struct fields into 32-byte storage slots whenever consecutive fields fit together. Field order matters for gas. Consider these two definitions:

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

The `Good` version uses one less storage slot per instance, which translates into thousands of gas saved on every fresh write and every cold read. A simple guideline: declare larger fields together, and group smaller fields so they can share a slot. This becomes a real optimization for contracts that create many struct instances, like NFT contracts, vaults, and order books.

The full rules of storage layout have more depth than this section covers, but knowing that field order matters is enough to write reasonable structs today.

## Creating instances

Two ways to construct a struct value. Both create the same thing. They differ in readability.

**Positional:**

```solidity
Order memory o = Order(100, msg.sender, uint64(block.timestamp), false);
```

You pass values in the order the fields were declared. Concise but fragile. If you ever reorder or insert fields in the struct definition, every positional construction silently becomes wrong. Don't use this form except for very small structs that won't change.

**Named:**

```solidity
Order memory o = Order({
    amount: 100,
    buyer: msg.sender,
    placedAt: uint64(block.timestamp),
    fulfilled: false
});
```

You name each field explicitly. Verbose, but safe against reordering and self-documenting. Use this form by default.

In both cases, the storage location keyword is required when declaring a local struct variable. `Order o = Order(...)` does not compile. You must write `Order memory o` or `Order storage o`. The `storage` form is only valid when assigning from an existing storage location, which is covered next.

## The reference vs copy distinction

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

The `storage` keyword declares `p` as a pointer into the same storage location as `profiles[user]`. Mutations through `p` affect the underlying state. SSTORE happens.

The `memory` keyword allocates a fresh memory region and copies every field of the struct into it. Mutations to that copy are local. When the function returns, the copy is discarded. The original storage is untouched.

This is identical to the reference-vs-value distinction in many languages, but Solidity makes you pick explicitly every time you bind a name. The choice has both correctness implications, since the changes only persist if you used `storage`, and gas implications, since memory copies cost gas to allocate and write. When in doubt, write tests that read state back after each function and check that the values actually changed.

You can also assign one struct value to a storage slot directly:

```solidity
profiles[user] = Profile({verified: true, score: 100});
```

This copies every field from the right-hand side into storage, which costs an SSTORE per field. For large structs, batching writes this way is sometimes cleaner than mutating fields one at a time.

## Modifying fields

Field access uses dot syntax. The semantics depend on where the struct lives.

```solidity
Order memory order = Order({amount: 100, buyer: msg.sender, placedAt: 0, fulfilled: false});
order.amount = 150;        // local change to memory copy

lastOrder.amount = 200;    // SSTORE: writes directly to storage
lastOrder.fulfilled = true; // another SSTORE
```

Each field write to a storage struct is a separate SSTORE, which is one of the most expensive EVM operations. If you're updating multiple fields, the gas adds up. To keep this cost down, design your structs so the common write paths modify only a small number of fields.

The `delete` keyword clears a struct back to all-zero values:

```solidity
delete lastOrder;  // every field reset to its type's zero value
```

`delete` on a struct works the same way `delete` works on every other type: it sets the memory or storage region to zero. For a struct that contains a mapping, the mapping isn't cleared, since the EVM can't enumerate its keys, but every non-mapping field is reset.

## Structs in mappings

The most common use of structs is as the value type of a mapping. This combines the per-key access of mappings with the multi-field structure of structs.

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

    function verify(address user) external {
        Profile storage p = profiles[user];
        p.verified = true;
    }
}
```

The `register` function builds a fresh `Profile` in memory using the named-args form, then assigns it into the mapping. The assignment copies all fields into storage. The `verify` function takes a storage reference to the existing profile and modifies it in place, which is the only way the change persists.

If `verify` had used `Profile memory p = profiles[user]; p.verified = true;`, it would have read a copy, set the copy's `verified` to true, and exited the function with that copy thrown away. The actual stored profile would have remained unverified.

## Capstone: a payments ledger pattern

The pattern below is the structural template for crowdfunding contracts, donation pools, vesting schedules, voting records, and most other accounting-style contracts. It shows the key idea of using structs as both mapping values and as a way to compose a nested data shape.

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

Three things to notice here.

The `Account` struct holds a counter and a nested mapping. Mappings inside structs are allowed, but the struct can only ever live in storage. There is no such thing as a memory mapping, so the compiler will not let you declare a memory `Account`. This is why `accounts` is `internal` rather than `public`: the auto-generated public getter would need to return an `Account`, which the compiler refuses to do because of the embedded mapping.

The `pay` function takes a `storage` reference to the caller's account. Every subsequent write goes to the actual storage location. If `Account memory acc = accounts[msg.sender]` had been used, the counter increment would have happened on a local copy that gets discarded, and the payment would have been written to slot 0 every time.

`getPayment` returns a `Payment` by value, typed `Payment memory`. The function caller receives a copy of the data. References can't escape the contract boundary in either direction. Everything that crosses is copied into the caller's space.
