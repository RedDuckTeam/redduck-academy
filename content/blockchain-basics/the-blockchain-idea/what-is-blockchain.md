---
id: 77
title: What is blockchain
type: lecture
order: 0
faq:
  - question: If everyone keeps their own copy of a blockchain, what stops someone from editing an old block?
    answer: >-
      Each block stores the hash of the block before it, a fixed-length fingerprint of its
      contents. Change anything in an old block and its hash changes, so the next block's
      previous-hash field stops matching and the break is visible. Every node holds its own
      copy too, so editing one copy changes nothing anywhere else.
  - question: What is inside a block?
    answer: >-
      A header and a batch of items. The header holds the previous block's hash, a 32-byte
      Merkle root covering every item, and a timestamp. That keeps the header near 80 bytes
      even when the block holds thousands of items.
  - question: How do thousands of computers with no one in charge end up with the same chain?
    answer: >-
      Every node checks each new block against the same rules, so they all reach the same
      verdict alone. Consensus settles the rare tie.
  - question: Where is a blockchain stored?
    answer: >-
      On every node at once. None of the copies is the original.
---

> You now have the cryptographic primitives: hashes, keys, signatures and Merkle trees. Standing alone, none of these is a blockchain. This lesson builds the structure up from scratch, using only the parts you already have.

## Many parties need one list, and none of them trusts the others

You want a shared record of facts, a list of "this happened, then this happened, then this happened." Many parties around the world need to agree on the contents of that list. None of them trusts any of the others, and there is no central authority they can all defer to.

So the task is to build a list of facts that everyone can read, anyone can append to, and nobody can secretly edit. A blockchain does this with a few simple structural choices, layered one on top of the next.

## A plain list has no defence against edits

You need to record a list of items, in order. The word items is just a placeholder. We haven't said yet what they are. The list grows over time as new items are added.

A naive list would look like this:

```
item 1
item 2
item 3
item 4
...
```

This works for one person on one computer. The problem starts when the list is shared. If you mail me a copy and I quietly change item 2 to say something different, you have no way to tell from my copy that anything is wrong. The list has no built-in defence against tampering.

## Each block carries the hash of the one before it

Apply what you learned about hashing. Group items into batches called **blocks**, and let each block carry the hash of the previous block.

```
[Block 1: items]  →  [Block 2: items, prev_hash]  →  [Block 3: items, prev_hash]  →  ...
```

This is where the name comes from: blocks, linked into a chain. As the [hashing lesson](/courses/blockchain-basics/cryptography/hashing) showed, changing anything in an old block changes its hash, so the "previous hash" field of the next block no longer matches. Each hash covers the one before it, so the hash of the latest block depends on every block in the chain, and two people can check that their copies are identical by comparing that one hash.

Each block also carries a 32-byte [Merkle root](/courses/blockchain-basics/cryptography/merkle-trees) of its items, so a single item can later be checked against the block without downloading all of them. The block's header contains just this root plus the previous-block hash plus a few small bits of metadata such as a timestamp. In Bitcoin the header is 80 bytes even when the block contains thousands of items.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Blocks N-1, N, and N+1 linked by prev_hash and merkle_root</title><desc>Three blocks in a row, each with a hash, prev_hash, merkle_root, timestamp, and a list of items. Arrows show each block's prev_hash pointing back to the previous block's hash, chaining them together.</desc>

<defs>

<marker id="arr31" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">

<path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>

</marker>

</defs>

<!-- Block N-1 hash label -->

<text x="120" y="35" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">hash: a3f8...</text>

<!-- Block N-1 -->

<rect x="20" y="50" width="200" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<rect x="20" y="50" width="200" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>

<text x="120" y="75" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Block N-1</text>

<text x="120" y="110" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">prev_hash: ...</text>

<text x="120" y="128" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">merkle_root: 8a3f...</text>

<text x="120" y="146" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">timestamp</text>

<line x1="35" y1="160" x2="205" y2="160" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="120" y="180" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="120" y="198" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="120" y="216" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="120" y="234" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">...</text>

<!-- Block N hash label -->

<text x="360" y="35" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">hash: b7c2...</text>

<!-- Block N -->

<rect x="260" y="50" width="200" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<rect x="260" y="50" width="200" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>

<text x="360" y="75" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Block N</text>

<text x="360" y="110" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">prev_hash: a3f8...</text>

<text x="360" y="128" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">merkle_root: b7c2...</text>

<text x="360" y="146" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">timestamp</text>

<line x1="275" y1="160" x2="445" y2="160" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="360" y="180" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="360" y="198" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="360" y="216" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="360" y="234" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">...</text>

<!-- Block N+1 hash label -->

<text x="600" y="35" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">hash: d4e9...</text>

<!-- Block N+1 -->

<rect x="500" y="50" width="200" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<rect x="500" y="50" width="200" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>

<text x="600" y="75" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Block N+1</text>

<text x="600" y="110" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">prev_hash: b7c2...</text>

<text x="600" y="128" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">merkle_root: d4e9...</text>

<text x="600" y="146" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">timestamp</text>

<line x1="515" y1="160" x2="685" y2="160" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="600" y="180" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="600" y="198" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="600" y="216" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">item</text>

<text x="600" y="234" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">...</text>

<!-- Arrows: from each block's prev_hash field, pointing back to the previous block -->

<line x1="260" y1="110" x2="222" y2="110" stroke="#ed4937" stroke-width="2" marker-end="url(#arr31)"/>

<line x1="500" y1="110" x2="462" y2="110" stroke="#ed4937" stroke-width="2" marker-end="url(#arr31)"/>

<text x="360" y="285" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Each block's prev_hash field points back to the previous block's hash.</text>

</svg>

## The chain needs other copies to compare with

The hashes do not stop me from editing my own copy. I can change item 2 and then recompute the hash of that block and of every block after it. Hashing is fast, so this is easy, and afterwards my copy is consistent again and nothing inside it shows the edit. The edit shows only when my copy is compared with yours, because the hashes differ from the edited block onwards.

So every party in the network holds a full copy of the chain. Instead of a few servers or a centralised database, thousands of independent computers each run the same software, each hold the same data, and each verify every new block against the same rules. Tampering with one copy doesn't change any other.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Same blockchain copied across Node 1 to Node 5, and thousands more</title><desc>Five boxes labeled Node 1 through Node 5 each show the same chain of blocks, with a note for thousands more nodes. Every node holds its own copy of the same chain, so tampering with one copy doesn't change any other.</desc>
  <!-- Node 1 -->
  <rect x="40" y="20" width="200" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="42" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Node 1</text>
  <rect x="60" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="90" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="120" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="150" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="180" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <line x1="85" y1="65" x2="90" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="115" y1="65" x2="120" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="145" y1="65" x2="150" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="175" y1="65" x2="180" y2="65" stroke="#565653" stroke-width="1"/>

<!-- Node 2 -->
  <rect x="280" y="20" width="200" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="380" y="42" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Node 2</text>
  <rect x="300" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="330" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="360" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="390" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="420" y="55" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <line x1="325" y1="65" x2="330" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="355" y1="65" x2="360" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="385" y1="65" x2="390" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="415" y1="65" x2="420" y2="65" stroke="#565653" stroke-width="1"/>

<!-- Node 3 -->
  <rect x="520" y="20" width="180" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="610" y="42" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Node 3</text>
  <rect x="535" y="55" width="22" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="562" y="55" width="22" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="589" y="55" width="22" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="616" y="55" width="22" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="643" y="55" width="22" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="670" y="55" width="22" height="20" fill="#e0deda" stroke="#000000"/>
  <line x1="557" y1="65" x2="562" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="584" y1="65" x2="589" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="611" y1="65" x2="616" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="638" y1="65" x2="643" y2="65" stroke="#565653" stroke-width="1"/>
  <line x1="665" y1="65" x2="670" y2="65" stroke="#565653" stroke-width="1"/>

<!-- Node 4 -->
  <rect x="60" y="160" width="200" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="160" y="182" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Node 4</text>
  <rect x="80" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="110" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="140" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="170" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="200" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <line x1="105" y1="205" x2="110" y2="205" stroke="#565653" stroke-width="1"/>
  <line x1="135" y1="205" x2="140" y2="205" stroke="#565653" stroke-width="1"/>
  <line x1="165" y1="205" x2="170" y2="205" stroke="#565653" stroke-width="1"/>
  <line x1="195" y1="205" x2="200" y2="205" stroke="#565653" stroke-width="1"/>

<!-- Node 5 -->
  <rect x="300" y="160" width="200" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="400" y="182" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Node 5</text>
  <rect x="320" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="350" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="380" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="410" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <rect x="440" y="195" width="25" height="20" fill="#e0deda" stroke="#000000"/>
  <line x1="345" y1="205" x2="350" y2="205" stroke="#565653" stroke-width="1"/>
  <line x1="375" y1="205" x2="380" y2="205" stroke="#565653" stroke-width="1"/>
  <line x1="405" y1="205" x2="410" y2="205" stroke="#565653" stroke-width="1"/>
  <line x1="435" y1="205" x2="440" y2="205" stroke="#565653" stroke-width="1"/>

<!-- ... -->
  <text x="600" y="200" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">thousands more</text>

<text x="360" y="270" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Every node holds its own copy of the same chain. Tampering with one copy doesn't change any other.</text>
</svg>

The chain is the data structure. The network is the set of machines, called nodes, that all hold the same copy of it.

## A blockchain is a hash-linked chain of blocks copied on every node

A blockchain is a replicated, append-only, hash-linked sequence of blocks. Every node holds the same copy, and each block's hash binds it to all the blocks before it, so the structure is tamper-evident even though no central authority maintains it.

Two things are still open. Comparing copies shows that they differ, but not which one to keep. And anyone running the software can produce a new block that points at the current tip of the chain, so two nodes can produce two different new blocks at roughly the same time. The mechanism that settles both is called **consensus**, and it gets its own lesson: [Why we need consensus](/courses/blockchain-basics/the-blockchain-idea/why-we-need-consensus).

Everything else you'll meet in the rest of this course (transactions, smart contracts, tokens, mining, staking) is what people put inside the items, or what they build on top of the chain once they trust its contents.
