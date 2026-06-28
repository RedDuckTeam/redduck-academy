# Lamports, rent, and account lifecycle

_type: lecture_

> Every account on Solana has a balance. Every account costs something to keep on the chain. Both numbers are measured in the same tiny unit, and both work the way a security deposit at an apartment works: you pay it up front, the chain holds it while the account exists, and you get it back when the account closes. Once that picture is in place, "rent" stops being a worry and becomes a one-time number you look up.

## SOL and lamports

A SOL is a big number split into a billion small pieces called lamports. One lamport is the smallest amount of value the chain knows how to talk about. Everything is measured in lamports underneath: balances, fees, storage deposits, validator rewards. SOL is the friendlier label humans put on top of large lamport numbers.

The conversion is exact. One SOL is one billion lamports. Half a SOL is five hundred million lamports. The base fee for one transaction signature is five thousand lamports, or 0.000005 SOL. Storage deposit for a typical token account is around two million lamports, or 0.00204 SOL. The numbers stay in the thousands and millions for almost everything you'll do day to day.

<svg viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">SOL and lamports at human scale</text>
  <rect x="40" y="90" width="640" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="115" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold">1 SOL  =  1,000,000,000 lamports</text>
  <text x="360" y="132" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">one lamport is one billionth of a SOL</text>
  <text x="60" y="170" font-family="monospace" font-size="11" font-weight="bold">amount</text>
  <text x="260" y="170" font-family="monospace" font-size="11" font-weight="bold">in lamports</text>
  <text x="460" y="170" font-family="monospace" font-size="11" font-weight="bold">what you'd see this for</text>
  <line x1="55" y1="178" x2="685" y2="178" stroke="#565653" stroke-width="1"/>
  <text x="60" y="206" font-family="monospace" font-size="11">1 SOL</text>
  <text x="260" y="206" font-family="monospace" font-size="10" fill="#565653">1,000,000,000</text>
  <text x="460" y="206" font-family="monospace" font-size="10" fill="#565653">a meaningful balance</text>
  <line x1="55" y1="216" x2="685" y2="216" stroke="#565653" stroke-width="0.5" stroke-dasharray="3 3"/>
  <text x="60" y="240" font-family="monospace" font-size="11">0.01 SOL</text>
  <text x="260" y="240" font-family="monospace" font-size="10" fill="#565653">10,000,000</text>
  <text x="460" y="240" font-family="monospace" font-size="10" fill="#565653">storage deposit for a small account</text>
  <line x1="55" y1="250" x2="685" y2="250" stroke="#565653" stroke-width="0.5" stroke-dasharray="3 3"/>
  <text x="60" y="274" font-family="monospace" font-size="11">0.00204 SOL</text>
  <text x="260" y="274" font-family="monospace" font-size="10" fill="#565653">2,039,280</text>
  <text x="460" y="274" font-family="monospace" font-size="10" fill="#565653">storage deposit for a token account</text>
  <line x1="55" y1="284" x2="685" y2="284" stroke="#565653" stroke-width="0.5" stroke-dasharray="3 3"/>
  <text x="60" y="308" font-family="monospace" font-size="11">0.000005 SOL</text>
  <text x="260" y="308" font-family="monospace" font-size="10" fill="#565653">5,000</text>
  <text x="460" y="308" font-family="monospace" font-size="10" fill="#565653">base fee for one signature</text>
  <line x1="55" y1="318" x2="685" y2="318" stroke="#565653" stroke-width="0.5" stroke-dasharray="3 3"/>
  <text x="60" y="342" font-family="monospace" font-size="11">0.000000001 SOL</text>
  <text x="260" y="342" font-family="monospace" font-size="10" fill="#565653">1</text>
  <text x="460" y="342" font-family="monospace" font-size="10" fill="#565653">one lamport, the smallest unit</text>
  <rect x="40" y="370" width="640" height="55" fill="#e0deda" stroke="#565653" stroke-width="1" stroke-dasharray="6 4"/>
  <text x="360" y="392" text-anchor="middle" font-family="monospace" font-size="10">Every balance, fee, and storage cost on Solana is measured in lamports.</text>
  <text x="360" y="408" text-anchor="middle" font-family="monospace" font-size="10">SOL is just the human-friendly way of writing big lamport numbers.</text>
  <text x="360" y="450" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Think of lamports as Solana's cents. Most amounts you'll see fit in a small number of digits.</text>
</svg>

## Rent, and why it is almost always a one-time deposit

Every byte of data on the chain has to be held in memory by every validator on the network. Holding data has a cost, and the chain charges for it. The name for that charge is **rent**.

Solana originally had two ways to pay for account storage. Accounts could pay a small amount each epoch out of their lamports balance until they ran out and got deleted, or they could deposit enough lamports up front to cover roughly two years of rent in advance and stop being charged. The first mode was deprecated, and only rent-exemption remains. Every account on Solana today is rent-exempt, meaning it holds a minimum lamport balance proportional to its size that stays locked for as long as the account exists. The language around rent has shifted accordingly. When a developer says "rent" they mean this one-time deposit, not an ongoing fee.

The size of the deposit scales with the bytes the account holds. A bigger account needs a bigger deposit. The math is fixed: roughly 6,960 lamports per byte, plus 128 bytes of overhead per account. An empty wallet costs about 890,000 lamports. A 165-byte token account costs about 2,040,000 lamports. A 200-kilobyte program account costs about 1.4 SOL.

<svg viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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

Two consequences fall out of this. The first is that every account on Solana has to be sized at creation time. You can't have an account that grows without bound, because growing it later means paying additional deposit to cover the new bytes. The second is that storage cost is paid by whoever creates the account, which is almost always either the user or the program acting on the user's behalf. The program never pays out of its own pocket. The lamports come from the user's wallet at the moment of creation.

## The life of an account

Every account on the chain follows the same three-stage life. It gets created, it sits there being read and written, and eventually it gets closed.

**Creating an account** takes one instruction from the System Program. That instruction does three things in one step: it allocates the right number of bytes for the account's data, transfers the rent-exempt deposit from a payer into the account's lamports field, and assigns ownership to a target program. After this completes, the new account exists, has the right size, holds the right balance, and the listed owner program can start using it.

**Holding an account** does not cost anything. As long as the rent-exempt deposit is in place, the account stays on the chain indefinitely. Validators keep it in memory, programs read and write its data field as their logic requires, and nothing on the network ever decides to garbage-collect it. There is no per-block fee, no expiration, no need to top up. The deposit just sits there.

**Closing an account** is two operations packed into one. The owner program zeros out the data field and transfers the entire lamports balance out to a recipient address you specify. Once the balance hits zero, the runtime considers the account uninitialized and free to be created again at the same address by anybody. The data is gone, the bytes are released, and the deposit you paid at creation is now sitting in whatever wallet received it.

<svg viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;">
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

The refund part is more useful than it looks at first. It means applications that ask users to deposit funds, like a staking program or a raffle, can give the deposit back when the user exits. The user's net storage cost is zero. They paid to hold space while they were using the application, and when they were done, the space went back to the pool and their money went back to their wallet.

## What this means when you write code

When your program creates an account, somebody has to pay the deposit. That somebody is one of the accounts listed in the transaction, marked as the payer. Almost always it is the user whose action triggered the creation, since the user is the one who benefits from the new account existing. Your program does not pay out of its own balance.

When you decide how big an account should be, you decide its cost. A 200-byte account is cheap. A 10,000-byte account is fifty times more expensive. There is no penalty for using small accounts, so most production programs keep their accounts as small as the data they need to store.

When you want to clean up after a user, you close the account and send its lamports back to them. The Anchor framework you'll be using has a `close` constraint that does this in one line. The user gets their deposit back, the account disappears, and the chain has less garbage in it. Programs that don't bother to clean up leave dust everywhere and force their users to pay for storage they no longer need.
