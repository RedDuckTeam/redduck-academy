# Lending and borrowing on-chain

_type: lecture_

> A lending protocol lets users supply an ERC-20 token to a shared pool to earn yield, and lets others borrow from the same pool by posting collateral worth more than they borrow. The core shape has been stable since Compound v1 in 2018, a pool per asset, interest set by utilization, collateral priced by oracle, liquidations triggered when a position's collateral falls below a safety threshold. This lecture walks through each part of the system, how the parts connect, and where the design assumptions break.

## The supply side

A supplier deposits asset X into the protocol's pool for X. In return they get a receipt token, typically called aToken on Aave or cToken on Compound. The receipt represents their share of the pool plus all interest accrued since they deposited.

This is the ERC-4626 vault pattern with one specific yield source. The yield comes from borrowers paying interest. When a borrower repays, their interest payment goes into the pool. The pool grows. Every supplier's receipt-token-to-asset conversion rate grows accordingly.

A supplier can redeem their receipt tokens for the underlying asset at any time, with one caveat. There must be enough liquidity in the pool. If borrowers have taken out 95% of the pool's assets, a supplier who wants to withdraw 10% of the pool cannot, until either some of those borrowers repay or new supply arrives. This constraint is the central piece of the interest rate model.

## The borrow side

A borrower deposits collateral, then takes out a loan against it. The collateral is typically a different asset from the loan, for example deposit ETH as collateral and borrow USDC against it. Posting collateral and borrowing happen in the same contract, and the protocol tracks each user's collateral and debt positions in a single account.

The amount that can be borrowed is bounded by the Loan-to-Value ratio, abbreviated LTV. For ETH on Aave, the LTV might be 80%. With 1 ETH deposited as collateral while ETH trades at $3,000, a borrower can take out up to $2,400 worth of USDC.

The borrow position pays interest. On the supply side, interest accrues by holding an appreciating receipt token. On the borrow side, interest compounds the debt itself. A borrower who took out 2,400 USDC today owes 2,400 USDC plus accrued interest at any later time. The interest rate is set by the same mechanism that determines supplier yield.

A position has a health factor that measures distance from liquidation:

```
health = (collateral_value × liquidation_threshold) / debt_value
```

When `health >= 1`, the position is safe. When `health < 1`, the position is liquidatable. Anyone can step in to repay part of the borrower's debt in exchange for a share of the collateral at a discount.

The liquidation threshold sits slightly above the LTV. For ETH, the LTV might be 80% and the liquidation threshold 85%. That gap is the safety buffer. A user who borrows the maximum allowed cannot be liquidated immediately. The collateral value would have to fall by about 6% before they hit the liquidation threshold.

<svg viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"> <defs> <marker id="arrL1R" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto"> <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/> </marker> <marker id="arrL1G" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto"> <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/> </marker> </defs> <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/> <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A lending pool: suppliers feed in, borrowers take out against collateral</text> <!-- Suppliers box (left middle row) --> <rect x="40" y="200" width="170" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="125" y="232" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Suppliers</text> <text x="125" y="252" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">deposit USDC</text> <text x="125" y="266" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">earn yield</text> <!-- Pool box (center, taller) --> <rect x="275" y="150" width="170" height="210" fill="#e0deda" stroke="#ed4937" stroke-width="3"/> <rect x="275" y="150" width="170" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/> <text x="360" y="170" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">USDC pool</text> <text x="360" y="204" text-anchor="middle" font-family="monospace" font-size="10">totalSupply</text> <text x="360" y="220" text-anchor="middle" font-family="monospace" font-size="10">totalBorrows</text> <line x1="290" y1="298" x2="430" y2="298" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/> <text x="360" y="316" text-anchor="middle" font-family="monospace" font-size="10">interest rate</text> <text x="360" y="332" text-anchor="middle" font-family="monospace" font-size="10">reserve factor</text> <text x="360" y="352" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">smart contract</text> <!-- Borrowers box (right middle row) --> <rect x="510" y="200" width="170" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="595" y="232" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Borrowers</text> <text x="595" y="252" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">take USDC loan</text> <text x="595" y="266" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">pay interest</text> <!-- LEFT SIDE: Suppliers <-> Pool --> <!-- supply IN: arrow at y=240, label above at y=228 -->

<text x="242" y="228" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">supply</text> <line x1="212" y1="240" x2="272" y2="240" stroke="`#ed4937`" stroke-width="2" marker-end="url(#arrL1R)"/>

<!-- yield OUT: arrow at y=260, label below at y=278 --> <line x1="273" y1="260" x2="215" y2="260" stroke="#565653" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrL1G)"/> <text x="242" y="278" text-anchor="middle" font-family="monospace" font-size="10" font-style="italic" fill="#565653">yield</text> <!-- RIGHT SIDE: Pool <-> Borrowers --> <!-- borrow OUT: arrow at y=240, label above at y=228 -->

<text x="478" y="228" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">borrow</text> <line x1="448" y1="240" x2="508" y2="240" stroke="`#ed4937`" stroke-width="2" marker-end="url(#arrL1R)"/>

<!-- interest IN: arrow at y=260, label below at y=278 --> <line x1="509" y1="260" x2="451" y2="260" stroke="#565653" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrL1G)"/> <text x="478" y="278" text-anchor="middle" font-family="monospace" font-size="10" font-style="italic" fill="#565653">interest</text> <!-- Oracle box (bottom left) --> <rect x="40" y="410" width="170" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="125" y="432" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Price oracle</text> <text x="125" y="452" text-anchor="middle" font-family="monospace" font-size="10">ETH = $3,000</text> <text x="125" y="468" text-anchor="middle" font-family="monospace" font-size="10">USDC = $1.00</text> <text x="125" y="482" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">Chainlink feed</text> <!-- Collateral box (bottom right) --> <rect x="510" y="410" width="170" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/> <text x="595" y="432" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Collateral pool</text> <text x="595" y="452" text-anchor="middle" font-family="monospace" font-size="10">1 ETH per borrower</text> <text x="595" y="468" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">LTV: 80%</text> <text x="595" y="482" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">liq threshold: 85%</text> <!-- Oracle -> Pool arrow (diagonal, up and right) --> <!-- Oracle top edge at y=410, x=180. Pool bottom edge at y=360, x=290 --> <line x1="180" y1="410" x2="290" y2="362" stroke="#565653" stroke-width="1.5" marker-end="url(#arrL1G)"/> <!-- Label below the arrow at midpoint (235, 386), placed at y=405 (clearly below the line) --> <text x="270" y="405" text-anchor="middle" font-family="monospace" font-size="9" font-style="italic" fill="#565653">prices everything</text> <!-- Borrowers -> Collateral arrow (vertical) --> <!-- Borrowers bottom at y=280, Collateral top at y=410, x=595 --> <line x1="595" y1="282" x2="595" y2="408" stroke="#565653" stroke-width="1.5" marker-end="url(#arrL1G)"/> <!-- Label to the right of the arrow at midpoint y=345 --> <text x="605" y="349" font-family="monospace" font-size="9" font-style="italic" fill="#565653">deposits ETH</text> <!-- Caption -->

<text x="360" y="545" text-anchor="middle" font-family="monospace" font-size="11" fill="`#565653`" font-style="italic">Borrowers' interest funds suppliers' yield. The oracle prices everything.</text> </svg>

## The interest rate curve

The pool's interest rate is a function of utilization. Utilization is the fraction of the pool currently borrowed:

```
U = totalBorrows / totalSupply
```

At U=0, no one is borrowing. The pool is fully liquid. Suppliers can withdraw anything they want. Rates are low because there is no demand for borrows.

At U=1, everyone has borrowed. No supplier can withdraw. Rates spike because the protocol needs to either attract more supply or push some borrowers to repay.

The rate model captures this. The dominant model since Compound v1 is the kink model. From U=0 up to a kink point typically at U=80%, the rate grows linearly from a low base rate to an optimal rate of around 4%. From U=80% up to U=100%, the rate grows much more steeply, hitting 100% or higher at full utilization.

The kink point is where the model considers utilization healthy. Below the kink, rates are reasonable. Above the kink, the model penalizes borrowing aggressively and rewards new supply. The pool wants to stay below the kink. The steep curve above the kink is the protocol pushing participants to do something about the imbalance.

<svg viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The interest rate kink: gentle below 80% utilization, steep above</text>

<!-- Chart area -->
  <!-- Y axis -->
  <line x1="100" y1="100" x2="100" y2="370" stroke="#000000" stroke-width="1.5"/>
  <!-- X axis -->
  <line x1="100" y1="370" x2="640" y2="370" stroke="#000000" stroke-width="1.5"/>

<!-- Y axis labels -->
  <text x="92" y="374" text-anchor="end" font-family="monospace" font-size="9">0%</text>
  <text x="92" y="320" text-anchor="end" font-family="monospace" font-size="9">25%</text>
  <line x1="98" y1="317" x2="102" y2="317" stroke="#000000" stroke-width="1"/>
  <text x="92" y="265" text-anchor="end" font-family="monospace" font-size="9">50%</text>
  <line x1="98" y1="262" x2="102" y2="262" stroke="#000000" stroke-width="1"/>
  <text x="92" y="210" text-anchor="end" font-family="monospace" font-size="9">75%</text>
  <line x1="98" y1="207" x2="102" y2="207" stroke="#000000" stroke-width="1"/>
  <text x="92" y="155" text-anchor="end" font-family="monospace" font-size="9">100%</text>
  <line x1="98" y1="152" x2="102" y2="152" stroke="#000000" stroke-width="1"/>

<text x="50" y="235" text-anchor="middle" font-family="monospace" font-size="11" transform="rotate(-90, 50, 235)">borrow rate (APR)</text>

<!-- X axis labels -->
  <text x="100" y="385" text-anchor="middle" font-family="monospace" font-size="9">0%</text>
  <text x="208" y="385" text-anchor="middle" font-family="monospace" font-size="9">20%</text>
  <line x1="208" y1="367" x2="208" y2="373" stroke="#000000" stroke-width="1"/>
  <text x="316" y="385" text-anchor="middle" font-family="monospace" font-size="9">40%</text>
  <line x1="316" y1="367" x2="316" y2="373" stroke="#000000" stroke-width="1"/>
  <text x="424" y="385" text-anchor="middle" font-family="monospace" font-size="9">60%</text>
  <line x1="424" y1="367" x2="424" y2="373" stroke="#000000" stroke-width="1"/>
  <text x="532" y="385" text-anchor="middle" font-family="monospace" font-size="9">80%</text>
  <line x1="532" y1="367" x2="532" y2="373" stroke="#000000" stroke-width="1"/>
  <text x="640" y="385" text-anchor="middle" font-family="monospace" font-size="9">100%</text>

<text x="370" y="408" text-anchor="middle" font-family="monospace" font-size="11">utilization  =  totalBorrows / totalSupply</text>

<!-- Vertical kink line -->
  <line x1="532" y1="100" x2="532" y2="370" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="532" y="92" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">kink at 80%</text>

<!-- Rate curve: linear from (100, 363) [0%, 1% base] to (532, 353) [80%, 4%], then steep to (640, 152) [100%, ~100%]
       Mapping: y=370 at 0% rate, y=152 at 100% rate. So 1 percentage point = 218/100 = 2.18 px
       At 0%: 1% rate = 370 - 2.18 = 367.82 ~ 368
       At 80%: 4% rate = 370 - 4*2.18 = 370 - 8.72 = 361.28 ~ 361
       At 100%: ~100% rate ~ 152 -->
  <line x1="100" y1="368" x2="532" y2="361" stroke="#ed4937" stroke-width="2.5"/>
  <line x1="532" y1="361" x2="640" y2="152" stroke="#ed4937" stroke-width="2.5"/>

<!-- Annotation points -->
  <circle cx="100" cy="368" r="4" fill="#ed4937"/>
  <text x="115" y="362" font-family="monospace" font-size="9" fill="#565653">base rate (~1%)</text>

<circle cx="532" cy="361" r="4" fill="#ed4937"/>
  <text x="450" y="350" font-family="monospace" font-size="10" font-weight="bold">optimal: 4%</text>

<circle cx="640" cy="152" r="4" fill="#ed4937"/>
  <text x="615" y="140" text-anchor="end" font-family="monospace" font-size="10" font-weight="bold">~100% at full utilization</text>

<!-- Annotation: gentle zone -->
  <text x="316" y="445" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">"healthy" zone: borrowing is affordable</text>

<!-- Annotation: steep zone -->
  <text x="586" y="445" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-style="italic">"distress" zone: protocol pushes</text>
  <text x="586" y="459" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-style="italic">borrowers to repay, suppliers to deposit</text>
</svg>

The supply rate falls out of the borrow rate. It equals the borrow rate times the utilization times one minus the reserve factor:

```
supplyRate = borrowRate × utilization × (1 − reserveFactor)
```

The reserve factor, typically between 10% and 25%, is the protocol's cut. It builds a treasury that can cover bad debt or pay out to governance.

So if `borrowRate` is 5%, utilization is 80%, and `reserveFactor` is 10%, the supply rate is:

```
5% × 0.80 × 0.9 = 3.6%
```

Suppliers always earn less than borrowers pay. The spread is utilization-dependent and absorbs the reserve factor.

## Liquidations

When a position's health factor drops below 1, anyone can liquidate it. The liquidate function takes the borrower's address and an amount of debt to repay. The liquidator transfers that amount of the debt asset into the protocol, and the protocol transfers a corresponding amount of the borrower's collateral, at a discounted price, to the liquidator.

The discount is the liquidation bonus. For ETH on Aave it sits around 5% to 10%, depending on the asset's volatility. For more volatile assets, the bonus is higher. The size of the bonus reflects the risk the liquidator takes by holding the seized collateral until they can sell it on the open market.

Most protocols cap each individual liquidation at 50% of the position's debt. This is the close factor. A single liquidation never fully wipes out a borrower's position, only the part needed to push the health factor back above 1. If the price keeps falling after one liquidation, another liquidator can step in for the next 50%, and so on.

<svg viewBox="0 0 720 660" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <defs>
    <marker id="arrL3" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>

<rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A liquidation: price drops, health crosses 1, a third party closes part of the position</text>

<!-- Step 1: Bob's healthy position -->
  <rect x="40" y="80" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="102" font-family="monospace" font-size="11" font-weight="bold">Step 1.  Bob's position at ETH = $3,000</text>
  <text x="60" y="123" font-family="monospace" font-size="10">  collateral:  1 ETH ($3,000)        debt:  2,500 USDC</text>
  <text x="60" y="139" font-family="monospace" font-size="10">  liquidation threshold:  85%</text>
  <text x="60" y="153" font-family="monospace" font-size="10" font-weight="bold">  health = (3000 × 0.85) / 2500 = 1.02   ← safe, but borderline</text>

<!-- arrow -->
  <line x1="360" y1="170" x2="360" y2="184" stroke="#ed4937" stroke-width="2" marker-end="url(#arrL3)"/>

<!-- Step 2: Price drops, becomes liquidatable -->
  <rect x="40" y="190" width="640" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="212" font-family="monospace" font-size="11" font-weight="bold">Step 2.  ETH price falls 2% to $2,940</text>
  <text x="60" y="233" font-family="monospace" font-size="10">  collateral value:  $2,940           debt:  2,500 USDC</text>
  <text x="60" y="249" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">  health = (2940 × 0.85) / 2500 = 0.9996   ← under 1, liquidatable</text>
  <text x="60" y="263" font-family="monospace" font-size="9" fill="#565653" font-style="italic">  anyone can now call liquidate(bob, ...) and capture the liquidation bonus</text>

<!-- arrow -->
  <line x1="360" y1="280" x2="360" y2="294" stroke="#ed4937" stroke-width="2" marker-end="url(#arrL3)"/>

<!-- Step 3: liquidator acts -->
  <rect x="40" y="300" width="640" height="124" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="322" font-family="monospace" font-size="11" font-weight="bold">Step 3.  A liquidator calls liquidate(bob, USDC, 1250)</text>
  <text x="60" y="343" font-family="monospace" font-size="10">  liquidator transfers:  1,250 USDC  to the protocol (repays half of Bob's debt)</text>
  <text x="60" y="359" font-family="monospace" font-size="10">  protocol transfers:    1,250 USDC × 1.05 = $1,312.50 worth of ETH</text>
  <text x="60" y="375" font-family="monospace" font-size="10">                         at $2,940/ETH = 0.4465 ETH  to the liquidator</text>
  <line x1="60" y1="383" x2="680" y2="383" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="402" font-family="monospace" font-size="10" font-weight="bold">  liquidator profit:  $1,312.50 − $1,250 = $62.50 (the 5% liquidation bonus)</text>
  <text x="60" y="416" font-family="monospace" font-size="9" fill="#565653" font-style="italic">  the bonus pays the liquidator for their gas, capital risk, and the act of closing the position</text>

<!-- arrow -->
  <line x1="360" y1="434" x2="360" y2="448" stroke="#ed4937" stroke-width="2" marker-end="url(#arrL3)"/>

<!-- Step 4: After -->
  <rect x="40" y="454" width="640" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="476" font-family="monospace" font-size="11" font-weight="bold">Step 4.  Bob's position after the liquidation</text>
  <text x="60" y="497" font-family="monospace" font-size="10">  collateral:  0.5535 ETH ($1,627)    debt:  1,250 USDC</text>
  <text x="60" y="513" font-family="monospace" font-size="10" font-weight="bold">  health = (1627 × 0.85) / 1250 = 1.11   ← back above 1, safe again</text>
  <text x="60" y="527" font-family="monospace" font-size="9" fill="#565653" font-style="italic">  Bob is still in the system but smaller. If ETH keeps falling, he can be liquidated again.</text>
  <text x="60" y="541" font-family="monospace" font-size="9" fill="#565653" font-style="italic">  In stressed markets, large positions get liquidated in successive waves.</text>

<!-- Bottom summary -->
  <rect x="40" y="580" width="640" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="598" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Bob lost ~$63 of value to the liquidator. The protocol stays solvent.</text>
  <text x="360" y="612" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">Without liquidations, falling prices would leave the protocol with debt larger than collateral (bad debt).</text>
</svg>

## The oracle dependency

Every collateral and debt asset needs a price oracle. The protocol reads oracle prices to compute collateral value when a borrower opens a position, to compute the health factor of every open position, and to determine how much collateral the liquidator receives for a given amount of debt repaid.

If the oracle is wrong, the protocol is wrong. Two specific failure modes follow from this.

**Oracle reports a price too high.** Borrowers take out more debt than their collateral is worth. When the price corrects downward, those positions are underwater, with debt larger than collateral. Liquidators will not touch them, because the math no longer works out. The collateral they would receive is worth less than the debt they would have to repay. The protocol absorbs the loss as bad debt.

**Oracle reports a price too low.** Healthy positions are marked as liquidatable. Liquidators rush in and seize collateral from positions that, by true market prices, should never have been liquidated. The borrower loses collateral they should not have lost.

This is the central reason every production lending protocol uses Chainlink price feeds rather than reading prices off a single AMM pool. A single AMM pool's spot price can be moved within one transaction by a sufficiently large swap or flash loan. The flash loans lecture covered the attack walkthrough end to end. Chainlink aggregates many off-chain price sources and updates only after the aggregated price moves beyond a threshold, making single-transaction manipulation infeasible.

Some protocols use multiple oracles for the same asset and cross-check. If two sources diverge by more than a threshold, the protocol pauses operations on that asset until the divergence resolves. This costs availability but prevents bad debt during oracle outages.

## How lending designs differ

The "pool per asset" design described above is the original Compound V2 / Aave V2 shape. Several variants have emerged.

**Isolated lending markets.** Compound V3 and Morpho Blue are the main examples. Instead of one global pool per asset, each lending market is a separate contract pairing one collateral asset with one borrow asset. ETH/USDC, wBTC/USDC, stETH/ETH, each its own market. Asset failure stays contained. A bug or oracle problem in one market does not affect others. The tradeoff is fragmented liquidity, since suppliers must choose specific markets rather than the protocol allocating their deposit across all opportunities.

**Curated vaults built on top of isolated markets.** Morpho Vaults, MetaMorpho, and Yearn V3 are examples. Suppliers deposit into a vault, and a curator allocates the vault's deposits across multiple isolated markets, rebalancing as rates change and pulling out of markets that show signs of risk. The supplier gets diversification and active management without managing positions directly. The curator can be an EOA, a multisig, or a smart contract executing rules.

**Cross-collateral pools with finer-grained controls.** Aave V3, Spark, and Radiant are examples. The original Compound model evolved. Each asset has its own LTV and liquidation threshold, plus per-asset borrow caps and supply caps. Isolation mode lets the protocol mark certain risky assets as collateral that can only back stablecoin borrows, never other volatile assets. This contains tail risk without splitting into separate markets.

Each design optimizes for a different tradeoff. Pooled designs are simplest and most capital-efficient. Isolated designs are safest against asset-specific failures. Curated vaults split the difference, giving suppliers a familiar deposit-once experience while operating on top of safer underlying markets.

## What can go wrong in practice

Six failure modes worth knowing.

**Oracle manipulation.** Covered above. The defense is well-designed oracles, primarily Chainlink with staleness checks and multi-source aggregation.

**Liquidation cascades.** In stressed markets, a price drop liquidates the first set of positions. Liquidators seize collateral and sell it on the open market to lock in their profit. Those sales push the price further down. More positions become liquidatable. The cycle continues until the market stabilizes or the protocol runs out of liquidatable collateral. This pattern hit several lending protocols during the May 2022 Terra/Luna collapse, the March 2023 USDC depeg, and the August 2024 yen carry trade unwinds.

**Interest rate spikes leaving suppliers stuck.** When utilization hits 100%, the rate goes through the roof, but there is no liquidity to withdraw. Suppliers earn high paper yields they cannot realize, until borrowers repay or new supply arrives. During DeFi panic moments, large suppliers withdrawing at once can drive a healthy pool to 100% utilization within minutes.

**Bad debt.** Positions whose collateral has fallen below the debt value. No liquidator will touch them, since the math is upside down. The protocol either eats the loss, drawing from its reserve, or socializes it across suppliers, where everyone takes a haircut. Major bad-debt events have hit Mango Markets in October 2022, Inverse Finance in April 2022, and Euler V1 in March 2023.

**Smart contract bugs.** Lending protocols hold huge balances and have complex math. Both factors have contributed to exploits. Cream Finance, Euler V1, and others have lost nine-figure sums to bugs in liquidation logic, accounting math, or flash-loan-mediated reentry.

**Bridge or wrapped-asset risk.** Many lending markets accept wrapped versions of cross-chain assets, like wBTC on Ethereum or USDC.e on L2s. The wrapper is only as safe as the bridge. If the bridge gets exploited, the wrapped asset depegs from the underlying, and any lending market holding it as collateral has bad debt overnight.

## Reading a real lending position

To make the mechanics concrete, here is what a borrower's state looks like at any moment in a pooled lending protocol. The state is spread across several mappings.

```solidity
// Solidity 0.8.20, Ethereum mainnet
// Conceptual layout. Real code uses packed structs and indexed math.

mapping(address user => mapping(address asset => uint256)) public collateralBalance;
mapping(address user => mapping(address asset => uint256)) public debtBalance;
mapping(address asset => uint256) public assetLTV;            // 0-10000 (bps)
mapping(address asset => uint256) public assetLiqThreshold;   // 0-10000 (bps)
```

The health factor view function aggregates the above:

```solidity
function getHealthFactor(address user) external view returns (uint256) {
    uint256 weightedCollateral;
    uint256 totalDebt;

    for (uint256 i = 0; i < userCollateralAssets[user].length; i++) {
        address asset = userCollateralAssets[user][i];
        uint256 balance = collateralBalance[user][asset];
        uint256 price = oracle.getPrice(asset);
        weightedCollateral += balance * price * assetLiqThreshold[asset] / 10000;
    }

    for (uint256 i = 0; i < userDebtAssets[user].length; i++) {
        address asset = userDebtAssets[user][i];
        uint256 balance = debtBalance[user][asset];
        uint256 price = oracle.getPrice(asset);
        totalDebt += balance * price;
    }

    if (totalDebt == 0) return type(uint256).max;
    return (weightedCollateral * 1e18) / totalDebt;
}
```

Three things to notice. The function loops over the user's collateral and debt assets. The loop is bounded by the number of distinct assets the user has positions in, which is typically small, one or two per side. The loop is fine.

The oracle gets called once per asset, every time anyone checks a health factor. The oracle's read cost matters, both for liquidation checks and for borrow-time LTV checks.

The health factor formula uses the liquidation threshold for each collateral asset. The LTV controls how much can be borrowed at the moment a position opens. The liquidation threshold controls when liquidation triggers. The two are different numbers on purpose. The gap between them is the buffer.

Production code is more complex than the above. Real Aave V3 caches indexed rate math, packs storage for gas, and handles bridged assets specially. The conceptual shape stays the same.
