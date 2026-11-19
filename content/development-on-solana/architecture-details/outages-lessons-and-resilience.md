---
id: 221
title: Outages, lessons, and resilience
type: lecture
order: 5
faq:
  - question: Has Solana ever gone down?
    answer: >-
      Yes, several times, though it has always come back. Bots chasing a September 2021 token
      sale pushed roughly 400,000 transactions per second at the network and halted it for
      about 17 hours. NFT mint stampedes degraded it repeatedly through 2022, and a validator
      bug halted it again in February 2023.
  - question: What stopped the transaction floods?
    answer: >-
      QUIC replaced raw UDP for submission, stake-weighted quality of service ranked
      forwarding by stake, and priority fees became the default, so spamming at scale now
      costs real money.
  - question: Why does Solana need a second validator client?
    answer: >-
      In February 2023 one bug in the single client every node ran made validators disagree
      about the chain and halted the network for roughly 19 hours. With no second
      implementation, that bug was everyone's bug. Firedancer, written from scratch in C by
      Jump Crypto, is the answer, and its rollout includes a hybrid called Frankendancer.
  - question: Why did my transaction fail in early 2024 even with a priority fee?
    answer: >-
      During the early-2024 memecoin surge the network kept running, but failure rates climbed
      into double digits. Each part of the pipeline was correct alone and wrong together,
      dropping high-fee transactions in favor of unrelated ones. Rewriting the Agave
      scheduler, revising forwarding and extending the priority-fee API fixed it by late 2024.
  - question: Do the outages mean the network is broken?
    answer: >-
      Each one stressed an assumption that held in testing and broke under real adversarial
      load, and each was followed by a targeted fix. The protocol design was usually sound and
      the gap sat in the single implementation running it.
---

> Solana has gone down several times. Each outage revealed an assumption the design didn't hold, and was followed by a specific engineering response. For a program running on the network, an outage means hours in which no transaction lands, or a period in which transactions fail even with a priority fee attached.

## September 2021: a transaction flood halted the network for 17 hours

Solana's first major outage came in September 2021, during the Grape Protocol initial DEX offering described in [Where Solana came from](/courses/development-on-solana/welcome-to-solana/where-solana-came-from). Bots flooded the network with swap transactions, trying to position themselves to acquire allocations. The transaction volume hit roughly 400,000 per second at peak. Validators struggled to keep up, fork choice degraded, and after several hours of escalating problems the network halted entirely. It took about 17 hours of coordination among validator operators to restart.

The assumption underneath was that transactions arrive at a rate validators can keep up with. Every transaction was treated as roughly equal and processed in the order it arrived, so the network had no way to distinguish "this transaction is important" from "this transaction is one of a million spammed copies." A network can do 50,000 TPS in a clean test environment and still fail when 400,000 transactions per second arrive in a coordinated burst.

The fix took several forms. Solana migrated transaction submission from UDP to QUIC, which provided per-connection backpressure and identity. Stake-weighted Quality of Service was added: validators began prioritizing forwarding traffic from peers based on their stake, making it expensive to spam the network from low-stake or unstaked clients. These changes took months to roll out.

For a program, the halt meant about 17 hours in which no transaction landed, including oracle updates and liquidations. Every account kept what was written before the halt, so the first instruction that read a price feed account after the restart could read a price about 17 hours old. The age check in the [Pyth lesson](/courses/development-on-solana/production-state-design/pyth-price-feeds) covers this case: `get_price_no_older_than` accepts a price only if its `publish_time` is within the window you pass.

## 2022: NFT mint floods showed that a failed transaction cost almost nothing

Throughout 2022, Solana experienced a recurring class of stress events tied to popular NFT mints. The Metaplex Candy Machine system was the dominant Solana NFT minting tool, and each high-profile mint would attract bot armies trying to grab allocations the moment minting opened. A small number of slots saw extreme transaction floods, often degrading the network for 30 minutes to a few hours. These weren't full halts most of the time, but users couldn't get transactions through and wallets timed out.

The QUIC and stake-weighted QoS work had partially addressed the "spam arrives at validators" problem, but transactions on Solana were still nearly free: the base fee of 5,000 lamports per signature is small enough that a bot operator can submit thousands of failed attempts at negligible cost. The fix was [priority fees](/courses/development-on-solana/the-solana-mental-model/transaction-fees-and-compute-units) becoming the default. The mechanism had existed for a while, but through 2022 and into 2023 wallets started attaching them by default and applications started bidding for inclusion. Spam transactions still happen, but the cost of doing damage at scale is now much higher, and the priority-fee market gives legitimate users a way to compete.

## February 2023: a bug in the only validator client halted the network for 19 hours

The February 2023 outage was caused by a bug, not by load. An unusual block hit a code path in the deduplication logic of the validator client, and validators failed to converge on the same view of the chain. They forked into multiple branches, finality stalled, and after several hours of recovery attempts, the network was halted and restarted with a known-good ledger state. Total downtime was around 19 hours.

Every validator on the Solana network was running the same software, Solana Labs' validator client, which has since been renamed to the Agave client. A bug in that one codebase was a network-wide bug, because there was no second implementation that would have processed the offending block differently. Ethereum, by comparison, has multiple independent validator clients in production: Geth, Erigon, Nethermind, Besu, Reth on the execution side, and Prysm, Lighthouse, Teku, Nimbus, Lodestar on the consensus side. A bug in one client typically affects only the validators running that client rather than the whole network.

The architectural response was Firedancer, a second Solana validator client, written from scratch by Jump Crypto in C. The Feb 2023 outage was widely cited as the moment Firedancer's importance shifted from optional to urgent. Partial versions of it, including a hybrid called Frankendancer that uses Firedancer's networking layer atop Agave's consensus, reached mainnet during 2024 and 2025. As of this writing, full Firedancer is running on mainnet, giving Solana the client diversity that was missing in 2023.

## Early 2024: transactions failed even with a priority fee

During the early 2024 memecoin trading surge, the network was technically running but transaction failure rates spiked to high single-digit and sometimes double-digit percentages. Users would attach priority fees, submit transactions, and watch them fail anyway.

The QUIC and stake-weighted QoS layers from 2021 were doing their job: they were preventing actual halts. But the priority fee market wasn't being respected end-to-end, and transactions with high priority fees were sometimes dropped in favor of unrelated transactions. RPC nodes were forwarding transactions to leaders, but the forwarding pipeline had been built with assumptions that didn't hold under load. Each individual component of the transaction pipeline was technically correct, but a transaction could pay a high priority fee, get forwarded correctly by the RPC, arrive at the right leader on time, and still get dropped because the leader's local scheduler made a choice based on different criteria.

The fix was a multi-month effort across several teams. The scheduler in the Agave client was rewritten, forwarding logic was revised, and the priority fee API was extended so that wallets and applications could query expected fees more accurately. By mid-to-late 2024, priority fees behaved much more predictably.

## Check what your program assumes about transactions landing

The network has halted for about 17 hours in 2021 and for about 19 hours in 2023, and in early 2024 a transaction with a priority fee could still be dropped. For every instruction in your program that has to run on time, such as a liquidation, an expiry, or anything that reads an oracle price, ask what state the program is in if no transaction lands for 17 hours, and what happens if the transaction that carries the instruction is dropped and has to be sent again.
