---
title: Write the docs
description: Where these pages live, how they are built, and the rules for keeping them current.
sidebar:
  order: 5
---

This site is built with [Astro Starlight](https://starlight.astro.build/) from
plain Markdown in the repository, so the docs ship with the code they describe
and change in the same pull request.

## Where things are

```
docs-site/
  astro.config.mjs            site config and the sidebar groups
  src/content/docs/
    index                     the docs home page (MDX, for its cards)
    start/                    what OpenNord is, quickstart, platforms
    guide/                    how to use each part of the app
    reference/                instruments, file types, FAQ, changelog, legal
    develop/                  working on the code (this section)
  src/styles/studio-dark.css  the app's palette mapped onto Starlight
```

A new `.md` file in `guide/`, `reference/` or `develop/` appears in the sidebar
on its own; set its place with `sidebar.order` in the front matter. Pages in
`start/` are listed by hand in `astro.config.mjs`.

Every page starts with front matter:

```md
---
title: Back up your Nord
description: One sentence, shown in search results and link previews.
sidebar:
  order: 3
---
```

Link between pages with absolute paths under `/docs/`, ending in a slash:
`[Supported instruments](/docs/reference/instruments/)`.

## Preview and build

```bash
cd docs-site
npm install
npm run dev      # http://localhost:4321/docs/
npm run build    # into docs-site/dist/
```

The site is served at `/docs/` next to the app. In the desktop and iPad apps,
the "Docs" link opens the published site.

## When to update a page

Update the docs in the same pull request as the change, whenever:

- a player would notice it: a new screen, a renamed button, a new file type, a
  new instrument, a changed limit or warning;
- a command, a setup step or the code layout changes;
- a page is now wrong.

Then add one line to the [changelog](/docs/reference/changelog/) under
**Unreleased**, in the player's words.

## How to write

- **Speak the player's language.** Name things as the app shows them, in bold:
  **Library**, **Check my Nord**, **Convert to Stage 4**. No engineering terms
  in the player guide; the Develop section can be technical about the code.
- **Say what works today.** Describe what the app does now, and say plainly when
  something is limited to a platform or an instrument. Plans belong in the
  roadmap, not here.
- **Never claim more than was tested.** Which models are tested comes from the
  app's own table (`src/lib/clavia/validation.ts`). The table on
  [Supported instruments](/docs/reference/instruments/) must match it; a test
  fails when it doesn't. Anywhere else, name the tested models rather than
  counting how many models OpenNord "reads".
- **Plain words, no slogans.** Short factual sentences. No taglines, no
  "companion", no "seamless", no claims you can't point to.
- **Short steps.** Numbered steps for a task; one action per step.
- **Only what is in this repository.** Describe what the open-source app does,
  nothing else.
- **What it does, not how it was made.** Readers want to use OpenNord. Leave out
  how support for an instrument or file came about.
