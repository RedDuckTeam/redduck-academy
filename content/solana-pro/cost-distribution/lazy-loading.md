---
title: Lazy loading
type: lecture
order: 10
faq:
  - question: What does lazy loading mean in a Solana program?
    answer: >-
      The program computes an account's result only when someone touches that account,
      instead of writing the result into every account when something changes. Each account
      stores enough data to compute its own result later, usually two numbers. One is a
      running total kept in a central place. The other is a marker that says how much of that
      total the account has already seen. The result is the difference, and whoever touches
      the account pays for the computation.
  - question: My staking program has to pay rewards to every staker. Do I have to loop over them?
    answer: >-
      No, and on Solana you can't. A transaction holds only about 40 accounts, so paying
      10,000 stakers takes hundreds of transactions every time. Instead, keep one number in
      the pool, the reward per staked token, and raise it when rewards arrive. Each staker's
      account keeps the value it saw last. When a staker touches their account, pay the
      difference times their stake and update their marker.
  - question: How does Drift charge funding without touching every position?
    answer: >-
      The market stores a cumulative funding rate, the total funding per unit of position
      since the market opened, and the hourly update changes only that one number. Each
      position stores the rate it saw last. When a trade, a close or a liquidation touches the
      position, the program first settles the difference times the position size, then updates
      the marker.
  - question: Why does Helium call its rewards program the lazy distributor?
    answer: >-
      Because nothing is distributed until someone touches a device. Oracles sign the total a
      device has earned since the beginning, the device's account stores how much was already
      paid, and a claim pays the difference. A million devices earn rewards every day, and
      Helium pays for none of those updates.
  - question: What happens to accounts that nobody touches?
    answer: >-
      Nothing, and that is the cost of the pattern. For a reward this is fine, since the
      difference is paid whenever the claim comes. For a liquidation it is not. If an update
      has to happen on time, someone has to be paid to touch the account, or the design has to
      change so that an old value does no harm.
  - question: In what order do I settle and change a position?
    answer: >-
      Settle first, then change. The difference between the running total and the marker
      belongs to the position as it was. So pay or charge that difference, move the marker to
      the current total, and only then apply the deposit, withdrawal or trade. The other order
      pays the new size for the old period.
---

> A program can't update every account when something changes, because every account it writes to has to be in the transaction, and someone has to send that transaction and pay for it. Every design that says "for all holders" or "every hour" has this problem, and the protocols that run at scale on Solana all solve it the same way.

## For all holders

Three facts about Solana rule out one kind of design. Nothing happens by itself, a transaction is small and has a compute limit, and the client brings every account. That rules out designs like paying the reward to all holders, charging funding on every position every hour, or marking every open proposal as old when the signers change.

A transaction can hold only about 40 accounts, so a protocol with 10,000 stakers needs hundreds of transactions just to pay everyone once, and someone has to build, sign and pay for each of them. If the rewards are daily, that is hundreds of transactions a day from a server that has to stay up. The simplest design is to run that server, and then the protocol works only as long as the server does.

In normal programming, lazy loading is an optimization, where you don't compute or fetch something until someone asks for it. On Solana it is usually the only design that works, because the transaction that computes the result for everyone can't be built.

## Store the inputs, not the result

The accounts do not store the result. Each one stores the data needed to compute its result later, and the program computes it inside the transaction that touches the account. That transaction belongs to whoever needed to touch the account, so that person pays. This is **lazy loading**. Nothing is computed until someone asks for it.

In most protocols, this data is two numbers. The first is a running total, kept in one central place such as a pool account or a message signed by an oracle. The second is a marker, kept in each account, that records how much of the running total this account has already seen. The result is the difference between the two.

Take a staking pool with 1,000 staked tokens. Then 10 tokens of rewards arrive. The pool pays nobody. It only raises one number, the reward per staked token, by 10 / 1,000 = 0.01. Now a staker with 100 tokens comes to claim. Their account says the last reward per token they saw was 0.03, and the pool now says 0.05. The difference is 0.02, times 100 tokens, so the staker is owed 2 tokens. The program pays them and writes 0.05 into the staker's account. No other staker's account was in this transaction, and none of them is wrong. Each holds the same two numbers and will compute its result the same way when its owner comes. The numbers in the diagram below are only an example.

<svg role="img" viewBox="0 0 720 370" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Only the touched account is updated</title><desc>A pool account at the top holds the central state, a reward per staked token of 0.05 and 1,000 tokens staked. Below it are three staker accounts. Staker A, with a stake of 100 and a last seen value of 0.03, is in the transaction and is highlighted. The program pays the difference of 0.02 times 100, which is 2 tokens, and moves the marker to 0.05. Staker B, with a stake of 300 and a last seen value of 0.05, is not in the transaction and is owed nothing yet. Staker C, with a stake of 50 and a last seen value of 0.00, is not in the transaction and has 2.5 tokens waiting for a touch.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Only the touched account is updated</text>

  <rect x="235" y="75" width="250" height="78" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="235" y="75" width="250" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="93" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">pool account, central state</text>
  <text x="360" y="121" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">reward per staked token 0.05</text>
  <text x="360" y="139" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">1,000 tokens staked</text>

  <line x1="300" y1="153" x2="160" y2="205" stroke="#ed4937" stroke-width="2"/>
  <line x1="360" y1="153" x2="360" y2="205" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="420" y1="153" x2="560" y2="205" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>

  <rect x="85" y="205" width="150" height="58" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="160" y="224" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">staker A</text>
  <text x="160" y="239" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">stake 100</text>
  <text x="160" y="253" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">last seen 0.03</text>
  <rect x="285" y="205" width="150" height="58" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="224" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">staker B</text>
  <text x="360" y="239" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">stake 300</text>
  <text x="360" y="253" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">last seen 0.05</text>
  <rect x="485" y="205" width="150" height="58" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="560" y="224" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">staker C</text>
  <text x="560" y="239" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">stake 50</text>
  <text x="560" y="253" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">last seen 0.00</text>

  <text x="160" y="284" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">(0.05 - 0.03) x 100 = 2 paid</text>
  <text x="160" y="300" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937">marker moves to 0.05, A pays the fee</text>
  <text x="360" y="284" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">not in this transaction</text>
  <text x="360" y="300" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">nothing owed yet</text>
  <text x="560" y="284" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">not in this transaction</text>
  <text x="560" y="300" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2.5 waiting for a touch</text>

  <text x="360" y="338" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">All three stakers hold the same two numbers. Only the one in the</text>
  <text x="360" y="354" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">transaction computes its result, and that staker pays for it.</text>
</svg>

Two details matter here. First, settle before you change anything. The difference belongs to the stake as it was, so pay it, move the marker, and only then apply the deposit or withdrawal. Second, keep the running total precise. It is a fraction that grows in small steps, so store it with plenty of extra precision and round only when you pay.

## Drift: funding is settled when the position is touched

Drift is a perpetuals exchange, and it charges funding on every open position every hour without touching any of them. A market has thousands of open positions, and charging each of them every hour would be hundreds of thousands of writes a day, all sent and paid for by Drift. Instead, the market account stores a cumulative funding rate, the total funding per unit of position since the market opened, and the hourly update changes only that one number. Each position stores the cumulative rate it saw last. When a trade, a close or a liquidation touches a position, the program first takes the difference between the two rates, multiplies it by the position size and settles the result. Then it moves the position's marker to the current market value, and only then does the actual trade, close or liquidation. A position nobody touched for a week settles a week of funding in one subtraction.

## Helium: a million devices, one claim each

Helium pays rewards to the owners of hotspots, the devices that provide its wireless network, and there are about a million of them. Paying every device once a day would be a million transactions a day, about twelve every second around the clock, all sent and paid for by Helium.

So Helium sends nothing. Oracles sign the total a device has earned since the beginning, and the device's account stores how much was already paid out. When someone claims, the program compares the signed total with the paid amount, pays the difference, and sets the paid amount to the signed total. Here the running total is stored in a signed message instead of an account, and the marker is stored in the device's account. Helium's program for this is called the lazy distributor. Anyone can send the claim, but nobody has to until the owner wants the money.

## Squads: one counter instead of a loop

Squads is a multisig. Members approve proposals, and when enough of them approve, the proposal executes. When the members change, because a member is removed or the threshold goes up, proposals approved by the old members must not execute under the new ones. The simplest design goes through every open proposal and marks it as old, but the proposals are separate accounts, and none of them is in the transaction that changed the members.

Squads keeps one number in the multisig account, the stale transaction index. When the members or the threshold change, this number is set to the index of the latest proposal. Every proposal already has an index, assigned when it was created. When someone approves or executes a proposal, the program compares the two. If the proposal's index is at or below the stale index, the proposal is old and cannot execute. That is one write when the members change and one comparison when a proposal is touched, whether the multisig has ten open proposals or ten thousand.

The marker was not added for the pattern. The proposal's index already existed, and the pattern only needed something to compare it with.

## Fragmetric: the update happens on every transfer

Fragmetric is a liquid restaking protocol. Holders of its token, fragSOL, earn rewards based on how much they held and for how long, so the protocol needs every holder's balance over time. Reading every holder's account on a schedule is the same problem as in the first section, a loop over every account that nobody can send.

fragSOL is a Token-2022 token with a transfer hook, a program that the token program calls on every transfer. The hook already runs on both the sender's and the receiver's account, because a transfer has to touch both, so Fragmetric updates the reward accounting of both holders inside it. The pattern needs someone to touch the account, and here that already happens on every transfer, so the accounting costs nothing extra.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Settle first, then change the stake</title><desc>Two boxes side by side. Both start with a stake of 100, a marker of 0.03 and a pool total of 0.05, and a deposit of 50 arrives. On the left, the deposit is applied first, the stake becomes 150, and then the program settles 0.02 times 150, which is 3 tokens, although only 2 were owed. On the right, the program first settles 0.02 times 100, which is 2 tokens, moves the marker to 0.05, and only then applies the deposit, so the staker is paid exactly 2.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A deposit of 50 arrives</text>

  <rect x="40" y="70" width="300" height="250" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Deposit, then settle</text>
  <rect x="80" y="110" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="132" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">stake 100, marker 0.03, total 0.05</text>
  <line x1="190" y1="146" x2="190" y2="160" stroke="#000000" stroke-width="2"/>
  <polygon points="184,158 196,158 190,168" fill="#000000"/>
  <rect x="80" y="168" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">deposit 50, stake 150</text>
  <line x1="190" y1="204" x2="190" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="184,216 196,216 190,226" fill="#000000"/>
  <rect x="80" y="226" width="220" height="36" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="190" y="248" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">settle 0.02 x 150 = 3</text>
  <text x="190" y="292" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">paid 3, owed 2</text>

  <rect x="380" y="70" width="300" height="250" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Settle, then deposit</text>
  <rect x="420" y="110" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="132" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">stake 100, marker 0.03, total 0.05</text>
  <line x1="530" y1="146" x2="530" y2="160" stroke="#000000" stroke-width="2"/>
  <polygon points="524,158 536,158 530,168" fill="#000000"/>
  <rect x="420" y="168" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">settle 0.02 x 100 = 2</text>
  <line x1="530" y1="204" x2="530" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="524,216 536,216 530,226" fill="#000000"/>
  <rect x="420" y="226" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="248" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">deposit 50, stake 150</text>
  <text x="530" y="292" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">paid 2</text>

  <text x="360" y="346" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The difference belongs to the stake as it was. Settle before the stake changes.</text>
</svg>

## Accounts that nobody touches

Lazy loading has one cost. An account nobody touches is never updated. For rewards this is fine. The money waits, and the difference is paid whenever the claim comes. For liquidations it is not. A position nobody touches is never liquidated, and the protocol takes the loss. The same goes for an order that has to expire or a vote that has to close.

If an update has to happen on time, lazy loading alone is not enough. You can pay someone to touch the account, for example a bot that earns a reward for every liquidation it triggers. Or you can change the design so that an old value does no harm, for example by checking the condition whenever the account is touched next, instead of requiring an action at a fixed time.

The result is not stored anywhere, so anything that reads the chain, a wallet, an indexer, your own frontend, has to compute it from the same two numbers. That is fine as long as both fields are public and the formula is documented. It becomes a problem only when a client expects to read the result as a ready field.

## Nothing is computed for everyone

Every sentence in a design that says "for all" or "every hour" describes a transaction that nobody can send. The protocols that work store what each account needs to compute its own result, and the result appears when someone touches the account and pays for it. An account nobody touches stays as it was, and either the design is fine with that, or it pays someone to touch it.
