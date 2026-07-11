# Course content (open source)

This folder is the **source of truth** for the academy's lecture prose. Edit the
Markdown here, open a PR, and once merged a sync job writes your changes into the
live database. You do **not** need to run the app or touch a database to contribute.

> Git wins: for the fields listed below, these files are authoritative. Editing
> them in the CMS is disabled — change them here.

---

## Folder layout

The tree encodes structure. Nesting = relationships; the numeric prefix = order;
the rest of the name = slug.

```
content/
  00-blockchain-basics/            # <courseOrder>-<courseSlug>/
    _course.md                     # course metadata (this file's body = description)
    04-cryptography/               # <moduleOrder>-<moduleSlug>/
      _module.md                   # module metadata
      01-hashing.md                # <lessonOrder>-<lessonSlug>.md  -> a lesson
      02-encoding.md
```

**The path is the single source of truth for three things** (do not duplicate them
in frontmatter):

| Encoded in the path | Example segment | Meaning |
|---|---|---|
| **order**        | `04-cryptography` | `order = 4` |
| **slug**         | `04-cryptography` | `slug = cryptography` |
| **relationship** | file lives under `04-cryptography/` | lesson belongs to that module |

- **Order** uses gap numbering (00, 02, 04, …) so you can insert between two items
  without renumbering everything. Reorder = rename the prefix.
- **Rename a slug** = rename the file/folder. If the item has an `id` (see below),
  the sync updates the existing row's slug; without an `id` it's treated as new.
- Prefixes are zero-padded to 2 digits.

---

## `_course.md`

```markdown
---
id: 1                       # DB id. Present for existing courses; OMIT for a new one.
title: Blockchain basics
tags: [foundations, bitcoin]
durationHours: null
prerequisiteCourse: null    # slug of another course, or null
isHidden: false
---
A foundations course on how blockchains work from the cryptography up: hashing,
signatures, consensus, nodes, forks, and Bitcoin's design as the worked example.
```

- The **body is the course `description`**.
- `coverImage` and `publishedAt` are **CMS-managed** (media upload / publish state)
  and intentionally not represented here.

## `_module.md`

```markdown
---
id: 67                      # OMIT for a new module.
title: Cryptography
isHidden: false
---
```

Modules have no description, so the body is empty.

## Lesson files — `NN-slug.md`

```markdown
---
id: 70                      # OMIT for a new lesson.
title: Hashing
type: lecture               # lecture | test | coding_task | review_task
isHidden: false
faq:                        # lectures only; optional
  - question: Is a hash reversible?
    answer: >-
      No. A cryptographic hash is one-way: you cannot recover the input from the
      output. You can only guess-and-check.
---
> Opening quote / intro...

## A heading

Body prose, code blocks, diagrams — this is the lesson's `content` field,
rendered to Markdown and back by Payload's own converter.
```

### Lesson rules

- **The body is the `content` field, and only that.**
- For **non-lecture** lessons (`test`, `coding_task`, `review_task`) the body is
  still only the `content` prose. Their questions, options, test cases, grading
  criteria, and answer keys live in the CMS and are **never** written here. The
  sync updates **only** the `content` field for these types.
- **New lessons created from files must be `type: lecture`.** New tests/tasks are
  authored in the CMS first (they need assessment data that doesn't live here),
  then dumped to a file so their prose can be edited like any other lesson.

---

## `id`: how the sync matches a file to a row

- **`id` present** → update that exact row (safe across slug/title renames).
- **`id` absent** → the sync matches by path (course/module/lesson slug); if nothing
  matches, it **creates** a new course/module/lesson.
- Contributors adding new content just omit `id`. After a new row is created, the
  sync writes the assigned `id` back into the file in a follow-up commit.

## What the sync will/won't do

- Writes back: `title`, `content` (lecture prose), `faq`, `isHidden`, `order`, `slug`,
  and structural relationships — creating courses/modules/lessons as needed.
- Never touches: assessment data (questions, options, test cases, grading criteria),
  `coverImage`, `publishedAt`, user progress, or anything outside the fields above.
