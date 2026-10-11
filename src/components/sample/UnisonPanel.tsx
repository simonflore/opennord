/**
 * Unison switch for the Samples keyboard. On the instrument Unison is a program
 * setting (off, 1, 2, 3), not part of the sample: the sample only says what each
 * setting does to it. This picks the setting to audition and is never written back.
 */
const LEVELS = ['Off', '1', '2', '3'];

export function UnisonPanel({ level, onChange }: {
  level: number;
  onChange: (level: number) => void;
}) {
  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h4 style={{ margin: 0 }}>UNISON</h4>
        <div role="group" aria-label="Unison" style={{ display: 'inline-flex', gap: 6 }}>
          {LEVELS.map((label, i) => (
            <button
              key={label}
              type="button"
              className={i === level ? 'ps-key on' : 'ps-key'}
              aria-pressed={i === level}
              aria-label={i === 0 ? 'Unison off' : `Unison ${label}`}
              onClick={() => onChange(i)}
              style={{ cursor: 'pointer', minWidth: 36 }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="ps-sub" style={{ margin: '4px 0 0' }}>
        The program's Unison setting, for auditioning — not part of the sample, never saved.
      </p>
    </div>
  );
}
