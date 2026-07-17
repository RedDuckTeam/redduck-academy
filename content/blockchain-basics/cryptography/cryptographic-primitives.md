---
id: 94
title: Cryptographic primitives - Test
type: test
order: 8
---

## Before you start:

This test checks whether you actually understand the cryptography building blocks (hashes, encoding, encryption, key pairs) or just remember the words. Several questions deliberately offer plausible-sounding wrong answers, the kind a reader who skimmed the lessons would pick. Read each option carefully before answering.

<!-- q:6a0b8a94f4c0093cef270ff6 -->
Which of the following are real cryptographic properties of hash functions like SHA-256? (Select all that apply.)

- [x] Hashes are easy to verify  <!-- a:6a0b8ab6f4c0093cef270ff7 -->
- [x] The same input always produces the same output.  <!-- a:6a0b8acbf4c0093cef270ff8 -->
- [ ] Hashing hides the original data, which is what makes it secure for sensitive information.  <!-- a:6a0b8ad1f4c0093cef270ff9 -->
- [ ] Different inputs always produce different outputs.  <!-- a:6a0b8ec8f4c0093cef27100b -->

<!-- q:6a0b8addf4c0093cef270ffb -->
A blockchain block contains 10,000 transactions, summarized into a single Merkle root. Someone gives you one transaction and a Merkle proof that it belongs in the block. How many hashes does that proof contain?

- [ ] 1 hash  <!-- a:6a0b8af5f4c0093cef270ffc -->
- [ ] 13 hashes  <!-- a:6a0b8b0cf4c0093cef270ffd -->
- [x] 14 hashes  <!-- a:6a0b8b10f4c0093cef270ffe -->
- [ ] 32 hashes. One for each byte in the root.  <!-- a:6a0b8b18f4c0093cef270fff -->
- [ ] 16 hashes  <!-- a:6a0b94f0f4c0093cef27100c -->

<!-- q:6a0b8b1ef4c0093cef271000 -->
Which of these can public-key cryptography do that symmetric encryption alone cannot? (Select all that apply.)

- [x] Communicate securely with someone you've never met without exchanging a shared secret in advance.  <!-- a:6a0b8b29f4c0093cef271001 -->
- [x] Encrypt a message in such a way that only one specific person can decrypt it, even if the encryption method is known to attackers.  <!-- a:6a0b8b32f4c0093cef271002 -->
- [ ] Encrypt large files more efficiently than symmetric algorithms.  <!-- a:6a0b8b37f4c0093cef271003 -->
- [x] Prove you authored a specific message without revealing your private key.  <!-- a:6a0b8b3bf4c0093cef271004 -->
- [x] Generate a public identifier from a private secret in a way that doesn't reveal the secret.  <!-- a:6a0b95dff4c0093cef27100d -->
- [ ] Turn a message into a fixed-size fingerprint that cannot be reversed.  <!-- a:6a590516d2bbd2ee49c91fb3 -->

<!-- q:6a0b8b44f4c0093cef271005 -->
A user creates a wallet, sees their first address, sends a test transaction, then deletes the app. A week later they reinstall the app and re-enter the same 12-word seed phrase. What do they see?

- [ ] A new random address.  <!-- a:6a0b8ba0f4c0093cef271006 -->
- [x] The same first address and the same on-chain history.  <!-- a:6a0b8ba6f4c0093cef271007 -->
- [ ] The same address but with zero history, since reinstalling reset the wallet's state.  <!-- a:6a0b8bacf4c0093cef271008 -->
- [ ] An error, because the wallet provider has marked that seed phrase as used.  <!-- a:6a0b8bb7f4c0093cef271009 -->

<!-- q:6a0b9940f4c0093cef27100f -->
Alice signed a message with her private key last week. Today she sends you the same message with what she claims is a brand-new signature of it. Can you tell whether she signed it again today, or just resent last week's signature?

- [ ] Yes. Signing the same message again always produces a visibly different signature, so a resent one would be obvious.  <!-- a:6a0b994bf4c0093cef271010 -->
- [ ] Yes. Every signature embeds a timestamp set by the wallet at signing time.  <!-- a:6a0b994ff4c0093cef271011 -->
- [ ] Yes, if she also sends you part of her private key so you can confirm she still holds it.  <!-- a:6a0b9953f4c0093cef271012 -->
- [x] No. A signature proves who signed a message rather than when. It carries no time information.  <!-- a:6a0b9962f4c0093cef271013 -->

<!-- q:6a0b9dcbf4c0093cef271014 -->
Ten of the twelve words in your seed phrase leak. Is that wallet still safe?

- [ ] Yes. Guessing the two missing words means trying 2048 x 2048 combinations, which is too many to brute-force.  <!-- a:6a0b9f8af4c0093cef271015 -->
- [x] Only if you protected it with a BIP39 passphrase, a separate secret that is not one of the twelve words. That passphrase is what the attacker still lacks.  <!-- a:6a0b9fa0f4c0093cef271016 -->
- [ ] Yes, because only the words leaked and your actual private key was never exposed.  <!-- a:6a0b9fa5f4c0093cef271017 -->
- [ ] Yes, as long as you move your funds to a fresh wallet once you notice.  <!-- a:6a0b9ff5f4c0093cef271018 -->
