---
id: 1004741960
title: Root of trust
type: lecture
order: 10
faq:
  - question: What is the root of trust in a Solana program?
    answer: >-
      It is an account that the caller could not have created, for example a PDA of your
      program or an account with a hardcoded address. Since the caller sends every account and
      can create most of them, comparing two of them with each other proves nothing. At least
      one check has to use an account the caller could not have made.
  - question: My deposit instruction checks that the token account's mint equals the vault's mint. Is that enough?
    answer: >-
      Only if the caller could not have created the vault. A vault and a token account with
      the same mint cost almost nothing to create. So the program also has to check that the
      vault's address is a PDA of your program. Then the vault is real, and so is the mint
      check.
  - question: Why can anyone create an account that my program owns?
    answer: >-
      Because your program has an instruction that creates them, and anyone can call it. So
      the owner check only proves that your program wrote the account, not that it is the one
      you wanted. The address still has to come from seeds, or from a field in an account that
      already has a root.
  - question: How did the Wormhole program accept signatures that were never checked?
    answer: >-
      The signatures are checked by a built-in program that returns nothing, so Wormhole read
      the transaction's instruction list to confirm that the check had run. It took that list
      from the account the caller passed and never compared its address with the real sysvar
      address. The caller passed a normal account with a fake successful check inside.
  - question: What did Cashio check, and what did it not check?
    answer: >-
      It checked that the collateral token account matched the bank, and that the Saber pool
      accounts matched each other. It never checked that the bank was one of the protocol's
      own, and anyone could create one. So the caller created a bank, a pool and token accounts
      that all matched, and minted CASH with no real collateral.
  - question: The runtime fills the instructions sysvar. Why do I still need to compare its address?
    answer: >-
      The runtime fills the account at the sysvar address, but the caller can pass a different
      account in its place. If the program does not compare the address, it reads whatever the
      caller wrote there, including a fake successful signature check.
---

> Solana's architecture is different from the majority of blockchains in the way that it requires transaction callers to specify which state should be referenced by the program, unlike many other blockchains where the programs decide which accounts/state to reference themselves. Some protocols did not account for this difference and suffered exploits. To avoid it, a program should utilize the **root of trust** pattern, which we'll cover in this lecture. 

## The Problem

Solana programs will only read the state of accounts that they got instructed to read by the transaction caller. 

So the transaction caller could theoretically specify fake accounts, including those that would pass validity checks that the program performs. Creating the fake accounts costs almost nothing, and in the worst case scenario, the caller could perform an exploit utilizing this architecture, and take everything the program holds. 

The same is true for other inputs too, such as oracle address,  In every case the program sees data that looks right, but that data can be faked. This principle can be used for many attacks derived from it: 

* Pass an oracle address that represents a fake oracle
* Pass a fake sysvar account with malicious instructions to be executed by the program

... And many more possible exploits just based on this one attack vector.

## Root of Trust

To avoid any potential issues related to fake accounts, the program must have some trustable account from the very beginning. This account could be specified as an address inside the program's code, or its address could be automatically calculated with the code of the program, but the idea behind this solution is that the account would be the ultimate root point of trust, that would allow the program to determine whether the addresses that users pass to it can be trusted or not.

There are many kinds of accounts you could use for this purpose.

* **PDA** of your program. Its address is computed from the seeds and your program id, and only your program can create such an account.
* **Whitelisted accounts**, such as the SPL Token program or the sysvar. The sysvar is a system account with a fixed address that the runtime fills with data, such as the current clock time.

Ultimately, the pattern of having the root of trust in your programs means you should have one or many root trustable sources that allow you to see whether the accounts your program is prompted to reference are valid and non-malicious. 

You could have SPL Token Program being the root of trust for the token programs, or PDA account being used to verify other custom accounts. The most important requirement for your program here is to have at least one root point that can help distinguish between malicious and valid accounts.

<svg role="img" viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Root of trust</title><desc>A chain of five accounts from the caller, drawn dashed, each one checked against the next, ending at one solid red account with a lock: the root, which the caller cannot create.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Root of trust</text>
  <rect x="60" y="120" width="90" height="50" rx="0" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="105" y="150" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">account</text>
  <line x1="150" y1="145" x2="167.0" y2="145.0" stroke="#000000" stroke-width="2"/>
  <polygon points="167.0,139.0 167.0,151.0 178,145" fill="#000000"/>
  <rect x="180" y="120" width="90" height="50" rx="0" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="225" y="150" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">account</text>
  <line x1="270" y1="145" x2="287.0" y2="145.0" stroke="#000000" stroke-width="2"/>
  <polygon points="287.0,139.0 287.0,151.0 298,145" fill="#000000"/>
  <rect x="300" y="120" width="90" height="50" rx="0" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="345" y="150" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">account</text>
  <line x1="390" y1="145" x2="407.0" y2="145.0" stroke="#000000" stroke-width="2"/>
  <polygon points="407.0,139.0 407.0,151.0 418,145" fill="#000000"/>
  <rect x="420" y="120" width="90" height="50" rx="0" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="465" y="150" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">account</text>
  <line x1="510" y1="145" x2="527.0" y2="145.0" stroke="#000000" stroke-width="2"/>
  <polygon points="527.0,139.0 527.0,151.0 538,145" fill="#000000"/>
  <rect x="548" y="110" width="120" height="70" rx="0" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <path d="M 599 134 v -8 a 9 9 0 0 1 18 0 v 8" fill="none" stroke="#ed4937" stroke-width="2.5"/>
  <rect x="595" y="134" width="26" height="20" rx="3" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <circle cx="608" cy="144" r="3" fill="#e0deda" stroke="#e0deda" stroke-width="2"/>
  <text x="608" y="172" text-anchor="middle" font-size="11" fill="#ed4937" font-family="monospace" font-weight="bold">root</text>
  <text x="300" y="100" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">from the caller: can be faked</text>
  <text x="608" y="100" text-anchor="middle" font-size="10" fill="#ed4937" font-family="monospace" font-weight="bold">cannot be faked</text>
  <text x="360" y="228" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">Every check depends on the next one. The chain has to end at something the caller could not create.</text>
</svg>

## Cashio: anyone could create a bank

Cashio was a stablecoin, and it lost about 50 million dollars because anyone could create a bank. A user put LP tokens from a Saber pool into Cashio as collateral and received CASH for them. To mint CASH, the user passed three things to the program. The first was a bank account, which says which collateral is accepted. The second was the user's token account with the collateral. The third was the Saber pool accounts, which say what that collateral is worth.

The hole was in what the program compared. It checked that the collateral token account matched the bank, and that the Saber pool accounts matched each other. It never checked that the bank was one of the protocol's own, and the instruction that creates banks was open to anyone. So one caller faked the bank, the pool and the token accounts, minted two billion CASH with no real collateral, and took about 50 million dollars out of the liquidity pools. None of the checks used an account the caller could not have created.

## Wormhole: the list of instructions came from the caller

Wormhole is a bridge between chains, and it lost about 320 million dollars because its program read the list of instructions from an account that the caller passed in. A message from another chain comes with the guardians' signatures, and the program has to verify them before it mints wrapped ETH. Signatures are verified by a built-in Solana program, Secp256k1 or Ed25519 depending on the signature type. It is not something your program calls. The caller puts it into the transaction as a separate instruction, right before the instruction of your program, and a bad signature fails the whole transaction.

```typescript
const tx = new Transaction().add(
  // instruction 0: the built-in program verifies the signature.
  // It returns nothing. If the signature is bad, the whole transaction fails.
  Ed25519Program.createInstructionWithPublicKey({ publicKey, message, signature }),

  // instruction 1: the bridge program. It cannot call instruction 0 and cannot
  // ask it for a result. It can only read the instructions sysvar to see
  // that instruction 0 is there and what it verified.
  bridgeInstruction,
);
```

So the bridge program reads the list of instructions in the transaction from the instructions sysvar, an account that the runtime fills with that list, and checks that the built-in program was called.

The hole was in one missing comparison. The program read that list from whatever account the caller passed as the sysvar, and never compared its address with the real sysvar address. So the caller passed a normal account with a fake successful signature check inside, the program believed that the guardians had signed, and minted 120,000 wrapped ETH out of nothing. In 2022 that was about 320 million dollars, still the largest hack on Solana. The signature format, the guardian set and the message layout were all checked correctly, but all of that was read from a list that came from the caller.

## Switchboard: A good example

Switchboard On-Demand is an oracle, and it reads the same list of instructions from the same sysvar, but it does it correctly. Its oracles sign price updates off-chain, and the program that uses price data has to verify the signature. It uses the same built-in Ed25519 program and the same instructions sysvar as Wormhole.

The difference is the order of the checks. Switchboard first compares the sysvar account with the real sysvar address. Only then it reads the instruction list, finds the Ed25519 instruction, and checks that the key in it is the oracle's key and the message is the price it is about to use. Each check depends on the previous one, and the first depends on a hardcoded address, so the whole chain has a root. In this case, the root is the sysvar account.

Switchboard does not have more checks than Wormhole had, it just has the same checks but in a different order, with one hardcoded address of the sysvar account at the start. That one comparison is why Switchboard didn't get hacked and Wormhole did.

## Summary

Every piece of data the program receives has to be finally referenced by the root of trust in the end of the chain of validation checks. The chain either ends at something that cannot be faked, or the program has to fail.