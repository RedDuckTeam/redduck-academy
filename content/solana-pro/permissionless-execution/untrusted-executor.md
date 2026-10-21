---
title: Untrusted executor
type: lecture
order: 10
faq:
  - question: What is an untrusted executor?
    answer: >-
      Whoever sends the transaction that runs a protocol's background job, such as paying
      rewards or liquidating a loan. Untrusted means it can be anyone. The protocol pays them
      for the job, and the instruction sends the result to the same place whoever calls it,
      so the protocol never needs to know who they are.
  - question: My protocol has to distribute rewards every day. Do I have to run a keeper bot?
    answer: >-
      No. Let anyone call the instruction, make sure the result does not depend on the caller,
      and pay the caller enough to cover their fees. Other people will then run bots for you,
      and your own bot can still run as one of them.
  - question: Why can anyone call Helium's claim instruction for someone else's device?
    answer: >-
      Because the tokens always go to the device owner. Oracles sign the total reward the
      device has earned, the device's account stores how much was already paid, and the
      instruction pays only the difference. A stranger who calls it only pays the fee.
  - question: How does Symmetry V3 decide how much to pay a bot for a rebalance?
    answer: >-
      It doesn't choose a number. It offers the rebalance trade as a Dutch auction where the
      bot's reward grows every slot, and the first bot to accept takes the trade.
  - question: Who liquidates positions on Drift, Marginfi and Kamino?
    answer: >-
      Independent bots. Each liquidation pays the liquidator a reward taken from the failed
      position, usually collateral at a discount.
  - question: What is tuktuk?
    answer: >-
      Helium's task scheduler on Solana. A task is an account with a prepaid reward and a
      condition for when it may run. Once the condition is met, anyone can run it and take
      the reward, and a task can create the next task, so a repeating job keeps going.
---

> Nothing on Solana runs by itself, so every background job in a protocol needs someone to send a transaction and pay for it. Instead of running that bot yourself, you can pay for the job and let anyone do it. This works only if the result is the same no matter who sends the transaction.

## Someone has to send the transaction

Remember the first constraint from the [constraints lecture](/courses/solana-pro/welcome/constraints-behind-patterns). Nothing happens by itself. A program cannot start running on its own. Paying rewards, settling trades, liquidating a loan and executing a proposal after a vote all need someone to build a transaction, sign it and pay its fee. That someone is the **executor**.

The simplest approach is to be the executor yourself. You run a bot, also called a keeper, on your own server. It watches the protocol and sends the transactions when they are due. It works on day one, but now the protocol lives exactly as long as your server does. If the server goes down, the bot's key leaks, or its wallet runs out of SOL for fees, the job stops. If the team leaves, the protocol stops with it. That goes against the idea of decentralization, which is the initial core idea behind on-chain protocols.

## Just make the job profitable

A better option is to utilize game theory. Suppose every call to the job pays the executor of the call a small reward. Users will find it out and start writing their own bots to call it to earn rewards. It's pretty reasonable to assume that users want to make extra money, so it's also reasonable to assume that many different users would run such bots, and the job would no longer depend on a single executor.

The reward could be small, as long as it covers what the bot owner spent on the transaction fees and hosting expenses. Bots race for the same reward, and the losers' transactions fail but usually still pay fees, so the reward has to take into calculation that risk too. If the reward is reasonable and considers all these points at minimum, the protocol will definitely get the independent executors. If bot A goes offline, bot B sends the transaction instead, and nobody has to organize this.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>Your own bot versus a paid job</title><desc>Two boxes side by side. The left box shows a single team bot sending transactions to the protocol, which stops if the server goes down, the key leaks or the team leaves. The right box shows three independent bots competing to send the same transaction to a protocol that pays a reward, where the first valid transaction takes the reward and any bot can replace another that goes offline.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">Who keeps the job running</text>

  <rect x="40" y="80" width="300" height="230" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="80" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="190" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">Your own bot</text>
  <rect x="65" y="140" width="100" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="115" y="162" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">team bot</text>
  <rect x="215" y="140" width="100" height="36" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="265" y="162" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">protocol</text>
  <line x1="166" y1="158" x2="206" y2="158" stroke="#000000" stroke-width="2"/>
  <polygon points="204,152 204,164 214,158" fill="#000000"/>
  <text x="190" y="210" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">1 server, 1 key, 1 fee wallet</text>
  <text x="190" y="236" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">server down: job stops</text>
  <text x="190" y="256" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">key leaks: job stops</text>
  <text x="190" y="276" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">team leaves: protocol stops</text>

  <rect x="380" y="80" width="300" height="230" fill="#e0deda" stroke="#ed4937" stroke-width="2"/>
  <rect x="380" y="80" width="300" height="28" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="530" y="99" text-anchor="middle" font-size="11" fill="#ffffff" font-weight="bold">A paid job</text>
  <rect x="405" y="122" width="100" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="455" y="139" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">bot A</text>
  <rect x="405" y="158" width="100" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="455" y="175" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">bot B</text>
  <rect x="405" y="194" width="100" height="26" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="455" y="211" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">bot C</text>
  <rect x="555" y="122" width="100" height="98" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <text x="605" y="167" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">protocol</text>
  <text x="605" y="183" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">pays a reward</text>
  <line x1="506" y1="135" x2="546" y2="135" stroke="#ed4937" stroke-width="2"/>
  <polygon points="544,129 544,141 554,135" fill="#ed4937"/>
  <line x1="506" y1="171" x2="546" y2="171" stroke="#ed4937" stroke-width="2"/>
  <polygon points="544,165 544,177 554,171" fill="#ed4937"/>
  <line x1="506" y1="207" x2="546" y2="207" stroke="#ed4937" stroke-width="2"/>
  <polygon points="544,201 544,213 554,207" fill="#ed4937"/>
  <text x="530" y="246" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">reward &gt; fee + cost of a bot</text>
  <text x="530" y="266" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">first valid tx takes the reward</text>
  <text x="530" y="286" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">bot A down, bot B sends it</text>

  <text x="360" y="340" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">A team bot runs the job while one server runs. A paid job runs while anyone wants the reward.</text>
</svg>

## Nobody runs a liquidation service

Liquidation is the best-known paid job on Solana. Drift, Marginfi and Kamino all rely on outside bots to liquidate positions. When a borrower's collateral no longer covers the loan with enough margin, someone has to close the position fast, or the protocol takes the loss. The liquidator gets a reward taken from the failed position, usually collateral at a discount. Because every liquidation pays, bots watch every position on these protocols, and the borrower whose position failed pays for the service.

## The result must not depend on the caller

Paying strangers to run a job has one condition. Imagine a rogue claim instruction that sends the reward to whoever signs the transaction. The first bot to notice would take every user's rewards. So the instruction has to send the reward to the intended user no matter who signs. The executor could trigger the job and do only that. This is why the pattern is called **untrusted executor**. It's because the protocol does not trust the executors, it only lets them do the part of the job where it does not matter who they are. That's only true if the executor cannot change what the instructions do.

**Interestingly:** Helium, Monaco and governance programs don't even pay the executors at all.

Helium pays rewards to the owners of hotspots (the devices that provide its wireless network). A set of oracles then signs the total reward each device has earned so far, and the device's account stores how much was already paid out. Let's say the oracles sign 100 tokens of rewards for a device in total, and the account says 80 tokens have already been paid. The claim instruction would pay the difference, 20 tokens, to the owner, and record that 100 were paid in total. Paying the owner **makes the caller irrelevant**, and recording the total amounts eliminates the possibility of getting paid twice. Together, they make the claim safe for anyone to call, so a stranger who claims for you only gives you a gift by paying the fee for you.

Monaco, a prediction market, separates matching from paying out. Matching only marks the orders as filled. Paying out is a separate instruction that anyone can call later, and the money goes to the order owners. Governance works the same way. After a vote passes, anyone can send the transaction that executes the proposal. The vote decided what happens. The executor only decides when.

The executor cannot change what the instruction does, but it still chooses when to send the transaction and which accounts to pass. Timing matters when the result depends on a price or a clock, so the instruction has to be correct at any moment it can be called. The accounts matter because the client brings every account, so the instruction checks each one exactly as it would for any other caller. More about callers passing the accounts themselves in the [root of trust lecture](/courses/solana-pro/trust-and-identity/root-of-trust).

## Let bots compete on the reward

A fixed reward has a problem. If it is too high, the protocol overpays every time. If it is too low, nobody runs the job. Symmetry V3 lets the bots compete instead of choosing a number.

A Symmetry index fund holds several tokens in target shares, for example 50% SOL, 30% JUP and 20% BONK. When prices move, the real shares drift away from the targets, and the fund has to trade to bring them back. This trade is called a rebalance.

Symmetry offers the rebalance as a Dutch auction. The offer starts unattractive and gets a little better every slot until someone takes it. The bot's reward is the difference between the offered price and the market price. At first the price is good for the fund and the reward is tiny. Every slot the price moves toward the bot, and the reward grows. Many bots watch every fund, and each one has its own minimum reward. The trade goes to the first bot whose minimum is reached, so the fund pays roughly the smallest reward any bot would accept.

The numbers in the diagram below are illustrative. They show the shape of the auction. Symmetry's real parameters differ.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="background:#e0deda; font-family: system-ui, sans-serif;"><title>A rebalance offered as a Dutch auction</title><desc>A bar chart of the bot's reward over six slots, growing by 0.1 percent each slot. Bot A accepts only at 0.5 percent or more, bot B accepts at 0.3 percent or more. In slot 3 the reward reaches 0.3 percent, bot B takes the trade, and slots 4 to 6 are never reached. The fund pays 0.3 percent, the smallest reward any bot accepted.</desc>
  <rect x="20" y="20" width="680" height="34" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" fill="#ffffff" font-weight="bold">A rebalance offered as a Dutch auction</text>

  <text x="80" y="82" font-family="monospace" font-size="10" font-weight="bold">reward for the bot</text>
  <line x1="80" y1="90" x2="80" y2="290" stroke="#000000" stroke-width="2"/>
  <line x1="80" y1="290" x2="560" y2="290" stroke="#000000" stroke-width="2"/>

  <rect x="90" y="260" width="40" height="30" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="170" y="230" width="40" height="60" fill="#e0deda" stroke="#000000" stroke-width="2"/>
  <rect x="250" y="200" width="40" height="90" fill="#ed4937" stroke="#000000" stroke-width="2"/>
  <rect x="330" y="170" width="40" height="120" fill="none" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="410" y="140" width="40" height="150" fill="none" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="490" y="110" width="40" height="180" fill="none" stroke="#565653" stroke-width="1" stroke-dasharray="4 3"/>

  <text x="110" y="254" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">0.1%</text>
  <text x="190" y="224" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">0.2%</text>
  <text x="270" y="194" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold">0.3%</text>
  <text x="350" y="164" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">0.4%</text>
  <text x="430" y="134" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">0.5%</text>
  <text x="510" y="104" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">0.6%</text>

  <line x1="80" y1="140" x2="560" y2="140" stroke="#565653" stroke-width="1" stroke-dasharray="6 4"/>
  <text x="570" y="144" font-family="monospace" font-size="10" fill="#565653">bot A wants 0.5%</text>
  <line x1="80" y1="200" x2="560" y2="200" stroke="#ed4937" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="570" y="204" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">bot B wants 0.3%</text>

  <text x="270" y="172" text-anchor="middle" font-family="monospace" font-size="10" fill="#ed4937" font-weight="bold">bot B takes it</text>
  <text x="430" y="324" text-anchor="middle" font-family="monospace" font-size="9" fill="#565653">slots 4 to 6 never reached</text>

  <text x="110" y="308" text-anchor="middle" font-family="monospace" font-size="10">slot 1</text>
  <text x="190" y="308" text-anchor="middle" font-family="monospace" font-size="10">slot 2</text>
  <text x="270" y="308" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold">slot 3</text>
  <text x="350" y="308" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">slot 4</text>
  <text x="430" y="308" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">slot 5</text>
  <text x="510" y="308" text-anchor="middle" font-family="monospace" font-size="10" fill="#565653">slot 6</text>

  <text x="360" y="342" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">The reward grows every slot until the cheapest bot accepts it,</text>
  <text x="360" y="360" text-anchor="middle" font-family="monospace" font-size="11" fill="#565653" font-style="italic">so the fund pays the smallest reward any bot is willing to take.</text>
</svg>

## Scheduled tasks with a prepaid reward

Helium's tuktuk turns this pattern into a general scheduler. A task is an account that holds a reward, paid up front by whoever created the task, and a condition for when it may run, such as "not before 12:00 UTC". Once the condition is met, any bot can run the task, take the reward and close the account. What the task does is fixed by its creator, so the bot can run it but cannot change it. A repeating job creates its next task while it runs, so a daily job keeps scheduling itself with no team server behind it.

## The same idea beyond background jobs

Rewards are a nice protocol design hack in general. If some actions in your protocol pay more than the other ones, users move toward those actions without being asked. Simple game theory in action. A liquidation reward makes users watch positions, a Dutch auction makes bots compete on price, and a prepaid task makes bots run your schedule. If you need users to do something, make that action pay.

## Check every background job

When you design a protocol, list every action that has to happen without a user asking for it, such as paying rewards, settling trades, liquidations, expiring orders and rebalancing. For each one, answer three questions. Who is paid to call it, and can the reward cover the costs of the transaction? Could the result stay the same no matter who called the transaction? Based on these questions, you would figure whether the job could no longer depend on your server. Your own bot could still run, but just as one executor among many, with no special permissions.
