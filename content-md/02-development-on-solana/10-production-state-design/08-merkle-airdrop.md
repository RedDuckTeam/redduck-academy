# Merkle airdrop

_type: review_task_

The Merkle Airdrop is a real production pattern: one program that lets users claim an allocation by either proving they're on a fixed list of recipients or by presenting a signature from a trusted authority. The two paths are independent, but they share an anti-double-claim guard so any user can only claim once across both.

The interesting work isn't the Anchor scaffolding. You've done that. The interesting work is the verification logic itself. You implement Merkle proof verification by hand: hash the leaf, walk the proof, compare against the stored root. You implement signature verification by hand: build the message bytes, call ed25519 verification, reject if the signature doesn't match. There's no library you reach for that does this for you. The constraint is deliberate, because understanding how these primitives work is what separates someone who can use them safely from someone who can't.

You also write the off-chain pieces this time. Building the Merkle tree, producing proofs, generating signatures from the authority key. The conventions you pick off-chain have to match what the program verifies on-chain, exactly. A mismatch in the byte order of one field, or in whether you hash leaves and nodes the same way, breaks everything. That coordination between on-chain and off-chain code is itself part of the lesson.

---

## Review grading tasks

1. initialize stores the Merkle root and trusted signer pubkey
2. vault is a token account owned by a program-controlled PDA
3. Merkle proof verification reconstructs leaf from claimant and amount
4. Merkle proof verification walks the proof correctly and matches against stored root
5. Merkle claim transfers correct amount to claimant
6. anti-double-claim guard exists and blocks second claims across both paths
7. signature path verifies an ed25519 signature from the trusted signer
8. signature path verifies the message bytes, including the claimant pubkey
9. signature claim transfers correct amount
10. off-chain Merkle helper produces proofs the program accepts
11. off-chain signature helper produces signatures the program accepts
12. there is a test for an invalid Merkle proof
13. there is a test for a successful signature claim
14. there is a test that signature for one user cannot be used by another
15. initialize is one-time and cannot be re-run on the same config
16. claimed test coverage matches actual test behavior
17. claimed test coverage matches actual test behavior
