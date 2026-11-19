---
id: 171
title: Gasless approvals
type: lecture
order: 1
faq:
  - question: I hold USDC but no ETH. Can I still approve a spender?
    answer: >-
      Yes, with a gasless approval. Sign an ERC-2612 permit off chain and let someone else pay
      the gas.
  - question: What does EIP-712 add over signing a plain hash?
    answer: >-
      Structure the wallet can display, and a domain that binds the signature. The domain
      carries name, version, chain ID and verifying contract, so the same signature validates
      nowhere else. The digest is keccak256 over 0x1901, the domain separator and the message
      hash.
  - question: My permit call reverts with an invalid signer. What is wrong?
    answer: >-
      Almost always the domain. Name, version, chain ID and verifying contract have to match
      the token byte for byte, and a mismatch reverts with no hint which field is wrong.
  - question: Can someone front-run my permit?
    answer: >-
      Yes. Anyone who sees it can submit it first, setting the allowance and consuming the
      nonce, so your own call fails. Check the allowance first, and keep deadlines short, 30
      minutes for a swap.
---

> Approving an ERC-20 has always cost a transaction. The owner has to call `approve(spender, amount)` on the token contract, which means they need ETH for gas. If someone receives USDC and has no ETH, they can't authorize anyone to spend it. **ERC-2612** fixes this by letting the owner sign a message off-chain that says "I authorize this spender for this amount."

## An approval costs the owner a transaction

The classic approval flow is two transactions. The owner calls `approve` to set an allowance. The spender then calls `transferFrom` to move tokens. The owner pays gas for the first, the spender pays for the second.

This works fine when the owner already holds ETH. Someone receiving stablecoins for the first time might have zero ETH in their wallet, and then they have to acquire ETH somehow just to pay for the approval.

It also makes dApp UX worse. A DEX swap on Uniswap, for example, requires the user to sign two transactions in a row: one approving the router to spend their input token, then the swap itself.

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
  <text x="60" y="140" font-family="monospace" font-size="10" font-weight="bold">TX 1. Owner pays gas:</text>
  <text x="60" y="158" font-family="monospace" font-size="10" fill="#565653">  token.approve(spender, 100)</text>
  <text x="60" y="190" font-family="monospace" font-size="10" font-weight="bold">TX 2. Spender pays gas:</text>
  <text x="60" y="208" font-family="monospace" font-size="10" fill="#565653">  token.transferFrom(owner, ..., 100)</text>
  <rect x="60" y="232" width="270" height="48" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="195" y="252" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">Owner needs ETH for TX 1</text>
  <text x="195" y="270" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">No ETH = can't use their tokens</text>
  <rect x="370" y="80" width="310" height="210" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="105" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">permit + transferFrom</text>
  <line x1="390" y1="115" x2="660" y2="115" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="390" y="140" font-family="monospace" font-size="10" font-weight="bold">Off-chain. Owner pays NOTHING:</text>
  <text x="390" y="158" font-family="monospace" font-size="10" fill="#565653">  signs a message in their wallet</text>
  <text x="390" y="190" font-family="monospace" font-size="10" font-weight="bold">TX 1. Anyone can pay the gas:</text>
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

Permit separates the authorization (who agrees) from the execution (who submits the transaction). The owner signs a message saying "I authorize Bob to spend 100 USDC of mine." This signature can be produced offline at zero cost. Then anyone can submit that signature on chain. The token contract verifies the signature and updates the allowance as if the owner had called `approve` directly. It is the split from the [off-chain computation lesson](/courses/development-on-ethereum/defi-tasks-and-patterns/off-chain-computation-on-chain-verification): the consent is produced off-chain, and the contract only checks it.

## A signature over a bare hash proves too little

To make this work, the owner has to sign something. The naive approach is to sign `keccak256("approve Bob 100")` as raw bytes. There are three problems with that.

First, **the wallet has no idea what the user is signing.** All it sees is an opaque hash. The display reads "Sign message: 0x9a73f2c8..." and the user has no way to verify what that hash means. Malicious dApps have exploited this by tricking users into signing hashes that secretly authorize transfers to attacker-controlled addresses: the user thinks they're signing a login token and is approving an unlimited token allowance. The [Bybit hack lesson](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack) shows the same failure on hardware wallets, where signers approved a hash they could not read and about 1.46 billion dollars was stolen.

Second, **signatures are cross-application by default.** A signature for "approve Bob 100" on the USDC contract on Ethereum mainnet would also be valid on a clone of USDC on Polygon, or on a different token contract with the same logic. There's nothing in the bare signature that ties it to a specific contract or chain.

Third, **the signature can be submitted again, and it never expires.** Nothing in "approve Bob 100" says how many times it may be used or until when. After Bob has spent the 100, anyone who holds the signature can submit it again and restore the allowance, a minute later or a year later.

[**EIP-712**](https://eips.ethereum.org/EIPS/eip-712), the standard introduced in 2017, fixes the first two. It defines a way to sign typed structured data in two layers: a **domain** and a **message**.

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

The **message** carries the actual content as named, typed fields, so the wallet can display it in a human-readable form: who's authorizing whom for how much, plus a nonce and a deadline.

The final digest that gets signed combines both layers:

```
digest = keccak256(0x1901 || domainSeparator || messageHash)
```

`domainSeparator` is the hash of the domain fields, and `messageHash` is the hash of the message fields. The `0x1901` prefix guarantees this digest can't collide with the digest of a regular Ethereum transaction, which uses a different prefix. The signer doesn't have to know any of this, their wallet builds the digest from the typed data and signs it.

## ERC-2612 adds a nonce and a deadline

[**ERC-2612**](https://eips.ethereum.org/EIPS/eip-2612) is the standard that applies EIP-712 to ERC-20 approvals. The permit message has these fields:

```
Permit(
  address owner,
  address spender,
  uint256 value,
  uint256 nonce,
  uint256 deadline
)
```

The last two fields answer the third problem. The token keeps a counter `nonces[owner]`, and a permit is valid only if it was signed with the current value of that counter. Every successful permit increments the counter, which is how the contract prevents a signature from being submitted twice. The frontend reads the next valid nonce from `nonces(owner)` before signing. The `deadline` is the time after which the token rejects the signature.

## In code

The implementation of `permit` does four things in sequence: check the deadline, rebuild the digest the owner signed, recover the signer's address from the signature, and verify the recovered signer is the claimed owner. If all four pass, the contract calls `_approve`, the internal function that OpenZeppelin's `ERC20` also uses for `approve`. The function below belongs to a token contract that inherits OpenZeppelin's `ERC20` and `EIP712` and keeps a `nonces` mapping from owner to counter:

```solidity
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
```

`PERMIT_TYPEHASH` is a precomputed hash of the `Permit` type definition, and `structHash` is the `messageHash` of the formula above. `_hashTypedDataV4(structHash)` is a helper of OpenZeppelin's `EIP712` base contract, which receives the domain's name and version in the constructor. It combines the struct hash with the contract's domain separator according to that formula. `v`, `r` and `s` are the three parts of the owner's signature.

`nonces[owner]++` returns the current nonce and increments it for next time in one expression. If the same signature is submitted again, the digest is rebuilt with the new nonce and the signer check fails.

`ECDSA.recover` returns the address that signed the digest. The built-in `ecrecover` does this too, but `ECDSA.recover` from OpenZeppelin adds malleability protection, rejecting non-canonical s values that would let an attacker generate two valid signatures from one.

## The owner signs, and whoever has ETH submits

On the frontend, sign with the wallet library's typed-data method, such as viem's `signTypedData`, which builds the `0x1901` prefix and the domain separator for you. If you hash the data yourself and call a generic `sign` method, the wallet shows the user a bare hash again. Every field of the domain must match what the contract uses, byte for byte. A wrong name, wrong version, or wrong chain ID will produce a signature that the contract rejects with `InvalidSigner`, with no indication of which field was wrong. Mismatches here are a common cause of permit failures.

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

<text x="360" y="78" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">off-chain, no gas, no chain interaction</text>

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

<text x="360" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">on chain, in one transaction</text>

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

The owner sends the message and signature to a relayer. The relayer might be the spender themselves, a dApp, a dedicated meta-transaction service, or any third party with both an interest in the transfer happening and ETH to pay for gas. Almost always, the relayer follows `permit` in the same transaction with a `transferFrom` call that actually moves the tokens. The relayer pays the gas and either recoups it through a fee or sponsors the user.

## Limits and risks of permit

**The token has to implement it.** The token contract itself verifies the signature, so a token deployed without a `permit` function cannot accept one, and its holders still need the `approve` transaction.

**Keep the deadline short.** A user who signed a permit a year ago for some forgotten dApp shouldn't be vulnerable when that dApp resurfaces and submits the old signature. For a swap, 30 minutes is enough.

**Permit signatures can be front-run.** Since the signature is just bytes, anyone who sees it can submit it themselves. They can't change who the allowance goes to, but they can submit the permit before the user's intended transaction, which then fails because the nonce has already been consumed. The allowance is set for the spender the owner signed for, but the `transferFrom` that was supposed to follow in the same transaction did not happen. Production code should handle this case, usually by checking if the allowance already matches before submitting permit.

**Approval scams predate permit but are amplified by it.** The infinite approval from the [ERC-20 lesson](/courses/development-on-ethereum/token-security-and-evm-internals/what-is-erc-20), here a permit signed for `type(uint256).max` so subsequent operations don't need new permits, is convenient but means any vulnerability in the spender drains all the user's tokens of that type. Many real-world wallet drainer attacks have used social engineering to trick users into signing permits for max value to malicious contracts. EIP-712's readable preview helps, but doesn't help if users approve without reading.

When you design a signed message of your own, check it against the same three problems. It has to name who may act and what they may do, the contract and chain it is for, the time it stops being valid, and a value that makes it usable only once.
