---
title: Where it runs
description: OpenNord in the browser, as a desktop app and on the iPad, and what each one can do.
sidebar:
  order: 3
---

Reading files, the Library, playing samples and converting programs work
everywhere. Talking to your Nord over USB and playing from a MIDI keyboard
depend on where you run OpenNord.

| | Reading & Library | USB: your Nord | MIDI keyboard | Folder remembered |
|---|---|---|---|---|
| **Chrome or Edge on a computer** | ✓ | ✓ | ✓ | ✓ |
| **Firefox on a computer** | ✓ | – | ✓ | – |
| **Safari on a Mac** | ✓ | – | – | – |
| **Desktop app** (macOS, Windows) | ✓ | ✓, older Nords too | ✓ | ✓ |
| **iPad app** (M1 or newer) | ✓ | ✓ | ✓ (USB or Bluetooth) | – |
| **iPhone, or any phone browser** | ✓ | – | – | – |

## In the browser

Open OpenNord in any modern browser. To reach your Nord over USB you need
**Chrome or Edge on a computer**; other browsers show "Open this in Chrome or
Edge to connect". Everything else works without it.

Chrome and Edge also remember a connected folder between visits (they ask you
to confirm again after a reload). Other browsers let you pick a folder each
time.

## The desktop app

There is a desktop app for **macOS 13 or newer** (one download for Intel and
Apple silicon) and **Windows 10 or newer** (64-bit), on the
[releases page](https://github.com/simonflore/opennord/releases). It can also
connect to older Nords that a browser can't, like the Stage 2. On the Stage 2,
reading and copying from the keyboard have been tested; sending has not.

- **Windows:** older Nords need one setup step, the
  [UsbDk](https://github.com/daynix/UsbDk/releases) driver. The installer shows
  a SmartScreen notice the first time.

## The iPad app

An iPad app is being built. It needs an iPad with an **M1 chip or newer**
(iPadOS 16 or newer), because only those can talk to a Nord over USB. The first
time, you switch the Nord driver on in **Settings › Apps › OpenNord ›
Drivers**. It isn't available to download yet.

## iPhone

The iPhone can't reach a Nord over USB, so there is no transfer on iPhone. Use
it to read and browse your files; use a computer or an iPad to move programs.
