---
id: 1413647121
title: The irrelevance principle
type: lecture
order: 1
faq:
  - question: Does a generic sort need to know it is sorting prices?
    answer: >-
      No. It needs one thing, a way to compare two values.
  - question: Why not make the sort accept only prices?
    answer: >-
      The check would grow the routine, force you to decide what happens when it fails, and
      fix nothing. The routine already sorts timestamps and temperatures correctly, because
      the domain of the data never affected the result.
  - question: What is parametricity?
    answer: >-
      The guarantee that a function written to work for any type, without reading what the
      values mean, behaves the same way for every type. It has no way to tell one type from
      another, so it cannot treat them differently. Everyday programming calls the same idea
      genericity, or parametric polymorphism.
  - question: Is the Irrelevance Principle just a fancy name for generics?
    answer: >-
      Generics are one instance of it, inside a program. The principle covers any system. TCP
      delivers a stream of bytes reliably and in order without reading them, because what the
      bytes carry has no bearing on delivering them.
  - question: How do I know a check is buying me nothing?
    answer: >-
      Run it in your head with the check removed. If the result is still correct for every
      input you care about, the check was guarding nothing.
---

> A system should only constrain what it actually cares about. When it starts checking a property that has no effect on the result, that check adds complexity and buys no correctness. The skill is spotting the properties a system is free to ignore, and leaving them unconstrained.

## A sort that does not care what it sorts

Think about a sorting routine. You hand it a sequence of values and a way to compare two of them, and it hands back the same values in order. It compares pairs, moves them around, and compares again until nothing is out of place.

At no point does it look at what the values mean. They could be prices, timestamps, or temperatures. To the sort they are just things with an order, and the comparison function is the only thing it needs. One routine handles all three domains without a single line that mentions any of them.

Now suppose someone decided the sort should accept only prices. You would add a check that rejects anything that is not a price, and then reason about what should happen when that check fails. The routine grows. It is also no more correct than before, because it already sorted timestamps and temperatures perfectly. The domain of the data never affected the result, so constraining it added work and fixed nothing.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>One sort routine applied to three different kinds of value</title><desc>Three input boxes, prices, timestamps, and temperatures, each with example values. Arrows lead from all three down into a single red box, the sort routine, which compares pairs and never reads what the values mean. Arrows lead back out to three output boxes holding the same values in order. The domain of the values never reaches the sort.</desc>
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <text x="360" y="28" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">One sort routine, any kind of value</text>

  <rect x="30" y="48" width="190" height="64" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="30" y="48" width="190" height="26" fill="#565653"/>
  <text x="125" y="66" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Prices</text>
  <text x="125" y="98" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">3.50   1.20   9.99</text>

  <rect x="265" y="48" width="190" height="64" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="265" y="48" width="190" height="26" fill="#565653"/>
  <text x="360" y="66" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Timestamps</text>
  <text x="360" y="98" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">09:14  08:02  11:40</text>

  <rect x="500" y="48" width="190" height="64" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="500" y="48" width="190" height="26" fill="#565653"/>
  <text x="595" y="66" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Temperatures</text>
  <text x="595" y="98" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">21   19   24</text>

  <line x1="125" y1="112" x2="200" y2="150" stroke="#565653" stroke-width="2" marker-end="url(#ar)"/>
  <line x1="360" y1="112" x2="360" y2="150" stroke="#565653" stroke-width="2" marker-end="url(#ar)"/>
  <line x1="595" y1="112" x2="520" y2="150" stroke="#565653" stroke-width="2" marker-end="url(#ar)"/>

  <rect x="140" y="150" width="440" height="60" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="178" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The sort routine</text>
  <text x="360" y="198" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff">compares pairs, never reads what the values mean</text>

  <line x1="200" y1="210" x2="125" y2="248" stroke="#565653" stroke-width="2" marker-end="url(#ar)"/>
  <line x1="360" y1="210" x2="360" y2="248" stroke="#565653" stroke-width="2" marker-end="url(#ar)"/>
  <line x1="520" y1="210" x2="595" y2="248" stroke="#565653" stroke-width="2" marker-end="url(#ar)"/>

  <rect x="30" y="248" width="190" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="125" y="268" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">in order</text>
  <text x="125" y="292" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">1.20   3.50   9.99</text>

  <rect x="265" y="248" width="190" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="268" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">in order</text>
  <text x="360" y="292" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">08:02  09:14  11:40</text>

  <rect x="500" y="248" width="190" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="595" y="268" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">in order</text>
  <text x="595" y="292" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">19   21   24</text>

  <text x="360" y="348" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">The domain of the values, price or time or temperature, never reaches the sort.</text>
</svg>

## Why a generic function behaves the same for everything

There is a reason the generic sort can be trusted, and it is worth stating precisely.

A function written to work for any type, without reading what the values mean, is forced to behave the same way for every type. It cannot special-case prices over timestamps, because it has no way to tell one from the other. That uniform behavior is a guarantee you get for free, and you get it exactly because the function knows nothing about the type it is handed.

In type theory this property has a name, parametricity. In everyday programming the same idea goes by genericity, or parametric polymorphism. For this course the useful name is the **Irrelevance Principle**: only constrain what you actually care about.

## The same principle one layer down

The idea is not special to sorting. TCP, the transport protocol under much of the traffic on the internet, delivers a stream of bytes reliably and in order. It does not read the bytes. Whether they carry a web page, a video call, or a database query makes no difference to delivering them safely.

That indifference is the whole reason one transport protocol can sit under every application built on top of it. The content of the payload is irrelevant to reliable delivery, so TCP does not inspect it. A network that did inspect payloads and restricted certain kinds would be harder to build on, and no better at the one job of delivery, because delivery was never in question.

## Find the check that buys nothing

Whenever a system starts inspecting a property its outcome does not depend on, treat that as a signal to stop and ask one question. Does the correctness of the result depend on this check? Run the system in your head with the check removed. If the outcome is still correct for every input you care about, the check was guarding nothing, and you can take it out. A constraint earns its place by changing what counts as a correct result. One that does not is pure cost.

## Blockchain application

Skip this section if you only want the principle.

A balance check can accept any target address. Whether the address belongs to a company treasury, a retail user, or an automated bot has no bearing on reading a balance, so a good design does not constrain it. Uniswap v2's core enforces its invariant for any caller at all, with no special permissions for anyone. Both are the Irrelevance Principle written into a contract. The identity of who is asking is irrelevant to the check, so the check ignores it.
