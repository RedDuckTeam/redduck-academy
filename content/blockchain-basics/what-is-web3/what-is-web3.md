---
id: 68
title: What is web3
type: lecture
order: 1
faq:
  - question: What is the real difference between web2 and web3?
    answer: "In web2 you can read and write, but the platform owns everything you
      do: your posts, your followers, and your identity all live in a company's
      database that it can change, sell, or shut down. Web3 adds ownership at
      the protocol level, so assets you hold in your wallet cannot be quietly
      taken away by any platform sitting between you and the network."
  - question: If I hold a digital asset in web3, can a company or government take it
      away?
    answer: Not the way a web2 platform can. Because ownership is recorded in the
      protocol rather than on a company's server, no platform can demonetise
      your account or change the rules to seize what is in your wallet. As long
      as the chain exists, only someone with your keys can move the asset.
  - question: Do I need to know how to code before I start learning web3?
    answer: No. Understanding what web3 is and how it differs from earlier versions
      of the web needs no programming, and the basics track assumes no prior
      coding experience. Writing and submitting real code comes later in the
      course.
---

> Three eras of the internet, in three sentences. Web1: you read what other people wrote. Web2: you read, and you write, but the platform owns everything you do. Web3: you read, you write, and you own. The addition of "own" is small to type and enormous in consequence. It's also the reason a few hundred thousand developers around the world spent the last decade rebuilding the internet, and the reason you're reading this course now.

## Web1: the read-only internet

The first web was a static document library. You opened a page, you read what someone else had published. Maybe you posted on a forum. Mostly you consumed. The infrastructure was decentralised in a meaningful sense: anyone could run a server, anyone could publish, no single company sat between you and the content. But the experience was limited. You couldn't talk back, you couldn't collaborate, you couldn't build, you mostly just clicked links.

This was the world from roughly 1991 to about 2004. By the end of it, most people who used the internet at all read more than they wrote, because writing was hard. You needed your own server, your own software, your own audience. Almost nobody had all three.

## Web2: the read-write internet

Then the platforms arrived. Facebook in 2004, YouTube in 2005, Twitter in 2006, Instagram in 2010. Suddenly anyone could publish without owning infrastructure. You wrote a post, the platform delivered it. You uploaded a video, the platform stored it and served it to whoever wanted to watch.

This was a genuine revolution. The number of people publishing on the internet went from millions to billions inside a decade. The cost of reaching an audience dropped to near zero. Whole new categories of work appeared, including the kind of work the people building this course do, because suddenly there was an audience large enough to support it.

But there was a price, and as the second web matured, the price became impossible to ignore.

Every post you wrote lived on someone else's server. Every connection you made was tracked. Every minute of attention was sold to an advertiser. The platforms could change the rules at any time, demonetise your account, suspend you, ban you, lose your data, sell to a different owner with different politics, or simply decide you no longer fit their algorithm. Your followers were not your followers. Your photos were not your photos. Your identity was a row in someone else's database, and you only got to keep it as long as the database operator allowed.

For most people most of the time, this was fine. The trade was implicit, the cost was invisible, and the convenience was enormous. But for some categories of activity, especially anything involving money, opinions a platform might dislike, or work whose value depended on permanent ownership, the trade no longer made sense. By the late 2010s, a generation of developers was asking a harder question.

What if the internet had a way for users to actually own things again?

## Web3: the read-write-own internet

Web3 is the answer being built. The single most important difference from web2 is that **ownership lives in the protocol rather than the platform**. When you hold a digital asset in your wallet, no platform sitting between you and the network can quietly take it away, demonetise your account, or change the rules under you the way a web2 service can. When you connect your wallet to a new application, you bring your identity and your history with you, the same way you bring your laptop from one office to another. When you publish, you publish to a network nobody controls, rather than to a platform that can change its mind.

This is not a thought experiment. The infrastructure has been live for a while now and the numbers are concrete:

- More than **$300 billion** in stablecoin value, regularly moving through wallets and settling trillions of dollars of transfers each year.
- Around **$100 billion** locked into decentralised financial protocols, providing lending, trading, and yield without any bank or broker involved.
- Tens of millions of active wallet addresses transacting every month.
- Developer activity in web3 has grown steadily for ten years, even through bear markets, long stretches of falling prices, when the price headlines suggested otherwise. The people building have not gone away.
- Major companies, including ones you've heard of in every consumer category, are integrating with this infrastructure for payments, identity, and asset transfer.

The infrastructure works. Real people use it for real things. The reason most developers haven't released anything on it yet is mostly that the tooling, the languages, and the mental models are different enough from web2 that getting started takes some work. Getting started is what this course is for.

## Why developers care now

The shift from web2 to web3 is the kind of shift that doesn't come around often in a software career. It's comparable in scope to the shift from desktop to mobile, or from on-premise to cloud. A new infrastructure category opens up, the early teams that build on it release things nobody else could release, and for a limited time the demand for skilled developers far exceeds the supply. We are in that period right now.

A few things are different from previous cycles, though, and worth knowing about going in.

The technology rewards depth far more than breadth. A developer who actually understands how a blockchain works, what a signature actually does, what a smart contract really is, can build things that look impossible to someone with only surface-level knowledge. The opposite is also true. The ecosystem has a high rate of catastrophic bugs, lost funds, and exploited contracts, almost always traceable to a developer who released code without fully understanding their tools. The premium on getting the fundamentals right is enormous, which is exactly why a course like this one exists.

The technology is also unusually open. Most major chains are open source. Most major protocols publish their design documents publicly. Most major dApps (decentralised applications) can be read in full by anyone, because the code runs on a public chain. You can learn from the actual production systems running real money. There is no equivalent in most other parts of software where the leading implementations are locked behind a corporate firewall.

## What's in this course

This course covers what a blockchain actually is, how the cryptographic primitives underneath it work, why Bitcoin in particular is the most-discussed example of all this, and where to go next if you want to build on Ethereum, Solana, or other chains built on the same ideas. It focuses on ideas that apply to all blockchains rather than one specific chain. What you learn here will hold up regardless of which chain you specialise in afterwards.

The next lesson introduces web3 as a layered ecosystem and zooms in on where blockchains specifically sit within it. Everything you've ever seen described as web3, from wallets to DeFi to NFTs to decentralised social networks, sits on top of blockchain infrastructure. The lesson after that, and the rest of the course, is about what that infrastructure actually is.
