---
id: 190
title: Account constraints
type: lecture
order: 4
faq:
  - question: My handler won't compile when it writes to an account. What is missing?
    answer: >-
      mut on that field. Without it the write fails to compile, and the account is rejected
      anyway if the transaction never marked it writable.
  - question: Why does init need payer and space?
    answer: >-
      Because "create" leaves two questions open. payer names the field whose balance funds the
      rent deposit. space says how many bytes to allocate, 8 for the discriminator plus your
      struct's fields, written as space = 8 + Vault::INIT_SPACE. Drop either one and Anchor
      refuses to build.
  - question: What does has_one = authority compare?
    answer: >-
      The authority field stored inside the account against the public key of the authority
      account passed in the same struct. A vault records its owner's key, and one line makes
      Anchor confirm the signer is that recorded owner.
  - question: Can I stack constraints on one field, and does the order matter?
    answer: >-
      Yes, comma-separated inside one #[account(...)], and no. Anchor resolves the dependencies,
      so mut, has_one, init with payer and space, seeds and bump all run before your handler.
  - question: None of the named constraints says what I mean. What now?
    answer: >-
      constraint = expr takes any boolean expression, for example constraint = vault.total > 0 @
      MyError::EmptyVault. The @ form attaches your own error, so the failure names it instead
      of a generic constraint violation.
  - question: How do I close an account and get its rent back?
    answer: >-
      close = recipient. Anchor closes the account at the end of the instruction and sends its
      lamports to the named field.
---

> The type of a field tells Anchor what kind of account belongs in that slot. Constraints, written inside the `#[account(...)]` attribute above the field, narrow it further. They say things like "this account must be writable," "this account must be created fresh in this instruction," "this field on the account must equal that field on another," "this account must live at this specific address." Every constraint is a check the macro generates and runs before your handler executes.

## The client brings every account, so the program has to check each one

A Solana program does not read state for the user. It is handed state by the user: every account the instruction touches is listed by the caller, and the program cannot look anything up that the caller did not include. So every account is an untrusted input.

Take a `withdraw` instruction that pays SOL out of a vault to the signer. Its Accounts struct has two fields and no constraint that ties one to the other:

```rust
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
```

Suppose some user's vault holds 100 SOL. An attacker builds a `withdraw` transaction, puts that user's vault in the `vault` slot and their own wallet in the `authority` slot, and signs it. Both types pass: the vault is a `Vault` owned by the program, and the attacker's wallet did sign. The handler pays the attacker 100 SOL from a vault that is not theirs.

The vault stores its authority's pubkey inside its data, and nothing compared that key with the signer. You could compare them in the handler: `if vault.authority != authority.key() { return Err(...) }`. But if every check were written this way, the handler's logic would be buried under defensive boilerplate, and every check would be one place a bug could hide.

A constraint turns the check into one annotation on `vault`:

```rust
#[account(mut, has_one = authority)]
pub vault: Account<'info, Vault>,
```

`has_one = authority` makes Anchor read the `authority` field stored in the vault and verify that it equals the public key of the account in the struct's `authority` field. The check runs before the handler, so the attacker's transaction is rejected with `ConstraintHasOne`: the vault with 100 SOL records another key. The `Signer` type proves that the authority signed, and `has_one` proves that this authority is the one recorded in the vault.

The [root of trust lecture](/courses/solana-pro/trust-and-identity/root-of-trust) of the Solana Pro course goes through two hacks where one such check was missing.

## The type checks the kind of account, constraints check its role

`Account<'info, Vault>` runs the same three checks (owner, discriminator, deserialization) for every vault in your whole program, in every instruction, no matter what role the account plays. Constraints take the same baseline type and narrow it down to what *this slot in this instruction* needs: whether the account is writable, whether it is created here or already exists, whose key its authority field must match, which address it must sit at.

The split exists because the same account type plays different roles in different instructions. A `Vault` might be initialized once, deposited into many times, withdrawn from with extra signatures, closed when empty. Each of those instructions wants a different set of validation rules on the same underlying type. Putting the validation in the type would force you to define a new type per role with names like `InitVault`, `DepositVault`, and `WithdrawVault`. Putting the validation in constraints lets one type cover all the roles and lets each instruction pick the set of rules it needs.

<svg role="img" viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>What the type checks vs what the constraints check for a Vault account</title><desc>The diagram splits one Accounts struct field, Account&lt;'info, Vault&gt; with #[account(mut, has_one = authority)], into two columns. The left column shows what the type always checks (owner, discriminator, deserialization, the same for every Vault account), and the right column shows what the constraints check for this instruction (the account is writable and vault.authority matches the authority account).</desc>
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

## init creates the account once, and needs a payer and a size

The instruction that creates the vault carries three constraints on the `vault` field:

```rust
#[account(
    init,
    payer = signer,
    space = 8 + Vault::INIT_SPACE,
)]
pub vault: Account<'info, Vault>,
```

**`init`** tells Anchor to create the account fresh in this instruction. Anchor calls into the System Program to allocate the bytes, transfer the rent-exempt deposit from the payer, and assign ownership of the new account to your program. The constraint fails if the account already exists, so the same account cannot be initialized twice.

**`payer = signer`** names which field in the same Accounts struct pays the rent deposit. The named field has to be a `Signer` or otherwise able to send lamports, and it has to be marked `mut`, since paying changes its balance. Without `mut` on the payer, Anchor refuses to build.

**`space = 8 + Vault::INIT_SPACE`** says how many bytes to allocate for the account's data. The 8 bytes are the discriminator that Anchor uses to identify the account type. `INIT_SPACE` is a constant generated by the `#[derive(InitSpace)]` macro on your account struct, which sums up the byte size of every field. The total drives the rent deposit amount, since rent is proportional to size.

Drop `payer` and Anchor refuses to build because it doesn't know whose balance to draw from. Drop `space` and it refuses to build too, because it doesn't know how many bytes to allocate.

A common variant is `init_if_needed`, which performs the same setup but only when the account doesn't already exist. When the account does exist, the handler runs on fields that earlier calls wrote, and a handler written only for a fresh account is wrong in that case (the [classic exploits lesson](/courses/development-on-solana/production-state-design/the-classic-solana-exploits) shows the bug). For your first programs, prefer plain `init` and require the client to know whether the account exists.

## What each constraint rules out

A single `#[account(...)]` attribute can carry multiple constraints separated by commas. Anchor runs all of them before your handler executes, and the order you list them in doesn't matter, because it checks them in a fixed order of its own. The order of fields in the struct matters in one case: Anchor creates all `init` accounts first, in the order their fields are declared, so an `init` field whose constraints read another `init` account has to come after it. A deposit into the vault that also creates a receipt account looks like this:

```rust
#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    // Create a new Receipt account at a PDA derived from "receipt",
    // the vault's address, and the depositor's address.
    // The depositor pays the rent.
    #[account(
        init,
        payer = depositor,
        space = 8 + Receipt::INIT_SPACE,
        seeds = [b"receipt", vault.key().as_ref(), depositor.key().as_ref()],
        bump,
    )]
    pub receipt: Account<'info, Receipt>,

    pub system_program: Program<'info, System>,
}
```

On `vault` and `depositor`, `mut` says the account will be modified during this instruction: the deposit moves lamports from `depositor` to `vault` and adds them to `vault.total`. With `mut`, Anchor rejects the transaction if it did not mark the account writable, and writes the account's fields back to its data when the handler returns. Without `mut`, a handler that changes the account's fields still compiles and runs, but Anchor does not write that account back, so the change is silently lost and nothing at compile time warns you.

On `receipt`, `seeds` with `bump` says the account must live at a Program-Derived Address derived from these seeds. The seeds can mix byte strings, the keys of other accounts, and arbitrary values, and `bump` tells Anchor to validate the canonical bump for that PDA. The sender cannot pass a receipt of their choosing: for a given vault and depositor only one address passes, and that address is one your program controls. Each depositor gets a separate receipt address, so many wallets can deposit into the same vault. A second deposit from the same wallet fails, because `init` finds that wallet's receipt already exists. To get one receipt per deposit, the seeds would need something that differs between deposits. The [PDA lesson](/courses/development-on-solana/writing-your-first-program/pdas-addresses-with-no-private-key) explains how the address is derived.

Two more constraints come up often, although this struct does not use them. `address = some_pubkey` pins the account to a specific known address. It is useful for built-in programs, fixed oracle accounts, or any account whose identity is hardcoded at compile time, and is often paired with `UncheckedAccount` when no type fits but you do know which account should be there. `constraint = expr` takes any boolean expression and verifies it evaluates to true. Use it for one-off rules that the named constraints don't cover, like `constraint = vault.total > 0` or `constraint = clock.unix_timestamp >= proposal.start_time`. Custom errors can be attached with `constraint = expr @ MyError::SomeReason`, which makes the failure produce a meaningful error rather than a generic "constraint violated."

| Constraint | What it rules out |
| --- | --- |
| `mut` | an account the transaction did not mark writable |
| `init`, `payer`, `space` | initializing an account that already exists |
| `has_one = field` | an account whose stored key points to a different account |
| `seeds`, `bump` | an account at any address other than the derived one |
| `address = key` | any account other than the one at the fixed address, such as a fake oracle or sysvar |
| `constraint = expr` | whatever your boolean expression rejects |

`close = recipient`, which closes the account at the end of the instruction and sends its lamports to the named field, and `realloc`, which resizes an existing account's data, are covered in [account closure and realloc](/courses/development-on-solana/production-state-design/account-closure-and-realloc).

## Ask of every account what stops the client from passing another one

When an Accounts struct is finished, go through it field by field. For each account, say who chooses it and what stops them from choosing a different one: a signature, a stored key matched by `has_one`, seeds, a fixed address. Reaching for `UncheckedAccount` without a check, or skipping `has_one` because "the client will pass the right thing," leaves a slot where the answer is "nothing".
