---
id: 198
title: Associated Token Accounts (ATAs)
type: lecture
order: 4
faq:
  - question: How do I find the address of someone's token account?
    answer: >-
      Compute it. An Associated Token Account address is derived from the holder's wallet and
      the mint, so given Bob's wallet and the USDC mint you get the one canonical address
      where his USDC lives, even before the account exists. You never have to ask the
      recipient, and there is no registry.
  - question: What are the seeds of an ATA?
    answer: >-
      The wallet pubkey, the Token Program's ID, and the mint pubkey, in that order, run
      through find_program_address under the Associated Token Program.
  - question: Is init_if_needed safe?
    answer: >-
      For ATAs, yes. The only way to create an account at an ATA address is the Associated
      Token Program's Create instruction, which always writes a correct TokenAccount, so
      nobody can pre-create one holding adversarial bytes. Your own PDAs have no such
      protection. An attacker can occupy the predictable address first, and your handler will
      read their bytes as valid state. Use plain init there.
  - question: Who pays when an ATA gets created?
    answer: >-
      The payer named in the Create instruction. With init_if_needed that is whoever signs
      your transaction, and they pay only when the account is missing.
---

> To send someone tokens you need the address of their token account, and their wallet address does not tell you what it is. The Associated Token Account is one canonical address per wallet per mint, and anyone can compute it from the wallet and the mint.

## A sender knows the wallet, not the token account

If you want to send Bob 50 USDC, you need to know the address of Bob's USDC token account. There's nothing in Bob's wallet pubkey that tells you. You could ask Bob, but that requires out-of-band coordination and does not scale to a public, permissionless system. You could let Bob create a token account at any address he likes, but then every sender would need a directory mapping Bob to his token account, and every token Bob holds would need its own entry.

The standard answer everyone uses is to make the token account's address a deterministic function of the wallet and the mint. Given Bob's wallet pubkey and the USDC mint pubkey, anyone can compute one address where Bob's USDC token account lives, if he has one. That address is the Associated Token Account.

## The address is a PDA of the wallet, the Token Program ID, and the mint

The ATA address is a Program-Derived Address computed under the Associated Token Program. The seeds are the wallet pubkey, the Token Program's ID, and the mint pubkey, in that order. The derivation runs `find_program_address` as you'd compute any other PDA, so the address is computable offline, before any account at that address even exists.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Computing an Associated Token Account address from wallet, mint, and program seeds</title><desc>Three public inputs, namely Bob's wallet pubkey, the USDC mint pubkey, and the SPL Token Program ID, feed into find_program_address under the Associated Token Program. The result is Bob's USDC ATA address, which anyone can compute even before the account exists.</desc>
  <defs>
    <marker id="arrS44aR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Computing an Associated Token Account address</text>
  <rect x="40" y="85" width="640" height="125" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">inputs (all public, anyone can read)</text>
  <text x="60" y="138" font-family="monospace" font-size="10" font-weight="bold">wallet:</text>
  <text x="200" y="138" font-family="monospace" font-size="10" fill="#565653">Bob's wallet pubkey, e.g. 8fK3...wXyz</text>
  <text x="60" y="160" font-family="monospace" font-size="10" font-weight="bold">mint:</text>
  <text x="200" y="160" font-family="monospace" font-size="10" fill="#565653">USDC mint pubkey, e.g. EPjF...t1v</text>
  <text x="60" y="182" font-family="monospace" font-size="10" font-weight="bold">program:</text>
  <text x="200" y="182" font-family="monospace" font-size="10" fill="#565653">SPL Token Program ID</text>
  <text x="60" y="201" font-family="monospace" font-size="9" fill="#565653" font-style="italic">these three values, in this order, are the seeds of the PDA derivation</text>
  <line x1="360" y1="220" x2="360" y2="245" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS44aR)"/>
  <rect x="40" y="250" width="640" height="105" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="250" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="269" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">PDA derivation, under the Associated Token Program</text>
  <text x="60" y="298" font-family="monospace" font-size="10">find_program_address(</text>
  <text x="80" y="316" font-family="monospace" font-size="10">seeds: [wallet, token_program, mint],</text>
  <text x="80" y="332" font-family="monospace" font-size="10">program_id: ATA_PROGRAM_ID,</text>
  <text x="60" y="348" font-family="monospace" font-size="10">)</text>
  <line x1="360" y1="365" x2="360" y2="390" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS44aR)"/>
  <rect x="40" y="395" width="640" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="395" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="414" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Bob's USDC ATA address</text>
  <text x="360" y="443" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">2pQr...mN8h</text>
  <text x="360" y="465" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">this is where Bob's USDC token account lives, if he has one</text>
  <text x="360" y="481" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">computable by anyone, before the account is even created</text>
  <text x="360" y="525" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Same wallet + same mint = same ATA, always. No need to ask the recipient.</text>
</svg>

## The Associated Token Program creates the account at that address

The Associated Token Program is deployed at `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`, and the one instruction you need from it is Create. Create takes a payer, a wallet, and a mint. It verifies that the account you're asking to create lives at the derived address, has the System Program allocate it with rent from the payer, and has the Token Program initialize it as a TokenAccount with the right owner and mint. The payer does not have to be the wallet, so a sender can create the recipient's ATA.

## init_if_needed is safe on an ATA, and the payer covers the rent

Anchor provides a constraint called `init_if_needed` that creates an account when it doesn't exist and uses the existing account otherwise. For ATAs this looks ideal: a handler that needs the user to have an ATA can guarantee that condition without forcing the client to make a separate Create call beforehand.

The constraint is disabled by default in Anchor, behind a feature flag, because on your own program's accounts it can lead to bugs. With it the handler runs in two situations, on a fresh account and on an existing account whose fields hold whatever earlier calls wrote, and a handler written only for the first is wrong in the second. The [classic exploits lesson](/courses/development-on-solana/production-state-design/the-classic-solana-exploits) shows such a bug.

An ATA does not have this problem, because your handler never initializes its fields. The only way to create an account at that address is through the Associated Token Program's Create instruction, which always initializes the account as a proper TokenAccount with the correct mint and owner. An ATA that already exists can hold tokens, so the handler still must not assume a zero balance.

Using `init_if_needed` means the payer of your transaction pays for the ATA creation when the account doesn't already exist, and the payer may not have expected to pay. The handler also behaves differently depending on whether the account already exists, which makes its semantics implicit. Production protocols often prefer to require the client to create the ATA in a separate instruction before calling the handler, so the create-or-use distinction is plainly visible in the transaction's instruction list.

For your own program's PDAs, use plain `init` and require the client to create the account once. If the account already exists when init runs, the constraint fails, which is the safe behavior.

## In Anchor, two constraints check that the account is the ATA

The Anchor account type for an ATA is `Account<'info, TokenAccount>`, the same as any other token account, with extra constraints to express "this must be the canonical ATA for this wallet and this mint."

```rust
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
```

The `associated_token::mint = mint` and `associated_token::authority = user` constraints tell Anchor to verify that the account at `user_ata` is in fact the canonical ATA derived from `user` and `mint`. If the constraint fails, the instruction is rejected before your handler runs. The client supplies the address, Anchor verifies it's the right one, and your handler uses it without further checks.

When you want to create the ATA only if it doesn't exist, you'd add `init_if_needed` to the constraint block, along with `payer = user` to fund the rent if creation is needed. You'd also need to enable the `init-if-needed` feature on the `anchor-lang` dependency in your Cargo.toml.

## Someone pays for the recipient's account, and the ATA is not the only token account

Computing the address is free, but the account still has to be created, and whoever creates it pays the rent deposit. If Bob has no USDC account yet, either he creates it first or the sender pays for it. The ATA is also a convention and not a rule of the Token Program, so a wallet can own token accounts at other addresses.

For every token account your instruction takes, decide whether you would accept one that is not the ATA, and what breaks in each case.
