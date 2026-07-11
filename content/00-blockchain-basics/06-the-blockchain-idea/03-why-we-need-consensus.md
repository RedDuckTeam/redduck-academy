---
id: 79
title: Why we need consensus
type: lecture
faq:
  - question: Why can't a blockchain just let nodes vote on the next block?
    answer: On an open network anyone can join, and one party can cheaply spin up
      thousands of fake identities to become the majority of voters. Creating
      fake identities to manipulate a vote is called a Sybil attack, and it
      makes plain voting meaningless. That is why real consensus ties voting
      power to a cost that fake identities can't dodge.
  - question: What is a Sybil attack and why does it break naive consensus?
    answer: A Sybil attack is creating unlimited fake identities to manipulate a
      decision. Because anyone can join a public blockchain, one attacker could
      appear as thousands of separate voters and outvote everyone honest.
      Blockchains defend against it by making each vote require spending
      something real, like electricity or locked-up money, so faking many
      identities becomes too expensive to be worth it.
  - question: How do strangers who don't trust each other end up agreeing on one
      shared history?
    answer: They use a consensus mechanism that makes participation cost something
      real, so buying enough influence to attack the network costs more than the
      attack could earn. Proof of work ties each vote to wasted computation and
      its energy bill; proof of stake ties it to currency you lock up and lose
      if you cheat. Once voting is expensive, honest agreement can hold
      indefinitely with no operator and no trusted referee.
  - question: What is the Byzantine Generals problem?
    answer: It's a 1982 thought experiment where several generals surrounding a city
      must all agree to either attack or retreat; any split outcome is a
      disaster. They can only send messengers, and some generals are traitors
      who lie to make the plan fail. The generals stand in for network nodes,
      the traitors for malicious participants, and the core difficulty is that
      honest participants can't tell who is lying, because a traitor can send
      different messages to different people.
---

> The previous lesson made a strong claim. A blockchain has no operator. Nobody runs it. Yet it somehow holds a consistent record across thousands of independent machines, all of whom can write to it. Forget the cryptography for a moment and just focus on the question. How is that possible at all? The mechanism that makes it possible is called consensus, and it is the single most subtle problem in distributed systems. This lesson explains why the problem is hard, why the obvious solutions don't work, and what the actual answer looks like at the level of "how it works" rather than "which exact algorithm."

## The problem, stated plainly

Imagine a few thousand computers spread across the world. None of them trust any of the others. There is no shared boss, no central server, no court of appeal. New facts come in: new transactions, new blocks, and other new data. Every machine has to decide what to add to its copy of the record. And every machine has to end up with the same record as every other one.

Worse, some of those computers will lie. They'll propose blocks that don't follow the rules. They'll send different versions of "the truth" to different peers. They'll go offline at convenient moments. They'll team up to push fake history. The network has no way to identify the liars in advance, because anyone can join.

The system has to produce one agreed-upon record anyway. Not most of the time. All of the time, forever, as long as the network exists. With strangers, in public, with hostile actors actively trying to break it.

This is the consensus problem, and for most of the history of computer science, it was considered either impossible or only solvable inside small, trusted groups. Bitcoin's design in 2008 was the first time anyone showed it could be solved at internet scale, with anonymous participants, without any pre-existing trust between them.

## The Byzantine Generals framing

The classic way to describe this problem comes from a 1982 thought experiment about generals besieging a city. Several generals surround the city. They have to agree on a single coordinated action: either all attack at dawn or all retreat. Any half-and-half outcome is a disaster. They can only communicate by messengers, and some of the generals are traitors who will lie to make the operation fail.

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Byzantine Generals problem: four generals around a city, one a traitor</title><desc>Four generals, A, B, C, and D, surround a city and must all agree to attack or retreat together. Dashed lines show messages passing between every pair of generals and the city, while General C, marked in red, is the traitor who may lie.</desc>
  <!-- The city -->
  <rect x="290" y="135" width="140" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="160" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">The city</text>
  <text x="360" y="180" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">all-or-nothing attack</text>

<!-- General 1: honest -->
  <rect x="40" y="30" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="100" y="55" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">General A</text>
  <text x="100" y="75" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">honest</text>

<!-- General 2: honest -->
  <rect x="560" y="30" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="620" y="55" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">General B</text>
  <text x="620" y="75" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">honest</text>

<!-- General 3: traitor -->
  <rect x="40" y="240" width="120" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="100" y="265" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">General C</text>
  <text x="100" y="285" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">traitor</text>

<!-- General 4: honest -->
  <rect x="560" y="240" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="620" y="265" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">General D</text>
  <text x="620" y="285" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">honest</text>

<!-- Messages between all -->
  <line x1="160" y1="60" x2="290" y2="155" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="560" y1="60" x2="430" y2="155" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="160" y1="270" x2="290" y2="175" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="560" y1="270" x2="430" y2="175" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<line x1="160" y1="60" x2="560" y2="60" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="160" y1="270" x2="560" y2="270" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="100" y1="90" x2="100" y2="240" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="620" y1="90" x2="620" y2="240" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="360" y="320" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">All generals exchange messages. Some are honest, some lie. They still have to agree on one plan.</text>
</svg>

The generals are stand-ins for nodes on a network. The messengers are network connections. The traitors are malicious or buggy participants. The "agree on attack or retreat" is "agree on which block comes next." Replace the army metaphor with database servers and you have the actual problem facing every blockchain on day one.

The hard part is not "tell honest from dishonest." The hard part is that the honest participants can't tell either, because they only see the messages they receive, and a clever traitor can send different messages to different recipients. Two honest generals can both be confident they've reached the right answer and still end up with opposite plans.

Any system that wants to make decisions without a trusted referee has to solve some version of this problem.

## Why the obvious solutions fail

The first thing most developers reach for is **voting**. Each participant proposes their version of the next block. Everyone votes. Majority wins.

This breaks immediately on an open network, for one reason. There is no way to count "participants" when anyone can create a thousand fake identities for the price of cloud rental. A vote becomes meaningless the moment one party can show up as 51% of the voters by themselves. Creating unlimited fake identities to manipulate a vote is called a **Sybil attack**, and it's the reason every naive consensus scheme fails the moment it touches the open internet.

The second instinct is **first writer wins**. Whoever submits a block first gets to write it. Done.

This breaks because there is no shared clock. Two participants on opposite sides of the planet can each be the "first" from their own perspective, and the network has no way to decide between them. Worse, an attacker with a faster connection can systematically race honest participants and always win.

The third instinct is **fall back to a trusted server**. Let one party be the tiebreaker, just for the cases where the network can't agree.

This works, and it's how most databases handle replication. It's also exactly what a blockchain is trying to avoid. The moment you have a trusted tiebreaker, the system has an operator again. Everything that made the structure interesting is gone.

So voting fails because participants are fakeable. First-wins fails because there is no shared clock. Trusted-server fails because it defeats the purpose. The problem is genuinely hard.

## The actual answer: make participation cost something

The breakthrough is one sentence long. **If you want to vote, you have to spend something real, and you only get to vote once per unit of what you spent.**

Now think about what that does. An attacker can still create a thousand fake voters, but each one has to actually pay the cost. If the cost is large enough, paying it a thousand times is more expensive than the attack is worth. Sybil attacks become economically infeasible rather than technically impossible. The system isn't preventing fake identities. It's making them too expensive to bother with.

What counts as "something real"? Two main answers have shown up in the past two decades. Both use the same general logic.

**Computation.** Each "vote" requires the voter to demonstrate they did a large amount of useless arithmetic. The arithmetic itself is wasted, but the energy bill is real, and energy costs the same regardless of who's paying. An attacker with a thousand fake identities has to pay a thousand times the electricity. This is the family of mechanisms called **proof of work**.

**Stake.** Each "vote" requires the voter to lock up an amount of the network's own currency, with the rule that if they vote dishonestly they lose it. An attacker with a thousand fake identities has to lock up a thousand times the stake, and any visible misbehaviour costs them all of it. This is the family of mechanisms called **proof of stake**.

The mechanics of either family are detailed enough to need their own treatment. Later chain-specific lessons cover them. What you need to take from this lesson is the underlying logic, which is the same for both. Voting in an open consensus system has to be expensive enough that buying enough votes to attack the network costs more than the attack is worth. Once you have that property, the network can hold honest agreement among strangers indefinitely, with no operator and no trusted referee.

## What this buys you

A consensus mechanism with a real participation cost gives the network three properties that no amount of clever programming can produce in its absence.

**One canonical history, agreed by all.** Two honest nodes will converge on the same view of the chain over time, even though they started with no shared trust and exchange only messages.

**Resistance to majority attackers.** The network stays safe as long as attacking it costs more than the attacker could profit from the attack.

**Permissionless participation.** Anyone with the resources to pay the cost can participate. Nobody is keeping a list of who is allowed to vote. The cost itself is the gate.

Those three properties, together, are what a blockchain is actually selling. Cryptography gives it a tamper-evident structure. Consensus gives it the ability to operate that structure without an operator. Without either piece, the other is useless.

## Where this goes next

You now have the agreement mechanism that keeps a blockchain running. What you don't yet have is a clear picture of the participants. A blockchain is full of references to "nodes" doing things, "nodes" agreeing or disagreeing, "nodes" holding copies of the chain. The next lesson zooms in on what a node actually is, what kinds of nodes exist, and how they communicate with each other across the open internet to keep the system synchronised. Everything in this module so far has assumed nodes exist and do their job. The next lesson finally describes them.
