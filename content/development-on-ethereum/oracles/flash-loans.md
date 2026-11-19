---
id: 174
title: Flash loans
type: lecture
order: 5
faq:
  - question: How can anyone borrow millions with no collateral?
    answer: >-
      The transaction is atomic. The lender sends the funds, lets your contract do what it
      wants, and checks the balance came back with the fee. If not, everything reverts. Aave
      charges 0.05%, Balancer's core flash loans are free, and the ceiling is the lender's pool
      depth.
  - question: What do people use flash loans for besides attacks?
    answer: >-
      Arbitrage, refinancing and collateral swaps, and liquidations.
  - question: If flash loans enable oracle attacks, why not ban them?
    answer: >-
      The flaw is trusting one pool's spot price, and anyone with enough capital could always
      move it. bZx lost about $1M over two attacks in one week in February 2020, Harvest
      Finance $24M later that year. The fix belongs at the oracle layer.
---

> A flash loan lets a contract borrow any amount of any token without putting up collateral, on the condition that the loan is repaid before the same transaction ends. If the borrower doesn't repay, the entire transaction reverts and the loan effectively never happened.

## Atomicity replaces collateral

In normal lending, a borrower posts collateral worth more than the loan. The lender accepts default risk in exchange for keeping that collateral if the borrower disappears. In a flash loan the borrower posts nothing.

The reason it's safe for the lender is that Ethereum transactions are **atomic**. Every state change inside one transaction either commits together or reverts together. So the lender sends the borrower the funds, gives them control to do whatever they want, then at the end of the call checks that the balance is back, plus a small fee. If it isn't, the lender reverts the transaction, and the principal is still in its pool. The worst case for the lender is that the transaction reverts and it earns no fee.

In code, the provider's side fits in one function:

```solidity
function flashLoan(address token, uint256 amount, bytes calldata data) external {
    uint256 fee = amount * 5 / 10_000;
    uint256 balanceBefore = IERC20(token).balanceOf(address(this));
    IERC20(token).transfer(msg.sender, amount);
    IFlashLoanReceiver(msg.sender).executeOperation(token, amount, fee, data);
    require(IERC20(token).balanceOf(address(this)) >= balanceBefore + fee, "loan not repaid");
}
```

If the borrower sends back less than `amount + fee`, the `require` on the last line fails, and the revert also undoes the `transfer` that sent the loan out.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Flash loan steps between borrower contract and provider in one transaction</title><desc>A borrower contract and a flash loan provider (Aave, Balancer, or Uniswap) run six steps inside one transaction: request the loan, receive tokens, call executeOperation, do anything with the funds, then repay the amount plus fee. The provider checks the balance; if repayment is short the whole transaction reverts as if the loan never happened, and if it is enough the transaction succeeds and the profit is kept.</desc>
  <defs>
    <marker id="arrFL1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Flash loan: borrow without collateral, repay before the transaction ends, or revert</text>
  <rect x="100" y="80" width="180" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="100" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Borrower contract</text>
  <text x="190" y="114" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">your code</text>
  <rect x="440" y="80" width="180" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="100" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Flash loan provider</text>
  <text x="530" y="114" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">Aave / Balancer / Uniswap</text>
  <line x1="190" y1="120" x2="190" y2="510" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="530" y1="120" x2="530" y2="510" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <rect x="80" y="140" width="560" height="320" fill="none" stroke="#000000" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="100" y="160" font-family="monospace" font-size="10" font-style="italic" fill="#565653">inside ONE transaction</text>
  <line x1="195" y1="184" x2="525" y2="184" stroke="#ed4937" stroke-width="2" marker-end="url(#arrFL1)"/>
  <text x="360" y="178" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">1. flashLoan(amount, params)</text>
  <line x1="525" y1="216" x2="195" y2="216" stroke="#ed4937" stroke-width="2" marker-end="url(#arrFL1)"/>
  <text x="360" y="210" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">2. transfer N tokens to borrower</text>
  <line x1="525" y1="244" x2="195" y2="244" stroke="#ed4937" stroke-width="2" marker-end="url(#arrFL1)"/>
  <text x="360" y="238" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">3. call executeOperation() on borrower</text>
  <rect x="100" y="260" width="180" height="80" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="190" y="280" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">4. do anything</text>
  <text x="190" y="296" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">swap, arb, liquidate,</text>
  <text x="190" y="310" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">refinance, attack,</text>
  <text x="190" y="324" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">whatever fits in one tx</text>
  <line x1="195" y1="362" x2="525" y2="362" stroke="#ed4937" stroke-width="2" marker-end="url(#arrFL1)"/>
  <text x="360" y="356" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">5. return N + fee to provider</text>
  <rect x="440" y="378" width="180" height="56" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="530" y="398" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">6. check balance</text>
  <text x="530" y="414" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">balance &gt;= amount + fee?</text>
  <text x="530" y="428" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">if no → revert entire tx</text>
  <rect x="40" y="476" width="310" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="495" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">If repaid:</text>
  <text x="195" y="513" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">tx succeeds, profit kept</text>
  <rect x="370" y="476" width="310" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="525" y="495" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">If not repaid:</text>
  <text x="525" y="513" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">entire tx reverts, loan never existed</text>
</svg>

## The borrower implements a callback

A contract that wants to take a flash loan implements a callback function (the exact name depends on the provider: Aave calls it `executeOperation`, Balancer calls it `receiveFlashLoan`, Uniswap V3 uses `uniswapV3FlashCallback`). The contract requests a loan, the provider sends the tokens and immediately calls back into the contract, and the contract has the duration of that callback to do whatever it wants. Before the callback returns, the contract must have approved (or pushed) enough tokens back to the provider to cover the loan plus the fee.

A minimal sketch in Solidity:

```solidity
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFlashLoanProvider {
    function flashLoan(address token, uint256 amount, bytes calldata data) external;
}

interface IFlashLoanReceiver {
    function executeOperation(address token, uint256 amount, uint256 fee, bytes calldata data) external;
}

contract MyArbitrageur is IFlashLoanReceiver {
    IFlashLoanProvider public immutable provider;

    constructor(IFlashLoanProvider _provider) {
        provider = _provider;
    }

    function startArbitrage(address token, uint256 amount) external {
        provider.flashLoan(token, amount, "");
        // by the time this returns, the entire arb has executed
    }

    function executeOperation(address token, uint256 amount, uint256 fee, bytes calldata) external {
        require(msg.sender == address(provider), "caller is not the provider");
        // 1. we now hold `amount` of token
        // 2. do whatever the strategy needs (swaps, calls to other protocols)
        // 3. send amount + fee back to the provider
        IERC20(token).transfer(msg.sender, amount + fee);
    }
}
```

The `require` at the top of `executeOperation` lets only the provider in. The function is `external` and sends `amount + fee` to whoever calls it, so without the check anyone could call it directly with any amount and take the tokens the contract holds. The provider in this sketch calls back the contract that asked for the loan, so with the check the callback runs only inside a loan that `startArbitrage` opened. Aave and Balancer take the receiver's address as a parameter, so anyone can open a loan to your contract and the provider still calls it. With them the callback also has to check who opened the loan, which Aave passes in as `initiator`.

Fees are small: Aave charges 0.05% of the borrowed amount at the time of writing. Balancer charges nothing on its core flash loans, which is one reason it's a popular source. Uniswap V3's flash mechanism charges the regular pool swap fee.

There's no practical cap on the borrowable amount beyond the provider's pool depth. If Aave has $400M of USDC in its lending pool, that's the limit.

## Flash loans fund arbitrage, refinancing and liquidations

Flash loans look like a tool for attackers when you first encounter them, but the dominant volume across the major providers is legitimate. It falls into three main categories.

**Arbitrage between exchanges.** If Uniswap and SushiSwap show different prices for the same pair, someone can profit by buying on the cheaper one and selling on the more expensive one. Without a flash loan they'd need the upfront capital. With a flash loan they can do it from a contract that holds nothing.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Cross-DEX flash-loan arbitrage between Uniswap and SushiSwap</title><desc>Four numbered steps show an arbitrageur flash-loaning 1,000,000 USDC from Aave, buying ETH on Uniswap at $3,000, selling it on SushiSwap at $3,050, then repaying the loan for a net profit of about 16,166 USDC with zero starting capital. A final box shows the trade's effect on prices: ETH moves up slightly on Uniswap and down on SushiSwap.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Legitimate use: cross-DEX arbitrage with zero starting capital</text>
  <rect x="40" y="80" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="104" font-family="monospace" font-size="10" font-weight="bold">Setup (one block):</text>
  <text x="60" y="122" font-family="monospace" font-size="10">  Uniswap pool prices ETH at $3,000      |      SushiSwap pool prices ETH at $3,050</text>
  <text x="60" y="135" font-family="monospace" font-size="9" fill="#565653" font-style="italic">  A $50 spread between two DEXes. Whoever closes it captures the spread.</text>
  <text x="40" y="172" font-family="monospace" font-size="11" font-weight="bold">Arbitrageur's transaction (no upfront capital needed):</text>
  <rect x="40" y="190" width="640" height="36" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="60" y="210" font-family="monospace" font-size="10" font-weight="bold">1.</text>
  <text x="90" y="210" font-family="monospace" font-size="10">Flash-loan 1,000,000 USDC from Aave</text>
  <text x="470" y="210" font-family="monospace" font-size="9" fill="#565653" font-style="italic">cost: small fee (e.g. 0.05% = $500)</text>
  <rect x="40" y="234" width="640" height="36" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="60" y="254" font-family="monospace" font-size="10" font-weight="bold">2.</text>
  <text x="90" y="254" font-family="monospace" font-size="10">Buy ETH on Uniswap with the 1M USDC</text>
  <text x="470" y="254" font-family="monospace" font-size="9" fill="#565653" font-style="italic">receives ~333.33 ETH at $3,000</text>
  <rect x="40" y="278" width="640" height="36" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="60" y="298" font-family="monospace" font-size="10" font-weight="bold">3.</text>
  <text x="90" y="298" font-family="monospace" font-size="10">Sell that ETH on SushiSwap for USDC</text>
  <text x="470" y="298" font-family="monospace" font-size="9" fill="#565653" font-style="italic">receives ~1,016,666 USDC at $3,050</text>
  <rect x="40" y="322" width="640" height="36" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="60" y="342" font-family="monospace" font-size="10" font-weight="bold">4.</text>
  <text x="90" y="342" font-family="monospace" font-size="10">Repay flash loan: 1,000,500 USDC</text>
  <text x="470" y="342" font-family="monospace" font-size="9" fill="#565653" font-style="italic">leaves ~16,166 USDC remaining</text>
  <rect x="40" y="382" width="640" height="56" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="402" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">Net profit: ~16,166 USDC (minus gas)</text>
  <text x="360" y="420" text-anchor="middle" font-family="monospace" font-size="10">Arbitrageur started with zero capital, ended with $16k.</text>
  <text x="360" y="432" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">If anything failed mid-way (insufficient liquidity, slippage too high), the whole tx reverts.</text>
  <rect x="40" y="458" width="640" height="68" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="478" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Effect on the two pools:</text>
  <text x="60" y="498" font-family="monospace" font-size="10">  Uniswap (sold to): ETH price moved UP slightly, e.g. from $3,000 to $3,015</text>
  <text x="60" y="514" font-family="monospace" font-size="10">  SushiSwap (bought from): ETH price moved DOWN, e.g. from $3,050 to $3,035</text>
</svg>

**Refinancing and collateral swaps.** A user has a loan on Aave collateralized by ETH. They want to switch to using staked-ETH as collateral instead. Without a flash loan, they'd have to repay the loan first, which means they need the USDC they don't have. With a flash loan they can do all of it in a single transaction: flash-loan the USDC to repay, withdraw ETH, swap to staked-ETH, redeposit, reborrow, repay the flash loan from the new borrow.

**Liquidations.** When someone else's loan goes underwater, anyone can liquidate it and take a bounty. Liquidators normally need capital sitting around to repay the bad loan. With a flash loan, they can liquidate any size position without holding capital of their own, and keep the bounty.

## Borrowed capital can move a pool's spot price for one transaction

A flash loan can also be used to manipulate something the rest of the system depends on. The most common target is a price oracle that reads from a single AMM pool.

A Uniswap V2 pool's spot price is the ratio of its reserves, as the [AMM lesson](/courses/development-on-ethereum/defi-tasks-and-patterns/amm) showed. Any swap moves the ratio, and a big enough swap moves it a lot. Normally this isn't an issue because moving the price means paying a lot of slippage, and any attacker would lose more in slippage than they could gain by exploiting the moved price. But if some other protocol reads that pool's spot price and trusts it as the price of TOKEN, an attacker who can briefly distort the pool's reserves can extract value from the downstream protocol. The flash loan provides the capital needed for the distortion at the cost of its fee.

<svg role="img" viewBox="0 0 720 700" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Flash-loan attack: manipulating a thin pool's price to fake a lending oracle</title><desc>A flash loan of 1,000,000 USDC is dumped into a TOKEN/USDC pool, pushing the price from $10 to $40 so the attacker can borrow 1,600,000 USDC against inflated TOKEN collateral. After the flash loan is repaid the price reverts to $10, leaving the attacker with about $600k profit and the lending protocol with about $1.1M in bad debt.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The attack: a flash loan turns a thin pool into a fake oracle reading</text>
  <rect x="40" y="80" width="640" height="84" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="102" font-family="monospace" font-size="10" font-weight="bold">Setup:</text>
  <text x="60" y="120" font-family="monospace" font-size="10">  TOKEN/USDC pool:  100,000 TOKEN  +  1,000,000 USDC      →  spot price = $10/TOKEN</text>
  <text x="60" y="138" font-family="monospace" font-size="10">  Lending protocol: reads TOKEN price from this pool, accepts TOKEN as collateral at 80% LTV</text>
  <text x="60" y="156" font-family="monospace" font-size="9" fill="#565653" font-style="italic">  Attacker holds nothing. They need to extract money from the lending protocol.</text>
  <rect x="40" y="180" width="640" height="44" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="60" y="200" font-family="monospace" font-size="10" font-weight="bold">1. Flash-loan 1,000,000 USDC from Aave</text>
  <text x="60" y="216" font-family="monospace" font-size="9" fill="#565653">   attacker now holds 1M USDC, owes 1M USDC + fee to Aave</text>
  <rect x="40" y="234" width="640" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="60" y="254" font-family="monospace" font-size="10" font-weight="bold">2. Dump the 1M USDC into the TOKEN/USDC pool, buying TOKEN</text>
  <text x="60" y="270" font-family="monospace" font-size="10">   pool after:  50,000 TOKEN  +  2,000,000 USDC</text>
  <text x="60" y="286" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">   new spot price = $40/TOKEN  ← inflated 4x. Attacker now holds 50,000 TOKEN.</text>
  <rect x="40" y="304" width="640" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="1.5"/>
  <text x="60" y="324" font-family="monospace" font-size="10" font-weight="bold">3. Lending protocol reads the pool. Sees TOKEN at $40.</text>
  <text x="60" y="340" font-family="monospace" font-size="10">   Attacker deposits 50,000 TOKEN as collateral. Protocol values it at $2,000,000.</text>
  <text x="60" y="356" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">   Attacker borrows 1,600,000 USDC against this "collateral" (80% LTV).</text>
  <rect x="40" y="374" width="640" height="44" fill="#e0deda" stroke="#000000" stroke-width="1.5"/>
  <text x="60" y="394" font-family="monospace" font-size="10" font-weight="bold">4. Repay flash loan: 1,000,500 USDC back to Aave</text>
  <text x="60" y="410" font-family="monospace" font-size="9" fill="#565653">   attacker has 599,500 USDC left in hand, with debt to the lending protocol</text>
  <rect x="40" y="430" width="640" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="452" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">After the transaction ends:</text>
  <line x1="60" y1="460" x2="660" y2="460" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="480" font-family="monospace" font-size="10">  Arbitrageurs reverse the pool manipulation, TOKEN returns to $10.</text>
  <text x="60" y="496" font-family="monospace" font-size="10">  Attacker's 50,000 TOKEN collateral is now worth only $500,000, not $2,000,000.</text>
  <text x="40" y="538" font-family="monospace" font-size="11" font-weight="bold">Final accounting (attacker walks away from the bad loan):</text>
  <rect x="40" y="554" width="310" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="574" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Attacker</text>
  <line x1="60" y1="582" x2="330" y2="582" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="602" font-family="monospace" font-size="10">  Walked off with:  $599,500</text>
  <text x="60" y="618" font-family="monospace" font-size="10">  Lost as collateral:  $500k TOKEN</text>
  <text x="60" y="636" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">  Net: profit ~$600k from 0 capital</text>
  <rect x="370" y="554" width="310" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="525" y="574" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">Lending protocol</text>
  <line x1="390" y1="582" x2="660" y2="582" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="390" y="602" font-family="monospace" font-size="10">  Lent out: $1,600,000</text>
  <text x="390" y="618" font-family="monospace" font-size="10">  Got back: $500k collateral</text>
  <text x="390" y="636" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">  Net: lost ~$1.1M to bad debt</text>
  <text x="360" y="678" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">The protocol's mistake: trusting a spot price that one flash-loaned trade could move.</text>
</svg>

In the diagram the pool holds 100,000 TOKEN and 1,000,000 USDC, so the spot price is $10. A lending protocol reads that price and lends up to 80% of the collateral's value. The attacker swaps a flash-loaned 1,000,000 USDC into the pool, which leaves the pool with 50,000 TOKEN and 2,000,000 USDC, a spot price of $40. The lending protocol values the attacker's 50,000 TOKEN at $2,000,000 and lends 1,600,000 USDC against them. The attacker repays 1,000,500 USDC to Aave, keeps 599,500 USDC, and never comes back for the collateral. Once arbitrageurs bring the pool back to $10, that collateral is worth $500,000, and the lending protocol is left with about $1.1M of bad debt.

The manipulation was not free. The attacker paid 1,000,000 USDC for tokens worth $500,000 at the real price, so the swap cost them $500,000. Against those tokens they borrowed 1,600,000 USDC, which is $1,100,000 more than the tokens are worth. The difference between the two, about $600,000, is the profit. When the exploit does not need the tokens to stay behind as collateral, the attacker reverses the swap before repaying and recovers most of what they pushed through.

Every attack of this class has the same steps: borrow a large amount, distort a pool, exploit a downstream protocol that trusted the pool's spot price, repay, and keep the difference. bZx was hit this way in February 2020, twice in one week, for combined losses around $1M. Harvest Finance followed later that year at $24M. In total, oracle manipulation enabled by flash loans has cost protocols hundreds of millions of dollars, and the pattern still surfaces on smaller projects with weak oracle designs.

## A spot price from one pool was never a safe oracle

The attacker doesn't strictly need a flash loan to manipulate a pool. Anyone with enough capital can do the same attack with their own tokens. The flash loan reduces the barrier from needing $10M of capital to needing only gas and a flash-loan fee.

So **a spot price from a single AMM pool was never a safe oracle**. Someone with enough capital could always move it, and flash loans made that capital available to anyone. Blocking flash loans is therefore not a defense. The defense is at the oracle layer. Protocols need price signals that can't be moved by a single transaction.

There are three main approaches in production today.

**External oracles** like Chainlink [price feeds](/courses/development-on-ethereum/oracles/oracles-and-chainlink-price-feeds). The price is set by off-chain aggregation across many exchanges. A single on-chain swap can't move it. This is the dominant defense.

**Time-weighted prices**, where the oracle reports an average over a window rather than a spot read. A one-block manipulation contributes only one block's worth of price to the average, which dilutes its impact to near zero. The [TWAP lesson](/courses/development-on-ethereum/oracles/twap-oracles) covers this in detail.

**Multi-source checks**, where the protocol consumes two oracles and reverts if they diverge significantly. This catches the case where one of them is wrong or being attacked.

For every value your contract reads from another contract, ask whether someone who can borrow any amount for one transaction could move that value before your contract reads it. If they could, do not lend or pay out against it.
