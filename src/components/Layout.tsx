import type { PropsWithChildren } from 'react';

interface LayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function Layout({ title, subtitle, children }: LayoutProps) {
  return (
    <main className="app-shell">
      <section className="panel">
        <header className="hero">
          <p className="eyebrow">Local React Demo</p>
          <h1>{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </header>
        {children}
      </section>
    </main>
  );
}
