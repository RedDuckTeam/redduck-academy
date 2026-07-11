---
id: 173
title: Account abstraction
type: lecture
faq:
  - question: What is account abstraction and what's so limiting about a normal
      Ethereum wallet?
    answer: "A normal wallet is an externally owned account (EOA) controlled by one
      private key, and the protocol accepts exactly one kind of authorization:
      an ECDSA signature from that key. It can start transactions but its
      behavior is fixed and can't be customized. A smart-contract account can
      enforce any logic you can write, such as multisig, passkeys, daily
      spending limits, key rotation, or social recovery, but on its own it can't
      initiate a transaction. Account abstraction is the work of bridging that
      gap so code-controlled accounts can both be flexible and send
      transactions."
  - question: What's the difference between ERC-4337 and EIP-7702?
    answer: "ERC-4337 is an application-layer approach live since March 2023 that
      needs no protocol change: users sign an off-chain 'UserOperation', a
      service called a bundler batches these into a real transaction routed
      through a singleton EntryPoint contract, and optional paymasters can cover
      gas. EIP-7702 is a protocol-level change from the Pectra upgrade (May
      2025) that lets an existing EOA delegate its code to a smart-wallet
      contract via a new transaction type, so the same address gains
      smart-account behavior without moving funds. 4337 fits users starting
      fresh with a new contract account, 7702 fits existing EOAs, and serious
      wallets increasingly use both together."
  - question: Can a dApp pay my gas for me, or can I pay gas in USDC instead of ETH?
    answer: Yes, account abstraction makes both possible. With ERC-4337 a paymaster
      contract can agree to cover the gas, either sponsoring first-time users
      entirely or accepting payment in a token like USDC and paying the actual
      ETH cost on your behalf; with EIP-7702 a relayer can submit the
      transaction for you. This turns onboarding from 'first buy ETH, then use
      our app' into 'just use our app, we'll cover gas,' and lets users hold and
      spend stablecoins without ever needing ETH in their wallet.
  - question: Can I recover my wallet or avoid seed phrases with a smart account?
    answer: Yes. A smart account can implement social recovery, where trusted
      guardian addresses you designate can collectively replace your signing key
      after a delay if you lose access, so a single lost key doesn't wipe you
      out. It can also authenticate with passkeys, accepting a WebAuthn
      signature from your phone's secure enclave so there is no seed phrase to
      lose. Other unlocked features include session keys that grant a temporary,
      spending-limited key to a specific app, and batching several actions like
      approve-swap-stake into one signed operation.
---

> Every Ethereum account today is one of two things: an **EOA** controlled by a private key, or a **contract account** controlled by code. EOAs can initiate transactions but their behavior is fixed by the protocol. Contracts can have any behavior but cannot initiate transactions on their own. **Account abstraction** is the umbrella term for changing this. The goal is to let accounts be controlled by arbitrary code while still being able to send transactions. This lecture covers what AA is, the two production approaches today (ERC-4337 and EIP-7702), and the kinds of features they unlock: passkeys, social recovery, sponsored gas, batched operations, and session keys.

## What's wrong with EOAs

An EOA is an account at an address derived from a public key, controlled by the corresponding private key, with a balance attached to it. The protocol allows exactly one kind of authorization: a transaction signed by the matching private key, using ECDSA on the secp256k1 curve. That's it.

This works but it's restrictive in a long list of ways.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>EOA vs smart account: what changes when code controls your account</title><desc>Two columns compare an EOA and a smart account across signature scheme, gas payment, key loss, multiple signers, batched operations, and spending limits. The EOA is powerful but rigid and cannot be customized, while the smart account is flexible but can't self-initiate transactions without ERC-4337 or EIP-7702.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">EOA vs smart account: what changes when code controls your account</text>
  <rect x="40" y="80" width="310" height="430" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="106" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">EOA  (Externally Owned Account)</text>
  <text x="195" y="122" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">controlled by a private key</text>
  <line x1="60" y1="132" x2="330" y2="132" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="156" font-family="monospace" font-size="10" font-weight="bold">Signature scheme:</text>
  <text x="60" y="172" font-family="monospace" font-size="10" fill="#565653">  ECDSA on secp256k1, period</text>
  <text x="60" y="200" font-family="monospace" font-size="10" font-weight="bold">Gas payment:</text>
  <text x="60" y="216" font-family="monospace" font-size="10" fill="#565653">  must hold ETH, no alternatives</text>
  <text x="60" y="244" font-family="monospace" font-size="10" font-weight="bold">Lose the key:</text>
  <text x="60" y="260" font-family="monospace" font-size="10" fill="#565653">  account is gone forever</text>
  <text x="60" y="288" font-family="monospace" font-size="10" font-weight="bold">Multiple signers:</text>
  <text x="60" y="304" font-family="monospace" font-size="10" fill="#565653">  not natively possible</text>
  <text x="60" y="332" font-family="monospace" font-size="10" font-weight="bold">Batched operations:</text>
  <text x="60" y="348" font-family="monospace" font-size="10" fill="#565653">  one tx, one action</text>
  <text x="60" y="376" font-family="monospace" font-size="10" font-weight="bold">Spending limits, allowlists:</text>
  <text x="60" y="392" font-family="monospace" font-size="10" fill="#565653">  no, key is all-or-nothing</text>
  <text x="60" y="420" font-family="monospace" font-size="10" font-weight="bold">Initiate transactions:</text>
  <text x="60" y="436" font-family="monospace" font-size="10" fill="#565653">  yes (this is the one win)</text>
  <rect x="60" y="460" width="270" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="195" y="478" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">Powerful but rigid</text>
  <text x="195" y="492" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">cannot be customized</text>
  <rect x="370" y="80" width="310" height="430" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="525" y="106" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">Smart account</text>
  <text x="525" y="122" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">controlled by contract code</text>
  <line x1="390" y1="132" x2="660" y2="132" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="390" y="156" font-family="monospace" font-size="10" font-weight="bold">Signature scheme:</text>
  <text x="390" y="172" font-family="monospace" font-size="10" fill="#565653">  whatever the code accepts</text>
  <text x="390" y="186" font-family="monospace" font-size="9" fill="#565653" font-style="italic">  passkeys, multisig, BLS, ZK proofs</text>
  <text x="390" y="214" font-family="monospace" font-size="10" font-weight="bold">Gas payment:</text>
  <text x="390" y="230" font-family="monospace" font-size="10" fill="#565653">  USDC, sponsored, paymaster</text>
  <text x="390" y="258" font-family="monospace" font-size="10" font-weight="bold">Lose the key:</text>
  <text x="390" y="274" font-family="monospace" font-size="10" fill="#565653">  social recovery via guardians</text>
  <text x="390" y="302" font-family="monospace" font-size="10" font-weight="bold">Multiple signers:</text>
  <text x="390" y="318" font-family="monospace" font-size="10" fill="#565653">  thresholds, weighted votes</text>
  <text x="390" y="346" font-family="monospace" font-size="10" font-weight="bold">Batched operations:</text>
  <text x="390" y="362" font-family="monospace" font-size="10" fill="#565653">  approve + swap + stake in one tx</text>
  <text x="390" y="390" font-family="monospace" font-size="10" font-weight="bold">Spending limits, allowlists:</text>
  <text x="390" y="406" font-family="monospace" font-size="10" fill="#565653">  session keys with scoped power</text>
  <text x="390" y="434" font-family="monospace" font-size="10" font-weight="bold">Initiate transactions:</text>
  <text x="390" y="450" font-family="monospace" font-size="10" fill="#565653">  needs help (the problem to solve)</text>
  <rect x="390" y="460" width="270" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="525" y="478" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">Flexible but can't self-initiate</text>
  <text x="525" y="492" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">needs ERC-4337 or EIP-7702</text>
</svg>

A smart account is a contract that holds your funds and decides for itself what counts as a valid operation. The code can require two signatures from a 2-of-3 multisig. It can accept a passkey signature from your phone instead of an ECDSA signature. It can require a transaction below a daily spending limit to go through automatically while above-limit transactions wait for a second approver. It can rotate keys, recover access via trusted guardians, pay gas in any token. Anything you can express in Solidity.

The catch is the one thing in the right-hand column that's missing: a contract cannot initiate a transaction. Only an EOA can. Without something to bridge the two sides, smart accounts are still passive, they wait to be called. Account abstraction is the work of building that bridge.

Two production approaches exist today. **ERC-4337** is an application-layer solution that went live on Ethereum mainnet in March 2023. It works without any consensus change. **EIP-7702** is a protocol-layer change that activated in the Pectra upgrade in May 2025. It's a smaller mechanism that achieves much of what 4337 does with less infrastructure.

## ERC-4337: smart accounts without changing the protocol

The constraint that smart contracts can't initiate transactions is at the EVM level. Changing it would mean a hard fork. ERC-4337 sidesteps the problem by building infrastructure on top that lets users sign "intent" off-chain and have someone else turn it into a real transaction.

The user signs a struct called a **UserOperation** that describes what they want done: which contract to call, with what data, paid for somehow. They send it to a service called a **bundler** instead of submitting it to the regular mempool. The bundler is just an EOA running a node. It collects UserOperations, batches them into a single real transaction, and submits that transaction to the chain. The bundler pays gas for the submission.

The bundler's transaction calls into a singleton contract called the **EntryPoint**. The EntryPoint is what makes the whole thing safe. For each UserOperation in the batch, the EntryPoint runs a fixed protocol:

1. Ask the user's smart account "is this UserOperation valid?" The smart account checks the signature however it wants (ECDSA, passkey, multisig, ZK proof, whatever) and either accepts or rejects.
2. Have the smart account execute whatever the UserOperation asked for.
3. Make sure someone pays the bundler back for gas, plus a small profit tip.

Step 3 is where **paymasters** come in. If the user has ETH, they can pay the bundler directly out of their smart account's balance. If they don't, they can point to a paymaster, which is a separate contract that agrees to cover the gas. Paymasters might require payment in USDC, might check that the call is to an allowlisted dApp, might sponsor the user as part of a subscription. The protocol stays neutral about why the paymaster is willing to pay.

From the user's point of view: they sign one message in their wallet, the dApp sends it to a bundler, and a few seconds later it's on chain. They didn't hold ETH. They didn't sign a transaction. The smart account did the work using whatever signing scheme it's configured for.

The cost of this design is operational complexity. ERC-4337 deliberately avoided protocol changes, which meant inventing a parallel mempool, a parallel transaction format, and an ecosystem of bundlers and paymasters. None of that is part of Ethereum's core protocol. It all lives in contracts and off-chain services. EIP-7702 takes the opposite approach.

## EIP-7702: smart accounts at the protocol level

Instead of building infrastructure around EOAs, EIP-7702 lets an EOA act as a smart account directly, at its own address.

The idea: introduce a new transaction type (type `0x04`, the SetCode transaction) that includes an **authorization list**. Each authorization is signed by an EOA's private key and says "set my account's code to point to this contract."

<svg role="img" viewBox="0 0 720 640" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>EIP-7702: an EOA delegates to smart wallet contract code</title><desc>Before EIP-7702, Alice's EOA is only a keypair with no code. Alice signs an authorization naming a contract address, someone submits a type-0x04 transaction with it, and afterward calls to Alice's EOA execute that contract's code while keeping her own storage and balance.</desc>
  <defs>
    <marker id="arrA3" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">EIP-7702: an EOA can borrow contract code, signed by its own private key</text>
  <text x="40" y="84" font-family="monospace" font-size="11" font-weight="bold">Before EIP-7702: an EOA is just a keypair</text>
  <rect x="40" y="100" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="124" font-family="monospace" font-size="10" font-weight="bold">EOA address  0xAlice...</text>
  <text x="60" y="146" font-family="monospace" font-size="10">  code:      (empty)</text>
  <text x="60" y="162" font-family="monospace" font-size="10">  balance:   2.5 ETH</text>
  <text x="380" y="124" font-family="monospace" font-size="10" font-style="italic" fill="#565653">When anyone calls 0xAlice...,</text>
  <text x="380" y="138" font-family="monospace" font-size="10" font-style="italic" fill="#565653">nothing executes. It's a wallet,</text>
  <text x="380" y="152" font-family="monospace" font-size="10" font-style="italic" fill="#565653">not a contract.</text>
  <text x="40" y="208" font-family="monospace" font-size="11" font-weight="bold">Step 1 — Alice signs an authorization with her private key:</text>
  <rect x="40" y="222" width="640" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="246" font-family="monospace" font-size="10" font-weight="bold">Authorization tuple:</text>
  <text x="60" y="266" font-family="monospace" font-size="10">  chainId:      1</text>
  <text x="60" y="282" font-family="monospace" font-size="10">  address:      0xSmartWalletImpl...     ← contract whose code to use</text>
  <text x="60" y="298" font-family="monospace" font-size="10">  nonce:        7</text>
  <text x="40" y="324" font-family="monospace" font-size="11" font-weight="bold">Step 2 — Anyone submits a type-0x04 transaction with that authorization:</text>
  <rect x="40" y="340" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="362" font-family="monospace" font-size="10">  type-0x04 transaction</text>
  <text x="60" y="378" font-family="monospace" font-size="10">  - authorization_list: [ Alice's signed authorization ]</text>
  <text x="60" y="394" font-family="monospace" font-size="10">  - other normal fields (to, data, gas, ...)</text>
  <text x="60" y="412" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  the submitter can be Alice OR anyone else; the auth was signed by Alice</text>
  <text x="40" y="448" font-family="monospace" font-size="11" font-weight="bold">After: Alice's EOA now executes contract code when called</text>
  <rect x="40" y="464" width="640" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="488" font-family="monospace" font-size="10" font-weight="bold">EOA address  0xAlice...</text>
  <text x="60" y="510" font-family="monospace" font-size="10">  code:      0xef0100 || 0xSmartWalletImpl...  ← delegation indicator</text>
  <text x="60" y="526" font-family="monospace" font-size="10">  balance:   2.5 ETH</text>
  <text x="60" y="548" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Calls to 0xAlice... now execute 0xSmartWalletImpl's code with Alice's storage.</text>
  <rect x="40" y="578" width="640" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="600" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">Persists until Alice signs another auth (could be to 0x0 to revoke).</text>
  <text x="360" y="616" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">Her private key still works for normal signing alongside the delegation.</text>
</svg>

After a SetCode transaction is processed, the EOA's account state gets a **delegation indicator**: a small piece of data starting with `0xef0100` followed by the address of the implementation contract. The EVM treats this as the EOA's "code." When anyone calls the EOA's address, the EVM looks up the indicator, finds the implementation contract, and executes its code in the context of the EOA's storage.

Three things to notice about this design.

The authorization is **signed by the EOA's private key**. Nobody else can delegate your account's code to a contract. The protocol checks this signature before applying the delegation, exactly like it checks a transaction signature.

The delegation **persists across transactions**. Once Alice has delegated her account to a smart wallet implementation, that delegation stays in place until she signs another authorization (which could be to a different contract, or to the zero address to revoke). She doesn't need to re-sign every time.

The EOA **doesn't lose its key-based functionality**. Alice's private key still works for signing regular transactions. The delegation just adds the ability to also be called as a contract. The two paths coexist.

This is the smaller, simpler version of account abstraction. No alternative mempool, no bundlers, no EntryPoint. The user signs one authorization, points it at a smart wallet implementation, and from that point on their EOA behaves like a smart account. They can still send normal transactions with ECDSA signatures. Anyone can also call into their address and execute the smart-wallet logic.

## What this combination enables

The features the AA community has been building toward become real once smart accounts can self-initiate. None of them are new ideas. The blockers were always at the account layer.

**Passkeys instead of private keys.** A smart account can implement `validateUserOp` to accept WebAuthn signatures. Now users authenticate transactions with their device's biometric, with no seed phrase to lose. The actual key never leaves the secure enclave on their phone.

**Social recovery.** If a user loses access to their primary signer, designated guardians (other addresses they trust) can collectively replace the signer after a delay. The account doesn't get wiped out by a lost key.

**Sponsored gas.** A dApp covers gas for first-time users via a paymaster (4337) or a relayer sending a type-0x04 transaction on the user's behalf (7702). Onboarding goes from "first buy ETH from an exchange, then use our app" to "use our app, we'll pay your gas."

**Gas in any token.** A user pays gas in USDC. The paymaster (or wrapper logic in the smart account) accepts the USDC, converts it or charges it directly, and pays the actual ETH gas to the bundler or block builder.

**Batched operations.** Approve USDC, swap for ETH, and stake the ETH, all in a single user-signed operation. No three pop-ups, no three transactions, no waiting for confirmations between them.

**Session keys.** A user authorizes a temporary, restricted key for a specific dApp: "this key can spend up to 100 USDC, only on the game contract, for the next 4 hours." The dApp can submit operations on the user's behalf within those bounds without re-prompting. When the session expires, the key is dead. This is what makes blockchain games and high-frequency apps feel native rather than transactional.

**Atomic conditional execution.** A smart account can require that a swap return at least a certain output, or that two operations both succeed or neither does. The account itself enforces the policy, so this works across protocols that don't natively support it.

## ERC-4337 vs EIP-7702: when each fits

4337 and 7702 are not mutually exclusive. A modern smart-wallet design might use both: 7702 to bring existing EOAs under contract control, then 4337 for the rich infrastructure of bundlers and paymasters when sponsored gas or alt-mempool batching matters.

**4337 alone** makes sense when users are starting fresh and willing to use a new address that's a contract from day one. Some wallet providers default to this for new users.

**7702 alone** is the right fit for existing users with EOAs that already have an on-chain history. They don't have to move funds to a new address. They just sign one authorization and their existing account gets smart-wallet logic.

**Both together** is becoming the production pattern for serious smart-wallet projects. Users start with 7702-delegated EOAs for upgrade-in-place. Their delegated implementation supports the 4337 interface, so the same wallet integrates with bundler infrastructure and paymasters for gas sponsorship.

A nice side-effect of 7702: every existing EOA can become a smart account at any time. There's no migration friction. Users who never knew or cared about smart accounts can be upgraded transparently by a wallet provider, with their consent.

## A few things to keep in mind

**The smart-account contract is itself an attack surface.** A bug in the implementation contract is a bug in every account delegated to it. Same for the EntryPoint. Both have been audited heavily but the principle stays: the security of your account depends on the security of the code controlling it.

**Bundler censorship is a real concern.** If only a few bundlers exist and they all refuse to include UserOps from certain users (sanctioned addresses, for example), those users are de-facto blocked from using 4337. The mitigation is many independent bundlers, and the protocol's open structure aims to keep the barrier to entry low.

**EIP-7702 has subtle pitfalls around storage compatibility.** If two different implementation contracts use the same storage slots for different things, switching delegation between them can leave your account's state in a meaningless configuration. The fix is to use stable storage layouts (often via ERC-7201 namespaced storage) so swapping implementations doesn't conflict.

**Signature verification still costs gas.** A smart account that does ECDSA on every UserOp pays roughly the same as an EOA would. More complex schemes (multisig, ZK proofs) cost more. The bill shows up in the verification gas limit on each UserOp.
