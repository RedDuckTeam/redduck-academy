---
id: 1258489134
title: Complexity asymmetry
type: lecture
order: 20
---

To decide which algorithm is best to use, engineers consider the complexities in memory and computations, and based on the trade-offs between the two and the specific usage of operations (search, insert, etc.), they decide which algorithm is the most applicable for a specific problem.

Web3 and on-chain programs are not different, but they introduce one more variable for engineers to consider: **on-chain complexity**.

On-chain complexity can be very different from the overall complexity. You can have O(1) search and insert operations on-chain, while the general O(N) complexity is shifted fully onto the off-chain layer.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Complexity asymmetry</title><desc>A scale with two sides. The off-chain side holds a big block labeled search, O of n. The on-chain side holds a tiny block labeled check, O of 1. An arrow carries the found position from off-chain to on-chain.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Complexity asymmetry</text>
  <text x="190" y="90" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">off-chain</text>
  <text x="530" y="90" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">on-chain</text>
  <rect x="90" y="105" width="200" height="110" rx="0" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="150" text-anchor="middle" font-size="13" fill="#000000" font-family="monospace" font-weight="bold">search</text>
  <text x="190" y="175" text-anchor="middle" font-size="14" fill="#000000" font-family="monospace" font-weight="bold">O(n)</text>
  <line x1="295" y1="160" x2="434.0" y2="160.0" stroke="#ed4937" stroke-width="3"/>
  <polygon points="434.0,154.0 434.0,166.0 445,160" fill="#ed4937"/>
  <text x="370" y="150" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace">position</text>
  <rect x="450" y="140" width="100" height="40" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="500" y="158" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">check</text>
  <text x="500" y="172" text-anchor="middle" font-size="11" fill="#ed4937" font-family="monospace" font-weight="bold">O(1)</text>
  <line x1="60" y1="225" x2="660" y2="225" stroke="#565653" stroke-width="1"/>
  <text x="360" y="250" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The client does the heavy part for free. The program only verifies, and its cost never grows.</text>
</svg>

## Examples

**Sorted linked list.** That's a surprisingly frequently used data structure in web3, and the reason behind this is that even though the algorithm for finding and inserting an element into it is generally inefficient due to O(n) for both operations, it is possible to turn both operations into O(1) on-chain, while shifting the O(n) off-chain, making it extremely efficient for on-chain purposes.

* **Here's how:** let the client-side find the position of the element and send it in, and have your program only check it. That way, the client-side would spend O(n) computations to find the position, but your program would benefit from it by optimizing itself into O(1) complexity by just checking a few positions in a constant time. This holds only if the program reads just the elements it needs, as a zero-copy account allows; if it deserializes the whole account, it pays for every element on every call.
* **Monaco Protocol's order book is this list.** The book is a fixed set of cells in one account, and each order points to its price neighbors by cell number. Orders are sorted from the highest price to the lowest, and a new order takes any free cell, so cell numbers do not follow the price. The client computes where the new order goes and sends "after this order". The program checks three things: the left neighbor is not cheaper, the right neighbor is cheaper, both are alive. Because the right neighbor must be strictly cheaper, a new order always goes after older orders at the same price, so those fill first. That check costs the same at any depth, and the capacity is fixed, so nobody can inflate the book past what fits. The downside is a hard limit on open orders, so each order locks some of its owner's funds to make filling every free cell expensive.

**Compressed NFTs (Bubblegum)** do it for memory optimization. A million NFTs are one account with one Merkle root hash. The full Merkle tree lives off-chain with an indexer. To change one NFT, the client brings the leaf and about twenty hashes along its path, except the top levels the account already keeps in its canopy, and the program recomputes the root and compares. **On-chain memory is O(1)**, since the account's size does not grow as NFTs are minted; **the on-chain check is O(log n)**, one path from leaf to root; **and the O(n) part lives with the indexer**. On Solana the usual way to store a million records is a million PDAs, each with its own rent deposit, and a Merkle tree replaces all of them with one account holding one root.

**Merkle trees** such as in Bubblegum are the worst data structure you can imagine using for a normal traditional program. With web3 programs however, it is one of the most popular and frequently used ones.

***Important to remember:*** the reason why we don't want any high complexity (higher than O(log N)) on-chain is because it makes it easy to just spam the program with data and make it no longer fit the compute limit, after which nobody could use it. This is also frequently referred to as a "DoS attack". In most protocols anyone can add data, by opening an order, creating a position or minting an item, so the work inside an instruction should not grow with data anyone can add, or should grow very slowly: O(log n) is fine, a loop over a fixed-size list is safe too, and anything heavier belongs off-chain.
