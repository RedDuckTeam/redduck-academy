---
id: 77
title: What is blockchain
type: lecture
order: 0
faq:
  - question: If everyone keeps their own copy of a blockchain, what stops someone
      from secretly editing it?
    answer: Each block stores the cryptographic hash (a fixed-length fingerprint) of
      the block before it. Change anything in an old block and its hash changes,
      so the next block's stored 'previous hash' no longer matches and the chain
      visibly breaks. On top of that, thousands of independent computers each
      hold their own copy, so tampering with one copy does not change any of the
      others.
  - question: Why is a blockchain called a 'chain' of blocks?
    answer: Records are grouped into batches called blocks, and every block carries
      the hash of the block before it, linking them into an ordered sequence.
      That backward-pointing link is literally a chain of blocks, which is where
      the name comes from. It also makes the whole history tamper-evident,
      because breaking one link invalidates every block after it.
  - question: How can thousands of computers with no one in charge agree on the same
      blockchain?
    answer: Every machine runs the same software, holds the same data, and checks
      each new block against the same rules, so honest nodes independently reach
      the same conclusions. When two nodes happen to produce different new
      blocks at almost the same time, a separate mechanism called consensus
      decides which one becomes the official version. Without consensus the
      copies could drift apart.
---

> You now have the cryptographic primitives. Hashes that uniquely identify data, keys that prove identity, signatures that bind authorship to a message, Merkle trees that commit to large sets in 32 bytes. Standing alone, none of these is a blockchain. A blockchain is what happens when you arrange those primitives in a very specific way to solve a very specific problem. This lesson builds the structure up from scratch, using only the parts you already have.

## The problem we're solving

You want a shared record of facts. A list of "this happened, then this happened, then this happened." Many parties around the world need to agree on the contents of that list. None of them trusts any of the others. There is no central authority you can all defer to.

That's the entire problem. Build a list of facts that everyone can read, anyone can append to, and nobody can secretly edit. With no central authority.

It sounds impossible at first. If everyone has their own copy of the list, who's right when two copies disagree? If anyone can write to it, what stops a bad actor from rewriting history? If there's no central operator, how does the system decide which version of reality is the real one?

The blockchain is the answer to all of those questions at once. It works because of a few simple structural choices, layered one on top of the next.

## The structure, built up

Step one. You need to record a list of items, in order. The word items is just a placeholder — we haven't said yet what they are. The list grows over time as new items are added.

A naive list would look like this:

```
item 1
item 2
item 3
item 4
...
```

This works for one person on one computer. The problem starts when the list is shared. If you mail me a copy and I quietly change item 2 to say something different, you have no way to tell from my copy that anything is wrong. The list has no built-in defence against tampering.

Step two. Apply what you learned about hashing. Group items into batches called **blocks**, and each block carries the hash of the previous block. Tampering with any historical block changes its hash, which means the next block's "previous hash" field no longer matches, which means the chain breaks. Anyone holding the chain can detect this by recomputing one hash per block.

```
[Block 1: items]  →  [Block 2: items, prev_hash]  →  [Block 3: items, prev_hash]  →  ...
```

This gives you a tamper-evident sequence. Each block points back at the one before it via a hash. This is where the name comes from: blocks, linked into a chain.

Step three. Apply what you learned about Merkle trees. Inside each block, the items don't have to be stored as a flat list. They can be summarised by a single Merkle root, also 32 bytes, that commits to every item in the block. The block's header contains just this root plus the previous-block hash plus a few small bits of metadata. The result is a block header that's only around 80 bytes even when the block contains thousands of items.

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

Step four. Make every party in the network hold a full copy of the chain. Not just a few servers, not a centralised database, but thousands of independent computers each running the same software, each holding the same data, each verifying every new block against the same rules. The picture below shows the same chain replicated across many machines.

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

This is the second word in "blockchain network." The chain is the data structure. The network is the set of machines that all hold the same copy of it.

## What you've actually built

Stack these four moves together and look at what falls out.

A shared record exists, because every node holds it.

Tampering with the past is detectable, because each block's hash binds it to the one before, and any change to any historical block invalidates every block after it.

Adding to the present is easy, because anyone running the software can produce a new block that points at the current tip of the chain.

Disagreement can still happen, because two nodes can produce two different new blocks at roughly the same time. The mechanism that decides which one becomes canonical is called **consensus**, and it gets its own lesson later in this module.

That's a blockchain. A replicated, append-only, hash-linked sequence of blocks, where every node holds the same copy, every block proves the integrity of every previous block, and the structure as a whole is tamper-evident even though no central authority maintains it.

Everything else you'll meet in the rest of this course, transactions, smart contracts, tokens, mining, staking, dApps, NFTs, DeFi — all of it — is what people put inside the items, or what they build on top of the chain once they trust its contents. The chain itself is just the structure described above. Once you see that, the mystery is gone.
