---
id: 88
title: The economics of proof of work
type: lecture
order: 4
faq:
  - question: What does it actually mean when people say Bitcoin is secured by energy?
    answer: "It is a literal statement rather than a metaphor. Bitcoin's security comes
      from cost rather than from cryptography being unbreakable: rewriting past
      transactions would force an attacker to redo an enormous amount of
      proof-of-work using real electricity and specialized hardware. Because
      building the chain forward is cheap but rewriting it is enormously
      expensive, forging history stays theoretically possible but practically
      unprofitable, and that gap is the security."
  - question: If someone controls 51% of Bitcoin's mining power, can they steal my coins?
    answer: No. A 51% attacker cannot steal coins from addresses they do not
      control, because moving coins requires a valid signature from the coin's
      owner, and hashrate does not break those cryptographic locks. They also
      cannot create new BTC or change the protocol rules, since other nodes
      reject invalid blocks. What they can do is double-spend their own recent
      coins, censor transactions, and reorganize the very recent chain.
  - question: Why is a transaction harder to reverse the more blocks are built on
      top of it?
    answer: Each block added on top required, on average, the whole network's
      proof-of-work effort for about ten minutes. To erase your transaction, an
      attacker must rebuild every one of those blocks while also outpacing the
      honest network that keeps extending the chain. So a transaction six blocks
      deep would need roughly an hour of the entire global network's effort
      redone, which is why deeper transactions are far more expensive to
      reverse.
  - question: Why would a big miner not just attack Bitcoin if they have enough hardware?
    answer: Because it would destroy the value of their own investment. Acquiring
      majority Bitcoin hashrate means spending billions on specialized hardware
      whose worth depends entirely on Bitcoin staying credible. A successful
      attack would crash Bitcoin's price and devalue that hardware below scrap,
      so the attacker would spend more than they could ever extract. This is why
      the largest miners are usually the most invested in Bitcoin's health.
---

The previous lesson explained what miners do. This one explains why they do it, and what their work gets the rest of the network. Both questions have economic answers. Mining is a competitive market where participants spend real electricity in the hope of winning block rewards, and the security of every transaction that has ever happened on Bitcoin rests on the fact that overwriting history is much more expensive than the alternative. By the end of this lesson, you should understand where Bitcoin's security guarantee actually comes from, what a 51% attack can and cannot do, and why "Bitcoin is secured by energy" is a literal statement rather than a metaphor.

## Mining is a market

A miner is in the business of turning electricity into bitcoin. There are two costs: the upfront cost of buying specialized hardware called **ASICs** (small machines built to do one thing, compute SHA-256 hashes as fast as possible) and the ongoing cost of the electricity to run them. The reward, when a miner wins a block, is the block subsidy plus the fees from every transaction in that block. Win a block, get the reward. Lose, get nothing.

Mining is competitive in two ways that matter for everything that follows.

First, every miner is fighting every other miner for the same fixed prize. The network produces one block every ten minutes, no matter how many people are mining. If you control 1% of the global hashing power, you'll win about 1% of the blocks over time. Doubling your hashing power doubles your expected revenue. But you're not creating new reward by doing this. You're taking a bigger share of the same fixed prize, leaving less for everyone else.

Second, electricity is the biggest cost, and electricity prices vary a lot. A miner running in a region with cheap hydroelectric power pays a fraction of what a miner running on retail grid power pays. So the miners who survive long-term are the ones with cheap electricity. Everyone else gets squeezed out when the bitcoin price dips.

Over time, this competition produces a predictable pattern. When the bitcoin price goes up or transaction fees rise, mining becomes more profitable, and more miners turn on their machines. Hashrate grows. The difficulty adjustment from the previous lesson happens every two weeks and tightens the puzzle so blocks still take ten minutes. When the price falls or fees shrink, less-efficient miners switch off, hashrate falls, and the difficulty loosens again. Block times stay at ten minutes through it all.

There's one consequence of this market structure that matters for the rest of the lesson. At every point in time, there is a miner just barely breaking even, one who would shut down tomorrow if their electricity bill went up by 5%. So the total amount of electricity being spent on mining is always close to the total reward being paid out, because anyone whose costs were much lower than their reward would attract competitors until prices equalised again.

In plain terms: the network spends roughly as much on mining as mining pays out. That sounds boring but it's the setup for the entire security argument.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Mining as a market: a miner's costs and revenue, and network hashrate vs difficulty</title><desc>For one miner, hardware and electricity costs feed a mining loop that pays out block subsidy plus fees. Across all miners, total hashrate expands and contracts with miner economics, and difficulty retargets every 2,016 blocks to hold about a 10 minute block time.</desc>
  <defs>
    <marker id="arr44" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<text x="360" y="25" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Mining as a market</text>

<text x="360" y="55" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">For one miner:</text>

<rect x="40" y="75" width="180" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="130" y="100" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Costs (in)</text>
  <text x="130" y="120" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">hardware + electricity</text>

<line x1="220" y1="105" x2="280" y2="105" stroke="#565653" stroke-width="2" marker-end="url(#arr44)"/>

<rect x="280" y="75" width="160" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="100" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">A miner</text>
  <text x="360" y="120" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">runs the mining loop</text>

<line x1="440" y1="105" x2="500" y2="105" stroke="#565653" stroke-width="2" marker-end="url(#arr44)"/>

<rect x="500" y="75" width="180" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="100" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Revenue (out)</text>
  <text x="590" y="120" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">block subsidy + fees</text>

<line x1="40" y1="180" x2="680" y2="180" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>

<text x="360" y="210" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Across all miners on the network:</text>

<rect x="40" y="230" width="280" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="255" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Total hashrate</text>
  <text x="180" y="275" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">expands and contracts with miner economics</text>

<line x1="320" y1="260" x2="400" y2="260" stroke="#565653" stroke-width="2" marker-end="url(#arr44)"/>
  <text x="360" y="252" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">retargets</text>

<rect x="400" y="230" width="280" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="255" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Difficulty</text>
  <text x="540" y="275" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">tunes every 2,016 blocks to hold ~10 min</text>

<text x="360" y="335" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Cheap electricity wins. Total mining spending tracks total mining reward over time.</text>
</svg>

## Where Bitcoin's security comes from

Now the big question. Why is a transaction that's been confirmed in a Bitcoin block hard to reverse?

The short answer is that building the chain forward is cheap, but rewriting it is enormously expensive, and the gap between those two costs is where Bitcoin's security comes from.

When a transaction is included in block N, its security against being reversed depends on how many blocks have been built on top of it. Block N+1, then N+2, then N+3, and so on. Each of those later blocks required a successful proof-of-work search, which required on average the entire network's effort for ten minutes. To erase the transaction in N, an attacker has to publish an alternative chain that starts from block N's predecessor, doesn't include the transaction, and ends up longer than the chain everyone else is following.

This means two things have to happen at once. The attacker has to redo all the proof-of-work from the fork point forward. And while they're doing that, the honest network is still extending the current chain. So the attacker has to outpace the honest network's ongoing work while also catching up to it.

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Honest chain N to N+k versus attacker's alternative chain racing to catch up</title><desc>The diagram shows the honest chain growing block by block from N through N+1, N+2, N+3, up to N+k. Below it, an attacker's alternative chain from N' onward must reach N+k+1' before the honest chain reaches N+k+1, since each extra block adds another full network's worth of work to redo, so cost grows linearly with depth while the attacker's chance of success drops exponentially.</desc>
  <defs>
    <marker id="arr44b" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<text x="360" y="25" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Why deeper blocks are harder to reverse</text>

<text x="40" y="65" font-size="12" fill="#000000" font-weight="bold">The honest chain:</text>

<rect x="40" y="80" width="60" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="70" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">N</text>

<line x1="100" y1="100" x2="120" y2="100" stroke="#565653" stroke-width="1.5" marker-end="url(#arr44b)"/>

<rect x="120" y="80" width="60" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="150" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">N+1</text>

<line x1="180" y1="100" x2="200" y2="100" stroke="#565653" stroke-width="1.5" marker-end="url(#arr44b)"/>

<rect x="200" y="80" width="60" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="230" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">N+2</text>

<line x1="260" y1="100" x2="280" y2="100" stroke="#565653" stroke-width="1.5" marker-end="url(#arr44b)"/>

<rect x="280" y="80" width="60" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="310" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">N+3</text>

<text x="365" y="105" font-family="monospace" font-size="13" fill="#565653">...</text>

<rect x="400" y="80" width="60" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="430" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">N+k</text>

<text x="40" y="170" font-size="12" fill="#ed4937" font-weight="bold">An attacker's alternative chain (must outpace the honest one):</text>

<rect x="40" y="190" width="60" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="70" y="215" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">N'</text>

<line x1="100" y1="210" x2="120" y2="210" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arr44b)"/>

<rect x="120" y="190" width="60" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="150" y="215" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">N+1'</text>

<line x1="180" y1="210" x2="200" y2="210" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arr44b)"/>

<rect x="200" y="190" width="60" height="40" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="230" y="215" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff">N+2'</text>

<text x="290" y="215" font-family="monospace" font-size="12" fill="#ed4937">...must reach N+k+1' before the honest chain reaches N+k+1</text>

<text x="40" y="270" font-family="monospace" font-size="11" fill="#000000">Each block deeper means another full network's worth of work to redo,</text>
  <text x="40" y="290" font-family="monospace" font-size="11" fill="#000000">on top of the work still being added to the honest chain. Cost grows linearly with depth,</text>
  <text x="40" y="310" font-family="monospace" font-size="11" fill="#000000">and probability of success drops exponentially as the attacker falls behind.</text>
</svg>

Concretely: to credibly reverse a transaction that's six blocks deep, an attacker would have to redo about an hour of the entire global network's effort, *while* matching the rest of the network's pace going forward. At Bitcoin's current scale, that requires assembling and running a fleet of specialized hardware comparable to the entire honest network. The hardware alone costs in the billions of dollars, much of it is already concentrated in the hands of large public mining companies, and the electricity to run it for the duration of the attack adds substantially to the bill.

This is what people mean when they say "Bitcoin is secured by energy." The security comes from cost rather than from cryptography being unbreakable. The cost of rewriting history is enormous, and that cost is paid in real-world resources an attacker would have to actually go out and buy. Forging the chain remains theoretically possible but practically *unprofitable*, and Bitcoin's whole security model rests on that gap.

## What a 51% attack can and cannot do

The textbook attack on a proof-of-work chain is the **51% attack**. The name comes from the idea that an attacker who controls more than half of the network's hashrate can, in expectation, produce blocks faster than the rest of the network, and therefore can win every fork-choice contest.

What this enables is narrower than the name suggests.

<svg role="img" viewBox="0 0 720 405" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Two-column list of what a 51% attacker can and cannot do</title><desc>The left column lists three things a 51% attacker can do: double-spend their own recent coins, censor transactions, and reorganise the recent chain. The right column lists four things it cannot do: steal coins from other addresses, create new BTC, cheaply rewrite ancient history, or change the protocol rules, each with a short reason.</desc>
  <text x="360" y="25" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">What a 51% attacker can and cannot do</text>

<rect x="40" y="60" width="320" height="305" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="200" y="90" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Can do</text>
  <line x1="50" y1="100" x2="350" y2="100" stroke="#565653" stroke-width="1"/>

<text x="55" y="125" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Double-spend their own coins</text>
  <text x="55" y="143" font-family="monospace" font-size="10" fill="#565653">in recent transactions, by reorganising</text>
  <text x="55" y="158" font-family="monospace" font-size="10" fill="#565653">the chain to exclude them</text>

<text x="55" y="190" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Censor transactions</text>
  <text x="55" y="208" font-family="monospace" font-size="10" fill="#565653">by refusing to include them in blocks</text>
  <text x="55" y="223" font-family="monospace" font-size="10" fill="#565653">the attacker mines</text>

<text x="55" y="255" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Reorganise the recent chain</text>
  <text x="55" y="273" font-family="monospace" font-size="10" fill="#565653">replace the last few blocks with</text>
  <text x="55" y="288" font-family="monospace" font-size="10" fill="#565653">a longer alternative they built</text>

<text x="55" y="320" font-family="monospace" font-size="10" fill="#565653" font-style="italic">All of the above degrades quickly as</text>
  <text x="55" y="335" font-family="monospace" font-size="10" fill="#565653" font-style="italic">the target transactions get older.</text>

<rect x="380" y="60" width="320" height="305" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="90" text-anchor="middle" font-size="13" fill="#ed4937" font-weight="bold">Cannot do</text>
  <line x1="390" y1="100" x2="690" y2="100" stroke="#565653" stroke-width="1"/>

<text x="395" y="125" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Steal coins from arbitrary addresses</text>
  <text x="395" y="143" font-family="monospace" font-size="10" fill="#565653">that would require forging signatures,</text>
  <text x="395" y="158" font-family="monospace" font-size="10" fill="#565653">which is a separate cryptographic problem</text>

<text x="395" y="190" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Create BTC out of thin air</text>
  <text x="395" y="208" font-family="monospace" font-size="10" fill="#565653">the coinbase subsidy is fixed by protocol</text>
  <text x="395" y="223" font-family="monospace" font-size="10" fill="#565653">and rejected by every honest node</text>

<text x="395" y="255" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Rewrite ancient history cheaply</text>
  <text x="395" y="273" font-family="monospace" font-size="10" fill="#565653">cost grows linearly with chain depth</text>
  <text x="395" y="288" font-family="monospace" font-size="10" fill="#565653">redoing years of work is prohibitive</text>

<text x="395" y="320" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Change the protocol rules</text>
  <text x="395" y="338" font-family="monospace" font-size="10" fill="#565653">block size, halving, etc. enforced by nodes</text>
</svg>

The "can do" side is real and worth taking seriously. An attacker who succeeds at a 51% attack can double-spend: deposit BTC at an exchange, wait for the deposit to be credited, withdraw that value, then rewrite history so the deposit transaction never happened. This is the most lucrative thing a 51% attacker can do, and it has happened on smaller proof-of-work chains where the cost of acquiring majority hashrate is low. It has not happened against Bitcoin itself, because acquiring majority Bitcoin hashrate would cost, depending on the moment, several billion dollars of hardware. Buying that much hardware would immediately drive prices up and signal to the entire industry that something was happening.

The "cannot do" side is what tends to surprise people. A 51% attack does not let the attacker steal coins from addresses they don't control, because moving coins requires a valid signature from the coin's owner. The attacker still has to satisfy the cryptographic locks on every output they want to spend. A 51% attack also doesn't change the protocol's economic rules. If the attacker mines a block with a coinbase reward of 100 BTC instead of the current 3.125, every other node on the network rejects that block as invalid. Hashrate doesn't override protocol rules. It just decides which valid blocks make it into the canonical chain.

The deepest reason 51% attacks against Bitcoin are rare is economic. An attacker who actually acquires majority Bitcoin hashrate has now invested billions in specialized hardware whose value depends entirely on Bitcoin's continued credibility. Successfully attacking Bitcoin would crash its price, devaluing the attacker's own hardware below scrap value. The attacker would have spent more on the attack than they could plausibly extract from it. This is the same dynamic that explains why the largest miners are typically the *most* invested in Bitcoin's health: they are the ones with the most to lose if the system fails.

## Why proof of work, fundamentally

The lesson on consensus made the argument abstractly. You need a way to prevent Sybil attacks without using identity, and the way to do that is to make participation costly. Proof of work is one specific instantiation of that principle: the cost is electricity, and the "vote" is hashrate. The energy is not a side-effect or a waste product. The energy *is* the security mechanism. To remove the energy expenditure would be to remove the very thing that makes attacks economically irrational.

Whether that tradeoff is the right one is a real question, and other approaches make different ones. A later lesson returns to that comparison. The narrow point of this lesson is that within Bitcoin's chosen design, the energy use is doing real work. It makes rewriting history vastly more expensive than leaving it alone, to the point where no rational actor attempts it.
