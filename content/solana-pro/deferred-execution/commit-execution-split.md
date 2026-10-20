---
title: Commit-execution split
type: lecture
order: 10
---

Some actions that users **commit** cannot be **executed** in the same instant, whether for security or architectural reasons. For those cases, the best practical approach is to split the actions into commit and execute phases.

The best example is your typical program with a random outcome. You can't implement a secure program that lets a user get the random outcome in the same transaction as they're submitting. Because if you did, the user could simply simulate transactions many times and only send them those few times when they actually succeed to produce the winning outcome for them.

In fact, because of it, you also can't let them have the authority of being the sender of that "execute" part of the transaction at all. So naturally, you want to split it into "commit" and "execute" types of transactions, because you can't let them have the "execute" part.

<svg role="img" viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>One transaction, or a commit and an execution</title><desc>Top row: in one transaction the user's bet and its result sit in the same box, with a loop arrow labeled simulate until it wins, so the user picks the result. Bottom: two swimlanes over a time axis. In the user lane, transaction 1 commits the bet and locks the stake. The seed, a slot hash, is fixed and handed to the oracle lane, where the random value is computed, and transaction 2 reveals it and settles the bet. The user cannot start a new round until this one is settled.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">One transaction, or a commit and an execution</text>
  <text x="40" y="96" text-anchor="start" font-size="10" fill="#565653" font-family="monospace" font-weight="bold">one transaction</text>
  <rect x="170" y="72" width="200" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="270" y="97" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">bet + result</text>
  <path d="M 380 92 C 440 60, 440 124, 380 92" fill="none" stroke="#ed4937" stroke-width="2"/>
  <polygon points="384,86 384,98 374,92" fill="#ed4937"/>
  <text x="455" y="88" text-anchor="start" font-size="9.5" fill="#ed4937" font-family="monospace">simulate, send only</text>
  <text x="455" y="101" text-anchor="start" font-size="9.5" fill="#ed4937" font-family="monospace">when it wins</text>
  <text x="640" y="96" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">user picks the result</text>
  <line x1="40" y1="130" x2="680" y2="130" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="40" y="150" text-anchor="start" font-size="10" fill="#565653" font-family="monospace" font-weight="bold">two transactions</text>
  <rect x="40" y="160" width="640" height="80" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="50" y="205" text-anchor="start" font-size="10" fill="#565653" font-family="monospace" font-weight="bold">user</text>
  <rect x="40" y="255" width="640" height="80" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="50" y="300" text-anchor="start" font-size="10" fill="#565653" font-family="monospace" font-weight="bold">oracle, anyone</text>
  <rect x="150" y="172" width="170" height="56" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="235" y="194" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">tx 1: commit</text>
  <text x="235" y="212" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">bet placed, stake locked</text>
  <text x="470" y="203" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">no new round until settled</text>
  <line x1="235" y1="228" x2="235.0" y2="258.0" stroke="#000000" stroke-width="2"/>
  <polygon points="241.0,258.0 229.0,258.0 235,268" fill="#000000"/>
  <text x="245" y="250" text-anchor="start" font-size="9.5" fill="#565653" font-family="monospace">seed = slot hash</text>
  <rect x="150" y="268" width="200" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="250" y="290" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">random value computed</text>
  <text x="250" y="308" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">from seed + oracle key</text>
  <line x1="350" y1="296" x2="430.0" y2="296.0" stroke="#000000" stroke-width="2"/>
  <polygon points="430.0,290.0 430.0,302.0 440,296" fill="#000000"/>
  <rect x="440" y="268" width="220" height="56" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="550" y="290" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">tx 2: reveal + settle</text>
  <text x="550" y="308" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">nothing to simulate</text>
  <line x1="40" y1="358" x2="670.0" y2="358.0" stroke="#565653" stroke-width="2"/>
  <polygon points="670.0,352.0 670.0,364.0 680,358" fill="#565653"/>
  <text x="360" y="374" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">time</text>
  <text x="360" y="398" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The user sends only the commit. The result arrives in a transaction the user does not choose.</text>
</svg>

## Examples

**Switchboard VRF (coin flip).** In the first transaction players pick a side, pay, and the program creates a request for a random number. Nobody knows the number yet, not the player, not the operator. In Switchboard's current randomness the request commits to the hash of a recent slot as the seed, and the oracle derives the value from that seed inside its secure hardware, so neither the player nor the oracle can choose the number. In the second transaction the oracle (not the player!) writes the number into that request, and the program settles the bet whose resolution is already locked. The player cannot simulate this transaction into a win, because nothing the player controls decides the value, and cannot start a new round until this one is settled, so there is no way to abandon a losing bet.

**Drift.** Drift is a perpetuals exchange, and a market order on it is not filled in the transaction that places it. Before the pool fills the order, makers get a short window to bid for it: the order is written into the trader's account with an auction, a start price, an end price and a duration of a few seconds. During the auction, makers fill the order in their own transactions at a price inside that range, and whatever is left at the end goes to the order book and then to the AMM. The trader committed to the order and to the range, and the fills are executed by other people. There is nothing for the trader to simulate, because the fill price does not exist when they sign.
