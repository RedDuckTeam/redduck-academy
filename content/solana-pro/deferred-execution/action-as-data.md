---
title: Action as data
type: lecture
order: 20
faq:
  - question: What is action as data?
    answer: >-
      The future action is stored on-chain instead of being signed and executed now. A PDA holds
      the target program, the accounts and the instruction data, plus the condition. When the
      condition is met, someone sends an execute transaction, and the program signs the stored
      action with the PDA through invoke_signed.
  - question: Why can't a user sign a transaction and let a server submit it later?
    answer: >-
      A Solana transaction carries a recent blockhash and is valid for about a minute. After that
      the signature is useless. A durable nonce keeps one prebuilt transaction valid longer, but
      its accounts and data cannot change, and the signature works once.
  - question: Who signs the stored action when it executes?
    answer: >-
      The PDA signs for the user. The user gave the PDA authority over what the action needs, for example by moving
      tokens into an account the PDA owns, at the moment the action was stored. The executor only
      brings the accounts and pays the fee.
  - question: Is a stored action private?
    answer: >-
      No, it is public. Everything in an account is public, so anyone can read the action before it executes.
      That is also why anyone can execute it.
  - question: What does the pattern cost?
    answer: >-
      Rent for every pending action, and the funds locked until it runs. So every stored action
      needs a way to be cancelled or to expire, otherwise the funds are stuck.
  - question: How do Squads and Realms use it?
    answer: >-
      A proposal is an account that stores the instructions. Members or voters approve it over
      days. When the vote passes, an executor runs the stored instructions, and the vault or
      governance PDA signs for them.
---

> Some actions need a signer who will be offline when the time comes, or a condition that is not true yet. A limit order waits for a price, and a multisig transaction waits for the other signers. On Solana a signed transaction cannot wait, because its signature dies within a minute. Something else has to hold the user's intent until its time comes.

## A signature lasts a minute

Every Solana transaction includes a recent blockhash, and the network accepts the transaction only while that blockhash is still recent, which is about a minute. An older transaction is rejected, so its signature is useless after that.

Because of this, the usual EVM flow is not possible on Solana. On EVM a user can sign an order once and let a server submit it when the price is right. On Solana a signed order cannot wait for a taker, and approvals for a multisig cannot be collected over a week.

Solana has durable nonces for longer-lived transactions. Such a transaction uses a nonce account instead of a blockhash and stays valid until the nonce is used. But it is still a single fixed transaction, with the accounts and the data set at signing, and the signature can be used once.

The naive solution is a server that keeps the user's request and signs a transaction with its own key when the time comes. This is a bad solution, because the server now controls the user's money: it can crash, it can censor the user, and it can be taken over, and in every one of these cases the user loses control of their own funds.

## Store the action, not the signature

Instead of signing a transaction, the user stores the action itself in an account. The account holds four things: the target program, the list of accounts, the instruction data, and the condition under which the action may run.

This account is a PDA of the protocol's program. At the moment of storing, the user hands the PDA what the action needs. For example, if the action will spend tokens, the user moves those tokens into an account the PDA owns.

When the condition is met, anyone sends an execute transaction. The program checks the condition, reads the stored instruction, and calls the target program with `invoke_signed`, the call that lets a program sign for its own PDA. This means the PDA signs in place of the user. The executor only brings the accounts and pays the fee. The user signed once, when the action was stored, and does not have to be online again.

With **action as data**, the action is public from the moment it is stored, so anyone can read it, and anyone can execute it once the condition is met.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The action is stored in an account</title><desc>In the middle, a PDA account card holds a pending action: program swap, the accounts, the data sell 10 SOL, and the condition price at or above 150. On the left, the user at 10:00 stores the action and locks the tokens, signing once. On the right, a keeper at 14:00 sends execute, and the PDA signs the call to the swap program through invoke signed. A crossed-out note shows that a signed transaction would have expired after about a minute.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The action is stored in an account</text>
  <rect x="250" y="80" width="220" height="190" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="250" y="80" width="220" height="28" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">PDA: pending action</text>
  <text x="262" y="132" text-anchor="start" font-size="10" fill="#000000" font-family="monospace">program:   swap</text>
  <text x="262" y="162" text-anchor="start" font-size="10" fill="#000000" font-family="monospace">accounts:  user tokens, pool</text>
  <text x="262" y="192" text-anchor="start" font-size="10" fill="#000000" font-family="monospace">data:      sell 10 SOL</text>
  <text x="262" y="222" text-anchor="start" font-size="10" fill="#000000" font-family="monospace">condition: price &gt;= 150</text>
  <line x1="250" y1="148" x2="470" y2="148" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="250" y1="178" x2="470" y2="178" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="250" y1="208" x2="470" y2="208" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <rect x="40" y="140" width="150" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="115" y="160" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">user</text>
  <text x="115" y="178" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">10:00</text>
  <line x1="190" y1="165" x2="240.0" y2="165.0" stroke="#000000" stroke-width="2"/>
  <polygon points="240.0,159.0 240.0,171.0 250,165" fill="#000000"/>
  <text x="220" y="153" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">store</text>
  <text x="115" y="215" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">locks the tokens</text>
  <text x="115" y="229" text-anchor="middle" font-size="9.5" fill="#ed4937" font-family="monospace" font-weight="bold">signs once</text>
  <rect x="530" y="96" width="150" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="605" y="116" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">keeper, anyone</text>
  <text x="605" y="134" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">14:00, price is 150</text>
  <line x1="530" y1="121" x2="480.0" y2="121.0" stroke="#000000" stroke-width="2"/>
  <polygon points="480.0,127.0 480.0,115.0 470,121" fill="#000000"/>
  <text x="500" y="109" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">execute</text>
  <rect x="550" y="220" width="130" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="615" y="240" text-anchor="middle" font-size="11" fill="#000000" font-family="monospace" font-weight="bold">swap program</text>
  <text x="615" y="258" text-anchor="middle" font-size="9.5" fill="#565653" font-family="monospace">sells 10 SOL</text>
  <line x1="470" y1="245" x2="540.0" y2="245.0" stroke="#000000" stroke-width="2"/>
  <polygon points="540.0,239.0 540.0,251.0 550,245" fill="#000000"/>
  <text x="510" y="236" text-anchor="middle" font-size="8.5" fill="#ed4937" font-family="monospace" font-weight="bold">PDA signs</text>
  <text x="510" y="260" text-anchor="middle" font-size="8.5" fill="#ed4937" font-family="monospace">invoke_signed</text>
  <rect x="40" y="290" width="220" height="44" fill="#e0deda" stroke="#565653" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="150" y="309" text-anchor="middle" font-size="10" fill="#565653" font-family="monospace">a signed transaction instead</text>
  <text x="150" y="324" text-anchor="middle" font-size="9.5" fill="#ed4937" font-family="monospace">would have expired after a minute</text>
  <text x="360" y="372" text-anchor="middle" font-size="11" fill="#565653" font-family="monospace" font-style="italic">The user signs once, at 10:00. At 14:00 the PDA signs for them.</text>
</svg>

## Squads: a proposal is an account with instructions

Squads is a multisig, and its members are rarely online at the same time.

A multisig transaction in Squads is an account that stores the full list of instructions it will execute. Members approve it one by one, over hours or days, and each approval is a small transaction of its own. When enough members have approved, a member sends the execute transaction. The program runs the stored instructions with the vault PDA as the signer, through `invoke_signed`. The vault owns the funds, so the stored action can move them, and no member's key is needed at execution time.

## Realms: anyone executes a passed proposal

Realms is the governance program behind most Solana DAOs, and after a vote that took days there is nobody in particular to execute the result.

A proposal stores its instructions in accounts next to it, and voters vote over days. When the vote passes, there is a hold-up time, a delay during which the proposal can still be stopped. After it the proposal enters the executing state, and from there the stored instructions can be run by anyone, at any time. The governance PDA is the authority over the treasury, so it signs for the instructions. The person who sends the transaction only pays the fee.

## Jupiter: an order is an account with a price

A Jupiter limit order is an account with a price and a size. When the order is placed, the tokens being sold are moved into an account the program controls. A DCA order is the same idea with a schedule instead of a price. When the price or the time comes, a keeper sends the transaction that executes the stored swap. The user has not signed anything since the order was placed.

## What the stored action costs

Every pending action is an account, so someone pays rent for it, and the funds it will spend are locked until it runs. If the action never runs, the funds stay locked. So every stored action needs a way out: the user can cancel it, or it expires after a deadline and the funds return.

## If it has to wait, store it

A signature is good for a minute, so it cannot wait for anything. Every time a design says that the user signs now and something happens later, the later part cannot be a signed transaction. It has to be an account: the action written down on-chain, waiting for its condition, with a PDA that signs for the user when the condition is met.
