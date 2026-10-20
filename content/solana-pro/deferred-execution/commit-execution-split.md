---
id: 1910862694
title: Commit-execution split
type: lecture
order: 10
faq:
  - question: What is the commit-execution split?
    answer: >-
      The action is split into two transactions. In the first, the user commits: they place the
      bet, the order or the request, and lock what it needs. In the second, the action is
      executed, when the missing piece exists, such as the random number or the maker's price.
      The user does not decide whether the second transaction happens.
  - question: Why can't a program decide a random outcome in the same transaction as the bet?
    answer: >-
      Because the user can simulate the transaction first and send it only when it wins.
      Anything the program can read inside the transaction, the simulation can read too. The
      outcome has to depend on something that does not exist yet when the user signs.
  - question: Who sends the execute transaction?
    answer: >-
      Anyone except the person whose outcome it decides. An oracle, a maker, a keeper or any
      user. If the committer could decide whether execution happens, they would execute only the
      outcomes they like.
  - question: What happens to a commit that nobody executes?
    answer: >-
      It needs an exit that does not leak the outcome. A commit can expire after a deadline, and
      the stake returns to the user. It must not be cancellable once the outcome is known.
  - question: How does a Drift market order use the split?
    answer: >-
      The order is the commit. It sits in the trader's account with an auction that lasts a few
      seconds. Makers fill it during the auction in their own transactions, and what is left goes
      to the order book and the AMM at the end. The trader does not pick the fill.
  - question: How does Switchboard's randomness fit the pattern?
    answer: >-
      In the first transaction the program commits, and Switchboard stores the previous slot's
      hash as the seed. Later the oracle reveals the signed random value, and the program
      settles in the same transaction as the reveal. Nobody knows the value at commit time.
---

> Some actions cannot be executed in the moment they are committed. A bet needs a random number that nobody knows yet, and a market order needs a price that nobody has quoted yet. On Solana a transaction either does everything now or nothing, and the sender sees the result before sending it. An outcome that the sender must not choose cannot be decided in the sender's transaction.

## The transaction that only wins

Suppose we write the simplest coin flip. The user sends one transaction with the bet, the program reads something that looks random, say the hash of the current slot, and pays the win in the same instruction.

The problem is that the user does not have to send this transaction blindly. Anyone can simulate a transaction before sending it. The simulation is free, and it shows exactly what the transaction would do. So the user simulates the bet. If the simulation shows a loss, they do not send it. A slot later they simulate again, and they send the transaction only when it shows a win.

The program did nothing wrong: the randomness is real, and the check is correct. The user still wins every time, because the user decides which transactions happen and the same user can see what will happen after their transaction before they send it.

## Commit now, execute later

The fix is the **commit-execution split**: the action becomes two transactions.

In the first transaction the user commits. They place the bet, the stake is locked, and the program records that a round is open. At this moment nobody knows the outcome, neither the user nor the program, because the thing that decides it does not exist yet.

In the second transaction the action is executed. The random number arrives, or the price is set, and the program settles the round against the commitment that is already locked. The user cannot back out, because the stake is already in.

Two things have to be true for this to work. First, the outcome must not exist at commit time. If it did, the user would simulate the commit transaction instead. Second, the user must not be the one who decides whether the second transaction happens. If they were, they would execute only the rounds they win. So the second transaction is sent by someone else: an oracle, a maker, or any user who is paid for it. If the user has to send it themselves, they can cheat by never sending a losing one.

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

## Switchboard: the seed is fixed before the number exists

A coin flip on Switchboard's randomness does this in two transactions.

In the first transaction the player picks a side and pays, and the program asks Switchboard to commit. Switchboard writes the hash of the previous slot into a randomness account. This hash is the seed. The random value will be computed from this seed and the oracle's key, inside the oracle's secure hardware. This means the oracle cannot change the value, and the player cannot compute it.

In the second transaction the oracle's signed value is revealed, and the program settles the bet right there. The player cannot simulate this transaction into a win, because nothing the player controls decides the value.

The program also keeps the round open until the reveal settles it. Otherwise the player could leave a losing round behind and start a new one.

## Drift: the order is the commit, the fill is the execution

Drift is a perpetuals exchange, and a market order on Drift is not filled in the transaction that places it.

Instead, the order is written into the trader's account together with an auction: a start price, an end price, and a duration of a few seconds. During the auction, makers send their own transactions and fill the order at a price inside that range. Whatever is left at the end of the auction goes to the order book and then to the AMM.

The trader committed to the order and to the price range. The fills are executed by other people. There is nothing for the trader to simulate, because the fill price does not exist when they sign.

## What the split costs

Between the commit and the execution, the protocol has to remember that something is open: a round, an order, a request. That means an account for each of them, and someone pays rent for it.

Someone also has to send the second transaction. The design has to say who that is and why they will do it.

And every open commit needs an exit for the case when nobody executes it. Usually this is a deadline after which the stake returns to the user. The exit must not leak the outcome. If a player could cancel after the reveal, they would cancel every loss. So a cancel is allowed only while the outcome does not exist yet, or after a timeout when the oracle did not answer at all.

## Assume the user looks first

The user always looks at the result before sending a transaction. So every action gets the same question: would the user still send it after seeing the result? For a transfer or a deposit the answer is yes, because the result is the same either way. For a bet or a fill the answer is no, because the user would send only the good results. Those actions are committed first and decided later, in a transaction the user does not choose.
