# Symmetric and asymmetric encryption

_type: lecture_

> Most developers walk into web3 assuming the blockchain "encrypts" their data. It doesn't. Almost nothing on a public chain is encrypted at the protocol level, and understanding why that's true is the difference between a working mental model and a confused one. This lesson starts with what encryption actually is, then explains where it lives in your stack and where it doesn't.

## The misconception

Ask a backend engineer what protects their data on a blockchain and most will answer "encryption." It sounds right. The space is full of cryptographic jargon, transactions are signed, addresses look like cryptographic gibberish, the chain is described as "secure," so encryption must be doing the work somewhere.

It isn't. Public blockchains do not encrypt transactions, balances, contract storage, or anything else at the protocol level. Every byte of state on a public chain is readable by anyone with a node. Your balance, every transaction you've ever sent, every piece of data you've stored on-chain: all public, all permanently visible.

What protects you on a blockchain is **authentication** (proving you authorized an action) and **integrity** (proving data wasn't tampered with). These properties come from hashing and from another cryptographic primitive covered later in this module. They don't come from encryption.

That said, encryption is real infrastructure on the internet, and it does show up around the edges of blockchain systems at specific places. Knowing where is the goal of this lesson.

## What encryption actually is

Encryption transforms data using a **key** so that only someone with the right key can transform it back. The transformed data is called **ciphertext** and looks like random noise. The original data is **plaintext**. Without the key, ciphertext is meant to be useless, with the key, it returns to the exact original byte for byte. The strength of an encryption scheme is the gap between those two outcomes: how expensive it is to recover the plaintext without the key.

This is what makes encryption different from encoding. Encoding has no key and anyone can reverse it. Encryption has a key and nobody without it can reverse it in any practical amount of time.

There are two families of encryption schemes that differ in how the key works.

## Symmetric encryption

The simplest model. There is one key. Whoever has the key can encrypt new data and decrypt existing data. Both directions use the same key.

<svg viewBox="0 0 790 220" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <rect x="30" y="80" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="90" y="105" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Alice</text>
  <text x="90" y="125" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">plaintext</text>

<rect x="200" y="80" width="120" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="260" y="105" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">encrypt</text>
  <text x="260" y="125" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">with shared key</text>

<rect x="370" y="80" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="430" y="105" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">ciphertext</text>
  <text x="430" y="125" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">(random bytes)</text>

<rect x="540" y="80" width="120" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="600" y="105" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">decrypt</text>
  <text x="600" y="125" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">with shared key</text>

<line x1="150" y1="110" x2="200" y2="110" stroke="#565653" stroke-width="2"/>
  <polygon points="192,105 202,110 192,115" fill="#565653"/>
  <line x1="320" y1="110" x2="370" y2="110" stroke="#565653" stroke-width="2"/>
  <polygon points="362,105 372,110 362,115" fill="#565653"/>
  <line x1="490" y1="110" x2="540" y2="110" stroke="#565653" stroke-width="2"/>
  <polygon points="532,105 542,110 532,115" fill="#565653"/>
  <line x1="660" y1="110" x2="700" y2="110" stroke="#565653" stroke-width="2"/>
  <polygon points="692,105 702,110 692,115" fill="#565653"/>

<text x="720" y="105" font-size="13" fill="#000000" font-weight="bold">Bob</text>
  <text x="720" y="125" font-family="monospace" font-size="11" fill="#565653">plaintext</text>

<text x="380" y="190" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Same key on both ends. Whoever has the key can read and write.</text>
</svg>

The standard algorithm here is **AES** (Advanced Encryption Standard), specifically AES-256, which uses a 256-bit key. AES-256 is what your operating system uses to encrypt your disk, what password managers use to encrypt their vaults, and what almost every "encrypted at rest" system you've ever heard of relies on under the hood.

Symmetric encryption is **fast**. AES-256 can encrypt gigabytes per second on modern hardware. It's the right tool for bulk data.

The catch is **key distribution**. Symmetric encryption only works if both ends already share the key. If Alice and Bob want to communicate securely and they've never met, how does Alice send Bob the key without an attacker intercepting it? You can't encrypt the key with symmetric encryption because they don't have a shared key yet. This is the classic chicken-and-egg problem of secure communication, and it's exactly the problem the other family of encryption was invented to solve.

## Asymmetric encryption

Also called **public-key encryption**. Each participant has a **key pair**: two mathematically linked keys that work in opposite directions. One key encrypts, the other decrypts. The two keys are different.

The participant keeps one key secret (the **private key**) and publishes the other (the **public key**) freely. Anyone in the world can take your public key and use it to encrypt a message that only your private key can decrypt. The public key cannot be used to decrypt, only to encrypt.

<svg viewBox="0 0 870 240" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <rect x="30" y="90" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="90" y="115" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Alice</text>
  <text x="90" y="135" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">plaintext</text>

<rect x="200" y="90" width="160" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="280" y="115" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">encrypt</text>
  <text x="280" y="135" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">with Bob's public key</text>

<rect x="410" y="90" width="120" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="470" y="125" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">ciphertext</text>

<rect x="580" y="90" width="160" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="660" y="115" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">decrypt</text>
  <text x="660" y="135" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">with Bob's private key</text>

<line x1="150" y1="120" x2="200" y2="120" stroke="#565653" stroke-width="2"/>
  <polygon points="192,115 202,120 192,125" fill="#565653"/>
  <line x1="360" y1="120" x2="410" y2="120" stroke="#565653" stroke-width="2"/>
  <polygon points="402,115 412,120 402,125" fill="#565653"/>
  <line x1="530" y1="120" x2="580" y2="120" stroke="#565653" stroke-width="2"/>
  <polygon points="572,115 582,120 572,125" fill="#565653"/>
  <line x1="740" y1="120" x2="780" y2="120" stroke="#565653" stroke-width="2"/>
  <polygon points="772,115 782,120 772,125" fill="#565653"/>

<text x="800" y="115" font-size="13" fill="#000000" font-weight="bold">Bob</text>
  <text x="800" y="135" font-family="monospace" font-size="11" fill="#565653">plaintext</text>

<text x="420" y="200" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Encrypt with the recipient's public key. Only their private key can decrypt.</text>
</svg>

The asymmetry solves the key-distribution problem. Bob publishes his public key on his website. Anyone can encrypt a message to him without ever meeting him. Only Bob, holding the private key, can decrypt.

The price is **speed**. Asymmetric encryption is dramatically slower than symmetric, typically 100 to 1000 times slower depending on the algorithm and the data size. You wouldn't use it to encrypt a large file. The standard algorithms here are **RSA** (older, key sizes 2048 to 4096 bits), and elliptic curve schemes like **ECDH** (newer, smaller keys with equivalent security).

## How they actually get used together

In practice, almost every "encrypted" connection on the modern internet uses both schemes together in a pattern called **hybrid encryption**.

Asymmetric encryption is used briefly at the start to exchange a fresh symmetric key. Then the symmetric key encrypts everything else.

This is how TLS works (the protocol behind HTTPS). When your browser connects to a website, it uses the site's public key from its certificate to negotiate a short-lived symmetric key, then encrypts the rest of the session symmetrically. The asymmetric work happens once per session, the symmetric work handles the bulk traffic. Best of both: no pre-shared secret needed, and fast enough for real volume.

## Where encryption shows up in blockchain systems

Back to the opening misconception. Encryption is critical infrastructure for the internet but plays a small and specific role in public blockchains. Three places it shows up in practice:

**At rest, in your wallet file.** When you install a wallet, the application encrypts your private key on disk using a password you choose. That encryption is symmetric (AES under the hood, with the password run through a key-derivation function first). This is why "remember your password" matters. If you forget it, the wallet file is encrypted and unreadable. The blockchain itself doesn't know or care about this, it's a local security measure done by the wallet software.

**In transit, when you talk to a node.** When your wallet sends commands to a remote node over the internet, the connection is usually wrapped in TLS, which uses the hybrid encryption you just saw. Again, this is standard internet infrastructure, the blockchain protocol doesn't specify it.

**In specialised chains that opt into it.** A few chains are designed around encrypted transactions where the amounts and recipients are hidden from public view. These are the exception, not the rule, and they involve genuine cryptographic engineering beyond what plain AES or RSA provide.

If you've been told "everything on the blockchain is encrypted," the more accurate phrasing is "everything on the blockchain is authenticated and tamper-evident." Those are different security properties, and conflating them is the misconception that opened this lesson.
