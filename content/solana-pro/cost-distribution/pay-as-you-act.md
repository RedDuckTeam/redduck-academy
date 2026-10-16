---
title: Pay-as-you-act
type: lecture
order: 20
faq:
  - question: What is pay-as-you-act?
    answer: >-
      The protocol's shared work is split into small parts, each done inside the action that
      causes it, so each user pays for their own part when they act. The program stores the
      answer rather than the inputs, and every action moves the answer one step. By the end the
      answer is already there, and nobody has to pay to read all the inputs.
  - question: How do I find the winner of an on-chain vote without iterating over the votes?
    answer: >-
      Update the answer on every vote. When a vote comes in, add it to that candidate's count
      and compare the count with the leader's. If it is higher, the candidate becomes the
      leader. The closing transaction reads one field, and each voter paid for one addition and
      one comparison inside the transaction they sent anyway.
  - question: Which answers can be updated one step at a time?
    answer: >-
      A count, a total, an average stored as a sum and a count, a maximum, a leader, a share of
      a pool. The rule is that one action can update the answer without reading the other
      inputs. A total can be updated by one deposit. A median cannot.
  - question: How does a parimutuel market pay winners without a loop?
    answer: >-
      Each bet adds its amount to its side's total while betting is open. When the oracle
      names the winning side, a winner's payout is their bet divided by the winning side's
      total, times the pool. The bettors paid for the totals as they bet, and each payout is
      computed from them when that winner is paid.
  - question: When does pay-as-you-act break?
    answer: >-
      When an action has to be undone and the answer can't step back. A total goes down as
      easily as it goes up. A maximum or a leader does not, because finding the new leader
      after the old one loses votes means reading the other inputs. Then either the action has
      to be final, or the answer needs a structure that supports removal.
  - question: My staking pool already uses lazy loading. Where does pay-as-you-act come in?
    answer: >-
      When the rewards arrive. The transaction that brings them updates the reward per staked
      token, and whoever brings them pays for that write. Each staker then computes their share
      from the difference when they claim, and pays for that. Nobody pays for everyone.
---

> Every protocol has work that is useful for everyone but that no single user has a reason to do. Count the votes, pay out the pool, keep a total up to date. Nobody sends the transaction that does it for everyone, and often that transaction would not even fit. On Solana this work cannot be left for the end.

## The transaction nobody sends

Take an election. The simplest design stores the votes, each as an account or a slot in an array with the voter and their choice. When the voting period ends, someone goes through all the votes, counts them, and finds the winner.

Think about what that costs. If each vote is an account, counting 10,000 votes takes hundreds of transactions, because one transaction holds only about 40 accounts. If all votes sit in one account, the count is one transaction that reads every slot, but a loop over data that anyone can add to grows until it no longer fits in the compute budget. And even if it fits, who sends this transaction? The voters already voted, and whoever closes the vote gains nothing from paying for everyone's count. You could pay someone to send it, but a reward does not help when the transaction does not fit in the limits.

## Give every action a part of the final step

The better design does not store the votes to count later. It counts them as they arrive. When a vote comes in, the program adds one to that candidate's count and compares it with the leader's. If the new count is higher, the candidate becomes the leader. Each voter pays for one addition and one comparison inside the transaction they sent anyway. When the period ends, the winner is already in the state, and the closing transaction reads one field.

This is **pay-as-you-act**. The key is to store the answer rather than the inputs, and to let every action update it. For that to work, the answer has to be something one action can update in one step without reading the other inputs. Examples are a count, a total, a maximum, an average stored as a sum and a count, or a leader. Each of these can be updated by the action that just arrived, without looking at the ones that came before.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Counting at the end versus counting as you go</title><desc>Two boxes side by side. On the left, votes one to ten thousand are stored as separate accounts, and a closing count has to read all of them, which takes hundreds of transactions, paid by one person for everyone. On the right, each vote arrives, adds one to the candidate's count, compares it with the leader and replaces the leader if higher. The leader field is always current, and the closing transaction reads one field. Each voter pays for one addition and one comparison.</desc>
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
  <text x="260" y="196" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">hundreds of txs</text>
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

Hxro runs parimutuel markets, pool betting on whether a price goes up or down over an interval. There are no odds set in advance. All bets on each side go into that side's pool, and when the outcome is known, the losing pool is split between the winners in proportion to their bets.

While betting is open, each bet adds its amount to its side's total. There are only two numbers, the up total and the down total, and every bettor updated one of them as part of their own bet. When the interval ends, an oracle names the winning side. Say the up side has 600, the down side has 400, and the oracle says up. A bettor who put 60 on up gets 60 / 600 of the whole pool of 1,000, which is 100 before fees. That is two reads and one multiplication per winner, done when that winner is paid. Nobody adds up the bets at the end, because each bet was added to its total when it was placed. These numbers are only an example.

## Orca: the swap pays for the fee accounting

Orca Whirlpools is a concentrated liquidity DEX that takes a fee on every swap. The fee belongs to the liquidity providers whose positions were active at the swap price, and a pool can have thousands of positions. Paying each of them on every swap would be the same loop as in the election, but inside every swap.

So each swap does its own part of the work instead. The pool stores a fee growth number per token, the total fee earned per unit of liquidity since the pool opened, and every swap adds its fee divided by the active liquidity to that number inside the swap transaction. Each position stores the fee growth it saw last. When a liquidity provider touches their position, the program multiplies the difference by the position's liquidity and credits the fees. That second half is lazy loading, and the two patterns usually go together. Pay-as-you-act updates the shared answer when an action happens, and lazy loading computes one account's result from that answer when the account is touched. The same swap also updates the pool's price and active liquidity, so the pool account is always current and nobody has to maintain it separately.

## When one step is not enough

Not every answer can be updated in one step in both directions. A total goes down as easily as it goes up, and so does a count or an average stored as a sum and a count. A maximum does not. If the leading candidate loses a vote, the new leader is whoever was second, and the program cannot know who that was without reading all the other counts. The same is true for any answer that is the best of its inputs.

So if the answer is a maximum or a leader, one of three things has to be true. Either the action is final, so a vote can't be withdrawn and the maximum only grows. Or the answer is stored in more than one field, for example as a sorted list where the client finds the position and the program only checks the neighbors. Or the reverse action is allowed, but its effect on the answer waits until someone is willing to pay to read all the inputs. Choose before the first vote arrives, because the structure of the answer is part of the account layout.

Ties need the same care. When two candidates have the same count, the rule has to be in the program already, whether the first candidate to reach that count wins or the latest one. The program decides, not the order in which the two transactions were processed.

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

## Do the final step inside the actions

Write down every step your design does at the end, on a schedule, or for everyone at once. Find the winner, pay out the pool, close the voting. For each step, ask three questions. What answer does it produce? Can one action update that answer in one step without reading the other inputs? Can the reverse action undo the update, and if not, is the action final? What is left for the closing transaction should be a single read.
