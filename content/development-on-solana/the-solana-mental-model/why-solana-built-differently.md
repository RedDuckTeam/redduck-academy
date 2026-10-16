---
id: 181
title: Why Solana was built differently
type: lecture
order: 1
faq:
  - question: Where does a Solana program keep its state?
    answer: >-
      In separate accounts, passed in on every call. The program itself is pure code with no
      storage of its own.
  - question: Why does a transaction have to list the accounts it will touch in advance?
    answer: >-
      The runtime has to know before execution which state each transaction reads and
      writes, so it can put non-conflicting ones on different threads. Running the
      transaction to find out would defeat the point. The client supplies the list, marking
      each account read-only or writable, before submitting it.
  - question: Can another program write to my account?
    answer: >-
      No. Only the owner program can, and the runtime blocks everyone else before any code
      runs. Reads stay open to anyone.
  - question: How does a client know which accounts a program needs?
    answer: >-
      The program author documents the access pattern or ships an IDL, a machine-readable
      Interface Definition Language file describing what each instruction expects.
---

> Most blockchains were built to run transactions one after another. Solana was built to run as many of them at the same time as possible. This single decision shapes everything else in the programming model: where state lives, who owns it, what a transaction has to declare, how the runtime decides what runs together, what you pay to store a byte on chain. None of these choices are arbitrary. Each one follows directly from the parallel-execution goal at the top.

## What the choice costs

A serial chain is simpler to program. One transaction at a time, one global state to read from and write to, a single thread of execution. The programmer writing code for that kind of chain can treat the state as a database that their contract reads and modifies. The runtime figures out which storage slots got touched. The developer doesn't have to think about it because there is only one thread.

Parallel execution doesn't work like that. If two transactions might run at the same time on different threads, the runtime has to know in advance which pieces of state each one will read and write. Otherwise it cannot schedule them safely, since a race condition between two threads writing the same byte produces inconsistent state and breaks consensus. The choice for parallelism therefore forces a chain of further choices, each one a constraint the developer must accept.

There are four of them.

## The four shifts

The first is **statelessness**. Programs on Solana do not hold storage of their own. A program is pure code. When it needs to read or write data, that data lives in a separate account that gets passed to it on every call. The program never knows what state exists on the chain except the state the current transaction handed it. This is unlike the standard smart-contract model where each contract has its own storage attached to its address.

The second is **explicit account declaration**. Every transaction lists every account it intends to touch, marked as read-only or writable. This list is the access plan. The runtime reads it before execution begins and uses it to decide which transactions are safe to run in parallel and which conflict. There is no way to discover what state a transaction touches by running it. The list has to be correct before the transaction is even submitted, which means the client building the transaction needs to know in advance what the program will need.

The third is **per-account ownership**. Every account on Solana is owned by exactly one program. Only that program is allowed to modify the account's data. The runtime enforces this before letting the program touch the bytes. Reads are open to anyone, but writes go through the owner program. This is the security model. A token balance held in a token account cannot be modified by an attacker's program, because the attacker's program is not the owner of that account.

The fourth is **rent**. Storing data on the chain takes space that every validator has to hold in memory, and the network charges for that. Solana asks each account to deposit enough lamports up front to cover its storage permanently, in proportion to the bytes it occupies. The deposit is refundable when the account is closed. In practice every account is created with this rent-exempt minimum, and rent stops being something the developer thinks about beyond the moment of creation.

These four are not separate ideas. They are different views of the same decision.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>One design decision, four downstream consequences</title><desc>A top box states the choice: execute unrelated transactions in parallel, on different threads. Arrows lead to four boxes showing the consequences: stateless programs with data in accounts, transactions that declare which accounts they touch, one owner program per account with write rights, and accounts paying for storage with rent-exempt SOL.</desc>
  <defs>
    <marker id="arrS21R" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>

<rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">One design decision, four downstream consequences</text>

<rect x="220" y="80" width="280" height="70" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="360" y="106" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">The choice</text>
  <text x="360" y="124" text-anchor="middle" font-family="monospace" font-size="10">execute unrelated transactions</text>
  <text x="360" y="140" text-anchor="middle" font-family="monospace" font-size="10">in parallel, on different threads</text>

<line x1="290" y1="152" x2="120" y2="208" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrS21R)"/>
  <line x1="330" y1="152" x2="290" y2="208" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrS21R)"/>
  <line x1="390" y1="152" x2="430" y2="208" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrS21R)"/>
  <line x1="430" y1="152" x2="600" y2="208" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrS21R)"/>

<rect x="40" y="215" width="155" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="117" y="235" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Consequence 1</text>
  <line x1="55" y1="244" x2="180" y2="244" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="117" y="262" text-anchor="middle" font-family="monospace" font-size="10">programs are</text>
  <text x="117" y="278" text-anchor="middle" font-family="monospace" font-size="10">stateless,</text>
  <text x="117" y="294" text-anchor="middle" font-family="monospace" font-size="10">accounts hold</text>
  <text x="117" y="310" text-anchor="middle" font-family="monospace" font-size="10">the data</text>

<rect x="213" y="215" width="155" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="290" y="235" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Consequence 2</text>
  <line x1="228" y1="244" x2="353" y2="244" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="290" y="262" text-anchor="middle" font-family="monospace" font-size="10">transactions</text>
  <text x="290" y="278" text-anchor="middle" font-family="monospace" font-size="10">declare which</text>
  <text x="290" y="294" text-anchor="middle" font-family="monospace" font-size="10">accounts they</text>
  <text x="290" y="310" text-anchor="middle" font-family="monospace" font-size="10">will touch</text>

<rect x="386" y="215" width="155" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="463" y="235" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Consequence 3</text>
  <line x1="401" y1="244" x2="526" y2="244" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="463" y="262" text-anchor="middle" font-family="monospace" font-size="10">each account</text>
  <text x="463" y="278" text-anchor="middle" font-family="monospace" font-size="10">has one owner</text>
  <text x="463" y="294" text-anchor="middle" font-family="monospace" font-size="10">program with</text>
  <text x="463" y="310" text-anchor="middle" font-family="monospace" font-size="10">write rights</text>

<rect x="559" y="215" width="125" height="120" fill="#e0deda" stroke="#000000"
