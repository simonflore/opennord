import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './components/ui/ui.css';
import { App } from './App';
import { isCapacitorPlatform } from './lib/platform';

document.documentElement.dataset.theme = 'dark';
// Native shells get a `data-native` flag so additive shell CSS (safe areas, no
// browser chrome) can target [data-native] without touching the web build.
if (isCapacitorPlatform()) document.documentElement.dataset.native = 'true';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
