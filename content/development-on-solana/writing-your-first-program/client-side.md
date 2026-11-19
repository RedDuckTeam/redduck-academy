---
id: 234
title: Client side
type: lecture
order: 35
faq:
  - question: Which package do I use to call an Anchor program from TypeScript?
    answer: >-
      @coral-xyz/anchor. It reads the IDL and gives you
      program.methods.deposit(amount).accounts({...}).rpc() instead of hand-assembled
      instructions. It sits on @solana/web3.js, which still supplies Connection, Keypair and
      Transaction.
  - question: Why is the account data I read back a Buffer of raw bytes?
    answer: >-
      connection.getAccountInfo hands back the bytes and nothing more, because web3.js has no
      idea what layout the program uses. Read it through the Anchor client instead, where
      program.account.counter.fetch(counterPda) decodes with the IDL and gives you
      counter.value as a number.
  - question: How do I send a transaction from a script?
    answer: >-
      Build a Transaction, add instructions to it such as SystemProgram.transfer, then call
      sendAndConfirmTransaction with the connection, the transaction and an array of signers.
      That one call signs, sends and waits for confirmation.
  - question: Does my frontend ever hold the user's private key?
    answer: >-
      Never. The key stays inside the browser wallet, Phantom, Backpack or Solflare. You hand
      the transaction to the wallet adapter, the wallet shows an approve or reject popup, and it
      comes back signed.
  - question: What does the second argument to new Connection mean?
    answer: >-
      The commitment level. confirmed is the normal choice for a read that has to reflect a
      landed transaction. finalized is stricter and slower.
---

> The code that talks to your program builds transactions, sends them to the network, fetches account data, and connects users' wallets. That client code is TypeScript, where the most mature libraries and the most production code live. The client also decides which accounts each instruction receives, so the program cannot assume they are the right ones.

## The client builds the instruction and picks its accounts

An instruction has three parts: the address of the program to call, an ordered list of accounts with a signer flag and a writable flag on each, and the bytes of instruction data. The [instructions and transactions lesson](/courses/development-on-solana/the-solana-mental-model/instructions-and-transactions) covers the format. The client assembles all three. With `@solana/web3.js`, the base client library, a call to the `deposit` instruction from the [program structure lesson](/courses/development-on-solana/writing-your-first-program/anchor-and-program-structure) looks like this:

```typescript
// Without Anchor: assemble the instruction from raw parts
const instruction = new TransactionInstruction({
  programId: new PublicKey("Fg6PaFpoGXkYsidMpWxqSWPg2J9eRMK8RnPwYxNb8nN"),
  keys: [
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: user.publicKey, isSigner: true, isWritable: false },
  ],
  data: Buffer.concat([
    Buffer.from([242, 35, 198, 137, 82, 225, 242, 182]),  // discriminator of deposit
    new BN(100).toArrayLike(Buffer, "le", 8),  // amount
  ]),
});
```

The data starts with the discriminator, 8 bytes that tell an Anchor program which instruction to run, and the arguments follow it. The IDL lists the discriminator of every instruction.

The program takes no part in building this object. Whoever writes the client fills the `keys` array, so they decide which account lands in each position. Your own frontend passes the accounts you intended. An attacker writes a different client and passes whatever accounts help them, and the program receives both lists in the same form. The program does not choose its accounts, so it has to check them, and that is the job of the [types](/courses/development-on-solana/writing-your-first-program/account-types-in-anchor) and [constraints](/courses/development-on-solana/writing-your-first-program/account-constraints) on every field of an Accounts struct.

## The Anchor client builds the instruction from the IDL

`@coral-xyz/anchor`, the client SDK for Anchor, wraps web3.js. It reads the program's [IDL](/courses/development-on-solana/writing-your-first-program/the-idl) and gives you a typed method for every instruction, so you don't construct raw `TransactionInstruction` objects by hand:

```typescript
import { Program, BN } from "@coral-xyz/anchor";
import type { MyProgram } from "./target/types/my_program";
import IDL from "./target/idl/my_program.json";

const program = new Program<MyProgram>(IDL, provider);

// Typed method calls. The compiler knows the instruction takes a u64,
// the field names of `.accounts()` come from the IDL, everything checks.
await program.methods
  .deposit(new BN(100))
  .accounts({
    vault,
    depositor: user.publicKey,
  })
  .rpc();
```

You write less code, and TypeScript catches your mistakes at compile time instead of letting them fail at runtime in production. The types come from `target/types/my_program.ts`, which `anchor build` writes next to the IDL. Without the `<MyProgram>` type parameter, `program.methods` accepts any arguments. The client still picks the accounts: `.accounts({...})` is the same list, with field names from the IDL in place of positions. `vault` is the address of a `Vault` account the program created earlier.

The `provider` passed to `Program` holds the two things every call needs: a connection to an RPC node and a wallet that signs.

## Every request goes through a connection to an RPC node

The Connection is a thin wrapper around the JSON-RPC API the validator exposes. Fetching account data, sending transactions, and subscribing to changes all go through this object. A script builds the provider from a connection and a keypair it loads from a file:

```typescript
import { readFileSync } from "fs";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";

// Connect to devnet, the public testing cluster.
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Load the keypair that signs and pays fees. Keypair.generate() makes a new one.
const user = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync("./my-key.json", "utf-8"))),
);

const provider = new AnchorProvider(connection, new Wallet(user), {
  commitment: "confirmed",
});
```

The second argument to `Connection`, `"confirmed"`, is the commitment level. It controls how strict the RPC is about what counts as "known." Higher commitment means more validators have agreed, but it also means slightly higher latency. For reads where you want to make sure the transaction has actually landed, `"confirmed"` is the standard choice. For the strictest possible read after a transaction has been finalized, use `"finalized"`. The provider has its own commitment, and `.rpc()` returns once the transaction reaches it. Its default is `"processed"`, lower than the connection's `"confirmed"`, so a read right after `.rpc()` can return the account as it was before the write. The example sets the provider to `"confirmed"` as well.

A signed transaction does not stay valid for long. It carries a recent blockhash, and validators reject it once that blockhash is more than about 150 blocks old. If the transaction was not confirmed by then, it will not land, and the client has to build and sign a new one. The client can also simulate a transaction before sending it. The simulation returns the result and the compute units consumed, so a transaction that would fail shows up before it is sent. The [fees and compute units lesson](/courses/development-on-solana/the-solana-mental-model/transaction-fees-and-compute-units) uses the same simulation to set the compute unit limit.

## Account data comes back as raw bytes until the IDL decodes it

The basic primitive for reading is `getAccountInfo`:

```typescript
const accountInfo = await connection.getAccountInfo(vault);

if (accountInfo === null) {
  console.log("account doesn't exist");
} else {
  console.log("owner:", accountInfo.owner.toBase58());
  console.log("lamports:", accountInfo.lamports);
  console.log("data:", accountInfo.data);  // a Buffer of raw bytes
}
```

`accountInfo.data` is a raw `Buffer` of bytes. Web3.js doesn't know what those bytes mean. If you want to read the fields of an Anchor account, you have to decode them according to the layout the program uses. The Anchor client does that with the IDL:

```typescript
const vaultAccount = await program.account.vault.fetch(vault);
console.log("total:", vaultAccount.total.toNumber());  // typed Vault struct
```

## A script holds the key, a frontend asks the wallet to sign

Every transaction needs at least one signer, and that signer pays the fee. In **scripts and backends**, you usually hold the keypair yourself. You load it from a file or an environment variable into a `Keypair` object, as the connection example does with `user`, and your code uses it to sign transactions directly. You'll use this in your test files and in any off-chain automation you write.

To send an instruction you built by hand, add it to a `Transaction` and call `sendAndConfirmTransaction` with the connection, the transaction, and an array of signers. That one call signs, sends, and waits for confirmation.

In **frontends**, you never hold the keypair. The user's private key lives in their browser wallet (Phantom, Backpack, Solflare), and your code asks the wallet to sign through the wallet adapter, a library that abstracts over which wallet the user installed.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Wallet adapter flow between frontend app and browser wallet</title><desc>The frontend app builds a transaction and passes it through the wallet adapter to the user's browser wallet (Phantom, Backpack, or Solflare). The wallet shows an approve or reject popup, keeps the private key, and sends the signed transaction back so the frontend can submit it to the RPC and wait for confirmation.</desc>
  <defs>
    <marker id="arrW1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
    <marker id="arrW2" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">How a frontend talks to a user's wallet</text>
  <rect x="40" y="85" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="200" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="140" y="101" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Your frontend app</text>
  <text x="55" y="125" font-family="monospace" font-size="9">React or other UI</text>
  <text x="55" y="140" font-family="monospace" font-size="9">builds a transaction</text>
  <text x="55" y="155" font-family="monospace" font-size="9">asks user to sign it</text>
  <rect x="280" y="85" width="200" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="280" y="85" width="200" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="380" y="101" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Wallet adapter</text>
  <text x="295" y="125" font-family="monospace" font-size="9">npm library</text>
  <text x="295" y="140" font-family="monospace" font-size="9">talks to any wallet</text>
  <text x="295" y="155" font-family="monospace" font-size="9">via a common API</text>
  <rect x="520" y="85" width="160" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="520" y="85" width="160" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="600" y="101" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Browser wallet</text>
  <text x="535" y="125" font-family="monospace" font-size="9">Phantom</text>
  <text x="535" y="140" font-family="monospace" font-size="9">Backpack</text>
  <text x="535" y="155" font-family="monospace" font-size="9">Solflare</text>
  <line x1="240" y1="125" x2="275" y2="125" stroke="#ed4937" stroke-width="2" marker-end="url(#arrW1)"/>
  <line x1="480" y1="125" x2="515" y2="125" stroke="#ed4937" stroke-width="2" marker-end="url(#arrW1)"/>
  <line x1="600" y1="170" x2="600" y2="210" stroke="#ed4937" stroke-width="2" marker-end="url(#arrW1)"/>
  <rect x="450" y="215" width="230" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="450" y="215" width="230" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="565" y="231" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">User sees a popup</text>
  <text x="465" y="255" font-family="monospace" font-size="9">"App wants you to sign:"</text>
  <text x="465" y="270" font-family="monospace" font-size="9">[Approve]  [Reject]</text>
  <text x="465" y="285" font-family="monospace" font-size="9" fill="#565653">user's private key never leaves</text>
  <line x1="450" y1="310" x2="200" y2="310" stroke="#565653" stroke-width="2" marker-end="url(#arrW2)"/>
  <text x="325" y="303" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">signed transaction comes back</text>
  <rect x="40" y="330" width="200" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="330" width="200" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="140" y="346" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Your frontend app</text>
  <text x="55" y="370" font-family="monospace" font-size="9">receives signed tx</text>
  <text x="55" y="385" font-family="monospace" font-size="9">sends it to the RPC</text>
  <text x="55" y="400" font-family="monospace" font-size="9">waits for confirmation</text>
  <line x1="140" y1="170" x2="140" y2="325" stroke="#ed4937" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="360" y="450" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The wallet adapter is a small library that handles the conversation</text>
  <text x="360" y="468" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">between your app and whichever wallet the user installed.</text>
  <text x="360" y="490" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Your code is the same regardless of which wallet they picked.</text>
</svg>

Your app never sees the user's private key, so it cannot leak it. The library also handles wallet detection, connection state, and account changes. In React projects you wrap your app in a `WalletProvider` and use the `useWallet()` hook to get the currently connected wallet's pubkey and signing functions.

## Four packages cover the client side

| Package | What it gives you |
| --- | --- |
| `@solana/web3.js` | The primitives: `Connection` for talking to an RPC node, `Keypair` for holding a private key, `Transaction` and `TransactionInstruction` for building transactions. |
| `@coral-xyz/anchor` | The Anchor client: typed methods for every instruction and decoded accounts, both from the IDL. |
| `@solana/wallet-adapter-react` | The connection between a frontend and browser wallets like Phantom, Backpack, and Solflare. |
| `@solana/kit` | The newer modular successor to web3.js, with a slightly different API. |

For this course we'll stick with `@solana/web3.js` version 1, because `@coral-xyz/anchor` and bankrun depend on it. Install it as `@solana/web3.js@1`. The current release on npm is version 3, where `Keypair.generate()` returns a promise and `findProgramAddressSync` no longer exists, so the code in this course does not compile against it. You should still recognize `@solana/kit` when you see it in newer projects.
