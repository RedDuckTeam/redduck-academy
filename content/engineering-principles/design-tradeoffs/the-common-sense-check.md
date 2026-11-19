---
id: 1939165372
title: The common-sense check
type: lecture
order: 2
faq:
  - question: How do I run the common-sense check?
    answer: >-
      Put one rational, self-interested person inside the design, give them the full rules and
      a reason to cheat, and follow what they do. If they walk straight through, the design is
      broken.
  - question: My API reads a role field from the request body. What is wrong with that?
    answer: >-
      Any client can put "role": "admin" in the request it sends. The thing being checked is
      also supplying the rule that decides the check, the same shape as a currency exchange
      that accepts the list of valid currencies from the customer.
  - question: Does passing the check mean the design is secure?
    answer: >-
      No. It catches only what a self-interested person would find in the first minute.
  - question: Why is refunding as soon as the return label is scanned a problem?
    answer: >-
      The store pays before it sees what came back. A customer prints the label, has it
      scanned, ships an empty box, and keeps both the product and the refund.
---

> The **common-sense check** catches a whole class of design mistakes before you write a line of code. Take the design you are about to build and ask one question: does it still make sense if one of the people in the system is clever and acting in their own interest? If a self-interested person could walk straight through it, the design is broken, however clean it looked on paper.

## Assume one actor is rational and adversarial

Most design mistakes look reasonable in the abstract and fall apart the moment a real, self-interested person meets them, so before you build, put such a person inside the system and watch what they do. Assume at least one actor is rational and adversarial: they understand the rules exactly, and they will do whatever helps themselves even when it costs you.

## When the thing being checked writes its own rules

A web API needs to decide what each user is allowed to do, so it reads a field called `role` from the request and treats an admin role as permission to do anything. The problem is where the `role` field comes from. The client sends it, in the body of its own request. Any client can put `"role": "admin"` in the request it sends.

A rational, adversarial user reads the rules, sees that the server believes whatever `role` the request claims, and claims to be an admin. The user is the thing being checked, and the user also supplies the rule that decides the check, their own role.

Told as an everyday scene, this is a currency exchange where the clerk checks your money against a list of accepted currencies, and you bring the list. You walk in with a currency you invented this morning and a list that happens to include it, and the clerk takes it. Nobody lets the customer supply the list of what counts as real money, but buried in a system design the same mistake slips through.

## Paying out before you have checked

A second kind of failure is about timing. An online store wants returns to feel fast, so it issues the refund the moment the courier scans the return label, before the returned package has arrived and been inspected. A rational, adversarial customer prints a return label, has it scanned, ships an empty box, and keeps both the product and the refund. The store paid before it checked what came back. No shop hands your money back before opening the box you returned.

## Passing the check does not prove a design is safe

Plenty of designs survive the question and still hide deeper flaws. The check only catches the errors a self-interested person would find in the first minute, but it costs one question, so run it before you commit to any design that touches money, access, or anything worth taking. When the answer comes out no, stop and redesign before anything is built on top of the mistake.

## Blockchain application

The check matters most where a design handles assets and cannot be changed after it goes live, which is the situation of a smart contract on a public blockchain. A contract that accepts a caller-supplied list of trusted token addresses repeats the `role` field mistake. The caller defines what the contract trusts, so a self-interested caller supplies a list that serves themselves. The same check catches it before deployment. [The core and its routers](/courses/development-on-ethereum/clear-signing/the-core-and-its-routers) walks through a real vulnerability of this kind, a proxy that held users' token approvals and let any caller choose the target and the calldata of the call it made.
