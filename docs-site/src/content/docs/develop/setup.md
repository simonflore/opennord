---
title: Run it locally
description: Clone OpenNord, run the app, and run the checks a pull request has to pass.
sidebar:
  order: 1
---

OpenNord is a React 19 + Vite + TypeScript web app. The same code runs in the
browser, in the desktop app (Electron) and in the iPad app (Capacitor).

## What you need

- **Node.js 22 or newer**, and npm.
- **git**.
- For device work: a Chromium-based browser on a computer (Chrome, Edge,
  Brave, Arc, Opera) and a Nord with a USB cable. Nothing else needs hardware.

## Get the code and run it

```bash
git clone https://github.com/simonflore/opennord.git
cd opennord
npm install
npm run dev          # the app at http://localhost:5173
```

The app opens on the Library. Import a Nord file or connect a folder and it
reads it straight away.

## The checks

These three are the CI gates. Run them before you open a pull request:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint + stylelint (no hard-coded colours outside tokens.css)
npm test             # vitest
```

Other useful commands:

| Command | What it does |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint:fix` | Fix what eslint and stylelint can fix on their own |
| `npm run electron:dev` | The desktop app against the dev server |

## The documentation site

These pages live in the same repository, in `docs-site/`. It is a separate npm
project:

```bash
cd docs-site
npm install
npm run dev          # http://localhost:4321/docs/
npm run build        # static site into docs-site/dist/
```

See [Write the docs](/docs/develop/write-the-docs/) for how pages are organised.
