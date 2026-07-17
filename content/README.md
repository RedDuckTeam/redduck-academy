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

1. **Copy the template.** Copy [`TEMPLATE.md`](./TEMPLATE.md) to
   `content/<course>/<module>/<your-lesson-slug>.md`. The file name becomes the URL slug, so
   keep it lowercase-with-hyphens.
2. **Fill in the frontmatter** (`title`, `type`, `order`) and write the lesson. Leave out
   `id` — one is assigned automatically when your PR is merged.
3. **Open a pull request.**

Adding a whole new module or course? Same idea: create the folder and give it a `_module.md`
or `_course.md` (copy the shape of an existing one). No id needed.

## Add or edit a test

A `type: test` lesson keeps its questions right in the file, below the frontmatter. Each
question starts with a `<!-- q -->` marker; each option is a task-list line — `- [x]` for a
correct answer, `- [ ]` for a wrong one:

```markdown
<!-- q -->
What does `keccak256` return?

- [x] A 32-byte hash
- [ ] A 20-byte address
- [ ] The input, unchanged

<!-- q -->
Select every value type. (Select all that apply.)

- [x] `bool`
- [x] `uint256`
- [ ] `string`
```

The stem is normal Markdown and may include a fenced code block. A question with more than
one correct option must cue it in the stem (for example "select all that apply"). You don't
write ids — they're assigned to each question and option automatically on merge, so the site
can match a learner's saved answers even as the test is edited.

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
    cryptography/                 # module slug
      _module.md                  # module metadata
      hashing.md                  # a lesson
      encoding.md
```

## Frontmatter

Every file starts with a YAML frontmatter block between `---` fences.

**`_course.md`** — the body is the course description.

| Field | Required | Notes |
|---|---|---|
| `id` | auto | CMS row id, assigned on merge. Keep it when editing an existing file; omit it for a **new** course. |
| `title` | ✅ | |
| `order` | ✅ | Number. Position among courses. |
| `isHidden` | optional | `true` hides it; omit otherwise. |

**`_module.md`** — no body.

| Field | Required | Notes |
|---|---|---|
| `id` | auto | Assigned on merge. Keep it when editing an existing file; omit it for a **new** module. |
| `title` | ✅ | |
| `order` | ✅ | Number. Position within the course. |
| `isHidden` | optional | |

**Lesson `<slug>.md`** — the body is the lesson prose.

| Field | Required | Notes |
|---|---|---|
| `id` | auto | Assigned on merge. Keep it when editing an existing file; omit it for a **new** lesson. |
| `title` | ✅ | |
| `type` | ✅ | `lecture` \| `test` \| `coding_task` \| `review_task`. New files can be `lecture` or `test`. |
| `order` | ✅ | Number. Position within the module. Use gaps (10, 20, 30) to leave room. |
| `isHidden` | optional | |
| `faq` | optional | Lectures only. List of `{ question, answer }` — short Q&As for search/AI, **not** shown on the page. |

> Course `tags`, `coverImage`, `durationHours`, `prerequisiteCourse`, and publish state are
> managed in the CMS, not here. Test questions live in the test file (see above); coding-task
> and review-task graders and criteria are still set up in the CMS.

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

- **A lesson body is the lesson prose** — plus, for a `test`, its questions. For
  `coding_task` and `review_task` the body is just the intro; their test cases and grading
  criteria live in the CMS.
- **New lessons you add are `type: lecture` or `type: test`.** Coding and review tasks are
  set up in the CMS first (they need graders), then their prose appears here.
- **Keep the `id`** when editing an existing file. For a new file, leave it out — one is
  assigned and committed automatically on merge. If you do set an id it must be unique among
  files of the same kind, and the validator rejects duplicates.
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
