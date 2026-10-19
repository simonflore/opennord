---
title: Back up and restore
description: Save your whole Nord to one file, put it back, reorganise a backup without the keyboard, and check that a backup is intact.
sidebar:
  order: 9
---

Back up before you send, delete, move or restore anything. A backup is one file
on your computer with everything on the keyboard.

## Back up your Nord

1. [Connect your Nord](/docs/guide/connect/).
2. Click its name in the top bar and pick **Back up Nord**.
3. OpenNord reads every file ("Backing up N of M…") and downloads
   **OpenNord Backup *date*.ns4b**.

For models where OpenNord can only reach the programs yet, the download is a
`.zip` of the programs, and OpenNord says so.

## Restore a backup

Restoring, and reorganising a backup offline, work with OpenNord and Nord Sound
Manager backups in the `.ns4b` format (Stage 4). Restoring replaces everything
on the keyboard, so keep the backup file until you've checked the result.

1. Click your Nord's name › **Restore Nord…** and pick a `.ns4b` file.
2. OpenNord previews what will change, then asks **Restore to *Nord*?**. A
   restore writes the backup's own content back to the Nord, replacing the
   current programs, presets, Live and settings.
3. Factory sample libraries in the backup are skipped. OpenNord lists them with
   links to Nord's downloads; install those with Nord Sound Manager.

## Reorganise a backup offline

You don't need the keyboard to rearrange a backup:

1. On the **Device** page, pick **Open a backup to organize offline** (or a
   backup from your folder).
2. Drag programs between slots.
3. **Save reorganized backup** downloads a new `.ns4b`. Your original file is
   unchanged.

Very large backups can only be saved from Chrome or Edge on a computer.

## Check a backup

**Check the opened backup** reads every file in it and plays every piano note
through, on your computer, to show that the backup is intact. It changes
nothing. You get "Everything in this backup checks out." or a list of the files
that need attention, plus a summary of what the backup holds.
