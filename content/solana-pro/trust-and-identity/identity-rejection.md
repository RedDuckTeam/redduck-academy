---
title: Identity rejection
type: lecture
order: 20
faq:
  - question: What is identity rejection?
    answer: >-
      The program does not care who sent the transaction, when, or why, only what it does to
      the state. A new address costs nothing, so an address check is easy to pass. A state
      check costs the same for every caller, and the only way to pass it is a transaction that
      keeps the state correct.
  - question: Does this mean my program should not check signers?
    answer: >-
      No. A withdrawal moves someone's tokens, and only the owner can agree to that, so the
      owner has to sign. A signer check answers whose tokens these are. It does not answer
      whether the action is safe for the protocol, and that second question is what this
      lecture is about.
  - question: How do launchpads stop snipers without a blacklist?
    answer: >-
      With a fee that depends on the trade, not the wallet. Meteora's fee scheduler starts
      high and drops over the first seconds or minutes of a launch, and its rate limiter adds
      an extra fee that grows with the size of a single purchase. Heaven has a sniper tax that
      goes down over the first six seconds. A bot with a fresh wallet pays the same as everyone
      else.
  - question: What went wrong with Meteora's "one swap per transaction" rule?
    answer: >-
      The check looked for other instructions named swap in the transaction. Later a second
      instruction, swap2, was added that does the same job, and nobody added it to the check.
      So a transaction could contain many swap2 calls. The rule was about the pool, but the
      check was about an instruction's name.
  - question: Why not keep a list of trusted bots for price updates?
    answer: >-
      Because then the protocol has a price only while those bots are running. A program that
      checks the update's signature and age can accept it from anyone, so the update arrives
      as long as anyone wants the trade that needs it.
  - question: When is a trusted address the right design?
    answer: >-
      For ownership. The owner signs for their tokens, and the admin signs for a fee change.
      The smaller this set of actions is, the less the protocol depends on any single address.
---

> Any wallet can call any instruction of your program, so the program has to decide which transactions to reject. The simplest way is to check who is calling. On Solana that check is easy to pass, and it makes the protocol depend on a few addresses.

## The simplest check

On Solana everything is public and any wallet can call any instruction, so the program itself has to reject the transactions it does not want.

The simplest check is a list of addresses. Is this the admin? Is it on the allowlist? Is it the bot we run? The problem is that an address costs nothing. A new keypair is generated on your own computer, with no transaction and no fee. So the protocol has to maintain a list, and the caller only needs a new keypair to pass the check.

There is a second problem. Say the protocol accepts price updates only from its own bot. Then it has a price only while that bot is running. Or it lets only its own server trigger payouts, and then payouts happen only while that server is up. Every address on the list is a dependency, and the whole point of putting a protocol on-chain was to not depend on one server.

## Check what the transaction does

A program exists to keep its state correct. A DEX keeps its pools balanced, a lending market keeps every loan covered, a vote counts every ballot once. Who sent the transaction, when, and why is not part of that job. So the program can ask a different question. Instead of asking whether the address is trusted, it asks whether the transaction keeps the state correct. Does the swap keep the pool's invariant? Does the claim pay the owner? Is the price signed by the oracle and recent?

The program answers that question from the state and the transaction data, and a new keypair changes neither. The check also costs the same whether the caller is one wallet or one of ten thousand, because the program never looks at the caller. This is **identity rejection**. The program does not depend on who is calling. It only checks what the transaction does.

There is one place where identity is still the right check, and that is ownership. A withdrawal moves someone's tokens, so the owner has to sign. An admin changes a fee, so the admin has to sign. The pattern does not remove these checks. It keeps them only for actions about ownership, and keeps that list of actions short.

## Snipers: a list or a fee

A token launch on a bonding curve is the clearest example. In the first seconds after a launch, bots buy before everyone else and sell to the normal buyers who arrive a moment later. These bots are called snipers.

The simplest answer is a blacklist of sniper wallets. It works for one launch, then the bot generates a new keypair and the list only grows. Meteora and Heaven charge for the trade instead. Meteora's fee scheduler starts the trading fee as high as 99% and lowers it over the first seconds or minutes of the launch down to the normal fee. Its rate limiter adds an extra fee that grows with the size of a single purchase above a reference amount. Heaven has a sniper tax that goes down over the first six seconds after launch.

Think about what this does to a sniper. Say the fee is 99% in the first second and 1% five seconds later. A sniper who buys in the first second keeps only 1% of what they paid for, and the normal buyers arrive once the fee is already 1%, so the sniper cannot sell at a profit. The fee depends on the time since launch and the size of the trade, and both are the same for every wallet.

This fee has a cost. An early buyer who is not a bot pays it too. The numbers in the diagram below are only an example.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>A blacklist of wallets versus a fee on the trade</title><desc>Two boxes side by side. On the left, a list of banned wallets stands between wallets and the launch pool. Wallets on the list are rejected, and a new keypair passes, so the list grows by one address per launch. On the right, a bar chart shows the trading fee falling from 99 percent at launch to 1 percent five seconds later. The fee depends on the time since launch and is the same for every wallet, so a new keypair pays the same.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">What the sniper has to pay</text>

  <rect x="40" y="80" width="300" height="230" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">A list of wallets</text>
  <rect x="55" y="122" width="105" height="96" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="107" y="140" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">the list</text>
  <text x="107" y="158" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">wallet A</text>
  <text x="107" y="174" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">wallet B</text>
  <text x="107" y="190" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">wallet C</text>
  <text x="107" y="206" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">...</text>
  <line x1="161" y1="170" x2="216" y2="170" stroke="#000000" stroke-width="2"/>
  <polygon points="214,164 214,176 224,170" fill="#000000"/>
  <text x="190" y="162" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">rejected</text>
  <rect x="55" y="240" width="105" height="26" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="107" y="257" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">new keypair</text>
  <line x1="161" y1="253" x2="216" y2="253" stroke="#ed4937" stroke-width="2"/>
  <polygon points="214,247 214,259 224,253" fill="#ed4937"/>
  <text x="190" y="280" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937">passes</text>
  <rect x="225" y="122" width="90" height="144" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="270" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">pool</text>
  <text x="270" y="206" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">at launch</text>
  <text x="190" y="298" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">costs the sniper nothing</text>

  <rect x="380" y="80" width="300" height="230" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="80" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">A fee on the trade</text>
  <text x="655" y="122" text-anchor="end" font-family="monospace" font-size="10" font-weight="bold">fee by time since launch</text>
  <line x1="405" y1="130" x2="405" y2="262" stroke="#000000" stroke-width="2"/>
  <line x1="405" y1="262" x2="660" y2="262" stroke="#000000" stroke-width="2"/>
  <rect x="420" y="137" width="30" height="125" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <rect x="460" y="174" width="30" height="88" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="500" y="205" width="30" height="57" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="540" y="230" width="30" height="32" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="580" y="249" width="30" height="13" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="620" y="260" width="30" height="2" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="435" y="131" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">99%</text>
  <text x="475" y="168" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">70%</text>
  <text x="515" y="199" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">45%</text>
  <text x="555" y="224" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">25%</text>
  <text x="595" y="243" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">10%</text>
  <text x="635" y="254" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">1%</text>
  <text x="435" y="276" text-anchor="middle" font-family="monospace" font-size="9">0s</text>
  <text x="475" y="276" text-anchor="middle" font-family="monospace" font-size="9">1s</text>
  <text x="515" y="276" text-anchor="middle" font-family="monospace" font-size="9">2s</text>
  <text x="555" y="276" text-anchor="middle" font-family="monospace" font-size="9">3s</text>
  <text x="595" y="276" text-anchor="middle" font-family="monospace" font-size="9">4s</text>
  <text x="635" y="276" text-anchor="middle" font-family="monospace" font-size="9">5s</text>
  <text x="530" y="298" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">costs the sniper 99% of the buy</text>

  <text x="360" y="332" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A new keypair is not on the list, and a keypair is free.</text>
  <text x="360" y="348" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A fee by time and size is paid by every wallet, old or new.</text>
</svg>

## Meteora: the check that knew only one instruction

The rate limiter has one more rule. A sniper could split one big buy into many small ones inside a single transaction, so that each stays under the extra fee. To stop this, the limiter allows only one swap per transaction.

How did the program enforce it? It read the transaction's instruction list from the instructions sysvar, and if another instruction for the same pool had the discriminator of the swap instruction, it rejected the transaction. The discriminator is the identifier that says which instruction this is. Later a second instruction, `swap2`, was added. It does the same swap with a different set of parameters, and nobody added it to the check. So a transaction could contain many `swap2` calls, each a swap on the pool, and the check counted none of them.

The rule was about the pool. The check was about an instruction's name, and a new instruction is as cheap as a new keypair. A check on the pool would count every instruction of this program that writes to the pool, whatever it is called, and a new instruction would not change that count.

## The same idea in other protocols

Helium pays rewards to hotspot owners, and anyone can send the claim for any device, because the money always goes to the device's owner. So the protocol never needed a list of who may claim. Pyth's pull oracle accepts a price update from any wallet and checks its signature, feed and age, not who delivered it. Monaco's order book accepts an order from anyone and only checks that it sits between the right neighbors. None of these programs asks who is calling.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>One swap per transaction, checked by name and checked by pool</title><desc>Two boxes side by side with the same transaction, which contains one swap instruction and two swap2 instructions, all on pool A. On the left, the check counts instructions named swap, finds one, and passes the transaction. On the right, the check counts instructions that write to pool A, finds three, and rejects the transaction.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">One swap per transaction</text>

  <rect x="40" y="70" width="300" height="250" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Check the name</text>
  <rect x="90" y="112" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="130" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">transaction</text>
  <text x="110" y="149" font-family="monospace" font-size="9" fill="#565653">swap      pool A</text>
  <text x="110" y="165" font-family="monospace" font-size="9" fill="#565653">swap2     pool A</text>
  <text x="110" y="181" font-family="monospace" font-size="9" fill="#565653">swap2     pool A</text>
  <line x1="190" y1="192" x2="190" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="184,216 196,216 190,226" fill="#000000"/>
  <rect x="90" y="226" width="200" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="248" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">named swap: 1</text>
  <text x="190" y="292" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">passes</text>

  <rect x="380" y="70" width="300" height="250" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Check the pool</text>
  <rect x="430" y="112" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="130" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">transaction</text>
  <text x="450" y="149" font-family="monospace" font-size="9" fill="#565653">swap      pool A</text>
  <text x="450" y="165" font-family="monospace" font-size="9" fill="#565653">swap2     pool A</text>
  <text x="450" y="181" font-family="monospace" font-size="9" fill="#565653">swap2     pool A</text>
  <line x1="530" y1="192" x2="530" y2="218" stroke="#000000" stroke-width="2"/>
  <polygon points="524,216 536,216 530,226" fill="#000000"/>
  <rect x="430" y="226" width="200" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="248" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">writes pool A: 3</text>
  <text x="530" y="292" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">rejected</text>

  <text x="360" y="346" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Same transaction. The name counts one swap, the pool counts three.</text>
</svg>

## Check what your checks depend on

Take every check in your program that compares an address, an instruction name, or a flag the client passes, and ask three questions. What bad action is this check meant to prevent? Would a new keypair, a new instruction, or a new reason pass it? What could the program check in the state instead, so that the bad action itself is rejected? Keep identity checks for ownership, and check the state for everything else.
