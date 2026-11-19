---
id: 166
title: Randomness on chain
type: lecture
order: 3
faq:
  - question: Why isn't block.timestamp or prevrandao good enough randomness for a lottery?
    answer: >-
      The proposer sees or chooses every one of them before publishing. They can simulate the
      draw and drop the block when it does not win, at the cost of one block reward.
  - question: How does VRF stop the oracle picking an output it likes?
    answer: >-
      The proof binds the output to one seed and one private key, so any other seed produces a
      proof that fails.
  - question: Can I use the random number in the transaction that requests it?
    answer: >-
      No. It does not exist yet. requestRandomWords hands back a request ID, and the value
      arrives blocks later through the fulfillRandomWords callback. Confirmations come first, a
      minimum of 3 on Sepolia.
  - question: My callback ran out of gas and the number never arrived. What now?
    answer: >-
      The subscription was charged anyway. Keep fulfillRandomWords small and do the heavy work
      in a later transaction. Record which request IDs are fulfilled too, since a reorg can
      deliver the same response twice.
---

> Smart contracts can't generate random numbers on their own. Every value a contract can read is known to whoever proposes the block, so a number that nobody can choose has to come from outside the chain together with a proof. Chainlink VRF provides one, and it arrives in a separate transaction some blocks after the request.

## Whoever proposes the block knows every value in it

Every node must execute every transaction and arrive at the same result, so a contract has no native source of randomness. If it called some `rand()` function and each node returned a different value, no two nodes would agree on the chain state, as the [determinism lesson](/courses/blockchain-basics/the-blockchain-idea/determinism-and-what-blockchains-cant-do) explained.

The standard workaround in beginner tutorials is to derive the number from values that already exist on chain: the block timestamp, the block hash, the previous block's randao value, the sender's address, transaction hashes. These are the same for everyone reading the chain, so consensus is preserved. They are also all chosen or seen by the validator proposing the block.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>On-chain lottery seed: block.timestamp, block.prevrandao, and tx ordering, all proposer-controlled</title><desc>A lottery contract seeds a keccak256 hash with block.timestamp and block.prevrandao, and three boxes explain that timestamp, prevrandao, and transaction ordering are all chosen or seen by the block proposer. A four-step attack box shows a validator simulating the lottery locally, publishing the block only if it wins, and rerolling by skipping the block or changing transactions or the timestamp otherwise.</desc>
  <defs>
    <marker id="arrV1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Why on-chain "randomness" is manipulable</text>
  <text x="40" y="84" font-family="monospace" font-size="12" font-weight="bold">A lottery contract picks a winner using block.timestamp as the seed:</text>
  <rect x="40" y="98" width="640" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="120" font-family="monospace" font-size="11">uint256 winner = uint256(keccak256(abi.encodePacked(</text>
  <text x="60" y="138" font-family="monospace" font-size="11">    block.timestamp, block.prevrandao</text>
  <text x="60" y="150" font-family="monospace" font-size="11">)) % participants.length;</text>
  <text x="40" y="186" font-family="monospace" font-size="12" font-weight="bold">The problem: every input is controlled or visible to the block proposer.</text>
  <rect x="40" y="206" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="226" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">block.timestamp</text>
  <text x="140" y="248" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Proposer picks the</text>
  <text x="140" y="262" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">timestamp within</text>
  <text x="140" y="276" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">a wide window</text>
  <rect x="260" y="206" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="226" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">block.prevrandao</text>
  <text x="360" y="248" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Proposer sees its</text>
  <text x="360" y="262" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">value before</text>
  <text x="360" y="276" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">committing the block</text>
  <rect x="480" y="206" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="580" y="226" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">tx ordering</text>
  <text x="580" y="248" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Proposer decides</text>
  <text x="580" y="262" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">which transactions</text>
  <text x="580" y="276" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">go in, in what order</text>
  <rect x="40" y="310" width="640" height="120" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="332" text-anchor="middle" font-size="12" font-weight="bold" fill="#ed4937">The attack</text>
  <line x1="60" y1="342" x2="660" y2="342" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="362" font-family="monospace" font-size="11">  1. A malicious validator simulates the lottery locally before publishing.</text>
  <text x="60" y="380" font-family="monospace" font-size="11">  2. If the result picks them (or their colluding wallet), they publish the block.</text>
  <text x="60" y="398" font-family="monospace" font-size="11">  3. If not, they reroll: skip the block, retry with different transactions or timestamp.</text>
  <text x="60" y="418" font-family="monospace" font-size="11">  4. The chain has no way to tell what was "rolled away."</text>
</svg>

A validator with a financial interest in the outcome simulates the draw before publishing its block and drops the block if it does not win. The cost of dropping a block is the lost block reward. If the lottery payout exceeds that, the attack is profitable, which is the case for pools worth more than a few ETH.

You cannot patch this by combining more sources. Any input the contract reads is an input the proposer can either control or see, and any deterministic function of public inputs produces an output the proposer can predict.

## Commit-reveal lets the last participant reject the result

The next thing to try is to take the inputs from the participants and keep them hidden until nobody can react to them, as in the [commit-reveal task](/courses/development-on-ethereum/token-security-and-evm-internals/commit-reveal). Each participant first submits the hash of a secret number. After all the hashes are in, each participant reveals the number, and the contract hashes the revealed numbers together. A participant cannot pick a number after seeing the others, and the proposer sees only hashes.

The scheme fails at the last reveal. The participant who reveals last already sees every other number, so they can compute the result before sending their own. If the result is bad for them, they do not send the reveal, and the draw either never finishes or has to be finished some other way. The last participant drops a reveal the way the proposer drops a block.

So the number has to come from a party that does not take part in the draw, and that party has to prove that it did not choose the number.

## A VRF output comes with a proof that the oracle did not choose it

A Verifiable Random Function (VRF) is a cryptographic construction that produces two things at once: a pseudorandom output, and a proof that the output was generated correctly from a specific seed using a specific private key.

The party generating randomness (the VRF oracle service) holds the private key. The public key is published on chain in advance. The protocol works like this:

1. Someone supplies a seed, which can be anything: a block hash, a request ID, a sequence number.
2. The oracle signs the seed with its private key using the VRF algorithm. This produces a random output and a proof.
3. Anyone with the public key can verify, by examining the proof, that the output was generated from that seed using that key, and that the oracle had no freedom to choose the output.

The oracle cannot try multiple seeds, see the outputs, and publish only the one it likes, because the seed is committed to in the proof. The oracle cannot reuse a previously favorable output for a new seed, because the proof will not verify. Either it returns the output that the seed and the key determine, or its proof fails verification and the chain rejects the response. For the math, see the [VRF protocol description on Chainlink's docs](https://docs.chain.link/vrf).

## The number arrives in a second transaction

VRF cannot be a single function call. The proof must be generated off chain by the holder of the private key, so your contract submits a request in one transaction and receives the result in a second transaction some blocks later.

<svg role="img" viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>VRF request cycle: contract, VRF Coordinator, and VRF Service over two transactions</title><desc>Three lanes show your contract, the on-chain VRF Coordinator, and the off-chain VRF Service exchanging messages over time. In transaction 1 your contract calls requestRandomWords() and the coordinator emits an event with a seed; the service signs the seed, waits N block confirmations, and submits the number and proof in transaction 2, which the coordinator verifies before calling fulfillRandomWords() so your contract stores the result.</desc>
  <defs>
    <marker id="arrV2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A VRF request takes two transactions, separated by an off-chain step</text>
  <rect x="60" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Your contract</text>
  <rect x="280" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">VRF Coordinator</text>
  <text x="360" y="115" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(on chain)</text>
  <rect x="500" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="580" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">VRF Service</text>
  <text x="580" y="115" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(off chain)</text>
  <line x1="140" y1="116" x2="140" y2="540" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="360" y1="116" x2="360" y2="540" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="580" y1="116" x2="580" y2="540" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="140" y1="155" x2="356" y2="155" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV2)"/>
  <text x="248" y="148" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">requestRandomWords()</text>
  <text x="248" y="170" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">TX 1: user pays gas</text>
  <rect x="280" y="186" width="160" height="34" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="360" y="207" text-anchor="middle" font-family="monospace" font-size="10">emit event with seed</text>
  <line x1="360" y1="246" x2="576" y2="246" stroke="#ed4937" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arrV2)"/>
  <text x="468" y="239" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">listens for event</text>
  <text x="468" y="261" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(off-chain log subscription)</text>
  <rect x="500" y="276" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="580" y="296" text-anchor="middle" font-family="monospace" font-size="10">signs seed with</text>
  <text x="580" y="310" text-anchor="middle" font-family="monospace" font-size="10">private VRF key,</text>
  <text x="580" y="324" text-anchor="middle" font-family="monospace" font-size="10">produces (number, proof)</text>
  <text x="468" y="356" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">waits N block confirmations</text>
  <line x1="580" y1="380" x2="364" y2="380" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV2)"/>
  <text x="472" y="373" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">submits (number, proof)</text>
  <text x="472" y="395" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">TX 2: service pays gas</text>
  <rect x="280" y="411" width="160" height="48" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="360" y="431" text-anchor="middle" font-family="monospace" font-size="10">verifies proof against</text>
  <text x="360" y="445" text-anchor="middle" font-family="monospace" font-size="10">public VRF key on-chain</text>
  <line x1="360" y1="485" x2="144" y2="485" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV2)"/>
  <text x="252" y="478" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">fulfillRandomWords()</text>
  <text x="252" y="500" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">callback into your contract</text>
  <rect x="60" y="515" width="160" height="22" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="140" y="530" text-anchor="middle" font-family="monospace" font-size="10">stores the result</text>
</svg>

You cannot use a random number in the same transaction that requests it, because the number does not exist yet. Your `requestRandomWords` call returns only a request ID. Anything the contract needs to do with the number (pick a winner, reveal an NFT, settle a bet) starts in the callback function and not in the original user transaction.

The service waits for a number of block confirmations before responding. A block at the tip of the chain can still be dropped in a reorg, as the [consensus lesson](/courses/development-on-ethereum/how-ethereum-works/consensus-on-ethereum) described, and the request transaction with it, so the service reveals the number only after the request is several blocks deep. The number of confirmations is configurable per request, and the current minimum on Sepolia is 3. Higher values give you better protection against shallow reorgs, at the cost of waiting longer for the result.

## In code

Your contract inherits from `VRFConsumerBaseV2Plus`, which provides the callback receiver and the coordinator reference. The request function builds a struct and calls the coordinator:

```solidity
function requestRandomNumber() external returns (uint256 requestId) {
    requestId = s_vrfCoordinator.requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        })
    );
}
```

`subId` is the subscription that pays for the request, a balance you fund in advance with LINK or native ETH. The consumer contract has to be registered on the subscription, or the coordinator rejects its requests. `keyHash` selects the gas lane, the off-chain VRF job that serves your request, and each lane has its own maximum gas price. `requestConfirmations` is the number of confirmations from the previous section, `callbackGasLimit` is the most gas the callback may use, and `numWords` is how many numbers you want back. The [subscription docs](https://docs.chain.link/vrf/v2-5/overview/subscription) cover the setup and the other fields, and the [supported networks page](https://docs.chain.link/vrf/v2-5/supported-networks) lists the coordinator address and the valid key hashes for each chain.

The callback function is what your contract overrides to receive the result:

```solidity
function fulfillRandomWords(
    uint256 requestId,
    uint256[] calldata randomWords
) internal override {
    uint256 result = randomWords[0];
    // ... store it, pick a winner, reveal an NFT, etc.
}
```

The function is `internal` and `override`. The base class exposes a `public` wrapper that checks the caller is the coordinator before invoking your override, so a result delivered by anything other than the coordinator is rejected before it reaches your code.

Each number is a `uint256`, distributed essentially uniformly across the full range of that type. To use it for a specific range, take the modulo:

```solidity
uint256 diceRoll = (randomWords[0] % 20) + 1;       // 1 to 20
uint256 percent = randomWords[0] % 100;             // 0 to 99
address winner = participants[randomWords[0] % participants.length];
```

Modulo introduces a very slight bias when the modulus does not divide cleanly into the range of `uint256`. For a 20-sided die, the bias is on the order of one part in 2^251.

## What VRF costs

A VRF number takes two transactions and a wait of several blocks. Someone has to pay for both the request transaction and the response transaction, plus a premium that compensates the oracle service.

The trust moves to the oracle. It cannot choose the number, but it computes the number before anyone else sees it, and it can fail to deliver it. You rely on the holder of the VRF key having no stake in your draw.

The number is not secret. The fulfillment transaction publishes everything, so anyone watching the chain sees the number as soon as that transaction is mined. If your contract logic depends on keeping the number hidden until later, that's not something VRF gives you.

## What the consumer contract has to get right

**Fix everything the number decides before you request it.** The seed is set in the request transaction, so from that moment the number is determined, even though the chain has not seen it yet. The list of participants and their stakes has to be final in the same transaction. If a raffle still accepts entries or withdrawals after the request, anyone who learns the number before the contract acts on it can enter or leave knowing the result. The Solana Pro course calls this the [commit-execution split](/courses/solana-pro/deferred-execution/commit-execution-split).

**Keep the callback small.** If your `fulfillRandomWords` runs out of gas (because it does too much work, or the limit you set is too low), the random number is delivered to the coordinator but never reaches your contract's storage. The subscription is still charged for the work. Store the result and any derived values in the callback, then handle complex logic in a separate user-triggered transaction that reads from storage.

**Decide what happens if the number never arrives.** The proof guarantees that a delivered number is correct, not that it is delivered. If the service stays silent or the callback fails, a contract that can only finish in the callback keeps the players' money locked, so it needs a way out after a timeout. Both ways out give the service the option the last participant had in commit-reveal, because the service computes the number before it delivers it. If the contract returns the deposits, a service that holds back a number cancels that draw. If the contract requests again, the new request has a new seed, so the service also gets a different number. Either way the draw is fair only while the holder of the VRF key has no stake in it.

**Record which requests are fulfilled.** A request submitted near the tip of the chain can be confirmed in one block ordering and then re-organized into a different one. The same VRF response would still be valid (the seed and proof are deterministic), but your contract might process it twice if it doesn't track which requests have already been fulfilled. Use a flag in the request record to mark fulfilled requests and reject double-delivery.

Read Chainlink's [security page](https://docs.chain.link/vrf/v2-5/security) before you deploy a consumer.
