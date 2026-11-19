---
id: 97
title: What you know now
type: lecture
order: 5
faq:
  - question: After finishing the blockchain basics course, what should I be able to do?
    answer: >-
      Explain what makes SHA-256 a cryptographic hash function, how a Merkle tree commits to
      thousands of items in 32 bytes, and how signatures and seed-phrase wallets work.
      Describe consensus as agreeing on transaction ordering across untrusted nodes and what
      Bitcoin gave up to get it. Place any chain on the trilemma and read its design as a set
      of trade-offs.
  - question: Should I learn Solidity or Solana development after the basics course?
    answer: >-
      Either, both, or neither. Solidity means writing the contracts that run on Ethereum and
      the chains that copied its design. Solana development means writing Rust programs
      against a different account model and execution environment.
---

You reached the end of Blockchain basics. Now you know the parts a blockchain is built from, the constraint behind each of them, and what each one costs.

One Bitcoin payment uses all of them. Say Alice pays Bob 0.3 BTC:

- Alice's wallet derived her private key from a seed phrase. She signs the transaction with that key, and every node checks the signature with her public key, without needing the private one. Those are **[mnemonic phrases](/courses/blockchain-basics/cryptography/mnemonic-phrases-and-how-a-wallet-gets-created)** and **[digital signatures](/courses/blockchain-basics/cryptography/digital-signatures-and-signature-recovery)**.
- The transaction destroys her 1.0 BTC coin and creates two new ones, 0.3 BTC for Bob and the change for Alice. No balance is stored anywhere, which is the **[UTXO model](/courses/blockchain-basics/bitcoin/the-utxo-model)**.
- A miner puts the transaction into a block. The block header holds a **[Merkle root](/courses/blockchain-basics/cryptography/merkle-trees)** that commits to every transaction in the block, and the **[hash](/courses/blockchain-basics/cryptography/hashing)** of the previous block, so changing the payment later would break every block after it.
- To add the block, the miner has to find a nonce that puts the header's hash below the target. That work costs electricity no matter how many identities an attacker creates, which is how strangers reach **[consensus](/courses/blockchain-basics/the-blockchain-idea/why-we-need-consensus)** through **[proof of work](/courses/blockchain-basics/bitcoin/mining)**.
- Bob waits about ten minutes for the block, and about an hour if the amount is large. The ten minutes are part of **[what Bitcoin gave up](/courses/blockchain-basics/bitcoin/what-bitcoin-gave-up-and-what-it-gained)** so that each block reaches the whole network and anyone can verify the chain on consumer hardware. The hour is there because every extra block makes the payment more expensive to reverse.

None of these parts is there for its own sake. Each one answers a constraint that appears once there is no operator to trust.

## What to do with it

Pick a chain this course only mentioned or did not cover, for example Bitcoin Cash from the [forks lesson](/courses/blockchain-basics/bitcoin/bitcoin-specific-forks), and answer four questions about it:

- Who is allowed to run a node and add blocks?
- What does taking part in consensus cost: work, stake, or an operator's permission?
- What limits its throughput, and can a hobbyist run a full node on a laptop?
- What did its designers give up, and what did they get for it?

The lessons on [public and private chains](/courses/blockchain-basics/beyond-bitcoin/public-and-private-chains) and [the trilemma](/courses/blockchain-basics/beyond-bitcoin/the-blockchain-trilemma) show how these questions are answered for the chains you already know.

After that, there are two tracks to continue with. The [Solidity track](/courses/development-on-ethereum/welcome-to-ethereum/what-ethereum-course-is-about) teaches you to write the contracts that run on Ethereum and the chains that copied its design. The [Solana track](/courses/development-on-solana/welcome-to-solana/what-the-solana-course-is-about) teaches you to write programs in Rust against a different account model and execution environment. You can take either, both, or neither, and use what you learned here to follow the field on your own.
