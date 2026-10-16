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

> A Solana transaction is small, compute is limited, and one big account gets more expensive with every user. Divide and conquer splits a program's state into many small accounts and keeps the values every action needs in one central account. A transaction touches only the accounts its action needs, so its cost stays the same however big the program grows.

## From algorithms to accounts

In algorithms, divide and conquer means splitting a task into independent parts, solving each on its own, and merging the results. Solana programs split their state the same way, because of the chain's limits. Each part is a separate account, and values that combine all the parts, like a total, live in one central account.

## Why one big account stops working

Remember from the [constraints lecture](/courses/solana-pro/welcome/constraints-behind-patterns) that a transaction is small and bounded. Keep all of your program's state in one account, and you hit those limits as the program grows.

A transaction can use at most 1.4 million compute units, so work that grows with the data, like a loop over every user, eventually stops fitting. An account can never grow past 10 MiB.

With Anchor's `Account` type, the program deserializes the whole account when the instruction starts and, if the account is mutable, writes all of it back at the end. Change one byte in a 10,000-byte account, and the program still processes all 10,000. The data must also fit in the program's heap, which is 32 KiB by default and 256 KiB at most. So a regular Anchor account stops working long before 10 MiB. Zero-copy accounts skip deserialization and the heap, but a loop over their data still hits the compute limit.

Solana also runs transactions in parallel, except those that write the same account. If every user writes to one account, their transactions run one after another.

## Split the state, keep shared values in one place

The pattern is to store the data in many small accounts, called partitions, plus one central account with the values every action needs, such as a total, the current price or a Merkle root. A transaction includes only the partitions its action needs and the central account.

Splitting has one cost. Every account a transaction uses adds its 32-byte address to the 1232-byte limit, however big the account is. One big account takes 32 bytes, and every partition adds 32 more, so a good split keeps each action to a few partitions.

Often the transaction that changes a partition also updates the central account, so the user who acts pays to keep it current. We call this Pay-As-You-Act. When that is not needed or costs too much, programs update the central account separately, for example with a job anyone can call, like those in the [untrusted executor lecture](/courses/solana-pro/permissionless-execution/untrusted-executor).

## Orca: only the ticks a swap crosses

Orca Whirlpools is a concentrated liquidity DEX. Liquidity providers pick a price range, and prices are split into small steps called ticks. Each tick records how much liquidity starts or ends at that price.

With the smallest price steps, a pool has about 887,000 possible ticks. At 113 bytes each, that is around 100 MB, ten times what one account can hold. Even in pools with fewer ticks, every swap would load and save all of them to use a few.

So Orca groups ticks into tick arrays, separate accounts of 88 ticks each. A tick array exists only once someone creates it, usually a liquidity provider opening a position in that range. A range where nobody has ever opened a position has no account at all. The pool account is the central state, holding the current price, the current tick and the active liquidity.

A swap passes the pool account and up to three tick arrays, the ones the price can move through. The client picks them, and every other tick array stays out of the transaction. So the program loads at most 264 ticks, three arrays of 88, however many the pool has. The same swap updates the price and liquidity in the pool account, which is Pay-As-You-Act at work.

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

The split has costs. A swap can only move the price as far as its tick arrays reach, so the client must pick them correctly. And every swap still writes its pool account, so swaps in one pool run one after another, while swaps in different pools run in parallel.

## Compressed NFTs: a million NFTs in one account

A regular NFT is several accounts, such as a mint, a metadata account and a token account, each with its own rent deposit. Bubblegum, Metaplex's compressed NFT program, keeps a million NFTs in one account.

It stores them as a [Merkle tree](/courses/blockchain-basics/cryptography/merkle-trees). Each NFT is a leaf, a hash of its data, and leaves are hashed in pairs, level by level, up to a single root. Change one bit in any leaf and the root changes, so storing the root protects every NFT in the tree.

The partitions here are not accounts at all. Indexers keep the NFT data off-chain, reading it from the transactions that created and changed each NFT. When an action needs an NFT, the client brings its data, and the program checks it against the root.

To make that check possible, the client also sends the hashes along the leaf's path to the root, one per level. A million leaves means 20 levels, since 2^20 is 1,048,576, so the path is 20 hashes. The program recomputes the root and compares it with the stored one. If they match, the leaf is really in the tree, so its owner and data are correct.

The account also keeps a short history of recent changes. A client builds its proof against the root it last saw, and if another update lands first, the history lets the program still accept that proof.

Twenty 32-byte hashes take 640 bytes, more than half of a 1232-byte transaction. So the tree account also stores the top levels of the tree, called the canopy. With a 10-level canopy, the client sends only the bottom 10 hashes, 320 bytes. The canopy has a cost. Ten levels hold about 2,000 hashes, around 65 KB, and the tree creator pays rent for all of it up front. A deeper canopy means shorter proofs and a bigger account.

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

ZK Compression applies the same idea to any account. Each account's data is a leaf in a Merkle tree, and the transaction brings the data when an action needs it. Instead of a path of hashes per account, the transaction carries one zero-knowledge proof that all of its accounts are in their trees. The proof is always 128 bytes, whether it covers one account or several. The account data still has to fit in the transaction, and checking the proof costs about 100,000 compute units.

## Find the partitions in your own state

Look at every account your program writes. If one grows with the number of users, orders, positions or items, it will hit one of the limits above.

For each such account, ask what a single action needs to read and write. That part becomes a partition. What all actions must agree on stays in the central account.

Then decide how the central account stays current, with Pay-As-You-Act or separately. Also check whether one central account can take all the writes. If it can't, write it only in the actions that must change it, or split it too, for example into several Merkle trees for one NFT collection.

Once the split is right, a transaction pays only for its own action.
