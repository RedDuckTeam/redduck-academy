---
id: 1498926163
title: Account-generic design
type: lecture
order: 2
faq:
  - question: What does an account-generic system store for each user?
    answer: >-
      Nothing. Everything it needs arrives with the request, and nothing about the caller
      survives it.
  - question: Is account-generic always the better choice?
    answer: >-
      No. A bank ledger is account-specific because tracking each customer's balance over
      years is the point of it. The only thing that decides is whether the job requires
      remembering users.
  - question: What does dropping per-user state protect against?
    answer: >-
      The attacks that work by corrupting the stored mapping. Inflating a balance. Slipping
      past a check by pointing it at another user's record. A currency conversion service
      holds no per-user state to begin with, so that whole class of attack has nothing to aim
      at.
  - question: Do I have to register before calling one?
    answer: >-
      No. There is no account to create and no setup, so a new caller gets a correct answer
      on the first request.
  - question: How is this different from stateless design?
    answer: >-
      Stateless keeps nothing at all between calls. Account-generic drops the per-user record
      in particular.
---

> Apply the Irrelevance Principle to one property, the identity of the user, and a whole class of systems falls out. A system that does not care who is asking has no reason to remember anyone. Systems built this way, called account-generic, turn out to be both safer and easier to build on than systems that keep a record of every user. The one question worth asking is whether the job even requires remembering users at all.

## Two services, one that remembers you and one that does not

Start with the difference stated plainly. An **account-generic** system holds no mapping from a user's identity to that user's stored state. Everything it needs to answer a request arrives with the request, and once the request is done, nothing about that particular caller is kept.

A currency conversion service is a clean example. You send an amount and two currency codes, and it sends back the converted amount. It keeps no record of who asked. The next caller could be anyone, and they get an answer computed exactly the same way. The service has no idea who you are, and it does not need one, because your identity has no effect on what one hundred dollars is in euros. This is the [**Irrelevance Principle**](/courses/engineering-principles/relevance-and-genericity/the-irrelevance-principle) applied to identity. Who is asking is irrelevant to the conversion, so the design does not track it.

Now the opposite, done correctly. A bank's ledger is account-specific on purpose. The bank has to know how much each customer holds, and it has to keep knowing across every deposit and withdrawal, for years. Tracking each customer's balance over time is the entire point of the service, so the customer's identity sits right at the core. A ledger that forgot who owned what would be broken, because the record of who owns what is the ledger itself.

<svg role="img" viewBox="0 0 720 312" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>What an account-generic service and an account-specific service store between calls</title><desc>Two boxes side by side. The currency conversion service on the left is account-generic. It takes an amount and two codes, returns the converted amount, and stores nothing per user. The bank ledger on the right is account-specific. It takes a deposit or withdrawal, returns a new balance, and stores a balance for each named customer.</desc>
  <text x="360" y="28" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">What each system stores between calls</text>

  <rect x="40" y="50" width="300" height="212" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="40" y="50" width="300" height="30" fill="#ed4937"/>
  <text x="190" y="70" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Currency conversion service</text>
  <text x="58" y="102" font-family="monospace" font-size="9" fill="#565653" font-style="italic">account-generic</text>
  <text x="58" y="128" font-family="monospace" font-size="10" fill="#000000">in:  amount + two codes</text>
  <text x="58" y="148" font-family="monospace" font-size="10" fill="#000000">out: the converted amount</text>
  <line x1="58" y1="166" x2="322" y2="166" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="58" y="190" font-family="monospace" font-size="10" fill="#565653">stored per user:</text>
  <text x="190" y="228" text-anchor="middle" font-family="monospace" font-size="13" fill="#000000" font-weight="bold">nothing kept</text>

  <rect x="380" y="50" width="300" height="212" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="380" y="50" width="300" height="30" fill="#565653"/>
  <text x="530" y="70" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Bank ledger</text>
  <text x="398" y="102" font-family="monospace" font-size="9" fill="#565653" font-style="italic">account-specific</text>
  <text x="398" y="128" font-family="monospace" font-size="10" fill="#000000">in:  a deposit or withdrawal</text>
  <text x="398" y="148" font-family="monospace" font-size="10" fill="#000000">out: the new balance</text>
  <line x1="398" y1="166" x2="662" y2="166" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="398" y="190" font-family="monospace" font-size="10" fill="#565653">stored per user:</text>
  <text x="398" y="212" font-family="monospace" font-size="10" fill="#000000">alice</text>
  <text x="662" y="212" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">1,240.00</text>
  <text x="398" y="230" font-family="monospace" font-size="10" fill="#000000">bob</text>
  <text x="662" y="230" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">305.50</text>
  <text x="398" y="248" font-family="monospace" font-size="10" fill="#000000">carol</text>
  <text x="662" y="248" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">8,900.00</text>

  <text x="360" y="292" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">The account-generic service has no per-user store, so there is nothing to corrupt and no one to register.</text>
</svg>

## Why storing no user gives an attacker less to grab

When a system keeps state for each user, that stored state becomes a target. A large share of attacks on account-specific systems come down to corrupting the mapping. Inflating a stored balance. Slipping through a check by pointing it at some other user's record. The state is what gets attacked, because the state is what decides the outcome.

An account-generic system has none of that. There is no per-user state sitting in storage, so there is no per-user state to tamper with. The whole class of attack that targets the stored mapping has nothing to aim at. You remove the reason the user records exist in the first place. With no records to hold, there is nothing to defend and nothing to corrupt.

## Why any caller can walk up and use it

An account-generic service does not need to know in advance who will call it. There is no account to create first, no registration, no setup. A new caller sends a well-formed request and gets a correct answer on the first try, the same as every existing caller. Anything that wants to build on top can do so without asking permission or being known ahead of time.

Of all the things a system could hold on to between calls, the per-user record is often the one it can safely drop. A service that never needs to know who is asking has no reason to remember anyone.

## Check what you store per user

You can classify a system with one question. For each user, what does it keep between calls? If the honest answer is nothing, and the results are still correct, the system is account-generic and should stay that way. If the answer is a balance, a history, or a claim that has to survive from one call to the next, the system is account-specific. That is correct, because remembering the user is the job.

The design question is never which style is better in the abstract. The only thing that decides is whether the purpose requires remembering users. When it does not, do not remember them. Every stored record you can avoid is one an attacker cannot reach, and one less thing standing between a new caller and their first use.

## Blockchain application

Skip this section if you only want the principle.

Some on-chain proxies are account-generic. Every call carries a complete, self-contained assertion. For example, after this transaction a given address must hold at least a certain amount of a certain token. Nothing is stored between one call and the next. Because the proxy remembers no users and grants no one standing rights, anyone can call it, which is what makes it permissionless. ERC-4626 vaults sit at the other end, and correctly so. A vault has to track each depositor's claim over time, so it is account-specific by necessity, the same way a bank ledger is.
