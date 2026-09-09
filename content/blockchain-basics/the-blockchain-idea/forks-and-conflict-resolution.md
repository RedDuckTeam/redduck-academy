---
id: 82
title: Forks and conflict resolution
type: lecture
order: 6
faq:
  - question: Why do two valid blocks sometimes appear at the same time?
    answer: >-
      Messages take time to cross the planet. Two producers in different regions can finish
      valid blocks moments apart, both pointing at the same parent.
  - question: The chain split in two. How does the network pick a side?
    answer: >-
      Every protocol has a fork choice rule that each node runs identically with no referee. A
      common one picks the branch with more work or stake, so the branch that gets the next
      block wins.
  - question: My transaction was in a block and now it is gone. What happened?
    answer: >-
      A reorg. Your block lost the fork choice, became an orphan, and its effects on state
      were undone.
  - question: Why do exchanges make me wait for confirmations?
    answer: >-
      The newest block is the most likely to be replaced by a reorg, and each block on top
      makes reversal exponentially less likely. How many to wait for is a risk decision about
      the amount at stake. Some chains finalise blocks instead, and a finalised block is never
      reorganised.
  - question: What is the difference between a soft fork and a hard fork?
    answer: >-
      A soft fork only tightens the rules, so blocks made under them still look valid to old
      software and nothing splits. A hard fork changes rules old nodes reject, and the network
      breaks into two chains with separate histories.
---

> The last lesson assumed the ideal case, where nothing goes wrong. One block producer proposes a block, the network accepts it, the chain grows by one. In reality, the network is geographically spread across the planet and messages take time to travel. Two qualified block producers can finish their work at almost the same instant, in different parts of the world. Each broadcasts a block. Both blocks contain different transactions but point back at the same parent block. For a few seconds, half the network thinks the chain looks like one thing and the other half thinks it looks like something else. This lesson is about what happens in those moments and why it matters even when everything goes right.

## The basic problem

The disagreement comes from physics. Light moves fast but not instantly. A block produced in one city does not appear in every node in the world simultaneously. It propagates outward through the gossip network, hop by hop, and during the seconds it takes to reach everyone, another producer somewhere else might finish their own block. Both blocks are valid. Both follow the rules. Both point at the same parent block as the next link. The chain now has a temporary **fork**: two competing versions of what block N+1 should be.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Block N branching into two competing Block N+1 versions from producer A and producer B</title><desc>Block N, the shared parent, has arrows pointing to two separate Block N+1 candidates: one from producer A and one from producer B. Half the network sees producer A's block first while the other half sees producer B's block first, creating a temporary fork that the network must resolve.</desc> <defs> <marker id="arr1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto"> <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/> </marker> </defs> <!-- Block N --> <rect x="40" y="110" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="100" y="135" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Block N</text> <text x="100" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">the shared parent</text> <!-- Block N+1 (top) --> <rect x="240" y="40" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="300" y="65" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Block N+1</text> <text x="300" y="85" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">producer A</text> <!-- Block N+1 (bottom) --> <rect x="240" y="180" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="300" y="205" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Block N+1</text> <text x="300" y="225" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">producer B</text> <!-- Arrows from N to N+1s --> <line x1="160" y1="125" x2="240" y2="80" stroke="#565653" stroke-width="2" marker-end="url(#arr1)"/> <line x1="160" y1="155" x2="240" y2="200" stroke="#565653" stroke-width="2" marker-end="url(#arr1)"/> <!-- Half network labels -->

<text x="450" y="70" font-size="12" fill="#565653" font-style="italic">half the network sees</text> <text x="450" y="88" font-size="12" fill="#565653" font-style="italic">producer A's block first</text>

<text x="450" y="210" font-size="12" fill="#565653" font-style="italic">other half sees</text> <text x="450" y="228" font-size="12" fill="#565653" font-style="italic">producer B's block first</text>

<text x="360" y="270" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">A temporary fork. Both branches are valid. The network has to pick one.</text> </svg>

For the moment, the chain has two heads. A node that received producer A's block first is treating block N+1 from A as the current tip. A node that received producer B's block first is treating block N+1 from B as the tip. Both are doing the right thing according to the rules they know.

If nothing else happened, the network would stay split forever. Two separate histories, each consistent within its own population of nodes, each unable to tell which is "real." That outcome is unacceptable. The whole point of consensus is that everyone ends up with the same view.

## The solution: fork choice rules

Every blockchain protocol includes a **fork choice rule**, which is a deterministic procedure for picking one branch over another whenever a fork appears. The rule has to satisfy two requirements. It has to be computable by any node from local information, no central referee. And it has to be the same rule on every node, so that two honest nodes seeing the same fork will independently arrive at the same answer.

The specific rule depends on the chain. A common family of rules pick the branch that has the most work or stake behind it, on the theory that more cumulative effort means more credibility. Another family uses voting from validators to mark certain blocks as definitively chosen. The shapes vary, but the underlying logic is the same. Take some property that is hard to fake, measure it across the competing branches, and pick the branch that has more of it.

In the moment a fork appears, no branch has any advantage yet. Both branches are just one block past the shared parent. The deciding factor is what happens next.

## The race for the next block

Producers keep producing. Each producer in the network builds on the version of the chain they currently see as the tip. Some producers are building on top of A's block, others on top of B's. The next block in either branch extends that branch's lead.

The moment one branch gets a second block before the other, fork choice rules across the network start swinging in its favour. Nodes that were on the losing branch see the new, longer branch coming through gossip, recognise it as more credible under their fork choice rule, and **switch over**. Their copy of the chain rewrites recent history: they discard the block they had as N+1 and replace it with the winning branch's blocks N+1 and N+2.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Block N forks into winning branch (N+1, N+2) versus orphaned N+1 block</title><desc>Block N splits into two branches. The winning branch extends with N+1 from producer A and N+2 from producer C, while the losing branch's N+1 block from producer B is left orphaned as a dead end.</desc> <defs> <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto"> <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/> </marker> </defs> <!-- Block N --> <rect x="40" y="110" width="100" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="90" y="145" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Block N</text> <!-- Winning branch (top): N+1 + N+2 --> <rect x="200" y="40" width="100" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/> <text x="250" y="65" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">N+1</text> <text x="250" y="85" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">producer A</text> <rect x="360" y="40" width="100" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/> <text x="410" y="65" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">N+2</text> <text x="410" y="85" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">producer C</text>

<text x="520" y="75" font-size="12" fill="#ed4937" font-weight="bold">winning branch</text>

<!-- Losing branch (bottom): N+1 only --> <rect x="200" y="180" width="100" height="60" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="4 3"/> <text x="250" y="205" text-anchor="middle" font-size="13" fill="#565653" font-weight="bold">N+1</text> <text x="250" y="225" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">producer B</text>

<text x="320" y="215" font-size="12" fill="#565653" font-style="italic">orphaned</text>

<!-- Arrows --> <line x1="140" y1="125" x2="200" y2="80" stroke="#565653" stroke-width="2" marker-end="url(#arr2)"/> <line x1="300" y1="70" x2="360" y2="70" stroke="#565653" stroke-width="2" marker-end="url(#arr2)"/> <line x1="140" y1="155" x2="200" y2="200" stroke="#565653" stroke-width="1.5" stroke-dasharray="4 3"/>

<text x="360" y="270" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">The winning branch gets longer. The losing branch becomes an abandoned dead end.</text> </svg>

The block on the losing branch is now called an **orphan**. It was valid when it was produced, the network briefly accepted it, but the fork choice rule no longer points at it. The transactions inside it never made it to the canonical chain. Their effects on state are undone everywhere.

This rewriting of recent history is called a **reorganization**, usually shortened to **reorg**. Reorgs of one or two blocks happen routinely on most networks. They almost never cause problems in practice, because no application built on top of the chain treats a brand-new block as final. The convention is to wait for some number of additional blocks to build on top of any given block before considering its contents settled.

## Why this means "wait for confirmations"

This has a direct, practical consequence. If your transaction has just been included in the most recent block, that block is the most likely block in the chain to be replaced by a reorg. Each additional block built on top of it makes a reorg exponentially less likely. The alternative branch would have to outproduce the current canonical branch by enough to overtake it, and that becomes harder with every block it falls behind.

This is why exchanges, payment processors, and any high-value application waits for some number of additional blocks (called **confirmations**) before treating a transaction as final. The specific number depends on the chain and the value at stake. Small payments might be safe after one or two confirmations. Multi-million-dollar transfers wait for many more. The exact threshold is a risk-management choice, but the underlying principle is the same. Depth in the chain equals safety from reorganisation.

Some chains have an additional mechanism that explicitly marks blocks as **finalised** after a certain depth or after enough validators sign off on them. Once a block is finalised under such a mechanism, the protocol guarantees it will never be reorganised. The notion of "wait for finality" replaces "wait for confirmations" in those chains. The practical effect is similar from the application's perspective: do not treat new blocks as permanent immediately.

## Permanent forks: soft and hard

The forks discussed so far are temporary. The network self-heals within seconds, and nodes that had different views converge on the same view as the fork choice rule plays out. The chain ends up with one canonical history again.

A different kind of fork is not temporary. It happens when the rules of the protocol themselves change, and not every node updates to the new rules at the same time. Two populations of nodes end up running different software. They no longer agree on what counts as a valid block. The fork between them is permanent, because no fork choice rule can bridge a disagreement at the rules level.

There are two kinds of permanent fork: soft and hard.

A **soft fork** tightens the existing rules. Some blocks that used to be valid are no longer valid under the new rules. Critically, every block that's valid under the new rules is also valid under the old rules. Nodes running old software will still accept the new chain. They might be missing some new features, but they aren't excluded. The fork resolves itself if enough block producers move to the new rules, because the old-software nodes follow along automatically.

A **hard fork** changes the rules in a way that's not backwards-compatible. Some blocks valid under the new rules are not valid under the old rules. Nodes running old software will reject new blocks. The two populations split into two separate chains, each with their own state, their own history of transactions after the fork point, and their own future. Both can continue to exist independently, but they are now different networks.

Hard forks are how rule changes that the community can't agree on play out in the open. Each side runs their own version of the software, and the market decides which one accumulates value. Several well-known blockchain projects exist today as the surviving side of a hard fork that split the original community.

## The full operational picture

You now have the full operational picture of a blockchain, including the cases where things do not go smoothly. You can explain why two valid blocks can appear at once, how the longest-chain rule resolves the split, why a transaction becomes harder to reverse as blocks pile on top of it, and how soft and hard forks differ. Temporary disagreement is normal, and the network is built to converge on a single shared history without anyone in charge.
