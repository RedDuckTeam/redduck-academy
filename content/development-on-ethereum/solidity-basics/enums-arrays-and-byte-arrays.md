---
id: 35
title: Enums, arrays, and byte arrays
type: lecture
order: 5
faq:
  - question: What does a freshly declared enum variable equal?
    answer: >-
      Its first declared value. Enums are stored as integers starting at 0, so for enum
      Status { Pending, Paid, Shipped } a fresh Status is Status.Pending. Order the members
      so the natural starting state comes first.
  - question: How many values can a Solidity enum hold?
    answer: >-
      256. The value is stored in a uint8, and casting an out-of-range integer such as
      Status(7) on a four-member enum reverts at runtime.
  - question: Why is push a compile error on my array?
    answer: >-
      push and pop exist only on dynamic storage arrays. A fixed-size uint256[10] fixes its
      length at declaration, and a memory array fixes it at allocation with new uint256[](n).
  - question: Why does bytes(myString).length not match the character count?
    answer: >-
      It counts UTF-8 bytes. A Latin letter is one byte, a Cyrillic letter two, an emoji up
      to four. The six-letter word привіт reports a length of 12.
  - question: How do I read a nested array type like uint256[3][2]?
    answer: >-
      Right to left. uint256[3][2] is an array of length 2 whose elements are each a
      uint256[3]. The access expression reads the other way, so grid[outer][inner] takes the
      outer index first. Declaring uint256[5][10] gives you 10 rows of 5.
---

> Three composite types that handle discrete states, indexed sequences, and raw byte data. You'll touch all three in nearly every non-trivial contract. They share a single unifying idea: all three are positional. Enums map names to integer indices. Arrays are accessed by integer index. Byte arrays are sequences of bytes accessed by index. That positional nature is what makes them feel related, and it's why their operations all look similar.

The contrast with the previous lesson is worth holding in mind. Mappings are accessed by key, with no notion of a "first" or "last" element. The types in this lesson are accessed by position, with length, ordering, and iteration as natural operations. Storage cost scales with the number of positions used. Iteration is possible for all three.

## How `enum` works

An enum declares a finite set of named values. Solidity stores them internally as small integers, but in your code you reference them by name.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Order {
    enum Status { Pending, Paid, Shipped, Delivered }

    Status public currentStatus;

    function pay() external {
        currentStatus = Status.Paid;
    }

    function ship() external {
        currentStatus = Status.Shipped;
    }
}
```

Three things to notice. First, you declare an enum at the contract level, the same way you'd declare a state variable. Second, you reference values with dot syntax: `Status.Paid`, never just `Paid`. Third, when you read `currentStatus` from the public getter, you get back a small integer because that's how the value is actually stored. The first declared name gets 0, the second gets 1, and so on.

The default value of an enum variable is always the first declared value. In the example above, a freshly declared `Status` variable equals `Status.Pending` because `Pending` is index 0. This matters. Order your enum values so that the most natural starting state comes first. Putting `Delivered` first by accident would mean every newly created order starts as delivered, which is exactly the kind of bug that reaches production.

You can convert between enum values and their underlying integer with an explicit cast:

```solidity
uint8 statusIndex = uint8(currentStatus);  // explicit conversion to integer
Status reconstructed = Status(2);          // build a Status from an integer
```

The cast in the second line will revert if the integer is out of range for the enum. So `Status(7)` on a four-value enum reverts at runtime. You don't get an undefined value the way you might in C.

The storage cost is small. Solidity stores enum values in a `uint8`, the smallest unsigned integer type. An enum can have at most 256 members, so one `uint8` always holds the value. This makes enums much cheaper than the string-typed status fields you'd use in a database schema.

Enums also make excellent mapping keys. The previous lesson's mapping pattern composes naturally:

```solidity
mapping(Status => uint256) public ordersInState;
ordersInState[Status.Pending] += 1;
```

When should you use an enum? Whenever you have a small, fixed set of mutually exclusive states. Order lifecycles, governance proposal states, vault modes, escrow phases. If you ever find yourself comparing strings to magic constants like `"pending"` or `"paid"`, an enum is the right answer.

## Fixed-length arrays

Arrays come in two flavors. The fixed-length version specifies its size at declaration, and that size never changes:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract FixedArray {
    uint256[10] public scores;     // exactly 10 slots, all initialized to 0

    function setScore(uint256 index, uint256 value) external {
        scores[index] = value;     // index >= 10 reverts
    }

    function getScore(uint256 index) external view returns (uint256) {
        return scores[index];
    }
}
```

The size goes inside the brackets after the element type. Indexing is zero-based, the same as most mainstream languages. Reading or writing an index that's out of bounds reverts the transaction. This is a runtime check the compiler inserts automatically.

The unfilled slots have the zero value of the element type. So in the example above, every position from 0 to 9 reads as 0 immediately after deployment, until you write to it. This is consistent with how all storage works in Solidity, but it's worth saying out loud because some languages return `null` or undefined for unset array slots.

Solidity arrays are homogeneous. Every element has to be the same type. There's no `[uint256, address, bool]` triple of mixed types. That's what structs are for.

You can initialize a fixed array with literal values, but the syntax is finicky:

```solidity
uint256[3] memory firstThree = [uint256(1), 2, 3];
```

The cast on the first element forces the literal type. Without it, the compiler infers `uint8` for the literal `1` and then refuses to assign a `uint8[3]` to a `uint256[3]`. This is one of those small Solidity annoyances that seems unfair until you understand the type inference rules. For state-variable declarations it usually doesn't come up. You'll hit it in memory arrays.

## Dynamic arrays

The other flavor has no fixed size and grows or shrinks at runtime:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract DynamicArray {
    uint256[] public items;

    function add(uint256 value) external {
        items.push(value);          // append
    }

    function removeLast() external {
        items.pop();                // remove the last element
    }

    function count() external view returns (uint256) {
        return items.length;
    }
}
```

Three operations to know. `push(value)` appends to the end of the array, growing it by one. `pop()` removes the last element and shrinks the array by one. `length` returns the current number of elements. Index access works the same as for fixed arrays, with the same runtime bounds check.

Note that `push` and `pop` do not exist on fixed-length arrays. Trying `scores.push(1)` on the `uint256[10]` from earlier is a compile error. The reasoning is in the name: a fixed array's length is fixed.

`delete` works on dynamic arrays in two ways. `delete arr[i]` sets the element at index `i` to the zero value of the element type, without changing the array's length. `delete arr` clears the entire array, setting its length to zero. The latter is the bulk-clear operation that mappings don't have.

Dynamic arrays in storage are gas-friendly for appends and individual reads, but expensive for operations that touch the whole array. Iterating over a thousand-element dynamic array inside a function can easily exceed the block gas limit. The general guidance: if you might iterate, keep the array small, or keep iteration off-chain.

## Nested arrays and the right-to-left reading rule

Solidity supports nested arrays, but the dimension order is the opposite of what most languages use. This is genuinely confusing the first time you see it:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Matrix {
    // OUTER length is 2, INNER length is 3.
    // Read RIGHT to LEFT: "two arrays of three uints"
    uint256[3][2] public grid;

    function setCell(uint256 outer, uint256 inner, uint256 value) external {
        grid[outer][inner] = value;
    }
}
```

The trick is that `uint256[3][2]` should be read right-to-left as "an array of length 2, where each element is `uint256[3]`." So the outer index is the second number in the type, and the inner index is the first.

The brackets in the access expression go in the opposite order from the type declaration. Declaring `[3][2]` and then accessing `grid[outer][inner]` looks contradictory until you remember that the access reads left-to-right, with the outer index first and the inner second, while the type is written with the innermost dimension first.

The same right-to-left logic applies to higher dimensions. Until you are used to it, double-check every nested array declaration. Real bugs have reached production because someone declared `uint256[5][10]` thinking they were getting 5 rows of 10 columns when they actually got 10 rows of 5 columns.

## Memory arrays

Local arrays inside a function live in memory, the same way local strings do. The declaration syntax for a memory array is different from storage:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract MemoryArrays {
    function buildArray() external pure returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](10);  // size required at allocation
        temp[0] = 100;
        temp[1] = 200;
        return temp;
    }
}
```

Two things to flag. First, the `new T[](size)` syntax is mandatory for dynamic memory arrays, and the size must be specified at allocation. There's
