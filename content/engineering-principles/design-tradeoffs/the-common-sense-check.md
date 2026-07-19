---
id: 1939165372
title: The common-sense check
type: lecture
order: 2
faq:
  - question: What does "adversarial" mean in this check?
    answer: It means assuming at least one person in the system understands the rules
      exactly and acts in their own interest even when it costs you. The point is to
      test whether the design survives a single clever, self-interested person, so
      you imagine that person and follow what they would do.
  - question: Does passing the check mean the design is secure?
    answer: No. The check is a first filter that catches the mistakes a
      self-interested person would find in the first minute. A design can pass it and
      still have deeper flaws, so passing means you have cleared the obvious failures
      and nothing more.
  - question: The plan works as long as everyone is honest. Isn't that enough?
    answer: Only if you can guarantee everyone is honest, and in a system open to
      outside users you cannot. A design that depends on everyone behaving well fails
      the first time one person does not, so the safe assumption is that at least one
      actor will act against you.
---

> Here is a check that catches a whole class of design mistakes before you write a line of code. Call it the **common-sense check**. Take the design you are about to build and ask one question: does it still make sense if one of the people in the system is clever and acting in their own interest? If a self-interested person could walk straight through it, the design is broken, however clean it looked on paper. The check costs a few seconds and saves you from building the wrong thing.

## Assume one actor is rational and adversarial

Most design mistakes look reasonable in the abstract and fall apart the moment a real, self-interested person meets them. So before you build, put such a person inside the system and watch what they do. Assume at least one actor is rational and adversarial: they understand the rules exactly, and they will do whatever helps themselves even when it costs you. A design that only holds up while everyone is honest and careful is a design that breaks the first time someone is not.

## When the thing being checked writes its own rules

Imagine a currency exchange that accepts only dollars and euros. Before taking your money, the clerk checks it against a list of accepted currencies. The flaw is who holds the list. You do. You walk in with a currency you invented this morning and a list that happens to include it. The clerk sees it on the list and takes it. Absurd on sight. Nobody lets the customer supply the list of what counts as real money.

The shape underneath that scene is the one to remember: the thing being checked is also allowed to supply the rules of the check. Told as a scene with a self-interested customer in it, the absurdity is impossible to miss. Buried in a system design, the same shape slips straight through.

## The same shape in a real system

Here is that exact shape in software. A web API needs to decide what each user is allowed to do, so it reads a field called `role` from the request and treats an admin role as permission to do anything. The problem is where the `role` field comes from. The client sends it, in the body of its own request. Any client can put `"role": "admin"` in the request it sends.

Run the check. A rational, adversarial user reads the rules, sees that the server believes whatever `role` the request claims, and simply claims to be an admin. It is the currency list again. The user is the thing being checked, and the user also supplies the rule that decides the check, their own role. A building where visitors write their own access badges is not a secured building.

## A different move: paying out before you have checked

Not every failure is about supplying the rules. Some are about timing. An online store wants returns to feel fast, so it issues the refund the moment the courier scans the return label, before the returned package has arrived and been inspected. Run the check. A rational, adversarial customer prints a return label, has it scanned, ships an empty box, and keeps both the product and the refund. The store paid before it checked what came back. No shop hands your money back before opening the box you returned, and the design fails the moment one self-interested person meets it.

## How far the check goes

Passing this check does not prove a design is safe. Plenty of designs survive the question and still hide deeper flaws. What the check gives you is cheap and worth doing every time: it catches the errors a self-interested person would find in the first minute. When you run it and the answer comes out no, that is the signal to stop and redesign before anything is built on top of the mistake.

## Put an adversary in the room before you build

Before you commit to any design that touches money, access, or anything worth taking, pause and put one rational, adversarial person inside it. Give them the full rules and a reason to cheat, and follow what they do. If they walk straight through, you have found the part to fix while fixing it still costs one question. This single habit catches more design errors than any amount of careful checking after the system is built.

## Blockchain application

Skip this section if you only want the principle. The check matters most where a design handles assets and cannot be changed after it goes live, which is the situation of a smart contract on a public blockchain. A contract that accepts a caller-supplied list of "trusted" token addresses is the `role` field mistake in another domain. The caller is handed the power to define the very thing the contract trusts, so a self-interested caller supplies a list that serves themselves. The same one-question check catches it before deployment, when catching it is still free. [The clear signing module](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack) applies this check to a real vulnerability of this kind.
