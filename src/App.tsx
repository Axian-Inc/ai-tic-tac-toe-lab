import { useEffect, useState } from "react";

type RoutePath = "/" | "/game";

function resolveRoute(pathname: string): RoutePath {
  return pathname === "/game" ? "/game" : "/";
}

function LandingPage({ onStartGame }: { onStartGame: () => void }) {
  return (
    <main className="page page-landing">
      <h1>AI Tic-Tac-Toe Lab</h1>
      <p>Welcome to Tic-Tac-Toe.</p>
      <button type="button" onClick={onStartGame}>
        Start New Game
      </button>
    </main>
  );
}

function GameplayPage() {
  return (
    <main className="page page-gameplay">
      <h1>Gameplay</h1>
      <p>Game board view is ready for the next story.</p>
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
