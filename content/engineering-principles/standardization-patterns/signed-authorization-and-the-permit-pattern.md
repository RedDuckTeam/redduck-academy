---
id: 1441863887
title: Signed authorization and the permit pattern
type: lecture
order: 2
faq:
  - question: How can someone act on my behalf if I am not online?
    answer: You express your consent in advance as a message signed with your private
      key. Anyone can carry that signed message to the target system and present it
      together with the action it permits. The system checks the signature against your
      public key and executes, so the only thing that has to be present at that moment is
      your agreement, which the message carries in your place.
  - question: What has to be inside a signed authorization?
    answer: At a minimum it must name who is allowed to act, the exact action permitted,
      the specific system it applies to, and a time after which it expires, plus a guard
      so the same message cannot be replayed. A signature that omits any of these can be
      presented in a situation the signer never intended, such as an old grant used
      years later or a single approval spent more than once.
  - question: Does every token support signed approvals like permit?
    answer: No. Only a token whose contract implements the permit extension can verify an
      offline approval signature, because that verification happens inside the token
      contract itself. A token without it still requires the holder to send an on-chain
      approval transaction and pay the fee for it.
---

> Sometimes you need to let someone else act for you on a system you cannot reach right now. You may have no account there, no open session, or no way to pay for the action at the moment it has to happen. Your consent does not require your presence. It can be a message you sign offline, at no cost, that anyone can carry to the system and present alongside the action it permits.

## The permission you cannot give in person

You want a print shop to fetch one photo from your private cloud storage and print it. Normally you would sign in to the storage provider and grant the shop access from inside your account. But the shop's kiosk has no way to open your account, and you are not standing there to log in for it. The permission is yours to give. The one place it has to take effect, your storage account, is a place you cannot act from at the moment the shop needs it.

## Consent can travel as a message

The move is to separate the consent from the act of using it. You do not have to be the one who performs the action on the target system. What the system needs is proof that you agreed, and that proof can be a message you sign with your private key. The signature is something only you could produce, and anyone can check it against your public key.

So you sign the authorization offline, at no cost, and hand the signed message to whoever will act. That party carries it to the target system and presents it together with the action it permits. The system verifies the signature and, in one step, treats the action as authorized and carries it out. You were never online at that moment. Your agreement arrived ahead of you, inside a message.

<svg role="img" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Consent authored offline by the signer, then carried by anyone and checked at the target system</title><desc>A left-to-right flow. The signer creates a signed authorization offline at no cost. The authorization is a message binding who is authorized, the exact action, the target system, an expiry, and a one-time anti-replay value. Anyone carries that message to the target system, which verifies the signature and executes the action. The signer is absent when the check and the action happen.</desc>
  <text x="360" y="28" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Consent is authored once, then carried and checked later</text>

  <rect x="15" y="110" width="155" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="92" y="150" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Signer</text>
  <text x="92" y="170" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">creates offline,</text>
  <text x="92" y="184" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">at no cost</text>

  <rect x="235" y="68" width="230" height="178" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="350" y="92" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Signed authorization</text>
  <line x1="250" y1="102" x2="450" y2="102" stroke="#ffffff" stroke-width="1"/>
  <g font-family="monospace" font-size="10" fill="#ffffff">
    <text x="250" y="126">who:   the authorized party</text>
    <text x="250" y="152">what:  the exact action</text>
    <text x="250" y="178">where: the target system</text>
    <text x="250" y="204">until: an expiry time</text>
    <text x="250" y="230">once:  an anti-replay value</text>
  </g>

  <rect x="545" y="110" width="160" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="625" y="145" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Target system</text>
  <text x="625" y="165" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">verifies signature,</text>
  <text x="625" y="179" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">executes action</text>

  <defs>
    <marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <line x1="170" y1="155" x2="233" y2="155" stroke="#565653" stroke-width="2" marker-end="url(#fa)"/>
  <text x="201" y="146" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">signs</text>
  <line x1="465" y1="155" x2="543" y2="155" stroke="#565653" stroke-width="2" marker-end="url(#fa)"/>
  <text x="503" y="143" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">anyone carries</text>

  <text x="360" y="298" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">The signer is offline and absent when the system checks the signature and runs the action.</text>
</svg>

## A pre-signed URL is exactly this

Go back to the photo. Instead of granting the shop access to your whole account, you generate a pre-signed URL for that one image, a link to the single object with a signature attached, valid for a limited time. File storage services such as Amazon S3 provide this directly. You hand the link to the shop. The kiosk opens it, and the signature carried in the link is what the storage service checks before releasing the image. The shop never needed an account, and you never needed to be online when the kiosk fetched the file. The authorization was made in advance and traveled inside the URL.

## The signed cheque, as an illustration

An everyday version, offered only to fix the shape in mind, is a signed cheque. You write it and sign it at home. The person you give it to presents it at the bank days later. The bank does not need you standing there. It verifies your signature on the paper, and that signature is what authorizes the payment. The signer and the moment of use are in different places and different times, joined only by the signed instrument.

## What a signed authorization has to pin down

A signature by itself only proves who signed. It says nothing about what they meant to allow, and a signature attached to too little can be presented in situations the signer never had in mind. A sound **signed authorization** binds four things and guards against a fifth problem:

- Who is authorized. The specific party allowed to act, so a message meant for one cannot be used by another.
- What exactly is authorized. The precise action and its limits, so a permission to do one small thing cannot be stretched into a larger one.
- On which system. The exact target, so an authorization for one system cannot be presented on a different one that happens to read the same format.
- Until when. An expiry, so a grant does not stay live forever waiting to be misused.
- Not more than once. A guard against replay, usually a one-time value, so the same signed message cannot be presented again to repeat the action.

Leave one of these out and the gap is concrete. With no expiry, an old authorization still works years later. With no target named, a signature meant for a test system can be replayed against the real one. With no replay guard, a single approval can be spent again and again.

## Sign more than your name

When you build or use a signed authorization, treat the signature as the easy part. The work is in what it commits to. Before you sign, make sure the message names who may act, the exact action, the system it is for, and the time it stops being valid. Make sure it can also be used only once. A signature over all of that is a permission you can hand to a stranger and let them carry across time, without it turning into a permission you never meant to give.

## Blockchain application

Skip this section if you only want the principle. On many blockchains, letting another party spend your tokens through the standard ERC-20 approval flow takes two transactions: one approve call to grant the allowance, then a transferFrom that spends it. The first has to be sent by the token holder, and sending it requires already holding the chain's native currency to pay for the transaction. EIP-2612, the permit extension, applies signed authorization to remove that burden. The holder signs an approval message offline, and anyone can submit it together with the spend in a single transaction.

EIP-712 gives that message its binding structure, so the approval is human-readable and tied to a specific token contract and chain. That covers the who, what, and where from the list above. Only a token that implements EIP-2612 supports this flow, because the token contract itself has to verify the signature. ERC8009's permit router, examined in depth in [the clear signing module](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack), builds on this same mechanism.
