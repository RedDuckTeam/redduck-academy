---
title: Complexity asymmetry
type: lecture
order: 20
---

To decide which algorithm is best to use, engineers consider the complexities in memory and computations, and based on the trade-offs between the two and the specific usage of operations (search, insert, etc.), they decide which algorithm is the most applicable for a specific problem.

Web3 and on-chain programs are not different, but they introduce one more variable for engineers to consider: **on-chain complexity**.

On-chain complexity can be very different from the overall complexity. You can have O(1) search and insert operations on-chain, while the general O(N) complexity is shifted fully onto the off-chain layer.

## Examples

**Sorted linked list.** That's a surprisingly frequently used data structure in web3, and the reason behind this is that even though the algorithm for finding and inserting an element into it is generally inefficient due to O(n) for both operations, it is possible to turn both operations into O(1) on-chain, while shifting the O(n) off-chain, making it extremely efficient for on-chain purposes.

* **Here's how:** let the client-side find the position of the element and send it in, and have your program only check it. That way, the client-side would spend O(n) computations to find the position, but your program would benefit from it by optimizing itself into O(1) complexity by just checking a few positions in a constant time. This holds only if the program reads just the elements it needs, as a zero-copy account allows; if it deserializes the whole account, it pays for every element on every call.
* **Monaco Protocol's order book is this list.** The book is a fixed set of cells in one account, and each order points to its price neighbors by cell number. Orders are sorted from the highest price to the lowest, and a new order takes any free cell, so cell numbers do not follow the price. The client computes where the new order goes and sends "after this order". The program checks three things: the left neighbor is not cheaper, the right neighbor is cheaper, both are alive. Because the right neighbor must be strictly cheaper, a new order always goes after older orders at the same price, so those fill first. That check costs the same at any depth, and the capacity is fixed, so nobody can inflate the book past what fits. The downside is a hard limit on open orders, so each order locks some of its owner's funds to make filling every free cell expensive.

<svg role="img" viewBox="0 0 720 440" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Inserting into a sorted list on-chain</title><desc>A row of six orders sorted by price, from 2.40 down to 2.00, stored in cells with out-of-order numbers and linked to each other. Off-chain, the client walks the list to find the place for a new order at price 2.20, which costs O(n). It sends "after cell 5". On-chain, the program checks three things in O(1): the left neighbor, cell 5 at 2.20, is not cheaper, the right neighbor, cell 2 at 2.10, is cheaper, and both cells hold open orders.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Inserting into a sorted list on-chain</text>

  <text x="252" y="88" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">off-chain, the client walks the list, O(n)</text>
  <line x1="45" y1="100" x2="450" y2="100" stroke="#565653" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polygon points="449,95 449,105 459,100" fill="#565653"/>

  <line x1="135" y1="140" x2="153" y2="140" stroke="#000000" stroke-width="2"/>
  <line x1="243" y1="140" x2="261" y2="140" stroke="#000000" stroke-width="2"/>
  <line x1="351" y1="140" x2="369" y2="140" stroke="#000000" stroke-width="2"/>
  <line x1="459" y1="140" x2="477" y2="140" stroke="#565653" stroke-width="1" stroke-dasharray="2 2"/>
  <line x1="567" y1="140" x2="585" y2="140" stroke="#000000" stroke-width="2"/>

  <rect x="45" y="118" width="90" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="90" y="136" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">cell 3</text>
  <text x="90" y="152" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">price 2.40</text>
  <rect x="153" y="118" width="90" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="198" y="136" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">cell 7</text>
  <text x="198" y="152" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">price 2.30</text>
  <rect x="261" y="118" width="90" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="306" y="136" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">cell 0</text>
  <text x="306" y="152" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">price 2.20</text>
  <rect x="369" y="118" width="90" height="44" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="414" y="136" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">cell 5</text>
  <text x="414" y="152" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">price 2.20</text>
  <rect x="477" y="118" width="90" height="44" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="522" y="136" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">cell 2</text>
  <text x="522" y="152" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">price 2.10</text>
  <rect x="585" y="118" width="90" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="630" y="136" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">cell 6</text>
  <text x="630" y="152" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">price 2.00</text>

  <line x1="440" y1="205" x2="414" y2="163" stroke="#ed4937" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="496" y1="205" x2="522" y2="163" stroke="#ed4937" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="404" y="190" text-anchor="end" font-family="monospace" font-size="9" fill="#ed4937">left</text>
  <text x="532" y="190" font-family="monospace" font-size="9" fill="#ed4937">right</text>
  <rect x="403" y="205" width="130" height="44" fill="#e0deda" stroke="#ed4937" stroke-width="2.5"/>
  <text x="468" y="223" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">new order</text>
  <text x="468" y="239" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">price 2.20</text>
  <text x="468" y="270" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">client sends "after cell 5"</text>

  <rect x="130" y="290" width="460" height="86" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="130" y="290" width="460" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="308" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">on-chain, the program checks three things, O(1)</text>
  <text x="150" y="335" font-family="monospace" font-size="10">1. left neighbor is not cheaper</text>
  <text x="450" y="335" font-family="monospace" font-size="10" fill="#565653">2.20 &gt;= 2.20</text>
  <text x="150" y="352" font-family="monospace" font-size="10">2. right neighbor is cheaper</text>
  <text x="450" y="352" font-family="monospace" font-size="10" fill="#565653">2.10 &lt; 2.20</text>
  <text x="150" y="369" font-family="monospace" font-size="10">3. both cells hold open orders</text>

  <text x="360" y="406" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The client does the O(n) walk off-chain, and the program</text>
  <text x="360" y="422" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">does an O(1) check, however long the book grows.</text>
</svg>

**Compressed NFTs (Bubblegum)** do it for memory optimization. A million NFTs are one account with one Merkle root hash. The full Merkle tree lives off-chain with an indexer. To change one NFT, the client brings the leaf and about twenty hashes along its path, except the top levels the account already keeps in its canopy, and the program recomputes the root and compares. **On-chain memory is O(1)**, since the account's size does not grow as NFTs are minted; **the on-chain check is O(log n)**, one path from leaf to root; **and the O(n) part lives with the indexer**. On Solana the usual way to store a million records is a million PDAs, each with its own rent deposit, and a Merkle tree replaces all of them with one account holding one root.

<svg role="img" viewBox="0 0 720 290" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Where the work lives</title><desc>A table of three designs. A sorted list insert costs O(n) search in total, an O(1) check on-chain, and the client walks the list off-chain. A Bubblegum update costs O(n) memory in total, O(1) memory and an O(log n) check on-chain, and an indexer keeps the tree off-chain. A program that searches its own list pays the O(n) search on-chain on every call, the cost grows with every entry, and nothing is kept off-chain.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Where the work lives</text>

  <rect x="40" y="70" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="50" y="89" font-size="11" fill="#ffffff" font-weight="bold">design</text>
  <text x="220" y="89" font-size="11" fill="#ffffff" font-weight="bold">total cost</text>
  <text x="340" y="89" font-size="11" fill="#ffffff" font-weight="bold">on-chain</text>
  <text x="520" y="89" font-size="11" fill="#ffffff" font-weight="bold">off-chain</text>

  <rect x="40" y="98" width="640" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="142" width="640" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <line x1="210" y1="70" x2="210" y2="230" stroke="#000000" stroke-width="1"/>
  <line x1="330" y1="70" x2="330" y2="230" stroke="#000000" stroke-width="1"/>
  <line x1="510" y1="70" x2="510" y2="230" stroke="#000000" stroke-width="1"/>
  <rect x="40" y="186" width="640" height="44" fill="none" stroke="#ed4937" stroke-width="2"/>

  <text x="50" y="124" font-family="monospace" font-size="10" font-weight="bold">sorted list insert</text>
  <text x="220" y="124" font-family="monospace" font-size="10" fill="#565653">O(n) search</text>
  <text x="340" y="124" font-family="monospace" font-size="10" font-weight="bold">O(1) check</text>
  <text x="520" y="124" font-family="monospace" font-size="10">client walks the list</text>

  <text x="50" y="168" font-family="monospace" font-size="10" font-weight="bold">Bubblegum update</text>
  <text x="220" y="168" font-family="monospace" font-size="10" fill="#565653">O(n) memory</text>
  <text x="340" y="161" font-family="monospace" font-size="10" font-weight="bold">O(1) memory,</text>
  <text x="340" y="176" font-family="monospace" font-size="10" font-weight="bold">O(log n) check</text>
  <text x="520" y="168" font-family="monospace" font-size="10">indexer keeps the tree</text>

  <text x="50" y="212" font-family="monospace" font-size="10" font-weight="bold">program searches a list</text>
  <text x="220" y="212" font-family="monospace" font-size="10" fill="#565653">O(n) search</text>
  <text x="340" y="205" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">O(n) on every call,</text>
  <text x="340" y="220" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">grows with every entry</text>
  <text x="520" y="212" font-family="monospace" font-size="10">nothing</text>

  <text x="360" y="258" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The first two designs keep the O(n) part off-chain. The third</text>
  <text x="360" y="274" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">keeps it on-chain, where anyone can make it grow.</text>
</svg>

**Merkle trees** such as in Bubblegum are the worst data structure you can imagine using for a normal traditional program. With web3 programs however, it is one of the most popular and frequently used ones.

***Important to remember:*** the reason why we don't want any high complexity (higher than O(log N)) on-chain is because it makes it easy to just spam the program with data and make it no longer fit the compute limit, after which nobody could use it. This is also frequently referred to as a "DoS attack". In most protocols anyone can add data, by opening an order, creating a position or minting an item, so the work inside an instruction should not grow with data anyone can add, or should grow very slowly: O(log n) is fine, a loop over a fixed-size list is safe too, and anything heavier belongs off-chain.
