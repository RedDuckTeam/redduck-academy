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

> Your Solana program produces three kinds of output. Account data is what other programs read. Program logs are what off-chain consumers read. Transaction data records the instructions, the signers, the accounts touched, and whether the transaction succeeded. The rule that ties them together is "emit an event for every important state change," which is how your data leaves the chain and reaches your frontend.

## Programs read only account data, and history does not fit there

Two facts draw the line between on-chain and off-chain data on Solana.

First, account data is the only thing programs can read from each other. There's no on-chain API for reading another program's logs and no way to subscribe to events at the program level. If your program needs to react to something another program did, you read that program's account state.

Second, account storage is expensive. Every byte you store costs rent at the rent-exempt rate. A 1KB account locks up about 8 million lamports. Storing the full history of every action a user has taken would mean creating new accounts indefinitely, which gets prohibitively expensive after the first thousand operations.

These two facts together create a strict division of labor. State that other programs need to read goes into account data. Everything else, the user-facing log of what happened, analytical data, historical traces, search-friendly indexes, lives off-chain and is built by reading the chain. The same division exists on Ethereum, where a contract cannot read its own events and storage costs far more than logs ([errors, modifiers, and events](/courses/development-on-ethereum/solidity-basics/errors-modifiers-and-events)).

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

## Account data shows the current state, not how the account got there

Anything you want to display, alert on, search by, or analyze later must be emitted as an event. Reading the account data tells you the current state. It does not tell you how the account got there.

Concretely, suppose your staking program has a `StakePosition` account with `owner`, `amount` and `staked_at` fields. An off-chain consumer can read the current state of any position by fetching the account. But the consumer cannot answer questions like:

- When was this position opened?
- Did this user previously open and close a position?
- How many positions across the protocol opened in the last 24 hours?
- What was the largest stake amount opened today?

The first question is partly answered by `staked_at`, but only because you happened to store the timestamp on the account. The other questions can't be answered from current state at all. Once a position is closed via `claim`, the account is gone. Its history is unrecoverable from the chain state.

The fix is to emit an event at every meaningful state change: position opened, position claimed, position closed via unstake. As the [errors and events lesson](/courses/development-on-solana/writing-your-first-program/errors-and-events) showed, `emit!` serializes the event struct and writes it to the transaction's logs, and the IDL carries the schema that off-chain code uses to decode it. The logs are stored with the confirmed transaction, which archival nodes and RPC providers keep and which indexers can query long after the transaction confirmed. Now any off-chain consumer with access to the historical event stream can reconstruct the full history of every position, even ones that were closed years ago.

For the claim, the event carries what the closed account held:

```rust
#[event]
pub struct PositionClosed {
    pub owner: Pubkey,
    pub amount: u64,
    pub staked_at: i64,
    pub closed_at: i64,
}

pub fn claim(ctx: Context<Claim>) -> Result<()> {
    let position = &ctx.accounts.position;
    emit!(PositionClosed {
        owner: position.owner,
        amount: position.amount,
        staked_at: position.staked_at,
        closed_at: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
```

The `Claim` accounts struct closes the position with `close = owner`, so the account is gone once the instruction finishes, and the `PositionClosed` event in the transaction's logs keeps its amount and both timestamps.

An event costs compute in the transaction that emits it, but no rent. Add the event when you write the handler, before you forget what state changes matter.

## Rent an indexer first, and run your own when the bill grows

Events sit in transaction logs, and something off chain has to collect them. The diagram above shows three ways to do it, and an application usually moves through them in this order.

Direct RPC calls from your frontend or backend work for small-scale apps with simple state. A third-party indexer, such as Helius webhooks or Triton's Yellowstone gRPC stream, pushes the transactions that touch your program to your backend. You write your code against their interface, they run the infrastructure, and you pay them. This is the right choice for most applications. Renting the infrastructure from a specialist is usually cheaper than building it yourself, especially in the early stages of an application's life.

Your own indexer is more code, but much less infrastructure than it sounds. You don't need to run a validator or a streaming gRPC plugin. The standard pattern is a small worker process that polls a regular RPC endpoint on a schedule, say every 10 seconds, decodes the new transactions and account data using your program's IDL, and writes the result into your database. A 10-second delay is fine for dashboards, analytics, and most user-facing features. Protocols build their own when the third-party bill has grown past the cost of a worker and a Postgres database, when no outside provider may see their queries or their indexed data, or when they need processing that a generic indexer doesn't do, such as joining account state with transaction logs at write time.

## Your own indexer must be safe to rerun and to rebuild from the chain

The worker remembers where it left off, usually by recording the last processed slot or signature, so the next tick picks up from there. If it stops after writing rows but before recording that position, the next tick reads the same transactions again. So each write is an upsert keyed by signature or account address, and processing a transaction twice leaves the same rows as processing it once.

The database is a view derived from the chain, so it can also be rebuilt from nothing: the worker starts from the program's first transaction and decodes every event again. This works for as long as your RPC provider serves the old transactions. Whichever of the three ways reads the chain, it finds only the events the program emitted.

So for every account your program can close or overwrite, ask which questions about the protocol's past can no longer be answered once it is gone. Each of those questions needs an event.
