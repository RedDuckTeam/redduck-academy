---
id: 1493157219
title: Virtual execution
type: lecture
order: 30
---

Sometimes you can't predict or know the exact execution details of an action. To solve this problem, protocols apply what we call **Virtual Execution**: the execution is made virtually, with the real execution performed later on, when the details of that execution become known.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Virtual execution</title><desc>Two transactions. The first one writes a record, owed, into the state and moves no coins. The second one, later, reads the record and moves the coins. An arrow connects the record to the payment.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Virtual execution</text>
  <rect x="80" y="100" width="220" height="100" rx="0" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="122" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">tx 1: the action</text>
  <rect x="130" y="135" width="120" height="46" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="190" y="155" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace" font-weight="bold">record</text>
  <text x="190" y="172" text-anchor="middle" font-size="11" fill="#ed4937" font-family="monospace" font-weight="bold">owed 40</text>
  <text x="190" y="215" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">no coins move</text>
  <line x1="300" y1="158" x2="409.0" y2="158.0" stroke="#ed4937" stroke-width="3"/>
  <polygon points="409.0,152.0 409.0,164.0 420,158" fill="#ed4937"/>
  <text x="360" y="148" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">later</text>
  <rect x="420" y="100" width="220" height="100" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="530" y="122" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">tx 2: the transfer</text>
  <circle cx="490" cy="160" r="9" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="490" y="164" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">$</text>
  <circle cx="516" cy="160" r="9" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="516" y="164" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">$</text>
  <circle cx="542" cy="160" r="9" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="542" y="164" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">$</text>
  <circle cx="568" cy="160" r="9" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="568" y="164" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">$</text>
  <text x="530" y="185" text-anchor="middle" font-size="11" fill="#ed4937" font-family="monospace" font-weight="bold">paid 40</text>
  <text x="360" y="250" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The result is final when the action happens. The real transfer waits for the accounts to arrive.</text>
</svg>

## Examples

**Monaco Protocol's order book:** When a match happens between a maker and a taker, the protocol doesn't yet know how to send the tokens to the maker, because in order to do that, it would have to know the accounts of the maker, for which it would require to store additional data and have the taker compute the account addresses. So it marks them as eligible for sending, and later on, when someone is ready to perform the execution, they bring the virtually executed send into a real one.

**ZK Compression** drops each spent record into a queue on the spot. Anyone running a node later moves the queue into the tree, for a reward.
