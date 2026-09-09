---
id: 100
title: Where Ethereum came from
type: lecture
order: 3
faq:
  - question: Why did Vitalik Buterin start a new chain instead of extending Bitcoin?
    answer: >-
      Bitcoin's scripting language was deliberately limited and its developers wanted the
      protocol to stay small. Buterin, then nineteen, wrote a whitepaper in November 2013 for
      a chain designed to run arbitrary programs instead.
  - question: Where does the name Ethereum come from?
    answer: >-
      Luminiferous ether, the medium nineteenth-century physicists thought light travelled
      through. Buterin wanted the image of an invisible substrate everything else runs on.
  - question: When did Ethereum launch and how was it funded?
    answer: >-
      July 30, 2015, in a release called Frontier. The 2014 crowdsale raised about 31,000
      BTC, around eighteen million dollars then, and distributed sixty million ETH.
  - question: What was the DAO hack and why did it split the chain?
    answer: >-
      An on-chain investment fund holding about 11.5 million ETH, roughly fifteen percent of
      the supply, sent users their ETH before updating its records. An attacker called the
      withdrawal repeatedly and drained about 3.6 million ETH. A hard fork in July 2016
      reversed the theft, and the minority who refused it kept running the original chain,
      now called Ethereum Classic.
  - question: When did Ethereum switch to proof of stake?
    answer: >-
      September 2022, in an upgrade called the Merge. The Beacon Chain had run proof of stake
      in parallel since December 2020, and the main chain switched to it from one block to
      the next.
---

> Ethereum exists because someone looked at Bitcoin in 2013 and got frustrated. The frustration was specific: Bitcoin's scripting language was deliberately too limited to build real applications on top of, and the Bitcoin community wanted to keep it that way. The someone was a nineteen-year-old named Vitalik Buterin, who had been writing for Bitcoin Magazine and trying to convince the Bitcoin developers to add the features he wanted. When that didn't work, he wrote a whitepaper proposing his own chain.

## The problem Vitalik wanted to solve

In 2012 and 2013, a small group of people had started trying to build things on top of Bitcoin. Coloured coins, which used tiny amounts of bitcoin to represent other assets. Counterparty, which embedded its own protocol inside Bitcoin transactions. Mastercoin, an early attempt at a tokenisation layer. All of these existed because Bitcoin was the only chain anyone trusted, but Bitcoin's scripting language couldn't really express what they wanted to do.

Bitcoin Script, as you learned in the previous module, is deliberately minimal. No loops, no persistent state, no way for one script to call another. The Bitcoin developers had made this choice on purpose, to keep the protocol small and the security argument simple. They were not going to add features just because some app developers wanted them.

Vitalik concluded that the answer was not to keep pushing Bitcoin to add features, but to start over with a new chain designed to run arbitrary programs. He drafted a whitepaper in November 2013 describing what such a chain would look like, sent it to a few people for feedback, and within weeks had a small group of co-founders willing to build it with him.

The whitepaper called it Ethereum. The name comes from luminiferous ether, a medium that nineteenth-century physicists thought light travelled through. Vitalik liked the connotation of an invisible substrate that everything else runs on top of.

## The launch

A team formed quickly. Gavin Wood, a British software engineer, joined and wrote what's now called the Yellow Paper. The Yellow Paper is the formal technical specification of Ethereum, and it turned the whitepaper's ideas into something implementable. Joe Lubin, a Canadian who had been working in finance, put in early funding and would later go on to found ConsenSys. Charles Hoskinson, briefly the CEO, would later leave to start Cardano. There were others. It was a chaotic founding period with a lot of disagreement about whether Ethereum should be a non-profit foundation or a for-profit company. The non-profit camp won.

In mid-2014, the foundation ran a public crowdsale. Anyone could send bitcoin in exchange for ether at a fixed rate. The sale raised about 31,000 BTC (worth around eighteen million dollars at the time) and distributed sixty million ETH to participants. This was unusual and somewhat controversial. Some saw it as a clean way to fund development without venture capital. Others saw it as the start of a model where every new chain would launch its own token and sell it to early backers, which is roughly what happened.

The network went live on July 30, 2015, in a release called Frontier. It was deliberately rough. The user-facing tooling barely existed. The first version of Solidity had been released a few months earlier. The Ethereum Virtual Machine ran the contracts, mining secured the chain, and people started deploying programs. Within a year there were thousands of contracts on the network, most of them experiments.

## The DAO and the fork

The most consequential event of Ethereum's early years happened in 2016. A group of developers had built a contract called The DAO, which stood for "decentralised autonomous organisation." It was an on-chain investment fund. Anyone could deposit ETH and receive DAO tokens that voted on what investments the fund should make. The DAO became enormously popular. By the time it stopped accepting deposits, it held about 11.5 million ETH, roughly fifteen percent of all the ETH in existence at the time, worth around 150 million dollars.

The DAO had a bug. It was reentrant. When a user requested to withdraw their ETH, the contract sent them the ETH before updating its internal records of who owned what. An attacker noticed and exploited it. They called the withdrawal function recursively, draining ETH faster than the contract could update its bookkeeping. Over the course of a few days, they moved about 3.6 million ETH out of the DAO and into a separate contract.

This put the Ethereum community in an impossible position. The DAO was a contract, and the attacker had followed its rules. There was no protocol violation. By one principle, smart contracts are autonomous and their rules are the rules, so the ETH should stay with the attacker. By another, fifteen percent of all ETH being stolen would destroy the network's credibility, so the community needed to do something.

After weeks of debate, the Ethereum developers proposed a hard fork: a one-time, deliberate change to the protocol that would reverse the attacker's transactions and return the ETH to its original owners. Most of the community supported this. A minority did not, on the grounds that doing so violated the principle of immutability that made Ethereum worth using in the first place. The fork happened in July 2016. The minority who refused to follow the fork kept running the original chain, which is now called Ethereum Classic. The majority went on with the new chain, which kept the name Ethereum.

This event shaped Ethereum culturally for years. It established that the community could and would intervene in extraordinary circumstances, which is a comforting property for some users and a worrying one for others. It also forced the developers to take smart contract security seriously, because The DAO bug had been visible in the code if anyone had known what to look for.

## The road to proof of stake

Ethereum launched with proof of work, the same consensus mechanism Bitcoin uses, where miners burn electricity to compete for the right to produce blocks. The founders had said from the beginning that they wanted to move to proof of stake, where validators put up ETH as collateral and lose it if they misbehave. Proof of stake would use a fraction of the energy.

The transition took years. Various intermediate designs were proposed and revised. A separate chain called the Beacon Chain launched in December 2020 to test the proof-of-stake mechanism in isolation, without yet running real transactions. For nearly two years, the two chains ran in parallel: the original Ethereum chain processing transactions with mining, and the Beacon Chain finalising blocks with staking but not actually running any applications.

In September 2022, the two were combined. The event was called the Merge. The original Ethereum chain stopped using mining and started taking its consensus from the Beacon Chain instead. From one block to the next, Ethereum stopped being a proof-of-work network and became a proof-of-stake network. No contract was interrupted. It was one of the most complex software upgrades ever attempted on a live system holding hundreds of billions of dollars, and it worked.

Since the Merge, Ethereum has continued releasing upgrades on a regular schedule. The Shanghai upgrade in 2023 let stakers withdraw their ETH. The Dencun upgrade in 2024 introduced cheaper data storage for layer-2 rollups, which we'll cover later. The Pectra upgrade in 2025 brought changes to staking and to how regular accounts can temporarily act like smart contracts.

## Where things stand

Ethereum today is the dominant smart-contract platform by every measure that counts. Hundreds of billions of dollars sit in contracts on the network. Tens of thousands of developers build on it. Most of the other smart-contract chains in existence either copy its execution environment directly or position themselves explicitly as alternatives to it.

The original team has scattered. Vitalik still leads research at the Ethereum Foundation. Gavin Wood went on to found Polkadot. Joe Lubin runs ConsenSys, which builds MetaMask and other Ethereum-adjacent infrastructure. Charles Hoskinson runs Cardano. The network itself is governed by no one. There is no company in charge. In practice it's shaped by the Foundation's research, the major client teams, the application developers, and the validators who run the network.

Most of what makes Ethereum interesting from here is not its history but what gets built on it next. Which is the rest of this course.
