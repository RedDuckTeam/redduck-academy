---
id: 78
title: Blockchain vs database
type: lecture
order: 2
faq:
  - question: Isn't a blockchain just a slow, complicated database?
    answer: >-
      A blockchain is a ledger, an append-only record of events, the format banks and
      accountants have kept for centuries. It stores records and answers reads like a
      database. Everything else differs on purpose: append-only, public, replicated across
      thousands of nodes, no operator.
  - question: Can I delete something once it is on the chain?
    answer: >-
      No. There is no delete operation and no update operation. Only write and read.
  - question: My call does five things and the fifth fails. Do the first four still happen?
    answer: >-
      No. Blockchain transactions are atomic, so the whole call is unwound and leaves nothing
      behind. Atomicity is the one ACID property that carries over from databases unchanged.
  - question: Is a public blockchain a safe place for medical records?
    answer: >-
      No. Every record is readable by every node, and through them by anyone in the world.
      There is no private mode and no operator who can hide rows. The only cover a user gets
      is an address that carries no name.
  - question: How much slower is a blockchain than a database?
    answer: >-
      A database does millions of writes per second at a fraction of a cent each. A public
      chain does a few to a few thousand, at cents to dollars a write.
---

> The previous lesson built up a blockchain from scratch. A reasonable reaction at this point is "interesting, but isn't that just a database?" Structurally, yes. But a blockchain has no operator that everyone trusts, and its differences from a database follow from that.

## Both store records, and almost everything else differs

A blockchain and a database both store records, let you write new records and read existing ones, and have to handle many users at once. Both also apply a bundle of changes, called a transaction, completely or not at all, so money is never debited from one account without being credited to another. This property is called atomicity. If a blockchain call would do five things and the fifth one fails, the first four are unwound and the whole call has no effect on the chain's state.

Almost every other property they have is different, and the differences have one cause. A database has an operator, one party that runs it and that its users have to trust. A blockchain is built for parties who don't trust each other, so it has no operator at all.

<svg role="img" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Traditional database vs blockchain comparison table across 8 properties</title><desc>A table compares traditional databases and blockchains across eight properties: operations, operator, storage, read access, write rules, speed, cost per write, and what happens if the operator fails. Databases allow create, update, and delete by one trusted party on one server, while blockchains only append, run on every node with no single operator, and the network keeps running even if a node fails.</desc>
  <!-- Column headers -->
  <rect x="20" y="20" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="50" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Property</text>

<rect x="260" y="20" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="50" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Traditional database</text>

<rect x="480" y="20" width="220" height="50" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="590" y="50" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">Blockchain</text>

<!-- Row 1: Operations -->
  <rect x="20" y="70" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="30" y="100" font-size="13" fill="#000000" font-weight="bold">Operations</text>

<rect x="260" y="70" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000">CREATE UPDATE DELETE</text>

<rect x="480" y="70" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000">APPEND only</text>

<!-- Row 2: Operator -->
  <rect x="20" y="120" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="30" y="150" font-size="13" fill="#000000" font-weight="bold">Operator</text>

<rect x="260" y="120" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="150" text-anchor="middle" font-size="12" fill="#000000">one trusted party</text>

<rect x="480" y="120" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="150" text-anchor="middle" font-size="12" fill="#000000">nobody</text>

<!-- Row 3: Storage -->
  <rect x="20" y="170" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="30" y="200" font-size="13" fill="#000000" font-weight="bold">Storage</text>

<rect x="260" y="170" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="200" text-anchor="middle" font-size="12" fill="#000000">one server (or cluster)</text>

<rect x="480" y="170" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="200" text-anchor="middle" font-size="12" fill="#000000">every node, fully replicated</text>

<!-- Row 4: Read access -->
  <rect x="20" y="220" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="30" y="250" font-size="13" fill="#000000" font-weight="bold">Read access</text>

<rect x="260" y="220" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="250" text-anchor="middle" font-size="12" fill="#000000">whoever the admin allows</text>

<rect x="480" y="220" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="250" text-anchor="middle" font-size="12" fill="#000000">anyone in the world</text>

<!-- Row 5: Write rules -->
  <rect x="20" y="270" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="30" y="300" font-size="13" fill="#000000" font-weight="bold">Write rules</text>

<rect x="260" y="270" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="300" text-anchor="middle" font-size="12" fill="#000000">application code, server-side</text>

<rect x="480" y="270" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="300" text-anchor="middle" font-size="12" fill="#000000">protocol + smart contracts</text>

<!-- Row 6: Speed -->
  <rect x="20" y="320" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="30" y="350" font-size="13" fill="#000000" font-weight="bold">Speed</text>

<rect x="260" y="320" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="350" text-anchor="middle" font-size="12" fill="#000000">millions of writes/sec</text>

<rect x="480" y="320" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="350" text-anchor="middle" font-size="12" fill="#000000">a few to a few thousand/sec</text>

<!-- Row 7: Cost -->
  <rect x="20" y="370" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="30" y="400" font-size="13" fill="#000000" font-weight="bold">Cost per write</text>

<rect x="260" y="370" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="400" text-anchor="middle" font-size="12" fill="#000000">fractions of a cent</text>

<rect x="480" y="370" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="400" text-anchor="middle" font-size="12" fill="#000000">cents to dollars</text>

<!-- Row 8: Failure mode -->
  <rect x="20" y="420" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="30" y="450" font-size="13" fill="#000000" font-weight="bold">If operator fails</text>

<rect x="260" y="420" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="370" y="450" text-anchor="middle" font-size="12" fill="#000000">system goes down</text>

<rect x="480" y="420" width="220" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="450" text-anchor="middle" font-size="12" fill="#000000">network keeps running</text>
</svg>

Walk down the rows, and almost every cell on the database side describes flexibility, convenience, and speed. Almost every cell on the blockchain side describes constraint, public exposure, and the absence of a controlling party. The sections below show how these constraints follow from having no operator.

## Nobody can be trusted to edit the past, so the chain is append-only

In a normal database, the four basic operations are create, read, update, and delete. Update and delete let you change or erase the past, and a database needs them. You change a row when a user updates their profile. You delete a row when a user closes their account. The operator decides who is allowed to do that.

A blockchain has nobody to give that right to, because whoever could edit the past would have to be trusted by everyone else. So it has only two of those four operations. You can write new entries and read any entry, current or historical. You cannot update an entry or delete one. The hash links from the [previous lesson](/courses/blockchain-basics/the-blockchain-idea/what-is-blockchain) enforce this, because an edited copy stops matching everyone else's.

A record like this is called a ledger: an append-only record of events, the format banks and accountants have kept for centuries, where entries are only ever added and the earlier history stays intact. A blockchain is a ledger built to run without a trusted keeper.

This sounds limiting, and in most use cases it is. It pays off where the ability to prove "this happened, exactly this way, and has not been changed since" is more valuable than the ability to keep things tidy. Once a record is in a block deep enough in the chain, no party in the system can convincingly claim it isn't.

## Every node checks the records, so every record is public

With no operator to vouch for the data, every node checks every record itself, and it can only check what it can read. So every record in a public blockchain is readable by every node, and through the nodes by every user, and ultimately by anyone in the world who wants to look. Open any block explorer (a website that displays the contents of a chain in human-readable form) and you can see every transaction that has ever happened, every balance of every account, every smart-contract call, every event.

There is no private mode and no operator who can hide some rows from some users. The only thing that protects a user's identity is the fact that an address on the chain is a meaningless-looking string of characters rather than a name.

This is a feature for some use cases and a non-starter for others. A public blockchain is the worst possible place to store medical records, internal company data, or anything subject to data-protection regulations. It's an excellent place to store the history of a lending application such as Aave, because anyone in the world can check what the application has done by reading the chain directly, without taking anyone's word for it.

## Every node keeps a full copy, so the network is durable and slow

A traditional database lives on one server or one cluster of servers, run by one party. It can keep extra copies, but the operator has to set them up, and the copies follow one main server.

In a blockchain every full node holds the entire history, and no copy is the main one. If half the nodes in the network went offline tomorrow, the other half would continue running the chain and nothing would be lost. The data is durable because it exists in thousands of places at once.

The price of this durability is speed and cost. Every node has to validate every block, store the whole chain, and keep up with every new transaction, so the network can never go faster than the slowest agreement step among its participants. A database handles millions of writes per second at fractions of a cent each. A public chain handles a few to a few thousand per second, at cents to dollars per write.

## Use a database unless the parties don't trust each other

A normal database is the right choice for almost every problem. It's faster, cheaper, flexible, and private by default, and it has decades of tooling and operational knowledge built around it.

A blockchain is the right choice when you need to prove things about state to parties who don't trust each other, or when you can't have a single operator. It's also right when transparency is more valuable than privacy, or when the cost of a single point of failure is unacceptable. Bitcoin is such a case: two strangers exchange value directly, with no operator in the middle, as [The Bitcoin design philosophy](/courses/blockchain-basics/bitcoin/the-bitcoin-design-philosophy) lesson explains. The next several lessons explain how a network with no operator reaches agreement.
