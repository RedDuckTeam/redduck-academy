---
title: Fail-Fast
type: lecture
order: 3
---

Some inputs are not good enough to act on:

- The oracle doesn’t give a high confidence score about the price.
- The price jumped too far since the last slot. 
- The random number has not arrived yet.

On Solana, just as on any other blockchain where transactions are atomic, your program cannot wait for a better input. It has to decide now, with the data it was given. If acting is its only output, it will act on bad data too. So a failure to proceed alongside with its reason must be an output as well. The refusal is not a crash, it's just one of the outcomes the protocol was designed to have. 

## Examples

**Drift.** The program grades the oracle before every action. The band around the price (Pyth's confidence interval) is too wide: uncertain. The update is too old: stale. The price is too far from its own five-minute average: too volatile. Each action has its own rule. The pool fills only on a price that passed every check. 

<svg role="img" viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" style="background:
#e0deda; font-family: system-ui, sans-serif;">
  <title>Which oracle grades each Drift action accepts</title>
  <desc>
    A table with seven oracle grades as rows, from valid to non-positive, and five actions as columns. An immediate fill against the AMM accepts only a valid price. An order priced relative to the oracle gets a price only while the oracle is valid, stale for the AMM or short of data points. A margin check accepts the same three grades. A liquidation accepts everything except a too volatile or non-positive price. A funding update accepts everything except a too uncertain, too volatile or non-positive price. The riskiest action for the protocol needs the best price, and liquidation, which protects the protocol, accepts the most.
  </desc>
  <rect x="20" y="20" width="680" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="
#ffffff" font-weight="bold">Drift: which oracle grade each action accepts</text>
  <rect x="40" y="76" width="650" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="50" y="98" font-size="11" fill="
#ffffff" font-weight="bold">oracle grade</text>
  <text x="294" y="98" text-anchor="middle" font-size="11" fill="
#ffffff" font-weight="bold">AMM fill</text>
  <text x="382" y="98" text-anchor="middle" font-size="11" fill="
#ffffff" font-weight="bold">oracle order</text>
  <text x="470" y="98" text-anchor="middle" font-size="11" fill="
#ffffff" font-weight="bold">margin check</text>
  <text x="558" y="98" text-anchor="middle" font-size="11" fill="
#ffffff" font-weight="bold">liquidation</text>
  <text x="646" y="98" text-anchor="middle" font-size="11" fill="
#ffffff" font-weight="bold">funding</text>
  <rect x="40" y="110" width="650" height="34" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="50" y="131" font-family="monospace" font-size="10" font-weight="bold">valid</text>
  <text x="294" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="382" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="470" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="558" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="646" y="131" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <rect x="40" y="144" width="650" height="34" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="50" y="159" font-family="monospace" font-size="10" font-weight="bold">stale for AMM</text>
  <text x="50" y="172" font-family="monospace" font-size="9" fill="
#565653">older than 10 slots</text>
  <text x="294" y="165" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="382" y="165" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="470" y="165" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="558" y="165" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="646" y="165" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <rect x="40" y="178" width="650" height="34" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="50" y="193" font-family="monospace" font-size="10" font-weight="bold">insufficient data</text>
  <text x="50" y="206" font-family="monospace" font-size="9" fill="
#565653">too few price sources</text>
  <text x="294" y="199" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="382" y="199" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="470" y="199" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="558" y="199" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="646" y="199" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <rect x="40" y="212" width="650" height="34" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="50" y="227" font-family="monospace" font-size="10" font-weight="bold">stale for margin</text>
  <text x="50" y="240" font-family="monospace" font-size="9" fill="
#565653">older than 120 slots</text>
  <text x="294" y="233" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="382" y="233" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="470" y="233" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="558" y="233" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="646" y="233" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <rect x="40" y="246" width="650" height="34" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="50" y="261" font-family="monospace" font-size="10" font-weight="bold">too uncertain</text>
  <text x="50" y="274" font-family="monospace" font-size="9" fill="
#565653">confidence above 2%</text>
  <text x="294" y="267" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="382" y="267" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="470" y="267" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="558" y="267" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">ok</text>
  <text x="646" y="267" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <rect x="40" y="280" width="650" height="34" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="50" y="295" font-family="monospace" font-size="10" font-weight="bold">too volatile</text>
  <text x="50" y="308" font-family="monospace" font-size="9" fill="
#565653">5x away from its TWAP</text>
  <text x="294" y="301" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="382" y="301" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="470" y="301" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="558" y="301" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="646" y="301" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <rect x="40" y="314" width="650" height="34" fill="
#e0deda" stroke="
#000000" stroke-width="1.5"/>
  <text x="50" y="329" font-family="monospace" font-size="10" font-weight="bold">non-positive</text>
  <text x="50" y="342" font-family="monospace" font-size="9" fill="
#565653">price at or below 0</text>
  <text x="294" y="335" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="382" y="335" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="470" y="335" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="558" y="335" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <text x="646" y="335" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="
#ed4937">refused</text>
  <line x1="250" y1="76" x2="250" y2="348" stroke="
#000000" stroke-width="1"/>
  <line x1="338" y1="76" x2="338" y2="348" stroke="
#000000" stroke-width="1"/>
  <line x1="426" y1="76" x2="426" y2="348" stroke="
#000000" stroke-width="1"/>
  <line x1="514" y1="76" x2="514" y2="348" stroke="
#000000" stroke-width="1"/>
  <line x1="602" y1="76" x2="602" y2="348" stroke="
#000000" stroke-width="1"/>
  <text x="360" y="378" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">The AMM takes the other side of the trade, so it needs the best price. Liquidation</text>
  <text x="360" y="394" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">protects the protocol, so it accepts the most. Limits are the defaults in Drift&apos;s code.</text>
</svg>

The refusals also look different: when the AMM cannot fill because the price is not good enough, the program just logs the AMM cannot fill and does not fail the transaction, the order stays open and another user can still match it.

**Kamino** keeps a plausible range per token. A USDC price far from $1 is refused, even if the oracle is confident. But for different actions there are different constraints. If you need to borrow, the protocol should be confident that everything is in normal state. A liquidation needs only a loaded, fresh, usable price, so a price that drifted from its average or left its plausible range still allows liquidation, while it stops every new borrow.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:
#e0deda; font-family: system-ui, sans-serif;">
  <title>Kamino stores the result of its price checks</title>
  <desc>
    A reserve refresh runs six price checks: price loaded, price age, TWAP age, distance from TWAP, plausible range and usage allowed. In this example the price is too far from its TWAP, so that flag stays unset, and the other five are set. The flags are stored in the reserve as a status. A borrow needs all six flags, finds one missing and fails with a stale reserve error. A liquidation needs only price loaded, price age and usage allowed, finds them, and goes through.
  </desc>
  <rect x="20" y="20" width="680" height="34" fill="
#ed4937" stroke="
#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="
#ffffff" font-weight="bold">The refusal is stored in the reserve</text>
  <rect x="200" y="70" width="320" height="30" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="90" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">refresh reserve: run every price check</text>
  <line x1="360" y1="100" x2="360" y2="112" stroke="#000000" stroke-width="2"/>
  <polygon points="354,110 366,110 360,120" fill="#000000"/>
  <rect x="140" y="120" width="440" height="128" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="140" y="120" width="440" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="138" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">reserve status, valid for this slot only</text>
  <text x="160" y="166" font-family="monospace" font-size="10">price loaded</text>
  <text x="330" y="166" font-family="monospace" font-size="10" font-weight="bold">set</text>
  <text x="380" y="166" font-family="monospace" font-size="10">TWAP age</text>
  <text x="540" y="166" font-family="monospace" font-size="10" font-weight="bold">set</text>
  <text x="160" y="190" font-family="monospace" font-size="10">price age</text>
  <text x="330" y="190" font-family="monospace" font-size="10" font-weight="bold">set</text>
  <text x="380" y="190" font-family="monospace" font-size="10" fill="#ed4937">near its TWAP</text>
  <text x="540" y="190" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">unset</text>
  <text x="160" y="214" font-family="monospace" font-size="10">usage allowed</text>
  <text x="330" y="214" font-family="monospace" font-size="10" font-weight="bold">set</text>
  <text x="380" y="214" font-family="monospace" font-size="10">plausible range</text>
  <text x="540" y="214" font-family="monospace" font-size="10" font-weight="bold">set</text>
  <text x="360" y="238" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">a failed check is logged, not thrown</text>
  <line x1="250" y1="248" x2="190" y2="282" stroke="#000000" stroke-width="2"/>
  <line x1="470" y1="248" x2="530" y2="282" stroke="#000000" stroke-width="2"/>
  <rect x="60" y="282" width="260" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="190" y="302" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">borrow: needs all six</text>
  <text x="190" y="318" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">one flag missing</text>
  <text x="190" y="334" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">fails: reserve stale</text>
  <rect x="400" y="282" width="260" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="302" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">liquidation: needs three</text>
  <text x="530" y="318" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">loaded, age, usage allowed</text>
  <text x="530" y="334" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">goes through</text>
  <text x="360" y="374" text-anchor="middle" font-family="monospace" font-size="11" fill="
#565653" font-style="italic">The checks run once. Each instruction reads the answer and asks only for what it needs.</text>
</svg>

**A coin flip on Switchboard VRF** stores its refusal. While a round is open, the player cannot start a new one. Only the oracle's answer closes it. The settling instruction asks for the revealed value. If it is not revealed, the instruction fails with a "randomness not resolved" error.

Sometimes a trade on a live market is refused because the oracle is not sure. A user can lose some trades. But at least the protocol is not lost, when the oracle is wrong.
