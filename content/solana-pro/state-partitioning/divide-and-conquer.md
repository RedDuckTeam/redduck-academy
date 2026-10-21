---
title: Divide and conquer
type: lecture
order: 10
---

Traditionally, in algorithms, "divide and conquer" means splitting a task into independent parts, solving each part on its own, and merging the results. On Solana, the same pattern is used but for the purposes of architecting programs around the chain's constraints.

**Context:** On Solana, transactions are limited in size, programs are limited in compute (amount of operations), and every single change to a dynamic structure in an account rewrites the account fully (even if you change one byte out of a thousand, you write a thousand bytes again).

**Pattern:** Divide data into partitions that can be stored separately, while retaining a central storage for the result of those partitions. Users interact only with the very partitions they need in order to execute their actions, making the transactions as minimal as they can be.

Depending on the program specifics, **[Pay-As-You-Act](/courses/solana-pro/cost-distribution/pay-as-you-act)** can be utilized in order to update the central storage within the same transaction where the partitioned state is accessed. If it's not necessary or not optimal, the **Pay-As-You-Act** pattern may not be used.

## Examples

**Orca DEX.** All ticks are stored virtually, with only the active ones referenced in the programs directly. The ones that are inactive are not referenced in the program instructions, thus significantly optimizing the transactions. Orca Whirlpools is a concentrated liquidity DEX: liquidity providers pick a price range, prices are split into small steps called ticks, and each tick records how much liquidity starts or ends at that price. With the smallest price steps a pool has about 887,000 possible ticks, far more than one account can hold, so Orca groups ticks into tick arrays, separate accounts of 88 ticks each. A tick array exists only once someone opens a position in that range. The pool account is the central state: it holds the current price, the current tick and the active liquidity. A swap passes the pool account and up to three tick arrays, the ones the price can move through, and every other tick array stays out of the transaction. The same swap updates the price and liquidity in the pool account, which is **Pay-As-You-Act** at work.

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

**Compressed NFTs (Bubblegum).** A million NFTs live in one account as a Merkle tree. Leaves are hashed in pairs, level by level, up to a single root, and that root stands for all million. To prove or change one NFT, the client brings the leaf and the hashes along its path, about twenty for a million leaves, since 2^20 is 1,048,576. The program recomputes the root and compares it with the stored one; if they match, the leaf is really in the tree, so its owner and data are correct. The partitions here are not accounts at all: indexers keep the NFT data off-chain, reading it from the transactions that created and changed each NFT. The top levels of the tree are stored in the account (the canopy), so the client sends only the bottom of the path, and the account also keeps a short history of recent roots, so a proof built against a slightly older root is still accepted.

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

**ZK Compression** does the same for any account and adds one more merge on top: proofs for several accounts fold into one proof of fixed size, however many the transaction should touch. Each account's data is a leaf in a Merkle tree, the transaction brings the data when an action needs it, and instead of a path of hashes per account it carries one zero-knowledge proof that all of its accounts are in their trees. The proof is always 128 bytes, whether it covers one account or several.
