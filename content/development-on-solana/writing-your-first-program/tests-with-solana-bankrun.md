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

When you say "I finished this program," that should mean "I covered every behavior with tests." Not "it compiles." Not "it works on the happy path I tried in the browser." Tests are the part where you go through every instruction your program exposes, every error it can return, every guard it enforces, every edge case the spec describes, and you write code that proves the program behaves the way you said it does. If you didn't test it, you didn't finish it. You wrote the first draft.

The reason this matters more on chain than in normal software is that mistakes cost real money, and there is no undo. A web2 service deploys a bug, an on-call engineer is alerted, the team patches it, and the affected users get refunds from a support ticket. A Solana program deploys a bug, an attacker drains the vault, and the funds are gone. There's no rollback. There's no patching the on-chain state. The only fix is to write a better program next time, which assumes you and your protocol survive the first one. Tests are how you make sure the program you deploy is the one you intended to deploy, before it is too late to find out otherwise.

## The test stack landscape

There are four meaningfully different ways to test a Solana program. Each one is the right tool for a different situation.

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

A quick tour through the four options. `solana-test-validator` is the high-overhead option: a real validator running in a subprocess, communicating over a real RPC port. Startup is slow, ten to thirty seconds, and every transaction goes through real slot timing of around 400ms. The realism is the point. You're testing your code against an actual validator the same way it'll run in production. Useful right before a release, when you want to verify the full integration including your client-side RPC code. Painful as an inner-loop tool because the suite takes minutes to run.

`solana-bankrun` is the inner-loop tool. It wraps `solana-program-test`, the Rust framework that runs your program's compiled BPF bytecode in-process against an in-memory Bank. The TypeScript bindings make it work with the Anchor SDK without any setup beyond installing a package. Tests run in milliseconds. You can warp time to any future slot, set account state directly, and inspect outcomes through the same Anchor client SDK production code uses. This is what most Anchor projects use, and it's the default for this course.

`LiteSVM` is the newer alternative. The idea is similar to bankrun, an in-process VM with fast iteration, but the runtime is thinner and often runs faster. The limitation is that it's less feature-complete: some sysvars are partially implemented, some edge cases around rent and clock differ from a real validator. It's growing quickly. If your bankrun suite ever gets large enough that you feel the milliseconds, LiteSVM is the migration path. For most projects starting out, bankrun is the safer choice because the ecosystem and documentation are larger.

`Mollusk` is in a different niche. It's a minimalist single-instruction SVM tester written in Rust, used heavily for testing native Solana programs, meaning non-Anchor ones, and for fuzz testing. It's extremely fast because it does very little beyond running one instruction at a time and snapshotting account state. If you're writing native programs or doing security fuzzing, Mollusk is the right tool. For Anchor projects with TypeScript tests, it's not the fit.

For this course, bankrun is what you'll use. The rest of the lecture shows what that looks like.

## What a bankrun test actually looks like

Here's a complete test file for a counter program built earlier in the course. It imports the program, sets up a context, calls `initialize`, then `increment`, and asserts the resulting state.

```typescript
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";
import { Counter } from "../target/types/counter";
import IDL from "../target/idl/counter.json";

describe("counter", () => {
  // Shared state across all tests in this suite.
  let context: any;
  let provider: BankrunProvider;
  let program: Program<Counter>;
  let admin: Keypair;

  // Runs once before any `it(...)` block. Sets up the simulated chain
  // and seeds the accounts every test will need.
  before(async () => {
    // Boot an in-process Bank with your program loaded.
    // The two empty arrays are for extra programs and pre-existing accounts.
    context = await startAnchor("./", [], []);

    // Wrap the Bank as an Anchor provider so the Anchor SDK works against it.
    provider = new BankrunProvider(context);
    program = new Program<Counter>(IDL as Counter, provider);

    // Create an admin keypair and fund it with 10 SOL.
    // setAccount writes account state directly. No airdrop, no faucet.
    admin = Keypair.generate();
    context.setAccount(admin.publicKey, {
      lamports: 10 * LAMPORTS_PER_SOL,
      data: Buffer.alloc(0),
      owner: SystemProgram.programId,
      executable: false,
    });
  });

  it("initializes a counter", async () => {
    // Derive the PDA address the counter will live at.
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), admin.publicKey.toBuffer()],
      program.programId,
    );

    // Call the `initialize` instruction with max value = 100.
    // The .accounts({...}) names every account the instruction needs.
    // The .signers([...]) names every keypair that must sign.
    await program.methods
      .initialize(new BN(100))
      .accounts({
        counter: counterPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    // Fetch the account back and decode it using the IDL.
    // Then assert every field matches what initialize should have set.
    const counter = await program.account.counter.fetch(counterPda);
    expect(counter.value.toNumber()).to.equal(0);
    expect(counter.max.toNumber()).to.equal(100);
    expect(counter.admin.toString()).to.equal(admin.publicKey.toString());
    expect(counter.locked).to.be.false;
  });

  it("increments the counter", async () => {
    // Same PDA derivation as the previous test.
    // The counter account already exists from `initializes a counter`.
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), admin.publicKey.toBuffer()],
      program.programId,
    );

    // Call `increment` with a delta of 5.
    await program.methods
      .increment(new BN(5))
      .accounts({
        counter: counterPda,
        caller: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    // The value should now be 5.
    const counter = await program.account.counter.fetch(counterPda);
    expect(counter.value.toNumber()).to.equal(5);
  });

  it("rejects increment from non-admin", async () => {
    // The failure path. A user who is not the admin tries to increment.
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), admin.publicKey.toBuffer()],
      program.programId,
    );

    // Set up an attacker keypair with some SOL to pay for the failing tx.
    const attacker = Keypair.generate();
    context.setAccount(attacker.publicKey, {
      lamports: LAMPORTS_PER_SOL,
      data: Buffer.alloc(0),
      owner: SystemProgram.programId,
      executable: false,
    });

    // The call MUST revert. If it doesn't, the test fails via expect.fail.
    // If it does, we catch the error and assert it contains the right error name.
    try {
      await program.methods
        .increment(new BN(1))
        .accounts({
          counter: counterPda,
          caller: attacker.publicKey,
        })
        .signers([attacker])
        .rpc();
      expect.fail("expected the call to revert");
    } catch (err: any) {
      expect(err.toString()).to.include("Unauthorized");
    }
  });

  it("rejects zero increment", async () => {
    // Edge case: increment with delta = 0 should be rejected by the program.
    const [counterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), admin.publicKey.toBuffer()],
      program.programId,
    );

    // Same try/catch shape as the previous test, asserting on a different error.
    try {
      await program.methods
        .increment(new BN(0))
        .accounts({
          counter: counterPda,
          caller: admin.publicKey,
        })
        .signers([admin])
        .rpc();
      expect.fail("expected the call to revert");
    } catch (err: any) {
      expect(err.toString()).to.include("ZeroIncrement");
    }
  });
});
```

There's a lot in this file, so it's worth walking through what each piece does.

The `before` block at the top runs once before all the tests. `startAnchor("./", [], [])` finds your `Anchor.toml`, builds your program, and loads it into an in-process Bank. The two empty arrays are for additional programs to deploy and additional accounts to pre-populate, neither of which you need here. The result is a `context` object that owns the simulated chain, plus a `provider` that wraps it for the Anchor SDK.

`context.setAccount` is the direct state-write call. You give it a pubkey and the account data you want at that address, and the simulated chain stores it. Here you're funding the admin keypair with 10 SOL so it can pay transaction fees. No airdrops, no faucets, no waiting for a network. The account exists because you wrote it into existence.

The actual tests use `program.methods.X(...).accounts({...}).signers([...]).rpc()`, which is the standard Anchor client SDK call. The same code would work against a real validator without modification. The only difference is the provider underneath, which routes the call through the in-process Bank instead of an RPC connection. That's the whole point of bankrun: production-shaped client code, against an in-memory runtime.

Each test ends with state assertions. `program.account.counter.fetch(counterPda)` reads the account at that address and decodes it using the IDL. You then check fields with chai assertions. Both successful and failed paths get tested: the happy path verifies state changed correctly, the unhappy paths verify that the right error came back. Notice that the failure tests use `try`/`catch` and assert on the error message, because that's how Anchor surfaces custom errors to the client side.

Run this with `anchor test --skip-build` after you've built your program once, and the whole suite finishes in well under a second.

## Time-warping for time-dependent logic

The most important feature that bankrun has and `solana-test-validator` doesn't is control over the chain's clock. You can fast-forward to any future slot. The `Clock` sysvar inside your program reflects the warped time. Logic gated on a future timestamp can be tested without actually waiting.

Imagine the counter has a lockup feature: once the value hits `max`, it locks for 24 hours before the admin can reset it. Testing this on a real validator would mean waiting 24 hours. With bankrun:

```typescript
it("respects the 24-hour lockup", async () => {
  // ... earlier: increment the counter to max so it locks ...

  // Trying to reset immediately fails. The program checks the clock
  // and sees the lockup hasn't expired.
  try {
    await program.methods.reset()
      .accounts({ counter: counterPda, admin: admin.publicKey })
      .signers([admin]).rpc();
    expect.fail("expected the reset to fail");
  } catch (err: any) {
    expect(err.toString()).to.include("StillLocked");
  }

  // Jump the chain's clock forward by 24 hours.
  // At 400ms per slot, 24 hours is roughly 216,000 slots.
  const currentSlot = await context.banksClient.getSlot();
  await context.warpToSlot(currentSlot + 216_000n);

  // Now the program sees the lockup has expired and the reset succeeds.
  await program.methods.reset()
    .accounts({ counter: counterPda, admin: admin.publicKey })
    .signers([admin]).rpc();

  const counter = await program.account.counter.fetch(counterPda);
  expect(counter.locked).to.be.false;
  expect(counter.value.toNumber()).to.equal(0);
});
```

`context.warpToSlot` jumps the chain's slot counter to the value you specify. The `Clock` sysvar updates accordingly, so when your handler reads `Clock::get()?.unix_timestamp`, it sees the new value. The whole test runs in milliseconds despite simulating a day passing.

This is the feature that justifies bankrun over any client-only test approach. Vesting contracts that release tokens over a year, staking pools that accrue rewards by the second, timelocks on treasury withdrawals, subscriptions that expire after thirty days. Without time control, none of these is properly testable. With bankrun, you write the test the way you describe the feature: "after 24 hours, the admin can reset," and the assertion runs in a millisecond.

## Common patterns and small mistakes

A few habits worth picking up from the start.

**One assertion path per test.** A test that verifies five different things at once tells you nothing useful when it fails. Break out separate tests for the happy path, each error case, and each edge case. Bankrun's speed means there's no excuse for combining them.

**Test the failure cases.** Every error variant your program defines should have at least one test that triggers it. The pattern is the `try`/`catch` shown above, asserting on the error name in the message. Errors are part of your program's contract with clients, and they break silently if not tested.

**Use `setAccount` for setup, never for shortcuts.** It's tempting to skip writing the `initialize` call by just pre-populating the counter account with the right state. Don't. Tests that depend on hand-crafted state can pass even when the initialization logic is broken. Use `setAccount` only to seed prerequisites your test isn't trying to exercise, like funding keypairs.

**Re-derive PDAs in every test.** The `PublicKey.findProgramAddressSync` call shows up in every test. You could share it via a helper, but inlining it makes each test more self-contained, which matters when you're debugging one in isolation.

**`warpToSlot` for time, never for retries.** Don't use time-warping to "settle" something asynchronous. Bankrun is synchronous, with nothing to settle. Use it strictly to advance the chain past a time gate your program is testing for.

A program with a clean bankrun suite under it is a program you can refactor confidently. Every later instruction you write, every constraint you add, every error variant you introduce, your suite tells you in seconds whether you broke anything. That's the payoff of investing in tests early, and it's what makes bankrun's millisecond feedback loop worth learning over the alternatives.
