import { expect, test } from "./fixtures/test-fixture";

test.describe("Phase 6 Multiplayer Errors", () => {
  const isRemoteCdp = process.env.UI_AUTOMATION_BROWSER_TARGET === "RemoteCDP";

  test.beforeEach(async ({ testSupportApi }) => {
    test.skip(
      process.env.UI_AUTOMATION_MODE !== "full",
      "Phase 6 multiplayer error coverage requires frontend-plus-backend runtime."
    );

    test.skip(
      isRemoteCdp,
      "Phase 6 remains skipped in RemoteCDP until host-browser multiplayer API reachability is resolved."
    );

    await testSupportApi.reset();
  });

  test("UI-019 multiplayer create capacity and API error handling", async ({
    StepAsync,
    gameplayPage,
    landingPage,
    multiplayerModalPage,
    testSupportApi,
  }) => {
    await StepAsync("Open the create flow while the backend is at capacity", async () => {
      await testSupportApi.seedCapacity(25);
      await landingPage.goto();
      await landingPage.expectLoaded();
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.expectCreateView();
      await multiplayerModalPage.expectPlayerNameVisible();
    });

    await StepAsync("Attempt to create one more game and verify the capacity error stays visible", async () => {
      await multiplayerModalPage.fillPlayerName("Capacity Host");
      await multiplayerModalPage.fillGameName("Capacity Match");
      await multiplayerModalPage.submitCreate();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.expectCreateView();
      await multiplayerModalPage.expectErrorContains(
        "The multiplayer service is at capacity. Try again later."
      );
      await expect(gameplayPage.root).toHaveCount(0);
      await expect(landingPage.root).toBeVisible();
    });

    await StepAsync("Force the create endpoint to fail and verify the modal remains usable", async () => {
      await testSupportApi.reset();
      await testSupportApi.forceFailure(
        "create",
        503,
        "Create is temporarily unavailable for automation."
      );

      await landingPage.goto();
      await landingPage.expectLoaded();
      await landingPage.openMultiplayer();
      await multiplayerModalPage.expectCreateView();
      await multiplayerModalPage.fillPlayerName("API Host");
      await multiplayerModalPage.fillGameName("API Failure Match");
      await multiplayerModalPage.submitCreate();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.expectCreateView();
      await multiplayerModalPage.expectErrorContains(
        "Create is temporarily unavailable for automation."
      );
      await expect(multiplayerModalPage.createSubmitButton).toBeVisible();
      await expect(multiplayerModalPage.createCancelButton).toBeVisible();
      await expect(gameplayPage.root).toHaveCount(0);
    });
  });

  test("UI-020 multiplayer discovery and gameplay refresh API errors", async ({
    StepAsync,
    gameplayPage,
    landingPage,
    multiplayerModalPage,
    testSupportApi,
  }) => {
    await StepAsync("Force discovery to fail in the join tab and keep the modal stable", async () => {
      await testSupportApi.forceFailure(
        "list",
        503,
        "Discovery is temporarily unavailable for automation."
      );

      await landingPage.goto();
      await landingPage.expectLoaded();
      await landingPage.openMultiplayer();
      await multiplayerModalPage.switchToJoin();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.expectJoinView();
      await multiplayerModalPage.expectErrorContains(
        "Discovery is temporarily unavailable for automation."
      );

      await multiplayerModalPage.clickRefresh();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.expectJoinView();
      await multiplayerModalPage.expectErrorContains(
        "Discovery is temporarily unavailable for automation."
      );
    });

    await StepAsync("Reuse the same discovery failure in the landing-page spectate flow", async () => {
      await landingPage.goto();
      await landingPage.expectLoaded();
      await landingPage.openSpectate();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.expectSpectateView();
      await multiplayerModalPage.expectErrorContains(
        "Discovery is temporarily unavailable for automation."
      );

      await multiplayerModalPage.clickRefresh();
      await multiplayerModalPage.expectOpen();
      await multiplayerModalPage.expectSpectateView();
      await multiplayerModalPage.expectErrorContains(
        "Discovery is temporarily unavailable for automation."
      );
    });

    await StepAsync("Open multiplayer gameplay before forcing detail refresh to fail", async () => {
      await testSupportApi.reset();
      const activeGame = await testSupportApi.seedActiveGame({
        id: "phase6-ui020-game",
        name: "Refresh Error Match",
      });

      await gameplayPage.page.goto(`/game?mode=multiplayer&gameId=${activeGame.id}&player=X`);
      await gameplayPage.expectLoaded();
      await gameplayPage.expectMultiplayerSessionVisible();
      await gameplayPage.expectMultiplayerRoleText("You are player X");
      await gameplayPage.expectMatchIdText(activeGame.id);
      await gameplayPage.expectGameplayErrorHidden();
      await gameplayPage.expectBoardCellCount(9);
      await gameplayPage.expectStatusContains("Your turn (X)");
    });

    await StepAsync("Click Refresh Match while detail requests are failing and keep gameplay stable", async () => {
      await testSupportApi.forceFailure(
        "detail",
        503,
        "Refresh is temporarily unavailable for automation."
      );

      await gameplayPage.clickRefreshMatch();
      await gameplayPage.expectLoaded();
      await gameplayPage.expectMultiplayerSessionVisible();
      await gameplayPage.expectMatchIdText("phase6-ui020-game");
      await gameplayPage.expectBoardCellCount(9);
      await gameplayPage.expectGameplayErrorContains(
        "Refresh is temporarily unavailable for automation."
      );
    });
  });
});
