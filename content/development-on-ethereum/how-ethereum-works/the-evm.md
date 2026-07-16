---
id: 103
title: The EVM
type: lecture
order: 3
faq:
  - question: Why can't a smart contract make an API call or generate a random number?
    answer: "The Ethereum Virtual Machine (EVM), the computer that runs every
      contract, must be deterministic: the same code with the same input has to
      produce the same result on every node, or the network would split into
      incompatible chains. Anything non-deterministic is therefore forbidden, so
      a contract cannot make HTTP requests, read the system clock, generate true
      randomness, or read files. It can only see data the protocol provides,
      such as the transaction input, the contract's storage, and basic block
      information."
  - question: What are the four places data can live during EVM execution?
    answer: Data lives in the stack, memory, storage, or calldata. The stack is the
      scratch surface for arithmetic, memory is a temporary buffer that is wiped
      when the call ends, and calldata is the read-only input sent with the
      transaction; all three last only for a single call and are cheap. Storage
      is the contract's permanent state that survives forever, and it is by far
      the most expensive place to put data.
  - question: Will the same Solidity contract run on other chains like Polygon or
      Arbitrum?
    answer: Usually yes. The EVM specification is open and has been adopted by many
      other chains, including Polygon, BNB Chain, Avalanche's C-Chain, Arbitrum,
      Optimism, and Base. When a chain is called 'EVM-compatible', it means the
      same bytecode you deploy on Ethereum will run there too, sometimes with
      small differences in opcode behavior or gas pricing.
  - question: When one contract calls another, what does msg.sender point to?
    answer: Each call gets a fresh execution context, and msg.sender is the address
      that made the current call, not the original user. If contract A calls
      contract B, then inside B the value of msg.sender is A, and the original
      wallet that started the transaction is invisible from inside B. If B then
      calls C, then C sees B as its msg.sender, so the chain of msg.sender
      values mirrors the call stack.
---

> Every Ethereum contract you'll ever write runs on the same virtual machine, the Ethereum Virtual Machine, or EVM. It's a deterministic, stack-based computer that exists only as a specification. Every Ethereum node implements it, and every node implementation must produce the same output on the same input, or the network would split into incompatible chains. Understanding the shape of this machine, even at a high level, makes everything else in Solidity easier to reason about.

## What "virtual machine" means here

The EVM is not a physical chip. It's a specification of how a particular kind of computer behaves. Every Ethereum client includes its own implementation of the EVM in its source code. The major clients are Geth, Reth, Erigon, Besu, and Nethermind. When a transaction arrives, the client feeds the transaction's input and the relevant contract's bytecode into its EVM implementation, runs the execution, and produces a result. That result must be identical to what every other client produces for the same inputs. If two clients disagree about the output of an EVM execution, one of them has a bug, and that bug will cause a chain split.

This is the core property that everything else depends on: **the EVM is deterministic**. Same code, same input, same state, same result. Every time. On every machine.

A consequence: the EVM cannot do things that would produce non-deterministic results. It can't make HTTP requests. It can't read the system clock. It can't generate true randomness. It can't read files. It has access only to data the protocol explicitly provides: the transaction's input, the contract's storage, the current block's metadata (`block.timestamp`, `block.number`, `block.coinbase`, etc.), and the chain's state at the time the block is being executed. Everything else is off-limits, by design.

The EVM is also not unique to Ethereum. The specification is open and has been adopted by dozens of other chains. Polygon, BNB Chain, Avalanche's C-Chain, Arbitrum, Optimism, Base, zkSync Era's later versions, and many more all run EVM implementations. When people say a chain is "EVM-compatible," this is what they mean: the same bytecode you deploy on Ethereum will run on these other chains, sometimes with small differences in opcode behavior or gas pricing. The skills you build for Ethereum carry directly to most major smart contract chains.

## How it runs code

The EVM is **stack-based**. It has a stack that holds values, and most operations work by pushing values onto the stack, popping them off, and pushing results back on. There are no general-purpose registers. The stack is the working surface.

Each stack slot holds a **256-bit word**, or 32 bytes. This is the EVM's native size for everything. A boolean is a 32-byte word with 1 or 0 in the last byte. An address is a 32-byte word with the 20-byte address padded with zeros. Math on smaller integers still computes with all 256 bits. The high bits are thrown away if they're not needed. The 256-bit size was chosen to match what cryptographic operations like Keccak hashing produce.

The code itself is **bytecode**: a sequence of single-byte instructions called **opcodes**. There are about 140 of them. Each one tells the EVM to do one specific thing: `ADD` pops two values from the stack and pushes their sum, `MSTORE` writes a word to memory, `SLOAD` reads a value from contract storage, `CALL` invokes another contract. The Solidity compiler turns your source code into a sequence of these opcodes, which the EVM then walks one at a time.

To make this concrete, consider one line of Solidity:

```solidity
uint256 c = a + b;
```

If `a` and `b` are local variables, the compiler emits something close to this bytecode sequence:

```
PUSH1 0x02  // push the value of a (say, 2) onto the stack
PUSH1 0x03  // push the value of b (say, 3) onto the stack
ADD         // pop the top two values, push their sum (5)
            // c now holds 5 in whatever slot the compiler chose
```

Three opcodes for one line of source. Total gas cost: about 9. The stack started empty, ended with one value on it. This is the rhythm of all EVM execution. Every Solidity statement decomposes into a small handful of stack operations that push, pop, and combine values.

Every opcode has a gas cost, and the EVM itself increments a running counter as it walks through them. When the next opcode would push the counter past the transaction's gas limit, execution halts and the transaction reverts. There is no external supervisor checking gas. The EVM does its own accounting.

## The four places data lives

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

The **stack** is where the EVM does its work. Every arithmetic operation, every comparison, every branch happens by pushing values onto the stack and popping them off. The stack has a maximum depth of 1024 slots. Reaching that depth halts execution. Solidity manages the stack for you implicitly. You don't write stack operations by hand unless you drop into inline assembly.

**Memory** is a contiguous, byte-addressable buffer that lives only for the duration of a single call. When a transaction triggers a contract, memory starts empty. As the code runs, it can write data to memory and read it back. When the call ends, memory is gone. Solidity uses memory to hold the runtime representations of structs, arrays, and strings that don't need to persist. Memory is cheap for small amounts and gets expensive as you use more of it, because the protocol charges quadratically as it grows.

**Storage** is the contract's persistent state. It survives between calls. It survives between blocks. It survives forever, unless someone explicitly overwrites it or the contract is destroyed. Storage is a mapping from 256-bit keys to 256-bit values, owned by the contract. Every state variable you declare in Solidity goes here unless you say otherwise. Storage is by a wide margin the most expensive place to put data. Writing a new value to storage costs 22,100 gas. Reading from storage costs 100 or 2,100 gas depending on whether the slot was already accessed in this transaction. These numbers are why so much of advanced Solidity is about avoiding storage when you can.

**Calldata** is the input data sent with the transaction. It's read-only from inside the contract: the contract can look at it but can't modify it. Calldata is the cheapest place to read function arguments from, which is why Solidity functions that take large inputs like long arrays usually take them as `calldata` rather than copying them into memory first.

## Call context and reverts

Every time a contract is called, the EVM creates a fresh **execution context**. A new empty stack. A new empty memory buffer. A fresh copy of the call's arguments in calldata. The context also includes a small set of values that describe the call itself. Solidity exposes three of them: `msg.sender` is the address that made this call, `msg.value` is the ETH attached to the call, and `msg.data` is the raw calldata bytes. These exist for the lifetime of one call. If contract A calls contract B, B sees A as `msg.sender`. The original EOA that started the transaction is invisible from inside B. If B then calls C, C sees B as its `msg.sender`. The chain of `msg.sender` values mirrors the call stack.

Storage works differently from the other three data areas in one important way. Each contract has its own storage, and the EVM only lets the currently executing code read or write *that contract's* storage. When A calls B, the executing code is B's, so storage operations touch B's slots. When B returns and execution resumes in A, storage operations touch A's slots again. The other three areas, stack and memory and calldata, are local to a single call and get destroyed when the call ends.

Reverts work at this same call-boundary level. When a contract starts executing, the EVM takes a logical snapshot of the chain state. If the call completes normally, the state changes are committed. If anything in the call reverts, the EVM restores the snapshot, discarding every state change made during that call. This is what makes the atomicity property from the previous lesson actually work. The snapshot-and-restore mechanism is built into the EVM itself, part of the protocol rather than a layer on top.

## How the EVM ties to consensus

Every full node on Ethereum runs every transaction through its EVM. When a new block arrives, the node takes each transaction in order, finds the contract being called, loads that contract's bytecode and storage, and executes the bytecode in its EVM. The result is a set of state changes: balances moved, storage slots written, events emitted, possibly new contracts created. The node applies those changes to its copy of the state.

After applying every transaction in the block, the node has a new state. It computes a hash of that state, called the **state root**, and checks whether that root matches the one the block producer included in the block header. If it matches, the node accepts the block. If not, the node rejects it.

This is what makes the EVM's determinism so important. If your node and my node disagree about what the EVM did with a particular transaction, our state roots after the block will be different, and we'll end up on different chains. The whole system rests on every node's EVM producing exactly the same answer on exactly the same input. A bug in one client's EVM implementation that diverges from the others can fork the network, which has happened in the past and is treated as a critical incident by the client teams.

## What this means for the rest of the course

You won't write EVM bytecode directly in this course. You'll write Solidity. But understanding the machine your code compiles to changes how you write that code.

Three reflexes carry forward. Variables get assigned to one of four data areas, and you'll need to know which is which when Solidity asks. Storage is expensive, which means contract design starts with the question of what actually has to live on chain versus what can be reconstructed off chain. And every line of Solidity becomes some number of EVM opcodes, which means the cost of your code is real, measurable, and the topic of an entire subfield of Solidity expertise.
