# Front-running and MEV

_type: lecture_

## How transactions actually get into blocks

A simplification we've been using throughout these lessons: "a transaction is submitted and then it happens." The reality has a step in between.

When you submit a transaction to Ethereum, it doesn't execute immediately. It goes into a waiting area called the **mempool**, which is a pool of pending transactions that every node on the network maintains and shares with its peers. Your transaction sits there until a block proposer decides to include it in a block.

The mempool is **public**. Anyone running an Ethereum node can see every pending transaction: the caller, the contract being called, the function, the arguments, the gas price. Bots specifically designed to watch the mempool see your transaction within milliseconds of you submitting it, before any block has included it.

A block proposer picks which transactions go into the next block and in what order. There's no rule that says "first come, first served." The proposer can choose any transactions from the mempool, in any order. Proposers are economically motivated, so they pick the ordering that pays them the most. This means whoever pays a higher gas fee tends to get in first, but proposers can also accept payment off-chain to include or exclude specific transactions.

Three actors matter for understanding MEV:

- **Searchers** are the bots that watch the mempool. They look for profitable patterns and construct transaction bundles that exploit those patterns.
- **Builders** assemble blocks. They take bundles from searchers and try to construct the highest-revenue block possible.
- **Proposers** are the validators that ultimately sign and broadcast a block. They typically accept whatever block pays them the most.

Here's the flow visually:

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Transaction path from user wallet through mempool and searchers to block</title><desc>A user wallet submits a transaction into the public mempool, where it sits alongside other pending transactions. Searchers run bots that read every transaction and build profitable bundles around them, then the builder orders all the transactions, the proposer signs the block, and it goes on chain.</desc>
  <!-- User wallet -->
  <rect x="40" y="30" width="140" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="110" y="58" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">user wallet</text>

<!-- Arrow user → mempool -->
  <line x1="110" y1="74" x2="110" y2="100" stroke="#565653" stroke-width="1.5"/>
  <polygon points="110,108 105,98 115,98" fill="#565653"/>
  <text x="125" y="92" font-family="monospace" font-size="11" fill="#000000">submits tx</text>

<!-- Mempool container -->
  <rect x="40" y="110" width="360" height="130" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="220" y="132" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">public mempool</text>

<!-- Transactions inside -->
  <rect x="60" y="146" width="65" height="24" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="92" y="162" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>
  <rect x="140" y="146" width="65" height="24" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="172" y="162" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>
  <rect x="220" y="146" width="65" height="24" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="252" y="162" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">your tx</text>
  <rect x="300" y="146" width="65" height="24" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="332" y="162" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>
  <rect x="60" y="186" width="65" height="24" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="92" y="202" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>
  <rect x="140" y="186" width="65" height="24" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="172" y="202" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>
  <rect x="220" y="186" width="65" height="24" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="252" y="202" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>
  <rect x="300" y="186" width="65" height="24" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="332" y="202" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>

<!-- Searchers box on right -->
  <rect x="450" y="125" width="230" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="565" y="150" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">searchers</text>
  <text x="565" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">bots reading every tx,</text>
  <text x="565" y="188" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">building profitable</text>
  <text x="565" y="206" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">bundles around them</text>

<!-- Arrow: mempool → searchers -->
  <line x1="400" y1="175" x2="445" y2="175" stroke="#565653" stroke-width="1.5"/>
  <polygon points="453,175 443,170 443,180" fill="#565653"/>

<!-- Builder/proposer bar -->
  <rect x="40" y="290" width="640" height="44" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="317" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">builder orders transactions, proposer signs the block</text>

<!-- Arrow: mempool → builder (tip lands exactly at builder bar top) -->
  <line x1="220" y1="240" x2="220" y2="280" stroke="#565653" stroke-width="1.5"/>
  <polygon points="220,288 215,278 225,278" fill="#565653"/>

<!-- Arrow: searchers → builder -->
  <line x1="565" y1="225" x2="565" y2="280" stroke="#565653" stroke-width="1.5"/>
  <polygon points="565,288 560,278 570,278" fill="#565653"/>
  <text x="575" y="265" font-family="monospace" font-size="11" fill="#000000">bundles</text>

<!-- Arrow: builder → block -->
  <line x1="360" y1="334" x2="360" y2="358" stroke="#565653" stroke-width="1.5"/>
  <polygon points="360,366 355,356 365,356" fill="#565653"/>
  <text x="380" y="362" font-family="monospace" font-size="11" fill="#000000">block on chain</text>
</svg>

This public visibility, combined with the builder's freedom to order transactions for profit, is what every attack in this lesson builds on.

## What is MEV?

**MEV** stands for "Maximal Extractable Value." It's the extra profit that can be made by choosing the right order of transactions in a block, or by inserting your own transactions between someone else's.

A simple example: imagine you submit a transaction that will change the price of a token. A searcher sees this in the mempool. They submit two of their own transactions, one before yours and one after — the first with a higher gas fee than yours so it executes first, the second with a lower fee so it lands right after yours. The builder, motivated to maximize their fee revenue, orders these transactions in a way that lets the searcher profit at your expense. The proposer signs the block.

You paid a normal gas fee. The searcher profited. The builder collected fees. The proposer got paid. Every party in the supply chain made money except you, the user whose transaction was the bait that made the whole thing possible.

This isn't a bug. It's a structural property of public blockchains where the transaction queue is visible. The same property that makes Ethereum transparent and trustless also makes MEV inevitable. MEV exists on every public chain in some form.

## DEXes: the most common MEV target

To understand front-running attacks concretely, you need a basic picture of how a decentralized exchange (DEX) works.

A DEX is a smart contract that lets users trade one token for another without a centralized intermediary. The most common design is the **automated market maker** (AMM), where the contract holds reserves of two tokens, say ETH and USDC, and uses a formula to determine the price.

The key property of AMMs: **trades move the price**. If you buy a lot of ETH from the pool, you're taking ETH out and putting USDC in. The pool now has less ETH and more USDC. The next person who buys ETH gets a slightly worse price because the ratio has shifted. The bigger your trade, the more the price moves. This is called **price impact**.

Because price impact is predictable from the trade size and the pool's current state, anyone watching the mempool can calculate exactly what your trade will do to the price BEFORE your trade executes. This is the opening that MEV bots exploit.

## Slippage

When you submit a swap, you specify how many tokens you want to trade. But the EXACT price you'll get depends on the pool state when your transaction executes, which may differ from the state when you submitted. Other people may trade before you, the price may move, and you might receive fewer tokens than you expected.

**Slippage** is the difference between the price you expected and the price you actually got. To protect users, DEXes ask the user to specify a minimum acceptable output, often as a percentage tolerance. A user might say "I'll accept up to 1% worse than the current quote." If the actual execution would be worse than that minimum, the transaction reverts and the user doesn't lose more than they agreed to.

This slippage tolerance is what makes sandwich attacks profitable, as we'll see in a moment.

## Front-running: the basic attack

A front-running attack is the simplest form. The attacker sees a profitable transaction in the mempool and copies it with a higher gas fee, getting their version mined first.

Example: a token is about to be listed on a major exchange, news that everyone agrees will push its price up. Alice notices the news early and submits a transaction to buy 10,000 tokens at the current price. Bob's bot sees Alice's transaction in the mempool. Before Alice's transaction is mined, Bob submits the same trade with 50% higher gas fee. Bob's transaction mines first, he buys his tokens at the lower price, then Alice's transaction mines and pushes the price up further. Bob immediately sells, profiting from the price movement Alice was about to cause.

Alice still gets her tokens, but at a worse price than she would have. The profit Bob made came directly from Alice's loss, even though Bob never touched Alice's wallet.

## Sandwich attacks: front-running plus back-running

A sandwich attack is a more advanced form of front-running. The attacker places two transactions: one before the victim's trade, called the front-run, and one after, called the back-run. The victim's trade gets sandwiched between them.

Walk through a concrete example. Alice wants to swap 100 ETH for USDC on a DEX. The current price is 2000 USDC per ETH. Alice expects to receive about 200,000 USDC. She sets her slippage tolerance to 2%, meaning her transaction will revert if she'd get less than 196,000 USDC.

A sandwich bot named Mallory sees Alice's pending transaction. The three-transaction sequence Mallory constructs looks like this:

<svg role="img" viewBox="0 0 720 520" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Sandwich attack: Mallory front-runs and back-runs Alice's ETH/USDC swap</title><desc>A four-step table tracks the pool's ETH/USDC reserves and price as Mallory front-runs Alice's 100 ETH swap, then back-runs it after her trade executes. The summary shows Alice lost about 3,500 USDC of expected value while Mallory netted about 2 ETH profit, purely through transaction ordering, not a contract bug.</desc>
  <!-- Column headers -->
  <text x="160" y="30" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">pool state</text>
  <text x="500" y="30" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">outcome</text>

<!-- Stage 0: initial -->
  <rect x="40" y="50" width="240" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="160" y="72" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">1000 ETH / 2.0M USDC</text>
  <text x="160" y="92" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">price: 2000 USDC / ETH</text>

<rect x="340" y="50" width="320" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="500" y="82" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">starting point</text>

<!-- Arrow + step label 1 -->
  <line x1="160" y1="106" x2="160" y2="138" stroke="#565653" stroke-width="1.5"/>
  <polygon points="160,146 155,136 165,136" fill="#565653"/>
  <rect x="200" y="112" width="320" height="24" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="360" y="129" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Mallory's front-run: swap 50 ETH for USDC</text>

<!-- Stage 1 -->
  <rect x="40" y="148" width="240" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="160" y="170" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">1050 ETH / 1.9M USDC</text>
  <text x="160" y="190" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">price: 2050 USDC / ETH</text>

<rect x="340" y="148" width="320" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="500" y="180" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">Mallory now holds ~95,000 USDC</text>

<!-- Arrow + step 2 -->
  <line x1="160" y1="204" x2="160" y2="236" stroke="#565653" stroke-width="1.5"/>
  <polygon points="160,244 155,234 165,234" fill="#565653"/>
  <rect x="200" y="210" width="320" height="24" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="360" y="227" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">Alice's swap: 100 ETH for USDC</text>

<!-- Stage 2 -->
  <rect x="40" y="246" width="240" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="160" y="268" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">1150 ETH / 1.7M USDC</text>
  <text x="160" y="288" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">price: 2150 USDC / ETH</text>

<rect x="340" y="246" width="320" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="500" y="266" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">Alice receives ~196,500 USDC</text>
  <text x="500" y="286" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">expected 200,000 (her 2% slip lets it pass)</text>

<!-- Arrow + step 3 -->
  <line x1="160" y1="302" x2="160" y2="334" stroke="#565653" stroke-width="1.5"/>
  <polygon points="160,342 155,332 165,332" fill="#565653"/>
  <rect x="200" y="308" width="320" height="24" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="360" y="325" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Mallory's back-run: swap USDC back to ETH</text>

<!-- Stage 3 -->
  <rect x="40" y="344" width="240" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="160" y="366" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">1100 ETH / 1.8M USDC</text>
  <text x="160" y="386" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">pool roughly back to start</text>

<rect x="340" y="344" width="320" height="56" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="500" y="364" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">Mallory now holds ~52 ETH</text>
  <text x="500" y="384" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">started with 50, netted ~2 ETH profit</text>

<!-- Summary band -->
  <rect x="40" y="430" width="620" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="350" y="453" text-anchor="middle" font-family="monospace" font-size="13" fill="#ffffff" font-weight="bold">Alice lost ~3,500 USDC of expected value</text>
  <text x="350" y="475" text-anchor="middle" font-family="monospace" font-size="13" fill="#ffffff" font-weight="bold">Mallory captured it through ordering, not a contract bug</text>
</svg>

Mallory walked away with more ETH than she started with. Alice received fewer USDC than she expected. The difference between Alice's "best case" price and her actual price is what Mallory captured. The slippage tolerance Alice set determined the maximum Mallory could extract: if Alice had set tolerance to 0.1%, Mallory's sandwich would have caused Alice's transaction to revert, and Mallory's setup would have been a loss.

This is why slippage tolerance is a delicate setting. Set it too tight and your transactions fail when prices move naturally. Set it too loose and you're advertising "please sandwich me up to this amount."

## Displacement attacks

A displacement attack is different. The attacker doesn't sandwich your trade. They REPLACE your action with their own, leaving you with a worse outcome or a failed transaction.

The classic case: you discover a token contract has a bug that lets the first caller of some function claim all the funds. You submit the call. A bot watching the mempool sees your transaction, copies it with higher gas, and gets in first. Your call still executes, but the funds are already gone. You paid gas for nothing.

Another case: you're creating a new liquidity pool on a DEX and you want to set the initial price. An attacker sees your transaction in the mempool and creates the pool first with a skewed price that benefits them. When your transaction executes, it interacts with the attacker's pool and you lose value.

Displacement attacks aren't limited to DEXes. Any time a transaction would be valuable if it's first, an attacker can preempt it.

## Defense 1: slippage parameters

Every state-changing function that depends on external prices should accept a minimum or maximum tolerance parameter from the user, and revert if the execution would be outside that tolerance.

For a DEX swap, this looks like:

```solidity
// Solidity 0.8.24, Ethereum mainnet
function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,    // user's minimum acceptable output
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts) {
    // ... pool math to compute amounts ...
    require(
        amounts[amounts.length - 1] >= amountOutMin,
        "Insufficient output amount"
    );
    // ... execute the swap ...
}
```

The user computes their `amountOutMin` off-chain based on the current price plus their tolerance. The contract enforces this floor on chain. A sandwich attacker can still squeeze profit out of the user up to `amountOutMin`, but they can't take any more.

The same idea applies to any function where the user commits to a value that depends on chain state. Lending protocols use `minCollateralFactor`, NFT marketplaces use `maxPrice`, airdrop claims use `expectedAmount`. The pattern is always the same: the user signs off on a worst-acceptable outcome, the contract enforces it.

## Defense 2: deadline parameters

A transaction can sit in the mempool for a long time if gas prices spike or the network is congested. By the time it executes, market conditions may have changed completely. A trade you intended at one price might execute at a wildly different one.

The defense is to include a `deadline` parameter: a block timestamp past which the transaction must revert.

```solidity
require(block.timestamp <= deadline, "Transaction expired");
```

A user typically sets the deadline to 10-30 minutes in the future when they submit. If the transaction hasn't mined by then, it reverts. The user can submit a new transaction at the current price instead of being executed at a stale one.

Deadlines also limit the time window in which a sandwich bot can pursue your transaction. If your deadline is short, the bot has to commit early and may face more competition from other bots.

## Defense 3: commit-reveal

Slippage and deadline parameters limit the damage but don't prevent the attacker from seeing your transaction. A more aggressive defense is to hide the transaction's intent entirely until it's safe to reveal.

The pattern is **commit-reveal**. The user submits a transaction containing only a hash of their intended action plus a secret. The contract stores the hash. Some blocks later, the user submits a second transaction revealing the original action and the secret. The contract checks that the hash matches and then executes.

```solidity
// Phase 1: commit. The only thing anyone sees in the mempool is a hash.
mapping(address => bytes32) public commitments;

function commitSwap(bytes32 commitment) external {
    commitments[msg.sender] = commitment;
    // commitment = keccak256(abi.encode(amountIn, amountOutMin, secret))
}

// Phase 2: reveal and execute
function revealAndSwap(
    uint256 amountIn,
    uint256 amountOutMin,
    bytes32 secret
) external {
    bytes32 expected = keccak256(abi.encode(amountIn, amountOutMin, secret));
    require(commitments[msg.sender] == expected, "Bad commitment");
    delete commitments[msg.sender];
    // ... execute the swap ...
}
```

In the commit phase, an attacker watching the mempool sees the commitment but the hash is opaque. They can't tell what trade is about to happen. The `secret` is a random salt that defeats brute-force attacks where an attacker might otherwise precompute hashes for every popular trade size and look for a match.

Phase 1 is genuinely private. Phase 2 is where this pattern has a problem worth understanding.

When the user broadcasts the reveal transaction, its calldata contains the full trade parameters in the clear: `amountIn`, `amountOutMin`, the secret. A searcher watching the mempool sees the reveal transaction, decodes its parameters, simulates it locally, and confirms it will execute successfully. From there the searcher constructs a sandwich just as they would for a direct swap: a front-run before the reveal, the user's reveal in the middle, a back-run after. The naive commit-reveal pattern doesn't actually stop sandwich attacks on a DEX. It just moves the attack window from "the moment the user submits a swap" to "the moment the user submits a reveal."

So why is commit-reveal still useful? Because it actually defeats a different class of attack: **displacement and ordering attacks** where the attacker just needs to know WHAT you're going to do in order to do it first themselves. NFT minting where the first caller wins a rare item, claiming a unique reward, or any "first-mover" race fits this category. The attacker can copy the action only after they see it, and by the time they see it through your reveal, your commit is already on chain, so you have priority. For these use cases, commit-reveal genuinely solves the problem.

For DEX swaps specifically, the pattern only works if combined with additional contract-side mechanics. Two common designs:

- **Batch auctions.** The contract collects many commits over a window, then settles all the reveals at a single uniform price computed from the aggregated trades. CoW Protocol uses a variant of this idea. Within a batch, ordering doesn't matter, so sandwich attacks have nothing to extract.
- **Price-lock to commit block.** The contract uses the pool's reserves at the block where the commit was made, not at the block where the reveal executes. A bot that tries to pump the price before your reveal accomplishes nothing because the contract ignores the current price. This is expensive in practice because it requires storing pool state history.

Naive commit-reveal alone is not an MEV solution for AMMs. It's a building block that protects intent disclosure but needs additional protocol-level mechanics to actually neutralize price-impact attacks.

The drawback in all cases is friction. Two transactions instead of one, with a delay between them. For high-value or sensitive operations this is worth it. For frequent everyday trades it usually isn't, which is why commit-reveal hasn't replaced direct swaps as the default user flow.

## Defense 4: private mempools

Instead of fixing the contract, you can change how transactions are submitted. Instead of broadcasting to the public mempool, the user sends their transaction to a **private relay** that bypasses the public mempool entirely. The relay sends the transaction directly to block builders without it ever being visible to searchers.

<svg role="img" viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Public mempool vs private relay: sandwich attack outcome compared</title><desc>On the left, the user wallet sends a tx to the public mempool, where searchers read every tx and the block includes the tx sandwiched by Mallory. On the right, the user wallet sends the tx through the Flashbots private relay straight to trusted builders, so searchers cannot read it and no sandwich is possible.</desc>
  <!-- Column headers -->
  <text x="180" y="30" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">public mempool</text>
  <text x="540" y="30" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">private relay</text>

<!-- Divider -->
  <line x1="360" y1="20" x2="360" y2="450" stroke="#565653" stroke-width="1" stroke-dasharray="4,4"/>

<!-- LEFT COLUMN --> <!-- user -->
  <rect x="90" y="50" width="180" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="75" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">user wallet</text>

<line x1="180" y1="90" x2="180" y2="118" stroke="#565653" stroke-width="1.5"/>
  <polygon points="180,126 175,116 185,116" fill="#565653"/>

<!-- mempool block -->
  <rect x="90" y="130" width="180" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="155" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">mempool</text>
  <rect x="105" y="170" width="40" height="22" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="125" y="186" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>
  <rect x="155" y="170" width="40" height="22" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="175" y="186" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">tx</text>
  <rect x="205" y="170" width="40" height="22" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="225" y="186" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">yours</text>

<!-- searchers annotation: moved BELOW the block -->
  <text x="180" y="232" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">searchers read every tx</text>

<!-- arrow down to builder -->
  <line x1="180" y1="245" x2="180" y2="275" stroke="#565653" stroke-width="1.5"/>
  <polygon points="180,283 175,273 185,273" fill="#565653"/>

<!-- builder -->
  <rect x="90" y="285" width="180" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="180" y="310" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">builder</text>

<line x1="180" y1="325" x2="180" y2="353" stroke="#565653" stroke-width="1.5"/>
  <polygon points="180,361 175,351 185,351" fill="#565653"/>

<!-- outcome -->
  <rect x="60" y="365" width="240" height="60" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="180" y="389" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">block includes your tx</text>
  <text x="180" y="410" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">sandwiched by Mallory</text>

<!-- RIGHT COLUMN -->
  <rect x="450" y="50" width="180" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="75" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">user wallet</text>

<line x1="540" y1="90" x2="540" y2="118" stroke="#565653" stroke-width="1.5"/>
  <polygon points="540,126 535,116 545,116" fill="#565653"/>

<!-- relay block -->
  <rect x="450" y="130" width="180" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="155" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Flashbots relay</text>
  <text x="540" y="180" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">routes directly to</text>
  <text x="540" y="196" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">trusted builders</text>

<!-- searchers cannot read annotation: moved BELOW and a bit LEFT of center -->
  <text x="500" y="232" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653">searchers cannot read</text>
  <text x="610" y="232" font-family="monospace" font-size="13" fill="#ed4937" font-weight="bold">✗</text>

<line x1="540" y1="245" x2="540" y2="275" stroke="#565653" stroke-width="1.5"/>
  <polygon points="540,283 535,273 545,273" fill="#565653"/>

<!-- builder -->
  <rect x="450" y="285" width="180" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="310" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000">builder</text>

<line x1="540" y1="325" x2="540" y2="353" stroke="#565653" stroke-width="1.5"/>
  <polygon points="540,361 535,351 545,351" fill="#565653"/>

<!-- outcome -->
  <rect x="420" y="365" width="240" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="540" y="389" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">block includes your tx</text>
  <text x="540" y="410" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">no sandwich possible</text>
</svg>

The most well-known service is **Flashbots Protect**. Users add a custom RPC endpoint to their wallet, and transactions submitted through that endpoint never appear in the public mempool. Searchers can't see them, so they can't front-run them.

This defense lives at the wallet layer, not the contract layer. As a contract developer, you can't enforce that your users use private mempools, but you can recommend it and integrate with services that make it easier. Many production DeFi frontends have started defaulting their users to private RPCs.

A bonus to private relays: some of them participate in "MEV-Share" schemes where searchers bid for the right to back-run your transaction profitably. A portion of that bid goes back to you as a rebate. So instead of being a victim of MEV, you can earn a small cut of it.

## Why MEV isn't really fixable

You'll see proposals to "solve MEV" at the protocol level. Some are promising. Most are not.

The fundamental issue is structural. As long as transactions are visible before they execute, and as long as someone decides the order they execute in, opportunities for value extraction will exist. The mempool being public is what makes Ethereum a transparent, permissionless system. Removing that transparency means giving someone the power to decide what happens and when. That someone could be a relay, an encrypted-mempool system, or an off-chain coordinator.

There's active research on encrypted mempools, fair sequencing services, threshold encryption, and intent-based architectures where users submit "what I want to happen" rather than "here's the exact transaction to execute." Some of these are deployed in production already, like CoW Protocol's batch auctions. But all of them involve tradeoffs around centralization, latency, or complexity.

As a developer, the practical position is:

- Always enforce slippage and deadline checks. These are cheap and effective.
- Consider commit-reveal for high-value operations where the friction is worth it.
- Recommend private mempools to your users for the operations where they matter most.
- Accept that some MEV will leak through anyway, and design your protocols so that small amounts of MEV don't cause catastrophic outcomes.

MEV is not a bug to be eliminated. It's a tax on the use of public blockchains, and the goal is to minimize it where you can and make it predictable where you can't.
