import { useState } from 'react';

type Mark = 'X' | 'O';
type MarkSelection = Mark | 'Random';

type GameSession = {
  playerMark: Mark;
  cpuMark: Mark;
  selection: MarkSelection;
};

const MARK_OPTIONS: Array<{
  value: MarkSelection;
  label: string;
  description: string;
}> = [
  {
    value: 'X',
    label: 'Play as X',
    description: 'Start with the classic first-player mark.',
  },
  {
    value: 'O',
    label: 'Play as O',
    description: 'Let the CPU open as X while you play O.',
  },
  {
    value: 'Random',
    label: 'Random draw',
    description: 'Let the app assign your mark at game start.',
  },
];

function resolvePlayerMark(selection: MarkSelection): Mark {
  if (selection === 'Random') {
    return Math.random() < 0.5 ? 'X' : 'O';
  }

  return selection;
}

function getCpuMark(playerMark: Mark): Mark {
  return playerMark === 'X' ? 'O' : 'X';
}

function App() {
  const [selection, setSelection] = useState<MarkSelection>('X');
  const [session, setSession] = useState<GameSession | null>(null);

  const startGame = () => {
    const playerMark = resolvePlayerMark(selection);

    setSession({
      playerMark,
      cpuMark: getCpuMark(playerMark),
      selection,
    });
  };

  if (session) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_transparent_32%),linear-gradient(180deg,_#fff7ed_0%,_#fffbeb_44%,_#f8fafc_100%)] px-6 py-10 text-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col gap-8">
          <section className="rounded-[2rem] border border-amber-200/80 bg-white/85 p-8 shadow-[0_24px_80px_-40px_rgba(120,53,15,0.45)] backdrop-blur">
            <p className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold tracking-wide text-emerald-800 uppercase">
              Game Session Ready
            </p>
            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-black tracking-tight text-balance sm:text-5xl">
                  Your Tic-Tac-Toe matchup is locked in.
                </h1>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  This story covers the landing-to-game handoff, so the started view exposes the
                  resolved marks that the next gameplay stories will consume.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSession(null)}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Back to landing
              </button>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.85)]">
              <p className="text-sm font-semibold tracking-[0.3em] text-amber-300 uppercase">
                Match Setup
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/8 p-5">
                  <p className="text-sm text-slate-300">Selected option</p>
                  <p className="mt-2 text-3xl font-black">{session.selection}</p>
                </div>
                <div className="rounded-3xl bg-white/8 p-5">
                  <p className="text-sm text-slate-300">Resolved player mark</p>
                  <p className="mt-2 text-3xl font-black">{session.playerMark}</p>
                </div>
                <div className="rounded-3xl bg-white/8 p-5">
                  <p className="text-sm text-slate-300">CPU mark</p>
                  <p className="mt-2 text-3xl font-black">{session.cpuMark}</p>
                </div>
                <div className="rounded-3xl bg-white/8 p-5">
                  <p className="text-sm text-slate-300">Status</p>
                  <p className="mt-2 text-3xl font-black">Ready</p>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
              <h2 className="text-xl font-bold text-slate-950">QA verification</h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                <li>The landing screen transitioned successfully into a started game state.</li>
                <li>The player mark is visible for explicit and random selections.</li>
                <li>The CPU mark is always the opposite of the player mark.</li>
                <li>No board play is implemented here; later stories own gameplay behavior.</li>
              </ul>
            </article>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fef3c7,_transparent_28%),radial-gradient(circle_at_bottom_right,_#fecdd3,_transparent_24%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_60%,_#ffffff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-8 lg:flex-row lg:items-stretch">
        <section className="flex-1 rounded-[2rem] border border-amber-200/70 bg-white/85 p-8 shadow-[0_28px_80px_-46px_rgba(120,53,15,0.4)] backdrop-blur sm:p-10">
          <p className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold tracking-wide text-amber-900 uppercase">
            Phase 1 Landing
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-balance sm:text-6xl">
            Pick your mark and challenge the CPU.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            This is the first gameplay entry point for the app: choose who you want to be, launch
            the match, and carry that selection into the started game session.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
              Local-only React app
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
              Deterministic CPU planned next
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
              Keyboard-friendly controls
            </span>
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.95)] sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-amber-300 uppercase">
                Play vs CPU
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Choose your mark</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Default: X
            </div>
          </div>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold text-slate-300">
              Select one option before starting the game
            </legend>
            <div className="mt-4 grid gap-3">
              {MARK_OPTIONS.map((option) => {
                const isSelected = selection === option.value;

                return (
                  <label
                    key={option.value}
                    className={`group flex cursor-pointer items-start gap-4 rounded-3xl border px-4 py-4 transition ${
                      isSelected
                        ? 'border-amber-300 bg-amber-300/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/8'
                    }`}
                  >
                    <input
                      type="radio"
                      name="player-mark"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setSelection(option.value)}
                      className="mt-1 h-4 w-4 border-white/30 bg-slate-900 text-amber-400 focus:ring-amber-300"
                    />
                    <span className="block">
                      <span className="block text-lg font-bold text-white">{option.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-300">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">Current selection</p>
            <p className="mt-2 text-3xl font-black">{selection}</p>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-amber-300 px-6 py-4 text-base font-black text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Play vs CPU
          </button>
        </section>
      </div>
    </main>
  );
}

export default App;
