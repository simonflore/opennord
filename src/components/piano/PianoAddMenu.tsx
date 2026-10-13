import { useState } from 'react';
import { Dialog, MenuItem } from '../ui';
import { AddMenu } from '../library/AddMenu';
import { MakePiano } from '../sample/MakePiano';
import { isDecodableNsmp, isNsmpFileName, NSMP_EXTENSIONS, readNsmp } from '@/lib/ns4/nsmp';
import { useFolderOptional } from '@/lib/folder/FolderContext';
import { pickFile } from '@/lib/pick-file';

/** A sample picked to become a piano. */
interface Picked { bytes: Uint8Array; name: string; storedName?: string }

/**
 * The Pianos list's way to add to it: make a piano from one of your samples (the same
 * conversion the Samples page offers on an open sample), or choose a folder whose pianos it
 * then lists. A piano made here lands in the linked folder, so it shows in the list; without
 * one it downloads.
 */
export function PianoAddMenu() {
  const folder = useFolderOptional();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [error, setError] = useState('');

  async function pickSample() {
    const f = await pickFile(NSMP_EXTENSIONS.join(','));
    if (!f) return;
    if (!isNsmpFileName(f.name)) {
      setError(`“${f.name}” isn’t a Nord sample (.nsmp, .nsmp3 or .nsmp4).`);
      return;
    }
    const bytes = new Uint8Array(await f.arrayBuffer());
    const file = readNsmp(bytes);
    if (!file.recognized || !isDecodableNsmp(file)) {
      setError(`OpenNord can’t read the audio in “${f.name}”.`);
      return;
    }
    setError('');
    setPicked({ bytes, name: f.name, storedName: file.name });
  }

  return (
    <>
      <AddMenu folder={folder}>
        <MenuItem onSelect={() => void pickSample()} hint="Turns one of your samples into a piano (experimental)">
          Make a piano from a sample…
        </MenuItem>
      </AddMenu>
      {error && <p className="mt-2 basis-full text-xs text-danger" role="alert">{error}</p>}
      <Dialog
        open={!!picked}
        onClose={() => setPicked(null)}
        title={picked ? `Make a piano from ${picked.name}` : ''}
      >
        {picked && (
          <>
            <p className="ps-sub" style={{ marginTop: 0 }}>
              {folder?.folderName
                ? `The piano is saved into ${folder.folderName}, so it shows in this list.`
                : 'The piano downloads; choose a folder to keep your pianos listed here.'}
            </p>
            <MakePiano bytes={picked.bytes} storedName={picked.storedName} name={picked.name} />
          </>
        )}
      </Dialog>
    </>
  );
}
