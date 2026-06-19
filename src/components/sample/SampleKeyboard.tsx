import { useState } from 'react';
import type { EditZone } from '../../lib/ns4/sample-edit';
import { KeyboardZoneMap } from './KeyboardZoneMap';

/**
 * Read-only keyboard zone map — the same visual the editor uses, without the
 * drag-to-edit handles. Used for legacy `.nsmp`, whose zones we decode but don't
 * patch in place. Clicking a band auditions its sample when `onPlayZone` is set.
 */
export function SampleKeyboard({ zones, onPlayZone }: { zones: EditZone[]; onPlayZone?: (index: number) => void }) {
  const [selected, setSelected] = useState(-1);
  if (zones.length === 0) return null;
  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>KEYBOARD MAP</h4>
      <KeyboardZoneMap zones={zones} selected={selected} onSelect={setSelected} onPlayZone={onPlayZone} />
    </div>
  );
}
