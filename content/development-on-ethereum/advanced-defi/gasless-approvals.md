---
id: 171
title: Gasless approvals
type: lecture
order: 1
faq:
  - question: How can someone approve a token to be spent without paying gas or even
      holding ETH?
    answer: ERC-2612 adds a permit function that accepts an off-chain signature
      instead of an on-chain approve transaction. The token owner signs a
      message saying 'I authorize this spender for this amount' at zero cost,
      then anyone (the spender, the dApp, or a relayer) can submit that
      signature on chain and pay the gas. The token contract verifies the
      signature and sets the allowance exactly as if the owner had called
      approve directly. This lets a first-time user who received a stablecoin
      but has no ETH still authorize spending it, and lets a DEX swap drop from
      two wallet pop-ups to one signature.
  - question: Why does EIP-712 show me a readable message instead of a scary hex
      blob when I sign?
    answer: Signing a raw hash is dangerous because the wallet only sees opaque
      bytes, so scammers have tricked users into signing hashes that secretly
      authorize transfers. EIP-712 defines a way to sign typed structured data
      with a 'domain' and a 'message', so the wallet knows the fields and can
      show something human-readable like 'Approve 0xBob to spend 100 USDC.' The
      domain also binds the signature to a specific contract name, version,
      chain ID, and address, so a signature meant for USDC on mainnet won't
      validate on a clone or a different chain.
  - question: Can a permit signature be replayed or front-run by someone else?
    answer: "A permit can't be replayed on the same contract because each signature
      includes a nonce that the contract increments after use, so submitting it
      twice fails. It can, however, be front-run: since the signature is just
      bytes, anyone who sees it can submit it first, which sets the allowance
      but consumes the nonce so the user's intended follow-up transaction fails.
      Production code usually checks whether the allowance already matches
      before calling permit. You should also set a short deadline so an old
      forgotten signature can't be used against you later, and be wary of
      signing infinite (max value) approvals to untrusted contracts."
---

> Approving an ERC-20 has always cost a transaction. The owner has to call `approve(spender, amount)` on the token contract, which means they need ETH for gas. If someone receives USDC and has no ETH, they can't authorize anyone to spend it. **ERC-2612** fixes this by letting the owner sign a message off-chain that says "I authorize this spender for this amount."

## The problem permit solves

The classic approval flow is two transactions. The owner calls `approve` to set an allowance. The spender then calls `transferFrom` to move tokens. Both transactions cost gas. The owner pays for the first, the spender pays for the second.

This works fine when the owner already holds ETH. It breaks when they don't. Someone receiving stablecoins for the first time might have zero ETH in their wallet. To use the tokens, they first have to acquire ETH somehow just to pay for the approval. From the user's perspective, holding a valuable token they can't spend without paying for it in a different token feels broken.

It also makes dApp UX worse. A DEX swap on Uniswap, for example, requires the user to sign two transactions in a row: one approving the router to spend their input token, then the swap itself. Two wallet pop-ups, two waits for confirmations, two gas fees, for what feels like a single action.

<svg role="img" viewBox="0 0 720 520" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Classic approve+transferFrom vs permit+transferFrom transaction flow</title><desc>Two side-by-side panels compare token approval methods: the classic flow needs two transactions, approve then transferFrom, and the owner must hold ETH to pay gas for the first one. The permit flow replaces that with an off-chain signature, so the owner pays nothing and anyone, such as a spender or relayer, can pay gas for the single on-chain transaction. A panel below lists three practical benefits: first-time users without ETH can spend tokens, DEX swaps drop from two wallet pop-ups to one signature, and gasless dApps let a relayer cover gas costs.</desc>
  <defs>
    <marker id="arrP1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Old approve flow needs two transactions. Permit collapses it into one.</text>
  <rect x="40" y="80" width="310" height="210" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="105" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">Classic approve + transferFrom</text>
  <line x1="60" y1="115" x2="330" y2="115" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="140" font-family="monospace" font-size="10" font-weight="bold">TX 1 — Owner pays gas:</text>
  <text x="60" y="158" font-family="monospace" font-size="10" fill="#565653">  token.approve(spender, 100)</text>
  <text x="60" y="190" font-family="monospace" font-size="10" font-weight="bold">TX 2 — Spender pays gas:</text>
  <text x="60" y="208" font-family="monospace" font-size="10" fill="#565653">  token.transferFrom(owner, ..., 100)</text>
  <rect x="60" y="232" width="270" height="48" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="195" y="252" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">Owner needs ETH for TX 1</text>
  <text x="195" y="270" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">No ETH = can't use their tokens</text>
  <rect x="370" y="80" width="310" height="210" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="105" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">permit + transferFrom</text>
  <line x1="390" y1="115" x2="660" y2="115" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="390" y="140" font-family="monospace" font-size="10" font-weight="bold">Off-chain — Owner pays NOTHING:</text>
  <text x="390" y="158" font-family="monospace" font-size="10" fill="#565653">  signs a message in their wallet</text>
  <text x="390" y="190" font-family="monospace" font-size="10" font-weight="bold">TX 1 — Anyone can pay the gas:</text>
  <text x="390" y="208" font-family="monospace" font-size="10" fill="#565653">  token.permit(...) + transferFrom(...)</text>
  <rect x="390" y="232" width="270" height="48" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="525" y="252" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">Owner needs no ETH at all</text>
  <text x="525" y="270" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Spender, relayer, dApp pays gas</text>
  <rect x="40" y="320" width="640" height="180" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="345" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">Why this matters in practice</text>
  <line x1="60" y1="355" x2="660" y2="355" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="378" font-family="monospace" font-size="10" font-weight="bold">First-time users:</text>
  <text x="60" y="395" font-family="monospace" font-size="10">They received tokens but have no ETH. Now they can spend without buying gas first.</text>
  <text x="60" y="420" font-family="monospace" font-size="10" font-weight="bold">DEXes and DeFi protocols:</text>
  <text x="60" y="437" font-family="monospace" font-size="10">Approval + swap was 2 wallet pop-ups. Now it's 1 signature, then submit both calls.</text>
  <text x="60" y="462" font-family="monospace" font-size="10" font-weight="bold">Gasless dApps / meta-transactions:</text>
  <text x="60" y="479" font-family="monospace" font-size="10">A relayer service pays gas on behalf of users, recouping cost via fees or sponsorship.</text>
</svg>

The core idea: separate the authorization (who agrees) from the execution (who submits the transaction). The owner signs a message saying "I authorize Bob to spend 100 USDC of mine." This signature can be produced offline at zero cost. Then anyone, the spender themselves or a relayer service or even a different user, can submit that signature on chain. The token contract verifies the signature and updates the allowance as if the owner had called `approve` directly.

## EIP-712: signing structured data

To make this work, the owner has to sign something. A naive approach: sign `keccak256("approve Bob 100")` as raw bytes. There are two problems with that.

First, **the wallet has no idea what the user is signing.** All it sees is an opaque hash. The display reads "Sign message: 0x9a73f2c8..." and the user has no way to verify what that hash means. Malicious dApps have exploited this by tricking users into signing hashes that secretly authorize transfers to attacker-controlled addresses. The user thinks they're signing a login token; they're actually approving an unlimited token allowance.

Second, **signatures are cross-application by default.** A signature for "approve Bob 100" on the USDC contract on Ethereum mainnet would also be valid on a clone of USDC on Polygon, or on a different token contract with the same logic, or replayed in a different chain entirely. There's nothing in the bare signature that ties it to a specific contract, chain, or even application.

[**EIP-712**](https://eips.ethereum.org/EIPS/eip-712) was the standard introduced in 2017 to fix both problems. It defines a way to sign typed structured data so that:

1. Wallets know the structure of what's being signed and can display it in a human-readable form.
2. The signature is bound to a specific domain, preventing cross-app and cross-chain replay.

The structure has two layers: a **domain** and a **message**.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>EIP-712 signing: domain and Permit message hashed into a final digest</title><desc>The diagram shows a Domain box (name, version, chainId, verifyingContract) and a Permit message box (owner, spender, value, nonce, deadline) both feeding into a Final digest computed as keccak256("\x19\x01" || domainHash || messageHash), which is signed with the owner's key to produce (v, r, s). Below, it shows what the wallet displays to the user, such as "Approve 0xBob... to spend 100 USDC", instead of an opaque hex blob.</desc>
  <defs>
    <marker id="arrP2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">EIP-712 wraps the message in domain + type so the wallet can display it</text>
  <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">What gets signed:</text>
  <rect x="40" y="100" width="310" height="116" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="122" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Domain</text>
  <text x="195" y="135" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">prevents cross-app and cross-chain replay</text>
  <line x1="60" y1="142" x2="330" y2="142" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="160" font-family="monospace" font-size="10">  name:             "USD Coin"</text>
  <text x="60" y="176" font-family="monospace" font-size="10">  version:          "1"</text>
  <text x="60" y="192" font-family="monospace" font-size="10">  chainId:          1</text>
  <text x="60" y="208" font-family="monospace" font-size="10">  verifyingContract: 0xA0b8...EB48</text>
  <rect x="40" y="232" width="310" height="140" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="254" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Permit message</text>
  <text x="195" y="267" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">the actual approval data</text>
  <line x1="60" y1="274" x2="330" y2="274" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="292" font-family="monospace" font-size="10">  owner:    0xAlice...</text>
  <text x="60" y="308" font-family="monospace" font-size="10">  spender:  0xBob...</text>
  <text x="60" y="324" font-family="monospace" font-size="10">  value:    100 USDC</text>
  <text x="60" y="340" font-family="monospace" font-size="10">  nonce:    3</text>
  <text x="60" y="356" font-family="monospace" font-size="10">  deadline: 1735689600</text>
  <line x1="360" y1="236" x2="430" y2="236" stroke="#ed4937" stroke-width="2" marker-end="url(#arrP2)"/>
  <text x="395" y="225" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937">hash</text>
  <rect x="430" y="155" width="250" height="200" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="555" y="180" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Final digest</text>
  <line x1="450" y1="190" x2="660" y2="190" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="555" y="212" text-anchor="middle" font-family="monospace" font-size="9">keccak256(</text>
  <text x="555" y="226" text-anchor="middle" font-family="monospace" font-size="9">  "\x19\x01" ||</text>
  <text x="555" y="240" text-anchor="middle" font-family="monospace" font-size="9">  domainHash ||</text>
  <text x="555" y="254" text-anchor="middle" font-family="monospace" font-size="9">  messageHash</text>
  <text x="555" y="268" text-anchor="middle" font-family="monospace" font-size="9">)</text>
  <text x="555" y="298" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">→ signed with</text>
  <text x="555" y="314" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">owner's key</text>
  <text x="555" y="334" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">produces (v, r, s)</text>
  <text x="40" y="408" font-family="monospace" font-size="11" font-weight="bold">What the wallet displays to the user:</text>
  <rect x="40" y="420" width="640" height="140" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="446" font-family="monospace" font-size="11" font-weight="bold">  Sign request from: USD Coin</text>
  <text x="60" y="468" font-family="monospace" font-size="10">  Approve 0xBob... to spend 100 USDC from your account</text>
  <text x="60" y="486" font-family="monospace" font-size="10">  on chain 1, valid until 2025-01-01</text>
  <text x="60" y="514" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Without EIP-712 the wallet would show only an opaque hex blob:</text>
  <text x="60" y="532" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  "Sign 0x1901bf3e... ?"</text>
  <text x="60" y="548" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Users had no way to verify what they were approving.</text>
</svg>

The **domain** identifies what application and what context this signature belongs to. It contains the protocol name, version, chain ID, and the verifying contract address. A signature from USDC mainnet won't validate against USDC on a testnet, because the chain IDs differ. A signature meant for one token won't validate against another, because the verifying contract addresses differ.

The **message** carries the actual content: who's authorizing whom for how much, plus a nonce and a deadline.

The final digest that gets signed combines both layers. The exact construction:

```
digest = keccak256(0x1901 || domainSeparator || messageHash)
```

The `0x1901` prefix is a magic byte sequence defined in the standard. It guarantees this digest can't collide with the digest of a regular Ethereum transaction, which uses a different prefix. The signer doesn't have to know any of this, their wallet builds the digest from the typed data and signs it.

## ERC-2612 specifics

[**ERC-2612**](https://eips.ethereum.org/EIPS/eip-2612) is the standard that applies EIP-712 to ERC-20 approvals. It defines exactly what the message structure looks like and exactly what function signature the token must expose to accept it.

The permit message has these fields:

```
Permit(
  address owner,
  address spender,
  uint256 value,
  uint256 nonce,
  uint256 deadline
)
```

And the function the token has to add:

```solidity
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external;
```

The token also has to expose two helpers required by the standard:

```solidity
function nonces(address owner) external view returns (uint256);
function DOMAIN_SEPARATOR() external view returns (bytes32);
```

`nonces(owner)` returns the next valid nonce for that owner. Every successful permit increments this counter, which is how the contract prevents a signature from being submitted twice. `DOMAIN_SEPARATOR()` returns the precomputed hash of the domain — the token's name, version, chain ID, and contract address — so off-chain code can build the correct digest directly.

## How the on-chain side works

The implementation of `permit` does four things in sequence: check the deadline, rebuild the digest the owner signed, recover the signer's address from the signature, and verify the recovered signer is the claimed owner. If all four pass, the contract calls its own internal approval logic.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract MyTokenPermit is ERC20, EIP712 {
    mapping(address => uint256) public nonces;

    bytes32 private constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );

    error PermitExpired();
    error InvalidSigner();

    constructor(string memory name_)
        ERC20(name_, "MTP")
        EIP712(name_, "1")
    {}

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (block.timestamp > deadline) revert PermitExpired();

        bytes32 structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(digest, v, r, s);
        if (signer != owner) revert InvalidSigner();

        _approve(owner, spender, value);
    }
}
```

(remove this sentence; the paragraphs that follow stand on their own)

The `PERMIT_TYPEHASH` is a precomputed hash of the message type definition. It encodes "this is a Permit struct with these field types." The exact string must match character for character, with no spaces between fields. This is part of the EIP-712 spec.

`nonces[owner]++` is doing two things in one expression: returning the current nonce and incrementing it for next time. Reading and incrementing in a single expression prevents a class of bugs where an incorrect nonce is included in the digest.

`_hashTypedDataV4(structHash)` is OpenZeppelin's helper that combines the struct hash with the contract's domain separator according to the `\x19\x01 || ...` formula. The `EIP712` base contract handles caching the domain separator at deployment time so this stays cheap on repeated reads.

`ECDSA.recover` is signature verification. Given a digest and the signature components (v, r, s), it returns the address that signed the digest. If the recovered address matches the claimed owner, the signature is valid. The standard `ecrecover` opcode does this, but `ECDSA.recover` from OpenZeppelin adds malleability protection, rejecting non-canonical s values that would let an attacker generate two valid signatures from one.

If all checks pass, the function calls `_approve(owner, spender, value)`, which is the same internal helper that the regular `approve` function calls. From the rest of the contract's perspective, this is now an authorized allowance, indistinguishable from one set by a direct `approve` call.

## The full lifecycle

<svg role="img" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>EIP-712 permit flow: owner signs off-chain, relayer submits and transfers on-chain</title><desc>Five steps show the owner building and signing an EIP-712 message off-chain, then sending it to a relayer. On-chain, the relayer submits one transaction that calls permit to verify the signature and set the allowance, then calls transferFrom to move the tokens, so the owner pays zero gas.</desc>

<defs>

<marker id="arrPL" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">

<path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>

</marker>

</defs>

<!-- Title bar -->

<rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>

<text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Owner signs off-chain. Anyone submits on-chain. The chain checks the signature.</text>

<!-- Off-chain section label -->

<text x="360" y="78" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">— off-chain, no gas, no chain interaction —</text>

<!-- Step 1 -->

<rect x="40" y="92" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<circle cx="72" cy="122" r="14" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>

<text x="72" y="127" text-anchor="middle" font-family="monospace" font-size="12" fill="#ffffff" font-weight="bold">1</text>

<text x="100" y="118" font-family="monospace" font-size="11" font-weight="bold">Owner builds and signs the EIP-712 message</text>

<text x="100" y="138" font-family="monospace" font-size="10" fill="#565653" font-style="italic">wallet shows the preview (spender, value, deadline) and returns signature (v, r, s)</text>

<!-- Arrow 1 -->

<line x1="360" y1="158" x2="360" y2="180" stroke="#ed4937" stroke-width="2" marker-end="url(#arrPL)"/>

<!-- Step 2 -->

<rect x="40" y="186" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<circle cx="72" cy="216" r="14" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>

<text x="72" y="221" text-anchor="middle" font-family="monospace" font-size="12" fill="#ffffff" font-weight="bold">2</text>

<text x="100" y="212" font-family="monospace" font-size="11" font-weight="bold">Owner sends the signed message to a relayer</text>

<text x="100" y="232" font-family="monospace" font-size="10" fill="#565653" font-style="italic">the relayer can be the spender, the dApp's backend, or any third party with ETH for gas</text>

<!-- On-chain section divider and label -->

<line x1="40" y1="270" x2="680" y2="270" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="360" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">— on chain, in one transaction —</text>

<!-- Step 3 -->

<rect x="40" y="300" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<circle cx="72" cy="330" r="14" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>

<text x="72" y="335" text-anchor="middle" font-family="monospace" font-size="12" fill="#ffffff" font-weight="bold">3</text>

<text x="100" y="326" font-family="monospace" font-size="11" font-weight="bold">Relayer submits a transaction calling permit(...)</text>

<text x="100" y="346" font-family="monospace" font-size="10" fill="#565653" font-style="italic">relayer pays gas, owner's signature travels as call data</text>

<!-- Arrow 2 -->

<line x1="360" y1="366" x2="360" y2="388" stroke="#ed4937" stroke-width="2" marker-end="url(#arrPL)"/>

<!-- Step 4 -->

<rect x="40" y="394" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<circle cx="72" cy="424" r="14" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>

<text x="72" y="429" text-anchor="middle" font-family="monospace" font-size="12" fill="#ffffff" font-weight="bold">4</text>

<text x="100" y="420" font-family="monospace" font-size="11" font-weight="bold">Token contract verifies the signature</text>

<text x="100" y="440" font-family="monospace" font-size="10" fill="#565653" font-style="italic">recover signer, check it matches owner, check deadline, bump nonce, set allowance</text>

<!-- Arrow 3 -->

<line x1="360" y1="460" x2="360" y2="482" stroke="#ed4937" stroke-width="2" marker-end="url(#arrPL)"/>

<!-- Step 5 -->

<rect x="40" y="488" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>

<circle cx="72" cy="518" r="14" fill="#ed4937" stroke="#000000" stroke-width="1.5"/>

<text x="72" y="523" text-anchor="middle" font-family="monospace" font-size="12" fill="#ffffff" font-weight="bold">5</text>

<text x="100" y="514" font-family="monospace" font-size="11" font-weight="bold">Same transaction calls transferFrom</text>

<text x="100" y="534" font-family="monospace" font-size="10" fill="#565653" font-style="italic">allowance is consumed, tokens move from owner to recipient</text>

<!-- Result box -->

<rect x="40" y="568" width="640" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>

<text x="360" y="593" text-anchor="middle" font-family="monospace" font-size="12" fill="#ed4937" font-weight="bold">Done. Owner paid zero gas. Relayer collected fee or sponsored the user.</text>

</svg>

(remove this fragment; the paragraph that follows begins the explanation directly)

The owner's wallet builds the EIP-712 typed data structure with the domain (read from the token's `DOMAIN_SEPARATOR()`) and the message fields. The wallet shows the user a human-readable preview. The user clicks approve. The wallet returns a signature, broken into the three components `v`, `r`, and `s`.

The owner sends the message and signature to a relayer. The relayer might be the spender themselves, a dApp, a dedicated meta-transaction service, or any third party with both an interest in the transfer happening and ETH to pay for gas. The communication channel is arbitrary: HTTP, WebSocket, even a QR code if the owner is fully offline.

The relayer submits a transaction that calls `permit(owner, spender, value, deadline, v, r, s)`. The token contract performs the four checks: deadline, rebuild digest, recover signer, signer matches owner, and updates the allowance. Almost always, the relayer follows this in the same transaction with a `transferFrom` call that actually moves the tokens. Two function calls, one transaction.

From the owner's perspective, they signed one message in their wallet and never paid gas. From the chain's perspective, an allowance was set and consumed, equivalent to having received a normal `approve` followed by `transferFrom`.

## Signing from the frontend

In a viem-based frontend, building and signing the typed data looks like this:

```typescript
const domain = {
    name: "My Token",
    version: "1",
    chainId: 1,
    verifyingContract: tokenAddress,
} as const;

const types = {
    Permit: [
        { name: "owner",    type: "address" },
        { name: "spender",  type: "address" },
        { name: "value",    type: "uint256" },
        { name: "nonce",    type: "uint256" },
        { name: "deadline", type: "uint256" },
    ],
} as const;

const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value: 100n * 10n ** 18n,
    nonce: await tokenContract.read.nonces([ownerAddress]),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
} as const;

const signature = await walletClient.signTypedData({
    account: ownerAddress,
    domain,
    types,
    primaryType: "Permit",
    message,
});

// Split into v, r, s for the contract call
const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
const v = parseInt(signature.slice(130, 132), 16);
```

Every field in `domain` must match exactly what the contract uses, byte for byte. A wrong name, wrong version, or wrong chain ID will produce a signature that the contract will reject as invalid, with no helpful error message about what went wrong. Mismatches here are a common cause of permit failures, and the contract gives no indication of which field was wrong.

Viem's `signTypedData` — and equivalents in other wallet libraries — takes the typed data structure and produces the signature. Don't try to hash the data manually and call a generic `sign` method; the helper handles the `\x19\x01` prefixing, the canonical JSON encoding, and the domain separator calculation correctly.

## Security considerations

**The deadline matters.** Without it, a signature lasts forever. A user who signed a permit a year ago for some forgotten dApp shouldn't suddenly be vulnerable when that dApp resurfaces and submits the old signature. Set deadlines short by default. A swap should give itself 30 minutes, not 30 days.

**Permit signatures can be front-run.** Since the signature is just bytes, anyone who sees it can submit it themselves. They can't change who the allowance goes to but they can submit the permit before the user's intended transaction, which then fails because the nonce has already been consumed. The result: the user's approval went through but their intended follow-up did not. They're now exposed to anyone with that allowance until the spender uses or revokes it. Production code should handle this case, usually by checking if the allowance already matches before submitting permit.

**The nonce prevents replay within one contract** but does not prevent the same logical permit from being signed twice with different nonces. If a user signs permit-with-nonce-3, the dApp submits it, and the user later signs another permit-with-nonce-4 for the same spender and amount, the second one is also valid. Wallets that batch operations need to track nonces carefully to avoid signing conflicting permits.

**Approval scams predate permit but are amplified by it.** The "infinite approval" pattern (signing permit for `type(uint256).max` so subsequent operations don't need new permits) is convenient but means any vulnerability in the spender drains all the user's tokens of that type. Many real-world wallet drainer attacks have used social engineering to trick users into signing permits for max value to malicious contracts. EIP-712's readable preview helps, but doesn't help if users approve without reading.
