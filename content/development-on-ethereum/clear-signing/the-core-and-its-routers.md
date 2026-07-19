---
id: 1789000004
title: The core and its routers
type: lecture
order: 3
faq:
  - question: What vulnerability forced ERC-8009 to split into a core and routers?
    answer: An early version was a single proxy that let any caller pass in the
      target to call and the calldata to send, both chosen freely, while it also
      held standing token approvals from its users. An attacker could point that
      trusted proxy at a token contract and tell it to move a victim's balance, and
      the token obeyed because the victim had approved the proxy. The balance check
      did not help, because it only checks the caller's declared changes and the
      attacker declared nothing about the victim. The fix split the proxy into a
      minimal core that only enforces balances and replaceable routers that arrange
      how each call is paid for.
  - question: Does ERC-8009 protect a multisig like the one Bybit used?
    answer: Yes, through a router built for Safe, added in mid-2026. The Safe router
      is added as one of the Safe's owners and takes one slot of the signature
      threshold. The executor who submits the transaction sees the clear-signed
      balance requirements on their hardware wallet, and the required changes are
      checked after the Safe executes, so a violation reverts the whole bundle. The
      standard specifies what the executor sees at execution time, and does not
      fully specify what each earlier co-signer sees on their own device.
  - question: What does ERC-8009 not protect?
    answer: It constrains native ETH and ERC-20 token balances, and nothing else. A
      transaction can satisfy every ETH and token requirement you set and still move
      an NFT you did not think to constrain, or change a lending or staking position
      that is not a plain balance. The screen tells you the truth about the balances
      you asked about and stays silent about the rest, so the balance requirements
      are a strong floor rather than a full description of everything a transaction
      can do.
---

> The single proxy that enforces your balance changes was not always safe. An early version had a hole that let an attacker spend other people's token approvals, and closing it forced ERC-8009 into the shape it has now: one small trusted core that enforces balances, with one replaceable router for each way a call can be paid. One of those routers is what finally covers a multisig like Bybit's. And even with all of it in place, the guarantee still has a limit worth knowing.

## The hole in a single proxy

A proxy that stands between you and every contract you call is dangerous to get wrong, and early in ERC-8009's design it was wrong. The proxy let any caller pass in the target to call and the calldata to send, both chosen freely. It also held standing token approvals, because users approved it once so it could move their tokens for ordinary transactions.

Put those two facts together from an attacker's side. Call the proxy with a token contract as the target, and pass calldata that moves some victim's tokens to yourself. The victim had already approved the proxy. The token sees the trusted proxy asking to move the victim's balance, and it obeys. The proxy had become a confused deputy: a trusted component anyone could point at any target, spending approvals that were never meant for the caller.

The balance check did not save the victim. It runs against the changes the caller declares, and the attacker declared no requirement about the victim's account, so nothing was checked there. The enforcement was sound, and the design around it was still exploitable.

## A small core, and a router for each flow

The fix was to split the one contract into two separate pieces. A minimal core does the single job that has to be trusted: it enforces the balance changes and holds no standing power of its own. Everything that arranges how a specific call gets paid for is moved out into a replaceable router that sits in front of the core. The caller can no longer aim a trusted, approval-holding component at an arbitrary target, because that combined component no longer exists.

The routers are where standing approvals stop being a liability. The permit router uses a per-transaction approval instead of a standing one. Remember permit from the gasless approvals lesson: the owner signs an EIP-712 message that grants a spend for one transaction only, so no lasting approval sits on the router or the core for an attacker to reach. A different way of paying for a call gets a different router, and the core beneath them stays the same small contract, audited once and deployed at one canonical address on each chain, so hardware wallet firmware can hardcode that address and trust it.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The ERC-8009 core-and-router structure</title><desc>Three replaceable router contracts sit on top: a permit router for per-transaction approvals, a Safe router for multisig execution, and room for more routers, one per new flow. All three feed down into a single minimal balance-proxy core, which is stateless, has one deployment per chain, and enforces the caller's balance changes or reverts. The routers are the replaceable periphery and the core is the small trusted piece.</desc>
  <rect x="20" y="16" width="680" height="34" fill="#ed4937"/>
  <text x="360" y="39" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A SMALL TRUSTED CORE, A ROUTER PER FLOW</text>
  <text x="360" y="66" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-weight="bold">PERIPHERY: replaceable routers</text>
  <rect x="40" y="76" width="190" height="66" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="135" y="103" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">PERMIT ROUTER</text>
  <text x="135" y="123" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">per-transaction approvals</text>
  <rect x="265" y="76" width="190" height="66" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="103" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">SAFE ROUTER</text>
  <text x="360" y="123" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">multisig execution</text>
  <rect x="490" y="76" width="190" height="66" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="585" y="103" text-anchor="middle" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">MORE ROUTERS</text>
  <text x="585" y="123" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">one per new flow</text>
  <path d="M135 142 L275 250" stroke="#565653" stroke-width="2"/><path d="M266 242 L278 252 L272 238 Z" fill="#565653"/>
  <path d="M360 142 L360 250" stroke="#565653" stroke-width="2"/><path d="M354 244 L360 252 L366 244 Z" fill="#565653"/>
  <path d="M585 142 L445 250" stroke="#565653" stroke-width="2"/><path d="M454 238 L442 252 L448 242 Z" fill="#565653"/>
  <rect x="175" y="252" width="370" height="88" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="175" y="252" width="370" height="26" fill="#ed4937"/>
  <text x="360" y="271" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">BALANCE-PROXY CORE</text>
  <text x="360" y="300" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">stateless, one deployment per chain</text>
  <text x="360" y="322" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">enforces your balance changes, or reverts</text>
  <text x="360" y="372" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Each flow gets its own replaceable router, and all of them reach the same small trusted core that</text>
  <text x="360" y="388" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">enforces the outcome. Keeping the core minimal is what makes it safe to audit once and reuse.</text>
</svg>

## Multisig, where signing and execution split

Bybit was a multisig, and that separates signing from execution. Several owners approve a transaction, then one executor submits it on-chain. That split is why a plain single-signer flow did not cover the case that mattered, and it is exactly what the Safe router, added in mid-2026, is built for.

The Safe router is added as one of the Safe's owners and takes up one slot of the signature threshold. The executor submits the transaction through the router on their hardware wallet, and sees the same clear-signed balance requirements a single signer would. The router runs the Safe transaction through the core, and the required changes are checked after the Safe executes, so any violation reverts the whole bundle. Bybit's setup, three owners approving and one executor submitting, is the flow this now covers.

One honest limit lives here. The standard defines what the executor sees at execution time. What each earlier co-signer sees when they add their signature is not part of the guarantee.

## What it does not cover

Balance requirements are a strong floor, and they are still only a floor. ERC-8009 constrains native ETH and ERC-20 balances, and nothing else. A transaction can satisfy every ETH and token requirement you set and still move an NFT you never thought to constrain, or change a lending or staking position that is not a plain balance. The screen tells you the truth about the balances you asked about, and stays silent about the rest.

Two narrower edges are worth remembering.

- **An absolute-balance check ignores where funds came from.** Someone could send you funds so the final number passes, hiding that your own call actually drained you. When the source matters, use the difference form, which measures the change your own call produced.
- **The core is stateless.** Any funds left sitting in it belong to whoever withdraws them next, so a correct transaction never leaves a balance behind.

## Where ERC-8009 stands

ERC-8009 is a proposed standard, still in Draft. There is a working implementation, including the multisig router, and a demo with hardware wallets.

- Spec and demos: [erc8009.xyz](https://erc8009.xyz)
- Formal proposal: [ethereum/ERCs #1184](https://github.com/ethereum/ERCs/pull/1184)
- Discussion: [Ethereum Magicians](https://ethereum-magicians.org/t/erc-8009-proxy-clear-signing/25199)

## Reading the floor for what it is

You now have two things to do at signing time, and they work together. Read the balance changes the screen shows you, and confirm they match what you meant to do. Then remember that those numbers are a floor. If a transaction touches something a balance does not capture, the screen stays quiet about it and the judgment is still yours. That includes an NFT, a debt position, or a change of ownership. The core enforces what you declared and nothing more, which is a firm guarantee about your ETH and tokens and an honest silence about everything else.
