import { RouterProvider } from '@tanstack/react-router';
import './components/shell/shell.css';
import { DeviceProvider } from './lib/device/DeviceContext';
import { LibraryProvider } from './lib/library/LibraryContext';
import { SamplesProvider } from './lib/library/SamplesContext';
import { router } from './router';

export function App() {
  return (
    <DeviceProvider>
      <LibraryProvider>
        <SamplesProvider>
          <RouterProvider router={router} />
        </SamplesProvider>
      </LibraryProvider>
    </DeviceProvider>
  );
}
