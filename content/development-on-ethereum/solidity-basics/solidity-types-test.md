---
id: 37
title: Solidity types - Test
type: test
order: 7
---

<!-- q:69fba50b1a3915235faacffd -->
Caller identity at deployment time

A contract has the following constructor:

```solidity
contract Vault {
    address public deployer;

    constructor() {
        deployer = msg.sender;
    }
}
```

Alice's EOA deploys this contract directly from her wallet. After deployment, what does `deployer` hold?

- [ ] The address of the deployed `Vault` contract itself  <!-- a:69fba53c1a3915235faacffe -->
- [x] Alice's EOA address  <!-- a:69fba5531a3915235faacfff -->
- [ ] `address(0)`  <!-- a:69fba55b1a3915235faad000 -->
- [ ] The address of the factory or proxy that processed the deployment  <!-- a:69fba5651a3915235faad001 -->

<!-- q:69fba56b1a3915235faad002 -->
You want to check whether two `string memory` variables hold the same text. Which expression compiles and works?

- [ ] `s1 == s2`  <!-- a:69fba57c1a3915235faad003 -->
- [x] `keccak256(bytes(s1)) == keccak256(bytes(s2))`  <!-- a:69fba5871a3915235faad004 -->
- [ ] `s1.equals(s2)`  <!-- a:69fba5911a3915235faad005 -->
- [ ] `bytes(s1) == bytes(s2)`  <!-- a:69fba5961a3915235faad006 -->

<!-- q:69fba5a61a3915235faad007 -->
Consider this contract:

```solidity
contract Order {
    enum Status { Approved, Pending, Rejected, Shipped }
    Status public state;
}
```

Immediately after deployment, what is the value of `state`?

- [ ] `Pending`, because that's the natural starting state for an order  <!-- a:69fba5c91a3915235faad008 -->
- [x] `Approved`  <!-- a:69fba5d31a3915235faad009 -->
- [ ] `Rejected`  <!-- a:69fba5db1a3915235faad00a -->
- [ ] The variable is uninitialized and reading it reverts  <!-- a:69fba5e41a3915235faad00b -->

<!-- q:69fba5eb1a3915235faad00c -->
What is the result of compiling this function?

```solidity
function build() public pure returns (uint256[] memory) {
    uint256[] memory arr = new uint256[](2);
    arr[0] = 1;
    arr[1] = 2;
    arr.push(3);
    return arr;
}
```

- [ ] Compiles and returns `[1, 2, 3]`  <!-- a:69fba5fe1a3915235faad00d -->
- [ ] Compiles, but reverts at runtime when `push` is called  <!-- a:69fba6131a3915235faad00e -->
- [x] Compile error: memory arrays don't support `push`  <!-- a:69fba61d1a3915235faad00f -->
- [ ] Compiles and returns `[1, 2]` (the `push` is silently ignored)  <!-- a:69fba6201a3915235faad010 -->

<!-- q:69fba62a1a3915235faad011 -->
Two functions read from data structures using a value that was never written:

```solidity
contract A {
    mapping(uint256 => uint256) m;
    uint256[] arr;

    function readMissing() external view returns (uint256, uint256) {
        return (m[999], arr[999]);
    }
}
```

What happens when `readMissing` is called on a freshly deployed contract?

- [ ] Both reads return `0`  <!-- a:69fba6811a3915235faad012 -->
- [x] `m[999]` returns `0` while `arr[999]` reverts  <!-- a:69fba6881a3915235faad013 -->
- [ ] Both reads revert  <!-- a:69fba6921a3915235faad014 -->
- [ ] `m[999]` reverts while `arr[999]` returns `0`  <!-- a:69fba69a1a3915235faad015 -->

<!-- q:69fba6bb1a3915235faad016 -->
A contract starts with a balance of 0. An external caller invokes the following function with 1 ether attached:

```solidity
contract Vault {
    function deposit() external payable returns (uint256) {
        return address(this).balance;
    }
}
```

- [ ] 0, because the deposit is only credited after the function returns  <!-- a:69fba6db1a3915235faad017 -->
- [x] 1 ether, because the deposit is credited before the function body runs  <!-- a:69fba6f31a3915235faad018 -->
- [ ] Reverts because `address(this).balance` is not allowed in payable functions  <!-- a:69fba6f91a3915235faad019 -->
- [ ] An undefined value, because the order is not guaranteed  <!-- a:69fba7071a3915235faad01a -->

<!-- q:69fba70e1a3915235faad01b -->
Two functions both compute "7 percent of `x`" using integer math:

```solidity
function pctA(uint256 x) public pure returns (uint256) {
    return (x * 7) / 100;
}

function pctB(uint256 x) public pure returns (uint256) {
    return (x / 100) * 7;
}
```

For `x = 50`, what does each function return?

- [ ] Both return 3  <!-- a:69fba73c1a3915235faad01c -->
- [ ] Both return 0  <!-- a:69fba7441a3915235faad01d -->
- [x] `pctA` returns 3, `pctB` returns 0  <!-- a:69fba7511a3915235faad01e -->
- [ ] `pctA` returns 0, `pctB` returns 3  <!-- a:69fba75c1a3915235faad01f -->

<!-- q:69fba76c1a3915235faad020 -->
A contract has this code:

```solidity
enum Status { A, B, C }

function castFrom(uint8 value) public pure returns (Status) {
    return Status(value);
}
```

What happens when this function is called with `value = 5`?

- [ ] Returns `Status.С` (5 modulo 3 = 2, but indexing wraps around to A)  <!-- a:69fba7971a3915235faad021 -->
- [ ] Returns `Status.C` (out-of-range values are clamped to the highest valid value)  <!-- a:69fba7a61a3915235faad022 -->
- [x] Reverts the transaction  <!-- a:69fba7ae1a3915235faad023 -->
- [ ] Returns an undefined value, and behavior depends on the compiler version  <!-- a:69fba7b71a3915235faad024 -->

<!-- q:69fba7cd1a3915235faad025 -->
Two contracts each declare a single state variable:

```solidity
contract A { uint8 public count; }
contract B { uint256 public count; }
```

Compared to writing to `count` in contract B, writing to `count` in contract A costs:

- [ ] 1/32 as much gas (proportional to the bit width)  <!-- a:69fba89e1a3915235faad026 -->
- [ ] Roughly 1/4 as much gas  <!-- a:69fba8ae1a3915235faad027 -->
- [x] Roughly the same amount of gas  <!-- a:69fba8b41a3915235faad028 -->
- [ ] More gas, because the EVM has to mask the value to fit `uint8`  <!-- a:69fba8bd1a3915235faad029 -->
