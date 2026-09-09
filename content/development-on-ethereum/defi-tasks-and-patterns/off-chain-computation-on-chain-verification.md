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

> Every contract you've written so far does its own work. The contract receives a call, computes a result inside the EVM, and stores or returns the answer. That works as long as the work is cheap. The moment the work gets expensive, or scales with attacker-controlled inputs, or requires iteration over data of unknown size, the naive approach breaks. Gas costs become prohibitive. Loops become denial-of-service vectors. Operations that are routine off the chain become impossible on it. This lesson teaches you the most important pattern for working around this limit. You'll see it in airdrops, in gasless transactions, in proofs of identity, in rollups, in oracles, and in dozens of places you haven't met yet. Once you internalize it, problems that looked impossible become straightforward.

## The fundamental constraint

The EVM charges gas for every operation. A storage read costs around 2,100 gas the first time and 100 gas warm. An arithmetic operation costs a few gas. A keccak hash costs around 30 gas plus 6 per word. A loop iteration costs whatever the body costs, multiplied by the number of iterations.

This pricing is fine for short, deterministic computation. It becomes a problem in three situations.

First, when the work is unbounded. A loop over a dynamic array can run forever. If the array is attacker-controlled, an attacker can fill it until any function that iterates over it exceeds the block gas limit and reverts. The contract becomes unusable. This is denial-of-service through unbounded iteration, the same class of bug you saw in an earlier lesson.

Second, when the work is large but bounded. Iterating over 10,000 known elements doesn't risk DoS but costs hundreds of thousands of gas. Real users won't pay that for a single transaction.

Third, when the work requires data the contract doesn't have. The contract knows nothing outside its own storage and the call's arguments. If you need to know what's in a database, on another chain, or in a file too large to fit in calldata, the contract is blind.

In each case, doing the work on-chain is the wrong approach. The work has to happen somewhere else, and the contract has to be convinced the work was done correctly.

## The reframe

Off-chain computation is essentially free. A JavaScript program in a browser can sort a million elements in milliseconds. A backend can query a database, compute hashes, run cryptographic operations, and produce any answer you want. The cost is whatever the user's own machine consumes, which is nothing as far as the chain is concerned.

The chain, in contrast, has powerful verification primitives. Hashing, signature recovery, arithmetic, storage lookups: each is cheap on its own. The chain is bad at long computation but good at checking specific claims.

This suggests a split: do the hard work off-chain, then submit the result to the chain along with whatever the chain needs to verify the work was done correctly. The contract no longer computes anything expensive. It receives a claim and checks the claim. If the claim is valid, the contract uses the result. If the claim is invalid, the contract reverts.

This is the pattern. The user does work, the contract verifies.

The important property: the contract never trusts the user's claim blindly. The verification step is the security boundary. A user can submit any claim they want, but if it doesn't pass verification, nothing happens. They can lie, but lying only causes their own transaction to revert. They can't corrupt state by lying. The cost of trying and failing is just their gas.

## Worked example 1: Merkle proofs for airdrop eligibility

Suppose you want to airdrop tokens to 10,000 users. Storing 10,000 addresses on chain costs about 220 million gas just for the storage writes, since each new storage slot costs roughly 22,000 gas, plus the deployment cost of the contract code that handles them. At 30 gwei per gas, that's about 6.6 ETH spent on storage alone, an unreasonable cost for what is just a list of addresses.

The off-chain trick: build a Merkle tree of the 10,000 addresses off-chain. The tree's root is a single 32-byte hash. Store only the root in the contract. When a user wants to claim their airdrop, they prove they're in the tree by submitting their address and the path of sibling hashes that connect their address to the root.

Here's the verification logic:

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

The contract stores one 32-byte root. The user submits their address via `msg.sender`, the amount they're claiming, and a proof array of around `log2(10000) ≈ 14` sibling hashes. The contract reconstructs the root from the leaf and the proof, then checks it matches the stored root.

If the user is in the tree, they can produce a valid proof. The contract recomputes the root, sees it matches, and lets them claim. If the user is not in the tree, no proof exists that would lead back to the root. Whatever they submit will produce a hash that doesn't match, and the contract reverts.

The user did the hard work of building the tree off-chain. The contract did 14 hashes of verification work. The information needed to support 10,000 eligible users fits in a single 32-byte storage slot.

This is the pattern at its purest. The same construction is how every modern airdrop works. It's also how light clients verify chain state, how ZK rollups commit to state updates, and how cross-chain bridges prove events from other chains. Once you can verify a Merkle proof, you can talk about set membership cheaply forever.

## Worked example 2: square root verification

Some Solidity contracts need to compute square roots. Uniswap V2 uses one when initializing a liquidity pool. AMMs use them for invariant calculations. Bonding curves use them for pricing.

Solidity doesn't have a native square root opcode. Computing `sqrt(n)` requires an iterative algorithm, typically Newton's method or a binary search. A good implementation takes around 20-30 iterations and costs a few thousand gas. Not catastrophic, but not free either.

The off-chain trick: the user computes `sqrt(n)` themselves with infinite precision and submits the answer. The contract verifies the answer with two multiplications, costing about 50 gas total.

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

The user computes `r = floor(sqrt(n))` off-chain using whatever method they want, then calls the contract with both `n` and `r`. The contract checks two things: that `r * r` is at most `n`, and that `(r+1) * (r+1)` is greater than `n`. If both hold, `r` is exactly the integer square root of `n`.

The verification is two multiplications and two comparisons. Constant work. The user pays nothing for computing the root because they did it on their own machine. The contract spends roughly 50 gas instead of a few thousand.

A user who submits a wrong answer can't corrupt anything. The check fails, the transaction reverts, and the user pays the gas fee for the failed attempt. There's no path through the contract that uses an unverified root.

This same trick works for any function with a cheap verification. Modular inverse. Discrete logarithm checks. Bounded factorization. Any operation where checking is much cheaper than computing.

## The general shape

Look at both examples. The structural similarity is obvious once you see it:

- The user does the expensive work in their own environment, producing both a **value** they want the contract to use and possibly some **proof** that helps the contract verify the value.
- The user submits both pieces of data in a single contract call.
- The contract performs **verification logic** that's much cheaper than the original computation. Hashing for Merkle proofs. Multiplication for sqrt. Signature recovery for permits. The exact verification depends on the problem, but it's always cheap.
- If verification succeeds, the contract trusts the value and uses it.
- If verification fails, the contract reverts. The user's lie has cost them gas but accomplished nothing else.

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

This is the shape. Learn to recognize it. Much of non-trivial Solidity engineering is spotting situations that fit this pattern and applying it.

## Why malicious users can't break this

A natural concern: if the user is computing the answer, what stops them from lying? The answer is that they're free to lie, but lying doesn't help them.

A lie has to pass verification. The verification logic is the contract's own code, running deterministically on the chain. The user can't influence it. They can only submit inputs, and whatever they submit gets fed into the verification function. If the inputs don't produce a passing result, the contract reverts.

The security model only works if the verification is correct. A buggy Merkle verification that accepts invalid proofs is a disaster. A buggy sqrt verification that accepts wrong roots silently corrupts whatever consumes the root. The verification step is the security boundary, and it has to be airtight.

This is why production protocols often use battle-tested verification libraries: OpenZeppelin's MerkleProof, OpenZeppelin's ECDSA, audited signature verifiers. Writing your own verification is a higher bar than writing application logic, because every edge case in the verifier is a potential exploit. When you can use a well-known verifier, do.

## Where else this pattern appears

A short tour of where you'll meet this pattern as you keep learning:

**Signatures and permits.** A user signs a message off-chain saying "I authorize transferring 100 tokens to Alice." The contract verifies the signature with `ecrecover` and trusts the action. This is how EIP-2612 permit, Permit2, and meta-transactions all work. The "off-chain compute" is the cryptographic signing. The "on-chain verify" is the signature check. One line of work for the contract, one ECDSA recovery.

**Oracle attestations.** A user submits a data point with a signature from a trusted oracle. The contract verifies the signature and uses the data. Chainlink's data feeds work approximately this way internally, though with multiple signatures and aggregation.

**ZK proofs.** A user computes a complex statement off-chain with a SNARK or STARK, producing a tiny proof. The contract verifies the proof in fixed-size constant work, regardless of how complex the underlying statement is. ZK rollups use this to compress thousands of transactions into a single chain proof.

**Light clients.** A node tracks just the headers of a chain instead of the full state. To check a specific transaction, it asks a full node for a Merkle proof that the transaction is in the chain. Verification is logarithmic in the chain size.

**Optimistic rollup challenge games.** Operators post claims about computation. Verifiers challenge claims and the chain runs a binary-search game to find the exact disputed step. Most of the time, no verification happens at all. The threat of verification is enough to keep operators honest.

In every case, the pattern is the same: heavy computation off-chain, cheap verification on-chain, malicious actors only burn their own gas.

## When the pattern doesn't apply

Not every problem fits. Three situations where you can't or shouldn't reach for this pattern:

**When verification is as expensive as computation.** If checking the answer takes the same work as computing it, there's no savings. Sorting is usually like this: verifying an array is sorted takes O(n) reads, the same as sorting it from a known starting state. The pattern shines when verification is asymptotically cheaper than computation, like the difference between O(log n) Merkle verification and O(n) iteration.

**When the user can't be expected to do the work.** If your contract is a black box that users interact with through a wallet, asking them to "compute a Merkle proof of inclusion" requires the wallet or the dApp frontend to do it for them. That's usually fine in practice. Every airdrop dApp does this. But it shifts complexity into the frontend, which may not be where you want it.

**When the off-chain answer changes faster than the chain can verify.** Time-sensitive answers like current prices can't be off-chain-computed and then verified, because by the time the verification runs, the answer is stale. This is the oracle problem in disguise.

For everything else, reach for this pattern. Whenever you see a loop that could exceed the block gas limit, or a computation that is too expensive on-chain, ask: can I move this work off-chain and verify the result instead?
