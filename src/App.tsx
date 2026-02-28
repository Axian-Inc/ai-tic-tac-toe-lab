import { useEffect, useState } from "react";
import { Game } from "./game/Game";

type RoutePath = "/" | "/game";

function resolveRoute(pathname: string): RoutePath {
  return pathname === "/game" ? "/game" : "/";
}

function LandingPage({ onStartGame }: { onStartGame: () => void }) {
  return (
    <main className="page page-landing">
      <div className="landing-decor landing-decor-left" aria-hidden="true">
        X
      </div>
      <div className="landing-decor landing-decor-right" aria-hidden="true">
        O
      </div>

      <section className="landing-content" aria-label="Game introduction">
        <p className="landing-brand">
          <span className="player-x">X</span>
          <span className="brand-divider">|</span>
          <span className="player-o">O</span>
        </p>
        <h1>Tic Tac Toe</h1>
        <p className="landing-intro">
          The classic game of X&apos;s and O&apos;s. Can you beat the CPU?
        </p>
        <button type="button" className="landing-cta" onClick={onStartGame}>
          Play vs CPU
        </button>

        <div className="landing-meta" aria-hidden="true">
          <div>
            <span className="meta-value player-x">X</span>
            <span className="meta-label">YOU</span>
          </div>
          <div>
            <span className="meta-value">VS</span>
            <span className="meta-label">BATTLE</span>
          </div>
          <div>
            <span className="meta-value player-o">O</span>
            <span className="meta-label">CPU</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function GameplayPage() {
  const game = new Game();
  const gameState = game.getState();

  return (
    <main className="page page-gameplay">
      <h1>Gameplay</h1>
      <p>Current turn: {gameState.currentPlayer}</p>
      <p>Moves recorded: {gameState.moves.length}</p>
      <p>Winner: {gameState.status.winner ?? "None"}</p>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState<RoutePath>(() =>
    resolveRoute(window.location.pathname)
  );

  useEffect(() => {
    const onPopState = () => {
      setRoute(resolveRoute(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = (path: RoutePath) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  if (route === "/game") {
    return <GameplayPage />;
  }

  return <LandingPage onStartGame={() => navigateTo("/game")} />;
}
