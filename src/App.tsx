import { RouterProvider } from '@tanstack/react-router';
import './components/shell/shell.css';
import { DeviceProvider } from './lib/device/DeviceContext';
import { LibraryProvider } from './lib/library/LibraryContext';
import { router } from './router';

export function App() {
  return (
    <DeviceProvider>
      <LibraryProvider>
        <RouterProvider router={router} />
      </LibraryProvider>
    </DeviceProvider>
  );
}
