---
id: 1910862694
title: Commit-execution split
type: lecture
order: 10
---

Some actions that users **commit** cannot be **executed** in the same instant, whether for security or architectural reasons. For those cases, the best practical approach is to split the actions into commit and execute phases.

The best example is your typical program with a random outcome. You can't implement a secure program that lets a user get the random outcome in the same transaction as they're submitting. Because if you did, the user could simply simulate transactions many times and only send them those few times when they actually succeed to produce the winning outcome for them.

In fact, because of it, you also can't let them have the authority of being the sender of that "execute" part of the transaction at all. So naturally, you want to split it into "commit" and "execute" types of transactions, because you can't let them have the "execute" part.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Commit-execution split</title><desc>Two transactions on a timeline. The first, from the user, locks the bet with a padlock while the outcome is still unknown, shown as a question mark. The second, from someone else, holds the dice and settles the result.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Commit-execution split</text>
  <line x1="50" y1="200" x2="669.0" y2="200.0" stroke="#565653" stroke-width="2"/>
  <polygon points="669.0,194.0 669.0,206.0 680,200" fill="#565653"/>
  <text x="640" y="218" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">time</text>
  <circle cx="110" cy="106" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 96 136 Q 110 114 124 136 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="110" y="152" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">user</text>
  <line x1="132" y1="130" x2="169.8" y2="145.8" stroke="#000000" stroke-width="2"/>
  <polygon points="172.2,140.2 167.5,151.3 180,150" fill="#000000"/>
  <rect x="180" y="110" width="150" height="70" rx="0" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="255" y="133" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">tx 1: commit</text>
  <path d="M 246 154 v -8 a 9 9 0 0 1 18 0 v 8" fill="none" stroke="#ed4937" stroke-width="2.5"/>
  <rect x="242" y="154" width="26" height="20" rx="3" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <circle cx="255" cy="164" r="3" fill="#e0deda" stroke="#e0deda" stroke-width="2"/>
  <text x="365" y="152" text-anchor="middle" font-size="26" fill="#565653" font-family="monospace" font-weight="bold">?</text>
  <text x="365" y="172" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">unknown</text>
  <circle cx="610" cy="106" r="8" fill="#e0deda" stroke="#565653" stroke-width="2"/>
  <path d="M 596 136 Q 610 114 624 136 Z" fill="#e0deda" stroke="#565653" stroke-width="2"/>
  <text x="610" y="152" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">someone else</text>
  <line x1="588" y1="130" x2="550.2" y2="145.8" stroke="#000000" stroke-width="2"/>
  <polygon points="552.5,151.3 547.8,140.2 540,150" fill="#000000"/>
  <rect x="400" y="110" width="140" height="70" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="470" y="133" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">tx 2: execute</text>
  <rect x="458" y="148" width="24" height="24" rx="4" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <circle cx="464" cy="154" r="2" fill="#000000" stroke="#000000" stroke-width="1"/>
  <circle cx="476" cy="166" r="2" fill="#000000" stroke="#000000" stroke-width="1"/>
  <circle cx="470" cy="160" r="2" fill="#000000" stroke="#000000" stroke-width="1"/>
  <circle cx="464" cy="166" r="2" fill="#000000" stroke="#000000" stroke-width="1"/>
  <circle cx="476" cy="154" r="2" fill="#000000" stroke="#000000" stroke-width="1"/>
  <text x="360" y="250" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The user commits before the outcome exists. The outcome arrives in a transaction the user does not choose.</text>
</svg>

## Examples

**Switchboard VRF (coinflip)**. In the first transaction players pick a side, pay, and the program creates a request for a random number. Nobody knows the number yet, not the player, not the operator. In the second transaction the oracle (not the player!) writes the number into that request, and the program settles the bet the resolution of which is already locked. The player cannot start a new round until this one is settled, so there is no way to abandon a losing bet.

The same pattern can be seen in other protocols too. In Parcl, orders collect over an interval and clear at one price, so nobody gains from being first. In Drift, before the pool fills an order, makers get a short window to bid for it.
