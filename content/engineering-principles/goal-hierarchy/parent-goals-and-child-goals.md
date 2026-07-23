---
id: 1869140958
title: Parent goals and child goals
type: lecture
order: 1
faq:
  - question: How is this different from the parent and child goals I already met?
    answer: The earlier idea named the two kinds of goal. This turns the pair into a
      repeatable step. Before committing to a design choice, trace the full chain of
      goals it serves up to the parent, and judge whether it still serves the parent
      or only a child goal that has stopped mattering.
  - question: Isn't removing a working feature always a loss?
    answer: No. A feature that serves only a small child goal while adding complexity
      that slows the parent goal is a net cost. Removing it gives up the child to serve
      the parent, which is often the right call even though it feels like a loss.
  - question: How do I tell a parent goal from a child goal?
    answer: Ask what each goal is for. If a goal is worth pursuing on its own, it is
      closer to the parent. If it is worth pursuing only because it serves a bigger
      goal, it is a child goal, and it keeps its value only while that bigger goal is
      still being served.
---

> You already met the **parent goal** and the **child goal** in [What engineering is and is not](/courses/engineering-principles/design-tradeoffs/what-engineering-is-and-is-not). Here that pair becomes a method. Trace any design choice up the chain of goals it serves, keep it while it serves the parent, and drop it the moment it serves only a child that has stopped serving the parent.

## Goals stack, and the stack is the point

Every goal you pursue sits under a bigger one. In a chess game the stack runs from the top down.

- Win the game.
- Reach a position that is likely to win.
- Build strength on the board.
- Capture the other player's pieces.

Each lower goal is a child of the one above it. Capturing pieces is worth doing because it usually builds strength, strength usually leads to a winning position, and a winning position wins the game. The goal at the very top, winning, is the only one that matters on its own. Every goal beneath it is a means, and a means is only as good as the end it still serves.

<svg role="img" viewBox="0 0 720 440" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Goals stacked from the parent goal down to a child goal</title><desc>Four goals stacked. Win the game is the parent goal at the top. Below it, reach a winning position, then build strength on the board, then capture pieces, the smallest child goal. Each lower goal points up to the goal it serves. A child goal is worth keeping only while it still serves the parent above it.</desc>
<defs>
<marker id="up1" viewBox="0 0 10 10" refX="5" refY="1" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
<path d="M 0 10 L 5 0 L 10 10 z" fill="#565653"/>
</marker>
</defs>
<text x="360" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Every child goal serves a parent goal</text>

  <rect x="200" y="50" width="320" height="54" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="74" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Win the game</text>
  <text x="360" y="92" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff">the parent goal</text>

  <line x1="360" y1="150" x2="360" y2="108" stroke="#565653" stroke-width="2" marker-end="url(#up1)"/>
  <text x="372" y="132" font-family="monospace" font-size="9" fill="#565653">serves</text>

  <rect x="200" y="150" width="320" height="54" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="182" text-anchor="middle" font-size="13" fill="#000000">Reach a winning position</text>

  <line x1="360" y1="250" x2="360" y2="208" stroke="#565653" stroke-width="2" marker-end="url(#up1)"/>
  <text x="372" y="232" font-family="monospace" font-size="9" fill="#565653">serves</text>

  <rect x="200" y="250" width="320" height="54" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="282" text-anchor="middle" font-size="13" fill="#000000">Build strength on the board</text>

  <line x1="360" y1="350" x2="360" y2="308" stroke="#565653" stroke-width="2" marker-end="url(#up1)"/>
  <text x="372" y="332" font-family="monospace" font-size="9" fill="#565653">serves</text>

  <rect x="200" y="350" width="320" height="54" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="374" text-anchor="middle" font-size="13" fill="#000000">Capture pieces</text>
  <text x="360" y="392" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">a child goal, kept only while it serves up</text>

<text x="360" y="428" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Trace a child goal up the stack, and keep it only while it still serves the parent.</text>
</svg>

## When the child goal eats the parent

A team once set out to raise the quality of its code by adopting a commit naming convention. Every saved change had to be labeled by type, a fix, a feature, or a chore. Effort went into agreeing the rule, writing it down, and enforcing it on every change. Meanwhile the same codebase held a piece of fault-intolerant code that crashed the product's main function whenever one optional external API call failed. A call the product did not even need to succeed could take down the part every user depended on.

Line the two up. A tidy commit label is a child goal. It serves readable history, which serves a maintainable codebase, which serves a product that keeps working. Fault tolerance, the main function staying up when an optional call fails, sits much closer to that same parent, a product that works. The team spent its effort on the child while the real weakness sat untouched. Optimizing a child goal while the parent goes unserved is the mistake in its plainest form, and it is common because the child goal is the visible, satisfying one to work on.

## Trace the chain before you commit

Before you commit to a design choice, name the chain of goals it serves, from the choice itself up to the parent. Then ask two questions. Does this choice serve the parent goal directly? If it does, you are finished. If it does not, it serves some child goal, so ask the second question: does that child goal actually serve the parent, here and now? A child goal that once served the parent can quietly stop, while the choice that serves the child keeps looking productive long after it has stopped mattering.

## Measure the number that decides the outcome

The same trap hides in numbers. You react to a number because it is easy to see, when a different number is the one that decides the result. Someone once argued that a screen had to load its data in small pages, because a single response held twelve thousand items. Twelve thousand sounds like far too much to send at once. But for loading the data, the count was never what mattered. The weight was. Those twelve thousand items came to about 125 kilobytes, a small fraction of one photo already on the same screen, and small enough to arrive in one go with nobody noticing. The loud number was the count. The count was a child of the real question, how fast the data loads. And it was not even the number that answered that question. Before you optimize against a number, check that it is the number that decides the outcome.

## Sometimes you give up the child for the parent

Sometimes serving the parent goal means removing something that serves only a child goal. A team keeps an internal dashboard feature that one department uses for a single edge case. The feature is not free to keep. Its presence adds complexity that slows every release of the product's main function, the thing all users depend on. The edge case is a child goal. A fast, reliable main function sits much closer to the parent. Removing the dashboard feature is the hierarchy applied. You give up the child to serve the parent.

This is the direction that feels wrong. Cutting a working feature that someone relies on feels like a loss, so the instinct is to keep it and protect the child goal. That instinct is exactly why the check has to be spoken aloud. State the rule plainly. A choice that optimizes a child goal at the cost of the parent is always wrong. The reverse, giving up a child goal to serve the parent, is often right. It often feels wrong, which is why you trace the chain out loud instead of trusting the feeling.

## Name the parent out loud

When you are about to defend a design choice, stop and name the parent goal it is meant to serve, then trace the chain between the two. Most stuck design arguments are two people each holding a different child goal, performance against elegance, coverage against speed, and neither one naming the parent both goals are supposed to serve. Put the parent back on the table, and the choices usually sort themselves by how well they serve it.

## Blockchain application

Skip this section if you only want the principle. In a design for signing safety, the parent goal is plain: the person signing a transaction can verify what it will do before they sign. Several features can serve that goal. Showing the balance change a transaction will cause serves it for every transaction. Decoding a known contract's interface serves it only when the contract is one the tool already recognizes. Parsing the raw call data serves it only for the simple cases a human can read. The balance-change display won out, because it serves the parent goal no matter which contract is being called. A rarely-used feature that served only an edge case was removed, because keeping it added complexity to the simple path that serves everyone. That is a real case of giving up a child goal to protect the parent. This design is examined in depth in [the clear signing module](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack).
