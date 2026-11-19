---
id: 213
title: Randomness on chain
type: lecture
order: 39
faq:
  - question: Can a Solana program generate a random number on chain?
    answer: >-
      No. Every validator runs the transaction and must reach the same answer. A real random
      function would give each one a different value and break consensus.
  - question: Is the slot number or the block timestamp safe as a random seed?
    answer: >-
      No. The slot leader sets or sees both before publishing the block. A leader with a
      stake in the outcome simulates the draw and skips any block whose result goes against
      them, losing one block reward. Any prize worth more than that reward makes the attack
      profitable.
  - question: How does a VRF stop the oracle from picking the result it likes?
    answer: >-
      The proof binds the output to one committed seed and the oracle's private key. Trying many
      seeds and publishing the best one fails verification, and so does reusing an old output.
  - question: Why can't I use the random number in the transaction that requests it?
    answer: >-
      It does not exist yet. The request writes a pending PDA and returns, and the number
      arrives slots later in a second transaction from the oracle. Everything that consumes it
      lives in the callback handler.
  - question: What happens if my VRF callback runs out of compute?
    answer: >-
      It reverts and you get no randomness, having already paid for the request. Keep callbacks
      small, store the result, and leave heavy work to a later instruction.
---

> Solana programs can't generate random numbers on their own. Real randomness has to come from an external source with a cryptographic proof, which is what MagicBlock VRF provides, and it arrives in a second transaction, some slots after the request.

## Why a blockchain can't roll dice

The Solana runtime is a deterministic state machine. Every validator must execute every transaction and arrive at the same result, otherwise consensus breaks. If a program called some `rand()` function and each validator returned a different value, no two validators would agree on the chain state.

The standard workaround in beginner tutorials is to derive "randomness" from values that already exist on chain: the Clock sysvar's unix timestamp, the current slot number, the SlotHashes sysvar, recent transaction hashes, the caller's pubkey. These are deterministic for everyone reading the chain, so consensus is preserved. They are also all set or seen by the slot leader producing the block.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Lottery seed inputs a slot leader controls: Clock, SlotHashes, and tx inclusion</title><desc>A code box shows a lottery program picking a winner from a seed made of the Clock sysvar timestamp and slot number. Three boxes below show that the Clock sysvar, the SlotHashes sysvar, and transaction inclusion are all set or seen by the slot leader, and a red box lists four steps a malicious leader can use to simulate the lottery and skip transactions until the outcome favors them.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Why on-chain "randomness" is manipulable</text>
  <text x="40" y="84" font-family="monospace" font-size="12" font-weight="bold">A lottery program picks a winner using the Clock sysvar as the seed:</text>
  <rect x="40" y="98" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="120" font-family="monospace" font-size="11">let clock = Clock::get()?;</text>
  <text x="60" y="138" font-family="monospace" font-size="11">let seed = hash(timestamp_bytes, slot_bytes);</text>
  <text x="60" y="154" font-family="monospace" font-size="11">let winner_idx = u64_from(seed[..8]) % participants.len();</text>
  <text x="40" y="186" font-family="monospace" font-size="12" font-weight="bold">The problem: every input is controlled by or visible to the slot leader.</text>
  <rect x="40" y="206" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="226" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Clock sysvar</text>
  <text x="140" y="248" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Set by the slot</text>
  <text x="140" y="262" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">leader, with some</text>
  <text x="140" y="276" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">drift tolerance</text>
  <rect x="260" y="206" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="226" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">SlotHashes sysvar</text>
  <text x="360" y="248" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Leader sees all</text>
  <text x="360" y="262" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">recent hashes before</text>
  <text x="360" y="276" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">producing a block</text>
  <rect x="480" y="206" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="580" y="226" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">tx inclusion</text>
  <text x="580" y="248" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Leader picks which</text>
  <text x="580" y="262" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">transactions land</text>
  <text x="580" y="276" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">in their slot</text>
  <rect x="40" y="310" width="640" height="120" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="332" text-anchor="middle" font-size="12" font-weight="bold" fill="#ed4937">The attack</text>
  <line x1="60" y1="342" x2="660" y2="342" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="362" font-family="monospace" font-size="11">  1. A malicious slot leader simulates the lottery locally before producing the block.</text>
  <text x="60" y="380" font-family="monospace" font-size="11">  2. If the outcome picks them (or a colluding wallet), they include the tx.</text>
  <text x="60" y="398" font-family="monospace" font-size="11">  3. If not, they skip the tx or skip the slot entirely, letting the next leader produce.</text>
  <text x="60" y="418" font-family="monospace" font-size="11">  4. Sysvar values change at the next slot, so the outcome reshuffles.</text>
</svg>

A leader with a financial interest in the outcome simulates the draw before publishing the block and skips the block if the result goes against it. The cost of skipping a slot is the lost block reward. If the lottery payout exceeds that, the attack is profitable. For pools worth more than a few SOL, whoever is the leader for the slot of the draw can afford this, because skipping costs one block reward and the outcome is drawn again in the next slot.

Anything visible inside the block is visible to whoever is producing it, and the leader chooses what to publish. You cannot patch this by combining more sources. Any input the program reads is an input the leader can either control or see, and any deterministic function of public inputs produces an output the leader can predict.

## The oracle cannot choose a VRF output

The Verifiable Random Function (VRF) protocol is a cryptographic construction that produces two things at once: a pseudorandom output, and a proof that the output was generated correctly from a specific seed using a specific private key.

The party generating randomness, the VRF oracle service, holds the private key. The public key is published on chain in advance. The protocol works like this:

1. Someone supplies a seed, which can be anything: a slot number, a request ID, a sequence number.
2. The oracle signs the seed with its private key using the VRF algorithm. This produces a random output and a proof.
3. Anyone with the public key can verify, by examining the proof, that the output was generated from that seed using that key, and that the oracle had no freedom to choose the output.

The oracle cannot try multiple seeds, see the outputs, and publish only the one it likes, because the seed is committed to in the proof. The oracle cannot reuse a previously favorable output for a new seed, because the proof will not verify. Either it returns the cryptographically determined output, or its proof fails verification and the on-chain program rejects the response.

## The number arrives in a second transaction

VRF cannot be a single instruction call. The proof must be generated off chain by an entity holding the private key, and that work cannot happen inside a normal program execution. The pattern is asynchronous: your program submits a request in one transaction, and receives the result in a second transaction some slots later.

<svg role="img" viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Two-transaction VRF request flow between your program, MagicBlock VRF, and the oracle service</title><desc>In transaction 1, your program calls the MagicBlock VRF program via CPI to request randomness, which writes a request PDA with a seed and callback target; the off-chain oracle service reads the request, signs the seed with its private VRF key, and produces bytes and a proof. In transaction 2, the oracle submits the bytes and proof, the VRF program verifies them against its on-chain public key, and calls back your program's handler to store the result.</desc>
  <defs>
    <marker id="arrM2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A VRF request takes two transactions, separated by an off-chain step</text>
  <rect x="60" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Your program</text>
  <rect x="280" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="100" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">MagicBlock VRF</text>
  <text x="360" y="112" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(on-chain program)</text>
  <rect x="500" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="580" y="100" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Oracle service</text>
  <text x="580" y="112" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(off chain)</text>
  <line x1="140" y1="116" x2="140" y2="540" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="360" y1="116" x2="360" y2="540" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="580" y1="116" x2="580" y2="540" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="140" y1="155" x2="356" y2="155" stroke="#ed4937" stroke-width="2" marker-end="url(#arrM2)"/>
  <text x="248" y="148" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">CPI: request_randomness</text>
  <text x="248" y="170" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">TX 1 - user pays the fee</text>
  <rect x="280" y="186" width="160" height="44" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="360" y="206" text-anchor="middle" font-family="monospace" font-size="10">writes request PDA:</text>
  <text x="360" y="220" text-anchor="middle" font-family="monospace" font-size="10">seed, callback target</text>
  <line x1="360" y1="256" x2="576" y2="256" stroke="#ed4937" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arrM2)"/>
  <text x="468" y="249" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">reads the new request</text>
  <text x="468" y="271" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">(off-chain account subscription)</text>
  <rect x="500" y="286" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="580" y="306" text-anchor="middle" font-family="monospace" font-size="10">signs seed with</text>
  <text x="580" y="320" text-anchor="middle" font-family="monospace" font-size="10">private VRF key,</text>
  <text x="580" y="334" text-anchor="middle" font-family="monospace" font-size="10">produces (bytes, proof)</text>
  <line x1="580" y1="380" x2="364" y2="380" stroke="#ed4937" stroke-width="2" marker-end="url(#arrM2)"/>
  <text x="472" y="373" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">submits (bytes, proof)</text>
  <text x="472" y="395" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">TX 2 - oracle pays the fee</text>
  <rect x="280" y="411" width="160" height="48" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="360" y="431" text-anchor="middle" font-family="monospace" font-size="10">verifies proof against</text>
  <text x="360" y="445" text-anchor="middle" font-family="monospace" font-size="10">on-chain VRF public key</text>
  <line x1="360" y1="485" x2="144" y2="485" stroke="#ed4937" stroke-width="2" marker-end="url(#arrM2)"/>
  <text x="252" y="478" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">CPI: your callback handler</text>
  <text x="252" y="500" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">PDA-signed by VRF program</text>
  <rect x="60" y="515" width="160" height="22" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="140" y="530" text-anchor="middle" font-family="monospace" font-size="10">stores the result</text>
</svg>

You cannot use a random number in the same transaction that requests it, because the number does not exist yet. The request CPI completes by adding a pending request to the oracle's queue account, and the user's transaction returns successfully. Anything the program needs to do with the number (pick a winner, reveal an NFT, settle a bet) happens in the second transaction, inside the handler that the VRF program calls back (the callback), rather than in the original user transaction.

The split would be needed even if the number could be produced on the spot. A user who gets a random outcome inside their own transaction can simulate the transaction first and send it only when it wins. So the user's transaction only commits to the bet, and someone else, here the oracle, sends the transaction that brings the result. Solana PRO covers this pattern in the [commit-execution split](/courses/solana-pro/deferred-execution/commit-execution-split) lesson.

Under normal load, fulfillment happens within a few slots, often within a second of the original request. The user pays for the request transaction in SOL. The oracle pays for the fulfillment transaction itself and charges a fee that gets debited from the requester at request time.

## In code

Your program needs two instructions: one to make the request, and one to receive the callback. The request is a CPI into the MagicBlock VRF program, which adds the request, with a seed and the callback target, to the oracle's queue account. The callback handler is a normal instruction with one extra constraint: it can only be called by the MagicBlock VRF program.

When the VRF program delivers the number, it calls the callback through a CPI and signs for its identity PDA, which it derives from the seed `identity` and your program's ID. Only the VRF program can sign for that PDA, so the callback takes it as its first account, typed `Signer`, with an `address` constraint computed by `scoped_vrf_identity` from MagicBlock's `ephemeral-vrf-sdk` crate.

```rust
#[derive(Accounts)]
pub struct ReceiveRandomness<'info> {
    #[account(address = ephemeral_vrf_sdk::consts::scoped_vrf_identity(&crate::ID))]
    pub vrf_program_identity: Signer<'info>,
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
}

pub fn receive_randomness(ctx: Context<ReceiveRandomness>, randomness: [u8; 32]) -> Result<()> {
    let lottery = &mut ctx.accounts.lottery;
    let n = lottery.participants.len() as u64;
    let winner_idx = u64::from_le_bytes(randomness[..8].try_into().unwrap()) % n;
    lottery.winner = lottery.participants[winner_idx as usize];
    Ok(())
}
```

Anchor checks the signature and the address before the handler runs. A direct call can name the PDA but cannot carry its signature, so it reverts before reaching your code. Without such a check, anyone could call the handler with a number of their own choosing. The handler receives the number as 32 bytes and takes the first 8 bytes as a `u64` modulo the number of participants.

## What can go wrong

**The number is public as soon as it is delivered.** The fulfillment transaction publishes everything, and anyone watching the chain sees the result as soon as it lands. If your program logic depends on keeping the number hidden until later, that is not something VRF gives you, and you need a different protocol.

**Entries have to close before the request.** The oracle knows the number before the chain does. If the callback only stores the number and a later instruction picks the winner, as the next point recommends, everyone knows it before the winner is recorded. If participants can still join or withdraw after the request, whoever learns the number first can change the participant list so that the draw goes their way. The request instruction has to lock everything the number decides, here the participant list and the stakes, and keep it locked until the winner is recorded.

**The callback can fail.** If your `receive_randomness` handler runs out of compute units, panics on a checked-arithmetic overflow, or hits an Anchor constraint failure, the whole fulfillment transaction reverts, including the VRF program's part of it. The request stays in the queue until it expires and is removed, your program does not receive the randomness, and the fee you paid at request time is not refunded. Keep callbacks minimal: store the result and any cheap derived values, and save complex logic for a separate user-triggered instruction that reads from storage. The handler above can panic too: with no participants, `% n` divides by zero, so the request instruction has to reject an empty lottery.

**The oracle may never answer.** The proof makes a delivered number correct, but nothing makes the oracle deliver it, and a callback that reverts leaves the program in the same place. A lottery that can only finish in the callback then holds the pot forever, so it needs an exit: if no number has arrived by a deadline, participants take their stakes back. A second request is the other exit. Neither exit takes away the oracle's option to hold back a number it does not like: the refund cancels that draw and a second request repeats it, which is what the slot leader got by skipping a block. Solana PRO's [write the exit](/courses/solana-pro/dependencies-and-exits/write-the-exit) task asks for the same guarantee: the players' stakes must come back even if the round is never settled.
