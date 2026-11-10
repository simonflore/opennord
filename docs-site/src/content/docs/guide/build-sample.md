---
title: Build a sample
description: Make a Nord sample or piano from your own WAV or AIFF recordings, find their loops, map them across the keyboard and save.
sidebar:
  order: 5
---

**Build a sample** turns your own recordings into a sample for a Stage 4
(`.nsmp4`) or Stage 3 (`.nsmp3`), or a piano (`.npno`). Open it from
**User Samples** › **+ Add** › **Build a sample…**.

## Steps

1. **Start a build.** **New build** starts one; **Open a project file…** opens a
   saved `.onsample` project. Your builds are listed under **Your builds**.
   To rework a sample you already have, open it under **User Samples** and
   choose **More** › **Open in Build a sample**: each zone comes over with its
   keys, root, loop, loop decay and tuning. A zone with velocity layers keeps the
   loudest playing and the others as takes. Each recording comes up to full
   level, so set **Level** per take if they should differ. Not offered for Nord
   factory samples.
   **Open Nord Sample Editor project…** opens a project made in Nord Sample
   Editor: pick the folder with the `.nsmpproj` and its recordings. Zones, the
   sample that's switched on in each, trims, loops, loop crossfades, decay,
   levels, tuning, key ranges and category come over; the editor's short loop
   doesn't (use **Find loop**). A recording that isn't in the folder is named.
2. **Name it and pick what it is for:** **Stage 4**, **Stage 3** or **Piano**.
   For a sample, choose its **Category** (User until you change it); the Nord
   and Nord Sound Manager list it under that. For a piano, choose the **Piano
   type** and an optional **Variant**.
   Pianos are marked "Not yet tried on a Nord".
3. **Add recordings.** Under **Clips**, **Add files…** (`.wav`, `.aif`, `.aiff`)
   or drag files in.
   - Each clip goes on the key in its file name (`Strings_C3.wav`), else the
     note the file stores, else the pitch OpenNord hears. A clip without a clear
     pitch waits until you give it a key with **Place…**.
   - A loop saved in the file comes along. On the Nord a loop always runs to the
     end of the sample, so the take ends where the loop does.
   - **Split…** cuts one long recording of several notes into one clip per note,
     at the pauses between them.
   - **Record** records from a microphone or audio interface. Pick the
     **Input** and **Channels**, then what to record into: **a new take** on the
     selected zone (with no zone yet, **a new zone** on the note OpenNord hears),
     or **one long take** of several notes with pauses, split afterwards.
     Recording starts when the sound is louder than **Start when louder than**,
     so no silence is kept in front, and can stop by itself after 2 seconds of
     silence. The meters show the input's level; the dashed line is the start
     level. Recording needs a browser that may use the microphone (allow it when
     asked).
4. **Shape each zone:** level, loop on or off, fades and key range. The take
   editor sets the **Start** and the **Loop seam**. A piano has velocity
   layers, **soft to hard** (up to 30 per zone). Under the take editor:
   - **Find loop** looks for a loop start and end where the sound runs on
     without a click or a jump in level, and says how clean the join is. The
     take then ends at the loop's end.
   - **Normalize** sets the take's level so its loudest moment reaches −1 dB.
     In a piano it sets one level for the whole zone, from its loudest layer,
     so the softer layers stay softer.
   - **Trim silence** cuts the silence before and after the sound. A looped
     take keeps its end.
   - **Loop crossfade** (in ms) smooths a join you can still hear: the end of
     the loop fades into the sound just before the loop start. It is written
     into the sample, so the Nord plays it the same.

   **All takes**, above the zone, runs **Find loops**, **Normalize** or
   **Trim silence** on every take of the build at once. **Undo** takes it back
   in one step.
5. **Map and listen.** **Auto map** spreads the zones across the keyboard. Play
   it on screen or from a MIDI keyboard.
6. **Fix what's listed** under **Before you save**.
7. **Save.**
   - **Save sample** (or **Save piano**) adds it to your Library, or saves it into
     your folder. A piano downloads when no folder is connected.
   - **Save project file** keeps the whole build as `.onsample`, to carry on
     later or on another computer.
   - **Save for Nord Sample Editor** (samples only) downloads a `.zip` with a
     Nord Sample Editor project (`.nsmpproj`) and its recordings. Unzip it, keep
     the files together, and open the `.nsmpproj` in Nord Sample Editor. The
     zones, takes (the one that plays is switched on), trims, loops, loop
     crossfades, levels and key ranges come along.
   - **Send to Nord**, with a Stage 4 connected, sends the sample to an empty
     place on the keyboard: the first one, or the one you pick under **Location
     on the Nord**. The Nord's free sample memory is shown above it; see
     [Send a sample](/docs/guide/send/#send-a-sample).

The build saves as you go, with undo and redo. Deleting a build removes its
recordings, but not the samples you saved from it.

Only share samples and pianos you made from your own recordings. See
[Legal](/docs/reference/legal/).
