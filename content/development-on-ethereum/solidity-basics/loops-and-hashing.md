---
id: 139
title: Loops and hashing
type: lecture
order: 12
faq:
  - question: Why does my loop run out of gas once the array grows?
    answer: >-
      The block gas limit, around 30 million, caps a single transaction, and storage
      dominates a loop at 22,100 gas per fresh slot write and 5,000 per update. An array
      anyone can extend eventually needs more gas than a block holds, so the call reverts
      every time and the ETH inside is stuck. Paginate, let recipients pull their own funds,
      or move the work off chain.
  - question: abi.encode or abi.encodePacked for keccak256 hashing?
    answer: >-
      abi.encode whenever two or more dynamic values go in. encodePacked drops the
      separators between them, so "hello" plus "world" and "hellow" plus "orld" both encode
      to helloworld and hash the same. encodePacked is safe for a single value, or for
      fixed-size types like uint256 and address.
  - question: Why is the ERC-20 transfer selector always 0xa9059cbb?
    answer: >-
      It is the first 4 bytes of keccak256 of "transfer(address,uint256)". A selector hashes
      the function name plus parenthesized argument types with no spaces, so the same
      signature yields the same 4 bytes in every contract.
---

> Three language features that show up across nearly every Solidity contract. Loops iterate over data and run code repeatedly, with a constraint that doesn't exist outside Solidity: every iteration costs gas, and the total gas available in a transaction is bounded by the block. Data locations control where values live during execution, which determines what they cost and whether changes to them persist. Hashing produces a fixed-length hash of arbitrary data, and `keccak256` is the primary one used for storage slot derivation, function selectors, event topics, commitment schemes, and signature verification. All three are simple in their basic form and trickier than they look in production.

## Loops in Solidity

Solidity has three loop forms, all of which work the way you'd expect from C, Java, or JavaScript.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Loops {
    function forLoop(uint256 n) external pure returns (uint256 sum) {
        for (uint256 i = 0; i < n; i++) {
            sum += i;
        }
    }

    function whileLoop(uint256 n) external pure returns (uint256 sum) {
        uint256 i = 0;
        while (i < n) {
            sum += i;
            i++;
        }
    }
}
```

`break` exits the current loop. `continue` skips to the next iteration. There's also `do-while` which works identically to other languages. Nothing here is Solidity-specific.

What is Solidity-specific is the cost. Every operation inside a loop costs gas. Reading from storage costs around 2,100 gas the first time and 100 gas thereafter in the same transaction. Writing to storage costs 22,100 gas for a fresh slot and 5,000 gas to update an existing one. A loop that reads or writes storage on every iteration multiplies these costs by the number of iterations.

## The block gas limit

Every Ethereum block has a maximum total amount of gas that all transactions in that block combined can consume. The current block gas limit is around 30 million gas. Individual transactions can use anywhere from a small fixed amount, like the 21,000 gas a simple ETH transfer costs, up to the full block limit if no other transactions share the block.

The block gas limit creates a hard ceiling on what a single transaction can do. If your function tries to execute more work than fits in 30 million gas, the transaction reverts with an out-of-gas error. The state changes the function made up to that point are rolled back, and the caller still pays for the gas it consumed.

This matters most for loops over storage arrays whose length the contract doesn't control.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract BadDistribution {
    address[] public recipients;

    function register() external {
        recipients.push(msg.sender);
    }

    function distribute() external payable {
        uint256 amountEach = msg.value / recipients.length;
        for (uint256 i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(amountEach);
        }
    }
}
```

This contract looks fine on a small scale. A few accounts register, someone calls `distribute()`, and everyone gets their share.

But `recipients` can grow without bound. An attacker can register thousands of addresses at very low cost. Each registration adds one storage slot. Each call to `distribute` then has to iterate over every address and make an external ETH transfer to each one, which costs around 9,000 gas per transfer. At a few thousand recipients, the distribute function exceeds the block gas limit and reverts every time. The contract is bricked. The ETH inside it can never be distributed, because the only function that distributes it cannot complete.

This is called a denial-of-service attack via unbounded loops, and it's one of the most common production bugs in early Solidity code.

## Safe iteration patterns

Never write a function that iterates over data of unbounded size in a single transaction. Three patterns let you avoid this.

**Pagination.** Add `start` and `count` parameters, as in the code below. The function processes a slice of the data per call. The caller paginates by submitting multiple transactions.

```solidity
function distributeBatch(uint256 start, uint256 count) external payable {
    uint256 end = start + count;
    if (end > recipients.length) end = recipients.length;
    uint256 amountEach = msg.value / count;
    for (uint256 i = start; i < end; i++) {
        payable(recipients[i]).transfer(amountEach);
    }
}
```

The contract still iterates, but each call is bounded by `count` instead of by `recipients.length`. The caller chunks the work across many transactions.

**Pull over push.** Instead of the contract pushing tokens or ETH to many recipients, let each recipient pull their own share. The contract records what each recipient is owed, and `claim()` is a fixed-size operation with no loop. The contract works correctly no matter how many recipients exist.

**Off-chain iteration.** Compute the result off-chain, submit it on-chain as a single transaction. This is how Merkle-proof airdrops work: the contract verifies one proof per transaction, which is bounded.

Each pattern shifts the work somewhere different. Pagination spreads it across multiple transactions, pull-over-push moves it to the recipients, off-chain iteration moves it off the chain entirely. All three avoid the block-gas-limit pitfall.

## Data locations: storage, memory, calldata

Solidity has three places where values can live during execution. You've already seen all three in earlier lessons, written as data-location keywords on function parameters. Now we'll be explicit about what they mean.

**Storage** is the contract's permanent state. Every state variable lives in storage. Anything written to storage persists across transactions. Storage is expensive. The same per-slot read and write costs from the loops section apply: a fresh write costs far more than an update, and the first read of a slot costs more than later reads in the same transaction.

**Memory** is per-transaction scratch space. It's allocated when a function starts, used during execution, and discarded when the transaction ends. Memory is cheap: a typical read or write costs a few gas, with memory expansion costing more as you allocate larger regions.

**Calldata** is the raw inbound transaction data. When you call an external function, the arguments arrive as a sequence of bytes in calldata. Calldata is read-only and even cheaper than memory because the bytes are already there. You can't modify calldata, only read from it.

For value types like `uint256`, `bool`, and `address`, the location is implicit and you don't write it anywhere. State variables live in storage automatically. Local variables of value types live on the stack rather than in memory, and the compiler manages them for you. Function parameters of value types are read from calldata.

For reference types like arrays, structs, strings, and bytes, you must specify the location explicitly when they appear as function parameters or local variables.

```solidity
contract Users {
    struct User {
        uint256 age;
        string name;
    }

    mapping(address => User) public users;

    // calldata: the caller's bytes are read directly from the transaction
    function setName(string calldata newName) external {
        users[msg.sender].name = newName;
    }

    // memory: a copy is made; the function can mutate it freely
    function buildGreeting(string memory prefix) external view returns (string memory) {
        return string.concat(prefix, users[msg.sender].name);
    }
}
```

The choice between `calldata` and `memory` for an input parameter has a real cost difference. `calldata` parameters are read in place from the transaction bytes, no copy needed. `memory` parameters require copying the calldata into memory first. For any input you only need to read, prefer `calldata`. Use `memory` when you need to modify the value or pass it to another function that requires memory.

## The aliasing trap

Inside a function, when you assign a struct or array from storage to a local variable, the location of that local variable determines whether you've made a reference or a copy.

```solidity
function increaseAge(address who) external {
    User storage u = users[who];   // u is a REFERENCE to storage
    u.age += 1;                    // modifies users[who].age directly
}

function broken(address who) external {
    User memory u = users[who];    // u is a COPY in memory
    u.age += 1;                    // modifies the copy; storage unchanged
}
```

Both functions compile and run. The first one increases the user's age. The second one increases a local copy and throws it away when the function ends. This is one of the most common bugs in Solidity code written by developers coming from languages where assignment is always a reference.

The rule is simple. When you want to read AND write a complex value in storage, declare your local as `storage`. When you want a local working copy that doesn't affect the contract's state, declare it as `memory`. The compiler will tell you if you pick the wrong one in cases it can detect, but plenty of cases compile silently and behave incorrectly.

## `keccak256` and hashing

Solidity has one hash function you'll use constantly: `keccak256`. It takes a `bytes` value of any length and returns a `bytes32`. The bytes32 is the cryptographic hash of the input.

```solidity
bytes32 h = keccak256(abi.encode("hello"));
```

`keccak256` is the same algorithm as SHA-3 in its design, though with a slightly different parameter that makes it incompatible with the NIST SHA-3 standard. Ethereum uses keccak256 throughout: every address is derived from keccak256 of a public key, every function selector is the first 4 bytes of keccak256 of the function signature, an event's signature topic is keccak256 of the event signature, and every storage slot in a mapping is derived from keccak256.

It's deterministic, collision-resistant in practice, and irreversible. Given the same input, it always produces the same output. Given the output, finding any input that produces it would require enumerating an effectively infinite search space.

## What you can hash

You can hash any byte sequence. The trick is getting your Solidity values into a byte sequence in the first place. Solidity has two functions for this: `abi.encode` and `abi.encodePacked`.

```solidity
bytes memory encoded = abi.encode("hello", uint256(42), address(this));
bytes32 h = keccak256(encoded);
```

Note that the result of `abi.encode` is `bytes memory`. The encoding is built in a fresh memory region. You can't encode into storage directly, and you don't need to. The hash is what gets stored or compared.

`abi.encode` produces standard ABI-encoded bytes: every value padded to 32 bytes, dynamic types prefixed with offset and length. This is the same encoding the EVM uses for function calls and return values.

`abi.encodePacked` produces the same bytes but without the padding. Each value takes only as many bytes as it actually needs. Strings and bytes are concatenated raw.

```solidity
bytes memory padded = abi.encode("hello");        // 96 bytes
bytes memory packed = abi.encodePacked("hello");  // 5 bytes
```

`encodePacked` produces much shorter output, which means cheaper hashing. For single-argument hashing, this is fine and is the more common idiom.

For multi-argument hashing, `encodePacked` has a trap.

## The `encodePacked` collision risk

Because `encodePacked` removes the separator between dynamic values, two distinct sets of inputs can produce identical encoded bytes.

```solidity
bytes32 a = keccak256(abi.encodePacked("hello", "world"));
bytes32 b = keccak256(abi.encodePacked("hellow", "orld"));
// a == b
```

Both inputs produce the same byte sequence `helloworld`, so they hash to the same value. This is a real collision rather than a cryptographic accident. It happens because `encodePacked` doesn't insert any delimiter or length prefix between adjacent dynamic values.

If your contract uses `keccak256(abi.encodePacked(...))` as an identifier or as part of a signature scheme, an attacker who can choose the inputs may be able to construct two different argument sets that hash to the same value. Real exploits have been published against contracts that used this pattern naively.

The rule: when hashing multiple dynamic-type values like strings, bytes, or dynamic arrays, always use `abi.encode` rather than `abi.encodePacked`. The padding `encode` adds removes the collision risk because each value gets a length prefix.

When hashing only static-type values like uint, address, or bytes32, `abi.encodePacked` is safe because static types have fixed sizes that cannot be reinterpreted as different boundaries.

When hashing a single value of any kind, either form works, but `encodePacked` is cheaper.

## Common hashing patterns

A few places `keccak256` shows up in real contracts.

**Identifier generation.** Building a unique ID from a set of inputs.

```solidity
bytes32 orderId = keccak256(abi.encode(msg.sender, tokenAddress, amount, nonce));
```

The order ID is deterministic from the inputs. Two callers with the same inputs and different nonces get different IDs.

**Commitment schemes.** Committing to a value without revealing it.

```solidity
// Phase 1: commit
bytes32 commitment = keccak256(abi.encode(secret, salt));
commitments[msg.sender] = commitment;

// Phase 2: reveal
require(keccak256(abi.encode(revealedSecret, revealedSalt)) == commitments[msg.sender]);
```

The committer publishes the hash early, then later reveals the inputs. Anyone can verify that the revealed inputs match the commitment, but no one can determine the inputs from the commitment alone. The salt prevents brute-force attacks against the secret space.

**Signature verification.** A signer hashes a message off-chain and signs it. The contract reconstructs the same hash and uses `ecrecover` to recover the signing address. If the recovered address matches the expected signer, the signature is valid. This pattern underlies EIP-2612 `permit`, meta-transactions, and most signature-based authorization in DeFi.

**Storage slot derivation.** Mapping slots are computed as `keccak256(abi.encode(key, slotIndex))`. The compiler handles this automatically. You'll only invoke `keccak256` directly for mappings if you're writing assembly or computing slots for proxy storage patterns.

## Function selectors

Every external function in Solidity is identified by a 4-byte selector. The selector is the first 4 bytes of the keccak256 hash of the function signature:

```solidity
bytes4 selector = bytes4(keccak256("transfer(address,uint256)"));
// selector == 0xa9059cbb, the canonical ERC-20 transfer selector
```

The function signature is the function name followed by parenthesized argument types, no spaces, no return type. When a transaction calls a function, the first 4 bytes of the calldata are the selector. The contract uses the selector to dispatch to the right function.

This is why interface functions are commonly referred to by their `bytes4` selectors, and why every interface function has a deterministic identifier on chain. Two functions with the same signature in different contracts produce the same selector. ERC-20's `transfer(address,uint256)` is `0xa9059cbb` on every ERC-20 token, which is what lets standard wallets call any ERC-20 without per-token configuration.
