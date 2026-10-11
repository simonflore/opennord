import type { PresetEntry } from '@/lib/library/preset-entries';
import { parseNs4Preset } from '@/lib/ns4/preset';

interface Glance { text: string; drawbars?: number[] }

// A list row redraws often and a library holds hundreds of presets: decode each
// file once, keyed by its bytes (dropped with them).
const cache = new WeakMap<Uint8Array, Glance | null>();

function glanceOf(bytes: Uint8Array): Glance | null {
  if (cache.has(bytes)) return cache.get(bytes)!;
  const preset = parseNs4Preset(bytes);
  const first = preset?.layers[0];
  let glance: Glance | null = null;
  if (preset && first?.headline) {
    const more = preset.layers.length > 1 ? ` · ${preset.layers.length} layers` : '';
    if (preset.engine === 'organ') {
      const drawbars = (first.model?.drawbars ?? []).map((d) => Number(d?.value));
      const plain = drawbars.length === 9 && drawbars.every((n) => Number.isInteger(n) && n >= 0 && n <= 8);
      glance = { text: (first.model?.organModel ?? 'Organ') + more, drawbars: plain ? drawbars : undefined };
      if (!plain) glance.text = first.headline + more;
    } else if (preset.engine === 'synth' && first.model) {
      // Name the sound source the way a player would: the sample, the analog
      // wave, or the oscillator type when its wave has no name (FM, wavetable).
      const m = first.model;
      const named = (v?: string) => v?.match(/\(([^)]+)\)/)?.[1];
      const source = m.source === 'samples' ? m.sample?.name : named(m.oscWave) ?? named(m.oscType);
      glance = { text: [source, m.filter?.type].filter(Boolean).join(' · ') + more };
    } else {
      glance = { text: first.headline + more };
    }
  }
  cache.set(bytes, glance);
  return glance;
}

/**
 * What a preset is, on its list row: the piano model, the synth's oscillator and
 * filter, or the organ's registration drawn as nine small drawbars. Nothing for
 * a preset we hold no bytes for (still on the Nord) or don't decode.
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
