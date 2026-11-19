---
id: 177
title: Keepers and Chainlink Automation
type: lecture
order: 5
faq:
  - question: Why does performUpkeep have to re-check what checkUpkeep already confirmed?
    answer: >-
      It is two or three blocks stale by the time a keeper node lands the transaction. Re-read
      the data and revert if the condition has cleared.
  - question: How do I stop anyone from calling performUpkeep?
    answer: >-
      Lock it to the forwarder. Registration produces a unique forwarder address, the only
      sender Chainlink Automation uses. Set it after deployment through an owner-guarded
      setter.
  - question: What happens when my upkeep runs out of LINK?
    answer: >-
      It stops. No revert, no warning, the network just stops triggering it.
  - question: Do I always have to write checkUpkeep?
    answer: >-
      Only for condition-based work. A time-based upkeep takes a cron schedule and a target
      function. A log trigger uses checkLog instead, receiving the matching event.
---

## A contract cannot start itself

Nothing inside a contract ever runs on its own. Every state change traces back to some externally owned account, or another contract, sending a transaction that calls in. This is fine when a user supplies both the intent and the gas: a swap happens because a trader submitted it. The problem shows up the moment a contract's correct behavior depends on something happening without a user present to make it happen. A lending protocol needs undercollateralized positions liquidated the instant their health factor (collateral value times a safety threshold, divided by the debt) drops below 1, and no borrower is going to liquidate themselves. A yield vault needs to harvest and recompound rewards on a regular cadence to stay competitive. In both cases the contract knows what should happen and can check whether the condition is met, but someone, the executor, has to send the transaction.

Before you look for that someone, check whether the work has to happen on its own at all. A vesting contract needs no monthly release transaction, because it can compute how much has vested at the moment the beneficiary claims. An executor is needed only for work that cannot wait until someone who wants the result calls the contract.

## Your own bot and a paid open call both fall short

The first instinct of most developers coming from web2 is to run a bot, also called a keeper. Spin up a server, poll the chain every block, and when the condition is met, sign and send the transaction from a hot wallet.

The bot is a single point of failure. The work stops when your server goes down or the hot wallet runs out of ETH for gas, and if the machine is compromised, the attacker has a funded key. You have reintroduced the centralized, trusted operator that the contract was supposed to do without.

The second instinct is to make the work permissionless and let economics handle it. Anyone can call `liquidate()`, and the caller takes a cut of the seized collateral. This works when the task carries a built-in profit. Liquidations get done because liquidators race for the bonus, around 5% to 10% for ETH on Aave (more in the [lending lesson](/courses/development-on-ethereum/advanced-defi/lending-and-borrowing-on-chain)). The same logic drives arbitrage and the closing of expired options.

It falls apart for any task that has no natural payout. Nobody will pay gas to call your vault's `harvest()` out of goodwill. You can add a reward yourself, for example a share of the harvest for whoever calls it. Then you have to price it: a reward that does not cover the caller's gas attracts nobody, and everything above that is overpaid on every call. Someone also has to write and run a bot for your contract before any reward is claimed.

A keeper network sells this as a service. Its nodes are already running, and they send your transaction for the gas plus a premium. You pay for every call in both designs. With the network you do not have to price a reward or wait for bots. In exchange you depend on the network and on keeping your balance with it funded. Chainlink Automation is such a network.

## Automation checks off-chain and executes on-chain

Automation, called Chainlink Keepers until its 2022 rename, is a network of independent nodes that monitor upkeeps (jobs registered with the network) and execute them on-chain when they are due. No single node decides whether your function runs, and the network is paid in LINK to cover gas plus a premium.

The custom-logic integration rests on a two-function interface your contract implements.

```solidity
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData)
        external
        returns (bool upkeepNeeded, bytes memory performData);

    function performUpkeep(bytes calldata performData) external;
}
```

`checkUpkeep` answers one question: is there work to do right now. The Automation nodes call it off-chain, as a simulation, on every block. Because the call never lands in a block, it costs no gas and changes no state. You can read as much as you need inside it. It returns a boolean and an optional `performData` blob that gets handed to the execution step.

`performUpkeep` does the actual work. When `checkUpkeep` returns true, a node packages a real transaction that calls `performUpkeep` on-chain, pays the gas, and the work happens. This is the only part that touches the chain and the only part you pay for.

<svg role="img" viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Chainlink Automation cycle: off-chain checkUpkeep to on-chain performUpkeep</title><desc>The Automation node network calls checkUpkeep() on your contract off-chain, for free, on every block. When it returns true, the Registry and Forwarder send a real transaction that calls performUpkeep(), paid from the LINK balance.</desc>
  <defs>
    <marker id="arrK1R" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
    <marker id="arrK1G" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The Automation cycle: check off-chain every block, execute on-chain when needed</text>

<!-- Zone labels -->
  <text x="40" y="90" font-family="monospace" font-size="11" font-weight="bold" fill="#565653">OFF-CHAIN  (simulated, no gas, runs constantly)</text>

<!-- Automation network box -->
  <rect x="40" y="105" width="190" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="135" y="135" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Automation</text>
  <text x="135" y="151" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">node network</text>
  <text x="135" y="171" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">decentralized keepers</text>

<!-- checkUpkeep box -->
  <rect x="430" y="105" width="250" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="555" y="133" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">checkUpkeep()</text>
  <text x="555" y="152" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">your contract, view only</text>
  <text x="555" y="168" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">"is there work to do?"</text>

<!-- poll arrow: network -> checkUpkeep -->
  <text x="330" y="130" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">simulate</text>
  <line x1="230" y1="138" x2="428" y2="138" stroke="#565653" stroke-width="2" marker-end="url(#arrK1G)"/>
  <text x="330" y="178" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">every block</text>

<!-- return arrow: checkUpkeep -> network (false) -->
  <line x1="428" y1="160" x2="232" y2="160" stroke="#565653" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrK1G)"/>
  <text x="330" y="156" text-anchor="middle" font-family="monospace" font-size="9" font-style="italic" fill="#565653">mostly false</text>

<!-- Divider -->
  <line x1="20" y1="240" x2="700" y2="240" stroke="#565653" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="360" y="232" text-anchor="middle" font-family="monospace" font-size="10" font-style="italic" fill="#565653">when checkUpkeep returns true, a real transaction crosses to chain</text>

<!-- Trigger arrow crossing the divider -->
  <line x1="135" y1="186" x2="135" y2="300" stroke="#ed4937" stroke-width="2.5" marker-end="url(#arrK1R)"/>
  <text x="145" y="265" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">upkeepNeeded</text>
  <text x="145" y="280" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">== true</text>

<!-- Zone label -->
  <text x="40" y="335" font-family="monospace" font-size="11" font-weight="bold" fill="#565653">ON-CHAIN  (a real transaction, costs gas, paid in LINK)</text>

<!-- Registry box -->
  <rect x="40" y="350" width="190" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="135" y="380" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Registry +</text>
  <text x="135" y="396" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Forwarder</text>
  <text x="135" y="416" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">sends the tx, pays gas</text>

<!-- performUpkeep box -->
  <rect x="430" y="350" width="250" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="555" y="378" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">performUpkeep()</text>
  <text x="555" y="397" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">your contract, does the work</text>
  <text x="555" y="413" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">re-checks, then acts</text>

<!-- call arrow: registry -> performUpkeep -->
  <text x="330" y="380" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">calls</text>
  <line x1="230" y1="390" x2="428" y2="390" stroke="#ed4937" stroke-width="2" marker-end="url(#arrK1R)"/>
  <text x="330" y="410" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">with performData</text>

<!-- LINK funding box -->
  <rect x="270" y="465" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="486" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">LINK balance</text>
  <text x="360" y="502" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">funds the upkeep</text>

<line x1="270" y1="480" x2="232" y2="432" stroke="#565653" stroke-width="1.5" marker-end="url(#arrK1G)"/>

<text x="360" y="545" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The off-chain check is free and constant. Only performUpkeep touches the chain and costs gas.</text>
</svg>

Automation has two other trigger types: a time-based trigger runs a target function on a schedule given as a cron expression, with no `checkUpkeep` at all, and a log trigger fires when a specific event log is emitted on-chain and uses `checkLog` instead of `checkUpkeep`. The rest of this lesson stays with custom logic.

## A stop-loss order as an upkeep

Here is a contract that sells a held asset when its price drops below a floor. It reads a Chainlink price feed, the same `latestRoundData` and staleness check from the [oracle lesson](/courses/development-on-ethereum/oracles/oracles-and-chainlink-price-feeds), and it uses Automation to fire the sale automatically. The listing shows the state and the two Automation functions. The constructor, the error declarations, the owner-guarded setter for `forwarder`, and the sale itself are left out.

```solidity
contract StopLoss is AutomationCompatibleInterface {
    AggregatorV3Interface public immutable priceFeed;
    int256 public immutable floorPrice;   // e.g. 1800 * 1e8 for an 8-decimal feed
    address public forwarder;             // assigned after the upkeep is registered
    bool public triggered;

    // Simulated off-chain by the nodes on every block. Never mined.
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        if (triggered) return (false, "");
        (, int256 price,, uint256 updatedAt,) = priceFeed.latestRoundData();
        bool fresh = block.timestamp - updatedAt < 1 hours + 10 minutes;
        upkeepNeeded = fresh && price > 0 && price < floorPrice;
    }

    // Mined on-chain by the forwarder when checkUpkeep returned true.
    function performUpkeep(bytes calldata) external override {
        if (msg.sender != forwarder) revert NotForwarder();

        (, int256 price,, uint256 updatedAt,) = priceFeed.latestRoundData();
        if (block.timestamp - updatedAt >= 1 hours + 10 minutes) revert PriceStale();
        if (triggered || price <= 0 || price >= floorPrice) revert ConditionNotMet();

        triggered = true;
        _executeSell();   // swap the held asset against a DEX router, omitted here
    }
}
```

`checkUpkeep` is marked `view`. It reads the feed, checks freshness, and reports whether the price has fallen below the floor. The Automation contracts also offer a `cannotExecute` modifier you can add to guarantee the function reverts if anyone tries to call it in a real transaction, since it is meant for simulation only.

## The check is a few blocks old when the transaction lands

`performUpkeep` re-reads the price and checks the condition from scratch, reverting if the price is stale or has climbed back above the floor. It has to, because `checkUpkeep` runs off-chain at block N. By the time a node builds the transaction, broadcasts it, and it lands in a block, two or three blocks have passed, and the price may have moved in between. If `performUpkeep` trusted the stale decision, it would sell at a price the user never agreed to, after the stop-loss condition had already cleared. So in every Automation integration, treat `checkUpkeep` as a cheap filter that tells the network when to bother sending a transaction, and treat `performUpkeep` as the authority that re-establishes every precondition before doing anything irreversible.

<svg role="img" viewBox="0 0 720 520" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>checkUpkeep vs performUpkeep timeline: price moves $1,790 to $1,815</title><desc>A timeline shows checkUpkeep running off-chain at block N, where the price is $1,790 and below $1,800, so it returns true. By the time performUpkeep runs on-chain at block N+2, the price has moved to $1,815, back above $1,800: trusting the stale true value sells at the wrong price (a bug), while re-reading the price reverts safely because the condition is now false.</desc>
  <defs>
    <marker id="arrK2R" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
    <marker id="arrK2G" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>

<rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The gap: state can change between the check and the execution</text>

<!-- Timeline axis -->
  <line x1="80" y1="160" x2="660" y2="160" stroke="#000000" stroke-width="1.5"/>
  <text x="660" y="150" text-anchor="end" font-family="monospace" font-size="9" fill="#565653">time</text>

<!-- Block N marker -->
  <line x1="160" y1="150" x2="160" y2="170" stroke="#000000" stroke-width="1.5"/>
  <text x="160" y="185" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">block N</text>

<!-- Block N+2 marker -->
  <line x1="540" y1="150" x2="540" y2="170" stroke="#000000" stroke-width="1.5"/>
  <text x="540" y="185" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">block N+2</text>

<!-- The gap span -->
  <line x1="170" y1="125" x2="530" y2="125" stroke="#ed4937" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="170" y1="120" x2="170" y2="130" stroke="#ed4937" stroke-width="1.5"/>
  <line x1="530" y1="120" x2="530" y2="130" stroke="#ed4937" stroke-width="1.5"/>
  <text x="350" y="115" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">the node builds and mines the tx: a few blocks pass</text>

<!-- checkUpkeep box at block N -->
  <rect x="60" y="210" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="160" y="234" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">checkUpkeep (off-chain)</text>
  <text x="160" y="256" text-anchor="middle" font-family="monospace" font-size="10">price = $1,790</text>
  <text x="160" y="274" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">below $1,800 → true</text>

<line x1="160" y1="170" x2="160" y2="208" stroke="#565653" stroke-width="1.5" marker-end="url(#arrK2G)"/>

<!-- performUpkeep box at block N+2 -->
  <rect x="440" y="210" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="234" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">performUpkeep (on-chain)</text>
  <text x="540" y="256" text-anchor="middle" font-family="monospace" font-size="10">price = $1,815</text>
  <text x="540" y="274" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">back above $1,800</text>

<line x1="540" y1="170" x2="540" y2="208" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrK2R)"/>

<!-- Two outcome branches --> <!-- Bad outcome -->
  <rect x="60" y="345" width="280" height="90" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="200" y="368" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">if it trusts the stale "true"</text>
  <line x1="75" y1="378" x2="325" y2="378" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="200" y="396" text-anchor="middle" font-family="monospace" font-size="9">sells at $1,815, not $1,790</text>
  <text x="200" y="412" text-anchor="middle" font-family="monospace" font-size="9">the trigger condition is gone</text>
  <text x="200" y="428" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">wrong execution, a real bug</text>

<line x1="500" y1="292" x2="260" y2="343" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrK2R)"/>

<!-- Good outcome -->
  <rect x="380" y="345" width="280" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="520" y="368" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">if it re-reads the price</text>
  <line x1="395" y1="378" x2="645" y2="378" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="520" y="396" text-anchor="middle" font-family="monospace" font-size="9">sees $1,815, condition false</text>
  <text x="520" y="412" text-anchor="middle" font-family="monospace" font-size="9">reverts or returns early</text>
  <text x="520" y="428" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">no bad trade, safe</text>

<line x1="560" y1="292" x2="540" y2="343" stroke="#565653" stroke-width="1.5" marker-end="url(#arrK2G)"/>

<text x="360" y="475" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">performUpkeep must re-validate the condition. The off-chain "true" is a hint, never a guarantee.</text>
</svg>

## The result must not depend on the caller

`performUpkeep` is a public function. By default, any address can call it, including ones that have nothing to do with the Automation network. The re-check is the first defense against them. A stranger who calls the function early gets a revert and wastes their own gas, and a stranger who calls it when the condition holds does the work you wanted done. If the result is the same whoever calls, the function can stay open, and the Automation network is one executor among several.

The result does depend on the caller when the caller chooses something the function trusts. The usual case is `performData`: `checkUpkeep` computes off-chain which items to process, and whoever calls `performUpkeep` directly passes a blob of their own. The function should re-check every item it is handed.

Where a caller can still gain by choosing the moment or the data, Automation gives you a second lock, the forwarder. When you register an upkeep, the registry generates a unique forwarder address for it, and that address is the only one the network uses to call your `performUpkeep`. Once you know it, restrict the function to `msg.sender == forwarder`, as the stop-loss does. Do not hardcode the forwarder in the constructor. You do not know its address until after registration, which happens after deployment. Set it afterward through an owner-guarded setter.

The lock makes the function depend on one executor. The stop-loss re-checks everything and ignores `performData`, so it would do the right thing for any caller. With the lock, if the network stops running the upkeep, nobody else can execute the sale, and the owner has to point `forwarder` at an address they control and call `performUpkeep` by hand. When you add the forwarder check, decide in advance who executes if the network does not.

## An upkeep can stop without the contract noticing

An upkeep is paid in LINK. You deposit a LINK balance when you register it, and the network deducts from that balance each time it runs `performUpkeep`, covering the gas plus a premium that pays the node. When the LINK balance is depleted, the upkeep stops being executed. Nothing reverts and nothing warns the contract, so the sale or liquidation it was supposed to trigger quietly fails to happen. Monitoring the balance and topping it up is operational work you own.

The other limit to plan for is gas. Each upkeep has a configured gas limit for `performUpkeep`. If your execution exceeds it, the transaction reverts and the work does not get done. This makes unbounded loops especially dangerous here, because the loop might fit under the limit in a test with three items and blow past it in production with three thousand. Cap the work per execution, or use `performData` to tell `performUpkeep` which items to process, computed during the free off-chain check. `checkUpkeep` runs off-chain and costs nothing to simulate, within the node's generous limits, so it is the right place for heavy reads and iteration. `performUpkeep` costs real gas and runs under a hard limit, so keep it lean.

Automation is also best-effort: it fires soon after the condition is met, usually within a block or two. Anything that needs sub-block precision or guaranteed execution in a specific block should not depend on it.

For every job in your protocol that has to run without a user asking, answer four questions. Can the result be computed later, when someone asks for it? If not, who is paid to send the transaction? Is the result the same whoever sends it? And who sends it if the network you pay stops?
