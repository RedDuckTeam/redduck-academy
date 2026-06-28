# Solidity types - Test

_type: test_

---

## Questions

### Q1

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

a. The address of the deployed `Vault` contract itself
b. Alice's EOA address
c. `address(0)`
d. The address of the factory or proxy that processed the deployment

### Q2

You want to check whether two `string memory` variables hold the same text. Which expression compiles and works?

a. `s1 == s2`
b. `keccak256(bytes(s1)) == keccak256(bytes(s2))`
c. `s1.equals(s2)`
d. `bytes(s1) == bytes(s2)`

### Q3

Consider this contract:

```solidity
contract Order {
    enum Status { Approved, Pending, Rejected, Shipped }
    Status public state;
}
```

Immediately after deployment, what is the value of `state`?

a. `Pending`, because that's the natural starting state for an order
b. `Approved`
c. `Rejected`
d. The variable is uninitialized and reading it reverts

### Q4

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

a. Compiles; returns `[1, 2, 3]`
b. Compiles; reverts at runtime when `push` is called
c. Compile error: memory arrays don't support `push`
d. Compiles; returns `[1, 2]` (the `push` is silently ignored)

### Q5

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

a. Both reads return `0`
b. `m[999]` returns `0`; `arr[999]` reverts
c. Both reads revert
d. `m[999]` reverts; `arr[999]` returns `0`

### Q6

A contract starts with a balance of 0. An external caller invokes the following function with 1 ether attached:

```solidity
contract Vault {
    function deposit() external payable returns (uint256) {
        return address(this).balance;
    }
}
```

a. 0, because the deposit is only credited after the function returns
b. 1 ether, because the deposit is credited before the function body runs
c. Reverts because `address(this).balance` is not allowed in payable functions
d. An undefined value; the order is not guaranteed

### Q7

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

a. Both return 3
b. Both return 0
c. `pctA` returns 3, `pctB` returns 0
d. `pctA` returns 0, `pctB` returns 3

### Q8

A contract has this code:

```solidity
enum Status { A, B, C }

function castFrom(uint8 value) public pure returns (Status) {
    return Status(value);
}
```

What happens when this function is called with `value = 5`?

a. Returns `Status.С` (5 modulo 3 = 2, but indexing wraps around to A)
b. Returns `Status.C` (out-of-range values are clamped to the highest valid value)
c. Reverts the transaction
d. Returns an undefined value; behavior depends on the compiler version

### Q9

Two contracts each declare a single state variable:

```solidity
contract A { uint8 public count; }
contract B { uint256 public count; }
```

Compared to writing to `count` in contract B, writing to `count` in contract A costs:

a. 1/32 as much gas (proportional to the bit width)
b. Roughly 1/4 as much gas
c. Roughly the same amount of gas
d. More gas, because the EVM has to mask the value to fit `uint8`
