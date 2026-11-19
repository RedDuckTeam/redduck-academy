---
id: 154
title: Storage layout
type: lecture
order: 8
faq:
  - question: Is a private variable in Solidity secret?
    answer: >-
      No. `private` only stops other Solidity code from referencing the variable by name.
      Every node stores every slot, and anyone can read one with `eth_getStorageAt` or
      `cast storage`.
  - question: Can reordering my state variables lower gas?
    answer: >-
      Often. Storage is 32-byte slots, and the compiler builds the layout in declaration order,
      packing adjacent variables into one slot when they fit. Two `uint128` values next to each
      other share a slot. Put a `uint256` between them and they need two.
  - question: Where do my dynamic array's elements live?
    answer: >-
      In its declared slot `p` you find only the length. Element `i` lives at
      `keccak256(p) + i`, far from your other variables.
  - question: How is a mapping's value slot computed?
    answer: >-
      As `keccak256(k . p)`, where `k` is the key and `p` the mapping's declared slot, each
      padded to 32 bytes before hashing. The declared slot itself stays zero forever, because
      a mapping tracks no length.
  - question: How do I keep a value secret on chain?
    answer: >-
      Keep it off chain and have the contract verify a hash or a signature. Commit-reveal
      stores `keccak256(value, salt)` and reveals `value` and `salt` later, so the preimage
      stays hidden until reveal. Zero-knowledge proofs let a contract check a property of a
      value it never sees.
---

> The compiler places state variables into 32-byte storage slots in declaration order, and puts the contents of arrays and mappings at slots derived by hashing. Anyone can compute a slot and read it, so marking a state variable `private` does not make it secret.

## Storage is an array of slots

The [mappings lesson](/courses/development-on-ethereum/solidity-basics/mappings) described storage as a flat array of 2^256 slots, 32 bytes each, all initialized to zero. State variables get assigned positions in this array when the contract is compiled, starting from slot 0 in declaration order.

Consider this contract:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Sample {
    uint256 a = 123;
    uint128 b = 10;
    uint128 c = 20;
}
```

The compiler walks the variables in order. `a` is 32 bytes wide, so it takes all of slot 0. Next is `b`, which is 16 bytes wide. It can't fit in slot 0, so `b` starts at slot 1 in the low 16 bytes. Next is `c`, also 16 bytes wide. The high 16 bytes of slot 1 are still free, so `c` fits there. `b` and `c` share slot 1.

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

The packing rule: adjacent state variables get packed into the same slot if their combined size fits in 32 bytes. The first variable in declaration order occupies the low bytes. Each subsequent packed variable occupies the next higher bytes upward.

Every storage slot you write costs gas, so the order of declaration decides how many slots you pay for. If you write `uint128 b; uint256 a; uint128 c;` instead, the compiler can't pack `b` and `c` together because `a` sits between them, and you end up using three slots instead of two. The [structs lesson](/courses/development-on-ethereum/solidity-basics/structs) counted the difference in gas.

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

Slot 1 reads as `0x...0014...000a`. Two values are visible inside the slot. The high 16 bytes hold `0x14`, which is 20 in decimal, the value of `c`. The low 16 bytes hold `0x0a`, which is 10 in decimal, the value of `b`. They share the slot as the diagram showed.

The contract didn't expose `a`, `b`, or `c` as `public`, and the read works anyway.

## A dynamic array keeps its length in its slot and its elements at a hash

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

`a` takes slot 0. The dynamic array `arr` gets slot 1 as its main slot, but the main slot holds only the array length.

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

Reading slot 1 of this contract returns `0x...02`, the length. Slot `keccak256(1)`, with the `1` padded to 32 bytes, returns `0x...0a`, which is 10, and the slot after it returns `0x...14`, which is 20. Anyone who knows the contract's address and the main slot number can read the whole array.

## A mapping value sits at the hash of its key and the main slot

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

For the deployer's address, the value sits at the slot `keccak256(deployer . 2)`, and reading that slot returns `0x...64`, which is 100. The [mappings lesson](/courses/development-on-ethereum/solidity-basics/mappings) covers what follows from this derivation: a key that was never written reads as zero, and a mapping can't be enumerated or returned from a function.

## Each level of nesting adds one hash

A `mapping(address => uint256[])` stores the dynamic array at the slot derived from the address key, and that array's elements live at further slots derived from that slot. A `mapping(address => mapping(uint256 => bool))` derives a slot from the outer key, then derives again from the inner key.

Each level of dynamic indirection is one more `keccak256` step. The derivation is deterministic, so anyone holding the keys can compute the final slot and read it.

## "Private" doesn't mean private

The `private` keyword in Solidity controls who can reference the variable in source code. A `private uint256 secret` cannot be referenced by name from a contract that inherits yours. The Solidity compiler enforces this at compile time.

Storage doesn't know any of that. There is no access control at the storage level, and there couldn't be, because every node stores every slot and any client can read any of them via `eth_getStorageAt`.

The common mistake looks like this:

```solidity
// Solidity 0.8.24, Ethereum mainnet
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

The deployer believes `secretCode` is hidden because it's `private`. But anyone watching the deployment transaction can already see the constructor argument in calldata, and after deployment anyone can read `secretCode` straight off the chain:

```
cast storage <lock_address> 1 --rpc-url <node_url>
# 0x0000000000000000000000000000000000000000000000000000000000000539
# that's the secret in hex (0x539 = 1337)
```

Sealed RNG seeds, commit values, off-chain authentication codes, internal pricing data, partial private keys split across slots: all have been stored as `private` state variables and read straight off the chain.

The actual options for keeping a value secret on chain are limited, and each has a cost:

- The value can live off chain entirely, with the contract verifying a hash or signature from an off-chain source. The contract then relies on that source to keep the value secret and to stay available.
- You can use commit-reveal: store `keccak256(value, salt)` during a commit phase, then have the user reveal `value` and `salt` later. The commit is on chain but the preimage stays hidden until reveal. This takes two transactions with a delay between them, as the [front-running lesson](/courses/development-on-ethereum/token-security-and-evm-internals/front-running-and-mev) showed, and from the reveal on the value is public.
- For richer guarantees, cryptographic schemes like zero-knowledge proofs let a contract verify properties of a value without ever seeing the value itself. The proof has to be computed off chain, and verifying it costs more gas than checking a signature (more in [off-chain computation, on-chain verification](/courses/development-on-ethereum/defi-tasks-and-patterns/off-chain-computation-on-chain-verification)).

## Inserting a variable moves every variable after it

A variable's slot follows from the declarations before it, so changing the declarations changes the layout. Insert a new `uint256` between `a` and `b` in the first `Sample`, and it takes slot 1, while `b` and `c` move to slot 2.

A freshly deployed contract is not affected, because its storage starts empty. The shift matters when new code runs on storage that an earlier version wrote. That code would read `b` and `c` from slot 2, which the old version never wrote, and would find the old `b` and `c` where it expects the new variable. An upgradeable contract is in this position, and the [next lesson](/courses/development-on-ethereum/token-security-and-evm-internals/upgradeable-contracts-and-proxies) covers it.
