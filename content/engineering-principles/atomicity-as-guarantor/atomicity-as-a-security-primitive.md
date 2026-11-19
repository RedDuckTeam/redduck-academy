---
id: 1351165424
title: Atomicity as a security primitive
type: lecture
order: 1
faq:
  - question: Does atomicity mean the operation is fast?
    answer: >-
      No. All or nothing, however long it takes. Atomicity is the A in ACID.
  - question: What happens to the money if the machine dies between the two writes?
    answer: >-
      Account A has lost its 100 dollars and account B has not gained them, so the records are
      short by 100 with nobody having stolen anything. A database transaction makes that state
      impossible, rolling back to exactly where the system stood before it began.
  - question: What does an all-or-nothing guarantee have to do with security?
    answer: >-
      It removes the exposed moment in a trade. One party normally has to move first and carry
      the risk, which is the whole reason escrow agents exist. Inside one atomic unit, nobody
      moves first.
  - question: How can a flash loan lend a large sum with no collateral?
    answer: >-
      The loan and its repayment sit inside the same transaction. If the funds are not back by
      the end of it, the whole transaction reverts and the loan never happened. Aave made this
      a general-purpose primitive in 2020, and Uniswap v2 shipped the equivalent as flash
      swaps.
  - question: Why do escrow agents and deposits still exist?
    answer: >-
      Most exchanges cannot be made into a single all-or-nothing step. When one side acts on a
      system the other side does not control, there is no shared unit to wrap both actions in.
---

> Move money between two accounts and you do it in two steps: subtract from one, add to the other. If the system dies in the gap between them, the money has left one account and reached nowhere. Databases fixed this with a guarantee that the two steps form one unit, completing fully or leaving no trace. That same guarantee can replace trust between strangers.

## Two steps treated as one unit

Picture a bank moving 100 dollars from account A to account B. The computer does two things in order. First it lowers A's balance by 100, then it raises B's balance by 100. In between those two writes there is an instant where A has already lost the money and B has not yet gained it.

A machine can lose power, a process can be killed, or a network link can drop at any moment, including that instant. If the system stops there, 100 dollars has disappeared from the records, although no one stole it. Any time an operation is really several steps, some failure in the middle can leave the system in a state its authors never intended.

A database transaction wraps several operations so the system treats them as a single indivisible action. Both writes land, or neither does. If anything fails partway, the database rolls back to the state before the transaction began, as if it had never started. This all-or-nothing property is called **atomicity**. It is the A in ACID, the set of guarantees relational databases have offered for decades.

<svg role="img" viewBox="0 0 720 305" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Two separated steps versus one atomic unit</title><desc>Two boxes side by side. The left box runs a transfer as two separate steps: subtract from A, then a gap where power can be lost, then add to B, which is skipped, leaving 100 vanished. The right box runs both writes as one atomic unit, so both writes land or neither does and no half-done state can exist.</desc>
  <text x="360" y="32" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Where can the money vanish?</text>

  <rect x="40" y="60" width="300" height="200" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="60" width="300" height="30" fill="#565653" stroke="#000000" stroke-width="2"/>
  <text x="190" y="80" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Two separate steps</text>
  <text x="190" y="120" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">step 1:  A -= 100</text>
  <line x1="60" y1="140" x2="320" y2="140" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="190" y="164" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653" font-style="italic">power lost in this gap</text>
  <line x1="60" y1="184" x2="320" y2="184" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="190" y="210" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">step 2:  B += 100  (skipped)</text>
  <text x="190" y="240" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">result: 100 has vanished</text>

  <rect x="380" y="60" width="300" height="200" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="60" width="300" height="30" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="80" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">One atomic unit</text>
  <text x="530" y="122" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">{ A -= 100</text>
  <text x="530" y="146" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">  B += 100 }</text>
  <line x1="400" y1="172" x2="660" y2="172" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="530" y="198" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">both writes land, or neither</text>
  <text x="530" y="226" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">no half-done state exists</text>

  <text x="360" y="292" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Two separated steps allow a half-finished state, one atomic unit makes it impossible.</text>
</svg>

## Where the guarantee replaces a middleman

Take two strangers who want to trade, one holding goods and the other holding payment. Normally one of them has to move first, and whoever moves first is exposed. Send the goods and the buyer might never pay. Send the payment and the seller might never ship. The standard fix is an escrow agent, a trusted third party who holds one side's value until the other side delivers, then releases it. The escrow agent exists to cover the risk that one step happens and the other does not.

Now suppose a single platform holds both the goods and the payment and can move them as one atomic unit. The handover of goods to the buyer and the handover of payment to the seller become a single action that completes for both sides or for neither. Nobody moves first, so the exposed moment is gone. It was the gap between two separated steps, and the steps are no longer separated.

In the terms of [**constraint bypass**](/courses/engineering-principles/constraint-bypass/bypassing-a-constraint), the rule "someone must move first" was a property of trading in two separate steps, and it stops applying when there is one step.

## Trusting the platform instead of the person

When the platform guarantees all-or-nothing execution, a designer can swap "trust the counterparty" for "trust the platform". The strangers stop relying on each other's honesty and rely on the execution guarantee, one thing they can inspect and reason about, identical for every trade.

Deposits and escrow agents are both ways to manage the risk that an operation completes only partway. A deposit covers the loss if the other side stops halfway through. An escrow agent stands in so neither side has to move first. Where partial completion is impossible by construction, neither is needed. That is why atomicity earns the label of a security primitive, beyond its role in keeping data correct. It removes the condition the risk depended on.

The guarantee covers that one risk and no other. It does not decide who is allowed to start the operation, and it does not check that the goods are the ones the buyer was promised. The price is that the trust that was spread across counterparties now rests on the platform, which makes the platform a [singleton](/courses/engineering-principles/singleton-and-factory/the-singleton-pattern), a single component where a bug reaches every trade at once.

## Check whether both actions fit in one unit

When you design an exchange between parties who do not trust each other, look first for whether both sides' actions can sit inside one all-or-nothing unit. If they can, the deposits and the go-first rules are no longer needed, because they existed only to survive a partial failure. If they cannot, the actions live on systems that cannot be joined into one unit, and the trust you were trying to remove is the trust you will keep paying for.

## Blockchain application

Ethereum transactions are atomic in the sense above. Every operation inside one transaction succeeds together, or the whole transaction reverts to its starting state. DeFi built a lending primitive directly on that guarantee, the flash loan. A contract lends a large sum with no collateral, because the loan and its repayment are placed inside the same transaction. If the borrower has not returned the funds by the end of that transaction, the entire transaction reverts, and the loan is erased along with everything the borrower did with the money. The lender checks no identity and holds no deposit. It relies on the all-or-nothing guarantee, so a loan that goes unrepaid within the same transaction never happened. Aave turned this into a general-purpose primitive in 2020, and Uniswap v2 released the equivalent as flash swaps.

The guarantee protects only the lender. With a flash loan, an attacker who wants to distort the price in an exchange pool that another protocol reads needs no capital of their own, only gas and the loan fee. [Flash loans](/courses/development-on-ethereum/oracles/flash-loans) walks through that attack.
