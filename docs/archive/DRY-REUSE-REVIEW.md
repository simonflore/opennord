# OpenNord Reuse/DRY Review

> Generated 2026-06-26 by a multi-agent review pass (8 dimension finders → per-finding
> adversarial verification → synthesis). 48 of 52 findings confirmed. This is a snapshot;
> tick items off in §4 as they land.

## 1. Overall Assessment

The codebase is **structurally healthy and architecturally disciplined** — the `model → clavia`
dependency direction is clean (zero reverse imports), `clavia/` exports are well-reused, and
generated data is correctly quarantined. The duplication that exists is **breadth, not depth**:
a small set of trivial-but-pervasive patterns (error-to-string, `File.arrayBuffer()` reads,
byte-read helpers, version/offset constants) replicated across many files because each model
codec, device module, and component was grown in isolation. None of it is risky or tangled;
almost all of it is mechanical, test-covered extraction into a shared utility. The highest-value
wins are a handful of one-function `src/lib/` utilities and a few `clavia/` byte primitives that
collapse 10–26 copies each. The UI layer has a parallel story: real `ui/` primitives exist but
device/ dialogs hand-code button/flex/panel styles inline, so the fix is **adopt existing
primitives**, not invent new abstractions.

## 2. Prioritized Consolidations by Theme

### Cross-cutting utilities (highest leverage — touch the most files)

| What's duplicated | Fix | Effort | Risk |
|---|---|---|---|
| **Error-to-string** `e instanceof Error ? e.message : String(e)` — **26 occurrences across 21 files** (10 named `msg`, 16 inline): `useDeleteFlow.ts:6`, `usePushFlow.ts:11`, `useReorgFlow.ts:9`, `useSamplesFlow.ts:9`, `BackupOrganizer.tsx:16`, `ConnectPanel.tsx:21`, `DeviceManager.tsx:30`, `BackupPanel.tsx:27,52`, `PresetInspector.tsx:14`, `ContributePage.tsx:20`, `ProbePanel.tsx:29`, `SampleEditPanel.tsx:58`, `SampleConvert.tsx:51`, `SamplesSplit.tsx:11`, `FixtureLoader.tsx:21`, `device/execute.ts:9`, `device/backup.ts:100,130`, `clavia/fixture-report.ts:46`, `folder/scan.ts:74`, `folder/pipeline.ts:52,71`, `useFolderLibrary.ts:16,135,153` | Extract `export function getErrorMessage(e: unknown): string` to `src/lib/errors.ts`; import everywhere | S | None |
| **`new Uint8Array(await file.arrayBuffer())`** — ~12 sites: `DecodeInspector.tsx:40,77`, `ProgramDecode.tsx:36`, `ContributePage.tsx:308`, `SampleInspector.tsx:109`, `SamplesSplit.tsx:64`, `BackupPanel.tsx:34`, `usePushFlow.ts:36`, `BackupOrganizer.tsx:45` | `export async function readFileBytes(file: File): Promise<Uint8Array>` in `src/lib/file.ts` | S | None |
| **`formatBytes()`** — 4 impls; `src/lib/format.ts:2` is canonical but `SampleHeader.tsx:4` (missing GB tier — latent bug), `SamplesBrowse.tsx:10`, `BundlePicker.tsx:19` reimplement | Import `format.ts::formatBytes` everywhere; delete the 3 copies | S | Low — KB precision shifts to 1 decimal; verify UX |
| **`concat(chunks: Uint8Array[])`** — `unzip-stream.ts:13`, `nsmp-write.ts:44` | `export function concatBytes()` in `src/lib/clavia/bytes.ts` (keep unzip's single-chunk early return) | S | None |
| **`safeFilename`/`safeStem`** — `StrokeList.tsx:16`, `ns4/bundle.ts:86` | `sanitizeFilename(name, fallback='Unnamed')` in `src/lib/filename.ts` | S | None |
| **Blob-download inlined** — `download.ts:2` has `downloadBytes`, but `ContributePage.tsx:49-63` hand-rolls Blob/URL/click for JSON | Add `downloadJSON(data, filename)` to `download.ts`; call it | S | None |

### Async component logic

| What's duplicated | Fix | Effort | Risk |
|---|---|---|---|
| **busy/error async state machine** — 7 hooks share `setError(''); setBusy(true); try…catch(setError(msg))…finally(setBusy(false))`: `useDeleteFlow`, `usePushFlow`, `useReorgFlow`, `useSamplesFlow`, `PresetInspector.download`, `ProbePanel.run`, `ContributePage` baseline/recapture | `useAsyncAction()` hook → `{ busy, error, run }` in `src/hooks/` | M | Medium — **exclude** `BackupPanel` (uses status string) and `SampleConvert` (discriminated union); don't force-fit |

### Model codecs (`ne*/np*/ng2/nw2/nl*`)

| What's duplicated | Fix | Effort | Risk |
|---|---|---|---|
| **Nibble-packed drawbar decoder** (9×4-bit from 5 bytes, MSB-first) — byte-identical in `ne4:69`, `ne5:51`, `ne6:81`, `nw2:52`; comments literally say "identical to NE6" | `export function readDrawbars(body, offset): { bars, _trailing }` in `clavia/drawbars.ts`; models keep their own `Drawbars` wrapper type for traceability | S | Low — pure transform, fixture-gated |
| **CBIN version extraction** `((b[0x14]\|b[0x15]<<8)/100).toFixed(2)` — 10 models: `ne4:140, ne5:91, ne6:162, ng2:173, nl4:46, nla:52, np4:86, np5:205, nw1:72, nw2:107` | `export function extractVersion(bytes): string` in `clavia/cbin.ts` | S | None — display-only, never validated |
| **`readBits(body, startBit, len)`** MSB-first — identical in `ng2:80`, `np5:76` | `export function readBits()` in `clavia/bitstream.ts` | S | Low |
| **`BODY_OFFSET = 0x2c`** — 10 models | `export const BODY_OFFSET` from `clavia/cbin.ts`; keep per-model comment explaining the body length | S | None |
| **`pianoTypeLabel()`** enum switch — `ng2:92`, `np5:88` | `export function pianoTypeLabel()` in `clavia/stage-enums.ts`, JSDoc the oracle | S | Low — document per-model variance if it ever diverges |
| **Fixture-loading test harness** — same `FIXTURE_DIR`/`load`/`fixtures` block in ~10 `decode.test.ts` | `loadFixtures(modelDir, ext, opts?)` in `clavia/test-fixtures.ts` (opts to cover `nl4`'s dual-ext) | M | Low — test-only |
| **`u8 = (b,o) => b[o] ?? 0`** — 11 models | *Defer.* 3-line inline helper; extracting adds an import to every codec for negligible gain | S | — |

### Device layer

| What's duplicated | Fix | Effort | Risk |
|---|---|---|---|
| **Address-key stringification** `${bank}:${slot}` / `${partition}:${bank}:${slot}` — `reorg.ts:10` (exported `addrKey`), `backup-io.ts:12` (`key`), `backup.ts:141` (`slotKey`), `fake-device.ts:6` (`k`) | `src/lib/device/addr-key.ts` exporting `addrKey(addr)` + `addressKey(partition?, addr)`; replace all 4 | S | Low — Map keys only |
| **Big-endian `u32(payload, offset)`** — `transfer.ts:27`, `capacity.ts:65`, `dependencies.ts:20` (latter adds bounds check) | `readU32BE()` (+ `readU32BEChecked()`) in `src/lib/device/payload-io.ts` | S | Low — preserve the bounds-check variant |
| **Duplicate-name disambiguation** (`append (slot N)`) — `backup.ts:49`, `backup-io.ts:96` | `disambiguatePath(spec, bank, name, slot, usedPaths: Set)` in `ns4b.ts` | S | Low — pure string |

### ns4 sample codecs

| What's duplicated | Fix | Effort | Risk |
|---|---|---|---|
| **Residual bit-packing** (MSB-first into words) — **3 independent copies**: `nsmp-encode.ts:54` (`packResiduals`, only used once) + inline at `150`, `nw1-encode.ts:267` | `packResiduals(values, bitWidth, wordBytes=4)` in `src/lib/ns4/bitstream.ts`; use in all encode paths | M | Low — pure, round-trip tested |
| **CRC-16/CCITT** — `nsmp-og.ts:189` (file-local) vs canonical `device/crc16.ts` | Import `crc16ccitt` from `device/crc16.ts` in `nsmp-og.ts`; cross-ref comment | S | Very low — identical math, ns4→device is a clean import |
| **Block-header read/write** — `readBlockHeader` (`nsmp-codec.ts:50`) and inverse `blockHeaderWord` (`nw1-encode.ts:234`) share bit layout silently | Export `BlockHeader` + offset/mask consts from `nsmp-codec.ts`, import in `nw1-encode.ts`; comment the inverse seam | S | None — organizational |
| **Stop-block marker** — `pushWord(0)` (`nsmp-encode.ts:171`) vs `blockHeaderWord({order:0…})` (`nw1-encode.ts:329`) | `export const STOP_BLOCK_HEADER` / `stopBlockHeader()` in `nsmp-codec.ts` | S | None |
| **Predictor channel state** (ring/head/output) — `nsmp-codec.ts:93`, `nsmp-encode.ts:95`, `nw1-encode.ts:94` | *Optional* `ChannelState` in `ns4/predictor.ts`; low urgency, cosmetic | S | Very low |

### Folder / Library / IDB

| What's duplicated | Fix | Effort | Risk |
|---|---|---|---|
| **IDB CRUD** (save/list/delete) — identical in `folder/idbStore.ts:11`, `library/importStore.ts:18`, `library/sampleImportStore.ts:10` | `createIdbStore<T>(storeName, idField?)` in `src/lib/idb.ts` | S | Low — tests cover each store |
| **Import+persistence hook** — `useImportedLibrary.ts:21`, `useImportedSamples.ts:14` differ only in builder + store fns | `usePersistedImports<T>(listFn, saveFn, deleteFn, builderFn)` | S | Very low |
| **filter/sort-by-source** — `entries.ts:50`, `preset-entries.ts:42` (sample-entries is special) | Generic `createFilterSort<T>` in `browse.ts`; **keep `sample-entries` bespoke** (unused-only facet) | M | Medium — filter semantics subtle; rerun entry tests |

### UI styling — adopt existing primitives, don't invent

| What's duplicated | Fix | Effort | Risk |
|---|---|---|---|
| **Hand-coded button styles** (red/line, padding/radius) across `ConfirmPanel:26,36`, `BackupPanel:68,72,85,88`, `BackupOrganizer:118,120`, `DeviceBrowser:42,47` — while `ui/Button.tsx` exists, used once | Add `size`/`variant` (incl. transparent secondary, disabled cursor) to `Button`; refactor the 4 dialogs to use it | M | Medium — CSS class expansion, backwards-compatible |
| **Pill** — `ProgramHeader:9`, `SampleHeader:21` use `span.ps-pill` raw; warning pill falls back to inline style | `ui/Pill.tsx` (variant `default`/`warning`) + `.ps-pill--warning` token class | S | Low |
| **Selectable accent row** (flex + `borderLeft 3px var(--red)`) — `DeviceBrowser:79`, `DeviceSampleBrowser:38` | `ui/SelectableRow.tsx` | S | Low |
| **Hidden file input** `<input type=file style=display:none>` — `BackupPanel:90`, `BackupOrganizer:129`, `DeviceBrowser:50` | `ui/FileInput.tsx` (accept, onFile, label) | S | Low |
| **Flex rows / panel maxWidth / marginTop pixels** — scattered inline across device/, sample/, contribute/ (gaps 8/10/16/18; margins 6/10/14 off the `--s-*` scale) | Add `.flex-row`/`.flex-col` + `.mt-*`/`.mb-*` token utility classes to `nord.css`; migrate inline styles | M | Low — CSS-only, incremental; consider a lint rule for hardcoded margins |
| **`.ps-kbd-num` width:64 inline** — `SampleEditPanel:113,117` | `.ps-kbd-num-compact` modifier in `nord.css` | S | None |
| **Section/bank headers** inline `h4` (red-bright, letterSpacing) — `DeviceBrowser:58,67`, `BackupOrganizer:135`, `TargetSlotPicker:34` | Reuse/extend `ui/SectionLabel.tsx` (add accent variant) | S | Low |

## 3. Explicitly NOT Worth Changing

- **`*.generated.ts`** (`offset-map`, `values`, `morphs`, `names`, `deps`, `interpret`) — generated data; never hand-edit or "dedup". Out of scope by rule.
- **`u8 = b[o] ?? 0`** per-codec helper — 3-line inline; extracting trades clarity for an import in 11 files. Defer unless doing a broader bytes-utils pass.
- **Generic decode-entrypoint scaffold** (`withCbinHeader` wrapper) — the per-model scaffold has 4–6 model-specific lines (version, branching: `nl4` on fileType, `ns2` on versionOffset); a generic wrapper needs `any`-typed returns or 50+ lines of plumbing duplicating per-model types. Fragile under TS generic-return inference. **Revisit only if NL4/NS2 anomalies are factored out and a 3rd+ uniform model lands.**
- **Folder bundle-load vs device backup-load** (`folder/scan.ts:106`, `ns4/bundle.ts`, `device/backup.ts:69`) — superficially both "unzip `.ns4b`", but backup adds CBIN/capacity checks, partition mapping, rollback, and **must not store sample audio** (`docs/LEGAL.md`). Architecturally distinct; keep standalone.
- **Zone-record writers** (`nsmp-write.ts:96` codec-3/4 16B vs `nsmp-og.ts:237` OG 12B) — different binary formats; merging would create false equivalence between incompatible layouts. The verbose per-format offset comments exist precisely to prevent an accidental merge. Reader (`ZONE_LAYOUT`) is correctly codec-3/4-only.
- **`ns2`/`ns3` version/offset handling** — own legacy patterns (`versionOffset`); not part of the 10-model CBIN-header family. Leave alone.
- **clavia stays model-agnostic** — confirmed zero reverse deps; no action.

## 4. Recommended Sequence (highest leverage first)

1. **`src/lib/errors.ts` → `getErrorMessage()`** — 26 call sites, zero risk, unblocks the `useAsyncAction` refactor. Pure mechanical sweep.
2. **`src/lib/file.ts` → `readFileBytes()`** + consolidate **`formatBytes`** into `format.ts` (fixes the `SampleHeader` missing-GB latent bug) — ~16 sites, trivial, user-visible bug fix included.
3. **clavia byte primitives**: `extractVersion` + `BODY_OFFSET` (`cbin.ts`), `readDrawbars` (`drawbars.ts`), `readBits` (`bitstream.ts`) — collapses the model-codec family; all fixture-gated, run `npm test` after each.
4. **Device byte/key utils**: `addr-key.ts` (`addrKey`/`addressKey`) + `payload-io.ts` (`readU32BE`) + `disambiguatePath` — tidies the device layer in one pass.
5. **`useAsyncAction()` hook** — refactor the 7 conforming flow hooks (explicitly skip `BackupPanel`/`SampleConvert`); biggest readability win in the component layer.
6. **UI primitive adoption**: enhance `ui/Button` and add `ui/Pill`/`ui/FileInput`/`ui/SelectableRow`, then add `.mt-*`/`.flex-*` token utility classes to `nord.css` and migrate device/ dialogs — closes the "primitives exist but aren't used" gap and enforces token discipline.

Steps 1–4 are near-zero-risk mechanical extractions and should land first; 5–6 carry mild
structural/CSS risk and benefit from the cleaner utilities landing underneath them. Run
`npm run typecheck && npm run lint && npm test` after each step (all three are CI gates).
