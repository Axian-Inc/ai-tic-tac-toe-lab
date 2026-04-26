import { create } from "zustand";
import type { Game, GameMode } from "../game";
import { abandonGame, createGame, playTurn } from "../game";

type GameSessionState = {
  game: Game | null;
  playerName: string;
  selectedMode: GameMode;
  startGame: (mode: GameMode, playerName: string) => void;
  playCell: (cellIndex: number) => void;
  newGame: () => void;
  changeMode: (mode: GameMode) => void;
  abandon: () => void;
  resetSession: () => void;
};

const initialState = {
  game: null,
  playerName: "",
  selectedMode: "player-vs-player" as GameMode,
};

export const useGameSessionStore = create<GameSessionState>((set) => ({
  ...initialState,
  startGame: (mode, playerName) =>
    set({
      game: createGame(mode),
      playerName,
      selectedMode: mode,
    }),
  playCell: (cellIndex) =>
    set((state) => ({
      ...state,
      game: state.game === null ? null : playTurn(state.game, cellIndex),
    })),
  newGame: () =>
    set((state) => ({
      ...state,
      game: state.game === null ? null : createGame(state.selectedMode),
    })),
  changeMode: (mode) =>
    set((state) => ({
      ...state,
      selectedMode: mode,
      game: state.game === null ? null : createGame(mode),
    })),
  abandon: () =>
    set((state) => ({
      ...state,
      game: state.game === null ? null : abandonGame(state.game),
    })),
  resetSession: () => set(initialState),
}));
