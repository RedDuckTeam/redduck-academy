# Account space and layout

_type: lecture_

> An account's data field is a fixed slab of bytes. When you initialize an account, you tell the runtime how many bytes you want, you pay rent for that many, and the size never changes. Every field on your Rust struct has to fit into that slab in a known, fixed amount of room. The math is simple: 8 bytes for a discriminator that says what type the account is, plus the size of each field added together. Everything that follows is variations on that one sentence.

## A Solana account is a fixed-size struct

In dynamic languages, you can keep adding fields to a dictionary forever. The runtime grows the storage as you go, and you don't think about how many bytes a value takes. In typed systems languages like C and Rust, a struct has a fixed size at declaration. The compiler computes it once, allocates exactly that much memory, and won't let you grow the struct after the fact.

Solana accounts follow the second model. The data field of an account is allocated to a specific byte count when the account is created. That allocation is the account's storage forever. You can write different values into those bytes, but you cannot add a new byte that wasn't there at creation, and you cannot remove bytes you allocated. The size is part of the account's identity in a real sense, because rent was paid for that many bytes and that's how many the chain reserves for the account.

This is the most important thing to internalize about layout: **you decide the size of an account at init, and you live with that decision.** Programs that need accounts to grow later use `realloc`, which costs additional rent and has its own constraints. Programs that need to store more data than fits in one account use multiple accounts, each at its own PDA, each sized at creation. There is no implicit growth.

<svg viewBox="0 0 720 570" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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

The diagram above lays out exactly what's inside the data field of a Vault account. Eight bytes of discriminator, 32 bytes for the authority pubkey, 8 bytes for the u64 total, 1 byte for the bump. The sum is 49 bytes. That's the value you pass to `space` when you initialize the account.

## The 8-byte discriminator

Every Anchor account starts with 8 bytes that aren't part of your struct: a discriminator. The discriminator is a hash derived from the account type's name, stored at the beginning of the data field, and checked by Anchor before deserializing the rest. Its job is to make sure the bytes you're about to interpret as a `Vault` were actually written by a `Vault`-shaped instruction, and not by some other instruction that happens to produce 49 bytes.

Without the discriminator, a class of bugs called type confusion becomes possible. If you have two account types `Vault` and `Pool` that happen to be the same size, an attacker could initialize a Pool account, pass it to your Vault instruction, and your deserialization would succeed because the bytes parse cleanly as either struct. With different field meanings. The attacker has effectively turned a Pool into a Vault for the purposes of one call, and any check you wrote that depends on the type of the account silently fails.

The discriminator stops that. The first 8 bytes of a Vault account are the hash of `"account:Vault"`. The first 8 bytes of a Pool account are the hash of `"account:Pool"`. When Anchor sees `Account<'info, Vault>` in your struct, it reads those 8 bytes and compares them to the `Vault` discriminator. Mismatch means rejection. No matter what's in the rest of the data, you can be sure the account is the type you asked for.

This is also why the formula is always `8 + sum_of_fields` and never just `sum_of_fields`. The 8 bytes are real bytes that need real allocation. Forget them and your account is 8 bytes short and Anchor's first attempt to write the discriminator overflows.

## How many bytes each type takes

Computing the size of an account by hand means knowing the size of each Rust type that goes into it. The numbers are fixed and easy to memorize.

<svg viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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

For everyday programs, the table above is enough. A `Pubkey` is 32 bytes. The fixed-width integers are their size in bits divided by 8. A `bool` is 1 byte even though it could fit in 1 bit, because Borsh serialization, the format Anchor uses, doesn't bit-pack. An `Option<T>` adds a 1-byte discriminator, similar in spirit to the account's main discriminator, that says whether the option is `Some` or `None`. A fixed-size array `[T; N]` is exactly N copies of T, with no overhead beyond the elements themselves.

The arithmetic for a struct is what you'd expect: sum the field sizes, add 8 for the discriminator, that's your space. For the Vault from earlier: 8 + 32 + 8 + 1 = 49.

You almost never compute this by hand. Anchor provides a `#[derive(InitSpace)]` macro that adds an `INIT_SPACE` constant to your struct, equal to the sum of the field sizes. You then write `space = 8 + Vault::INIT_SPACE`, and the compiler computes the right number. When you change the struct's fields, the constant updates automatically. This is the idiomatic form and what you should reach for in every program.

## Variable-length fields and the bounds you must give them

The trouble starts when you reach for `String` or `Vec<T>`. These types are variable-length by nature: in normal Rust, they grow as you push to them. On Solana, that's impossible. The account's data field can't grow. So Anchor needs to know, at init time, how many bytes to reserve for each variable-length field.

This is what `#[max_len(N)]` does. You write it as an attribute on the field, and it tells Anchor the maximum number of elements the field will ever hold. The space allocated for the field is `4 + max_len × size_of_element`, where the 4 bytes hold the current length and the rest hold the elements. The current length grows as you push, and the runtime rejects any push that would take you over the cap.

<svg viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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

The bound is a design decision. Set it too low and your application breaks when users hit the cap. Set it too high and every account pays rent for bytes that may never be used. A 100-pubkey vote list at 32 bytes each is 3,200 bytes just for the vector, which is enough to cost the user about 0.022 SOL in rent. That cost is paid up front, once, when the account is initialized. The user pays for a 100-vote bound whether they end up using 5 votes or 100.

The way most production programs handle this is to avoid putting variable-length data on a single account when the bound would be large or unbounded. Instead, each element gets its own PDA, derived from the parent account's key and an index or sub-identifier. A proposal with thousands of votes wouldn't store them in a `Vec` on the proposal account. It would store each vote in a separate `Vote` PDA derived from `(proposal, voter)`. The proposal account stays small and predictable, and there's no architectural cap on how many votes can be cast.

## Schema migration is hard, so design carefully

Once an account is created with a given size, you cannot meaningfully change the struct it represents. You can deploy a new version of your program that interprets the existing bytes differently, but you can't grow old accounts to fit a new field, and you can't shrink them to remove one. The `realloc` constraint lets you change the size of a specific account in a specific instruction, paying or refunding rent as you go, but it doesn't help you migrate every existing account at once.

In practice, you get one chance to pick the layout, and you live with it. This shapes how programs are designed. Reserve a few bytes for future use if you think the struct might grow. Avoid putting derived data on the account, since recomputing it from inputs costs less than reserving space for it. Be conservative with `Vec` and `String` bounds.

If a serious migration is unavoidable, the standard pattern is to deploy a new program version with a new account type, write a migration instruction that takes an old account and a fresh new account, copies the relevant data across, and closes the old account to refund its rent. The migration runs once per account, paid for by either the user or the protocol depending on the situation. It's tedious enough that you want to design the original layout carefully to make sure you never have to do it.

## What you actually do day to day

For most accounts you'll write, the workflow is short. Define your `#[account]` struct. Add `#[derive(InitSpace)]` above it so the macro computes the size for you. For any `String` or `Vec`, add `#[max_len(N)]` with a bound you've thought about. In your init instruction, set `space = 8 + YourStruct::INIT_SPACE`. The compiler does the arithmetic, the runtime allocates the bytes, and your account is the right size.

When you change the struct, the size updates automatically. When you add a new bounded vector, you set its bound, and the rest takes care of itself. The whole topic collapses to one question per field: how big does this need to be, and what happens if I'm wrong? Answer that, and the rest is mechanical.
