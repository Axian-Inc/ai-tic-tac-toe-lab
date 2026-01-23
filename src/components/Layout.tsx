import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app">
      <header className="app-header">
        <Link className="app-title" to="/">
          Tic Tac Toe Lab
        </Link>
        <nav className="app-nav">
          <NavLink end to="/">
            Landing
          </NavLink>
          <NavLink to="/game">Game</NavLink>
        </nav>
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}
