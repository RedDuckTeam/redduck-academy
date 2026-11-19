---
id: 152
title: ERC-721 and ERC-1155
type: lecture
order: 1
faq:
  - question: Should I use ERC-721 or ERC-1155?
    answer: >-
      ERC-721 for one collection of distinct items, one owner per token ID, with per-token
      metadata from tokenURI. ERC-1155 for several token types in one contract or when you
      need batch transfers, since it stores a balance per ID and holder.
  - question: Why is ERC-1155 cheaper when moving several tokens at once?
    answer: >-
      Every transaction pays 21,000 gas before doing anything. Three ERC-721 transfers pay it
      three times. safeBatchTransferFrom does all three in one transaction, and either every
      transfer happens or none do.
  - question: Can one ERC-1155 contract hold a game currency and a one-of-a-kind item?
    answer: >-
      Yes. Supply alone decides the label. An ID minted in the millions acts as currency,
      supply 1 is non-fungible, supply 50 is semi-fungible, and all of them live in
      balances[id][holder].
  - question: How do I get the list of token IDs an address owns?
    answer: >-
      Neither standard has that call. ERC-721's balanceOf returns a count, and ERC-1155's
      needs an ID you already know. ERC721Enumerable adds an on-chain index at the cost of
      storage gas on every mint and transfer. For ERC-1155, rebuild the list off-chain from
      TransferSingle and TransferBatch events.
  - question: Why did my NFT transfer to a contract revert?
    answer: >-
      The safe transfer variants call a hook on the receiver. ERC-721 calls onERC721Received,
      ERC-1155 calls onERC1155Received or onERC1155BatchReceived. A recipient without the
      right hook reverts on purpose, so tokens do not get trapped.
---

> An ERC-20 contract stores a balance per address, so it has no way to say "Alice owns this specific token and Bob owns that one." ERC-721 stores an owner per token id. ERC-1155 stores a balance per id and holder, and the other two are special cases of it.

## ERC-20 stores how many, not which one

ERC-20's storage model is one mapping, `mapping(address => uint256)`: address to balance. That's enough to represent fungible value, where every unit of the token is interchangeable. If Alice has 500 USDC and sends 100 to Bob, her balance goes to 400 and Bob's goes up by 100. The contract doesn't need to know which 100 units moved because they're identical.

This breaks the moment you want tokens to be individually addressable. A Uniswap V3 liquidity position is one example. Each position has its own price range, so two positions in the same pool are not interchangeable, and V3 issues every position as an ERC-721 token (the [Uniswap V3 lesson](/courses/development-on-ethereum/advanced-defi/uniswap-v3) covers them). A digital painting or a land parcel in a virtual world is another. You can't represent them as balance amounts because the question isn't "how many" but "which one."

## ERC-721: one id, one owner

ERC-721 inverts the mapping. Each token has a unique 256-bit ID, and the contract stores `mapping(uint256 => address)`, the address that owns each ID.

When Alice mints token 42, the contract sets `ownerOf(42) = alice`. When she transfers it to Bob, the contract sets `ownerOf(42) = bob`. There's never a question of "how much of token 42" because there's exactly one of token 42 by construction.

The core of the standard's interface:

```solidity
interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
}
```

The mapping goes from id to owner, so the contract can answer "who owns token 42" but not "what tokens does Alice own?" `balanceOf` exists, but it returns a count of how many tokens this address owns rather than the IDs themselves. The optional `ERC721Enumerable` extension adds the list, but it costs storage gas on every mint and transfer to maintain the index.

`tokenURI(tokenId)` returns a URI pointing at the token's metadata. The metadata is typically a JSON document at that URI, hosted off-chain or on IPFS. ERC-721's convention is one URI per token. That gives you per-token flexibility but means most production contracts implement a base URI plus a tokenId suffix to avoid storing thousands of strings on chain.

`approve` and `setApprovalForAll` are the two delegation mechanisms. `approve(spender, tokenId)` lets one address transfer one specific token. `setApprovalForAll(operator, true)` lets one address transfer any token the owner holds. Marketplaces use the second form because they need to list any of your tokens for sale.

## ERC-1155: many ids, balances per holder

Take a game with gold pieces, swords, and potions. Gold is fungible, so it needs an ERC-20 contract. A unique sword needs an ERC-721 contract. A potion that exists in 50 identical units is awkward in both. As an ERC-721 it becomes 50 separate ids for 50 interchangeable items, and as an ERC-20 every potion type needs a contract of its own. Moving a player's inventory to another address then takes a separate transaction for each of those contracts and for each unique item.

ERC-1155 keeps both dimensions in one mapping, `mapping(uint256 => mapping(address => uint256))`. Each tokenId has its own balance mapping, and one contract can hold many tokenIds. The storage layout looks like a two-dimensional table: id by holder, with the cell value being how many of that id this holder owns.

When you mint 1,000,000 of token 1 to Alice, the contract sets `balances[1][alice] = 1000000`. When you mint 1 of token 42 to her, it sets `balances[42][alice] = 1`. Both ids live in the same contract and follow the same storage shape, so the game doesn't need three contracts. The standard was also designed from the start with batch operations in mind: you can transfer twenty ids worth of inventory from one address to another in one transaction.

The core of its interface:

```solidity
interface IERC1155 {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
    function setApprovalForAll(address operator, bool approved) external;
}
```

`balanceOf` takes both an account and an id. It returns the holder's balance of that specific id. As with ERC-721, there's no method that returns a list of all ids the holder has. The standard expects clients to discover ids off-chain through the `TransferSingle` and `TransferBatch` event logs.

The `uri(id)` function returns a URI for the token's metadata, similar to ERC-721's `tokenURI`. The returned string can contain the literal substring `{id}`, which wallets, marketplaces, and indexers replace with the token id in lowercase hex, padded to 64 characters, before fetching, so a metadata server of your own has to accept ids in that form. This lets one URI template serve all ids in the contract.

ERC-1155 has no `name()` or `symbol()`, because a single contract might hold many unrelated token types. OpenZeppelin's `ERC1155` also doesn't track total supply per id unless you include the `ERC1155Supply` extension.

## ERC-20 and ERC-721 are special cases of ERC-1155

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>ERC-20, ERC-721, and ERC-1155 storage layouts compared</title><desc>Three side-by-side panels show each standard's balanceOf/ownerOf mapping with sample data. ERC-20 maps address to balance (no token identity), ERC-721 maps token id to owner (one owner per id), and ERC-1155 maps id and holder together to a balance (many ids in one contract).</desc>
  <rect x="20" y="30" width="210" height="36" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="125" y="54" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">ERC-20</text>
  <rect x="20" y="66" width="210" height="240" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="125" y="92" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">mapping(address =&gt; uint256)</text>
  <text x="125" y="108" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">balanceOf</text>
  <line x1="36" y1="124" x2="214" y2="124" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="36" y="148" font-family="monospace" font-size="10" fill="#000000">0xAlice</text>
  <text x="214" y="148" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">500</text>
  <text x="36" y="170" font-family="monospace" font-size="10" fill="#000000">0xBob</text>
  <text x="214" y="170" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">200</text>
  <text x="36" y="192" font-family="monospace" font-size="10" fill="#000000">0xCarol</text>
  <text x="214" y="192" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">300</text>
  <text x="125" y="230" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">balance per holder</text>
  <text x="125" y="252" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">no token identity</text>
  <rect x="255" y="30" width="210" height="36" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="54" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">ERC-721</text>
  <rect x="255" y="66" width="210" height="240" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="92" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">mapping(uint256 =&gt; address)</text>
  <text x="360" y="108" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">ownerOf</text>
  <line x1="271" y1="124" x2="449" y2="124" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="271" y="148" font-family="monospace" font-size="10" fill="#000000">id 1</text>
  <text x="449" y="148" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">0xAlice</text>
  <text x="271" y="170" font-family="monospace" font-size="10" fill="#000000">id 2</text>
  <text x="449" y="170" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">0xBob</text>
  <text x="271" y="192" font-family="monospace" font-size="10" fill="#000000">id 3</text>
  <text x="449" y="192" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">0xAlice</text>
  <text x="360" y="230" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">one owner per id</text>
  <text x="360" y="252" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">no quantity, just ownership</text>
  <rect x="490" y="30" width="210" height="36" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="595" y="54" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">ERC-1155</text>
  <rect x="490" y="66" width="210" height="240" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="595" y="90" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">mapping(uint256 =&gt;</text>
  <text x="595" y="104" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">  mapping(address =&gt; uint256))</text>
  <text x="595" y="118" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000">balanceOf</text>
  <line x1="506" y1="132" x2="684" y2="132" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="506" y="154" font-family="monospace" font-size="10" fill="#000000">id 1, 0xAlice</text>
  <text x="684" y="154" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">500</text>
  <text x="506" y="174" font-family="monospace" font-size="10" fill="#000000">id 1, 0xBob</text>
  <text x="684" y="174" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">200</text>
  <text x="506" y="194" font-family="monospace" font-size="10" fill="#000000">id 42, 0xAlice</text>
  <text x="684" y="194" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">1</text>
  <text x="506" y="214" font-family="monospace" font-size="10" fill="#000000">id 99, 0xBob</text>
  <text x="684" y="214" text-anchor="end" font-family="monospace" font-size="10" fill="#000000">10</text>
  <text x="595" y="246" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">balance per (id, holder)</text>
  <text x="595" y="268" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">many ids in one contract</text>
  <text x="360" y="340" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Each standard picks a different storage shape for ownership.</text>
</svg>

ERC-20 stores balances per holder, with no concept of token identity. ERC-721 stores an owner per id, with no concept of quantity. ERC-1155 stores both, a balance per (id, holder) pair. The first two are special cases of the third.

The other side of this is gas cost. ERC-721's mapping is shallower, so reads and writes are slightly cheaper than ERC-1155's nested mapping. The difference is small, but for high-frequency operations it can add up. ERC-1155 trades that small per-write cost for the structural benefits of batch operations.

ERC-1155 is sometimes described as supporting fungible, non-fungible, and semi-fungible tokens. The contract doesn't enforce any of the three. The label follows from how many of each id you mint.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>GameItems ERC-1155 table: fungible, non-fungible, and semi-fungible token ids</title><desc>A table lists three token ids from the GameItems ERC-1155 contract: id 1 GOLD with supply 1,000,000 held by Alice, Bob, Carol and more (fungible); id 42 SWORD_OF_DAWN with supply 1 held only by Alice (non-fungible); and id 99 POTION_LE with supply 50 held by Alice, Bob, Dave, and Eve (semi-fungible). A caption explains that all three ids share the same balances mapping, so the fungible, non-fungible, or semi-fungible label depends only on total supply.</desc>
  <rect x="20" y="20" width="680" height="36" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="44" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">Contract: GameItems (ERC-1155)</text>
  <rect x="20" y="56" width="680" height="260" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="40" y="80" font-family="monospace" font-size="10" fill="#565653">id</text>
  <text x="140" y="80" font-family="monospace" font-size="10" fill="#565653">name</text>
  <text x="300" y="80" font-family="monospace" font-size="10" fill="#565653">total supply</text>
  <text x="430" y="80" font-family="monospace" font-size="10" fill="#565653">holders</text>
  <text x="610" y="80" font-family="monospace" font-size="10" fill="#565653">flavor</text>
  <line x1="30" y1="90" x2="690" y2="90" stroke="#565653" stroke-width="1"/>
  <text x="40" y="114" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">1</text>
  <text x="140" y="114" font-family="monospace" font-size="11" fill="#000000">GOLD</text>
  <text x="300" y="114" font-family="monospace" font-size="11" fill="#000000">1,000,000</text>
  <text x="430" y="114" font-family="monospace" font-size="10" fill="#000000">Alice 500</text>
  <text x="510" y="114" font-family="monospace" font-size="10" fill="#000000">Bob 200</text>
  <text x="430" y="130" font-family="monospace" font-size="10" fill="#000000">Carol 100</text>
  <text x="510" y="130" font-family="monospace" font-size="10" fill="#565653" font-style="italic">... many more</text>
  <text x="610" y="114" font-size="11" fill="#ed4937" font-style="italic">fungible</text>
  <line x1="30" y1="156" x2="690" y2="156" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="40" y="184" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">42</text>
  <text x="140" y="184" font-family="monospace" font-size="11" fill="#000000">SWORD_OF_DAWN</text>
  <text x="300" y="184" font-family="monospace" font-size="11" fill="#000000">1</text>
  <text x="430" y="184" font-family="monospace" font-size="10" fill="#000000">Alice 1</text>
  <text x="610" y="184" font-size="11" fill="#ed4937" font-style="italic">non-fungible</text>
  <line x1="30" y1="216" x2="690" y2="216" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="40" y="244" font-family="monospace" font-size="12" fill="#000000" font-weight="bold">99</text>
  <text x="140" y="244" font-family="monospace" font-size="11" fill="#000000">POTION_LE</text>
  <text x="300" y="244" font-family="monospace" font-size="11" fill="#000000">50</text>
  <text x="430" y="244" font-family="monospace" font-size="10" fill="#000000">Alice 10</text>
  <text x="510" y="244" font-family="monospace" font-size="10" fill="#000000">Bob 20</text>
  <text x="430" y="260" font-family="monospace" font-size="10" fill="#000000">Dave 15</text>
  <text x="510" y="260" font-family="monospace" font-size="10" fill="#000000">Eve 5</text>
  <text x="610" y="244" font-size="11" fill="#ed4937" font-style="italic">semi-fungible</text>
  <text x="360" y="304" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">All three live in the same balances mapping. The label depends only on supply.</text>
  <text x="360" y="346" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">Fungibility in ERC-1155 emerges from supply alone.</text>
</svg>

A tokenId with a supply in the millions, spread across many holders, behaves like a fungible token. That is GOLD in the table. SWORD_OF_DAWN has a supply of one and is non-fungible, because only one address can hold it at a time. POTION_LE has a supply of 50 and is semi-fungible: the 50 units are interchangeable within their id but distinct from other ids. The contract has no idea which category an id falls into. It stores `balances[id][holder]` for all of them, and the same code path that moves your gold can move your sword.

## One batch transaction moves many ids

ERC-1155 ships with `safeBatchTransferFrom`, which ERC-721 doesn't have, and the OpenZeppelin implementation adds `_mintBatch` and `_burnBatch` internal functions. All three take arrays of ids and amounts and process them in a single transaction.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>ERC-721 three separate transferFrom calls vs ERC-1155 one batch transaction</title><desc>ERC-721 needs three separate transactions, each calling transferFrom with one token id, so base transaction overhead is paid three times. ERC-1155 moves the same tokens with a single safeBatchTransferFrom call carrying arrays of ids and amounts, paying that overhead only once.</desc>
  <rect x="20" y="20" width="680" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">ERC-721: three separate transactions</text>
  <rect x="20" y="52" width="680" height="130" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="74" width="200" height="68" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="140" y="92" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">tx 1</text>
  <line x1="56" y1="100" x2="224" y2="100" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="140" y="118" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">transferFrom(</text>
  <text x="140" y="132" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">alice, bob, 42)</text>
  <rect x="260" y="74" width="200" height="68" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="92" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">tx 2</text>
  <line x1="276" y1="100" x2="444" y2="100" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="118" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">transferFrom(</text>
  <text x="360" y="132" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">alice, bob, 43)</text>
  <rect x="480" y="74" width="200" height="68" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="580" y="92" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">tx 3</text>
  <line x1="496" y1="100" x2="664" y2="100" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="580" y="118" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">transferFrom(</text>
  <text x="580" y="132" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">alice, bob, 44)</text>
  <text x="360" y="166" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">base transaction overhead paid three times</text>
  <rect x="20" y="210" width="680" height="32" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="232" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">ERC-1155: one batch transaction</text>
  <rect x="20" y="242" width="680" height="130" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="264" width="640" height="68" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="360" y="282" text-anchor="middle" font-family="monospace" font-size="11" fill="#000000" font-weight="bold">tx 1</text>
  <line x1="56" y1="290" x2="664" y2="290" stroke="#565653" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="360" y="308" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">safeBatchTransferFrom(</text>
  <text x="360" y="322" text-anchor="middle" font-family="monospace" font-size="10" fill="#000000">alice, bob, [42, 43, 44], [1, 1, 1], "")</text>
  <text x="360" y="356" text-anchor="middle" font-size="11" fill="#565653" font-style="italic">base transaction overhead paid once</text>
  <text x="360" y="392" text-anchor="middle" font-size="12" fill="#565653" font-style="italic">ERC-1155 folds many token movements into a single transaction.</text>
</svg>

Every Ethereum transaction has a base cost of 21,000 gas, regardless of what it does. On top of that you pay for whatever the transaction's code consumes. If you're transferring three NFTs from Alice to Bob using ERC-721, you pay 21,000 base gas three times, 63,000 in total, plus the per-transfer execution cost. With ERC-1155's batch transfer, you pay the base cost once. The batch of three saves 42,000 gas of base cost, and every further token in the batch saves another 21,000.

A batch is also atomic. With three separate ERC-721 transfers, any one could revert independently. The first two might succeed and the third might fail, leaving you in a half-applied state. ERC-1155's batch is one transaction, so either all the transfers happen or none do. A bundle of game items needs that, because partial fulfillment would corrupt the user's inventory.

## What safe transfers and operator approvals cost

Both standards have a `safeTransferFrom` variant that calls a hook on the receiving contract. ERC-721 calls `onERC721Received`, and ERC-1155 calls `onERC1155Received` or `onERC1155BatchReceived`. If the recipient is a contract that doesn't implement the right hook, the transfer reverts. That prevents tokens from being trapped in contracts that have no logic to handle them.

The hook is an external call. During the transfer the token contract runs the recipient's code, and that code can call back into the contract that started the transfer. If your contract makes a safe transfer before it has finished updating its own state, it has the bug from the [reentrancy lesson](/courses/development-on-ethereum/token-security-and-evm-internals/reentrancy-and-denial-of-service). The defenses are the same: update state before the call, and add a reentrancy guard.

`setApprovalForAll` is the same trade as the unlimited allowance in the [ERC-20 lesson](/courses/development-on-ethereum/token-security-and-evm-internals/what-is-erc-20). The operator can move every token the owner holds in that contract at any time, so a vulnerability in the operator contract, or an approval given to the wrong address, loses all of them. ERC-721 lets you narrow the grant to one token with `approve`. ERC-1155 has only `setApprovalForAll`, so revoking access from a single item means revoking the entire operator's authority.

## Picking between them

You want ERC-721 when each token has its own identity and the project is one collection of similar but distinct items, such as a PFP project, a 1-of-1 art piece, or a registry of named items. The per-id metadata is the point. You also want it when on-chain enumeration of "what does this address own" matters, since the `ERC721Enumerable` extension gives you that.

You want ERC-1155 when you have multiple token types from the start, or when batch operations are part of the design. That covers game inventories with currencies, weapons, and consumables, event ticketing where different tiers are different ids but tickets within a tier are interchangeable, airdrops where you'll be doing many transfers at once, and multi-asset marketplaces where one contract needs to handle a long tail of token types.

Some projects use both: a flagship ERC-721 collection for the headline assets, with an ERC-1155 alongside for accessories, consumables, or fractional editions.

The choice is rarely about gas alone. For a small collection with infrequent transfers, the savings from ERC-1155's batch operations don't matter. If you're unsure, sketch the storage layout in pseudocode before picking the standard, and ask which sentence describes your tokens: "a registry of unique items" or "balances across many item types."
