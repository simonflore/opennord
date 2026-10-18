---
title: File types
description: Every Nord file extension OpenNord knows, by instrument, and where in the app each one opens.
sidebar:
  order: 2
---

Every Nord file is named for its instrument and kind: `.ns4p` is a **N**ord
**S**tage **4** **p**rogram.

## Nord Stage 4, 3 and 2

| Kind | Stage 4 | Stage 3 | Stage 2 |
|---|---|---|---|
| Program | `.ns4p` | `.ns3f` | `.ns2p` |
| Live | `.ns4l` | `.ns3l` | `.ns2l` |
| Synth preset | `.ns4y` | `.ns3y` | `.ns2s` |
| Organ preset | `.ns4o` | | |
| Piano preset | `.ns4n` | | |
| Settings | `.ns4t` | `.ns3t` | `.ns2y` |
| Backup | `.ns4b` | `.ns3b` | `.ns2b` (`.ns2exb` for the EX) |

Stage 3 programs can also be `.ns3p`.

## Samples and pianos

| Extension | What |
|---|---|
| `.nsmp` | A sample, oldest generation |
| `.nsmp3` | A sample, Stage 3 generation |
| `.nsmp4` | A sample, Stage 4 generation |
| `.npno` | A piano |
| `.onsample` | An OpenNord sample-build project ([Build a sample](/docs/guide/build-sample/)) |

## Other Nords

| Instrument | Programs | Backup |
|---|---|---|
| Stage Classic / EX | `.nspg` | `.nsb` |
| Electro 3 | `.nepg` | `.neb` |
| Electro 4 / 5 / 6 / 7 | `.ne4p` `.ne5p` `.ne6p` `.ne7p` | `.ne4b` `.ne5b` `.ne6b` `.ne7b` |
| Piano 1 | `.nppg` | `.npb` |
| Piano 2 – 6 | `.np2p` … `.np6p` | `.np2b` … `.np6b` |
| Grand / Grand 2 | `.ngp` / `.ng2p` | `.ngb` / `.ng2b` |
| Organ 3 | `.no3p` | `.no3b` |
| C2 / C2D | `.ncpg` / `.nc2p` | `.ncb` / `.nc2b` |
| Wave / Wave 2 | `.nwp` / `.nw2p` | `.nwb` / `.nw2b` |
| Lead 4 / A1 | `.nl4s` / `.nlas` | `.nl4b` / `.nlab` |

Most of these also have Live (`…l`), settings and bundle files. The
**Compatibility** page lists them all.

## Where each opens

| You have | Open it with |
|---|---|
| A Stage 4, 3 or 2 program | **Programs** › **+ Add** › **Import a file…** |
| A preset | **Presets** › **+ Add** › **Import a file…** |
| A sample | **User Samples** › **+ Add** › **Import a file…** |
| A folder of files, pianos or `.ns4b` backups | **+ Add** › **Choose a folder…** |
| A `.ns4b` backup to rearrange | **Device** › **Open a backup to organize offline** |
| WAV recordings | **User Samples** › **+ Add** › **Build a sample…** |
