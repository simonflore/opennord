---
title: Questions and problems
description: Answers to common questions, and what to do when something doesn't work.
sidebar:
  order: 3
---

## Is it safe to connect my keyboard?

Reading from the keyboard (listing, opening, copying, backing up) doesn't change
anything on it. Sending, deleting, reorganising and restoring do. Those have
been tested on real Nord Stage 4 and Stage 3 keyboards, but not widely.
OpenNord is beta software with no warranty.

Before you change anything: make a backup you can restore with Nord Sound
Manager, try a spare slot first, and don't write to a model that isn't tested.
See [Supported instruments](/docs/reference/instruments/).

## Does OpenNord upload my files?

No. Your programs, samples and pianos are opened on your own device. Imported
files are kept in your browser, and a connected folder is read where it is.

## Do I need Nord Sound Manager?

No, not to read, organise, back up or send programs. Keep it for what OpenNord
doesn't do yet, such as installing Nord's factory libraries. **Quit it before
connecting your Nord to OpenNord**: only one app can use the USB connection at a
time.

## My Nord doesn't connect

- Use **Chrome or Edge on a computer**, the desktop app, or the iPad app. Other
  browsers, and the iPhone, can't reach a Nord over USB.
- Quit Nord Sound Manager, then unplug the cable and plug it back in.
- For an **older Nord like the Stage 2**, use the desktop app. On Windows, install
  the [UsbDk](https://github.com/daynix/UsbDk/releases) driver first.
- See [Connect your Nord](/docs/guide/connect/).

## "Send to Nord" is greyed out

The button says why. Common reasons: a Stage 3 program on a Stage 4 (convert
it first), a Live program, or a model OpenNord doesn't write to yet. See
[Send a program](/docs/guide/send/#when-sending-is-off).

## My folder looks empty

- After a reload, use **Reconnect folder**: the browser asks for permission
  again.
- A folder scan adds Stage 4 and Electro 6 programs. Import Stage 2 and 3
  programs with **Import a file…**.
- A folder in Google Drive or another cloud app (on Android, for example) can look connected and
  give nothing: make the files available offline.

## Can I share Nord's factory sounds?

No. OpenNord only helps you share your own work. Programs refer to factory
samples by name and link to Nord's own downloads. See [Legal](/docs/reference/legal/).

## A program shows the wrong thing

Please [open an issue](https://github.com/simonflore/opennord/issues/new) with
the model, its OS version and, if you can, the file.
