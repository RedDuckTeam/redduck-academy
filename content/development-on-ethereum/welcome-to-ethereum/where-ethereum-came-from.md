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

> Ethereum started as a new chain because Bitcoin's scripting language could not express the applications people wanted to build on it, and Bitcoin's developers would not change that. In 2016 a bug in one contract forced the new network to decide whether a contract's outcome is final when the outcome is a theft.

## Bitcoin Script could not express the applications people wanted to build

In 2012 and 2013, a small group of people started trying to build things on top of Bitcoin. Coloured coins used tiny amounts of bitcoin to represent other assets, Counterparty embedded its own protocol inside Bitcoin transactions, and Mastercoin was an early attempt at a tokenisation layer. They built on Bitcoin because it was the only chain anyone trusted, but Bitcoin's scripting language couldn't express what they wanted to do. Script has no loops, no persistent state, and no way for one script to call another. A smart contract, as the [previous lesson](/courses/development-on-ethereum/welcome-to-ethereum/what-ethereum-is) described it, has all three.

The obvious fix was to add those features to Bitcoin. Vitalik Buterin, who was writing for Bitcoin Magazine, tried to convince the Bitcoin developers to do that, and it didn't work. They had kept Script minimal on purpose, to keep the protocol small and the security argument simple, and they were not going to add features because some app developers wanted them.

So in November 2013 Buterin drafted a whitepaper for a new chain designed to run arbitrary programs, and called it Ethereum. The cost was that the new chain had none of the trust that had brought those projects to Bitcoin, and had to earn it from zero.

## The DAO bug put two principles in conflict

In 2016 a group of developers built a contract called The DAO, short for "decentralised autonomous organisation". It was an on-chain investment fund. Anyone could deposit ETH and receive DAO tokens that voted on what investments the fund should make. By the time it stopped accepting deposits, it held about 11.5 million ETH, roughly fifteen percent of all the ETH in existence at the time, worth around 150 million dollars.

The DAO had a bug. When a user asked to withdraw their ETH, the contract sent the ETH before updating its record of who owned what, so an attacker could withdraw again and again. Over a few days the attacker moved about 3.6 million ETH out of The DAO and into a separate contract. The [reentrancy lesson](/courses/development-on-ethereum/token-security-and-evm-internals/reentrancy-and-denial-of-service) takes this bug apart.

The DAO was a contract, and the attacker had followed its rules, so no rule of the protocol had been broken. By one principle, smart contracts are autonomous and their rules are the rules, so the ETH should stay with the attacker. By another, letting an attacker keep ETH taken from a fund that held fifteen percent of the supply would destroy the network's credibility, so the community needed to do something.

After weeks of debate, the Ethereum developers proposed a [hard fork](/courses/blockchain-basics/the-blockchain-idea/forks-and-conflict-resolution): a one-time, deliberate change to the protocol that would reverse the attacker's transactions and return the ETH to its original owners. Most of the community supported this. A minority did not, on the grounds that doing so violated the principle of immutability that made Ethereum worth using in the first place. The fork happened in July 2016. The minority who refused to follow it kept running the original chain, which is now called Ethereum Classic. The majority went on with the new chain, which kept the name Ethereum.

## Only a fork of the whole network can override a contract

Nobody could patch The DAO or take the ETH back, because a deployed contract's code cannot be changed and the attacker's transactions were valid. The only way to override the outcome was to change the rules of the chain, and that works only if the people who run the nodes adopt the change. It took weeks of debate, and the price was a permanent split into two chains. The fork also established that the community could and would intervene in extraordinary circumstances, which is a comforting property for some users and a worrying one for others.

That intervention was made for a contract holding fifteen percent of all ETH, so do not design as if your contract would get one. The DAO bug had been visible in the code if anyone had known what to look for, and once the contract was deployed nobody could fix it, so the time to find a bug is before deployment. Before you deploy, ask who can change this code if a bug is found. Unless you built an upgrade mechanism in, which the lesson on [upgradeable contracts and proxies](/courses/development-on-ethereum/token-security-and-evm-internals/upgradeable-contracts-and-proxies) covers, the answer is nobody.
