import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GAME_CORE_VERSION } from '@tic-tac-toe/game-core';
import './styles.css';

function App() {
  return (
    <main>
      <h1>AI Tic-Tac-Toe</h1>
      <p>Application foundation is ready.</p>
      <small>Game core contract v{GAME_CORE_VERSION}</small>
    </main>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

