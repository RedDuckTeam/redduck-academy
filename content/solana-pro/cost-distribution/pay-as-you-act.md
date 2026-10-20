---
id: 1192848433
title: Pay-as-you-act
type: lecture
order: 20
faq:
  - question: What is pay-as-you-act?
    answer: >-
      The final step is split into pieces, and each action does its piece at the moment it
      happens. The program stores the answer instead of the inputs, and every action moves the
      answer one step. Everyone pays for their own piece of the work, and nobody pays for the
      whole protocol at once.
  - question: How do I find the winner of an on-chain vote without iterating over the votes?
    answer: >-
      Update the answer on every vote. When a vote comes in, increase that candidate's count and
      compare it with the leader's. If it is higher, the candidate becomes the leader. Each
      voter paid for one addition and one comparison, and the closing transaction reads one
      field.
  - question: Which answers can be updated one step at a time?
    answer: >-
      Any answer that one action can update without reading the other inputs: a count, a total,
      a maximum, a leader, an average stored as a sum and a count, a share of a pool. A total
      can be updated by one deposit, and a median cannot.
  - question: How does a parimutuel market pay winners without a loop?
    answer: >-
      Each bet adds its amount to its side's total while betting is open. When the oracle names
      the winning side, a winner's share is their bet divided by the winning total. The bettors
      paid for the totals when they bet, and each winner pays for their own payout when they
      claim.
  - question: When does pay-as-you-act break?
    answer: >-
      When an action has to be undone and the answer cannot be corrected in one step. A total goes down as
      easily as it goes up. A maximum or a leader does not, because finding the new leader after
      the old one loses votes means reading the other counts. Then either the action is final,
      or the answer needs a structure that supports removal.
  - question: Who sends the closing transaction?
    answer: >-
      Anyone who wants the result. The leader is already in the state, so closing the vote reads
      one field and costs almost nothing.
---

> Many protocols have a step that is done at the end, for everyone at once: the votes are counted, the pool is paid out, the average is updated. Every such step is a loop over everyone's data, and on Solana nobody sends that transaction. What if there was no final step at all?

## The transaction nobody sends

In an election, the bad design stores the votes, one account or one slot per vote. When the voting period closes, someone walks through all of the votes to find the winner. That is the loop from the previous lecture: the sender pays for every vote, a common effort shifted onto a single person. With thousands of votes the loop also runs out of compute, because every transaction has a compute limit, and so does the block. A paid executor does not help here, because no amount of money raises that limit.

## The final step is spread over the actions

The good design spreads the final step over the actions that happen anyway. When a vote comes in, the program immediately adds one to that candidate's count and compares the count with the leader's count. If the count is higher, this candidate becomes the new leader. Each voter runs one addition and one comparison inside their own transaction, and by the end of the voting period the count is already done. The leader is recorded in the state, and the closing transaction reads one field.

This is **pay-as-you-act**. The program stores the answer instead of the inputs, and every action updates the answer. Most steps that a protocol would do at the end can be spread this way: finding the winner, computing a payout, keeping an average. The answer has to be something that one action can update without reading the other inputs, such as a count, a total, a maximum, a leader, or an average stored as a sum and a count.

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

## Hxro: each bet updates the total

Hxro runs parimutuel markets. Everyone bets on whether a price goes up or down over an interval, and when the interval ends, the losing side's money is split between the winners in proportion to their bets. The step at the end would be to add up every bet on both sides and then pay every winner. Hxro does neither, because each bet adds its amount to its side's total at the moment it is placed, so when the round ends, both totals are already there. The oracle names the winning side, and each winner claims on their own:

```
// the winner's share of the whole pool before fees, from the two totals that the bets already built
payout = bet / winning_total * (winning_total + losing_total)
```

The bettors paid for the totals when they bet, and each winner pays for their own payout when they claim.

## Orca: the swap updates the fee total

Orca Whirlpools is a DEX. Every swap pays a fee, and that fee belongs to the liquidity providers whose liquidity the swap used. A pool has thousands of such positions, and none of them is in the swap transaction. The step at the end would be to go through every position and hand out its part of the fees.

Instead, the pool stores one number per token: how much fee one unit of liquidity has earned since the pool opened. When a swap happens, the program takes the swap's fee, divides it by the liquidity that was active in that swap, and adds the result to this number. This happens inside the swap transaction, so the swapper pays for it. Each position keeps its own copy of this number from the last time it collected fees. When the owner collects, the program pays the difference:

```
// what one unit of liquidity earned since this position last collected, times its liquidity
owed = (pool.fee_per_liquidity - position.last_fee_per_liquidity) * position.liquidity
```

The swap pays for the shared number, and each owner pays for their own share.

## When an action cannot be undone

Undoing an action is not always as easy as doing it. A total can go down as easily as it goes up: a withdrawal subtracts what a deposit added. The same is true for a count and for an average stored as a sum and a count. A maximum cannot go down like that. In the election, the leader is a maximum. If a voter takes their vote back from the leading candidate, the leader may change, and the new leader is whoever had the second highest count. The program does not know who that was, and the only way to find out is to read every candidate's count. With a few fixed candidates that is a short loop, and the program can afford it. With an open list of candidates it is the same loop that does not fit.

So when the answer is a maximum, the design has to decide what happens on a withdrawal before the first vote arrives, because the structure of the answer is part of the account layout. The simplest decision is to forbid the withdrawal: a vote is final, and the maximum only grows. If votes have to be withdrawable, the program needs a structure that can remove an element without reading everything, for example a sorted list of candidates where the client finds the new position and the program only checks the two neighbors.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Adding a vote and removing a vote</title><desc>Two boxes side by side. Both start with candidate A at 5 votes, B at 3 and C at 2, with A as the leader. On the left, one vote is added to B, so B has 4. The program compares 4 with the leader's 5, and A stays the leader. That is one comparison. On the right, one vote is removed from A, so A has 4. To know whether A is still the leader, the program has to read the counts of B and C, so it reads every count.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Who is the leader now?</text>

  <rect x="40" y="70" width="300" height="250" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Add a vote</text>
  <rect x="80" y="110" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="132" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">A 5, B 3, C 2, leader A</text>
  <line x1="190" y1="146" x2="190" y2="160" stroke="#000000" stroke-width="2"/>
  <polygon points="184,158 196,158 190,168" fill="#000000"/>
  <rect x="80" y="168" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">+1 to B, B is 4</text>
  <line x1="190" y1="204" x2="190" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="184,216 196,216 190,226" fill="#000000"/>
  <rect x="80" y="226" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="248" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">4 above 5? no</text>
  <text x="190" y="292" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">leader A, one comparison</text>

  <rect x="380" y="70" width="300" height="250" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Remove a vote</text>
  <rect x="420" y="110" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="132" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">A 5, B 3, C 2, leader A</text>
  <line x1="530" y1="146" x2="530" y2="160" stroke="#000000" stroke-width="2"/>
  <polygon points="524,158 536,158 530,168" fill="#000000"/>
  <rect x="420" y="168" width="220" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">-1 from A, A is 4</text>
  <line x1="530" y1="204" x2="530" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="524,216 536,216 530,226" fill="#000000"/>
  <rect x="420" y="226" width="220" height="36" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="248" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">is anyone above 4?</text>
  <text x="530" y="292" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">read B and C, every count</text>

  <text x="360" y="346" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Adding an input is one comparison. Removing one means reading every count.</text>
</svg>

## Everyone pays for their own piece

A protocol on Solana has no moment when it stops and sums up what happened, because nobody would pay for that moment. So the protocol never keeps a pile of inputs waiting to be processed. It keeps the answer from the very first action, and every action that arrives moves the answer one step further. By the time the protocol would have needed the final step, the step has already been done by everyone who took part. Everyone paid for their own piece of the work at the moment of their own action, and nobody paid for the whole protocol at once.
