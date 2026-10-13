import { useState } from 'react';
import { nsmpToNpno, pianoNameFrom, type LoopFade } from '../../lib/ns4/nsmp-to-npno';
import { NPNO_PIANO_TYPE } from '../../lib/ns4/nsp-write';
import { useFolder } from '../../lib/folder/FolderContext';
import { selectClass } from '../ui';
import { useSaveBytes } from './useSaveBytes';

/** The piano types a piano file can name (the type byte of the factory pianos). */
const PIANO_TYPE_LABELS: Record<keyof typeof NPNO_PIANO_TYPE, string> = {
  electricGrand: 'Electric grand',
  electric: 'Electric piano',
  wurlitzer: 'Wurlitzer',
  clav: 'Clavinet',
  grand: 'Grand',
  upright: 'Upright',
  harpsichord: 'Harpsichord',
  digital: 'Digital',
  misc: 'Other electric',
  mallets: 'Mallets',
};
const PIANO_TYPES = (Object.keys(NPNO_PIANO_TYPE) as (keyof typeof NPNO_PIANO_TYPE)[])
  .map((key) => ({ value: NPNO_PIANO_TYPE[key], label: PIANO_TYPE_LABELS[key] }));

/**
 * How a held note fades once it reaches its loop. A time is how long it takes to fall 40 dB,
 * as the Sample Editor's loop Decay counts it (`loopDecayDbPerSecond`).
 */
const FADES: { label: string; fade: LoopFade }[] = [
  { label: 'As the sample (like a piano if it holds)', fade: 'auto' },
  { label: 'Like a piano', fade: 'piano' },
  ...[3, 6, 12, 24].map((s) => ({ label: `Fade away in ${s} s`, fade: 40 / s })),
  { label: 'Never fade', fade: 0 },
];

/**
 * Make a sample (`.nsmp`, `.nsmp3`, `.nsmp4`) into a piano (`.npno`), to play from the Nord's
 * piano section (`nsmpToNpno`): re-pitched and resampled, so not bit-for-bit, and not yet tried
 * on hardware. Saves into the linked folder when there is one, else downloads.
 */
export function MakePiano({ bytes, storedName, name }: {
  bytes: Uint8Array;
  /** The sample's stored name: a converted sample's is often a placeholder, so `name` wins. */
  storedName?: string;
  /** The sample's file or display name, which the piano is named after. */
  name?: string;
}) {
  const folder = useFolder();
  const saver = useSaveBytes();
  const [pianoType, setPianoType] = useState<number>(NPNO_PIANO_TYPE.electric);
  const [fade, setFade] = useState(0); // index into FADES
  const [building, setBuilding] = useState(false);

  async function build() {
    setBuilding(true);
    await new Promise((r) => setTimeout(r)); // let "Building…" paint: the conversion takes a second or two
    try {
      const { bytes: out, fileName, warnings } = nsmpToNpno(bytes, {
        name: pianoNameFrom(name?.trim() || storedName?.trim() || 'Piano'), pianoType, loopFade: FADES[fade].fade,
      });
      await saver.save(out, fileName, folder.result.pianos.some((p) => `${p.name}.npno` === fileName), warnings);
    } catch (e) {
      saver.fail(e);
    } finally {
      setBuilding(false);
    }
  }

  if (saver.dialog) return saver.dialog;

  return (
    <>
      <p className="ps-sub" style={{ margin: '12px 0 6px' }}>
        Make it a piano, to play from your Nord's piano section. Each note is re-pitched so the piano
        section can play it; loops, levels and tuning are kept.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="ps-sub" style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
          Piano type
          <select className={selectClass} value={pianoType} onChange={(e) => setPianoType(Number(e.target.value))}>
            {PIANO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label
          className="ps-sub"
          style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}
          title="How a note held on the key or the sustain pedal fades once it reaches its loop"
        >
          Held notes
          <select className={selectClass} value={fade} onChange={(e) => setFade(Number(e.target.value))}>
            {FADES.map((f, i) => <option key={f.label} value={i}>{f.label}</option>)}
          </select>
        </label>
        <button
          className="on-btn on-btn--secondary"
          onClick={() => void build()}
          disabled={saver.saving || building}
          title="Experimental -- not yet tried on a Nord"
        >
          {building ? 'Building the piano…' : 'Convert to Piano (.npno) -- experimental'}
        </button>
      </div>
      {saver.report}
    </>
  );
}
