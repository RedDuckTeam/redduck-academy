---
id: 1078617174
title: Thinking as a rational adversary
type: lecture
order: 1
faq:
  - question: My checkout sends the price in the request and every test passes. What is wrong?
    answer: >-
      The caller controls the request. A rational adversary edits the price field before it
      leaves the browser and buys a thousand-dollar item for one cent. Normal tests pass
      because normal clients send back the price that was displayed.
  - question: Should I validate the submitted price or remove it from the request?
    answer: >-
      Remove it. A guard can be bypassed or forgotten. When the server looks the price up from
      the product the customer chose, no client-supplied price is left to attack.
  - question: Most of my users are honest. Why design for an attacker?
    answer: >-
      One self-interested caller is enough, and the honest majority never reveals the flaw.
  - question: My image URLs are built from a numeric id. Is that a problem?
    answer: >-
      A caller can change the number and read images belonging to other people. Either check
      ownership on every fetch, or design so the caller never names the object directly.
  - question: When do I run an adversarial review?
    answer: >-
      While you design each operation, before it is built.
---

> Assume that at least one person using your system is calm, fully informed, and looking for a way to take value they are not owed. Design as though they are already there. Every operation you expose is something they can call, and the question that decides whether the system is safe is what they can do with it. Ask that question while you design, and a whole class of attack never gets built.

## Assume a rational adversary is already inside

Assume at least one actor in the system is both rational and adversarial. They are calm and self-interested. They have complete knowledge of how the system works, every operation, every field, every check. And they will follow any path through the system that benefits them at the expense of other users or the operator. You have met a lighter version of this already, in [the **common-sense check**](/courses/engineering-principles/design-tradeoffs/the-common-sense-check), where you retell a plan as a story with at least one self-interested person in it. Here that person becomes a permanent fixture in every design you make.

## The question to ask of every operation

For every operation you expose, take the adversary's point of view and ask one question. If I am trying to extract value I should not have, and this operation is available to me, what do I do with it? Work out the best move an informed, self-interested caller has. If the answer is anything other than "nothing useful", you have found a vulnerability. The operation does not need to look dangerous. It only needs to hand the adversary a move worth making.

## An operation that passed every test and still failed

Consider an online checkout. When the customer presses buy, their browser sends a request to the server describing the purchase, and one field in that request is the price of the item. It got there for an ordinary reason. The product page already displayed the correct price, and the developers reused the same data structure for the purchase request, so the price traveled along inside it. Every normal test passes. A normal client shows the customer the real price and sends that same price back. Nothing looks wrong.

Now take the adversary's point of view. The request is only data, and the caller controls it. A rational adversary edits the price field before the request leaves the browser and buys a thousand-dollar item for one cent. Nothing stops them, because the server treated the client's price as the truth. The operation passed every normal test, because normal clients send the displayed price. It failed the adversarial test, because the adversary was never going to be a normal client.

## Where the flaw actually lives

It is tempting to file this under a forgotten validation. That naming hides the real flaw. The design handed the client authority over a value the client must never control, the price. Once a value the client controls is trusted as the truth, some caller will set it to whatever serves them.

That distinction changes the fix. One fix adds a server-side check: look up the real price and reject the request when the submitted price does not match. It works, and it patches this attack. A deeper fix removes the price from the request altogether, so the server looks up the price itself from the product the customer chose. The first fix guards the dangerous condition. The second removes it, so there is no client-supplied price left to attack. When you can, remove the condition that made the attack possible instead of guarding it. A guard can be bypassed or forgotten. A condition that no longer exists cannot be attacked at all.

The same root shows up far from a checkout. A photo app builds each image's web address from a numeric id and trusts that a caller only opens addresses it was handed. A rational adversary changes the number and reads images that belong to other people. Once again a value the caller controls, the id of the thing to fetch, was trusted as the truth. The two fixes are the same: guard the id with an ownership check, or design so the caller never names the object directly.

## Run the operation as the attacker

Adversarial review is a question you ask of each operation while you design it, before the operation exists, rather than an audit you run once the system is live. When you add an operation, take the adversary's point of view first and ask what an informed, self-interested caller does with it. If the best move is nothing useful, build it. If the best move takes value from someone else, you are looking at the flaw while it is still a single design decision to change, long before it becomes a live system to patch.

## Blockchain application

Skip this section if you only want the principle. A signing proxy once let any caller pass in a target address and the call data to send to it, both chosen freely. From the adversary's point of view the move is immediate. Call the proxy with a token contract as the target and an instruction to transfer a victim's tokens as the data. Victims had already approved the proxy to move their tokens for ordinary use, and those standing approvals did the rest. Every normal test passed, because normal callers pointed the proxy at harmless targets, and the adversarial test did not exist yet. The fix was a core and periphery split, the small trusted core from [the **core and periphery** pattern](/courses/engineering-principles/core-periphery/the-core-periphery-pattern). It took away the caller's ability to aim the trusted component at an arbitrary target, and so eliminated the condition instead of guarding it. [The clear signing module](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack) reconstructs this attack in full.
