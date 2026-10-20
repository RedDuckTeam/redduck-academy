---
title: Internal Oracle
type: lecture
order: 1
---

Not all programs really require to have an external oracle in order to receive the necessary state to work with. In some cases, programs can utilize their internal state if properly structured. Structuring of the internal state to function as an ‘oracle’ that provides an outside-chain view on the data, is what we call ‘Internal Oracle’. Programs derive state instead of attempting to calculate it or receive it from the outside.

## Derive it from your own state

For example DEX knows its own prices and the governance program knows who voted. Your main work is to properly store the state so anyone could get the value from it. Usually it can be achieved in two ways: on each transaction write a variable you need or (specific for solana) just create an account for something that should answer the question “does this exists” - existence of account already gives you this answer.

The best example is Raydium TWAP (and protocols that use it): Raydium already has the data on liquidity, positions, swaps, prices. And even though pricing data is commonly thought of as a reason to include an oracle, in some cases a program can simply structure its internal state to produce the indexed data that can later on act as an oracle. The only issue here is that “current price” is easy to move with one large swap transaction, so Raydium developers use average prices over time - Time-Weighted Average Price. They are developed in the way that this average price is not stored anywhere, they just store everything that is needed to calculate the average user’s needs. 

For the CP-Swap pool they store an observation ring - special account with 100 slots). To get the average between two periods of time, users can take the two observation points and divide the difference of the running totals by the seconds between them.

For the CLMM pool they do almost the same but with ticks. Their observation keeps a running total of the tick multiplied by time and when the swap moves the tick the average of the tick turns back into a price.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <title>One swap moves the spot price, not the average</title>
  <desc>
    A chart of a pool&apos;s price over a ten-minute window. The spot price stays at 50 for the whole window except for ten seconds in the middle, when one large swap pushes it to 100. The time-weighted average over the window rises only from 50 to about 50.8. To move the average to 100, the price would have to stay at 100 for the whole ten minutes.
  </desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">One swap moves the spot price, not the average</text>
  <line x1="90" y1="90" x2="90" y2="270" stroke="#000000" stroke-width="2"/>
  <line x1="90" y1="270" x2="660" y2="270" stroke="#000000" stroke-width="2"/>
  <text x="80" y="114" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">100</text>
  <text x="80" y="214" text-anchor="end" font-family="monospace" font-size="10" fill="#565653">50</text>
  <line x1="86" y1="110" x2="660" y2="110" stroke="#565653" stroke-width="1" stroke-dasharray="2 4"/>
  <line x1="86" y1="210" x2="660" y2="210" stroke="#565653" stroke-width="1" stroke-dasharray="2 4"/>
  <text x="90" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">0 s</text>
  <text x="375" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">300 s</text>
  <text x="660" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">600 s</text>
  <polyline points="90,210 375,210 375,110 385,110 385,210 660,210" fill="none" stroke="#000000" stroke-width="2.5"/>
  <line x1="90" y1="208" x2="660" y2="208" stroke="#ed4937" stroke-width="2.5" stroke-dasharray="8 4"/>
  <rect x="395" y="96" width="210" height="28" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="500" y="114" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">one big swap: spot = 100</text>
  <rect x="110" y="225" width="250" height="28" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="235" y="243" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">10-minute average = 50.8</text>
  <rect x="90" y="305" width="570" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="375" y="323" text-anchor="middle" font-family="monospace" font-size="10">(50 x 590 s + 100 x 10 s) / 600 s = 50.8</text>
  <text x="375" y="339" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">to make the average 100, the price must stay at 100 for all 600 s</text>
  <text x="360" y="378" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Black = spot price. Red = average over the window. The numbers are only an example.</text>
</svg>

TWAP is that indexed state, and if a program only works with prices of tokens that exist on Solana, then it may not even need any oracles, and could just utilize Solana’s DEXs and their TWAPs.

## The account is the answer

Realms utilizes the same pattern for the "already voted" state. Each vote is an account at an address computed from the proposal and the voter (a PDA). Nobody separately stores who voted and who didn’t. But if the address is taken, it logically means that they have already voted.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:
#e0deda; font-family: system-ui, sans-serif;">
  <title>The address is the answer</title>
  <desc>
    Two boxes side by side. In both, the program computes one address from the proposal and the voter. On the left, the first vote: no account exists at that address, so the program creates the vote record there and counts the vote. On the right, a second vote by the same voter on the same proposal: the program computes the same address, an account already exists there, and the transaction fails. Nothing else stores who has voted.
  </desc>
  <rect x="20" y="20" width="680" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="
#ffffff" font-weight="bold">The address is the answer</text>
  <rect x="40" y="70" width="300" height="250" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">First vote</text>
  <rect x="60" y="112" width="120" height="30" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="120" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">proposal</text>
  <rect x="200" y="112" width="120" height="30" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="260" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">voter</text>
  <line x1="120" y1="142" x2="120" y2="156" stroke="#000000" stroke-width="2"/>
  <line x1="260" y1="142" x2="260" y2="156" stroke="#000000" stroke-width="2"/>
  <line x1="120" y1="156" x2="260" y2="156" stroke="#000000" stroke-width="2"/>
  <line x1="190" y1="156" x2="190" y2="168" stroke="#000000" stroke-width="2"/>
  <polygon points="184,166 196,166 190,176" fill="#000000"/>
  <rect x="90" y="176" width="200" height="34" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="197" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">PDA address</text>
  <line x1="190" y1="210" x2="190" y2="224" stroke="#000000" stroke-width="2"/>
  <polygon points="184,222 196,222 190,232" fill="#000000"/>
  <rect x="90" y="232" width="200" height="34" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="253" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">empty? yes: create record</text>
  <text x="190" y="298" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">vote counted</text>
  <rect x="380" y="70" width="300" height="250" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Same voter, second vote</text>
  <rect x="400" y="112" width="120" height="30" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="460" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">proposal</text>
  <rect x="540" y="112" width="120" height="30" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="600" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">voter</text>
  <line x1="460" y1="142" x2="460" y2="156" stroke="#000000" stroke-width="2"/>
  <line x1="600" y1="142" x2="600" y2="156" stroke="#000000" stroke-width="2"/>
  <line x1="460" y1="156" x2="600" y2="156" stroke="#000000" stroke-width="2"/>
  <line x1="530" y1="156" x2="530" y2="168" stroke="#000000" stroke-width="2"/>
  <polygon points="524,166 536,166 530,176" fill="#000000"/>
  <rect x="430" y="176" width="200" height="34" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="197" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">same PDA address</text>
  <line x1="530" y1="210" x2="530" y2="224" stroke="#000000" stroke-width="2"/>
  <polygon points="524,222 536,222 530,232" fill="#000000"/>
  <rect x="430" y="232" width="200" height="34" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="253" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">empty? no: account exists</text>
  <text x="530" y="298" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">transaction fails</text>
  <text x="360" y="346" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">No list of voters is stored. Whether someone voted is a fact about one address.</text>
</svg>

The token owner record keeps only a counter of votes that are still active. It is needed for the disabling ability to withdraw tokens while voting is in progress and that counter is the only extra state added. This is a definition of deriving a state from another state, instead of relying on computing it/obtaining it from the outside.
