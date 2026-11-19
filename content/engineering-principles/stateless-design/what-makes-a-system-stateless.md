---
id: 1386841327
title: What makes a system stateless
type: lecture
order: 1
faq:
  - question: If a component is stateless, where does the state go?
    answer: >-
      Wherever it belongs, a ledger or a database behind it. Statelessness is a property of
      one component. The components in front of it hold nothing and pass every value through
      with each call.
  - question: How is statelessness a security property?
    answer: >-
      A session-fixation attack works only because the server keeps a session record between
      requests. The attacker plants a session identifier, waits for the victim to log in
      under it, then rides the same record. With no server-side session there is nothing to
      plant and nothing to ride.
  - question: What do I get by making a component stateless?
    answer: >-
      Any copy answers any request. Scale by adding copies, and a crash loses nothing.
  - question: Should everything be stateless?
    answer: >-
      No. A running game server has to remember where each player is between messages. One
      that forgot every position would be unplayable.
---

> A stateless component keeps nothing between calls. Every call arrives carrying everything the component needs to answer it, and the moment the call returns, the component forgets it. Any state a component holds is state an attacker can reach and two users can collide over. The price of holding none is that the caller now brings what the component would have kept, so the component has to be able to verify whatever decides what the caller may do.

## Nothing inside a stateless component changes between calls

A component is stateful when something inside it changes as a result of handling a call, and later calls can see the change. A component is **stateless** when nothing inside it changes. Every value it needs arrives with the call itself: the identity of the caller, the amount, the limits that apply. The component reads those values, does its work, returns an answer, and keeps none of them.

## The web already works this way

HTTP is designed as a stateless protocol. Each request carries everything the server needs to answer it: the address, the method, the headers, the body. The server does not have to remember the previous request to make sense of this one. Web architectures build on that and gain three properties from it. Any copy of the service can answer any request, because no copy holds anything the others lack. The service scales by running more copies, since a new copy is immediately as capable as the rest. And a crashed copy loses nothing, because there is nothing inside it to lose.

## Every stored thing is a target

[Account-generic design](/courses/engineering-principles/relevance-and-genericity/account-generic-design) argued that the record a system keeps per user is a target, because stored state decides the outcome. The same holds for anything a component keeps between calls. A session-fixation attack works only because the server keeps a session record between requests. The attacker plants a session identifier, waits for the victim to log in under it, then rides the same record the victim is now using. Remove the server-side session and the attack has nothing to grab.

## Calls from different users cannot interfere

A stateless component can serve many independent users at the same time, because no call leaves a trace that another call could read or change. For the same reason, a stateless singleton, the single shared component from [the **singleton** pattern](/courses/engineering-principles/singleton-and-factory/the-singleton-pattern), is safe to hand to everyone at once.

## What the caller brings has to be verifiable

Taking state out of a component does not take it out of the system. It moves to a component that is stateful on purpose, such as a database behind the stateless one, or it travels with the caller. With no session record on the server, the fact that a user is logged in has to arrive with every request, and the caller is the one who sends it.

In [the common-sense check](/courses/engineering-principles/design-tradeoffs/the-common-sense-check) a server believed a `role` field that the client wrote into its own request. A stateless component makes the same mistake if it believes any value that decides what the caller may do, such as an identity, a role, or a limit. Such a value has to arrive in a form the component can check without remembering anything. The party that grants the role can sign it, and then the component checks the signature on every call, as the storage service checks the signature in a pre-signed URL in [signed authorization](/courses/engineering-principles/standardization-patterns/signed-authorization-and-the-permit-pattern). A value the caller is free to choose, such as the amount, needs no proof, only a check against the proven limit.

Taking a permission back also gets harder. A component that keeps nothing cannot remember that a permission was withdrawn, so a signed permission keeps working until it expires. Cancelling it earlier means recording that fact somewhere, and whichever component records it is stateful.

## Write down what each component remembers

Statelessness is not always the right choice. A running game server has to remember where each player is between messages, and one that forgot every position would be unplayable. So for each component you design, write down what it remembers from one call to the next. If that list is empty, you have a stateless component. If the list is not empty, look at each item and ask whether the job needs it. If it does, the component is stateful for a reason, and you protect that state with care. If it does not, move the item out into the call and decide how the component will verify it.

## Blockchain application

In some blockchain systems a core component is written to hold no persistent state at all. Each call carries its own identities, amounts, and limits, and the core keeps nothing once the call returns. With no stored state there is nothing for an attacker to reach, and one deployment can serve every user, since no user's call leaves anything behind for another user's call to find. A router placed in front of such a core can still use state that exists only within a single transaction and vanishes when the transaction ends, which keeps it stateless from one call to the next. Not every part should be stateless. An ERC-4626 vault, a token vault that must track each depositor's balance over time, is correctly stateful, for the same reason as the bank ledger in [account-generic design](/courses/engineering-principles/relevance-and-genericity/account-generic-design). The stateless-core design is described in [the core and its routers](/courses/development-on-ethereum/clear-signing/the-core-and-its-routers).
