---
id: 175
title: DeFi - Test
type: test
order: 4
---

<!-- q:6a17646f6584424b7a16db53 -->
ERC-4626 exposes both `deposit(assets, receiver)` and `mint(shares, receiver)`. They ultimately do the same kind of thing, move assets in, mint shares out. Why have both?

- [ ] `deposit` is the user-facing function and `mint` is reserved for the vault owner  <!-- a:6a17648b6584424b7a16db54 -->
- [x] The caller chooses which side they want to specify exactly. `deposit` is for "I have exactly 100 USDC to put in," `mint` is for "I want to end up with exactly 50 shares."  <!-- a:6a17648e6584424b7a16db55 -->
- [ ] Backwards compatibility with older non-standard vaults  <!-- a:6a1764976584424b7a16db56 -->
- [ ] `mint` is deprecated. Only `deposit` is recommended for use  <!-- a:6a1764a56584424b7a16db57 -->

<!-- q:6a1764e46584424b7a16db58 -->
Why is it safe for Aave to lend $100M of USDC to anyone, with zero collateral, via flash loans?

- [ ] Aave requires KYC before flash loans over $10M  <!-- a:6a1765206584424b7a16db59 -->
- [ ] Aave maintains an insurance fund that covers defaults  <!-- a:6a1765236584424b7a16db5a -->
- [ ] Only whitelisted addresses with positive on-chain history can borrow  <!-- a:6a17652c6584424b7a16db5b -->
- [x] User can't steal them. They must return funds in the same transaction  <!-- a:6a1765396584424b7a16db5c -->

<!-- q:6a17695c6584424b7a16db64 -->
Uniswap V3 uses the formula `price(tick) = 1.0001 ^ tick` to map ticks to prices. The team could have chosen any base. Why 1.0001 specifically and not, say, 1.001 or 1.05 or even arithmetic spacing like `price = tick × 0.01`?

- [ ] 1.0001 is the smallest base that fits in a uint16  <!-- a:6a17697f6584424b7a16db65 -->
- [ ] Historical reasons: the team copied it from a Curve research paper  <!-- a:6a1769846584424b7a16db66 -->
- [x] The tick step is 0.01% (one basis point). Basis points are how traders and finance generally reason about price changes  <!-- a:6a17698f6584424b7a16db67 -->
- [ ] 1.0001 is required by the EVM's exponentiation precision  <!-- a:6a1769d06584424b7a16db68 -->

<!-- q:6a1769db6584424b7a16db69 -->
ETH is at $3,500. You provide V3 liquidity in the range [$2,000, $3,000]. What tokens do you have to deposit?

- [ ] Both ETH and USDC, in the ratio determined by the current price  <!-- a:6a1769ef6584424b7a16db6a -->
- [x] Only USDC  <!-- a:6a1769f66584424b7a16db6b -->
- [ ] Only ETH  <!-- a:6a1769fb6584424b7a16db6c -->
- [ ] The pool will reject this range because it's entirely below current  <!-- a:6a176a066584424b7a16db6d -->

<!-- q:6a176a6e6584424b7a16db6e -->
Suppose two LPs deposit the same amount into the same Uniswap V3 ETH/USDC 0.3% pool with the exact same range `[$3,000, $4,000]`. Why are their positions still represented as separate NFTs rather than one fungible token?

- [ ] Two LPs are never actually identical due to ordering  <!-- a:6a176a726584424b7a16db6f -->
- [x] Each position has its own per-position fee accumulator.  <!-- a:6a176a786584424b7a16db70 -->
- [ ] Gas optimization  <!-- a:6a176a946584424b7a16db71 -->
- [ ] You can choose between these 2 types  <!-- a:6a176a986584424b7a16db72 -->

<!-- q:6a176b2c6584424b7a16db73 -->
ERC-2612 permit keeps a separate `nonces[owner]` mapping in the token contract. Every account already has an Ethereum transaction nonce maintained by the protocol. Why not reuse that?

- [x] The protocol's account nonce isn't readable from inside a contract.  <!-- a:6a176b2e6584424b7a16db74 -->
- [ ] Using the tx nonce would let permits be replayed  <!-- a:6a176b326584424b7a16db75 -->
- [ ] The tx nonce changes too frequently for permit use  <!-- a:6a176b7e6584424b7a16db76 -->

<!-- q:6a176bb76584424b7a16db78 -->
A developer's permit-based deposit works flawlessly in their Hardhat tests. They deploy to mainnet, and every permit call now fails with the contract's "InvalidSigner" revert. Their frontend builds the EIP-712 domain with `chainId: 31337` hardcoded (a value left over from local testing). What's the cleanest fix?

- [ ] Update the hardcoded chainId to 1 for mainnet  <!-- a:6a176bc16584424b7a16db79 -->
- [ ] Remove chainId from the domain entirely because dApp is multichain  <!-- a:6a176bce6584424b7a16db7a -->
- [x] Read the chainId dynamically from the user's wallet  <!-- a:6a176bef6584424b7a16db7b -->
