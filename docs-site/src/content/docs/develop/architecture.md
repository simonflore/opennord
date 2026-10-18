---
title: How the code is organised
description: The layers of the OpenNord client, how a file is read, and how screens are added.
sidebar:
  order: 2
---

OpenNord is a single-page web app. Everything happens on the player's own
device: files are opened in the browser, and the Nord is reached over USB from
the same page. Nothing in the app needs a server.

## The layers

```
UI (React, src/components + src/routes)
 ├─ Library, program views, sample workshop, device screen
 │
 ├─ src/lib/library, src/lib/folder   → the Library, folder scan and import
 ├─ src/lib/clavia                    → what every Nord file has in common, and the list of models
 │   └─ src/lib/ns4, ns3, ns2, …      → one reader per instrument
 ├─ src/lib/migrate                   → Stage 2/3 → Stage 4 conversion
 ├─ src/lib/engine, src/lib/midi      → in-app playback and live MIDI input
 ├─ src/lib/ai                        → search
 └─ src/lib/device                    → USB: connect, list, read, write, back up
```

| Path | What lives there |
|---|---|
| `src/lib/clavia/` | What all Nord files share (name, slot, category), the list of Nord models, and picking the right reader for a file. |
| `src/lib/ns4/` | The Nord Stage 4 reader and writer, and the sample files (`.nsmp`, `.nsmp3`, `.nsmp4`). |
| `src/lib/ns3/`, `src/lib/ns2/`, … | Readers for the other instruments: Stage 2 and 3, Electro, Piano, Lead, Wave, Grand and more. |
| `src/lib/migrate/` | Converting a Stage 2 or 3 program into a Stage 4 one. |
| `src/lib/device/` | Talking to the Nord over USB, backups, and **Check my Nord**. |
| `src/lib/folder/`, `src/lib/library/` | Scanning a folder, sorting files into the Library. |
| `src/lib/midi/` | Live MIDI input (notes, sustain, controllers) for playing sounds in the app. |
| `src/lib/ai/` | Program search, behind the `ProgramRanker` interface. |
| `src/components/`, `src/routes/` | The React UI and the routes. |
| `src/styles/tokens.css` | The Studio Dark design tokens: the one source for every colour, size and font. |
| `electron/` | The desktop app. |
| `plugins/` | The iPad app's plugins (USB and MIDI input). |

Adding an instrument means adding a reader for it next to the others and
registering it in `src/lib/clavia/`; the rest of the app picks it up.

## Hardware is optional

Reading, browsing, playing samples and converting programs all work from a file
alone. Talking to the Nord over USB is an extra path, never a requirement for
another feature. Keep it that way: a feature that only works with a connected
Nord needs a version that works from a file.

## Screens and routes

The app uses [TanStack Router](https://tanstack.com/router) with **hash
history** (`#/library`), which also works where the page has no normal web
address (the desktop and iPad apps). A screen is one route module in
`src/routes/`; its logic lives in `src/lib/<feature>/` and its view pieces in
`src/components/<feature>/`. Shared state across screens is a React context
(`DeviceContext`, `LibraryContext`, …) composed in `src/App.tsx`.

To add a screen:

1. Create `src/routes/<name>.tsx` exporting a `createRoute({ getParentRoute: () => rootRoute, path: '/<name>', component })`.
2. Add it to the route tree in `src/router.tsx`.
3. Add it to the navigation in `src/components/shell/nav.ts` (`NavTo` is the
   typed list of valid paths; the rail and the command palette both read from
   there).

## Capabilities: what a build can do

Some features depend on where the app runs, such as whether the browser can
reach USB. The app reads these from one `Capabilities` object
(`src/lib/capabilities/`), with its defaults in `defaults.ts`; screens ask the capability instead of checking the platform
themselves. A capability that is not available hides or explains its feature;
it never breaks the screen.

## Design system

The UI is **Studio Dark**: tokens in `src/styles/tokens.css`, Tailwind v4
utilities, `cva` variants and Radix primitives, composed from
`src/components/ui/`. Never hard-code a colour; stylelint enforces it. The
cheatsheet is `src/styles/tailwind-baseline.md`, and every instrument widget
renders in every state on the dev-only `/dev/kit` page.
