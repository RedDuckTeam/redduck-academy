# What the Solana course is about

_type: lecture_

The basics module gave you the vocabulary. Block, transaction, signature, fee, validator. This track turns that vocabulary into working code. You will write programs that run on Solana, build the parts of an application that hold funds, and ship something at the end of every module that you can point at and explain. There is a real distance between knowing how a chain works and being able to deploy code on one that survives contact with users. The lessons here exist to walk that distance.

## What's in the course

The opening modules cover the way Solana represents state and runs code, because the shape is different enough from what most developers expect that the rest of the course depends on it. From there the track moves into the language and framework, then through the building blocks of a real program: accounts, instructions, errors, events, calls between programs. The second half is the patterns that production code uses. Tokens, fee logic, time-locked balances, sales, the security guards that make the rest of it safe to deploy. Every module ends in a project that uses what just came before, so the harder topics arrive when you already have the vocabulary to read them.

## How it works

You'll be writing tests for everything you build. Small ones at the start, full lifecycles and attacker-style cases by the end. Security isn't shipped as a single chapter near the back. It lives inside every module, attached to whichever primitive that module introduces. You'll write code that compiles cleanly and is still broken, watch it fail in the way that real programs fail in the wild, and rewrite the check that would have caught it. The work isn't memorizing the syntax. The work is building the mental model that lets you predict what your program will do when somebody who is not you sends it a transaction designed to take its money.
