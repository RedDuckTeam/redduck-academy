# Merkle airdrop

_type: review_task_

## Background

You've built tokens. You've voted with tokens. Now you'll distribute them.

Airdrops are how most tokens first reach their holders. Uniswap, ENS, Arbitrum, Optimism all started by giving tokens to early users. The interesting engineering problem in an airdrop is publishing the eligibility list on chain cheaply.

You saw this pattern in the [Off-chain computation, on-chain verification]() lesson. The Merkle airdrop is that pattern's most-deployed instance.

The signature path covers cases where there is no fixed list to commit to. A protocol might decide eligibility dynamically: "you used the bridge in the last 30 days, here is your claim." Eligibility is decided server-side, on demand. An admin signs an authorization, the user submits it on chain, the contract recovers the signer and checks it matches the trusted address from construction. Same shape as the Merkle path, off-chain attestation verified on chain, different witness format.

Both paths are entirely cryptographic. There is no permission check that says "look up in a list." There is a hash to recompute and a signer to recover. Get the cryptography right and the access control falls out for free. Get it wrong and you have a class of bugs with no equivalent in normal access-control work. The two extra requirements in the signature behavior section below are not arbitrary checks. They are the difference between a contract that distributes correctly and one whose signatures can be replayed by anyone watching.

---

## Review grading tasks

1. contract compiles and exposes the expected interface
2. no forbidden library imports
3. claim verifies a valid Merkle proof, transfers tokens, marks claimed, emits event
4. claim rejects an invalid Merkle proof
5. claim rejects double-claim
6. claimWithSignature accepts a valid admin signature, transfers tokens, marks claimed, emits event
7. claimWithSignature rejects signatures from non-admin keys
8. the signed payload binds to the recipient
9. claimWithSignature rejects double-claim
10. hasClaimed is shared across both paths
11. tests/merkle.ts is implemented and consistent with the contract
12. tests/signatures.ts is implemented and consistent with the contract
13. tests cover the Merkle claim path
14. tests cover the signature claim path
