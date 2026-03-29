import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '../routes/LandingPage';
import { GamePage } from '../routes/GamePage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/game/:gameId" element={<GamePage />} />
    </Routes>
  );
}
