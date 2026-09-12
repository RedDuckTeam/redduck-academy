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

> The previous lesson ended with a promise: the next thing you'd learn is the cryptography that makes blockchains possible at all. In this lesson we'll examine hash functions.

## The one-sentence definition

Hash functions take content of any input and type, and return an output of a fixed size, no matter the input size. Sometimes they're called 'digest' functions but the industry standard is to refer to them as hash functions. 

Let's run one of the most popular hash functions SHA-256 on three different inputs:

```
SHA-256("hello")
  → 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

SHA-256("hello!")
  → ce06092fb948d9ffac7d1a376e404b26b7575bcc11ee05a4615fef4fec3a308b

SHA-256("Lorem ipsum dolor sit amet, consectetur adipiscing elit...")
  → 5bd6045a7697c48316411ff00be02595cf3d8596d99ba12482d18c90d61633cb
```

As you can see, the output is always the same length, 256 bits, written as 64 hex characters, no matter the input size. 

One added character (`hello` → `hello!`) produced a completely different output, and that's one more property of hash functions: they produce output that looks very random, even though the hash function itself works the same way every time you call it. So if you were to run a hash function on 'hello' multiple times, you'd get the same output - because the function is deterministic. The randomness in the outputs is what we call 'avalance effect'.

So far we can infer that the hash functions have the following properties:

- **Deterministic computations:** hash function behaviour is the same on your laptop, on a Bitcoin node in Tokyo, and on a Solana validator in Frankfurt. If it were different, no blockchain could use them, as blockchains require the code to execute in the same way for all validators in order to reach an agreement.
- **Avalanche effect:** Despite the hash function working the same way every time you run it, you still get random-looking results for different inputs. One bit flipped in your input and you now have a completely different output again.

But there are more properties that cryptographic hash functions follow:

- **Pre-image resistance:** We can't extract the initial input from the output of a hash function. Many people tried, everyone failed so far.
- **Collision resistance:** Finding another input that produces the same hash as some other input is computationally impossible.
- **Fast to compute, slow to invert:** Computing the hash of a 1 MB file takes milliseconds. But finding an input that produces a given hash requires trying inputs one by one. For SHA-256, that's roughly 2²⁵⁶ attempts in the worst case, a number comparable to the count of atoms in the observable universe. The asymmetry is the whole point.

The above properties are based on one simple constraint - we can't get any useful information from the output regarding the inputs that they were processed with, so the best we can do to find an input for a specific hash is bruteforcing them. That's 2^256 attempts, because of 256 bits in the output where each bit can have 2 possible values (1 or 0) gives us exactly that many attempts to try. This number is so big, that if we were to take all the computers that humanity ever produced and multiply that by a million of trillions, we would still not be able to bruteforce that in a trillion years. The gap is so huge that statement of trillion years is actually underselling it.

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

The playground below has two inputs pre-filled with `hello` and `hello!`, each wired to its own hashing node. The two output hashes share zero structure even though the inputs differ by one character. Edit either input and watch them shift independently. That live behavior is the practical lesson.

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAA5j0AWARmOgAZoBjc80lAI2nLXIDYBOAEwoAZvwE8AhgFYQ8AC4BPAA5oiAFQCiADTWyQSpBjxy8SBFFAAPKAFpKPHgDpalPpUpTaA8px5Sp8Aq2dI4A7C7kAsS0fFKhHm4AvvAoEnISFiByaJZyRAAWaAA2RUggySAAtmgSGACuAE5ohJCgAO4EcvlQdLTwhXgA5vl5kFKUFRjFaAzZLcISRVMpDRKDg3gIg1ALS2jJ+C0g4lxsPKE1EhJs5FJ8wnyh0CihKJTClLRSbLQ8DLR6RQqIgACQAggBlEF6AxGExmTLWSCUUICRx8ZgJYh8HjQHjEVGBYJOcShfi0Zj8R7eCqpdKZfK1bqQY4MYTedjSYQ-CR0NDiNA0NgCCQMb58fkSyhseyUNBSBjvCShSJSNBPCnQPECPjQYhsPjEbzleDVWqNZqZDooLpQDx9EADYajKQ8SbTWaWyC7ZYgFCrdabbbexZTA4gAhESLEKQPMXEXkq0IfAnQPii8i8rXoPx8QHKVQszQ6GGGYymcytEBIuyoxx4w20MmPLwOHhEyA8Wj1lGu0LxO5uXi0tIZKvZXIFYqlACEJqqNXqTRa7U6zN6-TQQxGUHG7qKMzmO1DaBWaw2W2Pe3DkZZAjYaD4LwYxEzgvIoV5pHZyoYKFx+KvMq+bAiy4JQqWcIVoidp1n2gjjA40ChP4oQdlI5COP4Aj+LEPACN4LgCCO9JVoyGDMiADBoL8MQCNyGJkPcCwMK8lCJjw3AUsKPBsChKFsAwipyjRUgSLwHjCGgwjkFJDDQLytD6vOZpLl6q42sy9qbtuLpuvAUwHp68wnmegaXiG14ALrwM0gyYDgoAYEgjTUUQrDcNQdCMMwrAcFwvCCCIYiSDIBkuQ01EghICAoAe7lkJ5ND0EwLBkP53BiMFgihTYE5yDYDS6YCEgNPZozHDwpznJc1y3PcjzPGxHxfD8fwAvIpXldFsXxXeVVoGcFxXHVdwPE8LxvC13y-P8NibEodQFQewh5PAt7VgoNh2WgAD6u0eVQyU+Wl7CcJlQWiDl0iHV5KW+el52BUIV3iNIeU5AVRXOjYJyDTVI03GNjWTe8nwze1f1DbVQMNRNzXg21c0LUtNgrXk4bOa5hYgNGsZ8PGiYfimTzpkwWbPGguZ6FjkVoD1cU43jcZSAmyHE9QpMZhTOZ3B9uSFcVnVlWgFX3o+z6vhI76fnqxA-qEf4AQSqShCVItyAzfXHA+T6K1LMtfvLIqK-+eIq8q80IIty3SWtEZHJYW07ftzME6zRPJpzabc1qlO5m7hPs17qZk5mfu83w-Nfbpv265Lb6vrL34m0r5tAai8f64nH5GwraeAarVs22jdvlDZ4B4GgbQGA0oxWFADh8I4xDUKQH6fHQDgdtAHjOJQ5D0LEfC0BSGHwAAXkgSCVHa9b+B4MacNAAhasQ5yJIkQA?view=true)

## Why blockchains can't exist without it

**Integrity checking.** This one predates blockchain by decades. Software distributors publish a file alongside its hash. You download the file, hash it yourself, and compare. If your hash matches the published hash, the file wasn't modified in transit. If even one byte was changed, by a network error, a malicious mirror, anything, your hash will be completely different from the published one and you'll know. This is the simplest possible use of a hash function and it's the seed of every other security property in the rest of the course.

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

Change anything in a historical block, even a single bit, and that block's hash changes. The next block's `prev_hash` field no longer matches, so it becomes invalid, and so does every block after it. Tampering with the past is detectable by anyone participating in the network. Each block takes only a single hash to verify. This is the property that turns a list of records into a tamper-evident chain and it's the core idea behind blockchains.
