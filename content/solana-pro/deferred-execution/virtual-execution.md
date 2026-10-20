---
title: Virtual execution
type: lecture
order: 30
faq:
  - question: What is virtual execution?
    answer: >-
      The program records the result of an action in its state and performs the real transfer
      later, in a separate transaction that brings the accounts the transfer needs. The result is
      final at once, and only the transfer is deferred.
  - question: Why can't the taker's transaction pay the maker directly?
    answer: >-
      Because the maker's token account is not in the taker's transaction. The taker does not
      know which makers they will match, and a transaction holds only a few dozen accounts. So
      the program marks the maker's order as filled and records the amount owed, and the payout
      happens when someone brings the maker's account.
  - question: Is the virtual result worth anything before it is executed?
    answer: >-
      Only what the program lets it be. An owed amount cannot be spent until it is settled, so
      the program has to say what an unsettled result can and cannot do.
  - question: Who executes the real step?
    answer: >-
      Whoever brings the accounts, often a keeper or any user. The program checks the stored
      result and the accounts that were brought, and it does not care who sent the transaction.
  - question: How does Drift use it?
    answer: >-
      A position's profit and loss is written into the position as it changes. Moving it into
      the user's collateral is a separate instruction, settle PnL, and anyone can call it for any
      user.
  - question: Where does ZK Compression use it?
    answer: >-
      A spent compressed account is written into a queue in the transaction that spends it. A
      separate node, the forester, later moves the queue into the Merkle tree in its own
      transactions.
---
> On Solana a program can change only the accounts that are in the transaction, and the person who sent the transaction brought only their own accounts. When a trade matches two people, the second person's accounts are not there, and the program has no place to put their money. The match still has to happen in this transaction.

## The maker is not in the transaction

In an order book, a taker sends a transaction with their order, their token account and the book account. The program finds a maker's order at a matching price and fills it. Now the maker is owed tokens, and the program has to put them somewhere. The maker's token account is not in the transaction, because the taker did not know which maker they would match, and could not have brought every maker's account anyway: a transaction holds only a few dozen accounts, and a big order matches many makers.

The naive solution is to store the maker's token account inside the order and make the taker's client find every order it will hit and pass those accounts along. This costs rent on every order and compute on every match, and it still breaks when an order matches more makers than fit into one transaction.

The same thing happens in other protocols, for different reasons. On a perpetuals exchange, a trade can close with a profit, but the money for that profit comes from a pool of other traders' losses, and that pool may be empty at that moment. In ZK Compression, spending a compressed account means removing it from a Merkle tree that thousands of other accounts share, so every transaction that touches the tree would have to wait for every other one. In each case the program can decide the result in this transaction, but the accounts or the money for carrying it out are missing.

## Record the result, deliver it later

The program splits the action into two parts: deciding the result and carrying it out. The match transaction does the first part. It writes two things into the maker's order: the order is filled, and the maker is owed 40 tokens. The maker's order is inside the book account, and the book is in the transaction, so the program can write there, and no tokens move yet.

The second part is a separate transaction. Whoever brings the maker's token account can send it: the maker, a keeper, or any other user. The program reads the record from the order, sends the 40 tokens, and marks the record as paid. With **virtual execution**, the action is executed in the program's state first, and the real transfer is performed later, when the accounts for it arrive.

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

## Monaco: the match marks the order, the settlement pays it

Monaco is an order book for betting markets, and its matching instruction never sends tokens to the maker. The maker's accounts are not in the taker's transaction, and keeping an account list in every order would cost rent on every order and compute on every match. So the match only marks the maker's order as filled and records what the maker is owed. The payout is a separate instruction that anyone can send with the maker's accounts, and the program pays exactly the amount the match recorded. The match transaction stays small no matter how many makers it fills.

## Drift: the profit is in the position, the money comes on settlement

Drift is a perpetuals exchange, and a trader's profit is written into their position long before it reaches their collateral, the balance they can withdraw. A trade or a liquidation changes the position and records the profit or loss in it. The money does not move in that transaction, because profits are paid out of a pool that collects settled losses, and that pool may not have enough at that moment. Moving the profit into the collateral is a separate instruction, settle PnL, and anyone can call it for any trader once the pool can pay.

## ZK Compression: spent accounts wait in a queue

ZK Compression stores account data as leaves of Merkle trees, and a spent account is not removed from its tree in the transaction that spends it. That transaction proves that the account was in the tree, writes the new state, and drops the removal into a queue, so it does not have to change the shared tree itself. A separate node, the forester, later takes the queue and writes the removals into the tree in its own transactions. For the user the spend is complete as soon as the transaction lands, and the tree is updated afterwards.

## The recorded amount is only a claim

Between the record and the payout, the maker's order says that 40 tokens are owed, and the maker's token account shows nothing. The program has to decide what this record may be used for. If the maker could place a new bet with those 40 tokens before the payout, the same money would be in two places at once. So the recorded amount is a claim: the program pays it out, and until then no other instruction accepts it as money.

## Two questions for every action

Every action gets two questions: what is the result, and are the accounts for it in this transaction? The result is written down right away, in whatever accounts the transaction has. The transfer waits for the transaction that brings the right accounts, whoever sends it.
