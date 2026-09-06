# Contributing to RedDuck Academy

Thanks for helping. There are a few ways in, and none of the content ones need you to run the app
or a database.

## Improve or add a lecture (no setup)

The lectures are Markdown files under [`content/`](content/). Fixing a typo, sharpening an
explanation, correcting a code sample, or adding a lesson is a normal pull request.

**You can also edit straight from the site.** Every lesson page has an *Improve this lesson*
button that opens the same file in an editor and turns your change into a pull request for you —
no GitHub account, no fork, no checkout. It lands in exactly the same review queue as a pull
request you push yourself.

➡️ Full guide: **[content/README.md](content/README.md)**

Before you push, you can catch problems early (CI runs the same check on your PR):

```bash
node scripts/validate-content.mjs
```

## Report or propose without writing a PR

Open an [issue](../../issues/new/choose) and pick the form that fits:

- **Improve a lesson** — something is wrong or unclear in an existing lecture.
- **Propose a new lesson** — a topic you think belongs in a course.
- **Bug report** — the site or the platform code is broken.

## Run or self-host the platform

The web app, backend, and CMS are covered in **[docs/self-hosting.md](docs/self-hosting.md)**. You
don't need any of this to contribute lectures.

## Pull requests

- Keep the change focused: one topic per PR.
- The PR template has a short checklist for content changes.
- For a new lesson file, leave out the `id` — one is assigned automatically on merge — and
  keep the `---` frontmatter block intact.

## Licensing of contributions

RedDuck Academy is dual-licensed: platform code under **MIT**, lecture content (`content/`) under
**CC BY-SA 4.0**. By contributing, you agree your contribution is provided under the same license as
the part of the project you are changing.

### Editing from the site

A pull request you push yourself is covered by GitHub's Terms of Service, which pass your
contribution through under this project's license. A change submitted from the site editor never
touches GitHub's terms, so the grant is made in the editor instead — the notice you accept there is
the operative one, and this is its text (version `2026-09-06`):

> I wrote this, or I have the right to submit it, and I license it irrevocably under CC BY-SA 4.0
> (MIT for code). A hyperlink or URL is sufficient attribution. This submission is public and
> permanent; my name is published with it and my email is not collected.

The version string, the acceptance and its timestamp are recorded against the proposal. There is no
CLA to sign — requiring a signature ceremony for a three-word typo fix would cost more corrections
than it protects.

The display name you give is optional and goes into the commit as a `Proposed-by:` trailer. A
pseudonym is fine: CC BY-SA 4.0 §3(a)(1) accepts attribution by pseudonym, and it keeps personal
data out of a git history nobody can rewrite later.
