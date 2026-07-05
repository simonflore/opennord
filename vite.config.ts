import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { fixturesDevPlugin } from './src/dev/fixtures-plugin';

const NATIVE = process.env.OPENNORD_NATIVE === '1';

export default defineConfig({
  plugins: [react(), fixturesDevPlugin()],
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
  // .ns4p isn't a Vite-recognized asset extension by default; the migration
  // template fixture is imported via `?url` (ConvertToStage4.tsx) and served
  // to the browser as a static asset — needs this to resolve/bundle correctly.
  assetsInclude: ['**/*.ns4p'],
  define: {
    // RE tooling (capture/inference/review + /contribute,/dev routes) is web-only.
    // The native (Capacitor/iOS) build sets OPENNORD_NATIVE=1 so __RE__ is false and
    // RE code is dead-code-eliminated / aliased to a stub (see resolve.alias below).
    __RE__: JSON.stringify(!NATIVE),
  },
  resolve: {
    alias: [
      // Native build: the specific @/router-re alias MUST come before the @-prefix
      // alias, otherwise Vite's prefix matching resolves @/router-re → src/router-re
      // before the stub override can take effect.
      ...(NATIVE
        ? [{ find: '@/router-re', replacement: fileURLToPath(new URL('./src/router-re.stub.tsx', import.meta.url)) }]
        : []),
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'capacitor-nord-usb', replacement: fileURLToPath(
        new URL('./plugins/capacitor-nord-usb/src/index.ts', import.meta.url),
      )},
    ],
  },
  test: {
    css: false,
    testTimeout: 30_000,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
  },
});
