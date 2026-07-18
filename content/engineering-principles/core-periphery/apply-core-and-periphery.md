---
id: 268
title: Apply core and periphery
type: review_task
order: 3
---

The core and periphery pattern keeps the smallest possible amount of logic in the position of highest trust. A minimal core holds the valuable state and enforces the rules that guard it. Everything convenient lives in a replaceable periphery that reaches the core only through a narrow interface, with no special powers inside it.

This task gives you a service that mixes the two. The code that holds a secret also offers convenience features on top of it. Your job is to apply the pattern: split the service so the core holds the secret behind a narrow interface, and nothing outside the core can reach it.

Clone the template repository, open the `03-core-periphery` folder, and complete the starter in your chosen language. In `SOLUTION.md`, explain what belonged in the core, what belonged in the periphery, and why your split makes it impossible for anything outside the core to reach the secret rather than merely guarding against it. Push your work to your own fork and submit the repository URL.
