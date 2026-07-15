# Contributing to the lectures

The academy's lecture text lives here as Markdown, one file per lesson. Improving it is a
normal GitHub pull request, and **you don't need to run the app or a database.** Edit a
file, open a PR, and once it's merged the site rebuilds with your change.

## Fix or improve an existing lesson

1. **Find the file.** The folder path mirrors the lesson's URL. For
   `academy.redduck.io/courses/blockchain-basics/cryptography/hashing`, edit
   `content/blockchain-basics/cryptography/hashing.md`.
2. **Edit the Markdown.** Improve the prose, fix a code sample, sharpen a diagram. Leave the
   `---` frontmatter block at the top as it is.
3. **Open a pull request.** A check validates your file automatically. That's it.

## Add a new lesson

New lessons must be **lectures**. Tests and coding tasks are set up in the CMS first,
because they need answer keys and graders that don't live in these files.

1. **Copy the template.** Copy [`TEMPLATE.md`](./TEMPLATE.md) to
   `content/<course>/<module>/<your-lesson-slug>.md`. The file name becomes the URL slug, so
   keep it lowercase-with-hyphens.
2. **Generate an id** and paste it into the frontmatter:
   ```bash
   node scripts/new-id.mjs
   ```
3. **Fill in the frontmatter** (`title`, `type: lecture`, `order`) and write the lesson.
4. **Open a pull request.**

Adding a whole new module or course? Same idea: create the folder and give it a `_module.md`
or `_course.md` (copy the shape of an existing one), each with its own generated id.

## Check it before you push (optional)

CI runs this for you, but you can catch problems early:

```bash
node scripts/validate-content.mjs
```

It checks required fields, valid slugs, unique ids, and a complete folder tree, and tells
you exactly how to fix anything it finds.

---

# Reference

## Folder layout

The tree mirrors the lesson URLs — `content/<course>/<module>/<lesson>.md` maps to
`/courses/<course>/<module>/<lesson>`. Names are plain **slugs** (lowercase, hyphens); the
reading order comes from the `order:` field, not the file name.

```
content/
  blockchain-basics/              # course slug
    _course.md                    # course metadata (its body is the course description)
    README.md                     # auto-generated course outline — do not edit
    cryptography/                 # module slug
      _module.md                  # module metadata
      hashing.md                  # a lesson
      encoding.md
```

Each course folder also carries an auto-generated **`README.md`** outline: its modules and
lessons in reading order, with links. Don't edit it by hand. A pre-commit hook regenerates
and stages it whenever you change content, and CI verifies it, so it always matches the
files. To refresh it yourself, run `yarn content:index`.

## Frontmatter

Every file starts with a YAML frontmatter block between `---` fences.

**`_course.md`** — the body is the course description.

| Field | Required | Notes |
|---|---|---|
| `id` | ✅ | CMS row id. Keep it when editing. For a **new** course, run `node scripts/new-id.mjs`. |
| `title` | ✅ | |
| `order` | ✅ | Number. Position among courses. |
| `isHidden` | optional | `true` hides it; omit otherwise. |

**`_module.md`** — no body.

| Field | Required | Notes |
|---|---|---|
| `id` | ✅ | Keep it when editing. For a **new** module, run `node scripts/new-id.mjs`. |
| `title` | ✅ | |
| `order` | ✅ | Number. Position within the course. |
| `isHidden` | optional | |

**Lesson `<slug>.md`** — the body is the lesson prose.

| Field | Required | Notes |
|---|---|---|
| `id` | ✅ | Keep it when editing. For a **new** lesson, run `node scripts/new-id.mjs`. |
| `title` | ✅ | |
| `type` | ✅ | `lecture` \| `test` \| `coding_task` \| `review_task`. New files must be `lecture`. |
| `order` | ✅ | Number. Position within the module. Use gaps (10, 20, 30) to leave room. |
| `isHidden` | optional | |
| `faq` | optional | Lectures only. List of `{ question, answer }` — short Q&As for search/AI, **not** shown on the page. |

> Course `tags`, `coverImage`, `durationHours`, `prerequisiteCourse`, publish state, and all
> lesson **assessment data** (quiz questions/answers, coding tests, grading criteria) are
> managed in the CMS, not here.

## What you can write

The body is standard Markdown. Supported:

- **Headings** `##` and `###` — the lesson `title` is the page's only `#`, so don't add one.
- **Text**: `**bold**`, `*italic*`, `` `inline code` ``.
- **Code fences** with a language: ` ```solidity `, ` ```rust `, ` ```typescript `, or a bare ` ``` ` for plain text.
- **Lists** (`-` and `1.`, nestable), **blockquotes** (`>`), and **tables** (GitHub-flavored).
- **Links**: `[text](https://…)`, or link to another lesson with a site-relative path like `[see this](/courses/blockchain-basics/cryptography/hashing)`.
- **Interactive embeds**: a paragraph that is *only* a link to `plgrnd.io`, `eth.build`, or a YouTube URL renders as an embedded frame.
- **Diagrams**: paste raw `<svg>…</svg>` markup. Include a `<title>` (and ideally `<desc>`) for accessibility. Everything is sanitized on render, so no scripts or event handlers survive.

## Rules

- **A lesson body is only the lesson prose.** For non-lecture lessons (`test`,
  `coding_task`, `review_task`) the body is still just the intro/description — their
  questions, test cases, and grading criteria live in the CMS.
- **New lessons you add must be `type: lecture`.** New tests and tasks are authored in the
  CMS first (they need assessment data), then their prose appears here.
- **Keep the `id`** when editing an existing file. For anything new, generate one with
  `node scripts/new-id.mjs`. Every id must be unique among files of the same kind, and the
  validator rejects duplicates.
- **Renaming a file or folder renames the slug** (and the lesson URL), so do it
  deliberately.

## How it's published

Files are read at **build time** and served as CDN static assets — the content never enters
the app's JavaScript bundle or the server. On merge to `main` the site rebuilds and serves
your Markdown.

The course structure (which lessons exist, their order, type, and titles) is built from
these files too, so a new lesson appears on the site as soon as your PR is merged — no
database change is needed to read it. The database is used only for per-user progress and
for the interactive parts of non-lecture lessons, which a maintainer wires up separately.
