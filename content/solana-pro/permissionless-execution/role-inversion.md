---
id: 1874360986
title: Role inversion
type: lecture
order: 20
faq:
  - question: What is role inversion in Solana program design?
    answer: >-
      Moving a job from the party that does it by default to the party that needs the result,
      so the program keeps only the check. Pyth's pull oracle is the standard example. The
      trader brings the signed price in their own transaction, and the program checks it.
  - question: Why did Pyth move from push to pull price updates on Solana?
    answer: >-
      In the push model, Pyth's publishers paid a fee for every update of every price feed,
      even when nobody read it. In the pull model, the trader brings a signed price in the
      same transaction as the trade and pays only for that update. The price is seconds old
      at the moment of the trade.
  - question: Does the Wormhole bridge call my Solana program when a message arrives?
    answer: >-
      No. The Wormhole program checks the message and saves it in an account. A later
      transaction to your program brings that account, and your program checks that Wormhole
      owns it, that the message came from the expected chain and sender, and that it was not
      processed before.
  - question: How does a LayerZero executor know which accounts my Solana program needs?
    answer: >-
      It asks your program. Your program has an extra instruction, lz_receive_types, that
      only returns the list of accounts it needs. The executor simulates it without sending
      it, reads the list, and builds the real transaction with those accounts.
  - question: Inserting into my on-chain sorted list runs out of compute. What can I do?
    answer: >-
      Let the client find the position off-chain and tell the program which entry the new one
      goes after. The program checks only the two neighbors and rejects the transaction if
      the new entry does not fit between them. The check costs the same for ten entries or
      ten thousand.
  - question: When does role inversion fail?
    answer: >-
      When the party that needs the action no longer decides when it happens. Symmetry V2
      offered prices through aggregators so that other people's trades would rebalance its
      index fund, and the rebalance then waited on traders and aggregators it did not
      control.
---

> Many roles in system design are inherited, not chosen. But on Solana keeping the roles in the traditional order could make the transactions very expensive. Role inversion is a way to bypass this issue. The responsibility of actions shifts to the party that actually needs them, and the program only keeps the verification of the actions.

## Roles nobody chose

Most roles in a design are never chosen. Usually they are inherited from the principle of who has the data first. 

Some examples:

* The oracle has the prices, so it writes them on-chain
* The bridge has the message, so it calls the receiving program. * The program stores a sorted list, so the program searches it.

On Solana, these three examples of default roles can be costly. Writing every price update on-chain costs the oracle fees each time, even if nobody is actually interested in reading that update. 

To call another program, the caller has to list every account that the program would use, and sometimes the caller doesn't know what to specify. 

Searching a long list on-chain costs compute units on every iteration, while a transaction has a fixed compute budget.

## Hand the role to whoever needs it

Role inversion moves the job from the party that does it by default to the party that needs the result of the job. The program could keep the job of verifying the work, which is usually much cheaper that doing the work, because checking a result costs less than producing it.

You have already seen a small version of this in the lecture on [constraints behind patterns](/courses/solana-pro/welcome/constraints-behind-patterns). The client already finds the right accounts, so the program doesn't search and only agrees or disagrees with the proposed accounts. Role inversion applies the same idea to any role in a design.

## Pyth: from writing prices to checking them

Pyth is a price oracle. It used to work in the push model, where Pyth's data publishers sent every price update on-chain themselves and paid the fees. Each update of each feed, for example SOL/USD, was a transaction, whether or not anyone needed that price at that moment. A program read whatever value was stored in the price account, and that value was only as fresh as the last update.

Today Pyth works in the pull model, where the user who needs the price brings it. A trader downloads the latest signed price from Pyth's off-chain service and puts it in the same transaction as their trade. The transaction first checks that the price really came from Pyth and saves it, and then the trade reads it. The trade uses a price that is only seconds old. The trader now pays for the update, but only for the price they use, at the moment they use it. Pyth no longer pays for updates that nobody reads, and its on-chain role turned from writing prices into checking them.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Pyth push versus pull price updates</title><desc>Two vertical flows side by side. On the left, push: Pyth publishers send a transaction for every update and pay for it, the price account stores it, and a trader's transaction reads it later, so the price is as old as the last push. On the right, pull: Pyth signs updates off-chain, the trader fetches one and puts it in a single transaction that first checks and saves the price and then runs the trade, so the price is seconds old at the trade.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Who brings the price</text>

  <rect x="40" y="80" width="300" height="270" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Push: Pyth writes every price</text>
  <rect x="115" y="125" width="150" height="32" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="145" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Pyth publishers</text>
  <line x1="190" y1="158" x2="190" y2="191" stroke="#000000" stroke-width="2"/>
  <polygon points="184,189 196,189 190,199" fill="#000000"/>
  <text x="200" y="174" font-family="monospace" font-size="9" fill="#565653">tx per update,</text>
  <text x="200" y="186" font-family="monospace" font-size="9" fill="#565653">publishers pay</text>
  <rect x="115" y="200" width="150" height="32" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="220" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">price account</text>
  <line x1="190" y1="233" x2="190" y2="266" stroke="#000000" stroke-width="2"/>
  <polygon points="184,264 196,264 190,274" fill="#000000"/>
  <text x="200" y="255" font-family="monospace" font-size="9" fill="#565653">read later</text>
  <rect x="115" y="275" width="150" height="32" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="295" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">trader's tx</text>
  <text x="190" y="334" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">price is as old as the last push</text>

  <rect x="380" y="80" width="300" height="270" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="80" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Pull: the trader brings the price</text>
  <rect x="455" y="125" width="150" height="32" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="145" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Pyth, off-chain</text>
  <line x1="530" y1="158" x2="530" y2="191" stroke="#ed4937" stroke-width="2"/>
  <polygon points="524,189 536,189 530,199" fill="#ed4937"/>
  <text x="540" y="180" font-family="monospace" font-size="9" fill="#565653">signed update</text>
  <rect x="455" y="200" width="150" height="32" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="220" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">trader</text>
  <line x1="530" y1="233" x2="530" y2="256" stroke="#ed4937" stroke-width="2"/>
  <polygon points="524,254 536,254 530,264" fill="#ed4937"/>
  <rect x="400" y="265" width="260" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="282" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">one transaction</text>
  <text x="455" y="296" font-family="monospace" font-size="10" font-weight="bold">1. check + save the price</text>
  <text x="455" y="309" font-family="monospace" font-size="10" font-weight="bold">2. trade reads it</text>
  <text x="530" y="334" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">price is seconds old at the trade</text>

  <text x="360" y="380" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">With pull, the party that needs the price brings it, and the program only checks it.</text>
</svg>

## Wormhole: the receiver collects the message

Wormhole is a cross-chain messaging bridge. The obvious design is for the bridge to call the receiving program when a message arrives. On Solana it would be pretty hard, as to call a program, the bridge has to list every account that program needs, and for every different receiver, different set of accounts is required.

So Wormhole does not call the receiver. Instead, a relayer or the user submits the signed message to the Wormhole program, which checks the signatures and saves the message in an account. Later, someone sends a transaction to the receiving program with the receiver's own accounts and the saved message. The receiver checks that the Wormhole program owns that account, that the message came from the expected chain and sender, and that it has not processed this message before. The bridge never needs to know which accounts any receiver uses.

## LayerZero: the receiver lists its own accounts

LayerZero solves the same problem differently. Its delivery service, called **the executor**, does make a call to the receiving program. To do that, it sends a transaction to your program, and that transaction has to list every account your program would read or write. 

The executor does not know your program, so it cannot know what accounts to list.

So your program tells this information instead. Your program has one extra instruction, `lz_receive_types`, that changes nothing and only returns the list of accounts it needs to receive a message. The executor simulates this instruction, meaning it runs it as a test first without sending it to the network, and then reads the list. Using that list, it builds the real transaction with those accounts and sends it.

Not exactly role inversion in the common sense - LayerZero still sends the transaction with the accounts and still performs the flow in a normal way. However it is a very interesting approach to note.

## Monaco: the client finds the place

Monaco is a prediction market, and it keeps its order book sorted. A new order has to go into the right place. Finding that place on-chain means iterating through the book one order at a time, and the longer the book, the more compute units it costs to execute the transaction.

So Monaco lets the client find the place. The client reads the order book off-chain, where reading is free, and tells the program "put my order after this one". The program checks only the two orders: the one right before the intended one, and the one right after it. If the new intended order fits between them, the program accepts it. If the client ended up pointing to an incorrect slot, or another order landed first and changed the neighbors already, the check would fail and the client would have to retry it with a fresh position. The checks cost the same whether the book holds ten orders or ten thousand, as it only checks two orders no matter the total amount of orders.

This is actually a pretty common pattern in blockchain programs. Even in our EVM module we have the same task of implementing on-chain sorted linked-list. Sorted linked-list fits on-chain surprisingly well because it allows for all operations to be of constant O(1) difficulty on-chain. What the difficulty is off-chain, doesn't matter. See the [off-chain computation, on-chain verification lecture](/courses/development-on-ethereum/defi-tasks-and-patterns/off-chain-computation-on-chain-verification) and the [voting on token price task](/courses/development-on-ethereum/defi-tasks-and-patterns/voting-on-token-price) in the Ethereum course.

## However! Not every flip works well

Symmetry runs index funds, where an index fund holds several tokens in target shares, and when prices move, it has to perform trades to bring the shares back. This process is called rebalancing.

Normally the fund is a taker, which means it trades against the prices that someone else has already offered. Symmetry V2 flipped this model and made the fund a maker, a party that offers prices for others to trade against. The fund sends its prices to aggregators (the services that find the route for the best prices on swaps). The aggregators being the services that suggest the swapping routes to users, help people see that it's possible to perform the swap through Symmetry with optimal prices. The idea here was that other people's trades would move the fund back toward its targets.

***It sounded smart.*** But in practice, the rebalance happened only when someone else decided to trade. The protocol began depending on the aggregators, and it had to wait until an aggregator agreed to route trades to it.

In that case, it is rather an anti-pattern because using the ***role-inversion pattern*** entailed adding more dependencies and heavily relying upon them, which by itself is an antipattern.

The difference between Symmetry V2 and Pyth is simple: 

- For Pyth, the party that needed the action still decided when it happened.
- For Symmetry V2, when the fund needed rebalance, others decided whether it would happen or not. SymmetryV2 wasn't in the control of its own protocol in these moments.

<svg role="img" viewBox="0 0 720 350" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Five role inversions and who holds control</title><desc>A table of five protocols. Pyth moved from the oracle writing every price to the trader bringing it while the program checks it. Wormhole moved from the bridge calling the receiver to the bridge storing the message and the receiver reading it. LayerZero moved from the executor needing to know the accounts to the receiver listing them while the executor follows the list. Monaco moved from the program searching the book to the client searching and the program checking. In all four, the party that needs the action stays in control. Symmetry V2 moved from the fund trading to rebalance to other people's trades rebalancing the fund, and the fund lost control.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Five inversions and who holds control</text>

  <rect x="40" y="70" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="50" y="89" font-size="11" fill="#ffffff" font-weight="bold">protocol</text>
  <text x="160" y="89" font-size="11" fill="#ffffff" font-weight="bold">inherited role</text>
  <text x="340" y="89" font-size="11" fill="#ffffff" font-weight="bold">after the flip</text>
  <text x="600" y="89" font-size="11" fill="#ffffff" font-weight="bold">in control?</text>

  <rect x="40" y="98" width="640" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="138" width="640" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="178" width="640" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="218" width="640" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <line x1="150" y1="70" x2="150" y2="298" stroke="#000000" stroke-width="1"/>
  <line x1="330" y1="70" x2="330" y2="298" stroke="#000000" stroke-width="1"/>
  <line x1="590" y1="70" x2="590" y2="298" stroke="#000000" stroke-width="1"/>
  <rect x="40" y="258" width="640" height="40" fill="none" stroke="#ed4937" stroke-width="2"/>

  <text x="50" y="122" font-family="monospace" font-size="10" font-weight="bold">Pyth publishers</text>
  <text x="160" y="122" font-family="monospace" font-size="10" fill="#565653">oracle writes every price</text>
  <text x="340" y="122" font-family="monospace" font-size="10">trader brings it, program checks</text>
  <text x="600" y="122" font-family="monospace" font-size="10" font-weight="bold">yes</text>

  <text x="50" y="162" font-family="monospace" font-size="10" font-weight="bold">Wormhole</text>
  <text x="160" y="162" font-family="monospace" font-size="10" fill="#565653">bridge calls the receiver</text>
  <text x="340" y="162" font-family="monospace" font-size="10">bridge stores, receiver reads</text>
  <text x="600" y="162" font-family="monospace" font-size="10" font-weight="bold">yes</text>

  <text x="50" y="202" font-family="monospace" font-size="10" font-weight="bold">LayerZero</text>
  <text x="160" y="202" font-family="monospace" font-size="10" fill="#565653">executor must know accounts</text>
  <text x="340" y="202" font-family="monospace" font-size="10">receiver lists them, executor follows</text>
  <text x="600" y="202" font-family="monospace" font-size="10" font-weight="bold">yes</text>

  <text x="50" y="242" font-family="monospace" font-size="10" font-weight="bold">Monaco</text>
  <text x="160" y="242" font-family="monospace" font-size="10" fill="#565653">program searches the book</text>
  <text x="340" y="242" font-family="monospace" font-size="10">client searches, program checks</text>
  <text x="600" y="242" font-family="monospace" font-size="10" font-weight="bold">yes</text>

  <text x="50" y="282" font-family="monospace" font-size="10" font-weight="bold">Symmetry V2</text>
  <text x="160" y="282" font-family="monospace" font-size="10" fill="#565653">fund trades to rebalance</text>
  <text x="340" y="282" font-family="monospace" font-size="10">others' trades rebalance the fund</text>
  <text x="600" y="282" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">no</text>

  <text x="360" y="330" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">An inversion works when the party that needs the action still decides when it happens.</text>
</svg>

## Find the role you inherited

Take a design you are working on and write down who does each job. For each one, ask why that party does it. If the only answer is "because it had the data first" or because "it's the typical approach", try inverting it. It may become less expensive to execute the job, potentially. 

To invert, find the party that actually needs the action to complete, and check whether the program's part can shrink to a narrower set of actions by delegating the other actions to the other party. 

That's just a suggestion to experiment. Before you seriously choose this design, check one more thing: After the inversion, the party that needs the action must still decide when it happens, in other words, must be in full control of the flow. 

If it is not, even if you optimized the cost, you now introduced an unnecessary and potentially toxic dependency in your protocol.
