---
id: 232
title: Jito, MEV, Bundles
type: lecture
order: 47
faq:
  - question: What is MEV if there is no public mempool to watch?
    answer: >-
      MEV is maximum extractable value, the profit from controlling the order of transactions
      in a block. Buy a token right before a large swap lifts its price, sell right after. The
      leader sees every transaction they are about to include and picks the order, so the
      value goes to whoever is closest to the leader. Jito turned that into an open auction.
  - question: How is a Jito tip different from a priority fee?
    answer: >-
      A tip is a plain SOL transfer to one of eight Jito tip accounts, added to your
      transaction. Leaders running the Jito-Solana client watch for it and include
      higher-tipped transactions earlier. A priority fee is set through the ComputeBudget
      program and reaches the leader through normal fee processing.
  - question: Why are there eight tip accounts?
    answer: >-
      The runtime serializes writes to one account, so eight of them spread the load.
  - question: What is a bundle for?
    answer: >-
      A bundle is up to 5 transactions that land together, in the order you set, or not at
      all. Arbitrage across two DEXes needs that, since landing only the buy leaves you
      holding tokens you did not want. Searchers submit bundles to Jito's off-chain block
      engine, which auctions them by tip size, simulates the winners, and forwards them to the
      current Jito-Solana leader.
  - question: Do my users' transactions need tips to land?
    answer: >-
      When the network is calm, a small priority fee is enough. When it is busy, untipped
      transactions get dropped while tipped ones go through. Most wallet SDKs attach a tip
      directly, and aggregators like Jupiter route swaps through Jito when MEV protection is
      on.
---

> When a leader produces a block, they choose which transactions to include and in what order. That choice has value, because the right ordering can capture real profit from things like DEX arbitrage. The name for this profit is MEV: maximum extractable value. Jito is the system most of the Solana network uses to organize how MEV gets captured. It does this through two mechanisms, tips and bundles.

## MEV is profit from choosing the order of transactions

Imagine a user is about to swap 100,000 USDC for SOL on a DEX. Their swap is large enough to move the price by half a percent, which on 100,000 USDC is 500 USDC. If you can spot their pending swap and buy SOL right before them, then sell right after, you pocket the half-percent move. They wanted to trade, and you made money from the fact that you knew about their trade and got to choose the order.

The profit comes from controlling transaction ordering. It exists in any system where somebody decides what goes in a block first, second, third. Solana has it just like every other chain does.

What differs on Solana is who can spot the pending swap. There is no public mempool to watch, as the [architecture lesson](/courses/development-on-solana/architecture-details/detailed-solana-architecture) explained: transactions go straight from RPC nodes to leaders via Gulf Stream. But the leader still sees every transaction they're about to include and still chooses the order, and a leader can also buy private order flow from RPC providers. So the MEV is still there, and it goes to whoever has the closest relationship with the leader.

Before Jito, MEV on Solana was opaque. Big trading firms ran their own validators or made informal deals with leaders, and ordinary users had no idea their transactions were being reordered around them. Jito turned this into an auction that anyone can bid in.

## A tip is a payment for priority

A tip is a regular SOL transfer to one of eight special accounts that Jito designated. You add a `SystemProgram::transfer` to your transaction, sending some lamports to a Jito tip address, and it needs no special instruction, bundle, or API call.

Leaders running the Jito-Solana validator client watch for these transfers. When they're building a block, they prioritize transactions that include tips, ordered by how much was tipped.

The eight tip accounts exist for performance reasons. Solana's runtime serializes transactions that write to the same account, so if every tip went to one account, every tipped transaction in a block would block each other. With eight accounts, Jito-Solana spreads the load. Your client picks one at random for each transaction.

Tips are not the same as priority fees. They live alongside each other:

- **Priority fees** go to the leader as part of normal fee processing. Set via the ComputeBudget program.
- **Jito tips** go directly to the leader as a SOL transfer. Recognized only by Jito-Solana leaders.

A transaction can have both. Most production wallets and routers attach both, because together they maximize the chance the transaction lands.

## A bundle lands several transactions together, in a fixed order

Some operations only make sense as a sequence. Inside one transaction that is already guaranteed: the instructions run in order, and if one of them fails, none of the changes happen, as [instructions and transactions](/courses/development-on-solana/the-solana-mental-model/instructions-and-transactions) explained. The guarantee covers one transaction only. Two separate transactions can land one without the other, and nothing fixes which transaction lands right before yours or right after it.

A bundle is a small group of up to 5 transactions that the leader commits to including together, in the order you specify. If any transaction in the bundle fails, none of them land.

Take the swap from the first example. Your buy, the user's swap, and your sell are three transactions, and the swap is signed by the user, so you cannot put all three into one transaction of your own. A bundle lands them together and in that order, or not at all.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Two paths into a block: normal transaction vs Jito bundle</title><desc>One path shows a normal transaction moving from user wallet to RPC node to current leader to a block, included one tx at a time with no atomicity guarantees. The other path shows a Jito bundle moving from searcher to Jito block engine to Jito-Solana leader to a block, where the whole bundle lands together or not at all.</desc>
  <defs>
    <marker id="arrJ1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Two paths into a block</text>
  <rect x="40" y="80" width="310" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">normal Solana transaction</text>
  <rect x="70" y="130" width="250" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="153" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">user wallet</text>
  <text x="195" y="168" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">signs and submits one tx</text>
  <line x1="195" y1="180" x2="195" y2="210" stroke="#ed4937" stroke-width="2" marker-end="url(#arrJ1)"/>
  <rect x="70" y="215" width="250" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="238" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">RPC node</text>
  <text x="195" y="253" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">forwards via Gulf Stream</text>
  <line x1="195" y1="265" x2="195" y2="295" stroke="#ed4937" stroke-width="2" marker-end="url(#arrJ1)"/>
  <rect x="70" y="300" width="250" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="323" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">current leader</text>
  <text x="195" y="338" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">orders by priority fee + tip</text>
  <line x1="195" y1="350" x2="195" y2="380" stroke="#ed4937" stroke-width="2" marker-end="url(#arrJ1)"/>
  <rect x="70" y="385" width="250" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="408" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">block</text>
  <text x="195" y="423" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">tx included if it fits</text>
  <text x="195" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">one tx at a time, no atomicity guarantees</text>
  <rect x="370" y="80" width="310" height="380" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Jito bundle</text>
  <rect x="400" y="130" width="250" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="153" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">searcher</text>
  <text x="525" y="168" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">groups 2-5 txs + a tip</text>
  <line x1="525" y1="180" x2="525" y2="210" stroke="#ed4937" stroke-width="2" marker-end="url(#arrJ1)"/>
  <rect x="400" y="215" width="250" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="525" y="238" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Jito block engine</text>
  <text x="525" y="253" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">runs the bundle auction</text>
  <line x1="525" y1="265" x2="525" y2="295" stroke="#ed4937" stroke-width="2" marker-end="url(#arrJ1)"/>
  <rect x="400" y="300" width="250" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="323" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Jito-Solana leader</text>
  <text x="525" y="338" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">orders by tip, atomically</text>
  <line x1="525" y1="350" x2="525" y2="380" stroke="#ed4937" stroke-width="2" marker-end="url(#arrJ1)"/>
  <rect x="400" y="385" width="250" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="408" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">block</text>
  <text x="525" y="423" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">whole bundle lands or none</text>
  <text x="525" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold" font-style="italic">multiple txs, in chosen order, atomic</text>
  <text x="360" y="495" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A bundle is a small group of transactions that lands together,</text>
  <text x="360" y="513" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">in a specific order, in exchange for a tip paid to the leader.</text>
</svg>

A searcher, meaning someone running a trading bot, submits the group of transactions to the Jito block engine, which is an off-chain service that runs an auction. The block engine has its own API endpoint, so bundles go to it directly rather than to RPC nodes. Bundles compete against each other for the same slot. The block engine picks winners based on tip size, simulates them to make sure they'd succeed, and forwards the winning bundles to the current leader. The leader, running Jito-Solana, places them in the block.

The tip works the same way as for single transactions: a SOL transfer to one of those eight tip accounts, included as one of the transactions in the bundle. If the bundle lands, the leader collects the tip. If the bundle fails or doesn't win the auction, no tip is paid.

## Jito's guarantees depend on its own service and its own client

The auction is not part of the protocol. It runs in Jito's block engine, an off-chain service, so a bundle lands only if that service receives it and forwards it to the leader. Only leaders running the Jito-Solana client recognize tips and place bundles, so in a slot whose leader runs another client, a bundle cannot land. The same bundle mechanism that the searcher from the first example uses against a large swap can also protect it, as the next section shows.

## What to do in your frontend and in your program

Bundles are mostly used by trading firms and MEV bots, and most developers never submit one. But Jito affects every Solana developer, because tips have become the standard way transactions get prioritized on the network.

**Your users' transactions need tips to land reliably during busy periods.** When the network is calm, a normal transaction with a small priority fee lands easily. When the network is busy, transactions without tips often get dropped while tipped ones go through. If you build a frontend that submits user transactions, you probably want to attach a Jito tip. Most wallet SDKs and transaction-building libraries support this directly.

**A large swap can be routed through Jito so that nothing is inserted around it.** When a user does a large swap on a DEX, MEV bots can profit by placing their own transactions around it, the pattern described at the start of this lesson. One defense is to route the user's transaction through Jito, often as part of a bundle that includes a "protection" component preventing other transactions from being inserted nearby. Aggregators like Jupiter do this when MEV protection is enabled, and the user pays a tip for it.

**In your program, the swap instruction takes a limit.** The program cannot control how a transaction was sent, but it controls which result it accepts. The user signs the minimum output they accept together with the swap, and the swap fails if the result is below it, as [boundary of consent](/courses/solana-pro/order-and-consent/boundary-of-consent) in the Solana Pro course shows with Jupiter. For the 100,000 USDC swap above, if the user signs a minimum 0.1% below the expected output, trading ahead of them can cost them at most about 100 USDC, and a worse result makes the swap fail. A tighter minimum leaves less to take but also fails the swap more often when the price moves for ordinary reasons, so the user picks the number and the instruction takes it as an argument.

Most developers get tips and bundle protection by using a wallet adapter or aggregator that already handles them internally. Knowing the mechanism is what lets you debug "why isn't my transaction landing" and "why did my user get a worse price than expected."
