---
id: 194
title: Tests with solana-bankrun
type: lecture
order: 80
faq:
  - question: How do I test a 24-hour lockup without waiting a day?
    answer: >-
      context.warpToSlot jumps the chain's slot counter forward, and the Clock sysvar your
      program reads jumps with it. Slots run about 400ms, so a day is roughly 216,000 slots. The
      test still finishes in milliseconds.
  - question: Why is solana-bankrun so much faster than solana-test-validator?
    answer: >-
      The validator is a real one in a subprocess behind a real RPC port, ten to thirty seconds
      to boot, with real slot timing on every transaction. Bankrun runs your compiled bytecode
      in-process against an in-memory Bank. Transactions take microseconds.
  - question: How do I fund a keypair in a test with no airdrop?
    answer: >-
      context.setAccount writes the account straight into the simulated chain. Give it a pubkey
      plus lamports, owner, data and the executable flag, and the account exists. Use it for
      prerequisites like funding a signer, never to hand-build the state your initialize
      instruction is supposed to write.
  - question: How do I assert that an instruction fails with my custom error?
    answer: >-
      Wrap the call in try/catch, call expect.fail right after it so a success fails the test,
      and in the catch assert err.toString() includes the error name.
  - question: Should I be using LiteSVM or Mollusk instead?
    answer: >-
      Not while bankrun fits. LiteSVM is thinner and often faster, with gaps in some sysvars.
      Mollusk is Rust-only, built for native programs and for fuzzing one instruction at a time.
---

A test suite for a Solana program has to cover every instruction the program exposes, every error it can return, and every account a client could swap for a different one. A bug in a deployed program can let an attacker drain the vault, and those funds are gone, so these cases have to be tested before deployment. That is many small tests, run after every change, and it is practical only if the whole run takes seconds.

## Run the suite in-process and keep the real validator for release checks

`solana-test-validator` is a real validator running in a subprocess, communicating over a real RPC port. Startup takes ten to thirty seconds, and every transaction goes through real slot timing of around 400ms, so a suite takes minutes to run. It is useful right before a release, when you want to verify the full integration including your client-side RPC code.

`solana-bankrun` wraps `solana-program-test`, the Rust framework that runs your program's compiled BPF bytecode in-process against an in-memory Bank, so tests run in milliseconds. You can set the chain's clock to any time, set account state directly, and inspect outcomes through the same Anchor client SDK production code uses. It is the tool this course uses.

The diagram lists two more tools. `LiteSVM` is a similar in-process VM with a thinner runtime that often runs faster, but some sysvars are partially implemented. `Mollusk` is a single-instruction tester written in Rust, used for native Solana programs, meaning non-Anchor ones, and for fuzz testing.

<svg role="img" viewBox="0 0 720 620" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Solana test stack landscape (2026): solana-test-validator, bankrun, LiteSVM, Mollusk</title><desc>The diagram lists four Solana testing tools in rows: solana-test-validator, solana-bankrun, LiteSVM, and Mollusk. Each row gives what the tool is, its speed, and when to use it, with solana-bankrun marked as the default since most Anchor projects use it.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The Solana test stack landscape (2026)</text>
  <rect x="40" y="85" width="640" height="115" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">solana-test-validator</text>
  <text x="55" y="135" font-family="monospace" font-size="10" font-weight="bold">what:</text>
  <text x="120" y="135" font-family="monospace" font-size="10" fill="#565653">a real Solana validator running in a subprocess</text>
  <text x="55" y="155" font-family="monospace" font-size="10" font-weight="bold">speed:</text>
  <text x="120" y="155" font-family="monospace" font-size="10" fill="#565653">10-30s startup, ~400ms per slot. real network simulation.</text>
  <text x="55" y="175" font-family="monospace" font-size="10" font-weight="bold">use for:</text>
  <text x="120" y="175" font-family="monospace" font-size="10" fill="#565653">end-to-end integration tests, RPC client verification</text>
  <text x="55" y="192" font-family="monospace" font-size="9" fill="#565653" font-style="italic">when you want realism, just before release</text>
  <rect x="40" y="210" width="640" height="115" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="210" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="229" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">solana-bankrun (the default)</text>
  <text x="55" y="260" font-family="monospace" font-size="10" font-weight="bold">what:</text>
  <text x="120" y="260" font-family="monospace" font-size="10" fill="#565653">TypeScript bindings over BanksClient. in-process Bank.</text>
  <text x="55" y="280" font-family="monospace" font-size="10" font-weight="bold">speed:</text>
  <text x="120" y="280" font-family="monospace" font-size="10" fill="#565653">milliseconds startup, microseconds per tx. time-warpable.</text>
  <text x="55" y="300" font-family="monospace" font-size="10" font-weight="bold">use for:</text>
  <text x="120" y="300" font-family="monospace" font-size="10" fill="#565653">the inner dev loop. unit and integration tests.</text>
  <text x="55" y="317" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">most Anchor projects use this. mature ecosystem, well-supported.</text>
  <rect x="40" y="335" width="640" height="115" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="335" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="354" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">LiteSVM</text>
  <text x="55" y="385" font-family="monospace" font-size="10" font-weight="bold">what:</text>
  <text x="120" y="385" font-family="monospace" font-size="10" fill="#565653">newer lightweight VM, no BanksClient overhead</text>
  <text x="55" y="405" font-family="monospace" font-size="10" font-weight="bold">speed:</text>
  <text x="120" y="405" font-family="monospace" font-size="10" fill="#565653">often faster than bankrun on small workloads</text>
  <text x="55" y="425" font-family="monospace" font-size="10" font-weight="bold">use for:</text>
  <text x="120" y="425" font-family="monospace" font-size="10" fill="#565653">when you've outgrown bankrun and need raw speed</text>
  <text x="55" y="442" font-family="monospace" font-size="9" fill="#565653" font-style="italic">smaller feature surface, some sysvar gaps. growing fast.</text>
  <rect x="40" y="460" width="640" height="115" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="460" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="479" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Mollusk</text>
  <text x="55" y="510" font-family="monospace" font-size="10" font-weight="bold">what:</text>
  <text x="120" y="510" font-family="monospace" font-size="10" fill="#565653">minimalist single-instruction SVM tester, Rust-only</text>
  <text x="55" y="530" font-family="monospace" font-size="10" font-weight="bold">speed:</text>
  <text x="120" y="530" font-family="monospace" font-size="10" fill="#565653">extremely fast, snapshot-based assertions</text>
  <text x="55" y="550" font-family="monospace" font-size="10" font-weight="bold">use for:</text>
  <text x="120" y="550" font-family="monospace" font-size="10" fill="#565653">native (non-Anchor) programs, fuzz-testing instruction handlers</text>
  <text x="55" y="567" font-family="monospace" font-size="9" fill="#565653" font-style="italic">not the right fit for typical Anchor-in-TypeScript projects</text>
  <text x="360" y="605" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">For an Anchor course with TypeScript tests, bankrun is the default. The others are tools you may meet later.</text>
</svg>

## A bankrun test is client code with a different provider

Here's a test file for the counter program whose `increment` handler is listed in [errors and events](/courses/development-on-solana/writing-your-first-program/errors-and-events). It sets up a context, creates counters through `initialize`, and checks that `increment` rejects an admin who passes another admin's counter.

```typescript
import { startAnchor, Clock, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program, BN } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import { Counter } from "../target/types/counter";
import IDL from "../target/idl/counter.json";

describe("counter", () => {
  let context: ProgramTestContext;
  let program: Program<Counter>;

  const counterPda = (admin: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), admin.toBuffer()],
      program.programId,
    )[0];

  // Fund a new keypair and create its counter with max = 100.
  async function newAdmin(): Promise<Keypair> {
    const admin = Keypair.generate();
    context.setAccount(admin.publicKey, {
      lamports: 10 * LAMPORTS_PER_SOL,
      data: Buffer.alloc(0),
      owner: SystemProgram.programId,
      executable: false,
    });
    await program.methods
      .initialize(new BN(100))
      .accounts({ admin: admin.publicKey })
      .signers([admin])
      .rpc();
    return admin;
  }

  before(async () => {
    context = await startAnchor("./", [], []);
    program = new Program<Counter>(IDL as Counter, new BankrunProvider(context));
  });

  it("initializes a counter", async () => {
    const admin = await newAdmin();
    const counter = await program.account.counter.fetch(counterPda(admin.publicKey));
    expect(counter.value.toNumber()).to.equal(0);
    expect(counter.admin.toString()).to.equal(admin.publicKey.toString());
  });

  it("rejects increment on another admin's counter", async () => {
    const alice = await newAdmin();
    const bob = await newAdmin();
    try {
      await program.methods
        .increment(new BN(1))
        .accountsPartial({ counter: counterPda(bob.publicKey), admin: alice.publicKey })
        .signers([alice])
        .rpc();
      expect.fail("expected the call to fail");
    } catch (err: any) {
      expect(err.toString()).to.include("Unauthorized");
    }
  });
});
```

The tests use `program.methods.X(...).accounts({...}).signers([...]).rpc()`, which is the standard Anchor client SDK call. The same code would work against a real validator without modification. The only difference is the provider underneath, which routes the call through the in-process Bank instead of an RPC connection. `increment` takes `accountsPartial` instead of `accounts`. Because of `has_one = admin`, Anchor can derive `admin` from the counter, so `.accounts()` does not accept that field. In bankrun the derivation fails, because it needs the program's IDL stored on chain, so the test passes `admin` itself through `accountsPartial`.

`startAnchor("./", [], [])` finds your `Anchor.toml` and loads the compiled program from `target/deploy` into an in-process Bank. It does not build the program. `context.setAccount` is the direct state-write call. You give it a pubkey and the account data you want at that address, and the simulated chain stores it. Here it funds each admin with 10 SOL, which pays the rent for its counter, with no airdrop and no faucet.

The failure test uses `try`/`catch` and asserts on the error message, because that's how Anchor surfaces custom errors to the client side. Each test creates its own admin and counter with `newAdmin`, so no test depends on state that another test left behind.

Run this with `anchor test --skip-build` after you've built your program once, and the whole suite finishes in well under a second.

## A test can move the clock instead of waiting

The most important feature that bankrun has and `solana-test-validator` doesn't is control over the chain's clock. You can set the `Clock` sysvar that your program reads to any time, so logic gated on a future timestamp can be tested without waiting.

Imagine the counter has a lockup feature: once the value hits `max`, it locks for 24 hours before the admin can reset it. Testing this on a real validator would mean waiting 24 hours. With bankrun, one test checks that an immediate reset fails, and another moves the clock forward and checks that the reset goes through:

```typescript
async function lockedCounter() {
  const admin = await newAdmin();
  const counter = counterPda(admin.publicKey);
  // Incrementing to max (100) locks the counter.
  await program.methods.increment(new BN(100))
    .accountsPartial({ counter, admin: admin.publicKey })
    .signers([admin]).rpc();
  const reset = () => program.methods.reset()
    .accountsPartial({ counter, admin: admin.publicKey })
    .signers([admin]).rpc();
  return { counter, reset };
}

it("rejects a reset right after the counter locks", async () => {
  const { reset } = await lockedCounter();
  try {
    await reset();
    expect.fail("expected the reset to fail");
  } catch (err: any) {
    expect(err.toString()).to.include("StillLocked");
  }
});

it("allows a reset 24 hours later", async () => {
  const { counter, reset } = await lockedCounter();
  // Move the chain's clock forward by 24 hours.
  const now = await context.banksClient.getClock();
  context.setClock(
    new Clock(now.slot, now.epochStartTimestamp, now.epoch,
      now.leaderScheduleEpoch, now.unixTimestamp + 86_400n),
  );

  await reset();
  const state = await program.account.counter.fetch(counter);
  expect(state.locked).to.be.false;
});
```

`context.setClock` overwrites the `Clock` sysvar, so when the handler reads `Clock::get()?.unix_timestamp`, it sees the time 24 hours later. The whole test runs in milliseconds despite simulating a day passing. The two cases are separate tests because both send the same `reset` transaction. Inside one test the two copies can get the same blockhash, and the runtime rejects the second as already processed.

`context.warpToSlot` is not a substitute. It moves the slot number, but a jump of 216,000 slots, about 24 hours at 400ms per slot, moves `unix_timestamp` by only about seven minutes, so the reset still fails with `StillLocked`. It also crashes the test process if `setAccount` added lamports earlier in the run.

The same approach tests vesting contracts that release tokens over a year, staking pools that accrue rewards by the second, timelocks on treasury withdrawals, and subscriptions that expire after thirty days.

## One test per scenario, per error, and per swapped account

**One assertion path per test.** A test that verifies five different things at once tells you nothing useful when it fails. Break out separate tests for the happy path, each error case, and each edge case.

**Test the failure cases.** Every error variant your program defines should have at least one test that triggers it. The pattern is the `try`/`catch` shown above, asserting on the error name in the message. Errors are part of your program's contract with clients, and they break silently if not tested.

**Swap every account once.** The client chooses every account it passes, so for each account in an instruction's Accounts struct, write one test that puts a different account in that slot and expects the call to fail, unless the instruction is meant to accept any account there. The listing above does this for `counter`. Alice passes Bob's counter and gets `Unauthorized`, because that counter stores Bob's key. For `admin`, the test would sign for Alice's counter with a keypair that is not its admin and expect the same error. The [account constraints](/courses/development-on-solana/writing-your-first-program/account-constraints) lesson covers the checks that should reject each swap.

**Use `setAccount` for setup, never for shortcuts.** It's tempting to skip writing the `initialize` call by pre-populating the counter account with the right state. Tests that depend on hand-crafted state can pass even when the initialization logic is broken. Use `setAccount` only to seed prerequisites your test isn't trying to exercise, like funding keypairs.
