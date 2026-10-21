---
title: Action as data
type: lecture
order: 20
---

Some actions need a signer who is offline, or a condition that isn't true yet. Here the **Action as Data** pattern comes in.

On Solana, a transaction signature is valid only for a short period of about a minute. So the common EVM flow does not work: sign an order once, let a server submit it later. No signed orders waiting for a taker, no approvals collected over a week. A durable nonce keeps one prebuilt transaction alive longer, but the signature still cannot be reused, and the accounts cannot change.

One workaround is to keep the user's request on a server and let it act with its own key. But then the server signs transactions that move the user's money. It can crash, censor, or be taken over.

Action as Data is the pattern of storing the future action on-chain, without executing it. A Program Derived Account (PDA) stores the target program address, the account list and the instruction payload. Later, when the conditions are met, a keeper (such as an **[untrusted executor](/courses/solana-pro/permissionless-execution/untrusted-executor)**) submits the transaction, and **the PDA approves the transaction with `invoke_signed`**. The action that the user put on-chain before its execution was always public: anyone could read it and execute it once the condition is met.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The action is stored in an account</title><desc>In the middle, a PDA account card holds a pending action: program swap, the accounts, the data sell 10 SOL, and the condition price at or above 150. On the left, the user at 10:00 stores the action and locks the tokens, signing once. On the right, a keeper at 14:00 sends execute, and the PDA signs the call to the swap program through invoke signed. A crossed-out note shows that a signed transaction would have expired after about a minute.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The action is stored in an account</text>
  <rect x="250" y="80" width="220" height="190" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="250" y="80" width="220" height="28" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">PDA: pending action</text>
  <text x="262" y="132" text-anchor="start" font-size="10" fill="#000000" font-family="monospace">program:   swap</text>
  <text x="262" y="162" text-anchor="start" font-size="10" fill="#000000" font-family="monospace">accounts:  user tokens, pool</text>
  <text x="262" y="192" text-anchor="start" font-size="10" fill="#000000" font-family="monospace">data:      sell 10 SOL</text>
  <text x="262" y="222" text-anchor="start" font-size="10" fill="#000000" font-family="monospace">condition: price &gt;= 150</text>
  <line x1="250" y1="148" x2="470" y2="148" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="250" y1="178" x2="470" y2="178" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="250" y1="208" x2="470" y2="208" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <rect x="40" y="140" width="150" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="115" y="160" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">user</text>
  <text x="115" y="178" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">10:00</text>
  <line x1="190" y1="165" x2="240.0" y2="165.0" stroke="#000000" stroke-width="2"/>
  <polygon points="240.0,159.0 240.0,171.0 250,165" fill="#000000"/>
  <text x="220" y="153" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">store</text>
  <text x="115" y="215" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">locks the tokens</text>
  <text x="115" y="229" text-anchor="middle" font-size="9.5" fill="#ed4937" font-family="monospace" font-weight="bold">signs once</text>
  <rect x="530" y="96" width="150" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="605" y="116" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">keeper, anyone</text>
  <text x="605" y="134" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">14:00, price is 150</text>
  <line x1="530" y1="121" x2="480.0" y2="121.0" stroke="#000000" stroke-width="2"/>
  <polygon points="480.0,127.0 480.0,115.0 470,121" fill="#000000"/>
  <text x="500" y="109" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">execute</text>
  <rect x="550" y="220" width="130" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="615" y="240" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">swap program</text>
  <text x="615" y="258" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">sells 10 SOL</text>
  <line x1="470" y1="245" x2="540.0" y2="245.0" stroke="#000000" stroke-width="2"/>
  <polygon points="540.0,239.0 540.0,251.0 550,245" fill="#000000"/>
  <text x="510" y="236" text-anchor="middle" font-size="8.5" fill="#ed4937" font-family="monospace" font-weight="bold">PDA signs</text>
  <text x="510" y="260" text-anchor="middle" font-size="8.5" fill="#ed4937" font-family="monospace">invoke_signed</text>
  <rect x="40" y="290" width="220" height="44" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="150" y="309" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">a signed transaction instead</text>
  <text x="150" y="324" text-anchor="middle" font-size="9.5" fill="#ed4937" font-family="monospace">would have expired after a minute</text>
  <text x="360" y="372" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The user signs once, at 10:00. At 14:00 the PDA signs for them.</text>
</svg>

## Examples

**Squads** is a multisig, and its members are rarely online at the same time. Squads creates an account for every proposed transaction, storing the full list of instructions inside it. Members approve the proposal one by one, over hours or days, and each approval is a small transaction of its own. Once enough members vote yes, a member with execute rights triggers the execution, and the program runs the stored instructions with the vault PDA as the signer through `invoke_signed`. The vault owns the funds, so the stored action can move them, and no member's key is needed at execution time.

**Realms**, the governance program behind most Solana DAOs, does the same by keeping governance instructions inside the proposal's accounts. Voters vote over days. Once a vote passes and the hold-up time ends, a delay during which the proposal can still be stopped, any user can trigger the stored instructions to execute. The governance PDA is the authority over the treasury, so it signs for the instructions, and the person who sends the transaction only pays the fee.

**Jupiter.** A limit order is an account with a price and a size, and the tokens being sold are moved into an account the program controls when the order is placed. DCA is an account with a schedule. When the price or the time comes, a keeper sends the transaction that executes the stored swap, and the user has not signed anything since the order was placed.

The only trade-off in this pattern is that the rent for every pending action has to be paid, and the funds are locked until it runs. So every action needs a way to cancel or expire.
