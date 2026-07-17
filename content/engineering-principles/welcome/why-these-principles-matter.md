---
id: 1064107034
title: Why these principles matter
type: lecture
order: 2
faq:
  - question: Why teach principles instead of concrete, ready-to-use designs?
    answer: A concrete design solves the one problem it was built for. A principle is
      the reasoning that produced it, so it also solves the many problems no design
      anticipated. When you understand why a design works, you can build the right one
      for a case nobody handed you.
  - question: These examples are not from my stack. Will they still help me?
    answer: Yes. A principle is deliberately independent of any stack, which is what
      makes it a principle. The examples use widely understood systems so the idea
      transfers directly to whatever you build, including tools that did not exist when
      the principle was written down.
---

A system fails in production. Someone traces it to a single place where the code trusted a value the user controlled. No algorithm was broken and no library was misused. A design principle was ignored, and that principle had a name and a well-known reason. The expensive failures in software usually look like this. The knowledge to prevent them was available all along. The principle that carried it simply went unused.

## Why this is worth your time

It is easy to treat design principles as theory you can skip on the way to getting something built. The opposite is true. Almost every serious failure in a system traces back to a principle that was ignored.

- A design that trusts a value the user controls becomes the security hole someone walks through.
- A component that remembers state it never needed becomes the thing an attacker corrupts.
- A convenience bolted onto the part that holds the assets becomes the reason a small change leaks them.

Each of these is one principle away from never happening. Learning the principle is cheaper than learning it from a failure in production.

## The principle outlives the tool

Languages change. Frameworks come and go. The database you build on today may be gone in five years. A principle does not expire that way, because it describes why a good design is good rather than how one particular tool works. Understand why keeping the smallest amount of logic in the position of highest trust makes a system safer, and you will apply it in a language that has not been invented yet. So each lesson here teaches the reason under a design. The reason is the part that keeps paying long after the specifics have moved on.

## A fair warning

You will recognize some of these mistakes, and sometimes you will recognize yourself making them. That is normal, and it is the point. The value shows up when you catch yourself reaching for the familiar pattern and stop to ask what the goal actually requires. Agreeing with a principle is easy and does almost nothing on its own. Using it, once, on a real design, is where it starts to pay.
