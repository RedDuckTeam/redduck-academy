---
id: 1192848433
title: Pay-as-you-act
type: lecture
order: 20
---

Protocols very frequently use the pattern of distributing computations across users and having them pay only for their part. We call this **Pay-As-You-Act**: with this pattern, everyone pays for their own piece of the work, at the moment of their own action, instead of paying for the whole protocol at once.

Take an election as an example.

* **The bad design** stores the votes. When the voting period closes, someone walks through all of the votes to find the winner. That iterating transaction pays for every vote, and nobody would volunteer to execute that transaction, as it's a common effort shifted onto a single person.
* **Instead, the good design** gives each action its piece of the final step. When a vote comes in, the program immediately increases the candidate's count and compares it with the leader's count, without waiting for the final resolution window. If the count is higher, this candidate becomes the new leader. Each voter executes one addition and one comparison, triggered by that voter. When the voting period is finished, the protocol already knows the winner, as the leader is already recorded in the state, and the closing transaction reads one field.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Counting at the end versus counting as you go</title><desc>Two boxes side by side. On the left, votes one to ten thousand are stored as separate accounts, and a closing count has to read all of them, paid by one person for everyone. On the right, each vote arrives, adds one to the candidate's count, compares it with the leader and replaces the leader if higher. The leader field is always current, and the closing transaction reads one field. Each voter pays for one addition and one comparison.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Who pays for the count</text>

  <rect x="40" y="80" width="300" height="250" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Count at the end</text>
  <rect x="65" y="120" width="90" height="22" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="110" y="135" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">vote 1</text>
  <rect x="65" y="148" width="90" height="22" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="110" y="163" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">vote 2</text>
  <rect x="65" y="176" width="90" height="22" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="110" y="191" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">vote 3</text>
  <rect x="65" y="204" width="90" height="22" fill="none" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="110" y="219" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">...</text>
  <rect x="65" y="232" width="90" height="22" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="110" y="247" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">vote 10,000</text>
  <line x1="156" y1="187" x2="196" y2="187" stroke="#000000" stroke-width="2"/>
  <polygon points="194,181 194,193 204,187" fill="#000000"/>
  <rect x="200" y="160" width="120" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="260" y="181" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">closing count</text>
  <text x="260" y="196" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">reads every vote</text>
  <text x="190" y="284" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">10,000 accounts to read</text>
  <text x="190" y="304" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">paid by one person, for everyone</text>

  <rect x="380" y="80" width="300" height="250" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="80" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Count as you go</text>
  <rect x="455" y="118" width="150" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="135" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">vote arrives</text>
  <line x1="530" y1="144" x2="530" y2="156" stroke="#ed4937" stroke-width="2"/>
  <polygon points="524,154 536,154 530,162" fill="#ed4937"/>
  <rect x="455" y="164" width="150" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="181" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">+1 to the count</text>
  <line x1="530" y1="190" x2="530" y2="202" stroke="#ed4937" stroke-width="2"/>
  <polygon points="524,200 536,200 530,208" fill="#ed4937"/>
  <rect x="455" y="210" width="150" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="227" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">above the leader? swap</text>
  <line x1="530" y1="236" x2="530" y2="248" stroke="#ed4937" stroke-width="2"/>
  <polygon points="524,246 536,246 530,254" fill="#ed4937"/>
  <rect x="455" y="256" width="150" height="26" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="273" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">leader field</text>
  <text x="530" y="304" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">paid by each voter, for their vote</text>
  <text x="530" y="320" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">one addition, one comparison, closing reads 1 field</text>

  <text x="360" y="352" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The work is the same. One design puts it on one person at the end,</text>
  <text x="360" y="368" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">the other puts it on each voter at the moment they vote.</text>
</svg>

Most of the "at the end" steps can be embedded into intermediate in-process transactions: an election winner, a payout, an average number. The key to the pattern is to store the answer instead of inputs, and let every action update it. The answer has to be something that one action can update in one step: a count, a total, a maximum, an average, a leader.

## Examples

**Hxro's parimutuel (pool betting) markets.** Everyone bets on whether a price goes up or down over an interval, and when the interval ends, the losing side's money is split between the winners in proportion to their bets. The step at the end would be to add up every bet on both sides and then pay every winner, and Hxro does neither. A bet on "up" or "down" adds its amount to that side's total at the moment it is placed, so when the round ends, both totals are already there. The oracle names the winning side, and the losing pool goes to the winners. Each winner claims on their own: their share is their bet divided by the winning total.

```
// the winner's share of the whole pool before fees, from the two totals that the bets already built
payout = bet / winning_total * (winning_total + losing_total)
```

Bettors paid for the totals when they bet, and each winner pays for their own payout when they claim.

**Orca Whirlpools.** Orca is a DEX. Every swap pays a fee, and that fee belongs to the liquidity providers whose liquidity the swap used: thousands of positions, none of which is in the swap transaction. The step at the end would be to go through every position and hand out its part of the fees. Instead, the pool stores one number per token, how much fee one unit of liquidity has earned since the pool opened. When a swap happens, the program takes the swap's fee, divides it by the liquidity active in that swap, and adds the result to this number inside the swap transaction, so the swapper pays for it. Each position keeps its own copy of this number from the last time it collected fees, and when the owner collects, the program pays the difference:

```
// what one unit of liquidity earned since this position last collected, times its liquidity
owed = (pool.fee_per_liquidity - position.last_fee_per_liquidity) * position.liquidity
```

The swap pays for the shared number, and each owner pays for their own share.
