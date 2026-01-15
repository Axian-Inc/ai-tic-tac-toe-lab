import { createRoot } from 'react-dom/client';

import { App } from './App';

const apiBaseUrl =
  typeof import.meta !== 'undefined' && 'env' in import.meta && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(<App apiBaseUrl={apiBaseUrl} />);
