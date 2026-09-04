import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { autoPurgeStaleCacheOnStartup } from './utils/cacheManager';

// Remove stale/blocking cache on startup to maximize loading performance
autoPurgeStaleCacheOnStartup();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
