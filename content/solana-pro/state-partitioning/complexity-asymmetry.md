---
title: Complexity asymmetry
type: lecture
order: 20
faq:
  - question: What is complexity asymmetry?
    answer: >-
      The gap between how much work an operation costs in total and how much of that work
      runs on-chain. Inserting into a sorted list is O(n) in total, but it is O(1) on-chain
      when the client finds the position and the program only checks it.
  - question: Why are sorted linked lists so common in Solana programs?
    answer: >-
      Because inserting into one can cost O(1) on-chain. The client walks the list off-chain
      and passes the order the new one goes after. The program checks only that the new
      order fits between it and the next one.
  - question: Why is an O(n) loop inside an instruction a security problem?
    answer: >-
      In most protocols anyone can add data. An attacker can grow the data until the loop
      no longer fits in 1.4 million compute units, and then the instruction fails for every
      caller. This is a denial-of-service attack, or DoS.
  - question: How does Monaco stop its order book from growing too large?
    answer: >-
      The book is a fixed set of cells in one account, so nobody can add orders past what
      fits.
  - question: Where is the full Merkle tree of a compressed NFT collection stored?
    answer: >-
      Off-chain, with indexers. The on-chain account keeps the root and the canopy. Its size
      is fixed when the tree is created, so it does not grow as NFTs are minted.
---

> Engineers choose a data structure by its cost in time and memory. On Solana there is one more cost to weigh, the on-chain complexity, and it can be very different from the total. An operation can cost O(n) in total and O(1) on-chain, because the O(n) part runs off-chain on the client.

## One more variable

On-chain programs add one more variable to time and memory, the on-chain complexity. This is the part the program itself pays for. Compute is paid in compute units and limited per transaction. Memory is paid in rent for the accounts the program keeps. The rest runs on the client or on an indexer, where it costs the program nothing. The gap between the total cost and the on-chain cost is called **complexity asymmetry**.

## Why O(n) on-chain is dangerous

Remember from the [constraints lecture](/courses/solana-pro/welcome/constraints-behind-patterns) that anyone can call any instruction. In most protocols anyone can also add data, for example by opening an order, creating a position or minting an item. If an instruction walks through all of that data, its cost grows with every entry, and an attacker can keep adding entries cheaply. Once the walk no longer fits in 1.4 million compute units, the instruction fails for every caller, and nobody can use that part of the program anymore. This is a denial-of-service attack, often called a DoS.

So the work inside an instruction should grow very slowly, or not at all, with data that anyone can add. O(log n) is fine, because a billion entries need only about 30 steps. A loop over a list with a fixed size is safe too, because nobody can make it longer. Anything heavier belongs off-chain.

## The sorted linked list

A sorted linked list is surprisingly common in Solana programs. In general it is a slow structure. Finding the right position for a new element takes O(n), because you walk the list from the start. Linking the element in is O(1), but only once you have found the position.

On-chain, the search disappears. The client finds the position off-chain, by walking the list it has already read from the account, and sends it with the instruction. The program does not search. It only checks that the position is correct by looking at the two neighbors of the new element, and that check takes the same time however long the list is. The client spends O(n) to find the position, and the program spends O(1) to verify it. This holds only when the program reads just the cells it needs, for example with a zero-copy account. If it deserializes the whole account, it pays for every cell on every call.

## Monaco's order book

You met Monaco's order book in the [role inversion lecture](/courses/solana-pro/permissionless-execution/role-inversion). Here is how its check works. The book is a fixed set of cells in one account, sorted from the highest price to the lowest. A new order takes any free cell, so cell numbers do not follow price, and each order points to its neighbors by cell number. The client works out where the new order goes and sends "after this order". The program checks three things. The order on the left is not cheaper than the new one. The order on the right is cheaper. Both cells hold open orders, so neither is empty or cancelled. Because the right neighbor must be strictly cheaper, the new order can only go after the last order at its own price. Older orders at that price stay ahead of it and fill first.

The cell numbers and prices in the diagram below are illustrative.

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

Because the book has a fixed number of cells, it can never outgrow its account. Walking the whole book on-chain would fit in the compute budget too, but then every new order would pay for every cell. The neighbor check makes it pay for two. The price of a fixed book is a hard limit on open orders. An attacker could fill every free cell and block real traders, so each order locks some of its owner's funds, which makes filling the book expensive.

## Bubblegum: memory moved off-chain

Bubblegum, the compressed NFT program from the [divide and conquer lecture](/courses/solana-pro/state-partitioning/divide-and-conquer), uses the same asymmetry for memory. One account keeps the root of a Merkle tree that covers a million NFTs. The full tree, with every leaf, is kept off-chain by indexers. To change one NFT, the client sends the leaf and the hashes on its path to the root, except the top ones the canopy already stores. The program rebuilds the root and compares it with the stored one.

Count the costs. The account has a fixed size that does not grow as NFTs are minted, so on-chain memory is O(1). The check walks one path from a leaf to the root, so on-chain compute is O(log n). The O(n) part, storing every leaf, lives with the indexer.

In a normal backend, a Merkle tree would be a strange way to store records. The backend puts a million records in a database and reads any one of them in a single step. Nobody would hash them into a tree.

On Solana, the usual way to store a million records is a million PDAs, one per record. Each PDA is a separate account, and each one needs its own rent deposit. A Merkle tree replaces all of them with one account that holds one root. That saving is why the Merkle tree is one of the most popular structures on Solana.

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

  <text x="360" y="258" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The working designs keep the O(n) part off-chain. The searching</text>
  <text x="360" y="274" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">program keeps it on-chain, where anyone can grow it.</text>
</svg>

## Count the on-chain part

When you choose a data structure for a program, write down two complexities for every operation, the total one and the on-chain one. Then ask how the on-chain part grows if someone adds a million entries on purpose. If it stays at O(1) or O(log n), the structure is safe. If it grows linearly, move the search to the client and leave the program only the check. A structure that a textbook would not recommend, like a sorted linked list or a Merkle tree, is often the right one on-chain once its expensive part runs off-chain.
