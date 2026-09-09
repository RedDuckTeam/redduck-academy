---
id: 1789000003
title: "ERC-8009: sign the outcome"
type: lecture
order: 2
faq:
  - question: How is ERC-8009 different from a decoder?
    answer: >-
      A decoder shows a prediction, and if it is wrong the transaction still runs. ERC-8009
      shows the balance changes the transaction must produce and enforces those same numbers on
      chain, so anything else reverts and costs only gas.
  - question: What does -1.00 ETH mean on an ERC-8009 screen?
    answer: >-
      You will lose at most 1 ETH. Every requirement is a signed minimum change, so +2,800 USDC
      means you end up at least 2,800 USDC richer. A swap is a pair of them, and the call
      reverts if either floor is missed.
  - question: In what order does the ERC-8009 proxy run a call?
    answer: >-
      Four steps. It runs the approvals or transfers the call needs, calls your target, moves
      the results back to you, then requires every balance change you declared. If one of them
      does not hold, the whole transaction reverts.
  - question: Can a compromised computer fake the balance numbers?
    answer: >-
      It can lie in a browser tab. It cannot make the chain accept a result that violates your
      requirements, because the numbers handed to the proxy are the numbers enforced after the
      call runs. The device reads them from the proxy's own fixed interface.
  - question: Which token address means native ETH?
    answer: >-
      `address(0)`. A `Balance` entry with the zero address as its token constrains native ETH.
---

> The one thing a transaction cannot hide is what it does to your balances. ERC-8009 is built on that. You route your transaction through a single, known proxy contract and hand it the balance changes you require. The proxy makes your call, then checks those balances on-chain, and reverts the whole transaction if they did not hold. Because the numbers it checks are the same numbers a hardware wallet can read from the proxy's own interface, the screen shows you what the chain will enforce, so the two cannot disagree.

## Sign the outcome instead of the call

You already have the question that catches the attacks a decoder misses: what will this transaction do to my balances? A decoder cannot answer it, because naming a function does not tell you the funds it moves. ERC-8009 answers it directly, by making the balance changes part of the transaction itself.

Apply that question to the Bybit transaction. It moved no balances at all, even though the signers believed they were sending ETH to a hot wallet. A screen that showed "0 ETH moved" against an expected transfer is a screen that makes the signer stop and reject. A transaction that shows no change when you expect one is a transaction you reject.

## How the proxy works

ERC-8009 is a single contract, deployed once per network, that you route your transaction through. It keeps no persistent state and needs no permission to use: it holds no funds between transactions, and anyone can route a call through the one canonical deployment each network has. Instead of calling your target contract directly, you call the proxy and hand it two things: the call you want made, and the **balance changes you require** from it.

The proxy then runs a fixed sequence.

<svg role="img" viewBox="0 0 800 430" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The fixed sequence an ERC-8009 proxy runs for every call</title><desc>A vertical flow of four steps. First the proxy moves or approves the tokens the call needs. Second it makes the call to the target contract. Third it moves the results back to the caller. Fourth it checks every balance change the caller required, and reverts the whole transaction if any of them did not hold. The fourth step is the enforcement, and the numbers it checks are the same numbers the device displayed.</desc>
  <rect x="20" y="16" width="760" height="34" fill="#ed4937"/>
  <text x="400" y="39" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">WHAT THE PROXY DOES, IN ORDER</text>
  <rect x="180" y="70" width="440" height="52" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="196" y="93" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">1  APPROVALS</text>
  <text x="196" y="112" font-family="monospace" font-size="10" fill="#565653">move or approve the tokens the call needs</text>
  <path d="M400 122 L400 146" stroke="#565653" stroke-width="2"/><path d="M394 140 L400 148 L406 140 Z" fill="#565653"/>
  <rect x="180" y="150" width="440" height="52" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="196" y="173" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">2  CALL THE TARGET</text>
  <text x="196" y="192" font-family="monospace" font-size="10" fill="#565653">run the transaction you asked for</text>
  <path d="M400 202 L400 226" stroke="#565653" stroke-width="2"/><path d="M394 220 L400 228 L406 220 Z" fill="#565653"/>
  <rect x="180" y="230" width="440" height="52" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="196" y="253" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">3  WITHDRAWALS</text>
  <text x="196" y="272" font-family="monospace" font-size="10" fill="#565653">move the results back to you</text>
  <path d="M400 282 L400 306" stroke="#565653" stroke-width="2"/><path d="M394 300 L400 308 L406 300 Z" fill="#565653"/>
  <rect x="180" y="310" width="440" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="196" y="333" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">4  REQUIRE THE BALANCE CHANGES</text>
  <text x="196" y="352" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">every declared change must hold, or the whole transaction reverts</text>
  <text x="400" y="404" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The proxy runs the same four steps every time, and the numbers it checks in step 4 are the</text>
  <text x="400" y="420" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">exact balance changes the device showed you, so the screen and the chain cannot disagree.</text>
</svg>

A revert costs you only gas. The declared changes are the whole safety property: if the call does anything other than what you required of your balances, step 4 throws it away.

```solidity
// Solidity 0.8.24, Ethereum mainnet
interface IBalanceProxy {
    // token == address(0) means native ETH.
    // For diffs, balance is a signed minimum change: the actual change must be at least this.
    // For approvals and withdrawals, balance is the amount to move.
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

You state each requirement as a minimum. A requirement of `+2,800 USDC` means the call must leave you at least 2,800 USDC richer or it reverts. Because the number is signed, `-1.00 ETH` means you may lose at most 1 ETH. One signed floor covers both directions, so a swap becomes a pair of them: lose at most 1 ETH, gain at least 2,800 USDC.

## Where the numbers on the screen come from

A hardware wallet could never read the target contract's interface, because for a new contract it does not have one. That was the whole reason it fell back to a hash. The proxy removes that dependency. It has a fixed, well-known address and a fixed interface on every network, so the device can decode the proxy's own arguments straight from an interface it always knows. Your balance requirements are ordinary arguments to that interface. The device reads the token's address from those same arguments, and for a token it recognizes it shows the symbol and formats the amount using the token's decimals. That is how it can print `2,800 USDC` instead of a raw integer.

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

<text x="360" y="360" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The device reads the balance changes from the proxy's own known interface, so it needs no</text>
<text x="360" y="376" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">knowledge of the target contract, and the same numbers are enforced on-chain.</text>
</svg>

## The display and the enforcement are the same numbers

This is what separates ERC-8009 from a smarter decoder. A decoder shows you a prediction. If the prediction is wrong, or the device is tricked, the transaction still runs. ERC-8009 shows you the balance changes and enforces those same numbers on-chain. The figures on the screen are the figures the contract requires. If the real result comes out worse than the screen said, the transaction reverts and you lose only gas.

That closes the gap the Bybit attack used. A compromised website can still show you a lie, and a compromised computer can still build a malicious call. What neither can do is make the chain accept a result that violates the balance changes you signed. The screen cannot promise one thing while the chain does another, because both read from the same requirements.

## What the guarantee gives you

A transaction you route through ERC-8009 has two possible endings. Either it produces the balance changes you approved, or it reverts and costs you gas. There is no third ending where it runs and does something else, which is the ending the Bybit attack depended on. You no longer have to understand the target contract, keep a whitelist current, or trust that a decoder read the calldata correctly. You read two or three numbers, decide whether they match what you meant to do, and the chain holds the transaction to them.
