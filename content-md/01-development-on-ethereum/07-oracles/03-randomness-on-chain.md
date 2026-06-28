# Randomness on chain

_type: lecture_

> Smart contracts can't generate random numbers on their own. The reasons are structural, not solvable by writing cleverer code, and the workarounds you'll see in tutorials are mostly broken in ways that have led to real money being stolen. This lecture covers why randomness is hard on chain, how Chainlink VRF solves it cryptographically, and how to wire a consumer contract to receive verified random numbers in production.

## Why a blockchain can't roll dice

A blockchain is a deterministic state machine. Every node must execute every transaction and arrive at the same result, otherwise consensus breaks. That requirement is incompatible with native randomness. If a contract called some `rand()` function and each node returned a different value, no two nodes would agree on the chain state.

The standard workaround in beginner tutorials is to derive "randomness" from values that already exist on chain. Block timestamp, block hash, previous block's randao value, the sender's address, transaction hashes. These are deterministic for everyone reading the chain, so consensus is preserved. They are also all manipulable by the entity proposing the block.

<svg viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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

The attack does not require the validator to be the lottery's intended target. It requires only that the validator has any financial interest in the outcome and the option to suppress an unfavorable block. The cost of dropping a block is the lost block reward. If the lottery payout exceeds that, the attack is profitable. For pools worth more than a few ETH, this math works out in the attacker's favor every time.

The fundamental issue: anything visible inside the block is visible to whoever is proposing it, and the proposer chooses what to publish. You cannot patch this by combining more sources. Any input the contract reads is an input the proposer can either control or see, and any deterministic function of public inputs produces an output the proposer can predict.

## What VRF actually is

The Verifiable Random Function (VRF) protocol is a cryptographic construction that produces two things at once: a pseudorandom output, and a proof that the output was generated correctly from a specific seed using a specific private key.

The setup involves a key pair. The party generating randomness (the VRF oracle service) holds the private key. The public key is published on chain in advance. The protocol works like this:

1. Someone supplies a seed, which can be anything: a block hash, a request ID, a sequence number.
2. The oracle signs the seed with its private key using the VRF algorithm. This produces a random output and a proof.
3. Anyone with the public key can verify, by examining the proof, that the output was generated from exactly that seed using exactly that key, and that the oracle had no freedom to choose the output.

The third point is the load-bearing one. The oracle cannot try multiple seeds, see the outputs, and publish only the one it likes, because the seed is committed to in the proof. The oracle cannot reuse a previously favorable output for a new seed, because the proof will not verify. The output is bound to the seed and the key in a way that cannot be forged or selected.

For the math, see the [VRF protocol description on Chainlink's docs](https://docs.chain.link/vrf). The summary is: the oracle has nowhere to hide. Either it returns the cryptographically determined output, or its proof fails verification and the chain rejects the response.

## The request-and-receive cycle

VRF cannot be a single function call. The proof must be generated off chain by an entity holding the private key, and that work cannot happen inside a normal contract call. The pattern is asynchronous: your contract submits a request in one transaction, and receives the result in a second transaction some blocks later.

<svg viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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
  <text x="248" y="170" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">TX 1 — user pays gas</text>
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
  <text x="472" y="395" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">TX 2 — service pays gas</text>
  <rect x="280" y="411" width="160" height="48" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="360" y="431" text-anchor="middle" font-family="monospace" font-size="10">verifies proof against</text>
  <text x="360" y="445" text-anchor="middle" font-family="monospace" font-size="10">public VRF key on-chain</text>
  <line x1="360" y1="485" x2="144" y2="485" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV2)"/>
  <text x="252" y="478" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">fulfillRandomWords()</text>
  <text x="252" y="500" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">callback into your contract</text>
  <rect x="60" y="515" width="160" height="22" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="140" y="530" text-anchor="middle" font-family="monospace" font-size="10">stores the result</text>
</svg>

The implication for your contract design is that you cannot use a random number in the same transaction that requests it. The number does not exist yet. Your `requestRandomWords` call returns a request ID. The number arrives in a separate transaction via the callback function. Anything the contract needs to do with the number (pick a winner, reveal an NFT, settle a bet) happens inside that callback, not the original user transaction. This async shape is the biggest design constraint in working with VRF and it shapes every contract you'll build with it.

The number of block confirmations the service waits before responding is configurable per request. The current minimum on Sepolia is 3. Higher values give you better protection against shallow reorgs, at the cost of waiting longer for the result. The longer the node waits, the more secure the random value is.

## The subscription model

VRF requests cost gas. Someone has to pay for both the request transaction and the response transaction, plus a premium that compensates the oracle service. The current production version uses a [subscription account model](https://docs.chain.link/vrf/v2-5/overview/subscription) where you pre-fund a balance once and consumer contracts draw from it for each request.

<svg viewBox="0 0 720 450" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <defs>
    <marker id="arrV3" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">One subscription funds multiple consumer contracts</text>
  <rect x="280" y="170" width="160" height="120" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="360" y="195" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">Subscription</text>
  <line x1="295" y1="205" x2="425" y2="205" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="225" text-anchor="middle" font-family="monospace" font-size="10">ID: 42</text>
  <text x="360" y="245" text-anchor="middle" font-family="monospace" font-size="10">Balance:</text>
  <text x="360" y="261" text-anchor="middle" font-family="monospace" font-size="10">10 LINK</text>
  <text x="360" y="277" text-anchor="middle" font-family="monospace" font-size="10">0.5 ETH</text>
  <rect x="280" y="80" width="160" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="100" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Owner wallet</text>
  <text x="360" y="116" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">manages + funds</text>
  <line x1="360" y1="128" x2="360" y2="166" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <text x="370" y="150" font-family="monospace" font-size="9" fill="#ed4937">funds</text>
  <rect x="60" y="330" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="354" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Lottery.sol</text>
  <text x="140" y="373" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">consumer #1</text>
  <rect x="280" y="330" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="354" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">NFTReveal.sol</text>
  <text x="360" y="373" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">consumer #2</text>
  <rect x="500" y="330" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="580" y="354" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Raffle.sol</text>
  <text x="580" y="373" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">consumer #3</text>
  <line x1="160" y1="328" x2="290" y2="290" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <line x1="360" y1="328" x2="360" y2="294" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <line x1="560" y1="328" x2="430" y2="290" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <rect x="40" y="410" width="640" height="30" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="360" y="430" text-anchor="middle" font-family="monospace" font-size="10" font-style="italic" fill="#565653">Up to 100 consumer addresses per subscription. Each request bills the shared balance.</text>
</svg>

You create a subscription once through the [Subscription Manager UI](https://vrf.chain.link), fund it with LINK or native ETH (the current version supports both), and register the addresses of any contracts that should be allowed to spend from it. A contract that has not been added as an approved consumer cannot make requests against the subscription, even if it has the correct interface. This authorization step is enforced by the VRF Coordinator itself.

## Building a consumer contract

Your contract inherits from `VRFConsumerBaseV2Plus`, which provides the callback receiver and the coordinator reference. The current import paths are:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract Randomizer is VRFConsumerBaseV2Plus {
    // ...
}
```

The constructor takes the VRF Coordinator address for the network you're deploying to. Each chain has its own coordinator address, listed on the [supported networks page](https://docs.chain.link/vrf/v2-5/supported-networks). You also pass the subscription ID that will fund this contract's requests.

```solidity
uint256 public immutable subscriptionId;
bytes32 public immutable keyHash;
uint32 public callbackGasLimit = 100_000;
uint16 public requestConfirmations = 3;
uint32 public numWords = 1;

constructor(
    uint256 _subscriptionId,
    address _vrfCoordinator,
    bytes32 _keyHash
) VRFConsumerBaseV2Plus(_vrfCoordinator) {
    subscriptionId = _subscriptionId;
    keyHash = _keyHash;
}
```

The `keyHash` identifies which off-chain VRF job runs for your request. Different gas lanes (lower gas tolerance vs higher) have different key hashes. The gas lane key hash value is the maximum gas price you are willing to pay for a request in wei. The supported networks page lists the valid key hashes for each chain.

The request function builds a struct and calls the coordinator:

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

The `extraArgs` field is where you choose how to pay. Setting `nativePayment: false` deducts the request cost in LINK from the subscription balance. Setting it to `true` deducts in the network's native token instead. Both options are supported simultaneously on the same subscription.

The callback function is what your contract overrides to receive the result:

```solidity
function fulfillRandomWords(
    uint256 requestId,
    uint256[] calldata randomWords
) internal override {
    // Whatever you do with the random number happens HERE.
    // The user's original request transaction has long since returned.
    uint256 result = randomWords[0];
    // ... store it, pick a winner, reveal an NFT, etc.
}
```

The function is `internal` and `override`. The base class exposes a `public` wrapper that checks the caller is the coordinator before invoking your override. You do not need to write that check yourself, but you also cannot bypass it. If anything other than the coordinator calls into the contract attempting to deliver a result, it gets rejected before reaching your code.

The `randomWords` array length matches the `numWords` you requested. For most use cases that's one. Asking for several at once is cheaper per number when you need multiple values for the same request (for example, shuffling a deck), since the cryptographic overhead is paid once.

## Working with the random number

The number you receive is a `uint256`, distributed essentially uniformly across the full range of that type. To use it for a specific range, take the modulo:

```solidity
uint256 diceRoll = (randomWords[0] % 20) + 1;       // 1 to 20
uint256 percent = randomWords[0] % 100;             // 0 to 99
address winner = participants[randomWords[0] % participants.length];
```

Modulo introduces very slight bias when the modulus does not divide cleanly into the range of `uint256`, but for any modulus you'd use in a contract the bias is undetectable. For a 20-sided die, the bias is on the order of one part in 2^251.

The number is fully revealed on chain the moment the coordinator delivers it. If your contract logic depends on keeping the number hidden until later, that's not something VRF gives you. The fulfillment transaction publishes everything, and anyone watching the mempool sees the result as soon as it's mined. Use cases that need committed-but-hidden randomness need a different protocol.

## What can go wrong

Three considerations the [security page](https://docs.chain.link/vrf/v2-5/security) makes explicit and that production contracts get wrong.

**The callback gas limit can be exhausted.** If your `fulfillRandomWords` runs out of gas (because it does too much work, or the limit you set is too low), the random number is delivered to the coordinator but never reaches your contract's storage. The subscription is still charged for the work. Keep the callback minimal: store the result and any derived values, then handle complex logic in a separate user-triggered transaction that reads from storage.

**Reorgs can re-fulfill the same request.** A request submitted near the tip of the chain can be confirmed in one block ordering and then re-organized into a different one. The same VRF response would still be valid (the seed and proof are deterministic), but your contract might process it twice if it doesn't track which requests have already been fulfilled. Use a flag in the request record to mark fulfilled requests and reject double-delivery.

**You cannot use the random number in the request transaction.** A common beginner mistake is to write something like "request a number and then check if msg.sender won." There is no number yet. The check has to happen in the callback, and the user has to either send a second transaction to claim a win or have the callback automatically settle the outcome.
