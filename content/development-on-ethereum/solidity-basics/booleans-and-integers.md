---
id: 133
title: Booleans and integers
type: lecture
order: 1
faq:
  - question: Why does 1 / 2 give 0 in Solidity instead of 0.5?
    answer: Solidity has no floating-point numbers for production use, so integer
      division truncates toward zero and simply discards anything after the
      decimal point. That means 1 / 2 is 0 and 10 / 3 is 3, which quietly breaks
      fee and percentage calculations for beginners. The standard fix is to
      scale your numerator up by a factor such as 1e18 before dividing, then
      scale the result back down when you need a human-readable number.
  - question: What happens when a number overflows in Solidity?
    answer: Since Solidity 0.8.0, arithmetic that would overflow or underflow
      reverts the transaction by default instead of silently wrapping around.
      The transaction is rolled back as if it never happened, any ETH sent is
      returned, and the contract state is unchanged, though the sender still
      pays gas for the failed attempt. Older Solidity wrapped silently, which
      caused real exploits, which is why checking became the default.
  - question: Should I use uint8 instead of uint256 to save gas?
    answer: Usually no. The EVM operates on 256-bit words, so a standalone uint8
      costs the same to store as a uint256 and can even cost slightly more gas
      because it has to be masked. Smaller integer types only pay off when
      several of them are declared together and the compiler can pack them into
      a single 32-byte storage slot; for loop counters and ordinary values, just
      use uint256.
  - question: Do I need to initialize variables in Solidity, or can they be null?
    answer: "There is no null or undefined in Solidity: every variable has a
      definite value the moment it is declared. An unassigned uint reads as 0, a
      bool as false, an address as the zero address, and a string as empty. This
      comes from how chain storage works, where every unwritten 32-byte slot
      reads as zeros, which the type system interprets as that type's zero
      value."
---

> The next several lessons walk through the Solidity type system, the building blocks every contract is made of. This lesson covers the structure of a Solidity file and the first half of the type system. The first half is value types, the simple types that hold their data inline.

## How a Solidity file is structured

Solidity source code lives in files with the `.sol` extension. A minimal Solidity file has three things before any contract code: a license declaration, a pragma directive, and at least one contract.

```solidity
// SPDX-License-Identifier: MIT
// Solidity 0.8.24, Ethereum mainnet
pragma solidity 0.8.24;

contract Token {
    // state variables, events, and functions go here
}
```

The **SPDX license identifier** is a machine-readable license tag the Solidity compiler expects at the top of every file. The compiler emits a warning if it's missing. Etherscan reads this line when displaying verified contracts. The most common choice is `MIT`. For proprietary code use `UNLICENSED`. Other valid identifiers include `Apache-2.0`, `GPL-3.0`, and `BUSL-1.1`.

The **pragma directive** tells the compiler which Solidity version this file expects. `pragma solidity 0.8.24;` pins exactly that version. `pragma solidity ^0.8.24;` allows that version or any later patch in the 0.8 series. Production code usually pins exactly. Tutorial code often uses the caret to stay forward-compatible.

The **contract block** opens with the `contract` keyword followed by a name and curly braces. Everything that defines what the contract does goes inside: state variables, events, errors, modifiers, the constructor, and functions. A single file can contain multiple contracts, but a deployed contract is one contract block from one file. The on-chain contract lives at an address. The name is purely a source-code convenience.

One Solidity file can also import others. `import "./Token.sol";` brings in everything declared in `Token.sol`. `import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";` brings in just one named symbol. Imports get more interesting once we cover inheritance and libraries.

## How bool works

The `bool` type holds one of two values: `true` or `false`. Nothing else. No `null`, no `undefined`, and no treating other values as true or false the way JavaScript does. A variable typed `bool` has exactly two possible runtime states.

There are two ways to declare one. As a state variable, stored on chain and persisting across transactions:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Vault {
    bool public paused;
}
```

Or as a local variable inside a function, which lives only for the duration of that call:

```solidity
function process() external {
    bool ready = true;
    // ...
}
```

The naming convention is `mixedCase`: first word lowercase, subsequent words capitalized, no underscores. The compiler does not enforce this. Every Solidity codebase you read will follow it anyway.

Boolean values support the standard logical operators. Logical AND is `&&`, logical OR is `||`, negation is `!`. Equality is `==` and inequality is `!=`. Both `&&` and `||` **short-circuit**: if the left operand of `&&` is `false`, the right operand is never evaluated. This matters when the right operand has side effects or could revert.

```solidity
function safeWithdraw() external {
    // checkOwner() is never called if paused is true
    require(!paused && checkOwner(msg.sender), "locked");
}
```

Short-circuiting is the same as in most languages. It's worth pointing out because Solidity has no implicit type coercion to bool. You cannot write `if (someUint)` to test for "non-zero". You write `if (someUint != 0)`. The compiler will reject anything that isn't already typed `bool`.

One quirk: a `bool` takes up one byte on the stack but always occupies a full 32-byte word when stored in a struct or array slot. So a standalone `bool` state variable costs the same to store as a `uint256`. The compiler can pack multiple booleans together into one storage slot if you declare them consecutively as state variables, which becomes relevant once you're thinking about storage layout for gas optimization.

## Why integers are fixed-size

Two ideas before any syntax.

First, **every variable in Solidity has a definite value the moment it is declared**. There is no `null`, no `undefined`, no "uninitialized" state. If you write `uint256 public count;` and never assign to it, reading it returns `0`. Booleans default to `false`, addresses to `0x0...`, strings to empty, structs to all-zero. This is a consequence of how storage on a chain works. Every storage slot is a 32-byte word, and an unwritten slot reads as zeros, which the type system interprets as the zero value of that type.

Second, **Solidity integers are fixed-size machine integers, not arbitrary-precision math**. When you write `uint256 x = 5`, you have actually allocated 256 bits to hold that 5. Languages you've used hide this from you. Python's `int` grows as needed. JavaScript's `Number` trades away precision silently above 2^53. Ruby's `Integer` auto-promotes to bignum. Solidity does none of that. You choose the bit budget up front, and any arithmetic that exceeds it is treated as a real error.

Those two ideas underlie everything in this section.

## The integer families

Solidity has two integer families: **unsigned** (`uint`) for non-negative values, and **signed** (`int`) for values that can go negative. Inside each family there are several sizes, expressed in bits, from 8 up to 256 in steps of 8. So `uint8`, `uint16`, `uint24`, all the way up to `uint256`. Same for `int`.

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

When should you reach for a smaller size? Less often than you'd think. The default `uint256` is the cheapest to operate on. The reason to use smaller types is **storage packing**: if you have several small values that fit together inside one 32-byte slot, declaring them as `uint8` or `uint16` lets the compiler pack them. You pay for one storage slot instead of several. For loop counters, function arguments, and temporary values, the answer is almost always just `uint256`.

The motivation for unsigned types is straightforward. Many on-chain quantities cannot be negative: a token balance, a block number, an amount of gas, the length of an array. Modeling these as `uint256` lets the type system catch a class of bugs at compile time. If a function takes `uint256 amount`, you don't need a runtime check that the caller passed a non-negative number. The type already says so.

## Signed integers and the two's-complement asymmetry

Signed integers sacrifice one bit of value range to remember the sign. So an `int8`, instead of holding 0 to 255, holds `-128` to `127`. The top bit separates negative values from non-negative ones. That gives 128 non-negative values (0 to 127) and 128 negative values (-1 to -128).

```solidity
int256 minInt256 = type(int256).min; // -2^255
int256 maxInt256 = type(int256).max; //  2^255 - 1
```

Notice the asymmetry: the negative side reaches one further from zero than the positive side. That is two's-complement representation, which is what every general-purpose CPU on Earth uses. You don't need to internalize the bit patterns, but you should remember that `type(intN).min` is `-2^(N-1)` and `type(intN).max` is `2^(N-1) - 1`.

When do you need signed integers? Rarely. In typical contract logic, everything is expressed as a non-negative balance plus a direction. Deposits and withdrawals both work in `uint256`, with the operation deciding whether to add or subtract. Signed math creeps in only for things like price deltas, fixed-point arithmetic, or tick math in concentrated-liquidity AMMs. If you're writing a token, an escrow, a vault, or a registry, you almost certainly want unsigned.

## Arithmetic and the truncating division rule

The arithmetic operators are conventional: `+`, `-`, `*`, `/`, `%` for modulo, `**` for exponentiation. Comparisons are `==`, `!=`, `<`, `<=`, `>`, `>=`, and they return `bool`. There's also a unary minus for sign flip.

```solidity
uint256 a = 10 + 3;   // 13
uint256 b = 10 - 3;   // 7
uint256 c = 10 * 3;   // 30
uint256 d = 2 ** 8;   // 256
uint256 e = 10 % 3;   // 1
```

The twist that catches developers from dynamically-typed languages: **integer division truncates toward zero**. No floats, no rounding. Whatever was after the decimal point is discarded.

```solidity
uint256 half = 1 / 2;          // 0, not 0.5
uint256 third = 10 / 3;        // 3, not 3.33...
uint256 percent = 1 * 100 / 200; // 0, not 0.5
```

Solidity has no native floating-point type for production use, and truncating division is the predictable behavior across every fixed-precision language. But it is the source of an entire category of accounting bugs in beginner contracts. A fee calculation that "should be 0.5%" silently becomes 0% for any input that isn't a multiple of 200. The fix in production code is always the same. Scale your numerators up by some factor, typically `1e18`, before dividing, then scale results back down at the boundary where you need a human-readable number. This is the foundation of how every DeFi protocol handles fractional math.

Division by zero reverts the transaction. So does modulo by zero.

## What happens on overflow

Before Solidity 0.8.0, integer overflow wrapped silently. If you incremented a `uint8` past 255, it became 0 with no warning and no revert. This caused real exploits in production contracts. The BatchOverflow incident in 2018 created vast token balances out of nothing in multiple ERC-20 contracts by exploiting unchecked multiplication. That incident was the canonical case study that pushed the language toward fixing this by default.

From Solidity 0.8.0 onward, arithmetic that would overflow or underflow **reverts the transaction by default**. No silent wraparound. The transaction is rolled back as if it never happened, any ETH sent with it is returned to the sender, and the contract state is unchanged. Here is the canonical demonstration:

```solidity
contract OverflowDemo {
    uint8 public value = 254;

    function increment() external {
        value += 1; // 255 the first time, reverts the second
    }
}
```

Call `increment()` once, `value` becomes 255. Call it a second time and the call reverts. `value` stays at 255. The sender still pays gas for the failed transaction, since you cannot get free reverts on Ethereum, but the bad state change does not happen.

This guarantee matters. In a financial contract, "the operation silently does the wrong thing" is almost never what you want. "The transaction fails and the user is told" is almost always what you want.

## The `unchecked` escape hatch

There are cases where you genuinely don't want the overflow check. Two common ones:

1. You've proved by the surrounding logic, or a `require` upstream, that overflow cannot happen, and you want to skip the redundant check to save gas.
2. You actually want modular arithmetic, for example in a hash combiner or a pseudorandom step.

For these, Solidity gives you the `unchecked` block, which suspends overflow protection inside its braces:

```solidity
function unsafeIncrement(uint256 x) external pure returns (uint256) {
    unchecked {
        return x + 1; // wraps to 0 if x == type(uint256).max
    }
}
```

Inside `unchecked`, an overflow wraps around to the bottom of the type's range, and an underflow wraps to the top. Subtracting 1 from a `uint8` whose value is 0 produces 255. Solidity 0.8 just stopped letting you see this by accident.

A practical rule for your first year of Solidity: **do not use ****`unchecked`**** unless you can write down, in one sentence, why the bounds it bypasses cannot be exceeded**. The gas savings are real but small, around 30 to 40 gas per arithmetic op. The cost of being wrong is a security bug auditors will absolutely find.

A pattern you'll see in production code is `unchecked` on loop counter increments:

```solidity
for (uint256 i = 0; i < items.length;) {
    // ... do something with items[i] ...
    unchecked { ++i; }
}
```

This is safe because `i` is provably less than `items.length` at the point of increment, and `items.length` cannot exceed `type(uint256).max`. The EVM doesn't have enough memory to hold an array that long. The pattern saves a small amount of gas per iteration, which matters for loops over thousands of items.

The increment forms `x = x + 1`, `x += 1`, and `x++` are all equivalent and all subject to the same overflow check outside an `unchecked` block. Pick whichever reads best for the code you're writing.

## Things that catch developers

A few patterns to internalize early.

**Defaulting to ****`int`**** because that's what other languages use.** In Solidity, `uint256` is the right default for almost every quantity. Reach for `int` only when you actually need negative values.

**Picking ****`uint8`**** to "save gas" on a single variable.** A standalone `uint8` storage variable costs the same as a `uint256`. Smaller types only pay off when they're packed together in one slot.

**Assuming integer division rounds.** It truncates. `1 / 2` is `0`, not `1`. Scale numerators or use a fixed-point library for percentages and rates.

**Reaching for ****`unchecked`**** to optimize without justification.** The gas savings are small and the worst-case is a real vulnerability. The bar should be: you can articulate the bound you're relying on in one sentence.

**Treating ****`unchecked`**** as "old Solidity behavior, faster."** It's faster, but the reason 0.8 made checking the default is that the unchecked behavior was the cause of major historical exploits.
