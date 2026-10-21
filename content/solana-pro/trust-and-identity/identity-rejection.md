---
id: 1079051403
title: Identity rejection
type: lecture
order: 20
---

The ultimate most important goal of a program is to stay integral and produce the intended results, whether it's a DEX that produces swaps and needs to keep its liquidity and pools in full integrity, or any other example.

What isn't the ultimate goal is who, when, or why sends a transaction. This is a very peripheral question that shouldn't make an impact on anything most of the time.

We call this pattern **Identity Rejection**. That is, it is the practice of rejecting any dependency on identity, circumstances and reasons, and rather focusing on the "what", i.e. the action. "Is this transaction good for this protocol and its integrity?" is the question that should be asked, not "Is this a trustworthy address?" The one exception is ownership: the owner signs to move their tokens, the admin signs to change a fee. Nothing else should depend on who is calling.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Identity rejection</title><desc>Four different callers, a user, a bot, a server and an unknown one, all send transactions into the same gate. The gate ignores who they are, crossed out, and checks only what the transaction does to the state: a valid state passes, a broken state is rejected.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Identity rejection</text>
  <circle cx="70" cy="81" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 56 111 Q 70 89 84 111 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="100" y="97" text-anchor="start" font-size="10" fill="#565653" font-family="monospace">user</text>
  <line x1="140" y1="95" x2="240.7" y2="159.1" stroke="#000000" stroke-width="2"/>
  <polygon points="243.9,154.0 237.5,164.2 250,165" fill="#000000"/>
  <circle cx="70" cy="123" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 56 153 Q 70 131 84 153 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="100" y="139" text-anchor="start" font-size="10" fill="#565653" font-family="monospace">bot</text>
  <line x1="140" y1="137" x2="239.3" y2="162.3" stroke="#000000" stroke-width="2"/>
  <polygon points="240.8,156.5 237.9,168.1 250,165" fill="#000000"/>
  <circle cx="70" cy="165" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 56 195 Q 70 173 84 195 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="100" y="181" text-anchor="start" font-size="10" fill="#565653" font-family="monospace">server</text>
  <line x1="140" y1="179" x2="239.1" y2="166.4" stroke="#000000" stroke-width="2"/>
  <polygon points="238.3,160.4 239.8,172.3 250,165" fill="#000000"/>
  <circle cx="70" cy="207" r="8" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <path d="M 56 237 Q 70 215 84 237 Z" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="100" y="223" text-anchor="start" font-size="10" fill="#565653" font-family="monospace">?</text>
  <line x1="140" y1="221" x2="240.2" y2="170.0" stroke="#000000" stroke-width="2"/>
  <polygon points="237.5,164.6 242.9,175.3 250,165" fill="#000000"/>
  <rect x="250" y="120" width="180" height="90" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="340" y="148" text-anchor="middle" font-size="12" fill="#565653" font-family="monospace">who?</text>
  <line x1="373" y1="137" x2="387" y2="151" stroke="#ed4937" stroke-width="3"/>
  <line x1="373" y1="151" x2="387" y2="137" stroke="#ed4937" stroke-width="3"/>
  <text x="340" y="185" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">what does it do?</text>
  <line x1="430" y1="150" x2="509.9" y2="114.5" stroke="#000000" stroke-width="2"/>
  <polygon points="507.5,109.0 512.4,120.0 520,110" fill="#000000"/>
  <rect x="520" y="92" width="140" height="36" rx="0" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="115" text-anchor="middle" font-size="10" fill="#000000" font-family="monospace">state is correct</text>
  <path d="M 667 110 l 6 6 l 11 -13" fill="none" stroke="#ed4937" stroke-width="3"/>
  <line x1="430" y1="180" x2="509.9" y2="215.5" stroke="#000000" stroke-width="2"/>
  <polygon points="512.4,210.0 507.5,221.0 520,220" fill="#000000"/>
  <rect x="520" y="202" width="140" height="36" rx="0" fill="#e0deda" stroke="#000000" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="590" y="225" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">state is broken</text>
  <line x1="668" y1="213" x2="682" y2="227" stroke="#ed4937" stroke-width="3"/>
  <line x1="668" y1="227" x2="682" y2="213" stroke="#ed4937" stroke-width="3"/>
  <text x="360" y="262" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">Anyone may call. The program checks the action and the state it leaves, not the address.</text>
</svg>

## Examples

**Protocol architecture.** **[Untrusted executor](/courses/solana-pro/permissionless-execution/untrusted-executor)** is a subset of this pattern: if the result of an instruction is the same no matter who calls it, anyone can call it. In Helium, anyone can send the claim for any device, because the reward always goes to the device owner's account, and the caller gets nothing but the right to pay the fee. In Monaco, a match only marks a maker's order as filled, and anyone can call the instruction that pays the maker out, since the payout goes to the maker whoever sends it. In governance programs such as Realms, anyone can execute a proposal once the vote has passed, because the instructions are already stored in the proposal and the governance PDA signs them. Pyth accepts a price update from any wallet: the program checks the signature of the publisher and the age of the update, not who brought it on-chain.

**Protocol security.** Sniper bot protections are designed with this principle.

* A **bad** solution would be to block all wallet addresses: this wouldn't last, as one address can be replaced with another one fairly simply, and you would still face the same problem.
* The **good** solution would be to do something that **doesn't depend on the identity** but rather prevents the bad action itself. Meteora and Heaven use a launch tax instead. Meteora's fee scheduler starts as high as 99% and drops over the first seconds or minutes of the launch, and its rate limiter adds a fee that grows with the size of a single purchase. Heaven's sniper tax goes down over the first six seconds. A sniper who buys at a 99% fee keeps 1% of what they paid for and cannot sell at a profit. The time since launch and trade size stay true no matter which address is doing it. This is the "what", i.e. the focus on the action, not the identity. The fee has a downside: an early buyer who is not a bot pays it too.

**Meteora's Dynamic Bonding Curve** made a limitation of one swap per transaction, so that a sniper couldn't split a big buy into many small ones where each would stay under the rate limiter's fee. But the rule only checked whether one specific instruction, namely swap, was called, instead of how many swaps actually happened on the pool, which should've been the real invariant. 

The second instruction doing the identical job, namely swap2, was shipped later but was never added to that check, and the rate limiter missed it. So a transaction could contain one swap and fifteen swap2 calls, and the check would still see one swap. A Code4rena audit in 2025 found up to sixteen swaps running inside a single transaction, the exact outcome the limiter was built to prevent, before anyone could lose money on it. 

From the engineering rationality perspective, it's reasonable to simply check for swap and swap2 instructions in a hard-coded way, because it's extremely simple and makes the code very readable. 

However it would be possible to perform checks that count every instruction that writes to the pool, whatever the name of that instruction is, without much added difficulty. 

That would prevent issues with the checking function missing instructions. With that approach, it would be your typical 'identity rejection' pattern used on a real use-case.
