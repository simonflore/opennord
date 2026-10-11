import type { PresetEntry } from '@/lib/library/preset-entries';
import { parseNs4Preset } from '@/lib/ns4/preset';
import { drawbarLevels } from '@/lib/ns4/view';

interface Glance { text: string; drawbars?: number[] }

/** What to say about a preset on its row; null when we don't decode it. */
function describe(bytes: Uint8Array): Glance | null {
  const preset = parseNs4Preset(bytes);
  const first = preset?.layers[0];
  if (!preset || !first?.headline) return null;
  const more = preset.layers.length > 1 ? ` · ${preset.layers.length} layers` : '';
  // An organ's registration reads faster drawn than as nine digits.
  // (Only plain 0–8 positions: a VOX combo like "4+5" has no single height.)
  const m = first.model;
  if (preset.engine === 'organ' && m?.organModel && m.drawbars?.every((d) => /^[0-8]$/.test(d?.value ?? ''))) {
    return { text: m.organModel + more, drawbars: drawbarLevels(m) };
  }
  return { text: first.headline + more };
}

// A list row redraws often and a library holds hundreds of presets: describe
// each file once, keyed by its bytes (dropped with them).
const cache = new WeakMap<Uint8Array, Glance | null>();
function glanceOf(bytes: Uint8Array): Glance | null {
  if (!cache.has(bytes)) cache.set(bytes, describe(bytes));
  return cache.get(bytes) ?? null;
}

/**
 * What a preset is, on its list row: the piano model, the synth's sound source
 * and filter, or the organ's registration drawn as nine small drawbars. Nothing
 * for a preset we hold no bytes for (still on the Nord) or don't decode.
 */
export function PresetGlance({ entry }: { entry: PresetEntry }) {
  const g = entry.bytes ? glanceOf(entry.bytes) : null;
  if (!g) return null;
  return (
    <span className="flex min-w-0 items-center gap-2 text-[11px] text-dim">
      {g.drawbars && (
        <svg viewBox="0 0 36 12" className="h-3 w-9 flex-none" role="img" aria-label={`Drawbars ${g.drawbars.join('')}`}>
          {g.drawbars.map((lvl, i) => (
            <rect key={i} x={i * 4} y={0} width={3} height={1 + lvl * 1.375} fill="currentColor" />
          ))}
        </svg>
      )}
      <span className="min-w-0 truncate">{g.text}</span>
    </span>
  );
}
