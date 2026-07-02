# Consensus on Ethereum

_type: lecture_

> Ethereum doesn't use proof of work anymore. Since September 2022, it has used proof of stake. Validators put up 32 ETH as collateral, take turns proposing blocks, and lose part of their stake if they cheat. The mechanics are different from Bitcoin in almost every detail, but the goal is the same. Get a network of independent nodes to agree on which blocks count, without anyone in charge.

## What changed at the Merge

Bitcoin's consensus you already know. Miners burn electricity hashing block headers. Whoever finds a winning hash first publishes the next block. Rewriting history requires redoing all that work, which is prohibitively expensive.

Ethereum used the same model until September 2022. Then, in an upgrade called the Merge, it switched to proof of stake. The block producers stopped being miners with hardware and started being **validators** with staked ETH. The protocol's security argument changed from "attacking the chain costs more electricity than it could possibly earn" to "attacking the chain forfeits more staked ETH than it could possibly earn."

Three things drove the change. The first was energy. PoW Ethereum was using roughly the same electricity as Switzerland, and PoS dropped that by about 99.95% overnight. The second was issuance. PoW required generous block rewards to keep miners buying hardware and burning power, so the network minted a lot of new ETH each year. PoS can secure the network on a much smaller subsidy. The third was scalability. Ethereum's roadmap for scaling, including rollups, depends on finality properties that PoW cannot deliver.

## Who runs Ethereum now

A **validator** is an entity with 32 ETH locked into a special contract on the Ethereum chain. The 32 ETH minimum exists to keep the validator set small enough to coordinate but large enough to be decentralized. At the time of writing there are over a million active validators on the network. They aren't a million different people. Many of them are run by staking services, exchanges, or pools where users deposit smaller amounts of ETH that get bundled into validator-sized chunks. Each validator is still a distinct identity with its own signing key, and each one acts independently in the protocol.

Running a validator means running two pieces of software side by side. The **execution client**, such as Geth or Reth, processes transactions and maintains the EVM state. The **consensus client**, such as Lighthouse or Prysm, handles attestations, block proposals, and the proof-of-stake mechanics. The two communicate over a local API. Before the Merge, a single client did everything. The split exists because PoS consensus is a fundamentally different concern from transaction execution, and separating them lets each evolve independently.

Validators have two main jobs. First, when their turn comes, they propose a block. Second, every chance they get, they vote on which block they think should be the canonical one. These votes are called **attestations**. The protocol bundles validators into committees, with each slot getting one committee of around 128 validators tasked with attesting to that slot's block. Across an entire epoch, every active validator attests exactly once. The protocol aggregates all those attestations to decide what the chain looks like.

Selection of the proposer for each slot is pseudo-random but not arbitrary. The protocol uses a mechanism called **RANDAO**, which mixes in entropy contributed by validators themselves over many slots. The next proposer for slot N is determined by RANDAO output from earlier slots, plus the validator's stake weight. Nobody can predict the exact proposer schedule far in advance, but it is fully deterministic given the chain's state, which means every node agrees on whose turn it is.

A validator that does its job correctly earns small rewards on roughly every slot it attests in and a larger reward when it proposes a block. A validator that misbehaves loses some or all of its stake, an event called **slashing**. Slashing punishes specific provable bad behavior: signing two conflicting attestations, or proposing two different blocks for the same slot. The minimum slashing penalty is 1 ETH, but the protocol also applies a **correlation penalty** that scales with how many other validators were slashed around the same time. A lone bug that slashes one validator costs that validator 1 ETH. A coordinated attack that slashes thousands of validators at once costs each of them their entire 32 ETH stake. This is the math that makes attacking Ethereum economically catastrophic.

## How time works on Ethereum

Bitcoin's block timing is loose, because mining is a random process. Ethereum's PoS clock is rigid. The chain divides time into fixed units.

A **slot** is 12 seconds. Every 12 seconds, the protocol expects a new block. One validator is selected as the proposer for that slot. If they propose a valid block on time, the chain advances. If they miss their slot, that slot is skipped, the chain moves on to the next slot's proposer, and the missing validator earns no reward and pays a small penalty. Missed slots happen for ordinary reasons: an offline validator, an unreliable internet connection, a software bug. At the time of writing, the missed-slot rate hovers around 1%.

An **epoch** is 32 slots. So one epoch is 32 × 12 = 384 seconds, about 6.4 minutes. Epochs are where higher-level consensus events happen. At the end of each epoch, validators vote on a **checkpoint**: a specific block at an epoch boundary that they agree should be locked in.

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Ethereum epochs of 32 slots, checkpoints, and finalization</title><desc>Each epoch has 32 slots of 12 seconds, about 6.4 minutes, and ends with a checkpoint block, shown for epochs N, N+1, and N+2. When two epochs in a row have justified checkpoints, the chain finalizes, roughly 12.8 minutes after the block was first proposed.</desc>
  <defs>
    <marker id="arr24" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<text x="360" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">How time is structured on Ethereum</text>

<text x="40" y="70" font-size="11" fill="#565653" font-style="italic">Slots (12 seconds each)</text>

<rect x="40" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="64" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="88" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="112" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="146" y="100" font-family="monospace" font-size="11" fill="#565653">...</text>
  <rect x="170" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="194" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="218" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="51" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">1</text>
  <text x="75" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">2</text>
  <text x="99" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">3</text>
  <text x="123" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">4</text>
  <text x="181" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">30</text>
  <text x="205" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">31</text>
  <text x="229" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">32</text>

<text x="140" y="135" text-anchor="middle" font-size="11" fill="#565653">32 slots = 1 epoch ≈ 6.4 minutes</text>

<rect x="280" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="304" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="338" y="100" font-family="monospace" font-size="11" fill="#565653">...</text>
  <rect x="362" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="386" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="291" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">1</text>
  <text x="315" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">2</text>
  <text x="373" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">31</text>
  <text x="397" y="100" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">32</text>

<rect x="450" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="474" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="508" y="100" font-family="monospace" font-size="11" fill="#565653">...</text>
  <rect x="532" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <rect x="556" y="80" width="22" height="32" fill="#e0deda" stroke="#000000" stroke-width="1"/>

<text x="640" y="100" font-family="monospace" font-size="11" fill="#565653">...</text>

<line x1="245" y1="80" x2="245" y2="125" stroke="#ed4937" stroke-width="2"/>
  <line x1="415" y1="80" x2="415" y2="125" stroke="#ed4937" stroke-width="2"/>
  <line x1="585" y1="80" x2="585" y2="125" stroke="#ed4937" stroke-width="2"/>

<text x="245" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">checkpoint</text>
  <text x="415" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">checkpoint</text>
  <text x="585" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">checkpoint</text>

<text x="140" y="180" text-anchor="middle" font-size="10" fill="#565653">Epoch N</text>
  <text x="330" y="180" text-anchor="middle" font-size="10" fill="#565653">Epoch N+1</text>
  <text x="500" y="180" text-anchor="middle" font-size="10" fill="#565653">Epoch N+2</text>

<rect x="40" y="210" width="450" height="55" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="265" y="232" text-anchor="middle" font-size="11" fill="#000000" font-weight="bold">Two consecutive justified checkpoints → finalization</text>
  <text x="265" y="252" text-anchor="middle" font-size="10" fill="#565653">Roughly 12.8 minutes after the block was first proposed.</text>

<line x1="245" y1="155" x2="245" y2="208" stroke="#565653" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="415" y1="155" x2="415" y2="208" stroke="#565653" stroke-width="1.5" stroke-dasharray="3 3"/>

<text x="360" y="305" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Every 12 seconds, one validator proposes a block. Every 6.4 minutes, the network finalizes a checkpoint.</text>
</svg>

This regular rhythm is one of the biggest practical differences from Bitcoin. A Bitcoin block might arrive in 30 seconds or in 30 minutes, while an Ethereum slot is always 12 seconds. Wallets, applications, indexers, and bridges all rely on this predictability.

## How a block becomes final

Ethereum's finality model has two stages.

The first stage is **justification**. At the end of each epoch, the validator set looks at the checkpoint block, which is the first block of that epoch, and votes on whether to justify it. If a supermajority of validators, defined as two-thirds of the total active stake, attests to that checkpoint, it becomes justified.

The second stage is **finalization**. A justified checkpoint becomes finalized when the *next* checkpoint after it is also justified. So two consecutive justified epochs lock the earlier one in. A block proposed at the start of epoch N becomes finalized at the end of epoch N+1, about 12.8 minutes later.

This two-thirds threshold is what makes the whole security model work. It means an attacker needs to control more than one-third of the total stake to prevent finalization, by withholding their attestations. The same one-third threshold also makes finalized blocks essentially permanent: reverting a finalized block requires at least one-third of all staked ETH to attest to a conflicting checkpoint, which the protocol detects as a slashable offense. Slashing one-third of all stake is tens of billions of dollars at current stake levels. So in practice, finalized blocks are as close to permanent as any computer system gets.

This is genuinely different from Bitcoin. Bitcoin has **probabilistic finality**. The probability that a block gets reverted decreases as more blocks are built on top of it, but it never reaches zero. Ethereum has **economic finality**. After about 12.8 minutes, the protocol mathematically guarantees the block stays unless attackers willingly destroy a third of all staked ETH. The first kind of finality is statistical. The second kind is contractual.

## How conflicting blocks get resolved

What happens if a network split or a misbehaving proposer produces two valid blocks at the same slot, or two competing chains? Ethereum uses a fork-choice rule called **LMD-GHOST**, short for Latest Message Driven Greediest Heaviest Observed Sub-Tree.

Every validator's most recent attestation counts as a vote for a particular block. When choosing the canonical chain, each node looks at all the votes it knows about, weights them by the validator's stake, and picks the chain branch with the most weight behind it. Validators are required to only vote on the head of the chain they think is canonical, so as long as a supermajority is honest, the votes converge.

This is similar in spirit to Bitcoin's "longest chain wins" rule, but the unit of weight is different. Bitcoin counts cumulative proof of work. Ethereum counts cumulative stake-weighted attestations. Both produce a single canonical chain that the rest of the protocol can rely on.

## Who actually builds the block

In current Ethereum, the validator selected as proposer almost never builds the block themselves. The block-building process is split between two actors through a system called **proposer-builder separation**, or PBS. Specialized **builders** assemble blocks, typically optimizing them to extract maximum value from the transactions they include. The proposer, when their slot arrives, picks the highest-paying block from the builders and signs it. The proposer earns the priority fees plus a payment from the chosen builder.

This split exists because building an optimal block is a hard problem: it means simulating thousands of transactions, finding the most profitable ordering of them — known as MEV, or maximal extractable value — and offering a higher price than other builders. Hobbyist validators can't compete with professional builder operations. Rather than let block-building centralize into a few large validators, the protocol effectively lets validators stay decentralized while specialized builders handle the optimization. The mechanism that makes this work in practice is software called **MEV-Boost**, run by most validators, which relays builder blocks to the proposer for selection.

## What this means in practice

Three implications matter for the rest of this course.

Block times are short. Twelve seconds between blocks means transactions confirm fast. A user who submits a transaction with sufficient priority fee can usually expect it to appear in the next block or the one after.

Finality takes minutes. Bridges, exchanges, and high-value applications wait for finalization at around 12.8 minutes before treating a transaction as settled. Smaller applications often treat one or two confirmations as enough, depending on what's at stake.

Reorgs happen rarely and only at the tip. A block can be reorged out if the network briefly disagrees on the head, which usually resolves within a slot or two. Once justified, reorgs become very unlikely. Once finalized, reorgs become economically impossible without a catastrophic attack.

The PoS machinery has more moving parts than PoW, but the practical effect is the same: a network of independent nodes converges on a single shared history, and you can write code that relies on that convergence.
