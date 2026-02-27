function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <p className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
          Tailwind Ready
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Coming Soon</h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Tic-Tac-Toe is being prepared for Phase 1 gameplay stories. This placeholder now uses
          Tailwind utility classes.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Card Example</h2>
            <p className="mt-2 text-sm text-slate-600">
              Simple card styling with spacing, borders, and typography.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Button Example</h2>
            <button
              type="button"
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
            >
              Demo Action
            </button>
          </article>
        </div>
      </div>
    </main>
  );
}

export default App;
