---
title: State and time - Test
type: test
order: 100
---

<!-- q -->
Orca Whirlpools keeps ticks in separate tick array accounts instead of one pool account. What does a swap gain from this?

- [x] It loads only the tick arrays the price can move through, and every other array stays out of the transaction
- [ ] It can move the price across the whole range in one transaction
- [ ] It no longer needs the pool account
- [ ] Swaps in the same pool can run in parallel

<!-- q -->
In Bubblegum's compressed NFTs, what does the on-chain account store for a million NFTs?

- [x] One Merkle root plus the top levels of the tree, while the NFT data lives with indexers
- [ ] A hash of each NFT, one per leaf
- [ ] The full metadata of every NFT in a zero-copy array
- [ ] A list of the owners only

<!-- q -->
Inserting into a sorted linked list is O(n) in general. Why is it O(1) on-chain in Monaco's order book?

- [x] The client finds the position off-chain and sends it, and the program checks only the two neighbors
- [ ] The book is small enough to walk within the compute limit
- [ ] Orders are stored in price order, so the position is the price
- [ ] The program caches the last insertion point

<!-- q -->
An instruction loops over every position in a market, and anyone can open a position. What is the danger?

- [x] An attacker opens positions until the loop exceeds the compute limit, and the instruction fails for everyone
- [ ] The loop reads stale data
- [ ] The instruction becomes too cheap to deter spam
- [ ] Positions opened by the attacker are counted twice

<!-- q -->
Which on-chain costs are safe when anyone can add data? (Select all that apply.)

- [x] A Merkle path check that grows with the logarithm of the number of leaves
- [x] A check over a fixed number of cells that nobody can enlarge
- [ ] A loop over every entry a user has created
- [ ] A linear scan to find the insertion point in a list

<!-- q -->
A coin flip program reads the slot hash and pays the win in the same transaction as the bet. How does a user beat it?

- [x] They simulate the transaction and send it only when the simulation shows a win
- [ ] They change the slot hash
- [ ] They send the bet twice
- [ ] They front-run the oracle

<!-- q -->
In a commit-execution split, who must not decide whether the execute transaction is sent?

- [x] The person whose outcome it decides
- [ ] The oracle that produces the random value
- [ ] The maker who fills the order
- [ ] A keeper paid to send it

<!-- q -->
Why does "sign an order once, let a server submit it when the price is right" fail on Solana?

- [x] The transaction's recent blockhash expires in about a minute, and the signature dies with it
- [ ] Solana does not allow servers to submit transactions
- [ ] The order would need the user's private key on the server
- [ ] A signed transaction cannot contain a price

<!-- q -->
A stored action executes after its condition is met. Who signs for the user?

- [x] A PDA of the program, through invoke_signed
- [ ] The keeper who sent the execute transaction
- [ ] The user, who must be online to co-sign
- [ ] The target program

<!-- q -->
In Monaco, a taker's order matches a maker's order. What does the match transaction do with the maker's payout?

- [x] It marks the order as filled and records what is owed, and a later settlement with the maker's accounts pays it
- [ ] It transfers the tokens to the maker in the same transaction
- [ ] It asks the maker to sign the payout
- [ ] It queues the payout for the protocol's server

<!-- q -->
A protocol records that a maker is owed 40 tokens but has not settled it yet. How should the program treat that amount?

- [x] As a claim that cannot be spent until it is settled
- [ ] As part of the maker's balance, available for new orders
- [ ] As collateral for the maker's other positions
- [ ] As already transferred

<!-- q -->
An oracle pays device rewards. Why should it sign the total earned so far rather than today's reward?

- [x] A total applied twice is the same total, and an old total is below the paid amount and pays nothing
- [ ] Totals are smaller to sign
- [ ] Daily rewards would need a timestamp
- [ ] The oracle cannot compute daily rewards

<!-- q -->
In Squads, the signers change and the stale transaction index moves. What can still happen to an older proposal?

- [x] It can be cancelled, but not approved or executed
- [ ] It can be approved by the new signers
- [ ] It executes automatically
- [ ] It is deleted

<!-- q -->
What test shows that a program's state is one-way?

- [x] Any two transactions, swapped, land on the same final state
- [ ] Every transaction carries a nonce
- [ ] The program stores the id of the last message
- [ ] No transaction can fail

<!-- q -->
A Jupiter swap shows an expected output of 150 USDC. What does the user actually sign?

- [x] The minimum output they accept, and the swap fails if the result drops below it
- [ ] The exact output of 150, and the swap fails if the result differs
- [ ] The expected price, which the program then enforces
- [ ] Nothing about the output, since the price is decided at execution
