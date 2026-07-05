// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// --- mocks (must be before the import of the mocked module) ---
vi.mock('../../lib/folder/FolderContext', () => ({ useFolder: vi.fn() }));

import { ConvertToStage4 } from './ConvertToStage4';
import { useFolder } from '../../lib/folder/FolderContext';

/** Minimal FolderLibrary mock — no folder linked, matching SampleConvert.test.tsx's shape. */
function mockFolder(over: Record<string, unknown> = {}) {
  return {
    folderName: null,
    writeBack: vi.fn(),
    bundles: [], newBundles: [], pickerOpen: false,
    needsReconnect: false, reconnectError: null, busy: false, canPersist: false,
    result: { programs: [], presets: [], pianos: [], samples: [], errors: [], backupPianos: [], backupSamples: [] },
    choose: async () => {}, reconnect: async () => {}, refresh: async () => {},
    forget: async () => {}, openBundlePicker: () => {}, closeBundlePicker: () => {},
    applyBundleSelection: async () => {}, openBundle: async () => { throw new Error('no'); },
    ...over,
  };
}

afterEach(cleanup);
beforeEach(() => {
  (useFolder as ReturnType<typeof vi.fn>).mockReturnValue(mockFolder());
});

/**
 * Synthetic ns3 donor buffer, same pattern as src/lib/migrate/convert.test.ts:
 * a bare CBIN envelope + the fixed body offsets the ns3 decoder reads.
 */
function cbin(tag: string, size = 700): Uint8Array {
  const b = new Uint8Array(size);
  b[0] = 0x43; b[1] = 0x42; b[2] = 0x49; b[3] = 0x4e; // 'CBIN'
  b[0x04] = 1; // formatType 1 → direct offsets
  for (let i = 0; i < 4; i++) b[0x08 + i] = tag.charCodeAt(i);
  b[0x10] = 9; // category = Piano
  return b;
}

/**
 * A Stage 3 program exercising all four report groups deterministically:
 *  - piano on + Grand + an out-of-range octave shift → "mapped" + "approximated"
 *  - synth on, default (zeroed) oscillator → an analog "Sine" waveform with no
 *    Stage 4 equivalent (emitSynth's waveform branch) → "defaulted"
 *  - Morphs are always dropped by the emitter (common.ts MORPH_NOTE) → "not-migratable"
 */
function ns3Bytes(): Uint8Array {
  const b = cbin('ns3f');
  b[0x31] = 0; // panel A only
  b[0x43] = 0x80; // piano enable (b7)
  b[0x47] = 0x00; // piano octave shift raw 0 → -6 (out of Stage 4's ±2 range → approximated)
  b[0x48] = 0x00; // piano type 0 → Grand
  b[0x52] = 0x80; // synth enable (b7)
  return b;
}

// jsdom's global URL resolves relative to the page origin, not the filesystem —
// resolve the fixture path via node:path off this module's own file path instead
// of `new URL(rel, import.meta.url)` (which jsdom hijacks).
const HERE = fileURLToPath(import.meta.url);
const templateBytes = new Uint8Array(
  readFileSync(join(dirname(HERE), '../../lib/ns4/__fixtures__/regressionTest.ns4p')),
);

describe('ConvertToStage4', () => {
  it('renders a button for an ns3 program', () => {
    render(<ConvertToStage4 bytes={ns3Bytes()} name="Boston" templateBytes={templateBytes} />);
    expect(screen.getByRole('button', { name: /convert to stage 4/i })).toBeInTheDocument();
  });

  it('opens the report dialog with all four groups and a dropped-feature note on click', async () => {
    render(<ConvertToStage4 bytes={ns3Bytes()} name="Boston" templateBytes={templateBytes} />);
    const btn = screen.getByRole('button', { name: /convert to stage 4/i });
    await act(async () => { fireEvent.click(btn); });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/converted for stage 4/i)).toBeInTheDocument();

    expect(screen.getByText('Carried over')).toBeInTheDocument();
    expect(screen.getByText('Close match')).toBeInTheDocument();
    expect(screen.getByText('Pick on your Stage 4')).toBeInTheDocument();
    expect(screen.getByText("Doesn't carry over")).toBeInTheDocument();

    // Morphs are always dropped by the emitter (common.ts MORPH_NOTE) — a known,
    // deterministic not-migratable feature regardless of the source program shape.
    expect(screen.getByText(/morphs/i)).toBeInTheDocument();
  });
});
