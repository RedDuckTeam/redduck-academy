---
id: 1789000002
title: Blind signing and the Bybit hack
type: lecture
order: 1
faq:
  - question: What is blind signing and why is it dangerous?
    answer: Blind signing is when a hardware wallet cannot decode the transaction
      you are about to approve, so instead of showing what the transaction does it
      shows raw hexadecimal calldata and a hash. You end up approving bytes you
      cannot read. It is dangerous because the hardware wallet screen is the one
      place malware cannot tamper with, so if that screen cannot tell you what you
      are signing, your last safeguard is gone. The Bybit theft of about 1.46
      billion dollars in February 2025 happened this way.
  - question: Why did decoding or whitelisting not stop the Bybit attack?
    answer: A decoder or a whitelist recognizes a contract and a function and shows
      a readable name for them. The Bybit payload called execTransaction, a
      legitimate and well-known Safe function, so a decoder would have shown a
      valid-looking call and flagged nothing. The dangerous part was a delegatecall
      hidden inside that function's parameters, and naming the outer function does
      not reveal it. Decoding also cannot keep up, because it can only read
      contracts someone registered ahead of time, and new contracts deploy every
      day.
  - question: What did the Bybit transaction actually do?
    answer: It was an execTransaction call with its operation flag set to
      delegatecall, aimed at an attacker contract. Instead of moving tokens, that
      contract wrote a new address into the Safe's storage slot 0, which is where a
      proxy keeps the address of the code it runs. That single call repointed the
      wallet to attacker-controlled code and moved zero ETH. A second transaction
      then ran the attacker's code and swept the wallet empty.
---

> A hardware wallet is supposed to be the one screen an attacker cannot reach. Your key stays on the device, and you approve each transaction by looking at what the device shows you. That protection only works if the screen can tell you what you are approving. When the device cannot decode a transaction, it falls back to showing raw bytes, and you sign something you cannot read. This is blind signing, and in February 2025 it cost one exchange about 1.46 billion dollars.

## The one screen an attacker cannot reach

A hardware wallet exists to keep your private key off your computer. The key is generated on the device and never leaves it. When you want to send a transaction, your computer builds it and passes it to the device, the device signs it internally, and only the signature comes back. Malware on your machine never touches the key.

That moves the whole security question onto one thing: **the device's own screen**. Your browser can be compromised. A website can show you one thing and send your wallet another. What malware cannot do is change the pixels on the device or press its physical confirm button. So the screen is the last place you can catch a bad transaction before it is signed. The entire model rests on one assumption: what the device shows you is what you are signing.

## When the screen goes blank

The device can only describe a transaction it can decode. For a plain ETH transfer it shows the amount and the destination, which is all a transfer is. For a call to a contract it has been taught to recognize, it can show the function and the arguments.

For a call to a contract it does not recognize, it has nothing to show. Remember the 4-byte function selector from the low-level calls lesson, the first four bytes that pick which function runs. To turn the bytes after it into readable arguments, the device needs the target contract's interface, and for a new or unknown contract it does not have one. So it shows what it has: the raw calldata and a hash of what you are signing. This is **blind signing**. You are approving bytes you cannot read.

<svg role="img" viewBox="0 0 720 410" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>What a hardware wallet shows when it cannot decode a transaction</title><desc>The device screen shows the call target, the function name execTransaction, a long block of raw hexadecimal calldata, a signing hash, and a value of 0 ETH. A warning line states the signer is approving bytes the device cannot explain. This is blind signing: the exact screen the Bybit signers approved.</desc>

  <!-- title bar -->
  <rect x="20" y="16" width="680" height="34" fill="#ed4937"/>
  <text x="360" y="39" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#ffffff" font-weight="bold">BLIND SIGNING: WHAT THE DEVICE SHOWS TODAY</text>

  <!-- device screen (neutral black border: this is the problem) -->
  <rect x="150" y="72" width="420" height="278" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <!-- screen header strip (gray, to contrast with the red clear-signing screen) -->
  <rect x="150" y="72" width="420" height="30" fill="#565653"/>
  <text x="360" y="92" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#ffffff" font-weight="bold">HARDWARE WALLET: SIGN?</text>

<text x="172" y="124" font-family="monospace" font-size="11" fill="#565653">To: 0x1Db9…C4a2 (your wallet)</text>
<text x="172" y="144" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Call: execTransaction</text>
<text x="172" y="166" font-family="monospace" font-size="10" fill="#565653">Data:</text>

  <!-- the "long bytes" blob, the centerpiece -->

<text x="172" y="184" font-family="monospace" font-size="11" fill="#000000">0x6a761202 0000000000000000000000</text>
<text x="172" y="200" font-family="monospace" font-size="11" fill="#000000">0096221a…72420000000000000000000</text>
<text x="172" y="216" font-family="monospace" font-size="11" fill="#000000">0000000000000000000000000000000001</text>
<text x="172" y="232" font-family="monospace" font-size="11" fill="#000000">a9059cbb000000000000000000000000bd</text>
<text x="172" y="248" font-family="monospace" font-size="11" fill="#000000">d0…95160000000000000000000000000000</text>

  <line x1="172" y1="262" x2="548" y2="262" stroke="#565653" stroke-width="1"/>
  <text x="172" y="282" font-family="monospace" font-size="10" fill="#565653">Sign hash: 0x8a7f3c…e219      Value: 0 ETH</text>

<text x="172" y="306" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">You are approving these bytes. The device</text>
<text x="172" y="320" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">cannot show what they do.</text>

  <!-- sign affordance -->
  <rect x="172" y="330" width="376" height="12" fill="#565653"/>

  <!-- caption -->

<text x="360" y="378" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">When the device cannot decode a call it shows only raw calldata and a hash, so the</text>
<text x="360" y="394" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">signer approves bytes they cannot read. This is the screen the Bybit signers approved.</text>
</svg>

## A billion and a half dollars, signed blind

On February 21, 2025, attackers stole about 1.46 billion dollars from the exchange Bybit. It remains the largest crypto theft on record, and the group behind it was the Lazarus Group.

Bybit kept the funds in a Safe multisig wallet. Several people had to approve each transaction, and each approved on a Ledger hardware wallet. The attackers compromised the Safe website and served malicious JavaScript aimed only at Bybit, so every other Safe user saw nothing wrong. On screen, the Safe interface showed a routine transfer to a hot wallet. The transaction that actually reached the Ledgers was a different one, and the Ledgers could not decode it. Each signer saw a hash and confirmed it.

What those bytes actually did connects to two things you have already seen. Remember from the low-level calls lesson that a `delegatecall` runs another contract's code against your own storage, and that **storage slot 0** is just the first slot, whatever happens to sit there. Remember from the upgradeable contracts lesson that a proxy keeps its implementation address, the code it runs for every call, in storage. A Safe is a proxy, and it keeps that address in slot 0.

The malicious call was `execTransaction` with its operation flag set to `1`, which means **delegatecall**. It targeted an attacker contract whose function named `transfer` ignored tokens completely. Instead, it wrote a new address into slot 0. That single delegatecall repointed the Safe's implementation to attacker-controlled code, and it moved zero ETH.

Now the wallet ran the attacker's code. They called it again and swept it empty. Three signers had approved the transaction blind.

<svg role="img" viewBox="0 0 720 375" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The three views the Bybit signers had of one transaction</title><desc>Three side-by-side panels for the same transaction. The Safe website showed a routine transfer of ETH to a hot wallet. The hardware wallet could not decode the call and showed only a signing hash. The transaction's real effect was a delegatecall that overwrote the proxy's implementation slot and moved zero ETH. The gap between the first panel and the third is the whole attack.</desc>
  <rect x="20" y="16" width="680" height="34" fill="#ed4937"/>
  <text x="360" y="39" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">ONE TRANSACTION, THREE DIFFERENT VIEWS</text>
  <rect x="28" y="72" width="210" height="236" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="28" y="72" width="210" height="28" fill="#565653"/>
  <text x="133" y="91" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">SAFE WEBSITE</text>
  <text x="44" y="132" font-family="monospace" font-size="12" fill="#000000">Send 0.01 ETH</text>
  <text x="44" y="152" font-family="monospace" font-size="12" fill="#000000">to the hot wallet</text>
  <text x="44" y="188" font-family="monospace" font-size="11" fill="#565653">Looks routine.</text>
  <line x1="44" y1="262" x2="222" y2="262" stroke="#565653" stroke-width="1"/>
  <text x="133" y="288" text-anchor="middle" font-family="monospace" font-size="12" fill="#565653" font-weight="bold">what they expected</text>
  <rect x="255" y="72" width="210" height="236" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="255" y="72" width="210" height="28" fill="#565653"/>
  <text x="360" y="91" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">HARDWARE DEVICE</text>
  <text x="271" y="132" font-family="monospace" font-size="11" fill="#000000">Call: execTransaction</text>
  <text x="271" y="156" font-family="monospace" font-size="10" fill="#000000">Sign hash:</text>
  <text x="271" y="172" font-family="monospace" font-size="10" fill="#000000">0x8a7f3c…e219</text>
  <text x="271" y="208" font-family="monospace" font-size="11" fill="#565653">Cannot decode.</text>
  <line x1="271" y1="262" x2="449" y2="262" stroke="#565653" stroke-width="1"/>
  <text x="360" y="288" text-anchor="middle" font-family="monospace" font-size="12" fill="#565653" font-weight="bold">only a hash</text>
  <rect x="482" y="72" width="210" height="236" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="482" y="72" width="210" height="28" fill="#ed4937"/>
  <text x="587" y="91" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">WHAT IT ACTUALLY DID</text>
  <text x="498" y="130" font-family="monospace" font-size="10" fill="#000000">delegatecall writes</text>
  <text x="498" y="146" font-family="monospace" font-size="10" fill="#000000">slot 0 = attacker</text>
  <text x="498" y="170" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">New wallet code.</text>
  <text x="498" y="208" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">0 ETH moved.</text>
  <line x1="498" y1="262" x2="676" y2="262" stroke="#565653" stroke-width="1"/>
  <text x="587" y="288" text-anchor="middle" font-family="monospace" font-size="12" fill="#ed4937" font-weight="bold">what they signed</text>
  <text x="360" y="336" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The website promised a transfer, the device could show only a hash, and the transaction replaced the</text>
  <text x="360" y="352" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">wallet's code while moving no ETH. The distance from the first panel to the third is the whole attack.</text>
</svg>

The same shape had already played out twice. In October 2024, Radiant Capital lost about 50 million dollars. A compromised machine showed its signers a harmless transaction while they blind-signed a malicious one on their hardware wallets. In July 2024, WazirX lost about 235 million dollars to another Safe implementation swap that its signers approved without being able to read it. Different victims, one root cause: a person approving bytes they could not see through.

## Why decoding the calldata cannot save you

The obvious response is to teach the device to decode more. Ledger's clear-signing effort does exactly that, registering known contracts and their function signatures so the device can show "transfer 100 USDC to 0xabc" instead of hex. For a contract on the list, this works and it helps.

It fails for the case that matters, for two reasons.

**It only verifies which function is named.** The Bybit payload called `execTransaction`, a legitimate and well-known Safe function, and the delegatecall was hidden inside its parameters. A decoder would have shown a valid-looking `execTransaction` and said nothing about the storage overwrite it carried.

**It does not scale.** New contracts deploy every day, and a device can only decode what someone registered ahead of time. The moment you touch something new, you are blind signing again.

Decoding tells you what a transaction claims to be. It cannot tell you what it will do.

## What to bring to every signature

There is one thing about a transaction that cannot lie: what it changes about your **balances**. You cannot build a transaction that drains your wallet while your balances report that nothing moved. The Bybit signers could check which contract they were calling and which function it named, and both checked out. What none of them could see was that the transaction moved zero ETH, at the moment they believed they were sending it to a hot wallet.

So the question to carry into every signature is the one the screen kept from them: what will this do to my balances? When the numbers match what you meant to do, you sign. When the screen shows nothing moving and you expected to move funds, or shows a token you never meant to touch, you stop and throw the transaction away. Reading a transaction by the balances it changes is the habit that would have caught every theft in this lesson.
