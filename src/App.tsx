import { useState } from 'react';
import './components/shell/shell.css';
import { DeviceProvider, useDevice } from './lib/device/DeviceContext';
import { DecodeInspector } from './components/DecodeInspector';
import { ProgramView } from './components/program/ProgramView';
import { DeviceManager } from './components/device/DeviceManager';
import { Rail } from './components/shell/Rail';
import { ErrorBoundary } from './components/shell/ErrorBoundary';
import { LibraryView } from './components/library/LibraryView';
import { parseNs4Program } from './lib/ns4/parse';
import { nordEntriesFromDevice, filterEntries, entriesFromScannedPrograms, sortEntries } from './lib/library/entries';
import { useImportedLibrary } from './lib/library/useImportedLibrary';
import { useLibraryPrefs } from './lib/library/prefs';
import { useFolderLibrary } from './lib/folder/useFolderLibrary';
import { SamplesView } from './components/sample/SamplesView';
import { AboutView } from './components/about/AboutView';
import type { LibraryEntry, LibrarySource } from './lib/library/types';
import type { NS4Program } from './lib/ns4/types';

type Dest = 'library' | 'samples' | 'device' | 'inspect' | 'decode' | 'about';

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

  const [source, setSource] = useState<LibrarySource | 'all'>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<NS4Program | null>(null);

  const folder = useFolderLibrary();
  const imported = useImportedLibrary();
  const prefs = useLibraryPrefs();

  const allEntries: LibraryEntry[] = [
    ...nordEntriesFromDevice(deviceEntries),
    ...entriesFromScannedPrograms(folder.result.programs),
    ...imported.entries,
  ];
  const shown = sortEntries(filterEntries(allEntries, source, query), prefs.sort, prefs.favorites);

  function importFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ns4p,.ns4o,.ns4n,.ns4y,.ns3p,.ns3f,.ns2p';
    // Append to the DOM: a detached file input's click() is silently ignored on
    // some WebKit/iOS WKWebView builds (we wrap to iOS via Capacitor).
    input.style.display = 'none';
    document.body.appendChild(input);
    const cleanup = () => input.remove();
    input.onchange = async () => {
      const f = input.files?.[0];
      cleanup();
      if (!f) return;
      await imported.add(f);
    };
    input.oncancel = cleanup;
    input.click();
  }

  function openEntry(e: LibraryEntry) {
    if (e.program) { setOpen(e.program); return; }
    // Nord entries are read on the Device screen (pull flow); route there.
    setOpen(null);
    setDest('device');
  }

  return (
    <div className="on-app">
      <Rail active={dest} onNavigate={(d) => { setOpen(null); setDest(d as Dest); }} onManageDevice={() => setDest('device')} />
      <main className="on-content">
        <ErrorBoundary>
        {dest === 'library' && (
          open
            ? (<div><button className="on-btn on-btn--ghost" onClick={() => setOpen(null)}>← Library</button><ProgramView program={open} /></div>)
            : (<LibraryView
                entries={shown} source={source} query={query}
                onSource={setSource} onQuery={setQuery} onOpen={openEntry} onImport={importFile}
                onRemove={imported.remove}
                sort={prefs.sort} onSort={prefs.setSort}
                favorites={prefs.favorites} onToggleFavorite={prefs.toggleFavorite}
                folderName={folder.folderName}
                folderCount={folder.result.programs.length + folder.result.samples.length}
                canPersist={folder.canPersist}
                needsReconnect={folder.needsReconnect}
                reconnectError={folder.reconnectError}
                busy={folder.busy}
                onChooseFolder={folder.choose}
                onReconnect={folder.reconnect}
                onRefresh={folder.refresh}
                scanErrors={folder.result.errors}
                onForget={folder.forget}
              />)
        )}
        {dest === 'device' && <DeviceManager />}
        {dest === 'samples' && <SamplesView samples={folder.result.samples} />}
        {dest === 'inspect' && <DecodeInspector />}
        {dest === 'decode' && <ProgramDecode />}
        {dest === 'about' && <AboutView />}
        </ErrorBoundary>
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
      <input type="file" accept=".ns4p,.ns4o,.ns4n,.ns4y,.ns3p,.ns3f,.ns2p"
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
