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

> Every iteration of a loop costs gas, and one transaction cannot use more gas than a block holds, so a loop over data that users can grow eventually stops working. `keccak256` hashes bytes, so values have to be encoded into bytes first, and one of the two encodings lets different inputs produce the same hash.

## A loop pays gas on every iteration

Solidity's `for`, `while`, and `do-while` loops, with `break` and `continue`, work the way you'd expect from C, Java, or JavaScript. What is Solidity-specific is the cost. Every operation inside a loop costs gas. Reading from storage costs around 2,100 gas the first time and 100 gas thereafter in the same transaction. Writing to storage costs 22,100 gas for a fresh slot and 5,000 gas to update an existing one. A loop that reads or writes storage on every iteration multiplies these costs by the number of iterations.

## A growing array pushes the loop past the block gas limit

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
            (bool ok, ) = recipients[i].call{value: amountEach}("");
            require(ok, "send failed");
        }
    }
}
```

This contract looks fine on a small scale. A few accounts register, someone calls `distribute()`, and everyone gets their share.

But `recipients` can grow without bound, and nothing stops one address from registering again and again. Each registration adds one storage slot, which costs the attacker about 23,000 gas. Each call to `distribute` then has to iterate over every entry and make an external ETH transfer to each one, which costs around 9,500 gas per entry. 30 million gas pays for about 3,100 such transfers, so once the array is longer than that, `distribute` exceeds the block gas limit and reverts every time. The attacker gets there with about 71 million gas of registrations, spread over three transactions. From then on nobody can pay the recipients through this contract. Every call to `distribute` reverts, and the ETH sent with it goes back to the caller. This is called a denial-of-service attack via unbounded loops.

The same loop can be blocked without a long array. The `require` after each transfer reverts on failure, so one recipient contract that rejects ETH reverts the whole distribution. The [reentrancy and denial-of-service lesson](/courses/development-on-ethereum/token-security-and-evm-internals/reentrancy-and-denial-of-service) covers that attack.

## Three ways to bound the work, and who does it in each

Never write a function that iterates over data of unbounded size in a single transaction. Three patterns let you avoid this, and each one shifts the work somewhere different.

**Pagination** spreads the work across multiple transactions. Add `start` and `count` parameters, so the function processes a slice of the data per call. The contract still iterates, but each call is bounded by `count` instead of by `recipients.length`. The caller sends as many transactions as it takes to cover the array and pays the gas for each. For a payout this works only if the share per recipient is fixed before the first call and the contract stores how far the previous call got, otherwise a slice can be paid twice or at a different rate.

**Pull over push** moves the work to the recipients. Instead of the contract pushing tokens or ETH to many recipients, let each recipient pull their own share. `distribute` has no loop: it adds each recipient's share of the payment, `msg.value / recipientCount`, to one running total. Each recipient's record stores the value of that total at their last claim (at registration, its value at that moment), and `claim()` pays the difference and moves the stored value up to the total:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract PullDistribution {
    uint256 public recipientCount;
    uint256 public totalPerRecipient;
    mapping(address => bool) public registered;
    mapping(address => uint256) public paidUpTo;

    function register() external {
        require(!registered[msg.sender], "already registered");
        registered[msg.sender] = true;
        paidUpTo[msg.sender] = totalPerRecipient;
        recipientCount++;
    }

    function distribute() external payable {
        totalPerRecipient += msg.value / recipientCount;
    }

    function claim() external {
        require(registered[msg.sender], "not registered");
        uint256 owed = totalPerRecipient - paidUpTo[msg.sender];
        paidUpTo[msg.sender] = totalPerRecipient;
        (bool ok, ) = msg.sender.call{value: owed}("");
        require(ok, "send failed");
    }
}
```

Say Alice, Bob and Carol are registered and someone distributes 3 ETH, so the total goes from 0 to 1 ETH per recipient. Then Dave registers, and his record starts at 1 ETH. The next 4 ETH moves the total to 2 ETH. Alice, Bob and Carol each get 2 ETH in total and Dave gets 1, whatever order they claim in and whether or not they claimed in between.

`register` accepts each address once. Without that check, an address that registered twice would be counted twice in `recipientCount`, but its one record would let it claim only one share, and the other share would stay in the contract for good.

Each recipient pays the gas for their own claim, and a share that nobody claims stays in the contract. The [reentrancy and denial-of-service lesson](/courses/development-on-ethereum/token-security-and-evm-internals/reentrancy-and-denial-of-service) uses the same pattern for refunds.

**Off-chain iteration** moves the work off the chain entirely. Compute the result off-chain, submit it on-chain as a single transaction. This is how Merkle-proof airdrops work: the contract verifies one proof per transaction, which is bounded. The lesson on [off-chain computation and on-chain verification](/courses/development-on-ethereum/defi-tasks-and-patterns/off-chain-computation-on-chain-verification) covers this pattern.

For every loop you write, ask who can increase the number of iterations and whether anything bounds it. If any user can increase it and nothing bounds it, use one of the three patterns.

## `keccak256` turns bytes into a `bytes32`

Solidity has one hash function you'll use constantly: `keccak256`. It takes a `bytes` value of any length and returns a `bytes32`, the hash of the input. The [hashing lesson](/courses/blockchain-basics/cryptography/hashing) covers what a hash function guarantees.

```solidity
bytes32 h = keccak256(abi.encode("hello"));
```

`keccak256` is the same algorithm as SHA-3 in its design, though with a slightly different parameter that makes it incompatible with the NIST SHA-3 standard. Ethereum uses keccak256 throughout: the address of an externally owned account is derived from keccak256 of its public key, every function selector is the first 4 bytes of keccak256 of the function signature, an event's signature topic is keccak256 of the event signature, and every storage slot in a mapping is derived from keccak256.

## `abi.encode` pads every value, `abi.encodePacked` does not

You can hash any byte sequence, so the first step is to turn your Solidity values into bytes. Solidity has two functions for this: `abi.encode` and `abi.encodePacked`.

```solidity
bytes memory encoded = abi.encode("hello", uint256(42), address(this));
bytes32 h = keccak256(encoded);
```

`abi.encode` produces standard ABI-encoded bytes: every value padded to 32 bytes, dynamic types prefixed with offset and length. This is the same encoding the EVM uses for function calls and return values.

`abi.encodePacked` produces the same bytes but without the padding. Each value takes only as many bytes as it actually needs. Strings and bytes are concatenated raw.

```solidity
bytes memory padded = abi.encode("hello");        // 96 bytes
bytes memory packed = abi.encodePacked("hello");  // 5 bytes
```

`encodePacked` produces much shorter output, which means cheaper hashing. For single-argument hashing, this is fine and is the more common idiom.

## `encodePacked` lets two different inputs produce the same bytes

`encodePacked` doesn't insert any delimiter or length prefix between adjacent dynamic values, so two distinct sets of inputs can produce identical encoded bytes.

```solidity
bytes32 a = keccak256(abi.encodePacked("hello", "world"));
bytes32 b = keccak256(abi.encodePacked("hellow", "orld"));
// a == b
```

Both inputs produce the same byte sequence `helloworld`, so they hash to the same value.

If your contract uses `keccak256(abi.encodePacked(...))` as an identifier or as part of a signature scheme, an attacker who can choose the inputs may be able to construct two different argument sets that hash to the same value.

When hashing multiple dynamic-type values like strings, bytes, or dynamic arrays, always use `abi.encode` rather than `abi.encodePacked`. The padding `encode` adds removes the collision risk because each value gets a length prefix.

When hashing only static-type values like uint, address, or bytes32, `abi.encodePacked` is safe because static types have fixed sizes that cannot be reinterpreted as different boundaries.

When hashing a single value of any kind, either form works, but `encodePacked` is cheaper.

Later lessons hash encoded values for three purposes: to commit to a value without revealing it ([front-running and MEV](/courses/development-on-ethereum/token-security-and-evm-internals/front-running-and-mev)), to verify a signature ([gasless approvals](/courses/development-on-ethereum/advanced-defi/gasless-approvals)), and to find the storage slot of a mapping entry ([storage layout](/courses/development-on-ethereum/token-security-and-evm-internals/storage-layout)).

## A function selector is the first 4 bytes of a hash

Every external function in Solidity is identified by a 4-byte selector. The selector is the first 4 bytes of the keccak256 hash of the function signature:

```solidity
bytes4 selector = bytes4(keccak256("transfer(address,uint256)"));
// selector == 0xa9059cbb, the canonical ERC-20 transfer selector
```

The function signature is the function name followed by parenthesized argument types, no spaces, no return type. When a transaction calls a function, the first 4 bytes of the calldata are the selector. The contract uses the selector to dispatch to the right function.

Two functions with the same signature in different contracts produce the same selector. ERC-20's `transfer(address,uint256)` is `0xa9059cbb` on every ERC-20 token, which is what lets standard wallets call any ERC-20 without per-token configuration.
