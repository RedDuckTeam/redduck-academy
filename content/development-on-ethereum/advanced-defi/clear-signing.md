---
id: 1711262870
title: Clear signing
type: lecture
order: 6
faq:
  - question: What is blind signing and why is it dangerous?
    answer: Blind signing is when a hardware wallet cannot decode the transaction
      you are about to approve, so instead of showing what the transaction does it
      shows raw hexadecimal calldata and a hash. You end up approving bytes you
      cannot read. It is dangerous because the hardware wallet screen is the one
      place malware cannot tamper with, so if that screen cannot tell you what you
      are signing, your last safeguard is gone. The Bybit theft of about 1.46
      billion dollars in February 2025 happened this way.
  - question: How is ERC-8009 different from a wallet that just decodes calldata?
    answer: A decoder shows a guess about what a transaction will do, and if the
      guess is wrong or the device is fooled, the transaction still executes.
      ERC-8009 shows the balance changes a transaction must produce and enforces
      those same numbers on-chain, so a transaction that does something other than
      what the screen showed reverts and costs only gas. The display and the
      enforcement read from the same requirements, so the screen cannot promise
      one thing while the chain does another.
  - question: Why verify balance changes instead of which function is called?
    answer: The function name tells you what a transaction claims to be, and the
      Bybit payload called a legitimate, well-known Safe function with a malicious
      delegatecall hidden in its parameters. Balance changes are what a
      transaction actually does to your funds, and you cannot construct a
      transaction that drains a wallet while the balances say nothing moved. This
      also scales, because balance changes are the same regardless of how new or
      complex the contract you are calling is.
  - question: Does ERC-8009 protect a multisig like the one Bybit used?
    answer: Yes, through a periphery contract called SafeRouter added in mid-2026.
      SafeRouter is added as one of the Safe's owners and takes one slot of the
      signature threshold. The executor who submits the transaction sees the
      clear-signed balance requirements on their hardware wallet, and the required
      changes are checked after the Safe executes, so a violation reverts the
      whole bundle. The standard specifies what the executor sees at execution
      time, and does not fully specify what each earlier co-signer sees on their
      own device.
---

> A hardware wallet is supposed to be the one screen an attacker cannot reach. Your key stays on the device, and you approve each transaction by looking at what the device shows you. That protection only works if the screen can tell you what you are approving. When the device cannot decode a transaction, it falls back to showing raw bytes, and you sign something you cannot read. This is blind signing, and in one incident it cost about 1.46 billion dollars. ERC-8009 changes what the device shows. Instead of opaque calldata, it shows the balance changes a transaction will produce, and it enforces those exact changes on-chain, so a transaction that does something other than what you saw reverts.

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

The same shape had already played out twice. In October 2024, Radiant Capital lost about 50 million dollars: a compromised machine showed its signers a harmless transaction while they blind-signed a malicious one on their hardware wallets. In July 2024, WazirX lost about 235 million dollars to another Safe implementation swap that its signers approved without being able to read it. Different victims, one root cause: a person approving bytes they could not see through.

## Why decoding the calldata cannot save you

The obvious response is to teach the device to decode more. Ledger's clear-signing effort does exactly that, registering known contracts and their function signatures so the device can show "transfer 100 USDC to 0xabc" instead of hex. For a contract on the list, this works and it helps.

It fails for the case that matters, for two reasons.

**It only verifies which function is named.** The Bybit payload called `execTransaction`, a legitimate and well-known Safe function, and the delegatecall was hidden inside its parameters. A decoder would have shown a valid-looking `execTransaction` and said nothing about the storage overwrite it carried.

**It does not scale.** New contracts deploy every day, and a device can only decode what someone registered ahead of time. The moment you touch something new, you are blind signing again.

Decoding tells you what a transaction claims to be. It cannot tell you what it will do.

## Sign the outcome instead of the call

There is one thing about a transaction that cannot lie: what it changes about your **balances**. You cannot build a transaction that drains your wallet while your balances report that nothing moved. So if the device could show you the balance changes a transaction will cause, you would not need to read its calldata at all.

Look at the Bybit transaction through that lens. Its effect on balances was zero. The screen would have shown that nothing moved, at the moment the signers believed they were sending ETH to a hot wallet. A transaction that shows no change when you expect one is a transaction you reject. That is the idea behind ERC-8009.

## How ERC-8009 works

ERC-8009 is a single contract, deployed once per network, that you route your transaction through. It is stateless and permissionless: it holds no funds between transactions, and everyone uses the same instance. Instead of calling your target contract directly, you call the proxy and hand it two things: the call you want made, and the **balance changes you require** from it.

The proxy then runs a fixed sequence:

1. Move any tokens the call needs.
2. Make your call to the target.
3. Move the results back to you.
4. Check your required balance changes, and revert the whole transaction if any of them did not hold.

A revert costs you only gas.

```solidity
// Solidity 0.8.24, Ethereum mainnet
interface IBalanceProxy {
    // token == address(0) means native ETH.
    // balance is a signed minimum change: the actual change must be at least this.
    struct Balance { address target; address token; int256 balance; }

    // useTransfer true sends tokens to the target,
    // false approves the target to pull them itself.
    struct Approval { Balance balance; bool useTransfer; }

    // Run approvals, call the target, run withdrawals, then require every
    // declared minimum balance change. Revert if any of them was not met.
    function proxyCallDiffs(
        Balance[] memory diffs,
        Approval[] memory approvals,
        address target,
        bytes memory data,
        Balance[] memory withdrawals
    ) external payable returns (bytes memory);
}
```

You state each requirement as a minimum. `at least +2,800 USDC` means the call must leave you 2,800 USDC richer or it reverts. Because the number is signed, `at least -1.00 ETH` means you may lose at most 1 ETH. One signed floor covers both directions, so a swap becomes a pair of them: lose at most 1 ETH, gain at least 2,800 USDC.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>What a hardware wallet shows for the same transaction under ERC-8009 clear signing</title><desc>The device screen no longer shows raw calldata. It shows the guaranteed balance changes decoded from the proxy's own parameters: ETH changes by at least minus 1.00, meaning spend at most 1 ETH, and USDC changes by at least plus 2,800.00, meaning receive at least 2,800 USDC. A line states the proxy enforces these on-chain and reverts the transaction if the real change is worse.</desc>
  <!-- title bar -->
  <rect x="20" y="16" width="680" height="34" fill="#ed4937"/>
  <text x="360" y="39" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#ffffff" font-weight="bold">CLEAR SIGNING WITH ERC-8009: WHAT THE DEVICE SHOWS</text>

  <!-- device screen (focal box, red border) -->
  <rect x="150" y="74" width="420" height="256" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <!-- screen header strip -->
  <rect x="150" y="74" width="420" height="30" fill="#ed4937"/>
  <text x="360" y="94" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#ffffff" font-weight="bold">HARDWARE WALLET: CONFIRM</text>

  <text x="172" y="128" font-family="monospace" font-size="11" fill="#565653">To: ERC-8009 proxy (known contract)</text>
  <text x="172" y="150" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Guaranteed balance changes</text>
  <line x1="172" y1="160" x2="548" y2="160" stroke="#565653" stroke-width="1"/>

  <!-- row 1: ETH -->
  <text x="172" y="190" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">ETH</text>
  <text x="330" y="190" text-anchor="end" font-family="monospace" font-size="14" fill="#000000" font-weight="bold">−1.00</text>
  <text x="352" y="190" font-family="monospace" font-size="10" fill="#565653">spend at most 1 ETH</text>

  <!-- row 2: USDC -->
  <text x="172" y="222" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">USDC</text>
  <text x="330" y="222" text-anchor="end" font-family="monospace" font-size="14" fill="#000000" font-weight="bold">+2,800.00</text>
  <text x="352" y="222" font-family="monospace" font-size="10" fill="#565653">receive at least 2,800</text>

  <line x1="172" y1="242" x2="548" y2="242" stroke="#565653" stroke-width="1"/>
  <text x="172" y="264" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">Enforced on-chain: the proxy reverts</text>
  <text x="172" y="279" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">if the real change is worse than shown.</text>

  <!-- confirm affordance -->
  <rect x="172" y="294" width="376" height="24" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="311" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#000000" font-weight="bold">HOLD TO CONFIRM</text>

  <!-- caption -->
  <text x="360" y="360" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The device reads the balance changes from the proxy's own known ABI, so it needs no</text>
  <text x="360" y="376" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">knowledge of the target contract, and the same numbers are enforced on-chain.</text>
</svg>

The clear-signing part comes from where those numbers live. The proxy has a fixed, well-known address and a fixed interface on every network. Your balance requirements are ordinary arguments to that interface. So the device decodes them straight from the proxy's own ABI, which it can always know. It never needs the target contract's ABI, the thing it could not get before. The transaction also carries each token's symbol and decimals, checked on-chain against the real token so a false label reverts. That is how the device can print `2,800 USDC` instead of a raw integer.

## The display and the enforcement are the same numbers

This is what separates ERC-8009 from a smarter decoder. A decoder shows you a prediction. If the prediction is wrong, or the device is tricked, the transaction still runs. ERC-8009 shows you the balance changes and enforces those same numbers on-chain. The figures on the screen are the figures the contract requires. If the real result comes out worse than the screen said, the transaction reverts and you lose only gas. The screen cannot promise one thing while the chain does another, because both read from the same requirements you signed.

## Multisig, where signing and execution split

Bybit was a multisig, and that matters, because the people signing are not the ones executing. Several owners approve a transaction, then one executor submits it on-chain. ERC-8009 covers this with a periphery contract called **SafeRouter**, added in mid-2026.

SafeRouter is added as one of the Safe's owners and takes up one slot of the signature threshold. The executor submits the transaction through SafeRouter on their hardware wallet, and sees the same clear-signed balance requirements a single signer would. SafeRouter runs the Safe transaction through the proxy, and the required changes are checked after the Safe executes, so any violation reverts the whole bundle.

One honest limit lives here. The standard defines what the executor sees at execution time. What each earlier co-signer sees when they add their signature is not part of the guarantee.

## What it does not cover

Balance requirements are a strong floor, and they are still only a floor. ERC-8009 constrains native ETH and ERC-20 balances, and nothing else. A transaction can satisfy every ETH and token requirement you set and still move an NFT you never thought to constrain, or change a lending or staking position that is not a plain balance. The screen tells you the truth about the balances you asked about, and stays silent about the rest.

Two narrower edges are worth remembering:

- **An absolute-balance check ignores where funds came from.** Someone could top up your balance to satisfy it. When the source matters, use the difference form, which measures the change your own call produced.
- **The proxy is stateless.** Any funds left sitting in it belong to whoever withdraws them next, so a correct transaction never leaves a balance behind.

## Where ERC-8009 stands

ERC-8009 is a proposed standard, still in Draft. There is a working implementation, including multisig support, and a demo with hardware wallets.

- Spec and demos: [erc8009.xyz](https://erc8009.xyz)
- Formal proposal: [ethereum/ERCs #1184](https://github.com/ethereum/ERCs/pull/1184)
- Discussion: [Ethereum Magicians](https://ethereum-magicians.org/t/erc-8009-proxy-clear-signing/25199)

## What to look at before you sign

When you approve a transaction to a contract your wallet does not recognize, you have two questions available. The old one asks whether the contract and function are on someone's list of known-safe calls. The Bybit signers could have answered yes to that, right before they lost the wallet. The better one asks whether the balance changes on the screen match what you meant to do.

When they match, you sign. When the screen shows nothing moving and you expected to move funds, or shows a token you never meant to touch, you stop and throw the transaction away. Reading a transaction by the balances it changes is the habit that would have caught every theft in this lesson.
