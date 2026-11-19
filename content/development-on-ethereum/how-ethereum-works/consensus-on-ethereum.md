---
id: 104
title: Consensus on Ethereum
type: lecture
order: 4
faq:
  - question: How long is a slot on Ethereum?
    answer: >-
      12 seconds. An epoch is 32 slots, about 6.4 minutes.
  - question: Is Ethereum still mined?
    answer: >-
      No. Since the Merge in September 2022 Ethereum reaches consensus through proof of stake.
      Validators lock 32 ETH as collateral, take turns proposing blocks, and lose stake if they
      cheat. Energy use dropped by about 99.95%.
  - question: How long until a transaction is truly final?
    answer: >-
      About 12.8 minutes. A transaction with a decent tip lands within a slot or two, but
      finality waits for two consecutive epoch checkpoints, each justified by two-thirds of
      the staked ETH. Bridges and exchanges wait for it.
  - question: What happens to a validator that goes offline or double-signs?
    answer: >-
      Going offline costs it a missed slot, no reward, and a small penalty, and around 1% of
      slots are missed for ordinary reasons. Double-signing is slashable: at least 1 ETH, plus
      a correlation penalty that can reach the whole 32 ETH when many validators are slashed
      together.
  - question: Does the validator chosen for a slot build the block?
    answer: >-
      Usually not. Specialized builders assemble blocks and compete on how much they pay, and
      the proposer signs the highest-paying one. Most validators run MEV-Boost.
---

> Since September 2022 Ethereum has used proof of stake instead of proof of work. Validators put up 32 ETH as collateral, take turns proposing blocks, and lose part of their stake if they cheat. What a contract author needs from this is finality: when a block can no longer be reverted, and what reverting it would cost.

## An attack costs stake instead of electricity

Until September 2022 Ethereum was secured by proof of work, like Bitcoin. Then, in an upgrade called the Merge, it switched to proof of stake. The block producers stopped being miners with hardware and started being **validators** with staked ETH. The protocol's security argument changed from "attacking the chain costs more electricity than it could possibly earn" to "attacking the chain forfeits more staked ETH than it could possibly earn." The switch also cut the network's electricity use by about 99.95%.

A validator is an entity with its own signing key and 32 ETH locked into a special contract on the Ethereum chain. When its turn comes, it proposes a block. The rest of the time it votes on which block it thinks should be the canonical one, and these votes are called **attestations**.

## Slashing punishes two conflicting signatures

Locked ETH deters an attack only if the protocol can take it away, and to take it away the protocol needs proof of what the validator did. A block proposal and an attestation are both signed messages, so two messages from one validator that contradict each other are such a proof: two conflicting attestations, or two different blocks for the same slot. Losing stake for this is called **slashing**.

The minimum slashing penalty is 1 ETH, but the protocol also applies a **correlation penalty** that scales with how many other validators were slashed around the same time. A lone bug that slashes one validator costs that validator 1 ETH. A coordinated attack that slashes thousands of validators at once costs each of them their entire 32 ETH stake.

## Time is cut into 12-second slots and 32-slot epochs

A **slot** is 12 seconds, and one validator is selected as the proposer for each slot. If the proposer misses the slot, it is skipped, and the proposer earns no reward and pays a small penalty. At the time of writing about 1% of slots are missed, for ordinary reasons such as an offline validator or a software bug. A Bitcoin block might arrive in 30 seconds or in 30 minutes, because mining is a random process, while an Ethereum slot is always 12 seconds.

An **epoch** is 32 slots, so one epoch is 32 × 12 = 384 seconds, about 6.4 minutes. Across an epoch, every active validator attests once. At the end of each epoch, validators vote on a **checkpoint**: a specific block at an epoch boundary that they agree should be locked in.

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

## Reverting a finalized block costs a third of all staked ETH

A checkpoint becomes permanent in two stages. It becomes **justified** when validators holding two-thirds of the total active stake attest to it. It becomes **finalized** when the next checkpoint after it is also justified. So two consecutive justified epochs lock the earlier one in. A block proposed at the start of epoch N becomes finalized at the end of epoch N+1, about 12.8 minutes later.

The two-thirds threshold puts a price on reverting such a block. To replace a finalized checkpoint, a conflicting checkpoint would also need attestations from two-thirds of the stake. Two-thirds plus two-thirds is four-thirds, so validators holding at least one-third of the stake must have attested to both checkpoints. Those are two conflicting attestations, the offence that gets slashed, and with that many validators slashed at once the correlation penalty takes the entire stake of each. Slashing one-third of all stake is tens of billions of dollars at current stake levels.

Bitcoin has **probabilistic finality**, where the probability that a block gets reverted decreases as more blocks are built on top of it but never reaches zero. Ethereum has **economic finality**, where after about 12.8 minutes a block stays unless attackers willingly destroy a third of all staked ETH.

## Before finality, the branch with the most stake behind it wins

Until a block is finalized, nodes can see two competing branches, for example after a network split. Each node takes every validator's most recent attestation as a vote, weights it by the validator's stake, and follows the branch with the most weight behind it. A block on the losing branch is dropped in a reorg, as described in [forks and conflict resolution](/courses/blockchain-basics/the-blockchain-idea/forks-and-conflict-resolution). On Ethereum reorgs happen rarely and only at the tip of the chain, and the disagreement usually resolves within a slot or two.

## The proposer signs a block that a builder assembled

In current Ethereum, the validator selected as proposer almost never builds the block themselves. Under a system called **proposer-builder separation**, or PBS, specialized **builders** assemble blocks, and the proposer picks the highest-paying block from the builders and signs it. The proposer earns the priority fees plus a payment from the chosen builder. Most validators do this through software called **MEV-Boost**, which relays builder blocks to the proposer.

Building a block means simulating thousands of transactions, finding the most profitable ordering of them, and offering a higher price than other builders. Hobbyist validators can't compete with professional builder operations, so the split lets validators stay decentralized while specialized builders handle the optimization. The profit that can be made by choosing the order is known as MEV, or maximal extractable value.

For your contract this means the order of transactions in a block is chosen by a party that is paid for choosing it well. The [front-running and MEV lesson](/courses/development-on-ethereum/token-security-and-evm-internals/front-running-and-mev) covers what follows from that.

## What proof of stake costs

The PoS machinery has more moving parts than PoW, and finality depends on who holds the stake.

A checkpoint needs two-thirds of the stake, so validators holding more than one-third can prevent finalization by withholding their attestations. The same happens if that many validators are offline.

At the time of writing there are over a million active validators on the network, but they aren't a million different people. Many of them are run by staking services, exchanges, or pools. The one-third and two-thirds thresholds count stake, so what matters is how much stake the largest operators run, not how many validators there are.

## Check what your code assumes about finality and block contents

**How long do you wait before treating a transaction as settled?** A transaction with a sufficient priority fee usually appears in the next block or the one after, but a block at the tip can still be reorged. Bridges, exchanges, and high-value applications wait for finalization at around 12.8 minutes. Smaller applications often treat one or two confirmations as enough, depending on what's at stake.

**Does your contract treat anything in the block as unpredictable?** Whoever assembles the block chooses the transactions and their order, and the proposer knows every value a contract can read from the block before publishing it. That includes `block.timestamp` and `block.prevrandao`, the previous block's RANDAO value. RANDAO is the randomness the protocol itself uses to pick proposers. If a contract derives an outcome from these values, the proposer can compute the outcome first and skip its slot if the outcome is bad for it, at the cost of the block reward. So neither value is a source of randomness. The [randomness lesson](/courses/development-on-ethereum/oracles/randomness-on-chain) shows the attack.
