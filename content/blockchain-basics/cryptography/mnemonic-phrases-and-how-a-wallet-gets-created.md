---
id: 74
title: Mnemonic phrases and how a wallet gets created
type: lecture
order: 5
faq:
  - question: Can I lose my crypto if I lose my seed phrase?
    answer: >-
      Yes, and there is no recovery. The wallet software keeps no copy, the vendor keeps no
      copy, and the chain does not know who you are.
  - question: Why is a seed phrase made of ordinary words instead of a hex string?
    answer: >-
      Words are far easier to write down and read back than 64 hex characters. A BIP 39 phrase
      of 12 or 24 words encodes the same random bits, drawn from a fixed list of 2048 words
      that every compliant wallet shares.
  - question: Is it safe to type my seed phrase into a website or a support form?
    answer: >-
      No. Anyone who sees those 12 or 24 words can rebuild every key and address in your wallet
      on any device. A seed phrase has no read-only form, and anything asking for one is
      phishing for the whole wallet.
  - question: What is the 25th word?
    answer: >-
      An optional passphrase mixed into the seed. The same words with no passphrase open one
      wallet, and with your passphrase a completely different hidden one, which gives you
      plausible deniability if someone forces you to hand over the phrase. Back it up
      separately, because losing it puts the hidden funds out of reach while the mnemonic
      still works.
  - question: How do the words become a private key?
    answer: >-
      PBKDF2-HMAC-SHA512 runs the mnemonic through 2,048 iterations into a 64-byte seed. That
      seed derives a master key and every child key and address below it.
---

> The previous lesson ended with a warning: lose the private key and nobody can restore it for you. If the private key is 32 random bytes, how is a human supposed to back that up safely? Almost every wallet solves this by writing the wallet's randomness down as 12 or 24 ordinary English words.

## The problem with 32 random bytes

A private key looks like this:

```
4f3edf983ac636a65a842ce7c78d9aa706d3b113b37b6b1da19c89e5fcca7c84
```

That is 32 random bytes written as 64 hex characters. This is your entire identity on a blockchain, and nobody can reissue it if you lose it.

Now imagine you have to write that on a piece of paper, store it somewhere safe, and read it back correctly five years from now. You will:

- Mis-write one character and never notice
- Lose the paper to a flood, a fire, or just plain misplacement
- Find it ten years later and not remember which wallet it belonged to

Early cryptocurrency users lost money this way. So in 2013, a standard called **BIP 39** was proposed that turned a wallet's randomness into something humans could back up: a short sequence of ordinary English words, called a mnemonic or a seed phrase.

## The full pipeline

This is the process that runs when you click "create a new wallet" in any modern wallet application.

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

Every stage after the first is deterministic: the same input always produces the same output. This is why a mnemonic written on paper is a complete backup of every key and every address the wallet has ever generated, even ones it hasn't shown you yet.

## Stage 1: Entropy

The wallet asks the operating system for high-quality random bytes, called entropy: 128 bits for a 12-word mnemonic, 256 bits for a 24-word one. The bytes come from the OS entropy pool, the same pool that secures TLS connections and SSH sessions on the same machine.

Wallets with weak randomness have produced predictable private keys, and attackers have drained them. The math of the rest of the pipeline only protects you if this first step is unpredictable.

## Stage 2: Mnemonic generation

The wallet takes the entropy bytes, computes a short **checksum** (the first few bits of a hash of the entropy), and appends it to the entropy. The resulting bit-string is split into 11-bit chunks. Each chunk is a number between 0 and 2047, and that number picks one word from a [fixed list of 2048 English words](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt), defined once and shared by every BIP 39-compliant wallet.

A 12-word mnemonic looks like this:

```
army van defense carry jealous true garbage claim echo media make crunch
```

The wordlist contains no two words sharing a four-letter prefix, no plurals of other entries, and no words easily confused with each other. This is why "rabb" is enough to uniquely identify "rabbit" when typing into a recovery field. The checksum is why entering a wrong word usually triggers an "invalid mnemonic" error.

The mapping from bits to words is reversible, so the words are the entropy itself in readable form, and re-entering them reproduces the same bits. The phrase is not a password that opens a key stored somewhere else.

## Stage 3: Mnemonic to seed

The wallet does not compute keys from the words directly. It first converts the mnemonic into a **seed** with a function called PBKDF2-HMAC-SHA512. PBKDF2 is a key-stretching function: it takes an input and repeatedly hashes it to produce an output, intentionally slowly. Here it runs 2,048 iterations, a deliberate cost that adds milliseconds for a legitimate user but multiplies the work required for an attacker brute-forcing weak mnemonics.

The same computation takes an optional **passphrase**, which most users don't know exists. If you supply one (any string, of any length), the resulting seed is completely different from the seed you'd get with the same mnemonic and no passphrase. It is sometimes called the "25th word" because it acts like an extra hidden word on top of the visible 12 or 24.

Imagine someone forces you to hand over your mnemonic, at a border crossing or under threat. The mnemonic with an empty passphrase opens one wallet. With your secret passphrase it opens a completely different, hidden one. An attacker who has the mnemonic can drain the visible wallet but cannot reach the hidden one without also knowing the passphrase, and has no way to know the hidden wallet exists at all. This property is called plausible deniability.

The seed is always 64 bytes regardless of mnemonic length, and it is what the rest of the system uses.

## Stage 4: Seed to master key, and everything below

The 64-byte seed feeds into a tree-derivation algorithm that produces a **master key** and then any number of child keys below it. From the master key you can derive child keys, from each child key you can derive grandchildren, and so on, infinitely many key pairs from one seed.

The mechanics of that tree are outside this lesson. The property that matters here is that **the entire tree is deterministic**: the same mnemonic gives the same seed, and the same seed gives the same tree. Restore the mnemonic on a new device, the wallet runs the same pipeline, and every key and every address shows up in the same order with the same values.

## Three rules for handling a seed phrase

**The mnemonic is the wallet.** Lose it and there is no recovery. Neither the wallet software nor the wallet vendor has a copy, and the chain does not know who you are, only that you control a key derived from it.

**Share the mnemonic and you've shared everything.** Anyone who sees your 12 or 24 words can reconstruct every private key derived from it on any device. There is no "read-only" version of a mnemonic. A phishing site that asks for your seed phrase is asking for the entire wallet.

**The mnemonic plus a passphrase is two different wallets.** If you use a passphrase, you must back up both the mnemonic and the passphrase, and you must back them up separately. Lose the passphrase and the funds in the hidden wallet are unreachable even though the mnemonic is intact.

The playground below has a mnemonic-generator node that produces a fresh mnemonic. **Use only the test mnemonics it generates. Never paste a real wallet's mnemonic into any web tool, including this one.**

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAEMAWATgA4AjAVkrWLTRVICZjbqVpyB2AGZtq1AAzEBlPn2oh4AFwCeABzREA0gFEAmgAUAggEkASnJDKkGPPLxIEUUAA8oARja0AdPzZtSANj4-aD9KUVpSeEUoNhcXD3Zycj8XUnY3UWkAX3gUYnliB3MAV2oAGzwAY3U0KMgQfQANPm0ACWhSBABzAGEAFUcigC1NAFUAGQB3NEGAJxGAZQA5DEUEQYraRRQ2dQw-ADVHACE2fXIJsbNlGbwwPLRq2pBSDH3G+flHAHFSJAAvZR-QYtNCLTQAKUcnRGfxmDSQABF9C1etAEAAxCrHXpfahIUh8EbyNC6NiLFx+XoIgDWIwEAEUJgArekAWz+4LGLWILRcCImM0UGG68nmLXB7NI6N6iloVgg2RArMYGCKMxYhQmBHkAAtXLRRPAdWg8J0dfIoNA2IqMGhSmgKsTCJABMRSracjNiJ1OngulBXe60Nl8M6QH4KtRoKJ0BRiC5KKQBCxKBJ43xKGwKhGBKJyAJZAoVGo6gjDPNdGN9NorpZrLZ7JAnNFKJQPNBoJm+NBaD3Ei4kpFonw4mxRC5aH5aFRRDFSD3Fbl8oViY4LXVGs02h0ev0hqNJtM5ksVmsNlsdntDiczhcQIrlcRVernaAtShdZbRIaQMbTebLT8G07QdJ0AzdD0QBQL0fT9TpwKDEMQAIIg-DYdpqDYPhaC4ZNSFoFhOBcaNiEoac+HICp5zYSgzCUVQiDLCsqxreALCsGw7EKZxIBo8gPEoFJYkndCe3QiIQFqFI2z4UQ-ACLC2HIaMp2tHI8gKJsQFXddnled5Ph+f5AWBUEIShGE4URZFUQxLEjhxPECSJEkyQpKlaQZZk2Q5LkeT5AUhRFMUJT+KUZTlW573gR9nw1LT30-GBvyNE0zXXfxgPtR14sDSDoO9X1-RdCDg1gUMiBcJhyGIFAaDQLg0HwuTav8UgKl4KgUkoyhyDo4siAAWTBQaAHlFkMbpaw4htuKgABaYi2A8PxyBiXgMlbDtfCHXjiK8SgAnYHDKGjchaDUqCNMKVkEDQVk7EqIgkAEYkEAAAl1PAMHeqY8mNGZ3rAb7rHejA7E6d6vTANAPowZRFHezpMHkNU0He0o7DtRG3TwWGofupAYfe65iG+tQ2JuO5iUeIgXjeBoPm+X4ASBEEwUhaFYXhJEUTRTFsVxfFCWJUlyUpGk6UZFl2U5bleX5QVhVFcVJWlWV5WipUVTR18QESvVIApH8-3Sy1LttbKwJKoNPUKuCENtJCULqYI0GoSilJQTbSFESNiA6lBaBQFxAj4UhTuoYhRH6hjS3LStq2m+suK0niLq8Sd-D8AlvDcOBJMtHsPG-WgKOgPgYjIvhF2urSdOe178a+n6-t1NBAeBjiwYhqHiBhuGEaRlG0YxrHShx8p8fVB7idJ8mtdi3XNW1Q3oxNtKAMgTL4Et0DctKu3YOKvLgwAXXgFhkawSBcGQsNHEUear7QAB9V+yCoOgGCYFh2E4bgvBBDCDEBIKQMh5rKBKOUKoNR5o3HSvNCMUYYxNRqgmJMKY0yh0zNmCouZ8zUHmn6KB8h5r2lemYcGaoKglhIBQGg9BGDMFYBwLgPB+BCBEOISQ0hCwgGoTMWh3IEAoHtEQT+jCf4sP-uwoBXDQG8IgVAsolRHjwP-BaBQxAZjI10sg6MsZ0GJmTHVbBGYsw5jzAWOiOi9EiLEXQgxqC4wYNMamV0ODLH4OsUQkhRQyEUItM7B+T8X7v0kd-Zhf82GAM4SAnh4CiHXFuPcdRCDzRIPEphbCuEmoEVyLQYi4gyL8EotRSgxCECkPIWgShu8kA0LoZEphv9WEAI4cA7hYC+FUMaUItADjxF1BadImJHT5EJJ6coqmaS4EZK0dpOxaB9HZKwjhageEClERIqUiiVErS0W0bolZQynFrNyZs-JhEim7PIuUw5VSalBOiqAQRtDKrVVqvVRqzU-CtRzh1RIgkKAVF6n0ppZzPloBqnVagDV4V-IBe1TqIKerkEgbMmm8zNG2JObpUZ0T2lyPid0pR-D8j4qhSMhhUS2myLiV0xRSTMWpOxU-F58AXYgEfs-FAyN35VRhd8+FvyDT-NYIC1F3UwXkCFbCn5iLxXIqBV1UFvVWXUweDixBhL6WxM6QoxJfC9UyINZMslLKUlavUS8kJRBeXhNfvKkVCL8ktUlSi4FMqNW3UJggSoGjEFuw9hUL2Ps-ZR0DsHUOR1I7RyeQE2p9SBH9I+XUF1cK3VIs9aqtFsqIUDOpSATNir3USranmn1GK-UPQDRUINAFjl6KICGz25BvYZl9v7aNIcw4R2gFHGOzbTnEFEcMkAbaw0dojT26AQc+1xsHQm-xgS6nBIvuAPGEwLAzHXM2SA51SACQTK2AkLhRAqT8LtGinhxy+14NOb8+EJJ-CQEgVkrh2w4QnGRdoVoOyHRrpkIAA?view=true)
