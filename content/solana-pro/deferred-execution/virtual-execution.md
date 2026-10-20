---
title: Virtual execution
type: lecture
order: 30
---

Sometimes you can't predict or know the exact execution details of an action. To solve this problem, protocols apply what we call **Virtual Execution**: the execution is made virtually, with the real execution performed later on, when the details of that execution become known.

<svg role="img" viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Two transactions, one trade</title><desc>Left: transaction 1, the match, sent by the taker, contains the taker's order, the book with the maker's order, and the taker's token account. The book now says the maker's order is filled and 40 is owed. The maker's token account is drawn outside the transaction, marked not in transaction 1. Right: transaction 2, the settlement, sent by anyone, contains the book, where the record changes from owed 40 to paid, and the maker's token account, which receives 40. An arrow from the record in transaction 1 to transaction 2 shows that the record carries the result.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Two transactions, one trade</text>
  <rect x="30" y="75" width="320" height="240" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="40" y="93" text-anchor="start" font-size="10" fill="#565653" font-family="monospace" font-weight="bold">tx 1: match, sent by the taker</text>
  <rect x="60" y="110" width="260" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="134" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">taker&#x27;s order</text>
  <rect x="60" y="162" width="260" height="62" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="190" y="182" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">book: maker&#x27;s order</text>
  <text x="190" y="200" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">filled, owed 40</text>
  <text x="190" y="215" text-anchor="middle" font-size="8.5" fill="#565653" font-family="monospace">written here, the book is in the tx</text>
  <rect x="60" y="236" width="260" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="260" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">taker&#x27;s token account</text>
  <rect x="60" y="330" width="260" height="40" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="190" y="348" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">maker&#x27;s token account</text>
  <text x="190" y="362" text-anchor="middle" font-size="8.5" fill="#565653" font-family="monospace">not in tx 1, nothing to write to</text>
  <line x1="320" y1="193" x2="390.0" y2="193.0" stroke="#ed4937" stroke-width="2"/>
  <polygon points="390.0,187.0 390.0,199.0 400,193" fill="#ed4937"/>
  <rect x="400" y="75" width="290" height="240" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="410" y="93" text-anchor="start" font-size="10" fill="#565653" font-family="monospace" font-weight="bold">tx 2: settle, sent by anyone</text>
  <rect x="425" y="162" width="240" height="62" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="545" y="182" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">book: maker&#x27;s order</text>
  <text x="545" y="200" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">owed 40 -&gt; paid</text>
  <line x1="545" y1="224" x2="545.0" y2="240.0" stroke="#000000" stroke-width="2"/>
  <polygon points="551.0,240.0 539.0,240.0 545,250" fill="#000000"/>
  <rect x="425" y="250" width="240" height="48" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="545" y="270" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">maker&#x27;s token account</text>
  <text x="545" y="288" text-anchor="middle" font-size="11" fill="#ed4937" font-family="monospace" font-weight="bold">+40</text>
  <text x="545" y="338" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">anyone with the maker&#x27;s token account</text>
  <text x="545" y="351" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">can send tx 2</text>
  <text x="360" y="398" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The result is written where the program can write. The tokens move when the right account arrives.</text>
</svg>

## Examples

**Monaco Protocol's order book.** When a match happens between a maker and a taker, the protocol doesn't yet know how to send the tokens to the maker, because in order to do that it would have to know the accounts of the maker, for which it would require to store additional data and have the taker compute the account addresses. The taker's transaction brings only the taker's accounts and the book, and a transaction holds only a few dozen accounts, while a big order matches many makers. So the match marks the maker's order as filled and records what the maker is owed, and later on, when someone is ready to perform the execution, they bring the virtually executed send into a real one: anyone can send the settlement instruction with the maker's accounts, and the program pays exactly what the match recorded. The match transaction stays small no matter how many makers it fills.

**Drift.** Drift is a perpetuals exchange, and a trader's profit is written into their position long before it reaches their collateral. When a trade or a liquidation changes a position, the profit or loss is written into the position in that transaction, but the money does not move, because profits are paid out of a pool that collects settled losses, and that pool may not have enough at that moment. Moving the profit into the collateral is a separate instruction, settle PnL, and anyone can call it for any trader once the pool can pay.

**ZK Compression** stores account data as leaves of Merkle trees, and a spent account is not removed from its tree in the transaction that spends it. That transaction proves that the account was in the tree, writes the new state, and drops the removal into a queue on the spot, so it does not have to change the shared tree itself. A separate node, the forester, later takes the queue and writes the removals into the tree in its own transactions.

Until the real execution happens, the virtual result is a claim, not a balance: no other instruction should accept it as money.
