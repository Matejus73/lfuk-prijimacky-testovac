import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/geist';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource-variable/source-sans-3';
import './index.css';
import App from './App.tsx';
import { DebugStatsBarSettings } from './components/debug/DebugStatsBarSettings.tsx';
import {
  applyDebugStatsBarSettings,
  loadStoredDebugStatsBarSettings,
} from './utils/debugStatsBarSettings.ts';

applyDebugStatsBarSettings(loadStoredDebugStatsBarSettings());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <DebugStatsBarSettings />
  </StrictMode>,
);
