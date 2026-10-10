# Hardware test plan: one session with a Stage 4 and an iPad

One ordered checklist for a ~2-hour session with a Nord Stage 4, a computer and an iPad. It
turns the open questions in the engine and format notes (and issue #30) into short, repeatable
takes: what each settles, what to do, what should happen and what to write down. A results
table is at the end.

The kit that goes with it (all in `packages/core`):

| Tool | What it does |
|---|---|
| `npm run hw:test-piano` | Writes four tiny test pianos (T0–T3) made from sine tones, a WAV preview of each recorded note, and MIDI files to play the Nord from a DAW. Every piano passes `checkNpnoAcceptance(deep)`. Source: `scripts/make-test-piano.ts`, `src/lib/hwtest/test-piano.ts`. |
| `npm run hw:compare -- <take.wav> …` | Measures a recording (pitch, level, brightness, attack, decay, tremolo, vibrato) and prints it next to OpenNord's own render of the same note, with the differences in cents, dB and ms. Source: `scripts/compare-recording.ts`, `src/lib/hwtest/`. See [Comparing a recording](#comparing-a-recording). |

Everything the kit writes, and every recording, goes to **`packages/core/hardware-test/`**,
which git ignores. See [Recordings stay local](#recordings-stay-local).

## How the session runs

The groups keep their letters, but they run in the order **A → C → D → B**. Group B is the
only one that writes to the instrument (it loads home-made pianos). If something goes wrong
there, everything else is already recorded. Within each group the steps are in order.

| Block | Time | What |
|---|---|---|
| Before the session | ~45 min, at home | Kit, DAW project, iPad build, factory piano file (no Nord needed) |
| 0. Set-up and backup | 20 min | Cables, settings, full backup; two iPad checks while the backup runs |
| A. Read-only checks | 10 min | "Check my Nord", preset order, then start the backup check |
| C. Sound measurements | 45 min | Piano, organ, synth and effects takes |
| D. iPad | 10 min | MIDI input with the Nord as the keyboard |
| B. Loading a written piano | 25 min | T0 first, then T1–T3; pitch, loop, touch, level, release |
| Clean-up | 5 min | Delete the test pianos; check the factory pianos |

If time runs short, skip the steps marked *(optional)* first, then the rest of group C. Never
skip the backup.

## Before the session (at home, no instrument)

- [ ] **P1. Build the kit.** In `packages/core`: `npm run hw:test-piano`. It prints one block per
  test piano, with "acceptance: all 16 checks ok". Listen to `hardware-test/previews/`: T0/T1 is
  a warm A (440 Hz). T2 has a bright, buzzy hard layer and a pure, flute-like soft layer. This is
  exactly what the Nord should play on key A4.
- [ ] **P2. Get one factory piano file.** For the level and pitch comparisons you need your own
  copy of one factory piano that is on the instrument. Download it from Nord's Piano Library
  (or take it from an NSM backup) into `hardware-test/pianos/`. A small size is fine. Note which
  one; it is called "the factory piano" below.
- [ ] **P3. DAW project.** 48 kHz (or 44.1 kHz), 24-bit. One stereo audio track from the
  interface inputs that the Nord's main outputs L/R go into. One MIDI track that sends to the Nord
  (USB MIDI, channel 1), with the files from `hardware-test/midi/` on it. Turn off MIDI thru /
  input monitoring on that track, so notes you play on the Nord don't loop back. Export takes as
  WAV (no normalizing, no effects) into `hardware-test/recordings/`.
- [ ] **P4. iPad app (for D1–D2).** Build and install the OpenNord iPad app (`docs/IPAD.md`,
  "Build"). The MIDI plugin has never been compiled, so expect to fix small Swift errors. If it
  won't build, skip D1–D2; D3–D4 also work in Safari with the web app.
- [ ] **P5. Print the [results template](#results-template)** or keep it open.

## 0. Set-up and backup (20 min)

- [ ] **0.1 Cables and levels (5 min).** Nord main out L/R → interface. Nord USB → computer.
  Set the Nord's master volume to a mark you can find again (full is easiest). Set the
  interface gain so a hard full-drawbar organ chord peaks around −6 dBFS. **Leave both alone for
  the rest of the session**, so levels compare between takes.
- [ ] **0.2 Instrument settings (2 min).** Write down the OS version (System menu, or NSM's
  status line), the NSM version and the browser. Check Master Tune = 440 Hz (0 cents) and
  Transpose off. Leave the organ's Click Level and the other system sound settings at what you
  normally use, but write them down.
- [ ] **0.3 Full backup (10–30 min, mostly waiting).** In NSM, make a full backup of the
  instrument (pianos and samples included) and note where the `.ns4b` file goes. **Know how to
  restore before going on:** NSM's Restore takes that file and writes everything back. A test
  piano never touches programs or settings; if the instrument acts up after B, delete the test
  piano in NSM's Piano tab first, and restore only if something else changed.
  - While the backup runs, do **D3** and **D4** (they don't need the Nord).

## A. Read-only checks (15 min)

Nothing in this group writes to the instrument.

### A1. Partition probe on connect, and "Check my Nord" (5 min)

- **Settles:** the device's real partition map (`docs/PROTOCOL-RE.md`, "Addressing";
  `docs/NORD-PRODUCT-LINE.md`, "Conflicts to settle on hardware"), and that connect behaves as
  designed for a Stage 4. Issue #30, #21: connect partition for unconfirmed models.
- **Steps:**
  1. Quit NSM (only one program can use the Nord's USB connection at a time).
  2. In OpenNord (Chrome/Edge), open the browser's developer console, then go to the Device
     page and connect the Nord.
  3. Go to Home → *Check my Nord* (the Compatibility page) → *Check my Nord*.
  4. *Share results to help* opens a pre-filled GitHub issue: copy the table into your notes
     (submitting it is up to you).
- **Expected:** connect lists your programs. On a Stage 4 the console shows **no**
  `device.partition-probe` line, because the Program index (6) is hardware-confirmed and the
  probe is skipped. *Check my Nord* lists about 12 memory areas (0–11, perhaps 12). The probe
  reads at most 8 files per area, so a file count of 8 means "8 or more"; the file types are
  what matter.
- **Write down:** whether a `device.partition-probe` line appeared (copy it if so), and the full
  table: area, file count, file types. Note whether area 1 (your own pianos) is empty.

### A2. Stage 4 preset area order: Organ / Piano / Synth (2 min, from A1's table)

- **Settles:** which of areas 7, 8 and 9 hold organ (`ns4o`), piano (`ns4n`) and synth (`ns4y`)
  presets. `docs/PROTOCOL-RE.md` says 7 Organ, 8 Piano, 9 Synth; NSM's constructor order says
  7 Synth, 8 Organ, 9 Piano (`docs/NORD-PRODUCT-LINE.md`). The registry
  (`src/lib/clavia/partitions.ts`), preset browsing (`device/presets.ts`) and backup restore
  targets (`device/ns4b.ts`) follow the first order.
- **Steps:** read the file types for areas 7, 8 and 9 in A1's table.
- **Expected:** one type per area. An empty area shows no type and can't be identified. If one
  is empty, store one preset of that kind on the panel (see the Stage 4 manual, "Presets") and
  run *Check my Nord* again, or leave it for another day.
- **Write down:** area 7 = …, 8 = …, 9 = …

### A3. "Check backup" on the real backup (start it, then carry on; 3 min of your time)

- **Settles:** whether the backup check (`src/lib/ns4/backup-check.ts`) gives the right verdict
  on a real, full backup, and how long it takes. Issue #30, #23: "backup check freezes the
  page" (P2).
- **Steps:** disconnect the Nord in OpenNord (the next group needs no browser). On the Device
  page → *Open a backup to organize offline* → *Open a backup (.ns4b)* → choose the backup from
  0.3 → *Check backup*. Note the time, and go on with group C while it runs; look back between
  takes.
- **Expected:** "Everything in this backup checks out.", a line counting programs, Live,
  presets, settings, pianos and samples, and "Every note of all … pianos plays back". The page
  may freeze for seconds at a time on large pianos (known issue #23): leave it alone.
- **Write down:** the three lines, any problem lines, the total time from click to result, and
  the longest freeze you noticed.

## C. Sound measurements for replication (45 min)

These takes feed OpenNord's engines. The Nord only plays; you may change panel settings, but
**don't store** over existing programs (the synth step stores to an empty slot; that is the only
write in this group).

**For every take:** name the file `<test id>-<what>.wav` (e.g. `C4-organ-perc-fast.wav`), start
the recording a second before the note, and stop after the sound has died away. Effects off
unless the test is about an effect. Play from the DAW's MIDI files where the step says so, so
every take is identical. After the session, run the comparison commands listed with each test
(see [Comparing a recording](#comparing-a-recording)).

### Piano

Set-up: the factory piano (P2), Piano section only, all piano effects and reverb off, String
Resonance, Pedal Noise, Unison, Soft Release and Dyn Comp off, Timbre neutral, no pedal.

#### C1. Touch curves: Heavy, Medium, Light (8 min)

- **Settles:** the touch curve per Touch setting and how velocity maps to level
  (`docs/PIANO-ENGINE.md` §2.1 and §6, "exact touch-curve parameters per Touch setting").
- **Steps:** for each Touch setting (Medium, then Heavy, then Light): play `midi/sweep-A4.mid`
  (16 notes on A4 at velocity 127, 119, … 7, 2.5 s apart; 40 s) and record it.
  Then, with Light, play the same sweep **by hand** (16 notes, loud to soft, about one per
  second or slower) while the DAW records the Nord's own MIDI out on a second MIDI track.
- **Expected:** level falls steadily with velocity, more steeply with Heavy. If Heavy and Light
  give the same levels from the MIDI file, Touch doesn't apply to incoming MIDI; the hand-played
  take is then the one that counts.
- **Write down:** for each take, whether the levels differ between Touch settings, and the
  hand-played velocities as the DAW shows them.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/C1-touch-medium.wav --sweep`
  (for the hand-played take add `--velocities 120,105,…` from the DAW).

#### C2. Output rate and the +27-cent question (4 min)

- **Settles:** whether the piano pitch sum really adds +27 cents, and whether the instrument's
  audio clock is 44.1 kHz or the 43,402 Hz the effects DSP is designed for
  (`docs/PIANO-ENGINE.md` §2.3 and §6; `docs/EFFECTS-ENGINE.md` §10.12). The ratio
  44,100 / 43,402 is 27.6 cents, so the constant may be a clock correction.
- **The three hypotheses:**
  - **A:** 44.1 kHz, no +27 c.
  - **B:** 44.1 kHz, +27 c (the instrument would be 27 c sharp).
  - **C:** 43.4 kHz clock, +27 c to make up for it.

  A and C sound the same on every key except where a recording plays at its own pitch: the
  instrument never plays a stroke faster than recorded, so the +27 c is cut off there and C plays
  27.6 c flat. On a factory piano that can only be the top key (C8), and only if its top zone
  reaches its recorded note; on the test pianos it is A4 (B2). B is 27 c sharp on every other
  key.
- **Steps:** play `midi/pitch-A3-Gs4-A4.mid` (A3, G#4, A4, 3 s each, velocity 100) on the
  factory piano and record it. Then play the highest key (C8) for 3 s and record that too.
- **Expected:** all within a few cents of equal temperament if A or C holds.
- **Write down:** nothing on the spot; compare afterwards.
- **Compare (afterwards):** `--nth` picks one note out of the take (A3 = 1, G#4 = 2, A4 = 3):
  `npm run hw:compare -- hardware-test/recordings/C2-pitch.wav --nth 3 --note A4 --engine piano --npno hardware-test/pianos/<factory>.npno --hold 3`.
  The report ends with the pitch each hypothesis predicts for that key from your own file, and
  which one the take is closest to. B2 repeats this with the test piano, where the answer is
  unambiguous.

#### C3. Dyn Comp (5 min)

- **Settles:** the Dyn Comp setting → (a, b) rows of `att' = b + att·(128 − a)/128`
  (`docs/PIANO-ENGINE.md` §2.2, "setting → row" medium).
- **Steps:** Touch Medium. For Dyn Comp 1, 2 and 3 (whatever the panel calls the three on
  settings), play `midi/sweep-A4.mid` and record it.
- **Expected:** the level range from velocity 127 to 7 shrinks with each step, and the soft end
  comes up. If the three settings are the documented rows (a = 19, 38, 57), the dB span is about
  15 %, 30 % and 45 % smaller than with Dyn Comp off (C1, Medium).
- **Write down:** the panel name of each setting.
- **Compare:** `--sweep` on each take; the dB span between the first and last note, against C1
  Medium.

### Organ

Set-up: Organ A only, model B3, drawbars as stated, Percussion off, Vibrato/Chorus off, Rotary
off (or bypassed), Organ effects off, organ volume at a fixed mark.

#### C4. Output rate: percussion decay (4 min)

- **Settles:** the organ's sample rate (44.1 vs 48 kHz, or 43.4 kHz), and which percussion
  variant is live (`docs/ORGAN-ENGINE.md`, "Open questions"; "Percussion": fast decay falls
  20 dB in 0.13 s at 44.1 kHz, variants 1/2 take 0.17/0.25 s).
- **Steps:** all drawbars in, Percussion on, 2nd, Fast, Normal volume. Play A4 4 times, holding
  each about 1 s (releasing the key cuts the percussion off), 2 s apart. If percussion makes no
  sound with all drawbars in, pull out only the 1′ drawbar (percussion silences the 1′, so you
  still hear percussion alone). Repeat with Slow decay.
- **Expected:** a short "tock" at A5 (the 2nd harmonic), dying in about 0.2 s (Fast) or 0.7 s
  (Slow).
- **Write down:** whether percussion sounded with all drawbars in.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/C4-perc-fast.wav --nth 2 --note A4 --engine organ --drawbars 000000000 --perc 2nd,fast,normal --hold 1 --window 0:1`
  (`--nth 2`: the second hit; check one or two others too).
  Use the "Fall of 20 dB" and T60 rows: Nord time ÷ OpenNord time ≈ 1.016 → 43.4 kHz,
  1.00 → 44.1 kHz, 0.92 → 48 kHz; about 1.3 or 1.9 → percussion variant 1 or 2.

#### C5. Percussion level against a full drawbar; key click (4 min)

- **Settles:** the absolute percussion level against a drawbar at full (`docs/ORGAN-ENGINE.md`,
  "Open questions", last item) and the key-click level (§5 of "Differences from this engine").
- **Steps:**
  1. Drawbars 008000000 (8′ only), Percussion off: play `midi/hold-A4-3s.mid`.
  2. Same, Percussion on (2nd, Fast, Normal): play it again.
  3. Same, Percussion Soft: play it again.
  4. Percussion off, 8′ only: play A4 staccato 5 times (the click on its own; note your Click
     Level from 0.2).
- **Expected:** with percussion the note starts with a strong A5 that dies in ~0.2 s, and the 8′
  is quieter (about −3 dB at Normal, unchanged at Soft).
- **Compare:** for takes 1–3, `--window 0:0.03` (the onset) and `--window 1:2.5` (the steady
  part), each with `--engine organ --drawbars 008000000 --perc …`; the level differences
  between the two windows, Nord against OpenNord. For take 4, `--nth 2 --window 0:0.02`
  brightness and peak, against `--click 0.5`.

#### C6. Vibrato and chorus V1–C3 (5 min)

- **Settles:** the scanner's rate, depth and chorus mix per setting (`docs/ORGAN-ENGINE.md`,
  "Vibrato / chorus scanner": depth per V/C setting and the chorus mix not traced; rate ≈ 7 Hz).
- **Steps:** 8′ only, Vibrato/Chorus on. For V1, V2, V3, C1, C2, C3: play `midi/hold-A4-3s.mid`.
- **Expected:** V1 < V2 < V3 in depth; C1–C3 sound like chorus (shimmer, less pitch wobble).
- **Compare:** `npm run hw:compare -- hardware-test/recordings/C6-V1.wav --note A4 --engine organ --drawbars 008000000 --vib V1 --hold 3 --mod`:
  the vibrato rate and depth rows.

#### C7. Rotary speeds and acceleration (5 min)

- **Settles:** horn and drum speeds and the spin-up/down times (`docs/EFFECTS-ENGINE.md` §10.11:
  default horn 0.80/7.0 Hz, drum 0.73/6.4 Hz; spin-up ~1 s horn, ~5.7 s drum if the control tick
  is 100 Hz, not confirmed).
- **Steps:** 8′ + 4′ (drawbars 008800000), Rotary on, Drive 0. Note the system rotary speed
  settings. Hold A4 (a held key, or `midi/hold-A4-8s.mid`) and record:
  1. 10 s at Slow;
  2. 10 s at Fast;
  3. start at Slow, switch to Fast after 2 s, back to Slow after 8 s, record 15 s.
- **Expected:** a clear wobble; slow under 1 Hz, fast around 6–7 Hz.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/C7-fast.wav --note A4 --hold 10 --mod --channel side`
  (the left-minus-right signal shows the rotor best) for the rates; for take 3 add `--track` and
  read off the time from the switch until the rate settles. Horn and drum run at similar
  speeds, so the rate shown is whichever modulates the level more; note which one your ear
  follows.

### Synth

#### C8. Reference patches: filter envelope amount, resonance, LFO (8 min)

- **Settles:** the filter-envelope amount in semitones (`docs/SYNTH-ENGINE.md` §7.4 and §7.8, the
  largest gap for sound), the resonance law per filter type and the preview's clipping at high
  resonance (issue #30, #24), and the LFO rate against its display (§7.6).
- **Steps:** one synth layer, oscillator ANALOG → **Pure Saw**, no unison, no vibrato, amp
  envelope attack 0 and decay ∞ (full level while held), velocity off, effects off. Store each patch in an **empty**
  program slot (so you can export it later with NSM for the comparison). Record:
  1. *Env sweep:* LP12, cutoff low (note the display, e.g. around 200 Hz), resonance 0, filter
     envelope attack 0, decay about 1 s, amount 10 (then 5). `midi/hold-A4-3s.mid`.
  2. *Resonance:* LP24, cutoff about 1 kHz, filter envelope amount 0. Resonance 0, 5, 8 and 10:
     `midi/hold-A4-3s.mid` each. Repeat at resonance 10 with LP12.
  3. *LFO:* filter off, LFO triangle → pitch with a small amount, rate set to a value the
     display shows clearly (e.g. 5 Hz). `midi/hold-A4-8s.mid`.
- **Expected:** 1 starts bright and closes in about a second; 2 gets more peaked with resonance
  and should not distort; 3 wobbles at the displayed rate.
- **Write down:** every displayed value (cutoff, resonance, env times and amount, LFO rate).
- **Compare (afterwards, with the stored program exported to `hardware-test/`):**
  `npm run hw:compare -- hardware-test/recordings/C8-env10.wav --note A4 --engine synth --program hardware-test/<patch>.ns4p --part A --hold 3 --timeline`
  (brightness over time, Nord against the preview, which assumes the amount is in octaves). For
  the LFO take, `--mod --hold 8`: the vibrato rate against the display.

### Effects

Use the factory piano for the compressor and reverb, the organ (888000000, rotary off) for the
amp.

#### C9. Compressor Normal vs Fast (3 min)

- **Settles:** which response is faster. `docs/EFFECTS-ENGINE.md` §10.8 reads Normal = attack
  0.86 ms / release 200 ms and Fast = 4 ms / 40 ms; §6 says Fast is shorter for both
  (issue #30, #25, first P2).
- **Steps:** Comp on, Amount full. Play `midi/comp-A2-burst.mid` (a soft A2 held 6 s, a loud
  chord stab at 2.5 s) with Normal, then with Fast.
- **Expected:** during the stab the A2 ducks; after the stab it comes back up, faster with the
  faster release.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/C9-normal.wav --note A2 --vs hardware-test/recordings/C9-fast.wav --timeline --step 0.02`:
  the level of both takes side by side every 20 ms. Read how long the A2 takes to come back up
  after the stab (around 2.3–2.8 s after the first note).

#### C10. Reverb sizes (5 min)

- **Settles:** decay time per size (`docs/EFFECTS-ENGINE.md` §10.10: the per-size values are
  firmware data, to be tuned by ear or measurement).
- **Steps:** Reverb Amount full, colour Normal, no predelay. For Spring, Booth, Room, Stage, Hall
  and Cathedral: play `midi/staccato-A4.mid` (one short A4, then 5 s of tail).
- **Compare:** `npm run hw:compare -- hardware-test/recordings/C10-hall.wav --note A4 --window 0.4:5`
  (after the dry note has been damped): the T60 row.

#### C11. Amp types (4 min)

- **Settles:** each amp type's tone at Drive 0 (`docs/EFFECTS-ENGINE.md` §10.7).
- **Steps:** Amp/EQ on, Drive 0, EQ flat. For Clean, Twin I, Twin II, JC I, JC II, Small Speaker,
  Very Small Speaker: `midi/hold-A4-3s.mid`.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/C11-twin1.wav --note A4 --vs hardware-test/recordings/C11-clean.wav`:
  level and brightness deltas against Clean.

## D. iPad (10 min with the Nord; D3–D4 during the backup)

D1 and D2 need the iPad app from P4 and the Nord's USB plugged into the iPad (USB-C, or the
Camera Connection Kit), with the Nord as the MIDI keyboard. In OpenNord, open a program with an
organ layer and tap *Play this organ* (or open a sample on the Samples page), then tap
*Connect MIDI keyboard*.

### D1. Does iOS's "Network Session 1" show up as a keyboard? (3 min)

- **Settles:** issue #30, #26 (P2): `presentSources` counts the network MIDI driver as a
  keyboard (`plugins/capacitor-midi-input/ios/Sources/MidiInputPlugin.swift`).
- **Steps:** with **nothing** plugged in, tap *Connect MIDI keyboard*. Then plug the Nord in.
  Then unplug it.
- **Expected (the bug):** with nothing plugged in it says "Playing from: Network Session 1", and
  after unplugging it never says "No MIDI keyboard found".
- **Write down:** the exact text in each of the three states.

### D2. Sustain after unplugging (3 min)

- **Settles:** issue #30, #26 (P2): the sustain gate is not reset on a disconnect
  (`src/lib/midi/MidiContext.tsx`).
- **Steps:** hold the sustain pedal, play a few notes, unplug the Nord while the pedal is down,
  plug it back in, then (pedal up) play and release a few notes.
- **Expected (the bug):** after reconnecting, released notes keep ringing.
- **Write down:** whether notes hang after reconnecting, and whether pressing and releasing the
  pedal once clears them.

### D3. Organ loudness on the iPad speaker (3 min, no Nord needed)

- **Settles:** issue #30, #27 (P3): after the output-level fix a single key peaks around
  −33 dBFS; is that loud enough on an iPad speaker?
- **Steps:** iPad volume at about 75 %. Open a program with an organ layer → *Play this organ*.
  Play one key, then a big chord.
- **Write down:** single key: too quiet / fine / loud. Big chord: distorted or not.

### D4. Backgrounding and resuming audio (2 min, no Nord needed)

- **Settles:** issue #30, #27 (P3): only the Play tap resumes the AudioContext, so after
  backgrounding the iPad, keys may stay silent.
- **Steps:** play the organ (D3), switch to another app for 10 s, come back, play keys without
  tapping Play. Then lock and unlock the iPad and try again.
- **Write down:** silent or sounding, after each.

## B. Loading a written piano (25 min)

This group writes to the instrument: it loads home-made pianos into **empty** places in the
Piano area. It goes last on purpose. The safe recipe it follows is
[NPNO-WRITE.md, "Hardware test recipe"](NPNO-WRITE.md#hardware-test-recipe-stage-4).

The test pianos (from P1, in `hardware-test/pianos/`):

| File | What it checks |
|---|---|
| `OpenNord_Test_0_6.0.npno` | **T0**, the container: one zone (keys A3–A4), one layer, 2 s, no loop. |
| `OpenNord_Test_1_6.0.npno` | **T1**, the loop: as T0, with a 0.5 s sustain loop after 1 s. |
| `OpenNord_Test_2_6.0.npno` | **T2**, touch: two layers, hard = bright and buzzy, soft = pure sine, same pitch and peak. |
| `OpenNord_Test_3_6.0.npno` | **T3** *(optional)*, zones: A2–A3 plays a 220 Hz recording, A#3–A4 a 440 Hz one. |

Every recording sounds at **A4 = 440 Hz** (T3's low zone at A3 = 220 Hz), and each zone's top key
is its recorded note. Keys outside a zone play nothing. Set-up for every B test: Piano section
only, the test piano selected (Piano type **Grand**, then the model), all effects off, String
Resonance, Unison, Dyn Comp and Soft Release off, Touch Medium.

### B1. Load T0 into an empty place (5 min)

- **Settles:** whether NSM and the instrument accept a file from `buildNpno`
  (`docs/NPNO-WRITE.md`, "What the instrument and NSM check").
- **Steps:** open NSM (quit OpenNord's connection first) → **Piano** tab → check the free space
  → drag `OpenNord_Test_0_6.0.npno` onto an **empty** location. Don't replace anything. On the
  Nord, select Piano type Grand and look for "OpenNord Test 0" (or "OpenNord_Test_0").
- **Expected:** NSM accepts it without a message; the piano shows up in the Grand list; key A4
  plays a warm A for 2 s.
- **If NSM refuses it:** write down the exact message ("unsupported", "corrupt", a version
  message: each points at one check). Don't try the other files; go to clean-up. (The recipe's
  fallback, step 7, writes through OpenNord's device layer instead; leave that for another
  session.)
- **If the Nord acts up** (no sound from the Piano section, an error): delete the piano in NSM's
  Piano tab, power-cycle, and check a factory piano plays. Restore the backup only if something
  else changed.
- **Write down:** NSM's reaction, the name and type shown on the Nord, whether A4 sounds.
- Then drag in **T1, T2** (and T3 if there's time) the same way, each into an empty location.

### B2. Pitch at the recorded note (4 min)

- **Settles:** the root + 4 semitone offset (`docs/NPNO-WRITE.md`, `rootNote`), the pitch formula
  and the +27-cent question with a clean signal (`docs/PIANO-ENGINE.md` §2.3; see C2).
- **Steps:** T0 selected. Play `midi/pitch-A3-Gs4-A4.mid` and record it (`B2-T0-pitch.wav`).
  Also check by ear against a tuner or the organ's A4.
- **Expected:**

  | Key | A: 44.1 kHz, no +27 c | B: 44.1 kHz, +27 c | C: 43.4 kHz, +27 c |
  |---|---|---|---|
  | A4 (the recorded note) | 440.0 Hz | 440.0 Hz | **433.0 Hz** (27.6 c flat) |
  | G#4 | 415.3 Hz | **421.8 Hz** (27 c sharp) | 415.2 Hz |
  | A3 | 220.0 Hz | **223.5 Hz** | 220.0 Hz |

  A wrong octave or a major third off means the root offset is wrong.
- **Compare:** for each key (A3 = note 1, G#4 = 2, A4 = 3 of the take),
  `npm run hw:compare -- hardware-test/recordings/B2-T0-pitch.wav --nth 3 --note A4 --engine piano --npno hardware-test/pianos/OpenNord_Test_0_6.0.npno --hold 3`.
  The last lines name the closest hypothesis. A4 separates A from C; G#4 and A3 separate B.
- **Write down:** the three frequencies, and the hypothesis that fits.

### B3. The loop seam (3 min)

- **Settles:** whether the loop fields and the 4-frame seam (`docs/NPNO-WRITE.md`, "Loop seam")
  play cleanly, and the loop sustain decay (record +0x2E, `docs/PIANO-ENGINE.md` §1.4).
- **Steps:** T1 selected. Play `midi/hold-A4-8s.mid` (A4 held 8 s) and record it.
- **Expected:** the note keeps sounding for the whole 8 s, fading smoothly (OpenNord predicts
  about −10.6 dB per second once the loop starts at 1 s). No click every 0.5 s.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/B3-T1-loop.wav --note A4 --engine piano --npno hardware-test/pianos/OpenNord_Test_1_6.0.npno --hold 8 --window 1.2:7.8`:
  the T60 row (OpenNord: about 5.7 s).
- **Write down:** clicks yes/no (and how often), whether the note lasts 8 s.

### B4. The layer switch by touch (4 min)

- **Settles:** layer order (loudest first), the switch point halfway between floors and the +20
  selection offset (`docs/PIANO-ENGINE.md` §2.1; record +0x74).
- **Steps:** T2 selected, Touch Medium. Play `midi/sweep-A4.mid` and record it. Then play A4 by
  hand from very soft to very hard.
- **Expected:** hard notes are bright and buzzy, soft ones a pure sine; one switch, no
  crossfade; loudness keeps following the velocity across the switch. OpenNord's approximate
  Touch curve puts the switch between sweep velocities 95 and 87 with the +20 selection offset,
  or between 79 and 71 without it.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/B4-T2-sweep.wav --sweep`: the
  "brightness jump" marks the switch.
- **Write down:** the two velocities around the switch; whether the level jumps at the switch.

### B5. Level against a factory piano (4 min)

- **Settles:** the +0x34 level-word hypothesis (`docs/NPNO-WRITE.md`, "+0x34 … is a
  hypothesis"; `docs/PIANO-ENGINE.md` §2.2).
- **Steps:** play `midi/hold-A4-3s.mid` on T1, then on the factory piano (P2). Record both.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/B5-T1.wav --note A4 --vs hardware-test/recordings/B5-factory.wav`
  for the measured difference. Then run each take with `--engine piano --npno <its file>` and
  subtract the two "predicted gain" values. If measured and predicted differ by more than a few
  dB, the level formula needs fixing.
- **Write down:** "T1 is about … dB louder/quieter than the factory piano".

### B6. The release (2 min)

- **Settles:** the damper and release mode the writer's defaults produce (record +0x72 = 13,
  header +0x49C = 2: a very fast release, `docs/PIANO-ENGINE.md` §3.1–3.2).
- **Steps:** play `midi/hold-A4-3s.mid` (A4 held exactly 3 s) on T1, then on the factory piano.
- **Expected:** T1 stops almost at once (about 10 ms, like a clavinet); the factory piano has a
  short natural damper.
- **Compare:** `npm run hw:compare -- hardware-test/recordings/B6-T1.wav --note A4 --engine piano --npno hardware-test/pianos/OpenNord_Test_1_6.0.npno --hold 3 --window 2.95:4`:
  the 20 dB fall and T60 rows (the window starts just before the key goes up).
- **Write down:** abrupt / natural, any click on release.

### B7. Zones *(optional, 3 min)*

- **Steps:** T3 selected. Play A2, A3, A#3 and A4.
- **Expected:** A3 = 220 Hz and A4 = 440 Hz from their own recordings (both clean); A#3 plays the
  440 Hz recording 11 semitones down; A2 plays the 220 Hz one an octave down.
- **Write down:** right zone on each key yes/no.

## Clean-up (5 min)

- [ ] In NSM's Piano tab, delete every "OpenNord Test" piano.
- [ ] On the Nord, play two or three factory pianos and an organ program.
- [ ] Optional: run *Check my Nord* again; area 1 shows what it showed in A1 (no `npno` type if
  it was empty then).
- [ ] Put the recordings in `hardware-test/recordings/` (they stay there; see below).

## Comparing a recording

`scripts/compare-recording.ts` measures a WAV of the Nord's output and, when it can, renders the
same note with OpenNord's engines and prints both side by side. Run it from `packages/core`:

```sh
npm run hw:compare -- <take.wav> --note A4 [what to compare with] [options]
```

| Compare with | Flags | OpenNord's render |
|---|---|---|
| nothing | (none) | just the measurements |
| the organ | `--engine organ --drawbars 008000000 [--perc 2nd,fast,normal] [--vib V1…C3] [--click 0.5]`, or `--program my.ns4p --part A` | `renderOffline`: drawbars, percussion, vibrato/chorus, key click; no rotary or effects |
| a piano | `--engine piano --npno <your file>.npno [--velocity 100 \| --layer 0]` | the stroke the key and velocity pick, decoded from your own file: root + 4 semitones, layer by touch (+20), level word, loop decay, damper |
| the synth | `--engine synth --program my.ns4p --part A` | the synth preview (ANALOG Pure waves; no LFO, unison or effects) |
| another take | `--vs other.wav` | none: both are recordings |

The options (`--hold`, `--nth`, `--window`, `--channel`, `--mod`, `--track`, `--timeline`,
`--sweep`, `--save-render`, `--json`) are listed at the top of `scripts/compare-recording.ts`
and used in the tests above.

What it measures:

| Row | How | Use |
|---|---|---|
| Pitch (f0) | normalized autocorrelation (McLeod), refined over many periods, 0.1–0.5 s into the note | cents against OpenNord and against equal temperament (folded to the nearest octave) |
| Peak / RMS level | dBFS over the analysed part | **compare between takes**: absolute values include your interface gain |
| Brightness | spectral centroid (power-weighted), 0.1–0.5 s | timbre, filter, amp type |
| Attack 10→90 %, time to peak | 10 ms RMS envelope | onset |
| Fall of 20 dB, T60 | straight-line fit of the decay between −5 and −35 dB (or 10 dB above the noise) | decay, release, reverb tails |
| Tremolo / vibrato (`--mod`) | autocorrelation of the level and of the pitch track over the held part | rotary, vibrato/chorus, LFO |

For a piano it also prints the pitch each hypothesis of C2/B2 predicts for that key from your
own file, and which one the take is closest to.

## Recordings stay local

- The kit writes only to `packages/core/hardware-test/` (or the folder you name), which git
  ignores. Neither script makes network requests; `compare-recording` writes a file only when
  you ask (`--json`, `--save-render`).
- Recordings of the Nord's own sounds, and a factory `.npno` decoded for a comparison, stay on
  your machine: paste **numbers** into issues, not audio (`docs/LEGAL.md`). The test pianos are
  synthetic sine tones and contain no Nord audio.

## Results template

Paste this into an issue and fill it in. Numbers rather than audio.

```markdown
## Stage 4 hardware session — results

- Date: …  · Stage 4 OS: …  · NSM: …  · OpenNord commit: …
- Computer / browser: …  · Interface, rate: … kHz / … bit  · iPad model, iPadOS: …
- Nord settings: Master Tune …  · Click Level …  · Rotary speed settings …

| ID | Test | Result | Numbers | Notes |
|---|---|---|---|---|
| 0.3 | Full backup | ✓/✗ | size …, time … min | |
| A1 | Connect probe / Check my Nord | partition-probe line: yes/no | … areas | table below |
| A2 | Preset areas | | 7 = …, 8 = …, 9 = … | |
| A3 | Check backup | headline … | … min, longest freeze … s | problems: … |
| C1 | Touch curves | Touch applies to MIDI in: yes/no | sweep tables attached | hand velocities: … |
| C2 | +27 c / output rate (factory piano) | closest: A / B / C | A3 … Hz, G#4 … Hz, A4 … Hz, C8 … Hz | |
| C3 | Dyn Comp | | dB span: off …, 1 …, 2 …, 3 … | panel names: … |
| C4 | Organ percussion decay | | fall 20 dB: Nord … ms / OpenNord … ms (fast), … / … (slow) | perc with all drawbars in: yes/no |
| C5 | Percussion level, key click | | onset − steady: Nord … dB / OpenNord … dB (normal), … / … (soft) | |
| C6 | Vibrato/chorus | | V1 … Hz ±… c, V2 …, V3 …, C1 …, C2 …, C3 … | |
| C7 | Rotary | | slow … Hz, fast … Hz, spin-up … s, spin-down … s | |
| C8 | Synth patches | | env 10: …; resonance 10 clipped: yes/no; LFO display … Hz → measured … Hz | |
| C9 | Compressor | faster release: Normal / Fast | recovery: Normal … ms, Fast … ms | |
| C10 | Reverb sizes | | T60: Spring …, Booth …, Room …, Stage …, Hall …, Cathedral … s | |
| C11 | Amp types | | brightness / level vs Clean: … | |
| D1 | Network Session 1 | bug seen: yes/no | texts: … / … / … | |
| D2 | Sustain after unplug | notes hang: yes/no | | |
| D3 | Organ on iPad speaker | single key: quiet/fine/loud | chord distorts: yes/no | |
| D4 | Background / resume | silent after: app switch yes/no, lock yes/no | | |
| B1 | Load T0 | NSM: accepted / message … | shown as: … | T1 … T2 … T3 … |
| B2 | Pitch (T0) | closest: A / B / C | A3 … Hz, G#4 … Hz, A4 … Hz | |
| B3 | Loop (T1) | clicks: yes/no | T60 Nord … s / OpenNord … s | |
| B4 | Layer switch (T2) | | switch between velocity … and … | level jump: yes/no |
| B5 | Level vs factory | | measured … dB, predicted … dB | |
| B6 | Release | abrupt/natural | T60 … ms | |
| B7 | Zones (T3) | ✓/✗ | | |
| — | Clean-up | test pianos deleted, factory pianos play | | |
```
