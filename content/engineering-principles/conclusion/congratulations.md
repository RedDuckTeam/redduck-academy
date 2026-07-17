---
id: 1175492070
title: Congratulations
type: lecture
order: 1
faq:
  - question: I finished the course. How do I actually use these principles?
    answer: Pick the one or two that most changed how you see a design and apply them
      deliberately on your next task, naming the parent goal and checking the design
      against an adversary. The principles stick through use on real problems rather
      than through re-reading. Over time the questions become automatic.
  - question: Do these principles apply outside blockchain and outside my current job?
    answer: Yes. Every one is domain-neutral by design, drawn from databases, networks,
      operating systems, and everyday systems. The same reasoning shapes any system you
      build, which is why the blockchain sections were optional throughout.
---

You reached the end. This course taught something that outlasts any language or framework: the reasoning that decides whether a design holds up. That kind of understanding is slow to build, and it improves everything you make rather than one narrow skill.

Look back at what runs through all of it. Weigh every **tradeoff** against the **parent goal** it serves, and name that goal first. Use **constraint bypass** to make a hard constraint irrelevant instead of fighting it. Follow the **Irrelevance Principle** and constrain only what you actually care about. Keep the smallest amount of logic in the **Core**, and let the **Periphery** around it stay replaceable. Reach for a **singleton** when concentrating a critical function under heavy review beats the risk of concentrating it. Let **atomicity**, an all-or-nothing guarantee, stand in for trust. Set a **standard** and a whole ecosystem stops having to negotiate. Keep a component **stateless** and it remembers nothing an attacker could reach. Trace every choice up the **goal hierarchy** to the parent it serves. And look at every operation the way a **rational adversary** would, before you build it. Different lessons, one habit: judge every choice against the goal, and design so the dangerous state cannot exist.

## What to do with it

None of this sticks from reading it once. It sticks from catching yourself in a real design, about to trust a value you should not, or about to store state you never needed, and choosing the other way. Do that a single time and it is easier the next.

So pick the one or two principles that landed hardest, and use them on purpose on your next piece of work. Name the parent goal before you argue about the details. Ask what a self-interested actor would do with the operation you just exposed. If you are continuing into the security-focused courses, you will meet every one of these principles again, this time in real systems that hold real assets, where getting them wrong has a price. You already have the reasoning those systems are built on.

Good work getting here.
