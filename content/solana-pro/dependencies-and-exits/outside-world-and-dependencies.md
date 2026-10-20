---
title: Outside World and Dependencies - Test
type: test
order: 4
---

<!-- q -->
A protocol values collateral by reading a DEX pool. Why does it read a time-weighted average instead of the current pool price?
 
- [x] One large swap can move the current price inside a single transaction and be swapped back right after
- [ ] The current pool price is not stored on-chain
- [ ] Reading the current price costs more compute than reading an average
- [ ] The current price is always older than the average
<!-- q -->
How does Realms know that a token owner has already voted on a proposal?
 
- [x] An account already exists at the PDA derived from the proposal and the voter's token owner record
- [ ] The proposal keeps a list of voters and searches it on every vote
- [ ] The token owner record keeps a flag for every proposal it voted on
- [ ] An off-chain indexer tells the program who has voted
<!-- q -->
The confidence band around a collateral price doubles, while the middle price stays the same. What happens to a user's position in a protocol that uses defensive computation?
 
- [x] It looks worse from both sides, so the user can borrow less and the liquidation line comes closer
- [ ] Nothing changes, because the middle price did not move
- [ ] It looks better, because the debt is also less certain
- [ ] The position is liquidated at once
<!-- q -->
Kamino requires every price check for a borrow, but only a loaded, fresh and usable price for a liquidation. Why?
 
- [x] Refusing a liquidation is a risk too, because a position that cannot be liquidated keeps losing money for the protocol
- [ ] Liquidators are trusted more than borrowers, so they need fewer checks
- [ ] A liquidation does not use the oracle price at all
- [ ] Borrows happen less often, so they can afford more compute for checks
<!-- q -->
Which reason justifies moving part of a Solana protocol to a separate execution layer?
 
- [x] A core action has to touch more accounts than one transaction can lock, and that number grows with the data
- [ ] Solana's block time is too slow for a lending protocol
- [ ] An L2 has stronger finality than Solana
- [ ] Leaving an L2 is faster than entering it
<!-- q -->
Zeebit runs its rounds on a MagicBlock ephemeral rollup. What keeps this dependency small? (Select all that apply.)
 
- [x] The players' funds stay on Solana for the whole round
- [x] The rollup holds only the state of one round, and the payout happens on Solana when the result is written back
- [ ] The rollup holds the casino's bankroll, so payouts are instant
- [ ] The rollup cannot stop, because it is a Solana program
<!-- q -->
Apply the test "would the product make sense without this dependency?". Which dependencies need an exit planned in advance? (Select all that apply.)
 
- [x] A lending protocol's price feed
- [x] The only perpetuals venue a delta-neutral stablecoin uses for its hedge
- [x] The key that can upgrade the program
- [ ] Aura's dependency on Balancer
<!-- q -->
In April 2026, attackers took over Drift's admin through two of five signers of its Security Council multisig and drained about $285 million. Which change would have given users and monitors time to react?
 
- [x] A timelock on admin actions, so a change becomes visible before it takes effect
- [ ] A larger confidence multiplier on every oracle price
- [ ] Moving the exchange to an L2
- [ ] Making each market's oracle an admin setting
