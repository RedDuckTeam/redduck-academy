---
id: 191
title: "PDAs: addresses with no private key"
type: lecture
faq:
  - question: Why can't a Solana program just hold a keypair to control its own accounts?
    answer: "A program is open-source bytecode running on every validator at once,
      so any private key it tried to hold would be visible to everyone, which
      makes it effectively public and no longer a secret key. Program-Derived
      Addresses (PDAs) solve this: they are addresses derived from the program
      ID and some seeds, with no private key existing anywhere, and the runtime
      lets the program authorize actions for them by re-submitting the seeds."
  - question: What is the bump in a PDA and why does it exist?
    answer: A PDA must land at a point off the elliptic curve so that no matching
      private key can exist. To force that, the derivation appends an extra byte
      called the bump, starting at 255 and counting down, and retries until the
      resulting address falls off the curve. The first off-curve result is the
      canonical PDA, and the byte that produced it is the canonical bump. The
      function find_program_address runs this search.
  - question: How do I compute a PDA address in my TypeScript client?
    answer: Use PublicKey.findProgramAddressSync from @solana/web3.js, passing the
      same seeds and program ID your on-chain program uses; it returns a tuple
      of the PDA and the canonical bump. The seed bytes must match exactly, so a
      wrong order or calling .toString() instead of .toBuffer() on a pubkey
      produces a different address and fails with a "seeds constraint violated"
      error.
  - question: Should I store a PDA's bump on the account or recompute it each time?
    answer: "Store it. Running find_program_address to rediscover the bump can cost
      anywhere from 1,500 to 12,000 compute units because it searches through
      candidate bumps. Saving the canonical bump as a field like pub bump: u8
      lets later instructions read it in one fetch and pass it via bump =
      state.bump on the seeds constraint, which is essentially free. This is the
      standard idiom worth using from your first program."
---

> A normal Solana account is controlled by whoever holds its private key. That works fine for wallets, where a person is in charge. It does not work for programs. Programs can't hold keys, can't sign with them, can't be trusted to keep one secret from anyone watching the chain. The fix is a different kind of address: one derived from a program ID and some seeds, with no private key in existence anywhere. The program signs for that address using the seeds themselves. These are called Program-Derived Addresses, or PDAs, and they're how every nontrivial Solana program manages its own state.

## Why PDAs have to exist

A normal account's address is the public key of an Ed25519 keypair. To authorize anything that account does, you sign a transaction with the matching private key. That model is fine when there's a human or a server holding the key in secret.

A program can't do this. The program is open-source bytecode running on every validator at once. Anything the program "knows" is visible to anyone running it. If a program tried to hold a private key, every validator would see it, which means every validator could sign with it, which means the key is effectively public, which means it isn't a key at all. The whole concept of a key the program controls just collapses.

But programs need to control accounts. They need vaults that hold user deposits. They need state accounts that only the program is allowed to mutate. They need to sign for token transfers out of their own pools. None of that works with the standard keypair model.

The resolution is to invent a kind of address that nobody can sign for in the normal way, and grant the program a special ability to sign for it instead. That's what a PDA is. A 32-byte value that looks like a public key but isn't one, derived deterministically from the program's address and some seeds chosen by the developer. No private key exists for it, because the derivation lands at a point that isn't on the Ed25519 curve, and the curve is where valid keypairs come from. The runtime gives the program a back door: if a program submits the seeds, the runtime treats it as authorization for the PDA those seeds derive to.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Two ways an account gets an address: normal wallet vs program-derived PDA</title><desc>The diagram compares two ways a Solana account gets its address, side by side: a normal wallet on the left and a PDA on the right. The wallet's private key derives a public key, a point on the curve, as its address; the PDA's program ID and seeds go through a hash and bump search to land on a point off the curve, so only the program can sign for it.</desc>
  <defs>
    <marker id="arrS35aR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
    <marker id="arrS35aG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Two ways an account gets an address</text>
  <rect x="40" y="90" width="310" height="380" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">a normal account (a wallet)</text>
  <rect x="80" y="145" width="230" height="55" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="167" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">private key</text>
  <text x="195" y="183" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">a random 256-bit number</text>
  <line x1="195" y1="205" x2="195" y2="230" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS35aG)"/>
  <text x="220" y="222" font-family="monospace" font-size="9" fill="#565653">ECDSA derivation</text>
  <rect x="80" y="235" width="230" height="55" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="257" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">public key</text>
  <text x="195" y="273" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">a point ON the curve</text>
  <line x1="195" y1="295" x2="195" y2="320" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS35aG)"/>
  <text x="230" y="312" font-family="monospace" font-size="9" fill="#565653">= the address</text>
  <rect x="80" y="325" width="230" height="55" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="195" y="347" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">account address</text>
  <text x="195" y="363" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">8fK3...wXyz</text>
  <text x="195" y="410" text-anchor="middle" font-family="monospace" font-size="10">to authorize anything,</text>
  <text x="195" y="426" text-anchor="middle" font-family="monospace" font-size="10">you sign with the private key</text>
  <text x="195" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">controlled by whoever holds it</text>
  <rect x="370" y="90" width="310" height="380" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="90" width="310" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="111" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">a PDA (program-controlled)</text>
  <rect x="410" y="145" width="230" height="55" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="167" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">program ID + seeds</text>
  <text x="525" y="183" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">public, anyone can read</text>
  <line x1="525" y1="205" x2="525" y2="230" stroke="#ed4937" stroke-width="1.5" marker-end="url(#arrS35aR)"/>
  <text x="555" y="222" font-family="monospace" font-size="9" fill="#ed4937">hash + bump search</text>
  <rect x="410" y="235" width="230" height="55" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="257" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">a 32-byte value</text>
  <text x="525" y="273" text-anchor="middle" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">a point OFF the curve</text>
  <line x1="525" y1="295" x2="525" y2="320" stroke="#565653" stroke-width="1.5" marker-end="url(#arrS35aG)"/>
  <text x="555" y="312" font-family="monospace" font-size="9" fill="#565653">= the address</text>
  <rect x="410" y="325" width="230" height="55" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="525" y="347" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">account address</text>
  <text x="525" y="363" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">2pQr...mN8h</text>
  <text x="525" y="410" text-anchor="middle" font-family="monospace" font-size="10">no private key exists.</text>
  <text x="525" y="426" text-anchor="middle" font-family="monospace" font-size="10">only the program can sign for it.</text>
  <text x="525" y="450" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">controlled by the program's code</text>
  <text x="360" y="505" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A PDA is the same kind of 32-byte address, derived a different way. The point off the curve is the trick.</text>
</svg>

Both halves of the diagram produce the same kind of artifact: a 32-byte address the runtime understands. The difference is in how that address is reached and who's allowed to sign for it. A wallet's address is reachable through a private key. A PDA's address is reachable only by re-running the derivation with the seeds.

## The bump trick

The derivation looks roughly like this. Take the seeds, append a single byte called the bump, append the program ID, append a tag string, and hash the whole thing with SHA-256. The result is 32 bytes. If those 32 bytes happen to land on the secp256k1 curve, the derivation could have a corresponding private key, and the whole point of PDAs would be broken. So if the result is on the curve, the derivation rejects it and tries again with a smaller bump byte.

The bump starts at 255 and decreases. Roughly half of all 32-byte values land on the curve, so on average two or three tries are enough to find one that doesn't. The first off-curve result encountered, with the highest bump, is the **canonical PDA** for those seeds. The bump that produced it is the **canonical bump**.

<svg role="img" viewBox="0 0 720 540" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>find_program_address bump search from 255 down to the canonical PDA</title><desc>The flowchart tries bump values starting at 255 and checks each candidate address against the curve. Bumps 255 and 254 land on the curve and are rejected, but bump 253 falls off the curve and is returned as the canonical PDA with canonical_bump = 253.</desc>
  <defs>
    <marker id="arrS35bR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">How find_program_address finds the bump</text>
  <rect x="40" y="90" width="640" height="55" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="113" font-family="monospace" font-size="11" font-weight="bold">inputs:</text>
  <text x="60" y="131" font-family="monospace" font-size="10">seeds = [b"vault", user.key()],  program_id = MyProgram</text>
  <line x1="360" y1="148" x2="360" y2="170" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS35bR)"/>
  <rect x="40" y="175" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="198" font-family="monospace" font-size="11" font-weight="bold">try bump = 255</text>
  <text x="60" y="216" font-family="monospace" font-size="10">candidate = sha256(seeds || [255] || program_id || "ProgramDerivedAddress")</text>
  <text x="60" y="230" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">→ falls ON the curve. reject.</text>
  <line x1="360" y1="238" x2="360" y2="260" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS35bR)"/>
  <rect x="40" y="265" width="640" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="288" font-family="monospace" font-size="11" font-weight="bold">try bump = 254</text>
  <text x="60" y="306" font-family="monospace" font-size="10">candidate = sha256(seeds || [254] || program_id || "ProgramDerivedAddress")</text>
  <text x="60" y="320" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">→ falls ON the curve. reject.</text>
  <line x1="360" y1="328" x2="360" y2="350" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS35bR)"/>
  <rect x="40" y="355" width="640" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="378" font-family="monospace" font-size="11" font-weight="bold">try bump = 253</text>
  <text x="60" y="396" font-family="monospace" font-size="10">candidate = sha256(seeds || [253] || program_id || "ProgramDerivedAddress")</text>
  <text x="60" y="410" font-family="monospace" font-size="9" font-weight="bold" fill="#ed4937">→ falls OFF the curve. accept this.</text>
  <line x1="360" y1="418" x2="360" y2="440" stroke="#ed4937" stroke-width="2" marker-end="url(#arrS35bR)"/>
  <rect x="40" y="445" width="640" height="55" fill="#e0deda" stroke="#ed4937" stroke-width="3"/>
  <text x="60" y="468" font-family="monospace" font-size="11" font-weight="bold">return: (PDA = 2pQr...mN8h, canonical_bump = 253)</text>
  <text x="60" y="486" font-family="monospace" font-size="9" fill="#565653">the canonical bump is the highest value (255 down to 0) that produces an off-curve point</text>
  <text x="360" y="525" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Roughly half the candidates fall on the curve. The loop finds the first off-curve one within a few tries.</text>
</svg>

The function that runs this loop is called `find_program_address`. You hand it the seeds and the program ID, and it returns the canonical PDA along with the bump that produced it. Off-chain code calls it before submitting a transaction so the right account address can be included. On-chain code mostly avoids `find_program_address`, since running the loop costs compute units, and instead uses a cheaper function called `create_program_address` that takes a known bump and checks it directly. The pattern is: compute the canonical bump once with `find_program_address`, store it, and from then on pass it in everywhere.

Anchor handles this for you when you write `seeds = [...]` and `bump`. The `bump` keyword without a value means "compute and verify the canonical bump." If you store the bump on the account, you can write `bump = self.bump` instead, which skips the search and uses the stored value. Most programs store the bump on the account they're deriving so subsequent instructions stay cheap.

## Deriving PDAs from the client

Most of the time you need to know the PDA address from your TypeScript client before you can build a transaction that touches it. The Anchor SDK uses it to fill in the accounts list, and your tests use it to fetch state back after the call. The function you reach for is `PublicKey.findProgramAddressSync` from `@solana/web3.js`:

```typescript
import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("YourProgram1111111111111111111111111111111111");
const user = userKeypair.publicKey;

// Same algorithm as find_program_address on chain, just running off-chain.
const [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), user.toBuffer()],
  programId,
);

console.log("vault address:", vaultPda.toBase58());
console.log("canonical bump:", vaultBump);
```

The function returns a tuple of the PDA and the canonical bump. It runs the same loop the on-chain version does, just in JavaScript. Since the seeds are public and the program ID is public, you can compute any PDA your program uses from outside the program.

The one thing that has to match exactly is the seed bytes. If your program declares `seeds = [b"vault", user.key().as_ref()]`, your client has to pass `Buffer.from("vault")` and `user.toBuffer()` in the same order. The common bug here is a seed encoding mismatch: passing a string where the program expects a number, swapping the order of two seeds, or calling `.toString()` instead of `.toBuffer()` on a pubkey. When this happens, the client computes a different PDA than the program expects, and the transaction fails at constraint-check time with a "seeds constraint violated" error. Keep the seed shapes in sync between the two sides and the addresses will agree.

## The address is the lookup

The second reason PDAs are powerful, beyond the signing ability, is what their derivation enables architecturally. Because the address is a hash of public inputs, you can encode application logic directly into the address.

Want one vault per user? Use seeds `[b"vault", user.key()]`. Each user's pubkey produces a unique PDA. To find a user's vault, you compute the PDA from their pubkey. No mapping table needed.

<svg role="img" viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Vault PDAs derived from seeds b"vault" plus pubkey for Alice, Bob, Carol</title><desc>For Alice, Bob, and Carol, the seeds b"vault" and the user's pubkey are combined to deterministically derive that user's vault PDA and bump. No user-to-vault mapping table is needed, since the address itself is the lookup, like content-addressed storage.</desc>
  <defs>
    <marker id="arrS35cG" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
    <marker id="arrS35cR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">The address IS the lookup. One PDA per (seeds) combination.</text>
  <rect x="40" y="90" width="640" height="60" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="60" y="113" font-family="monospace" font-size="11" font-weight="bold">seeds spec:</text>
  <text x="60" y="133" font-family="monospace" font-size="10">[b"vault", user.key().as_ref()]</text>
  <text x="380" y="133" font-family="monospace" font-size="9" fill="#565653" font-style="italic">a literal string + the user's pubkey</text>
  <rect x="40" y="170" width="200" height="220" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="170" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="140" y="189" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Alice</text>
  <text x="55" y="218" font-family="monospace" font-size="10">seeds:</text>
  <text x="55" y="234" font-family="monospace" font-size="9" fill="#565653">b"vault"</text>
  <text x="55" y="248" font-family="monospace" font-size="9" fill="#565653">alice_pubkey</text>
  <line x1="55" y1="262" x2="225" y2="262" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="55" y="282" font-family="monospace" font-size="10" font-weight="bold">Alice's vault PDA:</text>
  <text x="55" y="300" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">9Hx2...mK3p</text>
  <text x="55" y="320" font-family="monospace" font-size="9" fill="#565653">bump = 254</text>
  <text x="140" y="365" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">deterministic from</text>
  <text x="140" y="378" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">Alice's pubkey</text>
  <rect x="260" y="170" width="200" height="220" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="260" y="170" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="189" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Bob</text>
  <text x="275" y="218" font-family="monospace" font-size="10">seeds:</text>
  <text x="275" y="234" font-family="monospace" font-size="9" fill="#565653">b"vault"</text>
  <text x="275" y="248" font-family="monospace" font-size="9" fill="#565653">bob_pubkey</text>
  <line x1="275" y1="262" x2="445" y2="262" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="275" y="282" font-family="monospace" font-size="10" font-weight="bold">Bob's vault PDA:</text>
  <text x="275" y="300" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">3rQv...nP7w</text>
  <text x="275" y="320" font-family="monospace" font-size="9" fill="#565653">bump = 253</text>
  <text x="360" y="365" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">deterministic from</text>
  <text x="360" y="378" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">Bob's pubkey</text>
  <rect x="480" y="170" width="200" height="220" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="480" y="170" width="200" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="580" y="189" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff" font-weight="bold">Carol</text>
  <text x="495" y="218" font-family="monospace" font-size="10">seeds:</text>
  <text x="495" y="234" font-family="monospace" font-size="9" fill="#565653">b"vault"</text>
  <text x="495" y="248" font-family="monospace" font-size="9" fill="#565653">carol_pubkey</text>
  <line x1="495" y1="262" x2="665" y2="262" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="495" y="282" font-family="monospace" font-size="10" font-weight="bold">Carol's vault PDA:</text>
  <text x="495" y="300" font-family="monospace" font-size="9" fill="#ed4937" font-weight="bold">7xKp...rT2v</text>
  <text x="495" y="320" font-family="monospace" font-size="9" fill="#565653">bump = 255</text>
  <text x="580" y="365" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">deterministic from</text>
  <text x="580" y="378" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">Carol's pubkey</text>
  <rect x="40" y="410" width="640" height="80" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="60" y="432" font-family="monospace" font-size="11" font-weight="bold">No mapping table needed</text>
  <line x1="55" y1="440" x2="665" y2="440" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="60" y="460" font-family="monospace" font-size="10">To find Alice's vault, you compute the PDA from her pubkey. The address is the lookup.</text>
  <text x="60" y="478" font-family="monospace" font-size="10">No "user → vault address" map. The address mechanism is the map.</text>
  <text x="360" y="518" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">Same idea as content-addressed storage. The hash of the identity is the location.</text>
</svg>

The concept is similar to content-addressed storage: the address of an item is derived from its contents, so you never need a separate lookup table. In a normal database, you'd have a users table mapping user IDs to vault row IDs, and you'd look up the vault by joining. With PDAs, the address of the vault is a hash of the user's identity. You don't look up the mapping. You compute the location from the identity itself.

This composes well. A vote record that's unique per user and per proposal can use seeds `[b"vote", user.key(), proposal.key()]`. A daily counter PDA could use `[b"counter", day_number.to_le_bytes()]`. Any tuple of public values that uniquely identifies the account you want can be the seeds. The runtime guarantees the resulting address is unique to that tuple under your program.

The constraint is that seeds together cannot exceed 32 bytes per seed and the total seed count is capped at 16. That's plenty for almost any indexing scheme you'd want, and it's a small price for the architectural simplicity.

## Storing the bump

One last practical detail. When you initialize a PDA account, you'll usually store the canonical bump as a field on the account itself. The next instruction that needs to sign for this PDA can read the bump from the account in one fetch instead of running `find_program_address` again. The savings add up: a single `find_program_address` can cost 1,500 to 12,000 compute units depending on how many bumps it has to try, while reading a stored bump from an already-loaded account is essentially free.

The convention shows up in account structs as a field like `pub bump: u8`, populated in the init instruction by the value Anchor computed, and read back in every subsequent instruction via `bump = state.bump` on the `seeds` constraint. This is the standard idiom and worth adopting from your first program.

## What a PDA does and doesn't change

A PDA does not change anything about the account model. The account at a PDA still has the same five fields: lamports, data, owner, executable, and an address. Reading from it works exactly the way reading from any account works. Writing to it requires it to be owned by the program, exactly the way any program-owned account requires.

What changes is who can sign for it. A normal account's signature comes from a keypair. A PDA's "signature" comes from a program re-deriving the seeds inside a cross-program invocation. The runtime treats the two as equivalent for authorization purposes.

That sentence is the whole conceptual core. Once you've internalized it, every PDA pattern in real Solana code follows: programs creating accounts they own, programs signing for token transfers, programs maintaining per-user state without storing a key per user, programs holding pool funds without anyone holding the pool's key.
