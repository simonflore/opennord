---
title: The Library
description: Bring your programs, presets, samples and pianos into OpenNord from files, a folder or your Nord, and find them again.
sidebar:
  order: 1
---

The **Library** is OpenNord's home. It has four lists, in the rail on the left
(or the tabs at the bottom on a phone):

- **Programs**
- **Presets**: organ, piano and synth presets
- **User Samples**: `.nsmp`, `.nsmp3`, `.nsmp4`
- **Piano Samples**: `.npno` pianos

Each list shows a count, and where its entries come from: **On Nord**,
**Local** (files and folders on this computer) and **Backup** (inside a backup
file).

## Bring things in

Press **+ Add** at the top of a list.

### Import a file

**Import a file…** keeps a copy of one file in OpenNord, so it is there after a
reload. The copy stays in your browser.

| List | Files you can import |
|---|---|
| Programs | `.ns4p` (Stage 4), `.ns3f` `.ns3p` (Stage 3), `.ns2p` (Stage 2) |
| Presets | `.ns4o` `.ns4n` `.ns4y` (Stage 4), `.ns3y` (Stage 3), `.ns2s` (Stage 2) |
| User Samples | `.nsmp` `.nsmp3` `.nsmp4` |

A file of the wrong kind is refused with a hint, for example "“X” is a preset —
import it from the Presets page."

### Choose a folder

**Choose a folder…** reads the Nord files in a folder where they are. Nothing is
copied, and subfolders are searched too.

| List | What a folder adds |
|---|---|
| Programs | `.ns4p` `.ns4l` (Stage 4), `.ne6p` `.ne6l` (Electro 6) |
| Presets | `.ns4o` `.ns4n` `.ns4y` `.ns3y` `.ns2s` |
| User Samples | `.nsmp` `.nsmp3` `.nsmp4` |
| Piano Samples | `.npno` |
| Backups | `.ns4b`: every program inside is listed |

If the folder holds several backups, OpenNord asks **Load which backups?**. Pick
the ones to add, or **Skip backups**.

The folder's menu in the rail has:

- **Rescan folder**: pick up files added or changed since.
- **Reconnect folder**: after a reload, your browser asks for permission again.
- **Change folder…** and **Forget folder** (your files stay where they are).

:::note[Stage 2 and 3 programs]
A folder scan adds Stage 4 and Electro 6 programs. Bring Stage 2 and 3 programs
in with **Import a file…**, or read them from a connected Nord.
:::

:::caution[Android and cloud folders]
A folder from Google Drive or another cloud app can look connected but give
OpenNord nothing to read. Make the files available offline, or move them to the
device's own storage.
:::

### From your Nord

[Connect your Nord](/docs/guide/connect/) and its programs, samples and pianos join the
lists under **On Nord**. The same program in a folder and on the Nord shows as
one row.

## Find things

- **Search** each list by name.
- **Filter** by source (**All**, **On Nord**, **Local**, **Backup**), by model and
  by category, when the list holds more than one.
- **Sort** by name or source (samples also by size).
- On programs, the engine keys **Piano**, **Organ**, **Synth** and **Split**
  show only programs that use that engine, or split the keyboard.
- Mark favourites on the rows.
- **⌘K** (Ctrl K) jumps to anything by name, from anywhere.

## An open entry

Selecting a row opens it beside the list. **Full view** (or the F key) gives it
the whole window; **← Programs** or Esc goes back.

- **Save to computer** downloads the file.
- **Send to Nord** writes a program to a slot on your keyboard; see
  [Send a program to your Nord](/docs/guide/send/).
- **More** › **Keep a copy** keeps a program that isn't on this computer (for
  example one on your Nord), and **Remove from library** removes an imported
  file.
