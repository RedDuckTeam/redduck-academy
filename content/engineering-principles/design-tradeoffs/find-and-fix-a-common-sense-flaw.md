---
id: 266
title: Find and fix a common-sense flaw
type: review_task
order: 5
---

The common-sense check is a fast test for design mistakes. Retell a design as a short story with one rational, self-interested person in it, and see whether it still holds up. Most bad designs look fine in the abstract and turn absurd the moment a real person tries to take advantage of them.

This task gives you a small order service with one flaw of exactly that kind. It works for an honest user and falls apart for a self-interested one. Your job is to find the flaw by running the common-sense check, then fix it.

Clone the template repository, open the `01-common-sense-check` folder, and complete the starter in the language you choose. Then fill in `SOLUTION.md`: describe the attack as a concrete sequence of steps, explain your fix, and say whether you patched the attack or removed the condition that made it possible. Push your work to your own fork and submit the repository URL.

You are graded on your explanation of the attack as much as on the code.
