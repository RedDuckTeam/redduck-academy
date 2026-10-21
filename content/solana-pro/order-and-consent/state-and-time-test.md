---
id: 1740060718
title: State and time - Test
type: test
order: 100
---

<!-- q:b306ad7a4a5ffa355f4db61b -->
Orca Whirlpools keeps ticks in separate tick array accounts instead of one pool account. What does a swap gain from this?

- [x] It loads only the tick arrays the price can move through, and every other array stays out of the transaction  <!-- a:dd90b6b3c3ecef603da23fe5 -->
- [ ] It can move the price across the whole range in one transaction  <!-- a:449ae4354c1100dc197eb37e -->
- [ ] It no longer needs the pool account  <!-- a:563300a306f797004bc7bfe7 -->
- [ ] Swaps in the same pool can run in parallel  <!-- a:0e9b491c0406c116d6702598 -->

<!-- q:acdae2d96c1f4b2dcda4286d -->
In Bubblegum's compressed NFTs, what does the on-chain account store for a million NFTs?

- [x] One Merkle root plus the top levels of the tree, while the NFT data lives with indexers  <!-- a:2f9e589d93553947aa6f47f8 -->
- [ ] A hash of each NFT, one per leaf  <!-- a:3cde42717690dda6b00ed270 -->
- [ ] The full metadata of every NFT in a zero-copy array  <!-- a:0eeadf004468b98cd9873186 -->
- [ ] A list of the owners only  <!-- a:7a659740156a93ababac5d0f -->

<!-- q:474fa7ceb801542d53938f31 -->
Inserting into a sorted linked list is O(n) in general. Why is it O(1) on-chain in Monaco's order book?

- [x] The client finds the position off-chain and sends it, and the program checks only the two neighbors  <!-- a:8de3b4fab6cc9e32cbfe3309 -->
- [ ] The book is small enough to walk within the compute limit  <!-- a:77fb9a472e2dc3c7e788bd81 -->
- [ ] Orders are stored in price order, so the position is the price  <!-- a:e0634068efa702446c841366 -->
- [ ] The program caches the last insertion point  <!-- a:d74b222cbc844581e55d33bd -->

<!-- q:fccd48382e171149dc054ebf -->
An instruction loops over every position in a market, and anyone can open a position. What is the danger?

- [x] An attacker opens positions until the loop exceeds the compute limit, and the instruction fails for everyone  <!-- a:ae4c16e24cb425ecf05e2202 -->
- [ ] The loop reads stale data  <!-- a:8aeec1dc102623c04ef609eb -->
- [ ] The instruction becomes too cheap to deter spam  <!-- a:0151e8dc62144d6bf00a6f5a -->
- [ ] Positions opened by the attacker are counted twice  <!-- a:f39b4df19285bd202d7346db -->

<!-- q:40a7782e3996cb33db26db34 -->
Which on-chain costs are safe when anyone can add data? (Select all that apply.)

- [x] A Merkle path check that grows with the logarithm of the number of leaves  <!-- a:88f0c1c21e3008ea7404c910 -->
- [x] A check over a fixed number of cells that nobody can enlarge  <!-- a:58552006b172d47faa4c7e77 -->
- [ ] A loop over every entry a user has created  <!-- a:26f601323ab71fe7bd7a6f49 -->
- [ ] A linear scan to find the insertion point in a list  <!-- a:585405d4864e873b2c751845 -->

<!-- q:7e7090e442d4a66139d4a198 -->
A coin flip program reads the slot hash and pays the win in the same transaction as the bet. How does a user beat it?

- [x] They simulate the transaction and send it only when the simulation shows a win  <!-- a:feb5a5ea9c25c93a4800d0e4 -->
- [ ] They change the slot hash  <!-- a:774d960bbc26d28d0ad6f859 -->
- [ ] They send the bet twice  <!-- a:fd5e9657d33c97a367577a80 -->
- [ ] They front-run the oracle  <!-- a:7fc07907daa75c13f771a209 -->

<!-- q:2c62ccfd2309c3bd036084ce -->
In a commit-execution split, who must not decide whether the execute transaction is sent?

- [x] The person whose outcome it decides  <!-- a:8e646b9e4de65f7ae796e05d -->
- [ ] The oracle that produces the random value  <!-- a:35f39017eb49542562108285 -->
- [ ] The maker who fills the order  <!-- a:adea0c42585667f71d87a5a5 -->
- [ ] A keeper paid to send it  <!-- a:0e015752d6be2d2cb0f977d4 -->

<!-- q:92373b31d381c9dd4f77301c -->
Why does "sign an order once, let a server submit it when the price is right" fail on Solana?

- [x] A transaction signature is valid only for about a minute, so it is dead long before the price is reached  <!-- a:4a56527a025befa2c26c67ec -->
- [ ] Solana does not allow servers to submit transactions  <!-- a:33f2649694a5aae5bc60fd1a -->
- [ ] The order would need the user's private key on the server  <!-- a:212c60343c0644b683b7c6ca -->
- [ ] A signed transaction cannot contain a price  <!-- a:db9ad5bb01473d178e077db6 -->

<!-- q:6709a3ea86386de332ace92b -->
A stored action executes after its condition is met. Who signs for the user?

- [x] A PDA of the program, through invoke_signed  <!-- a:82bd0308174f68fc983e3466 -->
- [ ] The keeper who sent the execute transaction  <!-- a:7a5187a31a16dc307c81c08e -->
- [ ] The user, who must be online to co-sign  <!-- a:1e50a0d37ff21e8db6ba43d0 -->
- [ ] The target program  <!-- a:a1c8027876a40ff253a0adcc -->

<!-- q:58753ff978867d1fa820b59e -->
In Monaco, a taker's order matches a maker's order. What does the match transaction do with the maker's payout?

- [x] It marks the order as filled and records what is owed, and a later settlement with the maker's accounts pays it  <!-- a:ffff08505830a068118f51ab -->
- [ ] It transfers the tokens to the maker in the same transaction  <!-- a:e534b3e25177fdec0c8bfe78 -->
- [ ] It asks the maker to sign the payout  <!-- a:bf94bb0387733473026811c1 -->
- [ ] It queues the payout for the protocol's server  <!-- a:0b4456c604670c101bcdb58e -->

<!-- q:1b3965dd0469b23ee0e868e6 -->
A protocol records that a maker is owed 40 tokens but has not settled it yet. How should the program treat that amount?

- [x] As a claim that cannot be spent until it is settled  <!-- a:8e0727f4997a94c002def06a -->
- [ ] As part of the maker's balance, available for new orders  <!-- a:af9d79459e02c4219a74a00e -->
- [ ] As collateral for the maker's other positions  <!-- a:a4bac9e44d79ba8ce18ae02d -->
- [ ] As already transferred  <!-- a:b1c024cdf79e68a1b5fcedde -->

<!-- q:995953417359770419e9f796 -->
An oracle pays device rewards. Why should it sign the total earned so far rather than today's reward?

- [x] A total applied twice is the same total, and an old total is below the paid amount and pays nothing  <!-- a:b9950566efe6a5f70880ce51 -->
- [ ] Totals are smaller to sign  <!-- a:5142dee158dd1624af1937b8 -->
- [ ] Daily rewards would need a timestamp  <!-- a:8199905dbb368de859cd3798 -->
- [ ] The oracle cannot compute daily rewards  <!-- a:0c3e27de2888afd071ac3938 -->

<!-- q:56635c3e3b71bc547216c09f -->
In Squads, the signers change and the stale transaction index moves. What can still happen to an older proposal?

- [x] It can be cancelled, but not approved or executed  <!-- a:fdfb6b6f65bb78526ee8fd60 -->
- [ ] It can be approved by the new signers  <!-- a:2987369407b6e46199b460c1 -->
- [ ] It executes automatically  <!-- a:db4de6e459ddfda6c1583dd8 -->
- [ ] It is deleted  <!-- a:2d0a1a158f593b8fbb8f4b91 -->

<!-- q:2847f78c83680f1209bd263f -->
What test shows that a program's state is one-way?

- [x] Any two transactions, swapped, land on the same final state  <!-- a:ce1642352e0b6454fcf1fd18 -->
- [ ] Every transaction carries a nonce  <!-- a:12722ff7ef0edb260ccb0e78 -->
- [ ] The program stores the id of the last message  <!-- a:357ccb9908ed1f0c65eba791 -->
- [ ] No transaction can fail  <!-- a:8c1e466681e9bdf4f6aec2a3 -->

<!-- q:cb8944105874207ca4ee69f4 -->
A Jupiter swap shows an expected output of 150 USDC. What does the user actually sign?

- [x] The minimum output they accept, and the swap fails if the result drops below it  <!-- a:cf6bed8b5197bb9fe5dae2e7 -->
- [ ] The exact output of 150, and the swap fails if the result differs  <!-- a:063932811984f03a7f1f0c0b -->
- [ ] The expected price, which the program then enforces  <!-- a:d9d200564b37afe0b90e2671 -->
- [ ] Nothing about the output, since the price is decided at execution  <!-- a:f9ff4ac27957648dcb7d478a -->
