---
title: Connect your Nord
description: Plug your Nord in over USB, see what is on it, and organise its programs and samples.
sidebar:
  order: 7
---

OpenNord talks to your Nord over its USB cable, directly from the page. It
works in **Chrome or Edge on a computer**, in the **desktop app**, and in the
iPad app. See [Where it runs](/docs/start/platforms/).

:::caution[Beta: writing changes your keyboard]
Listing, reading and backing up only read from your Nord. Sending, deleting,
moving and restoring change what is on it. [Back up first](/docs/guide/backup/).
:::

## Connect

1. **Quit Nord Sound Manager** if it is open. Only one app can talk to the Nord
   at a time, and Sound Manager keeps the connection to itself.
2. Plug the Nord into the computer with a USB cable and switch it on.
3. Press **Connect** in the top bar (or **Connect your Nord** on the **Device**
   page), and pick your Nord in the browser's list.

The top bar then shows your Nord's name with a green light, and its programs,
samples and pianos appear in the Library under **On Nord**.

If it doesn't connect, **Couldn’t connect your Nord** explains why, with
**Help connecting** and **Try again**. Older Nords, like the Stage 2, often
can't be reached from a browser at all; use the desktop app (on Windows, with
the [UsbDk](https://github.com/daynix/UsbDk/releases) driver).

## The Nord menu

Click your Nord's name in the top bar:

- **Back up Nord**: saves the whole keyboard to one file. See [Back up](/docs/guide/backup/).
- **Restore Nord…**: puts a backup back on the keyboard.
- **Check my Nord**: what OpenNord supports on this model. See
  [Compatibility](/docs/guide/compatibility/).
- **Manage slots**: move, sort and delete programs.
- **Disconnect**.

## The Device page

**Device** in the rail shows what is on the keyboard:

- **Programs** and **Samples**, with the program count and how much storage is
  free.
- Program rows by bank: click one to open it in the Library, or **Delete** it
  from the Nord.
- **Send a file to Nord…** writes a program file from your computer; see
  [Send a program](/docs/guide/send/).

### Organise your programs

Press **Organize**:

1. Choose how dragging works: **Swap** (two programs trade places) or
   **Insert** (the programs after it move down).
2. Drag a program onto an empty slot to move it, or onto another program.
3. Per bank, **Sort A–Z** and **Compact** (close the gaps).
4. Confirm. **Back up my Nord first** is ticked by default and downloads a
   safety backup before anything moves.

Press **Done organizing** when you're finished.

### Samples on the Nord

Under **Samples**, open a sample to read it off the keyboard and look at it,
read-only. **← Back to samples** returns to the list.

## Keyboards OpenNord only reads

On models OpenNord doesn't write to yet, it shows
**Browsing only on this keyboard**: sending, deleting, rearranging and
restoring stay off, and you can still browse, listen and back up.

If you unplug the Nord, OpenNord says so; connect it again to carry on.
