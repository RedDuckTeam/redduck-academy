---
id: 184
title: Lamports, rent, and account lifecycle
type: lecture
order: 4
faq:
  - question: How many lamports are in one SOL?
    answer: >-
      One billion. Every balance, fee and storage deposit on Solana is counted in lamports.
  - question: Do I have to keep paying rent to store an account on Solana?
    answer: >-
      No. Every account holds a one-time deposit sized to its data and then sits on the
      chain for free. Paying rent each epoch until the balance ran out was deprecated, so
      rent now means that up-front deposit.
  - question: How much does an account's rent deposit cost?
    answer: >-
      Roughly 6,960 lamports per byte, plus 128 bytes of overhead per account. An empty
      wallet needs about 890,000 lamports, a 165-byte token account needs 2,039,280, and a
      200 KB program account needs about 1.4 SOL. Because the price is per byte, every
      account is sized at creation and growing it later costs an extra deposit.
  - question: Can I get back the SOL I paid to create an account?
    answer: >-
      Yes. Closing the account zeros its data and sends the whole lamports balance to a
      recipient you name. Applications holding user deposits refund them this way, so the
      user's net storage cost is zero.
  - question: Does my program pay for the accounts it creates?
    answer: >-
      No. The payer is an account listed in the transaction, almost always the user whose
      action triggered the creation.
---

> Every account on Solana costs something to keep on the chain. The cost works the way a security deposit at an apartment works: you pay it up front, the chain holds it while the account exists, and you get it back when the account closes.

One SOL is divided into one billion smaller units called lamports, and everything on the chain is measured in lamports: balances, fees, storage deposits, validator rewards. The base fee for one transaction signature is five thousand lamports, or 0.000005 SOL, and the storage deposit for a typical token account is around two million lamports, or 0.00204 SOL.

## Rent is a deposit that stays locked while the bytes are in use

Every byte of data on the chain has to be held in memory by every validator on the network. Holding data has a cost, and the chain charges for it. The name for that charge is **rent**.

On Ethereum storage is paid for at the moment of the write. The writer pays gas once, and the value then has to be held by every full node until something overwrites it. Clearing the value later returns only part of that gas. Solana ties the payment to the lifetime of the data. Each account holds a deposit in lamports that stays locked for as long as the bytes are occupied and comes back in full when the account is closed, so whoever receives the refund has a reason to close an account that is no longer used.

Solana originally also let an account pay a small amount each epoch out of its lamports balance until it ran out and got deleted. That mode was deprecated, and only the deposit remains. Every account on Solana today is rent-exempt, meaning it holds a minimum lamport balance proportional to its size that stays locked for as long as the account exists. When a developer says "rent" they mean this one-time deposit rather than an ongoing fee.

The deposit covers roughly two years of that per-epoch rent, which comes to about 6,960 lamports per byte, counted over the account's data plus 128 bytes of overhead. An empty wallet costs about 890,000 lamports. A 165-byte token account costs about 2,040,000 lamports. A 200-kilobyte program account costs about 1.4 SOL.

<svg role="img" viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Rent deposit sizes for an empty wallet, a token account, and a deployed program</title><desc>The diagram compares three accounts: an empty wallet (0 bytes, about 890,880 lamports), a token account (165 bytes, about 2,039,280 lamports), and a deployed program (about 200,000 bytes, about 1.4 SOL). A formula box below shows the deposit equals (account size in bytes plus 128 overhead) times about 6,960 lamports per byte, and notes the deposit is refunded when the account closes.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The deposit scales with the size of the account</text>
  <rect x="40" y="90" width="200" height="240" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="140" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">an empty wallet</text>
  <rect x="60" y="140" width="20" height="20" fill="#565653"/>
  <text x="90" y="155" font-family="monospace" font-size="10" fill="#565653">0 bytes</text>
  <line x1="55" y1="180" x2="225" y2="180" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="140" y="208" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">deposit needed:</text>
  <text x="140" y="232" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">~890,880</text>
  <text x="140" y="246" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">lamports</text>
  <text x="140" y="266" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">≈ 0.00089 SOL</text>
  <line x1="55" y1="284" x2="225" y2="284" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="140" y="305" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">just the bookkeeping overhead,</text>
  <text x="140" y="318" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">since the data is empty</text>
  <rect x="260" y="90" width="200" height="240" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="260" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">a token account</text>
  <rect x="280" y="140" width="80" height="20" fill="#565653"/>
  <text x="370" y="155" font-family="monospace" font-size="10" fill="#565653">165 bytes</text>
  <line x1="275" y1="180" x2="445" y2="180" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="208" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">deposit needed:</text>
  <text x="360" y="232" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">~2,039,280</text>
  <text x="360" y="246" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">lamports</text>
  <text x="360" y="266" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">≈ 0.00204 SOL</text>
  <line x1="275" y1="284" x2="445" y2="284" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="305" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">enough room for mint, owner,</text>
  <text x="360" y="318" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">amount, plus the overhead</text>
  <rect x="480" y="90" width="200" height="240" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="480" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="580" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">a deployed program</text>
  <rect x="500" y="140" width="160" height="20" fill="#565653"/>
  <text x="500" y="172" font-family="monospace" font-size="10" fill="#565653">~200,000 bytes (200 KB)</text>
  <line x1="495" y1="184" x2="665" y2="184" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="580" y="208" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">deposit needed:</text>
  <text x="580" y="232" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">~1,400,000,000</text>
  <text x="580" y="246" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">lamports</text>
  <text x="580" y="266" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">≈ 1.4 SOL</text>
  <line x1="495" y1="284" x2="665" y2="284" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="580" y="305" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">code is big, so the storage</text>
  <text x="580" y="318" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">cost is significant</text>
  <rect x="40" y="360" width="640" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="382" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">The math</text>
  <line x1="55" y1="390" x2="665" y2="390" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="408" text-anchor="middle" font-family="monospace" font-size="10">required deposit  =  (account size in bytes + 128 overhead) × ~6,960 lamports/byte</text>
  <text x="360" y="422" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">128 is fixed per account, the rate per byte is fixed by the network</text>
  <text x="360" y="455" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Bigger account, bigger deposit. The deposit is fully refundable when the account closes.</text>
</svg>

## An account is created, held for free, and closed for a refund

**Creating an account** takes one instruction from the System Program. That instruction does three things in one step: it allocates the right number of bytes for the account's data, transfers the rent-exempt deposit from a payer into the account's lamports field, and assigns ownership to a target program.

**Holding an account** does not cost anything. As long as the rent-exempt deposit is in place, the account stays on the chain indefinitely, with no further fee and no expiration.

**Closing an account** is two operations packed into one. The owner program zeros out the data field and transfers the entire lamports balance out to a recipient address you specify. Once the balance hits zero, the runtime considers the account uninitialized, and an account can be created at the same address again.

<svg role="img" viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Account lifecycle: create, hold, and close, with the lamport deposit refunded</title><desc>Three steps show an account's life: creating it makes Alice pay about 2,040,000 lamports, holding it has no ongoing fees, and closing it drains the lamports back to a recipient, usually Alice. A summary box shows the net storage cost is zero, since the deposit paid at creation equals the amount refunded at closing.</desc>
  <defs>
    <marker id="arrS24cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The life of an account: create, hold, close</text>
  <rect x="40" y="90" width="200" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="140" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">1. Create</text>
  <text x="60" y="142" font-family="monospace" font-size="10" font-weight="bold">payer:</text>
  <text x="115" y="142" font-family="monospace" font-size="10">Alice's wallet</text>
  <text x="60" y="162" font-family="monospace" font-size="10" font-weight="bold">action:</text>
  <text x="115" y="162" font-family="monospace" font-size="10">allocate bytes,</text>
  <text x="115" y="176" font-family="monospace" font-size="10">deposit lamports,</text>
  <text x="115" y="190" font-family="monospace" font-size="10">assign owner</text>
  <line x1="55" y1="204" x2="225" y2="204" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="140" y="224" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">Alice pays</text>
  <text x="140" y="240" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">~2,040,000 lamports</text>
  <line x1="240" y1="175" x2="280" y2="175" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS24cR)"/>
  <rect x="280" y="90" width="200" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="280" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="380" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">2. Hold</text>
  <text x="300" y="142" font-family="monospace" font-size="10" font-weight="bold">state:</text>
  <text x="350" y="142" font-family="monospace" font-size="10">the account exists,</text>
  <text x="350" y="156" font-family="monospace" font-size="10">read and written by</text>
  <text x="350" y="170" font-family="monospace" font-size="10">its owner program</text>
  <text x="300" y="192" font-family="monospace" font-size="10" font-weight="bold">fees:</text>
  <text x="350" y="192" font-family="monospace" font-size="10">none ongoing</text>
  <line x1="295" y1="206" x2="465" y2="206" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="380" y="226" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">the lamports</text>
  <text x="380" y="242" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">sit on the account</text>
  <line x1="480" y1="175" x2="520" y2="175" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS24cR)"/>
  <rect x="520" y="90" width="200" height="170" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="520" y="90" width="200" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="620" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">3. Close</text>
  <text x="540" y="142" font-family="monospace" font-size="10" font-weight="bold">action:</text>
  <text x="595" y="142" font-family="monospace" font-size="10">zero the data,</text>
  <text x="595" y="156" font-family="monospace" font-size="10">drain the lamports</text>
  <text x="595" y="170" font-family="monospace" font-size="10">to a recipient</text>
  <text x="540" y="192" font-family="monospace" font-size="10" font-weight="bold">recipient:</text>
  <text x="610" y="192" font-family="monospace" font-size="10">usually Alice</text>
  <line x1="535" y1="206" x2="705" y2="206" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="620" y="226" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">Alice gets back</text>
  <text x="620" y="242" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">~2,040,000 lamports</text>
  <rect x="40" y="290" width="680" height="115" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="312" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Net cost to Alice</text>
  <line x1="55" y1="320" x2="705" y2="320" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="340" font-family="monospace" font-size="10">paid at create:    +2,040,000 lamports</text>
  <text x="60" y="358" font-family="monospace" font-size="10">refunded at close: -2,040,000 lamports</text>
  <line x1="55" y1="364" x2="350" y2="364" stroke="#565653" stroke-width="1"/>
  <text x="60" y="380" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">net storage cost:        0 lamports</text>
  <text x="490" y="340" font-family="monospace" font-size="10" fill="#565653">The deposit is a hold</text>
  <text x="490" y="354" font-family="monospace" font-size="10" fill="#565653">rather than a payment.</text>
  <text x="490" y="376" font-family="monospace" font-size="10" fill="#565653">It only costs Alice</text>
  <text x="490" y="390" font-family="monospace" font-size="10" fill="#565653">if the account is never</text>
  <text x="490" y="404" font-family="monospace" font-size="10" fill="#565653">closed.</text>
  <text x="360" y="445" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">This refund pattern is how applications give users their deposits back when they exit.</text>
</svg>

## Size accounts, choose who pays, and close them when done

**Size.** Every account is sized at creation, and when you decide how big an account should be, you decide its cost. By the formula above, a 10,000-byte account costs about thirty times more than a 200-byte one. There is no penalty for using small accounts, so most production programs keep their accounts as small as the data they need to store. An account also cannot grow without bound. Its data is capped at ten megabytes, and growing it later takes a deliberate call that pays additional deposit for the new bytes.

**Who pays.** The deposit comes from one of the accounts listed in the transaction, marked as the payer. Your program does not pay out of its own balance. Choosing the payer is a design decision. The team can pre-create an account for every user and pay for all of them, or the program can create the account on a user's first action, funded by that user. Almost always it is the user whose action triggered the creation, since the user is the one who benefits from the new account existing. Tokens raise the same question. A wallet needs a separate token account for each token it holds, so the first time a wallet receives a given token, either the sender or the recipient has to lock about 2,040,000 lamports for the new account.

**Close.** When you want to clean up after a user, you close the account and send its lamports back to them, so their net storage cost is zero. The Anchor framework you'll be using has a `close` constraint that does this in one line. Programs that skip cleanup leave unused accounts on the chain and force their users to pay for storage they no longer need. A closed account can be brought back. Anyone can send lamports to its address later in the same transaction, and the runtime then keeps the account alive. [Account closure and realloc](/courses/development-on-solana/production-state-design/account-closure-and-realloc) shows the attack this allowed and how the `close` constraint prevents it.

For every account your program creates, decide who pays the deposit and who receives it when the account closes.
