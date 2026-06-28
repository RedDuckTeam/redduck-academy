# Public-key cryptography

_type: lecture_

> The previous lesson introduced the idea of a key pair without explaining how such a thing is possible. Two keys, mathematically linked, where knowing one tells you nothing useful about the other. This lesson is about what makes that work, what specific schemes blockchains use, and why this single mathematical trick is the foundation for almost everything cryptographic that the chain actually relies on.

## The problem this solves

You need a way to prove to anyone in the world that you are who you say you are, **without revealing the secret that makes you "you."**

That sentence is doing a lot of work. Unpack it:

- "Prove to anyone" means the proof has to be public-verifiable. No trusted middleman who knows your secret.
- "Anyone in the world" means people you've never met, and people who will exist long after you stop being able to answer questions.
- "Without revealing the secret" means the act of proving cannot leak the proof material itself. If proving costs you the secret, you can only prove once.

A password doesn't work for this. Showing your password to a verifier means they now have your password. A traditional shared key doesn't work either. You'd need to share it with every party in advance.

What you need is something asymmetric. A pair of values, mathematically linked, with these properties:

1. One value (the secret) generates the other (the public proof token) easily.
2. The reverse direction (recovering the secret from the public token) is computationally infeasible.
3. The secret can be used to "sign" or "decrypt" things in a way only the holder of the secret could do.
4. The public token can be used by anyone to verify the work without ever holding the secret.

For most of cryptographic history, no such construction was known. In the 1970s a sequence of breakthroughs (Diffie–Hellman 1976, RSA 1977) showed that it could be done, using carefully chosen mathematical operations where the forward direction is fast and the reverse direction is astronomically slow. This is the entire foundation of modern cryptography on the internet, and it is the entire foundation of identity on a blockchain.

## One-way functions

The mathematical idea underneath every key pair is a **one-way function**. Easy to compute in one direction, infeasible to reverse.

A useful intuition: mixing paint. Given two paint colors, you can easily produce the mixture. Given the mixture, separating it back into the two original colors is hopeless. The forward operation is trivial. The reverse operation is intractable.

<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <rect x="40" y="70" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="120" y="95" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">private key</text>
  <text x="120" y="115" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">(your secret)</text>

<rect x="510" y="70" width="160" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="95" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">public key</text>
  <text x="590" y="115" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">(share freely)</text>

<line x1="200" y1="90" x2="510" y2="90" stroke="#ed4937" stroke-width="2"/>
  <polygon points="502,85 512,90 502,95" fill="#ed4937"/>
  <text x="355" y="80" text-anchor="middle" font-size="12" fill="#ed4937" font-weight="bold">easy: milliseconds</text>

<line x1="510" y1="120" x2="200" y2="120" stroke="#565653" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="208,115 198,120 208,125" fill="#565653"/>
  <text x="355" y="145" text-anchor="middle" font-size="12" fill="#565653" font-weight="bold">infeasible: longer than the age of the universe</text>

<text x="355" y="180" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">A one-way function. The forward arrow runs every time you use your wallet.</text>
</svg>

The forward operation in public-key cryptography is some mathematical computation that takes the private key as input and produces the public key as output. Doing it is fast: any device can compute it in microseconds. Reversing it requires an attacker to try enormous numbers of possibilities, and the schemes are designed so that even the largest computer clusters humanity has built would not finish reversing one in the lifetime of the universe.

The strength of a key pair depends entirely on how steep that asymmetry is. A weak scheme might take a determined attacker a few years to reverse. A strong scheme would take longer than the heat death of the universe.

## The schemes blockchains use

Two specific elliptic-curve schemes do almost all the public-key heavy lifting in the chains you'll encounter.

**secp256k1.** An elliptic curve standardised in the early 2000s. Used by Bitcoin, Ethereum, and most of the chain families that followed them. The "256" is the key size in bits: 32 bytes of private key material produce a public key on the curve. The "k1" is a parameter designation distinguishing it from a closely related curve (secp256r1) that some cryptographers were nervous about.

**Ed25519.** A newer elliptic-curve scheme published in 2011. Cleaner mathematics, faster operations, smaller keys with equivalent security to secp256k1. Used by Solana and a growing number of newer chains. Also used outside blockchain in modern systems like SSH and Signal.

For this course you don't need to be able to do elliptic-curve arithmetic by hand. You need to be able to:

- Recognise the names. When a wallet or library mentions secp256k1 or Ed25519, you know what category of object you're looking at.
- Know the key sizes. 32 bytes for the private key in both. The public key is roughly the same size for Ed25519 and a bit larger for secp256k1 depending on a compression option.
- Understand the asymmetry. Computing the public key from the private key is one fast operation. Going the other way is the entire definition of "secure" in this context.

Both schemes are believed to be secure against any classical computer. Both are vulnerable to a sufficiently large quantum computer running Shor's algorithm.

## Generating a key pair

The private key is just a random 32-byte number. Cryptographically random, generated by an entropy source rather than picked by a human. A human-chosen private key is a guessable private key, and the entire security of the scheme depends on the secret being indistinguishable from random noise to anyone who doesn't have it.

```typescript
private_key = 32 random bytes from a secure entropy source
public_key  = curve_multiply(private_key, generator_point)
```

That's the entire key-generation process at the conceptual level. One call to a cryptographic random number generator. One curve operation, the "easy direction" of the one-way function. Done.

The reason this is so short is that all the difficulty lives in two places. First, in the curve mathematics that makes `curve_multiply` a true one-way function: the result is a point on the curve that anyone with the public key can verify is legitimate, but only computable by someone who knew the private key. Second, in the entropy source: a private key with predictable bytes is no private key at all. Most wallet compromises in history are not breaks of the curve. They are weak entropy.

The playground below has a node that does this generation. Click and you'll see a freshly-derived public key appear in microseconds. Change the private-key bytes and watch the public key change completely. The avalanche-like property you saw with hash functions carries over here.

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAEMAWATgA4AjAVkrWLTRVICZjbqVpyB2AGZtq1AAzEBlPn2oh4AFwCeABzREA0gFEAmgAUAggEkASnJDKkGPPLxIEUUAA8oARja0AdPzZtSANj4-aD9KUVpSeEUoNhcXD3Zycj8XUnY3UWkAX3gUYnliB3MAV2oAGzwAY3U0KMgQSgBlZQBbbWaAMQA1ACkUAEUwXQAtYgA5AHU+8YANUgBrBoAJF2oi0grNFHU8NkWAC0xOgBkAWU0AYTNlACc8MDy0atqQcIQAKyRta4AVaj8BfSLdrEagCWjkAQAEWaCEWYD6AHFaNNHqRrtMbAikOpIXgTkUAOYfADu+gAXso+MZrhhiZRmudiUViQBVFDUND6cipRwVACORTAikcfLQtARQz4DQqoxpEGyIGajAwRWuLEKxII8j2rloongBzwBL28ig0DYCowaFKaAq8nVkAExFKVpy12IBIJeAQBKgTpdaGy+EIdWI5CYKBQgUoMe5bD8FD81ECjFoPj84Rcfj8ZiUqiI30002+V0s1ls9kgTigAFpoC5PKQ+P4wqJ+ODwpFXPwvNBSBk+NBM5RyKIXArcvlCvbHKa6hhiLkMEuV8Rl2uVyAFUq16qHaBNShtWbRPqQIbjXPaOP4FabXaHf7XSAUO7Pd7fY7nVagyACEQ-AqahoFEdAKGIFxKFIAQWEoCQIL4Sg2AqQCBDbARZAUFQ1DqSFDAaXQjn0bRSysGw7EKZxIDYGMPGgaAkMHWgh0SFwki7ai+DiNgx1oDMqFEGJSCHCc8gKKsQBnOd6iaVoOh6fpBhGCYplmBZllWdZNm2XYDgwY4zkubdlT3EMDy1HUYFPA00CNE0zT8S1rVte0Q3ka4ijQN0PS9H0-W-QNYGDAC2D7ag2D4WguBg0haBYTgXBA4hKHBPhyAqYSaNzbCiDwgiiJI+ALDIitKOiEcPEoFJYj40Kh1CiIQFqFJKA8PhRGzPgIrYcgQIzC0cjE6c0FnIhXg+L5fn+QFgVBcEoRhOFEWRVF0UxbFcXxIkkFJCkqRpOkGSZVl2U5blSF5AUhRFMUJSlGU5S3eAdxVNUzJAQ9jyss8L3syB-Cc+9XP8gNvPfPyvwDX9-zqPwUFEKRRHYECwIoDCUAivgKnNAR2pcPgQT4bL8zqRZ9CWUjywoiSqJrXwPFCmJ6HxpDzXIWg+A4kIPBSXr6x6mi-HjaBRKnCS9jXSyQCAqKKkXED-ESrq2DQUgVjDDJoBQPxiAqU9WD18IUHBKgBAqKNesoFAYxCNtyDQGNQu4J7FRMt6NQs3Uftsy8oD4wGXMfAKwd8z8n0DABdeAWAJTAcGCupHEUGsY7QAB9NOyCoOgGCYFh2E4bheEEYQxAkKQZBrZQSnKKoahrW5LxrQDgNA1Xw0g6DYPglnkNQ9DqBrb1q-kGsbQEU1byQVUKhwkgKBoehGGYVgOC4Hh+CEERxEkaRMJADBp+uWfFmIBAUBtIgs8X3OV4L9fi63svd8r6uykqJ4G7syfJOIa5Y+ki3FG7cIJQRgtbHuiE+4VDQhCfe+R-5oHkKfc+l9YZAWAeBTu4C4JOl7ihGBA8h4IBHmPNAE8noJxAEnFOKBY4Z2vjnZe+c15F03qXHeFdB43DuA8T+jcTTNwauFSK0VVZxVyNeJKKV+DpUypQYhpDx4-0PjPOejCl551XoXDeJdt7lz3mYVRx80AoIvuoheTCtH3zYXo5+XCq63HuPafh39cx-wASFMKEUoqgnEfFKR4gZFpQyuaSg7jEHILPuYrxpARG+JihIhK0jUpyLCYoooo9lGUIPkfWeV9wwsCjCEWM7AExJGTH4VM6ZMzZiMXk0x0S0EkEKZGaMpT4yJkqdU+MtS-A1ikl-X2CgPFIIAvDRGyM26pDgRjaQ2M2C4zHATZMESAFmOaXDBG7Upmo1mZjBZSz8aEwyVk8hP8YbUOTqnBhrTikxhHGUrpKZOA1LVtmMMEZ7kdPKUmF5aZenvP6YMgRo8tmTNCtMtG3ADk4zxiswIEydmQr2ejWFiz4UnOHpkshFDfzGPybDJFSMUWq2hXMrGcLlmE3qWojZc9wXIsweS9FRyEU1glhgPYQz7IjMiVfSxmi76sN0U-Thhi+XrKaRY7OQqWE6Mfhwgxr8nF8Prtk+AlyaE3LToyklzL9nzKpccypxLdlksNZSjF1Lkwcsljy0eGjb7yofuw-RL9qBOuYdo11djxUqt4S49V5ytxR3AHgNAxILDXDnNWSA7NSCVUgjGJsLhRB9T8BxGingxz9l4OCU8sVGpkiQEgZorg6JRQbClPs5p6KUACJkTIQA?view=true)

## What this enables

Three different operations can be built on top of the priv/pub pair, each using the same mathematical machinery in a different direction.

**Encryption to a public key.** Already covered in the previous lesson. Anyone takes your public key, encrypts a message, and only your private key decrypts. This is used at the edges of blockchain systems but is not how on-chain data is protected.

**Digital signatures.** Use the private key to produce a short value that anyone can verify against the message and the public key. The signature proves that the message was approved by whoever holds the private key, and cannot be forged without it. This is the primitive that authorises every blockchain transaction. The next-but-one lesson takes this apart properly.

**Identity.** Your public key is your address. The chain doesn't know your name, your country, or your email. It knows the public key that goes with the private key you control. Possession of the private key is the entire definition of "you" from the chain's perspective. Lose it and there is no recovery. Steal it and there is no insurance.

That last point is the one that surprises every developer who comes from a system with password resets and customer support. There is no customer support. The private key, and only the private key, is the identity. The next lesson covers exactly how that key gets generated, stored, and recovered.
