---
id: 1441543678
title: The factory pattern and content-derived identity
type: lecture
order: 2
faq:
  - question: How can two people arrive at the same identifier without coordinating?
    answer: The identifier is computed from the object's content and nothing else, so
      anyone who holds the same content runs the same computation and gets the same
      result. No message passes between them, and no shared table is consulted.
      Matching inputs produce matching identifiers every time.
  - question: Why is a content-derived identifier stronger than a registry entry?
    answer: A registry entry has to be trusted, because a consumer takes the mapping
      on the registry's word and is deceived if the registry is wrong or tampered
      with. A content-derived identifier is recomputed by each consumer from content
      it already holds, so there is nothing to trust and nothing for an attacker to
      corrupt in the middle. The guarantee comes from a computation anyone can
      repeat rather than from an authority anyone has to believe.
  - question: What happens if the content changes?
    answer: The identifier changes with it. This makes any substitution detectable,
      since altered content no longer matches its original identifier. It also means
      you cannot keep one identifier while changing what it points to, so a
      content-derived identifier is the wrong choice when you need a stable name for
      something whose content will change.
---

> When one part of a system creates many instances of the same kind of thing, other parts have to find a specific instance and trust that they have the right one. The usual answer is a registry, a lookup table someone keeps. A stronger answer is to derive each instance's identifier from its own content, so anyone can recompute the identifier and check it, with no registry to query and no keeper to trust.

## Finding and trusting one instance among many

A system creates many instances of the same kind of object. Whatever they are, some other component now has to find a specific one and be sure it has the right one and not a substitute.

The obvious approach is a registry, a central lookup table that maps a name to the instance, kept current by someone. It works, and it carries three standing costs. It must be queried, so every consumer has to reach it. It must be kept current, so someone owns the job of updating it. And it must be trusted, because if the registry is wrong, or out of date, or tampered with, every consumer that believed it is deceived at once. The registry becomes a thing everyone has to trust, and a thing an attacker would like to control.

## The factory names what it makes

The component that creates all those instances has a name. It is a **factory**: a single place that produces every instance of a kind, so they are all built the same way instead of being assembled by hand wherever one happens to be needed. Because the factory is the one place each instance comes from, it is also the natural place to decide how an instance is named. It can hand every instance a name from a central registry, or it can derive each instance's identifier from the instance's own content. That second choice, a **content-derived identifier**, removes a dependency the first one cannot.

## Let the content name itself

A content-derived identifier needs no registry at all.

Git does exactly this. A commit's identifier is a hash of the commit's content and its history: the files, the message, the author, and the identifier of the commit before it. No server assigns the identifier and no table stores it. Each party computes it directly from the commit's content. Anyone holding the commit can run the same computation and get the same identifier, and if the two match, the commit is genuine.

Two things follow, and they are the whole point. Two independent parties always derive the same identifier for the same content, because the identifier is a function of the content and nothing else. And no party can substitute different content under the same identifier, because changing any part of the content changes the identifier it produces. There is no registry to query and no authority to trust. The check is something each party does for itself, from material it already holds.

The same idea runs a deduplicating backup system. Every file is stored under a name computed from its contents, so two identical files anywhere on the system produce the same name and are kept only once. No index records which files happen to match. The shared name falls out of the shared content, exactly as it does for a commit.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Deriving an identifier from content and verifying it without a registry</title><desc>A commit's content is run through a hash to produce its identifier. Any party holding the same content recomputes the same identifier, so two independent parties agree without a registry or an authority. Changing any part of the content changes the identifier, which makes a substitution detectable.</desc>
  <defs>
    <marker id="down2" viewBox="0 0 10 10" refX="5" refY="9" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 5 10 L 10 0 z" fill="#565653"/>
    </marker>
  </defs>
  <text x="360" y="28" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">An identifier computed from content</text>

  <rect x="200" y="46" width="320" height="66" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="72" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Commit content</text>
  <text x="360" y="94" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">files · message · author · parent id</text>

  <line x1="360" y1="112" x2="360" y2="146" stroke="#565653" stroke-width="2" marker-end="url(#down2)"/>
  <text x="372" y="134" font-family="monospace" font-size="9" fill="#565653">hash</text>

  <rect x="200" y="148" width="320" height="66" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="360" y="174" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Identifier</text>
  <text x="360" y="196" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">9f2a4c1b… a hash of the content above</text>

  <line x1="360" y1="214" x2="360" y2="248" stroke="#565653" stroke-width="2" marker-end="url(#down2)"/>
  <text x="372" y="236" font-family="monospace" font-size="9" fill="#565653">anyone recomputes</text>

  <rect x="140" y="250" width="440" height="70" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="278" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Two independent parties hash the same content</text>
  <text x="360" y="300" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">and get the same identifier, with no registry to trust</text>

  <text x="360" y="342" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">Change one byte of the content and the identifier no longer matches.</text>

  <text x="360" y="368" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">The identifier is derived from the content, so anyone can recompute and verify it.</text>
</svg>

## Why the registry was never needed

This is the [**Irrelevance Principle**](/courses/engineering-principles/relevance-and-genericity/the-irrelevance-principle), applied to identity. The registry looked essential, but it is irrelevant, because the identifier is derivable from inputs you already have. Once the identifier can be computed from the content, the lookup table that used to map names to instances has nothing left to do. You have removed the thing that had to be trusted. The registry is gone, and with it the question of whether to believe it.

## The limitation, stated exactly

A content-derived identifier is only as good as its inputs, and this cuts both ways.

If the content changes, the identifier changes. That is a feature, because it means substitution is always detectable. Change one byte of the commit and its identifier no longer matches, so a tampered commit announces itself. It is also a constraint, because you cannot keep an identifier while changing what it points to. An identifier derived from content cannot outlive that exact content. If you need a stable name for a thing whose content will change, a content-derived identifier is the wrong tool, and no amount of care changes that. The guarantee it gives is precise and narrow: this identifier belongs to exactly this content, and to nothing else.

## Recompute before you trust

If a design calls for a registry so one component can find and trust another, ask whether the identifier could instead be computed from content both sides already have. If it can, the registry disappears, and with it the job of keeping it current and the risk of it lying. Hand someone the content and they can derive the identifier themselves and confirm it matches, with nobody in the middle to believe. Where that is possible, it is a stronger guarantee than any table an authority maintains, because it replaces trust in a keeper with a computation anyone can repeat.

## Blockchain application

Skip this section if you only want the principle.

Ethereum's CREATE2 applies content-derived identity to deploying contracts. A contract's address is derived from the address of the deployer, a chosen value called a salt, and the hash of the contract's bytecode. Because the address is a function of those inputs, it can be computed before the contract exists and verified afterward without consulting any registry. Uniswap v2 relies on this. Anyone can compute the address of the pair contract for two tokens directly from the two token addresses, then check that the contract at that address is the real one. The ERC8009 design, examined in depth in [the clear signing module](/courses/development-on-ethereum/clear-signing/blind-signing-and-the-bybit-hack), gives its single shared contract one deterministic canonical address on each chain. That fixed address is what lets hardware wallet firmware hardcode it and verify it.
