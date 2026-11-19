---
id: 103
title: The EVM
type: lecture
order: 3
faq:
  - question: Why can't a contract call an API or generate a random number?
    answer: >-
      The EVM has to be deterministic. Same input, same result on every node, or the network
      splits into incompatible chains. So no HTTP requests, no system clock, no true
      randomness, no file reads. A contract sees the transaction input, its own storage, the
      chain state, and block metadata like block.timestamp and block.number.
  - question: Where does data live while a contract runs?
    answer: >-
      Stack, memory, storage, calldata. The stack is the arithmetic surface, 1024 slots of 32
      bytes. Memory is a byte-addressable buffer wiped when the call ends. Calldata is the
      read-only transaction input. Storage is permanent and costs 22,100 gas to write a new
      word, 100 or 2,100 gas to read one.
  - question: Why is everything in the EVM 32 bytes?
    answer: >-
      Each stack slot holds one 256-bit word, sized to match what Keccak hashing produces. A
      bool is a word with 1 or 0 in the last byte, and an address is 20 bytes padded with
      zeros.
  - question: When contract A calls contract B, what is msg.sender inside B?
    answer: >-
      A. msg.sender is whoever made the current call, so the wallet that started the
      transaction is invisible inside B. If B calls C, C sees B.
  - question: What happens to storage writes when a call reverts?
    answer: >-
      Discarded. The EVM snapshots the state when the call starts and restores it on a
      revert.
---

> Every Ethereum contract you'll ever write runs on the same virtual machine, the Ethereum Virtual Machine, or EVM. It's a deterministic, stack-based computer that exists only as a specification. Every Ethereum node implements it, and every node implementation must produce the same output on the same input.

## Every node executes every block and compares the result

Every full node on Ethereum runs every transaction through its EVM. When a new block arrives, the node takes each transaction in order, finds the contract being called, loads that contract's bytecode and storage, and executes the bytecode in its EVM. The result is a set of state changes: balances moved, storage slots written, events emitted, possibly new contracts created.

After applying every transaction in the block, the node computes a hash of the new state, called the **state root**, and checks whether that root matches the one the block producer included in the block header. If it matches, the node accepts the block. If not, the node rejects it.

If your node and my node disagree about what the EVM did with a particular transaction, our state roots after the block will be different, and we'll end up on different chains. So **the EVM has to be deterministic**: the same code with the same input and the same state must give the same result on every machine.

Determinism rules out anything whose result could differ between nodes, such as an HTTP request or a read of the system clock. The lesson on [determinism](/courses/blockchain-basics/the-blockchain-idea/determinism-and-what-blockchains-cant-do) went through the list. The EVM has access only to data the protocol explicitly provides: the transaction's input, the contract's storage, the current block's metadata (`block.timestamp`, `block.number`, `block.coinbase`, etc.), and the chain's state at the time the block is being executed.

## The EVM is a specification that every client implements

The EVM is not a physical chip. It's a specification of how a particular kind of computer behaves. Every Ethereum client, the software a node runs, includes its own implementation of the EVM in its source code. If two clients disagree about the output of an EVM execution, one of them has a bug.

The specification is open and has been adopted by dozens of other chains. The same bytecode you deploy on Ethereum will run on these EVM-compatible chains, sometimes with small differences in opcode behavior or gas pricing.

## Code is a sequence of opcodes that work on a stack

The EVM is **stack-based**. It has a stack that holds values, and most operations work by pushing values onto the stack, popping them off, and pushing results back on. There are no general-purpose registers.

Each stack slot holds a **256-bit word**, or 32 bytes. This is the EVM's native size for everything. A boolean is a 32-byte word with 1 or 0 in the last byte. An address is a 32-byte word with the 20-byte address padded with zeros. Math on smaller integers still computes with all 256 bits, and the high bits are thrown away if they're not needed. The 256-bit size was chosen to match what cryptographic operations like Keccak hashing produce. The price of one word size for everything is that a smaller type is not cheaper to compute with. It saves gas only when several small values are packed into one storage slot, as the lesson on [booleans and integers](/courses/development-on-ethereum/solidity-basics/booleans-and-integers) shows.

The code itself is **bytecode**: a sequence of single-byte instructions called **opcodes**. Each one tells the EVM to do one specific thing: `ADD` pops two values from the stack and pushes their sum, `MSTORE` writes a word to memory, `SLOAD` reads a value from contract storage, `CALL` invokes another contract. The Solidity compiler turns your source code into a sequence of these opcodes, which the EVM then walks one at a time.

To make this concrete, consider one line of Solidity:

```solidity
uint256 c = a + b;
```

If `a` and `b` are local variables, the compiler emits something close to this bytecode sequence:

```
PUSH1 0x02  // push the value of a (say, 2) onto the stack
PUSH1 0x03  // push the value of b (say, 3) onto the stack
ADD         // pop the top two values, push their sum (5)
            // c is the 5 now on top of the stack
```

One line of source became three opcodes, with a total gas cost of about 9. By default Solidity 0.8 also wraps the `ADD` in an overflow check, which the [booleans and integers lesson](/courses/development-on-ethereum/solidity-basics/booleans-and-integers) covers, so the real sequence is longer. The stack started empty and ended with one value on it. Every Solidity statement decomposes into a small handful of stack operations that push, pop, and combine values.

Every opcode has a gas cost, and the EVM itself increments a running counter as it walks through them. When the next opcode would push the counter past the transaction's gas limit, execution halts and the transaction reverts.

## Storage is permanent, the other three data areas last one call

During execution, data lives in one of four places. Each has different cost, lifetime, and access rules.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>EVM data locations: Stack, Memory, Storage, Calldata compared</title><desc>Four columns show where data lives during EVM execution: Stack, Memory, Storage, and Calldata. Each column lists its cost, size, word size, and lifetime, showing that Storage is expensive and lasts forever while the other three are cheap and last only one call.</desc>
  <text x="360" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Where data lives during EVM execution</text>

<rect x="40" y="55" width="150" height="290" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="55" width="150" height="35" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="115" y="78" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Stack</text>
  <text x="115" y="110" text-anchor="middle" font-size="10" fill="#565653" font-style="italic">working surface</text>
  <line x1="55" y1="125" x2="175" y2="125" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="115" y="145" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">cost: free-ish</text>
  <text x="115" y="163" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">size: 1024 slots</text>
  <text x="115" y="181" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">word: 32 bytes</text>
  <text x="115" y="199" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">lifetime: one call</text>
  <line x1="55" y1="215" x2="175" y2="215" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="115" y="240" text-anchor="middle" font-size="10" fill="#565653">Where opcodes do</text>
  <text x="115" y="256" text-anchor="middle" font-size="10" fill="#565653">their actual work.</text>
  <text x="115" y="272" text-anchor="middle" font-size="10" fill="#565653">Push, pop, math.</text>

<rect x="210" y="55" width="150" height="290" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="210" y="55" width="150" height="35" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="285" y="78" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Memory</text>
  <text x="285" y="110" text-anchor="middle" font-size="10" fill="#565653" font-style="italic">scratch pad</text>
  <line x1="225" y1="125" x2="345" y2="125" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="285" y="145" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">cost: cheap</text>
  <text x="285" y="163" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">size: unlimited*</text>
  <text x="285" y="181" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">word: byte-addressable</text>
  <text x="285" y="199" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">lifetime: one call</text>
  <line x1="225" y1="215" x2="345" y2="215" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="285" y="240" text-anchor="middle" font-size="10" fill="#565653">Temporary buffer for</text>
  <text x="285" y="256" text-anchor="middle" font-size="10" fill="#565653">arrays, strings, structs.</text>
  <text x="285" y="272" text-anchor="middle" font-size="10" fill="#565653">Wiped between calls.</text>
  <text x="285" y="295" text-anchor="middle" font-size="9" fill="#565653" font-style="italic">*priced quadratically</text>

<rect x="380" y="55" width="150" height="290" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="380" y="55" width="150" height="35" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="455" y="78" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Storage</text>
  <text x="455" y="110" text-anchor="middle" font-size="10" fill="#565653" font-style="italic">contract's persistent state</text>
  <line x1="395" y1="125" x2="515" y2="125" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="455" y="145" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">cost: expensive</text>
  <text x="455" y="163" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">size: 2^256 slots</text>
  <text x="455" y="181" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">word: 32 bytes</text>
  <text x="455" y="199" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937">lifetime: forever</text>
  <line x1="395" y1="215" x2="515" y2="215" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="455" y="240" text-anchor="middle" font-size="10" fill="#565653">Persistent state of the</text>
  <text x="455" y="256" text-anchor="middle" font-size="10" fill="#565653">contract. Survives forever.</text>
  <text x="455" y="272" text-anchor="middle" font-size="10" fill="#565653">Costs you for every write.</text>

<rect x="550" y="55" width="150" height="290" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="550" y="55" width="150" height="35" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="625" y="78" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Calldata</text>
  <text x="625" y="110" text-anchor="middle" font-size="10" fill="#565653" font-style="italic">incoming arguments</text>
  <line x1="565" y1="125" x2="685" y2="125" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="625" y="145" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">cost: cheap</text>
  <text x="625" y="163" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">size: tx-defined</text>
  <text x="625" y="181" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">word: byte-addressable</text>
  <text x="625" y="199" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">lifetime: one call</text>
  <line x1="565" y1="215" x2="685" y2="215" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="625" y="240" text-anchor="middle" font-size="10" fill="#565653">The transaction's input.</text>
  <text x="625" y="256" text-anchor="middle" font-size="10" fill="#565653">Read-only from inside</text>
  <text x="625" y="272" text-anchor="middle" font-size="10" fill="#565653">the contract.</text>

<text x="360" y="370" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Solidity asks you to declare which one your variables live in. Each choice costs different gas.</text>
</svg>

The **stack** is where the EVM does its work, as in the example above. Solidity manages the stack for you implicitly. You don't write stack operations by hand unless you drop into inline assembly.

**Memory** is a contiguous, byte-addressable buffer that lives only for the duration of a single call. When a transaction triggers a contract, memory starts empty. When the call ends, memory is gone. Solidity uses memory to hold the runtime representations of structs, arrays, and strings that don't need to persist. Memory is cheap for small amounts and gets expensive as you use more of it, because the protocol charges quadratically as it grows.

**Storage** is the contract's persistent state. It survives between calls and between blocks, unless someone explicitly overwrites it or the contract is destroyed. Storage is a mapping from 256-bit keys to 256-bit values, owned by the contract. Every state variable you declare in Solidity goes here unless you say otherwise. Storage is by a wide margin the most expensive place to put data, because every full node has to hold it. The lesson on [contracts and gas](/courses/development-on-ethereum/how-ethereum-works/contracts-and-gas) has the numbers.

**Calldata** is the input data sent with the transaction. It's read-only from inside the contract: the contract can look at it but can't modify it. Calldata is the cheapest place to read function arguments from, which is why Solidity functions that take large inputs like long arrays usually take them as `calldata` rather than copying them into memory first.

## Each call gets a fresh context, and a revert restores the state

Every time a contract is called, the EVM creates a fresh **execution context**: a new empty stack, a new empty memory buffer, and the call's arguments in calldata. The context also includes a small set of values that describe the call itself. Solidity exposes three of them: `msg.sender` is the address that made this call, `msg.value` is the ETH attached to the call, and `msg.data` is the raw calldata bytes. These exist for the lifetime of one call. If contract A calls contract B, B sees A as `msg.sender`, not the EOA that started the transaction. If B then calls C, C sees B as its `msg.sender`.

Storage works differently from the other three data areas. Each contract has its own storage, and the EVM only lets the currently executing code read or write *that contract's* storage. When A calls B, the executing code is B's, so storage operations touch B's slots. When B returns and execution resumes in A, storage operations touch A's slots again. The other three areas, stack and memory and calldata, are local to a single call and get destroyed when the call ends.

Reverts work at this same call-boundary level. When a contract starts executing, the EVM takes a logical snapshot of the chain state. If the call completes normally, the state changes are committed. If anything in the call reverts, the EVM restores the snapshot, discarding every state change made during that call. The atomicity property from the previous lesson rests on this snapshot-and-restore mechanism, which is built into the EVM itself.

## Ask where each variable lives and who pays for it

For every variable in a contract, ask where it lives and who pays for its life. A value on the stack or in memory is gone when the call ends. A state variable sits in storage on every full node until someone overwrites it, and whoever sends a transaction that writes it pays for that, at the highest gas cost of the four data areas.
