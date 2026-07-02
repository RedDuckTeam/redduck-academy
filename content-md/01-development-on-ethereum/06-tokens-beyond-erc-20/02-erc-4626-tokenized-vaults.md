# ERC-4626 tokenized vaults

_type: lecture_

## Why standardize vaults

Every yield protocol does roughly the same thing. Users deposit some token. The protocol does something with the token (lends it out, stakes it, runs an investment strategy, whatever). Profits get reflected somehow in what users get back when they withdraw.

Before 2022, every protocol invented its own interface for this. Yearn called it `deposit/withdraw`. Compound called it `mint/redeem` and used a `cToken`. Aave called it `deposit/withdraw` but minted an `aToken`. Each had different function signatures, different events, different decimals handling, different edge cases. A wallet that wanted to display "your positions across DeFi" had to write a separate integration for each one.

[**ERC-4626**](https://eips.ethereum.org/EIPS/eip-4626) solves this by defining the interface: a vault must expose certain function names, with certain signatures, with certain behavior. If a contract follows the standard, any tool that knows ERC-4626 can talk to it.

The standard does not say what the vault does internally. It does not say how the vault generates yield, or where the assets get invested, or whether they're invested at all. It only standardizes the deposit-and-withdraw interface around two tokens: an **asset** (whatever ERC-20 you put in) and a **share** (the ERC-20 receipt you get back).

## The mental model

The clearest way to think about ERC-4626 is as a bank account that issues transferable receipts.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>ERC-4626 vault swapping user assets for shares and back</title><desc>A user holding assets like USDC sits next to a vault that tracks totalAssets and totalSupply, where share price equals totalAssets divided by totalSupply. Arrows show the user depositing assets to receive minted shares, and burning shares to get assets back, while a note explains that shares are a transferable ERC-20 token whose value rises as the vault earns yield.</desc>
  <defs>
    <marker id="arrV1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A vault swaps assets for shares, and back again later</text>
  <rect x="60" y="160" width="140" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="130" y="190" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold">User</text>
  <text x="130" y="212" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">holds assets</text>
  <text x="130" y="228" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">(e.g. USDC)</text>
  <rect x="520" y="100" width="160" height="200" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="600" y="128" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold">Vault</text>
  <line x1="540" y1="138" x2="660" y2="138" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="540" y="160" font-family="monospace" font-size="10" font-weight="bold">totalAssets</text>
  <text x="540" y="176" font-family="monospace" font-size="10" fill="#565653">USDC in vault</text>
  <text x="540" y="206" font-family="monospace" font-size="10" font-weight="bold">totalSupply</text>
  <text x="540" y="222" font-family="monospace" font-size="10" fill="#565653">shares issued</text>
  <text x="540" y="252" font-family="monospace" font-size="10" font-weight="bold">share price =</text>
  <text x="540" y="278" font-family="monospace" font-size="9" fill="#ed4937">totalAssets / totalSupply</text>
  <line x1="205" y1="180" x2="515" y2="155" stroke="#ed4937" stroke-width="2.5" marker-end="url(#arrV1)"/>
  <text x="360" y="146" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">user deposits assets</text>
  <text x="360" y="192" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">vault mints shares back to the user</text>
  <line x1="515" y1="240" x2="205" y2="220" stroke="#ed4937" stroke-width="2.5" marker-end="url(#arrV1)"/>
  <text x="360" y="252" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">user burns shares</text>
  <text x="360" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">vault sends assets back to the user</text>
  <rect x="40" y="340" width="640" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="362" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">The shares are themselves an ERC-20 token</text>
  <line x1="60" y1="372" x2="660" y2="372" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="392" font-family="monospace" font-size="10">A share is a transferable receipt. Holding 10% of the share supply means a claim on</text>
  <text x="60" y="408" font-family="monospace" font-size="10">10% of the vault's assets. If the vault earns yield, totalAssets grows while totalSupply</text>
  <text x="60" y="424" font-family="monospace" font-size="10">stays flat, and each share becomes worth more underlying assets.</text>
</svg>

Two pieces of state matter for the math:

- `totalAssets()` — how much of the underlying asset the vault is currently managing. For a USDC vault, this is the USDC balance of the vault contract, plus any USDC the vault has loaned out or staked elsewhere that still belongs to it.
- `totalSupply()` — how many shares have been issued (inherited from the ERC-20 implementation, since shares are themselves an ERC-20).

The ratio between these two values is the share price. If the vault holds 1,000 USDC and has minted 100 shares total, each share is worth 10 USDC. If the vault later generates 100 USDC of yield without any new deposits, totalAssets becomes 1,100 and shares stay at 100, so each share is now worth 11 USDC. Same number of shares, more underlying value per share. This is exactly the same pattern as Uniswap V2 LP tokens.

## Four operations, paired by which side you specify

A user might want to specify the deposit two different ways: "I have exactly 100 USDC, take it and give me whatever shares that's worth" or "I want exactly 10 shares of this vault, take whatever USDC that costs from me." The standard supports both. Same for withdrawals.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>ERC-4626 vault operations: deposit, mint, withdraw, redeem</title><desc>Four boxes show the vault functions deposit, mint, withdraw, and redeem, each with an example request and the formula the vault uses to convert between assets and shares. Deposit and withdraw start from an asset amount, while mint and redeem start from a share amount, so deposits go in as assets to shares and withdrawals go out as shares to assets.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Four operations, paired by "which side you specify"</text>
  <rect x="40" y="80" width="320" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="200" y="105" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">deposit(assets, receiver)</text>
  <line x1="60" y1="115" x2="340" y2="115" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="140" font-family="monospace" font-size="10">You say:</text>
  <text x="60" y="158" font-family="monospace" font-size="10" fill="#ed4937">  "I want to deposit 100 USDC."</text>
  <text x="60" y="184" font-family="monospace" font-size="10">Vault computes:</text>
  <text x="60" y="202" font-family="monospace" font-size="10" fill="#ed4937">  shares = 100 × supply / assets</text>
  <text x="60" y="226" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Use when you have a specific</text>
  <text x="60" y="238" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  amount of assets to spend.</text>
  <rect x="360" y="80" width="320" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="520" y="105" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">mint(shares, receiver)</text>
  <line x1="380" y1="115" x2="660" y2="115" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="380" y="140" font-family="monospace" font-size="10">You say:</text>
  <text x="380" y="158" font-family="monospace" font-size="10" fill="#ed4937">  "I want exactly 10 shares."</text>
  <text x="380" y="184" font-family="monospace" font-size="10">Vault computes:</text>
  <text x="380" y="202" font-family="monospace" font-size="10" fill="#ed4937">  assets = 10 × assets / supply</text>
  <text x="380" y="226" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Use when you need a specific</text>
  <text x="380" y="238" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  number of shares to end up with.</text>
  <rect x="40" y="260" width="320" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="200" y="285" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">withdraw(assets, receiver, owner)</text>
  <line x1="60" y1="295" x2="340" y2="295" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="320" font-family="monospace" font-size="10">You say:</text>
  <text x="60" y="338" font-family="monospace" font-size="10" fill="#ed4937">  "I want to withdraw 100 USDC."</text>
  <text x="60" y="364" font-family="monospace" font-size="10">Vault computes:</text>
  <text x="60" y="382" font-family="monospace" font-size="10" fill="#ed4937">  shares to burn = 100 × supply / assets</text>
  <text x="60" y="406" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Use when you need a specific</text>
  <text x="60" y="418" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  amount of assets back.</text>
  <rect x="360" y="260" width="320" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="520" y="285" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold">redeem(shares, receiver, owner)</text>
  <line x1="380" y1="295" x2="660" y2="295" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="380" y="320" font-family="monospace" font-size="10">You say:</text>
  <text x="380" y="338" font-family="monospace" font-size="10" fill="#ed4937">  "Burn 10 shares of mine."</text>
  <text x="380" y="364" font-family="monospace" font-size="10">Vault computes:</text>
  <text x="380" y="382" font-family="monospace" font-size="10" fill="#ed4937">  assets sent = 10 × assets / supply</text>
  <text x="380" y="406" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  Use when you want to cash out</text>
  <text x="380" y="418" font-family="monospace" font-size="10" fill="#565653" font-style="italic">  a specific number of shares.</text>
  <text x="200" y="450" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">going in: assets → shares</text>
  <text x="520" y="450" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">going out: shares → assets</text>
</svg>

The math is symmetric. `deposit` and `mint` produce the same net result if the inputs correspond to each other. The same is true for `withdraw` and `redeem`. The standard gives you both because different callers find different sides easier to reason about. A frontend showing "deposit $X" calls `deposit`. A portfolio rebalancer that wants a clean number of shares calls `mint`. Same outcome.

The `owner` parameter on `withdraw` and `redeem` exists because someone can let a third party burn their shares on their behalf, the same way ERC-20 `transferFrom` works. The caller needs allowance from the owner first. For self-withdrawals, owner equals msg.sender and the allowance check is skipped.

## Preview functions

For every operation the standard provides a matching `preview` function that returns what the result would be without actually executing:

- `previewDeposit(assets)` returns the shares you would receive
- `previewMint(shares)` returns the assets you would pay
- `previewWithdraw(assets)` returns the shares that would be burned
- `previewRedeem(shares)` returns the assets you would receive

These are pure view functions. Frontends use them to show "you will receive ~X shares" before the user signs the transaction. They also let other contracts integrate without having to duplicate the conversion math.

There are also `maxDeposit`, `maxMint`, `maxWithdraw`, and `maxRedeem` functions that return per-user limits. A vault implementation can use these to enforce caps (no deposits over 1,000 USDC, no withdrawals if paused, and so on). By default they return the maximum representable value, meaning no limit, but vault authors can override.

## The conversion math

Two helpers, `convertToShares(assets)` and `convertToAssets(shares)`, do the core arithmetic. They're public view functions that anyone can call, useful for off-chain calculations or other contracts.

The formula for converting assets to shares is:

```
shares = (assets × totalSupply) / totalAssets
```

And the reverse:

```
assets = (shares × totalAssets) / totalSupply
```

Both are integer arithmetic in Solidity, which means the result is truncated (rounded down) at the division. The direction of rounding matters for security. The standard's general principle: round in the direction that favors the vault, not the user. A user depositing assets gets shares rounded down, so they never get more shares than their assets are worth. A user redeeming shares gets assets rounded down, so they never extract more than their shares are worth. Rounding the other direction would let users systematically extract tiny amounts each operation.

OpenZeppelin's reference implementation uses a `Math.mulDiv` helper with an explicit `Rounding` argument so the direction is clear at every call site.

## The inflation attack

The math above has a problem when the vault is freshly deployed and nearly empty. The very first depositor sets the initial share price by being the first one to mint. If they're malicious, they can rig the price so that the second depositor gets cheated.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>ERC-4626 inflation attack: attacker drains the second vault depositor</title><desc>A sequence diagram shows three lanes, Attacker, Vault, and Victim, over four numbered steps. The attacker deposits 1 wei then directly transfers 10,000 USDC to inflate the share price, so the victim's 5,000 USDC deposit rounds down to 0 shares while the attacker redeems 1 share for 15,001 USDC, a 5,000 USDC profit.</desc>
  <defs>
    <marker id="arrV3" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The inflation attack: how a first depositor can drain the second</text>
  <rect x="40" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="120" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Attacker</text>
  <rect x="280" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Vault</text>
  <text x="360" y="113" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">freshly deployed</text>
  <rect x="520" y="80" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="600" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Victim</text>
  <text x="600" y="113" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">honest user, later</text>
  <line x1="120" y1="116" x2="120" y2="555" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="360" y1="116" x2="360" y2="555" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="600" y1="116" x2="600" y2="555" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="125" y1="142" x2="356" y2="142" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <text x="240" y="135" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">1. deposit(1 wei)</text>
  <rect x="280" y="150" width="160" height="36" fill="#e0deda" stroke="#000000" stroke-width="1"/>
  <text x="360" y="170" text-anchor="middle" font-family="monospace" font-size="10">totalAssets = 1</text>
  <text x="360" y="182" text-anchor="middle" font-family="monospace" font-size="10">totalSupply = 1 share</text>
  <line x1="125" y1="208" x2="356" y2="208" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <text x="240" y="201" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">2. transfer 10,000 USDC</text>
  <text x="240" y="222" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">direct ERC-20 transfer, NOT a deposit</text>
  <rect x="280" y="230" width="160" height="36" fill="#e0deda" stroke="#ed4937" stroke-width="1"/>
  <text x="360" y="250" text-anchor="middle" font-family="monospace" font-size="10">totalAssets = 10,001</text>
  <text x="360" y="262" text-anchor="middle" font-family="monospace" font-size="10">totalSupply = 1 share (!)</text>
  <text x="240" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-style="italic">share price is now 10,001 USDC per share</text>
  <line x1="595" y1="316" x2="365" y2="316" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <text x="480" y="309" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">3. deposit(5,000 USDC)</text>
  <rect x="280" y="325" width="160" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="1"/>
  <text x="360" y="342" text-anchor="middle" font-family="monospace" font-size="10">5000 × 1 / 10001 =</text>
  <text x="360" y="357" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">0.4999... → 0 shares</text>
  <text x="480" y="384" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">solidity rounds down, victim receives ZERO shares</text>
  <text x="480" y="398" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">their 5,000 USDC is now in the vault but they have no claim</text>
  <rect x="280" y="412" width="160" height="36" fill="#e0deda" stroke="#ed4937" stroke-width="1"/>
  <text x="360" y="432" text-anchor="middle" font-family="monospace" font-size="10">totalAssets = 15,001</text>
  <text x="360" y="444" text-anchor="middle" font-family="monospace" font-size="10">totalSupply = 1 share</text>
  <line x1="125" y1="475" x2="356" y2="475" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <text x="240" y="468" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">4. redeem(1 share)</text>
  <line x1="356" y1="500" x2="125" y2="500" stroke="#ed4937" stroke-width="2" marker-end="url(#arrV3)"/>
  <text x="240" y="494" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">15,001 USDC sent back</text>
  <text x="240" y="528" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">attacker profit: 5,000 USDC</text>
  <text x="240" y="546" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">(deposited 10,001, walked away with 15,001)</text>
</svg>

The four steps:

1. The attacker is the first to deposit. They put in 1 wei of the asset and receive 1 share. The vault now has totalAssets = 1, totalSupply = 1.
2. The attacker transfers 10,000 USDC directly to the vault's address using a plain ERC-20 transfer, not a deposit call. The vault's contract has no idea this happened from the standpoint of share accounting. Its totalSupply stays at 1, but its balance (and therefore totalAssets) jumps to 10,001.
3. The share price is now 10,001 USDC per share. A victim deposits 5,000 USDC and the contract calculates shares = 5,000 × 1 / 10,001 ≈ 0.4999. Solidity rounds down. The victim receives **zero shares**. Their 5,000 USDC is sitting in the vault, but they have no on-chain claim to it.
4. The attacker redeems their 1 share. The vault now holds 15,001 USDC and has 1 share outstanding. The attacker gets all 15,001 USDC back. They invested 10,001. They walked away with 15,001. Net profit: 5,000 USDC, taken directly from the victim.

This isn't theoretical. Variants of this attack have hit real protocols, including early Aave V2 markets, Hundred Finance, and others. The pattern is general: any time a share-issuing system has a totalSupply much smaller than its assets, rounding can wipe out the next depositor.

## The defense: virtual shares

The OpenZeppelin reference implementation fixes the problem with a technique called **virtual shares** (sometimes called **decimals offset**). The idea is to pretend there's always some baseline number of shares and assets in the vault that no one owns and no one can withdraw. These virtual amounts shift the math so the rounding-to-zero attack stops working.

The conversion formula becomes:

```
shares = (assets × (totalSupply + 10^offset)) / (totalAssets + 1)
```

The `+ 1` and `+ 10^offset` are the virtual amounts. They're tiny in normal use, so they don't measurably affect honest depositors. But when the vault is nearly empty, they prevent share price from being inflated by a small direct transfer.

To see why, redo the attack with the virtual amounts using offset = 0:

- Attacker deposits 1 wei. Vault has totalAssets = 1 + virtual 1 = 2 effective, totalSupply = 1 + virtual 1 = 2 effective. The 1 share they get is now worth ~half the vault, not the whole thing.
- Attacker transfers 10,000 USDC directly. Effective totalAssets = 10,002, effective totalSupply still = 2 share-equivalents.
- Victim deposits 5,000. Shares received = 5,000 × 2 / 10,002 = ~0.9998, still rounds to 0.

So offset = 0 isn't quite enough. Setting offset to 6 (a common choice) means the virtual share supply is `10^6 = 1,000,000`. The victim's calculation becomes 5,000 × 1,000,001 / 10,002 ≈ 499,950 shares. Now they actually receive shares, and the attacker can't drain them by donating.

The offset is a parameter the vault implementer chooses. Higher values give stronger protection against the attack, at the cost of producing very small share amounts that may look strange in user interfaces. OpenZeppelin's default `_decimalsOffset()` returns 0, which OpenZeppelin's documentation recommends increasing for any vault that holds value.

A simpler alternative that also defends against this attack: have the deployer make an initial deposit during construction, large enough that the inflation math doesn't work out economically. This is called "burning the first share" because the shares are usually sent to address(0). It's less robust than virtual shares but is sometimes the right choice for permissioned vaults where you control the deployment.

## Decimals handling

A vault's share token has its own `decimals()`, which by convention should match the underlying asset's decimals. If USDC has 6 decimals, the share token should also have 6, so amounts look consistent in the UI.

The catch is that the original ERC-20 standard doesn't require `decimals()` to exist. It's part of the optional `IERC20Metadata` extension. A vault deployed against an exotic asset might not be able to read its decimals at all.

OpenZeppelin's solution is a helper that tries to call `decimals()` on the asset using a low-level `staticcall`, falls back to 18 if the call reverts or returns garbage, and then optionally adds the offset before exposing the vault's own decimals. The pattern looks like this:

```solidity
function _tryGetAssetDecimals(IERC20 asset_)
    internal view returns (bool, uint8)
{
    (bool success, bytes memory data) = address(asset_).staticcall(
        abi.encodeWithSelector(IERC20Metadata.decimals.selector)
    );
    if (success && data.length >= 32) {
        uint256 raw = abi.decode(data, (uint256));
        if (raw <= type(uint8).max) {
            return (true, uint8(raw));
        }
    }
    return (false, 0);
}
```

The use of `staticcall` here is intentional. The vault is asking another contract a question, and staticcall guarantees that the call cannot modify state, so it's safe to make from a constructor or view function.

## When to use ERC-4626

A protocol should expose an ERC-4626 interface when it manages an ERC-20 on behalf of users and tracks their share of the pool. That covers:

- Yield aggregators (Yearn-style strategies that rotate between protocols)
- Lending markets where deposits earn interest (Aave's aTokens and Compound's cTokens follow the same pattern but predate the standard)
- Staking pools that issue derivative tokens
- Liquid staking and restaking protocols (Lido's stETH is not formally ERC-4626 but plays the same role)
- Single-asset vaults around any productive on-chain strategy

It's the wrong choice when:

- The pool holds multiple assets, not one (an AMM pool holds two assets, so ERC-4626 doesn't fit; Uniswap V2 LP tokens are similar in spirit but use their own interface)
- The user's claim isn't fungible (a lending position with a custom interest rate isn't a clean share of a pool)
- The shares are non-transferable by design (governance staking with a lockup isn't naturally ERC-4626)

The standard is also intentionally minimal. It says nothing about how the vault generates yield, how fees are charged, how the strategy is upgraded, or how rebalancing happens. All of those are decisions the vault implementer has to make on top of the base interface.
