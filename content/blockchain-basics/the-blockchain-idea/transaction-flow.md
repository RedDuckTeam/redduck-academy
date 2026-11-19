---
id: 81
title: Transaction flow
type: lecture
order: 5
faq:
  - question: What happens between clicking send and my transaction landing on the chain?
    answer: >-
      Your wallet builds a request with the sender, the action, a fee, and a one-time value
      that blocks replays, then signs it with your private key. A node checks it and gossip
      carries it to the rest, into their pending pools. A block producer bundles it into a
      block and broadcasts that, every node revalidates, and the block becomes the new tip.
  - question: What is the mempool?
    answer: >-
      A node's local buffer of valid transactions waiting for a block. A block producer picks
      from it, usually highest fees first.
  - question: Do I have to trust the node I send my transaction to?
    answer: >-
      No. Every other node validates it again, and again inside the block.
  - question: Can a node change my transaction before passing it on?
    answer: >-
      No. Your signature covers the whole request, so flipping one bit makes the signature
      invalid and every node downstream rejects it.
---

> A transaction is a request to change the chain, signed by its sender. This lesson follows one transaction from the wallet to a block that every node has accepted, and shows where the signatures, blocks, consensus and nodes from the previous lessons come in.

Alice wants to send 1 coin to Bob and offers a fee of 0.001 coin. Her wallet holds her private key. The most recent block on the chain is block N. The same eight steps apply to any other transaction, such as deploying new code or calling code that is already on the chain, and every blockchain runs some version of them.

## Eight steps from the wallet to the chain

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Transaction flow: eight steps from signed request to new chain tip</title><desc>A vertical flowchart lists eight numbered steps of a blockchain transaction, connected top to bottom by arrows. It goes from the user constructing and signing a request, through wallet broadcast and network gossip, to a block producer assembling and broadcasting a new block, other nodes validating it, and the block becoming the new tip of the chain.</desc>
  <!-- Step 1 -->
  <rect x="30" y="20" width="660" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="50" font-size="14" fill="#000000" font-weight="bold">1.</text>
  <text x="100" y="42" font-size="13" fill="#000000" font-weight="bold">The user constructs the request</text>
  <text x="100" y="60" font-family="monospace" font-size="10" fill="#565653">describing what they want the chain to do</text>

<line x1="360" y1="70" x2="360" y2="85" stroke="#565653" stroke-width="2"/>
  <polygon points="355,80 360,90 365,80" fill="#565653"/>

<!-- Step 2 -->
  <rect x="30" y="90" width="660" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="120" font-size="14" fill="#000000" font-weight="bold">2.</text>
  <text x="100" y="112" font-size="13" fill="#000000" font-weight="bold">The wallet signs the request</text>
  <text x="100" y="130" font-family="monospace" font-size="10" fill="#565653">with the user's private key</text>

<line x1="360" y1="140" x2="360" y2="155" stroke="#565653" stroke-width="2"/>
  <polygon points="355,150 360,160 365,150" fill="#565653"/>

<!-- Step 3 -->
  <rect x="30" y="160" width="660" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="190" font-size="14" fill="#000000" font-weight="bold">3.</text>
  <text x="100" y="182" font-size="13" fill="#000000" font-weight="bold">The wallet broadcasts the signed request</text>
  <text x="100" y="200" font-family="monospace" font-size="10" fill="#565653">to a node it knows about</text>

<line x1="360" y1="210" x2="360" y2="225" stroke="#565653" stroke-width="2"/>
  <polygon points="355,220 360,230 365,220" fill="#565653"/>

<!-- Step 4 -->
  <rect x="30" y="230" width="660" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="260" font-size="14" fill="#000000" font-weight="bold">4.</text>
  <text x="100" y="252" font-size="13" fill="#000000" font-weight="bold">Gossip propagates it across the network</text>
  <text x="100" y="270" font-family="monospace" font-size="10" fill="#565653">every node holds it in a local buffer, having validated it</text>

<line x1="360" y1="280" x2="360" y2="295" stroke="#565653" stroke-width="2"/>
  <polygon points="355,290 360,300 365,290" fill="#565653"/>

<!-- Step 5 -->
  <rect x="30" y="300" width="660" height="50" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="60" y="330" font-size="14" fill="#ffffff" font-weight="bold">5.</text>
  <text x="100" y="322" font-size="13" fill="#ffffff" font-weight="bold">A block producer assembles a new block</text>
  <text x="100" y="340" font-family="monospace" font-size="10" fill="#ffffff">pulling pending requests from their buffer and structuring them</text>

<line x1="360" y1="350" x2="360" y2="365" stroke="#565653" stroke-width="2"/>
  <polygon points="355,360 360,370 365,360" fill="#565653"/>

<!-- Step 6 -->
  <rect x="30" y="370" width="660" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="400" font-size="14" fill="#000000" font-weight="bold">6.</text>
  <text x="100" y="392" font-size="13" fill="#000000" font-weight="bold">The producer broadcasts the new block</text>
  <text x="100" y="410" font-family="monospace" font-size="10" fill="#565653">via the same gossip network</text>

<line x1="360" y1="420" x2="360" y2="435" stroke="#565653" stroke-width="2"/>
  <polygon points="355,430 360,440 365,430" fill="#565653"/>

<!-- Step 7 -->
  <rect x="30" y="440" width="660" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="470" font-size="14" fill="#000000" font-weight="bold">7.</text>
  <text x="100" y="462" font-size="13" fill="#000000" font-weight="bold">Other nodes validate the block</text>
  <text x="100" y="480" font-family="monospace" font-size="10" fill="#565653">every signature, every rule, every consensus condition</text>

<line x1="360" y1="490" x2="360" y2="505" stroke="#565653" stroke-width="2"/>
  <polygon points="355,500 360,510 365,500" fill="#565653"/>

<!-- Step 8 -->
  <rect x="30" y="510" width="660" height="50" fill="#000000" stroke="#000000" stroke-width="2"/>
  <text x="60" y="540" font-size="14" fill="#ffffff" font-weight="bold">8.</text>
  <text x="100" y="532" font-size="13" fill="#ffffff" font-weight="bold">The block becomes the new tip of the chain</text>
  <text x="100" y="550" font-family="monospace" font-size="10" fill="#ffffff">every accepting node appends it. the change is now in the record</text>
</svg>

### Step 1: Alice constructs the transaction

Alice enters Bob's address and the amount. The wallet builds a structured piece of data containing Alice's address as the sender, the action (send 1 coin to Bob), the fee she offers (0.001 coin), and a value that makes the transaction one-time-use.

Without this value, anyone could send Alice's signed transfer to the network a second time. The signature would still be valid, so Bob would be paid twice. On Ethereum, for example, the value is a counter called a **nonce**. It goes up by one with every transaction Alice sends, and the network accepts a transaction only if its nonce is the next one for her address. The [account model lesson](/courses/development-on-ethereum/how-ethereum-works/the-account-model) of the Ethereum course covers the nonce in detail. The nonce inside a signature, from the digital signatures lesson, is a different number with the same name.

At this point the transaction exists only on Alice's device.

### Step 2: The wallet signs the transaction

The wallet computes a signature over the entire transaction, using Alice's private key, as described in the [digital signatures lesson](/courses/blockchain-basics/cryptography/digital-signatures-and-signature-recovery), and appends it to the transaction. The signature proves Alice approved the exact content of the transaction, and changing even one bit after this point will invalidate the signature.

### Step 3: The wallet broadcasts the signed transaction

The wallet sends the signed transaction to one node on the network. It might be a node Alice is running herself, but more likely it's a node operated by a service provider.

The receiving node checks that the signature is valid against Alice's public key, that the transaction follows the rules of the protocol, and that Alice has what the transaction spends, which is 1 coin for Bob plus the fee. If any of these checks fails, the node rejects the transaction and the flow stops here.

If the checks pass, the node adds the transaction to its **mempool**, a local buffer of valid transactions that are not in a block yet. The buffer is needed because transactions arrive all the time and a new block appears only periodically. Every node keeps its own mempool, so there is no single shared queue.

### Step 4: Gossip propagates the transaction across the network

The receiving node announces the transaction to its peers, and each peer validates it, adds it to its own mempool, and announces it further. This is the gossip protocol from the [nodes lesson](/courses/blockchain-basics/the-blockchain-idea/nodes-and-the-network), and within seconds most of the network holds the transaction. Alice does not have to trust the first node she sent the transaction to, because every other node checks the same things independently.

### Step 5: A block producer assembles a new block

Periodically, one participant earns the right under the consensus rules to propose the next block. This is the costly participation from the [consensus lesson](/courses/blockchain-basics/the-blockchain-idea/why-we-need-consensus): in proof-of-work systems it's whoever finishes the puzzle, in proof-of-stake systems it's whoever the protocol selects from the staked validators.

The producer fills the block with transactions from its own mempool. A block has limited room, and the producer earns more from a transaction that pays a higher fee, so it usually takes the highest fees first. Say the block has room for three transactions and the mempool holds six, with fees of 0.003, 0.002, 0.001, 0.0005, 0.0002 and 0.0001 coin. The producer takes the first three. Alice's 0.001 coin is the third, so her transfer goes into block N+1, and the other three transactions wait for a later block. Had Alice offered 0.0004 coin, the transaction paying 0.0005 coin would have taken her place.

The fee also protects the network. Every node has to check and store every transaction, so if sending one cost nothing, anyone could fill the blocks with junk. The [contracts and gas lesson](/courses/development-on-ethereum/how-ethereum-works/contracts-and-gas) of the Ethereum course shows how one network computes the fee.

The block has the structure from the [What is blockchain](/courses/blockchain-basics/the-blockchain-idea/what-is-blockchain) lesson: a header containing the hash of the previous block plus a Merkle root summarising all the transactions inside, then the transactions themselves underneath.

### Step 6: The producer broadcasts the new block

The producer sends the assembled block out via the same gossip mechanism that carried the transaction. Within seconds, most nodes in the network have the new block.

### Step 7: Other nodes validate the block

Every node receiving the block checks it independently. They verify the block's structure, re-verify every signature on every transaction in the block, and check that the block follows the consensus rules: the producer was entitled to propose, and the work or stake was properly demonstrated.

No single party is trusted to enforce the rules. If the producer included an invalid transaction or claimed a proposal slot it didn't earn, the rest of the network rejects the block and nothing changes.

### Step 8: The block becomes the new tip

If the block passes validation, every accepting node appends it to its copy of the chain. Alice's transfer is now part of block N+1: Alice has 1.001 coin less than before and Bob has 1 coin more. Either of them can query any node and see the change.

The change can still be rolled back if the network ends up agreeing on a different version of recent history. The probability is small, and shrinks further with each new block built on top. The [next lesson](/courses/blockchain-basics/the-blockchain-idea/forks-and-conflict-resolution) explains how that happens and how long to wait before treating a transfer as settled.
