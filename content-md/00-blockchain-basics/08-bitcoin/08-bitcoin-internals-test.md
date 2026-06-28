# Bitcoin internals - Test

_type: test_

This test checks whether you understood the reasoning behind Bitcoin's specific design choices. The wrong answers often treat one of those choices as arbitrary, when it actually follows from another constraint.

---

## Questions

### Q1

You have a single UTXO worth 10 BTC and want to send 3 BTC to a friend. What does your transaction look like?

a. One 10 BTC input, one 10 BTC output to your friend. He then returns 7 BTC to you later within 6 blocks.
b. One 10 BTC input, one 10 BTC output to your friend. And then he returns you 7 BTC in the next transaction.
c. One 10 BTC input, two outputs: 3 BTC to your friend and 7 BTC back to yourself.
d. One 3 BTC output to your friend. The rest stays in your address.

### Q2

What is a Bitcoin miner doing while trying to produce a block?

a. Solving complex mathematical equations the protocol asks them to solve
b. Hashing the block header with different nonces, looking for one below the target
c. Validating pending transactions. The first miner to finish produces the block.
d. Negotiating with other miners about which block should come next

### Q3

Global Bitcoin mining hashpower doubles overnight. What happens to block times in the short term, and what does the protocol do about it?

a. Block times stay at ten minutes because the protocol immediately retargets
b. Nothing changes because miners coordinate to keep block times stable
c. Block times increase to about 20 minutes until the next retarget.
d. Block times drop to about 5 minutes until the next retarget

### Q4

Block rewards halve every 210,000 blocks and will eventually approach zero around the year 2140. Who will pay miners then?

a. Transaction fees paid by users will be the only source of miner revenue
b. Bitcoin will stop producing new blocks once all bitcoins are mined.
c. The chain will be hard-forked to increase supply and keep producing block rewards.
d. A reserve fund built up from earlier years will continue paying them

### Q5

Two transactions are broadcast at the same time, both trying to spend the same UTXO. What does the network do?

a. Both transactions are included in the next block, and the protocol picks a winner
b. Only one is included in a block. The other is rejected once the first confirms
c. The network rejects both because of the conflict

### Q6

Critics often say Bitcoin's massive electricity consumption is wasteful. From a protocol design perspective, why is this energy use considered essential?

a. The electricity cost is what makes attacking the network too expensive to be profitable
b. Energy use is a side effect that the protocol would eliminate if it could
c. The protocol requires a minimum number of nodes to maintain the 10-minute block time.
d. Mining hardware needs cooling to function at peak performance

### Q7

Could Bitcoin be upgraded to handle 10,000 transactions per second on its main chain?

a. Yes, but it would compromise the properties Bitcoin was designed to protect
b. Yes, Bitcoin is moving in that direction right now.
c. No, the cryptography Bitcoin uses cannot support that throughput
d. Yes, the technology already exists but hasn't been deployed
