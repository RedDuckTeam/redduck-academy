---
id: 148
title: Off-chain computation, on-chain verification
type: lecture
order: 3
faq:
  - question: How does an airdrop for 10,000 addresses fit in one storage slot?
    answer: >-
      It stores a Merkle root, 32 bytes. Writing all 10,000 addresses would cost about 220
      million gas, near 6.6 ETH at 30 gwei. A claim carries the address, the amount and about
      14 sibling hashes.
  - question: If the user runs the computation off-chain, what stops them lying?
    answer: >-
      Nothing, and it gains them nothing. A claim that fails the on-chain check reverts. The
      real risk is a wrong verifier, so reach for OpenZeppelin's MerkleProof and ECDSA.
  - question: Is it worth verifying a sorted array this way?
    answer: >-
      No. Confirming order still takes a full pass, so checking costs what computing costs.
      Compare a square root, where two multiplications replace 20 to 30 Newton iterations,
      about 50 gas against a few thousand.
---

> Every contract you've written so far does its own work: it receives a call, computes a result inside the EVM, and stores or returns the answer. That breaks when the work is expensive, scales with attacker-controlled inputs, or needs data the contract doesn't have. The way around it is to do the work off-chain and have the contract check the answer, which is usually much cheaper than producing it.

## After a withdrawal the voting contract has to find a new leader

In the [voting task](/courses/development-on-ethereum/defi-tasks-and-patterns/voting-on-token-price), voters can propose any `uint256` as a price, and tokens stay locked until voting ends. The weight behind a price only grows, so the contract can keep track of the leading price as votes come in: each vote adds weight to one price, and one comparison with the current leader is enough.

The [next task](/courses/development-on-ethereum/defi-tasks-and-patterns/voting-on-token-price-with-withdrawal) lets voters withdraw during voting. When the leader loses weight, another price may now be ahead, and the contract does not know which one. The obvious fix is to loop over every price that has votes. The number of prices is unbounded and anyone can add to it, so this is the loop from the [loops lesson](/courses/development-on-ethereum/solidity-basics/loops-and-hashing): an attacker proposes prices until the function exceeds the block gas limit and reverts for everyone.

## On-chain work stops being an option in three cases

First, when the work is unbounded, as in the voting contract.

Second, when the work is large but bounded. Iterating over 10,000 known elements doesn't risk DoS but costs hundreds of thousands of gas. Real users won't pay that for a single transaction.

Third, when the work requires data the contract doesn't have. The contract knows nothing outside its own storage and the call's arguments. If you need to know what's in a database, on another chain, or in a file too large to fit in calldata, the contract is blind.

In each case the work has to happen somewhere else, and the contract has to be convinced the work was done correctly.

## The contract checks an answer it did not compute

Off-chain computation costs the chain nothing. A JavaScript program in a browser can sort a million elements in milliseconds, and a backend can query a database or compute hashes. The chain is bad at long computation but good at checking specific claims: hashing, signature recovery, arithmetic, and storage lookups are each cheap on their own.

This suggests a split: do the hard work off-chain, then submit the result to the chain along with whatever the chain needs to verify the work was done correctly.

- Someone does the expensive work off-chain and produces a **value** for the contract to use, and possibly some **proof** that helps the contract verify the value.
- The caller submits both in a single contract call.
- The contract performs **verification logic** that's much cheaper than the original computation.
- If verification succeeds, the contract uses the value. If it fails, the contract reverts.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Off-chain user work submitted to a contract for on-chain verification</title><desc>The user does expensive computation off-chain with unbounded resources and submits a value plus proof to the contract. The contract runs cheap, bounded on-chain verification: if it passes, the contract uses the value and changes state; if it fails, the contract reverts with no state changes and the attacker burns gas.</desc>
  <!-- User box, top -->
  <rect x="40" y="30" width="280" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="55" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">USER (off-chain)</text>
  <text x="180" y="80" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">does the expensive work,</text>
  <text x="180" y="98" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">produces value + proof</text>
  <text x="180" y="118" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">unbounded resources, free</text>

<!-- Arrow user → contract -->
  <line x1="180" y1="130" x2="180" y2="170" stroke="#565653" stroke-width="1.5"/>
  <polygon points="180,178 175,168 185,168" fill="#565653"/>
  <text x="195" y="158" font-family="monospace" font-size="11" fill="#000000">submits (value, proof)</text>

<!-- Contract verification box, middle -->
  <rect x="40" y="180" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="205" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">CONTRACT (on-chain)</text>
  <text x="360" y="228" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">runs verification logic on the claim</text>
  <text x="360" y="246" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">bounded gas, cheap O(1) or O(log n)</text>

<!-- Two arrows from contract -->
  <line x1="240" y1="260" x2="180" y2="300" stroke="#565653" stroke-width="1.5"/>
  <polygon points="178,308 174,297 184,295" fill="#565653"/>
  <text x="120" y="290" font-family="monospace" font-size="11" fill="#000000">verification</text>
  <text x="120" y="306" font-family="monospace" font-size="11" fill="#000000">PASSES</text>

<line x1="480" y1="260" x2="540" y2="300" stroke="#565653" stroke-width="1.5"/>
  <polygon points="542,308 536,295 546,297" fill="#565653"/>
  <text x="560" y="290" font-family="monospace" font-size="11" fill="#000000">verification</text>
  <text x="560" y="306" font-family="monospace" font-size="11" fill="#000000">FAILS</text>

<!-- Outcome boxes, bottom -->
  <rect x="60" y="310" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="332" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">contract uses the value</text>
  <text x="180" y="350" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">state changes, event emits</text>

<rect x="420" y="310" width="240" height="50" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="540" y="332" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">contract reverts</text>
  <text x="540" y="350" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">no state changes, attacker burns gas</text>
</svg>

The contract verifies the value against one of two things: the problem itself, or something a trusted party stored in the contract in advance. The examples below show both.

A caller can submit any claim they want. The verification logic is the contract's own code, running deterministically on the chain, and the caller can only choose its inputs. If the claim doesn't pass, the transaction reverts, no state changes, and the caller has paid the gas for nothing.

## A sorted list: the caller finds the place, the contract checks two neighbors

Monaco, a prediction market on Solana, solves a problem of the same kind as the voting contract's. It keeps its order book, the list of open orders, sorted by price, and a new order has to go into the right place. A Solana transaction has a fixed compute budget where an Ethereum one has the block gas limit, so walking a long book one order at a time to find the place runs out of budget, as the loop over prices runs out of gas.

So Monaco lets the client find the place. The client reads the order book off-chain, where reading is free, and tells Monaco's program (Solana's word for a contract) "put my order after this one". The program checks only two orders: the one right before the new order and the one right after it. If the new order fits between them, the program accepts it. The check costs the same whether the book holds ten orders or ten thousand.

No trusted party prepared anything for this check. The two neighbors, which the program already stores, are enough to tell whether the position is right, so the program verifies the claim against the problem itself. The withdrawal task can use the same idea for the leader question: the caller says where a price belongs after its weight changed, and the contract checks that claim. How you store the prices is your design.

## A Merkle root: 10,000 claims checked against one stored hash

Suppose you want to airdrop tokens to 10,000 users. Storing 10,000 addresses on chain costs about 220 million gas just for the storage writes, since each new storage slot costs roughly 22,000 gas. At 30 gwei per gas, that's about 6.6 ETH spent on storage alone. It also does not fit in one transaction, because the block gas limit is around 30 million.

Instead, the project builds a [Merkle tree](/courses/blockchain-basics/cryptography/merkle-trees) of the 10,000 addresses and amounts off-chain. The tree's root is a single 32-byte hash, and the contract stores only the root. When a user wants to claim their airdrop, they prove they're in the tree by submitting their amount and the path of sibling hashes that connect their leaf to the root.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Airdrop {
    bytes32 public immutable merkleRoot;
    mapping(address => bool) public claimed;

    error InvalidProof();
    error AlreadyClaimed();

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {
        if (claimed[msg.sender]) revert AlreadyClaimed();

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));

        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 sibling = proof[i];
            if (computedHash < sibling) {
                computedHash = keccak256(abi.encodePacked(computedHash, sibling));
            } else {
                computedHash = keccak256(abi.encodePacked(sibling, computedHash));
            }
        }

        if (computedHash != merkleRoot) revert InvalidProof();

        claimed[msg.sender] = true;
        // ... transfer tokens to msg.sender ...
    }
}
```

The user submits their address via `msg.sender`, the amount they're claiming, and a proof array of around `log2(10000) ≈ 14` sibling hashes. The contract reconstructs the root from the leaf and the proof, then checks it matches the stored root. If the user is not in the tree, no proof exists that would lead back to the root. Whatever they submit will produce a hash that doesn't match, and the contract reverts.

The project did the hard work of building the tree off-chain. The information needed to support 10,000 eligible users fits in a single 32-byte storage slot. The contract does about 14 hashes per claim, and a keccak hash of two 32-byte values costs around 42 gas (30 plus 6 per word), so the hashing in one claim costs around 600 gas.

The claim also writes one new storage slot, `claimed[msg.sender]`, which costs the same 22,000 gas as storing an address would, so if all 10,000 users claim, the storage writes add up to the same 220 million gas. What changes is who pays and when: each user pays for their own slot, and only if they claim, while the project pays only to store the root.

Here the contract verifies against something stored in advance. It can tell that a claim is in the tree behind the root, and it takes the root itself on trust from whoever deployed the contract. You will build this contract in the [Merkle airdrop task](/courses/development-on-ethereum/defi-tasks-and-patterns/merkle-airdrop).

## A square root: two multiplications check what 20 to 30 iterations compute

Some Solidity contracts need to compute square roots: Uniswap V2 uses one when initializing a liquidity pool, AMMs use them for invariant calculations, and bonding curves use them for pricing.

Solidity doesn't have a native square root opcode. Computing `sqrt(n)` requires an iterative algorithm, typically Newton's method or a binary search. A good implementation takes around 20-30 iterations and costs a few thousand gas.

Instead, the caller can compute `r = floor(sqrt(n))` off-chain using whatever method they want, and call the contract with both `n` and `r`. The contract checks two things: that `r * r` is at most `n`, and that `(r+1) * (r+1)` is greater than `n`. If both hold, `r` is the integer square root of `n`.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract WithSqrt {
    error InvalidSqrt();

    function consumeSqrt(uint256 n, uint256 claimedRoot) external pure returns (uint256) {
        // Verify: claimedRoot is the integer square root of n
        // That means: claimedRoot * claimedRoot <= n < (claimedRoot + 1) * (claimedRoot + 1)
        uint256 lower = claimedRoot * claimedRoot;
        uint256 upper = (claimedRoot + 1) * (claimedRoot + 1);

        if (lower > n || n >= upper) revert InvalidSqrt();

        // claimedRoot is verified; use it
        return claimedRoot * 2;
    }
}
```

The verification is two multiplications and two comparisons, roughly 50 gas instead of a few thousand. This is a teaching example: the saving is small next to the airdrop's, but the whole check fits in a few lines, and it verifies the claim against the definition of a square root with nothing stored in advance. The same works for any operation where checking is much cheaper than computing, such as a modular inverse, a discrete logarithm, or a bounded factorization.

## A bug in the verifier is the real risk

The contract relies on the check and on nothing else, so the security model only works if the verification is correct. A buggy Merkle verification that accepts invalid proofs is a disaster. A buggy sqrt verification that accepts wrong roots silently corrupts whatever consumes the root.

Production protocols often use battle-tested verification libraries: OpenZeppelin's MerkleProof, OpenZeppelin's ECDSA, audited signature verifiers. Writing your own verification is a higher bar than writing application logic, because every edge case in the verifier is a potential exploit. When you can use a well-known verifier, do.

## Signatures, oracle data and ZK proofs use the same split

**Signatures and permits.** A user signs a message off-chain saying "I authorize transferring 100 tokens to Alice." The contract recovers the signer with `ecrecover`, one ECDSA recovery, and checks that it is the address it expects. EIP-2612 permit, Permit2, and meta-transactions all work this way, and the [gasless approvals lesson](/courses/development-on-ethereum/advanced-defi/gasless-approvals) covers permit.

**Oracle attestations.** An oracle signs a data point off-chain, and a user submits it. The contract verifies the signature against the oracle it trusts and uses the data.

**ZK proofs.** A prover computes a complex statement off-chain with a SNARK or STARK, producing a tiny proof. The contract verifies the proof in fixed-size constant work, regardless of how complex the underlying statement is. ZK rollups use this to compress thousands of transactions into a single chain proof. Optimistic rollups check only on demand: operators post claims about computation, and when a verifier challenges a claim, the chain runs a binary-search game to find the exact disputed step. Most of the time, no verification happens at all.

## Where the pattern stops paying

**When checking needs a pass over all the data.** Verifying that a whole array is sorted takes O(n) reads, so the loop is still on-chain and still grows with the array. The order book above avoids this because only one position is checked. The pattern pays when verification is asymptotically cheaper than computation, like the difference between O(log n) Merkle verification and O(n) iteration.

**When nobody keeps the off-chain data.** The airdrop contract holds the root and not the list. Producing a proof takes the whole tree, so the project has to keep it and give users their proofs for as long as claims are open. A user who cannot get a proof cannot claim.

**When the answer goes stale before the transaction lands.** The answer is computed at one moment and checked at a later one. In Monaco's order book, if another order lands first and changes the neighbors, the check fails and the client has to retry with a fresh position. A caller on Ethereum is in the same position, and pays gas for each failed attempt. A value the contract cannot check against its own state, such as a signed price, also needs a check of how old it is, which the [oracles lesson](/courses/development-on-ethereum/oracles/oracles-and-chainlink-price-feeds) covers under staleness.

For everything else, reach for this pattern. Whenever you see a loop that could exceed the block gas limit, or a computation that is too expensive on-chain, ask: can I move this work off-chain and verify the result instead? If you can, ask what the contract verifies the result against and who keeps the data it was computed from.
