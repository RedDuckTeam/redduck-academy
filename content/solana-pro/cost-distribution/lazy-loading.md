---
title: Lazy loading
type: lecture
order: 10
faq:
  - question: What does lazy loading mean in a Solana program?
    answer: >-
      The program does not write the result into every account when something changes.
      Instead, each account stores what is needed to compute its result later: usually a
      running total that is kept in one place, and a marker of how much of that total the
      account has already seen. The result is the difference between the two. It is computed
      when someone touches the account, and that person pays for it.
  - question: My staking program has to pay rewards to every staker. Do I have to loop over them?
    answer: >-
      No, and you do not need to. Keep one number in the pool, the reward per staked token, and
      raise it when rewards arrive. Each staker's account keeps the value it saw last. When a
      staker touches their account, pay the difference times their stake and move their marker
      to the current value. Nobody else's account is in that transaction.
  - question: How does Drift charge funding without touching every position?
    answer: >-
      The market stores a running total of funding per unit of position, and the hourly update
      changes only that number. Each position stores the total it last saw. When a trade, a
      close or a liquidation touches the position, the difference times the position size is
      settled first, and the marker moves to the current total.
  - question: Why does Squads need only one counter when the signers change?
    answer: >-
      Because every proposal already has a number. The multisig sets the counter to the number
      of the latest proposal, and a proposal with a number at or below the counter is stale.
      One write when the signers change, one comparison when a proposal is read.
  - question: What happens to accounts that nobody touches?
    answer: >-
      Nothing happens to them. For a reward this is fine, because the difference is paid
      whenever the claim comes. For a liquidation or an expiry it is not. If an action has to
      happen at a certain time, someone has to be paid to touch the account, or the design has
      to change so that an old value does no harm.
  - question: In what order do I settle and change a position?
    answer: >-
      Settle first, then change the stake. The difference belongs to the stake as it was, so
      pay it, move the marker to the current total, and only then apply the deposit, withdrawal
      or trade. The other order pays the new size for the old period.
---

> A Solana program can only work with the accounts that the transaction brings, and no transaction happens by itself: someone has to send it and pay for it. Every design that has to update all holders or charge every position every hour runs into this, and most of them end up with a server that loops over the accounts. But what if we made the program lazy?

## For all holders

A staking pool has thousands of stakers, and when rewards arrive, the simplest design pays every staker their share right away. To do that, the program has to write to every staker's account, and a transaction holds only a few dozen accounts. So one reward turns into hundreds of transactions, and somebody has to build, sign and pay for all of them. The naive solution is your own server that sends them, and then the protocol lives exactly as long as your server does.

The same problem appears wherever one event changes many accounts. A perpetuals exchange charges funding on every open position every hour. A wireless network pays rewards to a million devices every day, and a multisig has to invalidate every open proposal when its signers change. In every case one event has to reach thousands of accounts, and no user will send those transactions, because the sender pays the fees for everyone else and gets nothing for it.

## Compute on touch

Instead of pushing the result into every account, the program stores in each account only what is needed to compute the result later, and computes it only when a transaction accesses that specific account. Whoever sent that transaction wanted the result, and that person pays for the computation. This is **lazy loading**. In traditional programming it is an optimization, where you don't compute something until someone asks for it. On Solana it is one of the best ways to build a protocol.

In the staking pool, the pool account keeps one number, the reward per staked token. It says how much reward every staked token has earned since the pool started. When 10 tokens of rewards arrive on 1,000 staked tokens, the pool pays nobody. It only raises the reward per staked token by 0.01, because every staked token has now earned 0.01 more. Each staker's account keeps the reward per staked token as it was at their last claim. Everything their tokens earned since then is owed to them:

```
// what every staked token earned since this staker's last claim, times their stake
owed = (pool.reward_per_token - staker.last_reward_per_token) * staker.stake
```

Later a staker with 100 tokens comes to claim. The pool's reward per staked token is now 0.05, and the staker's account still says 0.03 from their last claim. The program puts these numbers into the formula: (0.05 - 0.03) * 100 = 2 tokens. It pays the 2 tokens and writes 0.05 into the staker's account, so the next claim starts from there. No other staker was in this transaction, and none of them is wrong. Each of them keeps their own last value, and the same formula will give them the right amount when they come.

Every protocol below works the same way. One shared number grows over time and is kept in one place. Each account keeps its own copy of that number from the last time it was updated. The difference between the shared number and the copy is everything that this account has missed since then.

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

  <text x="360" y="338" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">All three stakers hold the same two numbers. Only staker A is in the</text>
  <text x="360" y="354" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">transaction, so only A's reward is computed now.</text>
</svg>

A deposit or a withdrawal changes the stake, and the payout has to happen before that change. Our staker with 100 tokens is owed 2 tokens, and now they deposit 50 more. If the program adds the deposit first, the stake becomes 150, and the formula gives (0.05 - 0.03) * 150 = 3 tokens. The extra token is a reward for 50 tokens that were not in the pool during that period. So the program first pays what the old stake earned, writes 0.05 as the last value, and only then adds the 50 tokens. The same order applies to a withdrawal.

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

## Squads: one counter instead of a loop

Squads is a multisig. When its signers change, every proposal that the old signers approved has to become stale, so that it cannot execute under the new signers. The proposals are separate accounts, and none of them is in the transaction that changes the signers. So the multisig does not go through them at all. Every proposal gets a number when it is created, and the multisig keeps one counter. When the signers change, the counter is set to the number of the latest proposal. Later, when someone tries to execute a proposal, the program compares the proposal's number with the counter. If the number is at or below the counter, the proposal was created before the signers changed, so it is stale. One write when the signers change, one comparison per proposal, no matter how many proposals there are.

## Fragmetric: the update happens on every transfer

Fragmetric is a liquid restaking protocol. Holders of its token, fragSOL, earn rewards for how much they held and for how long, so the protocol has to know when every balance changed. Checking every holder on a schedule would be the same loop over every account that nobody sends. Instead, fragSOL is issued through Token-2022, the newer version of Solana's token program, which has extensions that the old token program does not. One of them is the transfer hook: the token's creator registers a program of their own, and Token-2022 calls that program every time someone transfers the token. Fragmetric registered its reward program as the hook. A balance can only change in a transfer, and a transfer already has both the sender's and the receiver's accounts in the transaction. So Fragmetric's program updates the reward accounting of both holders right there, and the accounting comes for free.

## Helium: a million devices, one claim each

Helium pays rewards to the owners of about a million devices. Paying each device once a day would be a million transactions a day, all sent and paid for by Helium. So Helium sends nothing. Its oracle signs one number per device: the total that the device has earned since the beginning. The device's account stores how much of that total was already paid out. When the owner claims, the program pays the difference between the two and writes the signed total as the new paid amount. These are the same two numbers as in the staking pool, except that the shared number comes in a signed message instead of an account.

## Drift: funding is settled when the position is touched

Drift is a perpetuals exchange. Every hour its markets charge funding, a payment between longs and shorts, on every open position. The program never goes through the positions for that. Instead, the market stores one shared number, the total funding per unit of position since the market opened, and the hourly update changes only this number. Each position stores its copy of the number from the last time it was updated. When a trade, a close or a liquidation brings a position into a transaction, the program first charges the difference between the two numbers times the position size, and then updates the position's copy. A position that nobody has used for a week pays a week of funding in one subtraction.

## Untouched accounts never update

Lazy means that untouched accounts never update. For rewards this is fine: the money waits, and the difference is paid whenever the claim comes. For liquidations it is not fine, because a position that nobody uses is never liquidated, and the protocol takes the loss. The same goes for an order that has to expire at a deadline. So if an action really needs to happen at a certain time, lazy loading alone is not enough. Either you pay an executor to send that transaction, or you rework the design so that an old value does no harm.

## Nothing is up to date, nothing is wrong

On Solana there is no background. Between two transactions nothing runs, so a protocol cannot keep thousands of accounts up to date, and a lazy protocol does not try. Every event changes only the shared number, so that one number already includes everything that happened. Every other account is behind, and its own copy of the number says exactly how far behind. The moment someone brings the account into a transaction, the program pays or charges the difference and writes the shared number into the copy. So nothing in a lazy protocol is up to date, and nothing in it is wrong: every result is computed at the moment it is needed, by the person who needs it.
