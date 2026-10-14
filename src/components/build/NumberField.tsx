import { useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null;
  /** Called on blur or Enter with the typed number, when it differs from `value`. */
  onCommit: (value: number) => void;
  /** Called when the field is left empty (e.g. a loop decay that holds); without it, an empty field goes back to the value. */
  onClear?: () => void;
};

/**
 * A number input that keeps what is being typed as a draft and commits it on blur or Enter,
 * so a half-typed value ("6" on the way to "62") is never applied or refused. Escape, and a
 * field left empty without `onClear`, go back to the current value; after a commit the field
 * shows the value it is given, so a refused change shows the old value again.
 */
export function NumberField({ value, onCommit, onClear, onBlur, onKeyDown, ...rest }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const text = draft.trim();
    setDraft(null); // after a commit, or a refusal, the field shows the project's value
    if (text === '') { if (onClear && value !== null) onClear(); return; }
    const n = Number(text);
    if (Number.isFinite(n) && n !== value) onCommit(n);
  };
  return (
    <input {...rest} type="number" value={draft ?? (value ?? '')}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => { commit(); onBlur?.(e); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') setDraft(null);
        onKeyDown?.(e);
      }} />
  );
}
