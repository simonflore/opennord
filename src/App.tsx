import { RouterProvider } from '@tanstack/react-router';
import './components/shell/shell.css';
import { DeviceProvider } from './lib/device/DeviceContext';
import { MidiProvider } from './lib/midi/MidiContext';
import { LibraryProvider } from './lib/library/LibraryContext';
import { SamplesProvider } from './lib/library/SamplesContext';
import { PresetsProvider } from './lib/library/PresetsContext';
import { router } from './router';

export function App() {
  return (
    <DeviceProvider>
      <MidiProvider>
        <LibraryProvider>
          <SamplesProvider>
            <PresetsProvider>
              <RouterProvider router={router} />
            </PresetsProvider>
          </SamplesProvider>
        </LibraryProvider>
      </MidiProvider>
    </DeviceProvider>
  );
}
