import assert from "node:assert/strict";
import test from "node:test";

import {
  MARK_SELECTION_OPTIONS,
  createMarkSelectionState,
  resolveSessionMarks,
} from "../../src/game/markSelection.js";

test("TTT-65 default landing selection initializes exactly one valid active option", () => {
  const state = createMarkSelectionState();

  assert.equal(state.length, MARK_SELECTION_OPTIONS.length);
  assert.deepEqual(
    state.map((option) => option.value),
    [...MARK_SELECTION_OPTIONS],
  );
  assert.equal(state.filter((option) => option.selected).length, 1);
  assert.equal(state.find((option) => option.selected)?.value, "X");
});

test("TTT-65 selection state switches to X, O, or Random without multiple active options", () => {
  for (const selected of MARK_SELECTION_OPTIONS) {
    const state = createMarkSelectionState(selected);

    assert.equal(state.filter((option) => option.selected).length, 1);
    assert.equal(state.find((option) => option.selected)?.value, selected);
  }
});

test("TTT-65 explicit selections always give the CPU the opposite mark", () => {
  assert.deepEqual(resolveSessionMarks("X"), {
    playerMark: "X",
    cpuMark: "O",
  });
  assert.deepEqual(resolveSessionMarks("O"), {
    playerMark: "O",
    cpuMark: "X",
  });
});

test("TTT-65 random selection resolves to a valid player mark and opposite CPU mark", () => {
  assert.deepEqual(resolveSessionMarks("Random", 0.2), {
    playerMark: "X",
    cpuMark: "O",
  });
  assert.deepEqual(resolveSessionMarks("Random", 0.8), {
    playerMark: "O",
    cpuMark: "X",
  });
});
