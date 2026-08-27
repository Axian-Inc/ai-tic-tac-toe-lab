import Ajv2020 from 'ajv/dist/2020.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  applyMove,
  chooseCpuMove,
  createGame,
  type GameState,
  type Mark,
} from '@tic-tac-toe/game-core';

const repositoryFile = (relativePath: string) =>
  fileURLToPath(new URL(`../../../../${relativePath}`, import.meta.url));

describe('P1-CONTRACT-001: game rule vectors', () => {
  it('conform to the accepted JSON schema', async () => {
    const schema = JSON.parse(
      await readFile(repositoryFile('contracts/game-rule-vectors.schema.json'), 'utf8'),
    );
    const vectors = JSON.parse(
      await readFile(repositoryFile('contracts/game-rule-vectors.json'), 'utf8'),
    );
    const ajv = new Ajv2020({ allErrors: true, strict: true });

    const validate = ajv.compile(schema);
    const valid = validate(vectors);

    expect(validate.errors, JSON.stringify(validate.errors, null, 2)).toBeNull();
    expect(valid).toBe(true);
  });

  it('contains canonical human-win, CPU-win, draw, rejection, and CPU cases', async () => {
    const vectors = JSON.parse(
      await readFile(repositoryFile('contracts/game-rule-vectors.json'), 'utf8'),
    ) as {
      gameCases: Array<{ name: string; expected: { status: string }; rejection?: unknown }>;
      cpuCases: Array<{ name: string }>;
    };

    expect(vectors.gameCases.some(({ expected }) => expected.status === 'won')).toBe(true);
    expect(vectors.gameCases.some(({ expected }) => expected.status === 'draw')).toBe(true);
    expect(vectors.gameCases.some(({ rejection }) => rejection !== undefined)).toBe(true);
    expect(vectors.cpuCases).toHaveLength(2);
  });

  it('P1-GAME-VECTORS-001: produces every accepted game vector', async () => {
    const vectors = JSON.parse(
      await readFile(repositoryFile('contracts/game-rule-vectors.json'), 'utf8'),
    ) as RuleVectors;

    for (const gameCase of vectors.gameCases) {
      let state = createGame();

      for (const [index, move] of gameCase.moves.entries()) {
        const transition = applyMove(state, move.player, move.cell);
        if (gameCase.rejection?.atMove === index + 1) {
          expect(transition.accepted, gameCase.name).toBe(false);
          if (!transition.accepted) {
            expect(transition.reason, gameCase.name).toBe(gameCase.rejection.reason);
          }
        } else {
          expect(transition.accepted, gameCase.name).toBe(true);
        }
        state = transition.state;
      }

      expect(state, gameCase.name).toMatchObject({
        board: gameCase.expected.board,
        currentTurn: gameCase.expected.currentTurn,
        winner: gameCase.expected.winner,
        status: gameCase.expected.status,
      });
      expect(state.moves, gameCase.name).toHaveLength(gameCase.expected.moveCount);
    }
  });

  it('P1-CPU-VECTORS-001: produces every accepted CPU vector', async () => {
    const vectors = JSON.parse(
      await readFile(repositoryFile('contracts/game-rule-vectors.json'), 'utf8'),
    ) as RuleVectors;

    for (const cpuCase of vectors.cpuCases) {
      let state: GameState = createGame();
      for (const move of cpuCase.moves) {
        const transition = applyMove(state, move.player, move.cell);
        expect(transition.accepted, cpuCase.name).toBe(true);
        state = transition.state;
      }
      expect(chooseCpuMove(state), cpuCase.name).toBe(cpuCase.expectedMove);
    }
  });
});

interface RuleVectors {
  gameCases: Array<{
    name: string;
    moves: Array<{ player: Mark; cell: number }>;
    expected: {
      status: string;
      currentTurn: Mark | null;
      winner: Mark | null;
      board: Array<Mark | null>;
      moveCount: number;
    };
    rejection?: { atMove: number; reason: string };
  }>;
  cpuCases: Array<{
    name: string;
    moves: Array<{ player: Mark; cell: number }>;
    expectedMove: number;
  }>;
}
