---
id: 1064107034
title: Why these principles matter
type: lecture
order: 2
faq:
  - question: What kind of failure comes from ignoring a design principle?
    answer: >-
      The expensive kind. Code that trusts a value the user controls becomes the security
      hole someone walks through. A component that remembers state it never needed becomes
      what an attacker corrupts. A convenience bolted onto the part holding the assets becomes
      the reason a small change leaks them.
  - question: These examples are not from my stack. Will they still help me?
    answer: >-
      Yes. A principle describes why a design is good rather than how one tool works, so it
      outlives the framework you build on today.
  - question: I already agree with all of this. Is that enough?
    answer: >-
      No. Using one, once, on a real design is where it starts to pay.
---

Each of the three design mistakes below has its own lesson in this course. In each of them no algorithm is broken and no library is misused, but the design ignores a principle that has a name and a well-known reason.

- A design that trusts a value the user controls becomes the security hole someone walks through. See [The common-sense check](/courses/engineering-principles/design-tradeoffs/the-common-sense-check) and [Thinking as a rational adversary](/courses/engineering-principles/adversarial-thinking/thinking-as-a-rational-adversary).
- A component that remembers state it never needed becomes the thing an attacker corrupts. See [What makes a system stateless](/courses/engineering-principles/stateless-design/what-makes-a-system-stateless).
- A convenience bolted onto the part that holds the assets becomes the reason a small change leaks them. See [The core and periphery pattern](/courses/engineering-principles/core-periphery/the-core-periphery-pattern).
