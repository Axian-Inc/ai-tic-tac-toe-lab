export const MARK_SELECTION_OPTIONS = ["X", "O", "Random"] as const;

export type MarkSelection = (typeof MARK_SELECTION_OPTIONS)[number];
export type PlayerMark = "X" | "O";

export interface MarkSelectionOptionState {
  value: MarkSelection;
  selected: boolean;
}

export interface ResolvedSessionMarks {
  playerMark: PlayerMark;
  cpuMark: PlayerMark;
}

function isMarkSelection(value: string): value is MarkSelection {
  return MARK_SELECTION_OPTIONS.includes(value as MarkSelection);
}

function assertValidMarkSelection(selection: string): asserts selection is MarkSelection {
  if (!isMarkSelection(selection)) {
    throw new Error(`Unsupported mark selection: ${selection}`);
  }
}

export function createMarkSelectionState(
  selected: MarkSelection = "X",
): MarkSelectionOptionState[] {
  assertValidMarkSelection(selected);

  return MARK_SELECTION_OPTIONS.map((value) => ({
    value,
    selected: value === selected,
  }));
}

export function resolveSessionMarks(
  selection: MarkSelection,
  randomValue: number = Math.random(),
): ResolvedSessionMarks {
  assertValidMarkSelection(selection);

  const playerMark: PlayerMark =
    selection === "Random" ? (randomValue < 0.5 ? "X" : "O") : selection;

  return {
    playerMark,
    cpuMark: playerMark === "X" ? "O" : "X",
  };
}
