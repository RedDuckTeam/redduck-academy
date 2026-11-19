---
id: 136
title: Inheritance
type: lecture
order: 11
faq:
  - question: Do I have to deploy the parent contract separately?
    answer: >-
      No. One contract goes on chain, holding both. The parent's constructor runs first at
      deployment.
  - question: Why won't Solidity let me override a parent function?
    answer: >-
      Overriding is opt-in. The parent function needs virtual, the child needs override, and
      missing either is a compile error. An override can widen visibility but never tighten
      it.
  - question: In what order do I list parent contracts?
    answer: >-
      Most base first, most derived last, left to right. If B inherits from A, then A comes
      before B in any list naming both. The reverse fails with a linearization error.
      Solidity orders every ancestor with the C3 algorithm, and your written order has to
      agree with the inheritance graph.
  - question: What is the difference between super.foo() and Parent.foo()?
    answer: >-
      Parent.foo() always runs the implementation declared in that parent. super.foo() runs
      the next contract in the linearization, which under multiple inheritance is not always
      the immediate parent. In contract D is B, C, super.f() inside D reaches C, then B,
      then A, and each ancestor runs once.
---

> A child contract gets all the state variables, modifiers, functions, and events declared in its parents. The parents are not deployed separately. The compiler puts their code into the child, and one contract with one storage goes on chain.

The usual reason to inherit is repetition. An owner address, an `onlyOwner` modifier, and a constructor that captures `msg.sender` as the owner appear in nearly every nontrivial contract. Extracting them into a base contract and inheriting from it lets you share the implementation across many contracts.

## One contract goes on chain

The syntax for one contract inheriting from another uses the keyword `is`.

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Ownable {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }
}

contract Vault is Ownable {
    function withdraw(address to) external onlyOwner {
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "send failed");
    }
}
```

`Vault is Ownable` means everything declared in `Ownable` is part of `Vault`. The state variable `owner`, the constructor, and the modifier `onlyOwner` are all available inside `Vault`. When `Vault` is deployed, the `Ownable` constructor runs first, then any code in `Vault`'s own constructor. There's only one contract on chain, and it contains both the inherited and the original code.

Parent and child are one contract, so a state variable name can be declared only once in the whole chain. If `Ownable` declares `address public owner`, then `Vault` cannot also declare `address public owner`. This is a compile error rather than silent shadowing.

Which parent members a child can use is set by the visibility levels from the [functions lesson](/courses/development-on-ethereum/solidity-basics/functions). `public` and `internal` members are accessible from child contracts, and `private` members are not. `external` functions can be called by child contracts, but only via `this.functionName()`.

## Passing arguments to a parent constructor

The `Ownable` above makes whoever deploys the contract its owner. OpenZeppelin's `Ownable` is the canonical base contract of this kind, and many production contracts inherit from it directly. Newer versions accept the initial owner as a constructor argument, which addresses a real pitfall where the deployer accidentally became the owner of a contract intended for someone else. A minimal `Ownable` that takes the owner as an argument:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Ownable {
    address public owner;

    constructor(address initialOwner) {
        owner = initialOwner;
    }
}
```

When a parent contract's constructor takes arguments, the child must supply them. The usual way is to call the parent constructor from the child's own constructor:

```solidity
contract DynamicVault is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {
        // additional initialization can happen here
    }
}
```

The syntax after the parameter list, `Ownable(initialOwner)`, tells Solidity to pass `initialOwner` to the parent's constructor when `DynamicVault` is deployed. The parent constructor runs first, then `DynamicVault`'s body runs. When the value is fixed at the time you write the child, it can go directly in the inheritance list instead, as in `contract HardcodedVault is Ownable(0x1234567890123456789012345678901234567890)`.

If a parent has a constructor with required arguments and the child supplies none, the child cannot be deployed and the compiler will either reject it or require it to be marked `abstract`.

## Abstract contracts and interfaces

A contract that doesn't fully satisfy all the requirements for deployment is **abstract**. It can still be inherited from, but trying to deploy it is a compile-time error. One case is the missing constructor argument above. The other is a function declared without a body:

```solidity
abstract contract PriceFeed {
    function latestPrice() public view virtual returns (uint256);
}
```

A child that inherits from this must override `latestPrice` with a concrete implementation, or remain abstract itself.

An `interface` declares functions and events and implements none of them. The `IERC20` interface in the [ERC-20 lesson](/courses/development-on-ethereum/token-security-and-evm-internals/what-is-erc-20) is six function declarations and two events. A contract inherits an interface with `is`, the same way it inherits a contract, and implements its functions. Other contracts then need only the interface to call it, as the [low-level calls lesson](/courses/development-on-ethereum/token-security-and-evm-internals/low-level-calls) shows.

## Function overriding: `virtual` and `override`

A function in a parent contract is not overridable by default. You have to declare it `virtual` to allow children to provide a replacement:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Ownable {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external virtual {
        require(msg.sender == owner, "not owner");
        owner = newOwner;
    }
}

contract NoTransfer is Ownable {
    function transferOwnership(address) external pure override {
        revert("ownership transfer disabled");
    }
}
```

The child writes `override` after the parameter list to declare that it is replacing the parent's function. Forgetting `virtual` on the parent or `override` on the child is a compile error. This makes it impossible to accidentally override a parent function, and it makes the inheritance behavior obvious to anyone reading the code.

If you want the child to remain overridable in turn, mark it both `virtual` and `override`, as in `function f() public virtual override` in the diamond example below.

An override keeps the parent's visibility. The one exception is that an `external` function can be overridden as `public`. Any other change is a compile error, `Overriding function visibility differs`.

Modifiers can also be virtual and overridden using the same `virtual`/`override` keywords.

## Multiple inheritance needs one order of ancestors

Solidity supports inheriting from multiple parents, written as a comma-separated list. All of them end up in one contract, so the compiler needs a single order of all ancestors. Parents must be listed from **most base to most derived**, that is, most general first and most specific last. If `Balances` itself inherits from `Ownable`, then `Ownable` is more base than `Balances`, so `Ownable` must come first in any list that mentions both:

```solidity
contract Vault is Ownable, Balances { ... }   // correct order
contract Bad is Balances, Ownable { ... }     // compile error
```

The reverse order produces an error about "linearization". The compiler uses an algorithm called C3 linearization to compute a single ordering of all ancestor contracts. If you list a more-derived parent before a more-base one, the algorithm fails because the order you wrote contradicts the order implied by the rest of the graph.

When a function exists in multiple parents and a child needs to override it, the override must name every parent that declares the function:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract A {
    function action() public virtual {
        // ...
    }
}

contract B {
    function action() public virtual {
        // ...
    }
}

contract C is A, B {
    function action() public override(A, B) {
        // explicitly resolving the ambiguity
    }
}
```

Without the explicit list `override(A, B)`, the compiler cannot tell which one or both the override applies to.

## `super` calls the next contract in the linearization

Inside an override, you often want to call the parent's version of the function rather than reimplementing it from scratch. `Parent.f()`, for example `B.f()` written inside `D` below, names the parent explicitly and calls the implementation declared in that parent, regardless of the linearization. `super.f()` calls the **next** function in the linearization order, which is not necessarily the immediate parent of the contract you're writing. Both need the parent function to be `public` or `internal`, because a child reaches an `external` function only via `this.functionName()`.

The distinction matters in diamond inheritance, where a contract has multiple parents that themselves share a common ancestor:

```solidity
contract A {
    function f() public virtual { /* A's logic */ }
}

contract B is A {
    function f() public virtual override { /* B's logic */ super.f(); }
}

contract C is A {
    function f() public virtual override { /* C's logic */ super.f(); }
}

contract D is B, C {
    function f() public override(B, C) { super.f(); }
}
```

When `D.f()` runs, `super.f()` calls `C.f()` because `C` comes after `D` in the linearization. `C.f()`'s `super.f()` then calls `B.f()`. `B.f()`'s `super.f()` finally calls `A.f()`. The call chain is `D → C → B → A` rather than the visually-suggested `D → B → A` followed by `D → C → A`. The C3 linearization guarantees each ancestor runs at most once.

If `D.f()` called `B.f()` instead of `super.f()`, the chain would be `D → B → A`. `B`'s code runs, its own `super.f()` still follows `D`'s linearization to `A`, and `C.f()` never runs.

This is the pattern behind composable extensions: each layer adds its behavior, calls `super.f()` to chain to the next, and the linearization ensures all layers run in a well-defined order. OpenZeppelin's ERC-20 and ERC-721 implementations rely on this pattern so each extension module can add behavior to the same function.

If you want one named parent's implementation, use `Parent.f()`. If you want the next layer in the chain, use `super.f()`. In single-inheritance code the two look identical.

## What inheritance costs

The contract that goes on chain is assembled from several source contracts, so to know what one of its functions does you have to read every ancestor that touches it. Multi-level hierarchies are hard to follow and audit. With `super`, the code runs in linearization order, which is not the order the source suggests, as the diamond example shows.

The parents are also part of the storage layout. State variables get slots in declaration order ([storage layout lesson](/courses/development-on-ethereum/token-security-and-evm-internals/storage-layout)), and the [upgradeable contracts lesson](/courses/development-on-ethereum/token-security-and-evm-internals/upgradeable-contracts-and-proxies) lists keeping the inheritance order among the rules for not corrupting storage.

## Write out the linearization

Before you rely on `super` in a contract with several parents, write out its linearization and name the contract whose code each `super.f()` runs. For `D is B, C` above the order is `D, C, B, A`.
