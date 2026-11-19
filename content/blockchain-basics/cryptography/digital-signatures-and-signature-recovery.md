---
id: 75
title: Digital signatures and signature recovery
type: lecture
order: 6
faq:
  - question: How does a blockchain know a transaction really came from me?
    answer: >-
      You send a digital signature with the transaction. Any node checks it against your
      public key, and a signature valid for that exact transaction counts as authorisation.
      ECDSA on the secp256k1 curve does most of this work, and newer chains use Ed25519.
  - question: Can someone reuse my signature on a different transaction?
    answer: >-
      No. A signature binds to the exact message. Change one bit of the transaction and
      verification fails.
  - question: Why don't blockchain transactions include the sender's public key?
    answer: >-
      ECDSA can recover it. Given the message, the signature, and a small recovery-id byte
      inside it, the network computes the public key that signed and hashes it into the sender
      address. Many chains expose this to smart contracts as ecrecover.
  - question: What happens if a wallet signs two messages with the same nonce?
    answer: >-
      An attacker who sees both signatures can compute the private key. This has drained real
      wallets. RFC 6979 derives the nonce from the private key and the message instead of
      device randomness.
  - question: How big is a signature?
    answer: >-
      64 bytes, or 65 when it carries the recovery id byte.
---

> A node receives a transaction from an open network and has to decide whether it came from someone authorised to spend these funds. A digital signature lets any node check this using only the sender's public key.

## The network cannot ask who you are

You hold a private key, and you want to tell the network "move some value from my account to this other account." The network has never met you, and it cannot ask for your password because there is no password and no one to receive it.

What you can send is a **transaction** plus a **signature** on that transaction. Anyone with your public key can then check whether the signature is valid for that exact transaction. If it is, the network accepts that the transaction came from whoever holds the private key that pairs with that public key. If it isn't, the transaction is rejected.

For this to work, the signature scheme must guarantee three things:

1. **Only the holder of the private key can produce a valid signature** for a given message.
2. **Anyone with the public key can verify** that a given signature was produced for that message by that private key.
3. **The signature is tied to the exact message.** Change one bit of the transaction and the same signature no longer verifies, so an old signature cannot be reused on a different transaction.

Suppose you sign "send 1 coin from my account to Bob" and send it to the network. Any node checks the signature against your public key and sees that it is valid. Now suppose someone changes the amount to 10 on the way. The signature was produced for the message that says 1, so the check on the changed message fails and every node rejects it. To make the changed transfer valid the attacker needs a new signature, and only your private key can produce one.

## Signing needs the private key, verifying does not

The same key pair that powered the encryption examples works in the opposite direction: instead of encrypting *to* the public key, you sign *with* the private key, and anyone verifies against the public key. A signature scheme has two operations.

**Sign** takes the private key and a message and produces a signature, which is a short value, typically 64 or 65 bytes.

**Verify** takes the public key, the message, and the signature, and returns either "valid" or "invalid."

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Sign combines private key and message into a signature; Verify checks it</title><desc>On top, a private key and a message go into the sign step, producing a 64 or 65 byte signature. Below, the public key, message, and signature go into the verify step, which returns valid or invalid.</desc>
  <text x="360" y="20" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Sign</text>

<rect x="40" y="35" width="160" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="120" y="55" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">private key</text>
  <text x="120" y="73" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">your secret</text>

<rect x="40" y="100" width="160" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="120" y="120" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">message</text>
  <text x="120" y="138" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">the transaction</text>

<rect x="280" y="65" width="160" height="55" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="90" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">sign</text>
  <text x="360" y="108" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">private key + message</text>

<rect x="520" y="65" width="160" height="55" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="600" y="90" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">signature</text>
  <text x="600" y="108" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">64 or 65 bytes</text>

<line x1="200" y1="60" x2="280" y2="85" stroke="#565653" stroke-width="2"/>
  <polygon points="272,78 282,86 271,88" fill="#565653"/>
  <line x1="200" y1="125" x2="280" y2="100" stroke="#565653" stroke-width="2"/>
  <polygon points="271,98 282,100 272,108" fill="#565653"/>
  <line x1="440" y1="93" x2="520" y2="93" stroke="#565653" stroke-width="2"/>
  <polygon points="512,88 522,93 512,98" fill="#565653"/>

<line x1="40" y1="170" x2="680" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="4 4"/>

<text x="360" y="195" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Verify</text>

<rect x="40" y="215" width="120" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="100" y="235" text-anchor="middle" font-size="11" fill="#000000" font-weight="bold">public key</text>
  <text x="100" y="252" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">share freely</text>

<rect x="180" y="215" width="120" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="240" y="235" text-anchor="middle" font-size="11" fill="#000000" font-weight="bold">message</text>
  <text x="240" y="252" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">the transaction</text>

<rect x="320" y="215" width="120" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="380" y="235" text-anchor="middle" font-size="11" fill="#000000" font-weight="bold">signature</text>
  <text x="380" y="252" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">64 or 65 bytes</text>

<rect x="480" y="215" width="120" height="50" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="540" y="247" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">verify</text>

<rect x="620" y="215" width="60" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="650" y="247" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">✓ / ✗</text>

<line x1="160" y1="240" x2="180" y2="240" stroke="#565653" stroke-width="2"/>
  <line x1="300" y1="240" x2="320" y2="240" stroke="#565653" stroke-width="2"/>
  <line x1="440" y1="240" x2="480" y2="240" stroke="#565653" stroke-width="2"/>
  <polygon points="472,235 482,240 472,245" fill="#565653"/>
  <line x1="600" y1="240" x2="620" y2="240" stroke="#565653" stroke-width="2"/>
  <polygon points="612,235 622,240 612,245" fill="#565653"/>
</svg>

Verifying does not require the private key. The wallet that sent the transaction holds the private key, and every node that validates the transaction has only the public key, the message, and the signature.

The most common signature scheme on the chains you'll meet is **ECDSA**, the Elliptic Curve Digital Signature Algorithm, used with the same secp256k1 curve that produces the key pairs. Bitcoin and Ethereum both use it. **Ed25519** has its own integrated signing scheme (technically called EdDSA) and is used by Solana and some newer chains.

ECDSA has one weakness that a wallet has to handle. Each signature needs a fresh random value called the **nonce**. If a wallet signs two different messages with the same nonce, an attacker who sees both signatures can compute the private key, and real wallets have been drained this way. Modern wallets follow a standard called **RFC 6979**, which makes the nonce a deterministic function of the private key and the message instead of relying on the device's random number generator.

## Ethereum computes the sender's public key from the signature

The verify operation takes the public key as an input, so a node has to get the sender's public key from somewhere. Bitcoin and Solana put it in the transaction itself (a later lesson, [The UTXO model](/courses/blockchain-basics/bitcoin/the-utxo-model), shows where it sits in a Bitcoin transaction). Ethereum leaves it out, which makes every transaction smaller, and computes it instead.

This works because ECDSA has a property called **public-key recovery**: given the message and the signature, anyone can compute the public key that signed it. The signature carries one extra byte for this, called the **recovery id**, which is why it is sometimes 65 bytes and not 64.

<svg role="img" viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Message and signature recover the signer's public key</title><desc>The message (the transaction) and the signature (65 bytes with recovery id) both feed into a recover step. That step outputs the public key, which reveals the signer's identity.</desc>
  <rect x="40" y="50" width="180" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="130" y="75" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">message</text>
  <text x="130" y="95" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">the transaction</text>

<rect x="40" y="125" width="180" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="130" y="150" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">signature</text>
  <text x="130" y="170" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">65 bytes with recovery id</text>

<rect x="280" y="90" width="160" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="115" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">recover</text>
  <text x="360" y="135" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">message + signature</text>

<rect x="520" y="90" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="600" y="115" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">public key</text>
  <text x="600" y="135" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">the signer's identity</text>

<line x1="220" y1="85" x2="280" y2="110" stroke="#565653" stroke-width="2"/>
  <polygon points="272,103 282,111 271,113" fill="#565653"/>
  <line x1="220" y1="155" x2="280" y2="130" stroke="#565653" stroke-width="2"/>
  <polygon points="271,128 282,130 272,138" fill="#565653"/>
  <line x1="440" y1="120" x2="520" y2="120" stroke="#565653" stroke-width="2"/>
  <polygon points="512,115 522,120 512,125" fill="#565653"/>
</svg>

An Ethereum node recovers the public key from each transaction as it arrives and hashes it to get the sender address. If the chain's state shows that this address has the funds being moved, the transaction is accepted. If not, it is rejected. Smart contracts can run the same recovery through a built-in function called `ecrecover`, which is how a contract checks that a user signed a message.
