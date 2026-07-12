---
id: 222
title: Merkle airdrop
type: review_task
order: 8
---

The Merkle Airdrop is a real production pattern: one program that lets users claim an allocation by either proving they're on a fixed list of recipients or by presenting a signature from a trusted authority. The two paths are independent, but they share an anti-double-claim guard so any user can only claim once across both.

The interesting work isn't the Anchor scaffolding. You've done that. The interesting work is the verification logic itself. You implement Merkle proof verification by hand: hash the leaf, walk the proof, compare against the stored root. You implement signature verification by hand: build the message bytes, call ed25519 verification, reject if the signature doesn't match. There's no library you reach for that does this for you. The constraint is deliberate, because understanding how these primitives work is what separates someone who can use them safely from someone who can't.

You also write the off-chain pieces this time. Building the Merkle tree, producing proofs, generating signatures from the authority key. The conventions you pick off-chain have to match what the program verifies on-chain, exactly. A mismatch in the byte order of one field, or in whether you hash leaves and nodes the same way, breaks everything. That coordination between on-chain and off-chain code is itself part of the lesson.
