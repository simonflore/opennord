---
title: Convert to Stage 4
description: Turn a Nord Stage 2 or Stage 3 program into one your Stage 4 can load, and read the conversion report.
sidebar:
  order: 3
---

OpenNord can turn a **Stage 2 or Stage 3 program into a Stage 4 program**. The
result is a real `.ns4p` file your Stage 4 can load. It is a good first guess
at the original sound, not a perfect copy: the Stage 4's engines differ, so
some things need a pick by ear.

## Convert a program

1. Open a Stage 2 or Stage 3 program in the [Library](/docs/guide/library/).
2. Press **Convert to Stage 4**.
3. Read the report, in four groups:
   - **Carried over**: set the same on the Stage 4.
   - **Close match**: the nearest Stage 4 setting.
   - **Pick on your Stage 4**: choose this one yourself on the keyboard.
   - **Doesn't carry over**: the Stage 4 program leaves it out.
4. Press **Save**. Without a connected folder the file downloads. With a folder,
   choose **Save as new file** or **Overwrite** (when a file of that name is
   there); **Remember my choice** skips the question next time.

Then load it on your Stage 4: [send it to a slot](/docs/guide/send/), or use Nord Sound
Manager.

## What carries over

- **Organ:** model, drawbars, percussion, vibrato/chorus.
- **Piano:** type, volume, octave.
- **Synth:** oscillator mode, filter, envelopes, LFO.
- **Effects:** on/off and type, where the menus line up.

## What doesn't, yet

- Morphs, the arpeggiator, the second panel and the rotary speaker.
- **Piano and sample sounds** always come back as **Pick on your Stage 4**:
  choose the closest piano or sample on the keyboard.
- Conversion only goes forward, to the Stage 4.

The conversion hasn't been compared by ear on a real Stage 4 yet. If something
sounds clearly wrong, [let us know](https://github.com/simonflore/opennord/issues/new).
