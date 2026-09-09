---
id: 227
title: "Off-chain state: events, logs, and indexers"
type: lecture
order: 45
faq:
  - question: Can my program read another program's events on chain?
    answer: >-
      No. Account data is the only thing one program can read from another.
  - question: Why emit an event when the account already holds the state?
    answer: >-
      Current state says nothing about how it got there, and a closed account leaves no trace at
      all. Events land in the transaction's program logs, which archival nodes and indexers
      keep long after the account is gone.
  - question: Do I have to pay for an indexer like Helius?
    answer: >-
      No. Helius webhooks and Triton's Yellowstone gRPC stream are the fast path, and most apps
      should start there. Your own gets cheaper once the bill grows, and it is the only option
      when you need data sovereignty.
  - question: What does running my own off-chain indexer actually involve?
    answer: >-
      One worker process. It polls a normal RPC every ten seconds, decodes transactions and
      accounts with your IDL, and upserts rows into Postgres keyed by signature. No validator,
      no streaming plugin.
---

> Your Solana program produces three kinds of output. Account data is what other programs read. Program logs are what off-chain consumers read. Transaction metadata records what happened. None of these are interchangeable. The rule that ties them together is "emit an event for every important state change," which is how your data actually leaves the chain and reaches your frontend.

## The on-chain / off-chain boundary

Solana draws a sharper line between on-chain and off-chain data than the EVM does. Two facts make this true.

First, account data is the only thing programs can read from each other. There's no on-chain API for reading another program's logs, no way to subscribe to events at the program level, no shared memory between executions. If your program needs to react to something another program did, you read that program's account state. Logs and events don't enter the picture.

Second, account storage is expensive. Every byte you store costs rent at the rent-exempt rate. A 1KB account locks up about 7 million lamports. Storing the full history of every action a user has taken would mean creating new accounts indefinitely, which gets prohibitively expensive after the first thousand operations.

These two facts together create a strict division of labor. State that other programs need to read goes into account data. Everything else, the user-facing log of what happened, analytical data, historical traces, search-friendly indexes, lives off-chain and is built by reading the chain.

<svg role="img" viewBox="0 0 720 600" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>How data leaves the chain: on-chain data to off-chain reads</title><desc>The diagram shows on-chain data (account data, program logs, transaction data) flowing into three ways to read it: direct RPC reads, a third-party indexer, or a self-hosted worker. These feed off-chain uses like frontend UI, notifications, analytics, and search, noting the choice between paid third-party and self-hosted is mostly economic.</desc>
  <defs>
    <marker id="arrI1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">How data leaves the chain</text>
  <rect x="40" y="80" width="640" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="80" width="640" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="55" y="98" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">On chain: what your program produces</text>
  <text x="55" y="125" font-family="monospace" font-size="10">• Account data</text>
  <text x="200" y="125" font-family="monospace" font-size="10" fill="#565653">readable on demand, structured, costs rent to store</text>
  <text x="55" y="143" font-family="monospace" font-size="10">• Program logs</text>
  <text x="200" y="143" font-family="monospace" font-size="10" fill="#565653">written by msg!() and emit!(), free to write, not readable on-chain</text>
  <text x="55" y="161" font-family="monospace" font-size="10">• Transaction data</text>
  <text x="200" y="161" font-family="monospace" font-size="10" fill="#565653">instructions, signers, accounts touched, success/failure</text>
  <line x1="360" y1="180" x2="160" y2="220" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrI1)"/>
  <line x1="360" y1="180" x2="360" y2="220" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrI1)"/>
  <line x1="360" y1="180" x2="560" y2="220" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrI1)"/>
  <rect x="40" y="225" width="200" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="247" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">1. Direct RPC reads</text>
  <line x1="60" y1="257" x2="220" y2="257" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="50" y="275" font-family="monospace" font-size="9">getAccountInfo</text>
  <text x="50" y="290" font-family="monospace" font-size="9">getProgramAccounts</text>
  <text x="50" y="305" font-family="monospace" font-size="9">getTransaction</text>
  <text x="140" y="326" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">small-scale</text>
  <text x="140" y="338" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">single-point queries</text>
  <rect x="260" y="225" width="200" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="247" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">2. Third-party indexer</text>
  <line x1="280" y1="257" x2="440" y2="257" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="270" y="275" font-family="monospace" font-size="9">Helius webhooks</text>
  <text x="270" y="290" font-family="monospace" font-size="9">Triton Yellowstone</text>
  <text x="270" y="305" font-family="monospace" font-size="9">SubQuery, The Graph</text>
  <text x="360" y="326" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">production apps,</text>
  <text x="360" y="338" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">paid service</text>
  <rect x="480" y="225" width="200" height="120" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="580" y="247" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">3. Self-hosted</text>
  <line x1="500" y1="257" x2="660" y2="257" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="490" y="275" font-family="monospace" font-size="9">your worker polls RPC</text>
  <text x="490" y="290" font-family="monospace" font-size="9">decodes accounts/logs</text>
  <text x="490" y="305" font-family="monospace" font-size="9">writes to your DB</text>
  <text x="580" y="326" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">full control,</text>
  <text x="580" y="338" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">cheap to start</text>
  <text x="360" y="378" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">↓</text>
  <rect x="40" y="395" width="640" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="416" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">Off chain: what your application consumes</text>
  <line x1="60" y1="428" x2="660" y2="428" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="450" font-family="monospace" font-size="10">• Frontend UI showing user balances, recent activity, leaderboards</text>
  <text x="60" y="468" font-family="monospace" font-size="10">• Notifications when something the user cares about happens</text>
  <text x="60" y="486" font-family="monospace" font-size="10">• Historical analytics and reporting that doesn't fit on chain</text>
  <text x="60" y="504" font-family="monospace" font-size="10">• Search by content (find all positions over $1M, all NFTs in a collection, etc.)</text>
  <rect x="40" y="530" width="640" height="55" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="552" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">The choice is mostly economic:</text>
  <text x="360" y="568" text-anchor="middle" font-family="monospace" font-size="10">paid third-party = fast to start. Self-hosted = control and ownership of the pipeline.</text>
</svg>

## Why "emit for every important state change" is the rule

Here is a rule that many new Solana developers miss: anything you want to display, alert on, search by, or analyze later must be emitted as an event. Reading the account data tells you the current state. It does not tell you how the account got there.

Concretely, suppose your staking program has a `StakePosition` account with `amount` and `staked_at` fields. An off-chain consumer can read the current state of any position by fetching the account. But the consumer cannot answer questions like:

- When was this position opened?
- Did this user previously open and close a position?
- How many positions across the protocol opened in the last 24 hours?
- What was the largest stake amount opened today?

The first question is partly answered by `staked_at`, but only because you happened to store the timestamp on the account. The other questions can't be answered from current state at all. Once a position is closed via `claim`, the account is gone. Its history is unrecoverable from the chain state.

The fix is to emit an event at every meaningful state change: position opened, position claimed, position closed via unstake. The events go into the transaction record. That record is part of the confirmed transaction data, which archival nodes and RPC providers store, and which indexers can query long after the transaction confirmed. Now any off-chain consumer with access to the historical event stream can reconstruct the full history of every position, even ones that were closed years ago.

There's a temptation to skip events because "I can always read the account." Don't. The moment your account closes or its fields change, the historical view is gone unless you emitted events. Add the event when you write the handler, before you forget what state changes matter.

## Third-party indexers: Helius and Triton

The fastest way to get off-chain data into your application is to use a third-party indexer. Several services dominate the Solana indexing space.

**Helius** offers webhooks and an enhanced RPC. You can register a webhook with a list of program IDs or specific accounts, and Helius will push transactions touching those targets to your backend in near-real-time. Their parsed-transaction API decodes Anchor IDLs automatically, so events arrive as structured JSON rather than raw base64.

**Triton's Yellowstone** offers a gRPC streaming interface, also called Yellowstone gRPC, where you subscribe to filters on accounts, slots, transactions, or programs. Your backend receives a steady stream of updates and can process them however you want. The interface is lower-level than Helius's webhooks but gives you more control and typically better throughput.

**The Graph and SubQuery** offer indexing frameworks where you define schemas and event handlers, and the framework runs the indexer for you against the chain. These are higher-level abstractions that work well for query-by-content patterns like "find all users with stake amount over X".

The trade-off across all of these is the same. You write your code against their interface and let them run the infrastructure. You pay them. You get fast time-to-launch in exchange for being a customer of their pipeline.

This is the right choice for most applications. The infrastructure to reliably index a Solana program in production is non-trivial, and renting it from a specialist is usually cheaper than building it yourself, especially in the early stages of an application's life.

## Running your own indexer

What most tutorials skip: you can also run your own, and it's much less infrastructure than it sounds. You don't need to run a validator. You don't need a streaming gRPC plugin. The standard pattern is a small worker process that polls a regular RPC endpoint, decodes what it finds, and writes the result into your database. That's the whole thing.

The shape of a typical polling indexer:

1. A worker runs on a schedule, say every 10 seconds.
2. On each tick, the worker asks the RPC for whatever happened recently. This is usually some combination of `getSignaturesForAddress` for your program's transaction history, `getBlock` or `getTransaction` to pull full transaction data for the new signatures, and `getProgramAccounts` or `getAccountInfo` for current account state when you need a snapshot.
3. The worker decodes the returned data using your program's IDL: parses out the events from each transaction's logs, decodes account data into typed structs.
4. The worker writes the decoded results into your database, typically with an upsert keyed by signature or account address so reruns are idempotent.
5. The worker remembers where it left off, usually by recording the last processed slot or signature, so the next tick picks up from there.

That's it. No validator. No plugin. No streaming infrastructure. Most production indexers run as a Node.js or Python or Go process behind a regular RPC endpoint, whether your own, a public one, or a paid provider like Helius or QuickNode, with a Postgres or similar database holding the results.

The polling interval is the one parameter you control. Every 10 seconds catches activity within a 10-second window of delay, which is fine for dashboards, analytics, and most user-facing features. Lower latency is possible by shortening the interval or by switching to a streaming connection if your RPC provider offers one, such as Helius webhooks or Triton's gRPC stream. The trade-off is that streaming is more code to maintain and often costs more, while polling at 10-second intervals is cheap and rarely needs touching.

There are three reasons protocols decide it's worth running their own indexer instead of using a third-party.

The first is unit economics. Once a third-party indexer bill starts adding up, replacing it with a worker process plus a Postgres database is usually much cheaper. The RPC requests to fetch the data are charged separately, but RPC pricing is generally much cheaper per request than indexer-product pricing.

The second is data sovereignty. Some applications need to guarantee they can index data without depending on any external indexing service. A regulated financial protocol, a forensics tool, or an internal analytics system for a company that doesn't want its query patterns visible to a third party are all examples. Your own indexer means no provider sees your queries or your stored data. You still rely on an RPC provider to read the chain, but the indexed view is yours.

The third is custom semantics. Third-party indexers index everything generically and let you filter. Your own pipeline can do custom processing inline: decoding specific Anchor IDLs and writing typed rows, joining account state with transaction logs at write time, computing derived values that your application needs but the generic indexer doesn't produce. The flexibility is real, even if you don't use it on day one.

## The practical decision

For a typical application, the path is:

1. **Start with direct RPC.** Just call `getAccountInfo` and `getProgramAccounts` from your frontend or backend. Works for small-scale apps with simple state. You'll outgrow it.
2. **Move to a third-party indexer for production.** Helius or Triton, whichever fits your access pattern. You pay them, they give you reliable real-time data and good APIs. This carries most apps from launch through their first year or two.
3. **Build your own indexer when the bill or the limits start to bite.** A polling worker against an RPC endpoint, writing into your own database. More code than option 2, far less infrastructure than people assume.

You don't have to commit to one path forever. The data shape stays constant across all three paths, meaning the events your program emits and the account structures defined by your IDL. The implementation underneath can change as your needs evolve. Choosing the right tier for your current needs matters more than committing to the "correct" architecture from the start.

The constant across all three paths is the events your program emits. Get those right, meaning comprehensive, well-typed, and emitted at every meaningful state change, and any of the indexing options will work. Skip events or emit them inconsistently, and no amount of fancy infrastructure on top can reconstruct what your program didn't tell anyone happened.
