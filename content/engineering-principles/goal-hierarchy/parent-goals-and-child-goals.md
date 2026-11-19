---
id: 1869140958
title: Parent goals and child goals
type: lecture
order: 1
faq:
  - question: How do I tell a parent goal from a child goal?
    answer: >-
      Ask what each goal is for. A goal worth pursuing on its own sits near the parent. A goal
      worth pursuing only because it serves a bigger one is a child. In chess, winning is the
      only goal that matters by itself, and capturing pieces is worth doing while it still
      builds strength.
  - question: Can optimizing a child goal be wrong?
    answer: >-
      Yes. If it makes the parent goal above it worse, you have improved nothing.
  - question: Is enforcing a commit naming convention a good use of a team's time?
    answer: >-
      Trace it up first. A tidy commit label serves readable history, which serves a
      maintainable codebase, which serves a product that keeps working. One team enforced the
      labels while the same codebase crashed the product's main function whenever an optional
      external API call failed.
  - question: One response returns twelve thousand items. Should I page it?
    answer: >-
      Weigh the data before you decide. Twelve thousand items came to about 125 kilobytes,
      less than one photo already on the same screen, and arrived in one go with nobody
      noticing. The count was the loud number. Load time decided the outcome.
  - question: Is it ever right to delete a feature someone depends on?
    answer: >-
      Yes. A dashboard feature one department uses for a single edge case is a child goal, and
      keeping it slows every release of the main function all users depend on.
---

> You already met the **parent goal** and the **child goal** in [What engineering is and is not](/courses/engineering-principles/design-tradeoffs/what-engineering-is-and-is-not). Here that pair becomes a method. Trace any design choice up the chain of goals it serves, keep it while it serves the parent, and drop it the moment it serves only a child that has stopped serving the parent.

## Goals stack several levels deep

Every goal you pursue sits under a bigger one. In a chess game the stack runs from the top down.

- Win the game.
- Reach a position that is likely to win.
- Build strength on the board.
- Capture the other player's pieces.

Each lower goal is a child of the one above it. Capturing pieces is worth doing because it usually builds strength, strength usually leads to a winning position, and a winning position wins the game. The goal at the very top, winning, is the only one that matters on its own. Each link below it holds most of the time, not always. A capture that weakens your own position serves the bottom goal and none of the goals above it.

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

## A team enforced commit labels while the main function kept crashing

A team once set out to raise the quality of its code by adopting a commit naming convention. Every saved change had to be labeled by type, a fix, a feature, or a chore. Effort went into agreeing the rule, writing it down, and enforcing it on every change. Meanwhile the same codebase held a piece of fault-intolerant code that crashed the product's main function whenever one optional external API call failed.

A tidy commit label is a child goal. It serves readable history, which serves a maintainable codebase, which serves a product that keeps working. Fault tolerance, the main function staying up when an optional call fails, sits much closer to that same parent, a product that works. The team spent its effort on the child while the real weakness sat untouched. The mistake is common because the child goal is the visible, satisfying one to work on.

## Trace the chain before you commit

Before you commit to a design choice, name the chain of goals it serves, from the choice itself up to the parent, and ask two questions. Does this choice serve the parent goal directly? If it does, you are finished. If it does not, it serves some child goal, so ask the second question: does that child goal serve the parent, here and now? A child goal that once served the parent can quietly stop, while the choice that serves the child keeps looking productive long after it has stopped mattering.

## Measure the number that decides the outcome

Someone once argued that a screen had to load its data in small pages, because a single response held twelve thousand items. Twelve thousand sounds like far too much to send at once. But how fast the data loads depends on its weight, not on the count. Those twelve thousand items came to about 125 kilobytes, a small fraction of one photo already on the same screen, and small enough to arrive in one go with nobody noticing. The count was a child of the real question, how fast the data loads, and it was not the number that answered that question. Before you optimize against a number, check that it is the number that decides the outcome.

## Sometimes you give up the child for the parent

Sometimes serving the parent goal means removing something that serves only a child goal. Suppose a team keeps an internal dashboard feature that one department uses for a single edge case. Keeping it adds complexity that slows every release of the product's main function, the thing all users depend on. The edge case is a child goal, and a fast, reliable main function sits much closer to the parent, so removing the feature is right even though someone relies on it. Cutting a working feature feels like a loss, which is why you trace the chain instead of trusting the feeling.

## Tracing settles an argument only under an agreed parent

A stuck design argument is usually two people each holding a different child goal, performance against elegance, coverage against speed, and neither one naming the parent both goals are supposed to serve. Trace both goals up until the chains meet. If they meet at a parent both sides accept, the choices usually sort themselves by how well they serve it.

If the chains do not meet, the two sides disagree about what the product is for, and tracing cannot settle that. The method ranks choices under a parent that is already agreed. It does not say which goal should be the parent.

## Blockchain application

In a design for signing safety, the parent goal is that the person signing a transaction can verify what it will do before they sign. Several features can serve that goal. Showing the balance change a transaction will cause serves it for every transaction. Decoding a known contract's interface serves it only when the contract is one the tool already recognizes. Parsing the raw call data serves it only for the simple cases a human can read. The balance-change display won out, because it serves the parent goal no matter which contract is being called. A rarely-used feature that served only an edge case was removed, because keeping it added complexity to the simple path that serves everyone. That is a real case of giving up a child goal to protect the parent. This design is examined in depth in [ERC-8009: sign the outcome](/courses/development-on-ethereum/clear-signing/erc-8009-sign-the-outcome).
