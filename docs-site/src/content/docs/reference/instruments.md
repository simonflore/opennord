---
title: Supported instruments
description: Which Nord models have been tested with OpenNord, and for what.
sidebar:
  order: 1
---

Only two models have been tested for everything: the **Nord Stage 4** and the
**Nord Stage 3**. On the Stage 2, reading files and copying from the keyboard
have been tested; sending, deleting and backing up have not. Nothing has been
tested on any other model yet.

The same table is on the **Compatibility** page in the app.

| Mark | Meaning |
|---|---|
| ✓ | Tested on a real instrument. |
| ● | Not tested yet. The app calls this "Ready to test". |
| – | The instrument doesn't have this. |

| Model | Open files | Samples | Copy from Nord | Send to Nord | Delete from Nord | Back up |
|---|---|---|---|---|---|---|
| Nord Stage 4 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Nord Stage 3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Nord Stage 2 | ✓ | ✓ | ✓ | ● | ● | ● |
| Nord Stage 2 EX | ✓ | ✓ | ● | ● | ● | ● |
| Nord Stage Classic | ● | – | ● | ● | ● | ● |
| Nord Stage EX | ● | – | ● | ● | ● | ● |
| Nord Electro 3 | ● | ● | ● | ● | ● | ● |
| Nord Electro 3 HP | ● | ● | ● | ● | ● | ● |
| Nord Electro 4 | ● | ● | ● | ● | ● | ● |
| Nord Electro 5 | ● | ● | ● | ● | ● | ● |
| Nord Piano | ● | – | ● | ● | ● | ● |
| Nord Piano 2 | ● | ● | ● | ● | ● | ● |
| Nord Piano 3 | ● | ● | ● | ● | ● | ● |
| Nord Wave | ● | ● | ● | ● | ● | ● |
| Nord C1 | – | – | – | – | – | – |
| Nord C2 | ● | – | ● | ● | ● | ● |
| Nord C2D | ● | – | ● | ● | ● | ● |
| Nord Electro 6 | ● | ● | ● | ● | ● | ● |
| Nord Electro 7 | ● | ● | ● | ● | ● | ● |
| Nord Organ 3 | ● | – | ● | ● | ● | ● |
| Nord Wave 2 | ● | ● | ● | ● | ● | ● |
| Nord Piano 4 | ● | ● | ● | ● | ● | ● |
| Nord Piano 5 | ● | ● | ● | ● | ● | ● |
| Nord Piano 6 | ● | ● | ● | ● | ● | ● |
| Nord Lead 4 | ● | – | ● | ● | ● | ● |
| Nord Lead A1 | ● | – | ● | ● | ● | ● |
| Nord Grand | ● | ● | ● | ● | ● | ● |
| Nord Grand 2 | ● | ● | ● | ● | ● | ● |

:::danger[Untested models]
Don't send, delete, reorganise or restore on a model marked ● unless you have a
backup you can restore with Nord Sound Manager. Nobody has tried these yet.
:::

## Help test

If you have a model marked ●, run [Check my Nord](/docs/guide/compatibility/).
It only reads from the keyboard. **Share results to help** opens a pre-filled
issue on GitHub. That is what turns a ● into a ✓.

## Opening files from your computer

Some models can only be read from a connected keyboard for now:

- **Import a file…** takes Stage 4, 3 and 2 programs.
- **Choose a folder…** reads Stage 4 and Electro 6 programs, plus presets,
  samples, pianos and `.ns4b` backups.

See [File types](/docs/reference/file-types/).

## Moving programs between models

A program can only be sent to the model it was made for. A Stage 2 or 3
program can be converted into a Stage 4 one; see
[Convert to Stage 4](/docs/guide/convert/).
