---
id: 146
title: Testing
type: lecture
order: 1
faq:
  - question: How do I assert that a function reverts?
    answer: >-
      Assert on the failure. `viem.assertions.revertWith` takes the promise and the exact
      reason string. Custom errors use `revertWithCustomError`, passing the contract whose ABI
      defines the error and the error name. Foundry's equivalent is `vm.expectRevert`.
  - question: How do I test a lock that opens in a week?
    answer: >-
      Move the simulated clock with `networkHelpers.time.increaseTo`. Foundry calls it
      `vm.warp`.
  - question: What is worth testing in a contract?
    answer: >-
      Your own logic. Every branch, every revert, every state change, access-control guards,
      zero and maximum values, and both sides of any deadline. Skip what is proven elsewhere,
      such as arithmetic or OpenZeppelin's ERC-20 transferring correctly.
---

> Once a contract is on chain, you can't patch it unless it was built to be [upgradeable](/courses/development-on-ethereum/token-security-and-evm-internals/upgradeable-contracts-and-proxies). The bug that gets through to production is the bug that costs real money.

## The list of tests comes from the contract's code

Take a small contract:

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

The obvious first test deploys the contract, calls `inc()`, and checks that `x` is 1. That leaves `incBy`, its `require`, and both `emit` statements unchecked. To get the full list, read the code and write down a test for everything it does.

- **Every state change.** `inc()` adds 1 to `x` and `incBy(by)` adds `by`. Each needs a test that calls the function and reads `x` afterwards. If your contract has a `withdraw` function with three different paths, write three tests.
- **Every `require` and `revert`.** `incBy(0)` has to revert with `incBy: must be positive`. Without this test, a regression where the `require` check is accidentally removed will pass every other test.
- **Every event.** Events are part of a contract's observable behavior. `inc()` has to emit `Increment(1)` and `incBy(by)` has to emit `Increment(by)`.
- **Both sides of every condition.** `by > 0` splits the inputs at zero, so call `incBy(0)`, which must revert, and `incBy(1)`, which must pass. For a deadline, test the call one second before it and the call exactly at it.
- **Access control.** Every function with `onlyOwner` or a similar guard needs a test confirming non-owners are rejected.
- **Edge cases.** Zero amounts, maximum values, empty arrays, self-transfers.
- **The interaction between your contract and others.** If you call into an external token, test that you handle its return value correctly. If you use checks-effects-interactions, test that reentrancy doesn't succeed.

Counter has no access control and no external calls, and zero is the only input its code treats differently, so the first four rules give its whole list.

The list covers your own logic and leaves out code that is not yours. You don't need to test that `1 + 1 == 2`, that Solidity's `uint256` rejects negative numbers, or that OpenZeppelin's ERC-20 implementation handles transfers correctly. That code has been tested by OpenZeppelin and audited extensively.

## The moves are the same in every framework

This lesson uses **Hardhat 3** with the **viem** library and the **Node.js test runner** (`node:test`). Foundry is Solidity-native and very popular in security audits, and Hardhat with ethers.js is the older mainstream JavaScript stack. If you join a team they'll have picked one and you'll use what they picked. The syntax differs but the moves are the same:

- Deploy a contract in test setup
- Call its functions with controlled inputs
- Assert that state changed correctly, that the call reverted, or that an event was emitted
- Reset between tests so failures are isolated
- Manipulate time and accounts to cover edge cases

Once you know these moves with one tool, picking up another is a few hours of reading docs.

## A test deploys the contract, calls it, and asserts on the result

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

`network.connect()` spins up a fresh simulated Ethereum chain for this test file. The returned object has `viem` for contract interactions and `networkHelpers` for chain manipulation utilities like time travel. `viem.deployContract("Counter")` deploys a new instance of the contract by name, and the returned `counter` object has typed methods generated from your contract's ABI.

`counter.write.inc()` sends a transaction calling `inc()`. The `.write` namespace is for state-changing functions, and it returns a promise of the transaction hash. The simulated network mines each transaction as soon as it is sent, so by the time the promise resolves the transaction is already in a block. `counter.read.x()` reads the public state variable `x`. The `.read` namespace is for view/pure functions and public state variable getters, and it returns the value directly without sending a transaction. Function arguments go in an array, even for single-argument calls like `counter.write.incBy([5n])`, because viem needs to distinguish positional arguments from the optional options object that comes second.

In `assert.equal(await counter.read.x(), 1n)` the `n` suffix makes the expected value a BigInt, which is how viem represents all uint256 values. Arithmetic that mixes a BigInt and a number throws an error, and a strict comparison between them is never equal (`1n === 1` is false), so always compare BigInt to BigInt. The `strict` variant of `node:assert` uses strict equality with no type coercion.

`emitWithArgs` takes the promise, the contract whose ABI knows the event, the event name, and the expected arguments. If the event isn't emitted, or the args don't match, the test fails. If you only care that an event was emitted regardless of args, there's `emit`. For most cases, asserting the exact arguments catches more bugs.

`deployCounter` is a fixture, a function that sets up the chain to a known state. The first time you call `loadFixture(deployCounter)`, it runs. Subsequent calls don't re-run the function. Instead they restore the chain to a snapshot taken after the first run, which is much faster and guaranteed identical, so changes in one test don't bleed into another. Without a fixture, every test would start with its own `viem.deployContract("Counter")`. On the simulated network a deployment takes milliseconds, so for Counter the saving is small, and it grows with setups that deploy several contracts and send transactions. There's also a subtler problem: if the setup logic is repeated in every test, eventually some tests drift and their setups disagree, and a wrong setup produces false test failures and false test passes. The shorter listings below deploy the contract inside the test to stay self-contained; in a real suite they would load the fixture.

Each `it` block tests one behavior. If you find yourself writing "and" in the description, like "increments x and emits an event", split it into two tests, because smaller tests fail more informatively. Inside a test, follow the Arrange-Act-Assert pattern. Arrange the state by deploying contracts, transferring tokens, advancing time. Act on the system by calling the function being tested. Assert the result by checking state, checking events, or checking reverts. Tests that mix multiple actions in one block are harder to debug when they fail.

## A second account tests who is allowed to call

Hardhat's simulated network gives you 20 pre-funded accounts. You access them through wallet clients:

```typescript
const [deployer, alice, bob] = await viem.getWalletClients();
```

The first account (`deployer`) is the default sender for any transaction that doesn't specify otherwise. To send a transaction from a different account, pass it as an option:

```typescript
await counter.write.inc({ account: alice.account });
```

This lets you test access control, multi-party flows, and any scenario where the identity of the caller matters. When every test needs the same accounts and balances, set them up in the fixture:

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

Each test that needs voters loads this fixture and receives the accounts and the deployed token. A fixture can also advance time or configure permissions. Whatever state every test in a `describe` block needs, put it in the fixture.

## A revert test asserts on the failure and on its reason

```typescript
  it("reverts when incBy is called with 0", async function () {
    const counter = await viem.deployContract("Counter");

    await viem.assertions.revertWith(
      counter.write.incBy([0n]),
      "incBy: must be positive"
    );
  });
```

`revertWith` takes a promise that should reject and asserts both that it rejects and that the revert reason matches the given string. If the function doesn't revert at all, or reverts with a different message, the test fails.

For custom errors, which your ERC-20 uses, there's `revertWithCustomError`:

```typescript
await viem.assertions.revertWithCustomError(
  token.write.transfer([bob.account.address, parseEther("999999")]),
  token,
  "InsufficientBalance"
);
```

The second argument is the contract whose ABI defines the error. The third is the error name. If the error has arguments, `revertWithCustomErrorWithArgs` lets you assert those too.

## A deadline is tested from both sides by moving the clock

Smart contracts often depend on time: voting deadlines, vesting cliffs, lock periods. A test cannot wait for wall-clock time to pass, so the `time` submodule of `networkHelpers` moves the simulated chain's clock. `time.latest()` returns the current block timestamp, `time.increaseTo(t)` mines a block at timestamp `t`, and `time.increase(n)` mines a block `n` seconds after the latest block. `time.setNextBlockTimestamp(t)` sets the timestamp of the next block without mining it, so the next transaction runs at exactly `t`.

Suppose Counter has been extended with a `lockedInc()` that only works after a deadline:

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

Its two tests run one second apart, one second before the deadline and exactly at it:

```typescript
describe("Counter lockedInc", function () {
  it("reverts one second before unlockTime", async function () {
    const future = (await networkHelpers.time.latest()) + 3600;
    const counter = await viem.deployContract("Counter", [BigInt(future)]);

    await networkHelpers.time.setNextBlockTimestamp(future - 1);
    await viem.assertions.revertWith(
      counter.write.lockedInc(),
      "still locked"
    );
  });

  it("succeeds exactly at unlockTime", async function () {
    const future = (await networkHelpers.time.latest()) + 3600;
    const counter = await viem.deployContract("Counter", [BigInt(future)]);

    await networkHelpers.time.setNextBlockTimestamp(future);
    await counter.write.lockedInc();

    const value = await counter.read.x();
    assert.equal(value, 1n);
  });
});
```

The second test sets the next block's timestamp instead of calling `increaseTo(future)`. `increaseTo` mines its own block at `future`, so `lockedInc` would run in the block after it, at least one second late. That version of the test also passes when the `require` uses `>` by mistake, and this one fails.

## Foundry and ethers.js spell the same moves differently

| Move | Hardhat 3 + viem | Foundry | Hardhat + ethers.js |
| --- | --- | --- | --- |
| Structure and shared setup | `describe`/`it`, `loadFixture` | `test_` prefixed methods, `setUp()` | `describe`/`it` with Mocha |
| Call from another account | `{ account: alice.account }` | `vm.prank(alice)` | `contract.connect(alice).inc()` |
| Expect a revert | `revertWith`, `revertWithCustomError` | `vm.expectRevert(bytes4 selector)` | `expect(promise).to.be.revertedWithCustomError(contract, "Name")` |
| Move the clock | `time.increaseTo`, `time.setNextBlockTimestamp` | `vm.warp(timestamp)` | the same `time` helpers |

## A unit test checks only the cases you thought of

Suppose a refactor turns `x += by` in `incBy` into `x = by`:

```solidity
function incBy(uint256 by) external {
    require(by > 0, "incBy: must be positive");
    x = by;
    emit Increment(by);
}
```

A test that deploys a fresh Counter, calls `incBy(5)` and expects 5 passes on both versions, because `x` started at zero. That is the test the first rule asks for. This test calls `inc()` first:

```typescript
  it("adds to a non-zero x", async function () {
    const counter = await viem.deployContract("Counter");
    await counter.write.inc();
    await counter.write.incBy([5n]);
    assert.equal(await counter.read.x(), 6n);
  });
```

It passes on the original Counter and fails on the broken one, where `x` ends at 5 instead of 6. The suite catches this bug only if someone thought to start from a non-zero `x`.

Two techniques look for the cases you did not think of. **Fuzz testing** runs your test with random inputs to find edge cases you didn't write tests for. **Invariant testing** asserts properties that should hold across any sequence of operations rather than just specific test scenarios. Here an invariant such as "`x` equals the sum of all increments so far" fails on the broken version as soon as `incBy` runs on a non-zero `x`, while random values of `by` on a fresh Counter still pass. This lesson does not cover them, and the unit tests above are enough for the contracts in this course.

## Check the suite against the contract

Before you call a suite done, go back to the contract. Every line should be reachable by at least one test, and every conditional branch should be covered by tests for both outcomes. A code coverage tool measures which lines and branches of your contract are exercised by your tests and shows where the gaps are. In the [voting task](/courses/development-on-ethereum/defi-tasks-and-patterns/voting-on-token-price) that comes next you write the tests yourself.
