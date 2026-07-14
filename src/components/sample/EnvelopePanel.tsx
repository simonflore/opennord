import type { AmpEnvelope } from './sampleEngine';

/**
 * Synth-playground envelope controls for the Samples keyboard. A toggle plus four
 * A/D/S/R sliders that shape a per-voice amp envelope for *auditioning* a sample.
 * This is NOT part of the `.nsmp` and is never written back — it's a synth layer on
 * top, off by default. Off → the sampler plays flat (today's behavior).
 */
export interface EnvSlider { key: keyof AmpEnvelope; label: string; min: number; max: number; step: number; unit: 's' | '%' }

const SLIDERS: EnvSlider[] = [
  { key: 'attack', label: 'Attack', min: 0, max: 2, step: 0.005, unit: 's' },
  { key: 'decay', label: 'Decay', min: 0, max: 2, step: 0.005, unit: 's' },
  { key: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01, unit: '%' },
  { key: 'release', label: 'Release', min: 0, max: 3, step: 0.01, unit: 's' },
];

const fmt = (v: number, unit: 's' | '%') => (unit === '%' ? `${Math.round(v * 100)}%` : `${v.toFixed(2)}s`);

export function EnvelopePanel({ enabled, env, onToggle, onChange }: {
  enabled: boolean;
  env: AmpEnvelope;
  onToggle: (on: boolean) => void;
  onChange: (env: AmpEnvelope) => void;
}) {
  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h4 style={{ margin: 0 }}>SYNTH PLAYGROUND</h4>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <span className="ps-sub">{enabled ? 'On' : 'Off'}</span>
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            aria-label="Enable synth playground envelope"
            onChange={(e) => onToggle(e.target.checked)}
            style={{ accentColor: 'var(--red)', width: 18, height: 18, cursor: 'pointer' }}
          />
        </label>
      </div>
      <p className="ps-sub" style={{ margin: '4px 0 0' }}>
        Amp envelope for auditioning — not part of the sample, never saved.
      </p>

      {enabled && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {SLIDERS.map((s) => (
            <label key={s.key} style={{ display: 'grid', gridTemplateColumns: '5.5rem 1fr 3rem', alignItems: 'center', gap: 10 }}>
              <span className="ps-sub" style={{ margin: 0 }}>{s.label}</span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={env[s.key]}
                aria-label={`${s.label} ${fmt(env[s.key], s.unit)}`}
                onChange={(e) => onChange({ ...env, [s.key]: Number(e.target.value) })}
                style={{ accentColor: 'var(--red)', width: '100%' }}
              />
              <span className="ps-sub" style={{ margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>
                {fmt(env[s.key], s.unit)}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
