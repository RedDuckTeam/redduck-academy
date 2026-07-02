# Zero-copy accounts

_type: lecture_

> Anchor's default `Account<'info, T>` deserializes the entire account into a Rust struct on the stack at the start of every handler, then serializes the struct back to the account at the end. For small accounts this is fine. For large accounts it is the bottleneck: stack frames blow up, compute units burn just shuffling bytes, and code size grows from monomorphization. Zero-copy is the alternative. You point a struct at the raw bytes and work in place. No copy in, no copy out.

## Why the default is sometimes the bottleneck

The default Anchor account treatment is a value type. When the handler runs, the framework reads the account's bytes, deserializes them into a freshly constructed `T`, and gives you a `&mut T` pointing at that struct. The struct lives on the stack, or on the heap if you wrap it in `Box`. At the end of the handler, the struct is serialized back into the account's data buffer.

This is convenient. It's also expensive when the struct gets large. Three real costs add up:

The stack has a hard limit. Each Solana instruction handler runs with a stack frame around 4 KB. A `T` that's 5 KB or 10 KB can't physically fit. The program won't even compile in some cases, and when it does compile, it can stack overflow at runtime. The error message is unhelpful and the cause is non-obvious.

Compute units burn on the copy. Every byte deserialized and re-serialized costs CU. For a small account that's a few dozen CU you don't notice. For a 50 KB account it's tens of thousands of CU per call, every call, for nothing more than copying bytes you already have.

Code size grows from monomorphization. The serializer is generic. Every type Anchor sees produces another copy of the deserialize and serialize code in your binary. Ten different large account types make your program binary substantially larger, which costs deploy SOL and CU on every load.

For accounts under a kilobyte or two, none of this matters. For accounts above a few kilobytes, all of it matters at once.

## What zero-copy actually changes

Zero-copy reframes the account from a value type to a reference type. You don't get a copy of the data, you get a pointer into the data. Reads happen against the original buffer, writes happen against the original buffer, and there is no deserialize-then-serialize round trip.

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

The cost of this is discipline. The runtime cannot just cast a byte buffer to any Rust struct and trust the result. It only works if the struct's in-memory layout is identical to the on-chain byte layout. That means a known field order, no padding the compiler might insert, and no fields whose representation depends on something the compiler computes at runtime. The struct must be Plain Old Data, or POD.

## The Pod constraint

To use zero-copy on a struct, the struct must satisfy the `bytemuck::Pod` and `bytemuck::Zeroable` traits. Anchor expresses this through `#[account(zero_copy)]` and enforces it at compile time. In practice, Pod requires:

- `#[repr(C)]` on the struct, so the compiler doesn't reorder fields.
- Every field type is itself Pod: primitive integers, fixed-size arrays of Pod types, other `#[repr(C)]` structs of Pod fields. `Pubkey` counts as Pod. `bool` does not — only bit patterns 0 and 1 are valid, which violates the `bytemuck::Pod` requirement that all bit patterns are valid. Use `u8` instead and document the meaning.
- No `Vec`, no `String`, no `HashMap`, no `Option<T>` where the niche optimization changes layout.
- No enum with payload. A fieldless enum is debatable, and the safest path is to use a plain `u8` and document the meaning.
- No references, no boxed pointers, no heap allocation of any kind.

Here's what a zero-copy struct looks like next to a regular one. The regular `Account` struct has `String` and `Vec` because Anchor's serializer can handle them:

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

The cost of the constraint is real. You can't have a dynamically-sized message field. You can't have a `Vec` of orders that grows. Every collection has a fixed capacity, and you manage the count yourself with a `head`, `tail`, or `len` field. The discipline is the price of speed.

## When zero-copy is the right call

Most accounts in most programs should stay on the default `Account<T>`. Using zero-copy is a deliberate decision driven by the size of the account.

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

The shape of an account that wants zero-copy is consistent. Big. Mostly fixed-shape data. Touched often, in performance-sensitive paths. Order books fit. Match buffers fit. Large bitmap state for an allowlist fits. Large position arrays for a perps protocol fit. Ring buffers for time-series fit.

The shape of an account that does NOT want zero-copy is the opposite. Small. Variable-length text or metadata fields where a `String` is natural. Modified rarely. The Config account in any program almost always stays on `Account<T>` because it's small and the convenience of having `String` fields is worth more than the copy cost on the rare update.

The middle case is `Box<Account<T>>`. Same serialization as the default, same `String` and `Vec` support, but the deserialized struct lives on the heap instead of the stack. This solves stack overflow problems while preserving Anchor's convenience. If your account is in the 2 KB to 8 KB range, has a few variable-length fields, and is not in your hottest path, `Box<Account<T>>` is often the right answer. You write `Box<Account<'info, MyState>>` in the Accounts struct, and everything else stays the same.

## Working with AccountLoader

Zero-copy accounts are reached through `AccountLoader<'info, T>`, not `Account<'info, T>`. The loader has three methods that matter, each with different runtime semantics.

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

A worked example. The handler initializes a fresh order book:

```rust
#[derive(Accounts)]
pub struct InitMarket<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + std::mem::size_of::<OrderBook>(),
        seeds = [b"book", market.key().as_ref()],
        bump,
    )]
    pub order_book: AccountLoader<'info, OrderBook>,
    /// CHECK: market identifier, validated by seeds
    pub market: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn init_market(ctx: Context<InitMarket>) -> Result<()> {
    let mut book = ctx.accounts.order_book.load_init()?;
    book.market = ctx.accounts.market.key();
    book.head = 0;
    book.tail = 0;
    // book.orders is already all-zeros from load_init's wipe
    Ok(())
}
```

Three things to notice. The `space` calculation uses `std::mem::size_of::<OrderBook>()` because the struct's size is exact and known at compile time. There's no `InitSpace` macro here, because Pod structs have no variable-length fields and the standard size operator works perfectly. The handler calls `load_init()` once and then writes into the returned `RefMut` as if it were a regular `&mut OrderBook`. The borrow is held for the rest of the function and is automatically released when `book` goes out of scope.

A read-only handler that scans the book looks like:

```rust
pub fn best_bid(ctx: Context<ReadMarket>) -> Result<u64> {
    let book = ctx.accounts.order_book.load()?;
    let mut best = 0u64;
    for i in book.head..book.tail {
        let order = &book.orders[i as usize % book.orders.len()];
        if order.price > best {
            best = order.price;
        }
    }
    Ok(best)
}
```

`load()` returns `Ref<T>` instead of `RefMut<T>`. Multiple read borrows can coexist, so multiple instructions in the same transaction can read the same book simultaneously without conflict. Write borrows are exclusive: only one `load_mut()` can be live for a given account at a time.

The borrow rules matter most when a handler calls into other code while still holding a borrow. If you call a CPI while a `RefMut` is alive, and the called program tries to touch the same account, the runtime panics. The fix is to drop the borrow before the CPI:

```rust
{
    let mut book = ctx.accounts.order_book.load_mut()?;
    book.orders[idx].size = new_size;
    // book is dropped at the end of this block
}
some_cpi_call(ctx.accounts.order_book.to_account_info(), ...)?;
```

Scope the `RefMut` to the smallest region that needs write access, drop it before any CPI, and the error goes away.

## Box as the middle ground

If your account is too big for the stack but you don't want the Pod discipline, `Box<Account<'info, T>>` is the right answer. The copy still happens on every call, so the CU cost stays, but for accounts in the low-kilobyte range that cost is manageable. The copy still happens on every call, so the CU cost stays, but for accounts in the low-kilobyte range that cost is manageable.

The signature looks like this:

```rust
#[derive(Accounts)]
pub struct UpdatePositions<'info> {
    #[account(mut, has_one = user)]
    pub state: Box<Account<'info, UserState>>,
    pub user: Signer<'info>,
}
```

Everything else, including the body of the handler, is unchanged. `state.positions[0].size = new_size;` works the same way it would for `Account<'info, UserState>`. The only thing the `Box` changed is where the struct lives in memory.

This is the option most programs reach for first when they hit a stack overflow. If `Box<Account<T>>` still gives unacceptable CU costs, then it's time to migrate to zero-copy and live with the Pod constraints. The order is: default → Box → zero-copy, and you only move to the next step when measurements force you to.

## What you actually do day to day

For 90% of accounts you'll write, the default `Account<'info, T>` is correct and you never think about this. For accounts large enough to stack-overflow but small enough that the copy is cheap, wrap in `Box`. For accounts that are both large and on a hot path, reach for `AccountLoader<'info, T>` with a Pod struct.

When you do reach for zero-copy, the discipline becomes part of the design: every field is fixed-size, every collection has a capacity you commit to up front, and you manage occupancy with explicit head/tail/len fields. The struct's memory layout is your contract with the on-chain bytes, and you don't get to change it after deployment without a careful migration. In exchange you get the kind of performance that makes high-frequency on-chain workloads possible: order books that process thousands of operations per second, perps protocols with hundreds of positions per user, anything where the account itself is the data structure rather than a wrapper around one.
