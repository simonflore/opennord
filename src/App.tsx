import { useState } from 'react';
import './components/shell/shell.css';
import { DeviceProvider, useDevice } from './lib/device/DeviceContext';
import { DecodeInspector } from './components/DecodeInspector';
import { ProgramView } from './components/program/ProgramView';
import { DeviceManager } from './components/device/DeviceManager';
import { SampleInspector } from './components/sample/SampleInspector';
import { Rail } from './components/shell/Rail';
import { LibraryView } from './components/library/LibraryView';
import { parseNs4Program } from './lib/ns4/parse';
import { localEntryFromFile, nordEntriesFromDevice, filterEntries } from './lib/library/entries';
import type { LibraryEntry, LibrarySource } from './lib/library/types';
import type { NS4Program } from './lib/ns4/types';

type Dest = 'library' | 'samples' | 'device' | 'inspect' | 'decode';

export function App() {
  return (
    <DeviceProvider>
      <Shell />
    </DeviceProvider>
  );
}

function Shell() {
  const [dest, setDest] = useState<Dest>('library');
  const { entries: deviceEntries } = useDevice();

  const [localEntries, setLocalEntries] = useState<LibraryEntry[]>([]);
  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<NS4Program | null>(null);

  const allEntries: LibraryEntry[] = [...nordEntriesFromDevice(deviceEntries), ...localEntries];
  const shown = filterEntries(allEntries, source, query);

  async function importFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ns4p,.ns4o,.ns4n,.ns4y';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const entry = await localEntryFromFile(f, localEntries.length);
      setLocalEntries((prev) => [...prev, entry]);
    };
    input.click();
  }

  function openEntry(e: LibraryEntry) {
    if (e.program) { setOpen(e.program); return; }
    // Nord entries are read on the Device screen (pull flow); route there.
    setDest('device');
  }

  return (
    <div className="on-app">
      <Rail active={dest} onNavigate={(d) => { setOpen(null); setDest(d as Dest); }} onManageDevice={() => setDest('device')} />
      <main className="on-content">
        {dest === 'library' && (
          open
            ? (<div><button className="on-btn on-btn--ghost" onClick={() => setOpen(null)}>← Library</button><ProgramView program={open} /></div>)
            : (<LibraryView
                entries={shown} source={source} query={query}
                onSource={setSource} onQuery={setQuery} onOpen={openEntry} onImport={importFile} />)
        )}
        {dest === 'device' && <DeviceManager />}
        {dest === 'samples' && <SampleInspector />}
        {dest === 'inspect' && <DecodeInspector />}
        {dest === 'decode' && <ProgramDecode />}
      </main>
    </div>
  );
}

function ProgramDecode() {
  const [program, setProgram] = useState<NS4Program | null>(null);
  const [fileName, setFileName] = useState('');
  async function onFile(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    setFileName(file.name);
    setProgram(parseNs4Program(bytes));
  }
  return (
    <div>
      <input type="file" accept=".ns4p,.ns4o,.ns4n,.ns4y"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {program && (
        <section style={{ marginTop: 16 }}>
          <h3>{fileName}</h3>
          <p>{program.parsed
            ? `Recognized ${program.kind} — ${program.bytes.length} bytes`
            : `Recognized ${program.bytes.length} bytes; structured decode in progress (docs/FORMAT.md).`}</p>
          <pre style={{ background: 'var(--surface)', padding: 12, overflow: 'auto' }}>
            {JSON.stringify(program, (k, v) => (k === 'bytes' ? `<${(v as Uint8Array).length} bytes>` : v), 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
