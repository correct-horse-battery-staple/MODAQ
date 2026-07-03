import { expect } from "chai";

import { AppState } from "src/state/AppState";
import { GameState } from "src/state/GameState";

describe("AppStateTests", () => {
    describe("activeGame", () => {
        it("resolves to game when no tutorial is active", () => {
            const appState = new AppState();

            expect(appState.activeGame).to.equal(appState.game);
        });

        it("resolves to the tutorial's practice game while a tutorial is active", () => {
            const appState = new AppState();

            appState.tutorialState.isActive = true;

            expect(appState.activeGame).to.equal(appState.tutorialState.practiceGame);
            expect(appState.activeGame).to.not.equal(appState.game);
        });

        it("leaves game unchanged (same reference) after a tutorial starts and ends", () => {
            const appState = new AppState();
            const originalGame: GameState = appState.game;

            appState.tutorialState.isActive = true;
            appState.tutorialState.isActive = false;

            expect(appState.game).to.equal(originalGame);
        });
    });
});
