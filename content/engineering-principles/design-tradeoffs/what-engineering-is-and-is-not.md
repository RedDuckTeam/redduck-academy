---
id: 1781564811
title: What engineering is and is not
type: lecture
order: 1
faq:
  - question: Isn't one data format simply better than the other?
    answer: No format is better in the abstract. JSON is text a person can read
      directly, which suits a public API where outside developers need to debug
      quickly. Protocol Buffers is a compact binary format, which suits internal
      services exchanging billions of messages where size and speed dominate. The
      right choice follows from the goal the system is there to serve.
  - question: What is a parent goal?
    answer: A parent goal is the larger thing a smaller design choice is meant to
      serve. A choice that looks wrong on its own often makes sense once you know
      the goal above it, and the same choice can be right under one parent goal and
      wrong under another. Naming the parent goal is what makes a tradeoff
      decidable.
  - question: Why is optimizing a child goal sometimes a mistake?
    answer: A child goal is only worth improving while it still serves the parent
      goal above it. Making messages smaller is a real gain, but forcing a binary
      format onto a small public API saves bytes nobody notices while making every
      outside developer's work harder. Improving the child goal at the cost of the
      parent goal it serves improves nothing.
---

> Two programs solve the same problem. One runs faster. The other is easier to read and check for mistakes. Which one is better? The question has no answer until you know what the program is for. Engineering is the reasoned choice among options like these, and the word "better" always points back to a goal you have to name first.

## Which program is better?

You are handed two programs. They take the same input and return the same output. One is faster. The other is plainer, so a person reading it can follow every step and spot a mistake in seconds. Someone asks you which is better.

There is a strong pull to answer right away. Faster sounds better. Clearer also sounds better. But whichever you pick, you have picked without the one thing that decides it: what the program is for. A program that prices trades a million times a second depends entirely on speed. A program that runs once a night and must never quietly corrupt payroll depends entirely on being easy to check. Same two programs, different right answer.

That is what engineering is not. It is not making a thing as fast, as small, or as clever as it can be. Push any one of those dials to its limit and you usually starve another that mattered more. The work is choosing which dials to turn, and how far, for the goal in front of you.

## A tradeoff is a choice where one gain costs another

A **tradeoff** is a design choice where gaining one property costs you another. More speed for less clarity. More clarity for less speed. Both options are valid, and neither is broken. What separates them is fit: which one serves the goal the work is really there for.

That goal has a name worth using. Call it the **parent goal**, the larger thing every smaller choice underneath it is meant to serve. You cannot judge a smaller choice until you have named the parent goal above it, because the same choice can be right under one parent goal and wrong under another.

## Two real ways to send data between programs

Programs constantly send data to each other, and there are two well-known formats for it that make opposite tradeoffs.

JSON is text. A message in JSON is something a person can open and read directly. When a response comes back wrong, an engineer opens it, sees the bad field with their own eyes, and fixes it. That readability is the whole appeal.

Protocol Buffers is a binary format built at Google. The same message in Protocol Buffers is far smaller and faster for a machine to process, but a person cannot read it without extra tools to decode it first. The bytes on the wire are compact and quick. The direct human readability is gone.

Both formats are correct, and both are used widely every day. One is built around machine efficiency. The other is built around a human being able to read it. Neither is the better format in the abstract, because "better" is still waiting on a parent goal.

## Which one is right depends on the parent goal

Picture a public API, the kind outside developers around the world write code against. What is the parent goal there? Those developers succeeding quickly. When something breaks, a developer who can open the response and read it is unstuck in minutes. The handful of bytes a binary format would save is a small **child goal** at that scale, invisible next to the cost of confusing thousands of people. Readability serves the parent goal directly, so JSON is right.

Now picture internal traffic between a company's own services, machines exchanging billions of messages a day with each other. Here the parent goal shifts. Keeping that system fast and affordable is a large part of the whole point, and at billions of messages the size of each one and the cost of processing it stop being negligible. Now the compact binary format serves the parent goal, so Protocol Buffers is right.

This is the split that happened in the real world. Google built Protocol Buffers for the internal services where size and speed dominate, while most public APIs are built on JSON. Same two formats. Opposite correct answers. The only thing that moved was the parent goal.

<svg role="img" viewBox="0 0 720 350" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Same two data formats, opposite correct answers under different parent goals</title><desc>Two columns compare the same two data formats under two different parent goals. A public API whose parent goal is outside developers succeeding quickly is correctly served by JSON, because a human can read the response. Internal services whose parent goal is staying fast and affordable at billions of messages are correctly served by Protocol Buffers, because the messages are small and fast to process. The formats do not change, only the parent goal does.</desc>
  <rect x="20" y="16" width="680" height="34" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="38" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Same two formats, opposite correct answers</text>

  <rect x="40" y="72" width="300" height="232" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="72" width="300" height="30" fill="#565653" stroke="#000000" stroke-width="2"/>
  <text x="190" y="92" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Public API, outside developers</text>
  <text x="190" y="128" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">parent goal:</text>
  <text x="190" y="146" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">outside developers</text>
  <text x="190" y="162" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">succeed quickly</text>
  <line x1="60" y1="180" x2="320" y2="180" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="190" y="206" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">JSON</text>
  <text x="190" y="232" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">a human reads the</text>
  <text x="190" y="250" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">response and fixes it</text>
  <text x="190" y="274" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">saved bytes: a small</text>
  <text x="190" y="288" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">child goal here</text>

  <rect x="380" y="72" width="300" height="232" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="380" y="72" width="300" height="30" fill="#565653" stroke="#000000" stroke-width="2"/>
  <text x="530" y="92" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Internal traffic between services</text>
  <text x="530" y="128" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">parent goal:</text>
  <text x="530" y="146" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">stay fast and</text>
  <text x="530" y="162" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">affordable at scale</text>
  <line x1="400" y1="180" x2="660" y2="180" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="530" y="206" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Protocol Buffers</text>
  <text x="530" y="232" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">small and fast for</text>
  <text x="530" y="250" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">machines to process</text>
  <text x="530" y="274" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">readability: a small</text>
  <text x="530" y="288" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">child goal here</text>

  <text x="360" y="332" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">The formats do not change. The parent goal does, and it decides which one is correct.</text>
</svg>

## The wrong way to choose

There is a tempting way to get this wrong, and it is worth naming because it looks like rigor. You take one child goal, measure it, and declare a winner. "Protocol Buffers produces smaller messages, so Protocol Buffers is better." The measurement is true. The conclusion skips the parent goal entirely.

Put the binary format into a small public API and watch what it buys. It saves a few bytes nobody will ever notice, and in exchange every outside developer now needs extra tooling to read a response they used to read directly. A child goal has been pushed to its best value at the direct expense of the parent goal above it. Improving a child goal while the parent goal it serves gets worse improves nothing at all.

## Say the goal before you compare options

Every design decision sits underneath a parent goal, and the decision only makes sense once that goal is named. So make naming it your first move. Before you weigh two options, before you measure anything, say plainly what the larger goal is that both options are meant to serve. Once it is named, most tradeoffs stop being a matter of taste and become a plain question of which option serves the goal you just stated.
