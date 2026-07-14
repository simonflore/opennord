import { useState } from 'react';
import { Button } from './Button';

/** "Save to {folder}: New file or Overwrite — remember my choice." Shown when the
 *  write-back preference is still 'ask'. */
export function WriteTargetDialog({ folderName, existing, onChoose, onCancel }: {
  folderName: string;
  existing: boolean;
  onChoose: (mode: 'new' | 'overwrite', remember: boolean) => void;
  onCancel: () => void;
}) {
  const [remember, setRemember] = useState(false);
  return (
    <div className="ps" style={{ maxWidth: 460 }}>
      <div className="ps-nm">Save to {folderName}</div>
      <p className="ps-sub" style={{ marginTop: 6 }}>
        {existing ? 'A file with this name already exists in your folder.' : 'Save this into your linked folder.'}
      </p>
      <label className="ps-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Remember my choice
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button variant="primary" onClick={() => onChoose('new', remember)}>Save as new file</Button>
        {existing && <Button variant="secondary" onClick={() => onChoose('overwrite', remember)}>Overwrite</Button>}
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
