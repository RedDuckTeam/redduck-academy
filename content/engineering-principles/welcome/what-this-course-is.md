---
id: 1543488442
title: What this course is
type: lecture
order: 1
faq:
  - question: Do I need to know blockchain to take this course?
    answer: >-
      No. Every principle is taught with examples from software, databases, networks,
      operating systems, and everyday physical systems. Some lessons close with an optional
      section headed Blockchain application, and skipping it costs you none of the principle.
  - question: What do I need installed before starting?
    answer: >-
      Nothing.
  - question: Which principles does the course cover?
    answer: >-
      Weighing a tradeoff against the goal it serves. Making a hard constraint irrelevant
      instead of fighting it. Keeping the smallest amount of logic in the position of highest
      trust. Reasoning like an adversary before you build.
  - question: Why learn a principle instead of a rule I can look up?
    answer: >-
      A rule tells you what to do in one situation. A principle is the reason under many
      rules, so it decides the cases no rule anticipated.
---

This course teaches design principles with plain examples from software, databases, networks, operating systems, and everyday physical systems. There is nothing to install, and you need no blockchain background.

## What each module teaches

- **[Design tradeoffs](/courses/engineering-principles/design-tradeoffs/what-engineering-is-and-is-not)**. An option is better only for a goal, so name the goal before you compare options.
- **[Constraint bypass](/courses/engineering-principles/constraint-bypass/bypassing-a-constraint)**. Check whether a constraint belongs to the result you need or only to one way of reaching it.
- **[Relevance and genericity](/courses/engineering-principles/relevance-and-genericity/the-irrelevance-principle)**. Constrain only the properties the result depends on.
- **[Core and periphery](/courses/engineering-principles/core-periphery/the-core-periphery-pattern)**. Keep the valuable state in a small part that rarely changes, and keep the code that changes often away from it.
- **[Singleton and factory](/courses/engineering-principles/singleton-and-factory/the-singleton-pattern)**. Put a critical function in one shared component, so the review effort concentrates on it. Derive the identifier of each created instance from its content, so anyone can check it.
- **[Atomicity as guarantor](/courses/engineering-principles/atomicity-as-guarantor/atomicity-as-a-security-primitive)**. Steps that complete as one unit or leave no trace can replace trust between two parties.
- **[Standardization patterns](/courses/engineering-principles/standardization-patterns/standardizing-the-interface)**. One shared interface replaces a private agreement between every pair of participants.
- **[Stateless design](/courses/engineering-principles/stateless-design/what-makes-a-system-stateless)**. A component that keeps nothing between calls holds nothing an attacker can reach.
- **[Goal hierarchy](/courses/engineering-principles/goal-hierarchy/parent-goals-and-child-goals)**. Trace each design choice up to the goal it serves, and drop it when it stops serving that goal.
- **[Adversarial thinking](/courses/engineering-principles/adversarial-thinking/thinking-as-a-rational-adversary)**. Design as if one user is fully informed and looking for a way to take value they are not owed.

None of this depends on a particular language or platform. Some lessons close with an optional section headed Blockchain application, which shows how the principle appears in a blockchain system. Those sections are there for readers heading into the security-focused courses.
