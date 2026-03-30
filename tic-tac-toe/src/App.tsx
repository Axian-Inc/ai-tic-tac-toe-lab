import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { InputSwitch } from 'primereact/inputswitch';
import { useAppDispatch, useAppSelector } from './app/hooks';
import './App.css';
import { selectIsDarkMode, toggleDarkMode } from './features/app/appSlice';
import GamePage from './pages/GamePage';
import LandingPage from './pages/LandingPage';
import ResultPage from './pages/ResultPage';
import SpectatePage from './pages/SpectatePage';
import SinglePlayerPage from './pages/SinglePlayerPage';

function App() {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(selectIsDarkMode);

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <div className={`site-shell ${isDarkMode ? 'theme-dark' : ''}`}>
        <header className="site-header">
          <p className="site-title">
            <i className="pi pi-crown" aria-hidden="true"></i>
            <span>Tic Tac Toe Lab</span>
          </p>
          <div className="header-controls">
            <span className="theme-label">Dark Mode</span>
            <InputSwitch
              checked={isDarkMode}
              onChange={() => dispatch(toggleDarkMode())}
            />
          </div>
        </header>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/single" element={<SinglePlayerPage />} />
          <Route path="/spectate" element={<SpectatePage />} />
          <Route path="/spectate/:gameId" element={<SpectatePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/result/:outcome" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
