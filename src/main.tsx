import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './components/ui/ui.css';
import { App } from './App';
import { router } from './router';
import { isCapacitorPlatform } from './lib/platform';
import { CapabilitiesProvider } from '@/lib/capabilities/CapabilitiesContext';
import { httpDiagnostics } from '@/lib/capabilities/defaults';

document.documentElement.dataset.theme = 'dark';
// Native shells get a `data-native` flag so additive shell CSS (safe areas, no
// browser chrome) can target [data-native] without touching the web build.
if (isCapacitorPlatform()) document.documentElement.dataset.native = 'true';

// Diagnostics: when a collector URL is configured at build time (a Coolify env
// var on the client deployment, pointing at the backend's ingest route), ship
// device-connect events there so they land in the server logs. Otherwise the
// default console sink is used. No backend code lives in this repo — only the
// client that posts to it.
const diagUrl = import.meta.env.VITE_DIAGNOSTICS_URL as string | undefined;
const capabilityOverrides = diagUrl ? { diagnostics: httpDiagnostics(diagUrl) } : undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CapabilitiesProvider value={capabilityOverrides}>
      <App router={router} />
    </CapabilitiesProvider>
  </StrictMode>,
);
