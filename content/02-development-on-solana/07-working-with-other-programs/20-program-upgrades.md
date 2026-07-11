---
id: 233
title: Program upgrades
type: lecture
faq:
  - question: Can the developer of a Solana program change its code after I start
      using it?
    answer: Yes. On Solana a program is just an account holding executable bytecode,
      and whoever holds its upgrade authority can replace that bytecode with a
      new version. The program's address never changes, so you keep calling the
      same one, but the next time you do you run the updated code. This means
      using a program is really trusting whoever controls that upgrade
      authority.
  - question: Does upgrading a Solana program erase user balances or stored data?
    answer: No. User data lives in separate accounts, not inside the program's
      bytecode, so replacing the code leaves all of that state untouched. There
      is no migration and no need to move to a new address. The only requirement
      is that the new code stays compatible with the existing account layouts,
      which is why most upgrades add new instructions rather than change
      existing data structures.
  - question: What does it mean when a program's upgrade authority is set to None?
    answer: It means the program is permanently frozen and its code can never be
      changed by anyone again. This is irreversible, so some teams do it on
      purpose as a promise that the rules will not change. Most production
      protocols instead keep the authority on a team multisig or hand it to
      governance so they can still ship bug fixes.
  - question: How can I check that a Solana program's on-chain code matches its
      published source?
    answer: Look for a verifiable build. If a project publishes its source on
      GitHub, anyone can recompile it and compare the result to the bytecode
      running on chain, and tools automate this check. Block explorers show a
      tag indicating whether a program has a verified build, so you can confirm
      the code you are reading is the code actually running.
---

> On Solana, a program isn't a special kind of thing. It's just an account, like any other, with a flag that says "this account holds executable code." That fact has a useful consequence: you can replace the code without disturbing anything else. This lecture covers what program upgrades are, who is allowed to do them, and what it means for the people using your program.

## Code is just another account

Solana's account model treats programs the same as everything else. A program account has the same shape as a user account or a vault account. The only difference is one flag: `executable: true`. That flag tells the runtime "this account's data is BPF bytecode rather than regular data, and you should run it when someone calls this address."

So a program is really two things: a pubkey that never changes (the program's address), and the bytecode in that account's data field, which can change. Everything users interact with, including the address they call, the instructions they invoke, and the IDL they generate clients from, points at the address rather than at the bytecode. The bytecode is just whatever happens to be sitting in that account right now.

Replacing the bytecode is what we call an upgrade. The address stays the same. Users keep calling the same program. But the next time they do, they're running a different version of the code.

## State stays put

The reason this works cleanly is that user data lives in other accounts. Your staking program doesn't store stake positions inside its own bytecode account. It stores them in separate `StakePosition` accounts, one per user. The Vault sits in its own account. The Config sits in its own account. The program is just code that operates on those accounts when called.

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Program upgrade: before and after, bytecode v1 to v2, state accounts unchanged</title><desc>Two side-by-side panels compare a program account before and after an upgrade. In both panels the program account keeps executable: true, only its data changes from bytecode v1 to bytecode v2, while the separate state accounts (UserState balances of 500, 1200, and 300, Config, and Vault: tokens = 50000) stay untouched with the same values.</desc>
  <defs>
    <marker id="arrU1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Upgrading replaces code, never state</text>
  <rect x="40" y="85" width="290" height="320" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="290" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="185" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Before the upgrade</text>
  <rect x="60" y="130" width="250" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="60" y="130" width="250" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="185" y="146" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Program account</text>
  <text x="75" y="170" font-family="monospace" font-size="9">executable: true</text>
  <text x="75" y="185" font-family="monospace" font-size="9">data: bytecode v1</text>
  <text x="75" y="200" font-family="monospace" font-size="9" fill="#565653">"the code"</text>
  <rect x="60" y="230" width="250" height="155" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="60" y="230" width="250" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="185" y="246" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">State accounts</text>
  <text x="75" y="270" font-family="monospace" font-size="9">UserState: balance = 500</text>
  <text x="75" y="285" font-family="monospace" font-size="9">UserState: balance = 1200</text>
  <text x="75" y="300" font-family="monospace" font-size="9">UserState: balance = 300</text>
  <text x="75" y="315" font-family="monospace" font-size="9">Config: admin = ...</text>
  <text x="75" y="330" font-family="monospace" font-size="9">Vault: tokens = 50000</text>
  <text x="75" y="355" font-family="monospace" font-size="9" fill="#565653">"the data the code operates on"</text>
  <text x="75" y="372" font-family="monospace" font-size="9" fill="#565653">stored in separate accounts</text>
  <line x1="345" y1="245" x2="395" y2="245" stroke="#ed4937" stroke-width="3" marker-end="url(#arrU1)"/>
  <text x="370" y="232" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">upgrade</text>
  <rect x="410" y="85" width="290" height="320" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="410" y="85" width="290" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="555" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">After the upgrade</text>
  <rect x="430" y="130" width="250" height="80" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="430" y="130" width="250" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="555" y="146" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Program account</text>
  <text x="445" y="170" font-family="monospace" font-size="9">executable: true</text>
  <text x="445" y="185" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">data: bytecode v2</text>
  <text x="445" y="200" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">↑ new code</text>
  <rect x="430" y="230" width="250" height="155" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="430" y="230" width="250" height="22" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="555" y="246" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">State accounts</text>
  <text x="445" y="270" font-family="monospace" font-size="9">UserState: balance = 500</text>
  <text x="445" y="285" font-family="monospace" font-size="9">UserState: balance = 1200</text>
  <text x="445" y="300" font-family="monospace" font-size="9">UserState: balance = 300</text>
  <text x="445" y="315" font-family="monospace" font-size="9">Config: admin = ...</text>
  <text x="445" y="330" font-family="monospace" font-size="9">Vault: tokens = 50000</text>
  <text x="445" y="355" font-family="monospace" font-size="9" fill="#565653">untouched. same accounts,</text>
  <text x="445" y="372" font-family="monospace" font-size="9" fill="#565653">same balances, same data.</text>
  <text x="360" y="440" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Code and state are separate accounts. Replacing the code doesn't move the data.</text>
  <text x="360" y="460" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Users keep their balances. The program just starts running new logic on them.</text>
</svg>

Upgrading a Solana program doesn't require a migration. You don't have to copy data from a v1 program to a v2 program. You don't have to redeploy at a new address and ask users to move. The address stays. The state stays. Only the code changes.

The constraint is that your new code has to be compatible with the existing state. If your old `Vault` struct had three fields and your new one has four, the v2 code reading old accounts is going to fail, because the bytes on disk don't match the new struct. So in practice, upgrades require careful thought about account layouts. Adding fields is easy if you handle the migration in code, by reading the old format and writing the new format. Changing field types or removing fields is hard. Most upgrades add new instructions and avoid changing existing structs.

## The upgrade authority

Programs don't upgrade themselves. Every upgradeable program has an **upgrade authority**, which is a pubkey stored alongside the bytecode. Only that authority can deploy new code to that program. If you don't hold the upgrade authority's private key, you cannot upgrade the program.

The upgrade authority is set when the program is first deployed. It defaults to the deployer's keypair, but you can change it later: transfer it to a multisig, transfer it to a DAO-controlled account, or set it to `None` to make the program permanently immutable.

That last option is important. **Setting the upgrade authority to ****`None`**** is irreversible.** Once you do it, no one can ever upgrade the program again. The bytecode is frozen forever. Some protocols do this on purpose, as a credibility signal. They're saying "we've audited this code and we promise you the rules won't change."

Most production protocols don't do this, at least not initially. They keep the upgrade authority on a multisig controlled by the team, so they can release bug fixes if something goes wrong. Some transfer it to a governance program later, so the community votes on upgrades instead of the team deciding unilaterally. The choice is a trust signal to users.

## What this means for users

When you're using a Solana program, you're trusting whoever holds its upgrade authority. They can change the rules. They can fix bugs. They can also, in theory, deploy code that drains the vault.

Users who care about this check three things:

- **Is there an upgrade authority?** Block explorers show this. If the field says `null`, the program is frozen.
- **Who holds it?** A single team wallet, a multisig with a published signer set, a governance program. Each of these has different trust implications.
- **Does the on-chain code match the audited source code?** This is where **verifiable builds** matter. If a project publishes its source code on GitHub, anyone can compile it and check whether the resulting bytecode matches what's on chain. Tools exist that automate this comparison. Block explorers show a tag indicating whether a program has a verified build. A program that's verifiable is one where you can be sure the code you're reading is the code that's actually running.

You don't have to perform these checks yourself for every program you interact with. Auditors and explorer integrations do most of the work. But the concept is what matters: a program's behavior is whatever its current bytecode says, and the people who can change that bytecode are the ones with the upgrade authority. Knowing who they are tells you who you're really trusting.

## Summary

A Solana program is an account with executable bytecode. That bytecode can be replaced by whoever holds the upgrade authority, without touching any of the state the program operates on. Set the authority to `None` and the program becomes permanent. Verifiable builds let users confirm the code on chain matches a published source. That covers everything about program upgrades.
