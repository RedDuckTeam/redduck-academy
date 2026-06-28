# DeFi - Test

_type: test_

---

## Questions

### Q1

ERC-2612 permit keeps a separate `nonces[owner]` mapping in the token contract. Every account already has an Ethereum transaction nonce maintained by the protocol. Why not reuse that?

a. The protocol's account nonce isn't readable from inside a contract.
b. Using the tx nonce would let permits be replayed
c. The tx nonce changes too frequently for permit use

### Q2

ERC-4626 exposes both `deposit(assets, receiver)` and `mint(shares, receiver)`. They ultimately do the same kind of thing, move assets in, mint shares out. Why have both?

a. `deposit` is the user-facing function and `mint` is reserved for the vault owner
b. The caller chooses which side they want to specify exactly. `deposit` is for "I have exactly 100 USDC to put in," `mint` is for "I want to end up with exactly 50 shares."
c. Backwards compatibility with older non-standard vaults
d. `mint` is deprecated. Only `deposit` is recommended for use

### Q3

Why is it safe for Aave to lend $100M of USDC to anyone, with zero collateral, via flash loans?

a. Aave requires KYC before flash loans over $10M
b. Aave maintains an insurance fund that covers defaults
c. Only whitelisted addresses with positive on-chain history can borrow
d. User can't steal them. They must return funds in the same transaction

### Q4

Uniswap V3 uses the formula `price(tick) = 1.0001 ^ tick` to map ticks to prices. The team could have chosen any base. Why 1.0001 specifically and not, say, 1.001 or 1.05 or even arithmetic spacing like `price = tick × 0.01`?

a. 1.0001 is the smallest base that fits in a uint16
b. Historical reasons: the team copied it from a Curve research paper
c. The tick step is 0.01% (one basis point). Basis points are how traders and finance generally reason about price changes
d. 1.0001 is required by the EVM's exponentiation precision

### Q5

ETH is at $3,500. You provide V3 liquidity in the range [$2,000, $3,000]. What tokens do you have to deposit?

a. Both ETH and USDC, in the ratio determined by the current price
b. Only USDC
c. Only ETH
d. The pool will reject this range because it's entirely below current

### Q6

Suppose two LPs deposit the same amount into the same Uniswap V3 ETH/USDC 0.3% pool with the exact same range `[$3,000, $4,000]`. Why are their positions still represented as separate NFTs rather than one fungible token?

a. Two LPs are never actually identical due to ordering
b. Each position has its own per-position fee accumulator.
c. Gas optimization
d. You can choose between these 2 types

### Q7

A developer's permit-based deposit works flawlessly in their Hardhat tests. They deploy to mainnet, and every permit call now fails with the contract's "InvalidSigner" revert. Their frontend builds the EIP-712 domain with `chainId: 31337` hardcoded (a value left over from local testing). What's the cleanest fix?

a. Update the hardcoded chainId to 1 for mainnet
b. Remove chainId from the domain entirely because dApp is multichain
c. Read the chainId dynamically from the user's wallet
