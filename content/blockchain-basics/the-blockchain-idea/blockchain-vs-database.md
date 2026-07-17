---
id: 78
title: Blockchain vs database
type: lecture
order: 2
faq:
  - question: Isn't a blockchain just a slow, complicated database?
    answer: "Structurally they are similar: both store records, both let you read
      and write, both handle many users. The differences are deliberate, though.
      A blockchain is append-only, every record is public, and it is replicated
      across thousands of nodes with no single operator, which makes it far
      slower, more expensive, and less private than a normal database. Those
      constraints are the whole product rather than a flaw."
  - question: Can you edit or delete data once it's on a blockchain?
    answer: No. A normal database supports create, read, update, and delete, but a
      blockchain only supports write and read. You cannot change or remove an
      existing entry, and the full history is kept by design rather than as an
      optional audit log. Once a record is deep enough in the chain, no
      participant can convincingly claim it isn't there.
  - question: Do blockchain transactions have all-or-nothing behavior like database
      transactions?
    answer: "Yes. Blockchain transactions are atomic in the same sense: when a block
      is added, each transaction in it either applies completely or not at all,
      with no half-finished state. If a single call would do five things and the
      fifth fails, the first four are unwound and the call has no effect.
      Atomicity is the one classic database guarantee that carries over
      cleanly."
  - question: Is it safe to store private data like medical records on a public
      blockchain?
    answer: No. Every record on a public blockchain is readable by every node, and
      through them by anyone in the world. There is no private mode and no way
      for an operator to hide some rows. The only thing shielding a user is that
      their address is a meaningless-looking string rather than a name. That
      makes a public chain a poor fit for medical records, internal company
      data, or anything under data-protection rules.
---

> The previous lesson built up a blockchain from scratch. A reasonable reaction at this point is "interesting, but isn't that just a database?" The answer is yes, structurally. But the differences are exactly what makes a blockchain useful for the small set of things it's actually good at.

## A blockchain is a ledger

Databases and ledgers are two different tools, and both are old. A database is a general store of records you can add to, change, and erase. A ledger is an append-only record of events, the format banks and accountants have kept for centuries, where entries are only ever added and the earlier history stays intact. Append-only is part of what defines a ledger, the way the category has always worked, so in a blockchain it is a starting assumption built into the design. A blockchain sits in this second category. That is what makes the database comparison worth doing, because most developers reach for a database by habit, and also what limits that comparison, because a blockchain is a ledger first, built to run without a trusted keeper.

## They are both databases, in the loose sense

A blockchain stores records. A database stores records. Both let you write new records and read existing ones. Both have to keep their data consistent under some definition of consistency. Both have to handle many users at once.

Beyond those basics, the similarity ends. Almost every other property they have is different, and most of those differences are deliberate. Below is the comparison every developer has to internalise before the rest of this course makes sense.

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

Walk down the rows. Almost every cell on the database side describes flexibility, convenience, and speed. Almost every cell on the blockchain side describes constraint, public exposure, and the absence of a controlling party. These are not accidents. The constraints are the product.

## Append-only is a hard rule

In a normal database, the four basic operations are create, read, update, and delete. The update and delete are the dangerous ones, because they let you change or erase the past. They're also indispensable. You change a row when a user updates their profile. You delete a row when a user closes their account. The database doesn't keep an audit trail of every prior version unless you build one yourself.

A blockchain has only two of those four operations. You can write new entries. You can read any entry, current or historical. You cannot update an entry. You cannot delete one. The full history is part of the system by design rather than a feature you opt into.

This sounds limiting, and in most use cases it is. For the small set of use cases where the ability to prove "this happened, exactly this way, and has not been changed since" is more valuable than the ability to keep things tidy, append-only is the entire point. Once a record is in a block deep enough in the chain, no party in the system can convincingly claim it isn't.

## Atomicity carries over, almost everything else doesn't

Traditional databases have a property called atomicity. A transaction in database terms is a bundle of changes that either all happen or all don't happen. You can't end up with a partial update where money got debited from one account but never credited to another. This is one of the four properties usually grouped under ACID, and it's the only one of the four that translates cleanly to the blockchain world.

Blockchain transactions are atomic in exactly the same sense. When a block is added to the chain, every transaction in that block either applies completely or doesn't apply at all. Half-applied transactions don't exist. If a blockchain call would do five things and the fifth one fails, the first four are unwound and the whole call has no effect on the chain's state.

The other three letters of ACID (consistency, isolation, durability) all have analogues in blockchain systems, but the analogues are subtle enough to deserve their own treatment. The point for this lesson is just that atomicity is the one operational property a database developer can carry over without modification.

## Transparency is the default

Every record in a public blockchain is readable by every node, and through the nodes by every user, and ultimately by anyone in the world who wants to look. Open any block explorer (a website that displays the contents of a chain in human-readable form) and you can see every transaction that has ever happened, every balance of every account, every smart-contract call, every event.

There is no "private mode," no "this row is only visible to its owner," no permission system the database operator can use to hide some rows from some users. The chain stores everything in plain view, and the only thing that protects a user's identity is the fact that an address on the chain is a meaningless-looking string of characters rather than a name.

This is a feature for some use cases and a non-starter for others. A public blockchain is the worst possible place to store medical records, internal company data, or anything subject to data-protection regulations. It's an excellent place to store the public history of how a financial protocol has worked over the last decade, because anyone in the world can verify the claims of the protocol's operators by reading the chain directly.

## Replication is built in

A traditional database lives on one server or one cluster of servers, run by one party. Replication exists, but it's an optimisation that you opt into and configure yourself, with replicas that ultimately trust a primary.

A blockchain has replication built into the structure. Every full node holds the entire history. There is no primary. There is no opt-in. If half the nodes in the network went offline tomorrow, the other half would continue running the chain and nothing would be lost. The data is durable because it exists in thousands of places at once, rather than because someone is paying for a backup tape.

The price of this durability is that the network can never go faster than the slowest agreement step among its participants. Every node has to validate every block, every node has to store the whole chain, every node has to keep up with every new transaction. This is the deepest reason blockchains are slow and expensive compared to databases. The slowness is the cost of not trusting any one party.

## When to pick which

A normal database is the right choice for almost every problem most software developers encounter. It's faster. It's cheaper. It's flexible. It's private by default. It has decades of tooling and operational knowledge built around it. Reaching for a blockchain when a database would do the job is a sign of confusion. The next several lessons explain the cases where the trade is genuinely worth it.

A blockchain is the right choice when you need to prove things about state to parties who don't trust each other, or when you can't have a single operator. It's also right when transparency is more valuable than privacy, or when the cost of a single point of failure is unacceptable. That set of cases is small in absolute terms and gigantic in dollars and consequence.
