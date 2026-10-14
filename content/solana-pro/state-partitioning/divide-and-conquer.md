---
title: Divide and conquer
type: lecture
order: 10
faq:
  - question: What does divide and conquer mean in Solana program design?
    answer: >-
      Splitting a program's state into many small accounts, called partitions, and keeping
      one central account with the values every action needs, such as a total, a price or a
      Merkle root. Each transaction carries only the partitions its action needs.
  - question: Why not keep all of my program's state in one big account?
    answer: >-
      Because it gets more expensive as it grows. Anchor deserializes the whole account in
      every instruction that uses it, the heap is 32 KiB by default, an account can never
      grow past 10 MiB, and transactions that write the same account cannot run in parallel.
  - question: Which tick accounts does an Orca Whirlpools swap need?
    answer: >-
      The pool account plus up to three tick arrays, the ones the price can move through
      during the swap. Each tick array holds 88 ticks. The client works out which arrays to
      pass.
  - question: How many hashes does a compressed NFT proof need?
    answer: >-
      One per tree level, so about 20 for a tree of a million NFTs. At 32 bytes each that is
      640 bytes. A canopy of 10 levels stored in the tree account cuts it to 10 hashes, 320
      bytes.
  - question: What is the canopy in a Bubblegum Merkle tree?
    answer: >-
      The top levels of the tree, stored in the tree account itself. The program already has
      those hashes, so the client only sends the bottom part of each proof. A 10-level canopy
      holds about 2,000 hashes, around 65 KB that the tree creator pays rent for.
  - question: How is ZK Compression different from compressed NFTs?
    answer: >-
      It applies the same Merkle tree idea to any account. It also replaces the per-account
      paths of hashes with one zero-knowledge proof of 128 bytes that covers several accounts
      at once.
---

> A Solana transaction is small, compute is limited, and one big account gets more expensive with every user. Divide and conquer splits a program's state into many small accounts and keeps the shared values in one central account. Each transaction touches only the parts its action needs, so its cost depends only on the action.

## From algorithms to accounts

In algorithms, divide and conquer means splitting a task into independent parts, solving each part on its own, and merging the results. Solana programs use the same idea for their state. The parts are accounts, the combined values live in one central account, and the reason to split is the chain's limits.

## Why one big account stops working

Remember from the [constraints lecture](/courses/solana-pro/welcome/constraints-behind-patterns) that a transaction is small and bounded. A program that keeps all its state in one account runs into those limits as it grows.

A transaction can use at most 1.4 million compute units, so any work that grows with the size of the data stops fitting at some point. An account can never grow past 10 MiB.

An account is also read as a whole. With Anchor's `Account` type, the program deserializes the full account when the instruction starts and, if the account is mutable, writes all of it back at the end. Change one byte in a 10,000-byte account, and the program still processes 10,000 bytes. The data also has to fit in the program's heap, 32 KiB by default and 256 KiB at most, so a regular Anchor account stops working long before 10 MiB. Zero-copy accounts skip the deserialization and the heap, but a loop over their data still runs into the compute limit, and they still cannot grow past 10 MiB.

There is one more cost. Solana runs transactions in parallel, but two transactions that write the same account cannot run at the same time. If every user writes to one account, their transactions run one after another.

## Split the state, keep shared values in one place

The pattern is to store the data in many small accounts, called partitions, and keep one central account with the values every action needs, such as a total, the current price or a Merkle root. A transaction includes only the partitions its action needs, plus the central account.

The 1232-byte transaction limit works the other way. A transaction lists only the address of each account, 32 bytes however big the account is. So one big account is cheap to include, and every partition an action needs adds another 32 bytes. A good split keeps that number small for every action.

Often the same transaction also updates the central account, so the user who acts pays to keep it current. We call this Pay-As-You-Act. Some programs update the central account separately instead, when doing it in every transaction is not needed or costs too much. That update can be a job that anyone can call, like the ones in the [untrusted executor lecture](/courses/solana-pro/permissionless-execution/untrusted-executor).

## Orca: only the ticks a swap crosses

Orca Whirlpools is a concentrated liquidity DEX. Liquidity providers choose a price range for their liquidity. Prices are split into small steps called ticks, and each tick records how much liquidity starts or ends at that price. A pool with the finest price steps has about 887,000 possible ticks. At 113 bytes per tick, that is around 100 MB, about ten times what one account can hold. Even where they fit, every swap would load and save all of them to use only a few.

So Orca splits them. Ticks are grouped into tick arrays, separate accounts of 88 ticks each. A tick array exists only if someone created it, usually a liquidity provider opening a position in that range. A price range where nobody has ever opened a position has no account at all. The pool account is the central state. It holds the current price, the current tick and the active liquidity.

A swap passes the pool account and up to three tick arrays, the ones the price can move through during this swap. The client works out which arrays those are. Every other tick array stays out of the transaction, so the program loads at most 264 ticks however many the pool has. The swap also updates the price and liquidity in the pool account in the same transaction, which is Pay-As-You-Act at work.

The split has costs too. A swap can only move the price as far as the tick arrays it was given, so the client has to pick them correctly. And splitting does not remove the write lock on the central account. Every Orca swap writes its pool account, so swaps in one pool run one after another, while swaps in different pools run in parallel. To get more parallel writes, a program writes the central account only in the actions that must change it, or splits the central account too, for example into several Merkle trees for one collection.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>One Orca pool split into tick arrays</title><desc>A pool account at the top holds the central state: current price, current tick and active liquidity. Below it is a row of five tick arrays ordered by price. The middle three are highlighted as the ones passed to this swap and chosen by the client. The current price sits in the first highlighted array and moves toward higher prices during the swap. The first tick array exists but is not in this swap, and the last one has no account because nobody ever opened a position in that range.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">One pool, many tick arrays</text>

  <rect x="235" y="75" width="250" height="78" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="235" y="75" width="250" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="93" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">pool account, central state</text>
  <text x="360" y="121" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">current price, current tick</text>
  <text x="360" y="139" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">active liquidity</text>

  <line x1="300" y1="153" x2="240" y2="205" stroke="#ed4937" stroke-width="1.5"/>
  <line x1="360" y1="153" x2="360" y2="205" stroke="#ed4937" stroke-width="1.5"/>
  <line x1="420" y1="153" x2="480" y2="205" stroke="#ed4937" stroke-width="1.5"/>

  <rect x="70" y="205" width="100" height="52" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="120" y="227" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">tick array</text>
  <text x="120" y="244" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">88 ticks</text>
  <text x="120" y="272" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">not in this swap</text>
  <rect x="190" y="205" width="100" height="52" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="240" y="227" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">tick array</text>
  <text x="240" y="244" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">88 ticks</text>
  <rect x="310" y="205" width="100" height="52" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="227" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">tick array</text>
  <text x="360" y="244" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">88 ticks</text>
  <rect x="430" y="205" width="100" height="52" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="480" y="227" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">tick array</text>
  <text x="480" y="244" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">88 ticks</text>
  <rect x="550" y="205" width="100" height="52" fill="none" stroke="#565653" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="600" y="227" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#565653">no account</text>
  <text x="600" y="244" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">never created</text>

  <line x1="190" y1="272" x2="530" y2="272" stroke="#ed4937" stroke-width="2"/>
  <line x1="190" y1="265" x2="190" y2="272" stroke="#ed4937" stroke-width="2"/>
  <line x1="530" y1="265" x2="530" y2="272" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="290" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">passed to this swap, chosen by the client</text>

  <line x1="150" y1="311" x2="562" y2="311" stroke="#565653" stroke-width="1"/>
  <polygon points="560,307 560,315 570,311" fill="#565653"/>
  <text x="140" y="314" text-anchor="end" font-family="monospace" font-size="9" fill="#565653">lower price</text>
  <text x="578" y="314" font-family="monospace" font-size="9" fill="#565653">higher price</text>
  <line x1="219" y1="311" x2="512" y2="311" stroke="#ed4937" stroke-width="2.5"/>
  <polygon points="510,306 510,316 520,311" fill="#ed4937"/>
  <circle cx="215" cy="311" r="4.5" fill="#ed4937"/>
  <text x="215" y="330" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937">current price</text>
  <text x="390" y="330" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937">price moves this way during the swap</text>

  <text x="360" y="362" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A swap carries the pool and only the tick arrays its price can cross.</text>
</svg>

## Compressed NFTs: a million NFTs in one account

A regular NFT is several accounts, such as a mint, a metadata account and a token account. A million NFTs means millions of accounts, each with its own rent deposit. Bubblegum, Metaplex's compressed NFT program, keeps a million NFTs in one account.

It stores them as a [Merkle tree](/courses/blockchain-basics/cryptography/merkle-trees). Each NFT is a leaf, a hash of the NFT's data. Leaves are hashed in pairs, level by level, up to a single hash at the top, the root. Change one bit in any leaf and the root changes, so the root protects every NFT in the tree. The account keeps the root and a short history of recent changes. A client builds its proof against the root it last saw. If another update lands first, the history lets the program still accept that proof.

Here the partitions are not accounts at all. The NFT data is kept off-chain by indexers, which read it from the transactions that created and changed each NFT. When an action needs one NFT, the client brings that NFT's data in the transaction, and the root lets the program check it.

To make that check possible, the client also brings the hashes along the leaf's path to the root, one hash per level. A tree with a million leaves has 20 levels, because 2^20 is 1,048,576, so the path is 20 hashes. The program recomputes the root from the leaf and the path and compares it with the stored root. If they match, the leaf the client sent is really in the tree, so its owner and data are correct.

Twenty hashes of 32 bytes each is 640 bytes, more than half of a 1232-byte transaction. So the tree account also stores the top levels of the tree, called the canopy. With a canopy of 10 levels, the program already has the upper half of every path, and the client sends only the bottom 10 hashes, 320 bytes. The canopy has a cost. Ten levels hold about 2,000 hashes, around 65 KB, and the tree creator pays rent for all of it up front. A deeper canopy means a bigger account and shorter proofs.

<svg role="img" viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Proving one NFT in a Merkle tree with a canopy</title><desc>A Merkle tree with eight NFT leaves, four hashes on the next level, two on the level above, and the root at the top. The root and the level below it are stored in the on-chain account, the canopy. To prove NFT 5, the client sends the leaf and two hashes, NFT 4 and h67. The program takes h0-3 from the canopy, rebuilds the root along the path from NFT 5 and compares it with the stored root. A real tree of a million leaves has 20 levels.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Proving one NFT with a canopy</text>

  <rect x="40" y="80" width="640" height="118" fill="none" stroke="#ed4937" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="52" y="98" font-family="monospace" font-size="10" font-weight="bold">on-chain account</text>
  <text x="52" y="112" font-family="monospace" font-size="9" fill="#565653">root + canopy</text>

  <line x1="200" y1="160" x2="360" y2="121" stroke="#565653" stroke-width="1"/>
  <line x1="520" y1="160" x2="360" y2="121" stroke="#ed4937" stroke-width="2"/>
  <line x1="120" y1="225" x2="200" y2="186" stroke="#565653" stroke-width="1"/>
  <line x1="280" y1="225" x2="200" y2="186" stroke="#565653" stroke-width="1"/>
  <line x1="440" y1="225" x2="520" y2="186" stroke="#ed4937" stroke-width="2"/>
  <line x1="600" y1="225" x2="520" y2="186" stroke="#565653" stroke-width="1"/>
  <line x1="80" y1="290" x2="120" y2="251" stroke="#565653" stroke-width="1"/>
  <line x1="160" y1="290" x2="120" y2="251" stroke="#565653" stroke-width="1"/>
  <line x1="240" y1="290" x2="280" y2="251" stroke="#565653" stroke-width="1"/>
  <line x1="320" y1="290" x2="280" y2="251" stroke="#565653" stroke-width="1"/>
  <line x1="400" y1="290" x2="440" y2="251" stroke="#565653" stroke-width="1"/>
  <line x1="480" y1="290" x2="440" y2="251" stroke="#ed4937" stroke-width="2"/>
  <line x1="560" y1="290" x2="600" y2="251" stroke="#565653" stroke-width="1"/>
  <line x1="640" y1="290" x2="600" y2="251" stroke="#565653" stroke-width="1"/>

  <rect x="328" y="95" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="112" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">root</text>

  <rect x="168" y="160" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="200" y="177" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">h0-3</text>
  <rect x="488" y="160" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="520" y="177" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">h4-7</text>

  <rect x="88" y="225" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="120" y="242" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">h01</text>
  <rect x="248" y="225" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="280" y="242" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">h23</text>
  <rect x="408" y="225" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="440" y="242" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">h45</text>
  <rect x="568" y="225" width="64" height="26" fill="#565653" stroke="#000000" stroke-width="2"/>
  <text x="600" y="242" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ffffff">h67</text>

  <rect x="48" y="290" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="80" y="307" text-anchor="middle" font-family="monospace" font-size="10">nft 0</text>
  <rect x="128" y="290" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="160" y="307" text-anchor="middle" font-family="monospace" font-size="10">nft 1</text>
  <rect x="208" y="290" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="240" y="307" text-anchor="middle" font-family="monospace" font-size="10">nft 2</text>
  <rect x="288" y="290" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="320" y="307" text-anchor="middle" font-family="monospace" font-size="10">nft 3</text>
  <rect x="368" y="290" width="64" height="26" fill="#565653" stroke="#000000" stroke-width="2"/>
  <text x="400" y="307" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ffffff">nft 4</text>
  <rect x="448" y="290" width="64" height="26" fill="#e0deda" stroke="#ed4937" stroke-width="2.5"/>
  <text x="480" y="307" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">nft 5</text>
  <rect x="528" y="290" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="560" y="307" text-anchor="middle" font-family="monospace" font-size="10">nft 6</text>
  <rect x="608" y="290" width="64" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="640" y="307" text-anchor="middle" font-family="monospace" font-size="10">nft 7</text>

  <text x="360" y="338" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">8 leaves shown. A tree of a million leaves has 20 levels.</text>

  <rect x="95" y="350" width="14" height="14" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="115" y="361" font-family="monospace" font-size="10">NFT being proven</text>
  <rect x="275" y="350" width="14" height="14" fill="#565653" stroke="#000000" stroke-width="1"/>
  <text x="295" y="361" font-family="monospace" font-size="10">hashes the client sends</text>
  <rect x="495" y="350" width="14" height="14" fill="none" stroke="#ed4937" stroke-width="1.5" stroke-dasharray="3 2"/>
  <text x="515" y="361" font-family="monospace" font-size="10">stored in the account</text>

  <text x="360" y="392" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The program rebuilds the root from the leaf, the hashes the client sends</text>
  <text x="360" y="408" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">and the canopy, then compares it with the stored root.</text>
</svg>

## ZK Compression: one proof for many accounts

ZK Compression does the same for any account. An account's data is hashed into a leaf of a Merkle tree, and the transaction brings the data when an action needs it. Instead of a path of hashes for each account, the transaction carries one zero-knowledge proof that all of its accounts are stored in the trees. The proof is always 128 bytes, whether it covers one account or several. The account data itself still has to fit in the transaction, and checking the proof costs about 100,000 compute units.

## Find the partitions in your own state

Look at every account your program writes. If an account grows with the number of users, orders, positions or items, it will reach one of the limits above sooner or later. For each such account, ask two questions. What does a single action actually need to read and write? That part becomes a partition. What do all actions need to agree on? That part stays in the central account. Then decide how the central account stays current, in the same transaction with Pay-As-You-Act or separately, and whether one central account can handle all the writes. Once the split is right, a transaction only pays for the action it performs.
