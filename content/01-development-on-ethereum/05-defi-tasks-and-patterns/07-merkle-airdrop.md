---
id: 157
title: Merkle airdrop
type: review_task
---

## Background

You've built tokens. You've voted with tokens. Now you'll distribute them.

Airdrops are how most tokens first reach their holders. Uniswap, ENS, Arbitrum, Optimism all started by giving tokens to early users. The interesting engineering problem in an airdrop is publishing the eligibility list on chain cheaply.

You saw this pattern in the [Off-chain computation, on-chain verification](/courses/development-on-ethereum/defi-tasks-and-patterns/off-chain-computation-on-chain-verification) lesson. The Merkle airdrop is that pattern's most-deployed instance.

The signature path covers cases where there is no fixed list to commit to. A protocol might decide eligibility dynamically: "you used the bridge in the last 30 days, here is your claim." Eligibility is decided server-side, on demand. An admin signs an authorization, the user submits it on chain, the contract recovers the signer and checks it matches the trusted address from construction. Same shape as the Merkle path, off-chain attestation verified on chain, different witness format.

Both paths are entirely cryptographic. There is no permission check that says "look up in a list." There is a hash to recompute and a signer to recover. Get the cryptography right and the access control falls out for free. Get it wrong and you have a class of bugs with no equivalent in normal access-control work. The two extra requirements in the signature behavior section below are not arbitrary checks. They are the difference between a contract that distributes correctly and one whose signatures can be replayed by anyone watching.
