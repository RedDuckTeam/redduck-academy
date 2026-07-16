---
id: 189
title: Account types in Anchor
type: lecture
order: 3
faq:
  - question: What is the difference between Signer, Account, and SystemAccount in
      Anchor?
    answer: Signer<'info> only checks that the account signed the transaction, so
      use it for the wallet calling your instruction. Account<'info, T> checks
      the account is owned by your program and its data deserializes into your T
      struct, so use it for state your program owns. SystemAccount<'info> checks
      the account is a plain wallet owned by the System Program, useful for
      something like a SOL recipient that does not sign.
  - question: When should I use UncheckedAccount in Anchor?
    answer: "Only as a last resort when none of the other types fit, because Anchor
      runs zero checks on it and hands you a raw account you must validate
      yourself. You have to add a /// CHECK: comment explaining why it is safe,
      or the program will not compile. Most Solana security bugs trace back to
      reaching for UncheckedAccount and then forgetting the manual validation."
  - question: How do I decide which Anchor account type to use for a field?
    answer: "Ask the questions in order: does it need to sign the transaction? Use
      Signer. Is it a program you call into? Use Program<T>. Does it hold state
      owned by your program? Use Account<T>. Is it a plain wallet that does not
      sign? Use SystemAccount. Only if none fit do you fall back to
      UncheckedAccount, and you should always pick the most specific type that
      matches."
---

> Every field in an Accounts struct has a type, and the type is doing real work. It tells Anchor what kind of account this slot expects, what checks to run before your handler executes, and what your handler can do with the field once it gets there. There are five types you'll use day to day. Each one is a different contract about what the account is and what's already been verified by the time your code sees it. The first thing to learn is when to use each one.

## What the type is actually doing

When you write `pub vault: Account<'info, Vault>` inside an Accounts struct, you are not just naming a Rust type. You are telling Anchor to perform a specific set of checks on whichever account appears in that slot of the transaction. If any of those checks fail, the transaction is rejected before your handler runs. If all of them pass, the field becomes available inside your handler as a fully typed value, ready to read or write.

The same idea applies to all five Anchor account types. Each one packages a particular check, or set of checks, behind a name. Picking the right type is how you express what the account is supposed to be in a way the framework can verify mechanically. The point of having five types instead of one is that "what counts as valid" depends on the role the account plays in the instruction. A signer is different from a state account, which is different from a recipient wallet, which is different from a program you're calling into.

In the same way you wouldn't write `Object` in Java when you mean `String`, you don't write `UncheckedAccount` in Anchor when you mean `Signer`. Pick the most specific type that captures what you need. Anchor handles the verification.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>The five Anchor account types: Signer, Account, SystemAccount, Program, UncheckedAccount</title><desc>A table lists five Anchor account types with what each one checks and when to use it. Signer checks that the account signed the transaction, Account checks ownership and that data matches type T, SystemAccount checks it is a plain wallet owned by the System Program, Program checks it is the right program to call into, and UncheckedAccount checks nothing, so it is the last-resort escape hatch you validate yourself.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The five Anchor account types</text>
  <rect x="40" y="90" width="640" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="55" y="110" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">type</text>
  <text x="220" y="110" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">what it checks</text>
  <text x="490" y="110" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff">when to use it</text>
  <rect x="40" y="122" width="640" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="55" y="142" font-family="monospace" font-size="10" font-weight="bold">Signer&lt;'info&gt;</text>
  <text x="220" y="142" font-family="monospace" font-size="10">the account signed</text>
  <text x="220" y="158" font-family="monospace" font-size="10">the transaction</text>
  <text x="220" y="176" font-family="monospace" font-size="9" fill="#565653">nothing else</text>
  <text x="490" y="142" font-family="monospace" font-size="10">the wallet authorizing</text>
  <text x="490" y="158" font-family="monospace" font-size="10">the action</text>
  <rect x="40" y="194" width="640" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="55" y="214" font-family="monospace" font-size="10" font-weight="bold">Account&lt;'info, T&gt;</text>
  <text x="220" y="214" font-family="monospace" font-size="10">owned by your program</text>
  <text x="220" y="230" font-family="monospace" font-size="10">discriminator matches T</text>
  <text x="220" y="246" font-family="monospace" font-size="10">data deserializes to T</text>
  <text x="220" y="262" font-family="monospace" font-size="9" fill="#565653">the workhorse</text>
  <text x="490" y="214" font-family="monospace" font-size="10">your program's state</text>
  <text x="490" y="230" font-family="monospace" font-size="10">(Vault, UserData,</text>
  <text x="490" y="246" font-family="monospace" font-size="10">Proposal, etc.)</text>
  <rect x="40" y="276" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="55" y="296" font-family="monospace" font-size="10" font-weight="bold">SystemAccount&lt;'info&gt;</text>
  <text x="220" y="296" font-family="monospace" font-size="10">owned by the System</text>
  <text x="220" y="312" font-family="monospace" font-size="10">Program (a plain wallet)</text>
  <text x="490" y="296" font-family="monospace" font-size="10">a recipient wallet</text>
  <text x="490" y="312" font-family="monospace" font-size="10">that doesn't need to sign</text>
  <rect x="40" y="343" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="55" y="363" font-family="monospace" font-size="10" font-weight="bold">Program&lt;'info, T&gt;</text>
  <text x="220" y="363" font-family="monospace" font-size="10">the account is the</text>
  <text x="220" y="379" font-family="monospace" font-size="10">program with type T</text>
  <text x="490" y="363" font-family="monospace" font-size="10">programs you call into</text>
  <text x="490" y="379" font-family="monospace" font-size="10">(System, Token, your own)</text>
  <rect x="40" y="410" width="640" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="55" y="430" font-family="monospace" font-size="10" font-weight="bold">UncheckedAccount</text>
  <text x="55" y="446" font-family="monospace" font-size="10" font-weight="bold">&lt;'info&gt;</text>
  <text x="220" y="430" font-family="monospace" font-size="10">nothing</text>
  <text x="220" y="448" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">escape hatch, validate</text>
  <text x="220" y="461" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">it yourself</text>
  <text x="490" y="430" font-family="monospace" font-size="10">last resort, when none</text>
  <text x="490" y="446" font-family="monospace" font-size="10">of the others fit</text>
  <text x="360" y="510" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Pick the most specific type that fits. The checks happen before your handler runs.</text>
</svg>

## The five types, one at a time

**Signer<'info>**. The account whose keypair authorized the transaction. Anchor verifies one thing: a signature from this account's public key was attached to the incoming transaction. That's it. There's no check on the account's owner, no check on its data, no check on whether it even has a balance. Use it for the wallet that's calling your instruction. Anything labeled "authority," "owner," or "user" in your design almost certainly wants this type.

**Account<'info, T>**. The most commonly used type in Anchor programs. It says three things at once: the account is owned by your program, its data starts with the 8-byte discriminator that identifies a `T`, and the rest of its data deserializes cleanly into the `T` struct. By the time your handler runs, `ctx.accounts.vault` is a reference to a typed `Vault` you can read and write like any Rust struct. Use this for every piece of state your program owns. Most of your program's logic will read and write accounts of this type.

**SystemAccount<'info>**. A regular wallet on the chain, owned by the System Program. No data, no complex validation, just a SOL balance. Use it when an instruction needs to reference a wallet that isn't signing the transaction. A common case is a recipient of a SOL transfer: the recipient doesn't sign, but you want to make sure the slot really holds a plain wallet rather than some random account you'd accidentally clobber. `SystemAccount` is the type that makes that intent explicit.

**Program<'info, T>**. The account is the deployed program of type `T`. Anchor verifies the account's address matches the program's known address and that its executable flag is true. Use it when your instruction calls into another program. Need to invoke the System Program to create an account? You'll list it as `Program<'info, System>`. Need to call the Token Program to move tokens? `Program<'info, Token>`. Calling your own program recursively? `Program<'info, MyProgram>`. Without this type, you would not have a way to tell Anchor "yes, this account is supposed to be a program."

**UncheckedAccount<'info>**. The escape hatch. Anchor performs no checks on it. Whatever account the client sends in this slot is what your handler receives, as a raw `AccountInfo` you have to validate yourself. Use it only when none of the other types fit, and always pair it with a `/// CHECK:` doc comment explaining why it's safe and what you're doing to validate it. Anchor's compiler refuses to build without that comment, which is one of the framework's small but effective safety nets. Common legitimate uses include accounts you constrain with a fixed address (`#[account(address = ...)]`), or accounts whose validation is performed by a CPI you're about to make. Using `UncheckedAccount` is a signal that you have stepped outside the framework's automatic checks, and you should know exactly why.

## A real example with all five

A withdrawal from a vault is a good case for seeing every type at once. The vault holds program state, so it's `Account<'info, Vault>`. The owner has to authorize the withdrawal, so they're a `Signer<'info>`. The funds go to a recipient wallet that doesn't need to sign, so that's a `SystemAccount<'info>`. The transfer happens by calling into the Token Program, which appears in the struct as `Program<'info, Token>`. And there's a price oracle that's not directly typed by Anchor but is constrained to a specific address, so it appears as an `UncheckedAccount<'info>` with a `/// CHECK:` comment explaining the address pin.

<svg role="img" viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Withdraw struct showing Account, Signer, SystemAccount, Program, and UncheckedAccount types</title><desc>The diagram shows Anchor's Withdraw accounts struct, with vault as Account, authority as Signer, recipient as SystemAccount, token_program as Program, and price_oracle as UncheckedAccount. Arrows label each field with its role, such as 'your state', 'the signer', 'a passive wallet', 'an external program', and 'opt out of validation'.</desc>
  <defs>
    <marker id="arrS33bG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">All five types, in one real Accounts struct</text>
  <rect x="190" y="90" width="400" height="370" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="190" y="90" width="400" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="390" y="109" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">#[derive(Accounts)] for Withdraw</text>
  <text x="205" y="138" font-family="monospace" font-size="10">pub struct Withdraw&lt;'info&gt; {</text>
  <text x="215" y="166" font-family="monospace" font-size="10">#[account(mut)]</text>
  <text x="215" y="182" font-family="monospace" font-size="10">pub vault: Account&lt;'info, Vault&gt;,</text>
  <text x="215" y="216" font-family="monospace" font-size="10">pub authority: Signer&lt;'info&gt;,</text>
  <text x="215" y="250" font-family="monospace" font-size="10">#[account(mut)]</text>
  <text x="215" y="266" font-family="monospace" font-size="10">pub recipient: SystemAccount&lt;'info&gt;,</text>
  <text x="215" y="300" font-family="monospace" font-size="10">pub token_program: Program&lt;'info,</text>
  <text x="225" y="316" font-family="monospace" font-size="10">Token&gt;,</text>
  <text x="215" y="350" font-family="monospace" font-size="10">/// CHECK: read-only oracle account,</text>
  <text x="215" y="366" font-family="monospace" font-size="10">/// validated by address constraint</text>
  <text x="215" y="382" font-family="monospace" font-size="10">#[account(address = ORACLE_KEY)]</text>
  <text x="215" y="398" font-family="monospace" font-size="10">pub price_oracle: UncheckedAccount&lt;'info&gt;,</text>
  <text x="205" y="428" font-family="monospace" font-size="10">}</text>
  <text x="40" y="180" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">your state</text>
  <text x="40" y="196" font-family="monospace" font-size="9" fill="#565653">Account&lt;T&gt;</text>
  <line x1="120" y1="180" x2="185" y2="180" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="40" y="216" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">the signer</text>
  <text x="40" y="232" font-family="monospace" font-size="9" fill="#565653">Signer</text>
  <line x1="120" y1="216" x2="185" y2="216" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="40" y="266" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">a passive</text>
  <text x="40" y="280" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">wallet</text>
  <text x="40" y="296" font-family="monospace" font-size="9" fill="#565653">SystemAccount</text>
  <line x1="120" y1="266" x2="185" y2="266" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="610" y="305" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">an external</text>
  <text x="610" y="319" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">program</text>
  <text x="610" y="333" font-family="monospace" font-size="9" fill="#565653">Program&lt;T&gt;</text>
  <line x1="608" y1="305" x2="595" y2="305" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="610" y="395" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">opt out of</text>
  <text x="610" y="409" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">validation</text>
  <text x="610" y="423" font-family="monospace" font-size="9" fill="#565653">Unchecked</text>
  <line x1="608" y1="397" x2="595" y2="397" stroke="#565653" stroke-width="1" marker-end="url(#arrS33bG)"/>
  <text x="360" y="495" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Each type tells Anchor what to check. Reading the struct tells you what the instruction does.</text>
</svg>

Anyone reading that struct, without seeing the handler at all, can describe what the instruction does and what assumptions hold by the time the handler runs. That readability is the second-biggest payoff of using specific types. The first is correctness.

## A decision rule for picking the type

When you're writing a new instruction and trying to decide which type to use for each field, walk through the questions in order. Does this account need to sign the transaction? Then it's a `Signer`. Is it a program you call into? Then it's a `Program<T>`. Does it hold state owned by your program? Then it's an `Account<T>`. Is it a plain wallet that doesn't sign? Then it's a `SystemAccount`. If none of those fit, you reach for `UncheckedAccount`, and the comment you write next is your justification.

<svg role="img" viewBox="0 0 720 580" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Flowchart for picking an Anchor account type: Signer, Program, Account, SystemAccount, or UncheckedAccount</title><desc>A flowchart asks four yes-or-no questions in order: does it sign, is it a program, does it hold your program's state, and is it a plain wallet. Each yes gives a type (Signer, Program&lt;'info, T&gt;, Account&lt;'info, T&gt;, or SystemAccount), and if every answer is no you land on UncheckedAccount, which needs a CHECK comment.</desc>
  <defs>
    <marker id="arrS33cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Which type should I pick?</text>
  <rect x="200" y="80" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="340" y="103" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Does it sign the transaction?</text>
  <text x="340" y="120" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">its keypair authorizes the action</text>
  <line x1="480" y1="105" x2="510" y2="105" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="495" y="98" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">yes</text>
  <rect x="515" y="80" width="165" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="597" y="110" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Signer&lt;'info&gt;</text>
  <line x1="340" y1="132" x2="340" y2="160" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="355" y="150" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">no</text>
  <rect x="200" y="165" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="340" y="188" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Is it a program you call into?</text>
  <text x="340" y="205" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">e.g. System, Token, your own</text>
  <line x1="480" y1="190" x2="510" y2="190" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="495" y="183" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">yes</text>
  <rect x="515" y="165" width="165" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="597" y="195" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Program&lt;'info, T&gt;</text>
  <line x1="340" y1="217" x2="340" y2="245" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="355" y="235" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">no</text>
  <rect x="200" y="250" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="340" y="273" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Does it hold your program's state?</text>
  <text x="340" y="290" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">e.g. a Vault, a Proposal, a UserData</text>
  <line x1="480" y1="275" x2="510" y2="275" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="495" y="268" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">yes</text>
  <rect x="515" y="250" width="165" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="597" y="280" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Account&lt;'info, T&gt;</text>
  <line x1="340" y1="302" x2="340" y2="330" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="355" y="320" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">no</text>
  <rect x="200" y="335" width="280" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="340" y="358" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Is it a plain wallet?</text>
  <text x="340" y="375" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">a recipient, a fee payer, a SOL holder</text>
  <line x1="480" y1="360" x2="510" y2="360" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="495" y="353" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">yes</text>
  <rect x="515" y="335" width="165" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="597" y="365" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">SystemAccount</text>
  <line x1="340" y1="387" x2="340" y2="415" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS33cR)"/>
  <text x="355" y="405" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">no</text>
  <rect x="200" y="420" width="280" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="340" y="443" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">UncheckedAccount&lt;'info&gt;</text>
  <text x="340" y="460" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">last resort. validate it yourself.</text>
  <text x="340" y="473" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">always pair with /// CHECK: comment</text>
  <text x="360" y="520" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Stop at the first yes. The earlier in the tree, the safer the type.</text>
  <text x="360" y="555" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">If you hit the bottom, take a hard look. Almost every legitimate use has a more specific type above.</text>
</svg>

The earlier the question lands on a "yes," the safer the resulting type. `Signer` constrains the account on exactly one dimension, that a signature is present, and demands nothing else. `UncheckedAccount` constrains it on zero. Most of the security bugs in Solana programs trace back to the same pattern: a developer reached for `UncheckedAccount` to keep moving, then forgot to add the manual validation that the type's "do nothing" semantics imply.

## A note on `AccountInfo`

If you read older Anchor code or the underlying Solana SDK, you will see `AccountInfo<'info>` everywhere. It's the raw type that the runtime hands to a program: just an account's public key, owner, lamports, data, and flags. `UncheckedAccount` is a wrapper around `AccountInfo` whose only added behavior is the `/// CHECK:` requirement at compile time. The underlying account data is identical. In a modern Anchor program, prefer `UncheckedAccount` because the compile-time requirement to justify the unchecked access is exactly the kind of friction that prevents you from accidentally skipping validation.
