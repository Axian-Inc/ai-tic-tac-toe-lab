import { Game, type GameState, type GameStatus, type Player } from "./Game";
import { chooseCpuMove } from "./cpu";

type CpuGameOptions = {
  cpuPlayer?: Player;
  humanPlayer?: Player;
};

export class CpuGame {
  private game: Game;
  private cpuPlayer: Player;
  private humanPlayer: Player;

  constructor(options: CpuGameOptions = {}) {
    this.cpuPlayer = options.cpuPlayer ?? "O";
    this.humanPlayer = options.humanPlayer ?? (this.cpuPlayer === "X" ? "O" : "X");

    if (this.cpuPlayer === this.humanPlayer) {
      throw new Error("CPU player and human player must be different.");
    }

    this.game = new Game();
    this.applyCpuMoveIfNeeded();
  }

  getState(): GameState {
    return this.game.getState();
  }

  getStatus(): GameStatus {
    return this.game.getStatus();
  }

  getWinner(): Player | null {
    return this.game.getWinner();
  }

  makeMove(index: number): boolean {
    return this.makeHumanMove(index);
  }

  makeHumanMove(index: number): boolean {
    if (this.game.getStatus() !== "in_progress") {
      return false;
    }

    if (this.game.getState().currentTurn !== this.humanPlayer) {
      return false;
    }

    const applied = this.game.makeMove(index);
    if (!applied) {
      return false;
    }

    this.applyCpuMoveIfNeeded();
    return true;
  }

  reset(): void {
    this.game.reset();
    this.applyCpuMoveIfNeeded();
  }

  quit(): void {
    this.game.quit();
  }

  private applyCpuMoveIfNeeded(): void {
    if (this.game.getStatus() !== "in_progress") {
      return;
    }

    if (this.game.getState().currentTurn !== this.cpuPlayer) {
      return;
    }

    const state = this.game.getState();
    const decision = chooseCpuMove(state.board, this.cpuPlayer, this.humanPlayer);

    if (decision && this.game.isLegalMove(decision.index)) {
      this.game.makeMove(decision.index);
    }
  }
}

export function newCpuGame(options: CpuGameOptions = {}): CpuGame {
  return new CpuGame(options);
}
