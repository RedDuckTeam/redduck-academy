---
# HOW TO USE THIS TEMPLATE — full guide in README.md
#   1. Copy this file to  content/<course>/<module>/<your-lesson-slug>.md
#      (the file name becomes the lesson's URL slug: lowercase, hyphens).
#   2. Delete these comment lines, then fill in the rest.
# No `id` needed — one is assigned automatically when your PR is merged.
title: Your lesson title
type: lecture # lecture | test — see README.md for the test-question format
order: 10 # position within the module; gaps (10, 20, 30) leave room to insert later
# isHidden: true # uncomment to hide this lesson from the site
# faq: # optional, lectures only — 2–4 short Q&As for search/AI, never shown on the page
#   - question: A question a learner might actually ask?
#     answer: A self-contained 2–4 sentence answer.
---

> An optional one-paragraph intro that frames what this lesson is about.

## A section heading

Write in Markdown. **Bold**, *italic*, and `inline code` all work, as do
[external links](https://example.com) and links to another lesson via a site-relative
path like [this one](/courses/course-slug/module-slug/lesson-slug).

A fenced code block — languages: `solidity`, `rust`, `typescript` (omit for plain text):

```solidity
contract Example {
    uint256 public value;
}
```

- A bullet list item
- Another item

| Column A | Column B |
| --- | --- |
| a1 | b1 |

A paragraph that is only a playground link renders as an interactive embed:

[interactive playground](https://plgrnd.io/#flow=REPLACE_ME)
