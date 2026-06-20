import { describe, it, expect } from 'vitest';
import { formatSlot, wave2Slot, electro5Slot, lead4Slot } from './slot';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// CWave2::ConvertLocation @0x0000000100034508 — only handles NSMP files;
// for program (nw2p) partitions it returns 1 (unhandled). The base class then
// applies the NSM-era grid display — identical to formatSlot. Confirmed by 26
// real .nw2p fixtures (all formatType=1, NSM-era envelope, not OG/legacy).
describe('wave2Slot (CWave2::ConvertLocation @0x0000000100034508)', () => {
  it('maps bank+location to the NSM-era grid display (same as formatSlot)', () => {
    // One Vision Queen.nw2p: bank=2, loc=1 → C:12 (loc/8=0 → d1=1, loc%8=1 → d2=2)
    expect(wave2Slot(2, 1)).toBe('C:12');
    // EF programs carry bank=14 in the header; BANK_LETTERS[14 & 0x7] = BANK_LETTERS[6] = 'G'
    // (NSM displays these as "Bank O" but that is NSM's own label, not the header bank index)
    // loc=0 → d1=1, d2=1 → G:11
    expect(wave2Slot(14, 0)).toBe('G:11');
    // loc=15 → 15/8=1 d1=2, 15%8=7 d2=8 → G:28  (Ambient Pno Wh 2.nw2p)
    expect(wave2Slot(14, 15)).toBe('G:28');
    // loc=24 → 24/8=3 d1=4, 24%8=0 d2=1 → G:41  (Elio.nw2p)
    expect(wave2Slot(14, 24)).toBe('G:41');
  });

  it('is identical to formatSlot (wave2Slot delegates to formatSlot)', () => {
    // wave2Slot MUST equal formatSlot for all values — ConvertLocation is a no-op for programs
    for (const [bank, loc] of [[0, 0], [2, 1], [7, 63], [14, 15], [14, 24]] as const) {
      expect(wave2Slot(bank, loc)).toBe(formatSlot(bank, loc));
    }
  });

  it('cross-checks real fixture bytes (bank, loc) against expected slot', () => {
    const fixturesDir = join(process.cwd(), 'fixtures/wave-2');
    if (!existsSync(fixturesDir)) return; // corpus is gitignored — skip in CI

    // Spot-check known fixtures by header bytes
    // bank=14 in the CBIN header → BANK_LETTERS[14 & 0x7] = BANK_LETTERS[6] = 'G'
    // (NSM displays these as "Bank O" in its own UI, but the header bank value is 14)
    const expected: Record<string, string> = {
      'One Vision Queen.nw2p': 'C:12',                    // bank=2, loc=1
      'EF__Program_Bank O_camel  Lead 3.nw2p': 'G:11',   // bank=14, loc=0
      'EF__Program_Bank O_nemet  Lead 4.nw2p': 'G:12',   // bank=14, loc=1
      'EF__Program_Bank O_Ambient Pno Wh 2.nw2p': 'G:28', // bank=14, loc=15
      'EF__Program_Bank O_Elio.nw2p': 'G:41',            // bank=14, loc=24
    };
    for (const [filename, expectedSlot] of Object.entries(expected)) {
      const path = join(fixturesDir, filename);
      if (!existsSync(path)) continue;
      const buf = readFileSync(path);
      const bank = buf[0x0c] ?? 0;
      const loc  = buf[0x0e] ?? 0;
      expect(wave2Slot(bank, loc), filename).toBe(expectedSlot);
    }
  });
});

describe('formatSlot', () => {
  it('maps {bank, location} to the Nord X:YY display', () => {
    expect(formatSlot(7, 56)).toBe('H:81');
    expect(formatSlot(6, 0)).toBe('G:11');
    expect(formatSlot(2, 63)).toBe('C:88');
    expect(formatSlot(0, 0)).toBe('A:11');
  });
});

// CElectro5::ConvertLocation @0x0000000100194844 — for programs, ConvertLocation
// returns 1 (unhandled); the base class displays bank as a letter and location as
// a 1-based sequential slot number within the bank (NOT the 8-col grid used by
// Stage models). The Electro 5 has 50 slots per bank (locs 0–49), displayed as
// A:01–F:50. Format: X:NN where X = ABCDEFGH[bank] and NN = location + 1
// (zero-padded to 2 digits).
// CLead4Base::ConvertLocation @0x00000001000ddcf8 — matches nl4p partition only.
// The Lead 4 has two "performance" banks (A=bank 0, B=bank 1), each with 50 slots
// (0x32 = 50 per bank). The function normalises a two-component (bank, loc) address
// into/from a flat linear slot within the partition. Display mirrors the Electro 5
// sequential scheme: bank letter + 1-based slot, zero-padded to 2 digits (A:01–B:50).
describe('lead4Slot (CLead4Base::ConvertLocation @0x00000001000ddcf8)', () => {
  it('maps bank+location to Lead 4 sequential slot display', () => {
    // Bank A (0), slot 0 → A:01 (first slot)
    expect(lead4Slot(0, 0)).toBe('A:01');
    // Bank A (0), slot 49 → A:50 (last slot in bank A)
    expect(lead4Slot(0, 49)).toBe('A:50');
    // Bank B (1), slot 0 → B:01 (first slot in bank B)
    expect(lead4Slot(1, 0)).toBe('B:01');
    // Bank B (1), slot 49 → B:50 (last slot in bank B)
    expect(lead4Slot(1, 49)).toBe('B:50');
  });

  it('cross-checks the "Duo Arp Nord Stage Samples.nl4p" fixture (bank=1, loc=0x29=41)', () => {
    // Fixture header: 0x0C=0x01 (bank B), 0x0E=0x29 (loc 41) → B:42
    const fixturesDir = join(process.cwd(), 'fixtures/lead-4');
    if (!existsSync(fixturesDir)) return; // corpus is gitignored — skip in CI

    const path = join(fixturesDir, 'Duo Arp Nord Stage Samples.nl4p');
    if (!existsSync(path)) return;
    const buf = readFileSync(path);
    const bank = buf[0x0c] ?? 0; // 0x01
    const loc = buf[0x0e] ?? 0;  // 0x29 = 41
    expect(lead4Slot(bank, loc)).toBe('B:42');
  });
});

describe('electro5Slot (CElectro5::ConvertLocation @0x0000000100194844)', () => {
  it('maps bank+location to Electro 5 sequential slot display', () => {
    // Bank 0, loc 0 → A:01 (first slot)
    expect(electro5Slot(0, 0)).toBe('A:01');
    // Bank 0, loc 49 → A:50 (last slot in a 50-slot bank)
    expect(electro5Slot(0, 49)).toBe('A:50');
    // Bank 2, loc 20 → C:21 (real fixture: "CP 80 Grandpad Sample.ne5p")
    expect(electro5Slot(2, 20)).toBe('C:21');
    // Bank 5, loc 24 → F:25 (real fixture: "In The Air 2Nite Samples.ne5p")
    expect(electro5Slot(5, 24)).toBe('F:25');
  });

  it('cross-checks fixture bank/location bytes against expected slot format', () => {
    const fixturesDir = join(process.cwd(), 'fixtures/electro-5');
    if (!existsSync(fixturesDir)) return; // corpus is gitignored — skip in CI

    // All 5 fixtures confirmed with bank/loc bytes at 0x0C / 0x0E (cbin.ts)
    const expectedSlots: Record<string, string> = {
      'CP 80 Grandpad Sample.ne5p': 'C:21',
      'In The Air 2Nite Samples.ne5p': 'F:25',
      'Nord Stage Electro Lead Samples (1).ne5p': 'H:45',
      'Nord Stage Electro Lead Samples (2).ne5p': 'F:09',
      'Nord Stage Electro Lead Samples.ne5p': 'E:46',
    };

    for (const [filename, expected] of Object.entries(expectedSlots)) {
      const path = join(fixturesDir, filename);
      if (!existsSync(path)) continue;
      const buf = readFileSync(path);
      const bank = buf[0x0c] ?? 0;
      const loc = buf[0x0e] ?? 0;
      expect(electro5Slot(bank, loc), filename).toBe(expected);
    }
  });
});
