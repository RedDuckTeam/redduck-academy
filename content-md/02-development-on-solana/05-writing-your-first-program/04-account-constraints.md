# Account constraints

_type: lecture_

> The type of a field tells Anchor what kind of account belongs in that slot. Constraints, written inside the `#[account(...)]` attribute above the field, narrow it further. They say things like "this account must be writable," "this account must be created fresh in this instruction," "this field on the account must equal that field on another," "this account must live at this specific address." Every constraint is a check the macro generates and runs before your handler executes. Once you know the handful of constraints you'll use day to day, most Solana validation problems collapse into "which constraint says what I mean."

## Types set the baseline. Constraints set the rest.

The type of a field is the noun. `Account<'info, Vault>` says: the account is owned by your program, its discriminator identifies it as a `Vault`, its bytes deserialize cleanly into a `Vault` struct. Those three checks happen for every `Account<'info, Vault>` in your whole program, in every instruction, no matter what role the account plays.

Constraints are the adjectives. They take the same baseline type and narrow it down to what *this slot in this instruction* needs. Mutable or read-only. Newly created or already existing. Whose authority field matches the signer or some other account. Sitting at a known fixed address or a derived one. The type doesn't know about any of that. Constraints are how you tell Anchor.

The split exists because the same account type plays different roles in different instructions. A `Vault` might be initialized once, deposited into many times, withdrawn from with extra signatures, closed when empty. Each of those instructions wants a different set of validation rules on the same underlying type. Putting the validation in the type would either make the type useless, since it would validate nothing extra, or force you to define a new type per role with names like `InitVault`, `DepositVault`, and `WithdrawVault`. Putting the validation in constraints lets one type cover all the roles and lets each instruction pick the exact set of rules it needs.

<svg viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Type plus constraints equals a full specification</text>
  <rect x="40" y="80" width="640" height="120" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="80" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="100" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">one field in an Accounts struct</text>
  <text x="60" y="135" font-family="monospace" font-size="11" font-weight="bold">#[account(mut, has_one = authority)]</text>
  <text x="60" y="160" font-family="monospace" font-size="11" font-weight="bold">pub vault: Account&lt;'info, Vault&gt;,</text>
  <text x="60" y="186" font-family="monospace" font-size="9" fill="#565653" font-style="italic">the type sets the baseline. the constraint adds rules on top.</text>
  <rect x="40" y="220" width="310" height="240" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="220" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="241" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">what the TYPE checks</text>
  <text x="195" y="265" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">Account&lt;'info, Vault&gt;</text>
  <text x="60" y="290" font-family="monospace" font-size="10">✓ owner matches the program</text>
  <text x="60" y="312" font-family="monospace" font-size="10">✓ first 8 bytes = Vault discriminator</text>
  <text x="60" y="334" font-family="monospace" font-size="10">✓ data deserializes into Vault struct</text>
  <text x="195" y="380" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">always the same</text>
  <text x="195" y="396" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">for every Account&lt;Vault&gt;</text>
  <text x="195" y="410" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">in your whole program</text>
  <rect x="370" y="220" width="310" height="240" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="220" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="241" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">what the CONSTRAINTS check</text>
  <text x="525" y="265" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">mut, has_one = authority</text>
  <text x="390" y="290" font-family="monospace" font-size="10">✓ account is marked writable</text>
  <text x="405" y="304" font-family="monospace" font-size="9" fill="#565653">in the transaction's access list</text>
  <text x="390" y="328" font-family="monospace" font-size="10">✓ vault.authority field equals</text>
  <text x="405" y="342" font-family="monospace" font-size="10">authority account's pubkey</text>
  <text x="525" y="380" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">specific to this instruction</text>
  <text x="525" y="396" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">a different instruction might</text>
  <text x="525" y="410" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">pick a different set</text>
  <text x="360" y="495" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Type is the noun. Constraints are the adjectives. Together they say what this slot needs.</text>
</svg>

## The constraints you'll use day to day

A handful of constraints cover the vast majority of real-world programs. Each one is a single check that the macro generates and runs at the start of your instruction. If the check fails, the transaction is rejected.

**`mut`**. The account will be modified during this instruction. Without `mut`, attempts to mutate the account inside the handler will fail to compile, and the account will be rejected if the transaction's access list does not mark it writable. The most common constraint. If your handler writes to a field, the constraint goes on the field. Forget it and the compiler will tell you on the line you tried to write.

**`init`**. Create the account fresh during this instruction. Anchor invokes the System Program to allocate the right number of bytes, transfer the rent-exempt deposit from a payer, and assign ownership to your program. The account must not already exist. If it does, `init` fails. This constraint requires two companions: `payer` to say who pays the deposit, and `space` to say how many bytes to allocate.

**`payer = some_field`**. Names the field in this same Accounts struct that pays the rent deposit when an account is initialized. Usually a `Signer` or some authority. The lamports come out of that account's balance and end up sitting on the new account.

**`space = N`**. The number of bytes to allocate for the new account's data. Eight bytes for the discriminator, plus whatever your struct's fields need. The idiomatic form is `space = 8 + Vault::INIT_SPACE` when your account type derives `InitSpace`, which produces a constant with the right number of bytes for the struct's fields. Account sizing has more depth than that one-liner suggests, but the form above is enough to write your first init constraints.

**`has_one = some_field`**. Cross-field check. The constraint says: read the value of a field on this account whose name matches `some_field`, and verify it equals the public key of the field named `some_field` in the Accounts struct. The classic use is a vault that stores its authority's pubkey inside its data, and an instruction that takes the authority as a Signer. `has_one = authority` makes Anchor confirm the signer is in fact the recorded authority, which is exactly the check the program would otherwise need to write by hand and would occasionally forget.

**`seeds = [...]`**** with ****`bump`**. The account must live at a Program-Derived Address derived from these seeds. The seeds can mix byte strings, the keys of other accounts, and arbitrary values. The bump constraint tells Anchor to validate the canonical bump for that PDA. PDAs are deep enough to deserve their own treatment, so for now, recognize the syntax when you see it and know that any account constrained this way lives at an address your program controls.

**`address = some_pubkey`**. Pin the account to a specific known address. Useful for built-in programs, fixed oracle accounts, or any account whose identity is hardcoded at compile time. Often paired with `UncheckedAccount` when no type fits but you do know exactly which account should be there.

**`constraint = expr`**. The escape hatch for custom checks. Takes any boolean expression and verifies it evaluates to true. Use it for one-off rules that the named constraints don't cover, like `constraint = vault.total > 0` or `constraint = clock.unix_timestamp >= proposal.start_time`. Custom errors can be attached with `constraint = expr @ MyError::SomeReason`, which makes the failure produce a meaningful error rather than a generic "constraint violated."

Two more worth mentioning that show up often: **`close = recipient`**, which marks the account for closure at the end of the instruction and sends its lamports to the named field, and **`realloc`**, which resizes an existing account's data. Both come up enough that you'll see them in real code, but they're not the daily-driver set above.

## The init constraint is a contract of three pieces

Of all the constraints, `init` is the one most worth understanding deeply because it appears in every program and packs the most behavior. The constraint by itself says "create this account." But on its own, "create" is ambiguous. How many bytes? Paid for by whom? That's why `init` is always paired with `payer` and `space`.

```rust
#[account(
    init,
    payer = signer,
    space = 8 + Vault::INIT_SPACE,
)]
pub vault: Account<'info, Vault>,
```

Three pieces, all required together:

**`init`** tells Anchor to create the account fresh in this instruction. Under the hood, Anchor calls into the System Program to allocate bytes and assign ownership of the new account to your program. The constraint fails if the account already exists at the expected address, which is what makes it a single-use guard.

**`payer = signer`** names which field in the same Accounts struct pays the rent deposit. The named field has to be a `Signer` or otherwise able to send lamports. Lamports leave the payer's balance and end up sitting on the new account as its rent-exempt deposit.

**`space = 8 + Vault::INIT_SPACE`** says how many bytes to allocate for the account's data. The 8 bytes are the discriminator that Anchor uses to identify the account type. `INIT_SPACE` is a constant generated by the `#[derive(InitSpace)]` macro on your account struct, which sums up the byte size of every field. The total drives the rent deposit amount, since rent is proportional to size.

The three pieces are inseparable. Drop `payer` and Anchor refuses to build because it doesn't know whose balance to draw from. Drop `space` and Anchor doesn't know how many bytes to allocate. The compiler errors are clear, which is one of the small benefits of Anchor's macro approach: it knows what you forgot before runtime.

A common variant is `init_if_needed`, which performs the same setup but only when the account doesn't already exist. The convenience comes with a subtle reinitialization risk that needs explicit handling, so it earns its own attention when the time comes. For your first programs, prefer plain `init` and require the client to know whether the account exists.

## Constraints compose, and the order doesn't matter

A single `#[account(...)]` attribute can carry multiple constraints separated by commas. Anchor runs all of them before your handler executes, and the order you list them in doesn't matter, since the compiler resolves dependencies between them automatically. Putting `mut` before or after `has_one` makes no difference. Listing all the constraints together on one field is just a more compact way of expressing what would otherwise be a bunch of `if` checks at the top of your handler.

```rust
#[derive(Accounts)]
pub struct Deposit<'info> {
    // Writable, and the vault's stored `authority` field must equal
    // the `authority` account below.
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,

    pub authority: Signer<'info>,

    // Create a new Receipt account at a PDA derived from "receipt"
    // and the vault's address. The authority pays the rent.
    #[account(
        init,
        payer = authority,
        space = 8 + Receipt::INIT_SPACE,
        seeds = [b"receipt", vault.key().as_ref()],
        bump,
    )]
    pub receipt: Account<'info, Receipt>,

    // Pin this to the canonical System Program address.
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}
```

In this example, four constraint groups work together. The vault must be writable, and its `authority` field must match the signer field. The receipt must be created fresh at a PDA derived from the string `"receipt"` and the vault's address, and it pays its rent from the authority's balance. The system program must be the canonical System Program at its hardcoded address. Reading the struct, you can describe exactly what the instruction validates before any logic runs. Reading just the handler, you might not be able to. That readability is part of the point.

By the time your handler runs, the runtime has verified everything declared in those brackets. Your handler is left to do the actual work.

## Constraints replace defensive code

Without constraints, every check would happen in your handler. The first dozen lines would be `if account.owner != program_id { return Err(...) }` and `if !authority.is_signer { return Err(...) }` and `if vault.authority != authority.key() { return Err(...) }`. The handler's actual logic would be buried under defensive boilerplate, and every check would be one place a bug could hide. Anchor's constraints turn each of those checks into one annotation that the macro is responsible for generating correctly. You spend less time writing validation code, and the validation that runs is more thorough than what you'd write by hand under deadline pressure.

The flip side is that you have to know which constraint says what you mean. Reaching for `UncheckedAccount` without a check, or forgetting `mut` on an account you intend to write, or skipping `has_one` because "the client will pass the right thing," are all ways the safety net stops catching you. The constraints are tools. Knowing them is what makes them work.
