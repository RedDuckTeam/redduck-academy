---
id: 177
title: Keepers and Chainlink Automation
type: lecture
order: 5
faq:
  - question: How can a smart contract run something on a schedule when it has no
      clock or background thread?
    answer: It cannot do this on its own. A contract only ever runs when an external
      account or another contract sends it a transaction, so tasks like
      liquidations, vesting releases, or limit orders need someone to push the
      button. Chainlink Automation solves this with a decentralized network of
      nodes that watch your registered task and send the transaction to trigger
      it when the condition is met, charging you in LINK for the gas plus a
      premium.
  - question: Why does performUpkeep have to re-check the condition if checkUpkeep
      already verified it?
    answer: checkUpkeep runs off-chain and its result is only a hint rather than a guarantee. By
      the time a node builds and mines the performUpkeep transaction, two or
      three blocks have passed and prices or balances may have changed. If
      performUpkeep trusted the stale result, it could act on a condition that
      has already cleared, so it must re-read the data and revert if the
      condition is no longer true.
  - question: How do I stop random accounts from calling my performUpkeep function?
    answer: By default performUpkeep is public, so anyone could call it. When you
      register an upkeep, the registry generates a unique forwarder address, and
      that is the only address the network uses to trigger your function. You
      should store that address after registration (not in the constructor,
      since you do not know it yet) and require msg.sender to equal the
      forwarder inside performUpkeep.
  - question: What happens if my Chainlink Automation upkeep runs out of LINK?
    answer: It simply stops running. The network deducts LINK from your upkeep's
      balance each time it executes, and when that balance hits zero the task
      quietly stops being triggered, with no warning or revert from your
      contract. That means critical jobs like liquidations can silently fail, so
      monitoring the balance and topping it up is operational work you have to
      own.
---

## The passivity problem

A contract has no clock, no scheduler, and no background thread. Nothing inside it ever runs on its own. Every state change traces back to some externally owned account, or another contract, sending a transaction that calls in. Between transactions the contract is inert. It does not poll, it does not wake on a timer, it does not react to the passage of time except by reading `block.timestamp` when something else calls it.

This is fine for a lot of contracts. An ERC-20 transfer happens because someone asked for it. A swap happens because a trader submitted it. The user supplies both the intent and the gas.

The problem shows up the moment a contract's correct behavior depends on something happening without a user present to make it happen. A few examples that come up constantly:

A lending protocol needs undercollateralized positions liquidated the instant their health factor drops below 1. No borrower is going to liquidate themselves.

A vesting contract needs to release the next tranche of tokens on a schedule, every month, whether or not the beneficiary remembers to claim.

A limit order needs to execute the moment the price crosses a threshold, which might be at 3am when nobody is watching.

A yield vault needs to harvest and recompound rewards on a regular cadence to stay competitive.

In every case the contract knows what should happen and can check whether the condition is met. What it cannot do is trigger itself. Someone has to send the transaction.

## The naive fixes and where they break

The first instinct of most developers coming from web2 is to run a bot. Spin up a server, poll the chain every block, and when the condition is met, sign and send the transaction from a hot wallet. This works in a demo and fails in production for predictable reasons.

The bot is a single point of failure. If your server goes down, your dead-man's switch dies with it. If the hot wallet runs out of ETH for gas, every upkeep stalls. If the machine is compromised, the attacker has a funded key. You have reintroduced exactly the centralized, trusted operator that the contract was supposed to do without. For a protocol that markets itself as decentralized, a critical function gated behind one team's cron job is a contradiction users will eventually notice.

The second instinct is to make the work permissionless and let economics handle it. Anyone can call `liquidate()`, and the caller takes a cut of the seized collateral. This is the pattern the lending lecture covered, and it works beautifully when the task carries a built-in profit. Liquidations get done because liquidators race for the bonus. The same logic drives arbitrage and the closing of expired options.

It falls apart for any task that has no natural payout. Nobody will pay gas to call your vault's `harvest()` out of goodwill. Nobody will spend money to advance a vesting schedule that benefits someone else. You can try to bolt on an artificial reward, but now you are paying a bounty on every call and inviting people to game the timing. For unprofitable maintenance work, the incentivized-caller model has no one to incentivize.

What both fixes are reaching for is a reliable, decentralized party that will send the transaction when the condition is met and charge you a fair price for the gas. That is what Chainlink Automation is.

## What Chainlink Automation provides

Automation, called Chainlink Keepers until its 2022 rename, is a network of independent nodes that monitor registered upkeeps and execute them on-chain when they are due. The same decentralization and crypto-economic guarantees behind Chainlink's price feeds apply here. No single node decides whether your function runs, and the network is paid in LINK to cover gas plus a premium.

The custom-logic integration rests on a two-function interface your contract implements.

```solidity
// Solidity 0.8.20, Ethereum mainnet
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData)
        external
        returns (bool upkeepNeeded, bytes memory performData);

    function performUpkeep(bytes calldata performData) external;
}
```

The split between these two functions is the whole idea, and it mirrors the off-chain-decides, on-chain-executes shape you already saw with VRF.

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

## The three trigger types

Automation exposes three ways to fire an upkeep, and picking the right one keeps your contract simple.

Time-based triggers run a function on a fixed schedule given as a cron expression, every hour, every day at midnight, the first of each month. You point the registration at a target function and a schedule, and you write no `checkUpkeep` at all. This is the right tool for vesting releases, periodic rebalances, and anything that runs on the calendar rather than on a condition.

Custom-logic triggers use the `checkUpkeep` and `performUpkeep` pair above. The nodes poll your `checkUpkeep` every block, and when it returns true they call `performUpkeep`. This is the tool for condition-based work where you cannot predict the timing in advance, a price crossing a threshold, a quorum being reached, a buffer filling up.

Log triggers fire when a specific event log is emitted on-chain. Instead of `checkUpkeep`, you implement `checkLog`, which receives the matching log and decides whether to act. This suits event-driven reactions, responding to a deposit, a governance vote, or a cross-contract signal, without polling state every block.

For most non-scheduled DeFi mechanics, custom logic is the default, so the rest of this lecture stays with it.

## Wiring it up: a stop-loss order

Here is a contract that sells a held asset when its price drops below a floor. It reads a Chainlink price feed, the same `latestRoundData` and staleness check from the oracle lecture, and it uses Automation to fire the sale automatically.

```solidity
// Solidity 0.8.20, Ethereum mainnet
// Automation-compatible stop-loss: sell when the price falls below a floor.

import {AutomationCompatibleInterface} from
    "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {AggregatorV3Interface} from
    "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract StopLoss is AutomationCompatibleInterface {
    AggregatorV3Interface public immutable priceFeed;
    int256 public immutable floorPrice;   // e.g. 1800 * 1e8 for an 8-decimal feed
    address public immutable owner;
    address public forwarder;             // assigned after the upkeep is registered
    bool public triggered;

    error NotOwner();
    error NotForwarder();
    error PriceStale();
    error ConditionNotMet();

    constructor(address feed, int256 floor) {
        priceFeed = AggregatorV3Interface(feed);
        floorPrice = floor;
        owner = msg.sender;
    }

    // The registry hands you a forwarder address after registration.
    // Lock performUpkeep to it so nobody else can trigger the sale.
    function setForwarder(address fwd) external {
        if (msg.sender != owner) revert NotOwner();
        forwarder = fwd;
    }

    // Simulated off-chain by the nodes on every block. Never mined.
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        if (triggered) return (false, "");
        (, int256 price,, uint256 updatedAt,) = priceFeed.latestRoundData();
        bool fresh = block.timestamp - updatedAt < 1 hours;
        upkeepNeeded = fresh && price > 0 && price < floorPrice;
    }

    // Mined on-chain by the forwarder when checkUpkeep returned true.
    function performUpkeep(bytes calldata) external override {
        if (msg.sender != forwarder) revert NotForwarder();

        // Re-validate. The off-chain result is already a few blocks old.
        (, int256 price,, uint256 updatedAt,) = priceFeed.latestRoundData();
        if (block.timestamp - updatedAt >= 1 hours) revert PriceStale();
        if (triggered || price <= 0 || price >= floorPrice) revert ConditionNotMet();

        triggered = true;
        _executeSell();   // swap the held asset against a DEX router, omitted here
    }

    function _executeSell() internal {
        // ... routing and slippage protection ...
    }
}
```

`checkUpkeep` is marked `view`. It reads the feed, checks freshness, and reports whether the price has fallen below the floor. The Automation contracts also offer a `cannotExecute` modifier you can add to guarantee the function reverts if anyone tries to call it in a real transaction, since it is meant for simulation only.

`performUpkeep` is where the discipline lives, and it is worth slowing down on.

## The re-validation requirement

Look at `performUpkeep` again. It does not assume the sale should happen just because it was called. It re-reads the price and checks the condition from scratch, reverting if the price is stale or has climbed back above the floor.

This re-check is not defensive padding. It is required for correctness, and the reason is timing. `checkUpkeep` runs off-chain at block N. By the time a node builds the transaction, broadcasts it, and it lands in a block, two or three blocks have passed. The state the node observed when it decided to act is no longer the current state. Prices move, balances change, other transactions execute in between.

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

If `performUpkeep` trusted the stale decision, it would sell at a price the user never agreed to, after the stop-loss condition had already cleared. By re-reading the feed and reverting when the condition is gone, the contract guarantees it only ever acts on conditions that are true at the moment of execution. The off-chain `true` is a hint that work might be needed. The on-chain function decides whether it actually is.

This generalizes to every Automation integration. Treat `checkUpkeep` as a cheap filter that tells the network when to bother sending a transaction, and treat `performUpkeep` as the authority that re-establishes every precondition before doing anything irreversible.

## Access control and the forwarder

`performUpkeep` is a public function. By default, any address can call it, including ones that have nothing to do with the Automation network. For some upkeeps that is harmless, because the function re-validates and a stranger calling it early just wastes their own gas. For others it is a real risk, because an attacker can call it at a moment that benefits them, front-run the legitimate execution, or pass a malicious `performData` blob.

The fix is the forwarder. When you register an upkeep, the registry generates a unique forwarder address for it, and that address is the only one the network uses to call your `performUpkeep`. Once you know it, restrict the function to `msg.sender == forwarder`, as the stop-loss does. Now the network can trigger the work and nobody else can.

Do not hardcode the forwarder in the constructor. You do not know its address until after registration, which happens after deployment. Set it once afterward through an owner-guarded setter.

## Funding and lifecycle

An upkeep is paid in LINK. You register it at the Automation app or programmatically against the registry, deposit a LINK balance, and the network deducts from that balance each time it runs `performUpkeep`, covering the gas plus a premium that pays the node.

When the LINK balance is depleted, the upkeep stops. It does not warn you in the contract, it does not revert, it simply stops being executed, and your liquidations or releases quietly fail to happen. Monitoring the balance and topping it up is operational work you own. Several teams have deployed a contract that worked perfectly in testing and then watched a critical upkeep go silent weeks later because nobody refilled the LINK.

The other limit to plan for is gas. Each upkeep has a configured gas limit for `performUpkeep`. If your execution exceeds it, the transaction reverts and the work does not get done. This makes unbounded loops especially dangerous here, because the loop might fit under the limit in a test with three items and blow past it in production with three thousand.

## What people get wrong

**Trusting the off-chain check.** The most common and most damaging mistake is writing a `performUpkeep` that does the work unconditionally because "checkUpkeep already verified it." By the time `performUpkeep` runs, the check is several blocks stale. Re-validate every precondition on-chain.

**Leaving performUpkeep open.** Forgetting the forwarder guard exposes the function to anyone. Depending on what the upkeep does, that ranges from harmless to exploitable. Lock it to the forwarder unless you have a specific reason the function is safe to call by anyone.

**Fearing an expensive checkUpkeep.** Developers sometimes cram complex logic into `performUpkeep` to keep `checkUpkeep` cheap. This is the wrong approach. `checkUpkeep` runs off-chain and costs nothing to simulate, within the node's generous limits, so it is the right place for heavy reads and iteration. `performUpkeep` is the part that costs real gas and runs under a hard limit, so keep it lean and let the check do the looking.

**Unbounded loops in performUpkeep.** A loop over all positions or all users passes in a small test and reverts in production once the set grows past the gas limit. Cap the work per execution, or use `performData` to tell `performUpkeep` exactly which items to process, computed during the free off-chain check.

**Expecting exact timing.** Automation is best-effort. It fires soon after the condition is met, usually within a block or two. The timing is approximate, so anything that needs sub-block precision or guaranteed execution in a specific block should not depend on it.

The raffle task you just built is a clean candidate for this pattern. Its `drawWinner` currently relies on someone remembering to call it after the deadline. A time-based upkeep pointed at `drawWinner`, or a custom-logic upkeep whose `checkUpkeep` returns true once `block.timestamp` passes the deadline, removes that dependency and makes the draw fire on its own. The contract stays passive and correct, and the network supplies the missing trigger.
