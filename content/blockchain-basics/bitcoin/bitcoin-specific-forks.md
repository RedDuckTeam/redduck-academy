---
id: 89
title: Bitcoin-specific forks
type: lecture
order: 5
faq:
  - question: What is the difference between a soft fork and a hard fork?
    answer: >-
      A soft fork only tightens the rules, so old nodes keep accepting new blocks and the
      chain stays whole. A hard fork produces blocks old nodes reject, and the chain splits
      if both sides keep mining.
  - question: What did SegWit fix?
    answer: >-
      Transaction malleability. Anyone could rewrite a signed transaction's signature so it
      stayed valid but carried a different transaction ID, which broke software that tracked
      transactions by ID and blocked the Lightning Network. SegWit moved signatures out of
      the ID calculation and made room for more transactions per block, activating in August
      2017.
  - question: Do miners decide Bitcoin's rules?
    answer: >-
      No. Miners produce blocks, but node operators decide which blocks count as valid, and
      exchanges, custodians, and large merchants run the ones that matter. In 2017 users ran
      software set to reject blocks that did not signal for SegWit, and miner support jumped
      within weeks.
  - question: Where do fork airdrops like Bitcoin Cash come from?
    answer: >-
      Shared history. Both chains hold every block up to the split, so the key that
      controlled your BTC controls the same amount of BCH on the new chain.
  - question: Has Bitcoin upgraded successfully since the SegWit fight?
    answer: >-
      Yes. Taproot activated in November 2021 with broad agreement and no drama, roughly
      four years after the ideas behind it were proposed.
---

## Soft fork, hard fork

A **soft fork** is a backwards-compatible change. The new rules are stricter than the old ones, so anything that’s valid under the new rules is still valid under the old ones.

A **hard fork** is a change that the old rules don’t accept. Blocks valid under the new rules look broken to old nodes. If both groups have miners, the chain splits into two.

The next three stories are: two successful soft forks, SegWit and Taproot, and one hard fork, Bitcoin Cash, that split the network in two.

<svg role="img" viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Bitcoin timeline: SegWit and Taproot soft forks, Bitcoin Cash hard fork</title><desc>A timeline runs from Bitcoin's launch in 2009 to 2021. Soft forks, SegWit (2017) and Taproot (2021), sit above the line, while the Bitcoin Cash hard fork (2017) sits below, showing where the chain split</desc>
<text x="360" y="30" text-anchor="middle" font-size="13" fill="#000000" font-weight="bold">Three real Bitcoin upgrades</text>

<text x="180" y="80" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">soft forks (everyone stays on one chain) sit above</text>
<text x="180" y="200" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">hard forks (the chain can split) sit below</text>

<line x1="40" y1="140" x2="680" y2="140" stroke="#000000" stroke-width="2"/>

<circle cx="80" cy="140" r="6" fill="#000000"/>
  <text x="80" y="170" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">2009</text>
  <text x="80" y="185" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">Bitcoin launches</text>

<line x1="370" y1="140" x2="370" y2="115" stroke="#ed4937" stroke-width="2"/>
  <circle cx="370" cy="140" r="6" fill="#ed4937"/>
  <text x="370" y="105" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">SegWit</text>
  <text x="370" y="90" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">2017 · soft fork</text>

<line x1="445" y1="140" x2="445" y2="220" stroke="#ed4937" stroke-width="2"/>
  <circle cx="445" cy="140" r="6" fill="#ed4937"/>
  <text x="445" y="240" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Bitcoin Cash split</text>
  <text x="445" y="255" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">2017 · hard fork</text>

<line x1="600" y1="140" x2="600" y2="115" stroke="#ed4937" stroke-width="2"/>
  <circle cx="600" cy="140" r="6" fill="#ed4937"/>
  <text x="600" y="105" text-anchor="middle" font-size="12" fill="#000000" font-weight="bold">Taproot</text>
  <text x="600" y="90" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">2021 · soft fork</text>
</svg>

## SegWit (2017): the upgrade that almost didn't happen

By 2016, Bitcoin had a known bug. Anyone watching the network could grab a signed transaction and slightly rewrite the signature in a way that kept it valid but changed the transaction’s ID. The coins still went to the right place, but downstream software that tracked transactions by ID got confused. The Lightning Network, which was being designed around the same time, depended on stable transaction IDs and couldn’t work until this bug was fixed.

The fix was an upgrade called SegWit. It restructured how signatures were stored so that they no longer affected the transaction ID. It also made room for more transactions per block as a side benefit. The change was technically a soft fork, meaning old nodes would keep working without trouble.

However, there was a problem: some of the biggest mining operations didn’t want SegWit to activate, for political reasons. The activation mechanism required a supermajority of miners to signal support, so for most of 2017, SegWit was ready but stuck.

Then a movement of regular users acted on their own. They started running modified software that promised to reject any block that didn’t signal support for SegWit, starting on a specific date. If miners kept blocking SegWit past that date, those miners’ blocks would be ignored by a large part of the network, including most exchanges and big businesses. Their freshly mined bitcoin wouldn’t matter to the people they wanted to sell to.

Within weeks of the deadline being announced, miner signaling jumped from a fraction to nearly all of them, and SegWit activated in August 2017.

Miners produce blocks, but they don’t decide what counts as a valid block. That’s decided by the people running nodes, especially the ones connected to exchanges, custodians, and big merchants. When miners and nodes disagree, miners eventually have to give in, because they need someone to buy their bitcoin.

## Bitcoin Cash (2017): when consensus breaks

Not everyone wanted SegWit. A group of miners and developers thought Bitcoin should scale differently, by simply allowing bigger blocks. SegWit gave a modest capacity increase as a side effect. They wanted a much larger one as the main feature.

That disagreement was deep enough that no compromise emerged. On the same day SegWit’s user-imposed deadline was scheduled, the group that disagreed launched their own version of Bitcoin with bigger blocks. They called it **Bitcoin Cash**.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Bitcoin hard fork splitting into Bitcoin (BTC) and Bitcoin Cash (BCH)</title><desc>A shared history box leads to a last shared point, which then splits into two paths: Bitcoin (BTC), where old rules continue, and Bitcoin Cash (BCH), a new chain with new rules. Notes explain that both chains share the same history up to the split and diverge forever after, and anyone holding 1 BTC at the split also held 1 BCH on the new chain.</desc>
<defs>
<marker id="arr45" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto">
<path d="M 0 0 L 10 5 L 0 10 z" fill="#565653"/>
</marker>
</defs>

<text x="360" y="25" text-anchor="middle" font-size="14" fill="#000000" font-weight="bold">A chain splits in two</text>

<rect x="40" y="100" width="120" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="100" y="125" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">shared history</text>

<line x1="160" y1="120" x2="200" y2="120" stroke="#565653" stroke-width="2" marker-end="url(#arr45)"/>

<rect x="200" y="100" width="100" height="40" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="250" y="125" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">last shared</text>

<line x1="300" y1="115" x2="340" y2="85" stroke="#565653" stroke-width="2" marker-end="url(#arr45)"/>
  <line x1="300" y1="125" x2="340" y2="170" stroke="#565653" stroke-width="2" marker-end="url(#arr45)"/>

<rect x="340" y="60" width="240" height="50" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="460" y="80" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">Bitcoin (BTC)</text>
  <text x="460" y="98" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">old rules continue</text>

<line x1="580" y1="85" x2="660" y2="85" stroke="#565653" stroke-width="2" stroke-dasharray="4 2"/>

<rect x="340" y="160" width="240" height="50" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="460" y="180" text-anchor="middle" font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">Bitcoin Cash (BCH)</text>
  <text x="460" y="198" text-anchor="middle" font-family="monospace" font-size="10" fill="#ffffff">new chain, new rules</text>

<line x1="580" y1="185" x2="660" y2="185" stroke="#ed4937" stroke-width="2" stroke-dasharray="4 2"/>

<text x="360" y="245" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Up to the split, both chains share the same history. After, they diverge forever.</text>
<text x="360" y="263" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Anyone holding 1 BTC at the split moment also held 1 BCH on the new chain.</text>
</svg>

After the split, the two networks operate independently and never reconnect. The same private key that controlled your BTC now also controls an equal amount of BCH. This is what “fork airdrops” are: an automatic consequence of a hard fork.

Years later, Bitcoin’s market value is roughly a hundred times bigger than Bitcoin Cash’s. The market made its choice, but the BCH chain is still running and still has users. In a decentralized system, you can’t force people to agree because if they don’t, they leave with a copy.

## Taproot (2021): a smooth upgrade

After the SegWit fight, many people predicted Bitcoin would never be able to upgrade itself again without another community split. Taproot proved them wrong.

Taproot is a technical upgrade that improved Bitcoin’s privacy and made certain advanced spending conditions cheaper. The community broadly agreed it was a good idea, and miners signaled support without a fight. It locked in within months of being proposed for activation and went live in November 2021.

What Taproot shows is that Bitcoin’s upgrade process is slow, but it works: when a change is well-designed and the community broadly agrees, the protocol evolves.

The cost is time. The ideas behind Taproot were first described years before activation, and from the original idea to deployment took roughly four years. Other software platforms release comparable features in months. This is a deliberate trade. The protocol settles hundreds of billions of dollars of value. If it could be changed quickly, it could be broken quickly too.
