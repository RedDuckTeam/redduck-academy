---
id: 185
title: Transaction fees and compute units
type: lecture
faq:
  - question: What is the difference between the base fee and the priority fee on Solana?
    answer: "The base fee is fixed at 5,000 lamports per signature, mandatory, and
      covers signature verification and spam prevention. Half of it is burned
      and half goes to the validator. The priority fee is optional and variable:
      it tells the block leader to schedule your transaction ahead of others,
      and all of it goes to the validator, none burned."
  - question: Do I still pay Solana fees if my transaction fails?
    answer: Yes. Both the base fee and the priority fee are charged up front, before
      the transaction runs. If it succeeds, the fees are kept and your changes
      commit; if it fails, the fees are still kept and the changes roll back.
      You pay for the attempt regardless of the outcome.
  - question: Why does my Solana transaction pay priority fee on compute units it
      never used?
    answer: The priority fee is calculated from the CU limit you reserved, not from
      the compute units your program actually spent. If you set a 200,000 CU
      limit but only use 60,000, you still pay on all 200,000, because the
      leader had to plan for the full cap. The fix is to simulate the
      transaction first, see the real usage, add a 10-20% margin, and set the
      limit to that.
  - question: How do I set the compute unit limit and price for a transaction?
    answer: "Use the built-in Compute Budget program: add a SetComputeUnitLimit
      instruction to cap the compute units and a SetComputeUnitPrice instruction
      to set the per-unit rate in micro-lamports. Set the limit too high and you
      overpay and dilute your effective bid; set it too low and the transaction
      reverts with a compute budget exceeded error while still charging you."
---

> A Solana transaction pays for two separate things. It pays a small fixed amount for the right to land in a block at all, and an optional extra amount for the leader to schedule it ahead of competing transactions. The first is the base fee. The second is the priority fee. Understanding which one is which, and why both exist, is what makes the rest of the cost story stop feeling random.

## Two parts of the bill

Every transaction on Solana has the same fee structure. The base fee is fixed, mandatory, and tiny. The priority fee is variable, optional, and tied to how much computation your transaction will use.

The **base fee** is five thousand lamports per signature. A transaction with one signer pays five thousand lamports total in base fees. A transaction with two signers, say a multisig, pays ten thousand. The amount doesn't change with the size or complexity of what the transaction does. It exists to cover the cost of signature verification, which every validator has to perform, and to put a floor under spam. Half of the base fee gets burned, removed from circulation permanently. The other half goes to the validator that produced the block.

The **priority fee** is on top of that and is yours to set. It is the way a transaction tells the leader "schedule me ahead of the others." When the network is busy and more transactions arrive than fit in a block, the leader's scheduler sorts the incoming traffic by how much priority fee each transaction is paying per unit of computation, and works through them from highest to lowest. Pay more priority fee, get included sooner. The priority fee goes entirely to the validator, none of it is burned.

<svg role="img" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Solana transaction fee split into base fee and priority fee</title><desc>Two side-by-side panels compare the base fee (5,000 lamports per signature, always paid, 50% burned and 50% to the validator) with the priority fee (CU price times CU limit, optional, 100% to the validator, example totaling 200,000 lamports). Below them, total fee equals base fee plus priority fee, charged whether the transaction succeeds or fails.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A Solana transaction fee has two parts</text>
  <rect x="40" y="90" width="310" height="280" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="112" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">1. Base fee</text>
  <text x="60" y="146" font-family="monospace" font-size="10" font-weight="bold">cost:</text>
  <text x="115" y="146" font-family="monospace" font-size="10">5,000 lamports per signature</text>
  <text x="60" y="170" font-family="monospace" font-size="10" font-weight="bold">paid:</text>
  <text x="115" y="170" font-family="monospace" font-size="10">always, every transaction</text>
  <text x="60" y="194" font-family="monospace" font-size="10" font-weight="bold">where:</text>
  <text x="115" y="194" font-family="monospace" font-size="10">50% burned</text>
  <text x="115" y="208" font-family="monospace" font-size="10">50% to the validator</text>
  <line x1="55" y1="224" x2="335" y2="224" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="195" y="246" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">For one signer:</text>
  <text x="195" y="266" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="#ed4937">5,000 lamports</text>
  <text x="195" y="282" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">≈ 0.000005 SOL</text>
  <line x1="55" y1="300" x2="335" y2="300" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="195" y="320" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">paying this is what lets your</text>
  <text x="195" y="334" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">transaction get into a block</text>
  <text x="195" y="354" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">at all</text>
  <rect x="370" y="90" width="310" height="280" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="112" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">2. Priority fee</text>
  <text x="390" y="146" font-family="monospace" font-size="10" font-weight="bold">cost:</text>
  <text x="445" y="146" font-family="monospace" font-size="10">CU_price × CU_limit / 1,000,000</text>
  <text x="390" y="170" font-family="monospace" font-size="10" font-weight="bold">paid:</text>
  <text x="445" y="170" font-family="monospace" font-size="10">optional, zero is allowed</text>
  <text x="390" y="194" font-family="monospace" font-size="10" font-weight="bold">where:</text>
  <text x="445" y="194" font-family="monospace" font-size="10">100% to the validator</text>
  <line x1="385" y1="224" x2="665" y2="224" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="525" y="246" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">Example:</text>
  <text x="525" y="262" text-anchor="middle" font-family="monospace" font-size="9">1,000 µlamports/CU × 200,000 CU</text>
  <text x="525" y="278" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="#ed4937">= 200,000 lamports</text>
  <text x="525" y="294" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">≈ 0.0002 SOL</text>
  <line x1="385" y1="312" x2="665" y2="312" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="525" y="332" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">paying this tells the leader</text>
  <text x="525" y="346" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">to prioritize you over the</text>
  <text x="525" y="360" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">queue of competing transactions</text>
  <text x="360" y="410" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">total fee  =  base fee  +  priority fee</text>
  <text x="360" y="430" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">Charged whether the transaction succeeds or fails. The leader did the work either way.</text>
</svg>

Both fees are paid up front, before the transaction runs. If the transaction succeeds, the network keeps the fees and the state changes commit. If the transaction fails, the network still keeps the fees and the state changes roll back. The validator did the work to try, and you pay for the attempt regardless of outcome.

## Compute units

The value that determines the size of the priority fee is the compute unit, abbreviated CU. Every operation a Solana program performs costs a fixed number of compute units. Adding two integers, reading a byte from an account, calling another program, hashing some data, each one has a CU cost set by the runtime. The total CU consumption of your transaction is the sum across every operation it executes.

Two CU numbers matter, and they are different things.

The **CU limit** is the cap your transaction declares for itself. It is the maximum number of compute units the runtime is allowed to spend on you before reverting the transaction with a "compute budget exceeded" error. Each transaction gets a default CU limit if you don't set one explicitly: 200,000 CU per instruction for programs you write (native Solana programs use a separate budget), up to a hard ceiling of 1,400,000 CU for the entire transaction.

The **CU price** is how many micro-lamports you are willing to pay per compute unit of that budget. A micro-lamport is one millionth of a lamport, so the formula divides by a million to turn it back into whole lamports: `priority_fee = CU_price × CU_limit / 1,000,000`.

The priority fee is computed from the CU **limit**, the cap you reserved, not from the CU **usage**, what the program actually spent. If you reserve 200,000 CU and your program only uses 60,000, you still pay priority fee on all 200,000. The leader treats the cap as the resource you locked up, since they had to plan for it being used.

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Compute units: budget vs actual, priority fee charged on the 200,000 CU cap</title><desc>The diagram compares a 200,000 CU compute budget with the 60,000 CU the program actually used, leaving 140,000 CU unused but still reserved. It shows the priority fee is charged on the full 200,000 CU cap, with an example: at 1,000 microlamports per CU, the fee is 200,000 lamports.</desc>
  <defs>
    <marker id="arrS25bR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Compute units: budget vs actual</text>
  <rect x="40" y="90" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="110" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">your transaction's CU budget (what you asked for)</text>
  <rect x="60" y="132" width="600" height="22" fill="#e0deda" stroke="#565653" stroke-width="1"/>
  <text x="65" y="148" font-family="monospace" font-size="10" font-weight="bold">200,000 CU</text>
  <text x="655" y="148" text-anchor="end" font-family="monospace" font-size="9" fill="#565653">the cap your transaction will pay for</text>
  <line x1="360" y1="178" x2="360" y2="205" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS25bR)"/>
  <rect x="40" y="210" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="210" width="640" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="230" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">what the program actually used</text>
  <rect x="60" y="252" width="600" height="22" fill="#e0deda" stroke="#565653" stroke-width="1"/>
  <rect x="60" y="252" width="180" height="22" fill="#565653"/>
  <text x="65" y="268" font-family="monospace" font-size="10" font-weight="bold" fill="#ffffff">60,000 CU</text>
  <text x="430" y="268" font-family="monospace" font-size="9" fill="#565653">140,000 CU unused but reserved</text>
  <line x1="360" y1="298" x2="360" y2="325" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS25bR)"/>
  <rect x="40" y="330" width="640" height="100" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="352" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">priority fee charged on what you asked for, the 200,000 cap</text>
  <line x1="55" y1="360" x2="665" y2="360" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="380" font-family="monospace" font-size="10">if CU_price = 1,000 µlamports/CU:</text>
  <text x="60" y="398" font-family="monospace" font-size="10">priority fee = 1,000 × 200,000 / 1,000,000  =  200,000 lamports</text>
  <text x="60" y="416" font-family="monospace" font-size="10" fill="#565653" font-style="italic">setting the limit too high wastes lamports. setting it too low reverts the transaction.</text>
  <text x="360" y="465" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Pick a limit that fits your program's actual usage with a small margin. Default is 200,000 per instruction.</text>
</svg>

This shapes how production code talks to the network. Set the CU limit too high and every transaction pays priority fee on compute units it never touches, which adds up across thousands of transactions and, worse, dilutes your effective bid per CU so the leader treats you as a lower priority than you thought. Set it too low and the transaction reverts mid-execution with a compute budget error, and you still pay the fee with no result. The right move is to simulate your transaction first, see how many CUs it actually consumes, add a margin of ten or twenty percent, and set the limit to that.

The Compute Budget program is what you use to set both values. It is a built-in Solana program with two instructions worth knowing: `SetComputeUnitLimit` to set the CU cap, and `SetComputeUnitPrice` to set the per-CU rate. You include them in your transaction alongside your real work, and the runtime reads them before execution to size your budget.

## The priority fee market in action

Picture three transactions arriving at the same leader in the same block. Alice's transaction is paying 5,000 micro-lamports per CU. Bob's is paying 100. Carol's is paying zero. All three have the default 200,000 CU limit.

Alice's priority fee comes out to 1,000 lamports. Bob's is twenty lamports. Carol's is zero. The leader's scheduler sorts incoming transactions by priority fee per CU, fills the block from the top of the sorted list, and stops when the block is full. Alice lands first, Bob second if there is room, Carol last or not at all depending on how much demand the leader is seeing.

<svg role="img" viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Priority fee market: Alice, Bob, and Carol ranked by fee per CU</title><desc>Three sample transactions from Alice, Bob, and Carol show different priority fees per compute unit, from highest to zero. The leader's scheduler sorts them by fee per CU and fills the block from the top, so Alice lands first, Bob lands second if there is room, and Carol lands last or not at all.</desc>
  <defs>
    <marker id="arrS25cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The priority fee market: leaders pick the highest bidders first</text>
  <rect x="40" y="90" width="200" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="140" y="109" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Tx from Alice</text>
  <text x="55" y="138" font-family="monospace" font-size="10">CU_limit:</text>
  <text x="140" y="138" font-family="monospace" font-size="10">200,000</text>
  <text x="55" y="156" font-family="monospace" font-size="10">CU_price:</text>
  <text x="140" y="156" font-family="monospace" font-size="10">5,000 µL</text>
  <line x1="55" y1="170" x2="225" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="140" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">priority fee</text>
  <text x="140" y="204" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">1,000,000 lamports</text>
  <rect x="260" y="90" width="200" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="260" y="90" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="109" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Tx from Bob</text>
  <text x="275" y="138" font-family="monospace" font-size="10">CU_limit:</text>
  <text x="360" y="138" font-family="monospace" font-size="10">200,000</text>
  <text x="275" y="156" font-family="monospace" font-size="10">CU_price:</text>
  <text x="360" y="156" font-family="monospace" font-size="10">100 µL</text>
  <line x1="275" y1="170" x2="445" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">priority fee</text>
  <text x="360" y="204" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">20,000 lamports</text>
  <rect x="480" y="90" width="200" height="120" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="480" y="90" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="580" y="109" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Tx from Carol</text>
  <text x="495" y="138" font-family="monospace" font-size="10">CU_limit:</text>
  <text x="580" y="138" font-family="monospace" font-size="10">200,000</text>
  <text x="495" y="156" font-family="monospace" font-size="10">CU_price:</text>
  <text x="580" y="156" font-family="monospace" font-size="10">0 µL</text>
  <line x1="495" y1="170" x2="665" y2="170" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="580" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ed4937">priority fee</text>
  <text x="580" y="204" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">0 lamports</text>
  <line x1="140" y1="218" x2="140" y2="248" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS25cR)"/>
  <line x1="360" y1="218" x2="360" y2="248" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS25cR)"/>
  <line x1="580" y1="218" x2="580" y2="248" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS25cR)"/>
  <rect x="40" y="255" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="278" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Leader's scheduler sorts by priority fee per CU</text>
  <line x1="55" y1="286" x2="665" y2="286" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="304" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">block space is finite, so the highest bidders go first</text>
  <line x1="360" y1="320" x2="360" y2="348" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS25cR)"/>
  <rect x="40" y="355" width="640" height="120" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="377" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">Block order</text>
  <line x1="55" y1="385" x2="665" y2="385" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="408" font-family="monospace" font-size="10" font-weight="bold">1.</text>
  <text x="80" y="408" font-family="monospace" font-size="10">Alice</text>
  <text x="170" y="408" font-family="monospace" font-size="10" fill="#565653">5,000 µL/CU</text>
  <text x="320" y="408" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">→ included first, fast confirmation</text>
  <text x="60" y="428" font-family="monospace" font-size="10" font-weight="bold">2.</text>
  <text x="80" y="428" font-family="monospace" font-size="10">Bob</text>
  <text x="170" y="428" font-family="monospace" font-size="10" fill="#565653">100 µL/CU</text>
  <text x="320" y="428" font-family="monospace" font-size="10" fill="#565653">→ included if block has room</text>
  <text x="60" y="448" font-family="monospace" font-size="10" font-weight="bold">3.</text>
  <text x="80" y="448" font-family="monospace" font-size="10">Carol</text>
  <text x="170" y="448" font-family="monospace" font-size="10" fill="#565653">0 µL/CU</text>
  <text x="320" y="448" font-family="monospace" font-size="10" fill="#565653">→ included only if nothing else is waiting</text>
  <text x="360" y="468" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">Carol still pays the base fee. She just doesn't get prioritized.</text>
  <text x="360" y="500" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">When the network is quiet, even 0 µL/CU lands quickly. When it's congested, the fee market wakes up.</text>
</svg>

A major congestion event in September 2021 forced the network to fix this. Before priority fees existed, the leader had no way to tell transactions apart — every one was treated equally. When the network got flooded with low-value bot traffic, important transactions had no way to bid for inclusion ahead of the noise. Adding the priority fee market gave users a tool to express urgency and gave validators a signal for which transactions to favor. It is now the central mechanism the network uses to stay responsive during congestion.

## What this means when you write code

When you build a transaction client-side, you add two compute-budget instructions at the start: one to set the CU limit, one to set the CU price. The limit comes from simulating your transaction and adding a safety margin. The price comes from looking at what the network is currently paying for prompt inclusion, which you fetch from your RPC provider or estimate from recent blocks.

When you write a program, you make its CU consumption a number you care about. Cheap programs cost less in priority fees per execution, which matters when users run them millions of times. The cost of a single arithmetic operation is a few CU. The cost of a hash is a few thousand. The cost of a cross-program call is in the tens of thousands. Allocating an account is more. These numbers add up, and the difference between a tight program and a loose one shows up in user fees.

When you simulate a transaction before sending it, the simulator returns the actual CU consumption alongside the result. Use that number rather than a guess. Programs change as you develop them, and a margin that was right last month may be wrong this month.
