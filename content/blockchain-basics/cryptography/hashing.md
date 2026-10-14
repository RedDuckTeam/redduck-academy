---
id: 70
title: Hashing
type: lecture
order: 1
faq:
  - question: What is a hash function?
    answer: >-
      Any input of any size in, a fixed-size output out. SHA-256 always returns 256 bits,
      written as 64 hex characters.
  - question: Why does changing one character produce a completely different hash?
    answer: >-
      The avalanche effect. One flipped input bit changes about half the output bits.
  - question: How does hashing make a blockchain tamper-evident?
    answer: >-
      Every block stores the hash of the block before it. Change one bit of an old block and
      its hash changes, so the next block's stored previous-hash stops matching and every
      block after it becomes invalid.
  - question: My Keccak-256 hash does not match my SHA3-256 library. Why?
    answer: >-
      Different padding. Ethereum adopted Keccak-256 before NIST finalized SHA-3, and the
      finished standard changed the padding, so the same input gives two different outputs
      from the same underlying algorithm.
  - question: Which hash functions do Bitcoin and Ethereum use?
    answer: >-
      Bitcoin uses SHA-256, and RIPEMD-160 in a few places. Ethereum uses Keccak-256.
---

> The previous lesson ended with a promise: the next thing you'd learn is the cryptography that makes blockchains possible at all. In this lesson, we'll look at hash functions.

## The one-sentence definition

A hash function takes an input of any type and size, and returns an output of a fixed size, no matter how large the input was. Sometimes these are called "digest" functions, but the industry standard term is "hash functions."

Let's run one of the most popular hash functions, SHA-256, on three different inputs:

```
SHA-256("hello")
  → 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

SHA-256("hello!")
  → ce06092fb948d9ffac7d1a376e404b26b7575bcc11ee05a4615fef4fec3a308b

SHA-256("Lorem ipsum dolor sit amet, consectetur adipiscing elit...")
  → 5bd6045a7697c48316411ff00be02595cf3d8596d99ba12482d18c90d61633cb
```

As you can see, the output is always the same length: 256 bits, written as 64 hex characters, no matter the input size.

One added character (`hello` → `hello!`) produced a completely different output. That's another property of hash functions: they produce output that looks random, even though the function itself works exactly the same way every time you call it. If you ran the hash function on "hello" a hundred times, you'd get the same output every time; the function is deterministic. It's the randomness between different inputs that we call the "avalanche effect."

So far, we can infer that hash functions have these properties:

- **Deterministic computation:** a hash function behaves the same way on your laptop, on a Bitcoin node in Tokyo, and on a Solana validator in Frankfurt. If it didn't, no blockchain could use it; blockchains require code to execute identically for every validator in order to reach agreement.
- **Avalanche effect:** even though the function works the same way every time, different inputs produce results that look completely random relative to each other. Flip one bit in the input, and you get a completely different output.

But cryptographic hash functions have more properties than that:

- **Pre-image resistance:** you can't extract the original input from a hash function's output. Plenty of people have tried; nobody has succeeded so far.
- **Collision resistance:** finding two different inputs that produce the same hash is computationally infeasible.
- **Fast to compute, slow to invert:** hashing a 1 MB file takes milliseconds. But finding an input that produces a given hash means trying inputs one by one. For SHA-256, that's roughly 2²⁵⁶ attempts in the worst case, a number comparable to the count of atoms in the observable universe. That asymmetry is the whole point.

These properties all come down to one simple fact: the output gives you no useful information about the input that produced it. So the only way to find an input matching a specific hash is brute force, trying all 2²⁵⁶ possibilities, since each of the 256 output bits can be either 0 or 1. That number is so large that even if you took every computer humanity has ever built and multiplied that by a million trillion, you still couldn't brute-force it in a trillion years. The gap is so vast that "a trillion years" actually undersells it.

<svg role="img" viewBox="0 0 720 180" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>"hello" vs "hellp" hash outputs differing in about half their bits</title><desc>The diagram shows the hash of "hello" above the hash of "hellp", where only one letter changed. Roughly half the bits flip in the output, which is the avalanche effect.</desc>
  <text x="30" y="40" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">"hello"</text>
  <text x="30" y="65" font-family="monospace" font-size="11" fill="#565653">2cf24dba5fb0a30e26e83b2a...</text>
  <text x="30" y="82" font-family="monospace" font-size="11" fill="#565653">...c5b9e29e1b161e5c1fa7425e</text>

<text x="30" y="120" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">"hellp"</text>
  <text x="30" y="145" font-family="monospace" font-size="11" fill="#ed4937">fdd7585e08c4e2afd71dcabd...</text>
  <text x="30" y="162" font-family="monospace" font-size="11" fill="#ed4937">...b4636c89d557a3f42db9e204</text>

<text x="430" y="40" font-size="13" fill="#000000" font-weight="bold">One letter changed</text>
  <text x="430" y="62" font-size="12" fill="#565653">in the input.</text>
  <text x="430" y="100" font-size="13" fill="#000000" font-weight="bold">Roughly half the bits</text>
  <text x="430" y="122" font-size="12" fill="#565653">flip in the output.</text>
  <text x="430" y="160" font-size="12" fill="#565653" font-style="italic">This is the avalanche effect.</text>
</svg>


## The playground

The playground below has two inputs pre-filled with `hello` and `hello!`, each wired to its own hashing node. The two output hashes share zero structure, even though the inputs differ by a single character. Edit either input and watch them shift independently. That live behavior is the real lesson here.

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAA5j0AWARmOgAZoBjc80lAI2nLXIDYBOAEwoAZvwE8AhgFYQ8AC4BPAA5oiAFQCiADTWyQSpBjxy8SBFFAAPKAFpKPHgDpalPpUpTaA8px5Sp8Aq2dI4A7C7kAsS0fFKhHm4AvvAoEnISFiByaJZyRAAWaAA2RUggySAAtmgSGACuAE5ohJCgAO4EcvlQdLTwhXgA5vl5kFKUFRjFaAzZLcISRVMpDRKDg3gIg1ALS2jJ+C0g4lxsPKE1EhJs5FJ8wnyh0CihKJTClLRSbLQ8DLR6RQqIgACQAggBlEF6AxGExmTLWSCUUICRx8ZgJYh8HjQHjEVGBYJOcShfi0Zj8R7eCqpdKZfK1bqQY4MYTedjSYQ-CR0NDiNA0NgCCQMb58fkSyhseyUNBSBjvCShSJSNBPCnQPECPjQYhsPjEbzleDVWqNZqZDooLpQDx9EADYajKQ8SbTWaWyC7ZYgFCrdabbbexZTA4gAhESLEKQPMXEXkq0IfAnQPii8i8rXoPx8QHKVQszQ6GGGYymcytEBIuyoxx4w20MmPLwOHhEyA8Wj1lGu0LxO5uXi0tIZKvZXIFYqlACEJqqNXqTRa7U6zN6-TQQxGUHG7qKMzmO1DaBWaw2W2Pe3DkZZAjYaD4LwYxEzgvIoV5pHZyoYKFx+KvMq+bAiy4JQqWcIVoidp1n2gjjA40ChP4oQdlI5COP4Aj+LEPACN4LgCCO9JVoyGDMiADBoL8MQCNyGJkPcCwMK8lCJjw3AUsKPBsChKFsAwipyjRUgSLwHjCGgwjkFJDDQLytD6vOZpLl6q42sy9qbtuLpuvAUwHp68wnmegaXiG14ALrwM0gyYDgoAYEgjTUUQrDcNQdCMMwrAcFwvCCCIYiSDIBkuQ01EghICAoAe7lkJ5ND0EwLBkP53BiMFgihTYE5yDYDS6YCEgNPZozHDwpznJc1y3PcjzPGxHxfD8fwAvIpXldFsXxXeVVoGcFxXHVdwPE8LxvC13y-P8NibEodQFQewh5PAt7VgoNh2WgAD6u0eVQyU+Wl7CcJlQWiDl0iHV5KW+el52BUIV3iNIeU5AVRXOjYJyDTVI03GNjWTe8nwze1f1DbVQMNRNzXg21c0LUtNgrXk4bOa5hYgNGsZ8PGiYfimTzpkwWbPGguZ6FjkVoD1cU43jcZSAmyHE9QpMZhTOZ3B9uSFcVnVlWgFX3o+z6vhI76fnqxA-qEf4AQSqShCVItyAzfXHA+T6K1LMtfvLIqK-+eIq8q80IIty3SWtEZHJYW07ftzME6zRPJpzabc1qlO5m7hPs17qZk5mfu83w-Nfbpv265Lb6vrL34m0r5tAai8f64nH5GwraeAarVs22jdvlDZ4B4GgbQGA0oxWFADh8I4xDUKQH6fHQDgdtAHjOJQ5D0LEfC0BSGHwAAXkgSCVHa9b+B4MacNAAhasQ5yJIkQA?view=true)

## Why blockchains can't exist without it

**Integrity checking.** This use predates blockchain by decades. Software distributors publish a file alongside its hash. You download the file, hash it yourself, and compare the two. If your hash matches the published one, the file wasn't modified in transit. If even a single byte changed, from a network error, a malicious mirror, anything, your hash will be completely different, and you'll know. This is the simplest possible use of a hash function, and it's the seed of every other security property covered in this course.

**Block linking.** Every block in a blockchain contains the hash of the previous block as one of its fields. The diagram below shows what that looks like in practice.

<svg role="img" viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Block N-1, Block N, and Block N+1 linked by prev_hash fields</title><desc>Three blocks in a row, Block N-1, Block N, and Block N+1, each show a data field and a prev_hash field. Arrows connect each block to the next, showing that a block's prev_hash stores the hash of the previous block.</desc>
  <rect x="40" y="50" width="180" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="130" y="75" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Block N-1</text>
  <line x1="60" y1="85" x2="200" y2="85" stroke="#565653" stroke-width="1"/>
  <text x="130" y="108" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">data</text>
  <text x="130" y="128" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">prev_hash: a3f8...</text>

<rect x="270" y="50" width="180" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="75" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Block N</text>
  <line x1="290" y1="85" x2="430" y2="85" stroke="#565653" stroke-width="1"/>
  <text x="360" y="108" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">data</text>
  <text x="360" y="128" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937">prev_hash: b7c2...</text>

<rect x="500" y="50" width="180" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="75" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Block N+1</text>
  <line x1="520" y1="85" x2="660" y2="85" stroke="#565653" stroke-width="1"/>
  <text x="590" y="108" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">data</text>
  <text x="590" y="128" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937">prev_hash: d4e9...</text>

<line x1="220" y1="100" x2="270" y2="100" stroke="#ed4937" stroke-width="2"/>
  <polygon points="262,95 272,100 262,105" fill="#ed4937"/>
  <line x1="450" y1="100" x2="500" y2="100" stroke="#ed4937" stroke-width="2"/>
  <polygon points="492,95 502,100 492,105" fill="#ed4937"/>

<text x="360" y="180" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Each block carries the hash of the previous one.</text>
</svg>

Change anything in a historical block, even a single bit, and that block's hash changes. The next block's `prev_hash` field no longer matches, so that block becomes invalid, and so does every block after it. Tampering with the past becomes detectable by anyone participating in the network, and verifying each block takes only a single hash comparison. This is the property that turns a list of records into a tamper-evident chain; it's the core idea behind blockchains.
