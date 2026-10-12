import { useRef, useState } from 'react';
import type { NsmpFile } from '../../lib/ns4/nsmp';
import { convertNsmp, type TargetCodec } from '../../lib/ns4/nsmp-convert';
import { nsmpToNpno, pianoNameFrom } from '../../lib/ns4/nsmp-to-npno';
import { NPNO_PIANO_TYPE } from '../../lib/ns4/nsp-write';
import { downloadBytes } from '../../lib/download';
import { getErrorMessage } from '../../lib/errors';
import { useFolder } from '../../lib/folder/FolderContext';
import { useFolderWrite } from '../../lib/folder/useFolderWrite';
import { selectClass, WriteTargetDialog } from '../ui';

type Status =
  | { kind: 'idle' }
  | { kind: 'done'; msg: string; warnings: string[] }
  | { kind: 'error'; msg: string };

/**
 * Every Nord Sample generation OpenNord can write, newest first. Labels match
 * Nord's own Sample Editor export names ("NSMP 2/3/4"); the `code` is the
 * `convertNsmp` target (2 = `.nsmp`, 3 = `.nsmp3`, 4 = `.nsmp4`). Listing all three
 * lets the UI offer any generation as a target, so a loaded sample can be converted
 * from *any* generation to *any other* -- including the downconverts the official
 * editor refuses (`.nsmp4`/`.nsmp3` -> `.nsmp`).
 */
const GENERATIONS: { code: TargetCodec; ext: string; label: string }[] = [
  { code: 4, ext: '.nsmp4', label: 'NSMP 4 (.nsmp4)' },
  { code: 3, ext: '.nsmp3', label: 'NSMP 3 (.nsmp3)' },
  { code: 2, ext: '.nsmp', label: 'NSMP 2 (.nsmp)' },
];

/** The piano types a Nord files pianos under, as its panel names them. */
const PIANO_TYPES = Object.entries(NPNO_PIANO_TYPE).map(([key, value]) => ({ value, label: key[0].toUpperCase() + key.slice(1) }));

/** Which generation a loaded file is, as a {@link GENERATIONS} code (`.nsmp` -> 2). */
function sourceGeneration(file: NsmpFile): TargetCodec | 0 {
  if (file.legacy) return 2;
  if (file.codec === 3 || file.codec === 4) return file.codec;
  return 0;
}

/**
 * Convert a loaded sample to another generation and save it. If a folder is linked
 * the result lands there; otherwise it downloads. Offers every generation other than
 * the source -- the original `.nsmp` (OG), `.nsmp3` and `.nsmp4` -- so a sample can
 * be converted between *any* two generations in either direction. Audio is preserved
 * exactly (`convertNsmp`).
 *
 * It can also be made into a piano (`.npno`), to play from the Nord's piano section
 * (`nsmpToNpno`): re-pitched and resampled, so not bit-for-bit, and not yet tried on hardware.
 */
export function SampleConvert({ bytes, file, name }: { bytes: Uint8Array; file: NsmpFile; name?: string }) {
  const folder = useFolder();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [pianoType, setPianoType] = useState<number>(NPNO_PIANO_TYPE.electric);
  const [building, setBuilding] = useState(false);

  // The conversion being saved, for whichever way the save ends: into the folder or as a download.
  const pendingRef = useRef<{ out: Uint8Array; filename: string; warnings: string[] } | null>(null);

  const folderWrite = useFolderWrite({
    prefScope: 'sample',
    onSaved: (path, folderName) =>
      setStatus({ kind: 'done', msg: `Saved to ${folderName}/${path}`, warnings: pendingRef.current?.warnings ?? [] }),
    onFallback: () => {
      const p = pendingRef.current;
      if (p) {
        downloadBytes(p.out, p.filename);
        setStatus({ kind: 'done', msg: `Saved ${p.filename}`, warnings: p.warnings });
      }
    },
  });

  const source = sourceGeneration(file);
  const targets = GENERATIONS.filter((g) => g.code !== source);
  if (targets.length === 0) return null;

  /** Save a converted file: into the linked folder when there is one, else as a download. */
  async function save(out: Uint8Array, filename: string, existing: boolean, warnings: string[]) {
    pendingRef.current = { out, filename, warnings };
    await folderWrite.save({ name: filename, existing, write: async (w) => {
      await w.write(out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer);
    } });
  }

  async function convert(target: TargetCodec) {
    try {
      const { bytes: out, extension, warnings } = convertNsmp(bytes, target);
      const filename = `${file.name?.trim() || name?.trim() || 'sample'}${extension}`;
      await save(out, filename, folder.result.samples.some((s) => s.name === filename), warnings);
    } catch (e) {
      setStatus({ kind: 'error', msg: getErrorMessage(e) });
    }
  }

  async function convertToPiano() {
    setBuilding(true);
    await new Promise((r) => setTimeout(r)); // let "Building…" paint: the conversion takes a second or two
    try {
      // The file's own name: a converted sample's stored name is often a placeholder.
      const { bytes: out, fileName, warnings } = nsmpToNpno(bytes, { name: pianoNameFrom(name?.trim() || file.name?.trim() || 'Piano'), pianoType });
      await save(out, fileName, folder.result.pianos.some((p) => `${p.name}.npno` === fileName), warnings);
    } catch (e) {
      setStatus({ kind: 'error', msg: getErrorMessage(e) });
    } finally {
      setBuilding(false);
    }
  }

  if (folderWrite.dialogProps) {
    return (
      <WriteTargetDialog
        {...folderWrite.dialogProps}
        onChoose={(mode, remember) => void folderWrite.dialogProps!.onChoose(mode, remember)}
        onCancel={folderWrite.dialogProps.onCancel}
      />
    );
  }

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>CONVERT</h4>
      <p className="ps-sub" style={{ marginTop: 0 }}>
        Save this sample as another generation. The audio is kept; loops and levels are not carried over yet.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {targets.map((g) => (
          <button
            key={g.code}
            className="on-btn on-btn--secondary"
            onClick={() => void convert(g.code)}
            disabled={folderWrite.saving || building}
            title="Experimental -- not yet hardware-validated"
          >
            Convert to {g.label} -- experimental
          </button>
        ))}
      </div>
      <p className="ps-sub" style={{ margin: '12px 0 6px' }}>
        Or make it a piano, to play from your Nord's piano section. Each note is re-pitched so the piano
        section can play it.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="ps-sub" style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
          Piano type
          <select className={selectClass} value={pianoType} onChange={(e) => setPianoType(Number(e.target.value))}>
            {PIANO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <button
          className="on-btn on-btn--secondary"
          onClick={() => void convertToPiano()}
          disabled={folderWrite.saving || building}
          title="Experimental -- not yet tried on a Nord"
        >
          {building ? 'Building the piano…' : 'Convert to Piano (.npno) -- experimental'}
        </button>
      </div>
      {status.kind === 'done' && (
        <>
          <p className="ps-sub" style={{ margin: '10px 0 0', color: 'var(--ink)' }}>&#x2713; {status.msg}</p>
          {status.warnings.length > 0 && (
            <ul className="ps-sub" style={{ margin: '4px 0 0' }}>
              {status.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </>
      )}
      {status.kind === 'error' && (
        <p className="ps-sub" style={{ marginTop: 10, color: 'var(--warn)' }}>{"Couldn't convert:"} {status.msg}</p>
      )}
      {folderWrite.error && (
        <p className="ps-sub" style={{ marginTop: 10, color: 'var(--warn)' }}>{"Couldn't save:"} {folderWrite.error}</p>
      )}
    </div>
  );
}
