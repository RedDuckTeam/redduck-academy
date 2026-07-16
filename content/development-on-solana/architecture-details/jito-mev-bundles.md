---
id: 232
title: Jito, MEV, Bundles
type: lecture
order: 47
faq:
  - question: What is MEV on Solana if there's no public mempool to front-run?
    answer: MEV (maximum extractable value) is profit that comes from controlling
      the order of transactions in a block, for example buying a token right
      before a large swap pushes its price up, then selling right after. Solana
      has no public mempool, so outsiders cannot scan for pending transactions
      from the outside, but the leader still sees every transaction they are
      about to include and still chooses the order, so the MEV exists and flows
      to whoever has the closest relationship with the leader. Jito was built to
      turn that hidden advantage into an open market with clear rules.
  - question: What is a Jito tip, and how is it different from a priority fee?
    answer: A Jito tip is just a plain SOL transfer to one of eight special Jito
      accounts, added to your transaction; leaders running the Jito-Solana
      client watch for these and include higher-tipped transactions earlier. It
      is separate from a priority fee, which is set via the ComputeBudget
      program and reaches the leader through normal fee processing. A
      transaction can carry both, and most production wallets and routers attach
      both to maximize the chance it lands. The eight accounts exist so that
      tipped transactions do not all serialize on writes to a single account.
  - question: What is a Jito bundle, and why would I want transactions to be atomic?
    answer: "A Jito bundle is a group of up to 5 transactions that the leader
      includes together in the exact order you specify, all-or-nothing: if any
      one fails, none of them land. Atomicity matters for sequences that only
      make sense together, such as arbitrage where you buy a token on one DEX
      and sell it on another; landing only half would leave you stuck holding
      tokens or short the ones you needed to sell. Searchers submit bundles to
      Jito's off-chain block engine, which runs an auction by tip size,
      simulates the winners, and forwards them to the current Jito-Solana
      leader."
  - question: Do I need to add Jito tips for my users' transactions to land?
    answer: When the network is calm, a normal transaction with a small priority fee
      lands easily, but during busy periods untipped transactions often get
      dropped while tipped ones go through, so attaching a Jito tip greatly
      improves reliability. Most wallet SDKs and transaction-building libraries
      support this directly, and aggregators like Jupiter also route swaps
      through Jito to protect users from MEV when protection is enabled.
      Understanding this mechanism is what lets you debug "why isn't my
      transaction landing" and "why did my user get a worse price than
      expected."
---

> When a leader produces a block, they choose which transactions to include and in what order. That choice has value, because the right ordering can capture real profit from things like DEX arbitrage. The name for this profit is MEV: maximum extractable value. Jito is the system most of the Solana network uses to organize how MEV gets captured. This lecture covers MEV in plain terms, then walks through the two things Jito introduced: tips and bundles.

## What MEV actually is

Imagine a user is about to swap 100,000 USDC for SOL on a DEX. Their swap is large enough to move the price by half a percent. If you can spot their pending swap and buy SOL right before them, then sell right after, you pocket the half-percent move. They wanted to trade. You made money from the fact that you knew about their trade and got to choose the order.

That's MEV in one example. The profit comes from controlling transaction ordering. It exists in any system where somebody decides what goes in a block first, second, third. Solana has it just like every other chain does.

There is one difference on Solana: it has no public mempool. On chains that do, anyone can watch pending transactions and try to front-run them. On Solana, transactions go straight from RPC nodes to leaders via Gulf Stream, with no public waiting room in between. So you can't scan for opportunities from the outside. But the leader still sees every transaction they're about to include and still chooses the order. The MEV is still there. It just goes to whoever has the closest relationship with the leader.

This is the problem Jito was built to organize. Before Jito, MEV on Solana was opaque. Big trading firms ran their own validators or made informal deals with leaders, and ordinary users had no idea their transactions were being reordered around them. Jito turned this into an open market that anyone can participate in, with clear rules.

## Jito tips: paying for priority

The simpler half of what Jito introduced is the tip. A tip is a regular SOL transfer to one of eight special accounts that Jito designated. That's it. There's no special instruction, no bundle, no API call. You just add a `SystemProgram::transfer` to your transaction, sending some lamports to a Jito tip address.

What happens next: leaders running the Jito-Solana validator client watch for these transfers. When they're building a block, they prioritize transactions that include tips, ordered by how much was tipped. Higher tip means earlier inclusion.

The eight tip accounts exist for performance reasons. Solana's runtime serializes transactions that write to the same account, so if every tip went to one account, every tipped transaction in a block would block each other. With eight accounts, Jito-Solana spreads the load. Your client picks one at random for each transaction.

Tips are not the same as priority fees. They live alongside each other:

- **Priority fees** go to the leader as part of normal fee processing. Set via the ComputeBudget program.
- **Jito tips** go directly to the leader as a SOL transfer. Recognized only by Jito-Solana leaders.

A transaction can have both. Most production wallets and routers attach both, because together they maximize the chance the transaction lands.

This is the mechanism behind a lot of behavior you've probably seen without knowing why. When Phantom shows you "transaction priority: high" and the swap lands quickly, there's a Jito tip in there. When Jupiter routes a swap and asks if you want "MEV protection," it adds a tip and routes the transaction through Jito's bundle system to prevent other transactions from being inserted around it. When you read about a wallet's "land rate" improving, the team probably just turned on Jito tips. The tip mechanism is what makes all of this work.

## Jito bundles: atomic groups of transactions

The other half is bundles. A bundle is a small group of up to 5 transactions that the leader commits to including together, in the order you specify. If any transaction in the bundle fails, none of them land. The whole bundle is atomic.

Why does atomicity matter? Because some operations only make sense as a sequence. A classic example: arbitrage between two DEXes. You want to buy a token on one DEX, then sell it on another at a better price. If only the buy lands, you're stuck holding tokens you didn't want. If only the sell lands, you don't have the tokens to sell and the transaction fails. With a bundle, you get all-or-nothing. The two transactions land together, or neither does.

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

How bundles work mechanically: a searcher, meaning someone running a trading bot, submits the group of transactions to the Jito block engine, which is an off-chain service that runs an auction. Bundles compete against each other for the same slot. The block engine picks winners based on tip size, simulates them to make sure they'd succeed, and forwards the winning bundles to the current leader. The leader, running Jito-Solana, places them in the block.

The tip works the same way as for single transactions: a SOL transfer to one of those eight tip accounts, included as one of the transactions in the bundle. If the bundle lands, the leader collects the tip. If the bundle fails or doesn't win the auction, no tip is paid.

Two things to know about bundles:

**They're submitted to the block engine rather than to RPC nodes.** The block engine has its own API endpoint that searchers use directly. Regular wallets and applications don't talk to it.

**The order is fixed.** When you submit a bundle, you specify the exact order the transactions should appear in. The leader respects that order. This is what makes patterns like "do my buy right before this user's swap" possible.

## What this means for an everyday developer

You probably won't submit a bundle yourself. Bundles are mostly used by trading firms and MEV bots. But Jito affects every Solana developer, because tips have become the standard way transactions get prioritized on the network.

**Your users' transactions need tips to land reliably during busy periods.** When the network is calm, a normal transaction with a small priority fee lands easily. When the network is busy, transactions without tips often get dropped while tipped ones go through. If you build a frontend that submits user transactions, you probably want to attach a Jito tip. Most wallet SDKs and transaction-building libraries support this directly.

**Your users get protected from MEV through Jito.** When a user does a large swap on a DEX, MEV bots can profit by placing their own transactions around it — buying just before the swap drives the price up, then selling right after — exactly the pattern described at the start of this lesson. The defense is to route the user's transaction through Jito, often as part of a bundle that includes a "protection" component preventing other transactions from being inserted nearby. Aggregators like Jupiter do this automatically when MEV protection is enabled. The user pays a small tip and gets a fair price.

You don't have to integrate any of this directly. Most developers get it for free by using a wallet adapter or aggregator that already handles tips internally. But knowing the mechanism is what makes you able to debug "why isn't my transaction landing" and "why did my user get a worse price than expected." The answer to both involves Jito, and now you know what to look for.
