---
id: 133
title: Booleans and integers
type: lecture
order: 1
faq:
  - question: Why does 1 / 2 give 0 in Solidity instead of 0.5?
    answer: >-
      Integer division truncates toward zero. Solidity has no floating-point type, so 10 / 3
      is 3. Scale by 1e18 before dividing, then scale back where a human reads the number.
  - question: What happens when a uint8 goes past 255?
    answer: >-
      Since Solidity 0.8.0 the transaction reverts. State is unchanged, any ETH sent is
      returned, and the sender still pays gas. Before 0.8.0 it wrapped silently to 0, which
      the 2018 BatchOverflow exploits used to create token balances out of nothing.
  - question: Should I use uint8 instead of uint256 to save gas?
    answer: >-
      Usually no. The EVM operates on 256-bit words, so a standalone uint8 costs the same to
      store as a uint256 and a little more gas to mask. Packing pays off only when several
      small fields are declared consecutively and share one 32-byte slot.
  - question: What does an unassigned bool read as?
    answer: >-
      false. Booleans have no null state in Solidity, and every unwritten 32-byte storage slot
      reads as zeros, so an untouched uint256 reads 0 for the same reason.
  - question: How much gas does an unchecked block save?
    answer: >-
      Around 30 to 40 gas per arithmetic operation. The bar for using it is being able to
      write down in one sentence why the bound it bypasses cannot be exceeded.
---

> Solidity's value types are the simple types that hold their data inline, and booleans and integers are where every contract begins. The surprise for newcomers is that Solidity integers are fixed-size rather than the arbitrary-precision numbers Python or JavaScript give you, which means arithmetic can overflow or silently truncate.

## How a Solidity file is structured

A minimal Solidity file has three things before any contract code: a license declaration, a pragma directive, and at least one contract.

```solidity
// SPDX-License-Identifier: MIT
// Solidity 0.8.24, Ethereum mainnet
pragma solidity 0.8.24;

contract Token {
    // state variables, events, and functions go here
}
```

The compiler emits a warning if the SPDX license line is missing. The **pragma directive** tells the compiler which Solidity version this file expects. `pragma solidity 0.8.24;` pins that one version. `pragma solidity ^0.8.24;` allows that version or any later patch in the 0.8 series. Production code usually pins one version. A single file can contain multiple contracts, but a deployed contract is one contract block from one file. The on-chain contract lives at an address, and the name is purely a source-code convenience.

## Every variable starts at zero

A variable declared at contract level is a state variable, stored on chain and persisting across transactions. A variable declared inside a function is local and lives only for the duration of that call.

**Every variable in Solidity has a definite value the moment it is declared**. There is no `null` and no `undefined`. If you write `uint256 public count;` and never assign to it, reading it returns `0`. Booleans default to `false`, addresses to `0x0...`, strings to empty, structs to all-zero. This is a consequence of how storage on a chain works. Every storage slot is a 32-byte word, and an unwritten slot reads as zeros, which the type system interprets as the zero value of that type.

## How bool works

The `bool` type holds `true` or `false`, and Solidity has no implicit type coercion to bool. You cannot write `if (someUint)` to test for "non-zero". You write `if (someUint != 0)`. The compiler will reject anything that isn't already typed `bool`. Both `&&` and `||` **short-circuit**: if the left operand of `&&` is `false`, the right operand is never evaluated, which matters when the right operand has side effects or could revert.

A standalone `bool` state variable occupies a full 32-byte slot, so it costs the same to store as a `uint256`. The compiler can pack multiple booleans together into one storage slot if you declare them consecutively as state variables, which becomes relevant once you're thinking about [storage layout](/courses/development-on-ethereum/token-security-and-evm-internals/storage-layout) for gas optimization.

## Integers have a fixed size

**Solidity integers are fixed-size machine integers rather than arbitrary-precision math**. When you write `uint256 x = 5`, you have allocated 256 bits to hold that 5. Languages you've used hide this from you. Python's `int` grows as needed. JavaScript's `Number` trades away precision silently above 2^53. Solidity does none of that. You choose the bit budget up front, and any arithmetic that exceeds it is treated as a real error.

## The integer families

Solidity has two integer families: **unsigned** (`uint`) for non-negative values, and **signed** (`int`) for values that can go negative. Inside each family there are several sizes, expressed in bits, from 8 up to 256 in steps of 8: `uint8`, `uint16`, `uint24`, all the way up to `uint256`, and the same for `int`.

A bare `uint` is shorthand for `uint256`. A bare `int` is shorthand for `int256`. The 256-bit width is the default because the EVM itself operates on 256-bit words. Native arithmetic happens on whole words. Smaller integer types still get fetched as full words and then masked. Using `uint8` in a local variable doesn't save you gas. It often costs slightly more because of the masking.

The bit width determines the range. For an unsigned integer of width N, the value can be anywhere from `0` to `2^N - 1` inclusive. So:

- `uint8` ranges from 0 to 255, which is `2^8 - 1`
- `uint16` ranges from 0 to 65,535
- `uint256` ranges from 0 to a number with 78 digits

You can ask the compiler for these bounds directly:

```solidity
uint256 maxUint8 = type(uint8).max;     // 255
uint256 maxUint256 = type(uint256).max; // 2^256 - 1
```

The reason to use smaller types is **storage packing**: if you have several small values that fit together inside one 32-byte slot, declaring them as `uint8` or `uint16` lets the compiler pack them. You pay for one storage slot instead of several. A standalone `uint8` storage variable costs the same as a `uint256`. For loop counters, function arguments, and temporary values, use `uint256`.

Many on-chain quantities cannot be negative: a token balance, a block number, an amount of gas, the length of an array. Modeling these as `uint256` lets the type system catch a class of bugs at compile time. If a function takes `uint256 amount`, you don't need a runtime check that the caller passed a non-negative number.

## Signed integers are rarely needed

Signed integers sacrifice one bit of value range to remember the sign. So an `int8`, instead of holding 0 to 255, holds `-128` to `127`. The negative side reaches one further from zero than the positive side: `type(intN).min` is `-2^(N-1)` and `type(intN).max` is `2^(N-1) - 1`. In typical contract logic, everything is expressed as a non-negative balance plus a direction. Deposits and withdrawals both work in `uint256`, with the operation deciding whether to add or subtract. Signed math creeps in only for things like price deltas, fixed-point arithmetic, or tick math in concentrated-liquidity AMMs. If you're writing a token, an escrow, a vault, or a registry, you almost certainly want unsigned.

## Arithmetic and the truncating division rule

**Integer division truncates toward zero**. Whatever was after the decimal point is discarded.

```solidity
uint256 half = 1 / 2;          // 0, not 0.5
uint256 third = 10 / 3;        // 3, not 3.33...
uint256 percent = 1 * 100 / 200; // 0, not 0.5
```

Solidity has no floating-point type, because the EVM has none. It works on integer words, and integer arithmetic gives the same result on every node, which [the EVM](/courses/development-on-ethereum/how-ethereum-works/the-evm) requires.

Truncation is the source of an entire category of accounting bugs in beginner contracts. Take a fee of 0.3%, computed as `amount * 3 / 1000`. For an amount of 999 the result is 2, where the exact value is 2.997. For an amount of 100 it is 0. The fee recipient loses the part that was cut off, and the payer keeps it. The order of operations matters too: `amount / 1000 * 3` gives 0 for 999, because the division truncates before the multiplication. So multiply first, then divide.

For rates and prices the same idea is applied with a larger factor. Scale your numerators up by some factor, typically `1e18`, before dividing, then scale results back down at the boundary where you need a human-readable number. This is the foundation of how every DeFi protocol handles fractional math. Scaling uses up range: a `uint256` holds numbers of up to 78 digits, and every multiplication by `1e18` adds 18 digits, so a product of large scaled values can overflow.

Division by zero reverts the transaction. So does modulo by zero.

## What happens on overflow

Before Solidity 0.8.0, integer overflow wrapped silently. If you incremented a `uint8` past 255, it became 0 with no warning and no revert. This caused real exploits in production contracts. The BatchOverflow incident in 2018 created vast token balances out of nothing in multiple ERC-20 contracts by exploiting unchecked multiplication.

From Solidity 0.8.0 onward, arithmetic that would overflow or underflow **reverts the transaction by default**. The transaction is rolled back as if it never happened, any ETH sent with it is returned to the sender, and the contract state is unchanged.

```solidity
contract OverflowDemo {
    uint8 public value = 254;

    function increment() external {
        value += 1; // 255 the first time, reverts the second
    }
}
```

Call `increment()` once, `value` becomes 255. Call it a second time and the call reverts, and `value` stays at 255. The sender still pays gas for the failed transaction, but the bad state change does not happen. In a financial contract a failed transaction is almost always better than one that silently does the wrong thing.

## The `unchecked` escape hatch

There are cases where you don't want the overflow check. Two common ones:

1. You've proved by the surrounding logic, or a `require` upstream, that overflow cannot happen, and you want to skip the redundant check to save gas.
2. You want modular arithmetic, for example in a hash combiner or a pseudorandom step.

For these, Solidity gives you the `unchecked` block, which suspends overflow protection inside its braces:

```solidity
function unsafeIncrement(uint256 x) external pure returns (uint256) {
    unchecked {
        return x + 1; // wraps to 0 if x == type(uint256).max
    }
}
```

Inside `unchecked`, an overflow wraps around to the bottom of the type's range, and an underflow wraps to the top. Subtracting 1 from a `uint8` whose value is 0 produces 255.

A pattern you'll see in production code is `unchecked` on loop counter increments:

```solidity
for (uint256 i = 0; i < items.length;) {
    // ... do something with items[i] ...
    unchecked { ++i; }
}
```

This is safe because `i` is provably less than `items.length` at the point of increment, and `items.length` cannot exceed `type(uint256).max`. The pattern saves a small amount of gas per iteration, which matters for loops over thousands of items. The increment forms `x = x + 1`, `x += 1`, and `x++` are all equivalent and all subject to the same overflow check outside an `unchecked` block.

A practical rule for your first year of Solidity: **do not use `unchecked` unless you can write down, in one sentence, why the bounds it bypasses cannot be exceeded**. The gas savings are real but small, around 30 to 40 gas per arithmetic op, and the cost of being wrong is a security bug.
