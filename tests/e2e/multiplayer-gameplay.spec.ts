import { expect, test } from "./fixtures/test-fixture";
import { MultiplayerBrowserSession } from "./support/MultiplayerBrowserSession";

test.describe("Phase 5 Multiplayer Gameplay", () => {
  test.beforeEach(async ({ testSupportApi }) => {
    test.skip(
      process.env.UI_AUTOMATION_MODE !== "full",
      "Phase 5 multiplayer gameplay coverage requires frontend-plus-backend runtime."
    );

    await testSupportApi.reset();
  });

  test("UI-013 multiplayer turn enforcement and occupied cell blocking", async ({
    StepAsync,
    createAutomationContext,
    gameplayPage,
    testSupportApi,
  }) => {
    const opponentSession = await MultiplayerBrowserSession.create(createAutomationContext);

    try {
      const activeGame = await testSupportApi.seedActiveGame({
        id: "phase5-ui013-game",
        name: "Turn Enforcement Match",
        state: {
          board: [null, "O", null, "X", null, null, null, null, null],
          currentPlayer: "X",
          moves: [
            { order: 1, player: "X", position: 3 },
            { order: 2, player: "O", position: 1 },
          ],
          status: {
            isDraw: false,
            isOver: false,
            winner: null,
          },
        },
        activity: {
          lastProgressedAt: "2026-04-05T12:01:00.000Z",
          awaitingPlayer: "X",
          awaitingSince: "2026-04-05T12:01:00.000Z",
          abandonmentTimeoutMs: 180000,
          abandonmentDeadlineAt: "2026-04-05T12:04:00.000Z",
        },
      });

      await StepAsync("Open an active multiplayer game for the player whose turn it is", async () => {
        await gameplayPage.page.goto(
          `/game?mode=multiplayer&gameId=${activeGame.id}&player=X`
        );
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerSessionVisible();
        await gameplayPage.expectMultiplayerSessionRole("player");
        await gameplayPage.expectMultiplayerRoleText("You are player X");
        await gameplayPage.expectMultiplayerStatus("active");
        await gameplayPage.expectStatusContains("Your turn (X)");
        await gameplayPage.expectBoardInteractivePositions([0, 2, 4, 5, 6, 7, 8]);
      });

      await StepAsync("Play one empty cell on the local player's turn", async () => {
        await gameplayPage.playCell(0);
        await gameplayPage.expectCellValue(0, "X");
        await gameplayPage.expectStatusContains("Opponent turn (O)");
        await gameplayPage.expectBoardReadOnly();
      });

      await StepAsync("Verify the local player cannot act again immediately on the opponent turn", async () => {
        await gameplayPage.expectCellDisabled(2);
        await gameplayPage.waitForMarkedCellCount(3);
      });

      await StepAsync("After the opponent moves, verify occupied cells remain blocked", async () => {
        await opponentSession.gotoPlayerGame(activeGame.id, "O");
        await opponentSession.gameplayPage.expectLoaded();
        await opponentSession.gameplayPage.expectStatusContains("Your turn (O)");
        await opponentSession.gameplayPage.playCell(4);
        await opponentSession.gameplayPage.expectCellValue(4, "O");

        await gameplayPage.expectStatusContains("Your turn (X)");
        await gameplayPage.expectCellDisabled(0);
        await gameplayPage.expectCellDisabled(1);
        await gameplayPage.expectCellDisabled(3);
        await gameplayPage.expectCellDisabled(4);
      });
    } finally {
      await opponentSession.close();
    }
  });

  test("UI-014 multiplayer sync and refresh fallback", async ({
    StepAsync,
    createAutomationContext,
    gameplayPage,
    testSupportApi,
  }) => {
    const opponentSession = await MultiplayerBrowserSession.create(createAutomationContext);
    const spectatorSession = await MultiplayerBrowserSession.create(createAutomationContext);
    const degradedSession = await MultiplayerBrowserSession.create(createAutomationContext);

    try {
      const activeGame = await testSupportApi.seedActiveGame({
        id: "phase5-ui014-game",
        name: "Sync Fallback Match",
        state: {
          board: [null, null, null, null, null, null, null, null, null],
          currentPlayer: "X",
          moves: [],
          status: {
            isDraw: false,
            isOver: false,
            winner: null,
          },
        },
        activity: {
          lastProgressedAt: "2026-04-05T12:01:00.000Z",
          awaitingPlayer: "X",
          awaitingSince: "2026-04-05T12:01:00.000Z",
          abandonmentTimeoutMs: 180000,
          abandonmentDeadlineAt: "2026-04-05T12:04:00.000Z",
        },
      });

      await StepAsync("Open the active game in player X, player O, and spectator sessions", async () => {
        await gameplayPage.page.goto(`/game?mode=multiplayer&gameId=${activeGame.id}&player=X`);
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerRoleText("You are player X");
        await gameplayPage.expectLiveSyncState("connected");

        await opponentSession.gotoPlayerGame(activeGame.id, "O");
        await opponentSession.gameplayPage.expectLoaded();
        await opponentSession.gameplayPage.expectMultiplayerRoleText("You are player O");
        await opponentSession.gameplayPage.expectLiveSyncState("connected");

        await spectatorSession.gotoSpectatorGame(activeGame.id);
        await spectatorSession.gameplayPage.expectLoaded();
        await spectatorSession.gameplayPage.expectMultiplayerRoleText("You are spectating");
        await spectatorSession.gameplayPage.expectLiveSyncState("connected");
      });

      await StepAsync("Make a valid move and verify the other sessions update through live sync", async () => {
        await gameplayPage.playCell(0);
        await gameplayPage.expectCellValue(0, "X");
        await gameplayPage.expectStatusContains("Opponent turn (O)");

        await expect
          .poll(async () => await opponentSession.gameplayPage.cell(0).textContent())
          .toContain("X");
        await opponentSession.gameplayPage.expectStatusContains("Your turn (O)");

        await expect
          .poll(async () => await spectatorSession.gameplayPage.cell(0).textContent())
          .toContain("X");
        await spectatorSession.gameplayPage.expectStatusContains("Player O's turn");
      });

      await StepAsync("Interrupt websocket connectivity while leaving HTTP refresh reachable", async () => {
        await degradedSession.page.addInitScript(() => {
          class FailingWebSocket {
            static readonly CLOSED = 3;
            static readonly CLOSING = 2;
            static readonly CONNECTING = 0;
            static readonly OPEN = 1;

            private readonly listeners = new Map<string, Set<(event: Event) => void>>();
            binaryType: BinaryType = "blob";
            bufferedAmount = 0;
            extensions = "";
            onclose: ((this: WebSocket, ev: CloseEvent) => unknown) | null = null;
            onerror: ((this: WebSocket, ev: Event) => unknown) | null = null;
            onmessage: ((this: WebSocket, ev: MessageEvent) => unknown) | null = null;
            onopen: ((this: WebSocket, ev: Event) => unknown) | null = null;
            protocol = "";
            readyState = FailingWebSocket.CLOSED;
            url: string;

            constructor(url: string | URL) {
              this.url = String(url);
              queueMicrotask(() => {
                const errorEvent = new Event("error");
                const closeEvent = new CloseEvent("close", {
                  code: 1006,
                  reason: "test websocket interruption",
                });

                this.readyState = FailingWebSocket.CLOSED;
                this.onerror?.call(this as unknown as WebSocket, errorEvent);
                this.dispatchEvent(errorEvent);
                this.onclose?.call(this as unknown as WebSocket, closeEvent);
                this.dispatchEvent(closeEvent);
              });
            }

            addEventListener(type: string, listener: (event: Event) => void) {
              const listeners = this.listeners.get(type) ?? new Set<(event: Event) => void>();
              listeners.add(listener);
              this.listeners.set(type, listeners);
            }

            close() {}

            dispatchEvent(event: Event) {
              const listeners = this.listeners.get(event.type);
              listeners?.forEach((listener) => {
                listener(event);
              });
              return true;
            }

            removeEventListener(type: string, listener: (event: Event) => void) {
              this.listeners.get(type)?.delete(listener);
            }

            send() {}
          }

          Object.defineProperty(window, "WebSocket", {
            configurable: true,
            writable: true,
            value: FailingWebSocket,
          });
        });

        await degradedSession.gotoSpectatorGame(activeGame.id);
        await degradedSession.gameplayPage.expectLoaded();
        await degradedSession.gameplayPage.expectMultiplayerRoleText("You are spectating");
        await expect
          .poll(
            async () =>
              await degradedSession.gameplayPage.liveSyncStatus.getAttribute("data-sync-state")
          )
          .toMatch(/unavailable|reconnecting/);
      });

      await StepAsync("Refresh the degraded session and verify HTTP fallback reloads current state", async () => {
        await degradedSession.gameplayPage.clickRefreshMatch();
        await degradedSession.gameplayPage.expectCellValue(0, "X");
        await degradedSession.gameplayPage.expectGameplayErrorHidden();
      });
    } finally {
      await opponentSession.close();
      await spectatorSession.close();
      await degradedSession.close();
    }
  });

  test("UI-015 multiplayer role-based controls and resignation", async ({
    StepAsync,
    createAutomationContext,
    gameplayPage,
    testSupportApi,
  }) => {
    const spectatorSession = await MultiplayerBrowserSession.create(createAutomationContext);
    const waitingHostSession = await MultiplayerBrowserSession.create(createAutomationContext);

    try {
      const activeGame = await testSupportApi.seedActiveGame({
        id: "phase5-ui015-active-game",
        name: "Resign Flow Match",
        state: {
          board: [null, null, null, null, null, null, null, null, null],
          currentPlayer: "X",
          moves: [],
          status: {
            isDraw: false,
            isOver: false,
            winner: null,
          },
        },
        activity: {
          lastProgressedAt: "2026-04-05T12:01:00.000Z",
          awaitingPlayer: "X",
          awaitingSince: "2026-04-05T12:01:00.000Z",
          abandonmentTimeoutMs: 180000,
          abandonmentDeadlineAt: "2026-04-05T12:04:00.000Z",
        },
      });
      const spectatorGame = await testSupportApi.seedActiveGame({
        id: "phase5-ui015-spectator-game",
        name: "Spectator Controls Match",
      });
      const waitingGame = await testSupportApi.seedWaitingGame({
        id: "phase5-ui015-waiting-game",
        name: "Waiting Host Match",
      });

      await StepAsync("Verify active player controls show Resign and Check Timeout without Quit", async () => {
        await gameplayPage.page.goto(`/game?mode=multiplayer&gameId=${activeGame.id}&player=X`);
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerRoleText("You are player X");
        await gameplayPage.expectMultiplayerStatus("active");
        await gameplayPage.expectResignVisible();
        await gameplayPage.expectCheckTimeoutVisible();
        await gameplayPage.expectQuitHidden();
        await gameplayPage.expectHomeHidden();
      });

      await StepAsync("Cancel the resign confirmation and keep the match active", async () => {
        await gameplayPage.clickResign();
        await gameplayPage.expectResignDialogVisible();
        await gameplayPage.cancelResign();
        await gameplayPage.expectResignDialogHidden();
        await gameplayPage.expectMultiplayerStatus("active");
        await gameplayPage.expectStatusContains("Your turn (X)");
        await gameplayPage.expectResignVisible();
        await gameplayPage.expectCheckTimeoutVisible();
      });

      await StepAsync("Confirm resignation and verify the match ends with input blocked", async () => {
        await gameplayPage.clickResign();
        await gameplayPage.expectResignDialogVisible();
        await gameplayPage.confirmResign();
        await gameplayPage.expectResignDialogHidden();
        await gameplayPage.expectMultiplayerStatus("over");
        await gameplayPage.expectStatusContains("You resigned");
        await gameplayPage.expectSessionHelpContains("ended by resignation");
        await gameplayPage.expectHomeVisible();
        await gameplayPage.expectResignHidden();
        await gameplayPage.expectCheckTimeoutHidden();
        await gameplayPage.expectBoardReadOnly();
      });

      await StepAsync("Verify spectator, waiting host, and completed sessions expose the correct controls", async () => {
        await spectatorSession.gotoSpectatorGame(spectatorGame.id);
        await spectatorSession.gameplayPage.expectLoaded();
        await spectatorSession.gameplayPage.expectMultiplayerRoleText("You are spectating");
        await spectatorSession.gameplayPage.expectHomeVisible();
        await spectatorSession.gameplayPage.expectQuitHidden();
        await spectatorSession.gameplayPage.expectResignHidden();
        await spectatorSession.gameplayPage.expectCheckTimeoutHidden();
        await spectatorSession.gameplayPage.expectBoardReadOnly();

        await waitingHostSession.gotoPlayerGame(waitingGame.id, "X");
        await waitingHostSession.gameplayPage.expectLoaded();
        await waitingHostSession.gameplayPage.expectMultiplayerStatus("waiting");
        await waitingHostSession.gameplayPage.expectQuitVisible();
        await waitingHostSession.gameplayPage.expectHomeHidden();
        await waitingHostSession.gameplayPage.expectResignHidden();
        await waitingHostSession.gameplayPage.expectCheckTimeoutHidden();
        await waitingHostSession.gameplayPage.expectBoardReadOnly();

        await gameplayPage.expectHomeVisible();
        await gameplayPage.expectQuitHidden();
        await gameplayPage.expectResignHidden();
        await gameplayPage.expectCheckTimeoutHidden();
        await gameplayPage.expectBoardReadOnly();
      });
    } finally {
      await spectatorSession.close();
      await waitingHostSession.close();
    }
  });

  test("UI-016 multiplayer replay and read-only live return", async ({
    StepAsync,
    gameplayPage,
    replayPanel,
    testSupportApi,
  }) => {
    const replayGame = await testSupportApi.seedReplayGame({
      id: "phase5-ui016-game",
      name: "Replay Controls Match",
      activity: {
        lastProgressedAt: "2026-04-05T12:01:00.000Z",
        awaitingPlayer: "X",
        awaitingSince: "2026-04-05T12:01:00.000Z",
        abandonmentTimeoutMs: 180000,
        abandonmentDeadlineAt: "2026-04-05T12:04:00.000Z",
      },
    });

    await StepAsync("Open a multiplayer game with retained move history", async () => {
      await gameplayPage.page.goto(`/game?mode=multiplayer&gameId=${replayGame.id}&player=X`);
      await gameplayPage.expectLoaded();
      await gameplayPage.expectMultiplayerRoleText("You are player X");
      await replayPanel.expectVisible();
      await replayPanel.expectReplayMode("live");
      await replayPanel.expectTitleContains("Viewing live state");
      await replayPanel.expectSummaryContains("recorded moves available for catch-up and replay");
      await gameplayPage.expectMultiplayerReplayMode("live");
      await gameplayPage.expectCellValue(0, "X");
      await gameplayPage.expectCellValue(1, "O");
      await gameplayPage.expectCellValue(4, "X");
      await gameplayPage.expectCellValue(8, "O");
    });

    await StepAsync("Navigate replay frames with Start, Next, and Back", async () => {
      await replayPanel.start();
      await replayPanel.expectReplayMode("replay");
      await gameplayPage.expectMultiplayerReplayMode("replay");
      await replayPanel.expectTitleContains("Start");
      await gameplayPage.expectBoardEmpty();
      await replayPanel.expectBackDisabled();

      await replayPanel.next();
      await replayPanel.expectTitleContains("Move 1");
      await replayPanel.expectSummaryContains("Player X placed a mark on cell 1.");
      await gameplayPage.expectCellValue(0, "X");
      await gameplayPage.expectCellEmpty(1);
      await gameplayPage.expectCellEmpty(4);

      await replayPanel.back();
      await replayPanel.expectTitleContains("Start");
      await gameplayPage.expectBoardEmpty();
    });

    await StepAsync("Verify board, resign, and timeout actions are blocked during replay mode", async () => {
      await replayPanel.next();
      await gameplayPage.expectResignVisible();
      await gameplayPage.expectCheckTimeoutVisible();
      await expect(gameplayPage.resignationButton).toBeDisabled();
      await expect(gameplayPage.timeoutButton).toBeDisabled();
      await gameplayPage.expectCellDisabled(2);
      await gameplayPage.expectCellDisabled(3);
      await gameplayPage.expectCellDisabled(5);
      await gameplayPage.expectCellDisabled(6);
      await gameplayPage.expectCellDisabled(7);
      await gameplayPage.expectSessionHelpContains("Return to live before making moves or resigning");
    });

    await StepAsync("Return to live and restore authoritative state and controls", async () => {
      await replayPanel.returnToLive();
      await replayPanel.expectReplayMode("live");
      await gameplayPage.expectMultiplayerReplayMode("live");
      await replayPanel.expectTitleContains("Viewing live state");
      await gameplayPage.expectCellValue(0, "X");
      await gameplayPage.expectCellValue(1, "O");
      await gameplayPage.expectCellValue(4, "X");
      await gameplayPage.expectCellValue(8, "O");
      await expect(gameplayPage.resignationButton).toBeEnabled();
      await expect(gameplayPage.timeoutButton).toBeEnabled();
      await gameplayPage.expectStatusContains("Your turn (X)");
    });
  });

  test("UI-017 multiplayer refresh recovery by session type", async ({
    StepAsync,
    createAutomationContext,
    gameplayPage,
    testSupportApi,
  }) => {
    const spectatorSession = await MultiplayerBrowserSession.create(createAutomationContext);

    try {
      const activeGame = await testSupportApi.seedActiveGame({
        id: "phase5-ui017-game",
        name: "Refresh Recovery Match",
        state: {
          board: ["X", null, null, null, "O", null, null, null, null],
          currentPlayer: "X",
          moves: [
            { order: 1, player: "X", position: 0 },
            { order: 2, player: "O", position: 4 },
          ],
          status: {
            isDraw: false,
            isOver: false,
            winner: null,
          },
        },
        activity: {
          lastProgressedAt: "2026-04-05T12:01:00.000Z",
          awaitingPlayer: "X",
          awaitingSince: "2026-04-05T12:01:00.000Z",
          abandonmentTimeoutMs: 180000,
          abandonmentDeadlineAt: "2026-04-05T12:04:00.000Z",
        },
      });

      await StepAsync("Refresh the browser page in an active multiplayer player session", async () => {
        await gameplayPage.page.goto(`/game?mode=multiplayer&gameId=${activeGame.id}&player=X`);
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerRoleText("You are player X");
        await gameplayPage.expectMultiplayerStatus("active");
        await gameplayPage.expectCellValue(0, "X");
        await gameplayPage.expectCellValue(4, "O");

        await gameplayPage.page.reload();
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerRoleText("You are player X");
        await gameplayPage.expectMultiplayerStatus("active");
        await gameplayPage.expectMatchIdText(activeGame.id);
        await gameplayPage.expectCellValue(0, "X");
        await gameplayPage.expectCellValue(4, "O");
        await gameplayPage.expectStatusContains("Your turn (X)");
      });

      await StepAsync("Refresh the browser page in a spectator session", async () => {
        await spectatorSession.gotoSpectatorGame(activeGame.id);
        await spectatorSession.gameplayPage.expectLoaded();
        await spectatorSession.gameplayPage.expectMultiplayerRoleText("You are spectating");
        await spectatorSession.gameplayPage.expectBoardReadOnly();
        await spectatorSession.gameplayPage.expectCellValue(0, "X");
        await spectatorSession.gameplayPage.expectCellValue(4, "O");

        await spectatorSession.page.reload();
        await spectatorSession.gameplayPage.expectLoaded();
        await spectatorSession.gameplayPage.expectMultiplayerRoleText("You are spectating");
        await spectatorSession.gameplayPage.expectMultiplayerStatus("active");
        await spectatorSession.gameplayPage.expectMatchIdText(activeGame.id);
        await spectatorSession.gameplayPage.expectBoardReadOnly();
        await spectatorSession.gameplayPage.expectCellValue(0, "X");
        await spectatorSession.gameplayPage.expectCellValue(4, "O");
      });
    } finally {
      await spectatorSession.close();
    }
  });

  test("UI-018 multiplayer abandonment messaging and resolution", async ({
    StepAsync,
    createAutomationContext,
    gameplayPage,
    testSupportApi,
  }) => {
    const spectatorSession = await MultiplayerBrowserSession.create(createAutomationContext);

    try {
      const futureDeadline = new Date(Date.now() + 120_000).toISOString();
      const expiredDeadline = new Date(Date.now() - 5_000).toISOString();

      const localAwaitedGame = await testSupportApi.seedActiveGame({
        id: "phase5-ui018-local-awaited",
        name: "Local Awaited Match",
        state: {
          board: ["X", null, null, null, "O", null, null, null, "X"],
          currentPlayer: "O",
          moves: [
            { order: 1, player: "X", position: 0 },
            { order: 2, player: "O", position: 4 },
            { order: 3, player: "X", position: 8 },
          ],
          status: {
            isDraw: false,
            isOver: false,
            winner: null,
          },
        },
        activity: {
          lastProgressedAt: new Date(Date.now() - 60_000).toISOString(),
          awaitingPlayer: "O",
          awaitingSince: new Date(Date.now() - 60_000).toISOString(),
          abandonmentTimeoutMs: 180000,
          abandonmentDeadlineAt: futureDeadline,
        },
      });

      const opponentAwaitedGame = await testSupportApi.seedActiveGame({
        id: "phase5-ui018-opponent-awaited",
        name: "Opponent Awaited Match",
        state: {
          board: ["X", null, null, null, "O", null, null, null, "X"],
          currentPlayer: "O",
          moves: [
            { order: 1, player: "X", position: 0 },
            { order: 2, player: "O", position: 4 },
            { order: 3, player: "X", position: 8 },
          ],
          status: {
            isDraw: false,
            isOver: false,
            winner: null,
          },
        },
        activity: {
          lastProgressedAt: new Date(Date.now() - 60_000).toISOString(),
          awaitingPlayer: "O",
          awaitingSince: new Date(Date.now() - 60_000).toISOString(),
          abandonmentTimeoutMs: 180000,
          abandonmentDeadlineAt: futureDeadline,
        },
      });

      const expiredAwaitedGame = await testSupportApi.seedActiveGame({
        id: "phase5-ui018-expired-awaited",
        name: "Expired Awaited Match",
        state: {
          board: ["X", null, null, null, "O", null, null, null, "X"],
          currentPlayer: "O",
          moves: [
            { order: 1, player: "X", position: 0 },
            { order: 2, player: "O", position: 4 },
            { order: 3, player: "X", position: 8 },
          ],
          status: {
            isDraw: false,
            isOver: false,
            winner: null,
          },
        },
        activity: {
          lastProgressedAt: new Date(Date.now() - 180_000).toISOString(),
          awaitingPlayer: "O",
          awaitingSince: new Date(Date.now() - 180_000).toISOString(),
          abandonmentTimeoutMs: 180000,
          abandonmentDeadlineAt: expiredDeadline,
        },
      });

      await StepAsync("Open an active game where the local player is currently awaited", async () => {
        await gameplayPage.page.goto(
          `/game?mode=multiplayer&gameId=${localAwaitedGame.id}&player=O`
        );
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerRoleText("You are player O");
        await gameplayPage.expectAbandonmentCountdownVisible();
        await gameplayPage.expectAbandonmentAwaitingPlayer("O");
        await gameplayPage.expectAbandonmentCountdownContains(
          "Your required move timeout window ends in"
        );
      });

      await StepAsync("Open an active game where the opponent is awaited and view the same game as a spectator", async () => {
        await gameplayPage.page.goto(
          `/game?mode=multiplayer&gameId=${opponentAwaitedGame.id}&player=X`
        );
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerRoleText("You are player X");
        await gameplayPage.expectAbandonmentCountdownVisible();
        await gameplayPage.expectAbandonmentAwaitingPlayer("O");
        await gameplayPage.expectAbandonmentCountdownContains(
          "Opponent timeout window ends in"
        );

        await spectatorSession.gotoSpectatorGame(opponentAwaitedGame.id);
        await spectatorSession.gameplayPage.expectLoaded();
        await spectatorSession.gameplayPage.expectMultiplayerRoleText("You are spectating");
        await spectatorSession.gameplayPage.expectAbandonmentCountdownVisible();
        await spectatorSession.gameplayPage.expectAbandonmentAwaitingPlayer("O");
        await spectatorSession.gameplayPage.expectAbandonmentCountdownContains(
          "Waiting on player O. Timeout window ends in"
        );
      });

      await StepAsync("Check timeout before the deadline expires and keep the match active", async () => {
        await gameplayPage.clickCheckTimeout();
        await gameplayPage.expectGameplayErrorContains(
          "The required move timeout has not expired yet."
        );
        await gameplayPage.expectMultiplayerStatus("active");
        await gameplayPage.expectStatusContains("Opponent turn (O)");
      });

      await StepAsync("Resolve abandonment after the deadline expires and end the match", async () => {
        await gameplayPage.page.goto(
          `/game?mode=multiplayer&gameId=${expiredAwaitedGame.id}&player=X`
        );
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerStatus("active");
        await gameplayPage.expectAbandonmentCountdownVisible();
        await gameplayPage.expectAbandonmentAwaitingPlayer("O");

        await gameplayPage.clickCheckTimeout();
        await gameplayPage.expectMultiplayerStatus("over");
        await gameplayPage.expectStatusContains("Opponent abandoned the match");
        await gameplayPage.expectSessionHelpContains("ended by abandonment");
        await gameplayPage.expectResignHidden();
        await gameplayPage.expectCheckTimeoutHidden();
        await gameplayPage.expectHomeVisible();
        await gameplayPage.expectBoardReadOnly();
      });
    } finally {
      await spectatorSession.close();
    }
  });
});
