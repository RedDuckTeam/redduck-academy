---
id: 1687547781
title: Trust and execution - Test
type: test
order: 100
---

<!-- q:28d5fd33a5a0b5c0047326f7 -->
A deposit instruction checks that the user's token account has the same mint as the vault. The vault is passed as an unchecked account. What does the check prove?

- [ ] That the vault belongs to the program  <!-- a:31a73e9b77b130fb41d2f388 -->
- [x] Only that the two accounts the caller passed agree with each other  <!-- a:5775c15e37a54087f09c0e23 -->
- [ ] That the token account belongs to the user  <!-- a:6b37e32e42b331308b7b34d4 -->
- [ ] That the mint is a real SPL token  <!-- a:944c4b8cd9f269cbfd84260d -->

<!-- q:5637a9bbd1050bac7ed8100f -->
Which of these can be the root of trust for a chain of checks? (Select all that apply.)

- [x] A PDA of your program with fixed seeds  <!-- a:8533f9645067502df5e71279 -->
- [x] A hardcoded address compared against the account's key  <!-- a:0d11aca748e5c052a5594f38 -->
- [ ] An account whose data has the right layout and discriminator, at any address  <!-- a:6f596baae800bb205b7397d5 -->
- [ ] An account your program owns, when anyone can create such accounts through a permissionless instruction  <!-- a:efc292566eefacd03c0da032 -->

<!-- q:414974f30f4351917849efb5 -->
What was the missing check in the Wormhole exploit?

- [x] That the account in the instructions sysvar slot had the sysvar's known address  <!-- a:51d4cffef87040ee76761862 -->
- [ ] That the guardian signatures were in the right format  <!-- a:7aa7339419ba5c026d15e145 -->
- [ ] That the message came from the expected chain  <!-- a:cedfa1b84ee49dd08e0aaffa -->
- [ ] That the Secp256k1 program was deployed  <!-- a:6403dd9c517b1680dc100526 -->

<!-- q:62d064e2d1514c750c0ff2f0 -->
At Cashio, the collateral token account matched the bank, and the Saber pool accounts matched each other. Which check would have broken the caller's chain?

- [x] That the bank was one of the protocol's own, at an address derived from the protocol's PDA  <!-- a:0618e5659297c159d6e7e563 -->
- [ ] That the collateral token account's mint matched the bank  <!-- a:1978c157c5bc4519476902ae -->
- [ ] That the Saber pool accounts matched each other  <!-- a:6106140425094947868f03c3 -->
- [ ] That the user signed the transaction  <!-- a:918174d1824ebe36e3935992 -->

<!-- q:a10dc425f1e3661c891b467f -->
A launchpad wants to stop snipers in the first seconds after a launch. Which approach follows identity rejection?

- [ ] Reject trades from wallets on a list of known sniper addresses  <!-- a:ba19a27f3fbd2dab113dab1b -->
- [x] Charge a fee that starts high and decays with time since launch, the same for every wallet  <!-- a:d3512ccf5747e4bc6c7fa028 -->
- [ ] Allow only the team's wallet to trade in the first minute  <!-- a:3277e814902fc25ef83832ed -->
- [ ] Require every buyer to register before the launch  <!-- a:dc5caafcb7c4f5cdafa12b45 -->

<!-- q:e6b4ec298db9d67801ed3c9b -->
Meteora's rate limiter allowed one swap per transaction, yet a transaction could hold many `swap2` calls. What was the mistake?

- [x] The check looked for an instruction by its name instead of counting swaps on the pool  <!-- a:2269cb33e67216e0a596275c -->
- [ ] The check read the wrong sysvar  <!-- a:0fa10d0e56220fd5b70429d2 -->
- [ ] The fee was too low to deter snipers  <!-- a:ce34d6ca6c33dcf86fd1f0cd -->
- [ ] `swap2` used a different pool account  <!-- a:a3ea3eee4b37d9115918c8ee -->

<!-- q:1539c3e22fa2551300b93046 -->
Which of these are identity checks in the right place? (Select all that apply.)

- [x] The owner signs a withdrawal of their own tokens  <!-- a:7caf812229d47b61ae938460 -->
- [x] The admin signs a change to the protocol fee  <!-- a:855e08b1fb76d7af2930c72b -->
- [ ] Only the team's bot may call the instruction that distributes rewards  <!-- a:08656eff392d3ae1fe9c81f1 -->
- [ ] Only addresses on a list may bring a price update to the program  <!-- a:d56ad9367661c4ec5c8e9e90 -->

<!-- q:b6620668b10e247232c9d629 -->
What condition makes a background job safe to open to any executor?

- [x] The result does not depend on who sends the transaction  <!-- a:f0db18ad21a576f91bd5a683 -->
- [ ] The executor is paid at least the transaction fee  <!-- a:f5c1b66a53dee8de36b32a21 -->
- [ ] The executor is registered in the program  <!-- a:423b528b6113874cf3bedc84 -->
- [ ] The job runs at most once per slot  <!-- a:160e4edfd983d9ababd5618d -->

<!-- q:cb6b6e0e723135bacfdcae1b -->
Role inversion worked for Pyth's pull oracle and failed for Symmetry V2. What was the difference?

- [x] After the flip, the party that needed the action still decided when it happened for Pyth, and did not for Symmetry  <!-- a:9421e4f28ed24c7eb9975c6b -->
- [ ] Pyth paid its executors and Symmetry did not  <!-- a:5891a19bbae225c2b7df227c -->
- [ ] Pyth kept the role on-chain and Symmetry moved it off-chain  <!-- a:7c975a94a90c963f34bad3c8 -->
- [ ] Symmetry's flip cost more compute  <!-- a:61a08212e92723dcdca2ad0c -->

<!-- q:84d0299c03d47985f9e372cc -->
A staking pool's reward per staked token is 0.08. A staker with 200 tokens last saw 0.05. What happens when the staker claims?

- [x] 6 tokens are paid, and the staker's marker becomes 0.08  <!-- a:f0c8196974ef3a32e97ca51f -->
- [ ] 16 tokens are paid, and the staker's marker becomes 0.08  <!-- a:69424e3c61522dc91fe38d1a -->
- [ ] 6 tokens are paid, and the staker's marker becomes 0.03  <!-- a:51dc5618c29d6e17ba577020 -->
- [ ] 10 tokens are paid, and the staker's marker stays 0.05  <!-- a:c24c8a912014e59bc4dbc736 -->

<!-- q -->
In Fragmetric, when is a holder's reward balance updated?

- [x] In the transfer hook, at the moment the token is transferred, because the program already runs on that account
- [ ] Every hour, by a bot that walks through all holders
- [ ] When the protocol's admin triggers a distribution
- [ ] Never, the balance is computed off-chain

<!-- q:435e43e49aebdd1864b82c3a -->
Which of these can rely on lazy loading alone, with no paid executor? (Select all that apply.)

- [x] Paying a staker the rewards they are owed  <!-- a:ead6139fa69af23f5ae0628b -->
- [x] Charging a perpetual position its accrued funding  <!-- a:b0df5f238eee2e3344319f04 -->
- [ ] Liquidating a position as soon as its collateral falls below the threshold  <!-- a:87621e37a3dd9e5ce9ea6a85 -->
- [ ] Expiring an order at its deadline  <!-- a:bf0a314dc8fee15c8d4ee2c1 -->

<!-- q:4fb14a74d9f443fc7aecbad0 -->
In Squads, the members of a multisig change. How many proposal accounts does the program write?

- [x] None. It writes one index in the multisig account, and each proposal is compared with it when touched  <!-- a:dffc73a227272d9afd2144c2 -->
- [ ] Every open proposal  <!-- a:323b7babb7798c6a1dac4646 -->
- [ ] Only the approved proposals  <!-- a:68b83ac78fee2aa522c8d35c -->
- [ ] One per remaining member  <!-- a:3ffbd367964dbb25f9ddd4c9 -->

<!-- q -->
Pay-as-you-act stores the answer instead of the inputs. Which of these can be that answer? (Select all that apply.)

- [x] A count
- [x] A total
- [x] A maximum or a leader
- [ ] The full list of votes, to be counted at the end

<!-- q:d43c98a710f4c2ba3bfdaf4a -->
In Hxro's parimutuel market, what does a winner's payout depend on?

- [x] Their bet, the winning side's total and the pool after fees  <!-- a:80c30863e7fc5244ecc3c383 -->
- [ ] A walk over every bet in the round  <!-- a:e2f01b13f955ca60353b6639 -->
- [ ] The order in which the bets were placed  <!-- a:7cd1ba71c366243f6e22eef8 -->
- [ ] The number of winners, counted at settlement  <!-- a:8f775264fc06d3100f81d151 -->
