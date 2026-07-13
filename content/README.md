# Course content (open source)

This folder holds the academy's **lesson prose** as Markdown — one file per lesson. Edit
a file, open a PR, and once it's merged the site rebuilds and serves your Markdown. You
do **not** need to run the app or a database to contribute.

Before opening a PR, run the validator:

```bash
node scripts/validate-content.mjs
```

A copy-paste starting point for a new lesson lives in [`TEMPLATE.md`](./TEMPLATE.md).

---

## Folder layout

The folder tree mirrors the lesson URLs — `content/<course>/<module>/<lesson>.md` maps to
`/courses/<course>/<module>/<lesson>`. Names are plain **slugs** (lowercase, hyphens, no
order prefix); reading order comes from the `order:` field in frontmatter.

```
content/
  blockchain-basics/              # course slug
    _course.md                    # course metadata (this file's body = the description)
    cryptography/                 # module slug
      _module.md                  # module metadata
      hashing.md                  # a lesson
      encoding.md
```

## Frontmatter

Every file starts with a YAML frontmatter block between `---` fences.

**`_course.md`** — body is the course description.

| Field | Required | Notes |
|---|---|---|
| `id` | for existing | DB id. **Omit** when adding a brand-new course. |
| `title` | ✅ | |
| `order` | ✅ | Number. Position among courses. |
| `isHidden` | optional | `true` to hide; omit otherwise. |

**`_module.md`** — no body.

| Field | Required | Notes |
|---|---|---|
| `id` | for existing | Omit for a new module. |
| `title` | ✅ | |
| `order` | ✅ | Number. Position within the course. |
| `isHidden` | optional | |

**Lesson — `<slug>.md`** — body is the lesson prose.

| Field | Required | Notes |
|---|---|---|
| `id` | for existing | Omit for a new lesson. |
| `title` | ✅ | |
| `type` | ✅ | `lecture` \| `test` \| `coding_task` \| `review_task` |
| `order` | ✅ | Number. Position within the module. Use gaps (10, 20, 30) to leave room. |
| `isHidden` | optional | |
| `faq` | optional | Lectures only. List of `{ question, answer }` — short Q&As for search/AI, **not** shown on the page. |

> Course `tags`, `coverImage`, `durationHours`, `prerequisiteCourse`, publish state, and
> all lesson **assessment data** (quiz questions/answers, coding tests, grading criteria)
> are managed in the CMS, not here.

## Writing a lesson

The body is standard Markdown. Supported:

- **Headings** `##` and `###` (the lesson `title` is the page's only `#` — don't add one).
- **Text**: `**bold**`, `*italic*`, `` `inline code` ``.
- **Code fences** with a language — ` ```solidity `, ` ```rust `, ` ```typescript `, or a bare ` ``` ` for plain text.
- **Lists** (`-` and `1.`, nestable), **blockquotes** (`>`), and **tables** (GitHub-flavored).
- **Links** `[text](https://…)`. Link to another lesson with a site-relative path: `[see this](/courses/basics/crypto/hashing)`.
- **Interactive embeds**: a paragraph that is *only* a link to `plgrnd.io`, `eth.build`, or a YouTube URL renders as an embedded frame.
- **Diagrams**: paste raw `<svg>…</svg>` markup. Include a `<title>` (and ideally `<desc>`) for accessibility — everything is sanitized on render, so no scripts/handlers survive.

## Rules

- **A lesson file's body is only the lesson prose.** For non-lecture lessons
  (`test`, `coding_task`, `review_task`) the body is still just the intro/description
  prose — their questions, test cases, and grading criteria live in the CMS.
- **New lessons you add must be `type: lecture`.** New tests/tasks are authored in the
  CMS first (they need assessment data), then their prose appears here.
- **`id`**: keep it if it's there; omit it for anything new. Renaming a file/folder
  renames the slug (and the lesson URL) — do it deliberately.

## How it's published

Files are read at **build time** and served as CDN static assets — the content is never
in the app's JavaScript bundle or the server Worker. On merge to `main` the site rebuilds
and serves your Markdown.

The list of lessons and their order/type live in the database. Editing an **existing**
lesson's prose takes effect on the next build. **Adding a new lesson** also needs a
matching database row, which a maintainer creates when your PR is merged.
