import { useState, type InputHTMLAttributes } from 'react';
import { noteName } from '@/lib/ns4/sample-view';
import { parseNote } from '@/lib/hwtest/analysis';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number;
  /** A key typed (C3, F#2, Bb3) or stepped with the arrow keys; `step` is true for an arrow step. */
  onCommit: (key: number, step: boolean) => void;
  /** What was typed isn't a key. */
  onBadNote: (message: string) => void;
};

/**
 * A key, shown and typed as a note name (C3, F#2, Bb3). Up and Down step a semitone straight
 * away; a typed name is kept as a draft and taken on Enter or when the field is left.
 */
export function NoteField({ value, onCommit, onBadNote, onBlur, onKeyDown, ...rest }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const text = draft.trim();
    setDraft(null);
    if (!text) return;
    let key: number;
    try { key = parseNote(text); } catch { onBadNote(`“${text}” isn’t a key: type a note like C3, F#2 or Bb3.`); return; }
    if (key !== value) onCommit(key, false);
  };
  return (
    <input {...rest} type="text" inputMode="text" autoComplete="off" spellCheck={false} value={draft ?? noteName(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => { commit(); onBlur?.(e); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') setDraft(null);
        else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && draft === null) {
          e.preventDefault();
          const key = value + (e.key === 'ArrowUp' ? 1 : -1);
          if (key >= 0 && key <= 127) onCommit(key, true);
        }
        onKeyDown?.(e);
      }} />
  );
}
