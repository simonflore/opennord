/**
 * Unison switch for the Samples keyboard. On the instrument Unison is a program
 * setting (off, 1, 2, 3), not part of the sample: the sample only says what each
 * setting does to it. This picks the setting to audition and is never written back.
 * A row of the Play card (PlayPanel), which says so once for all its controls.
 */
const LEVELS = ['Off', '1', '2', '3'];

export function UnisonPanel({ level, onChange }: {
  level: number;
  onChange: (level: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="ps-sub m-0">Unison</span>
      <div role="group" aria-label="Unison" className="inline-flex gap-1.5">
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
  );
}
