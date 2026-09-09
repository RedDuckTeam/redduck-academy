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

> Solana exists because someone looked at the blockchains of 2017 and decided the bottleneck was time itself. Other chains spent their throughput on validators talking to each other about when transactions happened. If you could prove the order of events cryptographically, without a vote, you could free up that bandwidth for actual work. He was a thirty-six-year-old engineer named Anatoly Yakovenko, who had spent twelve years at Qualcomm building high-performance distributed systems and had been developing this idea for several months before publishing the whitepaper. The whitepaper came out in November 2017 and introduced Proof of History as the answer.

## The idea behind Proof of History

In 2017 the dominant blockchains were Bitcoin and Ethereum, both running proof of work, both processing transactions in a strictly serial order. Throughput sat in the low double digits per second for Ethereum and in the single digits for Bitcoin. The common assumption was that this was the price of decentralization. Faster meant either fewer validators or weaker security guarantees.

Yakovenko's background was in real-time systems and wireless protocols at Qualcomm, where he had spent more than a decade thinking about how to coordinate distributed work without a central clock. His insight was that the slow part of a blockchain isn't the cryptography or the network. It is the back-and-forth between validators trying to agree on the order of events. If you removed that back-and-forth, by giving the network a verifiable clock that everyone could trust without polling each other, you could push throughput up by orders of magnitude.

Proof of History is that clock. A single hash function applied to its own output, over and over, producing a chain of outputs where each one can only have been generated after the previous one. Anyone can verify the chain. Nobody can fake the gap between two points in it. Transactions reference positions in this chain and inherit a strict, verifiable ordering automatically. Validators stop arguing about time. They argue only about content.

[The whitepaper](https://solana.com/solana-whitepaper.pdf) described what such a chain would look like with this clock at its core. Yakovenko sent it to former Qualcomm colleagues. Greg Fitzgerald, who had worked with him on operating system code, built the first prototype in February 2018, originally calling it Loom. By the time Solana Labs incorporated later that year, Stephen Akridge had joined from Qualcomm bringing throughput-optimization ideas, and Raj Gokal had joined to handle the business side. The name Solana came from a beach near San Diego where Yakovenko had surfed during his Qualcomm years.

## The launch

The team spent 2018 and 2019 building during a prolonged downturn in cryptocurrency markets. Funding was tight. A twelve-engineer team running on two years of runway, raising a Series A from Multicoin Capital in mid-2019, declined by other firms who thought another high-performance chain was unnecessary. The Tour de SOL incentivized testnet ran in early 2020 to stress-test the network with real validators competing for rewards.

Mainnet Beta launched on March 16, 2020. The "beta" label remained. Years later, even though the chain was processing billions of transactions and holding tens of billions of dollars, the public network was technically still called Solana Mainnet Beta. The label was honest. The team had released a chain that worked, but they knew it had not been stress-tested at real scale yet.

By the end of 2020, eight billion transactions had been processed. The Serum decentralized exchange launched on Solana in August 2020 with backing from Sam Bankman-Fried, who became one of the most visible early supporters of the network. The first wave of Solana-native applications started arriving through 2021. SOL went from under one dollar at launch to two hundred and fifty-nine dollars by November 2021.

## The outages

The defining drama of Solana's first few years was not a hack. It was a series of network outages frequent enough that the rest of the crypto industry openly mocked them. Each one taught the network something specific about its architecture, and most of the design choices a Solana developer encounters today exist because of them.

The first big one happened on September 14, 2021. Grape Protocol ran an initial DEX offering on Raydium, and bots flooded the network with bursts of transactions over three hundred thousand per second to capture as many token allocations as possible. Validators ran out of memory. The chain stopped producing blocks for seventeen hours. The fix was a coordinated restart by the validator set, and the underlying problem, that Solana at the time had no priority fees and no way to distinguish important traffic from spam, led directly to the introduction of the local fee market and the compute budget system you'll use in this course.

2022 brought a series of related failures. In January, duplicate transactions from botnets degraded the success rate to thirty percent for nearly a week. In April and May, NFT mint bots overloaded the network on the Candy Machine launch and pushed effective transaction load past four million per second at the peak. In June, a clock-drift bug halted consensus for hours. In September, a fork-choice bug stopped block production for eight hours. Every one of these incidents prompted a specific architectural fix: better vote propagation, smarter transaction forwarding, separation of vote traffic from user traffic, the QUIC transport layer for ingress.

Then came FTX. In November 2022, Sam Bankman-Fried's exchange collapsed, his crypto holdings were liquidated, and SOL dropped from around thirty-three dollars to under ten. Developers left. Liquidity drained. The network kept running. By early 2023 the consensus among outside observers was that Solana was finished. It was not finished. The team kept building, and by mid-2024 the outages had effectively stopped. The last officially acknowledged mainnet outage was February 2024.

## Where things stand

Solana today is the second-largest smart-contract platform by total value locked, the largest by daily active addresses, and the platform other parallel-execution chains measure themselves against. Hundreds of billions of dollars of yearly volume cross the network. The Serum-era DeFi applications got replaced or rebuilt, the NFT scene matured, and a new wave of consumer applications, payments, meme coins, and prediction markets has made Solana the most active retail blockchain by transaction count.

The original team is still here. Yakovenko leads research and engineering. Fitzgerald, Akridge, and Gokal remain at Solana Labs. Anza, a spinoff focused on validator client and core protocol work, has taken over much of what Solana Labs used to do. The network itself is governed by validators, who vote on each major proposal, with the Foundation funding research and the major application developers shaping the ecosystem in practice.

Most of what makes Solana interesting from here is what gets built on it next, which is the rest of this course.
