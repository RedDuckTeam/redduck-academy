---
id: 180
title: Where Solana came from
type: lecture
order: 3
faq:
  - question: Why did Anatoly Yakovenko invent Proof of History?
    answer: >-
      The bottleneck he saw was validators arguing about the order of events. A hash chain
      anyone can verify settles that order without voting, freeing bandwidth for real work.
      The whitepaper describing it came out in November 2017.
  - question: Why did Solana have so many outages in its early years?
    answer: >-
      On 14 September 2021 bots chasing a token launch on Raydium pushed over three hundred
      thousand transactions per second at the network, validators ran out of memory, and
      block production stopped for seventeen hours. Solana had no priority fees then and no
      way to tell urgent traffic from spam. The fee market and the compute budget system
      came directly out of that failure.
  - question: Who created Solana?
    answer: >-
      Anatoly Yakovenko, after about twelve years at Qualcomm building high-performance
      distributed and real-time systems. He published the Proof of History whitepaper in
      November 2017, then recruited former Qualcomm colleagues. Greg Fitzgerald built the
      first prototype, Stephen Akridge brought throughput work, and Raj Gokal took the
      business side.
  - question: When did Solana mainnet launch?
    answer: >-
      March 16, 2020, as Mainnet Beta. The beta label stayed for years afterwards.
  - question: Where does the name Solana come from?
    answer: >-
      A beach near San Diego where Yakovenko surfed during his Qualcomm years.
---

> Solana started from the idea that the order of events can be proven with a hash chain, so validators do not have to negotiate it. In September 2021 a flood of bot transactions halted the network, and the way it accepts and prices transactions changed afterwards.

## A hash chain proves the order of events

In November 2017 Anatoly Yakovenko published [the whitepaper](https://solana.com/solana-whitepaper.pdf) that introduced Proof of History. His observation was that the slow part of a blockchain is the back-and-forth between validators trying to agree on the order of events, and that a clock everyone can verify would remove it.

Proof of History is that clock. A single hash function is applied to its own output, over and over, producing a chain of outputs where each one can only have been generated after the previous one. Anyone can verify the chain, and nobody can fake the gap between two points in it. Transactions reference positions in this chain and inherit a strict, verifiable ordering.

Validators still vote on which version of history is the canonical one. That consensus mechanism is called Tower BFT, and it runs on top of the clock, so the votes do not have to settle when each event happened. As a developer you meet the clock in the `recent_blockhash` field of every transaction, which is a recent point on this chain. The [Proof of History lesson](/courses/development-on-solana/the-solana-mental-model/proof-of-history) covers how the chain is produced and verified.

## The September 2021 outage changed how transactions are accepted and priced

Mainnet Beta launched on March 16, 2020. On September 14, 2021, Grape Protocol sold its token on the Raydium exchange (an initial DEX offering), and bots flooded the network with transactions to capture as many token allocations as possible. The network halted, and it took about 17 hours and a coordinated restart by the validators to bring it back.

The network at the time had no way to tell an urgent transaction from one of a million spammed copies. After this outage and the transaction floods of 2022, it changed both how validators accept incoming transactions and how a transaction pays for a place in a block. [Outages, lessons, and resilience](/courses/development-on-solana/architecture-details/outages-lessons-and-resilience) goes through each incident and the fix that followed.

The change you will use directly is the priority fee. A transaction can pay extra per unit of computation, and when more transactions arrive than fit in a block, the leader (the validator producing the current block) takes the higher bids first. [Transaction fees and compute units](/courses/development-on-solana/the-solana-mental-model/transaction-fees-and-compute-units) shows how to set it.
