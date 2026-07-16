---
id: 203
title: Account closure and realloc
type: lecture
order: 2
faq:
  - question: How do I get back the SOL locked in a Solana account I no longer need?
    answer: You close the account, which drains its rent SOL to a recipient you
      choose, zeroes the data, and marks it as closed. Solana never
      garbage-collects accounts, so that locked SOL sits there forever until
      someone explicitly reclaims it. In Anchor you add the close = recipient
      constraint to the account and Anchor performs all the cleanup steps for
      you.
  - question: What is a revival attack and how does closing an account safely prevent it?
    answer: After an account's lamports are drained, anyone can send SOL back to its
      address to keep it alive, and if the program then re-reads it as fresh it
      can be tricked with stale or adversarial values. To block this, a safe
      close overwrites the account's 8-byte discriminator with a special closed
      marker of all 0xFF bytes, so any later attempt to deserialize it as its
      original type fails immediately. Anchor's close constraint writes this
      closed discriminator automatically.
  - question: Can I make a Solana account bigger after I create it?
    answer: Yes, using realloc, which resizes the account's buffer in place while
      keeping the same address. When you grow it, the payer covers the extra
      rent needed to stay rent-exempt, and a single realloc can add at most 10
      KB, so bigger growth needs several instructions. Shrinking an account does
      not refund any SOL; if you want the SOL back you have to close the account
      entirely.
  - question: Should I use realloc, many small PDAs, or close-and-recreate for
      growing data?
    answer: It depends on why the data grows. If it grows in lockstep with one
      entity and stays under a small bound, grow one account with realloc. If it
      grows because more entities show up, like more donations or orders, give
      each its own small PDA, which is the usual Solana default. If the data has
      a clear end of life, such as an expired subscription, close-and-recreate
      fits best.
---

> Solana accounts are not garbage-collected. Every byte you allocate stays paid for forever, and the SOL locked for rent-exemption stays locked until someone explicitly reclaims it. Closing an account is the deliberate act of saying "I'm done, give the SOL back, and make sure nobody can resurrect this slot with stale state." Resizing an account is the inverse: keeping the account alive but changing how many bytes it holds. Both are operations the default Anchor model does not perform automatically, and getting them wrong has real consequences. This lecture is the mechanics of doing them safely.

## Why closure exists

When you initialize an account, the runtime reserves space on chain and the payer locks SOL to cover the rent-exempt minimum for that size. A typical 100-byte account locks about 1.5 million lamports. A 1 KB account locks roughly 7 million. The chain has no concept of "this account is done with." Once allocated, the bytes stay reserved and the SOL stays locked, regardless of whether anyone still uses the account.

If a million users each create a small record they never come back to, that's a million accounts of locked SOL drifting on the chain forever. The protocol that issued those records is responsible for cleaning up, either by closing accounts proactively or by exposing a close instruction users can call when they're done.

Closure reclaims the SOL. The owner program drains the account's lamports to a recipient, wipes the data, and marks the account so the runtime knows it's gone. The recipient is whoever the program designates. Often the user who originally paid. Sometimes the protocol treasury. Sometimes whoever called the close, as an incentive for cleanup work.

## The three-step close

A safe close has three steps. Anchor's `close = recipient` constraint performs all three for you, but understanding what they do is worth more than the syntax.

<svg role="img" viewBox="0 0 720 590" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The three steps of closing an account: drain lamports, zero data, overwrite discriminator</title><desc>The diagram shows a normal account with lamports and data, then three stacked steps that close it: step 1 transfers all lamports to the recipient, step 2 zeros the data buffer, and step 3 overwrites the discriminator with CLOSED_ACCOUNT_DISCRIMINATOR. Each step lists what happens if it is skipped, such as stranded SOL, readable stale fields, or a revival attack.</desc>
  <defs>
    <marker id="arr52A" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The three steps of closing an account</text>
  <rect x="40" y="80" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">before: a normal account</text>
  <text x="55" y="128" font-family="monospace" font-size="10" fill="#565653">lamports:      2,039,280  (rent-exempt minimum)</text>
  <text x="55" y="146" font-family="monospace" font-size="10" fill="#565653">data:          disc | field1 | field2 | ...    (real bytes)</text>
  <line x1="360" y1="170" x2="360" y2="190" stroke="#565653" stroke-width="2" marker-end="url(#arr52A)"/>
  <rect x="40" y="195" width="640" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="195" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="214" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">step 1: transfer all lamports to recipient</text>
  <text x="55" y="244" font-family="monospace" font-size="10" fill="#565653">lamports:      0    (account is now below rent-exempt)</text>
  <text x="55" y="262" font-family="monospace" font-size="10" fill="#565653">recipient:     +2,039,280</text>
  <text x="55" y="283" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">if skipped: account stays paid for forever, SOL is stranded</text>
  <line x1="360" y1="303" x2="360" y2="323" stroke="#565653" stroke-width="2" marker-end="url(#arr52A)"/>
  <rect x="40" y="328" width="640" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="328" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="347" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">step 2: zero the data buffer</text>
  <text x="55" y="377" font-family="monospace" font-size="10" fill="#565653">data:          0x00 0x00 0x00 ...   (every byte wiped)</text>
  <text x="55" y="395" font-family="monospace" font-size="10" fill="#565653">old fields are gone, no readable state remains</text>
  <text x="55" y="416" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">if skipped: stale fields readable if account is funded again</text>
  <line x1="360" y1="436" x2="360" y2="456" stroke="#565653" stroke-width="2" marker-end="url(#arr52A)"/>
  <rect x="40" y="461" width="640" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="461" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="480" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">step 3: overwrite discriminator with CLOSED_ACCOUNT_DISCRIMINATOR</text>
  <text x="55" y="510" font-family="monospace" font-size="10" fill="#565653">data[0..8]:    [255, 255, 255, 255, 255, 255, 255, 255]</text>
  <text x="55" y="528" font-family="monospace" font-size="10" fill="#565653">Anchor will refuse to deserialize this account as anything</text>
  <text x="55" y="549" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">if skipped: revival attack — caller funds it, original handler runs on stale state</text>
</svg>

Step 1 returns the rent. Every Solana account holds enough SOL to be rent-exempt, and at close time that SOL is sent somewhere. The "recipient" in `close = recipient` is the account that receives it. Until the rent drains below the exempt threshold, the runtime keeps the account alive on chain. Skip this step and you've leaked rent into a dead account, exactly the situation closure is meant to prevent.

Step 2 zeros the data. Stale fields are a problem the program needs to handle. Even after the lamports are gone, the byte buffer still contains the old struct's contents until the runtime garbage-collects the account at the end of the transaction. If anything in the rest of the transaction reads that account's data, it sees the old state.

Step 3 is the most commonly missed. The first 8 bytes of every Anchor account are a discriminator, a hash identifying which struct type the bytes represent. After steps 1 and 2, the account's data is all zeros. If an attacker funds the account back to rent-exempt in a separate transaction, since anyone can transfer lamports to any pubkey, the runtime keeps the account alive. The discriminator is still gone, but the old discriminator hash could be re-attached by the program itself if someone calls a path that doesn't check carefully. To eliminate this risk entirely, Anchor writes a special "closed" discriminator of all `0xFF` bytes. Any subsequent attempt to deserialize the account as its original type fails immediately.

The historical name for the attack this prevents is the "revival attack." Early Anchor versions would close an account without writing the closed-account discriminator. An attacker could re-fund the account in a follow-up transaction, then call an instruction that re-initialized the donor_record assuming it was fresh, and slip in adversarial values. The closed discriminator pattern killed that class of attack. When you use the `close = recipient` constraint, all three steps are handled automatically.

## Using the close constraint

The mechanical syntax is short:

```rust
#[derive(Accounts)]
pub struct CloseDonorRecord<'info> {
    #[account(
        mut,
        close = donor,
        seeds = [b"donor", donor.key().as_ref()],
        bump = donor_record.bump,
        has_one = donor,
    )]
    pub donor_record: Account<'info, DonorRecord>,

    #[account(mut)]
    pub donor: Signer<'info>,
}

pub fn close_donor_record(_ctx: Context<CloseDonorRecord>) -> Result<()> {
    // The close constraint does all the work.
    // Logic here would run before close, if you needed any.
    Ok(())
}
```

Three things to notice. The `close = donor` sends the rent SOL back to the donor's wallet. The `has_one = donor` constraint enforces that the signer is the same donor whose pubkey is stored on the record, blocking a stranger from closing someone else's account. The handler body is essentially empty because the constraint does everything. If you need to do work before the close, such as recording an event, checking invariants, or returning leftover token balances from a vault PDA, put it in the handler body before `Ok(())`. The close happens after the handler returns.

## Where the rent goes

The recipient of a close is a design decision with real implications. Three common patterns show up in production programs.

Refund to the user is the default for accounts a user created and abandoned. A donation record after the user has withdrawn. A subscription account after the subscription expired. The user paid for the account at init, the user gets the SOL back on close. This is the friendliest UX: the user can recoup their costs whenever they're done.

Refund to the protocol is for accounts the protocol manages on the user's behalf. Sometimes a protocol pays the rent up front to subsidize UX, and on close the rent goes back to the treasury rather than to the user. The user pays nothing either way, so they don't notice the difference. The protocol does, because rent recovery is a real line item for any program operating at scale.

Refund to the caller is the cleanup-incentive pattern. If anyone can call the close instruction once some condition is met, say an expired auction or a fully matched order, and the rent SOL goes to the caller, you get cleanup for free. Liquidators, keeper bots, and arbitrageurs will happily call your close function for the few thousand lamports of reclaimed rent. This pattern only works when the account is genuinely safe to close from any caller. The access-control logic has to be inside the close instruction's preconditions.

The choice depends on who paid, who benefits from cleanup, and who you want to incentivize. For most user-facing accounts, refund-to-user is right. For protocol-internal accounts, treasury. For accounts that should be closed by anyone after a deadline, caller.

## Realloc: when accounts grow

The opposite operation: an account exists, it works, but the data inside it needs more room. Realloc resizes the buffer in place, paying the rent delta when growing, without forcing you to close and recreate.

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Growing an account with realloc: before (100 bytes) and after (200 bytes)</title><desc>Shows an account before and after realloc: before it is 100 bytes with 50 used and 50 empty, after it is 200 bytes with the same 50 used bytes preserved plus 100 new bytes that are zeroed or left untouched depending on realloc::zero. A third box shows the rent delta the payer covers to keep the bigger account rent-exempt, about 700,000 lamports, and notes that shrinking gives no refund and growth is capped at 10 KB per instruction.</desc>
  <defs>
    <marker id="arr52B" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Growing an account with realloc</text>
  <rect x="40" y="80" width="640" height="105" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">before: 100-byte account, 50 bytes used</text>
  <text x="55" y="128" font-family="monospace" font-size="10" font-weight="bold">data buffer (100 bytes):</text>
  <rect x="55" y="138" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="210" y="158" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">used (50 bytes)</text>
  <rect x="365" y="138" width="310" height="32" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <text x="520" y="158" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">empty (50 bytes)</text>
  <line x1="360" y1="195" x2="360" y2="215" stroke="#565653" stroke-width="2" marker-end="url(#arr52B)"/>
  <text x="380" y="210" font-family="monospace" font-size="10" fill="#565653">realloc = 200</text>
  <rect x="40" y="220" width="640" height="165" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="220" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="239" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">after: 200-byte account, original data preserved</text>
  <text x="55" y="268" font-family="monospace" font-size="10" font-weight="bold">data buffer (200 bytes):</text>
  <rect x="55" y="278" width="155" height="32" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="132" y="298" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">used (50 bytes)</text>
  <rect x="210" y="278" width="155" height="32" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <text x="287" y="298" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">empty (50 bytes)</text>
  <rect x="365" y="278" width="310" height="32" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <text x="520" y="294" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">new bytes (100 bytes)</text>
  <text x="520" y="306" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">zeroed if realloc::zero = true</text>
  <text x="55" y="335" font-family="monospace" font-size="10" font-weight="bold">old contents:</text>
  <text x="160" y="335" font-family="monospace" font-size="10" fill="#565653">preserved byte-for-byte at the start of the buffer</text>
  <text x="55" y="353" font-family="monospace" font-size="10" font-weight="bold">new bytes:</text>
  <text x="160" y="353" font-family="monospace" font-size="10" fill="#565653">zeroed (with realloc::zero = true) or untouched (= false)</text>
  <text x="55" y="371" font-family="monospace" font-size="10" font-weight="bold">payer:</text>
  <text x="160" y="371" font-family="monospace" font-size="10" fill="#565653">transfers the rent delta to keep the account exempt</text>
  <rect x="40" y="400" width="640" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="400" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="419" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">the rent delta the payer covers</text>
  <text x="55" y="448" font-family="monospace" font-size="10" fill="#565653">rent_exempt(200 bytes) - rent_exempt(100 bytes) = roughly 700,000 lamports</text>
  <text x="55" y="466" font-family="monospace" font-size="10" fill="#565653">shrinking is the mirror: the account keeps the surplus, no refund happens</text>
  <text x="55" y="484" font-family="monospace" font-size="9" fill="#565653" font-style="italic">hard cap: 10 KB growth per instruction, split larger growth across multiple calls</text>
</svg>

Growing pays the rent delta. Shrinking does not refund. The account keeps any surplus lamports it had before, which means a 200-byte account shrunk to 100 bytes ends up sitting at the 200-byte rent-exempt minimum, more lamports than the 100-byte minimum requires. That's harmless from the chain's perspective. It just means you don't recover SOL by shrinking. If you want the SOL back, you close the account.

The Anchor constraint:

```rust
#[derive(Accounts)]
#[instruction(new_size: usize)]
pub struct GrowList<'info> {
    #[account(
        mut,
        realloc = 8 + new_size,
        realloc::payer = payer,
        realloc::zero = true,
        seeds = [b"list", list.owner.as_ref()],
        bump = list.bump,
    )]
    pub list: Account<'info, MessageList>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
```

`realloc = NEW_SIZE` sets the new total byte count, discriminator included. `realloc::payer` names the signer who covers the rent delta when growing. `realloc::zero = true` tells the runtime to zero the new bytes. Set it to `false` only when you're going to overwrite those bytes anyway in the same instruction, and you want the small CU saving. Most of the time, `true` is the safe default.

The hard ceiling on a single realloc operation is 10 KB of growth per instruction. If you need an account to grow by 50 KB, you need five separate instructions, each adding up to 10 KB. The cap exists to keep transaction execution from doing unbounded work in one shot. For most use cases, growing by 1 KB or 2 KB per call is plenty, and bumping by smaller chunks is more idiomatic anyway.

## Realloc, many PDAs, or close-and-recreate?

Realloc is one of three tools for handling data that doesn't fit in a single fixed account. It is worth knowing when to use each.

<svg role="img" viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Realloc, many small PDAs, or close-and-recreate: three account strategies</title><desc>Three columns compare ways to handle growing account data: grow one account with realloc, use many small PDAs (marked as the Solana default), or close and recreate the account. Each column lists its approach, good-for cases, tradeoffs, and an example, such as a message board, donations or votes, and a vesting record.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Realloc, many PDAs, or close-and-recreate?</text>
  <rect x="40" y="80" width="205" height="395" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="205" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="142" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">grow one account</text>
  <text x="55" y="130" font-family="monospace" font-size="10" font-weight="bold">approach:</text>
  <text x="55" y="146" font-family="monospace" font-size="10" fill="#565653">realloc as needed</text>
  <text x="55" y="172" font-family="monospace" font-size="10" font-weight="bold">good for:</text>
  <text x="55" y="190" font-family="monospace" font-size="9" fill="#565653">- bounded list that</text>
  <text x="55" y="204" font-family="monospace" font-size="9" fill="#565653">  fits in 10 KB total</text>
  <text x="55" y="218" font-family="monospace" font-size="9" fill="#565653">- single thread of</text>
  <text x="55" y="232" font-family="monospace" font-size="9" fill="#565653">  data per account</text>
  <text x="55" y="246" font-family="monospace" font-size="9" fill="#565653">- predictable growth</text>
  <text x="55" y="260" font-family="monospace" font-size="9" fill="#565653">  by fixed chunks</text>
  <text x="55" y="288" font-family="monospace" font-size="10" font-weight="bold">tradeoffs:</text>
  <text x="55" y="306" font-family="monospace" font-size="9" fill="#565653">payer covers rent</text>
  <text x="55" y="320" font-family="monospace" font-size="9" fill="#565653">delta each time;</text>
  <text x="55" y="334" font-family="monospace" font-size="9" fill="#565653">10 KB hard ceiling</text>
  <text x="55" y="348" font-family="monospace" font-size="9" fill="#565653">per instruction.</text>
  <text x="55" y="376" font-family="monospace" font-size="10" font-weight="bold">example:</text>
  <text x="55" y="394" font-family="monospace" font-size="9" fill="#565653">message board with</text>
  <text x="55" y="408" font-family="monospace" font-size="9" fill="#565653">a growing post list</text>
  <text x="142" y="455" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">simple, single home</text>
  <rect x="257" y="80" width="206" height="395" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="257" y="80" width="206" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">many small PDAs</text>
  <text x="272" y="130" font-family="monospace" font-size="10" font-weight="bold">approach:</text>
  <text x="272" y="146" font-family="monospace" font-size="10" fill="#565653">one PDA per item,</text>
  <text x="272" y="162" font-family="monospace" font-size="10" fill="#565653">indexed by seed</text>
  <text x="272" y="188" font-family="monospace" font-size="10" font-weight="bold">good for:</text>
  <text x="272" y="206" font-family="monospace" font-size="9" fill="#565653">- unbounded growth</text>
  <text x="272" y="220" font-family="monospace" font-size="9" fill="#565653">- per-user data that</text>
  <text x="272" y="234" font-family="monospace" font-size="9" fill="#565653">  scales per donor</text>
  <text x="272" y="248" font-family="monospace" font-size="9" fill="#565653">- close-on-exit</text>
  <text x="272" y="262" font-family="monospace" font-size="9" fill="#565653">  refund pattern</text>
  <text x="272" y="290" font-family="monospace" font-size="10" font-weight="bold">tradeoffs:</text>
  <text x="272" y="308" font-family="monospace" font-size="9" fill="#565653">discriminator on</text>
  <text x="272" y="322" font-family="monospace" font-size="9" fill="#565653">every account costs</text>
  <text x="272" y="336" font-family="monospace" font-size="9" fill="#565653">8 bytes; many tx</text>
  <text x="272" y="350" font-family="monospace" font-size="9" fill="#565653">accounts to manage</text>
  <text x="272" y="378" font-family="monospace" font-size="10" font-weight="bold">example:</text>
  <text x="272" y="396" font-family="monospace" font-size="9" fill="#565653">donations, votes,</text>
  <text x="272" y="410" font-family="monospace" font-size="9" fill="#565653">orders, positions</text>
  <text x="360" y="455" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">the Solana default</text>
  <rect x="475" y="80" width="205" height="395" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="475" y="80" width="205" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="577" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">close and recreate</text>
  <text x="490" y="130" font-family="monospace" font-size="10" font-weight="bold">approach:</text>
  <text x="490" y="146" font-family="monospace" font-size="10" fill="#565653">close old account,</text>
  <text x="490" y="162" font-family="monospace" font-size="10" fill="#565653">init fresh one</text>
  <text x="490" y="188" font-family="monospace" font-size="10" font-weight="bold">good for:</text>
  <text x="490" y="206" font-family="monospace" font-size="9" fill="#565653">- end-of-lifecycle</text>
  <text x="490" y="220" font-family="monospace" font-size="9" fill="#565653">  cleanup</text>
  <text x="490" y="234" font-family="monospace" font-size="9" fill="#565653">- reclaiming rent</text>
  <text x="490" y="248" font-family="monospace" font-size="9" fill="#565653">  for the user</text>
  <text x="490" y="262" font-family="monospace" font-size="9" fill="#565653">- starting over with</text>
  <text x="490" y="276" font-family="monospace" font-size="9" fill="#565653">  a fresh schema</text>
  <text x="490" y="306" font-family="monospace" font-size="10" font-weight="bold">tradeoffs:</text>
  <text x="490" y="324" font-family="monospace" font-size="9" fill="#565653">data is gone after</text>
  <text x="490" y="338" font-family="monospace" font-size="9" fill="#565653">close; need 2 tx if</text>
  <text x="490" y="352" font-family="monospace" font-size="9" fill="#565653">user keeps using</text>
  <text x="490" y="366" font-family="monospace" font-size="9" fill="#565653">the program</text>
  <text x="490" y="394" font-family="monospace" font-size="10" font-weight="bold">example:</text>
  <text x="490" y="412" font-family="monospace" font-size="9" fill="#565653">withdraw + close</text>
  <text x="490" y="426" font-family="monospace" font-size="9" fill="#565653">vesting record</text>
  <text x="577" y="455" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">returns rent to user</text>
  <text x="360" y="505" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">For most "this user has many items" cases, many small PDAs is the right call. Realloc is the exception.</text>
</svg>

A useful way to read this chart: if the data grows in lockstep with one entity, say one account holding one list of bounded entries, realloc fits. If the data grows because more entities show up, more donations, more orders, more positions, separate PDAs fit. If the data has an explicit end of life, the subscription expired or the vault drained or the position closed, close-and-recreate fits.

The Donor Tiers Vault from the first milestone is the canonical many-PDAs case. Each donation gets its own PDA. The donor record stays small. Nothing ever needs to realloc, because each new donation is a fresh account at its own address. The reason that design is preferred over one big account per donor is that there's no upper bound on donations a single donor might make. A `Vec<Donation>` inside one account would either need a low cap that rejects more than N donations, or grow forever via realloc. Both are worse than just giving each donation its own home.

Realloc earns its place when the bound is real and small. A message board where each board has up to a few hundred posts, capped at maybe 8 KB total, is fine to grow with realloc. A position-history log that tops out at 1 KB is fine. Anything that could plausibly need more than 10 KB total or might want to grow past the cap in one transaction needs a different design.

## What you actually do day to day

For most accounts, you'll never need realloc or explicit close handling. The default Anchor account pattern is: pick a fixed size at init, store data in it, leave it. When users go inactive, their accounts sit there harmlessly. The protocol doesn't need to clean up unless rent recovery matters for your scale.

When you do need closure, use `close = recipient`. Pick the recipient deliberately based on who paid and who benefits from cleanup. Add a `has_one` constraint or equivalent auth check to gate who can close. Anchor handles the three-step process for you, including the closed-account discriminator that prevents revival attacks.

When you do need realloc, the questions to answer are: how much growth, how often, who pays? Set a sensible growth chunk of 1 KB or 2 KB, have the user pay the delta, and use `realloc::zero = true` unless you're certain you don't need the safety. Watch the 10 KB cap. If you keep hitting that ceiling, your design probably wants many small PDAs instead.

The accounts your program releases at v1 are the accounts that determine its operating cost forever. Lay out the storage with closure and realloc in mind from the start, and these become small tools you use occasionally. Lay it out carelessly, and these become migration problems you address repeatedly.
