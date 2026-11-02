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

Although sound similar, encoding and encryption are two completely different things. 

[**Encryption**] (https://academy.redduck.io/courses/blockchain-basics/cryptography/symmetric-and-asymmetric-encryption) scrambles data so only someone with the right key can read it. The output is unreadable to everyone else. 

**Encoding** translates data into a different representation so it can travel safely through systems that have constraints on what characters they accept. The output is readable, no key included; anyone can decode it.

The same two bytes can be encoded as `Hi` in ASCII, `48 69` in hex, `SGk=` in Base64, or `6Wc` in Base58. All four represent the same underlying data; switching between them does not change the data, it changes how it looks on the page.

If someone ever tells you they "encoded" a password to keep it safe, they didn't.

## Why raw bytes can't be displayed

The hash is 256 bits of binary data. Try to print those 256 bits as ASCII characters directly and you'll get something like this in your terminal:

```
,Ò$Û¥û°£.&è;*ÅùZé¿b^p43 62)8¹$
```

That string contains invisible control characters – some break URL parsing, some are treated as line endings, and some render differently on different operating systems. Pasting it somewhere and getting it back unchanged is impossible to guarantee. Therefore, we encode it. 

Pick a representation that uses only safe characters and know that the resulting string will be longer than the raw bytes. The different encoding schemes you'll meet make different tradeoffs about which character set to use and how long the output ends up.

## The encodings you'll see

### Hex

Each byte becomes two characters drawn from `0–9` and `a–f`. The hash output `2cf24dba5fb0a30...2938b9824` is hex. So is almost any long string of letters and numbers you've seen labeled as an "address" or a "transaction hash." The leading `0x` is a convention that says "what follows is hex," borrowed from C.

**Properties:**

- Each hex character is exactly 4 bits, so two characters always represent one byte. Converting back and forth with raw bytes is trivial.
- Output is exactly twice the length of the input. 32 bytes of hash become 64 hex characters.
- Case-insensitive by default. Some systems use mixed case to encode a checksum without changing what the address means, but lowercase the same string and it still resolves to the same data.

Hex is the standard representation for anything that's "raw bytes shown as text." If you're staring at a long string of `0-9a-f` characters, you're looking at hex.

### Base58

Uses 58 characters: all digits and letters except `0`, `O`, `I`, and `l`. Those four are excluded because they look alike in many fonts and would be easy to misread when a human copies a string by hand.

A string like `1A1zP1eP5...5SLmv7DivfNa` is Base58. There's also a variant called Base58Check that adds a few extra checksum bytes so a typo in a copied string is detected before damage is done.

**Properties:**

- Shorter than hex for the same data, because 58 symbols carry more information per character than 16.
- Designed for humans copying strings by hand. The excluded characters are the ones people misread.
- Not aligned to byte boundaries the way hex is, so converting is slightly more involved.

Base58 is the format reached for whenever a system needs to give humans something to copy without losing characters to font ambiguity. Anywhere a user might paste a long secret into a phone keypad or read it aloud, Base58 is the safer choice.

### Base64

Uses 64 characters: `A–Z`, `a–z`, `0–9`, plus `+` and `/`, with `=` for padding. Predates blockchain by more than a decade. It's how email attachments are encoded for transport over text-only systems, how images get inlined into HTML data URLs, and how API tokens get transmitted in HTTP headers.

**Properties:**

- Slightly more compact than Base58 because it has six more symbols in its alphabet.
- Not designed for humans copying strings. Uses both `0` and `O`, both `I` and `l`. Fine for machine-to-machine, bad for "read this aloud over the phone."
- The `+` and `/` characters break URL parsing, so a URL-safe variant exists that swaps them for `-` and `_`.

You'll meet Base64 in plenty of non-blockchain web contexts, and recognising it on sight saves time. The trailing `=` padding is the giveaway.

## Side-by-side

The same 5-byte input (`hello`) encoded four ways:

| Encoding | Output | Length |
| --- | --- | --- |
| Binary (raw) | `01101000 01100101 01101100 01101100 01101111` | 40 bits |
| Hex | `68656c6c6f` | 10 characters |
| Base58 | `Cn8eVZg` | 7 characters |
| Base64 | `aGVsbG8=` | 8 characters |

Same five bytes, four different visual representations, each one is reversible to the exact same binary input.

The playground below lets you try this yourself. Type any input and watch hex, Base58, and Base64, produced from the same underlying bytes.

[interactive playground](https://plgrnd.io/#flow=N4IgbiBcDMA0IDsD2ATApgZygbVASxShAAYAmAM1IDYB2ATgFYG6BGADgBY1z2OUBjAIZUqDNiwBGgtBIkcQ8AC4BPAA5oiAZQAqAJQCSAOQDiAfQCihgMIB5ACLmFIVUgx5FeJAiigAHlBYWKgA6UmJoDg5iSJoWDjY6NnhlKABaMWCWaGgWGlIchmJmNlIAX3gUQUVBHxA0BH5UPAQAcyIpDDQqeSU0X0UiQWMANQwJYzYAXhBykABbNEEMAFcAJzRCSFAAdwJFAAsoUij4fbQ8Fv2ByG7ZzoAbNH5FDahyQXvOitXBFpbmtqQd6fNDlfCbEAScj8BJoYhsFB0aCcQQUNjQfjEOIMTEsBj5eEMJwqdREbTmAAa2icLjcHi8tX8kFSpCCwRo0A5LGi8VIdBESRAKWZDGgwQYHCyHGyYWYVDoHFmlWqtRe-SIZ3u9yQM3gCyWa1eWxAuxQByg0GIxFO50u1wYLDuaEezyNwK+IBQPz+ALeH06pQAuvANi1MDhQBgkGt+BpIJDobD4YjkRxUeR0biODisfjLWwifAozG0AAJQQIFCPdqJuhwhFIlFojFY7O4vOE1JqxSpVYXK7EwSrMPXEgUaj0JisTjcXgCYSicRSGRyQfDtCKcuV6vxsiUWiMZi8WececiMSSaSyDipZqqZY9x7kAbwAhEXzKVKhtCmUxQmF1smjZps2WY5niBIFv+SYNqm6aZq24EdgWXZ9D2fZ2qke4Toe05cDwp5COeS5XnI2EHlOx4EXwRGLpeK43neD6pE+AxgiAxarLGRDkZOR4ztRZ50cu15OJxsZblWcZjvufF4SeNELheIlyKh-S9v2L4gNU66jiw-ASHQdCkDQCJSCgMTytkVAsGgbBsPw0CCCwKA0PwpBriOkk7iA+mGcZpkoOZllItANl2Q5TkuW5pC3gg96PtwWlvvGH5figYa-rxuFUXOtHKaRUTjhR-H4XlSkkQxanoZpqR+UZJlmYIFkcDQVlhbZ9mOc5rnufVAVNS1bWheFXVRb1sVMYlz4zMG4B4Gg2wuKs1x+FA9AhOI9mcLE4TECIyRQFEIStuEjB0Fa2YcPAABeSBIHMATBNATB4gWETQPkyK0KUpRAA?view=true)
