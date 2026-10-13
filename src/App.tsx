import { RouterProvider } from '@tanstack/react-router';
import './components/shell/shell.css';
import { DeviceProvider } from './lib/device/DeviceContext';
import { FolderProvider } from './lib/folder/FolderContext';
import { MidiProvider } from './lib/midi/MidiContext';
import { CloudSnapshotProvider } from './lib/library/CloudSnapshotContext';
import { LibraryProvider } from './lib/library/LibraryContext';
import { SamplesProvider } from './lib/library/SamplesContext';
import { PresetsProvider } from './lib/library/PresetsContext';
import { PianosProvider } from './lib/library/PianosContext';
import type { AppRouter } from './router';

export function App({ router }: { router: AppRouter }) {
  return (
    <DeviceProvider>
      <FolderProvider>
        <MidiProvider>
          <CloudSnapshotProvider>
            <LibraryProvider>
              <SamplesProvider>
                <PresetsProvider>
                  <PianosProvider>
                    <RouterProvider router={router} />
                  </PianosProvider>
                </PresetsProvider>
              </SamplesProvider>
            </LibraryProvider>
          </CloudSnapshotProvider>
        </MidiProvider>
      </FolderProvider>
    </DeviceProvider>
  );
}
