---
title: Root of trust
type: lecture
order: 10
faq:
  - question: What is the root of trust in a Solana program?
    answer: >-
      It is an account that the caller could not have created, for example a PDA of your
      program or an account with a hardcoded address. Since the caller sends every account and
      can create most of them, comparing two of them with each other proves nothing. At least
      one check has to use an account the caller could not have made.
  - question: My deposit instruction checks that the token account's mint equals the vault's mint. Is that enough?
    answer: >-
      Only if the caller could not have created the vault. A vault and a token account with
      the same mint cost almost nothing to create. So the program also has to check that the
      vault's address is a PDA of your program. Then the vault is real, and so is the mint
      check.
  - question: Why can anyone create an account that my program owns?
    answer: >-
      Because your program has an instruction that creates them, and anyone can call it. So
      the owner check only proves that your program wrote the account, not that it is the one
      you wanted. The address still has to come from seeds, or from a field in an account that
      already has a root.
  - question: How did the Wormhole program accept signatures that were never checked?
    answer: >-
      The signatures are checked by a built-in program that returns nothing, so Wormhole read
      the transaction's instruction list to confirm that the check had run. It took that list
      from the account the caller passed and never compared its address with the real sysvar
      address. The caller passed a normal account with a fake successful check inside.
  - question: What did Cashio check, and what did it not check?
    answer: >-
      It checked that the collateral token account matched the bank, and that the Saber pool
      accounts matched each other. It never checked that the bank was one of the protocol's
      own, and anyone could create one. So the caller created a bank, a pool and token accounts
      that all matched, and minted CASH with no real collateral.
  - question: The runtime fills the instructions sysvar. Why do I still need to compare its address?
    answer: >-
      The runtime fills the account at the sysvar address, but the caller can pass a different
      account in its place. If the program does not compare the address, it reads whatever the
      caller wrote there, including a fake successful signature check.
---

> On Solana, the caller sends every account that the program reads, and can create most of them. So comparing two accounts that both came from the caller proves nothing. This mistake is behind most Solana exploits.

## The caller created the accounts

A Solana program does not look anything up on its own. It reads only the accounts that the caller, the person who sent the transaction, chose to include.

The simplest way to check an account is to compare it with another one. For example, a vault holds tokens of one mint, so the deposit instruction checks that the user's token account has the same mint as the vault. The problem is that both accounts came from the caller, and accounts are cheap to create. The caller makes a mint, a vault that points to it, and a token account for the same mint. The vault and the token account have the same mint, so the check passes, and the caller can drain the vault. Creating the fake accounts costs almost nothing, and the caller can take everything the program holds. So the program cannot stop fakes by making them expensive. It has to make them impossible.

The same is true for other inputs. The caller can choose which oracle account the price comes from. The caller can add an instruction to the transaction that only looks like a signature check. The caller can create an account with the right data layout. In every case the program sees data that looks right, but that data can be faked.

## Where the checks stop depending on the caller

Every check depends on some other account. The mint check is only useful if the vault is real. So we ask the same question about the vault. Which account is it compared with? Then we ask the same question about that account, and so on. This chain has to end at an account the caller could not have created. That account is the **root of trust**. Every other check in the instruction depends on it, and a check that does not depend on the root depends on the caller.

There are three kinds of accounts the caller cannot create. The first is a PDA of your program. Its address is computed from the seeds and your program id, and only your program can create an account there. The second is an account with a hardcoded address, such as the SPL Token program or the instructions sysvar. The caller can pass a different account in its place, but its address will not match the one your program expects. The third is an account owned by your program, with one condition. If your program has an instruction that creates such accounts, anyone can call it, and then the owner check only proves that your program wrote the account, not that it is the one you wanted. So the address still has to come from seeds, or from a field in an account that already has a root.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>A fake vault with and without an address check</title><desc>Two boxes side by side. On the left, the caller creates a vault and a token account with the same mint X. The program only checks that the mints are the same, so the check passes. On the right, the caller creates a fake vault, but the real vault was created by the program at a PDA address. The program checks that the vault's address is the PDA, the fake vault fails, and the transaction is rejected. Accounts created by the caller have a red border.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A fake vault</text>

  <rect x="40" y="70" width="300" height="250" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">No address check</text>
  <rect x="140" y="108" width="100" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="127" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ffffff">the caller</text>
  <line x1="190" y1="136" x2="190" y2="150" stroke="#ed4937" stroke-width="2"/>
  <line x1="130" y1="150" x2="250" y2="150" stroke="#ed4937" stroke-width="2"/>
  <line x1="130" y1="150" x2="130" y2="170" stroke="#ed4937" stroke-width="2"/>
  <line x1="250" y1="150" x2="250" y2="170" stroke="#ed4937" stroke-width="2"/>
  <polygon points="124,168 136,168 130,178" fill="#ed4937"/>
  <polygon points="244,168 256,168 250,178" fill="#ed4937"/>
  <rect x="80" y="178" width="100" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="130" y="195" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">vault</text>
  <text x="130" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">mint X</text>
  <rect x="200" y="178" width="100" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="250" y="195" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">token acct</text>
  <text x="250" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">mint X</text>
  <line x1="130" y1="218" x2="130" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="250" y1="218" x2="250" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="130" y1="232" x2="250" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="190" y1="232" x2="190" y2="246" stroke="#000000" stroke-width="2"/>
  <polygon points="184,244 196,244 190,254" fill="#000000"/>
  <rect x="90" y="254" width="200" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="276" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">same mint? yes</text>
  <text x="190" y="310" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">passes</text>

  <rect x="380" y="70" width="300" height="250" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Address check</text>
  <rect x="400" y="108" width="100" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="450" y="127" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ffffff">the caller</text>
  <rect x="560" y="108" width="100" height="28" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="610" y="127" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">your program</text>
  <line x1="450" y1="136" x2="450" y2="170" stroke="#ed4937" stroke-width="2"/>
  <polygon points="444,168 456,168 450,178" fill="#ed4937"/>
  <line x1="610" y1="136" x2="610" y2="170" stroke="#000000" stroke-width="2"/>
  <polygon points="604,168 616,168 610,178" fill="#000000"/>
  <rect x="400" y="178" width="100" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="450" y="195" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">vault</text>
  <text x="450" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">fake</text>
  <rect x="560" y="178" width="100" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="610" y="195" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">vault</text>
  <text x="610" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">PDA</text>
  <line x1="450" y1="218" x2="450" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="610" y1="218" x2="610" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="450" y1="232" x2="610" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="530" y1="232" x2="530" y2="246" stroke="#000000" stroke-width="2"/>
  <polygon points="524,244 536,244 530,254" fill="#000000"/>
  <rect x="430" y="254" width="200" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="276" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">address is PDA? no</text>
  <text x="530" y="310" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">rejected</text>

  <text x="360" y="346" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Red = created by the caller. Only the address check is one a fake cannot pass.</text>
</svg>

## Cashio: anyone could create a bank

Cashio was a stablecoin. A user deposited Saber LP tokens, the tokens a liquidity provider gets from a Saber pool, as collateral and minted CASH for them. The mint instruction took a bank account, the user's collateral token account, and the Saber pool accounts. The bank says which collateral the protocol accepts, and the pool accounts give the collateral its value.

The program checked that the collateral token account matched the bank, and that the Saber pool accounts matched each other. It never checked that the bank was one of the protocol's own, and the instruction that creates banks was open to anyone. So one caller created a bank, a fake pool and token accounts that all matched, and minted CASH with no real collateral. None of the checks used an account the caller could not have created.

## Wormhole: the list of instructions came from the caller

Wormhole is a bridge between chains. A message from another chain comes with signatures from Wormhole's guardians, and the program has to verify them before it mints wrapped tokens.

Verifying a signature inside a program is too expensive, so Solana has built-in programs for it. The Secp256k1 and Ed25519 programs check a signature and return nothing. If the signature is bad, the whole transaction fails, so if the transaction is still running, the signature was good. But how does your program know that this check ran at all? It reads the list of instructions in the current transaction from the instructions sysvar, a special account that the runtime fills with the transaction's own instructions. Your program looks at the instruction next to itself and checks that it was a call to the built-in program.

Wormhole's program read this list from the account the caller passed as the sysvar, and the function it used never compared that account's address with the real one. So the caller passed a normal account with the data of a successful signature check written inside. The program read it, believed that the guardians had signed, and minted 120,000 wrapped ETH out of nothing. In 2022 that was about 320 million dollars.

Everything else in that instruction was checked correctly, the signature format, the guardian set and the message layout. But all of those checks depended on the list of instructions, and the list came from the caller. One comparison of one address would have stopped the attack. Without it, the other checks did not matter, because all of them depended on data the caller controlled.

## Switchboard: the same list, but the address is checked first

Switchboard On-Demand is an oracle. Its oracles sign price updates off-chain, and the program that uses a price has to verify the signature. It uses the same built-in Ed25519 program and the same instructions sysvar as Wormhole.

The difference is the order of the checks. First the program compares the account passed as the sysvar with the real sysvar address. Then it reads the instruction at the expected position and checks that it was a call to the Ed25519 program. Then it checks that the public key in that instruction belongs to the expected oracle, and that the signed message is the price it is about to use. Each check depends on the previous one, and the first depends on a hardcoded address, so the whole chain has a root.

Switchboard does not have more checks than Wormhole had. It has the same checks in a different order, with one hardcoded address at the start. That one comparison is why Switchboard is safe and Wormhole was not.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Where the instruction list comes from</title><desc>Two boxes side by side. On the left, Wormhole: the caller creates an account with a fake instruction list that says the signatures are ok. The program does not check the address of that account, so it believes the list and mints wrapped ETH. On the right, Switchboard: the caller creates the same fake list, but the runtime also provides the real list at the sysvar address. The program checks that the address is the sysvar address, the fake list fails, and the transaction is rejected. Accounts created by the caller have a red border.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Where the instruction list comes from</text>

  <rect x="40" y="70" width="300" height="250" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Wormhole</text>
  <rect x="140" y="108" width="100" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="127" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ffffff">the caller</text>
  <line x1="190" y1="136" x2="190" y2="170" stroke="#ed4937" stroke-width="2"/>
  <polygon points="184,168 196,168 190,178" fill="#ed4937"/>
  <rect x="120" y="178" width="140" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="190" y="195" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">instructions</text>
  <text x="190" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">fake: signatures ok</text>
  <line x1="190" y1="218" x2="190" y2="246" stroke="#000000" stroke-width="2"/>
  <polygon points="184,244 196,244 190,254" fill="#000000"/>
  <rect x="90" y="254" width="200" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="190" y="276" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">address checked? no</text>
  <text x="190" y="310" text-anchor="middle" font-family="monospace" font-size="11" fill="#ed4937" font-weight="bold">120,000 wETH minted</text>

  <rect x="380" y="70" width="300" height="250" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="70" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="89" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Switchboard</text>
  <rect x="400" y="108" width="100" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="450" y="127" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#ffffff">the caller</text>
  <rect x="560" y="108" width="100" height="28" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="610" y="127" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">the runtime</text>
  <line x1="450" y1="136" x2="450" y2="170" stroke="#ed4937" stroke-width="2"/>
  <polygon points="444,168 456,168 450,178" fill="#ed4937"/>
  <line x1="610" y1="136" x2="610" y2="170" stroke="#000000" stroke-width="2"/>
  <polygon points="604,168 616,168 610,178" fill="#000000"/>
  <rect x="400" y="178" width="100" height="40" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="450" y="195" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">instructions</text>
  <text x="450" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">fake</text>
  <rect x="560" y="178" width="100" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="610" y="195" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">instructions</text>
  <text x="610" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">at sysvar address</text>
  <line x1="450" y1="218" x2="450" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="610" y1="218" x2="610" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="450" y1="232" x2="610" y2="232" stroke="#000000" stroke-width="2"/>
  <line x1="530" y1="232" x2="530" y2="246" stroke="#000000" stroke-width="2"/>
  <polygon points="524,244 536,244 530,254" fill="#000000"/>
  <rect x="430" y="254" width="200" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="530" y="276" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">address is sysvar? no</text>
  <text x="530" y="310" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold">rejected</text>

  <text x="360" y="346" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The instruction list is an account too, so the caller can fake it.</text>
  <text x="360" y="362" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Wormhole took it from the caller. Switchboard checks its address first.</text>
</svg>

## One root for every instruction

The root has to be checked the same way in every instruction. Say nine instructions check the vault's address and the tenth does not, because it only reads one field. Then the caller will simply use the tenth, since the caller chooses which instruction to call. So use the same root across the whole program, the same config PDA, seeds and hardcoded addresses, checked the same way everywhere.

## Follow every input to its root

Take an instruction you are working on and list every account it receives. For each one, ask three questions. Could the caller have created it? If yes, which other account is it compared with? Does that chain end at a PDA of your program, a hardcoded address, or another account the caller could not have created? If any chain does not end there, the instruction trusts the caller.
