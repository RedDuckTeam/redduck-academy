---
id: 1056989468
title: Action as data
type: lecture
order: 20
---

Some actions need a signer who is offline, or a condition that isn't true yet. Here the **Action as Data** pattern comes in.

On Solana, a transaction signature is valid only for a short period of about a minute. So the common EVM flow does not work: sign an order once, let a server submit it later. No signed orders waiting for a taker, no approvals collected over a week. A durable nonce keeps one prebuilt transaction alive longer, but the signature still cannot be reused, and the accounts cannot change.

One workaround is to keep the user's request on a server and let it act with its own key. But then the server signs transactions that move the user's money. It can crash, censor, or be taken over.

Action as Data is the pattern of storing the future action on-chain, without executing it. A Program Derived Account (PDA) stores the target program address, the account list and the instruction payload. Later, when the conditions are met, a keeper (such as an **[untrusted executor](/courses/solana-pro/permissionless-execution/untrusted-executor)**) submits the transaction, and **the PDA approves the transaction with `invoke_signed`**. The action that the user put on-chain before its execution was always public: anyone could read it and execute it once the condition is met.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Action as data</title><desc>A user puts an action into an account, drawn as a document inside a box with a clock next to it, meaning it waits. Later a keeper sends execute, and the PDA signs for the user.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Action as data</text>
  <circle cx="80" cy="136" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 66 166 Q 80 144 94 166 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="80" y="182" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">user</text>
  <line x1="102" y1="145" x2="149.0" y2="145.0" stroke="#000000" stroke-width="2"/>
  <polygon points="149.0,139.0 149.0,151.0 160,145" fill="#000000"/>
  <text x="130" y="135" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">stores</text>
  <rect x="160" y="100" width="170" height="90" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="245" y="122" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">account</text>
  <rect x="215" y="132" width="60" height="46" rx="0" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <line x1="224" y1="144" x2="266" y2="144" stroke="#000000" stroke-width="1"/>
  <line x1="224" y1="154" x2="266" y2="154" stroke="#000000" stroke-width="1"/>
  <line x1="224" y1="164" x2="254" y2="164" stroke="#000000" stroke-width="1"/>
  <circle cx="300" cy="160" r="11" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <line x1="300" y1="160" x2="300" y2="153" stroke="#000000" stroke-width="2"/>
  <line x1="300" y1="160" x2="305" y2="163" stroke="#000000" stroke-width="2"/>
  <text x="300" y="185" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">waits</text>
  <line x1="330" y1="145" x2="409.0" y2="145.0" stroke="#000000" stroke-width="2"/>
  <polygon points="409.0,139.0 409.0,151.0 420,145" fill="#000000"/>
  <text x="375" y="135" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">later</text>
  <circle cx="450" cy="136" r="8" fill="#e0deda" stroke="#565653" stroke-width="2"/>
  <path d="M 436 166 Q 450 144 464 166 Z" fill="#e0deda" stroke="#565653" stroke-width="2"/>
  <text x="450" y="182" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">anyone</text>
  <line x1="472" y1="145" x2="529.0" y2="145.0" stroke="#ed4937" stroke-width="3"/>
  <polygon points="529.0,139.0 529.0,151.0 540,145" fill="#ed4937"/>
  <text x="506" y="135" text-anchor="middle" font-size="9" fill="#ed4937" font-family="monospace">execute</text>
  <rect x="540" y="120" width="120" height="50" rx="0" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="600" y="142" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">target</text>
  <text x="600" y="158" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">PDA signs</text>
  <text x="360" y="250" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The action waits on-chain as data. When its time comes, anyone sends it and the PDA signs for the user.</text>
</svg>

## Examples

- **Squads** creates an account for every proposed transaction, storing the full list of instructions inside it. Members approve the proposal one by one. Once enough members vote yes, anyone can trigger the execution (even if they aren't a member), and the program named 'vault' will execute the stored instructions.
- **Realms** does the same, by keeping governance instructions inside the proposal account itself. Once a vote passes, any user could trigger the stored instructions to execute.
- A **Jupiter** limit order is an account with a price, DCA is an account with a schedule, and when the price or the time comes, anyone can fill it.

The only trade-off in this pattern is that the rent for every pending action has to be paid, and the funds are locked until it runs. So every action needs a way to cancel or expire.
