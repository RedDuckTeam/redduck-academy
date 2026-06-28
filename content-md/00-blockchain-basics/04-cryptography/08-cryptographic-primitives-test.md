# Cryptographic primitives - Test

_type: test_

## Before you start:

This test checks whether you actually understand the cryptography building blocks (hashes, encoding, encryption, key pairs) or just remember the words. Several questions deliberately offer plausible-sounding wrong answers, the kind a reader who skimmed the lessons would pick. Read each option carefully before answering.

---

## Questions

### Q1

Which of the following are real cryptographic properties of hash functions like SHA-256? (Select all that apply.)

a. Hashes are easy to verify
b. The same input always produces the same output.
c. Hashing hides the original data, which is what makes it secure for sensitive information.
d. Different inputs always produce different outputs.

### Q2

A blockchain block contains 10,000 transactions, summarized into a single Merkle root. Someone gives you one transaction from the block and a Merkle proof. About how many hash operations do you need to verify the transaction is in the block?

a. 1 hash
b. 13 hashes
c. 14 hashes
d. 32 hashes. One for each byte in the root.
e. 16 hashes

### Q3

What does public-key cryptography let you do that symmetric encryption alone cannot?

a. Communicate securely with someone you've never met without exchanging a shared secret in advance.
b. Encrypt a message in such a way that only one specific person can decrypt it, even if the encryption method is known to attackers.
c. Encrypt large files more efficiently than symmetric algorithms.
d. Prove you authored a specific message without revealing your private key.
e. Generate a public identifier from a private secret in a way that doesn't reveal the secret.

### Q4

A user creates a wallet, sees their first address, sends a test transaction, then deletes the app. A week later they reinstall the app and re-enter the same 12-word seed phrase. What do they see?

a. A new random address.
b. The same first address and the same on-chain history.
c. The same address but with zero history, since reinstalling reset the wallet's state.
d. An error, because the wallet provider has marked that seed phrase as used.

### Q5

Alice signed a message with her private key last week. Today she sends you what she claims is a new signature of the same message. Can you tell whether she really signed it again today, rather than just resending last week's signature?

a. Yes. Signing the same message twice produces a unique signature each time, so the new one will look different.
b. Yes. Each signature includes a timestamp of when it was made.
c. Yes, if she sends you part of her private key along with the signature so you can verify she still holds it.
d. Yes, if she includes a current date inside the message before signing.

### Q6

Can I assume my wallet is secure even if 10 out of 12 words of my seed phrase were leaked?

a. Yes, if I migrate my wallet to a new seed phrase
b. Yes, if I used a custom 13th word when creating the wallet
c. Yes, because my private key is not leaked
d. Yes, because they don't know last 2 words
