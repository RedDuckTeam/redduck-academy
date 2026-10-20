---
title: Lazy loading
type: lecture
order: 10
---

In traditional programming, lazy loading means you don't compute or fetch something until someone asks for it. On Solana it's usually not an optimization, but rather the only option. Programs cannot iterate over all accounts ever created. They can only write to the accounts passed into the transaction. And there is no scheduler, so every piece of work needs someone to send a transaction and pay for it.

So whenever your design says "for all holders", "every period", or "when the signers change, update everything", somebody has to send those transactions.

The lazy way (in a good sense): the result is not pushed to every account. Each account stores only what is needed to compute it later, and computes it when someone touches that account. The one who touches it pays for it, and that's the one who wanted the result. Usually this takes two fields: a running total, and a marker of how much of it this account has already seen. The result is the difference.

In a staking pool, the running total is the reward per staked token, kept in the pool account, and the marker is the value of that number at the staker's last claim:

```
// what every staked token earned since this staker's last claim, times their stake
owed = (pool.reward_per_token - staker.last_reward_per_token) * staker.stake
```

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

## Examples

**Squads stale approvals.** Squads is a multisig. When its signers or threshold change, every proposal approved by the old signers has to become stale, but the proposals are separate accounts, and none of them is in the transaction that changes the signers. So the multisig doesn't walk through all open proposals. Every proposal gets a number when it is created, and the multisig keeps one counter: when signers change, it sets the counter to the number of the latest proposal. When a proposal is read, its number is compared to the counter, and a number at or below it means stale. One write when the signers change, one comparison when a proposal is touched, no matter how many proposals there are.

**Fragmetric.** Fragmetric is a liquid restaking protocol, and rewards for its token, fragSOL, depend on how much each holder held and for how long. Reading every holder's balance on a schedule would be the same loop over every account that nobody sends. Instead, fragSOL is a Token-2022 token with a transfer hook: Token-2022 calls Fragmetric's program on every transfer, with the sender's and the receiver's accounts already in the transaction. The hook updates both holders' reward balances at the moment of the transfer. The program runs on those accounts anyway, so the accounting comes for free.

**Helium rewards.** Helium pays rewards to the owners of about a million devices, and paying each of them once a day would be a million transactions a day, all sent and paid for by Helium. So nothing is pushed to a million devices every day. The oracle signs the total a device has earned since the beginning, and the device's account stores how much was already paid. When someone claims, the program pays the difference and moves the marker up to the signed total. Here the running total is kept in a signed message instead of an account, and the marker is kept in the device's account.

**Drift funding.** Drift is a perpetuals exchange. Its perp markets charge funding, a payment between longs and shorts, every hour on every open position, but the program never walks through the positions. The market stores a running total of funding per unit of position, and the hourly update changes only that number. Each position stores the total it last saw. When a position is touched (a trade, a close, a liquidation), the difference times the size is settled first, and the marker moves to the current total. A position nobody touched for a week settles a week of funding in one subtraction.

***Important to remember:*** lazy means untouched accounts never update. For rewards this is fine, the difference is paid whenever the claim comes. If an action really needs to happen to update something explicitly (liquidations, expiry etc.), you would need a paid executor (the *untrusted executor* pattern) or to rework your design.
