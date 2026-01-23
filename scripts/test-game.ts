import { newGame } from "../src/game/Game";
import { chooseCpuMove } from "../src/game/cpu";
import { CpuGame } from "../src/game/CpuGame";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const game = newGame();
const initial = game.getState();

assert(initial.board.length === 9, "Expected 9 cells");
assert(initial.moves.length === 0, "Expected no moves");
assert(initial.currentTurn === "X", "Expected X to start");
assert(initial.status === "in_progress", "Expected in_progress status");
assert(initial.winner === null, "Expected no winner");

assert(game.isLegalMove(0), "Expected move 0 to be legal");
assert(game.makeMove(0), "Expected move 0 to apply");
assert(!game.isLegalMove(0), "Expected move 0 to be illegal after play");
const snapshotAfterFirst = game.getState();
assert(!game.makeMove(0), "Expected occupied cell move to be rejected");
const snapshotAfterIllegal = game.getState();
assert(
  JSON.stringify(snapshotAfterFirst) === JSON.stringify(snapshotAfterIllegal),
  "Expected illegal move to not mutate state"
);

const afterFirst = game.getState();
assert(afterFirst.board[0] === "X", "Expected X to occupy index 0");
assert(afterFirst.currentTurn === "O", "Expected O to be next");
assert(afterFirst.moves.length === 1, "Expected 1 move recorded");
assert(afterFirst.moves[0].turn === 1, "Expected first move turn to be 1");
assert(afterFirst.moves[0].index === 0, "Expected first move index to be 0");
assert(afterFirst.moves[0].player === "X", "Expected first move player to be X");

assert(game.makeMove(4), "Expected move 4 to apply");
const afterSecond = game.getState();
assert(afterSecond.moves.length === 2, "Expected 2 moves recorded");
assert(afterSecond.moves[1].turn === 2, "Expected second move turn to be 2");
assert(afterSecond.moves[1].index === 4, "Expected second move index to be 4");
assert(afterSecond.moves[1].player === "O", "Expected second move player to be O");
assert(afterSecond.currentTurn === "X", "Expected X to be next after O");

// Quick win scenario for X
const winGame = newGame();
winGame.makeMove(0); // X
winGame.makeMove(3); // O
winGame.makeMove(1); // X
winGame.makeMove(4); // O
winGame.makeMove(2); // X wins

assert(winGame.getStatus() === "over", "Expected game to be over after win");
assert(winGame.getWinner() === "X", "Expected X to be winner");
assert(!winGame.isLegalMove(5), "Expected no legal moves after game over");
assert(!winGame.makeMove(5), "Expected moves to be rejected after game over");

const drawGame = newGame();
// Fill the board without a winner.
drawGame.makeMove(0); // X
drawGame.makeMove(1); // O
drawGame.makeMove(2); // X
drawGame.makeMove(4); // O
drawGame.makeMove(3); // X
drawGame.makeMove(5); // O
drawGame.makeMove(7); // X
drawGame.makeMove(6); // O
drawGame.makeMove(8); // X

assert(drawGame.getStatus() === "over", "Expected game to be over after draw");
assert(drawGame.getWinner() === null, "Expected no winner on draw");

const quitGame = newGame();
quitGame.quit();
assert(quitGame.getStatus() === "quit", "Expected game to be quit");
assert(!quitGame.isLegalMove(0), "Expected no legal moves after quit");
assert(!quitGame.makeMove(0), "Expected moves to be rejected after quit");

const cpuBoard = ["X", "O", "X", null, "O", null, null, null, null];
const cpuMove = chooseCpuMove(cpuBoard, "X", "O");
assert(cpuMove !== null, "Expected CPU to choose a move");
assert(cpuBoard[cpuMove.index] === null, "Expected CPU move to be legal");

const cpuMoveRepeat = chooseCpuMove(cpuBoard, "X", "O");
assert(
  cpuMoveRepeat !== null && cpuMoveRepeat.index === cpuMove.index,
  "Expected CPU to be deterministic for same board"
);

const cpuWinBoard = ["X", "X", null, "O", "O", null, null, null, null];
const cpuWinMove = chooseCpuMove(cpuWinBoard, "X", "O");
assert(cpuWinMove?.index === 2, "Expected CPU to take winning move");

const cpuBlockBoard = ["O", "O", null, "X", null, null, "X", null, null];
const cpuBlockMove = chooseCpuMove(cpuBlockBoard, "X", "O");
assert(cpuBlockMove?.index === 2, "Expected CPU to block opponent win");

const cpuCenterBoard = ["X", null, null, null, null, null, null, null, null];
const cpuCenterMove = chooseCpuMove(cpuCenterBoard, "O", "X");
assert(cpuCenterMove?.index === 4, "Expected CPU to take center");

const cpuCornerBoard = ["X", null, null, null, "O", null, null, null, null];
const cpuCornerMove = chooseCpuMove(cpuCornerBoard, "X", "O");
assert(cpuCornerMove?.index === 2, "Expected CPU to take first available corner");

const cpuGame = new CpuGame({ humanPlayer: "X", cpuPlayer: "O" });
const cpuHumanMove = cpuGame.makeHumanMove(0);
assert(cpuHumanMove, "Expected human move to apply");
const cpuGameState = cpuGame.getState();
assert(cpuGameState.moves.length === 2, "Expected CPU to respond automatically");
assert(cpuGameState.currentTurn === "X", "Expected turn to return to human");

const cpuFirstGame = new CpuGame({ humanPlayer: "O", cpuPlayer: "X" });
assert(cpuFirstGame.getState().moves.length === 1, "Expected CPU to move first");
assert(cpuFirstGame.getState().currentTurn === "O", "Expected human turn after CPU");

const cpuQuitGame = new CpuGame();
cpuQuitGame.quit();
const movesBeforeQuit = cpuQuitGame.getState().moves.length;
assert(!cpuQuitGame.makeHumanMove(0), "Expected move to fail after quit");
assert(
  cpuQuitGame.getState().moves.length === movesBeforeQuit,
  "Expected no moves after quit"
);

console.log("Game module smoke tests passed.");
