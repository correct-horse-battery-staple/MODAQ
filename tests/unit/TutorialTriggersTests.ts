import { expect } from "chai";

import { evaluateTutorialTrigger, isTutorialTrigger } from "src/state/tutorials/TutorialTriggers";
import { AppState } from "src/state/AppState";
import { Cycle } from "src/state/Cycle";
import { Player } from "src/state/TeamState";
import { PacketState, Tossup, Bonus } from "src/state/PacketState";
import * as GameFormats from "src/state/GameFormats";

function buildAppStateWithOneCycle(): AppState {
    const appState = new AppState();
    appState.game.setGameFormat(GameFormats.ACFGameFormat);

    const packet = new PacketState();
    packet.setTossups([new Tossup("question", "answer")]);
    packet.setBonuses([
        new Bonus("leadin", [
            { question: "part 1", answer: "answer 1", value: 10 },
            { question: "part 2", answer: "answer 2", value: 10 },
            { question: "part 3", answer: "answer 3", value: 10 },
        ]),
    ]);
    appState.game.loadPacket(packet);
    appState.game.setPlayers([new Player("Alice", "Team A", true), new Player("Bob", "Team B", true)]);

    return appState;
}

describe("TutorialTriggersTests", () => {
    describe("isTutorialTrigger", () => {
        it("accepts known trigger names", () => {
            expect(isTutorialTrigger("NEXT_CLICK")).to.equal(true);
            expect(isTutorialTrigger("BONUS_PART_ANSWERED")).to.equal(true);
        });

        it("rejects unknown trigger names", () => {
            expect(isTutorialTrigger("NOT_A_TRIGGER")).to.equal(false);
        });
    });

    describe("evaluateTutorialTrigger", () => {
        it("BUZZ_SELECTED is true once the buzz menu is visible", () => {
            const appState = buildAppStateWithOneCycle();

            expect(evaluateTutorialTrigger("BUZZ_SELECTED", appState, 0, 0)).to.equal(false);

            appState.uiState.showBuzzMenu(true);

            expect(evaluateTutorialTrigger("BUZZ_SELECTED", appState, 0, 0)).to.equal(true);
        });

        it("TOSSUP_ANSWERED_CORRECT is true once correctBuzz is set", () => {
            const appState = buildAppStateWithOneCycle();
            const cycle: Cycle = appState.activeGame.cycles[0];

            expect(evaluateTutorialTrigger("TOSSUP_ANSWERED_CORRECT", appState, 0, 0)).to.equal(false);

            cycle.correctBuzz = { tossupIndex: 0, marker: { player: appState.activeGame.players[0], position: 5, points: 10 } };

            expect(evaluateTutorialTrigger("TOSSUP_ANSWERED_CORRECT", appState, 0, 0)).to.equal(true);
            expect(evaluateTutorialTrigger("TOSSUP_ANSWERED_WRONG", appState, 0, 0)).to.equal(false);
        });

        it("TOSSUP_ANSWERED_WRONG is true once a wrong buzz is recorded", () => {
            const appState = buildAppStateWithOneCycle();
            const cycle: Cycle = appState.activeGame.cycles[0];

            cycle.wrongBuzzes = [
                { tossupIndex: 0, marker: { player: appState.activeGame.players[0], position: 5, points: -5 } },
            ];

            expect(evaluateTutorialTrigger("TOSSUP_ANSWERED_WRONG", appState, 0, 0)).to.equal(true);
            expect(evaluateTutorialTrigger("TOSSUP_ANSWERED_CORRECT", appState, 0, 0)).to.equal(false);
        });

        it("BONUS_PART_ANSWERED is false when no bonus answer exists at all", () => {
            const appState = buildAppStateWithOneCycle();

            expect(evaluateTutorialTrigger("BONUS_PART_ANSWERED", appState, 0, 0)).to.equal(false);
        });

        it("BONUS_PART_ANSWERED checks only the entry's own part index", () => {
            const appState = buildAppStateWithOneCycle();
            const cycle: Cycle = appState.activeGame.cycles[0];
            cycle.bonusAnswer = {
                bonusIndex: 0,
                receivingTeamName: "Team A",
                correctParts: [],
                parts: [
                    { teamName: "", points: 0 },
                    { teamName: "", points: 0 },
                    { teamName: "", points: 0 },
                ],
            };

            expect(evaluateTutorialTrigger("BONUS_PART_ANSWERED", appState, 0, 0)).to.equal(false);

            cycle.setBonusPartAnswer(0, "Team A", 10);

            expect(evaluateTutorialTrigger("BONUS_PART_ANSWERED", appState, 0, 0)).to.equal(true);
            expect(evaluateTutorialTrigger("BONUS_PART_ANSWERED", appState, 0, 1)).to.equal(false);
        });

        it("BONUS_ANSWERED is true only once every part is recorded", () => {
            const appState = buildAppStateWithOneCycle();
            const cycle: Cycle = appState.activeGame.cycles[0];
            cycle.bonusAnswer = {
                bonusIndex: 0,
                receivingTeamName: "Team A",
                correctParts: [],
                parts: [
                    { teamName: "", points: 0 },
                    { teamName: "", points: 0 },
                    { teamName: "", points: 0 },
                ],
            };

            cycle.setBonusPartAnswer(0, "Team A", 10);
            cycle.setBonusPartAnswer(1, "Team A", 0);

            expect(evaluateTutorialTrigger("BONUS_ANSWERED", appState, 0, 0)).to.equal(false);

            cycle.setBonusPartAnswer(2, "Team A", 10);

            expect(evaluateTutorialTrigger("BONUS_ANSWERED", appState, 0, 0)).to.equal(true);
        });

        it("NEXT_CYCLE is true once cycleIndex advances past the given baseline", () => {
            const appState = buildAppStateWithOneCycle();

            expect(evaluateTutorialTrigger("NEXT_CYCLE", appState, 0, 0)).to.equal(false);

            appState.uiState.setCycleIndex(1);

            expect(evaluateTutorialTrigger("NEXT_CYCLE", appState, 0, 0)).to.equal(true);
        });

        it("NEXT_CLICK always evaluates to false (advanced by direct user click, not state)", () => {
            const appState = buildAppStateWithOneCycle();

            expect(evaluateTutorialTrigger("NEXT_CLICK", appState, 0, 0)).to.equal(false);
        });
    });
});
