<p align="center">
  <a href="https://redduck.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/redduck-logo-dark.svg">
      <img src="assets/redduck-logo.svg" alt="RedDuck" width="240">
    </picture>
  </a>
</p>

<h1 align="center">RedDuck Academy</h1>

<p align="center">
  An open-source, developer-first blockchain academy.<br />
  Learn to build on Ethereum and Solana by writing and shipping real code.
</p>

<p align="center">
  <a href="https://academy.redduck.io"><b>Live academy</b></a>
  &nbsp;·&nbsp;
  <a href="content/README.md"><b>Contribute a lesson</b></a>
  &nbsp;·&nbsp;
  <a href="https://redduck.io"><b>RedDuck</b></a>
</p>

---

## What this is

RedDuck Academy is a hands-on curriculum for developers who want to *build* on blockchains,
not just read about them. It has three tracks:

- **Blockchain basics** — how blockchains actually work, taught Bitcoin-first and
  comparative, and readable even by non-engineers.
- **Development on Ethereum** — Solidity from first principles through security, proxies,
  token standards, and the patterns behind real DeFi protocols.
- **Development on Solana** — Rust and the Solana account model, up to shipping your own
  on-chain program.

Every track is built around writing code and milestone projects, not slides. The lessons
live in this repo as plain Markdown, and the live site renders them at
**[academy.redduck.io](https://academy.redduck.io)**.

## The lectures are open source

The lecture content in [`content/`](content/) is open to everyone. Spotted a typo, an
unclear explanation, or something out of date? Fix it with a pull request — **no need to run
the app or a database.** You edit a Markdown file, open a PR, and once it's merged the site
rebuilds with your change.

➡️ **[How to contribute a lesson](content/README.md)**

## Why RedDuck built this

[RedDuck](https://redduck.io) is a blockchain development and consulting firm that has been
shipping Web3 products since 2020 — EVM chains, smart contracts, and full-stack apps across
Ethereum, Solana, Cosmos, and more. This academy began as our **internal onboarding
curriculum**: the path we use to bring engineers up to speed on blockchain development, kept
current with the practices we actually rely on in production.

We're opening it up because solid, honest, developer-first blockchain education is still
hard to find, and the best way to keep a curriculum sharp is to let the people learning from
it make it better. It reflects how we work: *we never build what we don't believe in.*

## Running it yourself

The academy is a monorepo — `apps/web` (Cloudflare Workers), `apps/backend` (Heroku),
`apps/admin` (Payload CMS on Vercel), and one PostgreSQL database. To run the full stack
locally or self-host your own copy, see:

➡️ **[docs/self-hosting.md](docs/self-hosting.md)**

Contributing lecture content needs none of this — just the guide above.

## License and disclaimer

This project is provided **as is**, with no warranty of any kind. RedDuck is **not
responsible** for any loss, damage, or breakage arising from using, modifying, forking, or
deploying it. If you change it and something breaks, that is on you.

You are free to fork the academy and use the code for your own purposes, at your own risk.
