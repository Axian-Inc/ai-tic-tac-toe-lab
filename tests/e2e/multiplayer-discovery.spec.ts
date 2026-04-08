import { expect, test } from "./fixtures/test-fixture";
import { MultiplayerBrowserSession } from "./support/MultiplayerBrowserSession";

test.describe("Phase 4 Multiplayer Discovery", () => {
  test.beforeEach(async ({ testSupportApi }) => {
    test.skip(
      process.env.UI_AUTOMATION_MODE !== "full",
      "Phase 4 multiplayer discovery coverage requires frontend-plus-backend runtime."
    );

    await testSupportApi.reset();
  });

  test("UI-010 multiplayer join success and stale join failure", async ({
    StepAsync,
    createAutomationContext,
    gameplayPage,
    landingPage,
    multiplayerModalPage,
    testSupportApi,
  }) => {
    const joinerSession = await MultiplayerBrowserSession.create(createAutomationContext);
    const staleSession = await MultiplayerBrowserSession.create(createAutomationContext);

    try {
      let waitingMatchId = "";
      const staleMatchId = "stale-join-match";

      await StepAsync("Create a waiting game in the host session", async () => {
        await landingPage.goto();
        await landingPage.openMultiplayer();
        await multiplayerModalPage.expectCreateView();
        await multiplayerModalPage.fillPlayerName("Host Player");
        await multiplayerModalPage.fillGameName("Join Flow Match");
        await multiplayerModalPage.submitCreate();
        await gameplayPage.expectLoaded();
        await gameplayPage.expectMultiplayerSessionVisible();
        waitingMatchId = (await gameplayPage.matchIdText.textContent())?.trim() ?? "";
        expect(waitingMatchId).not.toBe("");
      });

      await StepAsync("Seed a deterministic stale-join discovery entry", async () => {
        await testSupportApi.seedStaleJoin({
          gameId: staleMatchId,
          gameName: "Stale Join Match",
          hostName: "Stale Host",
        });
      });

      await StepAsync("Open stale and fresh join discovery sessions", async () => {
        await joinerSession.landingPage.goto();
        await joinerSession.landingPage.openMultiplayer();
        await joinerSession.multiplayerModalPage.switchToJoin();
        await joinerSession.multiplayerModalPage.expectWaitingGameVisible(waitingMatchId);

        await staleSession.landingPage.goto();
        await staleSession.landingPage.openMultiplayer();
        await staleSession.multiplayerModalPage.switchToJoin();
        await staleSession.multiplayerModalPage.expectWaitingGameVisible(staleMatchId);
      });

      await StepAsync("Join the waiting game from the fresh joiner session", async () => {
        await joinerSession.multiplayerModalPage.joinGame(waitingMatchId);
        await joinerSession.gameplayPage.expectLoaded();
        await joinerSession.gameplayPage.expectMultiplayerRoleText("You are player O");
      });

      await StepAsync("Attempt to join the same stale discovery entry again", async () => {
        await staleSession.multiplayerModalPage.joinGame(staleMatchId);
        await staleSession.multiplayerModalPage.expectErrorContains(
          "Only waiting games with one open player slot can be joined."
        );
      });
    } finally {
      await joinerSession.close();
      await staleSession.close();
    }
  });

  test("UI-011 dedicated spectate entry and live viewer", async ({
    StepAsync,
    createAutomationContext,
    gameplayPage,
    landingPage,
    multiplayerModalPage,
  }) => {
    const joinerSession = await MultiplayerBrowserSession.create(createAutomationContext);
    const spectatorSession = await MultiplayerBrowserSession.create(createAutomationContext);

    try {
      let matchId = "";

      await StepAsync("Create and join a multiplayer match so it becomes active", async () => {
        await landingPage.goto();
        await landingPage.openMultiplayer();
        await multiplayerModalPage.fillPlayerName("Host Player");
        await multiplayerModalPage.fillGameName("Spectate Flow Match");
        await multiplayerModalPage.submitCreate();
        await gameplayPage.expectLoaded();
        matchId = (await gameplayPage.matchIdText.textContent())?.trim() ?? "";

        await joinerSession.landingPage.goto();
        await joinerSession.landingPage.openMultiplayer();
        await joinerSession.multiplayerModalPage.switchToJoin();
        await joinerSession.multiplayerModalPage.joinGame(matchId);
        await joinerSession.gameplayPage.expectLoaded();
      });

      await StepAsync("Enter spectator discovery from the dedicated landing-page flow", async () => {
        await spectatorSession.landingPage.goto();
        await spectatorSession.landingPage.openSpectate();
        await spectatorSession.multiplayerModalPage.expectSpectateView();
        await spectatorSession.multiplayerModalPage.expectPlayerNameHidden();
        await spectatorSession.multiplayerModalPage.expectActiveGameVisible(matchId);
      });

      await StepAsync("Open spectator gameplay from the active-game list", async () => {
        await spectatorSession.multiplayerModalPage.spectateGame(matchId);
        await spectatorSession.gameplayPage.expectLoaded();
        await spectatorSession.gameplayPage.expectMultiplayerRoleText("You are spectating");
        await spectatorSession.gameplayPage.expectRefreshMatchVisible();
        await spectatorSession.gameplayPage.expectBoardReadOnly();
        await spectatorSession.gameplayPage.expectLiveSyncState("connected");
      });

      await StepAsync("Make a live move and verify the spectator session updates without refresh", async () => {
        await gameplayPage.playCell(0);
        await gameplayPage.expectCellValue(0, "X");
        await gameplayPage.expectStatusContains("Opponent turn (O)");

        await expect
          .poll(async () => await joinerSession.gameplayPage.cell(0).textContent())
          .toContain("X");
        await joinerSession.gameplayPage.expectStatusContains("Your turn (O)");

        await expect
          .poll(async () => await spectatorSession.gameplayPage.cell(0).textContent())
          .toContain("X");
        await spectatorSession.gameplayPage.expectStatusContains("Player O's turn");
      });
    } finally {
      await joinerSession.close();
      await spectatorSession.close();
    }
  });

  test("UI-012 multiplayer waiting host refresh to active", async ({
    StepAsync,
    createAutomationContext,
    gameplayPage,
    landingPage,
    multiplayerModalPage,
  }) => {
    const joinerSession = await MultiplayerBrowserSession.create(createAutomationContext);

    try {
      let matchId = "";

      await StepAsync("Create a waiting multiplayer game as the host", async () => {
        await landingPage.goto();
        await landingPage.openMultiplayer();
        await multiplayerModalPage.fillPlayerName("Host Player");
        await multiplayerModalPage.fillGameName("Waiting Refresh Match");
        await multiplayerModalPage.submitCreate();
        await gameplayPage.expectLoaded();
        await gameplayPage.expectStatusContains("Waiting for player O");
        await gameplayPage.expectMultiplayerStatusContains("waiting");
        await gameplayPage.expectBoardReadOnly();
        matchId = (await gameplayPage.matchIdText.textContent())?.trim() ?? "";
      });

      await StepAsync("Join the waiting game from another browser session", async () => {
        await joinerSession.landingPage.goto();
        await joinerSession.landingPage.openMultiplayer();
        await joinerSession.multiplayerModalPage.switchToJoin();
        await joinerSession.multiplayerModalPage.joinGame(matchId);
        await joinerSession.gameplayPage.expectLoaded();
        await joinerSession.gameplayPage.expectMultiplayerRoleText("You are player O");
      });

      await StepAsync("Refresh the host session into the active match state", async () => {
        await gameplayPage.clickRefreshMatch();
        await gameplayPage.expectMultiplayerStatusContains("active");
        await gameplayPage.expectMultiplayerRoleText("You are player X");
        await gameplayPage.expectStatusContains("Your turn (X)");
      });
    } finally {
      await joinerSession.close();
    }
  });
});
