import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import GamePage from "./pages/GamePage";
import MultiplayerPage from "./pages/MultiplayerPage";
import SpectatePage from "./pages/SpectatePage";
import SpectateViewerPage from "./pages/SpectateViewerPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/multiplayer" element={<MultiplayerPage />} />
        <Route path="/spectate" element={<SpectatePage />} />
        <Route path="/spectate/:gameId" element={<SpectateViewerPage />} />
      </Routes>
    </Layout>
  );
}
