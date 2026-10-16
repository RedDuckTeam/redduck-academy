---
title: Trust and execution - Test
type: test
order: 100
---

<!-- q -->
A deposit instruction checks that the user's token account has the same mint as the vault. The vault is passed as an unchecked account. What does the check prove?

- [ ] That the vault belongs to the program
- [x] Only that the two accounts the caller passed agree with each other
- [ ] That the token account belongs to the user
- [ ] That the mint is a real SPL token

<!-- q -->
Which of these can be the root of trust for a chain of checks? (Select all that apply.)

- [x] A PDA of your program with fixed seeds
- [x] A hardcoded address compared against the account's key
- [ ] An account whose data has the right layout and discriminator, at any address
- [ ] An account your program owns, when anyone can create such accounts through a permissionless instruction

<!-- q -->
What was the missing check in the Wormhole exploit?

- [x] That the account in the instructions sysvar slot had the sysvar's known address
- [ ] That the guardian signatures were in the right format
- [ ] That the message came from the expected chain
- [ ] That the Secp256k1 program was deployed

<!-- q -->
At Cashio, the collateral token account matched the bank, and the Saber pool accounts matched each other. Which check would have broken the caller's chain?

- [x] That the bank was one of the protocol's own, at an address derived from the protocol's PDA
- [ ] That the collateral token account's mint matched the bank
- [ ] That the Saber pool accounts matched each other
- [ ] That the user signed the transaction

<!-- q -->
A launchpad wants to stop snipers in the first seconds after a launch. Which approach follows identity rejection?

- [ ] Reject trades from wallets on a list of known sniper addresses
- [x] Charge a fee that starts high and decays with time since launch, the same for every wallet
- [ ] Allow only the team's wallet to trade in the first minute
- [ ] Require every buyer to register before the launch

<!-- q -->
Meteora's rate limiter allowed one swap per transaction, yet a transaction could hold many `swap2` calls. What was the mistake?

- [x] The check looked for an instruction by its name instead of counting swaps on the pool
- [ ] The check read the wrong sysvar
- [ ] The fee was too low to deter snipers
- [ ] `swap2` used a different pool account

<!-- q -->
Which of these are identity checks in the right place? (Select all that apply.)

- [x] The owner signs a withdrawal of their own tokens
- [x] The admin signs a change to the protocol fee
- [ ] Only the team's bot may call the instruction that distributes rewards
- [ ] Only addresses on a list may bring a price update to the program

<!-- q -->
What condition makes a background job safe to open to any executor?

- [x] The result does not depend on who sends the transaction
- [ ] The executor is paid at least the transaction fee
- [ ] The executor is registered in the program
- [ ] The job runs at most once per slot

<!-- q -->
Role inversion worked for Pyth's pull oracle and failed for Symmetry V2. What was the difference?

- [x] After the flip, the party that needed the action still decided when it happened for Pyth, and did not for Symmetry
- [ ] Pyth paid its executors and Symmetry did not
- [ ] Pyth kept the role on-chain and Symmetry moved it off-chain
- [ ] Symmetry's flip cost more compute

<!-- q -->
A staking pool's reward per staked token is 0.08. A staker with 200 tokens last saw 0.05. What happens when the staker claims?

- [x] 6 tokens are paid, and the staker's marker becomes 0.08
- [ ] 16 tokens are paid, and the staker's marker becomes 0.08
- [ ] 6 tokens are paid, and the staker's marker becomes 0.03
- [ ] 10 tokens are paid, and the staker's marker stays 0.05

<!-- q -->
A staker deposits more tokens into a lazy loading pool. In what order should the program act?

- [x] Settle the rewards owed on the old stake, move the marker, then add the deposit
- [ ] Add the deposit, then settle rewards on the new stake
- [ ] Add the deposit and move the marker without settling
- [ ] Wait for the next reward to arrive, then settle

<!-- q -->
Which of these can rely on lazy loading alone, with no paid executor? (Select all that apply.)

- [x] Paying a staker the rewards they are owed
- [x] Charging a perpetual position its accrued funding
- [ ] Liquidating a position as soon as its collateral falls below the threshold
- [ ] Expiring an order at its deadline

<!-- q -->
In Squads, the members of a multisig change. How many proposal accounts does the program write?

- [x] None. It writes one index in the multisig account, and each proposal is compared with it when touched
- [ ] Every open proposal
- [ ] Only the approved proposals
- [ ] One per remaining member

<!-- q -->
Which answers can one action move by a single step both when an input is added and when it is removed? (Select all that apply.)

- [x] A total
- [x] A count
- [x] An average stored as a sum and a count
- [ ] A maximum

<!-- q -->
In Hxro's parimutuel market, what does a winner's payout depend on?

- [x] Their bet, the winning side's total and the pool after fees
- [ ] A walk over every bet in the round
- [ ] The order in which the bets were placed
- [ ] The number of winners, counted at settlement
