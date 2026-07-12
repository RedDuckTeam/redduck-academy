---
id: 146
title: Testing
type: lecture
order: 1
faq:
  - question: How do I test that a Solidity function reverts when it is supposed to?
    answer: You assert on the failure instead of the success. With Hardhat and viem,
      `viem.assertions.revertWith(promise, "message")` checks that the call both
      rejects and reverts with the exact reason string you expect, and the test
      fails if it does not revert or reverts with a different message. For
      custom errors, use `revertWithCustomError`, passing the contract whose ABI
      defines the error and the error name. These checks are important because
      without them, accidentally deleting a require statement would still pass
      every other test.
  - question: How can I test time-locked contract behavior without actually waiting?
    answer: "You move the simulated blockchain's clock forward. Hardhat's
      `networkHelpers.time` module lets you jump ahead:
      `time.increaseTo(timestamp)` mines a block at a specific future time and
      `time.increase(seconds)` advances by an interval. This lets you test both
      sides of a deadline, for example confirming a locked function reverts
      before the unlock time and succeeds after, in a fast unit test instead of
      real wall-clock time. The equivalent in Foundry is `vm.warp`."
  - question: What should I actually test in my smart contract, and what is a waste
      of effort?
    answer: "Focus on your own contract's logic: every branch, every revert
      condition, every state change, access-control guards, edge cases like zero
      and maximum values, and both sides of any time-dependent behavior. Do not
      waste tests on things already proven elsewhere, such as basic arithmetic,
      the compiler rejecting negative uints, or OpenZeppelin's ERC-20 doing
      standard transfers correctly. A good target is that every line is reached
      by at least one test and every conditional branch is covered for both
      outcomes."
  - question: What are fixtures and why should I use them in contract tests?
    answer: A fixture is a setup function that puts the chain into a known state,
      such as deploying contracts and funding accounts. The first time it runs
      it executes normally; after that, the test framework snapshot-restores the
      chain to that state instead of re-running the setup, which is faster and
      guaranteed identical. In Hardhat you load one with
      `networkHelpers.loadFixture(deployFn)`. This avoids slow repeated setup
      and prevents the subtle bug where copy-pasted setup code drifts apart
      between tests and causes false passes or failures.
---

> Once a contract is on chain, you can't patch it. The bug that gets through to production is the bug that costs real money. Testing is how working engineers catch bugs before that happens. This lesson teaches you how to write tests for Solidity contracts and, more importantly, how to think about what to test. The voting task that comes next requires you to do this for real.

## The stack we're using and why it doesn't really matter

This lesson uses **Hardhat 3** with the **viem** library and the **Node.js test runner** (`node:test`). That's one specific stack. There are others. Foundry is Solidity-native and very popular in security audits. Hardhat with ethers.js is the older mainstream JavaScript stack. Truffle still appears in legacy projects. New frameworks will keep appearing. If you join a team they'll have picked one and you'll use what they picked.

What you should take from this lesson is not "how to use Hardhat 3." It's the mental model of testing smart contracts: how to think about what to test, how to structure tests so they're readable, how to set up state, how to assert outcomes, how to manipulate the test environment. That mental model is identical across every framework. The syntax differs but the moves are the same:

- Deploy a contract in test setup
- Call its functions with controlled inputs
- Assert that state changed correctly, that the call reverted, or that an event was emitted
- Reset between tests so failures are isolated
- Manipulate time and accounts to cover edge cases

Once you internalize these moves with one tool, picking up another is a few hours of reading docs. We picked Hardhat 3 + viem because it's modern, type-safe, and a reasonable default in 2026. Don't memorize the syntax. Internalize the moves.

## Project layout

A Hardhat project has a `contracts/` directory for your Solidity files, a `test/` directory for your test files, and a `hardhat.config.ts` for plugin and compiler configuration. Tests are TypeScript files ending in `.ts`, conventionally named to match the contract they test: `Counter.sol` is tested in `test/Counter.ts`.

## A first test

Let's say `contracts/Counter.sol` is the standard Hardhat sample:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Counter {
    uint256 public x;

    event Increment(uint256 by);

    function inc() external {
        x++;
        emit Increment(1);
    }

    function incBy(uint256 by) external {
        require(by > 0, "incBy: must be positive");
        x += by;
        emit Increment(by);
    }
}
```

Here's a test that deploys this contract, calls `inc()`, and asserts the counter went up:

```typescript
// test/Counter.ts
import { describe, it } from "node:test";
import { network } from "hardhat";

const { viem, networkHelpers } = await network.connect();

describe("Counter", function () {
  it("increments x when inc() is called", async function () {
    const counter = await viem.deployContract("Counter");

    await counter.write.inc();

    const value = await counter.read.x();
    assert.equal(value, 1n);
  });
});
```

A lot is happening here. Walking through it line by line:

`import { describe, it } from "node:test"` brings in Node's built-in test runner. No external libraries needed for the test structure itself. `describe` groups related tests. `it` defines a single test case. The same `describe`/`it` pattern exists in Mocha, Vitest, Jest, and many other test runners. The names are universal.

`import { network } from "hardhat"` brings in Hardhat's network manager. `network.connect()` spins up a fresh simulated Ethereum chain for this test file. The returned object has `viem` for contract interactions and `networkHelpers` for chain manipulation utilities like time travel. The connection happens at file load, outside any `describe` block.

Inside the test, `viem.deployContract("Counter")` deploys a new instance of the Counter contract by name. Hardhat finds the artifact based on the contract name and handles the deployment. The returned `counter` object has typed methods generated from your contract's ABI.

`counter.write.inc()` sends a transaction calling `inc()`. The `.write` namespace is for state-changing functions. It returns a promise that resolves when the transaction is mined.

`counter.read.x()` reads the value of the public state variable `x`. The `.read` namespace is for view/pure functions and public state variable getters. It returns the value directly without sending a transaction.

`assert.equal(value, 1n)` checks that `value` equals `1n`. The `n` suffix makes it a BigInt, which is how viem represents all uint256 values. Arithmetic that mixes a BigInt and a number throws an error, and a strict comparison between them is never equal (`1n === 1` is false), so always compare BigInt to BigInt.

To use `assert.equal` you need one more import: `import assert from "node:assert/strict"`. The `strict` variant uses strict equality with no type coercion, which is what you want.

## describe and it

Both `describe` and `it` take a string description and a callback function.

```typescript
describe("Counter", function () {
  describe("inc()", function () {
    it("increments x by 1", async function () { /* ... */ });
    it("emits an Increment event with value 1", async function () { /* ... */ });
  });

  describe("incBy()", function () {
    it("increments x by the given amount", async function () { /* ... */ });
    it("reverts when amount is 0", async function () { /* ... */ });
  });
});
```

The test output mirrors this structure as indented headings, which makes failures easier to scan. A good convention: each `it` block tests exactly one behavior. If you find yourself writing "and" in the description like "increments x and emits an event," split it into two tests. Smaller tests fail more informatively.

`describe`/`it` is universal. Foundry uses `setUp()` functions and `test_` prefixed methods in Solidity. Ethers.js with Mocha uses the same `describe`/`it`. Vitest, Jest, Cypress all use it. The structure is portable.

## Read versus write

Viem splits contract interactions into two namespaces: `read` for calls that don't change state, `write` for calls that do.

```typescript
// Read: no transaction, returns the value directly
const balance = await token.read.balanceOf([alice.account.address]);

// Write: sends a transaction, returns a transaction hash
const txHash = await token.write.transfer([bob.account.address, amount]);
```

This mirrors the Solidity distinction between `view`/`pure` functions and state-changing functions. Public state variables also have automatic getters that go through `.read`. The split is a viem-specific design choice. Ethers.js doesn't split this way and lets you call any function with the same syntax. Both approaches work. Viem's split makes the intent visible at the call site, which catches mistakes earlier.

The `[args]` array syntax for arguments is also viem-specific. Function arguments go in an array, even for single-argument calls: `token.read.balanceOf([alice.account.address])`. This is because viem needs to distinguish positional arguments from the optional options object that comes second.

## Working with multiple accounts

Hardhat's simulated network gives you 20 pre-funded accounts. You access them through wallet clients:

```typescript
const [deployer, alice, bob] = await viem.getWalletClients();
```

Each wallet client is associated with an address and has a private key Hardhat uses to sign transactions. The first account (`deployer`) is the default sender for any transaction that doesn't specify otherwise. To send a transaction from a different account, pass it as an option:

```typescript
await counter.write.inc({ account: alice.account });
```

This pattern lets you test access control, multi-party flows, and any scenario where the identity of the caller matters. In Foundry the equivalent is `vm.prank(alice)`. In ethers.js it's `contract.connect(alice).inc()`. Same move, different syntax.

## Asserting reverts

A function that's supposed to revert under specific conditions needs a test that confirms it actually reverts. Without this test, a regression where the require check is accidentally removed will pass every other test.

The `viem.assertions` plugin provides revert checkers:

```typescript
import { describe, it } from "node:test";
import { network } from "hardhat";

const { viem } = await network.connect();

describe("Counter", function () {
  it("reverts when incBy is called with 0", async function () {
    const counter = await viem.deployContract("Counter");

    await viem.assertions.revertWith(
      counter.write.incBy([0n]),
      "incBy: must be positive"
    );
  });
});
```

`revertWith` takes a promise that should reject and asserts both that it rejects AND that the revert reason matches the given string. If the function doesn't revert at all, the test fails. If it reverts with a different message, the test fails. Only the exact match passes.

For custom errors, which your ERC-20 uses, there's `revertWithCustomError`:

```typescript
await viem.assertions.revertWithCustomError(
  token.write.transfer([bob.account.address, parseEther("999999")]),
  token,
  "InsufficientBalance"
);
```

The second argument is the contract whose ABI defines the error. The third is the error name. If the error has arguments, `revertWithCustomErrorArgs` lets you assert those too.

Foundry uses `vm.expectRevert(bytes4 selector)` for the same purpose. Ethers.js uses `await expect(promise).to.be.revertedWithCustomError(contract, "Name")`. Same move.

## Checking events

Events are part of a contract's observable behavior. If your contract is supposed to emit a `Transfer` event when tokens move, the test should verify it does. The assertion plugin handles this:

```typescript
it("emits Increment with value 1 when inc() is called", async function () {
  const counter = await viem.deployContract("Counter");

  await viem.assertions.emitWithArgs(
    counter.write.inc(),
    counter,
    "Increment",
    [1n]
  );
});
```

`emitWithArgs` takes the promise, the contract whose ABI knows the event, the event name, and the expected arguments. If the event isn't emitted, or the args don't match, the test fails.

If you only care that an event was emitted regardless of args, there's `emit`. If you want to check that an event was NOT emitted, there's `notEmit`. For most cases, asserting the exact arguments catches more bugs.

When the assertion plugin isn't expressive enough, you can drop down to the raw events API on the public client:

```typescript
const publicClient = await viem.getPublicClient();
const fromBlock = await publicClient.getBlockNumber();
await counter.write.inc();
const events = await publicClient.getContractEvents({
  address: counter.address,
  abi: counter.abi,
  eventName: "Increment",
  fromBlock,
  strict: true,
});
```

This gives you the raw event log objects to inspect however you want. The `fromBlock` filter is important: without it you'll get every Increment event ever emitted by every Counter the test has deployed.

## Manipulating time

Smart contracts often depend on time: voting deadlines, vesting cliffs, lock periods, deadlines for actions. Your tests need to be able to advance the simulated chain's clock to test these behaviors. Without time manipulation, you'd need actual wall-clock time to pass, which is absurd for unit tests.

The `networkHelpers` module has a `time` submodule for this:

```typescript
const { networkHelpers } = await network.connect();

// Get the current block timestamp
const now = await networkHelpers.time.latest();

// Mine a block at a specific future timestamp
await networkHelpers.time.increaseTo(now + 3600); // one hour later

// Mine a block N seconds after the latest block
await networkHelpers.time.increase(3600);
```

A complete example testing a time-locked function. Suppose Counter has been extended with a `lockedInc()` that only works after a deadline:

```solidity
contract Counter {
    uint256 public x;
    uint256 public unlockTime;

    constructor(uint256 _unlockTime) {
        unlockTime = _unlockTime;
    }

    function lockedInc() external {
        require(block.timestamp >= unlockTime, "still locked");
        x++;
    }
}
```

The test for this:

```typescript
describe("Counter lockedInc", function () {
  it("reverts before unlockTime", async function () {
    const future = (await networkHelpers.time.latest()) + 3600;
    const counter = await viem.deployContract("Counter", [BigInt(future)]);

    await viem.assertions.revertWith(
      counter.write.lockedInc(),
      "still locked"
    );
  });

  it("succeeds at or after unlockTime", async function () {
    const future = (await networkHelpers.time.latest()) + 3600;
    const counter = await viem.deployContract("Counter", [BigInt(future)]);

    await networkHelpers.time.increaseTo(future);
    await counter.write.lockedInc();

    const value = await counter.read.x();
    assert.equal(value, 1n);
  });
});
```

The first test confirms the contract correctly rejects calls before the deadline. The second confirms it accepts calls after. Together they prove the time check works in both directions, which is what you'd want to verify before deploying any time-locked contract.

Foundry has `vm.warp(timestamp)` for the same purpose. Ethers.js with `hardhat-network-helpers` has the same `time.increaseTo` since that helper is shared between the JS frameworks.

## Fixtures

Every test so far starts with `const counter = await viem.deployContract("Counter")`. That's a few seconds of setup time multiplied by every test you write. Across a real test suite this adds up to minutes of waiting. There's also a subtler problem: if the setup logic is repeated in every test, eventually some tests drift and their setups disagree. The wrong setup is a common source of false test failures and false test passes.

Fixtures solve both problems. A fixture is a function that sets up the chain to a known state. The first time you call it, it runs. Subsequent calls don't re-run the function. Instead they snapshot-restore the chain to the state after the first run, which is much faster and guaranteed identical.

```typescript
import { describe, it } from "node:test";
import { network } from "hardhat";
import assert from "node:assert/strict";

const { viem, networkHelpers } = await network.connect();

describe("Counter", function () {
  async function deployCounter() {
    const counter = await viem.deployContract("Counter");
    return { counter };
  }

  it("starts at zero", async function () {
    const { counter } = await networkHelpers.loadFixture(deployCounter);
    assert.equal(await counter.read.x(), 0n);
  });

  it("increments to 1 after one inc()", async function () {
    const { counter } = await networkHelpers.loadFixture(deployCounter);
    await counter.write.inc();
    assert.equal(await counter.read.x(), 1n);
  });

  it("emits Increment with value 1 on inc()", async function () {
    const { counter } = await networkHelpers.loadFixture(deployCounter);
    await viem.assertions.emitWithArgs(
      counter.write.inc(),
      counter,
      "Increment",
      [1n]
    );
  });
});
```

Three tests, one shared setup. The fixture deploys Counter once. Each test gets a fresh snapshot-restored version, so changes in one test don't bleed into another. This is the pattern you'll see in every production test suite.

Fixtures can do anything: deploy multiple contracts, set up initial balances, advance time, configure permissions. Whatever state every test in a describe block needs, put it in the fixture.

```typescript
async function deployWithVoters() {
  const [deployer, alice, bob, carol] = await viem.getWalletClients();
  const token = await viem.deployContract("Token", ["Vote", "VOTE", parseEther("1000000")]);

  await token.write.transfer([alice.account.address, parseEther("100")]);
  await token.write.transfer([bob.account.address, parseEther("200")]);
  await token.write.transfer([carol.account.address, parseEther("300")]);

  return { deployer, alice, bob, carol, token };
}
```

Then each test that needs voters loads this fixture and receives the accounts and the deployed token it needs. Foundry has the equivalent in `setUp()` functions on test contracts. The concept is universal.

## What to test and what not to test

A common mistake is testing the wrong things. You don't need to test that `1 + 1 == 2`. You don't need to test that Solidity's `uint256` rejects negative numbers. You don't need to test that OpenZeppelin's ERC-20 implementation handles transfers correctly. That code has been tested by OpenZeppelin and audited extensively.

What you DO need to test:

- **Your own contract's logic.** Every branch, every revert condition, every state change. If your contract has a `withdraw` function with three different paths, write three tests.
- **The interaction between your contract and others.** If you call into an external token, test that you handle its return value correctly. If you use checks-effects-interactions, test that reentrancy doesn't succeed.
- **Edge cases.** Zero amounts. Maximum values. Empty arrays. Self-transfers. The bug you don't write a test for is the one that reaches production.
- **Access control.** Every function with `onlyOwner` or a similar guard needs a test confirming non-owners are rejected.
- **Time-dependent behavior.** Both sides of every deadline. The lock before, the lock after.
- **Failure modes.** Every `revert` and `require` in your contract is a behavior that needs verification.

A reasonable guideline: every line in your contract should be reachable by at least one test, and every conditional branch should be covered by tests for both outcomes. There's a tool for this called code coverage that we'll come back to in a later lesson.

The Arrange-Act-Assert pattern is a useful shape for each test. Arrange the state by deploying contracts, transferring tokens, advancing time. Act on the system by calling the function being tested. Assert the result by checking state, checking events, or checking reverts. One clear arrangement, one clear action, one clear assertion. Tests that mix multiple actions in one block are harder to debug when they fail.

## What we're not covering yet

Real test suites include patterns we won't touch in this lesson. Some are worth naming briefly so you recognize the words when you encounter them:

- **Fuzz testing** runs your test with random inputs to find edge cases you didn't write tests for. Foundry calls it `testFuzz_`. Viem-based projects can use the same pattern.
- **Invariant testing** asserts properties that should hold across any sequence of operations, not just specific test scenarios.
- **Coverage analysis** measures which lines and branches of your contract are exercised by your tests. The output tells you where the gaps are.
- **Gas profiling and snapshots** track how much gas each function uses across changes to your contract, so optimizations can be measured and regressions caught.
- **Mocking** replaces external dependencies with stub contracts that return controlled values, useful when testing integrations with oracles or other protocols.
- **Mainnet forking** runs your tests against a snapshot of mainnet state, so you can test interactions with real deployed contracts like Uniswap or Aave.

Each of these has its own pedagogical depth. We'll cover them in follow-up lessons. For now, you have enough to write thorough tests for any contract in this course.
