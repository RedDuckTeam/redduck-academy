---
id: 81
title: Transaction flow
type: lecture
faq:
  - question: What happens step by step when I send a blockchain transaction?
    answer: Your wallet builds a request describing the action, a fee, and a
      one-time-use value, then signs it with your private key and sends it to
      one node. That node checks it and gossips it across the network into a
      pool of pending requests. Later a block producer bundles it into a block
      and broadcasts it, every node re-validates the block, and once accepted
      the block becomes the new tip of the chain and your change is recorded.
  - question: What is the mempool?
    answer: When a node accepts a valid transaction that hasn't been confirmed yet,
      it holds it in a local buffer of pending requests called the mempool.
      Gossip spreads the transaction so most nodes keep it in their own
      mempools. When a block producer earns the right to make the next block, it
      picks transactions out of this buffer, usually favoring the ones offering
      the highest fees.
  - question: Do I have to trust the node I first send my transaction to?
    answer: No. The first node does check your transaction, but as it spreads
      through the network every other node independently re-validates it, and
      every node checks it yet again when it arrives inside a block. Because the
      same validation is repeated everywhere, no single node has to be trusted
      for the system to be safe.
  - question: Why does signing a transaction stop anyone from tampering with it?
    answer: Your wallet computes a signature over the entire request using your
      private key. That signature mathematically proves you approved the exact
      contents, and changing even one bit of the request afterward makes the
      signature invalid. So any node or relay that altered your transaction
      would have it rejected by everyone downstream.
---

> By now you have all the parts. Cryptographic primitives that let identities exist and signatures bind authorship to messages. A hash-linked block structure that makes the past tamper-evident. A consensus mechanism that lets strangers agree without an operator. A network of nodes that hold copies, validate everything, and gossip new information to each other within seconds. None of these pieces is a blockchain by itself. This lesson takes the pieces and shows them assembling, in real time, into one operation: a single change to the chain, from the moment a user clicks something in their wallet to the moment that change is part of the permanent record. Every term used in this lesson is something you already understand. The lesson is where they snap together.

## The setup

Imagine a specific event. A user wants to make a change to the chain. The exact nature of the change doesn't matter for this lesson, because the flow is the same regardless. It could be a value transfer, a deployment of new code, an interaction with code already on the chain, anything.

The user has a wallet. The wallet holds the user's private key. The wallet also has access to one or more nodes on the network, either nodes the user is running themselves or nodes operated by a service provider. The chain is currently sitting at some height, with the most recent block being block N. The user is about to create the request that, eventually, will be included in block N+1 or later.

Here is what happens, in order.

## The eight steps

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

Now walk through each step with the components you already know.

### Step 1: The user constructs the request

In the user's wallet, they describe what they want to do. Send some value. Call some code. Whatever it is. The wallet builds a structured piece of data containing the user's identifier as the sender, the action being requested, a fee the user is offering to pay, and an anti-replay value that makes the request one-time-use. This structured data is the request, and at this point it exists only on the user's device.

No cryptography has happened yet. No network communication has happened yet. The request is just a draft.

### Step 2: The wallet signs the request

The wallet computes a signature over the entire request, using the user's private key. This is the same signing operation from the cryptography module. The signature is appended to the request.

Two things matter about this step. The signature mathematically proves the user approved the exact content of the request, and changing even one bit of the request after this point will invalidate the signature. From now on, the request is tamper-evident in the same sense the chain itself is, but at the level of a single message rather than a whole history.

### Step 3: The wallet broadcasts the signed request

The wallet sends the signed request to one node on the network. It might be a node the user is running themselves. More likely it's a node operated by a service provider, accessed through an API the wallet was configured to use.

The receiving node performs a basic check. Is the signature valid against the sender's public key? Does the request follow the rules of the protocol? Does the sender have what they need to make this change happen? If any of these checks fails, the node rejects the request and the flow stops here.

If the checks pass, the node adds the request to its local buffer of pending requests, sometimes called the **mempool**, and the flow continues.

### Step 4: Gossip propagates the request across the network

The receiving node announces the new request to its peers. Each peer that doesn't already have it asks for it, validates it themselves, and adds it to their own buffer. They then announce to *their* peers. Within seconds, most of the network is aware of the request and has independently validated that it's well-formed.

The validation happens at every node, not just the first one. This is part of what makes the system trustless. The user does not have to trust the first node they sent the request to, because every other node will check the same things independently.

### Step 5: A block producer assembles a new block

Periodically, one participant earns the right under the consensus rules to propose the next block. This is the costly-participation mechanism from the consensus lesson: in proof-of-work systems it's whoever finishes the puzzle, in proof-of-stake systems it's whoever the protocol selects from the staked validators.

That participant looks at their local buffer of pending requests, picks a set of them, usually prioritising the ones offering the highest fees, and assembles them into a block. The block has the structure from earlier in this module: a header containing the hash of the previous block plus a Merkle root summarising all the requests inside, then the requests themselves underneath.

This is the turning point. Up to here, the user's request was waiting in mempools as a pending item. From here, if everything goes right, it's about to become part of the permanent record.

### Step 6: The producer broadcasts the new block

The producer sends the assembled block out via the same gossip mechanism that carried the original request. The announcement-then-fetch pattern keeps bandwidth manageable. Within seconds, most nodes in the network have the new block.

### Step 7: Other nodes validate the block

Every node receiving the block checks it independently. They verify the block's structure. They re-verify every signature on every request in the block. They check that the block follows the consensus rules (the producer was actually entitled to propose, the work or stake was properly demonstrated).

This step is the deepest reason a blockchain works at all. The validation is replicated across every node. No single party is trusted to enforce the rules. If the proposer tried to cheat, the rest of the network rejects the block and nothing happens. This applies whether they included an invalid request or claimed a proposal slot they didn't earn.

### Step 8: The block becomes the new tip

If the block passes validation, every accepting node appends it to their copy of the chain. The user's request is now part of block N+1, and the chain's state reflects the change the request asked for.

The user can now query any node and see that the change has happened. Technically, the change can still be rolled back if the network ends up agreeing on a different version of recent history. The probability is small, and shrinks further with each new block built on top.

## What just happened

Eight steps, every one using a concept already in your head, ending with a permanent change to a shared record that no single party controls.

This is what a blockchain *does*. The rest of this course is about the variations between chains, the edge cases, the failure modes, and the application layer built on top. But the flow above is the core. Every blockchain you'll ever meet runs some version of it.

## Where this goes next

The walkthrough above assumed everything went smoothly. In reality, two block producers can earn the right to propose a block at roughly the same moment, with different sets of requests inside their respective blocks. The network momentarily holds two versions of "the next block." Half the nodes saw one first, half saw the other. The next lesson is about exactly this case: what happens when the network temporarily disagrees, and how it re-converges on a single shared history without anyone in charge.
