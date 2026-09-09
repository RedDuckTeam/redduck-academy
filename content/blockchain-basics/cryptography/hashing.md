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

> The previous lesson ended with a promise: the next thing you'd learn is the cryptography that makes blockchains possible at all. This lesson keeps that promise by starting with the smallest, simplest cryptographic tool there is: hashing. It's a function that takes any input and returns a short, fixed-size output, and it's the foundation that every blockchain rests on. Everything else in cryptography (signatures, addresses, identity, the integrity of a block) is built on top of it.

## The one-sentence definition

A hash function takes any input, of any size, and returns a fixed-size output. Cryptographic hash functions add a few extra properties that make them safe to use in security-critical contexts.

Run any blockchain-relevant hash function on three different inputs:

```
SHA-256("hello")
  → 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

SHA-256("hello!")
  → ce06092fb948d9ffac7d1a376e404b26b7575bcc11ee05a4615fef4fec3a308b

SHA-256("Lorem ipsum dolor sit amet, consectetur adipiscing elit...")
  → 5bd6045a7697c48316411ff00be02595cf3d8596d99ba12482d18c90d61633cb
```

Three things you can see immediately. The output is always the same length, 256 bits, written as 64 hex characters. One added character (`hello` → `hello!`) produces a completely different output. A long input gets compressed to the same size as a short one.

The playground below has two inputs pre-filled with `hello` and `hello!`, each wired to its own hashing node. The two output hashes share zero structure even though the inputs differ by one character. Edit either input and watch them shift independently. That live behavior is the lesson. The rest of this page is just the formal explanation of what you're seeing.

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAA5j0AWARmOgAZoBjc80lAI2nLXIDYBOAEwoAZvwE8AhgFYQ8AC4BPAA5oiAFQCiADTWyQSpBjxy8SBFFAAPKAFpKPHgDpalPpUpTaA8px5Sp8Aq2dI4A7C7kAsS0fFKhHm4AvvAoEnISFiByaJZyRAAWaAA2RUggySAAtmgSGACuAE5ohJCgAO4EcvlQdLTwhXgA5vl5kFKUFRjFaAzZLcISRVMpDRKDg3gIg1ALS2jJ+C0g4lxsPKE1EhJs5FJ8wnyh0CihKJTClLRSbLQ8DLR6RQqIgACQAggBlEF6AxGExmTLWSCUUICRx8ZgJYh8HjQHjEVGBYJOcShfi0Zj8R7eCqpdKZfK1bqQY4MYTedjSYQ-CR0NDiNA0NgCCQMb58fkSyhseyUNBSBjvCShSJSNBPCnQPECPjQYhsPjEbzleDVWqNZqZDooLpQDx9EADYajKQ8SbTWaWyC7ZYgFCrdabbbexZTA4gAhESLEKQPMXEXkq0IfAnQPii8i8rXoPx8QHKVQszQ6GGGYymcytEBIuyoxx4w20MmPLwOHhEyA8Wj1lGu0LxO5uXi0tIZKvZXIFYqlACEJqqNXqTRa7U6zN6-TQQxGUHG7qKMzmO1DaBWaw2W2Pe3DkZZAjYaD4LwYxEzgvIoV5pHZyoYKFx+KvMq+bAiy4JQqWcIVoidp1n2gjjA40ChP4oQdlI5COP4Aj+LEPACN4LgCCO9JVoyGDMiADBoL8MQCNyGJkPcCwMK8lCJjw3AUsKPBsChKFsAwipyjRUgSLwHjCGgwjkFJDDQLytD6vOZpLl6q42sy9qbtuLpuvAUwHp68wnmegaXiG14ALrwM0gyYDgoAYEgjTUUQrDcNQdCMMwrAcFwvCCCIYiSDIBkuQ01EghICAoAe7lkJ5ND0EwLBkP53BiMFgihTYE5yDYDS6YCEgNPZozHDwpznJc1y3PcjzPGxHxfD8fwAvIpXldFsXxXeVVoGcFxXHVdwPE8LxvC13y-P8NibEodQFQewh5PAt7VgoNh2WgAD6u0eVQyU+Wl7CcJlQWiDl0iHV5KW+el52BUIV3iNIeU5AVRXOjYJyDTVI03GNjWTe8nwze1f1DbVQMNRNzXg21c0LUtNgrXk4bOa5hYgNGsZ8PGiYfimTzpkwWbPGguZ6FjkVoD1cU43jcZSAmyHE9QpMZhTOZ3B9uSFcVnVlWgFX3o+z6vhI76fnqxA-qEf4AQSqShCVItyAzfXHA+T6K1LMtfvLIqK-+eIq8q80IIty3SWtEZHJYW07ftzME6zRPJpzabc1qlO5m7hPs17qZk5mfu83w-Nfbpv265Lb6vrL34m0r5tAai8f64nH5GwraeAarVs22jdvlDZ4B4GgbQGA0oxWFADh8I4xDUKQH6fHQDgdtAHjOJQ5D0LEfC0BSGHwAAXkgSCVHa9b+B4MacNAAhasQ5yJIkQA?view=true)

Those three observations are already most of what you need to know. The sections below also show why blockchains can't exist without hashing.

<svg role="img" viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>"hello", a 50 page novel, and one bit all go into SHA-256, out comes 256 bits</title><desc>Three very different inputs, the text "hello", a 50 page novel, and one bit, each point with an arrow into the SHA-256 hash function box. A single arrow leads from SHA-256 to a result box showing "256 bits, always" and the example hash "2cf24dba...938b9824".</desc>

<defs>

<marker id="arr21" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">

<path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>

</marker>

</defs>

<rect x="30" y="30" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<text x="120" y="60" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">"hello"</text>

<rect x="30" y="95" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<text x="120" y="125" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">"a 50 page novel"</text>

<rect x="30" y="160" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<text x="120" y="190" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">one bit</text>

<rect x="280" y="80" width="160" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>

<text x="360" y="105" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">SHA-256</text>

<text x="360" y="125" text-anchor="middle" font-size="11" fill="#ffffff">hash function</text>

<line x1="210" y1="55" x2="278" y2="100" stroke="#565653" stroke-width="2" marker-end="url(#arr21)"/>

<line x1="210" y1="120" x2="278" y2="115" stroke="#565653" stroke-width="2" marker-end="url(#arr21)"/>

<line x1="210" y1="185" x2="278" y2="135" stroke="#565653" stroke-width="2" marker-end="url(#arr21)"/>

<rect x="510" y="85" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<text x="600" y="105" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">256 bits, always</text>

<text x="600" y="123" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">2cf24dba...938b9824</text>

<line x1="440" y1="110" x2="508" y2="110" stroke="#565653" stroke-width="2" marker-end="url(#arr21)"/>

</svg>

## The properties that make it "cryptographic"

A regular hash function, the kind used in hash tables, only needs to spread inputs evenly across the output range. A cryptographic hash function has to resist an attacker who is actively trying to break it. Four properties matter.

**Deterministic.** The same input always produces the same output. SHA-256 of `"hello"` is the same string on your laptop, on a Bitcoin node in Tokyo, and on a Solana validator in Frankfurt. Without this, no two nodes could ever agree on anything.

**Fast to compute, slow to invert.** Computing the hash of a 1 MB file takes milliseconds. But finding an input that produces a given hash requires trying inputs one by one. For SHA-256, that's roughly 2²⁵⁶ attempts in the worst case, a number comparable to the count of atoms in the observable universe. The asymmetry is the whole point.

**Preimage resistance.** Given a hash output `h`, it's computationally infeasible to find any input `x` such that `hash(x) = h`.

**Collision resistance.** It's computationally infeasible to find any two different inputs `x` and `y` such that `hash(x) = hash(y)`. If you could, you'd have a transaction whose contents you could swap without changing its identifier, which would destroy every signature-based guarantee in the system.

A consequence of these properties is the **avalanche effect**: changing a single bit of input changes roughly half the output bits, in a way that looks completely random. Going from `hello` to `hello!` flips roughly half the bits of the resulting 256-bit value. There's no smooth gradient. Small input changes produce large, unpredictable output changes.

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

## Why blockchains can't exist without it

Two uses are enough to make the point.

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

Change anything in a historical block, even a single bit, and that block's hash changes. The next block's `prev_hash` field no longer matches, so it becomes invalid, and so does every block after it. Tampering with the past is detectable by anyone holding the chain, by recomputing one hash per block. Each block costs only a single hash to verify. This is the property that turns a list of records into a tamper-evident chain.

## The specific functions you'll see

Three names cover almost everything in the ecosystems you'll work in. You don't need to remember the details right now. The point is to recognize the names when they show up in later lessons.

**SHA-256.** Designed by the NSA, published by NIST in 2001, part of the SHA-2 family. This is the hash function Bitcoin uses for almost everything. 256-bit output. In production use for 25 years with no known practical break.

**Keccak-256.** The function Ethereum uses. It won the SHA-3 competition in 2012, and Ethereum adopted it before NIST finalized the standard. The final SHA-3 standard ended up with slightly different padding, so Ethereum's "Keccak-256" and the official "SHA3-256" produce different outputs for the same input even though they share the same underlying algorithm. This surprises many developers the first time they compute an Ethereum hash off-chain with a generic SHA-3 library and get a different answer than they expected.

**RIPEMD-160.** An older function with a 160-bit output. Bitcoin uses it in combination with SHA-256 in a few places. You'll see it again in a later lesson. For now, just notice that it produces shorter outputs than the other two.
