---
id: 1079493066
title: Bypassing a constraint instead of fighting it
type: lecture
order: 1
faq:
  - question: What question finds the bypass?
    answer: >-
      Is this constraint intrinsic to the outcome I need, or only to one way of reaching it?
  - question: How do I know whether I bypassed a constraint or worked within it?
    answer: >-
      Ask where the design pays the constraint. Stronger encryption still costs computation,
      so you can point to the line where it is paid. A zero-knowledge proof pays it nowhere,
      because proving knowledge while revealing nothing takes the constraint out of the
      problem.
  - question: Can an eavesdropper on a Diffie-Hellman exchange work out the shared secret?
    answer: >-
      Not by reading. Both sides exchange ordinary messages over a fully public channel and
      still arrive at a secret an observer cannot compute, because computing it means solving
      a problem believed to be computationally infeasible. The exchange was published in 1976.
      An attacker who can alter the messages rather than only read them is a different threat.
  - question: Isn't a lock the only way to stop two people overwriting each other's edits?
    answer: >-
      No. Optimistic concurrency lets everyone edit freely and checks for a conflict at the
      moment a write is saved. The lock guarded one method, and the goal never required it.
  - question: Can every constraint be bypassed?
    answer: >-
      No. Some constraints are real properties of the outcome you need.
---

> Every hard problem seems to contain a wall, a constraint that fixes the shape of every solution. The common response is to do better work inside the constraint. The rarer response is a **constraint bypass**, which means building so that the constraint no longer applies and nothing in the solution has to account for it. It is closer to a method than to a talent.

## Stopping overwrites does not require a lock

Databases long treated locking as the only way to stop two people from overwriting each other's edits. With a lock, one person edits a record and everyone else waits until the lock is released, so every design built on locks pays in waiting.

Optimistic concurrency bypasses that constraint by dropping the lock. Everyone edits freely, and the system checks for a conflict only at the moment a write is saved. Locking was a property of one method, while the goal itself, safe concurrent editing, never required it.

Dropping the lock has its own cost. When the check finds a conflict, the later write is not saved, and its author has to redo the edit.

## Two parties can agree on a secret over a public channel

Two people who want to exchange secret messages need a shared secret key first. But to agree on that key, they seem to need a private channel they already trust, and if they had such a channel they would not need the key.

The old responses accept this constraint: send the key by a trusted courier, seal it in an envelope, or hand over a codebook in person, in advance. All of them assume that at some point the two parties need a channel an eavesdropper cannot read.

Diffie-Hellman key exchange, published in 1976, bypasses the constraint. The two parties exchange ordinary messages over a public channel, one an eavesdropper reads in full, and at the end they share a secret the eavesdropper does not have. Each side combines what it received with a private value it never sent, and the two arrive at the same result. An observer who saw every message still cannot compute that result in any practical amount of time, because doing so means solving a problem believed to be computationally infeasible. The private channel was a property of the method where the key travels between the parties.

The exchange removes the need for a secret channel. An attacker who can alter the messages rather than only read them is a different threat, which the exchange alone does not address.

## A secret can be proved without being revealed

For a long time, cryptography lived with one constraint that seemed absolute: you cannot prove you know a secret without revealing the secret. To convince someone you hold a password, you show the password. If proving a secret means exposing it, the work becomes exposing it as rarely and as carefully as possible, with stronger encryption to protect secrets in transit, shorter key lifespans so an exposed secret is worth less, and tighter access control so fewer parties ever see it.

A zero-knowledge proof bypasses the constraint. It lets a prover convince a verifier that they know a value while disclosing nothing about the value itself. The verifier finishes certain that the prover holds the secret, and still could not repeat it or recognize it later. Disclosure was intrinsic only to the method where you hand the secret over.

## Working within a constraint, or bypassing it

When you work within a constraint, the constraint survives in your solution as a tradeoff, and you can point to where your design pays it. A lock pays it in waiting, and stronger encryption pays it in computation. When you bypass a constraint, there is no line in the design where you paid it, because it stopped being part of the problem. Ask of any solution, "where does this pay the constraint?" If the answer is "here," you worked within it. If the answer is "nowhere," you bypassed it.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Working within a constraint versus bypassing it</title><desc>Two boxes side by side responding to the same constraint. The left box works within it, guarding the secret more carefully while the wall stays as a cost in the design. The right box bypasses it, proving knowledge while revealing nothing, so the wall no longer applies.</desc>
<text x="360" y="32" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Two responses to the same wall</text>

  <rect x="40" y="60" width="300" height="180" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="60" width="300" height="30" fill="#565653" stroke="#000000" stroke-width="2"/>
  <text x="190" y="80" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Work within it</text>
  <text x="190" y="120" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">input: the constraint</text>
  <line x1="60" y1="134" x2="320" y2="134" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="190" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">output:</text>
  <text x="190" y="182" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">guard the secret harder,</text>
  <text x="190" y="200" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">proving still reveals it.</text>
  <text x="190" y="218" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">the wall stays as a cost</text>

  <rect x="380" y="60" width="300" height="180" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="60" width="300" height="30" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="80" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Bypass it</text>
  <text x="530" y="120" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">input: the same constraint</text>
  <line x1="400" y1="134" x2="660" y2="134" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="530" y="160" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">output:</text>
  <text x="530" y="182" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">prove knowledge,</text>
  <text x="530" y="200" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">reveal nothing.</text>
  <text x="530" y="218" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">the wall is irrelevant</text>

<text x="360" y="272" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Within the wall you can point to the cost. Bypassed, there is no cost to point to.</text>
</svg>

The cost that disappears is the cost of the old constraint. The new method can have costs of its own, such as the redone edit under optimistic concurrency, so after you find a bypass, ask what it pays instead.

## The question that finds the bypass

When a design feels constrained by something you have been treating as a law, put the constraint into words and ask one question: is this constraint intrinsic to the outcome I need, or only to one way of reaching it? Many constraints in engineering are properties of the first solution everyone reached for, mistaken for properties of the problem itself. If yours belongs to the method, look for a different method that never meets it.

You will not find a bypass every time, because some constraints are real properties of the goal. A bank ledger has to remember how much each customer holds, because the record of who owns what is the ledger itself, and no other way of keeping a ledger avoids that. [Account-generic design](/courses/engineering-principles/relevance-and-genericity/account-generic-design) comes back to this example.

## Blockchain application

A hardware wallet signs transactions on a small, isolated device, and it faces a constraint: the device cannot decode arbitrary transaction data into something a person can read. The response that accepts the constraint is to teach the device more formats, larger whitelists of known contracts, more decoders for more interfaces, more registries to maintain. The device forever chases transactions it does not yet recognize. The ERC-8009 approach bypasses the constraint. Instead of decoding the transaction, it shows the user the balance changes the transaction must produce, and the chain enforces those changes or the whole transaction reverts. The user approves what will happen to their holdings, and the device never has to decode the target contract's data. The design is covered in [ERC-8009: sign the outcome](/courses/development-on-ethereum/clear-signing/erc-8009-sign-the-outcome).

The bypass pays in coverage. ERC-8009 constrains only native ETH and ERC-20 balances, so the screen says nothing about an NFT or a lending position that the same transaction changes, as [The core and its routers](/courses/development-on-ethereum/clear-signing/the-core-and-its-routers) explains.
