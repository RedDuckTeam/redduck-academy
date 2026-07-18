---
id: 270
title: Break the system as an adversary
type: review_task
order: 2
---

Adversarial thinking means reasoning from the point of view of someone who wants to take value they are not owed, and doing it as a normal step in design rather than a separate audit. Assume one caller is rational, fully informed, and looking for a way through, and ask what they can do with each operation you expose.

This task gives you a service that behaves correctly under normal use and shows no obvious flaw. Your job is to find a way to take value from it using only its public interface, as a rational adversary would, and to prove the attack with a working test.

Clone the template repository, open the `05-adversarial` folder, and complete the exploit test under `tests/` in your chosen language. In `SOLUTION.md`, describe the attack you found, explain why it works in terms of the system's design rather than one missing check, and say whether your fix would patch the attack or remove the condition that made it possible. Push your work to your own fork and submit the repository URL.
