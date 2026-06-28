# Merkle trees

_type: lecture_

> You have a list of one thousand things. Someone asks you "is this specific thing on your list?" You want to prove the answer is yes without sending them the whole list. You also want them to be unable to forge a "yes" for anything not actually on it. The data structure that solves this, in the cleverest possible way, is the Merkle tree. It's a structural primitive at the heart of every blockchain in existence, and once you see how it's built, you'll never need to memorise it again.

## Deriving the structure

Start with the problem. You have eight items. Call them `A` through `H`. You want a single short value that "summarises" all eight, with two properties:

1. **Tamper-evident.** Change any one of the eight items, and the summary changes. No way to swap items secretly.
2. **Cheap to update if you only need to check one item.** A verifier shouldn't have to download all eight to confirm `D` is in the set.

A naive first attempt: hash the whole list. `summary = hash(A || B || C || D || E || F || G || H)`. This solves property 1: change anything, the hash changes. But it fails property 2. To verify that `D` is in the set, the verifier has to compute the hash of the entire concatenation, which means they need all eight items in the first place. We've saved nothing.

Better idea: hash each item individually first, then hash the results in pairs, then hash those pair-hashes in pairs, and keep going until you're down to one value. That's a tree.

<svg viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <!-- Leaves (data) -->
  <rect x="20" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="52" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">A</text>

<rect x="105" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="137" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">B</text>

<rect x="190" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="222" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">C</text>

<rect x="275" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="307" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">D</text>

<rect x="380" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="412" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">E</text>

<rect x="465" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="497" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">F</text>

<rect x="550" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="582" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">G</text>

<rect x="635" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="667" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">H</text>

<!-- Level 1: hash of each item -->
  <rect x="20" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="52" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(A)</text>

<rect x="105" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="137" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(B)</text>

<rect x="190" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="222" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(C)</text>

<rect x="275" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="307" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(D)</text>

<rect x="380" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="412" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(E)</text>

<rect x="465" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="497" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(F)</text>

<rect x="550" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="582" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(G)</text>

<rect x="635" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="667" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(H)</text>

<!-- Level 2: pair hashes -->
  <rect x="60" y="160" width="90" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="105" y="185" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(AB)</text>

<rect x="230" y="160" width="90" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="275" y="185" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(CD)</text>

<rect x="420" y="160" width="90" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="465" y="185" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(EF)</text>

<rect x="590" y="160" width="90" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="635" y="185" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(GH)</text>

<!-- Level 3: quadruple hashes -->
  <rect x="125" y="80" width="120" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="185" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(AB,CD)</text>

<rect x="475" y="80" width="120" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="535" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(EF,GH)</text>

<!-- Root -->
  <rect x="295" y="10" width="130" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="35" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Merkle root</text>

<!-- Lines from leaves to level 1 -->
  <line x1="52" y1="320" x2="52" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="137" y1="320" x2="137" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="222" y1="320" x2="222" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="307" y1="320" x2="307" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="412" y1="320" x2="412" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="497" y1="320" x2="497" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="582" y1="320" x2="582" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="667" y1="320" x2="667" y2="280" stroke="#565653" stroke-width="1.5"/>

<!-- Lines from level 1 to level 2 -->
  <line x1="52" y1="240" x2="105" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="137" y1="240" x2="105" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="222" y1="240" x2="275" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="307" y1="240" x2="275" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="412" y1="240" x2="465" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="497" y1="240" x2="465" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="582" y1="240" x2="635" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="667" y1="240" x2="635" y2="200" stroke="#565653" stroke-width="1.5"/>

<!-- Lines from level 2 to level 3 -->
  <line x1="105" y1="160" x2="185" y2="120" stroke="#565653" stroke-width="1.5"/>
  <line x1="275" y1="160" x2="185" y2="120" stroke="#565653" stroke-width="1.5"/>
  <line x1="465" y1="160" x2="535" y2="120" stroke="#565653" stroke-width="1.5"/>
  <line x1="635" y1="160" x2="535" y2="120" stroke="#565653" stroke-width="1.5"/>

<!-- Lines from level 3 to root -->
  <line x1="185" y1="80" x2="360" y2="50" stroke="#565653" stroke-width="1.5"/>
  <line x1="535" y1="80" x2="360" y2="50" stroke="#565653" stroke-width="1.5"/>
</svg>

That's a Merkle tree. The bottom row is the original data. The level above is the hash of each item. The level above that is the hash of each adjacent pair. Keep going: each parent is the hash of the concatenation of its two children. The single value at the top is the **Merkle root**, and it's only 32 bytes regardless of how many items you started with.

For 8 leaves the tree has 4 levels and a total of 15 hashes. For 1,000 leaves it would have 10 levels and about 2,000 hashes. The depth grows logarithmically with the number of leaves, which is the property that makes the whole structure efficient.

## What the root commits to

The root is a single short value that depends on *every* leaf in the tree. If you change one bit of `D`, then `h(D)` changes, then `h(CD)` changes, then `h(AB,CD)` changes, then the root changes. The avalanche property of the hash function propagates all the way up. The root is a compact, tamper-evident commitment to the entire set of leaves.

Two parties can confirm they have the same set of items by exchanging just the root. If their roots match, every byte of every leaf is identical. If the roots differ by even one bit, something somewhere on the tree differs. They don't have to compare the leaves directly. The 32 bytes of the root are doing all the work.

This is already useful by itself. Storage and bandwidth savings aside, the structural property "one short hash commits to a large set" is the foundation. The interesting trick is the next one.

## The Merkle proof

Now the operation that makes Merkle trees famous.

Suppose you're the verifier. You know only the Merkle root. Someone else, the prover, has the whole tree and wants to convince you that item `D` is one of the leaves. How few hashes do they need to send you, and how can you check?

The answer is they send you a single sequence of hashes called a **Merkle proof**. For `D` in our 8-leaf tree, the proof is exactly three hashes: `h(C)`, `h(AB)`, and `h(EF,GH)`.

<svg viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <!-- Leaves -->
  <rect x="20" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="52" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">A</text>

<rect x="105" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="137" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">B</text>

<rect x="190" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="222" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">C</text>

<rect x="275" y="320" width="65" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="307" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#ffffff" font-weight="bold">D</text>

<rect x="380" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="412" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">E</text>

<rect x="465" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="497" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">F</text>

<rect x="550" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="582" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">G</text>

<rect x="635" y="320" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="667" y="345" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">H</text>

<!-- Level 1 -->
  <rect x="20" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="52" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(A)</text>

<rect x="105" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="137" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(B)</text>

<rect x="190" y="240" width="65" height="40" fill="#ed4937" stroke="#000000" stroke-width="3"/>
  <text x="222" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">h(C)</text>

<rect x="275" y="240" width="65" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="3" stroke-dasharray="4 3"/>
  <text x="307" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(D)</text>

<rect x="380" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="412" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(E)</text>

<rect x="465" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="497" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(F)</text>

<rect x="550" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="582" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(G)</text>

<rect x="635" y="240" width="65" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="667" y="265" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(H)</text>

<!-- Level 2 -->
  <rect x="60" y="160" width="90" height="40" fill="#ed4937" stroke="#000000" stroke-width="3"/>
  <text x="105" y="185" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">h(AB)</text>

<rect x="230" y="160" width="90" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="3" stroke-dasharray="4 3"/>
  <text x="275" y="185" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(CD)</text>

<rect x="420" y="160" width="90" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="465" y="185" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(EF)</text>

<rect x="590" y="160" width="90" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="635" y="185" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(GH)</text>

<!-- Level 3 -->
  <rect x="125" y="80" width="120" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="3" stroke-dasharray="4 3"/>
  <text x="185" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">h(AB,CD)</text>

<rect x="475" y="80" width="120" height="40" fill="#ed4937" stroke="#000000" stroke-width="3"/>
  <text x="535" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">h(EF,GH)</text>

<!-- Root -->
  <rect x="295" y="10" width="130" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="3" stroke-dasharray="4 3"/>
  <text x="360" y="35" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Merkle root</text>

<!-- Lines -->
  <line x1="52" y1="320" x2="52" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="137" y1="320" x2="137" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="222" y1="320" x2="222" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="307" y1="320" x2="307" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="412" y1="320" x2="412" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="497" y1="320" x2="497" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="582" y1="320" x2="582" y2="280" stroke="#565653" stroke-width="1.5"/>
  <line x1="667" y1="320" x2="667" y2="280" stroke="#565653" stroke-width="1.5"/>

<line x1="52" y1="240" x2="105" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="137" y1="240" x2="105" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="222" y1="240" x2="275" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="307" y1="240" x2="275" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="412" y1="240" x2="465" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="497" y1="240" x2="465" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="582" y1="240" x2="635" y2="200" stroke="#565653" stroke-width="1.5"/>
  <line x1="667" y1="240" x2="635" y2="200" stroke="#565653" stroke-width="1.5"/>

<line x1="105" y1="160" x2="185" y2="120" stroke="#565653" stroke-width="1.5"/>
  <line x1="275" y1="160" x2="185" y2="120" stroke="#565653" stroke-width="1.5"/>
  <line x1="465" y1="160" x2="535" y2="120" stroke="#565653" stroke-width="1.5"/>
  <line x1="635" y1="160" x2="535" y2="120" stroke="#565653" stroke-width="1.5"/>

<line x1="185" y1="80" x2="360" y2="50" stroke="#565653" stroke-width="1.5"/>
  <line x1="535" y1="80" x2="360" y2="50" stroke="#565653" stroke-width="1.5"/>
</svg>

The red solid nodes (`h(C)`, `h(AB)`, `h(EF,GH)`) are the proof: the sibling hashes that the verifier needs but cannot compute on their own. The red dashed nodes show what the verifier *can* compute themselves once they have `D` and the proof.

The verification:

1. The verifier knows `D` (the item being proved) and the root (already trusted). They receive the proof: three hashes.
2. They compute `h(D)` themselves from `D`.
3. They concatenate `h(C)` from the proof with their own `h(D)` and hash the result, producing `h(CD)`.
4. They concatenate `h(AB)` from the proof with `h(CD)` and hash again, producing `h(AB,CD)`.
5. They concatenate `h(AB,CD)` with `h(EF,GH)` from the proof and hash one more time, producing a value.
6. If that final value equals the root they already trusted, `D` is in the set. If it doesn't, `D` is not in the set (or the proof is forged).

Three hashes from the prover, three hash operations on the verifier's side. The other five leaves and their hashes never appear. For a tree with 1,000 leaves, the proof would be 10 hashes. For a tree with one billion leaves, the proof would still only be 30 hashes. That logarithmic scaling is the entire trick.

The verifier doesn't need to trust the prover. The hash function is doing the trust work: if the prover sends a wrong sibling hash, the final computed value won't match the root, and the proof fails. If the prover lies about which item they're proving (claims `D` was in the set when it wasn't), they can't construct a sequence of hashes that mathematically rolls up to the trusted root without breaking the hash function itself.

## Why this matters for blockchains

A blockchain is going to need a way to commit to large amounts of data, often thousands of items at a time, using a single short value. The reason is bandwidth and storage: not every participant in the network can afford to download everything. They need a way to ask "is my piece in there?" and get a cheap, verifiable yes-or-no answer.

The Merkle tree is exactly the structure that solves this. The chain summarises a large collection of data with a single root hash. Anyone who has that root can later be convinced that one specific item belongs to that collection, with a tiny proof that scales with the depth of the tree rather than the size of the collection. A thousand items, ten hashes to prove inclusion. A billion items, thirty hashes. The size of the proof grows almost not at all.

You don't need to memorise where exactly this shows up yet. The Bitcoin module will show you the first one: a single 32-byte value sitting inside every block that summarises every transaction inside it. From there, the same primitive turns up in cross-chain communication, in scaling protocols, in lightweight wallet designs, and in many other places the rest of the course will visit. The pattern to recognise: wherever a system needs to commit to a large set with a small hash and prove individual membership efficiently, there's a Merkle tree underneath.
