import { JSDOM } from "jsdom";
import React from "react";
import { BrowserRouter } from "react-router-dom";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function setupDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/",
  });

  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator as Navigator;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
    dom.window.setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (handle: number) => dom.window.clearTimeout(handle);
}

function getBoardButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".cell"));
}

function getCellValue(cell: HTMLButtonElement): string {
  const value = cell.querySelector(".cell-value");
  return value?.textContent?.trim() ?? "";
}

async function waitForBoardMoves(expected: number) {
  const { waitFor } = await import("@testing-library/react");
  await waitFor(() => {
    const filled = getBoardButtons().filter((cell) => getCellValue(cell) !== "");
    assert(filled.length === expected, `Expected ${expected} moves on board`);
  });
}

async function run() {
  setupDom();
  const { render, screen, within } = await import("@testing-library/react");
  const userEvent = (await import("@testing-library/user-event")).default;
  const { default: App } = await import("../src/App");
  const user = userEvent.setup();

  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    { container: document.getElementById("root") as HTMLElement }
  );

  await screen.findByRole("heading", { name: /welcome to tic tac toe/i });
  await user.click(screen.getByRole("link", { name: /play vs cpu/i }));

  await screen.findByRole("heading", { name: /game detail/i });
  const meta = screen.getByText((_, node) => {
    const element = node as HTMLElement | null;
    return element?.classList.contains("game-meta") ?? false;
  });
  assert(meta.textContent?.includes("You are"), "Expected game meta text");
  assert(meta.textContent?.includes("You are X"), "Expected human to be X");

  const cell1 = screen.getByRole("button", { name: /row 1 column 1, empty/i });
  await user.click(cell1);

  await waitForBoardMoves(2);

  const cell3 = screen.getByRole("button", { name: /row 1 column 3, empty/i });
  await user.click(cell3);

  await waitForBoardMoves(4);

  const cell7 = screen.getByRole("button", { name: /row 3 column 1, empty/i });
  await user.click(cell7);

  await screen.findByText(/o wins!/i);
  assert(screen.getByText(/try again/i), "Expected loss feedback message");

  const rematchButton = screen.getByRole("button", { name: /rematch/i });
  await user.click(rematchButton);

  await screen.findByText(/game in progress/i);
  const board = within(document.querySelector(".board") as HTMLElement);
  const emptyCells = board
    .getAllByRole("button")
    .filter((cell) => getCellValue(cell) === "");
  assert(emptyCells.length === 9, "Expected board to reset for rematch");

  console.log("Integration flow tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
