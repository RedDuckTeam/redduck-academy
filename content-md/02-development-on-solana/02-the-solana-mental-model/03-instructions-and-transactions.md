# Instructions and transactions

_type: lecture_

> Accounts hold the state. Instructions change it. A transaction is the envelope that carries one or more instructions to the chain, signed by whoever has the authority to make them happen. Nothing else on Solana changes state. Every balance update, every program deployment, every NFT mint is a transaction.

## An instruction is a function call

The easiest way to picture an instruction is as a single function call on the blockchain. Three pieces:

The **program_id** says which program you want to run. It's the address of the program account that holds the code. Calling the Token Program's transfer function means setting program_id to the Token Program's address.

The **accounts list** is the set of accounts the program will need to do its job. The reason this list has to be supplied up front rather than discovered during execution is parallel execution, covered in the previous lesson. The runtime has to know, before scheduling, which state the instruction will touch. Each entry in the list carries two flags: writable, meaning the program may modify this account, and signer, meaning this account's owner signed the transaction.

The **data** field is the raw arguments to the call, packed into bytes. The first byte usually identifies which function inside the program you want, since one program typically exposes many functions: transfer, mint, burn, and so on. The rest of the bytes are the argument values.

<svg role="img" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Anatomy of an instruction: program_id, accounts, and data</title><desc>An instruction has three parts: program_id (which program to call, e.g. the Token Program address), accounts (the accounts it touches, like alice_usdc, bob_usdc, and alice_wallet), and data (the arguments as bytes, such as a transfer of 100 USDC). Side labels compare these to a function call, where program_id is the function name, accounts are the argument handles, and data holds the argument values.</desc>
  <defs>
    <marker id="arrS23aG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Anatomy of an instruction</text>
  <rect x="200" y="100" width="320" height="300" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="200" y="100" width="320" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="121" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">one instruction</text>
  <text x="220" y="156" font-family="monospace" font-size="11" font-weight="bold">program_id</text>
  <text x="220" y="174" font-family="monospace" font-size="9" fill="#565653">which program to call</text>
  <text x="220" y="190" font-family="monospace" font-size="9" fill="#565653">e.g. Token Program address</text>
  <line x1="215" y1="204" x2="505" y2="204" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="220" y="226" font-family="monospace" font-size="11" font-weight="bold">accounts</text>
  <text x="220" y="244" font-family="monospace" font-size="9" fill="#565653">the list of accounts</text>
  <text x="220" y="258" font-family="monospace" font-size="9" fill="#565653">the program will touch:</text>
  <text x="220" y="278" font-family="monospace" font-size="9" fill="#565653">- alice_usdc    (writable)</text>
  <text x="220" y="292" font-family="monospace" font-size="9" fill="#565653">- bob_usdc      (writable)</text>
  <text x="220" y="306" font-family="monospace" font-size="9" fill="#565653">- alice_wallet  (signer)</text>
  <line x1="215" y1="320" x2="505" y2="320" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="220" y="342" font-family="monospace" font-size="11" font-weight="bold">data</text>
  <text x="220" y="360" font-family="monospace" font-size="9" fill="#565653">the arguments, as bytes:</text>
  <text x="220" y="376" font-family="monospace" font-size="9" fill="#565653">[3, 100_000_000]  (transfer, 100 USDC)</text>
  <text x="55" y="156" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">function</text>
  <text x="55" y="170" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">name</text>
  <line x1="135" y1="160" x2="195" y2="160" stroke="#565653" stroke-width="1" marker-end="url(#arrS23aG)"/>
  <text x="55" y="240" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">argument</text>
  <text x="55" y="254" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">handles</text>
  <line x1="135" y1="245" x2="195" y2="245" stroke="#565653" stroke-width="1" marker-end="url(#arrS23aG)"/>
  <text x="55" y="350" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">argument</text>
  <text x="55" y="364" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">values</text>
  <line x1="135" y1="355" x2="195" y2="355" stroke="#565653" stroke-width="1" marker-end="url(#arrS23aG)"/>
  <text x="360" y="440" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Think of an instruction as one function call. Program is the function, accounts are the inputs.</text>
</svg>

## A transaction wraps one or more instructions

A transaction is the unit that gets signed and submitted to the network. Its job is to carry a list of instructions, plus a bit of header information that lets the network process them safely.

The header has two important pieces. The **signatures** field is a list of signatures, one per account that signed. Signing happens at the transaction level rather than at the instruction level, so every signer authorizes every instruction in the transaction at once. The **recent_blockhash** is the hash of a recent block. It proves the transaction was built recently. Validators reject transactions whose blockhash is more than about 150 blocks old, which prevents replays of the same transaction far in the future.

The instructions inside the transaction execute in order, top to bottom, and they execute atomically. Either every instruction succeeds and the chain commits all of their state changes, or one of them fails and none of the changes happen. There is no partial state. This is the same atomicity you get from a database transaction. The fee is charged either way, since the validators did the work to try.

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Transaction structure: signatures, recent_blockhash, and three ordered instructions</title><desc>One transaction holds signatures, a recent_blockhash, and a list of three instructions: a Token Program transfer of 100 USDC, a Memo Program note, and a Compute Budget priority fee. The instructions run in order and are atomic, so either all three succeed or none do, though the fee is charged either way.</desc>
  <defs>
    <marker id="arrS23bR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A transaction wraps one or more instructions</text>
  <rect x="40" y="90" width="640" height="320" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <rect x="40" y="90" width="640" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="112" text-anchor="middle" font-family="monospace" font-size="12" fill="#ffffff" font-weight="bold">one transaction</text>
  <text x="60" y="148" font-family="monospace" font-size="10" font-weight="bold">signatures</text>
  <text x="155" y="148" font-family="monospace" font-size="9" fill="#565653">one per signer, signed at the transaction level</text>
  <text x="60" y="170" font-family="monospace" font-size="10" font-weight="bold">recent_blockhash</text>
  <text x="195" y="170" font-family="monospace" font-size="9" fill="#565653">proves the transaction is fresh (expires in ~150 blocks)</text>
  <line x1="55" y1="184" x2="665" y2="184" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="206" font-family="monospace" font-size="10" font-weight="bold">instructions</text>
  <text x="170" y="206" font-family="monospace" font-size="9" fill="#565653">a list, executed in order, all-or-nothing</text>
  <rect x="60" y="220" width="600" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="78" y="240" font-family="monospace" font-size="10" font-weight="bold">1.</text>
  <text x="100" y="240" font-family="monospace" font-size="10">Token Program</text>
  <text x="245" y="240" font-family="monospace" font-size="9" fill="#565653">accounts: [alice_balance, bob_balance]</text>
  <text x="100" y="258" font-family="monospace" font-size="9" fill="#565653">transfer 100 USDC</text>
  <rect x="60" y="280" width="600" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="78" y="300" font-family="monospace" font-size="10" font-weight="bold">2.</text>
  <text x="100" y="300" font-family="monospace" font-size="10">Memo Program</text>
  <text x="245" y="300" font-family="monospace" font-size="9" fill="#565653">accounts: []</text>
  <text x="100" y="318" font-family="monospace" font-size="9" fill="#565653">"thanks for lunch"</text>
  <rect x="60" y="340" width="600" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="78" y="360" font-family="monospace" font-size="10" font-weight="bold">3.</text>
  <text x="100" y="360" font-family="monospace" font-size="10">Compute Budget</text>
  <text x="245" y="360" font-family="monospace" font-size="9" fill="#565653">accounts: []</text>
  <text x="100" y="378" font-family="monospace" font-size="9" fill="#565653">set priority fee</text>
  <text x="360" y="436" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Atomic execution: every instruction succeeds, or the whole transaction reverts.</text>
  <text x="360" y="455" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">No partial outcomes. Either all three above happen, or none of them do.</text>
  <text x="360" y="479" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">The fee is charged either way.</text>
</svg>

This is why batching multiple instructions in one transaction is useful. A swap on a decentralized exchange might be three instructions: approve the trade, execute the swap, refund leftover funds. Packaging them as one transaction means the trade either fully happens or fully does not. The user never ends up in a halfway state where the approval went through but the swap did not.

## The access list is the access-control layer

The accounts list has more responsibilities than it appears. Every account a transaction touches has to appear on this list, marked as read-only or writable, and marked as a signer or not. The runtime uses this list for three things, all of them before any program code runs.

First, **parallel scheduling**. Two transactions whose writable account sets do not overlap can run side by side on different threads. The runtime can sort the incoming traffic into batches just by reading these lists. If the lists were not declared up front, the runtime would have to actually run each transaction to find out what it touched, which would defeat the whole parallel-execution goal.

Second, **signer enforcement**. If an instruction expects an account to be a signer, say a transfer expecting the sender to have signed, the runtime checks that the corresponding signature is present in the transaction's signatures list. If not, the transaction fails before the program even loads. Your program code can rely on the fact that any account marked as a signer was actually signed for.

Third, **owner enforcement**. Before letting a program write to a writable account, the runtime checks that the account's owner field matches the program being invoked. A program cannot write to accounts it does not own. This is the security model from the accounts lecture, made operational on every transaction.

The cost of all this is that the client building the transaction has to know in advance which accounts the program will need and how each of them should be marked. The benefit is that every transaction arrives with its security and parallelism contract on the outside, fully readable by the runtime without executing a single line of code.

## A worked example

Alice wants to send Bob 100 USDC. Here is what her transaction actually looks like.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Alice's transaction sending 100 USDC to Bob, step by step</title><desc>The diagram shows the transaction Alice signs: it calls the Token Program with data transfer(100_000_000), using accounts alice_usdc (writable, balance down), bob_usdc (writable, balance up), and alice_wallet (signer). Before running, the runtime checks that alice_wallet signed, that both balances are owned by the Token Program, and that the recent_blockhash is valid, then the program executes and the result is alice_usdc.amount -= 100 and bob_usdc.amount += 100.</desc>
  <defs>
    <marker id="arrS23cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
    <marker id="arrS23cG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Alice sends 100 USDC to Bob</text>
  <rect x="40" y="80" width="640" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="100" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">the transaction Alice signs and sends</text>
  <text x="60" y="128" font-family="monospace" font-size="10" font-weight="bold">program:</text>
  <text x="160" y="128" font-family="monospace" font-size="10">Token Program</text>
  <text x="350" y="128" font-family="monospace" font-size="9" fill="#565653">the function being called</text>
  <text x="60" y="150" font-family="monospace" font-size="10" font-weight="bold">data:</text>
  <text x="160" y="150" font-family="monospace" font-size="10">transfer(100_000_000)</text>
  <text x="350" y="150" font-family="monospace" font-size="9" fill="#565653">100 USDC, in raw units</text>
  <text x="60" y="172" font-family="monospace" font-size="10" font-weight="bold">accounts:</text>
  <text x="80" y="194" font-family="monospace" font-size="10">alice_usdc</text>
  <text x="220" y="194" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">[writable]</text>
  <text x="380" y="194" font-family="monospace" font-size="9" fill="#565653">balance going down</text>
  <text x="80" y="214" font-family="monospace" font-size="10">bob_usdc</text>
  <text x="220" y="214" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">[writable]</text>
  <text x="380" y="214" font-family="monospace" font-size="9" fill="#565653">balance going up</text>
  <text x="80" y="234" font-family="monospace" font-size="10">alice_wallet</text>
  <text x="220" y="234" font-family="monospace" font-size="9" font-weight="bold">[signer]</text>
  <text x="380" y="234" font-family="monospace" font-size="9" fill="#565653">authorizes the transfer</text>
  <line x1="360" y1="258" x2="360" y2="285" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS23cR)"/>
  <rect x="40" y="290" width="640" height="115" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="312" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Before any code runs, the runtime checks:</text>
  <line x1="55" y1="320" x2="665" y2="320" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="340" font-family="monospace" font-size="10">1. Are the listed signers present? alice_wallet is required, and it signed.</text>
  <text x="60" y="358" font-family="monospace" font-size="10">2. Are the writable accounts owned by the calling program? Both balances are Token-owned.</text>
  <text x="60" y="376" font-family="monospace" font-size="10">3. Is the recent_blockhash still valid? Yes.</text>
  <text x="60" y="394" font-family="monospace" font-size="10" fill="#565653">All three pass. The Token Program executes with these accounts as inputs.</text>
  <line x1="360" y1="412" x2="360" y2="439" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS23cR)"/>
  <rect x="40" y="445" width="640" height="55" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="467" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Result: alice_usdc.amount -= 100, bob_usdc.amount += 100</text>
  <text x="360" y="487" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">Two accounts changed. Nothing else on the chain was touched.</text>
</svg>

Three accounts on the list. Two of them are the actual balances, marked writable because their data is going to change. The third is Alice's wallet, marked as a signer because the Token Program will check that whoever owns alice_usdc authorized the transfer. Alice's wallet does not need to be writable. The Token Program does not modify the wallet itself, only the balance accounts.

When this transaction lands on the network, the runtime does its checks, then loads the Token Program's code from the Token Program account and runs it. The program reads the data field of alice_usdc, subtracts 100 from the amount, writes the new value back. Does the same for bob_usdc in reverse. Returns success. The transaction commits, the new state is included in the next block, and the network keeps going.
