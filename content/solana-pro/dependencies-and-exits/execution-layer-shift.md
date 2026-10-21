---
id: 1947563965
title: Execution Layer Shift
type: lecture
order: 1
---

Solana is already extremely fast, so block speed is not a reason for choosing L2 over L1.

Unless, of course, the idea is to build a real-time game like Counter-Strike, then it could be justified.

An L2 is just another network with its own operator, often one machine that orders the transactions (called Orderer or Sequencer). It has its own rules for when a transaction is final, usually weaker than Solana's. Because of such architecture, L2s are mostly always “faster” than their master L1 chains. Of course such pros come with some disadvantages: programs on L2 are not able to call programs on Solana directly, moving funds is asymmetrical (withdrawing from L2 is often slower than depositing, because users need to wait until the L2's state can be trusted on Solana), etc.

Instead, the choice of L2 over L1 is justified in case the goal is to build a protocol with less technical constraints than on L1 (for example - the program may need to reference more accounts, or users may need to execute transactions with more instructions than allowed on L1), and at the same time, the block security / finalization trade-off doesn't matter to the project much. If it does, the alternative is to think of possible ways to optimize the program and keep it on L1.

The usual decision protocols make is to split the computation: the part that hits the limit runs on L2, everything else stays on L1 (especially money).

## Examples

**Zeebit** is an on-chain casino. A spin has to feel instant, and a two-step random number on L1 does not. Speed was the only thing missing, so Zeebit did not leave L1. The player deposits into Zeebit's program on Solana, and the money stays there. For one round, only the state of that round is handed to an ephemeral rollup (MagicBlock), where moves are instant. When the round ends, the result is written back to Solana and the payout happens there.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:
#e0deda; font-family: system-ui, sans-serif;">
  <title>Only the game leaves Solana</title>
  <desc>
    Two lanes. The top lane is Solana, the bottom lane is an ephemeral rollup. On Solana, the player deposits into the casino&apos;s program, and the funds stay there for the whole flow. The game account is delegated to the rollup through the delegation program. On the rollup, the moves of the game happen instantly. When the game ends, its state is committed back to Solana and undelegated, and the payout happens on Solana from the funds that never left.
  </desc>
  <rect x="20" y="20" width="680" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="
#ffffff" font-weight="bold">Only the game leaves Solana</text>
  <rect x="40" y="72" width="640" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="72" width="110" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="95" y="90" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Solana</text>
  <rect x="60" y="118" width="130" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="125" y="138" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">1. deposit</text>
  <text x="125" y="154" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">funds stay here</text>
  <rect x="220" y="118" width="130" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="285" y="138" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">2. delegate</text>
  <text x="285" y="154" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">game account only</text>
  <rect x="370" y="118" width="130" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="435" y="138" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">4. commit</text>
  <text x="435" y="154" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">final game state</text>
  <rect x="530" y="118" width="130" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="595" y="138" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">5. payout</text>
  <text x="595" y="154" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">from the same funds</text>
  <line x1="190" y1="143" x2="212" y2="143" stroke="#000000" stroke-width="2"/>
  <polygon points="210,137 210,149 220,143" fill="#000000"/>
  <line x1="500" y1="143" x2="522" y2="143" stroke="#000000" stroke-width="2"/>
  <polygon points="520,137 520,149 530,143" fill="#000000"/>
  <rect x="40" y="232" width="640" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="232" width="150" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="115" y="250" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Ephemeral rollup</text>
  <rect x="250" y="272" width="220" height="44" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="290" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">3. the moves of the game</text>
  <text x="360" y="306" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">instant, no money here</text>
  <line x1="285" y1="168" x2="300" y2="264" stroke="#ed4937" stroke-width="2"/>
  <polygon points="294,262 306,260 302,272" fill="#ed4937"/>
  <line x1="420" y1="272" x2="433" y2="176" stroke="#ed4937" stroke-width="2"/>
  <polygon points="427,178 439,178 433,168" fill="#ed4937"/>
  <text x="360" y="364" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">The rollup holds one game for the length of one game. The money never</text>
  <text x="360" y="380" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">leaves Solana, so leaving the rollup is the normal end of every game.</text>
</svg>

**Zeta** went to an L2. Its cross-margin check touches every market a trader holds, and the limit on accounts per transaction capped how many that could be. That is the constraint case: it moved trading to its own L2 (Bullet), kept settlement and data on Solana, and accepted that a withdrawal to L1 takes longer than a trade. Zeebit moved one game at a time and kept the money where it was when Zeta moved the whole exchange and accepted a day-long exit.

**Helium** tried both ways. It had its own chain and moved onto Solana. A million devices fit as compressed NFTs, and rewards fit as per-device claims instead of daily payouts. What did not fit was reshaped, not moved (about a million hotspots became compressed NFTs, daily payouts became claims that each owner sends when they want the money). That is the default to try first, and a separate layer is what is left when reshaping fails.
