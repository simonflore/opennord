import { describe, it, expect } from 'vitest';
import { decodeNs3 } from './decode';

/**
 * A synthetic NSM-era (CBIN formatType 1 @ 0x04) .ns3f buffer. The field tests
 * below target the NSM-era panel layout (versionOffset 0); legacy formatType-0
 * files shift the whole block by -0x14 (see decode.ts + the fmt0 tests). Setting
 * formatType 1 makes these buffers exercise the offset they were written for.
 */
function ns3buf(size = 600): Uint8Array {
  const b = new Uint8Array(size);
  b[0x04] = 1;
  return b;
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
    // Fred's Gothic/Natural Strings files). A raw zero buffer IS formatType 0.
    const b = new Uint8Array(600);   // formatType 0
    b[0x31 - 20] = 1 << 5;           // flag @0x1d → panel B
    expect(decodeNs3(b).panels.map((p) => p.id)).toEqual(['B']);
    // the NSM-era offset must NOT be consulted for a formatType-0 file
    const c = new Uint8Array(600);   // formatType 0
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
    const fx = decodeNs3(b).panels[0].fx;
    expect(fx.map((f) => f.name)).toEqual(['Delay', 'Reverb']); // signal order
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
    const fx = decodeNs3(b).panels[0].fx;
    const comp = fx.find((f) => f.name === 'Comp');
    expect(comp).toBeDefined();
    expect(comp?.params?.amount).toBe('10.0');
  });

  it('decodes reverb enable + amount from 0x134-0x136', () => {
    const b = ns3buf();
    b[0x134] = 0x02;   // reverb enable; type 0 → Room 1
    b[0x135] = 0x1f; b[0x136] = 0xc0; // amount = (0x1f<<2)|3 = 0x7f = 127 → '10.0'
    const rev = decodeNs3(b).panels[0].fx.find((f) => f.name === 'Reverb');
    expect(rev?.params?.amount).toBe('10.0');
  });

  it('decodes rotary speaker enable + slow speed from 0x10B(b7) + 0x34(b0)/0x35(b7)', () => {
    const b = ns3buf();
    b[0x10b] = 0x80;  // rotary enable (b7)
    b[0x35] = 0x80;   // speed raw = (0x34.b0 << 1) | 0x35.b7 = 1 → Slow (firmware default)
    const rot = decodeNs3(b).panels[0].fx.find((f) => f.name === 'Rotary');
    expect(rot).toBeDefined();
    expect(rot?.params?.speed).toBe('Slow');
  });

  // ── Stage 3 OS 2.64 firmware-registry corrections (docs/STAGE2-3-FIRMWARE.md §3) ──
  // Each test below fails against the pre-fix (ns3-program-viewer) bit reads.

  it('reads rotary speed as 2 bits: 0 Stop / 1 Slow / 2 Fast / 3 unlabeled', () => {
    const speed = (b34: number, b35: number) => {
      const b = ns3buf();
      b[0x10b] = 0x80;          // rotary on
      b[0x34] = b34; b[0x35] = b35;
      return decodeNs3(b).panels[0].fx.find((f) => f.name === 'Rotary')?.params?.speed;
    };
    expect(speed(0x00, 0x00)).toBe('Stop');  // pre-fix: 'Slow'
    expect(speed(0x00, 0x80)).toBe('Slow');
    expect(speed(0x01, 0x00)).toBe('Fast');
    expect(speed(0x01, 0x80)).toBe('#3');    // no firmware label → neutral fallback
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
    const fx1 = decodeNs3(b).panels[0].fx.find((f) => f.name === 'Effect 1');
    expect(fx1?.type).toBe('Panning');
    expect(fx1?.params?.rate).toBe(101);  // pre-fix mask 0x1fc0 >>> 6 gave 74
  });

  it('decodes Effect 2 rate as 7 bits from 0x114(b1-0)+0x115(b7-3)', () => {
    const fx2 = (b114: number, b115: number) => {
      const b = ns3buf();
      b[0x114] = 0x80 | b114;   // enable b7, type 0 (Phaser 1), rate high bits b1-0
      b[0x115] = b115;          // rate low bits b7-3; amount bits b2-0
      return decodeNs3(b).panels[0].fx.find((f) => f.name === 'Effect 2');
    };
    // rate 64 = 0b10_00000 → 0x114 b1-0 = 0b10, 0x115 b7-3 = 0
    expect(fx2(0x02, 0x00)?.params?.rate).toBe(64);   // pre-fix: 0
    // rate 127 = 0b11_11111
    expect(fx2(0x03, 0xf8)?.params?.rate).toBe(127);  // pre-fix: 192|31 = 223
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
    expect(pb.fx.find((f) => f.name === 'Rotary')?.params?.speed).toBe('Fast');
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
    const b = new Uint8Array(600); // formatType 0 → versionOffset −20
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
    const amp = decodeNs3(b).panels[0].fx.find((f) => f.name === 'Amp/EQ');
    expect(amp?.type).toBe('Clean');     // pre-fix: 'JC'
    expect(amp?.params).toEqual({ treble: 60, mid: -60, bass: 0 });
    const types = [0, 1, 2, 3, 4, 5, 6].map((t) => {
      const c = ns3buf(); c[0x129] = 0x04; c[0x12a] = t << 5;
      return decodeNs3(c).panels[0].fx.find((f) => f.name === 'Amp/EQ')?.type;
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
    const FIXTURES_DIR = new URL('../../../../fixtures/stage-3/', import.meta.url).pathname;

    function readFixture(name: string): Uint8Array | null {
      try {
        // vitest/Node: synchronous require for fixture reads
        // biome-ignore lint: require is intentional here for sync reads in vitest
        const fs = require('fs') as typeof import('fs');
        const b = fs.readFileSync(`${FIXTURES_DIR}${name}`);
        return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
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
