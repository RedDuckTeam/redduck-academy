---
id: 1323756557
title: Standardizing the interface
type: lecture
order: 1
faq:
  - question: What does a shipping container standardize?
    answer: >-
      Its dimensions and its corner fittings. Nothing about the contents.
  - question: How much does a shared standard save?
    answer: >-
      With ten participants and no standard, each pair agrees its own interface, roughly a
      hundred private arrangements, and each new member adds ten more. With a standard it is
      ten implementations and a new member costs one.
  - question: Why did Unicode replace per-pair converters?
    answer: >-
      Every character in every writing system gets one number. Implement it once and you
      exchange text correctly with every other system that did the same. Before Unicode, a
      document moving between two regions arrived unreadable unless a converter existed for
      that exact pair.
  - question: What does adopting a standard cost me?
    answer: >-
      Local control and speed of change. A standard fixes decisions some participants would
      have made differently, and once many depend on it, changing it means all of them move
      at once.
---

> A fragmented ecosystem is expensive in one specific way. Every pair of participants has to agree on how to work together, and the total cost grows with the number of pairs. Standardizing a single shared interface removes those private agreements. Each participant matches the standard once and becomes compatible with everyone else who did the same.

## Before the box, every boundary meant repacking

Move a shipment of goods across the world before the 1950s and it was handled loose, piece by piece. Each kind of cargo had its own way of being loaded. Each port had its own equipment. Each ship had its own hold. Goods travelling from a truck to a train to a ship were unpacked and repacked at every boundary between them, by hand, slowly, with loss and theft at each step. The truck, the train, and the ship were each built for their own kind of load and matched nothing else.

The intermodal shipping container fixed one thing and only one thing: the dimensions of the box and the fittings at its corners. It said nothing about what went inside. A container of coffee and a container of car parts look identical from the outside, so a crane does not care which it lifts. Once the box was standard, every truck bed, every rail car, every crane, and every port in the world was built to the same measurements, and any of them could carry any shipment. The repacking at each boundary disappeared.

## The same problem in software: text before Unicode

Software had its own version of loose cargo. For decades, each language region stored text in its own character encoding. One region used one encoding, another used a different one, and a document that moved between two systems arrived as unreadable characters unless a converter existed for that exact pair. With many encodings in use, someone had to write and maintain a converter for each direction between each pair of them.

Unicode replaced the pairs with a single target. It gives every character in every writing system one number. A system implements Unicode once, and from that moment it can exchange text correctly with every other system that did the same. No per-pair converters. One implementation, and compatibility with all the rest.

## Why a standard turns N times N into N

Underneath both stories is a number. Take N participants who all need to work with each other. Without a shared standard, each pair has to agree on its own interface, so the number of integrations grows with the number of pairs, on the order of N times N. With ten participants, that is on the order of a hundred private arrangements. Add one more and you add ten new integrations, one against each participant already there.

With a standard, each participant implements the one shared interface and nothing else. That is N integrations in total, one per participant. Add a new participant and the cost is a single implementation matched against the standard, where before it was a negotiation with every member already present. This is the whole economic case for standardizing an interface, and it is why a standard grows more valuable as more participants adopt it.

<svg role="img" viewBox="0 0 720 385" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Pairwise integrations without a standard versus one integration each with a standard</title><desc>Two panels. On the left, five participants without a standard, every one connected to every other, giving ten links, on the order of N times N. On the right, the same five participants each connected only to a shared standard at the center, giving five links, N in total. Adding a participant adds a link to every other on the left, but only one link on the right.</desc>
<text x="360" y="28" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Without a standard every pair coordinates. With one, each joins once.</text>

<text x="190" y="58" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Without a standard</text>
<text x="530" y="58" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">With a standard</text>

  <g stroke="#565653" stroke-width="1.5">
    <line x1="190" y1="100" x2="276" y2="162"/>
    <line x1="190" y1="100" x2="243" y2="263"/>
    <line x1="190" y1="100" x2="137" y2="263"/>
    <line x1="190" y1="100" x2="104" y2="162"/>
    <line x1="276" y1="162" x2="243" y2="263"/>
    <line x1="276" y1="162" x2="137" y2="263"/>
    <line x1="276" y1="162" x2="104" y2="162"/>
    <line x1="243" y1="263" x2="137" y2="263"/>
    <line x1="243" y1="263" x2="104" y2="162"/>
    <line x1="137" y1="263" x2="104" y2="162"/>
  </g>
  <g fill="#e0deda" stroke="#000000" stroke-width="2">
    <circle cx="190" cy="100" r="15"/>
    <circle cx="276" cy="162" r="15"/>
    <circle cx="243" cy="263" r="15"/>
    <circle cx="137" cy="263" r="15"/>
    <circle cx="104" cy="162" r="15"/>
  </g>
  <g font-size="11" fill="#000000" text-anchor="middle" font-family="monospace">
    <text x="190" y="104">A</text>
    <text x="276" y="166">B</text>
    <text x="243" y="267">C</text>
    <text x="137" y="267">D</text>
    <text x="104" y="166">E</text>
  </g>

  <g stroke="#565653" stroke-width="1.5">
    <line x1="530" y1="190" x2="530" y2="100"/>
    <line x1="530" y1="190" x2="616" y2="162"/>
    <line x1="530" y1="190" x2="583" y2="263"/>
    <line x1="530" y1="190" x2="477" y2="263"/>
    <line x1="530" y1="190" x2="444" y2="162"/>
  </g>
  <g fill="#e0deda" stroke="#000000" stroke-width="2">
    <circle cx="530" cy="100" r="15"/>
    <circle cx="616" cy="162" r="15"/>
    <circle cx="583" cy="263" r="15"/>
    <circle cx="477" cy="263" r="15"/>
    <circle cx="444" cy="162" r="15"/>
  </g>
  <circle cx="530" cy="190" r="20" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <g font-size="11" fill="#000000" text-anchor="middle" font-family="monospace">
    <text x="530" y="104">A</text>
    <text x="616" y="166">B</text>
    <text x="583" y="267">C</text>
    <text x="477" y="267">D</text>
    <text x="444" y="166">E</text>
  </g>
  <text x="530" y="194" text-anchor="middle" font-size="10" fill="#ffffff" font-weight="bold" font-family="monospace">std</text>

<text x="190" y="332" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">5 participants, 10 links (~N x N)</text>
<text x="530" y="332" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">5 participants, 5 links (N)</text>

<text x="360" y="366" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Adding one participant adds a link to every other on the left, but only one link on the right.</text>
</svg>

## A standard is a constraint you accept on purpose

A **standard** is not free. It is a constraint. It fixes decisions that an individual participant might have preferred to make differently, and it fits some uses more comfortably than others. A standard that many participants already depend on is also very slow to change, because changing it means every one of them has to move at once. The flexibility you give up is real.

This is the **tradeoff** from [What engineering is and is not](/courses/engineering-principles/design-tradeoffs/what-engineering-is-and-is-not). The parent goal is compatibility across the whole ecosystem. The child goal a participant gives up is the freedom to shape its own interface exactly as it likes. Standardizing trades the child goal for the parent one. It is worth doing when compatibility across the group matters more than local control, and it is the wrong move when it does not.

## Count the integrations before you commit

Before you wire a set of components together, count the arrangements you are signing up for. If every pair needs its own adapter, the cost is quietly growing with the square of the number of participants, and each new member makes it worse. A shared interface, adopted once by each, turns that same set into a single implementation apiece. Weigh the flexibility you would give up against the integrations you would delete, and reach for the standard when the second outweighs the first.

## Blockchain application

Skip this section if you only want the principle. Decentralized finance repeated the shipping-container story almost exactly. Before 2022, every protocol that held deposits and paid a yield exposed its own deposit interface. One used a deposit call, another a mint call, another a supply call with several parameters of its own. Anyone building on top of several protocols wrote and maintained a separate adapter for each, the software equivalent of repacking cargo at every boundary. ERC-4626 defined one vault interface, built as an extension of the ERC-20 token standard rather than a replacement for it, and the per-protocol adapters fell away.

ERC8009, examined in depth in [the clear signing module](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack), makes the same move for clear signing. Hardware wallet vendors implement one interface once, rather than settling a private integration with each protocol one at a time.
