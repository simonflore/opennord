# Checking OpenNord against your own Nord files

`npm run fixtures:scan` opens real Nord files with OpenNord's readers and writers and tells
you, per instrument, whether they read them correctly. It is the quickest way to confirm the
models we could only map from firmware (no real file to test on yet).

## On a Mac, over your own library

You need Node.js 22 or newer (20.19 works too) and pnpm (`npm install -g pnpm` if you don't have it).

```
cd opennord-backend          # the repository folder
pnpm install                 # once
cd packages/core
NORD_FILES=~/Music/Nord npm run fixtures:scan
```

Point `NORD_FILES` at any folder: your Nord Sound Manager library, a folder of exported
programs, a folder of backups — subfolders are searched too. If the path has spaces, quote it:
`NORD_FILES="$HOME/Documents/Nord Backups" npm run fixtures:scan`. You can also point it at a
single file.

- Programs, Lives, presets and settings files are read as they are. The model is taken from
  each file.
- Backups and bundles (`.ns3b`, `.ns4b`, `.ne5b`, `.np3b`, `…pbundle`, …) are opened and every
  program inside is checked too, shown as `Backup.ns3b › Program/Bank A/Name.ns3f`. Samples and
  pianos inside a backup are skipped.
- Other files (audio, PDFs, …) and hidden files (`.DS_Store`, `._…`) are ignored, and links
  are not followed. A folder the scan isn't allowed to open is skipped and counted at the end
  (if that is a folder you meant, give Terminal access under System Settings › Privacy &
  Security › Files and Folders).

### Nothing leaves your machine, nothing is changed

The scan only reads your files: it never writes to them, renames or moves them, and sends
nothing anywhere. Every check runs on a copy in memory. The one file it writes is the report,
`packages/core/fixtures/.report.json`, which stays on your machine (git ignores it). The report
holds file paths (relative to the folder you gave), sizes, tags, versions, the readers'
warnings and pass/fail results — no program settings.

### What the summary means

One block per instrument, for example:

```
Nord Piano 3 (piano-3) — layout candidate
  files 3 + 1 backup(s) · programs checked 3
  read OK 3 · header-only 0 · out-of-range 0 · with warnings 0 · converted from an older version 0
  checksum OK 3 / fail 0
  no-op write: identical 3 · differs 0 · refused 0
  write-back:  identical 3 · differs 0 · refused 0
  → 3 real files read cleanly → alignment looks right
```

- **read OK** — the reader found every setting where its layout says. **header-only** means it
  could only read the file's header (the program will show without its settings).
- **out-of-range** — files with a setting outside the values the instrument allows. One or two
  can happen; many usually mean the layout is shifted.
- **with warnings** — files the reader read but warned about (an older format, a part of the
  file sized differently from the layout); the most common warnings are listed under the block.
- **converted from an older version** — files saved by an older OS, which the instrument (and
  OpenNord) update when loading.
- **checksum** — whether each file's own checksum holds, as the instrument checks it.
- **no-op write** — OpenNord saves the file without changing anything; it must come out
  byte-for-byte identical. **write-back** saves every setting the reader read back into the file;
  that must come out identical too. *refused* means OpenNord declined to save that file (the
  reason is shown); *not writable* means OpenNord doesn't save that model at all.
- **layout candidate** — a model whose layout is mapped but has not been checked
  against a real file yet. The `→` line says what your files showed: *alignment looks right*
  when every file read cleanly (read with the layout, no warning, no out-of-range value, its
  checksum holding, the expected length), *needs a look* when some didn't. The last block of the summary
  lists these models together.
- Lines starting with `!` name files that need a look; the full list is in the report.

Sharing the summary text (or the report) with the OpenNord developers is what turns a
candidate layout into a confirmed one. It holds no program settings, but it does hold your file
and folder names — look it over first.

## The `fixtures/` corpus

You can also drop files here, one folder per model, and run `npm run fixtures:scan` with no
`NORD_FILES`:

```
fixtures/<model-id>/AnyName.ns3f      # programs / presets / performances
fixtures/<model-id>/Backup.ns3b       # backups (ZIP)
fixtures/<model-id>/Sample.nsmp3      # samples
```

`<model-id>` is a key from `src/lib/clavia/partitions.ts` — e.g. `stage-3`, `electro-6`,
`piano-6`, `grand-2`, `wave-2`. Files here are also cross-checked against that model's entry
in the registry (tag, sample codec) — mismatches are the reverse-engineering signal. Both can
be combined: the scan covers `fixtures/` and `NORD_FILES` in one run. With neither, it does
nothing.

## This folder is **never committed**

Everything here except this README is gitignored. These are local RE material only. Per
`docs/LEGAL.md`, OpenNord never hosts or redistributes sourced files — factory content
especially. Source files from your own account/instrument; keep them on your machine.
