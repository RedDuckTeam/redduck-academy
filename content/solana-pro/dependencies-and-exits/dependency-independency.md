---
title: Dependency Independency
type: lecture
order: 2
---

System resilience requires minimal dependencies, and for those that are difficult to avoid, explicit decoupling paths. With this approach, the protocol can achieve what we call ‘Dependency Independency’.

## Examples

**Zeebit on MagicBlock.** The casino needs instant moves, so it runs rounds on an ephemeral rollup (a temporary, fast layer-2 network built just for short-lived tasks). This is a real dependency because the rollup is a separate validator that can stop or fail.  But the player deposits into Zeebit's program on Solana, and the money stays there. Only the state of the current round is handed to the rollup. When the round ends, the result is written back to Solana and the payout happens there. The dependency lasts one round and never touches the funds, so the exit is the normal flow, not an emergency plan.

**Drift** keeps the oracle of every market as a setting: moving a market to another feed is an admin instruction, not a deploy. Drift already has a one win situation with this. Before FTX collapsed, Drift used Serum (the main orderbook on Solana). After the crash it became unsafe to use but because a Serum market was a config account that the admin could enable or disable Drift successfully moved to OpenBook (community fork of Serum).

## Anti-Examples

**UXD** kept its hedge on Mango Markets with no way to move it, and when Mango was hacked there was nothing left to do but close the product. A delta-neutral stablecoin makes sense with any deep enough perpetuals, so Mango was a part, and a part needs a way to be replaced.

**Serum's** upgrade key was held by FTX, so when FTX collapsed the only exit left was a fork.

**Drift** (in April 2026) lost far more because of its dependency on their Security Council. It was just a Squads multisig that needed 2 of 5 signers and there was no timelock. Attackers spent months gaining the trust from contributors and obtained approvals from two signers for transactions the signers did not understand. Drift lost $285m and later relaunched as Velocity.

The test is simple: would the product make sense without this dependency? If yes, the dependency is just a part of it, and parts can get replaced. A lending protocol makes sense with any price feed, so the feed is a part (you dont need to add Pyth oracles if you already utilize Raydium in other part of your protocol, just use TWAPs). If not, there is nothing to plan. Sometimes, protocols exist just because of their dependency, and this is okay. Aura exists only because Balancer does; if Balancer disappears, Aura loses nothing, it simply wouldn't be there in the first place without Balancer. It’s an EVM example, but the concept is the same for any chain and frankly, any product in any field.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:
#e0deda; font-family: system-ui, sans-serif;">
  <title>Dependencies and their exits</title>
  <desc>
    A table of six dependencies. Zeebit depends on an ephemeral rollup, would make sense without it, and leaves it in the normal flow because every game ends on Solana. Drift depends on an oracle feed and can switch it with an admin setting, without a deploy, which is fast but is also a path for an attacker who holds the admin. Drift depended on Serum, and moving to OpenBook took a program upgrade after the failure, because Serum&apos;s id was a constant in the code. UXD depended on Mango for its hedge, had no exit planned, and dropped that design after Mango was exploited. Serum depended on a key held by FTX, had no exit, and was forked by the community. Aura depends on Balancer and would not make sense without it, so there is nothing to plan.
  </desc>
  <rect x="20" y="20" width="680" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="
#ffffff" font-weight="bold">Dependencies and their exits</text>
  <rect x="30" y="70" width="660" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="40" y="92" font-size="11" fill="
#ffffff" font-weight="bold">protocol</text>
  <text x="130" y="92" font-size="11" fill="
#ffffff" font-weight="bold">depends on</text>
  <text x="335" y="84" text-anchor="middle" font-size="10" fill="
#ffffff" font-weight="bold">makes sense</text>
  <text x="335" y="97" text-anchor="middle" font-size="10" fill="
#ffffff" font-weight="bold">without it?</text>
  <text x="390" y="92" font-size="11" fill="
#ffffff" font-weight="bold">exit</text>
  <rect x="30" y="104" width="660" height="36" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="40" y="126" font-family="monospace" font-size="10" font-weight="bold">Zeebit</text>
  <text x="130" y="126" font-family="monospace" font-size="10">ephemeral rollup</text>
  <text x="335" y="126" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">yes</text>
  <text x="390" y="126" font-family="monospace" font-size="10" font-weight="bold">normal flow: each game ends on Solana</text>
  <rect x="30" y="140" width="660" height="36" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="40" y="162" font-family="monospace" font-size="10" font-weight="bold">Drift</text>
  <text x="130" y="162" font-family="monospace" font-size="10">oracle feed</text>
  <text x="335" y="162" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">yes</text>
  <text x="390" y="162" font-family="monospace" font-size="10" font-weight="bold">admin setting: fast, but also an attack path</text>
  <rect x="30" y="176" width="660" height="36" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="40" y="198" font-family="monospace" font-size="10" font-weight="bold">Drift</text>
  <text x="130" y="198" font-family="monospace" font-size="10">Serum</text>
  <text x="335" y="198" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">yes</text>
  <text x="390" y="198" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">upgrade after the failure: id in code</text>
  <rect x="30" y="212" width="660" height="36" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="40" y="234" font-family="monospace" font-size="10" font-weight="bold">UXD</text>
  <text x="130" y="234" font-family="monospace" font-size="10">Mango for its hedge</text>
  <text x="335" y="234" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">yes</text>
  <text x="390" y="234" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">none planned: the design was dropped</text>
  <rect x="30" y="248" width="660" height="36" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="40" y="270" font-family="monospace" font-size="10" font-weight="bold">Serum</text>
  <text x="130" y="270" font-family="monospace" font-size="10">key held by FTX</text>
  <text x="335" y="270" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">yes</text>
  <text x="390" y="270" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">none: the community forked it</text>
  <rect x="30" y="284" width="660" height="36" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="40" y="306" font-family="monospace" font-size="10" font-weight="bold">Aura</text>
  <text x="130" y="306" font-family="monospace" font-size="10">Balancer</text>
  <text x="335" y="306" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">no</text>
  <text x="390" y="306" font-family="monospace" font-size="10" font-weight="bold">nothing to plan</text>
  <line x1="120" y1="70" x2="120" y2="320" stroke="
#000000" stroke-width="1"/>
  <line x1="290" y1="70" x2="290" y2="320" stroke="
#000000" stroke-width="1"/>
  <line x1="380" y1="70" x2="380" y2="320" stroke="
#000000" stroke-width="1"/>
  <text x="360" y="354" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">Every row with a &quot;yes&quot; needs an exit that exists before it is needed.</text>
  <text x="360" y="370" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">The red rows had none, and the exit had to be built after the failure.</text>
</svg>

List every dependency of your protocol, including the oracle, every protocol it trades on, every layer it runs on, every bridge and the upgrade key. For each, write down such things: would the product make sense without it, what is the exit if it fails, who can trigger that exit, what can someone do if they gained control over the keys.
