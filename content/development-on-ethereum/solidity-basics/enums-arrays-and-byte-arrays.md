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

> Unlike a mapping, an array keeps its length, so you can count it, loop over it, and clear it. Every element a loop touches costs gas, and that limits how long an array in a contract can safely get.

## An array stores its length

The [mappings lesson](/courses/development-on-ethereum/solidity-basics/mappings) showed that a mapping has no length, because the EVM does not record which slots were written. An array does have a length. The fixed-length version specifies its size at declaration, and that size never changes:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract FixedArray {
    uint256[10] public scores;     // exactly 10 slots, all initialized to 0

    function setScore(uint256 index, uint256 value) external {
        scores[index] = value;     // index >= 10 reverts
    }
}
```

A dynamic array has no fixed size. It keeps its current length in a storage slot (the [storage layout lesson](/courses/development-on-ethereum/token-security-and-evm-internals/storage-layout) shows where) and grows or shrinks at runtime:

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

Reading or writing an index that's out of bounds reverts the transaction, for fixed and dynamic arrays alike. Solidity adds this runtime check automatically. Positions that were never written hold the zero value of the element type, like the rest of storage.

`push` and `pop` do not exist on fixed-length arrays. Trying `scores.push(1)` on the `uint256[10]` above is a compile error.

`delete` works on dynamic arrays in two ways. `delete arr[i]` sets the element at index `i` to the zero value of the element type, without changing the array's length. `delete arr` clears the entire array, setting its length to zero. Mappings have no such bulk clear, because nothing records which of their slots were written, while an array's length says how many elements there are to reset.

## A loop pays for every element

Appending one element or reading one element costs the same however long the array is. An operation that touches the whole array pays for every element. Reading a storage slot for the first time in a transaction costs 2,100 gas ([contracts and gas lesson](/courses/development-on-ethereum/how-ethereum-works/contracts-and-gas)), and each `uint256` element of `items` takes one slot. A loop over 1,000 elements pays 2.1 million gas for the reads alone. A loop over 15,000 elements pays 31.5 million, and a block holds around 30 million gas, so that transaction can never succeed.

In `DynamicArray` anyone can call `add`, so anyone can make `items` that long. For that reason a transaction must not loop over an array that users can grow. If you might iterate, keep the array small, or keep iteration off-chain. The [loops and hashing lesson](/courses/development-on-ethereum/solidity-basics/loops-and-hashing) shows a contract that stops working this way and the patterns that avoid it. The [reentrancy and denial-of-service lesson](/courses/development-on-ethereum/token-security-and-evm-internals/reentrancy-and-denial-of-service) shows how one element added by a user can block such a loop.

## Memory arrays cannot grow

Local arrays inside a function live in memory and are allocated with `new`:

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

Memory is one contiguous buffer that lives for a single call, as [the EVM lesson](/courses/development-on-ethereum/how-ethereum-works/the-evm) describes. A memory array is a block of that buffer whose size is given at allocation, and its length is fixed from then on. There's no equivalent of `push()` for memory arrays. To grow one, you allocate a new array of the larger size and copy.

The size argument can be a variable rather than only a constant. In a function that takes a `uint256 count` argument, `new uint256[](count)` allocates an array whose length is decided when the function runs.

Returning a memory array from a function uses the type `T[] memory`, and the caller receives a copy. This is how you produce dynamic-sized result data, for example a list of token IDs owned by an address.

You can initialize a fixed-size memory array with literal values:

```solidity
uint256[3] memory firstThree = [uint256(1), 2, 3];
```

The cast on the first element forces the literal type. Without it, the compiler infers `uint8` for the literal `1` and then refuses to assign a `uint8[3]` to a `uint256[3]`.

## Nested array types read right to left

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

The dimension order is the opposite of what most languages use. `uint256[3][2]` reads right to left as an array of length 2, where each element is a `uint256[3]`. The access expression reads left to right, with the outer index first and the inner second. Declaring `uint256[5][10]` gives you 10 rows of 5 columns, not 5 rows of 10.

## An enum's first value is its default

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

The first declared name gets 0, the second gets 1, and so on. Reading `currentStatus` from the public getter returns that integer.

The default value of an enum variable is always the first declared value. A freshly declared `Status` variable equals `Status.Pending` because `Pending` is index 0. Order your enum values so that the most natural starting state comes first. Putting `Delivered` first by accident would mean every newly created order starts as delivered.

You can convert between enum values and their underlying integer with an explicit cast:

```solidity
uint8 statusIndex = uint8(currentStatus);  // explicit downcast to integer
Status reconstructed = Status(2);          // build a Status from an integer
```

The cast in the second line will revert if the integer is out of range for the enum. So `Status(7)` on a four-value enum reverts at runtime. You don't get an undefined value the way you might in C.

Solidity stores enum values in a `uint8`, the smallest unsigned integer type. An enum can have at most 256 members, so one `uint8` always holds the value. This makes enums much cheaper to store than the string-typed status fields you'd use in a database schema.

An enum also works as a mapping key:

```solidity
mapping(Status => uint256) public ordersInState;
ordersInState[Status.Pending] += 1;
```

## Byte arrays are fixed-width or dynamic

Fixed-width sizes are `bytes1`, `bytes2`, and so on up to `bytes32`. The dynamic version is `bytes`.

`bytes1` is one byte, and `bytes32` is 32 bytes, which is the size of an EVM word and the natural size for storing a hash. A smaller width is useful when packing several values into one slot together with other small types.

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

Dynamic `bytes` is essentially `bytes1[]` but with a more efficient storage layout. It supports `push`, `pop`, `length`, and index access in storage, and indexing returns a single `bytes1`. It's the right type whenever you're handling arbitrary-length raw byte data: hashed pre-images, ABI-encoded payloads, signatures, and similar.

`bytes` and `string` have the same underlying storage layout. `string` carries the convention that the bytes are valid UTF-8 text, and `bytes` carries no such convention. Use `string` when the data is meant to be displayed as text, `bytes` for everything else.

Casting a string to `bytes` and reading `length` gives the number of bytes, not characters, as the [strings lesson](/courses/development-on-ethereum/solidity-basics/strings-and-addresses) explains. `bytes(unicode"привіт").length` is 12 for 6 Cyrillic letters, because each takes 2 bytes in UTF-8. The `unicode""` literal is required when the string contains non-ASCII characters. Plain `"..."` literals reject them at compile time.

## Check every array you store

For every array and every `bytes` variable in storage, ask who can make it longer and who pays for a loop over it. If any user can make it longer and some transaction has to loop over all of it, that transaction stops working once the array is long enough.
