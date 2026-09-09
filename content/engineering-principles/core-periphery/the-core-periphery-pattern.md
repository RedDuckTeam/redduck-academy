---
id: 1595960325
title: The core and periphery pattern
type: lecture
order: 1
faq:
  - question: Where do I draw the line between Core and Periphery?
    answer: >-
      Around the smallest piece of code that must touch the valuable state or enforce a rule
      that can never break. In a payment system that is the one component that reads and
      stores card numbers. Checkout, discounts, receipts and integrations stay outside it and
      reach it only through a narrow, fixed interface, with no special powers inside.
  - question: What does the Core hand back to a checkout page?
    answer: >-
      A yes or no, a masked number, or a token. Never the full number.
  - question: How does this map onto an operating system?
    answer: >-
      The kernel is the Core, the programs are the Periphery. The kernel has total authority
      over hardware, memory, disk and network. A program has none, and asks through a narrow,
      fixed set of calls to write a file.
  - question: Why is the Periphery cheap to replace when the Core is not?
    answer: >-
      The Core holds the assets, the Periphery holds nothing. A redesigned checkout page does
      not touch the card vault and needs no re-audit of it. Changing the Core goes through
      the highest level of review.
  - question: Does putting card handling in one small component make a system PCI compliant?
    answer: >-
      No. PCI DSS applies to every system that stores, processes, or transmits cardholder
      data, and shrinking that set is what the standard calls scope reduction. It makes the
      assessment smaller. It does not pass it for you.
---

> A system often has to do two jobs that pull in opposite directions. It has to guard something valuable and never leak it, and it has to keep changing to please users. When both share the same code and access, every change to the second endangers the first. The answer is to split the system into a small, rarely changed part that holds the valuable state, and a large, fast-moving part that holds nothing worth stealing.

## Two jobs that do not belong together

A payment system has to store card numbers and use them to charge people, and it must never let those numbers escape. Around it runs a second job that has nothing to do with card safety and never stops moving: the checkout pages, the discount codes, the receipts, the integrations. This second job changes every week.

Put both jobs in one codebase with one set of access rights, and every change to a checkout page or a discount rule becomes a change to a system that can read card numbers. Any of those changes could accidentally write a card number to a log file or send it to an analytics service. The team cannot review every line at every release, because releases happen constantly and most are about receipts and coupons. The valuable data sits inside a large, fast-moving codebase where any part could reach the card numbers, and no review can be sure none does.

## Shrink the part that touches the data

The fix is to make the code that touches card data as small as possible and keep everything else away from it. One small component reads and stores card numbers and does nothing else. The checkout pages, the discounts, and the receipts live outside it and never see a card number. They ask that component to do the sensitive work and get back only what they need, a yes or no, a masked number, a token.

The card industry's own standard is built on this move. PCI DSS, the security standard for handling payment cards, applies to every system that stores, processes, or transmits cardholder data. Those systems are what an assessment has to cover. Shrinking that set is what the standard calls scope reduction. Pull card handling into one small, isolated component, and only that component falls inside the assessment. The checkout pages and the marketing site sit outside it. A smaller sensitive part means a smaller thing to audit, to secure, and to review line by line.

This split has a name. The small, guarded part is the **Core**. It holds the valuable state, the card data. It enforces the invariants, the rules that must never break, for example that a full card number is never handed back. It is minimal, it changes rarely, and every line of it is reviewed with care. Everything else is the **Periphery**: the checkout, the receipts, the discounts, the integrations. The Periphery is where all the convenience and all the change live. It holds nothing critical, and it reaches the Core only through a narrow, fixed interface, with no special powers inside it. It is just a caller, asking for a charge and getting back an answer.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The boundary between Core and Periphery</title><desc>Two boxes. On the left, a large Periphery box holding checkout pages, discount codes, receipts, and integrations, marked as holding no card data and replaceable at any time. On the right, a small red Core box that holds the card data, enforces the invariant, is rarely changed, and is heavily reviewed. A single narrow arrow runs from the Periphery to the Core, labeled narrow interface and no privileges, showing that the Periphery reaches the Core only as a caller.</desc>
<defs>
<marker id="toCore" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
<path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
</marker>
</defs>
<text x="360" y="28" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">The boundary between Core and Periphery</text>

  <rect x="40" y="56" width="330" height="252" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="56" width="330" height="30" fill="#565653" stroke="#000000" stroke-width="2"/>
  <text x="205" y="76" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Periphery</text>
  <text x="205" y="102" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">convenient, replaceable, holds nothing</text>
  <text x="58" y="130" font-family="monospace" font-size="10" fill="#000000">checkout pages</text>
  <text x="58" y="152" font-family="monospace" font-size="10" fill="#000000">discount codes</text>
  <text x="58" y="174" font-family="monospace" font-size="10" fill="#000000">receipts</text>
  <text x="58" y="196" font-family="monospace" font-size="10" fill="#000000">third-party integrations</text>
  <line x1="58" y1="216" x2="352" y2="216" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="58" y="240" font-family="monospace" font-size="10" fill="#565653">holds no card data</text>
  <text x="58" y="262" font-family="monospace" font-size="10" fill="#565653">changes every week</text>
  <text x="58" y="284" font-family="monospace" font-size="10" fill="#565653">replace it any time</text>

  <rect x="470" y="104" width="210" height="156" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="470" y="104" width="210" height="30" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="575" y="124" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Core</text>
  <text x="575" y="150" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">minimal, stable, trusted</text>
  <text x="486" y="176" font-family="monospace" font-size="10" fill="#000000">holds the card data</text>
  <text x="486" y="198" font-family="monospace" font-size="10" fill="#000000">enforces the invariant</text>
  <text x="486" y="220" font-family="monospace" font-size="10" fill="#000000">rarely changed</text>
  <text x="486" y="242" font-family="monospace" font-size="10" fill="#000000">heavily reviewed</text>

<text x="420" y="172" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">narrow interface</text>
<line x1="374" y1="182" x2="466" y2="182" stroke="#565653" stroke-width="2" marker-end="url(#toCore)"/>
<text x="420" y="200" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">no privileges</text>

<text x="360" y="340" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">The Core holds the assets and the rules. The Periphery holds nothing and can be swapped out.</text>
</svg>

## The same shape runs your computer

You already use a system built this way. An operating system splits itself into a kernel and the programs that run on top of it. The kernel is small and has total authority over the hardware, the memory, the disk, the network, the processor. A program you run, a browser, an editor, a game, has none of it. To write a file or send a packet, the program asks the kernel through a narrow, fixed set of calls, and the kernel decides whether to allow it. It cannot touch the hardware directly.

A card vault and an operating system look unrelated, but the shape is identical. Put the smallest possible amount of logic in the position of highest trust, and give it total control over the thing that matters. Everything else runs outside that position and works only through that narrow interface. The kernel is the Core. The programs are the Periphery.

## Why the Periphery is replaceable and the Core is not

This is the property that makes the whole split worth doing. Because the Core holds all the critical state and the Periphery holds none, you can replace the Periphery whenever you like. A redesigned checkout page is a change to the Periphery only. It does not touch the card vault, so it does not require re-auditing the card vault. Release a new checkout on Monday and a new receipt format on Friday, and the part that guards the card data has not changed at all.

Try it the other way around and it does not work. The Core is where the valuable state lives, so changing it means touching the card data and the rules that protect it, and every such change has to pass the highest level of review. The Periphery is cheap to replace because it holds nothing. The Core is expensive to change because it holds everything that matters.

## Draw the line yourself

You will design systems that hold something valuable, a set of keys, a balance, a store of personal data. Whenever you do, find the smallest piece of code that has to touch it and draw a hard line around it. Give it one job: hold the valuable thing and enforce the rules that guard it. Push everything else to the other side of the line, and let it in only through a narrow interface with no special powers. Whatever you leave outside, you can rebuild any time without touching the thing you were trying to protect.

## Blockchain application

Skip this section if you only want the principle. Decentralized finance adopted this split openly. Uniswap v2, an exchange that runs as code on Ethereum, splits into core and periphery contracts. The core contracts are deliberately minimal. They hold the pooled funds and enforce the one trading rule that must never break, the invariant that defines a fair swap. The periphery, mainly a contract called the Router, handles conveniences like routing a trade and checking prices. The Router holds no funds and no special privileges inside the core. It is just a caller, the same role the checkout plays against the card vault.

The ERC8009 standard has the same split, a minimal balance-proxy core and a replaceable Router periphery. There the division was forced by a real vulnerability rather than chosen up front, a story examined in depth in [the clear signing module](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack).
