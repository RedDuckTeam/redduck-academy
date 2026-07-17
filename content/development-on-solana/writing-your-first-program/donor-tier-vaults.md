---
id: 201
title: Your First Solana Program
type: review_task
order: 100
---

Time to write your first Solana program. The Donor Tiers Vault is small and the logic is straightforward: a donation comes in, a record gets written, a tier comes out. Nothing about the program itself should be a brain-teaser. If you've read through the lectures, you already know the shape of what needs to happen.

The real point of this milestone is everything around the code. You'll install the Anchor CLI, set up the Rust toolchain, get bankrun running for tests, and figure out how an Anchor workspace fits together. The hard part of your first Solana program is getting the environment running.

Once the toolchain is solid, focus on the development flow. Edit the program, run the tests, read the error output, iterate. Get comfortable with how account constraints surface as runtime errors, how the IDL regenerates after every build. By the time you finish this milestone, you should be able to make a small change and see the effect in tests within seconds. That muscle memory is what every later task will assume you have.
