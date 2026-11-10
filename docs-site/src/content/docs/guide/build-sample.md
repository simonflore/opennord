---
title: Build a sample
description: Make a Nord sample or piano from your own recordings, find their loops, map them across the keyboard, and save it or send it to your Nord.
sidebar:
  order: 5
---

**Build a sample** turns recordings into a sample for a Stage 4 (`.nsmp4`) or
Stage 3 (`.nsmp3`), or a piano (`.npno`). Open it from **User Samples** ›
**+ Add** › **Build a sample…**.

## How it fits together

A build goes one way: **recordings → zones on the keys → a sample on your Nord.**

- **Recordings** are your audio: files you add, or takes you record.
- A **zone** is a stretch of keys with a root note. It plays one recording,
  trimmed and maybe looped: that's its **take**. A zone can keep a few spare
  takes and you pick the one that plays. (A piano plays several at once, soft to
  hard: its **layers**.)
- **Save** makes the sample from your zones. The build itself stays in OpenNord,
  so you can come back and change it.

That's all. Everything below is a way to get recordings in, shape the zones, or
get the sample out.

## 1. Start a build

**New build ▾** offers every way to start:

- **From recordings**: an empty build to add or record audio into.
- **From a sample file…**: a sample of your own, to rework. A sample already
  in your Library opens the same way from **User Samples** › **More** ›
  **Open in Build a sample**. Each zone comes over with its keys, root, loop,
  loop decay and tuning; a zone with velocity layers keeps the loudest playing
  and the others as spare takes. Every recording comes up to full level, so set
  **Level** per take if they should differ. Not for Nord factory samples.
- **From an SFZ instrument…**: pick the instrument's folder.
- **From a Nord Sample Editor project…**: pick the folder with the `.nsmpproj`
  and its recordings. Zones, the sample switched on in each, trims, loops,
  crossfades, decay, levels, tuning, key ranges and category come over; the
  editor's short loop doesn't (use **Find loop**).
- **Open a saved build…**: a build saved as a project file (`.onsample`).

Then name it and pick what it's **For**: **Stage 4**, **Stage 3** or **Piano**.
A sample gets a **Category** (User until you change it), which is where the Nord
lists it. A piano gets a **Piano type** and an optional **Variant**, and is
marked "Not yet tried on a Nord".

## 2. Add recordings

Under **Recordings**:

- **Add files…** (`.wav`, `.aif`, `.aiff`), or drag files in. Each goes on the
  key in its file name (`Strings_C3.wav`), else the note the file stores, else
  the pitch OpenNord hears. One with no clear pitch waits until you give it a key
  with **Place…**. A loop saved in the file comes along.
- **Record** records from a microphone or audio interface: into a new take on
  the selected zone (a new zone on the note you play, when there's none yet), or
  into one long take of several notes with pauses. Recording starts when you
  play louder than **Start when louder than**, and can stop after 2 seconds of
  silence. Allow the microphone when the browser asks.
- **Split…** cuts one long recording into a recording per note, at the pauses.

## 3. Shape the zones

**Zones** lists every zone: its keys, its take drawn with the loop shaded, the
loop's length and how clean its join is (with its **Loop crossfade**, as the
sample will play). Joins that may click are marked, and
**Next loop to check** takes you to them one by one. Choose a zone to edit it
above.

For the zone you're editing:

- The waveform sets **Start**, **Loop start** and **End** (drag them, or use the
  arrow keys). **Start** zooms in on the attack; **Loop seam** shows the join you
  hear while a key is held. On the Nord a loop always runs to the end of the
  sample, so **End** is where the loop ends.
- **Find loop**, **Normalize** and **Trim silence** work on **This take** or,
  switched over, on **All takes** at once (one **Undo** takes it back):
  - **Find loop** looks for a join without a click or a jump in level, says how
    clean it is, and ends the take on it.
  - **Normalize** brings the loudest moment to −1 dB. In a piano it sets one
    level per zone from its loudest layer, so soft layers stay soft.
  - **Trim silence** cuts the silence before and after the sound; a looped take
    keeps its end.
- The cards below set **Root key**, **Tune**, **Level**, **Loop**,
  **Loop decay** (a held note fades out over that time) and **Loop crossfade**
  (smooths a join you can still hear; it's written into the sample, so the Nord
  plays it the same).

On the keyboard, drag a split to move it; **Auto map** spreads the zones out
again. Play it on screen or from a MIDI keyboard. Anything that would stop the
sample from saving is listed under **Before you save**.

## 4. Save, or send to your Nord

**Save…** opens the checks and:

- **Save sample** (or **Save piano**): adds it to your Library, or saves it into
  your folder. A piano downloads when no folder is connected.
- **Send to Nord**, with a Stage 4 connected: the Nord's free sample memory is
  shown, and the sample goes to an empty place, the first one or the one you pick
  under **Location on the Nord**. Nothing on the Nord is replaced; see
  [Send a sample](/docs/guide/send/#send-a-sample).
- **Other ways to save**:
  - **Save project file** keeps the whole build (`.onsample`), to carry on
    later or on another computer.
  - **Save for Nord Sample Editor** (samples only) downloads a `.zip` with a
    Nord Sample Editor project and its recordings. Unzip it, keep the files
    together, and open the `.nsmpproj` there.

The build saves as you go, with undo and redo. Deleting a build removes its
recordings, but not the samples you saved from it.

Only share samples and pianos you made from your own recordings. See
[Legal](/docs/reference/legal/).
