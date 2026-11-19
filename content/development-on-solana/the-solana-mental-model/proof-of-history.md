---
id: 186
title: Proof of History
type: lecture
order: 6
faq:
  - question: Why is Proof of History called a clock?
    answer: >-
      Each output is the SHA-256 hash of the one before it, with no shortcut. Reaching a
      given point means computing every step in order, so the length of the chain measures
      how much real time passed.
  - question: Is Proof of History Solana's consensus mechanism?
    answer: >-
      No. PoH is a clock that orders events. Tower BFT is the consensus mechanism, and it
      runs on top of the clock.
  - question: Why does my transaction expire after about a minute?
    answer: >-
      Its recent_blockhash names a point on the Proof of History chain, and that point stays
      valid for about 150 slots, roughly a minute.
  - question: Does Proof of History protect against double-spends?
    answer: >-
      No. It only fixes the order of past events, since rewriting that order would mean
      redoing every hash in between. Double-spends, censorship and invalid state changes are
      stopped by the consensus layer and the runtime's validation rules.
  - question: How long is a Solana slot?
    answer: >-
      About 400 milliseconds. The leader bundles every 64 ticks into one slot, which is
      Solana's block.
---

> Validators have to agree on the order of events, and figuring that out usually means a lot of back-and-forth voting before any real work can begin. Solana's answer is a clock that everyone can verify after the fact, without trusting anyone in particular. That clock is called Proof of History.

## Validators' own clocks cannot settle the order of events

Different nodes have slightly different clocks, as the [determinism lesson](/courses/blockchain-basics/the-blockchain-idea/determinism-and-what-blockchains-cant-do) explained. Validator A might say 12:00:00.100 and validator B might say 12:00:00.150, with no way to tell which one is right. So validators cannot decide that one transaction came before another by looking at their clocks.

The usual fix is a timestamp that the block producer writes into the block. The other validators can check it only against their own clocks, which differ, so the producer has some freedom in choosing it and the network accepts it by exchanging messages. It also measures time no finer than one block. On Ethereum a new block is expected once per 12-second slot, as described in [consensus on Ethereum](/courses/development-on-ethereum/how-ethereum-works/consensus-on-ethereum). Instead of taking the producer's word for the time, Solana uses a clock whose readings anyone can recompute.

## A hash chain measures elapsed time

Proof of History is a hash function applied to its own output, over and over. Each output becomes the input to the next. The hash function used is SHA-256, the same one Bitcoin uses for mining. It has no known shortcut, so given an input, there is no way to compute the result faster than running the function.

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

To reach tick a thousand from tick zero, you must compute every tick between them in order. A single computer running this loop will produce tick N after a measurable amount of time, so the chain encodes time by the work that had to happen between one moment and the next, rather than by reading a clock.

## Slow to produce, fast to verify

Producing the chain is strictly sequential. The leader who is responsible for advancing the clock has to compute each tick from the previous one, on a single CPU core, one at a time. More cores cannot help, and a faster machine cannot help much, so the chain advances at roughly the speed a single core can hash.

Verifying the chain is the opposite. To check that the chain is valid, you confirm that each tick really is the hash of the previous one, and that check is independent for every link. You can give a thousand different cores a different section of the chain, and they can all verify their slices at the same time.

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

The leader running the clock is a single machine, and the rest of the network, hundreds or thousands of validators, can keep up with it because they verify in parallel. Nobody has to vote on what time it is.

The clock is paid for in hardware. The leader keeps one core hashing all the time, and every validator recomputes every hash, which is fast only when the work is spread over many cores. [What Solana traded for what](/courses/development-on-solana/architecture-details/what-solana-traded-for-what) lists what a validator machine needs.

## Transactions are hashed into the chain

When a transaction arrives at the leader, the leader hashes the transaction's contents into the next tick along with the previous hash. Now the resulting tick depends on both the chain's history and that specific transaction.

Say the transaction goes into tick 2. Tick 3 is the hash of tick 2, so it depends on the transaction too, and moving the transaction to another place would change tick 2 and every tick after it. The transaction has a verifiable position on the clock: it happened at tick 2, no earlier and no later.

The `recent_blockhash` field you met in [instructions and transactions](/courses/development-on-solana/the-solana-mental-model/instructions-and-transactions) is a snapshot of a recent point on the PoH chain. Including it in the transaction proves the transaction was built after that point, which is what keeps old transactions from being replayed indefinitely. Once the blockhash falls outside the validity window of about 150 slots, roughly a minute, the network rejects any transaction still referencing it.

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

The leader bundles up everything that happened in a window of roughly 400 milliseconds into a block. That window is called a slot, and a slot can pass without a block, as the [leader schedule lesson](/courses/development-on-solana/architecture-details/the-leader-schedule-and-block-production) shows later.

## What PoH is and is not

PoH is a clock, and it is not Solana's consensus mechanism. Consensus is the process by which validators agree on which version of history is the canonical one when multiple are possible. Solana's consensus mechanism is called Tower BFT. It runs on top of PoH and uses the timestamps PoH provides, so the votes do not have to settle when each event happened. Validators see the same PoH chain everyone else sees, vote on which slots they believe are valid, and the network converges on a single canonical sequence.

PoH is also not what makes Solana secure. It does not protect against double-spends, censorship, or invalid state transitions. Those protections come from the consensus layer and the runtime's validation rules. PoH only protects against rewriting the order of past events, since rewriting would require redoing all the hash work between the rewritten point and the present.

In practice, almost nothing about your day-to-day Solana development depends on the internals of PoH. You include a `recent_blockhash` in every transaction, you see slots arrive at roughly 400ms intervals, and you read confirmations from validators voting on those slots.
