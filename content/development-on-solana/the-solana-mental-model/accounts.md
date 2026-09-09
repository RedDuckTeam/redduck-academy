---
id: 182
title: Accounts
type: lecture
order: 2
faq:
  - question: What fields does a Solana account have?
    answer: >-
      Five. An address, which is a public key. A lamports balance. A data field of raw bytes
      whose meaning is set by the owner. An owner, the one program allowed to change that
      data. And an executable flag, true only when the data is runnable code. Wallets, token
      balances and deployed programs are these same five fields filled in differently.
  - question: Where is my token balance actually stored?
    answer: >-
      In its own account, owned by the Token Program. Your wallet account holds none of it.
      The 165 bytes of data record the mint, the authorized user and the current amount, and
      the Token Program enforces that only that user can move the balance.
  - question: What keeps another program from writing to my account and taking my tokens?
    answer: >-
      The owner field. Before any code runs, the runtime checks that every account the
      transaction marks writable is owned by the program trying to change it, and rejects
      the transaction otherwise.
  - question: How big can an account's data field be?
    answer: >-
      Zero bytes up to ten megabytes, fixed at creation.
---

> Everything on Solana is an account. Wallets are accounts. Token balances are accounts. Deployed programs are accounts. Once this clicks, half of Solana stops being confusing.

## The one-sentence version

A useful way to picture the Solana state is as a giant file system. Each file has a name, some contents, an owner that decides who can edit it, and a small storage fee paid up front. On Solana, those files are called accounts. The chain holds millions of them, the runtime knows how to read and write them, and every program you'll ever write does its work by handing accounts around.

## What's actually inside an account

Each account has five things and only five things.

An **address**, which is a public key written as a Base58 string. The address is how anyone refers to the account. You look it up by address the same way you'd open a file by its path.

A **lamports** balance. Lamports are the smallest unit of SOL, one billionth of a SOL. Every account holds some lamports. For a wallet, this is the user's balance. For other kinds of accounts, the lamports cover the storage cost.

A **data** field. A flat blob of bytes, sized at creation, anywhere from zero bytes up to ten megabytes. The meaning of those bytes is entirely up to the owner program. The runtime treats it as opaque.

An **owner**, which is the address of one specific program. That program is the only one allowed to modify the data field. The runtime checks this on every transaction before any code touches the account.

An **executable** flag, true or false. If true, the data is compiled program code that can be invoked. If false, the data is just bytes that someone reads and writes.

That's the entire structure. There is nothing else.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Anatomy of a Solana account: address, lamports, data, owner, executable</title><desc>A box shows a Solana account with its address (public key) at the top and four fields below: lamports (how much SOL it holds), data (a blob of bytes the owner defines), owner (the one program that can write to the data), and executable (true if the data is code, false if it is just bytes). Side notes compare the account to a file on the chain's file system, opened by its address, and note that wallets, tokens, and programs all share this same structure.</desc>
  <defs>
    <marker id="arrS22aG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Anatomy of a Solana account</text>
  <rect x="200" y="100" width="340" height="280" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="200" y="100" width="340" height="36" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="124" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">address (the public key)</text>
  <text x="220" y="170" font-family="monospace" font-size="11" font-weight="bold">lamports</text>
  <text x="350" y="170" font-family="monospace" font-size="10" fill="#565653">how much SOL it holds</text>
  <line x1="215" y1="184" x2="505" y2="184" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="220" y="208" font-family="monospace" font-size="11" font-weight="bold">data</text>
  <text x="350" y="208" font-family="monospace" font-size="10" fill="#565653">a blob of bytes</text>
  <text x="350" y="223" font-family="monospace" font-size="10" fill="#565653">whatever the owner wants</text>
  <line x1="215" y1="240" x2="505" y2="240" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="220" y="264" font-family="monospace" font-size="11" font-weight="bold">owner</text>
  <text x="350" y="264" font-family="monospace" font-size="10" fill="#565653">the one program that can</text>
  <text x="350" y="279" font-family="monospace" font-size="10" fill="#565653">write to the data field</text>
  <line x1="215" y1="296" x2="505" y2="296" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="220" y="320" font-family="monospace" font-size="11" font-weight="bold">executable</text>
  <text x="350" y="320" font-family="monospace" font-size="10" fill="#565653">true if the data is code,</text>
  <text x="350" y="335" font-family="monospace" font-size="10" fill="#565653">false if the data is just bytes</text>
  <line x1="215" y1="352" x2="505" y2="352" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="372" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">that's the whole structure</text>
  <text x="100" y="180" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">a file</text>
  <text x="100" y="200" font-family="monospace" font-size="9" fill="#565653">on the chain's</text>
  <text x="100" y="215" font-family="monospace" font-size="9" fill="#565653">file system</text>
  <line x1="155" y1="200" x2="195" y2="240" stroke="#565653" stroke-width="1" marker-end="url(#arrS22aG)"/>
  <text x="600" y="180" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">opened</text>
  <text x="600" y="195" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">by name</text>
  <text x="595" y="215" font-family="monospace" font-size="9" fill="#565653">addressed via</text>
  <text x="595" y="230" font-family="monospace" font-size="9" fill="#565653">its public key</text>
  <line x1="600" y1="155" x2="540" y2="125" stroke="#565653" stroke-width="1" marker-end="url(#arrS22aG)"/>
  <text x="360" y="425" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Every piece of state on Solana looks like this. Wallets, tokens, programs, all the same shape.</text>
</svg>

## Three accounts you'll meet on day one

The strength of this design shows up when you see how many different things fit into the same five fields. Look at three concrete examples.

**Alice's wallet.** When someone "has a Solana address," what they actually have is an account owned by the System Program, the built-in program that handles SOL transfers. The data field is empty. The lamports field is Alice's SOL balance. The executable flag is false. That's a wallet.

**Alice's USDC balance.** Token balances do not live inside the user's wallet. They live in their own separate accounts, owned by the Token Program. The data field contains 165 bytes: the mint that issued the token, the user who owns the balance, and the current amount. The lamports field holds just enough to cover the storage cost. The executable flag is false. Alice does not own this account in the runtime sense, the Token Program does. Alice is recorded inside the data as the authorized user, and the Token Program enforces that nobody else can move the balance.

**A deployed program.** When you build and deploy a program to Solana, the deployment produces an account at a fresh address. The data field contains the compiled bytecode, often a few hundred kilobytes of it. The owner is a system-level program called the BPF Loader, which is the only thing allowed to modify program code. The executable flag is true. That flag is how the runtime knows to treat this account's data as code rather than as plain bytes.

Same five fields, three completely different roles.

<svg role="img" viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Alice's wallet, USDC balance, and deployed program account fields compared</title><desc>Three cards show the same five fields (address, lamports, data, owner, executable) for a wallet, a token balance, and a deployed program. Only the deployed program has executable set to true, owned by the BPF Loader, while the wallet and token account are owned by the System Program and Token Program and are not executable.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Three accounts you'll meet on day one</text>
  <rect x="40" y="90" width="200" height="320" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="140" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Alice's wallet</text>
  <text x="55" y="142" font-family="monospace" font-size="10" font-weight="bold">address</text>
  <text x="55" y="158" font-family="monospace" font-size="9" fill="#565653">8fK3...wXyz</text>
  <line x1="55" y1="170" x2="225" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="190" font-family="monospace" font-size="10" font-weight="bold">lamports</text>
  <text x="55" y="206" font-family="monospace" font-size="9" fill="#565653">2,500,000,000</text>
  <text x="55" y="220" font-family="monospace" font-size="9" fill="#565653">(2.5 SOL)</text>
  <line x1="55" y1="232" x2="225" y2="232" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="252" font-family="monospace" font-size="10" font-weight="bold">data</text>
  <text x="55" y="268" font-family="monospace" font-size="9" fill="#565653">empty (0 bytes)</text>
  <line x1="55" y1="280" x2="225" y2="280" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="300" font-family="monospace" font-size="10" font-weight="bold">owner</text>
  <text x="55" y="316" font-family="monospace" font-size="9" fill="#565653">System Program</text>
  <line x1="55" y1="328" x2="225" y2="328" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="348" font-family="monospace" font-size="10" font-weight="bold">executable</text>
  <text x="55" y="364" font-family="monospace" font-size="9" fill="#565653">false</text>
  <text x="140" y="395" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">a user, holding SOL</text>
  <rect x="260" y="90" width="200" height="320" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="260" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Alice's USDC balance</text>
  <text x="275" y="142" font-family="monospace" font-size="10" font-weight="bold">address</text>
  <text x="275" y="158" font-family="monospace" font-size="9" fill="#565653">2pQr...mN8h</text>
  <line x1="275" y1="170" x2="445" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="275" y="190" font-family="monospace" font-size="10" font-weight="bold">lamports</text>
  <text x="275" y="206" font-family="monospace" font-size="9" fill="#565653">2,039,280</text>
  <text x="275" y="220" font-family="monospace" font-size="9" fill="#565653">(rent-exempt min)</text>
  <line x1="275" y1="232" x2="445" y2="232" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="275" y="252" font-family="monospace" font-size="10" font-weight="bold">data</text>
  <text x="275" y="268" font-family="monospace" font-size="9" fill="#565653">165 bytes:</text>
  <text x="275" y="282" font-family="monospace" font-size="9" fill="#565653">mint, owner, amount</text>
  <line x1="275" y1="294" x2="445" y2="294" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="275" y="314" font-family="monospace" font-size="10" font-weight="bold">owner</text>
  <text x="275" y="330" font-family="monospace" font-size="9" fill="#565653">Token Program</text>
  <line x1="275" y1="342" x2="445" y2="342" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="275" y="362" font-family="monospace" font-size="10" font-weight="bold">executable</text>
  <text x="275" y="378" font-family="monospace" font-size="9" fill="#565653">false</text>
  <text x="360" y="402" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">a token balance held by Alice</text>
  <rect x="480" y="90" width="200" height="320" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="480" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="580" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">A deployed program</text>
  <text x="495" y="142" font-family="monospace" font-size="10" font-weight="bold">address</text>
  <text x="495" y="158" font-family="monospace" font-size="9" fill="#565653">TokenkegQfe...</text>
  <line x1="495" y1="170" x2="665" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="495" y="190" font-family="monospace" font-size="10" font-weight="bold">lamports</text>
  <text x="495" y="206" font-family="monospace" font-size="9" fill="#565653">~1.4 SOL</text>
  <text x="495" y="220" font-family="monospace" font-size="9" fill="#565653">(rent for code size)</text>
  <line x1="495" y1="232" x2="665" y2="232" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="495" y="252" font-family="monospace" font-size="10" font-weight="bold">data</text>
  <text x="495" y="268" font-family="monospace" font-size="9" fill="#565653">~200 KB of code</text>
  <text x="495" y="282" font-family="monospace" font-size="9" fill="#565653">(compiled bytecode)</text>
  <line x1="495" y1="294" x2="665" y2="294" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="495" y="314" font-family="monospace" font-size="10" font-weight="bold">owner</text>
  <text x="495" y="330" font-family="monospace" font-size="9" fill="#565653">BPF Loader</text>
  <line x1="495" y1="342" x2="665" y2="342" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="495" y="362" font-family="monospace" font-size="10" font-weight="bold">executable</text>
  <text x="495" y="378" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">true</text>
  <text x="580" y="402" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">code that can be called</text>
  <text x="360" y="445" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Same structure, three different jobs. Only the owner program decides what the data means.</text>
</svg>

## The owner field is the security model

The single most important field on any account is the owner. Reads on Solana are public, anyone can fetch an account by address and see its contents. Writes go through one path. The runtime checks, before any program code runs, that any account marked writable in the transaction is owned by the program trying to modify it. If the check fails, the transaction is rejected before the program even starts.

This is what keeps your token balance safe. The Token Program owns your USDC balance account. When you sign a transaction asking the Token Program to move 50 USDC from your balance to Bob's, the Token Program runs, checks that you authorized the move, and updates both balance accounts. If a different program tries to write to your balance account directly, the runtime stops it before the program runs.

<svg role="img" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Who can read and write Alice's USDC balance account</title><desc>Alice's USDC balance account is owned by the Token Program, which is the only one allowed to write to it. Other programs and outside users querying the chain can read the account's data, but writing without going through the owner program is blocked.</desc>
  <defs>
    <marker id="arrS22cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
    <marker id="arrS22cG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Who can read, who can write</text>
  <rect x="270" y="170" width="180" height="100" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="270" y="170" width="180" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="190" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Alice's USDC balance</text>
  <text x="360" y="220" text-anchor="middle" font-family="monospace" font-size="10">data: amount = 100</text>
  <text x="360" y="240" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">owner: Token Program</text>
  <text x="360" y="258" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">lamports: 2,039,280</text>
  <rect x="270" y="80" width="180" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="100" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Token Program</text>
  <text x="360" y="118" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">the listed owner</text>
  <line x1="360" y1="132" x2="360" y2="167" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS22cR)"/>
  <text x="370" y="155" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">can write</text>
  <rect x="40" y="320" width="180" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="130" y="342" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Some other program</text>
  <text x="130" y="358" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">e.g. a DEX, a game,</text>
  <text x="130" y="372" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">anything you wrote</text>
  <line x1="218" y1="332" x2="268" y2="225" stroke="#565653" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrS22cG)"/>
  <text x="180" y="280" font-family="monospace" font-size="10" font-style="italic" fill="#565653">can read</text>
  <line x1="225" y1="350" x2="272" y2="260" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrS22cR)"/>
  <line x1="232" y1="290" x2="262" y2="320" stroke="#ed4937" stroke-width="3"/>
  <line x1="262" y1="290" x2="232" y2="320" stroke="#ed4937" stroke-width="3"/>
  <text x="170" y="395" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">cannot write</text>
  <rect x="500" y="320" width="180" height="65" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="590" y="342" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Anyone (a user, a node)</text>
  <text x="590" y="358" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">querying the chain</text>
  <text x="590" y="372" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">from outside</text>
  <line x1="502" y1="332" x2="452" y2="225" stroke="#565653" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrS22cG)"/>
  <text x="510" y="280" font-family="monospace" font-size="10" font-style="italic" fill="#565653">can read</text>
  <text x="360" y="430" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Reads are open. Writes go through the owner program. The runtime enforces this before code runs.</text>
</svg>

When you write a program of your own, the same rules apply to you. The accounts your program creates are owned by your program. No other program can touch their data. You don't write defensive code to check who's calling you. The runtime has already filtered out anyone who shouldn't be there.

## Programs are accounts too

Programs themselves are just accounts. When you deploy a program, you produce an account. The account's address becomes the program's identifier, the one you reference whenever you want to call into it. The data field holds the compiled bytecode. The executable flag is true.

Calling a program is the act of submitting a transaction that points at the program's address and provides the accounts the program needs to work with. The runtime sees the executable flag, loads the bytecode from the data field, and runs it with the listed accounts as inputs.

This is why Solana has no separate "contract address space". There is one address space, with one kind of account. Some of them happen to hold code instead of data.

## What you'll be doing with accounts

When you write your first program, you will be creating accounts, reading from them, and writing to them. You will set up each account at a deterministic address, decide how many bytes its data field should hold, and pay the lamports needed to keep it on chain. The runtime will check the ownership and the access lists on every call. Most of the bugs new Solana developers hit come from getting one of these wrong, which is why every piece of the model is worth understanding clearly before you write code that depends on it.
