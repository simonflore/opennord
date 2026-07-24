import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SampleEditPanel } from './SampleEditPanel';
import type { EditModel } from '../../lib/ns4/sample-edit';
import { writeOgNsmp } from '../../lib/ns4/nsmp-og';
import { writeNsmpMulti } from '../../lib/ns4/nsmp-write';
import { gainDetuneView } from '../../lib/ns4/sample-view';

/** Count rendered `<input type="number">` cells — the concrete signal a
 *  cell-only misalignment (e.g. a velocity input surviving for legacy) would
 *  actually move, unlike a header-text-only assertion. */
const numberInputCount = (html: string): number => (html.match(/type="number"/g) ?? []).length;

const tone = (n: number) => Int32Array.from({ length: n }, (_, i) => Math.round(2000 * Math.sin(i / 8)));

const model: EditModel = {
  name: 'My Strings',
  zones: [{ rootKey: 60, keyLow: 0, keyHigh: 72, velTop: 127, velLow: 0 }],
};
const bytes = new Uint8Array(64); // too short for gain/detune — that block is simply skipped

describe('SampleEditPanel factory disclaimer', () => {
  it('shows the "edit it for your own use" disclaimer for a factory sample', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={model} bytes={bytes} codec={4} factory />);
    expect(html).toMatch(/factory sample/i);
    expect(html).toMatch(/your own use/i);
  });

  it('does not show the disclaimer for a user sample', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={model} bytes={bytes} codec={4} />);
    expect(html).not.toMatch(/factory sample/i);
  });
});

describe('SampleEditPanel legacy surface', () => {
  const legacyModel: EditModel = {
    name: 'OG Pad',
    zones: [
      { rootKey: 96, keyLow: 91, keyHigh: 108, velTop: 127, velLow: 0, recordOffset: 100, globalID: 673 } as any,
      { rootKey: 84, keyLow: 79, keyHigh: 90, velTop: 127, velLow: 0, recordOffset: 112, globalID: 672 } as any,
    ],
  };

  it('hides velocity columns and the name field for legacy', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={legacyModel} bytes={new Uint8Array(0)} codec="og" legacy rootSplitOnly />);
    expect(html).not.toMatch(/vel ≥/);
    expect(html).not.toMatch(/vel ≤/);
    expect(html).not.toMatch(/Name:/);
  });

  it('still edits root and split (those inputs render) for legacy', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={legacyModel} bytes={new Uint8Array(0)} codec="og" legacy rootSplitOnly />);
    expect(html).toMatch(/root/);
    expect(html).toMatch(/up to \(split\)/);
    expect(html).toMatch(/Download edited \.nsmp<\/|Download edited \.nsmp"/); // extension has no digit
  });

  // Strengthened per review: header-text assertions alone can't catch a
  // cell-only misalignment (e.g. a velocity <input> surviving in the row
  // markup even though the "vel ≥"/"vel ≤" header text is gone). Count actual
  // <input type="number"> cells instead.
  it('renders exactly 4 number inputs for a legacy 2-zone map: root + split per zone, no velocity/gain/detune', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={legacyModel} bytes={new Uint8Array(0)} codec="og" legacy />);
    expect(numberInputCount(html)).toBe(4); // 2 zones × (root, split)
  });

  it('renders more number inputs for the codec-4 equivalent (root + split + vel≥ + vel≤ per zone)', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={legacyModel} bytes={new Uint8Array(64)} codec={4} />);
    expect(numberInputCount(html)).toBe(10); // 2 zones × (root, keyLow, keyHigh, velLow, velTop)
  });

  // Fix 1 regression: for real legacy files gainDetuneView(bytes) is TRUTHY
  // (a `map` section exists — the file just has no slot to save the edit
  // back to), so gating the Gain/Detune block on `gd` alone showed inputs
  // legacy can't persist. The old test's `new Uint8Array(0)` masked this —
  // gainDetuneView returns undefined for it, so the gate was never exercised.
  const legacyBytesWithGain = writeOgNsmp({
    name: 'OG Gain Src',
    zones: [{ channels: [tone(200), tone(200)], globalID: 673, rootKey: 96, keyHigh: 108 }],
  });

  it('sanity: gainDetuneView is truthy for the legacy bytes used below (otherwise the next test is vacuous)', () => {
    expect(gainDetuneView(legacyBytesWithGain)).toBeTruthy();
  });

  it('never renders the Gain/Detune block for legacy, even when gainDetuneView is non-null', () => {
    expect(gainDetuneView(legacyBytesWithGain)).toBeTruthy(); // re-confirm non-vacuous at the point of use
    const html = renderToStaticMarkup(
      <SampleEditPanel initial={legacyModel} bytes={legacyBytesWithGain} codec="og" legacy />,
    );
    expect(html).not.toMatch(/Gain/);
    expect(html).not.toMatch(/Detune/);
    expect(html).not.toMatch(/¢/);
  });

  it('still renders the Gain/Detune block for codec-4 (non-legacy) when gainDetuneView is non-null', () => {
    const src = writeNsmpMulti({
      name: 'Codec4 Src',
      codec: 4,
      zones: [{ channels: [tone(1500)], keyHigh: 60, rootKey: 48, velTop: 127 }],
    });
    expect(gainDetuneView(src)).toBeTruthy(); // sanity: non-vacuous
    const html = renderToStaticMarkup(
      <SampleEditPanel initial={model} bytes={src} codec={4} />,
    );
    expect(html).toMatch(/Gain/);
    expect(html).toMatch(/Detune/);
  });

  // A codec-3 `map` v12 `.nsmp3` is stroke-reference (rootSplitOnly) like legacy, but
  // it IS an NSMP container with an editable in-file name — so velocity hides, name stays.
  it('hides velocity but keeps the name field for a v12 stroke-ref .nsmp3', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={legacyModel} bytes={new Uint8Array(0)} codec={3} rootSplitOnly />);
    expect(html).not.toMatch(/vel ≥/);
    expect(html).toMatch(/Name:/);
    expect(html).toMatch(/Download edited \.nsmp3/);
  });
});
