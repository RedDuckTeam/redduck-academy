---
id: 71
title: Encoding
type: lecture
order: 2
faq:
  - question: Is encoding the same as encryption?
    answer: >-
      No. Encoding has no key, so anyone can reverse it and nothing stays secret.
  - question: Why is a hash shown as hex instead of the raw bytes?
    answer: >-
      Raw bytes contain invisible control characters, characters that break URL parsing, and
      characters some email systems treat as line endings. Hex uses only 0-9 and a-f, so the
      string survives being pasted and mailed unchanged.
  - question: What's the difference between hex, Base58, and Base64?
    answer: >-
      Same bytes, different alphabets. Hex uses 0-9 and a-f, two characters per byte, so the
      output is exactly twice the byte count. Base58 drops 0, O, I, and l so a person copying
      by hand cannot misread them. Base64 uses 64 symbols including + and /, with = for
      padding.
  - question: Why do Bitcoin and Ethereum addresses look so different?
    answer: >-
      Mostly the encoding. Bitcoin addresses are written in Base58, Ethereum addresses in hex
      with a 0x prefix. Both wrap the same kind of fixed-size byte sequence.
---

## Encoding is not encryption

Encoding and encryption are different things, even though the words sound similar. **Encryption** scrambles data so only someone with the right key can read it, and the [next lesson](/courses/blockchain-basics/cryptography/symmetric-and-asymmetric-encryption) covers it. **Encoding** translates data into a different representation so it can travel safely through systems that have constraints on what characters they accept. There is no key and anyone can decode it, so an encoded password is not protected.

The same two bytes can be encoded as `Hi` in ASCII, `48 69` in hex, `SGk=` in Base64, or `6Wc` in Base58. All four represent the same underlying data. Switching between them does not change the data, it changes how the data looks on the page.

## Why raw bytes can't just be displayed

The hash from the previous lesson is 256 bits of binary data. Try to print those 256 bits as ASCII characters directly and you'll get something like this in your terminal:

```
,Ò$Û¥û°£.&è;*ÅùZé¿b^p43 62)8¹$
```

That string contains invisible control characters, characters that break URL parsing, characters that some email systems treat as line endings, and characters that render differently on different operating systems. Pasting it somewhere and getting it back unchanged is impossible to guarantee.

So we encode it into a representation that uses only safe characters, and accept that the resulting string will be longer than the raw bytes. The encoding schemes make different tradeoffs about which character set to use and how long the output ends up.

## The encodings you'll see

Three formats cover almost everything in the ecosystems this course touches.

### Hex

Each byte becomes two characters drawn from `0-9` and `a-f`, so the output is exactly twice the length of the input: 32 bytes of hash become 64 hex characters. The hash output from the previous lesson, `2cf24dba5fb0a30...2938b9824`, is hex. Ethereum addresses are hex too, written with a leading `0x`, a convention that says "what follows is hex". Hex is case-insensitive by default. Some systems use mixed case to encode a checksum without changing what the address means, and the lowercased string still resolves to the same data.

### Base58

Base58 uses 58 characters: all digits and letters except `0`, `O`, `I`, and `l`. Those four are excluded because they look alike in many fonts and would be easy to misread when a human copies a string by hand. The result is also shorter than hex for the same data, because 58 symbols carry more information per character than 16. Bitcoin addresses are written in Base58, and so are Solana addresses. A string like `1A1zP1eP5...5SLmv7DivfNa` is Base58. There's also a variant called Base58Check that adds a few extra checksum bytes so a typo in a copied string is detected before damage is done.

### Base64

Base64 uses 64 characters: `A-Z`, `a-z`, `0-9`, plus `+` and `/`, with `=` for padding. Each character carries slightly more data than in Base58, because the alphabet has six more symbols. On a short input the `=` padding can make the Base64 string longer, as in the table below. Base64 also uses both `0` and `O` and both `I` and `l`, so it is fine for machine-to-machine transport and bad for strings that people copy by hand. You'll also meet it outside blockchains, for example in email attachments.

## One input in four encodings

The same 5-byte input (`hello`) encoded four ways:

| Encoding | Output | Length |
| --- | --- | --- |
| Binary (raw) | `01101000 01100101 01101100 01101100 01101111` | 40 bits |
| Hex | `68656c6c6f` | 10 characters |
| Base58 | `Cn8eVZg` | 7 characters |
| Base64 | `aGVsbG8=` | 8 characters |

All four rows are the same 5 bytes, and each one is reversible to the same binary input.

The same holds for addresses. A long lowercase hex string and a mixed-case Base58 string look so different that it's tempting to assume they represent different kinds of data. Underneath, both formats are usually wrapping the same kind of fixed-size byte sequence that comes out of a cryptographic process.

The playground below lets you try this yourself. Type any input and watch hex, Base58, and Base64 produced from the same underlying bytes.

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAAYAmAM1IDYB2ATgFYG6BGADgBY1z2OUBjAIZUqDNiwBGgtBIkcQ8AC4BPAA5oiAZQAqAJQCSAOQDiAfQCihgMIB5ACLmFIVUgx5FeJAiigAHlBYWKgA6UmJoDg5iSJoWDjY6NnhlKABaMWCWaGgWGlIchmJmNlIAX3gUQUVBHxA0BH5UPAQAcyIpDDQqeSU0X0UiQWMANQwJYzYAXhBykABbNEEMAFcAJzRCSFAAdwJFAAsoUij4fbQ8Fv2ByG7ZzoAbNH5FDahyQXvOitXBFpbmtqQd6fNDlfCbEAScj8BJoYhsFB0aCcQQUNjQfjEOIMTEsBj5eEMJwqdREbTmAAa2icLjcHi8tX8kFSpCCwRo0A5LGi8VIdBESRAKWZDGgwQYHCyHGyYWYVDoHFmlWqtRe-SIZ3u9yQM3gCyWa1eWxAuxQByg0GIxFO50u1wYLDuaEezyNwK+IBQPz+ALeH06pQAuvANi1MDhQBgkGt+BpIJDobD4YjkRxUeR0biODisfjLWwifAozG0AAJQQIFCPdqJuhwhFIlFojFY7O4vOE1JqxSpVYXK7EwSrMPXEgUaj0JisTjcXgCYSicRSGRyQfDtCKcuV6vxsiUWiMZi8WececiMSSaSyDipZqqZY9x7kAbwAhEXzKVKhtCmUxQmF1smjZps2WY5niBIFv+SYNqm6aZq24EdgWXZ9D2fZ2qke4Toe05cDwp5COeS5XnI2EHlOx4EXwRGLpeK43neD6pE+AxgiAxarLGRDkZOR4ztRZ50cu15OJxsZblWcZjvufF4SeNELheIlyKh-S9v2L4gNU66jiw-ASHQdCkDQCJSCgMTytkVAsGgbBsPw0CCCwKA0PwpBriOkk7iA+mGcZpkoOZllItANl2Q5TkuW5pC3gg96PtwWlvvGH5figYa-rxuFUXOtHKaRUTjhR-H4XlSkkQxanoZpqR+UZJlmYIFkcDQVlhbZ9mOc5rnufVAVNS1bWheFXVRb1sVMYlz4zMG4B4Gg2wuKs1x+FA9AhOI9mcLE4TECIyRQFEIStuEjB0Fa2YcPAABeSBIHMATBNATB4gWETQPkyK0KUpRAA?view=true)
