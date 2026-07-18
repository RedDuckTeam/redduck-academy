---
id: 1079493066
title: Bypassing a constraint instead of fighting it
type: lecture
order: 1
faq:
  - question: How is bypassing a constraint different from finding a clever workaround?
    answer: A workaround still pays the constraint somewhere in the final design, so
      you can point to the cost it added. A bypass removes the constraint from the
      problem, so no part of the design has to account for it and there is no cost
      to point to. The test is whether the constraint still shapes any tradeoff in
      the finished solution.
  - question: Does Diffie-Hellman mean an eavesdropper can never learn the secret?
    answer: It means a passive eavesdropper who reads every message still cannot
      compute the shared secret, because that would require solving a problem
      believed to be computationally infeasible. It does not claim safety against
      every kind of attacker. Someone who can intercept and alter the messages,
      rather than only read them, is a different threat and needs a different
      defense.
  - question: Can every constraint be bypassed?
    answer: No. Some constraints are real properties of the outcome you need, and no
      design removes them. The pattern applies when a constraint belongs to one way
      of reaching the outcome rather than to the outcome itself, and the whole skill
      is telling those two apart.
---

> Every hard problem seems to contain a wall, a constraint that fixes the shape of every solution. The common response is to push against the wall and do better work inside it. The rarer and stronger response is to make the wall irrelevant, so that nothing in the solution has to account for it. That second move is the most dependable source of real architectural breakthroughs, and it is closer to a method than to a talent.

## A wall that stood for most of cryptography's history

For a long time, cryptography lived with one constraint that seemed absolute: you cannot prove you know a secret without revealing the secret. To convince someone you hold a password, you show the password. Proof and disclosure looked like the same act.

Everything built on top of that constraint accepted it. If proving a secret means exposing it, the work becomes exposing it as rarely and as carefully as possible. So cryptography got stronger encryption to protect secrets in transit, shorter key lifespans so an exposed secret was worth less, and tighter access control so fewer parties ever saw it. Every one of these is good engineering. Every one of them also takes the wall as given and works within it. The effort goes into guarding the moment of disclosure.

## The proof that reveals nothing

A zero-knowledge proof does not accept the wall. It lets a prover convince a verifier that they know a value while disclosing nothing about the value itself. The verifier finishes certain that the prover holds the secret, and still could not repeat it or recognize it later. Knowledge is demonstrated and the secret stays hidden.

Set that against the old constraint. The rule was that proof requires disclosure. A zero-knowledge proof produces the proof and skips the disclosure. The constraint left the problem completely. There was no smaller version of it left to pay. For that design, the sentence "you cannot prove you know a secret without revealing it" is simply no longer true, and no part of it has to plan around the wall.

## Working within a wall, or making it disappear

That is the pattern, and it is worth naming: **constraint bypass**. You take a constraint that every existing solution treats as fixed, and instead of paying it a little more efficiently, you build so that the constraint no longer applies.

The distinguishing mark is precise. When you work within a constraint, the constraint survives in your solution as a tradeoff. Stronger encryption costs computation. The wall is still there, and you can point to where your design pays it. When you bypass a constraint, the constraint survives nowhere. There is no line in the design where you paid it, because it stopped being part of the problem. Ask of any solution, "where does this pay the constraint?" If the answer is "here," you worked within it. If the answer is "nowhere," you bypassed it.

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

## Agreeing on a secret in the open

Cryptography had a second wall, and this one you can feel in daily life. Two people who want to exchange secret messages need a shared secret key first. But to agree on that key, they seem to need a private channel they already trust, and if they had such a channel they would not need the key. Agreement on a secret appeared to require a secret channel to agree over.

The responses that accept this wall are old and familiar. Send the key by a trusted courier. Seal it in an envelope. Hand over a codebook in person, in advance, and keep it safe. All of them assume the same thing: at some point the two parties need a channel an eavesdropper cannot read.

Diffie-Hellman key exchange, published in 1976, bypasses the wall. The two parties exchange ordinary messages over a completely public channel, one an eavesdropper reads in full, and at the end they share a secret the eavesdropper does not have. Each side combines what it received with a private value it never sent, and the two arrive at the same result. An observer who saw every message still cannot compute that result in any practical amount of time, because doing so means solving a problem believed to be computationally infeasible. The wall said agreement needs a secret channel. Diffie-Hellman reaches agreement over a channel with no secrecy at all, and the wall is irrelevant.

## The question that finds the bypass

Both breakthroughs came from the same move, and the move is methodical. Anyone can reach it by asking one question of the wall in front of them: is this constraint intrinsic to the outcome I need, or only to one way of reaching it?

"Proving a secret requires revealing it" felt intrinsic to proof. It was only intrinsic to the method where you hand the secret over. "Agreeing on a key requires a private channel" was the same, a property of the method where the key travels between the parties. Neither outcome ever required what the wall demanded. The requirement belonged to the familiar method, and a different method left it behind.

This is why the pattern is so dependable. Most walls in engineering are properties of the first solution everyone reached for, mistaken for properties of the problem itself. The bypass is there whenever the constraint you are fighting turns out to guard a method rather than a goal.

The same move appears far outside cryptography. Databases long treated locking as the only way to stop two people from overwriting each other's edits. Then optimistic concurrency dropped the lock: everyone edits freely, and the system checks for a conflict only at the moment a write is saved. The locking guarded the method, while the goal itself, safe concurrent editing, never required it.

## Test the wall before you accept it

When a design feels constrained by something you have been treating as a law, put the constraint into words. Then ask whether it truly belongs to the result you need, or only to the way you happen to be pursuing it. Most of the time it belongs to the method, and you can look for a different method that never meets the wall. You will not find a bypass every time, because some constraints are real properties of the goal. But each one you do find is worth more than any amount of skillful work spent inside the wall.

## Blockchain application

Skip this section if you only want the principle.

A hardware wallet signs transactions on a small, isolated device, and it faces a wall: the device cannot decode arbitrary transaction data into something a person can read. The response that accepts the wall is to teach the device more formats, larger whitelists of known contracts, more decoders for more interfaces, more registries to maintain. The device forever chases transactions it does not yet recognize. The ERC8009 approach bypasses the wall instead. Rather than decode the transaction, it shows the user the balance changes the transaction must produce, and the chain enforces those exact changes or the whole transaction reverts. The user approves what will actually happen to their holdings, and decoding is never required, so the wall that demanded it is irrelevant. The full design is examined in depth in the ERC8009 course.
