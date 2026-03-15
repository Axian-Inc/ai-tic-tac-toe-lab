import { expect, test } from "@playwright/test";

const optionLabels = ["X", "O", "Random"] as const;

type OptionLabel = (typeof optionLabels)[number];

async function resolveOptionLocator(page: import("@playwright/test").Page, label: OptionLabel) {
  const exact = new RegExp(`^${label}$`, "i");
  const radio = page.getByRole("radio", { name: exact });
  if ((await radio.count()) > 0) {
    return radio.first();
  }

  const button = page.getByRole("button", { name: exact });
  if ((await button.count()) > 0) {
    return button.first();
  }

  throw new Error(`Could not find a radio or button control for option: ${label}`);
}

async function isOptionSelected(locator: import("@playwright/test").Locator) {
  const ariaChecked = await locator.getAttribute("aria-checked");
  if (ariaChecked !== null) {
    return ariaChecked === "true";
  }

  const ariaPressed = await locator.getAttribute("aria-pressed");
  if (ariaPressed !== null) {
    return ariaPressed === "true";
  }

  throw new Error(
    "Option is missing aria-checked or aria-pressed. Provide a semantic state for selection.",
  );
}

function playerMarkLocator(page: import("@playwright/test").Page) {
  return page.getByTestId("player-mark");
}

function cpuMarkLocator(page: import("@playwright/test").Page) {
  return page.getByTestId("cpu-mark");
}

function normalizeMark(markText: string | null) {
  if (!markText) {
    return "";
  }

  return markText.trim().toUpperCase();
}

test.describe("TTT-64 Landing mark selection", () => {
  test("Scenario 1: select X", async ({ page }) => {
    await page.goto("/");

    const xOption = await resolveOptionLocator(page, "X");
    await xOption.click();

    await page.getByRole("button", { name: /play vs cpu/i }).click();

    await expect(playerMarkLocator(page)).toBeVisible();
    await expect(playerMarkLocator(page)).toHaveText(/X/i);
  });

  test("Scenario 2: select O", async ({ page }) => {
    await page.goto("/");

    const oOption = await resolveOptionLocator(page, "O");
    await oOption.click();

    await page.getByRole("button", { name: /play vs cpu/i }).click();

    await expect(playerMarkLocator(page)).toBeVisible();
    await expect(playerMarkLocator(page)).toHaveText(/O/i);
  });

  test("Scenario 3: select Random", async ({ page }) => {
    await page.goto("/");

    const randomOption = await resolveOptionLocator(page, "Random");
    await randomOption.click();

    await page.getByRole("button", { name: /play vs cpu/i }).click();

    await expect(playerMarkLocator(page)).toBeVisible();
    const playerMark = normalizeMark(await playerMarkLocator(page).textContent());
    expect(["X", "O"]).toContain(playerMark);
  });

  test("Scenario 6: landing UI baseline", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /play vs cpu/i })).toBeVisible();

    for (const label of optionLabels) {
      const option = await resolveOptionLocator(page, label);
      await expect(option).toBeVisible();
    }

    const selections = await Promise.all(
      optionLabels.map(async (label) => isOptionSelected(await resolveOptionLocator(page, label))),
    );
    expect(selections.filter(Boolean).length).toBe(1);
  });

  test("Scenario 7: selection change before start", async ({ page }) => {
    await page.goto("/");

    const xOption = await resolveOptionLocator(page, "X");
    const oOption = await resolveOptionLocator(page, "O");

    await xOption.click();
    await oOption.click();

    expect(await isOptionSelected(oOption)).toBeTruthy();
    expect(await isOptionSelected(xOption)).toBeFalsy();
  });

  test("Scenario 8: keyboard operability", async ({ page }) => {
    await page.goto("/");

    const randomOption = await resolveOptionLocator(page, "Random");
    await randomOption.focus();
    await page.keyboard.press("Space");

    expect(await isOptionSelected(randomOption)).toBeTruthy();

    const playButton = page.getByRole("button", { name: /play vs cpu/i });
    await playButton.focus();
    await page.keyboard.press("Enter");
    await expect(playButton).toBeHidden();
  });

  test("Scenario 9: start game with explicit mark", async ({ page }) => {
    await page.goto("/");

    const xOption = await resolveOptionLocator(page, "X");
    await xOption.click();

    await page.getByRole("button", { name: /play vs cpu/i }).click();

    await expect(playerMarkLocator(page)).toBeVisible();
    await expect(cpuMarkLocator(page)).toBeVisible();

    await expect(playerMarkLocator(page)).toHaveText(/X/i);
    await expect(cpuMarkLocator(page)).toHaveText(/O/i);
  });

  test("Scenario 10: start game with Random", async ({ page }) => {
    await page.goto("/");

    const randomOption = await resolveOptionLocator(page, "Random");
    await randomOption.click();

    await page.getByRole("button", { name: /play vs cpu/i }).click();

    await expect(playerMarkLocator(page)).toBeVisible();
    await expect(cpuMarkLocator(page)).toBeVisible();

    const playerMark = normalizeMark(await playerMarkLocator(page).textContent());
    const cpuMark = normalizeMark(await cpuMarkLocator(page).textContent());

    expect(["X", "O"]).toContain(playerMark);
    expect(["X", "O"]).toContain(cpuMark);
    expect(playerMark).not.toBe(cpuMark);
  });

  test("Scenario 11: no console/runtime errors on start", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/");

    const xOption = await resolveOptionLocator(page, "X");
    await xOption.click();

    await page.getByRole("button", { name: /play vs cpu/i }).click();

    expect(errors).toHaveLength(0);
  });
});
