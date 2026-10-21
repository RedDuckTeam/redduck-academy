---
id: 1765466296
title: Outside World and Dependencies - Test
type: test
order: 4
---

<!-- q:28d4ed0147d9f644d50e3565 -->
A protocol values collateral by reading a DEX pool. Why does it read a time-weighted average instead of the current pool price?
 
- [x] One large swap can move the current price inside a single transaction and be swapped back right after  <!-- a:b5fa6f5c1b2a81e8e12d042a -->
- [ ] The current pool price is not stored on-chain  <!-- a:f006101f2ad8fefe3327f8d7 -->
- [ ] Reading the current price costs more compute than reading an average  <!-- a:f9d04be0a54671d52a6ca31a -->
- [ ] The current price is always older than the average  <!-- a:4af78be55f2fd25aabe723ac -->
<!-- q:6b754b1948187a05537552d1 -->
How does Realms know that a token owner has already voted on a proposal?
 
- [x] An account already exists at the PDA derived from the proposal and the voter's token owner record  <!-- a:ed8162b8b523409a02cae5eb -->
- [ ] The proposal keeps a list of voters and searches it on every vote  <!-- a:19abc9a9f4f7eb22764b6c44 -->
- [ ] The token owner record keeps a flag for every proposal it voted on  <!-- a:803bb8ff205ef507b8b8e54c -->
- [ ] An off-chain indexer tells the program who has voted  <!-- a:8ed8fefaf77cb8106aa7fa5b -->
<!-- q:e102aaf49d3fed5c9ac0f740 -->
The confidence band around a collateral price doubles, while the middle price stays the same. What happens to a user's position in a protocol that uses defensive computation?
 
- [x] It looks worse from both sides, so the user can borrow less and the liquidation line comes closer  <!-- a:0004d57b3e885e1b721f18b5 -->
- [ ] Nothing changes, because the middle price did not move  <!-- a:8f019902f2fdab8663fc4daf -->
- [ ] It looks better, because the debt is also less certain  <!-- a:0d4b9fe0ec1f07ad479d1e81 -->
- [ ] The position is liquidated at once  <!-- a:f8f15b005414bbebef5c1d4d -->
<!-- q:66c5f402168de2851e4022b0 -->
Kamino requires every price check for a borrow, but only a loaded, fresh and usable price for a liquidation. Why?
 
- [x] Refusing a liquidation is a risk too, because a position that cannot be liquidated keeps losing money for the protocol  <!-- a:1a41e63f823b7aef70ed53cc -->
- [ ] Liquidators are trusted more than borrowers, so they need fewer checks  <!-- a:efe55f557085deda1f3e8892 -->
- [ ] A liquidation does not use the oracle price at all  <!-- a:a9dcb504fa9013879d294cc5 -->
- [ ] Borrows happen less often, so they can afford more compute for checks  <!-- a:d1f5d6e6bad98aab1a9e174a -->
<!-- q:4b47d709884e35eca31cfac8 -->
Which reason justifies moving part of a Solana protocol to a separate execution layer?
 
- [x] A core action has to touch more accounts than one transaction can lock, and that number grows with the data  <!-- a:f7dff0954e70b6bab59a74a5 -->
- [ ] Solana's block time is too slow for a lending protocol  <!-- a:c13997bf0f01ff6f897c7af8 -->
- [ ] An L2 has stronger finality than Solana  <!-- a:03b855cba06f647600ac6eee -->
- [ ] Leaving an L2 is faster than entering it  <!-- a:75079f6e5d0ba3c522273431 -->
<!-- q:3df9f2ee241d431f2ab7891d -->
Zeebit runs its rounds on a MagicBlock ephemeral rollup. What keeps this dependency small? (Select all that apply.)
 
- [x] The players' funds stay on Solana for the whole round  <!-- a:7618e5e6722f7218652497c8 -->
- [x] The rollup holds only the state of one round, and the payout happens on Solana when the result is written back  <!-- a:2232e0d8388b302fbe7ad528 -->
- [ ] The rollup holds the casino's bankroll, so payouts are instant  <!-- a:c89de9428838616d8d541448 -->
- [ ] The rollup cannot stop, because it is a Solana program  <!-- a:356b17e93eea173d643f8d9a -->
<!-- q:3df0f45034a8351ae4d71ecd -->
Apply the test "would the product make sense without this dependency?". Which dependencies need an exit planned in advance? (Select all that apply.)
 
- [x] A lending protocol's price feed  <!-- a:3cbc2fe98d41ed41ce66317e -->
- [x] The only perpetuals venue a delta-neutral stablecoin uses for its hedge  <!-- a:9b98081d80b754e0653fc06d -->
- [x] The key that can upgrade the program  <!-- a:37a38c5c60292b28ff81879f -->
- [ ] Aura's dependency on Balancer  <!-- a:095b14efd0ac37140f71d8b5 -->
<!-- q:72826be8b64f458ddb71de0c -->
In April 2026, attackers took over Drift's admin through two of five signers of its Security Council multisig and drained about $285 million. Which change would have given users and monitors time to react?
 
- [x] A timelock on admin actions, so a change becomes visible before it takes effect  <!-- a:aeaa957a262031e3f117c7ee -->
- [ ] A larger confidence multiplier on every oracle price  <!-- a:211791cdfb8e6bda5efa8306 -->
- [ ] Moving the exchange to an L2  <!-- a:b5ae2164f95a9769e15b45b0 -->
- [ ] Making each market's oracle an admin setting  <!-- a:55c30d55a799935a434870de -->
