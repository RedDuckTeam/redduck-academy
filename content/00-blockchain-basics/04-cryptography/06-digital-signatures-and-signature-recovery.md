---
id: 75
title: Digital signatures and signature recovery
type: lecture
faq:
  - question: How does a blockchain know a transaction really came from me?
    answer: "You send the transaction together with a digital signature made using
      your private key. Any node can check that signature against your public
      key: if it is valid for that exact transaction, the network accepts it as
      coming from whoever holds the matching private key. No password or
      username is involved at all."
  - question: Can someone reuse my signature on a different transaction?
    answer: No. A signature is tied to the exact message it was made for, so
      changing even one bit of the transaction makes the same signature fail
      verification. This means old signatures cannot be replayed on other
      transactions, and a transaction cannot be tampered with without
      invalidating its signature.
  - question: Why don't blockchain transactions include the sender's public key?
    answer: "ECDSA has a feature called public-key recovery: given just the message
      and the signature, the network can compute the public key that signed it,
      helped by a small recovery-id byte inside the signature. So instead of
      every transaction carrying a public key, the network derives the signer
      from the signature itself and hashes it into the sender address. On many
      chains this is exposed to smart contracts as ecrecover."
  - question: Why is reusing a nonce when signing dangerous?
    answer: ECDSA uses a random value called a nonce inside each signature, and each
      signature needs a fresh one. If you accidentally sign two different
      messages with the same nonce, an attacker who sees both signatures can
      mathematically recover your private key, and this has drained real
      wallets. A standard called RFC 6979 fixes it by deriving the nonce
      deterministically from the key and message, which is why modern wallets no
      longer rely on the device's random number generator here.
---

> A blockchain transaction travels across an open network with no return address, no email header, no session cookie. Yet every node receiving it has to decide: did this transaction come from someone authorised to spend these funds? The mechanism that answers that question, billions of times per day across every public chain, is the topic of this lesson. It's also the operational pay-off for everything you've learned so far about key pairs.

## The problem

You hold a private key. You want to tell the network "move some value from my account to this other account." The network has never met you. It will never meet you. It cannot ask for your password because there is no password and no one to receive it.

What you can send is a **transaction** plus a **signature** on that transaction. Anyone with your public key can then check whether the signature is valid for that exact transaction. If it is, the network accepts that the transaction came from whoever holds the private key that pairs with the public key in question. If it isn't, the transaction is rejected.

For this to work, the signature scheme must guarantee three things:

1. **Only the holder of the private key can produce a valid signature** for a given message.
2. **Anyone with the public key can verify** that a given signature was produced for that message by that private key.
3. **The signature is tied to the exact message.** Change one bit of the transaction and the same signature no longer verifies. There is no replaying old signatures on different transactions.

These three properties are exactly what the public-key math from earlier in the module can deliver. The same key-pair construction that powered the encryption examples works in the opposite direction: instead of encrypting *to* the public key, you sign *with* the private key, and anyone verifies against the public key. Different goal, same underlying mathematical asymmetry.

## How sign and verify work

A signature scheme has two operations.

**Sign** takes the private key and a message and produces a signature, which is just a short value, typically 64 or 65 bytes.

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

Verifying does not require the private key. This is the entire point. The wallet that sent the transaction holds the private key; every node in the world that validates the transaction has only the public key, the message, and the signature; the protocol works because verification with just those three values is enough.

The most common signature scheme on the chains you'll meet is **ECDSA**, the Elliptic Curve Digital Signature Algorithm, used with the same secp256k1 curve that produces the key pairs. ECDSA does most of the signing work: every transaction on the largest chain families produces one. **Ed25519** has its own integrated signing scheme (technically called EdDSA) and is used by some newer chains.

For both schemes the operational properties are the same: sign with the private key, verify with the public key, signatures are ~64 bytes, signing is fast, verification is fast, and forgery without the private key is computationally infeasible.

## Where ECDSA hides a trap

Inside ECDSA's signing operation there's a random value called the **nonce**. Each signature needs a fresh nonce. If you ever sign two different messages with the same nonce by accident, an attacker who sees both signatures can mathematically recover your private key. This is not a theoretical attack, it has been used to drain real wallets.

The fix is a standard called **RFC 6979**, which makes the nonce a deterministic function of the private key and the message instead of relying on the device's random number generator. Every modern wallet uses this. You don't have to remember the standard, you do need to know that "weak randomness in signature generation" is a real category of historical wallet break, and that it's the reason RFC 6979 exists.

## Signature recovery: the operational pay-off

The verify operation above takes the public key as an input. For a blockchain to use this, every transaction would need to carry the sender's public key, which would make every transaction larger and require the network to look up which public keys belong to which accounts.

There is a better trick.

ECDSA has a property called **public-key recovery**. Given a signature and the message, you can directly recover the public key that signed it, with no other input. The public key can be computed from the signature itself.

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

The extra byte in the signature is a **recovery id** that disambiguates between the two mathematically valid public keys that any ECDSA signature could in principle map to. With that extra byte, recovery is unambiguous.

This is why blockchain transactions don't carry the sender's public key. The network derives it from the signature itself as each transaction arrives. The recovered public key, hashed in a chain-specific way, becomes the sender address. If the chain's state shows that this address has the funds being moved, the transaction is accepted. If not, rejected.

On many chains the recovery operation is exposed to smart-contract code as a built-in primitive (most famously named `ecrecover`) and is one of the most-called functions in the whole system. Every transaction triggers it. Every "did this user sign this message?" check uses it.

## What you know now

Three properties are now real to you instead of abstract.

**Authentication on a blockchain works without identity in the traditional sense.** No usernames, no central registry of who-is-who. Just private keys, signatures, and recovered public keys. If the math checks out, the transaction is yours.

**Signatures bind to exact messages.** You cannot reuse a signature on a different transaction. You cannot tamper with a transaction without invalidating its signature. The integrity comes from the math, not from a trusted intermediary.

**Recovery is the trick that makes the protocol-level math practical.** Without it, every transaction would need to carry a public key. With it, the network derives the signer's identity from the signature itself. This is the operational primitive that the next two lessons (and effectively every chain you'll touch) build on.

## Where this goes next

You've now seen the four building blocks the rest of the course will keep returning to: hash functions, encoding schemes, public-key cryptography, and digital signatures with recovery. The remaining lessons in this module combine these into the practical structures real wallets and chains use: derivation paths, Merkle trees, and a brief note on the quantum threat to all of the above.
