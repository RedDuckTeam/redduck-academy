---
id: 74
title: Mnemonic phrases and how a wallet gets created
type: lecture
order: 5
faq:
  - question: Can I lose my crypto if I lose my seed phrase?
    answer: Yes. The mnemonic, or seed phrase, is the wallet, and there is no
      recovery if it is gone. The wallet software does not keep a copy, the
      vendor does not have one, and the chain does not know who you are. Restore
      the same words on a new device and every key and address comes back, but
      without them the funds are unreachable.
  - question: What is a seed phrase and why is it a list of ordinary words?
    answer: A seed phrase is a 12- or 24-word backup defined by a standard called
      BIP 39. It encodes the same random bytes as your private key, but words
      are far easier for a human to write down and read back correctly than 64
      hex characters. Every compliant wallet uses the same fixed list of 2048
      carefully chosen words, so a phrase written on paper backs up the whole
      wallet.
  - question: Is it safe to type my seed phrase into a website or a support form?
    answer: No. Anyone who sees your 12 or 24 words can rebuild every private key
      and address in your wallet on any device, so sharing the phrase means
      sharing everything. There is no read-only version of a seed phrase, and
      any site or message asking for it is a phishing attempt trying to steal
      the entire wallet, not just a login.
  - question: What is the optional passphrase, sometimes called the 25th word?
    answer: It is an extra secret you can add on top of your mnemonic. The same
      words with no passphrase open one wallet, and with your secret passphrase
      they open a completely different, hidden one, which gives you plausible
      deniability if someone forces you to reveal your phrase. The catch is you
      must back up the passphrase separately, because losing it makes the hidden
      funds unreachable even though the mnemonic is intact.
---

> The previous lesson ended on a sentence that should bother you: "the private key, and only the private key, is your identity." If the private key is 32 random bytes, how is a human supposed to back that up safely? You can't memorise hex, you'll mis-type it, you'll lose the paper. The answer is one of the most elegant standards in cryptography, and it's the same standard used by almost every wallet you'll ever touch.

## The problem with 32 random bytes

A private key looks like this:

```
4f3edf983ac636a65a842ce7c78d9aa706d3b113b37b6b1da19c89e5fcca7c84
```

64 hex characters. 32 bytes. Cryptographically random. This is your entire identity on a blockchain. There is no recovery from the issuer because there is no issuer.

Now imagine you have to write that on a piece of paper, store it somewhere safe, and read it back correctly five years from now. You will:

- Mis-write one character and never notice
- Confuse `0` and `O`, or `1` and `l` (hex itself uses only 0–9 and a–f, so it has no O or l — but copying it by hand still invites exactly this kind of visual mix-up)
- Lose the paper to a flood, a fire, or just plain misplacement
- Find it ten years later and not remember which wallet it belonged to

This is a real problem. Early cryptocurrency users lost meaningful amounts of money to exactly this failure mode. So in 2013, a standard was proposed that turned the same 32 bytes of randomness into something humans could actually back up: a short sequence of ordinary English words.

That standard is **BIP 39**.

## The full pipeline

Here's the end-to-end process that runs when you click "create a new wallet" in any modern wallet application.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Wallet creation pipeline: entropy, mnemonic, seed, then master and child keys</title><desc>Four boxes stacked top to bottom and joined by arrows. Entropy becomes a mnemonic phrase, the mnemonic becomes a seed through PBKDF2-HMAC-SHA512, and the seed derives a master key plus a whole tree of child keys and addresses.</desc>
  <rect x="40" y="20" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="45" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">1. Entropy</text>
  <text x="360" y="65" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">128 or 256 random bits from the OS entropy source</text>

<line x1="360" y1="80" x2="360" y2="110" stroke="#565653" stroke-width="2"/>
  <polygon points="355,102 360,112 365,102" fill="#565653"/>

<rect x="40" y="110" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="135" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">2. Mnemonic</text>
  <text x="360" y="155" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">12 or 24 words from a fixed 2048-word list, plus checksum bits</text>

<line x1="360" y1="170" x2="360" y2="200" stroke="#565653" stroke-width="2"/>
  <polygon points="355,192 360,202 365,192" fill="#565653"/>

<rect x="40" y="200" width="640" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="225" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">3. Seed</text>
  <text x="360" y="245" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">64 bytes via PBKDF2-HMAC-SHA512 over the mnemonic + optional passphrase</text>

<line x1="360" y1="260" x2="360" y2="290" stroke="#565653" stroke-width="2"/>
  <polygon points="355,282 360,292 365,282" fill="#565653"/>

<rect x="40" y="290" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="315" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">4. Master key + many child keys + addresses</text>
  <text x="360" y="335" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">a whole tree of key pairs, derived deterministically from the seed</text>
</svg>

Four stages, each with a specific job. Each stage is deterministic: same input always produces the same output. This is why a mnemonic written on paper is a complete backup of every key and every address the wallet has ever generated, even ones it hasn't shown you yet.

## Stage 1: Entropy

The wallet asks the operating system for high-quality random bytes. 128 bits for a 12-word mnemonic, 256 bits for a 24-word one. The bytes come from the OS entropy pool, the same pool that secures TLS connections and SSH sessions on the same machine. A wallet that uses anything weaker is a broken wallet.

This step is short to describe and disastrous to get wrong. Past wallet failures with weak randomness have produced predictable private keys that attackers have systematically drained. The math of the rest of the pipeline only protects you if this first step is genuinely unpredictable.

## Stage 2: Mnemonic generation

The wallet takes the entropy bytes, computes a short **checksum** (the first few bits of a hash of the entropy), and appends it to the entropy. The resulting bit-string is split into 11-bit chunks. Each chunk is a number between 0 and 2047. That number indexes into a fixed list of 2048 English words, defined once and shared by every BIP 39-compliant wallet on earth.

A 12-word example:

```
abandon ability able about above absent absorb abstract absurd abuse access accident
```

These are the first 12 words of the wordlist, used here simply as an illustration. Real mnemonics look more random:

```
army van defense carry jealous true garbage claim echo media make crunch
```

The [wordlist](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt) is the same for every wallet. It contains no two words sharing a four-letter prefix, no plurals of other entries, no words easily confused with each other. This is why "rabb" is enough to uniquely identify "rabbit" when typing into a recovery field, why no wallet ever shows you the word "horsex" instead of "horse," and why entering the wrong word almost always triggers an "invalid mnemonic" error from the checksum.

A 24-word mnemonic runs the same algorithm with more starting randomness — that is the only difference.

## Stage 3: Mnemonic to seed

The mnemonic itself is not the cryptographic input to anything. The seed is. To convert one to the other, the wallet runs:

```typescript
seed = PBKDF2-HMAC-SHA512(
  password   = mnemonic_as_text,
  salt       = "mnemonic" + optional_passphrase,
  iterations = 2048,
  output     = 64 bytes
)
```

PBKDF2 is a key-stretching function: it takes an input and repeatedly hashes it to produce an output, intentionally slowly. The 2,048 iterations are a deliberate cost that adds milliseconds for a legitimate user but multiplies the work required for an attacker brute-forcing weak mnemonics.

The optional **passphrase** is the part most users don't know exists. If you supply one, any string at all, no length limit, the resulting seed is completely different from the seed you'd get with the same mnemonic and no passphrase. This is sometimes called the "25th word" because it acts like an extra hidden word on top of the visible 12 or 24.

Imagine someone forces you to hand over your mnemonic — at a border crossing, or under threat. If the mnemonic opens one obvious wallet, they drain it and believe they got everything. A passphrase prevents this. The same mnemonic with an empty passphrase opens an obvious wallet; with your secret passphrase it opens a completely different, hidden one. An attacker who has the mnemonic can drain the visible wallet but cannot reach the hidden one without also knowing the passphrase — and has no way to know the hidden wallet exists at all. This property is called plausible deniability.

The output of this stage is always 64 bytes regardless of mnemonic length. That 64-byte seed is what the rest of the system actually uses.

## Stage 4: Seed to master key, and everything below

The 64-byte seed feeds into a tree-derivation algorithm that produces a **master key** and then any number of child keys below it. From the master key you can derive child keys, from each child key you can derive grandchildren, and so on, infinitely many key pairs from one seed.

The mechanics of that tree are detailed enough to deserve a treatment of their own, and we'll come back to them in context when they actually matter. For now, the important property is this: **the entire tree is deterministic.** Same seed, same tree. Same mnemonic, same seed, same tree.

This is why a 12-word mnemonic is a complete wallet backup. Restore it on a new device, the wallet runs the same pipeline, and every key and every address shows up in the same order with the same values. Nothing else needs to be saved.

## What this means in practice

Three takeaways that should shape how you think about wallets from here on.

**The mnemonic is the wallet.** Lose it and there is no recovery. The wallet software does not have a copy. The wallet vendor does not have a copy. The chain does not know who you are, only that you control a key derived from it.

**Share the mnemonic and you've shared everything.** Anyone who sees your 12 or 24 words can reconstruct every private key derived from it on any device. There is no "read-only" version of a mnemonic. Phishing attacks that ask for your seed phrase are stealing the entire wallet, not a session token.

**The mnemonic plus a passphrase is two different wallets.** If you use a passphrase, you must back up both the mnemonic and the passphrase, and you must back them up separately. Lose the passphrase and the funds in the hidden wallet are unreachable even though the mnemonic is intact.

The playground below has a mnemonic-generator node. It produces a fresh mnemonic. **Use only the test mnemonics it generates. Never paste a real wallet's mnemonic into any web tool, including this one.**

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAEMAWATgA4AjAVkrWLTRVICZjbqVpyB2AGZtq1AAzEBlPn2oh4AFwCeABzREA0gFEAmgAUAggEkASnJDKkGPPLxIEUUAA8oARja0AdPzZtSANj4-aD9KUVpSeEUoNhcXD3Zycj8XUnY3UWkAX3gUYnliB3MAV2oAGzwAY3U0KMgQfQANPm0ACWhSBABzAGEAFUcigC1NAFUAGQB3NEGAJxGAZQA5DEUEQYraRRQ2dQw-ADVHACE2fXIJsbNlGbwwPLRq2pBSDH3G+flHAHFSJAAvZR-QYtNCLTQAKUcnRGfxmDSQABF9C1etAEAAxCrHXpfahIUh8EbyNC6NiLFx+XoIgDWIwEAEUJgArekAWz+4LGLWILRcCImM0UGG68nmLXB7NI6N6iloVgg2RArMYGCKMxYhQmBHkAAtXLRRPAdWg8J0dfIoNA2IqMGhSmgKsTCJABMRSracjNiJ1OngulBXe60Nl8M6QH4KtRoKJ0BRiC5KKQBCxKBJ43xKGwKhGBKJyAJZAoVGo6gjDPNdGN9NorpZrLZ7JAnNFKJQPNBoJm+NBaD3Ei4kpFonw4mxRC5aH5aFRRDFSD3Fbl8oViY4LXVGs02h0ev0hqNJtM5ksVmsNlsdntDiczhcQIrlcRVernaAtShdZbRIaQMbTebLT8G07QdJ0AzdD0QBQL0fT9TpwKDEMQAIIg-DYdpqDYPhaC4ZNSFoFhOBcaNiEoac+HICp5zYSgzCUVQiDLCsqxreALCsGw7EKZxIBo8gPEoFJYkndCe3QiIQFqFI2z4UQ-ACLC2HIaMp2tHI8gKJsQFXddnled5Ph+f5AWBUEIShGE4URZFUQxLEjhxPECSJEkyQpKlaQZZk2Q5LkeT5AUhRFMUJT+KUZTlW573gR9nw1LT30-GBvyNE0zXXfxgPtR14sDSDoO9X1-RdCDg1gUMiBcJhyGIFAaDQLg0HwuTav8UgKl4KgUkoyhyDo4siAAWTBQaAHlFkMbpaw4htuKgABaYi2A8PxyBiXgMlbDtfCHXjiK8SgAnYHDKGjchaDUqCNMKVkEDQVk7EqIgkAEYkEAAAl1PAMHeqY8mNGZ3rAb7rHejA7E6d6vTANAPowZRFHezpMHkNU0He0o7DtRG3TwWGofupAYfe65iG+tQ2JuO5iUeIgXjeBoPm+X4ASBEEwUhaFYXhJEUTRTFsVxfFCWJUlyUpGk6UZFl2U5bleX5QVhVFcVJWlWV5WipUVTR18QESvVIApH8-3Sy1LttbKwJKoNPUKuCENtJCULqYI0GoSilJQTbSFESNiA6lBaBQFxAj4UhTuoYhRH6hjS3LStq2m+suK0niLq8Sd-D8AlvDcOBJMtHsPG-WgKOgPgYjIvhF2urSdOe178a+n6-t1NBAeBjiwYhqHiBhuGEaRlG0YxrHShx8p8fVB7idJ8mtdi3XNW1Q3oxNtKAMgTL4Et0DctKu3YOKvLgwAXXgFhkawSBcGQsNHEUear7QAB9V+yCoOgGCYFh2E4bgvBBDCDEBIKQMh5rKBKOUKoNR5o3HSvNCMUYYxNRqgmJMKY0yh0zNmCouZ8zUHmn6KB8h5r2lemYcGaoKglhIBQGg9BGDMFYBwLgPB+BCBEOISQ0hCwgGoTMWh3IEAoHtEQT+jCf4sP-uwoBXDQG8IgVAsolRHjwP-BaBQxAZjI10sg6MsZ0GJmTHVbBGYsw5jzAWOiOi9EiLEXQgxqC4wYNMamV0ODLH4OsUQkhRQyEUItM7B+T8X7v0kd-Zhf82GAM4SAnh4CiHXFuPcdRCDzRIPEphbCuEmoEVyLQYi4gyL8EotRSgxCECkPIWgShu8kA0LoZEphv9WEAI4cA7hYC+FUMaUItADjxF1BadImJHT5EJJ6coqmaS4EZK0dpOxaB9HZKwjhageEClERIqUiiVErS0W0bolZQynFrNyZs-JhEim7PIuUw5VSalBOiqAQRtDKrVVqvVRqzU-CtRzh1RIgkKAVF6n0ppZzPloBqnVagDV4V-IBe1TqIKerkEgbMmm8zNG2JObpUZ0T2lyPid0pR-D8j4qhSMhhUS2myLiV0xRSTMWpOxU-F58AXYgEfs-FAyN35VRhd8+FvyDT-NYIC1F3UwXkCFbCn5iLxXIqBV1UFvVWXUweDixBhL6WxM6QoxJfC9UyINZMslLKUlavUS8kJRBeXhNfvKkVCL8ktUlSi4FMqNW3UJggSoGjEFuw9hUL2Ps-ZR0DsHUOR1I7RyeQE2p9SBH9I+XUF1cK3VIs9aqtFsqIUDOpSATNir3USranmn1GK-UPQDRUINAFjl6KICGz25BvYZl9v7aNIcw4R2gFHGOzbTnEFEcMkAbaw0dojT26AQc+1xsHQm-xgS6nBIvuAPGEwLAzHXM2SA51SACQTK2AkLhRAqT8LtGinhxy+14NOb8+EJJ-CQEgVkrh2w4QnGRdoVoOyHRrpkIAA?view=true)

## Where this goes next

You now have the full flow from "random bits" to "a usable wallet." The next lesson goes back to the cryptographic primitives that make this wallet actually do something on a blockchain: digital signatures, the operation that lets you authorise a transaction using a private key without ever revealing it.
