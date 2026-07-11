---
id: 136
title: Inheritance
type: lecture
faq:
  - question: If one Solidity contract inherits from another, do I have to deploy
      both contracts separately?
    answer: No. When a child contract uses the `is` keyword to inherit from a
      parent, everything in the parent (state variables, modifiers, functions,
      events) becomes part of the child. Only one contract ends up on chain, and
      it contains both the inherited code and the child's own code. When it
      deploys, the parent's constructor runs first, then the child's constructor
      body.
  - question: Why won't Solidity let me override a function from a parent contract?
    answer: Overriding is opt-in and requires two keywords. The parent function must
      be marked `virtual` to say it can be replaced, and the child function must
      be marked `override` to say it is replacing it. If either keyword is
      missing you get a compile error. This is deliberate so you can never
      override a parent function by accident.
  - question: In what order do I list parent contracts when inheriting from more
      than one?
    answer: List them from most base (most general) to most derived (most specific),
      left to right. If a parent B itself inherits from A, then A must come
      before B in any list. Getting the order wrong produces a confusing
      'linearization' error, because Solidity uses an algorithm called C3
      linearization to compute a single ordering of all ancestors and your
      written order must be consistent with the inheritance graph.
  - question: What is the difference between calling super.foo() and Parent.foo()
      inside an override?
    answer: "`Parent.foo()` always calls the implementation declared in that
      specific parent. `super.foo()` calls the next function in the linearized
      inheritance order, which in multiple-inheritance chains may not be the
      parent you visually expect. Use the named form when you want a specific
      parent's version, and `super` when you want each layer of a chain to run
      in order (the pattern OpenZeppelin's token extensions rely on)."
---

> Solidity contracts can extend other contracts the same way classes extend in object-oriented languages. A child contract gets all the state variables, modifiers, functions, and events declared in its parents. Properly used, inheritance lets you write small, focused contracts that compose into larger ones. Improperly used, it produces multi-level hierarchies that are hard to follow and audit. This lesson covers the mechanics of inheritance, the rules around overriding, and the patterns most often seen in production code.

The classic motivation is repetition. A handful of state variables and modifiers appear in nearly every nontrivial contract: an owner address, an `onlyOwner` modifier, a constructor that captures `msg.sender` as the owner, a `withdraw` function that the owner alone can call. Writing these out by hand in every contract is wasteful and error-prone. Extracting them into a base contract and inheriting from it lets you share the implementation across many contracts.

## Single inheritance

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
    function withdraw(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }
}
```

`Vault is Ownable` means everything declared in `Ownable` is part of `Vault`. The state variable `owner`, the constructor, and the modifier `onlyOwner` are all available inside `Vault`. When `Vault` is deployed, the `Ownable` constructor runs first, then any code in `Vault`'s own constructor. You don't deploy `Ownable` separately. There's only one contract on chain, and it contains both the inherited and the original code.

The four visibility levels from the functions lesson interact with inheritance directly. `public` and `internal` members are accessible from child contracts. `private` members are not. `external` functions can be called by child contracts, but only via `this.functionName()`. That's the same restriction as calling them from the same contract.

A child contract cannot declare a state variable with the same name as one in a parent. This is a compile error, not silent shadowing. If `Ownable` declares `address public owner`, then `Vault` cannot also declare `address public owner` even if it intends to. The variable exists in the inheritance chain exactly once.

## Passing arguments to a parent constructor

When a parent contract's constructor takes arguments, the child must supply them. There are two ways to do it.

The first is to specify the arguments directly in the inheritance list, with literal or compile-time-known values:

```solidity
// Solidity 0.8.24, Ethereum mainnet
contract Ownable {
    address public owner;

    constructor(address initialOwner) {
        owner = initialOwner;
    }
}

contract HardcodedVault is Ownable(0x1234567890123456789012345678901234567890) {
    // owner is set to the hardcoded address when this contract is deployed
}
```

This form is useful when the parent's constructor argument is known at the time you write the child contract. It's static, but compact.

The second is to call the parent constructor from inside the child's own constructor:

```solidity
contract DynamicVault is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {
        // additional initialization can happen here
    }
}
```

The syntax after the parameter list, `Ownable(initialOwner)`, looks like a function call attached to the constructor declaration. It tells Solidity to pass `initialOwner` to the parent's constructor when `DynamicVault` is deployed. The parent constructor runs first, then `DynamicVault`'s body runs.

Use the second form when the value comes from the deployment transaction and isn't known at compile time. Use the first when the value is fixed.

If a parent has a constructor with required arguments and the child supplies none, the child cannot be deployed and the compiler will either reject it or require it to be marked `abstract`. We'll see this next.

## Abstract contracts

A contract that doesn't fully satisfy all the requirements for deployment is **abstract**. Most commonly, that means it inherits from a parent with a constructor argument it doesn't provide.

```solidity
// Solidity 0.8.24, Ethereum mainnet
abstract contract Balances is Ownable {
    // Ownable's constructor takes (address initialOwner)
    // Balances does not provide it, so Balances cannot be deployed.

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

contract Wallet is Balances {
    constructor(address initialOwner) Ownable(initialOwner) {
        // now the constructor chain is complete; Wallet is deployable
    }
}
```

An abstract contract can still be inherited from. It just cannot be deployed by itself. Trying to deploy one is a compile-time error. Abstract contracts are a structural device for organizing code that's only complete when something else extends it.

Abstract contracts can also have function declarations without bodies, similar to interface methods:

```solidity
abstract contract PriceFeed {
    function latestPrice() public view virtual returns (uint256);
}
```

A child that inherits from this must override `latestPrice` with a concrete implementation, or remain abstract itself.

## Function overriding: `virtual` and `override`

Solidity requires explicit opt-in for function overriding. A function in a parent contract is not overridable by default. You have to declare it `virtual` to allow children to provide a replacement:

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

The child writes `override` after the parameter list to declare that it is replacing the parent's function. Both keywords are required. Forgetting `virtual` on the parent or `override` on the child is a compile error. This explicitness is intentional. It makes it impossible to accidentally override a parent function, and it makes the inheritance behavior obvious to anyone reading the code.

If you want the child to remain overridable in turn, mark it both `virtual` and `override`:

```solidity
contract Variant is Ownable {
    function transferOwnership(address newOwner) external virtual override {
        // do something extra, then call the parent
        require(newOwner != address(0), "no zero address");
        super.transferOwnership(newOwner);
    }
}
```

This becomes important in deep inheritance chains where multiple layers add behavior.

Visibility on an override has to be the same or more permissive than the parent. A `public` function can be overridden as `public`. An `external` function can be overridden as `external` or `public`. You cannot tighten visibility, since callers of the parent's contract expect the function to remain callable from where the parent allowed.

Modifiers can also be virtual and overridden using the same `virtual`/`override` keywords. The same rules apply.

## Multiple inheritance and linearization

Solidity supports inheriting from multiple parents. The syntax is just a comma-separated list:

```solidity
contract Vault is Ownable, Balances {
    // inherits members from both Ownable and Balances
}
```

The order matters. Parents must be listed from **most base to most derived**. That is, most general first, most specific last. If `Balances is Ownable`, then `Ownable` is more base than `Balances`, so `Ownable` must come first in any list that mentions both:

```solidity
contract Vault is Ownable, Balances { ... }   // correct order
contract Bad is Balances, Ownable { ... }     // compile error
```

The reverse order produces an error about "linearization" that is hard to interpret at first. The compiler is using a specific algorithm called C3 linearization to compute a single ordering of all ancestor contracts. C3 needs the inheritance lists to be consistent with the topology of the inheritance graph. If you list a more-derived parent before a more-base one, the algorithm fails because the order you wrote contradicts the order implied by the rest of the graph.

In practice: list the most general library contracts first, then progressively specialized ones, with the most specific behavior last.

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

The `override(A, B)` declares that `C` is overriding the `action` from both `A` and `B`. Without the explicit list, the compiler cannot tell which one or both the override applies to.

## `super` and explicit parent calls

Inside an override, you often want to call the parent's version of the function rather than reimplementing it from scratch. There are two ways.

The first names the parent explicitly:

```solidity
function transferOwnership(address newOwner) external override {
    require(newOwner != address(0), "no zero address");
    Ownable.transferOwnership(newOwner);   // call Ownable's version specifically
}
```

`Ownable.transferOwnership(newOwner)` is unambiguous. It calls the implementation declared in `Ownable`, regardless of the linearization.

The second uses `super`:

```solidity
function transferOwnership(address newOwner) external override {
    require(newOwner != address(0), "no zero address");
    super.transferOwnership(newOwner);
}
```

`super` calls the **next** function in the linearization order, not necessarily the immediate parent of the contract you're writing. This distinction matters in diamond inheritance, where a contract has multiple parents that themselves share a common ancestor.

Consider:

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

When `D.f()` runs, `super.f()` calls `C.f()` because `C` comes after `D` in the linearization. `C.f()`'s `super.f()` then calls `B.f()`. `B.f()`'s `super.f()` finally calls `A.f()`. The call chain is `D → C → B → A`, not the visually-suggested `D → B → A` followed by `D → C → A`. The C3 linearization guarantees each ancestor runs at most once.

This is the pattern behind composable extensions: each layer adds its behavior, calls `super.f()` to chain to the next, and the linearization ensures all layers run in a well-defined order. OpenZeppelin's ERC-20 and ERC-721 implementations rely on this pattern so each extension module can add behavior to the same function.

If you want the immediate-parent semantics, use the named form. If you want the "next layer in the chain" semantics, use `super`. They're different operations, even though in single-inheritance code they look identical.

## Production patterns

A few patterns to recognize when reading real contracts.

**OpenZeppelin's ****`Ownable`****.** The `Ownable` contract in OpenZeppelin Contracts is the canonical example of the pattern shown at the start of this lesson. Many production contracts inherit from it directly. Newer versions accept the initial owner as a constructor argument, which addresses a real pitfall where the deployer accidentally became the owner of a contract intended for someone else.

**OpenZeppelin's ****`AccessControl`****.** Generalizes `Ownable` to a role-based system. Inherits the same patterns but adds a mapping of role identifiers to address sets.
