---
id: 73
title: Public-key cryptography
type: lecture
order: 4
faq:
  - question: How can two keys be mathematically linked if neither reveals the other?
    answer: >-
      Public-key cryptography uses a one-way function. Computing the public key from the
      private key takes microseconds. Reversing that step would take longer than the lifetime
      of the universe.
  - question: What is a private key, exactly?
    answer: >-
      32 random bytes from a secure entropy source. Your public key is derived from it, and
      your address from the public key. Predictable bytes make a guessable key, and most
      wallet compromises came from weak entropy.
  - question: What are secp256k1 and Ed25519?
    answer: >-
      The two elliptic-curve schemes behind almost all blockchain keys. Bitcoin and Ethereum
      use secp256k1. Solana uses Ed25519, published in 2011 and also used by SSH and Signal.
      Both take a 32-byte private key.
  - question: What happens if I lose my private key?
    answer: >-
      Nothing can be done. There is no reset and no support line. The network knows only the
      public key that pairs with your key, never your name.
  - question: Can a quantum computer break these keys?
    answer: >-
      A large enough one running Shor's algorithm, yes. No ordinary computer can.
---

> The previous lesson introduced the idea of a key pair without explaining how such a thing is possible. This lesson is about what makes that work.

## Proving who you are without revealing the secret

You need a way to prove to anyone in the world that you are who you say you are, **without revealing the secret that makes you "you."**

A password doesn't work for this. Showing your password to a verifier means they now have your password and can pretend to be you. A shared key, as in [symmetric encryption](/courses/blockchain-basics/cryptography/symmetric-and-asymmetric-encryption), doesn't work either, because you'd need to share it in advance with every party, including people you've never met.

What you need is a pair of values, mathematically linked, with these properties:

1. One value (the secret) generates the other (the public proof token) easily.
2. The reverse direction (recovering the secret from the public token) is computationally infeasible.
3. The secret can be used to "sign" or "decrypt" things in a way only the holder of the secret could do.
4. The public token can be used by anyone to verify the work without ever holding the secret.

This is the key pair from the previous lesson. The secret is the private key, and the public token is the public key.

## A one-way function links the two keys

The mathematical idea underneath every key pair is a **one-way function**, an operation that is easy to compute in one direction and infeasible to reverse.

Multiplying two prime numbers (numbers that divide only by 1 and by themselves) gives a small example. Multiplying 61 by 53 takes one step and gives 3233. The simple way back from 3233 to 61 and 53 is to try divisors one after another, 2, 3, 4 and so on, until 53 divides it evenly. With two numbers twice as long, the multiplication is still quick, and the list of divisors to try is about a hundred times longer.

<svg role="img" viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Private key to public key: easy forward, infeasible reverse</title><desc>A solid arrow shows deriving the public key from the private key takes milliseconds. A dashed arrow shows the reverse is infeasible, taking longer than the age of the universe. This one-way function runs every time you use your wallet.</desc>
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

A key pair uses a different operation with the same property, at a much larger scale. The forward direction takes the private key as input and produces the public key as output, and any device can compute it in a fraction of a second. Reversing it requires an attacker to try enormous numbers of possibilities, and the schemes are designed so that even the largest computer clusters humanity has built would not finish reversing one in the lifetime of the universe.

## Bitcoin and Ethereum use secp256k1, Solana uses Ed25519

Two elliptic-curve schemes do almost all of the public-key work in the chains you'll encounter. In both, the one-way operation is a calculation on an elliptic curve. For this course you don't need to be able to do elliptic-curve arithmetic by hand. **secp256k1** is used by Bitcoin, Ethereum, and most of the chain families that followed them. **Ed25519** is newer and is used by Solana and a growing number of newer chains. Both use a 32-byte private key. Both schemes are believed to be secure against any classical computer, and both are vulnerable to a sufficiently large quantum computer running Shor's algorithm.

## A key pair starts from 32 random bytes

The private key is a random 32-byte number, generated by an entropy source (a source of randomness) and not picked by a human. A human-chosen private key is a guessable private key, and the security of the scheme depends on the secret being indistinguishable from random noise to anyone who doesn't have it.

```text
private_key = 32 random bytes from a secure entropy source
public_key  = curve_multiply(private_key, generator_point)
```

Key generation is one call to a cryptographic random number generator and one curve operation, the easy direction of the one-way function. Most wallet compromises in history are not breaks of the curve but weak entropy, meaning private keys with predictable bytes.

The playground below has a node that does this generation. Click and you'll see a freshly-derived public key. Change the private-key bytes and watch the public key change completely. The avalanche-like property you saw with hash functions carries over here.

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAEMAWATgA4AjAVkrWLTRVICZjbqVpyB2AGZtq1AAzEBlPn2oh4AFwCeABzREA0gFEAmgAUAggEkASnJDKkGPPLxIEUUAA8oARja0AdPzZtSANj4-aD9KUVpSeEUoNhcXD3Zycj8XUnY3UWkAX3gUYnliB3MAV2oAGzwAY3U0KMgQSgBlZQBbbWaAMQA1ACkUAEUwXQAtYgA5AHU+8YANUgBrBoAJF2oi0grNFHU8NkWAC0xOgBkAWU0AYTNlACc8MDy0atqQcIQAKyRta4AVaj8BfSLdrEagCWjkAQAEWaCEWYD6AHFaNNHqRrtMbAikOpIXgTkUAOYfADu+gAXso+MZrhhiZRmudiUViQBVFDUND6cipRwVACORTAikcfLQtARQz4DQqoxpEGyIGajAwRWuLEKxII8j2rloongBzwBL28ig0DYCowaFKaAq8nVkAExFKVpy12IBIJeAQBKgTpdaGy+EIdWI5CYKBQgUoMe5bD8FD81ECjFoPj84Rcfj8ZiUqiI30002+V0s1ls9kgTigAFpoC5PKQ+P4wqJ+ODwpFXPwvNBSBk+NBM5RyKIXArcvlCvbHKa6hhiLkMEuV8Rl2uVyAFUq16qHaBNShtWbRPqQIbjXPaOP4FabXaHf7XSAUO7Pd7fY7nVagyACEQ-AqahoFEdAKGIFxKFIAQWEoCQIL4Sg2AqQCBDbARZAUFQ1DqSFDAaXQjn0bRSysGw7EKZxIDYGMPGgaAkMHWgh0SFwki7ai+DiNgx1oDMqFEGJSCHCc8gKKsQBnOd6iaVoOh6fpBhGCYplmBZllWdZNm2XYDgwY4zkubdlT3EMDy1HUYFPA00CNE0zT8S1rVte0Q3ka4ijQN0PS9H0-W-QNYGDAC2D7ag2D4WguBg0haBYTgXBA4hKHBPhyAqYSaNzbCiDwgiiJI+ALDIitKOiEcPEoFJYj40Kh1CiIQFqFJKA8PhRGzPgIrYcgQIzC0cjE6c0FnIhXg+L5fn+QFgVBcEoRhOFEWRVF0UxbFcXxIkkFJCkqRpOkGSZVl2U5blSF5AUhRFMUJSlGU5S3eAdxVNUzJAQ9jyss8L3syB-Cc+9XP8gNvPfPyvwDX9-zqPwUFEKRRHYECwIoDCUAivgKnNAR2pcPgQT4bL8zqRZ9CWUjywoiSqJrXwPFCmJ6HxpDzXIWg+A4kIPBSXr6x6mi-HjaBRKnCS9jXSyQCAqKKkXED-ESrq2DQUgVjDDJoBQPxiAqU9WD18IUHBKgBAqKNesoFAYxCNtyDQGNQu4J7FRMt6NQs3Uftsy8oD4wGXMfAKwd8z8n0DABdeAWAJTAcGCupHEUGsY7QAB9NOyCoOgGCYFh2E4bheEEYQxAkKQZBrZQSnKKoahrW5LxrQDgNA1Xw0g6DYPglnkNQ9DqBrb1q-kGsbQEU1byQVUKhwkgKBoehGGYVgOC4Hh+CEERxEkaRMJADBp+uWfFmIBAUBtIgs8X3OV4L9fi63svd8r6uykqJ4G7syfJOIa5Y+ki3FG7cIJQRgtbHuiE+4VDQhCfe+R-5oHkKfc+l9YZAWAeBTu4C4JOl7ihGBA8h4IBHmPNAE8noJxAEnFOKBY4Z2vjnZe+c15F03qXHeFdB43DuA8T+jcTTNwauFSK0VVZxVyNeJKKV+DpUypQYhpDx4-0PjPOejCl551XoXDeJdt7lz3mYVRx80AoIvuoheTCtH3zYXo5+XCq63HuPafh39cx-wASFMKEUoqgnEfFKR4gZFpQyuaSg7jEHILPuYrxpARG+JihIhK0jUpyLCYoooo9lGUIPkfWeV9wwsCjCEWM7AExJGTH4VM6ZMzZiMXk0x0S0EkEKZGaMpT4yJkqdU+MtS-A1ikl-X2CgPFIIAvDRGyM26pDgRjaQ2M2C4zHATZMESAFmOaXDBG7Upmo1mZjBZSz8aEwyVk8hP8YbUOTqnBhrTikxhHGUrpKZOA1LVtmMMEZ7kdPKUmF5aZenvP6YMgRo8tmTNCtMtG3ADk4zxiswIEydmQr2ejWFiz4UnOHpkshFDfzGPybDJFSMUWq2hXMrGcLlmE3qWojZc9wXIsweS9FRyEU1glhgPYQz7IjMiVfSxmi76sN0U-Thhi+XrKaRY7OQqWE6Mfhwgxr8nF8Prtk+AlyaE3LToyklzL9nzKpccypxLdlksNZSjF1Lkwcsljy0eGjb7yofuw-RL9qBOuYdo11djxUqt4S49V5ytxR3AHgNAxILDXDnNWSA7NSCVUgjGJsLhRB9T8BxGingxz9l4OCU8sVGpkiQEgZorg6JRQbClPs5p6KUACJkTIQA?view=true)

## The private key is your identity on the chain

Your address is derived from your public key. The chain doesn't know your name, your country, or your email. It knows the public key that goes with the private key you control, so possession of the private key is the definition of "you" from the chain's perspective.

You prove that you hold the private key by signing a message. The private key produces a short value, a signature, that anyone can check against the message and your public key, and nobody can forge it without the private key. The key itself is not revealed in the process. Every blockchain transaction is authorised this way, and the [digital signatures lesson](/courses/blockchain-basics/cryptography/digital-signatures-and-signature-recovery) covers how it works.

Anyone can also encrypt a message to your public key, as in the [previous lesson](/courses/blockchain-basics/cryptography/symmetric-and-asymmetric-encryption), but a public chain does not protect its data this way.

Only you know the private key, so nobody can restore it for you. If you lose it, there is no recovery and no customer support to call. If someone steals it, there is no insurance.

The [next lesson](/courses/blockchain-basics/cryptography/mnemonic-phrases-and-how-a-wallet-gets-created) covers how a wallet generates that key and how you back it up.
