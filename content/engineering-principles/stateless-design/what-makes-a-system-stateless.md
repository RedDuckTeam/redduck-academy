---
id: 1386841327
title: What makes a system stateless
type: lecture
order: 1
faq:
  - question: How do I decide whether a component should be stateless?
    answer: Ask whether it needs to remember anything between calls to do its job. If
      it does not, it should hold nothing, because every stored value is something an
      attacker can target and something two users can collide over. If it does, like
      a ledger that must track balances, it is stateful for a reason and you protect
      that state with care.
  - question: Does stateless mean the whole system stores nothing?
    answer: No. It means a particular component holds nothing between calls. The system
      can still keep state where it belongs, such as a ledger or a database, while the
      components in front of it stay stateless and pass every value through with each
      call.
  - question: Why is statelessness a security property and not only a performance one?
    answer: Because every value a component stores is a value an attacker can try to
      reach or change, and a stateless component has none. Attacks like session
      fixation depend on server-side state to aim at, so removing the state removes
      the attack. The scaling and reliability benefits come along with that.
---

> A stateless component keeps nothing between calls. Every call arrives carrying everything the component needs to answer it, and the moment the call returns, the component forgets it. This sounds like a point about efficiency. It is really a point about security and reliability, because any state a component holds is state an attacker can reach and two users can collide over.

## What holds no state actually means

A component is stateful when something inside it changes as a result of handling a call, and later calls can see the change. A component is **stateless** when nothing inside it changes. Every value it needs, the identity of the caller, the amount, the limits that apply, arrives with the call itself. The component reads those values, does its work, returns an answer, and keeps none of them. The next call starts from the same blank slate as the one before it. Nothing the component stored is different because it handled your request.

## The web already works this way

HTTP is designed as a stateless protocol. Each request carries everything the server needs to answer it, the address, the method, the headers, the body. The server does not have to remember the previous request to make sense of this one. Web architectures build on that and gain three properties from it. Any copy of the service can answer any request, because no copy holds anything the others lack. The service scales by running more copies, since a new copy is immediately as capable as the rest. And a crashed copy loses nothing, because there is nothing inside it to lose. Start a fresh copy and the next request is served as if nothing had happened.

## Every stored thing is a target

Every piece of state a component holds is a piece an attacker can try to manipulate. A stateless component removes that whole category of target by construction. There is no session record to hijack, no stored balance to inflate, no cached permission to poison. Take one concrete case. A session-fixation attack works only because the server keeps a session record between requests. The attacker plants a session identifier, waits for the victim to log in under it, then rides the same record the victim is now using. Remove the server-side session and the attack has nothing to grab. The whole category exists because there is state on the server to aim at.

## One component, many users, no interference

A stateless component can serve many independent users at the same time without interference, because no call leaves a trace that another call could read or change. Two users' requests can run side by side and never touch, since neither one writes anything the other one reads. This is the same reason a stateless singleton, the single shared component from [the **singleton** pattern](/courses/engineering-principles/singleton-and-factory/the-singleton-pattern), is safe to hand to everyone at once. One copy, reviewed once, used by all, and no user's call disturbs another's. A component that keeps no per-user state, the [**account-generic**](/courses/engineering-principles/relevance-and-genericity/account-generic-design) design, is stateless in exactly this way.

## When a component should remember

Statelessness is not always the right choice. A running game server has to be stateful. It has to remember where each player is between messages, and one that forgot every position would be unplayable. So the aim is never to make everything stateless. The aim is to ask one question of each component: does this component need to remember anything between calls to do its job? If it does, it is stateful for a reason, and you protect that state with care. If it does not, it should hold none, because every value it keeps is attack surface and shared-use risk it never needed to take on.

## Decide what each component remembers

For each component you design, write down what it remembers from one call to the next. If that list is empty, you have a stateless component, and it scales, survives the loss of any copy, and stays safe under sharing without extra work. If the list is not empty, look at each item and ask whether the job truly needs it. Every value you can push back out into the call itself is a value you no longer have to defend, and one fewer thing two users can collide over.

## Blockchain application

Skip this section if you only want the principle. In some blockchain systems a core component is written to hold no persistent state at all. Each call carries its own identities, amounts, and limits, and the core keeps nothing once the call returns. That single property is both its security argument, there is no stored state for an attacker to reach, and the reason one deployment can serve every user, since no user's call leaves anything behind for another user's call to find. A router placed in front of such a core can still use state that exists only within a single transaction and vanishes when the transaction ends, which keeps the component stateless from one call to the next. Not every part should be stateless. An ERC-4626 vault, a token vault that must track each depositor's balance over time, is correctly stateful, because that record is the vault's entire purpose. The stateless-core design is examined in depth in the ERC8009 course.
