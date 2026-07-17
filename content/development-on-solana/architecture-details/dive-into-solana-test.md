---
id: 226
title: Dive into Solana - Test
type: test
order: 50
isHidden: true
---

<!-- q:6a1f738cb0fc3803e8ba3731 -->
A program has a `Config` account created in `initialize`:

```rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
    ctx.accounts.config.admin = admin;
    Ok(())
}
```

What's wrong here?

- [x] Any user can call `initialize` again at any time and overwrite `config.admin` with their own pubkey  <!-- a:6a1f73e7b0fc3803e8ba3732 -->
- [ ] The `admin` signer isn't verified against `config.admin`  <!-- a:6a1f745ab0fc3803e8ba3733 -->
- [ ] The seeds should include `programId`  <!-- a:6a1f7491b0fc3803e8ba3734 -->
- [ ] Event not emitted  <!-- a:6a1f74a9b0fc3803e8ba3735 -->

<!-- q:6a1f752eb0fc3803e8ba3736 -->
The program is built with overflow checks left at the Rust release default of off.

```rust
pub fn add_stake(ctx: Context<AddStake>, amount: u64) -> Result<()> {
    let position = &mut ctx.accounts.position;
    position.amount = position.amount + amount;
    Ok(())
}
```

What happens if `position.amount + amount` overflows `u64`?

- [ ] The transaction reverts with an arithmetic overflow error  <!-- a:6a1f7543b0fc3803e8ba3737 -->
- [x] The value silently wraps around to a small number  <!-- a:6a1f754cb0fc3803e8ba3738 -->
- [ ] The Rust compiler refuses to build  <!-- a:6a1f7552b0fc3803e8ba3739 -->
