---
id: 234
title: Client side
type: lecture
order: 35
faq:
  - question: Which library should I use to call an Anchor program from TypeScript?
    answer: Use @coral-xyz/anchor, the Anchor client SDK. It reads your program's
      IDL and gives you typed methods, so you write
      program.methods.deposit(amount).accounts({...}).rpc() instead of
      assembling raw instructions by hand. It sits on top of @solana/web3.js,
      which provides the lower-level primitives like Connection, Keypair, and
      Transaction.
  - question: In a Solana frontend, where does the user's private key live when signing?
    answer: It stays inside the user's browser wallet extension, such as Phantom,
      Backpack, or Solflare. Your app hands the transaction to the wallet
      adapter, the wallet shows an approve-or-reject popup, signs with the key,
      and returns only the signed transaction. Your code never sees or stores
      the private key, so it cannot leak what it does not have. In scripts and
      backends, by contrast, you load a Keypair yourself.
  - question: How do I build and send a Solana transaction with @solana/web3.js?
    answer: Create a Connection to an RPC node, then build a Transaction by adding
      one or more instructions (for example SystemProgram.transfer to move SOL).
      Finally call sendAndConfirmTransaction with the connection, the
      transaction, and an array of signer keypairs; that single convenience
      function signs, sends, and waits for confirmation.
  - question: Why is on-chain account data a raw Buffer when I read it, and how do I
      decode it?
    answer: "connection.getAccountInfo returns the account's data as a raw Buffer of
      bytes, because plain web3.js does not know the program's layout. To read
      named fields, use the Anchor client, which uses the IDL to decode:
      program.account.counter.fetch(counterPda) returns a typed struct so you
      can read something like counter.value directly."
---

> Writing the program is half the work. The other half is the code that talks to it: building transactions, sending them to the network, fetching account data, and connecting users' wallets. This lecture is a tour of the client side of Solana development. We'll use TypeScript throughout the course, since that's where the most mature libraries and the most production code live. By the end of this lecture you should know which library does what, what a client transaction looks like, and how to recognize the building blocks you'll see in every Solana frontend.

## The libraries you'll be working with

The Solana client ecosystem in TypeScript revolves around a handful of packages. Knowing what each one is for is the most important starting point.

**`@solana/web3.js`** is the canonical client library, maintained by Solana Labs / Anza. It gives you the primitives: `Connection` for talking to an RPC node, `Keypair` for holding a private key, `Transaction` and `TransactionInstruction` for building transactions, and dozens of helper functions for common operations. Almost every Solana project depends on it.

**`@solana/kit`** is the newer modular successor to web3.js. Same idea, smaller and more tree-shakeable, with a slightly different API. You can think of it as web3.js v2: solid, growing in adoption, but most existing tutorials and codebases still use the older library. For this course we'll mostly stick with `@solana/web3.js` because that's what the tooling around Anchor and bankrun expects, but you should recognize `@solana/kit` when you see it in newer projects.

**`@coral-xyz/anchor`** is the client SDK for Anchor. If your program was written in Anchor (and most are), this library wraps web3.js with a higher-level API that reads your program's IDL — a JSON description of the program's interface — and gives you typed methods for every instruction. Instead of constructing raw `TransactionInstruction` objects by hand, you write `program.methods.deposit(amount).accounts({...}).rpc()`. Everything is typed end-to-end.

**`@solana/wallet-adapter`** is the standard library for connecting browser wallets like Phantom, Backpack, and Solflare to your frontend. It abstracts over which wallet the user installed, so your code is the same regardless of their choice.

Most projects use all four together: web3.js for low-level operations, Anchor client for typed program calls, wallet adapter for the user side of signing, and the modular kit packages where they fit.

## Connecting to the network

The first object you'll create in any client-side Solana code is a `Connection`. It represents your handle on an RPC node, and it's what you use to make requests.

```typescript
import { Connection, clusterApiUrl } from "@solana/web3.js";

// Connect to devnet, the public testing cluster.
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// In production you'd typically use your own RPC endpoint:
// const connection = new Connection("https://your-rpc-provider.example/", "confirmed");
```

The second argument, `"confirmed"`, is the commitment level. It controls how strict the RPC is about what counts as "known." Higher commitment means more validators have agreed, but it also means slightly higher latency. For reads where you want to make sure the transaction has actually landed, `"confirmed"` is the standard choice. For the strictest possible read after a transaction has been finalized, use `"finalized"`.

The Connection is a thin wrapper around the JSON-RPC API the validator exposes. Almost everything else you'll do, fetching account data, sending transactions, subscribing to changes, goes through this object.

## Keypairs and wallets: who actually signs

Every Solana transaction has to be signed by at least one keypair. The question is whose keypair, and that splits into two different worlds.

In **scripts and backends**, you usually hold the keypair yourself. You load it from a file or an environment variable into a `Keypair` object, and your code uses it to sign transactions directly. This is what you'll use in your test files and in any off-chain automation you write.

```typescript
import { Keypair } from "@solana/web3.js";

// Generate a fresh keypair (random private key).
const newKeypair = Keypair.generate();

// Or load one from a saved secret key (e.g. from a JSON file).
const fs = require("fs");
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync("./my-key.json", "utf-8")));
const myKeypair = Keypair.fromSecretKey(secretKey);

console.log("public key:", myKeypair.publicKey.toBase58());
```

In **frontends**, you never hold the keypair. The user's private key lives in their browser wallet (Phantom, Backpack, Solflare), and your code asks the wallet to sign. You don't see the private key. You don't store it. You just hand a transaction to the wallet adapter, the wallet asks the user to approve, and you get back a signed transaction. We'll come back to this when we get to wallet adapter.

## Building and sending a transaction

The core thing a client does is build a transaction, sign it, and send it. Here's the full shape using just `@solana/web3.js`:

```typescript
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

// 1. Connect to the network.
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// 2. Have a signer keypair ready (for scripts; in a frontend this comes from the wallet).
const payer = Keypair.generate();

// 3. Build the transaction. Here we transfer 0.1 SOL to a random recipient.
const recipient = Keypair.generate();
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: recipient.publicKey,
    lamports: 0.1 * LAMPORTS_PER_SOL,
  }),
);

// 4. Sign and send. `sendAndConfirmTransaction` is a convenience function
//    that signs, sends, and waits for confirmation in one call.
const signature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [payer],  // array of signers; in this case just the payer
);

console.log("transaction confirmed:", signature);
```

A few things worth pointing out about this code.

The `Transaction` object is a container for one or more instructions. Each instruction calls a specific program with specific accounts and arguments. Here we're using `SystemProgram.transfer`, which is a helper that constructs the right `TransactionInstruction` for transferring SOL. When you call your own programs, you'll either build the instruction by hand using web3.js, or have Anchor do it for you, which we cover in a moment.

The `signers` array tells the runtime which keypairs need to sign the transaction. Every transaction needs at least one signer, and that signer pays the fee. If the transaction touches accounts that require additional signatures, such as multi-sig setups or certain admin instructions, you include those keypairs here too.

In a script context this code runs to completion in a few hundred milliseconds. In a frontend, the equivalent code routes through the wallet adapter and the user approves the signing in a popup, but the structure is the same.

## Reading account data

Sending transactions is half the job. The other half is reading what's already on chain. The basic primitive is `getAccountInfo`:

```typescript
const accountInfo = await connection.getAccountInfo(somePublicKey);

if (accountInfo === null) {
  console.log("account doesn't exist");
} else {
  console.log("owner:", accountInfo.owner.toBase58());
  console.log("lamports:", accountInfo.lamports);
  console.log("data:", accountInfo.data);  // a Buffer of raw bytes
}
```

The limitation is that `accountInfo.data` is a raw `Buffer` of bytes. Web3.js doesn't know what those bytes mean. If you want to read the fields of an Anchor account, you have to decode them according to the layout the program uses, which is where the Anchor client comes in.

## Anchor client: typed methods from the IDL

When you compile an Anchor program, you get an IDL file, which is a JSON description of every instruction, every account type, and every error code. The Anchor client uses that IDL to give you typed methods.

Instead of building instructions by hand:

```typescript
// Without Anchor: assemble the instruction from raw parts
const instruction = new TransactionInstruction({
  programId: new PublicKey("MyProgram..."),
  keys: [
    { pubkey: user.publicKey, isSigner: true, isWritable: true },
    { pubkey: counter, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.concat([
    Buffer.from([0]),  // instruction discriminator
    new BN(100).toArrayLike(Buffer, "le", 8),  // amount
  ]),
});
```

You get something much nicer:

```typescript
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import IDL from "./my_program.json";

const program = new Program(IDL, provider);

// Typed method calls. The compiler knows the instruction takes a u64,
// the field names of `.accounts()` come from the IDL, everything checks.
await program.methods
  .initialize(new BN(100))
  .accounts({
    user: user.publicKey,
    counter: counterPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([user])
  .rpc();
```

Same for reading accounts. Instead of decoding bytes by hand, you get typed access:

```typescript
const counter = await program.account.counter.fetch(counterPda);
console.log("value:", counter.value.toNumber());  // typed Counter struct
```

This is why almost every modern Solana frontend uses the Anchor client when interacting with Anchor programs. You write less code, and TypeScript catches your mistakes at compile time instead of letting them fail at runtime in production.

## Wallet adapter: connecting browser wallets

Most users on Solana have a wallet extension installed in their browser (Phantom, Backpack, Solflare). When they visit your dApp, you want to ask their wallet to sign transactions on their behalf. The wallet adapter is the library that handles this conversation.

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

What happens during a wallet sign-and-send, step by step:

1. Your app builds a transaction the normal way, using web3.js or the Anchor client.
2. Your app hands the transaction to the wallet adapter and asks it to sign.
3. The wallet adapter forwards the request to whichever wallet the user has connected.
4. The browser wallet shows a popup describing the transaction. The user approves or rejects.
5. If approved, the wallet signs with the user's private key and returns the signed transaction.
6. Your app sends the signed transaction to the RPC node, just like it would in a script.

The key thing: your app never sees the user's private key. The wallet holds it, the wallet signs, and the wallet returns only the signature. This is the whole reason for the architecture. You can't accidentally leak what you don't have.

The library handles wallet detection, connection state, account changes, and the common API across all the wallets. In React projects you wrap your app in a `WalletProvider` and use the `useWallet()` hook to get the currently connected wallet's pubkey and signing functions. We'll cover the React setup in a dedicated lecture before the first frontend milestone.
