---
id: 35
title: Enums, arrays, and byte arrays
type: lecture
faq:
  - question: What is the default value of an enum in Solidity?
    answer: An enum variable always defaults to its first declared value, because
      enums are stored internally as small integers starting at 0 and every
      unset value in Solidity reads as zero. So for enum Status { Pending, Paid,
      Shipped }, a fresh Status variable equals Status.Pending. Order your enum
      members so the natural starting state comes first; accidentally putting a
      finished state first means every new item starts in that finished state.
  - question: What is the difference between a fixed-size and a dynamic array in
      Solidity?
    answer: A fixed-size array like uint256[10] has its length set at declaration
      and can never grow or shrink, so push and pop are compile errors on it. A
      dynamic array like uint256[] has no fixed size and supports push to
      append, pop to remove the last element, and length to count entries. Both
      use zero-based indexing and revert if you access an index out of bounds.
  - question: Why does bytes(myString).length not return the number of characters?
    answer: Casting a string to bytes and reading .length gives the number of UTF-8
      bytes, not the number of visible characters. A Latin letter is one byte,
      but a Cyrillic letter takes two and an emoji can take four, so the
      six-letter word 'привіт' reports a length of 12. If you truly need
      character counts on international text, do that work off chain.
  - question: How do I read a nested array type like uint256[3][2]?
    answer: "Read the type from right to left: uint256[3][2] means an array of
      length 2 whose elements are each a uint256[3], so the outer length is 2
      and the inner length is 3. Confusingly, the access expression reads the
      opposite way, left to right, so grid[outer][inner] uses the outer index
      first. Real bugs have shipped because someone declared [5][10] expecting 5
      rows of 10 and actually got 10 rows of 5, so double-check every nested
      declaration."
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
uint8 statusIndex = uint8(currentStatus);  // explicit downcast to integer
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

The size goes inside the brackets after the element type. Indexing is zero-based, the same as most mainstream languages. Reading or writing an index that's out of bounds reverts the transaction. This is a runtime check the EVM performs automatically.

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

The brackets in the access expression go in the opposite order from the type declaration. Declaring `[3][2]` and then accessing `grid[outer][inner]` looks contradictory until you remember that the access reads left-to-right, with the outer index first and the inner second, while the type reads right-to-left, with the innermost type first.

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

Two things to flag. First, the `new T[](size)` syntax is mandatory for memory arrays, and the size must be specified at allocation. There's no equivalent of `push()` for memory arrays. Their length is fixed once they're allocated. If you need to "grow" a memory array, you allocate a new one of the larger size and copy.

Second, the size argument can be a variable, not just a constant. So `new uint256[](msg.value / 100)` is valid and will allocate an array sized at runtime based on the incoming ETH. This is one of the few places in Solidity where you allocate memory whose size depends on runtime inputs.

Returning a memory array from a function uses the type `T[] memory`, as shown in the example. The function caller receives a copy. This is how you produce dynamic-sized result data, for example a list of token IDs owned by an address.

## Byte arrays

Byte arrays come in two forms. Fixed-width sizes are `bytes1`, `bytes2`, and so on up to `bytes32`. The dynamic version is just `bytes`.

The fixed-width forms are exactly what they sound like. `bytes1` is one byte. `bytes32` is 32 bytes, which is exactly the size of an EVM word and the natural size for storing a hash. The reason to use a smaller width is when packing several into one slot together with other small types.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract ByteArrays {
    bytes32 public hash = keccak256("hello");
    bytes4 public selector = 0xa9059cbb;       // ERC-20 transfer() selector
    bytes public data;                          // dynamic, grows as needed

    function appendByte(bytes1 b) external {
        data.push(b);                           // bytes supports push, like dynamic arrays
    }
}
```

Dynamic `bytes` is essentially `bytes1[]` but with a more efficient storage layout. It supports `push`, `pop`, `length`, and index access in storage. It's the right type whenever you're handling arbitrary-length raw byte data: hashed pre-images, ABI-encoded payloads, signatures, and similar.

A note on `bytes` versus `string`: they have the same underlying storage layout. The difference is purely semantic. `string` carries the convention that the bytes are valid UTF-8 text. `bytes` carries no such convention. Use `string` when the data is meant to be displayed as text, `bytes` for everything else.

## Why bytes look like a fix for string length, but aren't

The previous lesson noted that you can cast a string to bytes to get its byte count. The natural follow-up question is whether that byte count is the same as the character count. For ASCII it is. For anything else, it isn't.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract StringLength {
    function asciiLength() external pure returns (uint256) {
        bytes memory b = bytes("hello");
        return b.length;  // returns 5
    }

    function unicodeLength() external pure returns (uint256) {
        bytes memory b = bytes(unicode"привіт");  // 6 Cyrillic letters
        return b.length;  // returns 12, not 6
    }
}
```

The Cyrillic example has 6 visible characters but takes 12 bytes because each Cyrillic letter is 2 bytes in UTF-8. An emoji can take 4 bytes. A flag emoji can take 8.

The takeaway: `bytes(s).length` is the byte count, not the character count. Use it knowingly. If you need character counts on internationalized text, the answer is to do that work off-chain.

The `unicode""` literal in the example is required when the string contains non-ASCII characters. Plain `"..."` literals reject them at compile time. This is Solidity's way of making you opt into the encoding question.

## Reading individual bytes

You can index into a byte array to pull out a single byte:

```solidity
function firstByte(bytes memory b) external pure returns (bytes1) {
    require(b.length > 0, "empty");
    return b[0];
}
```

The return type is `bytes1`, a single byte. You can compare it, convert it to a small integer, or use it in switch-style logic. This is how you'd parse a custom binary format on-chain, though if you find yourself doing that frequently it's usually a sign the format should be redesigned.
