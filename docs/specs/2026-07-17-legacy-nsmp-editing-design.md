# Legacy `.nsmp` editing — design

**Date:** 2026-07-17
**Status:** approved, not yet implemented
**Touches:** `src/lib/ns4/sample-edit.ts`, `src/lib/ns4/nsmp.ts`, `src/lib/ns4/nsmp-og.ts`,
`src/components/sample/SampleEditPanel.tsx`, `src/components/sample/SampleInspector.tsx`,
`docs/NSMP-CODEC.md`

## Problem

`patchEditedNsmp` throws for legacy (`NWS`-container) `.nsmp` files. The guard was added
on 2026-07-17 alongside the v9 zone-record RE fix, replacing a path that silently produced
a broken download two independent ways:

1. **Zone records.** `zoneRecordLayout(codec)` ignores its argument and always returns the
   16-byte codec-3/4 `ZONE_LAYOUT`. The legacy v9 record is 12 bytes with an unrelated
   shape, so `rootKey` landed on the gid, `keyHigh`/`keyLow` on the level, and
   `velLow`/`velTop` at +14/+15 — inside the *next* record.
2. **Checksum.** `patchNs4Checksum` writes the NS4 CRC at `0x18..0x1b`, which in an `NWS`
   container is the **magic itself** — the patched file stopped being recognized as an
   `.nsmp` at all.

This spec makes legacy editing work for real.

## Verified facts

Everything below was measured on the real fixture
`fixtures/stage-2-ex/Ambiente Pad RedLib SML.nsmp` (git-ignored; 7 strokes, gids 155–161
low-byte / 673–679 full, roots C1–C7), not assumed.

### Container

```
len 3559349 (0x364fb5)
NWS v8 size=0      hdr@24    payload@33
hdr v8 size=18     hdr@33    payload@42     end@60
map v9 size=870    hdr@60    payload@69     end@939
stk v8 ×7                                   end@3559329
sty v5 size=9      hdr@3559329 payload@3559338 end@3559347
sections end at 3559347 | file len 3559349 | trailing 2 bytes
```

**The CRC is the trailing 2 bytes, little-endian, over `bytes[0 .. len-2]`.**
`crc16Ccitt(bytes, len-2) = 0x715c`; stored LE = `0x715c` (**match**), BE = `0x5c71` (no).
`assembleOgNsmp`'s model matches real files exactly. Because in-place patching never
changes length, the OG re-CRC is a two-byte write at `len-2`.

### `hdr` carries no name

The real 18-byte `hdr` payload is `00 00 e4 00 00 c0 00 …` — no printable run, so
`readNsmp().name` is `undefined` and the inspector already falls back to the filename.
**Renaming a legacy file is filename-only**; there is nothing in the container to patch.
(`writeOgNsmp`'s `name` param is likewise never used — it templates the same 18 bytes.)

### The v9 map record — the "un-identified u16 X" is the gid's high bytes

The record is a flush 12 bytes with no unexplained field:

| off | size | field |
|---|---|---|
| +0 | u24 BE | `globalID` |
| +3 | u24 BE | `level` (`DSP2Level` gain; unity `10 00 00`) |
| +6 | u32 BE | `keyHigh` — split point |
| +10 | u16 BE | `strength` — 1 in all known content; the record marker |

Measured (count marker @853, records at `855 + 12i`, table `855..939` — **flush to the map
end at 939**, no overrun):

```
rec[0] @855: 00 02 a1 | 2d 18 18 | 00 00 00 6c | 00 01   gid=673 keyHigh=108
rec[1] @867: 00 02 a0 | 2d 18 18 | 00 00 00 5a | 00 01   gid=672 keyHigh=90
rec[2] @879: 00 02 9f | 1f 3f c5 | 00 00 00 4e | 00 01   gid=671 keyHigh=78
rec[3] @891: 00 02 9e | 0f 47 75 | 00 00 00 42 | 00 01   gid=670 keyHigh=66
rec[4] @903: 00 02 9d | 08 12 cc | 00 00 00 36 | 00 01   gid=669 keyHigh=54
rec[5] @915: 00 02 9c | 09 d8 56 | 00 00 00 2a | 00 01   gid=668 keyHigh=42
rec[6] @927: 00 02 9b | 09 0c 48 | 00 00 00 1e | 00 01   gid=667 keyHigh=30
```

The `stk` headers carry the same ids as u32 BE at `+0`: `00 00 02 a1` = 673, matching
rec[0]'s u24 `00 02 a1`. The OG corpus's `00 00` X is the same field with gids < 256.
This closes the "Open" question in `docs/NSMP-CODEC.md`. The current reader works only
because it truncates **both** sides to the low byte (`bytes[o]` in the map,
`bytes[payloadOffset+3]` in the header) — consistently, hence correctly, by luck.

### `keyHigh` is stored twice, and the copies agree

| gid (u32) | `stk` +0x05 (root) | `stk` +0x33 (keyHigh) | map rec keyHigh |
|---|---|---|---|
| 673 | 96 (C7) | 108 | 108 |
| 672 | 84 | 90 | 90 |
| 671 | 72 | 78 | 78 |
| 670 | 60 | 66 | 66 |
| 669 | 48 | 54 | 54 |
| 668 | 36 | 42 | 42 |
| 667 | 24 (C1) | 30 | 30 |

Both copies agree on all 7 zones, and `writeOgStrokePayload` writes the header copy too.
A one-sided write desyncs them, so **patching a split writes both**.

### The editable surface for legacy

| Field | Storable? | Where |
|---|---|---|
| `keyHigh` (split) | yes | map rec (v9 `+6` u32 / v10 `+7` u8) **and** `stk` `+0x33` |
| `rootKey` | yes | `stk` header `+0x05`, by gid |
| per-zone `level` | yes — real trims present (`2d 18 18` = +9.00 dB) | map rec `+3` u24 |
| `keyLow` | **derived** — it *is* the neighbour's `keyHigh` + 1 | — |
| `velTop`/`velLow` | **no slot** — single layer → 127/0 | — |
| name | **no slot** | filename only |

### The UI premise in the original brief was stale

`SampleEditPanel` is typed `codec: 3 | 4`, and `SampleInspector.tsx:177` already gates
legacy away from it — legacy renders a read-only `SampleKeyboard` plus "convert to
.nsmp3 / .nsmp4 to edit the splits". The panel never offered legacy an edit it couldn't
save; the throw is defense-in-depth, not a user-facing surface. There are no fields to
disable — the work is to *build* the legacy surface.

## Scope decisions

| Decision | Choice | Note |
|---|---|---|
| Editable fields | splits + roots | Exactly what v9 stores. Per-zone level stays unmodelled — in-place patching preserves the real trims for free. |
| Structure | separate `patchLegacyNsmp` | A `ZoneRecordLayout` is byte offsets *within one record*; legacy's `rootKey` lives in a **different section**. No offset table can express that. |
| Codec-2 (map v10) | **in scope** | Ships behind read-back verification (below). |
| gid:u24 | docs + reader + writer | Closes the open RE question; removes a latent `writeOgMap` desync. |
| Read-back check | legacy path only | Codec-3/4 is already proven by fixtures + the `Other.nsmp4` byte-exact test; no reader pass added there. |

### Risk accepted: codec-2 ships unvalidated

There is **no codec-2 fixture in the repo** and no codec-2 writer. A synthetic v10
round-trip test would encode this spec's assumption into both the writer and the
assertion — it would pass by construction regardless of whether the assumption is right,
and prove nothing about real codec-2 files. That is exactly the failure mode that produced
the original corruption.

The mitigation is **read-back verification**, not a test. Codec-2 support is acceptable to
ship only with that guard in place; if the v10 assumption is wrong, the user gets an error,
never a corrupt file. This is recorded so the trade-off stays visible.

## Design

### `patchLegacyNsmp` (`sample-edit.ts`)

`patchEditedNsmp` detects `readNsmp(original).legacy` and delegates. The legacy `NWS`
family covers codec-1 (map v9), codec-2 / Library 2.0 (map v10) and the `0xffff`
"Undefined" stamp — so the new path **gates on the map section's version**, not on the
`legacy` flag. Map v9 → the 12-byte record; v10 → the 15-byte record (`keyHigh@+7`, u8);
anything else throws, naming the generation.

Writes, into a copy of the original:

1. **`keyHigh`** → the map record at its per-version offset/width, **and** the `stk`
   header `+0x33` for that zone's gid.
   - v9: `u32 BE @+6` — the field's verified width.
   - v10: **the single byte at `+7` only**, exactly where `parseCodec2ZoneRecords` reads
     it. Its `ok` predicate never constrains `+4..+6`, so whether they are a u32's zero
     high bytes (as in v9) or unrelated data is unverified. Writing the narrow byte cannot
     destroy a field we haven't identified; the read-back check confirms it took.
2. **`rootKey`** → the `stk` header `+0x05`, located by gid.
3. `keyLow` / `velTop` / `velLow` / `name` → ignored (no slot). Not silently: the UI does
   not offer them, so the model never carries a value the writer drops.
4. **Re-CRC** → `crc16Ccitt(out[0 .. len-2])`, stored LE at `len-2`.

Never changes file length. Never calls `patchNs4Checksum`.

### Read-back verification

Before returning, `patchLegacyNsmp` re-reads its own output with the corpus-validated
reader and asserts:

- `readNsmp(out).recognized` is true and `.legacy` is still true;
- the section tree still parses to the same tags/sizes;
- `readNsmpZones(out)` returns, for every edited zone, exactly the `rootKey` and `keyHigh`
  that were asked for;
- the `stk` `+0x33` mirror matches the map's `keyHigh` (the reader takes `keyHigh` from the
  map, so a stale mirror needs its own assertion);
- the trailing CRC verifies.

Any mismatch throws. This is what makes an unvalidated v10 safe: a wrong assumption becomes
an error, not a download. It would have caught **both** original bugs — the `ZONE_LAYOUT`
misapplication (zones read back wrong) and the CRC-over-magic (`recognized` false).

### `zoneRecordLayout` narrowing (`nsmp.ts`)

Narrow it to the codec-3/4 record it actually describes so it cannot be misapplied to a
generation it doesn't model. It keeps returning `ZONE_LAYOUT`; the change is that its name
and JSDoc stop implying it covers every codec, and the legacy caller is gone.

### gid:u24 (`nsmp.ts`, `nsmp-og.ts`, docs)

- `parseLegacyZoneRecords` re-anchors on the flush 12-byte record: records at
  `countMarker + 2 + 12i`, `gid = u24be(+0)`, `level` at `+3`, `keyHigh = u32be(+6)`,
  `strength = u16be(+10)`. Same bytes, honest framing.
- **Cross-cutting:** this moves legacy `recordOffset` from the core to the **record start**,
  so `keyHigh` is `+6` rather than `+4`. `patchLegacyNsmp` is the only consumer; both sides
  move together.
- The legacy `stk` gid is read as **u32 BE @+0** (a legacy-specific helper). Codec-3/4's
  existing u8 read at `+3` is **untouched** — its map record stores the gid as a u8 and
  cannot express > 255 anyway, and the corpus sweep guards that reader.
- **v9 only.** The u24 reframing is verified on the v9 record and applies there alone.
  `parseCodec2ZoneRecords` (v10) keeps its current framing: with no v10 fixture, whether
  its gid is a u8 or a u24 is unverifiable, and reframing it would be precisely the
  unvalidated assumption this spec refuses elsewhere.
- `writeOgMap` writes the gid as **u24 BE**, matching `writeOgStrokeHeader`'s u32. Today it
  writes only the low byte, so rebuilding a RedLib-style file (gid 673) would write map gid
  `0x0000a1` against stroke gid `0x0002a1` — a latent desync, harmless only because both
  readers truncate.
- `docs/NSMP-CODEC.md`: close the "Open" question on X; correct the "records can overrun the
  map's declared size" note (they do not — the table is flush); document the CRC location,
  the absent name field, and the `keyHigh` duplication.

### UI (`SampleEditPanel.tsx`, `SampleInspector.tsx`)

- `SampleEditPanel` accepts legacy: widen `codec` to include it, and add a `legacy` flag
  that drives which fields render. Root and split stay editable; **`keyLow` renders
  read-only** (it is the neighbour's split + 1 — editing it means moving the neighbour's
  split, which the keybed drag already does); velocity columns and the name input are
  hidden. The download extension follows the source (`.nsmp`).
- The footer text stops promising what legacy can't do ("Edits root / split; audio and all
  other settings — including per-zone levels — are preserved").
- `SampleInspector` routes legacy-with-zones to the editor instead of the read-only
  keyboard + "convert to .nsmp3/.nsmp4" note. Legacy files whose map version isn't 9 or 10,
  or that expose no zones, keep the read-only branch.

## Testing

- **`sample-edit.test.ts`** — the `patchEditedNsmp — legacy (v9) files` describe block
  currently asserts refuse-don't-corrupt. It becomes a round-trip block against
  `writeOgNsmp`-built files (the existing synthetic base, no fixture needed): patch a root
  and a split, read them back, assert length unchanged, the container still recognized, the
  CRC valid, and the audio byte-identical. Keep a refusal test for an out-of-scope map
  version.
- **Real-fixture suite** (`skipIf` absent, as the repo already does for `Other.nsmp4`):
  patch one zone of `Ambiente Pad RedLib SML.nsmp` and assert **only** the intended bytes
  plus the 2 CRC bytes changed — specifically that the per-zone `level` trims
  (`2d 18 18`, `1f 3f c5`, …) survive byte-exact, proving the deferred field is preserved
  rather than reset.
- **Read-back guard** — a test that a deliberately wrong write (e.g. patching via the
  codec-3/4 layout) is caught and throws rather than returning bytes.
- **`nsmp-og.test.ts`** — extend the round-trip suite for the u24 gid: a zone with
  `globalID > 255` round-trips through `writeOgNsmp` → `readNsmpZones` with the map and
  `stk` header agreeing.
- **Corpus sweep** — must stay green; it is the guard on the reader re-anchoring.

Gates: `npx vitest run src/lib/ns4/`, `npm run typecheck`, `npm run lint`.

## Out of scope

- **Per-zone `level` editing.** Real trims exist in the corpus and in-place patching
  preserves them for free. Surfacing them means adding `level` to `NsmpZone` and threading
  it through `writeOgNsmp` — deferred, and unnecessary for splits + roots.
- **Renaming legacy files in-container.** No slot exists; the download filename is the name.
- **Velocity for legacy.** Not per-zone in this generation.
- **`buildEditedNsmp` for legacy.** The rebuild path stays codec-3/4; in-place patching is
  strictly better here precisely because it preserves the levels and audio.
