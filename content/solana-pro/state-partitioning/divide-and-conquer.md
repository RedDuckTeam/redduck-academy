---
id: 1310294431
title: Divide and conquer
type: lecture
order: 10
---

Traditionally, in algorithms, "divide and conquer" means splitting a task into independent parts, solving each part on its own, and merging the results. On Solana, the same pattern is used but for the purposes of architecting programs around the chain's constraints.

**Context:** On Solana, transactions are limited in size, programs are limited in compute (amount of operations), and every single change to a dynamic structure in an account rewrites the account fully (even if you change one byte out of a thousand, you write a thousand bytes again).

**Pattern:** Divide data into partitions that can be stored separately, while retaining a central storage for the result of those partitions. Users interact only with the very partitions they need in order to execute their actions, making the transactions as minimal as they can be.

Depending on the program specifics, **[Pay-As-You-Act](/courses/solana-pro/cost-distribution/pay-as-you-act)** can be utilized in order to update the central storage within the same transaction where the partitioned state is accessed. If it's not necessary or not optimal, the **Pay-As-You-Act** pattern may not be used.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Divide and conquer</title><desc>Left: one big account crossed out. Right: the same data split into a grid of small partition accounts plus one central account on top. A transaction touches only one highlighted partition and the central account.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Divide and conquer</text>
  <rect x="60" y="100" width="150" height="130" rx="0" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="135" y="170" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">one big account</text>
  <line x1="128" y1="193" x2="142" y2="207" stroke="#ed4937" stroke-width="3"/>
  <line x1="128" y1="207" x2="142" y2="193" stroke="#ed4937" stroke-width="3"/>
  <line x1="220" y1="165" x2="279.0" y2="165.0" stroke="#000000" stroke-width="2"/>
  <polygon points="279.0,159.0 279.0,171.0 290,165" fill="#000000"/>
  <rect x="400" y="86" width="120" height="34" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="460" y="108" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">central</text>
  <rect x="300" y="135" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="362" y="135" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="424" y="135" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="486" y="135" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="548" y="135" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="300" y="169" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="362" y="169" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="424" y="169" width="54" height="26" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <rect x="486" y="169" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="548" y="169" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="300" y="203" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="362" y="203" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="424" y="203" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="486" y="203" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="548" y="203" width="54" height="26" rx="0" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <line x1="424" y1="262" x2="424.0" y2="249.0" stroke="#ed4937" stroke-width="3"/>
  <polygon points="418.0,249.0 430.0,249.0 424,238" fill="#ed4937"/>
  <text x="424" y="276" text-anchor="middle" font-size="9" fill="#ed4937" font-family="monospace" font-weight="bold">a transaction touches this partition and the central account</text>
  <line x1="424" y1="135" x2="460" y2="120" stroke="#ed4937" stroke-width="2"/>
</svg>

## Examples

**Orca DEX.** All ticks are stored virtually, with only the active ones referenced in the programs directly. The ones that are inactive are not referenced in the program instructions, thus significantly optimizing the transactions. Orca Whirlpools is a concentrated liquidity DEX: liquidity providers pick a price range, prices are split into small steps called ticks, and each tick records how much liquidity starts or ends at that price. With the smallest price steps a pool has about 887,000 possible ticks, far more than one account can hold, so Orca groups ticks into tick arrays, separate accounts of 88 ticks each. A tick array exists only once someone opens a position in that range. The pool account is the central state: it holds the current price, the current tick and the active liquidity. A swap passes the pool account and up to three tick arrays, the ones the price can move through, and every other tick array stays out of the transaction. The same swap updates the price and liquidity in the pool account, which is **Pay-As-You-Act** at work.

**Compressed NFTs (Bubblegum).** A million NFTs live in one account as a Merkle tree. Leaves are hashed in pairs, level by level, up to a single root, and that root stands for all million. To prove or change one NFT, the client brings the leaf and the hashes along its path, about twenty for a million leaves, since 2^20 is 1,048,576. The program recomputes the root and compares it with the stored one; if they match, the leaf is really in the tree, so its owner and data are correct. The partitions here are not accounts at all: indexers keep the NFT data off-chain, reading it from the transactions that created and changed each NFT. The top levels of the tree are stored in the account (the canopy), so the client sends only the bottom of the path, and the account also keeps a short history of recent roots, so a proof built against a slightly older root is still accepted.

**ZK Compression** does the same for any account and adds one more merge on top: proofs for several accounts fold into one proof of fixed size, however many the transaction should touch. Each account's data is a leaf in a Merkle tree, the transaction brings the data when an action needs it, and instead of a path of hashes per account it carries one zero-knowledge proof that all of its accounts are in their trees. The proof is always 128 bytes, whether it covers one account or several.
