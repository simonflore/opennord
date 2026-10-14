import type { NsmpFile } from '../../lib/ns4/nsmp';
import { convertNsmp, type TargetCodec } from '../../lib/ns4/nsmp-convert';
import { useState } from 'react';
import { useFolder } from '../../lib/folder/FolderContext';
import { Button, Dialog, Menu, MenuItem, MenuSeparator } from '../ui';
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
 * Convert a loaded sample to another generation and save it: one "Convert" menu
 * beside Save to computer. If a folder is linked the result lands there;
 * otherwise it downloads. Offers every generation other than the source -- the
 * original `.nsmp` (OG), `.nsmp3` and `.nsmp4` -- so a sample can be converted
 * between *any* two generations in either direction. Audio is preserved exactly
 * (`convertNsmp`).
 *
 * "Piano (.npno)…" opens {@link MakePiano} in a dialog, for its piano type and
 * held-note fade. How a save went shows on its own line below the actions.
 */
export function SampleConvert({ bytes, file, name }: { bytes: Uint8Array; file: NsmpFile; name?: string }) {
  const folder = useFolder();
  const saver = useSaveBytes();
  const [piano, setPiano] = useState(false);

  const source = sourceGeneration(file);
  const targets = GENERATIONS.filter((g) => g.code !== source);

  async function convert(target: TargetCodec) {
    try {
      const { bytes: out, extension, warnings } = convertNsmp(bytes, target);
      const filename = `${file.name?.trim() || name?.trim() || 'sample'}${extension}`;
      await saver.save(out, filename, folder.result.samples.some((s) => s.name === filename), warnings);
    } catch (e) {
      saver.fail(e);
    }
  }

  return (
    <>
      <Menu label="Convert" trigger={<Button variant="secondary" disabled={saver.saving}>Convert ▾</Button>}>
        {targets.map((g) => (
          <MenuItem key={g.code} onSelect={() => void convert(g.code)} hint="Experimental: not yet tried on a Nord">
            {g.label}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem onSelect={() => setPiano(true)} hint="Play it from the piano section (experimental)">
          Piano (.npno)…
        </MenuItem>
      </Menu>
      {saver.dialog}
      <div className="basis-full empty:hidden">{saver.report}</div>
      <Dialog open={piano} onClose={() => setPiano(false)} title="Make it a piano" portal>
        <MakePiano bytes={bytes} storedName={file.name} name={name} />
      </Dialog>
    </>
  );
}
