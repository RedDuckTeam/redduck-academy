---
id: 1266048550
title: Apply core and periphery
type: review_task
order: 2
---

You are given a service where the code that guards a valuable secret also exposes convenience features, and one of those features can be abused to reach the secret. Split it into a minimal core that holds the secret and a replaceable periphery that reaches the core only through a narrow interface. The attack must fail because the vector no longer exists in the core, rather than because a new check blocks it.
