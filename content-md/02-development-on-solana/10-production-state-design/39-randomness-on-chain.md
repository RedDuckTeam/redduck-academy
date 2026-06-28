# Randomness on chain

_type: lecture_

> Solana programs can't generate random numbers on their own. The reasons are structural rather than solvable by writing cleverer code, and the workarounds you'll see in tutorials are mostly broken in ways that have led to real money being stolen. This lecture covers why randomness is hard on chain, how Magicblock VRF solves it cryptographically, and how to wire a consumer program to receive verified random numbers in production.

## Why a blockchain can't roll dice

The Solana runtime is a deterministic state machine. Every validator must execute every transaction and arrive at the same result, otherwise consensus breaks. That requirement is incompatible with native randomness. If a program called some `rand()` function and each validator returned a different value, no two validators would agree on the chain state.

The standard workaround in beginner tutorials is to derive "randomness" from values that already exist on chain. The Clock sysvar's unix timestamp, the current slot number, the SlotHashes sysvar, recent transaction hashes, the caller's pubkey. These are deterministic for everyone reading the chain, so consensus is preserved. They are also all manipulable by the slot leader producing the block.

<svg viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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

The attack does not require the validator to be the lottery's intended target. It requires only that the validator has any financial interest in the outcome and the option to suppress an unfavorable block. The cost of skipping a slot is the lost block reward. If the lottery payout exceeds that, the attack is profitable. For pools worth more than a few SOL, this math works out in the attacker's favor every time.

The fundamental issue: anything visible inside the block is visible to whoever is producing it, and the leader chooses what to publish. You cannot patch this by combining more sources. Any input the program reads is an input the leader can either control or see, and any deterministic function of public inputs produces an output the leader can predict.

## What VRF actually is

The Verifiable Random Function (VRF) protocol is a cryptographic construction that produces two things at once: a pseudorandom output, and a proof that the output was generated correctly from a specific seed using a specific private key.

The setup involves a keypair. The party generating randomness, the VRF oracle service, holds the private key. The public key is published on chain in advance. The protocol works like this:

1. Someone supplies a seed, which can be anything: a slot number, a request ID, a sequence number.
2. The oracle signs the seed with its private key using the VRF algorithm. This produces a random output and a proof.
3. Anyone with the public key can verify, by examining the proof, that the output was generated from exactly that seed using exactly that key, and that the oracle had no freedom to choose the output.

The third point is the load-bearing one. The oracle cannot try multiple seeds, see the outputs, and publish only the one it likes, because the seed is committed to in the proof. The oracle cannot reuse a previously favorable output for a new seed, because the proof will not verify. The output is bound to the seed and the key in a way that cannot be forged or selected.

The summary is: the oracle has nowhere to hide. Either it returns the cryptographically determined output, or its proof fails verification and the on-chain program rejects the response.

## The request-and-receive cycle

VRF cannot be a single instruction call. The proof must be generated off chain by an entity holding the private key, and that work cannot happen inside a normal program execution. The pattern is asynchronous: your program submits a request in one transaction, and receives the result in a second transaction some slots later.

<svg viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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
  <text x="360" y="100" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Magicblock VRF</text>
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

The implication for your program design is that you cannot use a random number in the same transaction that requests it. The number does not exist yet. Your `request_randomness` CPI completes by writing a pending request to a PDA, and the user's transaction returns successfully. The number arrives later in a separate transaction via the callback. Anything the program needs to do with the number (pick a winner, reveal an NFT, settle a bet) happens inside that callback rather than the original user transaction. This async shape is the biggest design constraint in working with VRF and it shapes every program you'll build with it.

The number of slots the oracle waits before fulfilling is short. Under normal load, fulfillment happens within a few slots, often within a second of the original request. The user pays for the request transaction in SOL. The oracle pays for the fulfillment transaction itself and charges a fee that gets debited from the requester at request time.

## Building a consumer program

Your program needs two instructions: one to make the request, and one to receive the callback. The callback is a regular Anchor instruction with a specific signature that the Magicblock VRF program will invoke via CPI.

Add the Magicblock VRF SDK to your `Cargo.toml`. A request instruction looks like this:

```rust
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use magicblock_vrf_sdk::{
    create_request_randomness_ix,
    RequestRandomnessParams,
    VRF_PROGRAM_ID,
};

declare_id!("...");

#[program]
pub mod lottery {
    use super::*;

    pub fn request_random(ctx: Context<RequestRandom>) -> Result<()> {
        // Build the request instruction via the SDK helper
        let ix = create_request_randomness_ix(RequestRandomnessParams {
            payer: ctx.accounts.user.key(),
            callback_program_id: crate::ID,
            callback_discriminator: instruction::ReceiveRandomness::DISCRIMINATOR.to_vec(),
            caller_seed: ctx.accounts.lottery.key().to_bytes(),
            ..Default::default()
        });

        // CPI into the Magicblock VRF program
        invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vrf_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                // ... other accounts the SDK requires
            ],
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct RequestRandom<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub lottery: Account<'info, Lottery>,

    /// CHECK: The Magicblock VRF program, address pinned
    #[account(address = VRF_PROGRAM_ID)]
    pub vrf_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
```

The important fields in `RequestRandomnessParams`:

- `payer`: who pays the request fee. Usually the user.
- `callback_program_id`: your program's ID, since the VRF program will CPI back into you.
- `callback_discriminator`: the 8-byte Anchor discriminator of the instruction that should receive the randomness. The VRF program uses this to encode the right CPI on fulfillment.
- `caller_seed`: 32 bytes of caller-supplied seed. Including the lottery PDA pubkey is a reasonable choice. The VRF service mixes this with its own entropy before signing, so the result is unpredictable to both sides.

The callback handler is a normal instruction with one extra constraint: it can only be called by the Magicblock VRF program. Anchor's `Signer` constraint plus an address pin handles this:

```rust
pub fn receive_randomness(
    ctx: Context<ReceiveRandomness>,
    randomness: [u8; 32],
) -> Result<()> {
    // Whatever you do with the random number happens HERE.
    // The user's original request transaction has long since returned.

    let lottery = &mut ctx.accounts.lottery;
    let participants_len = lottery.participants.len() as u64;

    // Convert the first 8 bytes of randomness to a u64, then modulo
    let winner_idx = u64::from_le_bytes(
        randomness[..8].try_into().unwrap()
    ) % participants_len;

    lottery.winner = lottery.participants[winner_idx as usize];
    Ok(())
}

#[derive(Accounts)]
pub struct ReceiveRandomness<'info> {
    /// CHECK: The Magicblock VRF program signed this CPI via its PDA.
    /// The address pin and Signer constraint together guarantee that
    /// only the VRF program can invoke this handler.
    #[account(signer, address = VRF_PROGRAM_ID)]
    pub vrf_program: UncheckedAccount<'info>,

    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
}
```

The signer check on `vrf_program` is what enforces that only the Magicblock VRF program can invoke this callback. If anyone else tries to call `receive_randomness` directly, the constraint fails and the transaction reverts before reaching your code. You do not write that check manually. Anchor enforces it at handler entry based on the Accounts struct.

## Working with the random number

The number you receive is 32 bytes of uniformly random data. To use it for a specific range, slice and modulo:

```rust
// Pick a winner from N participants
let winner_idx = u64::from_le_bytes(randomness[..8].try_into().unwrap())
    % participants_len;

// Roll a 20-sided die
let dice_roll = (u64::from_le_bytes(randomness[..8].try_into().unwrap()) % 20) + 1;

// A percentage from 0 to 99
let percent = u64::from_le_bytes(randomness[..8].try_into().unwrap()) % 100;
```

The number is fully revealed on chain the moment the oracle delivers it. If your program logic depends on keeping the number hidden until later, that is not something VRF gives you. The fulfillment transaction publishes everything, and anyone watching the chain sees the result as soon as it lands. Use cases that need committed-but-hidden randomness need a different protocol.

## What can go wrong

Two considerations production programs get wrong.

**The callback can fail.** If your `receive_randomness` handler runs out of compute units, or panics on a checked-arithmetic overflow, or hits any other Anchor constraint failure, the callback transaction reverts. The Magicblock VRF program records the failure, but your program does not receive the randomness. Keep callbacks minimal. Store the result and any cheap derived values. Save complex logic for a separate user-triggered instruction that reads from storage. A callback that reverts is a request that you paid for and got nothing from.

**You cannot use the random number in the request transaction.** A common beginner mistake is to write something like "request a number and then check if the user won." There is no number yet. The check has to happen in the callback. The user either sends a follow-up transaction to claim their prize or the callback automatically settles the outcome.
