---
id: 192
title: Account space and layout
type: lecture
order: 50
faq:
  - question: Why does every space calculation start with 8?
    answer: >-
      Those 8 bytes are the discriminator, a hash of the type's name, so a Vault starts with the
      hash of "account:Vault". Anchor checks it before deserializing, which stops a Pool account
      of the same size being read as a Vault.
  - question: What happens if I leave the 8 bytes out of space?
    answer: >-
      The account is 8 bytes short and Anchor's first write of the discriminator runs past the
      end of the data.
  - question: How many bytes does each type take?
    answer: >-
      A Pubkey is 32. A bool is 1, because Borsh does not pack bits. Integers are their bit
      count divided by 8, so u64 is 8 and u128 is 16. Option<T> is 1 + the size of T, and [T; N]
      is N copies of T.
  - question: Do I have to add all that up by hand?
    answer: >-
      No. #[derive(InitSpace)] sums your fields into an INIT_SPACE constant and you write space
      = 8 + Vault::INIT_SPACE. A Pubkey, a u64 and a u8 bump come to 8 + 32 + 8 + 1 = 49 bytes.
  - question: Why won't Anchor size my account when it has a Vec field?
    answer: >-
      Cap it with #[max_len(N)]. A Vec or String has no fixed length, and account data cannot
      grow. The field reserves 4 bytes for the length plus N times the element size, so a
      Vec<Pubkey> at max_len(100) costs 3,200 bytes, about 0.022 SOL of rent paid once at init.
  - question: Can I add a field to an account type after accounts already exist?
    answer: >-
      Not to the accounts that already exist. Size is fixed at init. realloc resizes one account
      in one instruction, paying or refunding rent. Migrating all of them means a new account
      type, an instruction that copies the data, and close on the old account.
---

> An account's data field is a fixed slab of bytes. When you initialize an account, you tell the runtime how many bytes you want and you pay rent for that many. Every field on your Rust struct has to fit into that slab in a known, fixed amount of room: 8 bytes for a discriminator that says what type the account is, plus the size of each field.

## A Solana account is a fixed-size struct

The data field of an account is allocated to a specific byte count when the account is created. Rent was paid for that many bytes and that's how many the chain reserves for the account. You can write different values into those bytes, but there is no implicit growth.

So you decide the size of an account at init. Changing it later takes an explicit `realloc` in a separate instruction, which costs additional rent when the account grows. The [account closure and realloc](/courses/development-on-solana/production-state-design/account-closure-and-realloc) lesson covers it. Programs that need to store more data than fits in one account use multiple accounts, each at its own PDA, each sized at creation.

<svg role="img" viewBox="0 0 720 570" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Byte layout of a Vault account: discriminator, authority, total, bump</title><desc>The diagram maps the Rust Vault struct to bytes in the account's data field: an 8-byte discriminator, a 32-byte authority (Pubkey), an 8-byte total (u64), and a 1-byte bump, adding up to 49 bytes. It shows that this size is fixed once the account is created and cannot grow later.</desc>
  <defs>
    <marker id="arrS36aG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The byte layout of a Vault account</text>
  <rect x="40" y="80" width="640" height="130" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="100" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">your Rust struct</text>
  <text x="60" y="128" font-family="monospace" font-size="10">#[account]</text>
  <text x="60" y="146" font-family="monospace" font-size="10">pub struct Vault {</text>
  <text x="80" y="162" font-family="monospace" font-size="10">pub authority: Pubkey,</text>
  <text x="80" y="178" font-family="monospace" font-size="10">pub total: u64,</text>
  <text x="80" y="194" font-family="monospace" font-size="10">pub bump: u8,</text>
  <text x="60" y="204" font-family="monospace" font-size="10">}</text>
  <rect x="40" y="220" width="640" height="195" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="220" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="240" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">what lives in the account's data field</text>
  <text x="60" y="265" font-family="monospace" font-size="9" fill="#565653">byte offset:</text>
  <text x="160" y="265" font-family="monospace" font-size="9" fill="#565653">0</text>
  <text x="280" y="265" font-family="monospace" font-size="9" fill="#565653">8</text>
  <text x="490" y="265" font-family="monospace" font-size="9" fill="#565653">40</text>
  <text x="615" y="265" font-family="monospace" font-size="9" fill="#565653">48</text>
  <rect x="155" y="275" width="120" height="50" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="215" y="297" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">discriminator</text>
  <text x="215" y="313" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff">8 bytes</text>
  <rect x="275" y="275" width="210" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="380" y="297" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">authority (Pubkey)</text>
  <text x="380" y="313" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">32 bytes</text>
  <rect x="485" y="275" width="125" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="547" y="297" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">total (u64)</text>
  <text x="547" y="313" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">8 bytes</text>
  <rect x="610" y="275" width="50" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="635" y="297" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">bump</text>
  <text x="635" y="313" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">1 byte</text>
  <text x="60" y="357" font-family="monospace" font-size="10">total size:</text>
  <text x="160" y="357" font-family="monospace" font-size="10" font-weight="bold">8</text>
  <text x="180" y="357" font-family="monospace" font-size="10">+</text>
  <text x="200" y="357" font-family="monospace" font-size="10" font-weight="bold">32</text>
  <text x="232" y="357" font-family="monospace" font-size="10">+</text>
  <text x="252" y="357" font-family="monospace" font-size="10" font-weight="bold">8</text>
  <text x="272" y="357" font-family="monospace" font-size="10">+</text>
  <text x="292" y="357" font-family="monospace" font-size="10" font-weight="bold">1</text>
  <text x="320" y="357" font-family="monospace" font-size="10">=</text>
  <text x="345" y="357" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">49 bytes</text>
  <text x="60" y="380" font-family="monospace" font-size="10" fill="#565653">that's the value you put in:</text>
  <text x="60" y="397" font-family="monospace" font-size="10" font-weight="bold">space = 8 + Vault::INIT_SPACE  // 8 + 41 = 49</text>
  <rect x="40" y="435" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="457" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Once created, this size is fixed</text>
  <line x1="55" y1="465" x2="665" y2="465" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="485" font-family="monospace" font-size="10">The account's data field is exactly 49 bytes from the moment it's initialized.</text>
  <text x="60" y="501" font-family="monospace" font-size="10">You cannot add a new field later. You cannot grow the struct implicitly.</text>
  <text x="360" y="550" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A Solana account is a fixed-size struct. Size is decided at init and lives with the account.</text>
</svg>

For this `Vault` the sum is 8 + 32 + 8 + 1 = 49 bytes, and that's the value you pass to `space` when you initialize the account.

## The first 8 bytes say which type the account is

Every Anchor account starts with 8 bytes that aren't part of your struct: a discriminator. The discriminator is a hash derived from the account type's name, stored at the beginning of the data field, and checked by Anchor before deserializing the rest. Its job is to make sure the bytes you're about to interpret as a `Vault` were written by a `Vault`-shaped instruction, and not by some other instruction that happens to produce 49 bytes.

Without the discriminator, a class of bugs called type confusion becomes possible. If you have two account types `Vault` and `Pool` that happen to be the same size, an attacker could initialize a Pool account, pass it to your Vault instruction, and your deserialization would succeed because the bytes parse cleanly as either struct, but with different field meanings. The attacker has effectively turned a Pool into a Vault for the purposes of one call, and any check you wrote that depends on the type of the account silently fails.

The first 8 bytes of a Vault account are the hash of `"account:Vault"`. The first 8 bytes of a Pool account are the hash of `"account:Pool"`. When Anchor sees `Account<'info, Vault>` in your struct, it reads those 8 bytes, compares them to the `Vault` discriminator, and rejects the account on a mismatch. No matter what's in the rest of the data, you can be sure the account is the type you asked for.

The discriminator is stored in the account's data, so `space` always starts with 8. Leave it out and the account is 8 bytes short, and the instruction that creates it fails. Right after allocating the account, Anchor reads it back as a `Vault`, and the bytes after the discriminator are too few to hold one, so the read stops with `AccountDidNotDeserialize`.

## Field sizes are fixed, and Anchor adds them up

Computing the size of an account by hand means knowing the size of each Rust type that goes into it.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Byte sizes of Rust types for account space</title><desc>A table lists Rust types such as bool, integers, Pubkey, arrays, Option&lt;T&gt;, String, and Vec&lt;T&gt;, showing the byte size and notes for each. It ends with the rule: total space equals an 8-byte discriminator plus the sum of all field sizes, which #[derive(InitSpace)] can compute automatically.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">How many bytes does each Rust type take?</text>
  <rect x="40" y="90" width="640" height="30" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="55" y="110" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">type</text>
  <text x="220" y="110" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">size</text>
  <text x="380" y="110" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">notes</text>
  <rect x="40" y="120" width="640" height="135" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="55" y="142" font-family="monospace" font-size="10">bool</text>
  <text x="220" y="142" font-family="monospace" font-size="10">1 byte</text>
  <text x="380" y="142" font-family="monospace" font-size="10" fill="#565653">stored as 0 or 1</text>
  <text x="55" y="162" font-family="monospace" font-size="10">u8, i8</text>
  <text x="220" y="162" font-family="monospace" font-size="10">1 byte</text>
  <text x="55" y="182" font-family="monospace" font-size="10">u16, i16</text>
  <text x="220" y="182" font-family="monospace" font-size="10">2 bytes</text>
  <text x="55" y="202" font-family="monospace" font-size="10">u32, i32, f32</text>
  <text x="220" y="202" font-family="monospace" font-size="10">4 bytes</text>
  <text x="55" y="222" font-family="monospace" font-size="10">u64, i64, f64</text>
  <text x="220" y="222" font-family="monospace" font-size="10">8 bytes</text>
  <text x="55" y="242" font-family="monospace" font-size="10">u128, i128</text>
  <text x="220" y="242" font-family="monospace" font-size="10">16 bytes</text>
  <rect x="40" y="265" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="55" y="287" font-family="monospace" font-size="10">Pubkey</text>
  <text x="220" y="287" font-family="monospace" font-size="10">32 bytes</text>
  <text x="380" y="287" font-family="monospace" font-size="10" fill="#565653">an address</text>
  <text x="55" y="307" font-family="monospace" font-size="10">[T; N]</text>
  <text x="220" y="307" font-family="monospace" font-size="10">N × size_of(T)</text>
  <text x="380" y="307" font-family="monospace" font-size="10" fill="#565653">fixed-size array, length in the type</text>
  <text x="55" y="327" font-family="monospace" font-size="10">Option&lt;T&gt;</text>
  <text x="220" y="327" font-family="monospace" font-size="10">1 + size_of(T)</text>
  <text x="380" y="327" font-family="monospace" font-size="10" fill="#565653">1-byte tag (Some/None) + the inner</text>
  <rect x="40" y="355" width="640" height="115" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="355" width="640" height="24" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="372" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">variable-length: need explicit bounds</text>
  <text x="55" y="397" font-family="monospace" font-size="10">String</text>
  <text x="220" y="397" font-family="monospace" font-size="10">4 + max_len bytes</text>
  <text x="380" y="397" font-family="monospace" font-size="10" fill="#565653">4-byte length prefix + the UTF-8 bytes</text>
  <text x="380" y="411" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">requires #[max_len(N)]</text>
  <text x="55" y="434" font-family="monospace" font-size="10">Vec&lt;T&gt;</text>
  <text x="220" y="434" font-family="monospace" font-size="10">4 + N × size_of(T)</text>
  <text x="380" y="434" font-family="monospace" font-size="10" fill="#565653">4-byte length prefix + N elements</text>
  <text x="380" y="448" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">requires #[max_len(N)]</text>
  <text x="60" y="463" font-family="monospace" font-size="9" fill="#565653" font-style="italic">without max_len, Anchor doesn't know how much to allocate. you must tell it.</text>
  <text x="360" y="510" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">total space = 8 (discriminator) + sum of all fields</text>
  <text x="360" y="535" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Or let #[derive(InitSpace)] compute it for you. The macro reads your fields and adds them up.</text>
</svg>

You almost never compute this by hand. Anchor provides a `#[derive(InitSpace)]` macro that adds an `INIT_SPACE` constant to your struct, equal to the sum of the field sizes. You then write `space = 8 + Vault::INIT_SPACE`, and the compiler computes the right number. When you change the struct's fields, the constant updates automatically.

## A Vec or String needs a maximum length

`String` and `Vec<T>` are variable-length: in normal Rust, they grow as you push to them. The account's data field does not grow when you push, so Anchor needs to know, at init time, how many bytes to reserve for each variable-length field.

You tell it with `#[max_len(N)]`, an attribute on the field that gives the maximum number of elements the field will ever hold. The space allocated for the field is `4 + max_len × size_of_element`, where the 4 bytes hold the current length and the rest hold the elements. `#[derive(InitSpace)]` uses that number when it computes `INIT_SPACE`:

```rust
#[account]
#[derive(InitSpace)]
pub struct Proposal {
    #[max_len(100)]
    pub votes: Vec<Pubkey>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = creator, space = 8 + Proposal::INIT_SPACE)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

Here `Proposal::INIT_SPACE` is 4 + 100 × 32 = 3,204, and the account gets 8 + 3,204 = 3,212 bytes.

`#[max_len]` only sizes the account and does not stop a push. Inside the handler `votes` is an ordinary `Vec` in memory, and a 101st push succeeds there. The failure comes when the handler returns and Anchor writes the account back into its 3,212 bytes: the vector no longer fits, and the transaction fails with `AccountDidNotSerialize`. To fail with your own error instead, check `votes.len()` before you push.

<svg role="img" viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Unbounded Vec vs #[max_len(100)] bounded Vec account space</title><desc>The diagram compares two versions of a Proposal account with a votes: Vec&lt;Pubkey&gt; field. On the left, no bounds are set, so at init time Anchor cannot compute the space and a guess is either too low (push overflows, tx reverts) or too high (wasted rent). On the right, #[max_len(100)] fixes space at 8 + 4 + 100*32 = 3,212 bytes, so pushes succeed up to the 100th vote and the 101st push returns an error.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Why Vec without bounds is a real bug</text>
  <rect x="40" y="90" width="310" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">no bounds (broken)</text>
  <text x="55" y="145" font-family="monospace" font-size="10">#[account]</text>
  <text x="55" y="161" font-family="monospace" font-size="10">pub struct Proposal {</text>
  <text x="65" y="177" font-family="monospace" font-size="10">pub votes: Vec&lt;Pubkey&gt;,</text>
  <text x="55" y="193" font-family="monospace" font-size="10">}</text>
  <line x1="55" y1="210" x2="335" y2="210" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="232" font-family="monospace" font-size="10" font-weight="bold">at init time:</text>
  <text x="55" y="250" font-family="monospace" font-size="10">space = 8 + ???</text>
  <text x="195" y="280" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">Anchor doesn't know.</text>
  <text x="55" y="310" font-family="monospace" font-size="10" font-weight="bold">two ways this breaks:</text>
  <text x="55" y="332" font-family="monospace" font-size="10">1. you guess too low →</text>
  <text x="70" y="346" font-family="monospace" font-size="10">push() overflows the</text>
  <text x="70" y="360" font-family="monospace" font-size="10">account, tx reverts</text>
  <text x="55" y="386" font-family="monospace" font-size="10">2. you guess too high →</text>
  <text x="70" y="400" font-family="monospace" font-size="10">user paid rent for</text>
  <text x="70" y="414" font-family="monospace" font-size="10">bytes nobody uses</text>
  <text x="195" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">either way, the size is wrong</text>
  <rect x="370" y="90" width="310" height="380" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">bounded with max_len</text>
  <text x="385" y="145" font-family="monospace" font-size="10">#[account]</text>
  <text x="385" y="161" font-family="monospace" font-size="10">#[derive(InitSpace)]</text>
  <text x="385" y="177" font-family="monospace" font-size="10">pub struct Proposal {</text>
  <text x="395" y="193" font-family="monospace" font-size="10">#[max_len(100)]</text>
  <text x="395" y="209" font-family="monospace" font-size="10">pub votes: Vec&lt;Pubkey&gt;,</text>
  <text x="385" y="225" font-family="monospace" font-size="10">}</text>
  <line x1="385" y1="240" x2="665" y2="240" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="385" y="262" font-family="monospace" font-size="10" font-weight="bold">at init time:</text>
  <text x="385" y="280" font-family="monospace" font-size="10">space = 8 + 4 + 100*32</text>
  <text x="385" y="294" font-family="monospace" font-size="10">      = 3,212 bytes</text>
  <text x="525" y="320" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">predictable, fixed at init</text>
  <text x="385" y="350" font-family="monospace" font-size="10" font-weight="bold">runtime behavior:</text>
  <text x="385" y="370" font-family="monospace" font-size="10">push 101st vote →</text>
  <text x="400" y="384" font-family="monospace" font-size="10">handler returns an error</text>
  <text x="385" y="402" font-family="monospace" font-size="10">push 100th vote →</text>
  <text x="400" y="416" font-family="monospace" font-size="10">succeeds, room runs out</text>
  <text x="525" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">bounded, predictable, paid for once</text>
  <text x="360" y="505" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">If you can't bound it, you can't put it on an account. Move overflow data to a separate PDA per item.</text>
</svg>

The bound is a design decision. Set it too low and your application breaks when users hit the cap. Set it too high and every account pays rent for bytes that may never be used. A 100-pubkey vote list at 32 bytes each is 3,200 bytes for the vector alone, which is enough to cost the user about 0.022 SOL in rent. That cost is paid up front, once, when the account is initialized. The user pays for a 100-vote bound whether they end up using 5 votes or 100.

Most production programs avoid putting variable-length data on a single account when the bound would be large or unbounded. Instead, each element gets its own PDA, derived from the parent account's key and an index or sub-identifier. A proposal with thousands of votes wouldn't store them in a `Vec` on the proposal account. It would store each vote in a separate `Vote` PDA derived from `(proposal, voter)`. The proposal account stays small and predictable, and there's no architectural cap on how many votes can be cast.

## The layout of existing accounts is hard to change

You can deploy a new version of your program that interprets the existing bytes differently, but the accounts created by the old version keep their size. The `realloc` constraint lets you change the size of a specific account in a specific instruction, paying or refunding rent as you go, but it doesn't help you migrate every existing account at once. Moving all of them to a new layout takes a new account type and a migration instruction that copies each old account into a new one and closes the old account, once per account.

So in practice you get one chance to pick the layout. Reserve a few bytes for future use if you think the struct might grow, and be conservative with `Vec` and `String` bounds. For each field, ask how big it needs to be and what happens if you are wrong.
