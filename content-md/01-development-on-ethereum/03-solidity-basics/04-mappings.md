# Mappings

_type: lecture_

> A key-value store, by design constrained. Solidity's mappings look like dictionaries from other languages until you try to do anything with them. No length, no iteration, no equality, storage-only. These limitations aren't arbitrary. They follow directly from how the EVM stores data, and once you see the storage model the design choices become inevitable.

## What you'd expect

Every mainstream language has some flavor of dictionary. Python's `dict`, JavaScript's `Map`, Java's `HashMap`. The interface is consistent across them: put a value under a key, get it back by key, list the keys, ask for the size, iterate.

Solidity has the same data structure. It's called a `mapping`. The syntax even looks the same:

```solidity
mapping(address => uint256) balances;
balances[someAddress] = 100;
uint256 b = balances[someAddress];
```

And then everything else you'd expect to work doesn't. You can't call `.length`. You can't loop over the keys. You can't return a mapping from a function. You can't even put one in memory. Reading a key that was never written doesn't throw an error, it just gives you zero.

To understand mappings, start from why these limitations exist.

## The constraint: EVM storage

A contract's persistent state lives in what the EVM calls storage. Storage has a specific shape that drives the entire design of mappings.

Storage is a flat array of slots. Each slot holds exactly 32 bytes. There are `2^256` of them, numbered from 0 upward. That's an astronomically large number. Every slot exists in principle. Every slot is initialized to zero. Every slot can be read or written by the contract that owns it.

Three properties matter for what follows:

- The keyspace is fixed and enormous. Every possible 256-bit number is a valid slot address.
- Every slot starts as zero. There's no concept of "this slot hasn't been written." Reading a fresh slot returns 32 bytes of zero.
- The EVM does not track which slots a contract has touched. There's no metadata, no key set, no list of "slots in use." You write to a slot, the value is there. You read another slot, you get zero. The EVM doesn't distinguish written from unwritten.

These properties are not Solidity-specific. They're the EVM. Solidity's design choices for state variables, arrays, and mappings all have to live within these rules.

## What this forces

Suppose you want a data structure that lets a contract store unbounded key-value pairs. Keys can be addresses or integers or fixed bytes. Values can be anything. You want O(1) lookups, the way every dictionary in every other language works. Walk through what you have to do, given the storage shape above.

**Step one: deriving slots from keys.** You have keys, and you have a flat numbered slot space. To get O(1) lookup, the slot for a given key needs to be computable from the key alone, with no intermediate table lookup. The standard way to do this is hashing. Hash your key with a cryptographic hash function, take the result as a 256-bit number, use that as the slot address.

Solidity does exactly this. For a mapping declared at position `p` in the contract's storage layout, the slot for key `k` is `keccak256(k, p)`. No table lookup, no key list, no metadata. The slot comes straight from the hash.

**Step two: handling the "key not present" case.** Every key hashes to some slot. That slot was zero before anyone wrote to it. That slot is still zero unless someone wrote to it.

This means there's no way to "ask if a key exists" that's distinct from "read the value at that key." If you ask, the EVM gives you whatever is currently in the slot. If that's zero, you can't tell whether the value zero was stored deliberately or whether nothing was ever stored.

So Solidity makes a choice: reading a key always succeeds. There is no concept of a missing key. Conceptually, every possible key already maps to the zero value of the value type. Writing replaces the zero. Writing zero is indistinguishable from never writing at all.

This is the mental picture. Not a table with a small finite set of entries, but an infinite table with one entry for every possible key, all pre-initialized to zero, sitting there waiting for you to overwrite some of them.

**Step three: confronting what you can't do.** Now ask what's missing.

**Length** is gone. The EVM doesn't track which slots you've touched, and there's no key set being maintained anywhere. There's literally no number that represents "how many entries are in this mapping," because conceptually every key is an entry. There are `2^256` of them. Reporting that is useless.

**Iteration** is gone. To iterate, you need to enumerate keys. To enumerate keys, you need a key list. There is no key list.

**Equality** is gone in two senses. You can't ask whether two mappings hold the same set of entries. You can't ask whether a specific key was set.

**Returning from a function** is gone. To return a mapping, you'd have to return its contents, which means enumerating the keys, which is impossible. Solidity refuses to compile a function that tries to return a mapping by value.

**Memory and calldata** are gone. The slot-derivation trick only works in storage. Memory has its own model and there's no equivalent mechanism. Solidity rejects any attempt to declare a `mapping` as a memory or calldata variable.

**Bulk deletion** is gone. `delete myMapping` doesn't compile, because the operation would require enumerating every key the contract has touched, which the EVM can't tell you. You can `delete myMapping[someKey]` because that just sets one slot back to zero, but you can't wipe the whole structure in one operation.

Every one of these limitations falls out of the same starting constraint. Storage is flat, slots are derived by hashing, the EVM tracks nothing on its own. Once you've accepted that, you've accepted everything.

## Declaring and using mappings

Pulling it together. The syntax for declaring a mapping:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Storage {
    mapping(address => uint256) public balances;
}
```

The slot for `balances[someAddr]` is `keccak256(someAddr, 1)` if `balances` is declared at storage position 1. You don't compute this yourself. The compiler emits the SLOAD and SSTORE opcodes that do it. But knowing how it works explains everything else.

Reading and writing use bracket syntax:

```solidity
balances[msg.sender] = 100;             // SSTORE to keccak256(msg.sender, slot)
uint256 b = balances[msg.sender];       // SLOAD from the same slot
balances[msg.sender] += 50;             // SLOAD + add + SSTORE
```

Reading a never-written key returns the zero value of the value type. For `uint256`, that's 0. For `bool`, `false`. For `address`, `0x0`. For `string`, the empty string. No revert, no error, just the type's default. The default-value rule that holds for every Solidity variable generalizes here: every key has a definite value at all times, which is zero until you write something else.

**Key type restrictions** are tighter than value type restrictions. Keys must be types the EVM can deterministically hash: integers, addresses, `bool`, fixed-width bytes. Dynamic types like `string` and `bytes` are also legal as keys, and the compiler hashes them by their full byte content. Structs, mappings, arrays, and other compound reference types aren't allowed as keys. They don't have a canonical fixed representation.

**Value types are unrestricted.** Any type works, including nested mappings, dynamic arrays, structs, anything. Nested mappings compose by recursive hashing: the slot for `outer[k1][k2]` is `keccak256(k2, keccak256(k1, p))`. All the way down.

```solidity
// Token allowance pattern: owner => (spender => amount)
mapping(address => mapping(address => uint256)) public allowance;

allowance[msg.sender][spender] = amount;
```

**Public mappings auto-generate a getter.** A `public` mapping creates an external function with the same name that takes the key and returns the value. For `mapping(address => uint256) public balances`, the auto-getter is `function balances(address) external view returns (uint256)`. For a nested mapping, the getter takes all the keys in order. The getter has no equivalent of "give me the whole mapping" because that operation doesn't exist.

## A canonical contract

The pattern you'll write more often than any other. A mapping keyed by sender, accumulating the values they've sent:

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

Three lines of logic. Anyone can call `pay()` with ETH attached. The contract reads that sender's running total from the mapping, adds the incoming amount, writes the new total back. The auto-generated `totalSentBy(addr)` getter lets external callers query any sender's running total.

Everything from the previous lesson shows up here. `msg.sender`, typed `address`, is the mapping key. `msg.value`, typed `uint256`, is the value being accumulated. The `payable` keyword admits ETH. The mapping pattern records per-user state without needing to track who has paid before.

This three-line pattern, with small variations, is the basis for crowdfunding contracts, donation pools, balance tracking in token contracts, vote counting, and many other accounting-style patterns. Recognize the shape. You'll see it everywhere.

## Workarounds for what mappings can't do

Each impossible operation has a standard workaround. None of them are free.

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

The cost is real. Every first-time payer triggers two extra storage writes: one to flip the seen flag, one to append to the array. The gain is that you can now enumerate every payer off-chain by reading `allPayers`.

**Wanting to distinguish "stored zero" from "never stored."** Maintain a separate flag mapping, exactly like `hasEverPaid` does above. The contract now has two pieces of state: the value, and whether anything was ever set. If the value is zero and the flag is false, the key was never written. If the value is zero and the flag is true, the key was deliberately set to zero.

This is the right pattern whenever zero is a legitimate distinct value rather than "absence." Auctions where a zero bid is a real action. Voting where a vote weighted zero is a deliberate abstention. Allowance mappings where setting the allowance to zero is a deliberate revocation.

**Wanting bulk operations or removal with renumbering.** The parallel-array pattern handles insertion and iteration well, but not deletion. Removing a key from a parallel array means either leaving a gap or shifting later entries. Both have problems. The standard answer is to reach for OpenZeppelin's `EnumerableSet` or `EnumerableMap`, which implement the swap-and-pop technique to keep the parallel array dense. If you're maintaining your own iteration support, look at how they do it before reinventing.

## Where mappings are the wrong answer

Mappings are the right answer for unbounded, sparse, key-addressable data. They're the wrong answer in several specific cases.

For small known key sets, say the four possible states of a contract lifecycle, a fixed-size array indexed by an enum value is simpler and gives you trivial iteration.

For ordered traversal, for example payers from largest to smallest, mappings give you nothing useful. Even the parallel-array trick only helps if the array is maintained in sorted order, which costs extra on every insert.

For "is this key present" checks that need to be fast and frequent, the separate flag mapping has the right semantics but doubles your storage cost. Sometimes the right answer is to use a sentinel value that can't appear naturally in the value type, so absence is detectable from the value alone.

The deeper point is this. Mappings optimize hard for O(1) random access at the cost of every other access pattern. Use them when that tradeoff matches your problem. When it doesn't, an array, a struct, or a more specialized data structure is the right call.

## Things that catch developers

A few patterns to internalize.

**Reading a key returns zero, never an error.** No "key not found" exception, no null. If your logic needs to distinguish "user has zero balance" from "user has never interacted," you need a separate flag or a sentinel value. Building auth checks on `balance > 0` is a real bug class because a legitimate user who just spent everything looks identical to a non-user.

**`delete mapping[key]`**** sets the value back to zero, it doesn't remove the entry.** There is no removal because there was never an entry. If you're maintaining a parallel array for iteration, `delete` doesn't update the array. You have to do that work yourself.

**Trying to put a mapping in memory or in a struct returned to memory.** Mappings live in storage only. A struct containing a mapping cannot be passed around or returned by value. It can only exist as a storage-located variable, which is a real constraint on how you structure your contracts.

**Forgetting that public mappings expose every key.** The auto-generated getter takes the key as input. There's no privacy in mapping data. If you don't want every value queryable by anyone, mark the mapping `private`. Note that "private" only means the auto-getter is suppressed. The data is still readable directly from storage by anyone who knows the slot derivation, which on a public chain is everyone.

**Using a mapping for ordered data.** Mappings are unordered by design. If insertion order or rank order matters, you need a different structure. As shown earlier, a parallel array can impose order, but maintaining it becomes expensive.
