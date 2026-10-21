---
id: 1192848433
title: Pay-as-you-act
type: lecture
order: 20
---

Protocols very frequently use the pattern of distributing computations across users and having them pay only for their part. We call this **Pay-As-You-Act**: with this pattern, everyone pays for their own piece of the work, at the moment of their own action, instead of paying for the whole protocol at once.

Take an election as an example.

* **The bad design** stores the votes. When the voting period closes, someone walks through all of the votes to find the winner. That iterating transaction pays for every vote, and nobody would volunteer to execute that transaction, as it's a common effort shifted onto a single person.
* **Instead, the good design** gives each action its piece of the final step. When a vote comes in, the program immediately increases the candidate's count and compares it with the leader's count, without waiting for the final resolution window. If the count is higher, this candidate becomes the new leader. Each voter executes one addition and one comparison, triggered by that voter. When the voting period is finished, the protocol already knows the winner, as the leader is already recorded in the state, and the closing transaction reads one field.

Most of the "at the end" steps can be embedded into intermediate in-process transactions: an election winner, a payout, an average number. The key to the pattern is to store the answer instead of inputs, and let every action update it. The answer has to be something that one action can update in one step: a count, a total, a maximum, an average, a leader.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Pay-as-you-act</title><desc>A timeline of five actions. Each action carries a small block of work and adds it to the answer box, which grows step by step. At the end of the timeline there is no big block of work left, only a checkmark.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Pay-as-you-act</text>
  <line x1="50" y1="200" x2="669.0" y2="200.0" stroke="#565653" stroke-width="2"/>
  <polygon points="669.0,194.0 669.0,206.0 680,200" fill="#565653"/>
  <text x="640" y="218" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">time</text>
  <circle cx="90" cy="116" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 76 146 Q 90 124 104 146 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="80" y="160" width="20" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <line x1="90" y1="176" x2="90.0" y2="185.0" stroke="#000000" stroke-width="2"/>
  <polygon points="96.0,185.0 84.0,185.0 90,196" fill="#000000"/>
  <text x="90" y="86" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">action</text>
  <circle cx="190" cy="116" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 176 146 Q 190 124 204 146 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="180" y="160" width="20" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <line x1="190" y1="176" x2="190.0" y2="185.0" stroke="#000000" stroke-width="2"/>
  <polygon points="196.0,185.0 184.0,185.0 190,196" fill="#000000"/>
  <text x="190" y="86" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">action</text>
  <circle cx="290" cy="116" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 276 146 Q 290 124 304 146 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="280" y="160" width="20" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <line x1="290" y1="176" x2="290.0" y2="185.0" stroke="#000000" stroke-width="2"/>
  <polygon points="296.0,185.0 284.0,185.0 290,196" fill="#000000"/>
  <text x="290" y="86" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">action</text>
  <circle cx="390" cy="116" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 376 146 Q 390 124 404 146 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="380" y="160" width="20" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <line x1="390" y1="176" x2="390.0" y2="185.0" stroke="#000000" stroke-width="2"/>
  <polygon points="396.0,185.0 384.0,185.0 390,196" fill="#000000"/>
  <text x="390" y="86" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">action</text>
  <circle cx="490" cy="116" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 476 146 Q 490 124 504 146 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="480" y="160" width="20" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <line x1="490" y1="176" x2="490.0" y2="185.0" stroke="#000000" stroke-width="2"/>
  <polygon points="496.0,185.0 484.0,185.0 490,196" fill="#000000"/>
  <text x="490" y="86" text-anchor="middle" font-size="9" fill="#565653" font-family="monospace">action</text>
  <rect x="560" y="96" width="110" height="60" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="615" y="118" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">answer</text>
  <rect x="567" y="132" width="16" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <rect x="586" y="132" width="16" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <rect x="605" y="132" width="16" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <rect x="624" y="132" width="16" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <rect x="643" y="132" width="16" height="14" rx="0" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="615" y="180" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">end:</text>
  <path d="M 632 176 l 6 6 l 11 -13" fill="none" stroke="#ed4937" stroke-width="3"/>
  <text x="360" y="250" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">Every action does its piece of the final step at once, so nobody pays for the whole step at the end.</text>
</svg>

## Examples

**Hxro's parimutuel (pool betting) markets.** A bet on "up" or "down" adds its amount to that side's total. When the round ends, the oracle names the winning side, and the losing pool goes to the winners. Each winner claims on their own: their share is their bet divided by the winning total. Bettors paid for the totals when they bet, and each winner pays for his own payout when he claims.

**Realms (SPL Governance)** lets token holders vote on proposals. Each vote updates the proposal's totals right on the spot, and the cost of that update is paid in the voting transaction. When voting ends, the program checks the totals instead of counting all the votes.

The same approach **DEXes** (e.g. Orca and Drift V2) utilizes in calculations of liquidity. Once maker (liquidity provider) adds or removes liquidity, they only update the metric stored in the two (or more) ticks of their range as they do not need other ticks. During the swap process taker uses only the ticks swap crosses. In this way liqudity is managed by the users which update it step-by-step.

## In code

Each action updates the answer in one step, so no final tally is ever needed.

```rust
// one vote bumps its candidate's count and updates the leader, nothing else
pub fn vote(ctx: Context<Vote>) -> Result<()> {
    let candidate = &mut ctx.accounts.candidate;
    let election = &mut ctx.accounts.election;
    candidate.votes += 1;
    if candidate.votes > election.leader_votes {
        election.leader = candidate.key();
        election.leader_votes = candidate.votes;
    }
    Ok(())
}
```
