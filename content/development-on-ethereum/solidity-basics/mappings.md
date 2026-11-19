---
id: 34
title: Mappings
type: lecture
order: 4
faq:
  - question: Why can't I loop over a mapping's keys?
    answer: >-
      There is no key set to iterate. A mapping computes each key's slot by hashing the key,
      and the EVM keeps no record of which slots a contract touched. Keep your own array of
      keys if you need to enumerate them.
  - question: What does reading an unset key return?
    answer: >-
      The zero value of the value type. 0 for a uint, false for a bool, the zero address for
      an address. A deliberately stored zero and an untouched key are indistinguishable.
  - question: How do I tell an unset key from one deliberately set to zero?
    answer: >-
      There is no built-in check. Keep a second mapping to bool and set it true the first
      time a key is written. Zero with the flag false means never set. Zero with the flag
      true means a deliberate zero.
  - question: Which storage slot does balances[addr] live in?
    answer: >-
      keccak256(addr, p), where p is the mapping's position in the contract's storage
      layout. Nested mappings hash recursively, so outer[k1][k2] sits at
      keccak256(k2, keccak256(k1, p)).
  - question: Can anyone read a private mapping?
    answer: >-
      Yes. private only hides the auto-generated getter, and all contract storage is
      publicly readable.
---

> Solidity's `mapping` looks like a dictionary from other languages, but it has no length, cannot be iterated, and exists only in storage. All of these limits follow from how the EVM stores data.

## What you'd expect

A `mapping` is declared and used like a dictionary in any other language:

```solidity
mapping(address => uint256) balances;
balances[someAddress] = 100;
uint256 b = balances[someAddress];
```

The rest of what you'd expect from a dictionary doesn't work. You can't call `.length`, loop over the keys, return a mapping from a function, or put one in memory. Reading a key that was never written doesn't throw an error, it gives you zero.

## The constraint: EVM storage

A contract's persistent state lives in storage, a flat array of `2^256` slots of 32 bytes each. Three properties of it matter here:

- Every possible 256-bit number is a valid slot address.
- Every slot starts as zero. Reading a slot that was never written returns 32 bytes of zero.
- The EVM does not track which slots a contract has touched, so it cannot tell a written slot from an unwritten one.

These are properties of the EVM, not of Solidity. State variables, arrays, and mappings all have to live within them.

## What this forces

Suppose you want a contract to store an unbounded number of key-value pairs and look each one up in O(1), the way a dictionary does.

**The slot is derived from the key.** With a flat numbered slot space, O(1) lookup means the slot has to be computable from the key alone. Solidity hashes the key: for a mapping declared at position `p` in the contract's storage layout, the slot for key `k` is `keccak256(k, p)`.

**Every key exists.** Every key hashes to some slot, and that slot holds zero until someone writes to it. So asking whether a key exists is the same as reading its value, and a zero that was stored deliberately cannot be told apart from a key that was never written. Solidity makes reading always succeed: every possible key maps to the zero value of the value type until you overwrite it.

**Anything that needs the list of keys is impossible.** The EVM keeps no record of which slots were written, so:

- **Length.** There is no count of entries, because every one of the `2^256` keys is an entry.
- **Iteration.** To iterate, you need to enumerate keys, and there is no key list.
- **Comparing two mappings.** You can't ask whether two mappings hold the same entries.
- **Returning from a function.** Returning a mapping would mean returning its contents, which means enumerating the keys. Solidity refuses to compile it.
- **Bulk deletion.** `delete myMapping` doesn't compile, because it would require enumerating every key the contract has touched. `delete myMapping[someKey]` works, because it sets one slot back to zero.

**A mapping lives only in storage.** Deriving a slot from a hash only works in storage, so Solidity rejects a `mapping` declared as a memory or calldata variable, and a struct that contains a mapping can only exist in storage.

## Declaring and using mappings

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Storage {
    mapping(address => uint256) public balances;
}
```

If `balances` is declared at storage position 1, the slot for `balances[someAddr]` is `keccak256(someAddr, 1)`. You don't compute this yourself. The compiler emits the SLOAD and SSTORE opcodes that do it.

```solidity
balances[msg.sender] = 100;             // SSTORE to keccak256(msg.sender, slot)
uint256 b = balances[msg.sender];       // SLOAD from the same slot
balances[msg.sender] += 50;             // SLOAD + add + SSTORE
```

**Key type restrictions** are tighter than value type restrictions. Keys must be types the EVM can deterministically hash: integers, addresses, `bool`, fixed-width bytes. Dynamic types like `string` and `bytes` are also legal as keys, and the compiler hashes them by their full byte content. Structs, mappings, arrays, and other compound reference types aren't allowed as keys, because they don't have a canonical fixed representation.

**Value types are unrestricted.** Any type works, including nested mappings, dynamic arrays, and structs. Nested mappings compose by recursive hashing: the slot for `outer[k1][k2]` is `keccak256(k2, keccak256(k1, p))`.

```solidity
// Token allowance pattern: owner => (spender => amount)
mapping(address => mapping(address => uint256)) public allowance;

allowance[msg.sender][spender] = amount;
```

**Public mappings auto-generate a getter.** A `public` mapping creates an external function with the same name that takes the key and returns the value. For `mapping(address => uint256) public balances`, the auto-getter is `function balances(address) external view returns (uint256)`. For a nested mapping, the getter takes all the keys in order. Marking the mapping `private` only removes the getter. The data is still readable directly from storage by anyone who knows how the slot is derived, which on a public chain is everyone. The [storage layout](/courses/development-on-ethereum/token-security-and-evm-internals/storage-layout) lesson shows how.

## The most common use: a running total per address

```solidity
// SPDX-License-Identifier: MIT
// Solidity 0.8.24, Ethereum mainnet
pragma solidity 0.8.24;

contract PaymentLog {
    mapping(address => uint256) public totalSentBy;

    function pay() external payable {
        totalSentBy[msg.sender] += msg.value;
    }
}
```

Anyone can call `pay()` with ETH attached. The contract reads that sender's running total from the mapping, adds the incoming amount, and writes the new total back. It never needs to know who has paid before, because every address already has a total of zero. With small variations this is the basis for crowdfunding contracts, donation pools, balance tracking in token contracts, and vote counting.

## Workarounds for what mappings can't do

Each impossible operation has a standard workaround, and each workaround costs gas.

**Wanting to iterate.** Maintain a parallel array of keys yourself. Every time you insert a key for the first time, push it onto the array. When you need to iterate, loop over the array.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract IterableBalances {
    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public hasEverPaid;
    address[] public allPayers;

    function pay() external payable {
        if (!hasEverPaid[msg.sender]) {
            hasEverPaid[msg.sender] = true;
            allPayers.push(msg.sender);
        }
        balanceOf[msg.sender] += msg.value;
    }
}
```

Every first-time payer triggers two extra storage writes: one to flip the seen flag, one to append to the array. In return you can enumerate every payer off-chain by reading `allPayers`.

**Wanting to distinguish "stored zero" from "never stored."** Maintain a separate flag mapping, like `hasEverPaid` above. If the value is zero and the flag is false, the key was never written. If the value is zero and the flag is true, the key was deliberately set to zero.

You need this whenever zero is a legitimate value and not absence: an auction where a zero bid is a real action, a vote where a weight of zero is a deliberate abstention, an allowance set to zero as a revocation. Without the flag, an access check built on `balance > 0` treats a legitimate user who just spent everything the same as someone who never used the contract.

**Wanting removal.** The parallel array handles insertion and iteration, but `delete myMapping[key]` does not touch the array. Removing a key from the array means either leaving a gap or shifting later entries. The standard answer is OpenZeppelin's `EnumerableSet` or `EnumerableMap`, which swap the removed entry with the last one and pop it, so the array stays dense. If you maintain your own iteration support, look at how they do it first.

## Where mappings are the wrong answer

Mappings fit unbounded, sparse, key-addressable data. They give you O(1) random access and nothing else, so in three cases another structure is better.

For small known key sets, say the four possible states of a contract lifecycle, a fixed-size array indexed by an enum value is simpler and gives you trivial iteration.

For ordered traversal, for example payers from largest to smallest, mappings give you nothing. The parallel array only helps if it is maintained in sorted order, which costs extra on every insert.

For "is this key present" checks that need to be fast and frequent, the separate flag mapping has the right semantics but doubles your storage cost. Sometimes the better answer is a sentinel value that can't appear naturally in the value type, so absence is detectable from the value alone.
