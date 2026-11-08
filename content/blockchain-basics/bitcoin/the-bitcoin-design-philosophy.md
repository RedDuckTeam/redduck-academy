---
id: 85
title: The Bitcoin design philosophy
type: lecture
order: 1
faq:
  - question: What is the double-spend problem?
    answer: >-
      Spending the same digital coin twice in two places when no central server keeps the
      books.
  - question: Who wrote the Bitcoin whitepaper?
    answer: >-
      Someone using the name Satoshi Nakamoto. The paper, "Bitcoin: A Peer-to-Peer
      Electronic Cash System", was posted to a cryptography mailing list in late 2008. Who
      that was is still unknown.
  - question: Why does Bitcoin make miners burn electricity instead of voting?
    answer: >-
      Anyone can create a million fake identities for free. Proof of work prices each vote
      in electricity, so a million fake identities pay a million bills.
  - question: Why are Bitcoin blocks ten minutes apart instead of instant?
    answer: >-
      Ten minutes gives each new block time to reach most of the network before the next one
      is produced, so miners are all building on the same latest block. Faster blocks would
      mean more accidental forks and more wasted work. The gap is a safety margin.
  - question: Why is Bitcoin's supply capped at 21 million coins?
    answer: >-
      An economic choice written into the protocol, meant to produce money nobody can
      inflate. Block rewards halve every 210,000 blocks, about every four years, so new
      issuance slows and eventually stops. No central party can change the rule.
---

## How it all started 

In late 2008, an unsigned paper appeared on a cryptography mailing list under the pseudonym Satoshi Nakamoto, titled ["Bitcoin: A Peer-to-Peer Electronic Cash System".](https://bitcoin.org/bitcoin.pdf)

- **Electronic** ruled out paper currency and required a system that could exist purely as data, transmitted over the internet. 
- **Cash** ruled out anything that required a third party to clear the transaction, which is what makes physical cash different from a bank transfer.
- **Peer-to-Peer** meant two parties transact directly, with no operator in the middle.
- **System** meant the whole apparatus had to work on its own, end to end, at internet scale. 

Had people tried to exchange money like this before? Absolutely but all failed because how do you prevent the same digital coin from being spent twice in two different places, when there's no central server keeping the books? 

This is called the **double-spend problem** that stopped every previous digital-cash design. Bitcoin though was the answer nobody had thought of before. 

## The constraints that fell out

Once you commit to "no central operator", constraints follow: the system has to survive adversarial conditions; it has to keep running while bad actors try to break it from the inside; liars, cheaters, attackers spend millions of dollars on breaking it. 

That meta-constraint produces five operations:

**Sybil resistance without identity.** In any open system, the obvious attack is to create a million fake participants and remove the honest ones. To prevent this, the system needs a central authority and a costly participation. 

**Public verifiability.** Without a trusted operator, every participant has to verify every transaction themselves, therefore, the rules must be simple, the data must be public, and the verification must produce the same answer on every honest node. 

**Convergence despite network delay.** Information traveling across the internet doesn't arrive everywhere at the same instant. Two participants on opposite sides of the world might see different events first. The system has to handle this with all honest participants agreeing on the same history. 

**Censorship resistance.** If any single party can prevent a transaction from being processed, that party is effectively the operator. The system has to be structured so that no single point of failure can stop anyone from transacting.

**Permanence.** A transaction that settled yesterday has to be just as settled tomorrow. There's no operator to "reverse" it. If the system can selectively forget or rewrite history, the entire trustless guarantee evaporates.

Each of these constraints kills a category of possible designs. A system with a membership list violates Sybil resistance without identity, one with encrypted state violates public verifiability, one that relies on a global synchronous clock violates convergence under delay, one where a gatekeeper can drop transactions violates censorship resistance, and one with mutable history violates permanence. 

What's left, after killing every design that fails any constraint, is a very narrow space. Bitcoin's specific shape is what fits inside it.

## The choices that fell out

Now the constraints are the input and Bitcoin's design is the output. Each major choice in Bitcoin's design is a direct response to a specific constraint.

<svg role="img" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Bitcoin's five constraints mapped to their design choices</title><desc>A table lists five constraints on trustless peer-to-peer cash next to the Bitcoin design choice that answers each one, with arrows connecting each pair. Permanence leads to an append-only hash-linked log, Sybil resistance without identity leads to proof of work, public verifiability leads to simple deterministic validation, convergence under network delay leads to slow block times, and censorship resistance leads to an open permissionless network.</desc>
  <defs>
    <marker id="arr41" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<!-- Goal at top -->
  <rect x="200" y="20" width="320" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="45" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">Trustless peer-to-peer cash</text>
  <text x="360" y="65" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">no operator, no permission</text>

<!-- Two column headers -->
  <text x="180" y="115" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Constraint</text>
  <text x="540" y="115" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Design choice</text>

<!-- Row 1 -->
  <rect x="40" y="130" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="150" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Permanence</text>
  <text x="180" y="168" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">settled means settled forever</text>

<line x1="320" y1="155" x2="400" y2="155" stroke="#565653" stroke-width="2" marker-end="url(#arr41)"/>

<rect x="400" y="130" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="150" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Append-only hash-linked log</text>
  <text x="540" y="168" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">rewriting one block breaks all later ones</text>

<!-- Row 2 -->
  <rect x="40" y="190" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="210" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Sybil resistance without identity</text>
  <text x="180" y="228" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">no membership list</text>

<line x1="320" y1="215" x2="400" y2="215" stroke="#565653" stroke-width="2" marker-end="url(#arr41)"/>

<rect x="400" y="190" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="210" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Proof of work</text>
  <text x="540" y="228" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">votes priced in real electricity</text>

<!-- Row 3 -->
  <rect x="40" y="250" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="270" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Public verifiability</text>
  <text x="180" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">anyone checks the rules</text>

<line x1="320" y1="275" x2="400" y2="275" stroke="#565653" stroke-width="2" marker-end="url(#arr41)"/>

<rect x="400" y="250" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="270" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Simple deterministic validation</text>
  <text x="540" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">limited script, no loops</text>

<!-- Row 4 -->
  <rect x="40" y="310" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="330" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Convergence under network delay</text>
  <text x="180" y="348" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">no synchronized global clock</text>

<line x1="320" y1="335" x2="400" y2="335" stroke="#565653" stroke-width="2" marker-end="url(#arr41)"/>

<rect x="400" y="310" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="330" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Slow block times</text>
  <text x="540" y="348" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">ten minutes, conservative on purpose</text>

<!-- Row 5 -->
  <rect x="40" y="370" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="390" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Censorship resistance</text>
  <text x="180" y="408" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">no single point of control</text>

<line x1="320" y1="395" x2="400" y2="395" stroke="#565653" stroke-width="2" marker-end="url(#arr41)"/>

<rect x="400" y="370" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="390" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Open permissionless network</text>
  <text x="540" y="408" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">anyone runs a node, mines, transacts</text>

<text x="360" y="455" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">From one goal, five constraints. From the constraints, five design choices.</text>
</svg>

**The ledger is append-only and hash-linked.** Each block carries the hash of the previous one. Rewriting a single old block invalidates every block after it.

**Sybil resistance comes from proof of work.** The right to add to the ledger is sold to whoever can demonstrate the most computational work. Computation costs electricity; electricity costs the same regardless of how many identities you control. A million fake participants pay a million times the bill. This is the answer to Sybil resistance without identity, and it's specifically a hardware-and-energy answer to a problem that previous designs tried to solve with cryptography alone.

**Validation is deterministic and simple.** Every transaction can be checked by running a small piece of code against the chain's state. The code is intentionally not Turing-complete. This is the answer to public verifiability: every node, anywhere, running honest software, reaches the same answer on the same input.

**Block times are slow on purpose.** Ten minutes between blocks is a margin of safety for the network. A new block has to propagate to most of the planet before the next one is produced, so that everyone is building on the same most recent block, the tip of the chain. Faster block times mean more chain forks and more wasted work. 

**The money supply is capped.** Twenty-one million bitcoins, ever. Block rewards halve every 210,000 blocks, which is about every four years, so the rate of new issuance slows over time and eventually stops. It's a deliberate economic choice, intended to make Bitcoin a credible store of value in a world where every other currency can be inflated by whoever issues it. 

**The system changes slowly.** No central party can update the rules. The people running the nodes can apply changes, meanwhile, the developers backward compatibility because anything else risks breaking the trustlessness which is the main point.

## What Bitcoin gave up

The design has costs and Bitcoin is #1) slow because the transactions take from minutes to hours; #2) expensive at scale, because every node has to validate every transaction and there's a limit on how many can fit in a block; #3) inflexible because the intentional restrictions on Script mean it can't be used to build the complex applications that later chains support, and #4) conservative because changes that other chains release in months take Bitcoin years, sometimes decades.

From here, the question is how the specific Bitcoin design works. 
