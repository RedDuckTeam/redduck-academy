---
title: Identity rejection
type: lecture
order: 20
---

The ultimate most important goal of a program is to stay integral and produce the intended results, whether it's a DEX that produces swaps and needs to keep its liquidity and pools in full integrity, or any other example.

What isn't the ultimate goal is who, when, or why sends a transaction. This is a very peripheral question that shouldn't make an impact on anything most of the time.

We call this pattern **Identity Rejection**. That is, it is the practice of rejecting any dependency on identity, circumstances and reasons, and rather focusing on the "what", i.e. the action. "Is this transaction good for this protocol and its integrity?" is the question that should be asked, not "Is this a trustworthy address?" The one exception is ownership: the owner signs to move their tokens, the admin signs to change a fee. Nothing else should depend on who is calling.

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
