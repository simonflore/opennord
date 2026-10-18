---
title: Read a program
description: What OpenNord shows when you open a Nord program, and how to listen to its organ and piano.
sidebar:
  order: 2
---

Open a program from the [Library](/docs/guide/library/) and OpenNord shows what is in
it, laid out like the instrument.

## Stage 4 programs

- **Keyboard zones**: which engine plays where on the keyboard.
- **One card per active engine**: piano, organ, synth, with every setting as
  the panel shows it.
- **Layer & global FX**: the effects on each layer and the global ones.
- **Morphs**: what the wheel, aftertouch and pedal change.
- **External / MIDI** settings.
- **Samples this patch references**: the factory samples and pianos the program
  uses, each with a link to Nord's official download or the Nord Sample
  Library. OpenNord never ships the audio itself.
- **All parameters**: a drawer with every setting, and a search box.

When the program's second scene changes something, a **Scene I / II** switch
shows each one; the scene the program was saved with is marked "saved".

## Listen

- **Organ:** press **Play this organ** and play it from the on-screen keys or a
  MIDI keyboard. The B3 is OpenNord's own tonewheel model: drawbars,
  percussion and vibrato, no rotary or effects yet. Other organ models play a
  simpler sketch.
- **Piano:** **Listen** plays the program's piano at **Soft**, **Medium** or
  **Hard** touch. It appears when that piano's `.npno` file is in your connected
  folder, or in a backup there.

## Stage 2 and 3 programs

Stage 3 (`.ns3f`, `.ns3p`) and Stage 2 (`.ns2p`) programs open in the same kind
of view, per engine. They also have **Convert to Stage 4**; see
[Convert to Stage 4](/docs/guide/convert/).

## Other Nords

Programs from other models open in a view of their settings where OpenNord
reads them in full, or a summary card ("Recognized Nord file") where it only
recognises the file. See [Supported instruments](/docs/reference/instruments/).

If a program can't be read, OpenNord says "OpenNord can’t read “X”." Please
[tell us](https://github.com/simonflore/opennord/issues/new) which model and OS
version saved it.
