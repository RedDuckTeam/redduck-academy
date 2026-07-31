# `contracts` — on-chain course certificates

The Solidity contracts behind RedDuck Academy's completion certificates, built with
[Hardhat 3](https://hardhat.org) (viem + the Node.js test runner) and OpenZeppelin.

## What's here

- **`contracts/CourseCertificate.sol`** — the production contract. A **soulbound**
  (non-transferable), **UUPS-upgradeable** `ERC721` that mints a certificate to a student when
  they finish a course. Minting and revocation are gated by `ADMIN_ROLE` (OpenZeppelin
  `AccessControl`); each token stores its `courseId`, issue time, and a `metadataHash`. It runs
  behind an ERC-1967 proxy (`contracts/proxy/ERC1967Proxy.sol`).
- **`contracts/Counter.sol`** — Hardhat's sample contract, kept only as a tiny reference.

## Commands

Run from the repo root (or with `yarn workspace contracts <script>`):

```bash
yarn workspace contracts compile   # compile the contracts
yarn workspace contracts test      # run the Hardhat test suite
```

## Deploying

Deployments use [Hardhat Ignition](https://hardhat.org/ignition). The deploy module lives at
`ignition/modules/CourseCertificate.ts`; its parameters live in `ignition/parameters/` — copy
`main.example.json` to `main.json` and fill in the admin address before a mainnet deploy.

```bash
yarn workspace contracts deploy:sepolia   # testnet
yarn workspace contracts deploy:main      # mainnet (production build profile)
```
