# Cross-Program Invocation (CPI)

_type: lecture_

> Solana programs are not isolated. A program can call another program in the middle of its own execution, pass it accounts, and observe the result before continuing. This is how a swap program moves SPL tokens, how a lending program reads price oracles, how any nontrivial protocol composes services. The mechanism is called Cross-Program Invocation. The runtime gives you two syscalls, `invoke` and `invoke_signed`, plus a strict set of rules about what authority crosses with the call. Once you understand those rules, the rest of Solana's ecosystem opens up to your programs.

## Programs need to call programs

The programs you've written so far operate on accounts owned by your own program. You can read them, mutate them, initialize new ones, charge them rent. What you can't do, alone, is move SPL tokens, mint NFTs, place an order on a DEX, or do anything else that requires touching state owned by a different program.

That's deliberate. Solana's security model is that each account has exactly one owner program, and only that owner can mutate the account's data. So if you want to move tokens out of a vault, you can't just write zeros over the source balance and write a higher number into the destination. The tokens live in accounts owned by the Token Program. Only the Token Program can mutate them.

The way you make changes to accounts you don't own is to ask the program that owns them, politely, to do it on your behalf. You construct a request, you hand it to the runtime, and the runtime hands it to the owning program. If your request is well-formed and you have the right authority, the owning program performs the mutation and returns success. That's a CPI.

If you've worked with microservices, the pattern is familiar: one service calls another, forwarding the caller's auth credentials. The called service trusts those credentials because the platform attests to them. CPI does the same thing, where the platform is the runtime and the credentials are signer flags on accounts.

## The shape of a CPI call

A CPI happens in four phases. Your handler builds an `Instruction` describing what it wants the called program to do. It calls the `invoke` syscall, passing the instruction along with references to the accounts the called program will need. The runtime suspends your program, switches execution to the called program, and runs it with those accounts. When the called program returns, control comes back to your handler with the state changes already applied.

<svg role="img" viewBox="0 0 720 600" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The four steps of a CPI call: build, invoke, execute, return</title><desc>The diagram shows four stacked boxes joined by arrows: building an Instruction, passing it to the invoke syscall, running the called program, and returning control to the handler. A caption at the bottom says a CPI is a function call across program boundaries, with strict rules about what crosses with you.</desc>
  <defs>
    <marker id="arrS41aR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The shape of a CPI call</text>
  <rect x="40" y="85" width="640" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="108" font-family="monospace" font-size="11" font-weight="bold">1. Your handler builds an Instruction</text>
  <text x="60" y="130" font-family="monospace" font-size="10">let ix = Instruction {</text>
  <text x="80" y="148" font-family="monospace" font-size="10">program_id: token_program.key(),</text>
  <text x="80" y="166" font-family="monospace" font-size="10">accounts: vec![ /* AccountMetas */ ],</text>
  <text x="80" y="184" font-family="monospace" font-size="10">data: instruction_data,</text>
  <text x="60" y="200" font-family="monospace" font-size="10">};</text>
  <line x1="360" y1="210" x2="360" y2="230" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS41aR)"/>
  <rect x="40" y="235" width="640" height="85" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="258" font-family="monospace" font-size="11" font-weight="bold">2. Pass it to the invoke syscall</text>
  <text x="60" y="280" font-family="monospace" font-size="10">invoke(&amp;ix, &amp;account_infos)?;</text>
  <text x="60" y="300" font-family="monospace" font-size="9" fill="#565653">the runtime suspends your program and switches execution</text>
  <line x1="360" y1="330" x2="360" y2="350" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS41aR)"/>
  <rect x="40" y="355" width="640" height="90" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="378" font-family="monospace" font-size="11" font-weight="bold">3. The called program runs</text>
  <text x="60" y="400" font-family="monospace" font-size="10" fill="#565653">its entry point sees the accounts you passed, with their signer</text>
  <text x="60" y="416" font-family="monospace" font-size="10" fill="#565653">and writable flags carried over from your frame</text>
  <text x="60" y="436" font-family="monospace" font-size="10" fill="#565653">it can read or mutate any account it received, subject to those flags</text>
  <line x1="360" y1="455" x2="360" y2="475" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS41aR)"/>
  <rect x="40" y="480" width="640" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="503" font-family="monospace" font-size="11" font-weight="bold">4. Control returns to your handler</text>
  <text x="60" y="525" font-family="monospace" font-size="10" fill="#565653">any state changes the called program made are now visible</text>
  <text x="60" y="541" font-family="monospace" font-size="10" fill="#565653">if it returned an error, your handler propagates that error</text>
  <text x="360" y="582" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A CPI is a function call across program boundaries, with strict rules about what crosses with you.</text>
</svg>

The `Instruction` struct should look familiar. It's the same shape as the instructions a wallet builds and submits in a transaction. The CPI version is built inside another program and sent through the syscall instead of arriving from the network, but the runtime treats them the same way once they're being executed. Same fields, same semantics.

The depth is bounded. A transaction can invoke up to four levels deep: your handler is depth one, a CPI from it is depth two, a CPI from that is depth three, and one more layer is allowed. Beyond that, the runtime rejects the call. In practice this is plenty for any composition pattern, but it's worth knowing the limit exists.

## Privileges propagate, and they never grow

This is the most important conceptual point in the lecture. The rules about what authority a CPI carries with it are the entire security model of Solana's composition layer.

When your handler runs, each account in its frame carries flags: was this account a signer in the transaction, and is it marked writable. When you CPI to another program, those flags travel through. An account that signed your transaction is still a signer in the called program's frame. An account marked writable in your handler is still writable in the called program's frame, if you pass it as writable.

<svg role="img" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>CPI account flags: alice, vault, and mint keep the same signer and writable status</title><desc>Two account tables compare program A's frame with the called program B's frame for accounts alice, vault, and mint, and their signer and writable flags match exactly. A rules list below states that privileges never grow across a CPI, except a program can sign as a PDA it controls via invoke_signed.</desc>
  <defs>
    <marker id="arrS41bR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Privileges propagate, but never grow</text>
  <rect x="40" y="85" width="640" height="155" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Your handler's frame (program A)</text>
  <line x1="50" y1="135" x2="670" y2="135" stroke="#565653" stroke-width="1"/>
  <text x="60" y="129" font-family="monospace" font-size="10" font-weight="bold">account</text>
  <text x="280" y="129" font-family="monospace" font-size="10" font-weight="bold">signer?</text>
  <text x="430" y="129" font-family="monospace" font-size="10" font-weight="bold">writable?</text>
  <text x="60" y="155" font-family="monospace" font-size="10">alice (Signer)</text>
  <text x="280" y="155" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="430" y="155" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="60" y="178" font-family="monospace" font-size="10">vault (mut Account)</text>
  <text x="280" y="178" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="430" y="178" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="60" y="201" font-family="monospace" font-size="10">mint (Account)</text>
  <text x="280" y="201" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="430" y="201" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="60" y="227" font-family="monospace" font-size="9" fill="#565653" font-style="italic">these are the flags your accounts carry in your handler</text>
  <line x1="360" y1="250" x2="360" y2="280" stroke="#ed4937" stroke-width="3" marker-end="url(#arrS41bR)"/>
  <text x="380" y="270" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">CPI to Token Program</text>
  <rect x="40" y="290" width="640" height="155" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="290" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="309" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">The called program sees (program B)</text>
  <line x1="50" y1="340" x2="670" y2="340" stroke="#565653" stroke-width="1"/>
  <text x="60" y="334" font-family="monospace" font-size="10" font-weight="bold">account</text>
  <text x="280" y="334" font-family="monospace" font-size="10" font-weight="bold">signer?</text>
  <text x="430" y="334" font-family="monospace" font-size="10" font-weight="bold">writable?</text>
  <text x="60" y="360" font-family="monospace" font-size="10">alice</text>
  <text x="280" y="360" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="430" y="360" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="60" y="383" font-family="monospace" font-size="10">vault</text>
  <text x="280" y="383" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="430" y="383" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">yes</text>
  <text x="60" y="406" font-family="monospace" font-size="10">mint</text>
  <text x="280" y="406" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="430" y="406" font-family="monospace" font-size="10" fill="#565653">no</text>
  <text x="60" y="432" font-family="monospace" font-size="9" fill="#565653" font-style="italic">the same flags propagate through. nothing was upgraded.</text>
  <rect x="40" y="465" width="640" height="115" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="487" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">The rules</text>
  <line x1="55" y1="495" x2="665" y2="495" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="515" font-family="monospace" font-size="10">→ Signers from your frame stay signers in the called program's frame.</text>
  <text x="60" y="533" font-family="monospace" font-size="10">→ Writability is preserved, or you can drop it (pass writable as readonly).</text>
  <text x="60" y="551" font-family="monospace" font-size="10">→ A non-signer can never become a signer mid-call. Privileges never grow.</text>
  <text x="60" y="569" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">→ Exception: your program can sign as a PDA it controls, via invoke_signed.</text>
  <text x="360" y="605" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A program can only delegate authority it already has. This is the entire security model of CPI.</text>
</svg>

What you cannot do is escalate authority. If an account arrived in your handler as readonly, you cannot pass it to a CPI as writable. The runtime checks. If an account arrived as a non-signer, you cannot pretend it signed on the way down. The runtime checks. The principle: a program can only delegate authority it already has.

You can drop authority. If your handler can write to an account, you can pass it to a CPI as readonly, telling the called program it may read the account but not write to it. This is a useful capability, since it lets you call programs that need to read state without granting them write access they don't need.

There is one exception to the "no new signers" rule, and it's the central mechanism that makes Solana programs useful. Your program can sign as a PDA it controls, by calling `invoke_signed` and passing the PDA's seeds. The runtime re-derives the PDA, confirms it belongs to your program, and treats it as a signer in the called program's frame. This is how a vault PDA authorizes a token transfer out of its own token account: the program proves it knows the seeds, the runtime accepts that as the PDA's signature.

## invoke and invoke_signed

The runtime exposes two syscalls. `invoke` forwards existing signers downstream. `invoke_signed` does the same, plus it lets your program sign as one or more PDAs.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>invoke vs invoke_signed: forwarding signers vs signing as a PDA</title><desc>Two side-by-side panels compare the syscalls invoke and invoke_signed for calling another program. The invoke panel shows it forwarding existing signers, like Alice's signature used to move her tokens via a CPI to the Token Program; the invoke_signed panel shows it forwarding existing signers plus letting the program sign as a PDA, like a vault PDA authorizing a token transfer with seeds.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Two ways to call another program</text>
  <rect x="40" y="90" width="310" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">invoke</text>
  <text x="55" y="142" font-family="monospace" font-size="10" font-weight="bold">syscall:</text>
  <text x="55" y="158" font-family="monospace" font-size="10">invoke(&amp;ix, &amp;accounts)?;</text>
  <line x1="55" y1="175" x2="335" y2="175" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="197" font-family="monospace" font-size="10" font-weight="bold">what propagates:</text>
  <text x="55" y="215" font-family="monospace" font-size="10" fill="#565653">signers that signed your tx</text>
  <text x="55" y="231" font-family="monospace" font-size="10" fill="#565653">are still signers downstream</text>
  <text x="55" y="259" font-family="monospace" font-size="10" font-weight="bold">use when:</text>
  <text x="55" y="277" font-family="monospace" font-size="10" fill="#565653">a human or wallet signed,</text>
  <text x="55" y="293" font-family="monospace" font-size="10" fill="#565653">and that signature is enough</text>
  <text x="55" y="321" font-family="monospace" font-size="10" font-weight="bold">example:</text>
  <text x="55" y="339" font-family="monospace" font-size="10" fill="#565653">Alice signs your handler.</text>
  <text x="55" y="355" font-family="monospace" font-size="10" fill="#565653">You CPI to Token Program</text>
  <text x="55" y="371" font-family="monospace" font-size="10" fill="#565653">to move tokens from Alice's</text>
  <text x="55" y="387" font-family="monospace" font-size="10" fill="#565653">account. Alice is still the</text>
  <text x="55" y="403" font-family="monospace" font-size="10" fill="#565653">signer in the inner call.</text>
  <text x="195" y="445" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">forwarding existing signatures</text>
  <rect x="370" y="90" width="310" height="380" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">invoke_signed</text>
  <text x="385" y="142" font-family="monospace" font-size="10" font-weight="bold">syscall:</text>
  <text x="385" y="158" font-family="monospace" font-size="10">invoke_signed(&amp;ix,</text>
  <text x="395" y="174" font-family="monospace" font-size="10">&amp;accounts, signer_seeds)?;</text>
  <line x1="385" y1="190" x2="665" y2="190" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="385" y="212" font-family="monospace" font-size="10" font-weight="bold">what propagates:</text>
  <text x="385" y="230" font-family="monospace" font-size="10" fill="#565653">existing signers, PLUS</text>
  <text x="385" y="246" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">your program signs as a PDA</text>
  <text x="385" y="274" font-family="monospace" font-size="10" font-weight="bold">use when:</text>
  <text x="385" y="292" font-family="monospace" font-size="10" fill="#565653">an account is owned by a PDA</text>
  <text x="385" y="308" font-family="monospace" font-size="10" fill="#565653">your program controls, and you</text>
  <text x="385" y="324" font-family="monospace" font-size="10" fill="#565653">need to authorize on its behalf</text>
  <text x="385" y="352" font-family="monospace" font-size="10" font-weight="bold">example:</text>
  <text x="385" y="370" font-family="monospace" font-size="10" fill="#565653">a vault PDA owns a token</text>
  <text x="385" y="386" font-family="monospace" font-size="10" fill="#565653">account. you CPI to transfer</text>
  <text x="385" y="402" font-family="monospace" font-size="10" fill="#565653">from it. pass seeds; runtime</text>
  <text x="385" y="418" font-family="monospace" font-size="10" fill="#565653">re-derives, accepts as signer.</text>
  <text x="525" y="445" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">programs signing on their own behalf</text>
  <text x="360" y="510" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Both syscalls forward signers. invoke_signed adds one capability: your program acting as a PDA.</text>
</svg>

The signer seeds passed to `invoke_signed` are an array of seed arrays. Each inner array re-derives one PDA. So you can sign on behalf of multiple PDAs in a single call, by passing multiple sets of seeds. The runtime walks each one, derives the address, and adds that address to the signer set for the inner call. If any of the derived addresses doesn't match an account in the call, the CPI fails.

A concrete shape for the seeds, with the bump appended at the end:

```rust
let bump = ctx.accounts.vault.bump;
let mint_key = ctx.accounts.mint.key();
let seeds: &[&[u8]] = &[b"vault", mint_key.as_ref(), &[bump]];
let signer_seeds: &[&[&[u8]]] = &[seeds];

invoke_signed(&ix, &account_infos, signer_seeds)?;
```

The double-reference shape is awkward to read at first, but it makes sense once you see what it represents: a list of seed sets, where each seed set is itself a list of byte slices. One set per PDA you're signing for.

## Anchor's CpiContext

Writing raw `Instruction` structs and calling `invoke` directly is verbose and easy to get wrong. Anchor provides a typed wrapper called `CpiContext` that builds the instruction and account structures for you when calling known programs, and the SPL Token bindings in `anchor_spl` give you typed structs for every Token Program instruction.

A token transfer through Anchor looks like this:

```rust
use anchor_spl::token::{self, Transfer};

let cpi_accounts = Transfer {
    from: ctx.accounts.source.to_account_info(),
    to: ctx.accounts.destination.to_account_info(),
    authority: ctx.accounts.authority.to_account_info(),
};
let cpi_ctx = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
);
token::transfer(cpi_ctx, amount)?;
```

The `Transfer` struct names every account the Token Program's transfer instruction expects, with the correct field names. `CpiContext::new` packages the program reference together with the accounts. `token::transfer` builds the right `Instruction`, calls `invoke`, and returns the result. You wrote no `AccountMeta` lists, no instruction data buffers, no syscall calls. The macro layer handled all of it.

For `invoke_signed`, the equivalent constructor is `CpiContext::new_with_signer`, which takes the same arguments plus a signer seeds slice. Everything else is identical. The signature on `token::transfer` is the same. Only the context changes.

This is the form you'll write in real code. The raw syscall form exists so you can use it directly when no typed wrapper exists for the program you're calling, but for any of the popular SPL programs, the typed wrappers cover the common operations cleanly.

## Composition is the payoff

The reason CPI matters is not the syscall mechanics. It's what composition unlocks once the mechanics are in place.

A swap program can be 200 lines of code because the actual token movement lives in the SPL Token Program, and the swap program just CPIs to it. A lending protocol can pull oracle prices by calling Pyth or Switchboard through CPI, instead of operating its own price feeds. A vault aggregator can route deposits across multiple yield strategies, calling into each one through CPI, without knowing the internals of any of them. The whole ecosystem assembles like this.

The privilege rules are what make composition safe. Because authority never grows through a CPI, a program you call cannot do anything with the accounts you gave it that you couldn't have done yourself. You can trust the called program with whatever signers and writable accounts you forwarded, no more. That property is enforced by the runtime rather than by convention, which is why the Solana ecosystem can compose contracts written by mutually distrusting teams. You don't have to audit the Token Program every time you transfer. You just need to know what authority you're handing it. And the runtime guarantees that's all the authority it gets.
