import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { buildCbinHeader } from '../clavia/cbin';
import { readBits } from '../clavia/bitstream';
import { synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';
import { AMP_TYPE, decodeNs3 } from './decode';
import { frameNs3Body, ns3SynthFile as ns3File, ns3ZeroFile as ns3buf } from './file.synth';
import { NS3_LAYOUT, type Ns3FieldKey } from './layout.generated';
import { flat } from '../../test-utils/fx';
import { settingOf } from '../clavia/fx-block';

/** A 3.00 body's delay as OS 3.00 stored it: rate 64 on the 0–127 scale, zero deltas (stored 127 = decoded −16256). */
const OS300_DELAY: Partial<Record<Ns3FieldKey, number>> = Object.fromEntries((['A', 'B'] as const).flatMap((s) => [
  [`effects${s}.dlyRateClkDiv`, 64],
  ...['morphWheel', 'morphAfterTouch', 'morphCtrlPedal'].map((m) => [`effects${s}.dlyRateClkDiv.${m}`, -16256]),
]));

// `ns3buf()` is a Stage 3 file framed the way the firmware writes it (u32 format
// version, then the 19 length-prefixed blocks) with every field bit zero. The
// byte-level tests below poke the absolute file offsets the earlier corpus
// decoder (ns3-program-viewer offsets) read; they pass unchanged against the
// firmware layout, which shows the layout reproduces those offsets.

/**
 * A legacy (formatType 0) `.ns3f`: the header is 0x14 bytes shorter, so the body
 * starts at 0x18, and a 2-byte CRC-16 trailer follows it (574 bytes, like the
 * legacy files of ns3-program-viewer's corpus).
 */
function legacyBuf(): Uint8Array {
  const out = new Uint8Array(0x18 + NS3_LAYOUT.bodyBytes + 2);
  out.set(buildCbinHeader({ formatType: 0, tag: 'ns3f', bank: 0, location: 0, category: 0, versionRaw: 304 }).slice(0, 0x18));
  frameNs3Body(out.subarray(0, out.length - 2), 0x18);
  return out;
}

describe('decodeNs3', () => {
  it('selects active panels from the 0x31 flag (0=A, 1=B, 2=both)', () => {
    const at = (flag: number) => { const b = ns3buf(); b[0x31] = flag << 5; return decodeNs3(b).panels.map((p) => p.id); };
    expect(at(0)).toEqual(['A']);
    expect(at(1)).toEqual(['B']);
    expect(at(2)).toEqual(['A', 'B']);
  });

  it('legacy formatType-0 files shift the whole panel block back by 0x14', () => {
    // Pre-NSM .ns3f exports (CBIN formatType 0 @ 0x04) pack the body 20 bytes
    // earlier, so the panel-enable flag lives at 0x1d, not 0x31 (see decode.ts;
    // Fred's Gothic/Natural Strings files).
    const b = legacyBuf();           // formatType 0
    b[0x31 - 20] = 1 << 5;           // flag @0x1d → panel B
    expect(decodeNs3(b).panels.map((p) => p.id)).toEqual(['B']);
    // the NSM-era offset must NOT be consulted for a formatType-0 file
    const c = legacyBuf();           // formatType 0
    c[0x31] = 2 << 5;                // 'both' at the NSM offset — ignored
    expect(decodeNs3(c).panels.map((p) => p.id)).toEqual(['A']); // 0x1d=0 → flag 0 → A
  });

  it('decodes piano on + Grand (organ/synth off) in panel A', () => {
    const b = ns3buf();
    b[0x31] = 0;        // panel A only
    b[0x43] = 0x80;     // piano enable (b7)
    b[0x48] = 0x00;     // piano type bits 5-3 = 0 → Grand
    const a = decodeNs3(b).panels[0];
    expect(a.piano).toMatchObject({ on: true, type: 'Grand' });
    expect(a.organ.on).toBe(false);
    expect(a.synth.on).toBe(false);
  });

  it('decodes synth osc + filter type (Sample / Mini Moog)', () => {
    const b = ns3buf();
    b[0x52] = 0x80;     // synth enable (b7)
    b[0x8d] = 0x02;     // osc type: (u16(0x8d) & 0x0380) >>> 7 = 4 → Sample
    b[0x98] = 0x08;     // filter type: (0x98 & 0x1c) >>> 2 = 2 → Mini Moog
    const s = decodeNs3(b).panels[0].synth;
    expect(s).toMatchObject({ on: true, osc: 'Sample' });
    expect(s.filter.type).toBe('Mini Moog');
  });

  it('decodes synth filter cutoff frequency (bits @0x98.b1-0 + 0x99.b7-3)', () => {
    const b = ns3buf();
    b[0x52] = 0x80;                    // synth on
    b[0x98] = 0x03; b[0x99] = 0xf8;    // cutoff midi 127 → "21 kHz"
    expect(decodeNs3(b).panels[0].synth.cutoff).toBe('21 kHz');
  });

  it('decodes engine volume from the Nord dB curve (bits 10-4 of the enable word)', () => {
    const b = ns3buf();
    b[0x43] = 0x07; b[0x44] = 0xf0;   // piano volume word bits 10-4 = 127 → "0.0 dB"
    expect(decodeNs3(b).panels[0].piano.volume).toBe('0.0 dB');
    const z = ns3buf();     // all zero → midi 0 → "Off"
    expect(decodeNs3(z).panels[0].piano.volume).toBe('Off');
  });

  it('decodes the 9 organ drawbars (each 0-8) from the 0xBE block', () => {
    const b = ns3buf();
    b[0xbe] = 0x60;   // drawbar 1: (0x60 & 0xf0) >>> 4 = 6
    b[0xc0] = 0x10;   // drawbar 2: (0x10 & 0x1e) >>> 1 = 8
    const dr = decodeNs3(b).panels[0].organ.drawbars;
    expect(dr).toHaveLength(9);
    expect(dr[0]).toBe(6);
    expect(dr[1]).toBe(8);
    expect(dr.every((d) => d >= 0 && d <= 8)).toBe(true);
  });

  it('decodes organ vibrato/chorus + percussion (preset 1)', () => {
    const b = ns3buf();
    b[0x34] = 0x04;   // vib/chorus mode: (0x04 & 0x0e) >>> 1 = 2 → V2
    b[0xd3] = 0x1c;   // vib on (0x10) + perc on (0x08) + 3rd (0x04); fast/soft off
    const org = decodeNs3(b).panels[0].organ;
    expect(org.vibChorus).toEqual({ on: true, mode: 'V2' });
    expect(org.percussion).toEqual({ on: true, third: true, fast: false, soft: false });
  });

  it('reads organ drawbars from preset 2 when it is active (0xBB.b2)', () => {
    const b = ns3buf();
    b[0xbb] = 0x04;   // preset 2 enabled (type bits 0 → B3)
    b[0xd9] = 0x70;   // preset-2 drawbar 1 @0xD9 → 7
    b[0xbe] = 0x10;   // preset-1 drawbar 1 @0xBE → 1 (proves we DON'T read preset 1)
    expect(decodeNs3(b).panels[0].organ.drawbars[0]).toBe(7);
  });

  it('lists active FX with types (reverb + delay)', () => {
    const b = ns3buf();
    b[0x134] = 0x02;   // reverb enable; type (u16 & 0x01c0)>>>6 = 0 → Room 1
    b[0x119] = 0x08;   // delay enable
    const fx = decodeNs3(b).panels[0].fx.map(flat);
    expect(fx.filter((f) => f.on).map((f) => f.name)).toEqual(['Delay', 'Reverb']); // panel order
    expect(fx.find((f) => f.name === 'Reverb')?.type).toBe('Room 1');
  });

  it('extracts the 32-bit piano sampleId from the 0x49 field (bits 59-28)', () => {
    const b = ns3buf();
    b.set([0x03, 0xaa, 0x41, 0x6e, 0xf0, 0x00, 0x00, 0x00], 0x49); // 0x3aa416ef << 28
    expect(decodeNs3(b).panels[0].piano.sampleId).toBe(0x3aa416ef);
  });

  it('reads panel B fields shifted by 263 bytes', () => {
    const b = ns3buf();
    b[0x31] = 1 << 5;        // panel B only
    b[0xb6 + 263] = 0x80;    // organ enable in panel B
    b[0xbb + 263] = 0x10;    // organ type bits 6-4 = 1 → Vox
    const bPanel = decodeNs3(b).panels[0];
    expect(bPanel.id).toBe('B');
    expect(bPanel.organ).toMatchObject({ on: true, type: 'Vox' });
  });

  // ── v2 extended parameter tests ───────────────────────────────────────────

  it('decodes synth oscillator waveform (Classic/Saw) from 0x8E(b3-0)', () => {
    const b = ns3buf();
    // oscType=Classic: (u16@0x8D & 0x0380)>>>7 = 0 → b[0x8d]=0, b[0x8e] must have 0x0380 bits clear
    // waveform Classic: (u16@0x8E & 0x01c0)>>>6 = 2 → Saw
    // u16@0x8E = b[0x8e]<<8 | b[0x8f]; we need (u16@0x8E & 0x01c0)>>>6 = 2 → u16@0x8E = 0x0080
    // b[0x8e] = 0x00, b[0x8f] = 0x80: u16@0x8E = 0x0080, (& 0x01c0)>>>6 = (0x0080)>>>6 = 2 ✓
    // check osc type: u16@0x8D = b[0x8d]<<8|b[0x8e] = 0x0000, (& 0x0380)>>>7 = 0 → Classic ✓
    b[0x8e] = 0x00; b[0x8f] = 0x80;
    const osc = decodeNs3(b).panels[0].synth.oscillator;
    expect(osc.type).toBe('Classic');
    expect(osc.waveform).toBe('Saw');
  });

  it('decodes synth oscillator config (Sync) from 0x8F(b4-1)', () => {
    const b = ns3buf();
    // oscConfigValue = (0x8F & 0x1e) >>> 1 = 3 → "3 Sync"
    b[0x8f] = 0x06; // 0x06 = 0000_0110, (0x06 & 0x1e) >>> 1 = 3
    expect(decodeNs3(b).panels[0].synth.oscillator.config).toBe('3 Sync');
  });

  it('decodes synth osc2 pitch offset from 0x8F(b0)+0x90(b7-3)', () => {
    const b = ns3buf();
    // osc2PitchRaw = (u16@0x8F & 0x01f8) >>> 3; value = raw - 12
    // Set raw=24 → pitch=+12 semi: 0x01f8 field, raw=24=0x18, shift left 3 → 0xC0 in high byte
    // u16@0x8F = raw << 3 = 24<<3 = 192 = 0x00C0 → b[0x8f]=0x00, b[0x90]=0xC0
    b[0x8f] = 0x00; b[0x90] = 0xc0;
    expect(decodeNs3(b).panels[0].synth.oscillator.pitch).toBe('+12 semi');
  });

  it('decodes synth voice (Mono), glide, unison (2) from 0x84-0x86', () => {
    const b = ns3buf();
    // voice: (u16@0x84 & 0x0180) >>> 7 = 2 → Mono; glide: u16@0x84 & 0x007f = 63
    // u16@0x84: bits 8-7 = voice=2 → 0x0100; bits 6-0 = 63 = 0x003f → u16 = 0x013f
    b[0x84] = 0x01; b[0x85] = 0x3f;
    // unison: (0x86 & 0xc0)>>>6 = 2
    b[0x86] = 0x80; // 0x80=1000_0000 → (& 0xc0)>>>6 = 2 → '2'
    const s = decodeNs3(b).panels[0].synth;
    expect(s.voice).toBe('Mono');
    expect(s.unison).toBe('2');
  });

  it('decodes synth LFO wave (Square) and rate from 0x86(b2-0) + 0x87', () => {
    const b = ns3buf();
    // lfoWave: (0x86 & 0x07) = 3 → 'Square'
    b[0x86] = 0x03;
    // lfoRate: (0x87 & 0x7f) = 60; no masterClock
    b[0x87] = 0x3c; // 60 → '3.0 Hz'
    const lfo = decodeNs3(b).panels[0].synth.lfo;
    expect(lfo.wave).toBe('Square');
    expect(lfo.rate).toBe('3.0 Hz');
    expect(lfo.masterClock).toBe(false);
  });

  it('decodes synth mod envelope attack/decay/release from 0x8B-0x8D', () => {
    const b = ns3buf();
    // modAttack: (u16@0x8B & 0xfe00)>>>9 = 0 → '0.5 ms'
    // modDecay: (u16@0x8B & 0x01fc)>>>2 = 0 → '3.0 ms'
    // modRelease: (u16@0x8C & 0x03f8)>>>3 = 0 → '3.0 ms'
    // all zeros → all at minimum
    const env = decodeNs3(b).panels[0].synth.envMod;
    expect(env.attack).toBe('0.5 ms');
    expect(env.decay).toBe('3.0 ms');
    expect(env.release).toBe('3.0 ms');
  });

  it('decodes synth amp envelope attack/decay/release from 0xA5-0xA8', () => {
    const b = ns3buf();
    // ampAttack: (u16@0xA5 & 0x03f8)>>>3 = 0 → '0.5 ms'
    // ampDecay: (u16@0xA6 & 0x07f0)>>>4 = 0 → '3.0 ms'
    // ampRelease: (u16@0xA7 & 0x0fe0)>>>5 = 0 → '3.0 ms'
    const env = decodeNs3(b).panels[0].synth.envAmp;
    expect(env.attack).toBe('0.5 ms');
    expect(env.decay).toBe('3.0 ms');
    expect(env.release).toBe('3.0 ms');
  });

  it('decodes filter resonance (LP24 mode) from 0x9C(b2-0)+0x9D(b7-4)', () => {
    const b = ns3buf();
    // filterType: LP24 = index 1; (0x98 & 0x1c)>>>2 = 1 → 0x98 = 0x04
    b[0x98] = 0x04;
    // resonance: (u16@0x9C & 0x07f0)>>>4 = 127 → lin10(127) ~ '10.0'
    b[0x9c] = 0x07; b[0x9d] = 0xf0;
    const filt = decodeNs3(b).panels[0].synth.filter;
    expect(filt.type).toBe('LP24');
    expect(filt.resonance).toBe('10.0');
  });

  it('decodes filter kbTrack and drive from 0xA5(b5-4) and 0xA5(b3-2)', () => {
    const b = ns3buf();
    // kbTrack: (u16@0xA5 & 0x3000)>>>12 = 3 → '1'; drive: (u16@0xA5 & 0x0c00)>>>10 = 2 → '2'
    // u16@0xA5 bits: kbTrack=3 at b13-12, drive=2 at b11-10
    // 0x3000 | 0x0800 = 0x3800 → b[0xA5]=0x38
    b[0xa5] = 0x38;
    const filt = decodeNs3(b).panels[0].synth.filter;
    expect(filt.kbTrack).toBe('1');
    expect(filt.drive).toBe('2');
  });

  it('decodes arpeggiator (on/range/pattern) from 0x80', () => {
    const b = ns3buf();
    // arpOn: (0x80 & 0x40) = 0x40; range: (0x80 & 0x18)>>>3 = 2 → '3 Octaves'; pattern: (0x80 & 0x06)>>>1 = 1 → 'Down'
    b[0x80] = 0x40 | 0x10 | 0x02; // 0x52
    const arp = decodeNs3(b).panels[0].synth.arp;
    expect(arp.on).toBe(true);
    expect(arp.range).toBe('3 Octaves');
    expect(arp.pattern).toBe('Down');
    expect(arp.masterClock).toBe(false);
  });

  it('decodes free-run arp rate in BPM from 0x81(b7-1) (oracle ns3SynthArpRateMap)', () => {
    const b = ns3buf();
    b[0x80] = 0x40; // arp on, master clock off → rate is a BPM value, not a division
    b[0x81] = 54 << 1; // rateMidi 54
    expect(decodeNs3(b).panels[0].synth.arp.rate).toBe('120 bpm');
    b[0x81] = 0 << 1;
    expect(decodeNs3(b).panels[0].synth.arp.rate).toBe('16 bpm');
    b[0x81] = 127 << 1;
    expect(decodeNs3(b).panels[0].synth.arp.rate).toBe('Fast 5');
  });

  it('decodes organ octave shift from 0xBA(b3-0)', () => {
    const b = ns3buf();
    // octRaw = (0xBA & 0x0f); shift = raw - 6; raw=8 → shift=+2
    b[0xba] = 0x08;
    expect(decodeNs3(b).panels[0].organ.octaveShift).toBe(2);
    // center: raw=6 → shift=0
    const c = ns3buf(); c[0xba] = 0x06;
    expect(decodeNs3(c).panels[0].organ.octaveShift).toBe(0);
  });

  it('decodes piano timbre from 0x4E(b5-3) (type-dependent, oracle ns3PianoTimbreMap)', () => {
    const b = ns3buf();
    // Grand (type 0): raw=2 → 'Mid'; raw=3 → 'Bright'
    b[0x4e] = 0x10; // (0x10 & 0x38)>>>3 = 2
    b[0x48] = 0x00; // type bits 5-3 = 0 → Grand
    expect(decodeNs3(b).panels[0].piano.timbre).toBe('Mid');
    // Electric (type 2): raw=4 → 'Dyno1'
    const e = ns3buf();
    e[0x48] = 0x10; // type bits 5-3 = 2 → Electric
    e[0x4e] = 0x20; // (0x20 & 0x38)>>>3 = 4
    expect(decodeNs3(e).panels[0].piano.timbre).toBe('Dyno1');
  });

  it('decodes compressor enable + params from 0x139-0x13A', () => {
    const b = ns3buf();
    // compressor enable: 0x139(b5) = 0x20; amount: (0x139 & 0x1f)<<2 | (0x13A & 0xc0)>>>6
    b[0x139] = 0x3f; // enable (0x20) + amount bits 4-0 = 0x1f
    b[0x13a] = 0xc0; // amount bits 7-6 = 3 → total = (0x1f<<2)|(3) = 0x7f = 127 → '10.0'
    const fx = decodeNs3(b).panels[0].fx.map(flat);
    const comp = fx.find((f) => f.name === 'Comp');
    expect(comp).toBeDefined();
    expect(comp?.params?.amount).toBe('10.0');
  });

  it('decodes reverb enable + amount from 0x134-0x136', () => {
    const b = ns3buf();
    b[0x134] = 0x02;   // reverb enable; type 0 → Room 1
    b[0x135] = 0x1f; b[0x136] = 0xc0; // amount = (0x1f<<2)|3 = 0x7f = 127 → '10.0'
    const rev = decodeNs3(b).panels[0].fx.map(flat).find((f) => f.name === 'Reverb');
    expect(rev?.params?.amount).toBe('10.0');
  });

  it('decodes rotary speaker enable + slow speed from 0x10B(b7) + 0x34(b0)/0x35(b7)', () => {
    const b = ns3buf();
    b[0x10b] = 0x80;  // rotary enable (b7)
    b[0x35] = 0x80;   // speed raw = (0x34.b0 << 1) | 0x35.b7 = 1 → Slow (firmware default)
    const rot = decodeNs3(b).panels[0].fx.map(flat).find((f) => f.name === 'Rotary');
    expect(rot).toBeDefined();
    expect(rot?.params?.speed).toBe('Slow');
  });

  // ── Stage 3 OS 2.64 firmware-registry corrections ──
  // Each test below fails against the pre-fix (ns3-program-viewer) bit reads.

  it('reads rotary speed as 2 bits: 0 Stop / 1 Slow / 2 Fast / 3 Fast (the firmware table)', () => {
    const speed = (b34: number, b35: number) => {
      const b = ns3buf();
      b[0x10b] = 0x80;          // rotary on
      b[0x34] = b34; b[0x35] = b35;
      return decodeNs3(b).panels[0].fx.map(flat).find((f) => f.name === 'Rotary')?.params?.speed;
    };
    expect(speed(0x00, 0x00)).toBe('Stop');  // pre-fix: 'Slow'
    expect(speed(0x00, 0x80)).toBe('Slow');
    expect(speed(0x01, 0x00)).toBe('Fast');
    expect(speed(0x01, 0x80)).toBe('Fast');  // the firmware's 4-entry table shows Fast for 3 too
    // Neighbouring MultiCommon bits (vib type b3-1, 0x35 morph deltas b6-0) don't leak in.
    expect(speed(0x0e, 0x7f)).toBe('Stop');
  });

  it('decodes Effect 1 rate as 7 bits from 0x10C(b5-0)+0x10D(b7)', () => {
    const b = ns3buf();
    b[0x10b] = 0x10;            // Effect 1 on, type 0 → Panning
    // rate 101 = 0b110010_1 → 0x10C b5-0 = 0b110010, 0x10D b7 = 1; plus clock-enable
    // 0x10C b6 set, which must not leak into the rate.
    b[0x10c] = 0x40 | 0x32;
    b[0x10d] = 0x80;
    const fx1 = decodeNs3(b).panels[0].fx.map(flat).find((f) => f.name === 'Effect 1');
    expect(fx1?.type).toBe('Panning');
    expect(fx1?.midi?.rate).toBe(101);  // pre-fix mask 0x1fc0 >>> 6 gave 74
    expect(fx1?.params?.rate).toBe('1/8T'); // clocked: 101 sits in the 1/8T step
  });

  it('decodes Effect 2 rate as 7 bits from 0x114(b1-0)+0x115(b7-3)', () => {
    const fx2 = (b114: number, b115: number) => {
      const b = ns3buf();
      b[0x114] = 0x80 | b114;   // enable b7, type 0 (Phaser 1), rate high bits b1-0
      b[0x115] = b115;          // rate low bits b7-3; amount bits b2-0
      return decodeNs3(b).panels[0].fx.map(flat).find((f) => f.name === 'Effect 2');
    };
    // rate 64 = 0b10_00000 → 0x114 b1-0 = 0b10, 0x115 b7-3 = 0
    expect(fx2(0x02, 0x00)?.midi?.rate).toBe(64);   // pre-fix: 0
    // rate 127 = 0b11_11111
    expect(fx2(0x03, 0xf8)?.midi?.rate).toBe(127);  // pre-fix: 192|31 = 223
    expect(fx2(0x03, 0xf8)?.params?.rate).toBe('10.0');
    expect(fx2(0x03, 0xf8)?.type).toBe('Phaser 1');
    expect(fx2(0x03, 0xf8)?.params?.amount).toBe('0.0');
  });

  it('reads vib/chorus mode + rotary speed from MultiCommon 0x34-0x35 for Panel B too', () => {
    const b = ns3buf();
    b[0x31] = 1 << 5;           // panel B only
    b[0x34] = 0x04 | 0x01;      // vib mode 2 → V2; rotary speed high bit
    b[0x35] = 0x00;             // → speed raw 2 → Fast
    b[0xd3 + 263] = 0x10;       // panel B vib on
    b[0x10b + 263] = 0x80;      // panel B rotary on
    b[0x34 + 263] = 0x0a;       // decoy at the old per-panel address (would read C3 / Stop)
    const pb = decodeNs3(b).panels[0];
    expect(pb.id).toBe('B');
    expect(pb.organ.vibChorus).toEqual({ on: true, mode: 'V2' });
    expect(pb.fx.map(flat).find((f) => f.name === 'Rotary')?.params?.speed).toBe('Fast');
  });

  it('both panels share the MultiCommon vib/chorus mode', () => {
    const b = ns3buf();
    b[0x31] = 2 << 5;           // both panels
    b[0x34] = 0x0a;             // vib mode 5 → C3
    const [pa, pb] = decodeNs3(b).panels;
    expect(pa.organ.vibChorus.mode).toBe('C3');
    expect(pb.organ.vibChorus.mode).toBe('C3');
  });

  it('legacy formatType-0 files read the MultiCommon vib mode 0x14 earlier too', () => {
    const b = legacyBuf();         // formatType 0 → body at 0x18
    b[0x34 - 20] = 0x08;           // vib mode 4 → V3
    expect(decodeNs3(b).panels[0].organ.vibChorus.mode).toBe('V3');
  });

  it('decodes piano timbre as 4 bits from 0x4E(b6-3)', () => {
    const b = ns3buf();
    b[0x48] = 0x00;             // Grand
    b[0x4e] = 0x18;             // raw 3 → Bright (unchanged)
    expect(decodeNs3(b).panels[0].piano.timbre).toBe('Bright');
    b[0x4e] = 0x48;             // raw 9 (b6 set) → past the table → neutral fallback
    expect(decodeNs3(b).panels[0].piano.timbre).toBe('#9'); // pre-fix: b5-3 = 1 → 'Soft'
    const c = ns3buf();
    c[0x48] = 0x18;             // type 3 → Clav
    c[0x4e] = 0x38;             // raw 7 → last Clav label
    expect(decodeNs3(c).panels[0].piano.timbre).toBe('Soft+Trb+Brill');
  });

  it('decodes synth oscillator config as 5 bits from 0x8F(b5-1)', () => {
    const b = ns3buf();
    b[0x8f] = 0x1c;             // raw 14 → RM (max)
    expect(decodeNs3(b).panels[0].synth.oscillator.config).toBe('14 RM');
    b[0x8f] = 0x40 | 0x06;      // wave LSB (b6) set + config 3 → wave bit must not leak
    expect(decodeNs3(b).panels[0].synth.oscillator.config).toBe('3 Sync');
    b[0x8f] = 0x20;             // b5 alone → raw 16, past the table
    expect(decodeNs3(b).panels[0].synth.oscillator.config).toBe('#16'); // pre-fix: 'None'
  });

  it('decodes the synth oscillator wave as one 9-bit index 0x8E(b6)…0x8F(b6)', () => {
    const wave = (type: number, idx: number) => {
      const b = ns3buf();
      // osc bank: 0x8D(b1-0)+0x8E(b7); wave index occupies u16@0x8E bits 14-6
      b[0x8d] = (type >>> 1) & 0x03;
      const w = ((type & 1) << 15) | (idx << 6);
      b[0x8e] = w >>> 8; b[0x8f] = w & 0xff;
      return decodeNs3(b).panels[0].synth.oscillator;
    };
    expect(wave(1, 45)).toMatchObject({ type: 'Wave', waveform: 'Wave Tubular Bells' });
    expect(wave(1, 100).waveform).toBe('#100');       // pre-fix 6-bit mask → 36 'Wave Clavinet 2'
    expect(wave(1, 399).waveform).toBe('#399');       // full 9-bit range, no table overrun
    expect(wave(0, 2)).toMatchObject({ type: 'Classic', waveform: 'Saw' });
    expect(wave(0, 10).waveform).toBe('#10');         // pre-fix 3-bit mask → 2 'Saw'
    expect(wave(2, 8)).toMatchObject({ type: 'Formant', waveform: 'Formant Wave OE' });
    expect(wave(3, 7)).toMatchObject({ type: 'Super', waveform: 'Super Wave Organ' });
  });

  it('decodes amp/EQ type (firmware labels) and EQ bands as −60…+60 (stored +60)', () => {
    const b = ns3buf();
    b[0x129] = 0x04;            // amp on
    // type 0x12A b7-5; treble 0x12A b4-0 + 0x12B b7-6; mid 0x12B b5-0 + 0x12C b7; bass 0x12C b6-0
    // type 0 → Clean, treble raw 120 → +60, mid raw 0 → −60, bass raw 60 → 0
    b[0x12a] = (0 << 5) | (120 >>> 2);
    b[0x12b] = (120 & 0x03) << 6;
    b[0x12c] = 60;
    const amp = decodeNs3(b).panels[0].fx.map(flat).find((f) => f.name === 'Amp/EQ');
    expect(amp?.type).toBe('Clean');     // pre-fix: 'JC'
    expect(amp?.params).toMatchObject({ treble: '+15.0 dB', mid: '-15.0 dB', bass: '0.0 dB' });
    const types = [0, 1, 2, 3, 4, 5, 6].map((t) => {
      const c = ns3buf(); c[0x129] = 0x04; c[0x12a] = t << 5;
      return decodeNs3(c).panels[0].fx.map(flat).find((f) => f.name === 'Amp/EQ')?.type;
    });
    expect(types).toEqual(['Clean', 'Twin', 'JC', 'Small', 'LP24', 'HP24', '#6']);
  });

  it('decodes piano octave shift from 0x47(b3-0), center=6 (oracle ns3-piano.js)', () => {
    const b = ns3buf();
    // raw=8 → shift=+2; raw=6 → shift=0; raw=4 → shift=-2
    b[0x47] = 0x08;
    expect(decodeNs3(b).panels[0].piano.octaveShift).toBe(2);
    const c = ns3buf(); c[0x47] = 0x06;
    expect(decodeNs3(c).panels[0].piano.octaveShift).toBe(0);
  });

  // ── Fixture cross-check: oracle-derived expected values ────────────────────
  // These expected values were extracted by running ns3-program-viewer (Chris55, GPLv3)
  // on the 4 Stage-3 fixture files and reading the oracle output fields.
  // Oracle clone (NOT checked in): https://github.com/Chris55/ns3-program-viewer
  //
  // Tests skip gracefully if fixture files are absent (gitignored corpus).
  // If you update/add fixtures, re-run /tmp/ns3-crosscheck.mjs to refresh these values.
  describe('fixture oracle cross-check (skip if files absent)', () => {
    // packages/core/fixtures/stage-3/ (fixtures/README.md).
    const FIXTURES_DIR = new URL('../../../fixtures/stage-3/', import.meta.url).pathname;

    function readFixture(name: string): Uint8Array | null {
      try {
        return new Uint8Array(readFileSync(`${FIXTURES_DIR}${name}`));
      } catch { return null; }
    }

    // Money_Wurly panel A: Electric piano, Mid timbre, organ at +0 oct, synth osc=Sample
    it('Money_Wurly panelA: piano type=Electric, timbre=Mid, organOctShift=0', () => {
      const buf = readFixture('s50428_Money_Wurly.ns3f');
      if (!buf) return; // fixture absent
      const pa = decodeNs3(buf).panels[0]; // panel A (flag=2, both panels)
      expect(pa.piano.type).toBe('Electric');
      expect(pa.piano.timbre).toBe('Mid');       // oracle: timbre.value='Mid'
      expect(pa.organ.octaveShift).toBe(0);      // oracle: octaveShift.value='+0 oct' → 0
      expect(pa.piano.octaveShift).toBe(0);      // oracle: octaveShift.value='+0 oct' → 0
      expect(pa.synth.osc).toBe('Sample');       // oracle: oscillators.type.value='Sample'
    });

    // Heavi_Fuel panel A: Upright piano, Soft timbre, organ octave +2
    it('Heavi_Fuel panelA: piano type=Upright, timbre=Soft, organOctShift=+2', () => {
      const buf = readFixture('s50427_Heavi_Fuel.ns3f');
      if (!buf) return;
      const pa = decodeNs3(buf).panels[0]; // panel A
      expect(pa.piano.type).toBe('Upright');
      expect(pa.piano.timbre).toBe('Soft');      // oracle: 'Soft'
      expect(pa.organ.octaveShift).toBe(2);      // oracle: raw=8 → +2
      expect(pa.piano.octaveShift).toBe(0);      // oracle: raw=6 → 0
    });

    // Organ Lead panel B: B3 organ, octaveShift=0
    it('Boston panelB: organ=B3, octaveShift=0', () => {
      const buf = readFixture('Organ Lead for Smokin by Boston.ns3f');
      if (!buf) return;
      const prog = decodeNs3(buf);
      expect(prog.panels[0].id).toBe('B');       // flag=1 → panel B only
      expect(prog.panels[0].organ.type).toBe('B3');
      expect(prog.panels[0].organ.octaveShift).toBe(0); // oracle: raw=6 → 0
    });

    // Legacy formatType-0 exports (Fred, 2026-07-15). Pre-fix these decoded to
    // panels:[] — the flag read at 0x31 = 3 (invalid). The -0x14 shift lands the
    // flag at 0x1d = 0 → Panel A, a synth-Sample string/ensemble patch.
    it('Gothic esamble (formatType 0): Panel A only, synth on with Sample osc', () => {
      const buf = readFixture('Gothic esamble.ns3f');
      if (!buf) return;
      const prog = decodeNs3(buf);
      expect(buf[0x04]).toBe(0);                  // legacy header
      expect(prog.panels.map((p) => p.id)).toEqual(['A']);
      expect(prog.panels[0].synth).toMatchObject({ on: true, osc: 'Sample' });
    });

    it('Natural Strings (formatType 0): Panel A only, synth on with Sample osc', () => {
      const buf = readFixture('Natural Strings.ns3f');
      if (!buf) return;
      const prog = decodeNs3(buf);
      expect(buf[0x04]).toBe(0);
      expect(prog.panels.map((p) => p.id)).toEqual(['A']);
      expect(prog.panels[0].synth).toMatchObject({ on: true, osc: 'Sample' });
    });
  });
});

describe('decodeNs3 — firmware layout (Stage 3 OS 2.64 registry)', () => {
  it('reads the 592-byte file: version 3.04, 19 blocks, MultiCommon length 17 at 0x30', () => {
    const bytes = ns3File();
    expect(bytes.length).toBe(592);
    expect([...bytes.slice(0x2c, 0x31)]).toEqual([0x00, 0x00, 0x01, 0x30, 0x11]);
    expect(NS3_LAYOUT.blocks).toHaveLength(19);
    // Slot B repeats slot A's nine blocks 263 bytes later.
    for (let i = 1; i <= 9; i++) {
      expect(NS3_LAYOUT.blocks[i + 9].offset - NS3_LAYOUT.blocks[i].offset).toBe(263);
      expect(NS3_LAYOUT.blocks[i + 9].length).toBe(NS3_LAYOUT.blocks[i].length);
    }
    const p = decodeNs3(bytes);
    expect(p).toMatchObject({ format: 'ns3f', layoutMatched: true, formatVersion: 304, version: '3.04' });
    expect(p.warnings).toEqual([]);
    expect(p.panels.map((x) => x.id)).toEqual(['A']); // firmware default: slot A on
  });

  it('round-trips every field, slot B included (morph deltas, negatives stored as value − min)', () => {
    // A value per field that differs from its default and stays in range.
    const values = Object.fromEntries(NS3_LAYOUT.fields.map((f) => {
      if (f.enc === 'raw') return [f.key, 0x89abcdef];
      return [f.key, f.def === f.max ? f.min : f.def + 1];
    })) as Record<Ns3FieldKey, number>;
    const p = decodeNs3(ns3File(values));
    expect(p.layoutMatched).toBe(true);
    expect(p.values).toEqual(values);
    expect(p.warnings).toEqual([]);
  });

  it('stores negative-minimum fields as value − min (registry signed mode 1), never two\'s complement', () => {
    expect(NS3_LAYOUT.fields.filter((f) => f.min < 0 && f.enc !== 'offset' && f.enc !== 'raw')).toEqual([]);
    const v = decodeNs3(ns3File({ 'common.transposeValue': -6, 'effectsB.ampBass': -60, 'pianoA.level.morphWheel': -127 })).values;
    expect(v['common.transposeValue']).toBe(-6);
    expect(v['effectsB.ampBass']).toBe(-60);
    expect(v['pianoA.level.morphWheel']).toBe(-127);
    // "No morph" (delta 0) is stored as max − min: raw 127 for the 8-bit level delta.
    const body = synthFwBody(NS3_LAYOUT, {}, 304);
    const f = NS3_LAYOUT.fields.find((x) => x.key === 'pianoA.level.morphWheel');
    expect(f).toMatchObject({ width: 8, min: -127, max: 127, enc: 'offset' });
    const bit = (NS3_LAYOUT.blocks[f?.block ?? 0].offset + 1) * 8 + (f?.bit ?? 0);
    expect(readBits(body, bit, 8)).toBe(127);
  });

  it('reads both panels from the program-wide slot enable (1 = A, 2 = B, 3 = both)', () => {
    const ids = (slotEnable: number) => decodeNs3(ns3File({ 'common.slotEnable': slotEnable })).panels.map((p) => p.id);
    expect(ids(1)).toEqual(['A']);
    expect(ids(2)).toEqual(['B']);
    expect(ids(3)).toEqual(['A', 'B']);
  });

  it('builds panel B from the B blocks', () => {
    const p = decodeNs3(ns3File({
      'common.slotEnable': 3,
      'organB.enable': 1, 'organB.model': 2, 'organB.presetFocus': 1, 'organPresetIIB.db3': 5,
      'pianoB.enable': 1, 'pianoB.bank': 2, 'pianoB.eq': 4, 'pianoB.nameHash': 0x12345678, 'pianoB.variation': 2,
      'synthCommonB.enable': 1, 'synthB.oscBank': 4, 'synthB.smpNameHash': 0xfedcba98,
      'effectsB.dlyEnable': 1, 'effectsB.dlyMix': 127,
    }));
    const b = p.panels[1];
    expect(b.id).toBe('B');
    expect(b.organ).toMatchObject({ on: true, type: 'Farfisa' });
    expect(b.organ.drawbars[2]).toBe(5);
    expect(b.piano).toMatchObject({ on: true, type: 'Electric', timbre: 'Dyno1', sampleId: 0x12345678, sampleVariation: 2 });
    expect(b.synth).toMatchObject({ on: true, osc: 'Sample', sampleId: 0xfedcba98 });
    expect(b.fx.map(flat).filter((f) => f.on)).toMatchObject([{ name: 'Delay', params: { feedback: '5.0', mix: '10.0' } }]);
    expect(b.fx.map(flat).filter((f) => f.on)).toHaveLength(1);
    expect(p.panels[0].piano.on).toBe(false);
  });

  it('labels the vibrato/chorus mode per organ model (firmware label table)', () => {
    const mode = (model: number, type: number) =>
      decodeNs3(ns3File({ 'organA.model': model, 'common.orgVibratoType': type })).panels[0].organ.vibChorus.mode;
    expect(mode(0, 5)).toBe('C3');
    // The stored value is the selector position V1 C1 V2 C2 V3 C3 for every model.
    expect([0, 2, 4].map((v) => mode(1, v))).toEqual(['Less', 'More', 'Original']);
    expect([0, 2, 3, 5].map((v) => mode(2, v))).toEqual(['Light/Slow', 'Light/Fast', 'Heavy/Slow', 'Heavy/Fast']);
    expect(mode(1, 1)).toBe('More');       // a position Vox doesn't use reads as the next one
    expect(mode(2, 4)).toBe('Heavy/Fast');
    expect(mode(3, 1)).toBe('C1');         // the pipe organs have only C1
    expect(mode(4, 0)).toBe('C1');
  });

  it('uses the firmware labels for synth vibrato and Clav timbre', () => {
    expect(decodeNs3(ns3File({ 'synthA.vibratoMode': 5 })).panels[0].synth.vibrato).toBe('After Touch');
    const clav = (eq: number) => decodeNs3(ns3File({ 'pianoA.bank': 3, 'pianoA.eq': eq })).panels[0].piano.timbre;
    expect(clav(3)).toBe('Soft+Treb');
    expect(clav(6)).toBe('Treb+Brill');
    // Acoustic pianos have four timbres; a value kept from another piano type reads as None.
    expect(decodeNs3(ns3File({ 'pianoA.bank': 0, 'pianoA.eq': 4 })).panels[0].piano.timbre).toBe('None');
  });

  it('reads the drawbars, vibrato switch and percussion of Preset II when it has focus', () => {
    const o = decodeNs3(ns3File({
      'organA.presetFocus': 1, 'organPresetIA.db1': 1, 'organPresetIIA.db1': 7,
      'organPresetIIA.vibratoEnable': 1, 'organPresetIIA.b3PercEnable': 1, 'organPresetIIA.b3PercHarmonic': 0,
      'organPresetIIA.b3PercSpeed': 0, 'organPresetIIA.b3PercLevel': 0,
    })).panels[0].organ;
    expect(o.drawbars[0]).toBe(7);
    expect(o.vibChorus.on).toBe(true);
    expect(o.percussion).toEqual({ on: true, third: false, fast: false, soft: false });
  });

  it('reads the oscillator 2 pitch as 0-60 with 12 = no offset', () => {
    const pitch = (v: number) => decodeNs3(ns3File({ 'synthA.dualOscDetune': v })).panels[0].synth.oscillator.pitch;
    expect(pitch(0)).toBe('Sub');
    expect(pitch(12)).toBe('0 semi');
    expect(pitch(60)).toBe('+48 semi');
  });

  it('a 2.0x body (converted by the Nord on load) → header only, with a warning', () => {
    const p = decodeNs3(ns3File({ 'common.slotEnable': 3 }, 203));
    expect(p.layoutMatched).toBe(false);
    expect(p.formatVersion).toBe(203);
    expect(p.panels).toEqual([]);
    expect(p.values).toEqual({});
    expect(p.warnings.join(' ')).toMatch(/format 2\.03/);
  });

  it('gives parameters added inside 3.x their default in older 3.x files, like the firmware', () => {
    const zeros = { 'common.pitchStickRange': 0, 'externA.volPedalEnable': 0, 'externB.volPedalEnable': 0 } as const;
    expect(decodeNs3(ns3File(zeros, 304)).values).toMatchObject(zeros);
    expect(decodeNs3(ns3File(zeros, 303)).values)
      .toMatchObject({ 'common.pitchStickRange': 0, 'externA.volPedalEnable': 1, 'externB.volPedalEnable': 1 });
    expect(decodeNs3(ns3File(zeros, 302)).values)
      .toMatchObject({ 'common.pitchStickRange': 1, 'externA.volPedalEnable': 1, 'externB.volPedalEnable': 1 });
  });

  it('versions inside 3.00–3.04 read without a warning', () => {
    for (const v of [300, 301, 302, 303, 304]) expect(decodeNs3(ns3File(OS300_DELAY, v)).warnings).toEqual([]);
  });

  it('fixes up older 3.x values as the firmware does: Dual-KB style below 3.02, defaults for newer settings', () => {
    const style = (v: number, s: number) => decodeNs3(ns3File({ ...OS300_DELAY, 'common.dualKbdStyle': s }, v)).values['common.dualKbdStyle'];
    expect([style(300, 0), style(301, 0), style(301, 2), style(302, 0), style(304, 0)]).toEqual([1, 1, 2, 0, 0]);
    const old = decodeNs3(ns3File({ ...OS300_DELAY, 'common.pitchStickRange': 5, 'externA.volPedalEnable': 0 }, 302)).values;
    expect([old['common.pitchStickRange'], old['externA.volPedalEnable']]).toEqual([1, 1]);
  });

  it('3.00 delay rate, clock synced: N(x) = 128·x (16383 for 127), deltas N(rate + d) − N(rate)', () => {
    const p = decodeNs3(ns3File({
      ...OS300_DELAY, 'effectsA.dlyEnable': 1, 'effectsA.dlyClkEnable': 1, 'effectsA.dlyRateClkDiv': 100,
      // Stored as delta + 127 in the 15-bit field: decoded value = delta − 16256.
      'effectsA.dlyRateClkDiv.morphWheel': 27 - 16256, 'effectsA.dlyRateClkDiv.morphAfterTouch': -30 - 16256,
      'effectsA.dlyRateClkDiv.morphCtrlPedal': -101 - 16256,
    }, 300));
    expect(p.layoutMatched).toBe(true);
    expect(p.values).toMatchObject({
      'effectsA.dlyRateClkDiv': 12800,
      'effectsA.dlyRateClkDiv.morphWheel': 16383 - 12800, // target 127 → 16383
      'effectsA.dlyRateClkDiv.morphAfterTouch': 128 * 70 - 12800,
      'effectsA.dlyRateClkDiv.morphCtrlPedal': 128 * -1 - 12800, // a target below 0 → 128·target
      'effectsB.dlyRateClkDiv': 64, // clock off: kept on the 3.00 scale
    });
    expect(p.os300DelayRate).toEqual(['B']);
    expect(p.warnings).toEqual([]); // panel B's delay is off
  });

  it('3.00 delay rate, free-running: kept as stored on the 3.00 scale and shown so; impossible values refuse', () => {
    const p = decodeNs3(ns3File({
      ...OS300_DELAY, 'effectsA.dlyEnable': 1, 'effectsA.dlyRateClkDiv': 64,
      'effectsA.dlyRateClkDiv.morphWheel': -20 - 16256,
    }, 300));
    expect(p.values).toMatchObject({ 'effectsA.dlyRateClkDiv': 64, 'effectsA.dlyRateClkDiv.morphWheel': -20 });
    expect(p.os300DelayRate).toEqual(['A', 'B']);
    expect(p.warnings).toEqual([expect.stringMatching(/OS 3\.00.*original 0–127 scale/)]);
    expect(p.panels[0].fx.map(flat).find((f) => f.name === 'Delay')?.params).toMatchObject({ rate: '64 of 127 (OS 3.00 scale)' });
    // As stored, with no knob position and no morph.
    expect(settingOf(p.panels[0].fx.find((f) => f.name === 'Delay')!, 'rate')).toEqual({ id: 'rate', text: '64 of 127 (OS 3.00 scale)' });
    // A 3.04 file's rate is a time: the knob's centre position, 8192 → 411 ms.
    expect(decodeNs3(ns3File({ 'effectsA.dlyEnable': 1 }, 304)).panels[0].fx.map(flat).find((f) => f.name === 'Delay')?.params?.rate).toBe('411 ms');
    // A rate above 127, or a target in 128–16383, makes the instrument refuse the program.
    for (const v of [{ 'effectsA.dlyRateClkDiv': 128 }, { 'effectsA.dlyRateClkDiv.morphWheel': 100 - 16256 }]) {
      const r = decodeNs3(ns3File({ ...OS300_DELAY, ...v }, 300));
      expect(r.layoutMatched).toBe(false);
      expect(r.warnings).toEqual([expect.stringMatching(/won’t load it/)]);
    }
  });

  it('odd, short or unframed files → header-only with a warning, never a throw', () => {
    const full = ns3File();
    const bad = full.slice();
    bad[0x30] = 200;                       // MultiCommon claims more bytes than the file has
    const unframed = new Uint8Array(600);  // a bare buffer has no block chain
    unframed[0x04] = 1;
    for (const bytes of [bad, full.slice(0, 0x2e), full.slice(0, 400), unframed, new Uint8Array(0)]) {
      const p = decodeNs3(bytes);
      expect(p.layoutMatched).toBe(false);
      expect(p.panels).toEqual([]);
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });

  it('flags values outside the firmware range but still decodes', () => {
    const body = synthFwBody(NS3_LAYOUT, {}, 304);
    const f = NS3_LAYOUT.fields.find((x) => x.key === 'pianoA.bank');
    writeBits(body, (NS3_LAYOUT.blocks[f?.block ?? 0].offset + 1) * 8 + (f?.bit ?? 0), 3, 7);
    const p = decodeNs3(synthFwFile('ns3f', body, 304));
    expect(p.layoutMatched).toBe(true);
    expect(p.panels[0].piano.type).toBe('#7');
    expect(p.warnings.join(' ')).toMatch(/outside the instrument’s range \(pianoA\.bank\)/);
  });
});

describe('decodeNs3: keyboard split', () => {
  it('reads the three split points: switch, fixed position and crossfade each', () => {
    const { split } = decodeNs3(ns3File({
      'common.splitEnable': 1,
      'common.splitLowEnable': 1, 'common.splitLowPos': 0, 'common.splitLowWidth': 0,
      'common.splitMidEnable': 0, 'common.splitMidPos': 3, 'common.splitMidWidth': 1,
      'common.splitHighEnable': 1, 'common.splitHighPos': 9, 'common.splitHighWidth': 2,
    }));
    expect(split).toEqual({
      on: true,
      points: [
        { on: true, note: 'F2', xfade: 'none' },
        { on: false, note: 'C4', xfade: '+/- 6 semitones' },
        { on: true, note: 'C7', xfade: '+/- 12 semitones' },
      ],
    });
  });

  it('reads the registry defaults: split off as a whole, only the Mid point enabled', () => {
    // Registry defaults: split off, only Mid enabled, positions 1/4/7, every engine in all four zones (9).
    const f = decodeNs3(ns3File());
    expect(f.split).toMatchObject({ on: false, points: [{ on: false, note: 'C3' }, { on: true, note: 'F4' }, { on: false, note: 'C6' }] });
    expect(f.panels[0].piano.kbZones).toBe('1111');
  });

  it('reads each engine’s zones per panel', () => {
    const f = decodeNs3(ns3File({
      'common.slotEnable': 3,
      'pianoA.kbZone': 0, 'synthCommonA.kbZone': 6, 'organA.kbZone': 5, 'pianoB.kbZone': 7, 'organB.kbZone': 3,
    }));
    const [a, b] = f.panels;
    expect([a.piano.kbZones, a.synth.kbZones, a.organ.kbZones]).toEqual(['1ooo', 'oo11', 'o11o']);
    expect([b.piano.kbZones, b.organ.kbZones, b.synth.kbZones]).toEqual(['111o', 'ooo1', '1111']);
  });

  it('reads them at the file offsets ns3-program-viewer documents', () => {
    // Split on = 0x31 bit 4; Low/Mid/High enable = bits 3/2/1; piano zone = 0x43 bits 6–3.
    const b = ns3buf();
    b[0x31] = 0b0001_1010; // split on, Low and High on (panel A only)
    b[0x43] = 0x80 | (4 << 3); // piano on, zone value 4
    const f = decodeNs3(b);
    expect(f.split).toMatchObject({ on: true, points: [{ on: true }, { on: false }, { on: true }] });
    expect(f.panels[0].piano.kbZones).toBe('11oo');
  });

  it('has no split when the layout was not read', () => {
    expect(decodeNs3(ns3File({}, 200)).split).toBeNull();
  });
});

describe('decodeNs3 effects: every block of the panel, with all its settings', () => {
  type Fields = Partial<Record<Ns3FieldKey, number>>;
  const fxOf = (v: Fields) => decodeNs3(ns3File(v)).panels[0].fx.map(flat);
  const unit = (v: Fields, name: string) => fxOf(v).find((f) => f.name === name)!;

  it('lists each block\'s settings in panel order', () => {
    const order = (name: string) => unit({}, name).settings.map((s) => s.id);
    expect(order('Rotary')).toEqual(['speed', 'drive']);
    expect(order('Effect 1')).toEqual(['rate', 'amount']);
    expect(order('Effect 2')).toEqual(['rate', 'amount']);
    expect(order('Delay')).toEqual(['rate', 'feedback', 'mix', 'filter']);
    expect(order('Amp/EQ')).toEqual(['drive', 'treble', 'mid', 'bass', 'midFreq']);
    expect(order('Comp')).toEqual(['amount']);
    expect(order('Reverb')).toEqual(['amount']);
  });

  it('a filter-type Amp/EQ lists drive, resonance, dry/wet and frequency, the frequency with its position', () => {
    // AMP_TYPE index of LP24: read it from the table rather than hard-coding it.
    const lp24 = AMP_TYPE.indexOf('LP24');
    const amp = unit({ 'effectsA.ampType': lp24, 'effectsA.ampMidFreq': 65 }, 'Amp/EQ');
    expect(amp.settings.map((s) => s.id)).toEqual(['drive', 'resonance', 'dryWet', 'frequency']);
    expect(amp.midi).toMatchObject({ frequency: 65 });
  });

  it('lists the whole chain in panel order, on or off', () => {
    const fx = fxOf({ 'effectsA.rvbEnable': 1 });
    expect(fx.map((f) => f.name)).toEqual(['Rotary', 'Effect 1', 'Effect 2', 'Delay', 'Amp/EQ', 'Comp', 'Reverb']);
    expect(fx.map((f) => f.on)).toEqual([false, false, false, false, false, false, true]);
  });

  it('keeps the settings of a block that is switched off', () => {
    const fx1 = unit({ 'effectsA.fx1Type': 1, 'effectsA.fx1Amt': 127 }, 'Effect 1');
    expect(fx1).toMatchObject({ on: false, type: 'Tremolo', params: { amount: '10.0' } });
  });

  it('reads the source of each block that has a source selector', () => {
    const fx = fxOf({
      'effectsA.leslieSrc': 0, 'effectsA.fx1Src': 1, 'effectsA.fx2Src': 2, 'effectsA.dlySrc': 0, 'effectsA.ampSrc': 2,
    });
    expect(Object.fromEntries(fx.map((f) => [f.name, f.source]))).toEqual({
      Rotary: 'Organ', 'Effect 1': 'Piano', 'Effect 2': 'Synth', Delay: 'Organ', 'Amp/EQ': 'Synth',
      Comp: undefined, Reverb: undefined,
    });
  });

  it('Effect 1: a free rate reads 0–10, a clocked rate reads its division; both keep the stored position', () => {
    const free = unit({ 'effectsA.fx1RateClkDiv': 127, 'effectsA.fx1Amt': 64 }, 'Effect 1');
    expect(free).toMatchObject({ params: { rate: '10.0', amount: '5.0' }, midi: { rate: 127, amount: 64 }, switches: { masterClock: false } });
    const clocked = (rate: number) => unit({ 'effectsA.fx1ClkEnable': 1, 'effectsA.fx1RateClkDiv': rate }, 'Effect 1').params?.rate;
    expect([0, 8, 9, 69, 119, 120, 127].map(clocked)).toEqual(['4/1', '4/1', '4/1T', '1/4', '1/16T', '1/32', '1/32']);
    expect(unit({ 'effectsA.fx1ClkEnable': 1 }, 'Effect 1').switches).toEqual({ masterClock: true });
  });

  it('Effect 2: rate and amount read 0–10', () => {
    expect(unit({ 'effectsA.fx2Rate': 127, 'effectsA.fx2Amt': 0 }, 'Effect 2'))
      .toMatchObject({ params: { rate: '10.0', amount: '0.0' }, midi: { rate: 127, amount: 0 } });
  });

  it('Delay: free time in ms from the 14-bit rate, clocked time as a division, and its switches', () => {
    const time = (rate: number, clk = 0) =>
      unit({ 'effectsA.dlyRateClkDiv': rate, 'effectsA.dlyClkEnable': clk }, 'Delay').params?.rate;
    expect(time(0)).toBe('1.50 s');
    expect(time(45 << 7)).toBe('484 ms');
    expect(time(127 << 7)).toBe('20 ms');
    // A tapped tempo sits between two knob positions: 750 ms and 732 ms, half way.
    expect(time((16 << 7) | 64)).toBe('741 ms');
    expect([0, 7, 8, 31, 120, 121, 127].map((x) => time(x << 7, 1))).toEqual(['1/2', '1/2', '1/4D', '1/4', '1/32T', '1/64', '1/64']);
    const d = unit({
      'effectsA.dlyPingPong': 1, 'effectsA.dlyMode': 1, 'effectsA.dlyFltType': 2, 'effectsA.dlyMix': 127, 'effectsA.dlyFeedback': 64,
    }, 'Delay');
    expect(d.switches).toEqual({ masterClock: false, pingPong: true, analog: true });
    expect(d.params).toMatchObject({ mix: '10.0', feedback: '5.0', filter: 'HP' });
    expect(d.midi).toEqual({ mix: 127, feedback: 64 });
  });

  it('Amp/EQ: drive, the three bands in dB and the mid frequency', () => {
    const amp = unit({
      'effectsA.ampType': 1, 'effectsA.ampDrive': 127, 'effectsA.ampTreble': 60, 'effectsA.ampMid': -59,
      'effectsA.ampBass': 0, 'effectsA.ampMidFreq': 65,
    }, 'Amp/EQ');
    expect(amp.type).toBe('Twin');
    expect(amp.params).toEqual({ drive: '10.0', treble: '+15.0 dB', mid: '-14.8 dB', bass: '0.0 dB', midFreq: '1.0 kHz' });
    expect(amp.midi).toEqual({ drive: 127, midFreq: 65 });
  });

  it('Amp/EQ set to a filter: the mid band is its resonance and the bass band its dry/wet mix', () => {
    const amp = unit({ 'effectsA.ampType': 4, 'effectsA.ampMid': 67, 'effectsA.ampBass': -60, 'effectsA.ampMidFreq': 0 }, 'Amp/EQ');
    expect(amp.type).toBe('LP24');
    expect(amp.params).toMatchObject({ frequency: '200 Hz', resonance: '10.0', dryWet: '0.0' });
    expect(amp.params).not.toHaveProperty('mid');
  });

  it('Comp: amount and the fast switch; Reverb: amount and the bright switch', () => {
    expect(unit({ 'effectsA.cmpAmt': 127, 'effectsA.cmpResponse': 1 }, 'Comp'))
      .toMatchObject({ params: { amount: '10.0' }, midi: { amount: 127 }, switches: { fast: true } });
    expect(unit({ 'effectsA.rvbType': 4, 'effectsA.rvbBright': 1, 'effectsA.rvbAmt': 64 }, 'Reverb'))
      .toMatchObject({ type: 'Hall 1', params: { amount: '5.0' }, midi: { amount: 64 }, switches: { bright: true } });
  });

  it('Rotary: the program-wide speed and drive', () => {
    expect(unit({ 'effectsA.leslieEnable': 1, 'common.leslieSpeed': 2, 'common.leslieDrv': 127 }, 'Rotary'))
      .toMatchObject({ on: true, params: { speed: 'Fast', drive: '10.0' }, midi: { drive: 127 } });
  });

  it('gives each morphed setting the value every source takes it to', () => {
    const fx1 = unit({
      'effectsA.fx1Amt': 64, 'effectsA.fx1Amt.morphWheel': 63, 'effectsA.fx1Amt.morphCtrlPedal': -200,
    }, 'Effect 1');
    expect(fx1.morphs).toEqual({ amount: { wheel: '10.0', pedal: '0.0' } });
    expect(unit({ 'effectsA.rvbAmt': 0, 'effectsA.rvbAmt.morphAfterTouch': 127 }, 'Reverb').morphs).toEqual({ amount: { at: '10.0' } });
    expect(unit({ 'common.leslieSpeed': 1, 'common.leslieSpeed.morphWheel': 1 }, 'Rotary').morphs).toEqual({ speed: { wheel: 'Fast' } });
    expect(unit({}, 'Delay').morphs).toBeUndefined();
  });

  it('reads the full chain of a real program', () => {
    const FIX = new URL('../../../fixtures/stage-3/s50428_Money_Wurly.ns3f', import.meta.url).pathname;
    if (!existsSync(FIX)) return; // fixture absent
    for (const p of decodeNs3(new Uint8Array(readFileSync(FIX))).panels) {
      expect(p.fx.map(flat).map((f) => f.name)).toEqual(['Rotary', 'Effect 1', 'Effect 2', 'Delay', 'Amp/EQ', 'Comp', 'Reverb']);
      for (const f of p.fx.map(flat)) for (const v of Object.values(f.params ?? {})) expect(String(v)).not.toMatch(/^#|undefined|NaN/);
    }
  });
});
