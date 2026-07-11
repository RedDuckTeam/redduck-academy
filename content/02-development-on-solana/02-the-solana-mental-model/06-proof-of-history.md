---
id: 186
title: Proof of History
type: lecture
faq:
  - question: How does Proof of History work as a clock?
    answer: It repeatedly runs a hash function (SHA-256) on its own output, so each
      result can only have come after the one before it. Because there is no
      shortcut, reaching a given point in the chain requires computing every
      step in order, which takes measurable time. That long chain of hashes is
      the clock, and each link records that real time passed between one moment
      and the next.
  - question: Is Proof of History Solana's consensus mechanism?
    answer: No. Proof of History is only a clock that orders events in time.
      Agreeing on which version of history is canonical is a separate job
      handled by Solana's consensus mechanism, Tower BFT, which runs on top of
      it. PoH speeds consensus up by removing the need to vote on what time it
      is, but it does not replace consensus.
  - question: Why does my Solana transaction expire after about a minute?
    answer: Every transaction includes a recent_blockhash, which is a snapshot of a
      recent point on the Proof of History chain and proves the transaction was
      built after that point. Once that blockhash falls outside the validity
      window of roughly 150 slots (about a minute), the network rejects any
      transaction still referencing it. This is what stops old transactions from
      being replayed indefinitely.
  - question: Does Proof of History make Solana secure against double-spends?
    answer: No. Proof of History only protects the order of past events, since
      rewriting the order would mean redoing all the hash work in between.
      Protection against double-spends, censorship, and invalid state changes
      comes from the consensus layer and the runtime's validation rules, not
      from PoH.
---

> Most blockchains spend a lot of their throughput on the question "what time is it?" Validators have to agree on the order of events, and figuring that out usually means a lot of back-and-forth voting before any real work can begin. Solana's answer is a clock that everyone can verify after the fact, without trusting anyone in particular. That clock is called Proof of History. Understanding what it is and what it is not is the last conceptual piece before code.

## A tamper-proof stopwatch

Picture a notary in a small room with a stopwatch and a stack of paper. Every few seconds, the notary writes down a number, stamps it, and posts it on the wall. Each number is derived from the previous one in a specific way that takes a known amount of effort. Anyone who walks past the wall later can read down the list and verify two things: the numbers were produced in that exact order, and the gaps between them represent real elapsed time.

Proof of History is the digital version of that. There is no actual notary, only a hash function applied to its own output, over and over. Each output becomes the input to the next. The result is a long chain of hashes where every link can only have come after the link before it. The chain encodes time by representing the work that had to happen between one moment and the next, rather than by reading a clock.

This is what people mean when they call PoH a "cryptographic clock." The chain is the clock. Producing it costs measurable effort. Verifying that the effort happened costs almost nothing.

<svg role="img" viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Proof of History hash chain from a seed through tick 0 to tick 3</title><desc>A row of boxes labeled tick 0 through tick 3 are linked by arrows labeled hash, showing a chain that starts from a seed where each tick's hash output feeds into the next tick. A box below titled 'Why this is a clock' explains that each tick is one SHA-256 of the previous tick, a single CPU can do about 10,000 per millisecond, and reaching tick N requires computing every step from 0 to N in order.</desc>
  <defs>
    <marker id="arrS26aG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Proof of History is a hash chain</text>
  <rect x="40" y="100" width="110" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="95" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">tick 0</text>
  <line x1="50" y1="130" x2="140" y2="130" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="95" y="150" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">starting</text>
  <text x="95" y="165" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">seed</text>
  <line x1="155" y1="140" x2="183" y2="140" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS26aG)"/>
  <text x="160" y="132" font-family="monospace" font-size="8" fill="#565653">hash</text>
  <rect x="188" y="100" width="110" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="243" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">tick 1</text>
  <line x1="198" y1="130" x2="288" y2="130" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="243" y="150" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">8c4f...</text>
  <text x="243" y="165" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">d2a1</text>
  <line x1="303" y1="140" x2="331" y2="140" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS26aG)"/>
  <text x="308" y="132" font-family="monospace" font-size="8" fill="#565653">hash</text>
  <rect x="336" y="100" width="110" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="391" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">tick 2</text>
  <line x1="346" y1="130" x2="436" y2="130" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="391" y="150" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">f0b3...</text>
  <text x="391" y="165" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">7e94</text>
  <line x1="451" y1="140" x2="479" y2="140" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS26aG)"/>
  <text x="456" y="132" font-family="monospace" font-size="8" fill="#565653">hash</text>
  <rect x="484" y="100" width="110" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="539" y="122" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">tick 3</text>
  <line x1="494" y1="130" x2="584" y2="130" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="539" y="150" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2a17...</text>
  <text x="539" y="165" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">c8e2</text>
  <text x="608" y="140" font-family="monospace" font-size="10" fill="#565653">. . .</text>
  <line x1="95" y1="200" x2="95" y2="225" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="539" y1="200" x2="539" y2="225" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="95" y1="225" x2="539" y2="225" stroke="#565653" stroke-width="1"/>
  <text x="317" y="245" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">producing the chain takes time you cannot skip</text>
  <rect x="40" y="270" width="640" height="105" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="292" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Why this is a clock</text>
  <line x1="55" y1="300" x2="665" y2="300" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="320" font-family="monospace" font-size="10">Each tick is one SHA-256 of the previous tick.</text>
  <text x="60" y="338" font-family="monospace" font-size="10">A single CPU can do this around 10,000 times per millisecond.</text>
  <text x="60" y="356" font-family="monospace" font-size="10">No shortcut exists. To reach tick N, you have to compute every step from 0 to N in order.</text>
  <text x="360" y="400" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">If you see tick N, you know the work between tick 0 and tick N actually happened.</text>
</svg>

The hash function used is SHA-256, the same one Bitcoin uses for mining. The key property is that it has no known shortcut. Given an input, there is no way to compute the result faster than just running the function. And given a result, there is no way to compute an input that would produce it without trying inputs one at a time. To produce the chain, you must do the work. To reach tick a thousand from tick zero, you must compute every tick between them in order.

That property is what makes the chain a clock. A single computer running this loop will produce tick N after a measurable amount of time, and nobody, however well-funded, can skip ahead to tick N+1 without doing every step first.

## Slow to produce, fast to verify

The trick that makes Proof of History useful, rather than just expensive, is the asymmetry between producing the chain and verifying it.

Producing the chain is strictly sequential. The leader who is responsible for advancing the clock has to compute each tick from the previous one, on a single CPU core, one at a time. The next tick cannot start until the current tick is finished. This is the source of the "time" guarantee, since the only way to reach tick N is to spend the work between zero and N. Cores cannot help. Faster machines cannot help much either. The chain advances at roughly the speed a single core can hash.

Verifying the chain is the opposite. To check that the chain is valid, you just need to confirm that each tick really is the hash of the previous one. That check is independent for every link. You can give a thousand different cores a different section of the chain, and they can all verify their slices at the same time. The whole chain gets verified in the time it takes the slowest core to finish its slice.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Leader produces the hash chain sequentially; validators verify it in parallel</title><desc>The top box shows the leader producing the chain as a repeating sequence of hashes on one CPU core, one tick at a time, which cannot be parallelized since each tick depends on the previous one. The bottom box shows validators A and B checking different tick ranges on separate cores at the same time, so a large network of validators can verify the whole chain far faster than one CPU produced it.</desc>
  <defs>
    <marker id="arrS26bG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Slow to produce, fast to verify</text>
  <rect x="40" y="90" width="640" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="90" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="110" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">The leader produces the chain (sequentially)</text>
  <text x="60" y="140" font-family="monospace" font-size="11" font-weight="bold">leader:</text>
  <text x="135" y="140" font-family="monospace" font-size="10">→ hash → hash → hash → hash → hash → hash → hash → ...</text>
  <text x="60" y="158" font-family="monospace" font-size="9" fill="#565653">one CPU core, one tick at a time</text>
  <text x="60" y="176" font-family="monospace" font-size="9" fill="#565653">cannot be parallelized: each tick depends on the previous one</text>
  <rect x="40" y="210" width="640" height="180" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="210" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="230" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Everyone else verifies the chain (in parallel)</text>
  <text x="60" y="260" font-family="monospace" font-size="11" font-weight="bold">validator A:</text>
  <text x="170" y="260" font-family="monospace" font-size="10">checks ticks 0..999    on core 1</text>
  <text x="60" y="282" font-family="monospace" font-size="11" font-weight="bold">validator A:</text>
  <text x="170" y="282" font-family="monospace" font-size="10">checks ticks 1000..1999 on core 2</text>
  <text x="60" y="304" font-family="monospace" font-size="11" font-weight="bold">validator A:</text>
  <text x="170" y="304" font-family="monospace" font-size="10">checks ticks 2000..2999 on core 3</text>
  <text x="60" y="326" font-family="monospace" font-size="11" font-weight="bold">validator B:</text>
  <text x="170" y="326" font-family="monospace" font-size="10">checks ticks 0..999    on core 1, in parallel</text>
  <text x="60" y="348" font-family="monospace" font-size="9" fill="#565653" font-style="italic">verification is just "does hashing this input give the next output?"</text>
  <text x="60" y="364" font-family="monospace" font-size="9" fill="#565653" font-style="italic">each section is independent, so any number of cores or machines can split the work</text>
  <text x="60" y="380" font-family="monospace" font-size="9" fill="#565653" font-style="italic">a network of 1,000 validators can verify the chain 1,000 times faster than one CPU produced it</text>
  <text x="360" y="430" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">This is the asymmetry the network depends on. One CPU labors. Thousands verify cheaply.</text>
</svg>

This is the whole engineering bet behind Solana's throughput. The leader doing the hard work of running the clock is a single machine. The rest of the network, hundreds or thousands of validators, can keep up with that machine because their job is cheaper than the leader's by orders of magnitude. The chain advances fast, the network verifies faster, and nobody has to vote on "what time is it" before any real work can happen.

## Where transactions enter the picture

The clock by itself is just a sequence of hashes. To turn it into something useful, transactions get mixed into the chain as it advances. When a transaction arrives at the leader, the leader hashes the transaction's contents into the next tick along with the previous hash. Now the resulting tick depends on both the chain's history and that specific transaction. The transaction has a verifiable position on the clock: "this happened at tick N, between tick N-1 and tick N+1, no earlier and no later."

This is what the `recent_blockhash` field on every transaction refers to. The blockhash is a snapshot of a recent point on the PoH chain. Including it in the transaction proves the transaction was built after that point, which is what keeps old transactions from being replayed indefinitely. Once enough time has passed and the blockhash falls outside the validity window of about 150 slots, roughly a minute, the network rejects any transaction still referencing it.

<svg role="img" viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Four steps from PoH ticks to slots to validator consensus in Solana block production</title><desc>A vertical flow of four boxes connected by arrows, titled "Where PoH sits in Solana's block production." It shows the leader's hash chain ticking roughly every 6.25 microseconds, transactions getting stamped into ticks, ticks grouping into slots every 64 ticks (about 400 ms), and finally Tower BFT validators voting to finalize slots into the canonical chain.</desc>
  <defs>
    <marker id="arrS26cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Where PoH sits in Solana's block production</text>
  <rect x="40" y="90" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="113" font-family="monospace" font-size="11" font-weight="bold">1. PoH ticks (the clock)</text>
  <text x="60" y="133" font-family="monospace" font-size="10" fill="#565653">The leader runs the hash chain continuously. Each tick is a verified moment in time.</text>
  <text x="60" y="148" font-family="monospace" font-size="10" fill="#565653">A new tick happens about every 6.25 microseconds.</text>
  <line x1="360" y1="160" x2="360" y2="180" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS26cR)"/>
  <rect x="40" y="185" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="208" font-family="monospace" font-size="11" font-weight="bold">2. Transactions get stamped into the chain</text>
  <text x="60" y="228" font-family="monospace" font-size="10" fill="#565653">As transactions arrive, the leader hashes their contents into the next tick.</text>
  <text x="60" y="243" font-family="monospace" font-size="10" fill="#565653">Now each transaction has a verifiable position: "this happened at tick N."</text>
  <line x1="360" y1="255" x2="360" y2="275" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS26cR)"/>
  <rect x="40" y="280" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="303" font-family="monospace" font-size="11" font-weight="bold">3. Ticks group into slots (the blocks)</text>
  <text x="60" y="323" font-family="monospace" font-size="10" fill="#565653">Every 64 ticks (about 400 ms) the leader produces a slot, which is Solana's block.</text>
  <text x="60" y="338" font-family="monospace" font-size="10" fill="#565653">The slot wraps everything the leader did during that window.</text>
  <line x1="360" y1="350" x2="360" y2="370" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS26cR)"/>
  <rect x="40" y="375" width="640" height="65" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="398" font-family="monospace" font-size="11" font-weight="bold">4. Validators vote (the actual consensus)</text>
  <text x="60" y="418" font-family="monospace" font-size="10" fill="#565653">A separate mechanism, Tower BFT, takes the slots and finalizes them into the canonical chain.</text>
  <text x="60" y="433" font-family="monospace" font-size="10" fill="#565653">PoH is the timestamps. Consensus is the agreement on which sequence of slots is the real one.</text>
</svg>

Every 64 ticks, the leader bundles up everything that happened in that window and produces a slot. A slot is what Solana calls a block. At roughly 400 milliseconds per slot, this is the production rate that gives Solana its reputation for fast block times. The blocks come fast because the clock advances fast, and the clock advances fast because verifying it is cheap.

## What PoH is and is not

A common confusion is to call PoH "Solana's consensus mechanism." It is not. PoH is a clock. Consensus is the process by which validators agree on which version of history is the canonical one when multiple are possible. Those are different jobs.

Solana's consensus mechanism is called Tower BFT. It runs on top of PoH and uses the timestamps PoH provides to coordinate voting without the back-and-forth that other chains require. Validators see the same PoH chain everyone else sees, vote on which slots they believe are valid, and the network converges on a single canonical sequence. PoH speeds up consensus by removing one of the hardest parts of the problem, but it does not replace it.

A second confusion is to think PoH is what makes Solana secure. It does not. PoH does not protect against double-spends, censorship, or invalid state transitions. Those protections come from the consensus layer and the runtime's validation rules. PoH only protects against rewriting the order of past events, since rewriting would require redoing all the hash work between the rewritten point and the present.

In practice, almost nothing about your day-to-day Solana development depends on the internals of PoH. You include a `recent_blockhash` in every transaction. You see slots arrive at roughly 400ms intervals. You read confirmations from validators voting on those slots. The clock is in the background, doing its job, while you write programs that operate on accounts.
