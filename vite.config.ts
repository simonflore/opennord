import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { fixturesDevPlugin } from './src/dev/fixtures-plugin';

const NATIVE = process.env.OPENNORD_NATIVE === '1';

export default defineConfig({
  plugins: [react(), fixturesDevPlugin()],
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
  define: {
    // RE tooling (capture/inference/review + /contribute,/dev routes) is web-only.
    // The native (Capacitor/iOS) build sets OPENNORD_NATIVE=1 so __RE__ is false and
    // RE code is dead-code-eliminated / aliased to a stub (see resolve.alias below).
    __RE__: JSON.stringify(!NATIVE),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'capacitor-nord-usb': fileURLToPath(
        new URL('./plugins/capacitor-nord-usb/src/index.ts', import.meta.url),
      ),
      // Native build: swap the RE route-aggregator for an empty stub so no RE route
      // (and nothing it imports) reaches the iOS bundle.
      ...(NATIVE
        ? { '@/router-re': fileURLToPath(new URL('./src/router-re.stub.tsx', import.meta.url)) }
        : {}),
    },
  },
  test: {
    css: false,
    testTimeout: 30_000,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
  },
});
