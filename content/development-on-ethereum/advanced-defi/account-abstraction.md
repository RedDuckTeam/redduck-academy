---
id: 173
title: Account abstraction
type: lecture
order: 3
faq:
  - question: What is the difference between ERC-4337 and EIP-7702?
    answer: >-
      Two routes to account abstraction. ERC-4337 sits on top of the protocol, live since March
      2023. You sign a UserOperation, a bundler batches it into a real transaction, and a
      singleton EntryPoint enforces validation and payment. EIP-7702 came with Pectra in May
      2025, a type 0x04 transaction carrying an authorization signed by your own key that
      points your existing EOA at a smart-wallet contract.
  - question: Can a dApp pay my gas, or can I pay it in USDC?
    answer: >-
      Both, through a paymaster. It covers the gas for a UserOperation, either sponsoring you
      outright or taking USDC and paying the ETH itself. Under EIP-7702 a relayer pays instead.
  - question: If I sign a 7702 authorization, do I lose my address?
    answer: >-
      It stays yours. The code becomes 0xef0100 followed by the implementation address, so
      calls to you run that contract against your storage. Your key still signs normal
      transactions.
  - question: I lost my signing key. Can a smart account recover?
    answer: >-
      Only if you named guardians first. They can replace the signing key after a delay.
  - question: Can I use a passkey instead of a seed phrase?
    answer: >-
      Yes. The account validates a WebAuthn signature from your phone's secure enclave.
---

> Every Ethereum account today is one of two things: an **EOA** controlled by a private key, or a **contract account** controlled by code. EOAs can initiate transactions but their behavior is fixed by the protocol. Contracts can have any behavior but cannot initiate transactions on their own. **Account abstraction** is the umbrella term for changing this. The goal is to let accounts be controlled by arbitrary code while still being able to send transactions.

## What's wrong with EOAs

An EOA is an account at an address derived from a public key, controlled by the corresponding private key, with a balance attached to it. The protocol allows only one kind of authorization: a transaction signed by the matching private key, using ECDSA on the secp256k1 curve.

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

A smart account is a contract that holds your funds and decides for itself what counts as a valid operation. The code can require two signatures from a 2-of-3 multisig. It can accept a passkey signature from your phone instead of an ECDSA signature. It can require a transaction below a daily spending limit to go through automatically while above-limit transactions wait for a second approver.

The one thing a contract cannot do is initiate a transaction. Only an EOA can, so without something to bridge the two sides a smart account is passive and waits to be called.

Two approaches are in production. **ERC-4337** is an application-layer solution that went live on Ethereum mainnet in March 2023 and works without any consensus change. **EIP-7702** is a protocol-layer change that activated in the Pectra upgrade in May 2025.

## ERC-4337: smart accounts without changing the protocol

The constraint that smart contracts can't initiate transactions is at the EVM level. Changing it would mean a hard fork. ERC-4337 leaves it in place: the user signs off-chain, and someone else turns the signature into a real transaction. The [gasless approvals lesson](/courses/development-on-ethereum/advanced-defi/gasless-approvals) used the same move for one function, `permit`, where a relayer submits the owner's signature and pays the gas.

The obvious way to apply it to a whole account is for the wallet's developer to run the relayer, a server with an EOA that takes each signed request and calls the user's smart account. Then every account of that wallet works only while that one server is running and agrees to serve it.

ERC-4337 lets anyone do the relaying. The user signs a struct called a **UserOperation** that describes what they want done: which contract to call, with what data, paid for somehow. They send it to a service called a **bundler** instead of submitting it to the regular mempool. The bundler is an EOA running a node. It collects UserOperations, batches them into a single real transaction, and submits that transaction to the chain. The bundler pays gas for the submission.

A bundler pays up front for operations from accounts it knows nothing about, so before it includes one it has to know that it will be paid back. It cannot study the code of every wallet to find out. So the bundler's transaction calls one singleton contract, the **EntryPoint**, which runs the same fixed protocol for each UserOperation in the batch:

1. Ask the user's smart account "is this UserOperation valid?" The smart account checks the signature however it wants (ECDSA, passkey, multisig, ZK proof, whatever) and either accepts or rejects.
2. Have the smart account execute whatever the UserOperation asked for.
3. Make sure someone pays the bundler back for gas, plus a small profit tip.

Validation is a separate step from execution so that a bundler can run it before putting an operation into a batch, and drop the operations that would not pay.

In code, step 1 is a function the account implements. This one is written against version 0.7 of the reference ERC-4337 contracts and accepts a signature from a single `owner` key:

```solidity
function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
    external
    returns (uint256 validationData)
{
    require(msg.sender == address(entryPoint), "only EntryPoint");
    bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
    bool signedByOwner = ECDSA.recover(hash, userOp.signature) == owner;
    if (missingAccountFunds > 0) {
        (bool ok, ) = payable(msg.sender).call{value: missingAccountFunds}("");
        require(ok, "prefund failed");
    }
    return signedByOwner ? SIG_VALIDATION_SUCCESS : SIG_VALIDATION_FAILED;
}
```

The EntryPoint calls it with the hash of the UserOperation and `missingAccountFunds`, the ETH the account still has to send to cover the operation's maximum gas cost. The function accepts calls only from the EntryPoint, checks whether `owner` signed the hash, and sends the missing ETH before anything is executed. After execution the EntryPoint pays the bundler out of that ETH and keeps the rest as the account's deposit. A signature from another key makes the function return `SIG_VALIDATION_FAILED` instead of reverting. The EntryPoint then rejects the operation by reverting the whole `handleOps` call, which undoes the ETH transfer too. Returning instead of reverting lets a wallet simulate the operation with a placeholder signature from any key, for example to estimate its gas, before the user has signed it. That is also why the ETH goes out whatever the signature check found: an account that returned before paying would fail the EntryPoint's prefund check, and the simulation would stop there.

Step 3 is where **paymasters** come in. If the user has ETH, they can pay the bundler directly out of their smart account's balance. If they don't, they can point to a paymaster, which is a separate contract that agrees to cover the gas. The EntryPoint then takes the gas from the paymaster's deposit and passes the account zero as `missingAccountFunds`. Paymasters might require payment in USDC, might check that the call is to an allowlisted dApp, might sponsor the user as part of a subscription. The protocol stays neutral about why the paymaster is willing to pay.

The cost of this design is operational complexity. ERC-4337 deliberately avoided protocol changes, which meant inventing a parallel mempool, a parallel transaction format, and an ecosystem of bundlers and paymasters. None of that is part of Ethereum's core protocol. It all lives in contracts and off-chain services. The account also depends on bundlers: if only a few exist and they all refuse to include UserOps from certain users (sanctioned addresses, for example), those users are de-facto blocked from using 4337. The mitigation is many independent bundlers, and the protocol's open structure aims to keep the barrier to entry low.

Signature verification still costs gas. A smart account that does ECDSA on every UserOp pays roughly the same for the check as an EOA would. More complex schemes (multisig, ZK proofs) cost more. The operation as a whole costs more than a plain transaction, because the EntryPoint's steps run on chain on top of the call itself.

## EIP-7702: smart accounts at the protocol level

Instead of building infrastructure around EOAs, EIP-7702 lets an EOA act as a smart account directly, at its own address.

It introduces a new transaction type (type `0x04`, the SetCode transaction) that includes an **authorization list**. Each authorization is signed by an EOA's private key and says "set my account's code to point to this contract."

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
  <text x="40" y="208" font-family="monospace" font-size="11" font-weight="bold">Step 1. Alice signs an authorization with her private key:</text>
  <rect x="40" y="222" width="640" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="246" font-family="monospace" font-size="10" font-weight="bold">Authorization tuple:</text>
  <text x="60" y="266" font-family="monospace" font-size="10">  chainId:      1</text>
  <text x="60" y="282" font-family="monospace" font-size="10">  address:      0xSmartWalletImpl...     ← contract whose code to use</text>
  <text x="60" y="298" font-family="monospace" font-size="10">  nonce:        7</text>
  <text x="40" y="324" font-family="monospace" font-size="11" font-weight="bold">Step 2. Anyone submits a type-0x04 transaction with that authorization:</text>
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

After a SetCode transaction is processed, the EOA's account state gets a **delegation indicator**: a small piece of data starting with `0xef0100` followed by the address of the implementation contract. The EVM treats this as the EOA's code. When anyone calls the EOA's address, the EVM looks up the indicator, finds the implementation contract, and executes its code in the context of the EOA's storage. None of the 4337 infrastructure is needed for this.

**Only the account's own key can delegate it.** The authorization is signed by the EOA's private key, and the protocol checks this signature before applying the delegation, like it checks a transaction signature. The type-0x04 transaction that carries the authorization can be submitted by anyone, so a relayer can pay its gas.

**The delegation lasts until the key replaces it.** It stays in place across transactions until Alice signs another authorization, which could be to a different contract, or to the zero address to revoke.

**The key keeps all of its power.** Alice's private key still works for signing regular transactions. The delegation adds the ability to also be called as a contract, and the two paths coexist.

That last property is the price of 7702. Whoever holds the key can send a regular transaction that ignores the code's spending limits and second approvers, or sign a new authorization that removes them. The key cannot be rotated either, because the address is derived from it. So no rule in the delegated code can lock out a thief who has the key, and the seed phrase has to be guarded as carefully as before.

The authorization is the other risk. It hands the account's storage and balance to the code it names, so a user tricked into signing an authorization for a malicious contract has given that contract the whole account. The gasless approvals lesson described the same phishing with `permit` signatures, where one signature gave the attacker the user's whole balance of one token.

## The features come down to who signs, who pays, and what runs

Who may sign is decided in validation. A smart account can implement `validateUserOp` to accept WebAuthn signatures, so users authenticate with their device's biometric and the key never leaves the secure enclave on their phone. It can accept a session key, a temporary, restricted key for a specific dApp: "this key can spend up to 100 USDC, only on the game contract, for the next 4 hours." The dApp can then submit operations within those bounds without re-prompting. It can let designated guardians (other addresses the user trusts) collectively replace a lost signer after a delay.

Who pays is decided by the paymaster in 4337, or by a relayer sending the type-0x04 transaction in 7702: a dApp covers gas for first-time users, or the user pays in USDC and the paymaster pays the ETH. What runs can be several calls in one operation: approve USDC, swap for ETH, and stake the ETH take one signature, where an EOA sends three transactions.

## Use 4337 for new addresses and 7702 for existing ones

4337 alone makes sense when users are starting fresh and willing to use a new address that's a contract from day one. 7702 is the right fit for existing users with EOAs that already have an on-chain history: they don't have to move funds to a new address, they sign one authorization and their existing account gets smart-wallet logic. The two are used together when the delegated implementation supports the 4337 interface, so the same wallet integrates with bundlers and paymasters.

## The account is as safe as the code that controls it

A smart account moves the risk from one key to the code that controls the account, and to whoever can replace that code. In February 2025 the exchange Bybit lost about 1.46 billion dollars from a Safe, a multisig wallet contract. The attackers got its signers to approve a transaction that replaced the code the wallet runs, and then emptied it. The [upgradeable contracts lesson](/courses/development-on-ethereum/token-security-and-evm-internals/upgradeable-contracts-and-proxies) covered the mechanism. A 7702 authorization is the same kind of change, and it takes one signature.

The code is also shared. A bug in the implementation contract is a bug in every account delegated to it, and the same holds for the EntryPoint.

EIP-7702 has pitfalls around storage compatibility. If two different implementation contracts use the same storage slots for different things, switching delegation between them can leave your account's state in a meaningless configuration. The fix is to use stable storage layouts (often via ERC-7201 namespaced storage) so swapping implementations doesn't conflict.

For any account design, yours or one you are about to use, ask who can move the funds if each of its keys leaks, and who can if a bug is found in the code that controls the account.
