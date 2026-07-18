---
id: 1238731366
title: The singleton pattern
type: lecture
order: 1
faq:
  - question: When is a singleton the wrong choice?
    answer: When the shared component's logic still changes often, when the review
      behind it is no better than the review the separate copies would get, or when
      the promised simplicity cannot be pointed to. In those cases you have built a
      single point of failure without the concentrated scrutiny that makes one
      shared component safe.
  - question: Doesn't putting everything behind one component make the system more fragile?
    answer: It concentrates the risk, so a critical bug in the shared component now
      reaches everything that depends on it. The trade is worth taking only when
      that component gets far more review than the many separate copies would, so a
      bug is more likely to be caught before anything relies on it. Concentrated
      risk and concentrated review are accepted together.
  - question: What is single sign-on?
    answer: It is one shared authentication service that every application delegates
      login to, so a person signs in once and reaches every connected application
      without signing in again. Passwords are stored in one place, and a security
      fix is applied once rather than repeated across every application.
---

> A **singleton** concentrates one critical function into a single shared component that everything else depends on. The name comes from keeping exactly one of a thing where a system might otherwise have had many. This costs you something real, because a bug in that one component now reaches everything at once, where before a bug reached one thing. You accept the cost because concentrating the function in one place also concentrates the review effort on it, and one heavily-reviewed component can be safer than fifty lightly-reviewed ones.

## What fifty login systems cost

A company runs fifty internal applications. Different teams built them at different times, and each one implements its own login. Each stores its own copy of every employee's password. Each has its own bugs in how it checks a password. Each has to be secured on its own.

Look at the cost from three directions. An employee now carries fifty passwords and reuses them out of fatigue, which spreads one leak across many systems. A researcher finds a flaw in how passwords are verified, and the fix has to be written and applied fifty times, once per application, and one team missing the change leaves the hole open. And every one of those fifty password stores is a separate thing an attacker can go after, so the ground you have to defend grows with every application you add.

## One service everything trusts

The fix is to pull login out of the fifty applications and put it in one place. One shared authentication service. Every application hands the job of checking who you are to that service and trusts the answer. This is single sign-on, the thing that lets you sign in once at work and reach every internal tool without signing in again.

Now count the same three costs. Passwords are stored once, in one service, so there is one store to defend instead of fifty. A flaw in how passwords are verified is fixed once, in one place, and every application gets the fix the moment that service is updated. Each application integrates against one well-known, stable endpoint, so a new application joins by pointing at the same service every other application already uses.

The same shape appears at the scale of the whole internet. When your browser opens a secure connection to a website, it needs to be sure the site is really who it claims to be. Millions of websites rely on a small number of trusted certificate authorities to vouch for that, rather than every pair of parties arranging trust between themselves from scratch. A small, heavily-trusted set of authorities stands in the middle, and everyone else depends on them. The web keeps that number small on purpose, because concentrating trust in a few closely-watched places is safer than spreading it thin across many.

<svg role="img" viewBox="0 0 720 330" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Fifty separate login systems versus one shared authentication service</title><desc>Two panels. On the left, fifty applications each carry their own login and password store, so one security fix must be applied fifty times. On the right, every application delegates login to one shared authentication service, so passwords are stored once and one fix reaches all of them.</desc>
  <defs>
    <marker id="arrowR" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
    </marker>
  </defs>
  <text x="360" y="30" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">Fifty login systems, or one shared service</text>

  <rect x="40" y="55" width="300" height="215" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="55" width="300" height="30" fill="#565653" stroke="#000000" stroke-width="2"/>
  <text x="190" y="75" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">Before: every app logs in itself</text>
  <text x="60" y="115" font-family="monospace" font-size="10" fill="#000000">App A  ·  own login + passwords</text>
  <text x="60" y="140" font-family="monospace" font-size="10" fill="#000000">App B  ·  own login + passwords</text>
  <text x="60" y="165" font-family="monospace" font-size="10" fill="#000000">App C  ·  own login + passwords</text>
  <text x="60" y="190" font-family="monospace" font-size="10" fill="#565653">… 47 more, each the same</text>
  <line x1="60" y1="210" x2="320" y2="210" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="190" y="235" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">50 stores to defend</text>
  <text x="190" y="253" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">one fix, applied 50 times</text>

  <rect x="380" y="55" width="300" height="215" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="55" width="300" height="30" fill="#ed4937" stroke="#ed4937" stroke-width="2"/>
  <text x="530" y="75" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">After: one shared service</text>
  <text x="405" y="120" font-family="monospace" font-size="10" fill="#000000">App A</text>
  <text x="405" y="150" font-family="monospace" font-size="10" fill="#000000">App B</text>
  <text x="405" y="180" font-family="monospace" font-size="10" fill="#000000">App C</text>
  <text x="405" y="208" font-family="monospace" font-size="10" fill="#565653">… 47 more</text>
  <line x1="450" y1="116" x2="556" y2="146" stroke="#565653" stroke-width="2" marker-end="url(#arrowR)"/>
  <line x1="450" y1="146" x2="556" y2="158" stroke="#565653" stroke-width="2" marker-end="url(#arrowR)"/>
  <line x1="450" y1="176" x2="556" y2="170" stroke="#565653" stroke-width="2" marker-end="url(#arrowR)"/>
  <rect x="558" y="118" width="104" height="84" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <text x="610" y="150" text-anchor="middle" font-size="10" fill="#000000" font-weight="bold">Auth</text>
  <text x="610" y="166" text-anchor="middle" font-size="10" fill="#000000" font-weight="bold">service</text>
  <text x="610" y="186" text-anchor="middle" font-family="monospace" font-size="8" fill="#565653">one store</text>
  <text x="530" y="253" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">one store · one fix · one endpoint</text>

  <text x="360" y="305" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">Concentrating login in one service also concentrates the review that keeps it safe.</text>
</svg>

## The risk you just concentrated

Something was traded away here, and it is worth naming plainly. Before, a bug in one application's login reached that one application. Now a critical bug in the shared authentication service reaches all fifty at once. The certificate authority is the same story. If one of those few authorities is compromised, a large slice of the web is exposed through it.

That concentrated risk is the whole reason a shared authentication service and a certificate authority receive the most intensive security review of any component in their ecosystem. The concentration of risk and the concentration of review effort are the same decision. You are choosing to put the critical function where the most eyes are on it. A bug there is more likely to be found before it reaches anyone, and less likely to survive once the whole system depends on the code being right.

## Which goal each part serves

The **parent goal** and **child goal** from [What engineering is and is not](/courses/engineering-principles/design-tradeoffs/what-engineering-is-and-is-not) make this tradeoff easy to read. Storing passwords once and giving every application one stable endpoint to integrate against are child goals: operational efficiency and integration simplicity. Keeping accounts safe is the parent goal above them. A single shared login service is correct only because the concentrated review keeps that parent goal satisfied while the child goals improve. If the concentration made accounts less safe on the whole, the efficiency underneath would not matter, because it would be serving a parent goal that is no longer being met.

## When making something shared is the right call

A singleton is the right choice when three things hold.

- The component's logic is stable enough to be relied on without frequent change. A part that everything depends on should not be a part that keeps changing.
- The safety of one heavily-reviewed component genuinely exceeds the safety of many less-reviewed ones. This is what you are buying, and it has to be real.
- The integration-simplicity benefit is real and measurable. Every application reaching one known endpoint is worth something you can point to rather than a vague sense of tidiness.

When these hold, concentrating the function is a good trade. When the logic is still churning, or the review would be no better than before, or the simplicity is imaginary, you are just building a single point of failure and calling it a pattern.

## Before you make something shared

Before you pull a function into one shared component, say out loud what everything will now depend on, and ask whether that component can carry the weight. A shared thing is only as safe as the review behind it, so the decision to centralize is also a decision to concentrate your review effort there. If you are not prepared to give that one component more scrutiny than anything around it, the fifty separate copies, for all their waste, may still be the safer arrangement.

## Blockchain application

Skip this section if you only want the principle.

Decentralized finance uses the singleton deliberately. Balancer v2 puts a single contract, the Vault, in charge of holding all of the assets across every pool at once. Because one contract holds all the tokens, a trade that hops through several pools settles inside the Vault and the tokens themselves move only once, which greatly reduces the cost of the trade. Uniswap v4 takes the same route, holding all of its pools inside one PoolManager contract. The ERC8009 design, examined in depth in the ERC8009 course, deploys one balance-proxy contract per chain so that hardware wallet firmware can hardcode a single address and trust it. The single-vault decision concentrates risk deliberately, accepted for those measured benefits and paid for with unusually heavy auditing.
