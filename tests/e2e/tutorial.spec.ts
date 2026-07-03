import { test, expect } from "@playwright/test";
import { startGame, PLAYER_ALICE, TEAM_ALPHA } from "./game.fixture";

test.describe("Basic Scoring tutorial", () => {
    test("walks through buzzing, judging, and scoring a bonus, then restores the real game unchanged", async ({
        page,
    }) => {
        // 1. Start a real game and score the first tossup for Alice, so the real game has a nonzero
        //    score (10) that must survive the tutorial untouched.
        await startGame(page);
        await page.locator('[data-testid="word-0"]').click();
        await page.getByRole("menuitem", { name: PLAYER_ALICE }).click();
        // BuzzMenu.tsx sets canCheck: true on the Correct/Wrong items, so Fluent UI renders them
        // with role="menuitemcheckbox" rather than "menuitem".
        await page.getByRole("menuitemcheckbox", { name: /Correct/ }).click();
        await expect(page.getByText(new RegExp(`${TEAM_ALPHA}.*10`, "i")).first()).toBeVisible();

        // 2. Open the Help dialog and start "Basic Scoring" from its Tutorials section; the dialog closes
        //    itself and the practice game takes over the view — the real game above is never touched.
        await page.getByRole("menuitem", { name: "Help..." }).click();
        await page.locator('[data-testid="tutorial-Basic Scoring"]').click();
        await expect(page.getByRole("heading", { name: "Help" })).not.toBeVisible();

        // 3. Welcome step (untargeted): click Next.
        await expect(page.getByText("This tutorial walks you through scoring one full cycle")).toBeVisible();
        await page.getByRole("button", { name: "Next" }).click();

        // 4. Buzzing In step: the practice game's first word should be highlighted; click it.
        const firstWord = page.locator('[data-testid="word-0"]');
        await expect(firstWord).toHaveClass(/modaq-tutorial-highlight/);
        await firstWord.click();

        // 5. Judging the Answer (BRANCH): the buzz menu is open; pick the first practice player, mark Correct.
        await expect(page.getByText("A menu just opened next to the word")).toBeVisible();
        await page.getByRole("menuitem", { name: "Practice Player A1" }).click();
        await page.getByRole("menuitemcheckbox", { name: /Correct/ }).click();

        // 6. The CORRECT branch resolved: its text stays up with a Next button, and the WRONG branch's
        //    text is never shown. Click Next to complete the branch step.
        await expect(page.getByText("Marking it wrong before the question ends negs the player")).not.toBeVisible();
        await page.getByRole("button", { name: "Next" }).click();

        // 7. Scoring the Bonus (SEQUENCE): the word's highlight is gone; mark all three parts, confirming
        //    the highlight moves to each pending part in turn.
        await expect(firstWord).not.toHaveClass(/modaq-tutorial-highlight/);
        for (let partNumber = 1; partNumber <= 3; partNumber++) {
            const part = page.locator(`[data-testid="bonus-part-${partNumber}"]`);
            await expect(part).toHaveClass(/modaq-tutorial-highlight/);
            // Fluent UI's Checkbox renders the native <input> visually underneath its own checkmark <i>
            // inside a <label>; clicking the input's role locator directly fails ("label subtree
            // intercepts pointer events") because the icon, not the input, is the topmost element at
            // that point. The label is the element that actually receives/handles the click.
            await part.locator("label.ms-Checkbox-label").click();
        }

        // 8. All Done step (last step, NEXT_CLICK): the primary button reads Finish; clicking it ends the tutorial.
        await page.getByRole("button", { name: "Finish" }).click();

        // 9. Back on the real game: same teams, score still 10, and the practice game's teams are gone.
        await expect(page.getByText(TEAM_ALPHA).first()).toBeVisible();
        await expect(page.getByText(new RegExp(`${TEAM_ALPHA}.*10`, "i")).first()).toBeVisible();
        await expect(page.getByText("Team A", { exact: true })).not.toBeVisible();
    });
});
