---
id: 225
title: Solana NFTs
type: lecture
order: 29
faq:
  - question: What makes an SPL Token an NFT?
    answer: >-
      Supply of 1, decimals of 0, and a permanently renounced mint authority. Transferring one
      is the ordinary SPL transfer of a balance of 1.
  - question: Where does a Solana NFT's name and image actually live?
    answer: >-
      In a Metaplex metadata account, a PDA derived from the mint address. It holds the name,
      symbol, creators, collection and a URI that points at JSON on Arweave or IPFS, which links
      to the image.
  - question: Why is a compressed NFT so much cheaper?
    answer: >-
      Every regular NFT is at least two accounts, about 0.007 SOL of rent, so 10,000 of them
      lock roughly 70 SOL. A compressed collection keeps one Merkle root in a single account,
      near 0.1 SOL, and a depth-14 tree holds 16,384 leaves.
  - question: What do I give up with cNFTs?
    answer: >-
      Direct reads. Fetching one means querying an indexer instead of reading two accounts.
---

## An NFT is just an SPL Token with three constraints

A Solana NFT is not a separate kind of object. It is an SPL Token, the same token program that runs USDC and Bonk and your project's reward token. What makes it non-fungible is configuration:

- **Supply is 1.** There is exactly one of them.
- **Decimals is 0.** No fractional units exist.
- **Mint authority is permanently renounced.** Nobody can ever mint more.

The token program doesn't know or care that this particular mint represents a JPEG of a cartoon lizard. It enforces the supply constraint, blocks attempts to mint after the authority is renounced, and tracks ownership through token accounts the way it would for any other token. Transferring an NFT is calling the SPL Token transfer instruction on a token account whose balance is 1, the same instruction that moves USDC.

On Ethereum an NFT collection is usually its own ERC-721 contract, which records the owner of every token id and returns each token's metadata URI ([ERC-721 and ERC-1155](/courses/development-on-ethereum/tokens-beyond-erc-20/erc-721-and-erc-1155)). On Solana nobody deploys a contract per collection. Every NFT is a separate mint in the shared token program, and that program tracks only how many of the token exist and who owns each one. It doesn't store a name, a symbol, an image, a list of attributes, or which collection the NFT belongs to, so that information has to live elsewhere.

<svg role="img" viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Solana NFT: mint, metadata, and owner's token account</title><desc>A Solana NFT is three linked accounts: the mint account holds supply, decimals, and authority fields; the metadata account, owned by the Metaplex Token Metadata program, holds name, symbol, uri, creators, and collection; both reference the mint. The owner's token account holds amount 1 and points to the mint too, and transferring the NFT just moves this token account between wallets.</desc>
  <defs>
    <marker id="arrN1" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ed4937"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A Solana NFT is three accounts that point at each other</text>

<!-- Mint account (top center) -->
  <rect x="210" y="85" width="300" height="140" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="210" y="85" width="300" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="103" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Mint account</text>
  <text x="255" y="130" font-family="monospace" font-size="10" font-weight="bold">supply:</text>
  <text x="340" y="130" font-family="monospace" font-size="10" fill="#565653">1</text>
  <text x="255" y="148" font-family="monospace" font-size="10" font-weight="bold">decimals:</text>
  <text x="340" y="148" font-family="monospace" font-size="10" fill="#565653">0</text>
  <text x="255" y="166" font-family="monospace" font-size="10" font-weight="bold">mint_auth:</text>
  <text x="340" y="166" font-family="monospace" font-size="10" fill="#565653">None</text>
  <text x="255" y="184" font-family="monospace" font-size="10" font-weight="bold">freeze_auth:</text>
  <text x="340" y="184" font-family="monospace" font-size="10" fill="#565653">None</text>
  <text x="360" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">just an SPL Token, configured for non-fungibility</text>

<!-- Metadata account (bottom left) -->
  <rect x="40" y="290" width="280" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="290" width="280" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="180" y="308" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Metadata account</text>
  <text x="55" y="335" font-family="monospace" font-size="10" font-weight="bold">mint:</text>
  <text x="120" y="335" font-family="monospace" font-size="10" fill="#565653">&lt;mint pubkey&gt;</text>
  <text x="55" y="353" font-family="monospace" font-size="10" font-weight="bold">name:</text>
  <text x="120" y="353" font-family="monospace" font-size="10" fill="#565653">"Mad Lad #4269"</text>
  <text x="55" y="371" font-family="monospace" font-size="10" font-weight="bold">symbol:</text>
  <text x="120" y="371" font-family="monospace" font-size="10" fill="#565653">"MAD"</text>
  <text x="55" y="389" font-family="monospace" font-size="10" font-weight="bold">uri:</text>
  <text x="120" y="389" font-family="monospace" font-size="10" fill="#565653">arweave.net/...</text>
  <text x="55" y="407" font-family="monospace" font-size="10" font-weight="bold">creators:</text>
  <text x="120" y="407" font-family="monospace" font-size="10" fill="#565653">[...]</text>
  <text x="55" y="425" font-family="monospace" font-size="10" font-weight="bold">collection:</text>
  <text x="120" y="425" font-family="monospace" font-size="10" fill="#565653">Some(&lt;pubkey&gt;)</text>
  <text x="180" y="448" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">owned by the Metaplex Token Metadata program</text>

<!-- Token account (bottom right) -->
  <rect x="400" y="290" width="280" height="170" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="400" y="290" width="280" height="26" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="540" y="308" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Owner's token account</text>
  <text x="415" y="335" font-family="monospace" font-size="10" font-weight="bold">mint:</text>
  <text x="480" y="335" font-family="monospace" font-size="10" fill="#565653">&lt;mint pubkey&gt;</text>
  <text x="415" y="353" font-family="monospace" font-size="10" font-weight="bold">owner:</text>
  <text x="480" y="353" font-family="monospace" font-size="10" fill="#565653">&lt;wallet pubkey&gt;</text>
  <text x="415" y="371" font-family="monospace" font-size="10" font-weight="bold">amount:</text>
  <text x="480" y="371" font-family="monospace" font-size="10" fill="#565653">1</text>
  <text x="540" y="410" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">the wallet that holds the NFT</text>
  <text x="540" y="425" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">is whoever owns this account</text>

<!-- Arrows -->
  <line x1="320" y1="290" x2="280" y2="230" stroke="#ed4937" stroke-width="2" marker-end="url(#arrN1)"/>
  <text x="235" y="265" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">references</text>

<line x1="400" y1="290" x2="440" y2="230" stroke="#ed4937" stroke-width="2" marker-end="url(#arrN1)"/>
  <text x="435" y="265" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">references</text>

<text x="360" y="495" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The mint is the identity. The metadata describes it. The token account holds the one copy.</text>
  <text x="360" y="515" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">"Transferring the NFT" means moving the token between token accounts. Nothing else changes.</text>
</svg>

## Metadata lives in a separate account, attached by convention

Metaplex's Token Metadata program is the de facto standard for attaching descriptive information to a mint. When someone says "an NFT," they almost always mean an SPL Token mint plus a Metaplex metadata account that points at it. The two are paired so consistently that wallets, marketplaces, and explorers expect every NFT to have both.

The metadata account is a PDA owned by the Token Metadata program, with seeds derived from the mint's pubkey. This makes the pairing automatic: given any mint address, anyone can compute where its metadata account should live and look up whether one exists. The metadata account stores the name, symbol, URI pointing at off-chain JSON, the list of creators with royalty shares, the collection the NFT belongs to, and various flags.

The URI is where the actual image lives. The metadata account is too small and too expensive to hold image bytes, so the URI points at a JSON file on Arweave or IPFS, which describes the NFT and includes another link to the actual image asset. The chain stores only a pointer to a pointer to the picture. This is fine in practice because Arweave promises permanent storage and IPFS is pinned by enough services that NFT images stay accessible.

A collection is itself an NFT that the other NFTs reference, which is how marketplaces group items together. Metaplex also defines a **Master Edition** account, which marks the mint as the original that numbered copies (Editions) can be printed from.

## Royalties cannot be enforced by the token program

The metadata account lists the creators and their royalty shares, but the token program never reads it. When an NFT is sold on a marketplace such as Magic Eden or Tensor, the marketplace's own program runs the transfer. It can also pay royalties to the creators recorded in the metadata account, but nothing in the transfer requires it. Originally, royalties were a social contract: marketplaces honored them because creators expected it. Then some marketplaces started skipping royalties to compete on fees, and the token program moved the NFTs all the same.

To enforce a royalty, a check has to sit inside the transfer itself. Metaplex responded with programmable NFTs, an extension of the Token Metadata standard that gates transfers through a ruleset. A gate works only if no transfer can go around it, so every wallet and marketplace that moves a programmable NFT has to pass the ruleset. That adds cost and complexity for every program that moves the NFT, and most collections don't use programmable NFTs. Token-2022's [transfer hook](/courses/development-on-solana/working-with-other-programs/token-2022-and-token-extensions) is another way to put a check inside every transfer, and that lesson shows what such a check costs the programs that integrate the token.

## Compressed NFTs and the rent math

The single biggest economic problem with regular Solana NFTs is rent. Every NFT is at least two new accounts on chain. At about 0.007 SOL of rent per NFT, a 10,000-item collection locks up around 70 SOL just to exist, before anyone buys anything. That's been paid by the creator at mint time and is recoverable only if NFTs are burned, which essentially never happens in practice. For collections that are minted for free or as rewards, the rent cost becomes prohibitive.

Compressed NFTs, or cNFTs, solve this with state compression. Instead of storing each NFT's data in its own account, the entire collection is represented as a Merkle tree, the structure from the airdrop example in [off-chain computation, on-chain verification](/courses/development-on-solana/production-state-design/off-chain-computation-on-chain-verification). Only the tree's root hash lives on chain, in a single account that can hold up to millions of leaves depending on its configured depth. The actual NFT data, such as names, URIs, and owners, lives off chain in indexers. When you want to prove you own a specific cNFT, you provide a Merkle proof against the on-chain root. A transfer works the same way: the transaction includes a proof showing the leaf's current state, and the cNFT program (Metaplex's Bubblegum) verifies the proof and updates the root.

<svg role="img" viewBox="0 0 720 600" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Rent math: uncompressed NFTs vs compressed cNFTs for a 10,000-item collection</title><desc>Two side-by-side panels compare on-chain rent costs. The left panel shows uncompressed regular NFTs needing 10,000 mint and metadata accounts, totaling about 70 SOL locked rent; the right panel shows compressed cNFTs stored in a single Merkle tree account, totaling about 0.1 SOL. A bottom callout notes cNFTs are about 700x cheaper, at the cost of needing an indexer to read individual NFTs back out.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Rent math for a 10,000-item collection</text>

<!-- LEFT: uncompressed -->
  <rect x="40" y="85" width="310" height="430" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="85" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="195" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">uncompressed (regular NFTs)</text>

<text x="55" y="140" font-family="monospace" font-size="10" font-weight="bold">accounts on chain:</text>
  <text x="65" y="160" font-family="monospace" font-size="10">10,000 mint accounts</text>
  <text x="80" y="174" font-family="monospace" font-size="9" fill="#565653">82 bytes each</text>
  <text x="65" y="194" font-family="monospace" font-size="10">10,000 metadata accounts</text>
  <text x="80" y="208" font-family="monospace" font-size="9" fill="#565653">~679 bytes each</text>
  <text x="65" y="228" font-family="monospace" font-size="10">+ owner token accounts</text>
  <text x="80" y="242" font-family="monospace" font-size="9" fill="#565653">created on transfer</text>

<line x1="55" y1="262" x2="335" y2="262" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="55" y="285" font-family="monospace" font-size="10" font-weight="bold">rent per NFT:</text>
  <text x="65" y="305" font-family="monospace" font-size="10" fill="#565653">~0.00146 SOL (mint)</text>
  <text x="65" y="321" font-family="monospace" font-size="10" fill="#565653">~0.00561 SOL (metadata)</text>
  <text x="65" y="337" font-family="monospace" font-size="10" font-weight="bold">~0.007 SOL total</text>

<line x1="55" y1="357" x2="335" y2="357" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="55" y="380" font-family="monospace" font-size="10" font-weight="bold">total locked rent:</text>
  <text x="195" y="415" text-anchor="middle" font-family="monospace" font-size="22" fill="#ed4937" font-weight="bold">~70 SOL</text>
  <text x="195" y="438" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">paid up front to mint the collection</text>
  <text x="195" y="452" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">recoverable only if NFTs are burned</text>

<text x="195" y="490" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">every NFT has its own pair of accounts.</text>
  <text x="195" y="503" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">costs scale linearly with collection size.</text>

<!-- RIGHT: compressed -->
  <rect x="370" y="85" width="310" height="430" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="370" y="85" width="310" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="525" y="104" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">compressed (cNFTs)</text>

<text x="385" y="140" font-family="monospace" font-size="10" font-weight="bold">accounts on chain:</text>
  <text x="395" y="160" font-family="monospace" font-size="10">1 Merkle tree account</text>
  <text x="410" y="174" font-family="monospace" font-size="9" fill="#565653">holds the root + buffer</text>
  <text x="410" y="188" font-family="monospace" font-size="9" fill="#565653">size depends on depth</text>
  <text x="395" y="212" font-family="monospace" font-size="10">leaves stored off chain</text>
  <text x="410" y="226" font-family="monospace" font-size="9" fill="#565653">indexers keep proofs</text>

<line x1="385" y1="262" x2="665" y2="262" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="385" y="285" font-family="monospace" font-size="10" font-weight="bold">rent per NFT:</text>
  <text x="525" y="320" text-anchor="middle" font-family="monospace" font-size="14" fill="#ed4937" font-weight="bold">~0.00001 SOL</text>
  <text x="525" y="338" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">spread across the tree</text>

<line x1="385" y1="357" x2="665" y2="357" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>

<text x="385" y="380" font-family="monospace" font-size="10" font-weight="bold">total locked rent:</text>
  <text x="525" y="415" text-anchor="middle" font-family="monospace" font-size="22" fill="#ed4937" font-weight="bold">~0.1 SOL</text>
  <text x="525" y="438" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">one tree, fits 16,384 cNFTs</text>
  <text x="525" y="452" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">at depth 14</text>

<text x="525" y="490" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">collection state lives in one account.</text>
  <text x="525" y="503" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653" font-style="italic">costs scale with tree depth rather than item count.</text>

<!-- Bottom callout -->
  <rect x="40" y="535" width="640" height="50" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="557" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#ed4937">~700x cheaper for the same collection size</text>
  <text x="360" y="573" text-anchor="middle" font-family="monospace" font-size="10">in exchange for needing an indexer to read individual NFTs back out</text>
</svg>

The math works because Merkle trees compress logarithmically. A tree of depth 14 can hold 16,384 NFTs in one account. A tree of depth 20 can hold over a million. The account size grows with the tree's depth rather than with the number of items in it. Rent for the tree account is typically under 1 SOL for collection sizes that would cost dozens or hundreds of SOL as regular NFTs.

The trade-off is that cNFTs cannot be read trivially from chain state alone. Reading a regular NFT means fetching two accounts and decoding them. Reading a cNFT means querying an indexer that maintains the off-chain leaf data and the proofs. A transfer depends on the indexer too, because the proof it carries has to be fetched from there first. Helius, Triton, and others provide cNFT-aware RPC endpoints that let you query a wallet's cNFTs as if they were regular NFTs.

cNFTs are common for use cases that would have been impossible with regular NFTs at scale: game items distributed to every player, achievement badges minted on action, loyalty tokens that an airline gives out by the million. They're less common for art collections in the traditional sense, where the rent is a small fraction of the mint price and the indexer dependency is a friction.

## Programs use NFTs to gate access and to represent positions

Even if you never build an NFT-centric protocol, two patterns will show up in your work.

**NFTs as access tokens.** Many Solana products gate features behind ownership of a specific collection. DAOs gate voting to collection holders this way, games unlock features for certain NFT owners, and alpha groups verify membership. Your program gets a token account and a metadata account from the user and has to tie them together. The token account's owner field must be the user's wallet, and its balance must be 1. The metadata account must be the Token Metadata PDA derived from that token account's mint. Its collection field must reference the expected collection NFT. These three checks tie the accounts to each other, but they are not a complete gate. They do not show who wrote the collection field, and this lesson has not covered who is allowed to write it. Check that in the Token Metadata documentation before you let the field decide access.

**NFTs as receipts.** Some protocols issue an NFT to represent a position: your stake in a pool, your loan in a lending market, your liquidity position in a CLMM. The NFT is the transferable handle on the position. You burn it to redeem, or sell it to transfer the position to someone else. Raydium's CLMM positions work this way, and the [CLMM lesson](/courses/development-on-solana/production-state-design/clmm) shows why a position there cannot be a fungible LP token.
