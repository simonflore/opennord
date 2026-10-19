---
title: Send a program to your Nord
description: Write a program from OpenNord to a slot on your Nord, and what can stop it.
sidebar:
  order: 8
---

:::danger[This replaces what is in the slot]
Sending a program to a slot that holds one replaces it. There is no undo on the
keyboard. [Back up your Nord](/docs/guide/backup/) first, and try a spare slot.

Sending has been tested on the Nord Stage 4 and Stage 3 only. On other models
it is untested; see [Supported instruments](/docs/reference/instruments/).
:::

## Send a program

1. [Connect your Nord](/docs/guide/connect/).
2. Open the program in the Library and press **Send to Nord**, or press
   **Send a file to Nord…** on the **Device** page and pick a program file.
3. **Choose a slot.** Slots are shown the way the Nord shows them, like A:12,
   with the program in each, or "— empty".
4. Check the confirmation: "This replaces “Name” at A:12." or "Send to A:12
   (currently empty)." It also shows the name the program will have on the
   Nord (a name that's already used gets a number).
5. Press **Send to Nord**. Keep the Nord connected until it finishes.

## When sending is off

The button explains why:

- **"Connect your Nord to send it."**
- **"This is a Stage 3 program. Convert it to Stage 4 first, then send the
  result."** See [Convert to Stage 4](/docs/guide/convert/).
- **"This is a Live program; OpenNord can’t send Live programs yet."**
- **"…can’t be sent to a [model]."**: the program is for another Nord.
- **"This file was saved in a newer format than OpenNord knows…"**
- An old Stage 2 OS file: open it in Nord Sound Manager and save it again
  first.
- **"OpenNord only reads this keyboard…"**: OpenNord doesn't write to this model
  yet.

Presets can't be sent yet.

## Delete a program

On the **Device** page, **Delete** on a row asks **Delete from Nord?** first. It
is permanent: back up first if you may want it back.
