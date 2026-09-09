---
id: 87
title: Blocks and mining
type: lecture
order: 3
faq:
  - question: What are Bitcoin miners searching for?
    answer: >-
      A four-byte nonce that makes the block header hash small enough. They change the
      nonce, hash the header twice with SHA-256, and check whether the result sits below the
      difficulty target, which today means roughly 20 leading zero hex digits. Nothing but
      trying trillions of nonces gets you there. Checking a winner takes one hash.
  - question: How big is a Bitcoin block header?
    answer: >-
      Exactly 80 bytes, whatever the block holds. Version, prev_block_hash, merkle_root,
      timestamp, bits, and nonce, and only the nonce is the miner's to choose.
  - question: Where does brand-new bitcoin come from?
    answer: >-
      The coinbase transaction, the first transaction in every block. It has no inputs and
      creates value from nothing. No other mechanism ever mints a bitcoin.
  - question: What is the block subsidy now, and when does it halve again?
    answer: >-
      3.125 BTC since the April 2024 halving, paid to the winning miner along with every fee
      in the block. It started at 50 BTC in 2009 and halves every 210,000 blocks, roughly
      four years, through 25, 12.5 and 6.25. Next is 1.5625 BTC around April 2028. Near 2140
      it reaches zero and only fees are left, and the 21 million cap is the sum of that
      curve.
  - question: Why do miners join pools instead of mining alone?
    answer: >-
      A small miner can wait decades between blocks. In a pool everyone hashes the
      operator's block template and submits easier partial solutions called shares, and the
      reward is split by share count when one hash clears the real network target.
  - question: Why does a block still take about ten minutes as more miners join?
    answer: >-
      Every 2,016 blocks, roughly two weeks, every node recomputes the difficulty target
      from how long the last batch took. Difficulty has risen by about a factor of 100
      trillion since 2009 and the block time has not moved.
---

A transaction sitting in a wallet is just a string of bytes. A transaction sitting in the Bitcoin network's mempool is just a string of bytes that many nodes happen to know about. Neither of those is settlement. The transaction is settled when it lands in a block, that block lands in the chain, and enough additional blocks are added on top of it that reversing the transaction would cost more than anyone would rationally spend. This lesson is about how that landing happens. Who builds the block. What's inside it. What the proof-of-work puzzle actually is. Why solving the puzzle is hard and checking the solution is trivial. And how new bitcoin gets minted into existence at the same moment each block is built.

## From transactions to blocks

A block is a batch of transactions, plus a small header that gives the batch an identity and connects it to the previous block in the chain. Anyone running mining software is competing to be the one who builds the next block. The competition is the proof-of-work puzzle, and only the winner gets to add to the chain.

The winner gets two things in return for their work. First, all of the transaction fees from the transactions they bundled into the block. Second, a fresh amount of newly-created BTC, called the **block subsidy**, which is currently 3.125 BTC and halves every four years on a fixed schedule. Together these two things are called the **block reward**, and they're the only reason mining happens at all. Without the reward, there would be no incentive to spend electricity on hashing.

The pattern of one new block roughly every ten minutes is a deliberate choice introduced in an earlier lesson. Slow block times leave room for new blocks to reach most of the network before the next one is produced, which keeps the network converging on the same chain. Faster blocks would mean more accidental forks. Ten minutes is conservative on purpose.

## What's inside a block

A block has two parts.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Bitcoin block structure: 80-byte header and transaction list</title><desc>A Bitcoin block has two parts: a small block header on top and a much bigger transaction list below. The header is exactly 80 bytes and holds the version, previous block hash, merkle root, timestamp, bits, and nonce, while the transaction list is typically 1 MB to 4 MB, starting with the coinbase transaction and followed by thousands more.</desc>
  <rect x="120" y="20" width="480" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="45" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">A Bitcoin block</text>

<rect x="120" y="80" width="480" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="105" font-size="13" fill="#000000" font-weight="bold">Block header</text>
  <text x="280" y="105" font-family="monospace" font-size="11" fill="#565653">exactly 80 bytes</text>
  <text x="140" y="130" font-family="monospace" font-size="10" fill="#565653">version, prev_block_hash, merkle_root,</text>
  <text x="140" y="148" font-family="monospace" font-size="10" fill="#565653">timestamp, bits (difficulty target), nonce</text>

<rect x="120" y="170" width="480" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="195" font-size="13" fill="#000000" font-weight="bold">Transaction list</text>
  <text x="280" y="195" font-family="monospace" font-size="11" fill="#565653">typically 1 MB to 4 MB, thousands of txs</text>

<rect x="140" y="210" width="440" height="25" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="155" y="227" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">tx 0: coinbase (creates new BTC)</text>

<rect x="140" y="240" width="440" height="22" fill="#e0deda" stroke="#565653" stroke-width="1"/>
  <text x="155" y="256" font-family="monospace" font-size="10" fill="#565653">tx 1: ...</text>

<rect x="140" y="265" width="440" height="22" fill="#e0deda" stroke="#565653" stroke-width="1"/>
  <text x="155" y="281" font-family="monospace" font-size="10" fill="#565653">tx 2: ...</text>

<rect x="140" y="290" width="440" height="22" fill="#e0deda" stroke="#565653" stroke-width="1"/>
  <text x="155" y="306" font-family="monospace" font-size="10" fill="#565653">tx 3: ...</text>

<text x="155" y="328" font-family="monospace" font-size="11" fill="#565653">...thousands more...</text>

<text x="360" y="365" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">A tiny header sitting on top of a much bigger transaction list.</text>
</svg>

The disproportion in this diagram is the most important thing to notice. The block body is megabytes of transaction data. The block header is exactly 80 bytes, no matter what. This asymmetry is not an accident. A lightweight wallet running on a phone wants to verify that a particular transaction is in the chain without storing the entire chain. It can do this by storing only block headers and asking a full node for a Merkle proof when it needs to check a specific transaction. The headers add up to about 4 megabytes per year. The whole structure is shaped to make that lightweight verification work, which is one of the design choices that follows from the public-verifiability requirement introduced in an earlier lesson.

## The six fields in a block header

Each block header packs six fields into exactly 80 bytes.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Six fields of a block header, totaling 80 bytes</title><desc>The header holds six fields: version, prev_block_hash, and merkle_root in the top row, then timestamp, bits, and nonce below, each labeled with its byte size and role. Five fields are set by existing data, while the nonce is the only field a miner chooses.</desc>
  <rect x="40" y="20" width="640" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="45" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">Block header (80 bytes total)</text>

<rect x="40" y="80" width="200" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="105" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">version</text>
  <text x="140" y="125" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">4 bytes</text>
  <text x="140" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">format flags</text>

<rect x="260" y="80" width="200" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="105" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">prev_block_hash</text>
  <text x="360" y="125" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">32 bytes</text>
  <text x="360" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">links to previous block</text>

<rect x="480" y="80" width="200" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="580" y="105" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">merkle_root</text>
  <text x="580" y="125" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">32 bytes</text>
  <text x="580" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">commits to all txs</text>

<rect x="40" y="210" width="200" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="235" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">timestamp</text>
  <text x="140" y="255" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">4 bytes</text>
  <text x="140" y="290" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">when mined</text>

<rect x="260" y="210" width="200" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="235" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">bits</text>
  <text x="360" y="255" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">4 bytes</text>
  <text x="360" y="290" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">difficulty target</text>

<rect x="480" y="210" width="200" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="580" y="235" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">nonce</text>
  <text x="580" y="255" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">4 bytes</text>
  <text x="580" y="290" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">what miners search</text>

<text x="360" y="345" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Five fields are determined by the world. The nonce is the only one a miner gets to choose.</text>
</svg>

Take a closer look at three of these because they carry most of the meaning.

**The prev_block_hash** is the hash of the previous block's header. This is what makes the chain a chain: every block points backwards to one specific predecessor by hash. Change anything in any past block, even one bit of one transaction, and the Merkle root in that block's header changes, which changes that block's hash, which means every block built on top of it has the wrong prev_block_hash and the entire later chain is invalidated. This is the structural source of permanence.

**The merkle_root** is a single 32-byte commitment to every transaction in this block. It's computed by building a Merkle tree over the transaction list and taking the root. This is why the header doesn't need to grow with the block: no matter how many thousands of transactions are in the block, the commitment to all of them fits in 32 bytes. A light client can ask for a Merkle proof that a specific transaction is in this block, and verify the proof against the merkle_root in the header, without ever downloading the rest of the block.

**The nonce** is the only field a miner gets to vary freely. It's a 4-byte integer the miner increments while searching for a header whose hash falls below the difficulty target. Every other field is fixed before the search begins.

## The mining puzzle

Now the puzzle itself. Bitcoin's proof-of-work puzzle has a clean statement.

> Given a block header that's almost complete, find a value for the nonce such that the double-SHA-256 hash of the entire header, treated as a number, is less than the difficulty target.

That's it. That's the whole puzzle.

The "treated as a number" framing matters. A SHA-256 hash is 32 bytes, which is 64 hex digits when written out. Treating that hex string as a single very large number, the puzzle is just to make that number small. And the easiest way to make a number small in hex notation is to have it start with zeros. A hash like `8a4f2e9c...` is huge. A hash like `0000abc...` is much smaller. A hash like `00000000000000abc...` is tiny.

So in practice, what miners are looking for is a hash that starts with a specific number of leading zero digits. Today, the target requires roughly 20 leading zero hex digits at the front of the hash before it qualifies. A miner who gets 18 leading zeros has missed and has to try a different nonce. A miner who gets 20 or more has found a winning block.

<svg role="img" viewBox="0 0 720 520" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Mining loop: pick nonce, hash header, compare to target, mine block</title><desc>A flowchart shows a miner picking a nonce, hashing the 80-byte header with double SHA-256, and checking if the hash is less than the target: if not, it tries the next nonce, and if yes, the block is mined and broadcast. Below, three example hashes show two failed attempts that are too big and a winning attempt with about 20 leading zero hex digits, smaller than the target.</desc>
  <defs>
    <marker id="arr43m" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<text x="360" y="25" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">The mining loop</text>

<path d="M 600 80 Q 600 55 360 55 Q 120 55 120 80" fill="none" stroke="#565653" stroke-width="2" marker-end="url(#arr43m)"/>
  <text x="360" y="48" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">no, try the next nonce</text>

<rect x="40" y="80" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="120" y="105" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">pick a nonce</text>
  <text x="120" y="123" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">start at 0, increment</text>

<line x1="200" y1="110" x2="260" y2="110" stroke="#565653" stroke-width="2" marker-end="url(#arr43m)"/>

<rect x="260" y="80" width="200" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="105" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">double SHA-256</text>
  <text x="360" y="123" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">hash the 80-byte header</text>

<line x1="460" y1="110" x2="520" y2="110" stroke="#565653" stroke-width="2" marker-end="url(#arr43m)"/>

<rect x="520" y="80" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="600" y="105" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">hash &lt; target?</text>
  <text x="600" y="123" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">compare to bits</text>

<line x1="600" y1="140" x2="600" y2="190" stroke="#565653" stroke-width="2" marker-end="url(#arr43m)"/>
  <text x="615" y="168" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">yes</text>

<rect x="440" y="190" width="240" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="560" y="215" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">block is mined</text>

<text x="560" y="245" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">broadcast to the network</text>

<line x1="40" y1="275" x2="680" y2="275" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>

<text x="360" y="305" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">What "hash &lt; target" looks like in practice</text>

<text x="40" y="335" font-family="monospace" font-size="11" fill="#565653">target:</text>
  <text x="120" y="335" font-family="monospace" font-size="11" fill="#000000">0000000000000000000000abc4f2e9c1b7d3a8...</text>

<text x="40" y="370" font-family="monospace" font-size="11" fill="#565653">attempt 1:</text>
  <text x="120" y="370" font-family="monospace" font-size="11" fill="#000000">8a4f2e9c1b7d3a8b2c5e9f0123456789abcdef...</text>
  <text x="480" y="370" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">too big (fail)</text>

<text x="40" y="395" font-family="monospace" font-size="11" fill="#565653">attempt 2:</text>
  <text x="120" y="395" font-family="monospace" font-size="11" fill="#000000">00f2a91c4b7d3a8b2c5e9f0123456789abcdef...</text>
  <text x="480" y="395" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">still too big (fail)</text>

<text x="40" y="420" font-family="monospace" font-size="11" fill="#565653">attempt N:</text>
  <text x="120" y="420" font-family="monospace" font-size="11" fill="#000000">00000000000000000000007a91c4b7d3a8b2c5...</text>
  <text x="480" y="420" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">smaller than target, winner</text>

<text x="360" y="460" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">The hash must have around 20 leading zero hex digits today to qualify.</text>
  <text x="360" y="480" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">A miner runs this loop billions of times per second on dedicated hardware.</text>
  <text x="360" y="500" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">The whole network produces one winner roughly every ten minutes.</text>
</svg>

The diagram shows the structure. Mining is easiest to understand by doing it once yourself, even on a small scale. Try the puzzle below before reading on. Change the data, watch the hash flip wildly, then mine for a hash that starts with a few zeros and feel how the work scales with each extra zero you ask for.

[[block-mining]]

Three properties of the puzzle make the whole system work.

**The puzzle is hard.** SHA-256 has the avalanche property you've already seen, so there's no way to look at the target and calculate which nonce will produce a hash below it. You simply have to try different values until one works. The target is small enough that almost every attempt fails. Today the network as a whole performs roughly 10²¹ hash attempts per second. That's 1,000,000,000,000,000,000,000 attempts every second, across all the mining hardware on the planet. Even at that rate, finding one winning nonce takes about ten minutes.

**The puzzle is verifiable instantly.** Once a miner publishes a winning nonce, any node can hash the header once, compare to the target, and confirm in microseconds. Hard to solve, trivial to check. This asymmetry is what lets the network agree quickly on which miner won.

**The puzzle is tied to a specific block.** The hash inputs include the prev_block_hash and the merkle_root, so a winning nonce for one block doesn't transfer to any other block. The proof of work is bound to this exact block on this exact chain. Reorganising a winning nonce into a different chain is impossible.

## Mining pools

The puzzle's difficulty has an important consequence. A miner with a small share of global hashpower finds blocks rarely. With the network running at roughly 10²¹ hashes per second, an individual miner running modest hardware at a few terahashes per second would, on average, wait decades between finding a block. The reward when one finally lands is the same 3.125 BTC plus fees as anyone else's, but waiting decades for any income is not how a business runs. The standard response is **mining pools**. A pool operator builds a candidate block template and hands the header out to each connected miner along with the network's difficulty target. Each miner hashes nonces against that template exactly as they would solo. When a miner finds a hash that's below a much easier **share target**, easier than the real network target by some configurable factor, it submits that share to the operator as evidence of work done. The pool counts shares from everyone, and when one of the submitted hashes happens to also be below the real network target, the pool publishes the block and splits the reward in proportion to how many shares each miner contributed during the round. The participating miner's income changes from "3.125 BTC every several decades" to "a small payout every day," and practically every commercial miner today operates this way.

The cost is a centralization concern. A handful of large pools together control most of Bitcoin's hashpower at any given time. The pool operator is the one who decides which transactions go into the block template, so the operator effectively controls block contents on behalf of all the miners pointed at them. The underlying miners can switch pools if an operator misbehaves, and switching is fast with no lock-in, but the day-to-day power to censor or include transactions sits with a small number of pool operators rather than with the thousands of individual miners. This is one of the most-discussed structural tensions in Bitcoin and there's no clean fix to it.

## The coinbase transaction and the supply schedule

Every block has a special first transaction called the **coinbase transaction**. Unlike every other transaction in Bitcoin, the coinbase has no inputs from any prior UTXO. It creates value from nothing. The miner sets the value of its single output to whatever the protocol's current block subsidy is, plus the total fees from every other transaction in the block, and sends that to an address the miner controls.

This is the only mechanism that ever creates new BTC. Every bitcoin in circulation was originally minted as the output of some coinbase transaction by some miner at some point in the past.

The block subsidy starts at 50 BTC and halves every 210,000 blocks, which is roughly every four years. The halvings so far:

- Genesis (2009): subsidy was 50 BTC
- First halving (November 2012): dropped to 25 BTC
- Second halving (July 2016): dropped to 12.5 BTC
- Third halving (May 2020): dropped to 6.25 BTC
- Fourth halving (April 2024): dropped to 3.125 BTC, where it sits today
- Next halving (expected April 2028): will drop to 1.5625 BTC

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Bitcoin block subsidy halving, 50 BTC in 2009 down to 3.125 BTC by 2024</title><desc>A step chart shows the block subsidy in BTC on the y-axis and years from 2009 to 2028+ on the x-axis. The subsidy starts at 50 BTC and halves every 210,000 blocks, dropping to 25, 12.5, 6.25, and 3.125 BTC, approaching zero near year 2140 with total supply capped at 21 million.</desc>
  <line x1="60" y1="260" x2="680" y2="260" stroke="#000000" stroke-width="2"/>
  <line x1="60" y1="40" x2="60" y2="260" stroke="#000000" stroke-width="2"/>

<text x="40" y="265" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">0</text>
  <text x="40" y="200" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">12.5</text>
  <text x="40" y="140" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">25</text>
  <text x="40" y="80" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">50</text>

<text x="15" y="150" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" transform="rotate(-90 15 150)">block subsidy (BTC)</text>

<line x1="60" y1="80" x2="180" y2="80" stroke="#ed4937" stroke-width="3"/>
  <line x1="180" y1="80" x2="180" y2="140" stroke="#ed4937" stroke-width="3"/>
  <line x1="180" y1="140" x2="300" y2="140" stroke="#ed4937" stroke-width="3"/>
  <line x1="300" y1="140" x2="300" y2="200" stroke="#ed4937" stroke-width="3"/>
  <line x1="300" y1="200" x2="420" y2="200" stroke="#ed4937" stroke-width="3"/>
  <line x1="420" y1="200" x2="420" y2="230" stroke="#ed4937" stroke-width="3"/>
  <line x1="420" y1="230" x2="540" y2="230" stroke="#ed4937" stroke-width="3"/>
  <line x1="540" y1="230" x2="540" y2="245" stroke="#ed4937" stroke-width="3"/>
  <line x1="540" y1="245" x2="640" y2="245" stroke="#ed4937" stroke-width="3"/>
  <line x1="640" y1="245" x2="640" y2="253" stroke="#ed4937" stroke-width="3"/>
  <line x1="640" y1="253" x2="675" y2="255" stroke="#ed4937" stroke-width="3" stroke-dasharray="4 2"/>

<text x="120" y="270" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2009</text>
  <text x="180" y="280" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2012</text>
  <text x="300" y="280" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2016</text>
  <text x="420" y="280" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2020</text>
  <text x="540" y="280" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2024</text>
  <text x="640" y="290" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2028+</text>

<text x="120" y="75" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">50</text>
  <text x="240" y="135" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">25</text>
  <text x="360" y="195" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">12.5</text>
  <text x="480" y="220" text-anchor="middle" font-family="monospace" font-size="9" fill="#000000">6.25</text>
  <text x="595" y="237" text-anchor="middle" font-family="monospace" font-size="9" fill="#000000">3.125</text>

<text x="360" y="20" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Block subsidy halves every 210,000 blocks</text>
  <text x="360" y="305" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Asymptotically approaches zero around year 2140. Total supply caps at 21 million.</text>
</svg>

This schedule is enforced by the protocol. There's no governance body that can change it. A miner who tries to publish a block with an oversize coinbase output will have that block rejected by every honest node on the network. The constraint is structural.

Around the year 2140 the subsidy will drop to zero, and miners will be compensated only by transaction fees. The 21-million-coin cap follows from this halving schedule: each halving issues half as much as the previous, so the total approaches 21 million but never exceeds it. The cap isn't a separate rule. It's a consequence of the curve.

## Difficulty adjustment

One last mechanism keeps the system stable: the difficulty adjustment.

The proof-of-work target is what determines how hard it is to find a winning nonce. If global hashing power doubles overnight, and the target stays the same, blocks start coming faster than ten minutes apart. If global hashing power crashes, blocks come slower.

Either situation is bad for the network. So every 2,016 blocks (about every two weeks), every node recomputes the target. The recomputation is simple: if the last 2,016 blocks took longer than two weeks to produce, the target is loosened. If they took less, the target is tightened.

The effect is that long-run block times stay close to ten minutes regardless of how much hashing power is pointed at the network. The difficulty has risen by roughly a factor of 100 trillion since Bitcoin launched in 2009. The block time has stayed at ten minutes the whole way.
