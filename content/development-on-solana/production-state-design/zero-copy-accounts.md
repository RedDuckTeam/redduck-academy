---
id: 202
title: Zero-copy accounts
type: lecture
order: 1
faq:
  - question: Why does my program stack-overflow when an account gets big?
    answer: >-
      Account<T> copies the whole account onto the stack on every call, and a handler gets about
      4 KB of stack. Box<Account<T>> moves it to the heap.
  - question: Which of Account, Box<Account>, and AccountLoader should I pick?
    answer: >-
      Default, then Box, then zero-copy. Around 90 percent of accounts never leave the default,
      and zero-copy is for accounts that are large and sit on a hot path, like an order book.
  - question: Why won't a Vec or String compile inside a zero-copy account?
    answer: >-
      The cast only works when the struct's layout matches the on-chain bytes exactly, and
      bytemuck::Pod enforces that with #[repr(C)], fixed sizes and fixed field order.
      Variable-length types break it. Use fixed-capacity arrays and track how full they are with
      your own len or head and tail fields.
  - question: Is bool allowed in a zero-copy struct?
    answer: >-
      No. A bool has only two valid bit patterns and Pod requires every pattern to be valid.
      Store a u8.
  - question: Why does my handler panic on a CPI while a zero-copy account is loaded?
    answer: >-
      The RefMut from load_mut stays borrowed until it drops, and a CPI touching the same
      account borrows it again. Scope the load_mut to a block that ends before the CPI fires.
---

> Anchor's default `Account<'info, T>` deserializes the entire account into a Rust struct on the stack at the start of every handler, then serializes the struct back to the account at the end. For small accounts this is fine. For large accounts it is the bottleneck: the struct does not fit on the stack, compute units go to copying bytes, and code size grows from monomorphization. With zero-copy you point a struct at the raw bytes and work in place.

## The default copies the whole account on every call

On Ethereum a contract reads and writes its storage one 32-byte word at a time and pays gas only for the words it touches. A Solana program receives each account as one buffer of bytes, and Anchor's default is to copy all of it.

The default Anchor account treatment is a value type. When the handler runs, the framework reads the account's bytes, deserializes them into a freshly constructed `T`, and gives you a `&mut T` pointing at that struct. The struct lives on the stack, or on the heap if you wrap it in `Box`. At the end of the handler, the struct is serialized back into the account's data buffer.

This is convenient, and it gets expensive in three ways when the struct gets large.

**The stack has a hard limit.** Each Solana instruction handler runs with a stack frame around 4 KB. A `T` that's 5 KB or 10 KB can't physically fit. The program won't even compile in some cases, and when it does compile, it can stack overflow at runtime. The error message is unhelpful and the cause is non-obvious.

**Compute units burn on the copy.** Every byte deserialized and re-serialized costs CU. For a small account that's a few dozen CU you don't notice. For a 50 KB account it's tens of thousands of CU on every call, for nothing more than copying bytes you already have.

**Code size grows from monomorphization.** The serializer is generic. Every type Anchor sees produces another copy of the deserialize and serialize code in your binary. Ten different large account types make your program binary substantially larger, which costs deploy SOL and CU on every load.

For accounts under a kilobyte or two, none of this matters. It starts to matter above a few kilobytes.

## Zero-copy gives the handler a pointer into the account's bytes

Zero-copy turns the account from a value type into a reference type. You don't get a copy of the data, you get a pointer into the data. Reads and writes happen against the original buffer, and there is no deserialize-then-serialize round trip.

<svg role="img" viewBox="0 0 720 520" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Account&lt;T&gt; copy path vs AccountLoader&lt;T&gt; zero-copy path</title><desc>Two side-by-side flows show how an account becomes a Rust struct. Account&lt;T&gt; deserializes the on-chain bytes into a copied struct in the handler, then serializes it back, for two copies per call; AccountLoader&lt;T&gt; casts a pointer straight into the same buffer, so reads and writes hit the account data directly, for zero copies per call.</desc>
  <defs>
    <marker id="arr51A" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">How an account becomes a Rust struct</text>
  <rect x="40" y="80" width="310" height="400" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Account&lt;'info, T&gt;  (default)</text>
  <text x="55" y="130" font-family="monospace" font-size="10" font-weight="bold">on chain:</text>
  <rect x="55" y="138" width="280" height="50" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <text x="195" y="158" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">disc | field1 | field2 | ...</text>
  <text x="195" y="174" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">raw bytes in the account</text>
  <line x1="195" y1="195" x2="195" y2="225" stroke="#565653" stroke-width="2" marker-end="url(#arr51A)"/>
  <text x="210" y="215" font-family="monospace" font-size="9" fill="#565653">deserialize, copy</text>
  <text x="55" y="245" font-family="monospace" font-size="10" font-weight="bold">in handler:</text>
  <rect x="55" y="253" width="280" height="65" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="195" y="273" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">T { field1, field2, ... }</text>
  <text x="195" y="289" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff">owned struct on stack</text>
  <text x="195" y="305" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff" font-style="italic">a copy of the bytes</text>
  <line x1="195" y1="325" x2="195" y2="355" stroke="#565653" stroke-width="2" marker-end="url(#arr51A)"/>
  <text x="210" y="345" font-family="monospace" font-size="9" fill="#565653">serialize, write</text>
  <text x="55" y="375" font-family="monospace" font-size="10" font-weight="bold">on chain:</text>
  <rect x="55" y="383" width="280" height="50" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <text x="195" y="403" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">disc | field1' | field2' | ...</text>
  <text x="195" y="419" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">copy written back at end</text>
  <text x="195" y="460" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">two copies per call</text>
  <rect x="370" y="80" width="310" height="400" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="80" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">AccountLoader&lt;'info, T&gt;  (zero-copy)</text>
  <text x="385" y="130" font-family="monospace" font-size="10" font-weight="bold">on chain:</text>
  <rect x="385" y="138" width="280" height="50" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <text x="525" y="158" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">disc | field1 | field2 | ...</text>
  <text x="525" y="174" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">raw bytes in the account</text>
  <line x1="525" y1="200" x2="525" y2="245" stroke="#ed4937" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="540" y="220" font-family="monospace" font-size="9" fill="#ed4937">cast pointer</text>
  <text x="540" y="234" font-family="monospace" font-size="9" fill="#ed4937">no copy</text>
  <text x="385" y="265" font-family="monospace" font-size="10" font-weight="bold">in handler:</text>
  <rect x="385" y="273" width="280" height="65" fill="#ed4937" stroke="#000000" stroke-width="1"/>
  <text x="525" y="293" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">RefMut&lt;T&gt; → the bytes</text>
  <text x="525" y="309" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff">view over account data</text>
  <text x="525" y="325" text-anchor="middle" font-family="monospace" font-size="9" fill="#ffffff" font-style="italic">writes hit the buffer directly</text>
  <line x1="525" y1="345" x2="525" y2="375" stroke="#ed4937" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="540" y="365" font-family="monospace" font-size="9" fill="#ed4937">drop guard</text>
  <text x="385" y="385" font-family="monospace" font-size="10" font-weight="bold">on chain:</text>
  <rect x="385" y="393" width="280" height="40" fill="#d4d2ce" stroke="#000000" stroke-width="1"/>
  <text x="525" y="418" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">already updated, no extra write</text>
  <text x="525" y="460" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">zero copies per call</text>
  <text x="360" y="500" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Default deserializes onto the stack. Zero-copy hands you a pointer into the same buffer.</text>
</svg>

## The price is a fixed layout

The runtime cannot cast a byte buffer to any Rust struct and trust the result. The cast only works if the struct's in-memory layout is identical to the on-chain byte layout. That means a known field order, no padding the compiler might insert, and no field that points to memory outside the struct. Such a struct is called Plain Old Data, or Pod.

Anchor expresses this through `#[account(zero_copy)]`, which requires the `bytemuck::Pod` and `bytemuck::Zeroable` traits and enforces them at compile time. `#[repr(C)]` on the struct keeps the compiler from reordering fields. Every field has to be fixed-size and itself Pod: primitive integers, `Pubkey`, fixed-size arrays of Pod types, other `#[repr(C)]` structs of Pod fields. `Vec`, `String`, `HashMap`, references and enums with a payload do not compile. Neither does `bool`, because only bit patterns 0 and 1 are valid for it and Pod requires every bit pattern to be valid, so you store a `u8` instead.

A zero-copy struct looks like this next to a regular one. The regular `Config` can hold a `String` because Anchor's serializer can handle it:

```rust
// Regular account, fine for small/medium sizes
#[account]
pub struct Config {
    pub admin: Pubkey,
    pub name: String,        // OK here, expensive in zero-copy world
    pub fee_bps: u16,
}

// Zero-copy account, fixed layout
#[account(zero_copy)]
#[repr(C)]
pub struct OrderBook {
    pub market: Pubkey,
    pub head: u32,
    pub tail: u32,
    pub orders: [Order; 1000],   // fixed-size array, fine
}

#[zero_copy]
#[repr(C)]
pub struct Order {
    pub owner: Pubkey,
    pub price: u64,
    pub size: u64,
}
```

You can't have a dynamically-sized message field or a `Vec` of orders that grows. Every collection has a fixed capacity that you commit to up front, and you manage the count yourself with a `head`, `tail`, or `len` field.

## Zero-copy fits large accounts on a hot path

An account that wants zero-copy is big, holds mostly fixed-shape data, and is touched often, in performance-sensitive paths: an order book, a match buffer, a large bitmap for an allowlist, a large array of positions in a perps protocol, a ring buffer for time series.

An account that does not want zero-copy is the opposite: small, with variable-length text or metadata fields where a `String` is natural, and modified rarely. The Config account in any program almost always stays on `Account<T>` because it's small and the convenience of having `String` fields is worth more than the copy cost on the rare update.

## In code

Zero-copy accounts are reached through `AccountLoader<'info, T>`, not `Account<'info, T>`. The loader hands out borrows of the account's bytes through three methods.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Three ways to open a zero-copy account: load_init, load, load_mut</title><desc>Compares AccountLoader's three methods: load_init() runs once to create the account and returns exclusive write access, load() gives shared read-only access, and load_mut() gives exclusive write access. A bottom panel states the borrow rule: only one load_mut() can be active at a time, enforced at runtime by RefCell.</desc>
  <defs>
    <marker id="arr51C" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Three ways to open a zero-copy account</text>
  <rect x="40" y="80" width="640" height="130" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="80" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">load_init()</text>
  <text x="55" y="130" font-family="monospace" font-size="10" font-weight="bold">when:</text>
  <text x="120" y="130" font-family="monospace" font-size="10" fill="#565653">once, in the instruction that creates the account</text>
  <text x="55" y="150" font-family="monospace" font-size="10" font-weight="bold">returns:</text>
  <text x="120" y="150" font-family="monospace" font-size="10" fill="#565653">RefMut&lt;T&gt;  (exclusive write access)</text>
  <text x="55" y="170" font-family="monospace" font-size="10" font-weight="bold">does:</text>
  <text x="120" y="170" font-family="monospace" font-size="10" fill="#565653">writes the discriminator, zeros the buffer, hands you the slab</text>
  <text x="55" y="192" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">required for the first access. load() and load_mut() fail before this runs.</text>
  <rect x="40" y="225" width="310" height="195" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="225" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="244" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">load()</text>
  <text x="55" y="275" font-family="monospace" font-size="10" font-weight="bold">when:</text>
  <text x="55" y="291" font-family="monospace" font-size="10" fill="#565653">you only need to read</text>
  <text x="55" y="313" font-family="monospace" font-size="10" font-weight="bold">returns:</text>
  <text x="55" y="329" font-family="monospace" font-size="10" fill="#565653">Ref&lt;T&gt; (shared read access)</text>
  <text x="55" y="351" font-family="monospace" font-size="10" font-weight="bold">borrows:</text>
  <text x="55" y="367" font-family="monospace" font-size="10" fill="#565653">many at once is fine</text>
  <text x="55" y="395" font-family="monospace" font-size="9" fill="#565653" font-style="italic">cheap, read-only access</text>
  <rect x="370" y="225" width="310" height="195" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="370" y="225" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="244" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">load_mut()</text>
  <text x="385" y="275" font-family="monospace" font-size="10" font-weight="bold">when:</text>
  <text x="385" y="291" font-family="monospace" font-size="10" fill="#565653">you need to write</text>
  <text x="385" y="313" font-family="monospace" font-size="10" font-weight="bold">returns:</text>
  <text x="385" y="329" font-family="monospace" font-size="10" fill="#565653">RefMut&lt;T&gt; (exclusive write)</text>
  <text x="385" y="351" font-family="monospace" font-size="10" font-weight="bold">borrows:</text>
  <text x="385" y="367" font-family="monospace" font-size="10" fill="#565653">only one at a time</text>
  <text x="385" y="395" font-family="monospace" font-size="9" fill="#565653" font-style="italic">writes go straight to the bytes</text>
  <rect x="40" y="435" width="640" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="435" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="454" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">the borrow checker rule</text>
  <text x="55" y="484" font-family="monospace" font-size="10" fill="#565653">A second load_mut() on the same account while the first is alive panics at runtime.</text>
  <text x="55" y="502" font-family="monospace" font-size="10" fill="#565653">Limit the scope of the RefMut: take it, do the work, drop it, then anyone else can borrow.</text>
  <text x="55" y="520" font-family="monospace" font-size="10" fill="#565653">CPI calls that touch the same account need the borrow dropped before they fire.</text>
  <text x="360" y="565" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Three entry points. Rust's borrow rules apply, enforced at runtime by RefCell.</text>
</svg>

`load()` returns a `Ref<T>` and `load_mut()` returns a `RefMut<T>`. Each is a borrow that is released when the variable goes out of scope. Multiple read borrows can coexist. Write borrows are exclusive: only one `load_mut()` can be live for a given account at a time.

If you call a CPI while a `RefMut` is alive, and the called program tries to touch the same account, the runtime panics. The fix is to drop the borrow before the CPI:

```rust
{
    let mut book = ctx.accounts.order_book.load_mut()?;
    book.orders[idx].size = new_size;
    // book is dropped at the end of this block
}
some_cpi_call(ctx.accounts.order_book.to_account_info(), ...)?;
```

Scope the `RefMut` to the smallest region that needs write access, and drop it before any CPI.

## Box as the middle ground

If your account is too big for the stack but you don't want the Pod constraints, `Box<Account<'info, T>>` is the right answer. It uses the same serialization as the default, with the same `String` and `Vec` support, but the deserialized struct lives on the heap instead of the stack. The copy still happens on every call, so the CU cost stays, but for an account in the 2 KB to 8 KB range that is not in your hottest path that cost is manageable.

```rust
#[derive(Accounts)]
pub struct UpdatePositions<'info> {
    #[account(mut, has_one = user)]
    pub state: Box<Account<'info, UserState>>,
    pub user: Signer<'info>,
}
```

Everything else, including the body of the handler, is unchanged. `state.positions[0].size = new_size;` works the same way it would for `Account<'info, UserState>`.

This is the option most programs reach for first when they hit a stack overflow. If `Box<Account<T>>` still gives unacceptable CU costs, then it's time to migrate to zero-copy and live with the Pod constraints.

## Choosing between Account, Box, and zero-copy

<svg role="img" viewBox="0 0 720 510" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Config, UserState, and OrderBook: Account&lt;T&gt;, Box&lt;Account&lt;T&gt;&gt;, or AccountLoader&lt;T&gt; by size</title><desc>Three columns compare accounts by size and Solana strategy: Config (120 bytes) uses the default Account&lt;T&gt;, UserState (~6 KB, 64 position slots) uses heap-allocated Box&lt;Account&lt;T&gt;&gt;, and OrderBook (48 KB, 1000 order slots) uses zero-copy AccountLoader&lt;T&gt; for large CU savings. Each column lists the account's fields and the reason for its strategy, and a footer notes that account size and call frequency drive the decision.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Three accounts, three strategies</text>
  <rect x="40" y="80" width="205" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="205" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="142" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Config</text>
  <text x="55" y="130" font-family="monospace" font-size="10" font-weight="bold">size:</text>
  <text x="100" y="130" font-family="monospace" font-size="10" fill="#565653">120 bytes</text>
  <text x="55" y="148" font-family="monospace" font-size="10" font-weight="bold">fields:</text>
  <text x="55" y="166" font-family="monospace" font-size="9" fill="#565653">admin: Pubkey</text>
  <text x="55" y="180" font-family="monospace" font-size="9" fill="#565653">fee_bps: u16</text>
  <text x="55" y="194" font-family="monospace" font-size="9" fill="#565653">paused: bool</text>
  <text x="55" y="208" font-family="monospace" font-size="9" fill="#565653">vault: Pubkey</text>
  <line x1="55" y1="225" x2="230" y2="225" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="248" font-family="monospace" font-size="10" font-weight="bold">use:</text>
  <text x="55" y="266" font-family="monospace" font-size="10" fill="#565653">Account&lt;T&gt;</text>
  <text x="55" y="282" font-family="monospace" font-size="9" fill="#565653">the default</text>
  <text x="55" y="310" font-family="monospace" font-size="10" font-weight="bold">why:</text>
  <text x="55" y="328" font-family="monospace" font-size="9" fill="#565653">tiny, copy cost</text>
  <text x="55" y="342" font-family="monospace" font-size="9" fill="#565653">is negligible.</text>
  <text x="55" y="356" font-family="monospace" font-size="9" fill="#565653">no reason to</text>
  <text x="55" y="370" font-family="monospace" font-size="9" fill="#565653">complicate.</text>
  <text x="142" y="440" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">stays simple</text>
  <rect x="257" y="80" width="206" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="257" y="80" width="206" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">UserState</text>
  <text x="272" y="130" font-family="monospace" font-size="10" font-weight="bold">size:</text>
  <text x="317" y="130" font-family="monospace" font-size="10" fill="#565653">~6 KB</text>
  <text x="272" y="148" font-family="monospace" font-size="10" font-weight="bold">fields:</text>
  <text x="272" y="166" font-family="monospace" font-size="9" fill="#565653">user: Pubkey</text>
  <text x="272" y="180" font-family="monospace" font-size="9" fill="#565653">positions: array</text>
  <text x="287" y="194" font-family="monospace" font-size="9" fill="#565653">of 64 slots</text>
  <text x="272" y="212" font-family="monospace" font-size="9" fill="#565653">where each slot</text>
  <text x="287" y="226" font-family="monospace" font-size="9" fill="#565653">is ~96 bytes</text>
  <line x1="272" y1="243" x2="448" y2="243" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="272" y="266" font-family="monospace" font-size="10" font-weight="bold">use:</text>
  <text x="272" y="284" font-family="monospace" font-size="10" fill="#565653">Box&lt;Account&lt;T&gt;&gt;</text>
  <text x="272" y="300" font-family="monospace" font-size="9" fill="#565653">heap-allocated</text>
  <text x="272" y="324" font-family="monospace" font-size="10" font-weight="bold">why:</text>
  <text x="272" y="342" font-family="monospace" font-size="9" fill="#565653">copy still cheap,</text>
  <text x="272" y="356" font-family="monospace" font-size="9" fill="#565653">but stack won't</text>
  <text x="272" y="370" font-family="monospace" font-size="9" fill="#565653">hold the struct.</text>
  <text x="272" y="384" font-family="monospace" font-size="9" fill="#565653">Box moves it</text>
  <text x="272" y="398" font-family="monospace" font-size="9" fill="#565653">to the heap.</text>
  <text x="360" y="440" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">avoids stack overflow</text>
  <rect x="475" y="80" width="205" height="380" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="475" y="80" width="205" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="577" y="99" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">OrderBook</text>
  <text x="490" y="130" font-family="monospace" font-size="10" font-weight="bold">size:</text>
  <text x="535" y="130" font-family="monospace" font-size="10" fill="#565653">48 KB</text>
  <text x="490" y="148" font-family="monospace" font-size="10" font-weight="bold">fields:</text>
  <text x="490" y="166" font-family="monospace" font-size="9" fill="#565653">market: Pubkey</text>
  <text x="490" y="180" font-family="monospace" font-size="9" fill="#565653">orders: array</text>
  <text x="505" y="194" font-family="monospace" font-size="9" fill="#565653">of 1000 slots</text>
  <text x="490" y="212" font-family="monospace" font-size="9" fill="#565653">where each slot</text>
  <text x="505" y="226" font-family="monospace" font-size="9" fill="#565653">is 48 bytes</text>
  <line x1="490" y1="243" x2="665" y2="243" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="490" y="266" font-family="monospace" font-size="10" font-weight="bold">use:</text>
  <text x="490" y="284" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">AccountLoader&lt;T&gt;</text>
  <text x="490" y="300" font-family="monospace" font-size="9" fill="#565653">zero-copy</text>
  <text x="490" y="324" font-family="monospace" font-size="10" font-weight="bold">why:</text>
  <text x="490" y="342" font-family="monospace" font-size="9" fill="#565653">too large to copy</text>
  <text x="490" y="356" font-family="monospace" font-size="9" fill="#565653">on every call.</text>
  <text x="490" y="370" font-family="monospace" font-size="9" fill="#565653">work against</text>
  <text x="490" y="384" font-family="monospace" font-size="9" fill="#565653">the bytes</text>
  <text x="490" y="398" font-family="monospace" font-size="9" fill="#565653">in place.</text>
  <text x="577" y="440" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">order-of-magnitude</text>
  <text x="577" y="453" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">CU savings</text>
  <text x="360" y="492" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The size of the account is the first input. The hot-path call frequency is the second.</text>
</svg>

For 90% of accounts you'll write, the default `Account<'info, T>` is correct and you never think about this. The order is default → Box → zero-copy, and you only move to the next step when measurements force you to.

When you do reach for zero-copy, the struct's memory layout is your contract with the on-chain bytes, and you don't get to change it after deployment without a careful migration.
