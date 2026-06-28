# Your First Solana Program

_type: review_task_

Time to write your first Solana program. The Donor Tiers Vault is small and the logic is straightforward: a donation comes in, a record gets written, a tier comes out. Nothing about the program itself should be a brain-teaser. If you've read through the lectures, you already know the shape of what needs to happen.

The real point of this milestone is everything around the code. You'll install the Anchor CLI, set up the Rust toolchain, get bankrun running for tests, and figure out how an Anchor workspace fits together. The hard part of your first Solana program is getting the environment running.

Once the toolchain is solid, focus on the development flow. Edit the program, run the tests, read the error output, iterate. Get comfortable with how account constraints surface as runtime errors, how the IDL regenerates after every build. By the time you ship this milestone, you should be able to make a small change and see the effect in tests within seconds. That muscle memory is what every later task will assume you have.

---

## Review grading tasks

1. the singleton vault account exists and tracks a unique donor count
2. per-donor state tracks a cumulative total and a donation count
3. per-donation account stores amount, timestamp, message with 200-byte cap
4. Tier enum variant order is None, Bronze, Silver, Gold, Platinum
5. initialize creates the vault PDA at the correct seeds with the right space
6. donate creates the donor_record lazily and the donation freshly
7. donate transfers exactly amount lamports from donor to vault
8. donate writes the new Donation account with amount, Clock timestamp, and message
9. donate increments the unique donor count exactly once per distinct donor
10. donate uses checked arithmetic on cumulative total, donation count, and unique donor count
11. tier_of returns the correct Tier across all boundary lamport values
