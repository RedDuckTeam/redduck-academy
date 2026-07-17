---
id: 96
title: Bitcoin internals - Test
type: test
order: 8
---

This test checks whether you understood the reasoning behind Bitcoin's specific design choices. The wrong answers often treat one of those choices as arbitrary, when it actually follows from another constraint.

<!-- q:6a0cc045cec8eb3285202f65 -->
You have a single UTXO worth 10 BTC and want to send 3 BTC to a friend. What does your transaction look like?

- [ ] One 10 BTC input, one 10 BTC output to your friend. He then returns 7 BTC to you later within 6 blocks.  <!-- a:6a0cc04bcec8eb3285202f66 -->
- [ ] One 10 BTC input, one 10 BTC output to your friend. And then he returns you 7 BTC in the next transaction.  <!-- a:6a0cc04ecec8eb3285202f67 -->
- [x] One 10 BTC input, two outputs: 3 BTC to your friend and 7 BTC back to yourself.  <!-- a:6a0cc0eacec8eb3285202f68 -->
- [ ] One 3 BTC output to your friend. The rest stays in your address.  <!-- a:6a0cc10fcec8eb3285202f69 -->

<!-- q:6a0cc11fcec8eb3285202f6a -->
What is a Bitcoin miner doing while trying to produce a block?

- [ ] Solving complex mathematical equations the protocol asks them to solve  <!-- a:6a0cc141cec8eb3285202f6b -->
- [x] Hashing the block header with different nonces, looking for one below the target  <!-- a:6a0cc14dcec8eb3285202f6c -->
- [ ] Validating pending transactions. The first miner to finish produces the block.  <!-- a:6a0cc15fcec8eb3285202f6d -->
- [ ] Negotiating with other miners about which block should come next  <!-- a:6a0cc17bcec8eb3285202f6e -->

<!-- q:6a0cc192cec8eb3285202f6f -->
Global Bitcoin mining hashpower doubles overnight. What happens to block times in the short term, and what does the protocol do about it?

- [ ] Block times stay at ten minutes because the protocol immediately retargets  <!-- a:6a0cc197cec8eb3285202f70 -->
- [ ] Nothing changes because miners coordinate to keep block times stable  <!-- a:6a0cc1a3cec8eb3285202f71 -->
- [ ] Block times increase to about 20 minutes until the next retarget.  <!-- a:6a0cc1b2cec8eb3285202f72 -->
- [x] Block times drop to about 5 minutes until the next retarget  <!-- a:6a0cc1cfcec8eb3285202f73 -->

<!-- q:6a0cc20fcec8eb3285202f74 -->
Block rewards halve every 210,000 blocks and will eventually approach zero around the year 2140. Who will pay miners then?

- [x] Transaction fees paid by users will be the only source of miner revenue  <!-- a:6a0cc212cec8eb3285202f75 -->
- [ ] Bitcoin will stop producing new blocks once all bitcoins are mined.  <!-- a:6a0cc216cec8eb3285202f76 -->
- [ ] The chain will be hard-forked to increase supply and keep producing block rewards.  <!-- a:6a0cc259cec8eb3285202f77 -->
- [ ] A reserve fund built up from earlier years will continue paying them  <!-- a:6a0cc2bccec8eb3285202f78 -->

<!-- q:6a0cc3e2cec8eb3285202f79 -->
Two transactions are broadcast at the same time, both trying to spend the same UTXO. What does the network do?

- [ ] Both transactions are included in the next block, and the protocol picks a winner  <!-- a:6a0cc3f2cec8eb3285202f7a -->
- [x] Only one is included in a block. The other is rejected once the first confirms  <!-- a:6a0cc3fbcec8eb3285202f7b -->
- [ ] The network rejects both because of the conflict  <!-- a:6a0cc405cec8eb3285202f7c -->

<!-- q:6a0cc480cec8eb3285202f7e -->
Critics often say Bitcoin's massive electricity consumption is wasteful. From a protocol design perspective, why is this energy use considered essential?

- [x] The electricity cost is what makes attacking the network too expensive to be profitable  <!-- a:6a0cc486cec8eb3285202f7f -->
- [ ] Energy use is a side effect that the protocol would eliminate if it could  <!-- a:6a0cc48bcec8eb3285202f80 -->
- [ ] The protocol requires a minimum number of nodes to maintain the 10-minute block time.  <!-- a:6a0cc4a1cec8eb3285202f81 -->
- [ ] Mining hardware needs cooling to function at peak performance  <!-- a:6a0cc527cec8eb3285202f82 -->

<!-- q:6a0cc5c5cec8eb3285202f83 -->
Could Bitcoin be upgraded to handle 10,000 transactions per second on its main chain?

- [x] Yes, but it would compromise the properties Bitcoin was designed to protect  <!-- a:6a0cc5dccec8eb3285202f84 -->
- [ ] Yes, Bitcoin is moving in that direction right now.  <!-- a:6a0cc5e3cec8eb3285202f85 -->
- [ ] No, the cryptography Bitcoin uses cannot support that throughput  <!-- a:6a0cc607cec8eb3285202f86 -->
- [ ] Yes, the technology already exists but hasn't been deployed  <!-- a:6a0cc611cec8eb3285202f87 -->
