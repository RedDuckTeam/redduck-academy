---
id: 154
title: Storage layout
type: lecture
order: 8
faq:
  - question: Is a variable marked private in a Solidity contract actually secret?
    answer: No. The `private` keyword only stops other Solidity source code from
      referencing the variable by name. It is only a compiler rule, so it gives
      you no real secrecy. Every full node stores every contract's storage, and anyone can
      read any slot with a single JSON-RPC call (`eth_getStorageAt`) or a tool
      like `cast storage`. Storing a secret code, seed, or password in a private
      variable means it is fully readable on chain, which is a recurring source
      of real audit findings.
  - question: Can I save gas just by reordering the variables in my contract?
    answer: Often yes. Storage is a series of 32-byte slots, and the compiler packs
      adjacent variables into the same slot if their combined size fits in 32
      bytes, assigning slots in the order you declare them. Two `uint128` values
      declared next to each other share one slot, but if you put a full
      `uint256` between them they can no longer be packed and you waste a slot.
      Since each storage slot costs gas to write, declaring small, same-size
      variables next to each other lets the compiler pack them and lowers your
      gas.
  - question: Where does Solidity store the values in a mapping or a dynamic array?
    answer: Not next to your other variables. For a dynamic array, its declared slot
      only holds the length. The elements live starting at keccak256 of that
      slot number, with element i at that hash plus i. For a mapping, the
      declared slot stays empty forever, and each value sits at keccak256 of the
      key concatenated with the slot number. Because these positions come from
      hashing, they land far away in the storage space, and anyone who knows the
      contract address and the slot layout can still compute and read them.
  - question: Why can't I read all the keys in a mapping or return a whole mapping
      from a function?
    answer: A mapping keeps no list of which keys have been set. Every possible key
      conceptually already exists with a default value of zero, and values are
      scattered across hash-derived slots with no index. So there is nothing to
      iterate over, and a missing key is indistinguishable from one deliberately
      set to zero. If you need to enumerate keys, keep a separate array of them
      alongside the mapping. Mappings also cannot be returned from functions
      because there is no finite way to serialize them. Expose a getter for one
      key instead.
---

> Solidity state variables live in storage. So far you've been declaring them and using them without thinking about where they actually sit. They sit in a giant array of 32-byte slots, with 2^256 slots in total, indexed starting from 0. The compiler decides which variable goes in which slot, and for dynamic types like mappings and arrays the slot derivation involves hashing. This lesson walks through how storage is actually laid out: how the compiler packs small types together, where dynamic arrays put their elements, where mappings put their values, and the security implication that follows from all of this. Anyone can read any slot of any contract. Marking a state variable `private` does not make it secret.

## Storage is an array of slots

A contract's storage is logically a flat array. Each entry is one slot. A slot is 32 bytes (256 bits) wide. The array has 2^256 slots, all initialized to zero. State variables get assigned positions in this array when the contract is compiled, starting from slot 0 in declaration order.

Consider this contract:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Sample {
    uint256 a = 123;
    uint128 b = 10;
    uint128 c = 20;
}
```

The compiler walks the variables in order. `a` is 32 bytes wide, so it takes a full slot. It gets slot 0. Next is `b`, which is 16 bytes wide. It can't fit in slot 0 because slot 0 is already taken in full by `a`, so `b` starts at slot 1 in the low 16 bytes. Next is `c`, also 16 bytes wide. The high 16 bytes of slot 1 are still free, so `c` fits there. `b` and `c` share slot 1.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Storage layout: uint256 a fills slot 0; uint128 c and b share slot 1</title><desc>Slot 0 holds the 32-byte uint256 a. Slot 1 packs two 16-byte values, c in the high bytes and b in the low bytes, into one uint256, while slot 2 stays empty.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Storage slots after compiling the example</text>
  <text x="70" y="96" text-anchor="end" font-family="monospace" font-size="11" fill="#000000">slot 0</text>
  <rect x="90" y="74" width="590" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="385" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000">uint256 a = 123</text>
  <text x="70" y="160" text-anchor="end" font-family="monospace" font-size="11" fill="#000000">slot 1</text>
  <rect x="90" y="138" width="295" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="237" y="164" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000">uint128 c = 20</text>
  <rect x="385" y="138" width="295" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="532" y="164" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000">uint128 b = 10</text>
  <text x="90" y="196" font-family="monospace" font-size="9" fill="#565653">byte 31 (high)</text>
  <text x="385" y="196" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">byte 16  |  byte 15</text>
  <text x="680" y="196" text-anchor="end" font-family="monospace" font-size="9" fill="#565653">byte 0 (low)</text>
  <text x="90" y="226" font-family="monospace" font-size="10" fill="#565653">reads as a single uint256:</text>
  <text x="90" y="246" font-family="monospace" font-size="10" fill="#000000">0x000000000000000000000000000000140000000000000000000000000000000a</text>
  <text x="90" y="262" font-family="monospace" font-size="9" fill="#565653">           high bytes hold c=0x14                low bytes hold b=0x0a</text>
  <text x="70" y="306" text-anchor="end" font-family="monospace" font-size="11" fill="#000000">slot 2</text>
  <rect x="90" y="284" width="590" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="385" y="310" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">zero (unused)</text>
  <text x="360" y="372" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Variables fill slots in declaration order. Smaller types pack into the same slot when they fit.</text>
</svg>

The packing rule: adjacent state variables get packed into the same slot if their combined size fits in 32 bytes. The first variable in declaration order occupies the LOW bytes. Each subsequent packed variable occupies the next higher bytes upward.

This matters for gas. Every storage slot you write costs gas. A slot that holds two 128-bit values costs the same gas to update as one that holds a single 256-bit value. Pack your state correctly and you save gas. The order of declaration controls this. If you write `uint128 b; uint256 a; uint128 c;` instead, the compiler can't pack `b` and `c` together because `a` sits between them. You end up using three slots instead of two. Declare same-size and small variables next to each other so the compiler has a chance to pack them.

## Reading storage from outside

Storage isn't private to the contract. Every full node holds a copy of every contract's storage. Any client can ask any node for the contents of any slot via the JSON-RPC method `eth_getStorageAt(contractAddress, slot)`.

From a Hardhat test using viem:

```typescript
// Hardhat 3 with viem
const slot0 = await publicClient.getStorageAt({
  address: sample.address,
  slot: 0n,
});
const slot1 = await publicClient.getStorageAt({
  address: sample.address,
  slot: 1n,
});
console.log("slot 0:", slot0);
console.log("slot 1:", slot1);
```

For the example contract above this prints:

```
slot 0: 0x000000000000000000000000000000000000000000000000000000000000007b
slot 1: 0x000000000000000000000000000000140000000000000000000000000000000a
```

Slot 0 reads as `0x...7b`, where `7b` is the hex of 123, the value of `a`. The leading zeros are just the slot's 32-byte width.

Slot 1 reads as `0x...0014...000a`. Two values are visible inside the slot. The high 16 bytes hold `0x14`, which is 20 in decimal, the value of `c`. The low 16 bytes hold `0x0a`, which is 10 in decimal, the value of `b`. They share the slot exactly as the diagram showed.

Note that the contract didn't expose `a`, `b`, or `c` as `public`. The variables aren't decorated with any visibility modifier at all. They could even be marked `private`. None of that changes what `eth_getStorageAt` returns. The data is in storage, the storage is on chain, the chain is public.

## Dynamic arrays

Fixed-size types fit in a known number of slots, so the compiler assigns them positions at compile time. Dynamic types like `uint256[]` and `mapping(K => V)` can grow at runtime, so the compiler can't know in advance how many slots they'll need. The Solidity spec handles this by giving each dynamic type a main slot at the usual declaration-order position and then placing the actual contents at slots derived through hashing.

Take this contract:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Sample {
    uint256 a = 123;
    uint256[] arr;

    constructor() {
        arr.push(10);
        arr.push(20);
    }
}
```

`a` takes slot 0. The dynamic array `arr` gets slot 1 as its main slot. But the main slot doesn't hold the array elements. It holds only the array length. The elements live somewhere else entirely.

For a dynamic array at main slot `p`, the elements are stored starting at slot `keccak256(p)`. The first element is at `keccak256(p)`, the second at `keccak256(p) + 1`, the i-th at `keccak256(p) + i`. The keccak256 output is a 256-bit number, so the elements land at some unpredictable position in the slot array, typically nowhere near the other state variables.

<svg role="img" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Dynamic array storage: main slot holds length, elements at keccak256(p) + i</title><desc>For array arr at main slot 1, the slot only stores length = 2. Its elements sit far away in slot space, starting at keccak256(1) for arr[0] and keccak256(1) + 1 for arr[1], following the general rule that element i lives at keccak256(p) + i.</desc>
  <defs>
    <marker id="arrSL2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Dynamic array: arr declared at main slot 1</text>
  <text x="40" y="86" font-family="monospace" font-size="11" fill="#000000">slot 1</text>
  <rect x="40" y="92" width="360" height="46" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="220" y="114" text-anchor="middle" font-family="monospace" font-size="12">length = 2</text>
  <text x="220" y="130" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">main slot stores only length</text>
  <line x1="220" y1="138" x2="220" y2="218" stroke="#ed4937" stroke-width="2" marker-end="url(#arrSL2)"/>
  <text x="232" y="184" font-family="monospace" font-size="10" fill="#ed4937">keccak256(1)</text>
  <line x1="40" y1="170" x2="180" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="260" y1="170" x2="400" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="410" y="174" font-family="monospace" font-size="9" fill="#565653" font-style="italic">far away in slot space</text>
  <text x="40" y="234" font-family="monospace" font-size="10" fill="#000000">keccak256(1)</text>
  <rect x="40" y="240" width="360" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="220" y="266" text-anchor="middle" font-family="monospace" font-size="12">arr[0] = 10</text>
  <text x="40" y="298" font-family="monospace" font-size="10" fill="#000000">keccak256(1) + 1</text>
  <rect x="40" y="304" width="360" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="220" y="330" text-anchor="middle" font-family="monospace" font-size="12">arr[1] = 20</text>
  <text x="40" y="362" font-family="monospace" font-size="10" fill="#000000">keccak256(1) + 2</text>
  <rect x="40" y="368" width="360" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="220" y="394" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">would hold arr[2]</text>
  <rect x="440" y="240" width="240" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="560" y="266" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">For arr at main slot p:</text>
  <line x1="456" y1="278" x2="664" y2="278" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="560" y="304" text-anchor="middle" font-family="monospace" font-size="10">main slot holds length</text>
  <text x="560" y="334" text-anchor="middle" font-family="monospace" font-size="10">element i lives at slot</text>
  <text x="560" y="358" text-anchor="middle" font-family="monospace" font-size="12" fill="#ed4937" font-weight="bold">keccak256(p) + i</text>
  <text x="560" y="382" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">(p padded to 32 bytes)</text>
  <text x="360" y="450" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">The length lives at the main slot. Elements live at hash-derived positions, far from neighbouring data.</text>
</svg>

Reading this out from a test:

```typescript
import { keccak256, pad, toHex } from "viem";

// the main slot just holds length
const main = await publicClient.getStorageAt({
  address: sample.address,
  slot: 1n,
});
// main = 0x...02

// derive where the elements start
const baseSlot = keccak256(pad(toHex(1n)));
const first = await publicClient.getStorageAt({
  address: sample.address,
  slot: baseSlot,
});
// first = 0x...0a (= 10)

const second = await publicClient.getStorageAt({
  address: sample.address,
  slot: toHex(BigInt(baseSlot) + 1n, { size: 32 }),
});
// second = 0x...14 (= 20)
```

The main slot tells you how long the array is. The hash gives you where to start reading. Anyone who knows the contract's address and the main slot number can read the whole array.

## Mappings

Mappings use a similar derivation but include the key. For a mapping declared at main slot `p`, the value at key `k` is stored at slot `keccak256(k . p)`, where `.` means concatenation. Both `k` and `p` are padded to 32 bytes before being concatenated, then the 64-byte result is hashed.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Sample {
    uint256 a = 123;
    uint256[] arr;
    mapping(address => uint256) balances;

    constructor() {
        arr.push(10);
        arr.push(20);
        balances[msg.sender] = 100;
    }
}
```

The mapping `balances` is the third state variable, so it gets slot 2 as its main slot. But the main slot stays at zero forever. Mappings don't track length, since every possible key already conceptually "exists" with the default value 0.

<svg role="img" viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Mapping storage layout: main slot 2 empty, values at keccak256(key . slot)</title><desc>The mapping balances is declared at main slot 2, but that slot always stays 0 since mappings track no length. Each value, like balances[keyA], lives at its own slot computed as keccak256(key . slot), so any key never set just reads back as 0.</desc>
  <defs>
    <marker id="arrSL3" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Mapping: balances declared at main slot 2</text>
  <text x="40" y="86" font-family="monospace" font-size="11" fill="#000000">slot 2</text>
  <rect x="40" y="92" width="360" height="46" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="220" y="114" text-anchor="middle" font-family="monospace" font-size="12" fill="#565653">0</text>
  <text x="220" y="130" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">main slot holds nothing, no length tracked</text>
  <line x1="40" y1="170" x2="400" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="130" y1="178" x2="130" y2="230" stroke="#ed4937" stroke-width="2" marker-end="url(#arrSL3)"/>
  <line x1="310" y1="178" x2="310" y2="230" stroke="#ed4937" stroke-width="2" marker-end="url(#arrSL3)"/>
  <text x="40" y="246" font-family="monospace" font-size="9" fill="#000000">keccak256(keyA . 2)</text>
  <rect x="40" y="252" width="180" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="130" y="278" text-anchor="middle" font-family="monospace" font-size="12">balances[keyA] = 100</text>
  <text x="220" y="246" font-family="monospace" font-size="9" fill="#000000">keccak256(keyB . 2)</text>
  <rect x="220" y="252" width="180" height="42" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="310" y="278" text-anchor="middle" font-family="monospace" font-size="12" fill="#565653">0  (never set)</text>
  <rect x="440" y="92" width="240" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="560" y="118" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">For mapping at slot p:</text>
  <line x1="456" y1="130" x2="664" y2="130" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="560" y="156" text-anchor="middle" font-family="monospace" font-size="10">main slot is unused</text>
  <text x="560" y="186" text-anchor="middle" font-family="monospace" font-size="10">value for key k at slot</text>
  <text x="560" y="210" text-anchor="middle" font-family="monospace" font-size="12" fill="#ed4937" font-weight="bold">keccak256(k . p)</text>
  <text x="560" y="234" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">(k and p each padded to 32 bytes)</text>
  <text x="40" y="338" font-family="monospace" font-size="10" fill="#000000" font-weight="bold">Three consequences:</text>
  <text x="40" y="360" font-family="monospace" font-size="9" fill="#000000">- a key never set still reads as 0, with no "exists" flag</text>
  <text x="40" y="380" font-family="monospace" font-size="9" fill="#000000">- no way to enumerate which keys have been written</text>
  <text x="40" y="400" font-family="monospace" font-size="9" fill="#000000">- functions cannot return a mapping, as there is no list to return</text>
  <text x="360" y="446" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Each value sits at its own hash-derived slot. The main slot stays empty forever.</text>
</svg>

Three consequences fall out of this design.

**Missing keys return zero by default.** When you read `balances[someAddress]` for an address that was never assigned to, the EVM computes the slot, reads it, finds zero, and returns it. There's no separate "key exists" check. The contract can't distinguish "I never set this" from "I set this to zero." If you need that distinction, store a separate boolean flag.

**Mappings can't be enumerated.** There is no list of which keys have been written. Iterating would require enumerating every possible key, which is 2^160 addresses or 2^256 uints. The values are spread across the storage space at hash-derived positions with no index. If you need to iterate, maintain a separate array of keys alongside the mapping and update both whenever you write.

**Mappings can't be returned from functions.** A return value has to be a finite blob of data. A mapping is logically a function from every possible key to a value. There is no sensible serialization. If you want to expose mapping contents externally, expose a getter for a specific key.

Reading a mapping value from a test:

```typescript
import { encodeAbiParameters, keccak256 } from "viem";

// derive slot for balances[someAddress]
const valueSlot = keccak256(
  encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }],
    [someAddress, 2n]
  )
);
const balance = await publicClient.getStorageAt({
  address: sample.address,
  slot: valueSlot,
});
// balance = 0x...64 (= 100)
```

`encodeAbiParameters` here takes care of padding the address to 32 bytes and the slot number to 32 bytes, then concatenating them. `keccak256` hashes the 64-byte result. The output is the slot where Solidity stores the value.

## Nested types compose

The same rules compose. A `mapping(address => uint256[])` stores the dynamic array at the slot derived from the address key, and that array's elements live at further slots derived from THAT slot. A `mapping(address => mapping(uint256 => bool))` derives a slot from the outer key, then derives again from the inner key.

Each level of dynamic indirection is one more `keccak256` step. The chain is deterministic. Anyone holding the keys can compute the final slot and read it.

## "Private" doesn't mean private

The `private` keyword in Solidity controls who can reference the variable in source code. A `private uint256 secret` cannot be referenced by name from a contract that inherits yours. The Solidity compiler enforces this at compile time.

Storage doesn't know any of that. Storage is a flat array of bytes that the EVM persists between transactions. There is no access control at the storage level, and there couldn't be. As the earlier section showed, every node stores every slot, and any client can read any of them via `eth_getStorageAt`. The `private` keyword is a Solidity visibility modifier. It is not a security feature.

The common mistake looks like this:

```solidity
// Solidity 0.8.24, Ethereum mainnet
// DO NOT USE — this is the bug being demonstrated
contract VulnerableLock {
    address private owner;
    uint256 private secretCode;

    constructor(uint256 _secretCode) {
        owner = msg.sender;
        secretCode = _secretCode;
    }

    function unlock(uint256 attempt) external {
        require(attempt == secretCode, "wrong code");
        // do something privileged
    }
}
```

The deployer believes `secretCode` is hidden because it's `private`. It isn't. Anyone watching the deployment transaction can already see the constructor argument in calldata. After deployment, anyone can read `secretCode` straight off the chain:

```
cast storage <lock_address> 1 --rpc-url <node_url>
# 0x0000000000000000000000000000000000000000000000000000000000000539
# that's the secret in hex (0x539 = 1337)
```

One JSON-RPC call. No special access. No bypass. The variable was always public. The keyword `private` only meant "can't be referenced by name from another Solidity contract."

This is a real, recurring source of audit findings. Sealed RNG seeds, commit values, off-chain authentication codes, internal pricing data, partial private keys split across slots: all have been stored as `private` state variables and read straight off the chain.

The actual options for keeping a value secret on chain are limited. The value can live off chain entirely, with the contract verifying a hash or signature from an off-chain source. You can use commit-reveal: store `keccak256(value, salt)` during a commit phase, then have the user reveal `value` and `salt` later. The commit is on chain but the preimage stays hidden until reveal. For richer guarantees, cryptographic schemes like zero-knowledge proofs let a contract verify properties of a value without ever seeing the value itself.

There is no fourth option called "make it private." Storage is public.
