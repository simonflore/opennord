# Legacy `.nsmp` Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `patchEditedNsmp` edit legacy (`NWS`-container) `.nsmp` files — root and split — in place instead of throwing, without corrupting the container.

**Architecture:** A dedicated `patchLegacyNsmp` handles the legacy generation: it writes `keyHigh` into the map record *and* mirrors it to the `stk` header, writes `rootKey` into the `stk` header by global id, and re-CRCs the OG way (CRC-16/CCITT, LE, at `len-2`). Before returning it re-reads its own output and throws on any mismatch — the guard that makes shipping the unvalidated codec-2 (v10) path safe. A prerequisite RE fix re-anchors the v9 map reader on the true `[gid:u24]` record framing so `recordOffset` points at the record start.

**Tech Stack:** TypeScript, Vitest, React 19 (SSR-rendered component tests via `react-dom/server`).

**Design spec:** [`docs/specs/2026-07-17-legacy-nsmp-editing-design.md`](../specs/2026-07-17-legacy-nsmp-editing-design.md)

## Global Constraints

- **CI gates (all three must stay green):** `npm run typecheck`, `npm run lint`, `npm test`. Scoped test run for this work: `npx vitest run src/lib/ns4/`.
- **No hand-editing `*.generated.ts`** (offset-map, values, morphs, names, deps, interpret). None of this plan touches them.
- **Traceability:** every decoded/edited field cites its source (byte offset + the fixture it was verified on). Keep the `docs/NSMP-CODEC.md` note in sync.
- **Legal:** ground-truth `.nsmp` files are git-ignored. Tests that read them use `describe.skipIf` / `it.skipIf` so CI (which lacks the files) skips cleanly — never fails with ENOENT.
- **Verified fixture:** `fixtures/stage-2-ex/Ambiente Pad RedLib SML.nsmp` — 7 strokes, gids 667–673 (u32) / low bytes 155–161, roots C1–C7 (24,36,48,60,72,84,96), keyHigh 30,42,54,66,78,90,108, per-zone level trims present (`2d 18 18` = +9.00 dB on the top two zones).
- **Legacy CRC (measured):** `crc16Ccitt(bytes.subarray(0, len-2))` stored little-endian at `bytes[len-2..len-1]`. On the RedLib file this is `0x715c`. Never call `patchNs4Checksum` on a legacy file (it writes at `0x18..0x1b` = the `NWS` magic).
- **File length never changes** on an in-place patch.

---

## File Structure

- `src/lib/ns4/nsmp.ts` — reader. Re-anchor `parseLegacyZoneRecords` on the flush 12-byte record; add `legacyStrokeRootByGlobalId` (u32 gid); narrow `zoneRecordLayout`.
- `src/lib/ns4/nsmp-og.ts` — OG writer. Fix `writeOgMap` to write the gid as u24. `crc16Ccitt` already exists and is exported.
- `src/lib/ns4/sample-edit.ts` — editing. Add `patchLegacyNsmp`; delegate to it from `patchEditedNsmp`.
- `src/components/sample/SampleEditPanel.tsx` — accept legacy: widen `codec`, add a `legacy` flag, hide velocity + name for legacy, render `keyLow` read-only, pick the `.nsmp` extension.
- `src/components/sample/SampleInspector.tsx` — route legacy-with-zones (map v9/v10) to the editor instead of the read-only keyboard.
- `docs/NSMP-CODEC.md` — close the "un-identified X" open question; document the CRC location, absent name field, `keyHigh` duplication.
- Tests: `src/lib/ns4/nsmp-og.test.ts`, `src/lib/ns4/sample-edit.test.ts`, `src/components/sample/SampleEditPanel.test.tsx`.

---

## Task 1: Re-anchor the v9 map reader on the true `[gid:u24]` record

The v9 record is a flush 12 bytes: `[gid:u24 BE][level:u24 BE][keyHigh:u32 BE][strength:u16 BE]`. The reader currently reads `gid` and `keyHigh` truncated to their low bytes (the "un-identified u16 X" is really the gid's high bytes). Reframing makes `recordOffset` point at the record start, which Task 2 relies on, and fixes the latent `writeOgMap` desync for gids > 255.

**Files:**
- Modify: `src/lib/ns4/nsmp.ts` — `parseLegacyZoneRecords` (currently lines ~630–665), `readNsmpZones` legacy branch (~543–561); add `legacyStrokeRootByGlobalId`.
- Modify: `src/lib/ns4/nsmp-og.ts` — `writeOgMap` (~242–274).
- Modify: `docs/NSMP-CODEC.md` — the "Legacy v9 — the zone record" section.
- Test: `src/lib/ns4/nsmp-og.test.ts`, and the existing `src/lib/ns4/nsmp-corpus-sweep.test.ts` (guard, unchanged).

**Interfaces:**
- Produces: `legacyStrokeRootByGlobalId(bytes: Uint8Array, sections: NsmpSection[]): Map<number, number>` — maps the OG `stk` header's **u32** gid (`+0`) → root (`+5`). Used by the legacy branch of `readNsmpZones` and (conceptually) by Task 2's stk locator.
- Produces: `parseLegacyZoneRecords` — same signature, but records are now framed `gid = u24be(o)`, `keyHigh = u32be(o+6)`, `strength = u16be(o+10)`, and `recordOffset = o` points at the **record start** (was the core / gid-low-byte).
- Produces: `NsmpZone.globalID` for v9 zones is now the **full u24** gid (e.g. 673), not the low byte.

- [ ] **Step 1: Write the failing test — gid > 255 round-trips through the OG writer/reader**

Add to `src/lib/ns4/nsmp-og.test.ts` (a new `describe`, no fixture needed):

```ts
import { writeOgNsmp } from './nsmp-og';
// (readNsmpZones, readNsmp already imported at top of the file)

describe('writeOgNsmp — gid > 255 map/stk agreement', () => {
  const tone = (n: number) => Int32Array.from({ length: n }, (_, i) => Math.round(2000 * Math.sin(i / 8)));
  it('round-trips a zone whose globalID exceeds a byte', () => {
    const src = writeOgNsmp({
      name: 'Big GID',
      zones: [
        { channels: [tone(256), tone(256)], globalID: 673, rootKey: 96, keyHigh: 108 },
        { channels: [tone(256), tone(256)], globalID: 667, rootKey: 24, keyHigh: 30 },
      ],
    });
    const z = readNsmpZones(src);
    // gid survives as the full value (map u24 == stk u32), not truncated to 161/155.
    expect(z.map((x) => x.globalID).sort((a, b) => a - b)).toEqual([667, 673]);
    // roots come off the stk header, keyed by the full gid.
    const byGid = new Map(z.map((x) => [x.globalID, x]));
    expect(byGid.get(673)!.rootKey).toBe(96);
    expect(byGid.get(667)!.rootKey).toBe(24);
    expect(byGid.get(673)!.keyHigh).toBe(108);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/ns4/nsmp-og.test.ts -t "gid > 255"`
Expected: FAIL — today `writeOgMap` writes only the low byte, so the map gid (161) disagrees with the stk u32 (673); `readNsmpZones` either drops the zones (gidSet mismatch) or returns low-byte gids.

- [ ] **Step 3: Fix `writeOgMap` to write the gid as u24 (`nsmp-og.ts`)**

In `writeOgMap`, replace the low-byte gid write. Current:

```ts
    recs[o] = z.globalID & 0xff;
    // level u24 BE @+1 = unity ...
    putU24(recs, o + 1, level2DSP(0));
    // keyHigh u32 BE @+4; strength `00 01` @+8; the un-identified u16 X @+10 = 0
    putU32(recs, o + 4, z.keyHigh >>> 0);
    recs[o + 9] = 0x01;
```

Replace with the flush 12-byte record `[gid:u24][level:u24][keyHigh:u32][strength:u16]`:

```ts
    // Flush 12-byte v9 record: [gid:u24 BE][level:u24 BE][keyHigh:u32 BE][strength:u16 BE].
    // gid is u24 to match the stk header's u32 (writeOgStrokeHeader +0x00) — writing only
    // the low byte desynced the map from the header for gids > 255 (docs/NSMP-CODEC.md).
    putU24(recs, o, z.globalID & 0xffffff);
    putU24(recs, o + 3, level2DSP(0));   // unity gain (we model no per-zone level)
    putU32(recs, o + 6, z.keyHigh >>> 0);
    putU16(recs, o + 10, 1);             // strength — the record marker
```

Update the `writeOgMap` header comment that describes the old `recStart + 4 + 12i` framing to the flush `count(u16) + 12i` framing.

- [ ] **Step 4: Add `legacyStrokeRootByGlobalId` and reframe `parseLegacyZoneRecords` (`nsmp.ts`)**

Add next to `strokeRootByGlobalId` (leave that one untouched — codec 3/4 keep their u8 `+3` read):

```ts
/**
 * Legacy (`NWS`) analogue of {@link strokeRootByGlobalId}: the OG `stk` header
 * stores the global id as a **u32 BE at +0** (not a u8 at +3), so key by that.
 * Root is at +0x05, same as every generation. Used by the v9/v10 zone readers,
 * whose map records now carry the full u24 gid.
 */
function legacyStrokeRootByGlobalId(bytes: Uint8Array, sections: NsmpSection[]): Map<number, number> {
  const roots = new Map<number, number>();
  for (const s of sections) {
    if (!s.tag.endsWith('stk')) continue;
    const root = bytes[s.payloadOffset + 5];
    if (root <= 127) roots.set(u32be(bytes, s.payloadOffset), root);
  }
  return roots;
}
```

Reframe `parseLegacyZoneRecords` — the count marker is immediately followed by the first record (no leading `X`), records are 12 bytes flush, `gid = u24be(o)`, `keyHigh = u32be(o+6)`, `strength = u16be(o+10)`:

```ts
export function parseLegacyZoneRecords(
  bytes: Uint8Array, searchStart: number, searchEnd: number, count: number, gidSet?: Set<number>,
): NsmpZone[] {
  if (count <= 0) return [];
  const REC = 12;
  const recordsValid = (recStart: number): boolean => {
    for (let i = 0; i < count; i++) {
      const o = recStart + i * REC;
      if (o + REC > bytes.length || u32be(bytes, o + 6) > 127) return false;
      if (u16be(bytes, o + 10) !== 1) return false; // strength — 1 in all known content
      if (gidSet && !gidSet.has(u24be(bytes, o))) return false; // gid is u24 BE @+0
    }
    return true;
  };
  for (let p = searchStart; p < searchEnd; p++) {
    if (u16be(bytes, p) !== count) continue;
    const recStart = p + 2; // count:u16, then the first record starts immediately (no leading X)
    if (!recordsValid(recStart)) continue;
    const raw = Array.from({ length: count }, (_, i) => {
      const o = recStart + i * REC;
      return { globalID: u24be(bytes, o), keyHigh: u32be(bytes, o + 6), recordOffset: o };
    });
    raw.sort((a, b) => b.keyHigh - a.keyHigh); // top-down, defensive (already file order)
    return raw.map((r, i) => ({
      velTop: 127, velLow: 0,
      keyHigh: r.keyHigh,
      keyLow: i + 1 < raw.length ? raw[i + 1].keyHigh + 1 : 0,
      rootKey: r.keyHigh, // no root slot — overridden from the stk header below
      zoneMode: 0, zonePlayback: 0, zoneIsOneShot: 0,
      globalID: r.globalID, recordOffset: r.recordOffset,
    }));
  }
  return [];
}
```

In the `readNsmpZones` legacy (non-v10) branch, swap the root map to the u32 one so the gidSet and the root override key on the full gid:

```ts
    const strokeCount = sections.filter((s) => s.tag.endsWith('stk')).length;
    const roots = legacyStrokeRootByGlobalId(bytes, sections);
    const zones = parseLegacyZoneRecords(
      bytes, map.payloadOffset, map.endOffset, strokeCount, new Set(roots.keys()),
    );
    return zones.map((z) => ({ ...z, rootKey: roots.get(z.globalID) ?? z.rootKey }));
```

(The v10 branch — `map.version === 10` → `parseCodec2ZoneRecords(..., strokeRootByGlobalId(...))` — stays exactly as is. Its framing is unverified without a fixture; do not touch it.)

- [ ] **Step 5: Run the new test + the corpus sweep to verify green**

Run: `npx vitest run src/lib/ns4/nsmp-og.test.ts src/lib/ns4/nsmp-corpus-sweep.test.ts`
Expected: PASS. The corpus sweep reads the real RedLib file → 7 zones, distinct real gids, roots C1–C7, no all-same-root failure. (If the local fixture is absent the sweep skips — run it on a machine that has `fixtures/`.)

- [ ] **Step 6: Update `docs/NSMP-CODEC.md`**

In the "Legacy v9 — the zone record" section: change the record table's `−2 u16 X` row and the "+0 gid (u8)" framing to the flush `[gid:u24 @+0][level:u24 @+3][keyHigh:u32 @+6][strength:u16 @+10]`; state that the former "un-identified X" is the gid's high bytes (RedLib `00 02 a1` = 673 = the `stk` header's u32 `00 00 02 a1`); resolve the `> **Open.**` block accordingly. Add: the CRC is CRC-16/CCITT LE over `bytes[0..len-2]` at the file tail; `hdr` carries no name (18 bytes, no printable run → filename only); `keyHigh` is stored twice (map `+6` and `stk` `+0x33`) and the copies agree.

- [ ] **Step 7: Typecheck, lint, commit**

Run: `npm run typecheck && npm run lint`
Expected: clean.

```bash
git add src/lib/ns4/nsmp.ts src/lib/ns4/nsmp-og.ts src/lib/ns4/nsmp-og.test.ts docs/NSMP-CODEC.md
git commit -m "fix(nsmp): re-anchor v9 map reader on the true gid:u24 record framing"
```

---

## Task 2: `patchLegacyNsmp` — edit root + split in place, OG CRC, read-back verified

**Files:**
- Modify: `src/lib/ns4/sample-edit.ts` — add `patchLegacyNsmp`; delegate from `patchEditedNsmp` (currently throws at lines ~80–84).
- Test: `src/lib/ns4/sample-edit.test.ts` — replace the `patchEditedNsmp — legacy (v9) files` describe block (~202–229).

**Interfaces:**
- Consumes (from Task 1): `parseLegacyZoneRecords` framing (`recordOffset` = record start, `keyHigh` at `+6`), `NsmpZone.globalID` = full u24. From `nsmp-og.ts`: `crc16Ccitt(data: Uint8Array): number`. From `nsmp.ts`: `parseNsmpSections`, `readNsmp`, `readNsmpZones`, `NsmpSection`.
- Produces: `patchLegacyNsmp(original: Uint8Array, model: EditModel): Uint8Array` — patches `rootKey` + `keyHigh` for each zone, re-CRCs the OG way, verifies by read-back, throws on mismatch. `patchEditedNsmp` delegates to it when `readNsmp(original).legacy`.

- [ ] **Step 1: Write the failing round-trip test (`sample-edit.test.ts`)**

Replace the entire `describe('patchEditedNsmp — legacy (v9) files', …)` block (the refuse-don't-corrupt block) with:

```ts
describe('patchEditedNsmp — legacy (v9) files', () => {
  const tone = (n: number) => Int32Array.from({ length: n }, (_, i) => Math.round(2000 * Math.sin(i / 8)));
  const legacySrc = () => writeOgNsmp({
    name: 'OG Src',
    zones: [
      { channels: [tone(256), tone(256)], globalID: 673, rootKey: 96, keyHigh: 108 },
      { channels: [tone(256), tone(256)], globalID: 667, rootKey: 24, keyHigh: 30 },
    ],
  });

  it('patches root + split in place, preserving length, container and audio', () => {
    const src = legacySrc();
    const before = decodeNsmp(src);
    const model = editModel(readNsmp(src), readNsmpZones(src));
    const top = model.zones.findIndex((z) => z.globalID === 673);
    model.zones[top].rootKey = 84;   // was 96
    model.zones[top].keyHigh = 105;  // was 108

    const out = patchEditedNsmp(src, model);

    expect(out.length).toBe(src.length);          // in-place: same size
    const f = readNsmp(out);
    expect(f.recognized).toBe(true);
    expect(f.legacy).toBe(true);                  // NWS container survived (no NS4 CRC over the magic)
    const z = new Map(readNsmpZones(out).map((x) => [x.globalID, x]));
    expect(z.get(673)!.rootKey).toBe(84);
    expect(z.get(673)!.keyHigh).toBe(105);
    expect(z.get(667)!.rootKey).toBe(24);         // untouched zone intact
    expect(z.get(667)!.keyHigh).toBe(30);
    // audio byte-identical — patching never moves a sample
    const after = decodeNsmp(out);
    expect([...after[0].channels[0]]).toEqual([...before[0].channels[0]]);
    expect([...after[1].channels[0]]).toEqual([...before[1].channels[0]]);
  });

  it('re-CRCs the OG way (CRC-16/CCITT LE at len-2), not the NS4 CRC', () => {
    const src = legacySrc();
    const model = editModel(readNsmp(src), readNsmpZones(src));
    model.zones[0].rootKey = 30;
    const out = patchEditedNsmp(src, model);
    const n = out.length - 2;
    const stored = out[n] | (out[n + 1] << 8);
    expect(stored).toBe(crc16Ccitt(out.subarray(0, n)));
    // the NWS magic at 0x18..0x1a is intact (would be clobbered by patchNs4Checksum)
    expect([out[0x18], out[0x19], out[0x1a]]).toEqual([0x4e, 0x57, 0x53]);
  });

  it('rejects an unsupported legacy map version rather than guessing', () => {
    const src = legacySrc();
    // Corrupt the map section version (v9 -> v11) so neither record path applies.
    // Legacy section header is 9 bytes [tag:u24][version:u16][size:u32], so the
    // version u16 BE sits at payloadOffset - 6 (high) / - 5 (low).
    const map = parseNsmpSections(src).find((s) => s.tag.endsWith('map'))!;
    const bad = src.slice();
    bad[map.payloadOffset - 6] = 0x00; bad[map.payloadOffset - 5] = 0x0b; // version = 11
    const model = editModel(readNsmp(bad), readNsmpZones(bad));
    expect(() => patchEditedNsmp(bad, model)).toThrow(/legacy|version/i);
  });
});
```

Add the imports this block needs to the top of the file: `crc16Ccitt` from `./nsmp-og` (join the existing `writeOgNsmp` import), and `parseNsmpSections` (already imported).

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/ns4/sample-edit.test.ts -t "legacy"`
Expected: FAIL — `patchEditedNsmp` still throws `/legacy … isn’t supported/` for every case.

- [ ] **Step 3: Implement `patchLegacyNsmp` and delegate (`sample-edit.ts`)**

Update the imports and the guard. Replace the throw in `patchEditedNsmp`:

```ts
export function patchEditedNsmp(original: Uint8Array, model: EditModel): Uint8Array {
  const file = readNsmp(original);
  if (file.legacy) return patchLegacyNsmp(original, model);
  // …unchanged codec-3/4 path…
}
```

Imports to add at the top of `sample-edit.ts`:
- from `./nsmp`: `readNsmpZones` and `type NsmpSection` (join the existing `parseNsmpSections, readNsmp, zoneRecordLayout, patchStrokeLoopBytes` import).
- from `./nsmp-og`: `crc16Ccitt` (join the existing `writeOgNsmp`… no — `nsmp-og` is not yet imported here; add `import { crc16Ccitt } from './nsmp-og';`).
- The `u24`/`u32` byte readers are defined locally below (`rU24`/`rU32`) to avoid exporting more from `nsmp.ts`.

Add the new function:

```ts
const rU24 = (b: Uint8Array, o: number) => (b[o] << 16) | (b[o + 1] << 8) | b[o + 2];
const rU32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

/**
 * Patch root + split into a legacy (`NWS`) `.nsmp` in place, then re-CRC the OG way
 * and verify by read-back. Editable surface for this generation (docs/NSMP-CODEC.md):
 *  - `keyHigh` (split): map record (v9 `+6` u32 / v10 `+7` u8) **and** the `stk` header
 *    `+0x33` mirror — real files carry both copies in agreement, so a one-sided write
 *    desyncs them.
 *  - `rootKey`: `stk` header `+0x05`, located by the stroke's global id.
 *  - `keyLow`/`velTop`/`velLow`/`name`: no slot — not offered by the UI, ignored here.
 * Gated on the `map` version (9 or 10); anything else throws. Never changes length;
 * never calls `patchNs4Checksum` (0x18..0x1b is the `NWS` magic).
 */
export function patchLegacyNsmp(original: Uint8Array, model: EditModel): Uint8Array {
  const sections = parseNsmpSections(original);
  const map = sections.find((s) => s.tag.endsWith('map'));
  if (!map || (map.version !== 9 && map.version !== 10)) {
    throw new Error('This legacy .nsmp uses a sample-map version OpenNord can’t edit yet.');
  }
  const out = original.slice();

  // stk sections indexed by their header's low gid byte (stk +3). The map record's gid
  // (u24 v9 / u8 v10) and the header's u32 gid share their low byte, so this locates the
  // stroke for a zone in both generations; a low-byte collision is caught by read-back.
  const stkByGidLow = new Map<number, NsmpSection>();
  for (const s of sections) if (s.tag.endsWith('stk')) stkByGidLow.set(original[s.payloadOffset + 3], s);

  const clamp = (n: number) => Math.max(0, Math.min(127, Math.round(n))) & 0x7f;
  for (const z of model.zones) {
    if (z.recordOffset == null) continue;
    const keyHigh = clamp(z.keyHigh);
    // map keyHigh — width by version. recordOffset points at the record start (Task 1).
    if (map.version === 9) { out[z.recordOffset + 6] = 0; out[z.recordOffset + 7] = 0; out[z.recordOffset + 8] = (keyHigh >>> 8) & 0xff; out[z.recordOffset + 9] = keyHigh & 0xff; }
    else out[z.recordOffset + 7] = keyHigh; // v10: single byte, exactly where parseCodec2ZoneRecords reads it
    // stk header: root @+0x05, keyHigh mirror @+0x33.
    const stk = stkByGidLow.get(z.globalID & 0xff);
    if (stk) { out[stk.payloadOffset + 0x05] = clamp(z.rootKey); out[stk.payloadOffset + 0x33] = keyHigh; }
  }

  // OG re-CRC: CRC-16/CCITT over everything before the trailing 2-byte checksum, LE.
  const n = out.length - 2;
  const crc = crc16Ccitt(out.subarray(0, n));
  out[n] = crc & 0xff; out[n + 1] = (crc >>> 8) & 0xff;

  verifyLegacyPatch(original, out, model);
  return out;
}

/**
 * Read the patched bytes back with the corpus-validated reader and confirm the edits
 * took — the guard that makes an unvalidated v10 write safe (a wrong assumption becomes
 * an error, never a corrupt download). Would have caught both original bugs: the
 * ZONE_LAYOUT misapplication (zones read back wrong) and the CRC-over-magic
 * (`recognized` false).
 */
function verifyLegacyPatch(original: Uint8Array, out: Uint8Array, model: EditModel): void {
  const f = readNsmp(out);
  if (!f.recognized || !f.legacy) throw new Error('Legacy patch left the file unrecognizable — refusing to save.');
  const before = parseNsmpSections(original), after = parseNsmpSections(out);
  if (after.length !== before.length || after.some((s, i) => s.tag !== before[i].tag || s.size !== before[i].size)) {
    throw new Error('Legacy patch disturbed the section tree — refusing to save.');
  }
  const stored = out[out.length - 2] | (out[out.length - 1] << 8);
  if (stored !== crc16Ccitt(out.subarray(0, out.length - 2))) throw new Error('Legacy patch checksum failed to verify.');
  const back = new Map(readNsmpZones(out).map((z) => [z.globalID, z]));
  for (const z of model.zones) {
    if (z.recordOffset == null) continue;
    const got = back.get(z.globalID);
    const want = { root: Math.max(0, Math.min(127, Math.round(z.rootKey))) & 0x7f, high: Math.max(0, Math.min(127, Math.round(z.keyHigh))) & 0x7f };
    if (!got || got.rootKey !== want.root || got.keyHigh !== want.high) {
      throw new Error('Legacy patch did not round-trip — refusing to save a file that may be corrupt.');
    }
    // stk +0x33 mirror must match the map keyHigh (the reader takes keyHigh from the map).
    const stk = after.find((s) => s.tag.endsWith('stk') && (rU32(out, s.payloadOffset) & 0xff) === (z.globalID & 0xff));
    if (stk && out[stk.payloadOffset + 0x33] !== want.high) throw new Error('Legacy patch left the split mirror out of sync — refusing to save.');
  }
}
```

Delete the now-obsolete legacy `throw` and its long JSDoc paragraph from `patchEditedNsmp` (keep a one-line note that legacy is handled by `patchLegacyNsmp`).

- [ ] **Step 4: Run the legacy tests to verify they pass**

Run: `npx vitest run src/lib/ns4/sample-edit.test.ts -t "legacy"`
Expected: PASS (round-trip, OG-CRC, and version-reject cases).

- [ ] **Step 5: Run the full ns4 suite (nothing else regressed)**

Run: `npx vitest run src/lib/ns4/`
Expected: PASS (skips fixture-gated suites when local files are absent).

- [ ] **Step 6: Typecheck, lint, commit**

```bash
npm run typecheck && npm run lint
git add src/lib/ns4/sample-edit.ts src/lib/ns4/sample-edit.test.ts
git commit -m "feat(nsmp): edit root + split of legacy .nsmp in place, OG CRC + read-back verified"
```

---

## Task 3: Real-fixture proof — only intended bytes + CRC change, level trims preserved

The synthetic round-trip proves the mechanism; this proves it against a real file — specifically that the per-zone `level` trims we don't model survive byte-exact (the whole point of patching in place over rebuilding).

**Files:**
- Test: `src/lib/ns4/sample-edit.test.ts` — add an `it.skipIf(!hasGt(...))` case.

**Interfaces:**
- Consumes: `hasGt` from `./gt-fixtures`; the fixture `fixtures/stage-2-ex/Ambiente Pad RedLib SML.nsmp`.

- [ ] **Step 1: Add the fixture test**

```ts
import { hasGt } from './gt-fixtures';
const redlib = 'fixtures/stage-2-ex/Ambiente Pad RedLib SML.nsmp';
const redlibPath = join(process.cwd(), redlib);

it.skipIf(!hasGt(redlib))('edits one legacy zone, preserving every other byte incl. level trims', () => {
  const src = new Uint8Array(readFileSync(redlibPath));
  const model = editModel(readNsmp(src), readNsmpZones(src));
  const top = model.zones.find((z) => z.globalID === 673)!; // C7 zone, keyHigh 108
  const rec = top.recordOffset!;
  const levelBefore = [...src.subarray(rec + 3, rec + 6)]; // u24 level = 2d 18 18 (+9 dB)
  top.rootKey = 84; // was 96

  const out = patchEditedNsmp(src, model);

  expect(out.length).toBe(src.length);
  expect(readNsmp(out).legacy).toBe(true);
  const z = new Map(readNsmpZones(out).map((x) => [x.globalID, x]));
  expect(z.get(673)!.rootKey).toBe(84);
  // the per-zone level trim we don't model is preserved byte-exact
  expect([...out.subarray(rec + 3, rec + 6)]).toEqual(levelBefore);
  // only the stk root byte, the stk keyHigh mirror (unchanged here), and the 2 CRC bytes move
  const changed: number[] = [];
  for (let i = 0; i < src.length; i++) if (src[i] !== out[i]) changed.push(i);
  const stk = parseNsmpSections(src).find((s) => s.tag.endsWith('stk') && src[s.payloadOffset + 3] === 161)!;
  const crc0 = src.length - 2;
  expect(changed.every((i) => i === stk.payloadOffset + 0x05 || i >= crc0)).toBe(true);
  expect(changed).toContain(stk.payloadOffset + 0x05);
});
```

- [ ] **Step 2: Run it (locally, where the fixture exists)**

Run: `npx vitest run src/lib/ns4/sample-edit.test.ts -t "legacy zone, preserving"`
Expected: PASS locally; SKIP on a machine without `fixtures/`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ns4/sample-edit.test.ts
git commit -m "test(nsmp): real-fixture proof that legacy patch preserves level trims + audio"
```

---

## Task 4: Narrow `zoneRecordLayout` so it can't be misapplied to legacy again

The always-`ZONE_LAYOUT` stub is what put codec-3/4 offsets onto a legacy record in the first place. After Task 2 nothing legacy reaches it, but its name/JSDoc still imply it covers every codec.

**Files:**
- Modify: `src/lib/ns4/nsmp.ts` — `zoneRecordLayout` (~311–314) and its callers.

**Interfaces:**
- Produces: `zoneRecordLayout()` (no arg) — documented as the **codec-3/4** record layout only. It already ignores its argument; drop the misleading `_codec` parameter and tighten the JSDoc.

- [ ] **Step 1: Narrow the function**

```ts
/**
 * The 16-byte zone-record field layout — **codec 3 & 4 only** (they share it).
 * Legacy (`NWS`) records are a different shape entirely and are read by
 * {@link parseLegacyZoneRecords} / written by {@link patchLegacyNsmp}; never apply
 * this layout to a legacy file (doing so put codec-3/4 offsets onto a 12-byte v9
 * record and produced a silently broken download — the bug this narrowing prevents).
 */
export function zoneRecordLayout(): ZoneRecordLayout {
  return ZONE_LAYOUT;
}
```

Update its one caller in `patchEditedNsmp` (`const layout = zoneRecordLayout(file.codec);` → `const layout = zoneRecordLayout();`). Grep first: `grep -rn "zoneRecordLayout(" src/` — fix every call site to take no argument.

- [ ] **Step 2: Typecheck (catches any missed caller)**

Run: `npm run typecheck`
Expected: clean. If a call still passes an argument, TS reports it — fix and re-run.

- [ ] **Step 3: Run the ns4 suite + lint, commit**

Run: `npx vitest run src/lib/ns4/ && npm run lint`
Expected: PASS / clean.

```bash
git add src/lib/ns4/nsmp.ts
git commit -m "refactor(nsmp): narrow zoneRecordLayout to the codec-3/4 record it describes"
```

---

## Task 5: Surface legacy editing in the UI

**Files:**
- Modify: `src/components/sample/SampleEditPanel.tsx` — widen `codec`, add `legacy`, hide velocity + name for legacy, render `keyLow` read-only, pick `.nsmp` extension.
- Modify: `src/components/sample/SampleInspector.tsx` — route legacy-with-zones (map v9/v10) to the editor (~177–217).
- Test: `src/components/sample/SampleEditPanel.test.tsx`.

**Interfaces:**
- Consumes: `patchEditedNsmp` (now legacy-capable). `SampleEditPanel` gains prop `legacy?: boolean`; `codec` widens to `3 | 4 | 'og'` (legacy has no numeric codec suffix).
- Produces: for legacy, the download filename is `${name}.nsmp` (no digit); velocity columns and the name input are not rendered; `keyLow` renders as static text, not an input.

- [ ] **Step 1: Write the failing component test**

Add to `src/components/sample/SampleEditPanel.test.tsx`:

```ts
describe('SampleEditPanel legacy surface', () => {
  const legacyModel: EditModel = {
    name: 'OG Pad',
    zones: [
      { rootKey: 96, keyLow: 91, keyHigh: 108, velTop: 127, velLow: 0, recordOffset: 100, globalID: 673 } as any,
      { rootKey: 84, keyLow: 79, keyHigh: 90, velTop: 127, velLow: 0, recordOffset: 112, globalID: 672 } as any,
    ],
  };

  it('hides velocity columns and the name field for legacy', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={legacyModel} bytes={new Uint8Array(0)} codec="og" legacy />);
    expect(html).not.toMatch(/vel ≥/);
    expect(html).not.toMatch(/vel ≤/);
    expect(html).not.toMatch(/Name:/);
  });

  it('still edits root and split (those inputs render) for legacy', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={legacyModel} bytes={new Uint8Array(0)} codec="og" legacy />);
    expect(html).toMatch(/root/);
    expect(html).toMatch(/up to \(split\)/);
    expect(html).toMatch(/Download edited \.nsmp<\/|Download edited \.nsmp"/); // extension has no digit
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/sample/SampleEditPanel.test.tsx`
Expected: FAIL — `codec="og"` is a type error and the legacy branches don't exist.

- [ ] **Step 3: Implement the legacy surface in `SampleEditPanel.tsx`**

- Widen the prop: `codec: 3 | 4 | 'og'` and add `legacy?: boolean`.
- Download extension: `const ext = codec === 'og' ? 'nsmp' : \`nsmp${codec}\`;` and use `downloadBytes(out, \`${name.trim() || 'sample'}.${ext}\`)`; button label `Download edited .${ext}`.
- In the table `<thead>`, render the `vel ≥` / `vel ≤` headers only when `!legacy`; likewise the two velocity `<td>` cells per row.
- Render `keyLow` read-only for legacy: replace the `from` cell's `num(...)` input with static `{z.keyLow} <em>{noteName(z.keyLow)}</em>` when `legacy` (it is the neighbour's split + 1 — editing it means moving the neighbour's split, which the keybed drag already does).
- Hide the name `<label>` block when `legacy` (no slot in the container — filename only).
- Update the footer copy for legacy: `Edits root / split; audio and all other settings — including per-zone levels — are preserved. Back up first.`
- Keep the gain/detune block gated on `gd` as-is (legacy files return `null` from `gainDetuneView`, so it already won't render).

- [ ] **Step 4: Route legacy to the editor in `SampleInspector.tsx`**

Compute the map version and reuse the editor. Replace the `loaded.file.legacy && loaded.zones.length > 0` read-only branch so that a v9/v10 legacy file with zones renders the editor instead:

```tsx
const mapVersion = loaded.file.sections.find((s) => s.tag.endsWith('map'))?.version;
const legacyEditable = loaded.file.legacy && (mapVersion === 9 || mapVersion === 10) && loaded.zones.length > 0;
```

- In the primary editor condition, add `legacyEditable`: render `<SampleEditPanel … codec={loaded.file.codec === 4 ? 4 : loaded.file.legacy ? 'og' : 3} legacy={loaded.file.legacy} … />`.
- Keep the read-only `SampleKeyboard` + "convert to .nsmp3/.nsmp4" branch only for legacy files that are **not** `legacyEditable` (map version we can't edit, or no zones).
- Update the raw-table gate at the bottom (`!((codec 3||4) && zones>0)`) to also suppress the raw `ZoneMap` when `legacyEditable` (the editor now covers it).

- [ ] **Step 5: Run the component tests + existing inspector tests**

Run: `npx vitest run src/components/sample/`
Expected: PASS. Update `SampleInspector.test.tsx` / `SampleEditPanel.test.tsx` only if a selector shifted; the codec-3/4 disclaimer tests must stay green.

- [ ] **Step 6: Verify in the browser (previewable UI change)**

Start the dev server and load the RedLib fixture (or any legacy `.nsmp`) via the sample inspector; confirm the editor renders with root + split editable, `keyLow` read-only, no velocity columns, no name field, and the button reads "Download edited .nsmp". Check the console for errors.

Run: `preview_start { name: <dev server> }` → navigate to the samples route → `read_console_messages`.
Expected: editor renders; no console errors. Screenshot for the summary.

- [ ] **Step 7: Typecheck, lint, commit**

```bash
npm run typecheck && npm run lint
git add src/components/sample/SampleEditPanel.tsx src/components/sample/SampleInspector.tsx src/components/sample/SampleEditPanel.test.tsx
git commit -m "feat(samples): edit root + split of legacy .nsmp in the sample editor"
```

---

## Task 6: Full-suite green + spec sync

**Files:**
- Modify (if needed): `docs/specs/2026-07-17-legacy-nsmp-editing-design.md` — flip Status to implemented.

- [ ] **Step 1: Run every gate**

Run: `npx vitest run src/lib/ns4/ && npx vitest run src/components/sample/ && npm run typecheck && npm run lint`
Expected: all PASS / clean.

- [ ] **Step 2: Run the whole test suite once**

Run: `npm test`
Expected: PASS (fixture-gated suites skip without local files).

- [ ] **Step 3: Mark the spec implemented and commit**

```bash
git add docs/specs/2026-07-17-legacy-nsmp-editing-design.md
git commit -m "docs(nsmp): mark legacy-editing spec implemented"
```

---

## Self-review notes

- **Spec coverage:** patch path (T2), CRC (T2), read-back (T2), gid:u24 reader+writer+docs (T1), `zoneRecordLayout` narrowing (T4), codec-2 gate (T2, guarded by read-back — no fixture, accepted risk per spec), real-fixture level-preservation proof (T3), UI surface with keyLow read-only + velocity/name hidden (T5). All mapped.
- **Codec-2 caveat:** no v10 fixture or writer exists, so v10 has no positive round-trip test by design — the version-gate test (T2 step 1) proves it is *accepted, not thrown*, and the read-back guard converts any wrong v10 assumption into an error rather than a corrupt file. This is the spec's explicit accepted risk.
- **Type consistency:** `patchLegacyNsmp(original, model)` signature is stable across T2/T3; `zoneRecordLayout()` is argument-free after T4 (all callers updated); `SampleEditPanel` `codec: 3 | 4 | 'og'` + `legacy?: boolean` is consistent across T5 and its tests.
- **`NsmpZone.globalID` semantics change** (v9 low-byte → full u24) is contained: Task 1 updates the only readers (`readNsmpZones` legacy branch) and the stk locator in Task 2 keys on the shared low byte, so v9 and v10 both resolve correctly.
