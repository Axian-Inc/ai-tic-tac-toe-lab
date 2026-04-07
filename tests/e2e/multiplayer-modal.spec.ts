import { expect, test } from "./fixtures/test-fixture";

test.describe("Phase 4 Multiplayer Modal", () => {
  const isRemoteCdp = process.env.UI_AUTOMATION_BROWSER_TARGET === "RemoteCDP";

  test.beforeEach(async ({ testSupportApi }) => {
    test.skip(
      process.env.UI_AUTOMATION_MODE !== "full",
      "Phase 4 multiplayer modal coverage requires frontend-plus-backend runtime."
    );

    await testSupportApi.reset();
  });

  test("UI-006 multiplayer modal and landing spectate entry paths", async ({
    StepAsync,
    landingPage,
    multiplayerModalPage,
    testSupportApi,
  }) => {
    test.skip(
      isRemoteCdp,
      "UI-006 remains skipped in RemoteCDP until host-browser multiplayer API reachability is resolved."
    );

    const activeGame = await testSupportApi.seedActiveGame();

    await StepAsync("Open the multiplayer modal from the landing page", async () => {
      await landingPage.goto();
      await landingPage.expectLoaded();
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.expectPlayerNameVisible();
      await expect(multiplayerModalPage.createTab).toBeVisible();
      await expect(multiplayerModalPage.joinTab).toBeVisible();
      await expect(multiplayerModalPage.spectateTab).toBeVisible();
    });

    await StepAsync("Close the modal with the close button", async () => {
      await multiplayerModalPage.close();
      await multiplayerModalPage.expectClosed();
      await landingPage.expectLoaded();
    });

    await StepAsync("Close the modal by clicking the backdrop", async () => {
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.closeByBackdrop();
      await multiplayerModalPage.expectClosed();
    });

    await StepAsync("Close the modal with the Escape key", async () => {
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.closeByEscape();
      await multiplayerModalPage.expectClosed();
    });

    await StepAsync("Open the dedicated landing-page spectate flow", async () => {
      await landingPage.openSpectate();
      await multiplayerModalPage.expectSpectateView();
      await multiplayerModalPage.expectPlayerNameHidden();
      await multiplayerModalPage.expectActiveGameVisible(activeGame.id);
    });
  });

  test("UI-007 multiplayer create validation and success", async ({
    StepAsync,
    gameplayPage,
    landingPage,
    multiplayerModalPage,
  }) => {
    test.skip(
      isRemoteCdp,
      "UI-007 remains skipped in RemoteCDP until host-browser multiplayer API reachability is resolved."
    );

    await StepAsync("Open the create view", async () => {
      await landingPage.goto();
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectCreateView();
    });

    await StepAsync("Validate blank player name handling", async () => {
      await multiplayerModalPage.fillPlayerName("");
      await multiplayerModalPage.fillGameName("Valid Match");
      await multiplayerModalPage.submitCreate();
      await multiplayerModalPage.expectErrorContains("Enter your player name");
    });

    await StepAsync("Validate blank game name handling", async () => {
      await multiplayerModalPage.fillPlayerName("Host Player");
      await multiplayerModalPage.fillGameName("");
      await multiplayerModalPage.submitCreate();
      await multiplayerModalPage.expectErrorContains("Enter a game name");
    });

    await StepAsync("Submit trimmed valid create values", async () => {
      await multiplayerModalPage.fillPlayerName("  Host Player  ");
      await multiplayerModalPage.fillGameName("  Friday Lunch Match  ");
      await multiplayerModalPage.submitCreate();
      await gameplayPage.expectLoaded();
      await gameplayPage.expectMultiplayerSessionVisible();
      await gameplayPage.expectMultiplayerRoleText("You are player X");
      await gameplayPage.expectMultiplayerStatusContains("waiting");
      await gameplayPage.expectRefreshMatchVisible();
      await gameplayPage.expectBoardReadOnly();
    });
  });

  test("UI-008 multiplayer create field boundaries", async ({
    StepAsync,
    gameplayPage,
    landingPage,
    multiplayerModalPage,
  }) => {
    test.skip(
      isRemoteCdp,
      "UI-008 remains skipped in RemoteCDP until host-browser multiplayer API reachability is resolved."
    );

    const maxPlayerName = "P".repeat(32);
    const overPlayerName = "P".repeat(33);
    const maxGameName = "G".repeat(48);
    const overGameName = "G".repeat(49);

    await StepAsync("Open the create view for boundary testing", async () => {
      await landingPage.goto();
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectCreateView();
    });

    await StepAsync("Create with the maximum valid player name length", async () => {
      await multiplayerModalPage.fillPlayerName(maxPlayerName);
      await multiplayerModalPage.fillGameName("Boundary Match");
      await multiplayerModalPage.submitCreate();
      await gameplayPage.expectLoaded();
      await gameplayPage.expectMultiplayerSessionVisible();
      await gameplayPage.clickQuit();
    });

    await StepAsync("Verify over-limit player names are blocked at the input", async () => {
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectCreateView();
      await multiplayerModalPage.fillPlayerName(overPlayerName);
      await expect(multiplayerModalPage.playerNameInput).toHaveValue(maxPlayerName);
    });

    await StepAsync("Create with the maximum valid game name length", async () => {
      await multiplayerModalPage.fillPlayerName("Boundary Host");
      await multiplayerModalPage.fillGameName(maxGameName);
      await multiplayerModalPage.submitCreate();
      await gameplayPage.expectLoaded();
      await gameplayPage.expectMultiplayerSessionVisible();
      await gameplayPage.clickQuit();
    });

    await StepAsync("Verify over-limit game names are blocked at the input", async () => {
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectCreateView();
      await multiplayerModalPage.fillGameName(overGameName);
      await expect(multiplayerModalPage.gameNameInput).toHaveValue(maxGameName);
    });
  });

  test("UI-009 multiplayer discovery empty state, refresh, and listings", async ({
    StepAsync,
    landingPage,
    multiplayerModalPage,
    testSupportApi,
  }) => {
    test.skip(
      isRemoteCdp,
      "UI-009 remains skipped in RemoteCDP until host-browser multiplayer API reachability is resolved."
    );

    await StepAsync("Open the join discovery view with no waiting or active games", async () => {
      await landingPage.goto();
      await landingPage.openMultiplayer();
      await multiplayerModalPage.switchToJoin();
      await multiplayerModalPage.expectJoinView();
      await multiplayerModalPage.expectEmptyStateContains("No multiplayer games are available");
    });

    await StepAsync("Refresh the empty discovery view", async () => {
      await multiplayerModalPage.clickRefresh();
      await multiplayerModalPage.expectJoinView();
      await multiplayerModalPage.expectEmptyStateContains("No multiplayer games are available");
    });

    await StepAsync("Refresh discovery after seeding waiting and active games", async () => {
      const waitingGame = await testSupportApi.seedWaitingGame();
      const activeGame = await testSupportApi.seedActiveGame();
      await multiplayerModalPage.clickRefresh();
      await multiplayerModalPage.expectWaitingGameVisible(waitingGame.id);
      await multiplayerModalPage.expectActiveGameVisible(activeGame.id);
      await expect(multiplayerModalPage.joinGameButton(waitingGame.id)).toBeVisible();
      await expect(multiplayerModalPage.spectateGameButton(waitingGame.id)).toBeVisible();
      await expect(multiplayerModalPage.spectateGameButton(activeGame.id)).toBeVisible();
    });
  });
});
