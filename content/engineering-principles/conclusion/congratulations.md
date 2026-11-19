---
id: 1175492070
title: Congratulations
type: lecture
order: 1
faq:
  - question: Which principles does this course teach?
    answer: >-
      Tradeoffs weighed against a parent goal, constraint bypass, the Irrelevance Principle,
      Core and Periphery, the singleton, atomicity, standardization, stateless design, the
      goal hierarchy, and the rational adversary.
  - question: Do I need blockchain knowledge to use any of this?
    answer: >-
      No. Every principle is domain-neutral, drawn from databases, networks, and operating
      systems. The blockchain sections are marked optional throughout.
---

The lessons took the principles one at a time, but a real system uses several of them in one feature. Take a single request to a public web API. Every part of it appeared in this course.

* TCP delivers the bytes reliably and in order and never reads them, which is the **[Irrelevance Principle](/courses/engineering-principles/relevance-and-genericity/the-irrelevance-principle)**.
* A few heavily reviewed certificate authorities vouch that the site is who it claims to be, which is the **[singleton](/courses/engineering-principles/singleton-and-factory/the-singleton-pattern)**.
* The HTTP request carries everything the server needs to answer it, so any copy of the service can take it, which is **[stateless design](/courses/engineering-principles/stateless-design/what-makes-a-system-stateless)**.
* The response comes back as JSON, because an outside developer who can open it and read it is unstuck in minutes, which is a **[tradeoff decided by the parent goal](/courses/engineering-principles/design-tradeoffs/what-engineering-is-and-is-not)**.

Each of the four is there because it answered a particular constraint, and each has a price that its lesson names. A compromised certificate authority exposes a large slice of the web, and a stateless server has to verify what the caller brings.

## What to do with it

Pick a system you work on and read it the same way. Find [the smallest part that touches the valuable data](/courses/engineering-principles/core-periphery/the-core-periphery-pattern), then the one shared component everything else depends on, then what each component remembers between calls. Finally, take one operation the system exposes and ask [what an informed, self-interested caller would do with it](/courses/engineering-principles/adversarial-thinking/thinking-as-a-rational-adversary).

In your own designs, write down the constraint first. A principle applied only because you learned it adds complexity. A singleton that gets no more review than the fifty copies it replaced is a single point of failure.
