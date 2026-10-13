import type { NsmpFile } from '../../lib/ns4/nsmp';
import { convertNsmp, type TargetCodec } from '../../lib/ns4/nsmp-convert';
import { useFolder } from '../../lib/folder/FolderContext';
import { MakePiano } from './MakePiano';
import { useSaveBytes } from './useSaveBytes';

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
 * It can also be made into a piano (`.npno`) with {@link MakePiano}.
 */
export function SampleConvert({ bytes, file, name }: { bytes: Uint8Array; file: NsmpFile; name?: string }) {
  const folder = useFolder();
  const saver = useSaveBytes();

  const source = sourceGeneration(file);
  const targets = GENERATIONS.filter((g) => g.code !== source);
  if (targets.length === 0) return null;

  async function convert(target: TargetCodec) {
    try {
      const { bytes: out, extension, warnings } = convertNsmp(bytes, target);
      const filename = `${file.name?.trim() || name?.trim() || 'sample'}${extension}`;
      await saver.save(out, filename, folder.result.samples.some((s) => s.name === filename), warnings);
    } catch (e) {
      saver.fail(e);
    }
  }

  if (saver.dialog) return saver.dialog;

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>CONVERT</h4>
      <p className="ps-sub" style={{ marginTop: 0 }}>
        Save this sample as another generation. The audio, loops, levels and tuning are kept.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {targets.map((g) => (
          <button
            key={g.code}
            className="on-btn on-btn--secondary"
            onClick={() => void convert(g.code)}
            disabled={saver.saving}
            title="Experimental -- not yet hardware-validated"
          >
            Convert to {g.label} -- experimental
          </button>
        ))}
      </div>
      {saver.report}
      <MakePiano bytes={bytes} storedName={file.name} name={name} />
    </div>
  );
}
