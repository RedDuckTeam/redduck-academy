---
id: 1513756007
title: Defensive Computation
type: lecture
order: 2
---

Due to the nature of Web3, programs cannot trust anyone and have to consider the worst-case scenario at any point of time. Because of that, the programs have to do what we call ‘Defensive Computations’: choose the lowest possible boundary to work it. It can be the lowest evaluation of assets’ price when accepting them as collateral, or the highest evaluation of existing debt.

<svg role="img" viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:
#e0deda; font-family: system-ui, sans-serif;">
  <title>The same position when the band widens</title>
  <desc>
    Two boxes side by side. Both show a position with 10 tokens of A as collateral and 100 tokens of B as debt, with the same middle prices: A at 150 and B at 10. On the left the market is calm, the band around A is 149 to 151 and the band around B is 9.9 to 10.1. The program values the collateral at the bottom, 1,490, and the debt at the top, 1,010. On the right the market is stressed, the band around A is 144 to 156 and the band around B is 9.5 to 10.5. The collateral is valued at 1,440 and the debt at 1,050. The middle prices did not change, but the position looks worse from both sides.
  </desc>
  <rect x="20" y="20" width="680" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="
#ffffff" font-weight="bold">Same middle prices, wider band</text>
  <rect x="40" y="70" width="300" height="270" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Calm market</text>
  <text x="60" y="124" font-family="monospace" font-size="10" font-weight="bold">collateral: 10 A</text>
  <line x1="80" y1="146" x2="300" y2="146" stroke="
#565653" stroke-width="1"/>
  <rect x="172" y="138" width="36" height="16" fill="none" stroke="
#000000" stroke-width="2"/>
  <line x1="190" y1="136" x2="190" y2="156" stroke="
#000000" stroke-width="1.5"/>
  <circle cx="172" cy="146" r="5" fill="
#ed4937"/>
  <text x="172" y="172" text-anchor="middle" font-family="monospace" font-size="9" fill="
#ed4937">149</text>
  <text x="208" y="172" text-anchor="middle" font-family="monospace" font-size="9" fill="
#565653">151</text>
  <text x="60" y="194" font-family="monospace" font-size="10">10 x 149 = 1,490</text>
  <text x="60" y="224" font-family="monospace" font-size="10" font-weight="bold">debt: 100 B</text>
  <line x1="80" y1="246" x2="300" y2="246" stroke="
#565653" stroke-width="1"/>
  <rect x="172" y="238" width="36" height="16" fill="none" stroke="
#000000" stroke-width="2"/>
  <line x1="190" y1="236" x2="190" y2="256" stroke="
#000000" stroke-width="1.5"/>
  <circle cx="208" cy="246" r="5" fill="
#ed4937"/>
  <text x="172" y="272" text-anchor="middle" font-family="monospace" font-size="9" fill="
#565653">9.9</text>
  <text x="208" y="272" text-anchor="middle" font-family="monospace" font-size="9" fill="
#ed4937">10.1</text>
  <text x="60" y="294" font-family="monospace" font-size="10">100 x 10.1 = 1,010</text>
  <text x="190" y="324" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">1,490 / 1,010 = 1.48</text>
  <rect x="380" y="70" width="300" height="270" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Stressed market</text>
  <text x="400" y="124" font-family="monospace" font-size="10" font-weight="bold">collateral: 10 A</text>
  <line x1="420" y1="146" x2="640" y2="146" stroke="
#565653" stroke-width="1"/>
  <rect x="422" y="138" width="216" height="16" fill="none" stroke="
#000000" stroke-width="2"/>
  <line x1="530" y1="136" x2="530" y2="156" stroke="
#000000" stroke-width="1.5"/>
  <circle cx="422" cy="146" r="5" fill="
#ed4937"/>
  <text x="422" y="172" text-anchor="middle" font-family="monospace" font-size="9" fill="
#ed4937">144</text>
  <text x="638" y="172" text-anchor="middle" font-family="monospace" font-size="9" fill="
#565653">156</text>
  <text x="400" y="194" font-family="monospace" font-size="10">10 x 144 = 1,440</text>
  <text x="400" y="224" font-family="monospace" font-size="10" font-weight="bold">debt: 100 B</text>
  <line x1="420" y1="246" x2="640" y2="246" stroke="
#565653" stroke-width="1"/>
  <rect x="440" y="238" width="180" height="16" fill="none" stroke="
#000000" stroke-width="2"/>
  <line x1="530" y1="236" x2="530" y2="256" stroke="
#000000" stroke-width="1.5"/>
  <circle cx="620" cy="246" r="5" fill="
#ed4937"/>
  <text x="440" y="272" text-anchor="middle" font-family="monospace" font-size="9" fill="
#565653">9.5</text>
  <text x="620" y="272" text-anchor="middle" font-family="monospace" font-size="9" fill="
#ed4937">10.5</text>
  <text x="400" y="294" font-family="monospace" font-size="10">100 x 10.5 = 1,050</text>
  <text x="530" y="324" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="
#ed4937">1,440 / 1,050 = 1.37</text>
  <text x="360" y="372" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">The middle prices are 150 and 10 in both boxes. A middle-price program sees 1.50 in both.</text>
  <text x="360" y="390" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">Red dot = the end the program uses. The numbers are only an example.</text>
</svg>

That is, in order to avoid the risk of taking inaccurate data, the data has to be taken into account at the worst possible version.

## Examples

**Marginfi.** The oracle gives a price and a confidence band. To value a user's collateral, the program takes the bottom of the band. To value the debt, the top. When the band widens, the position looks worse from both sides at once: the user can borrow less, and the liquidation line moves closer. The protocol never lends against the optimistic reading. Two limits keep the band reasonable. The widened confidence is capped at 5% of the price and if the widened confidence is above the limit set for the bank (10% of the price by default) the program does not use the price at all and returns an error.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:
#e0deda; font-family: system-ui, sans-serif;">
  <title>One line for opening, another for liquidation</title>
  <desc>
    A horizontal scale of loan to value, from 0 to 100 percent. A line at 75 percent marks where borrowing stops, and a line at 85 percent marks where liquidation starts. A position opened at 74 percent is allowed. After the collateral price falls, the same position is at 80 percent. It cannot borrow more, but it is not liquidated, because it is still below 85 percent. Only at 86 percent can a liquidator take it. The gap between the two lines is the buffer that keeps a fresh position from being liquidated by the next small move.
  </desc>
  <rect x="20" y="20" width="680" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="
#ffffff" font-weight="bold">One line for opening, another for liquidation</text>
  <rect x="60" y="150" width="600" height="24" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="510" y="151" width="60" height="22" fill="#565653" fill-opacity="0.18"/>
  <rect x="570" y="151" width="89" height="22" fill="#ed4937" fill-opacity="0.35"/>
  <text x="60" y="194" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">0%</text>
  <text x="660" y="194" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">100%</text>
  <text x="360" y="194" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">loan to value</text>
  <line x1="510" y1="100" x2="510" y2="184" stroke="#000000" stroke-width="2.5"/>
  <text x="505" y="92" text-anchor="end" font-family="monospace" font-size="10" font-weight="bold">75%: borrowing stops</text>
  <line x1="570" y1="120" x2="570" y2="184" stroke="#ed4937" stroke-width="2.5"/>
  <text x="575" y="114" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">85%: liquidation</text>
  <circle cx="504" cy="162" r="6" fill="#000000"/>
  <line x1="504" y1="170" x2="400" y2="232" stroke="#000000" stroke-width="1.5"/>
  <rect x="290" y="232" width="190" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="385" y="249" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">opened at 74%</text>
  <text x="385" y="264" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">allowed</text>
  <circle cx="540" cy="162" r="6" fill="#565653"/>
  <line x1="540" y1="170" x2="555" y2="232" stroke="#565653" stroke-width="1.5"/>
  <rect x="500" y="232" width="116" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="558" y="249" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">price fell: 80%</text>
  <text x="558" y="264" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">can&apos;t borrow more</text>
  <circle cx="576" cy="162" r="6" fill="#ed4937"/>
  <line x1="576" y1="170" x2="662" y2="232" stroke="#ed4937" stroke-width="1.5"/>
  <rect x="626" y="232" width="74" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="663" y="249" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">86%</text>
  <text x="663" y="264" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937">liquidated</text>
  <text x="360" y="314" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">The user chooses when to open, so opening gets the stricter line. Liquidation happens</text>
  <text x="360" y="330" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">to the user, so it gets the looser one. The numbers are only an example.</text>
</svg>

Image above is the example of how lending and perp protocols use two different caps for “user action” and “protocol action”. They have a band for the protocol to make a decision so users could not move borrowed percent and manipulate.

**Drift** refuses to fill when the band is too wide relative to the price, and rejects prices that are too old. Let's assume the collateral's price jumps for a few seconds, because of a real move or a manipulated one and then the oracle shows the new price at once, but the 5-minute average does not. The deposit is still worth the lower number and the user cannot borrow against the jump until it has lasted long enough to move the average. On the other hand liquidations do not use such strict mode, they utilize the plain oracle price, for the same reason as the two lines above. We want the protocol to reflect any changes faster than the user could manipulate this change.

**Kamino** rejects a USDC price far from $1, no matter what the oracle says.

**Helium**  prices Data Credits at the bottom of the band. Its a good example of this pattern to show that this is not only about lending. Helium sells the use of its network in Data Credits (1 Data Credit = $0.00001). To get this Data Credits user needs to burn his HNT token (which price can be different). The protocol reads the price from oracle, takes the exponential moving average and subtracts twice its confidence - by this formula they calculate “most conservative price”. Such ways allows Helium creators to be confident that users never get more Data Credits than HNT tokens were burned.
