import { expect } from "chai";

import { TutorialState } from "src/state/TutorialState";
import { GameState } from "src/state/GameState";
import { UIState } from "src/state/UIState";
import { ITutorialDefinition } from "src/state/tutorials/ITutorialDefinition";

const sequenceStepTutorial: ITutorialDefinition = {
    title: "Test",
    description: "Test",
    steps: [
        {
            multi: "SEQUENCE",
            targets: [{ target: undefined, title: "Step 1", text: "Text 1", waitFor: "NEXT_CLICK" }],
        },
        {
            multi: "SEQUENCE",
            targets: [
                { target: "a", title: "A", text: "Text A", waitFor: "NEXT_CLICK" },
                { target: "b", title: "B", text: "Text B", waitFor: "NEXT_CLICK" },
            ],
        },
    ],
};

const branchStepTutorial: ITutorialDefinition = {
    title: "Test",
    description: "Test",
    steps: [
        {
            multi: "BRANCH",
            targets: [
                { target: "correct", title: "Correct", text: "Correct text", waitFor: "TOSSUP_ANSWERED_CORRECT" },
                { target: "wrong", title: "Wrong", text: "Wrong text", waitFor: "TOSSUP_ANSWERED_WRONG" },
            ],
        },
    ],
};

describe("TutorialStateTests", () => {
    it("starts inactive with its own GameState instance", () => {
        const tutorialState = new TutorialState(new UIState());

        expect(tutorialState.isActive).to.equal(false);
        expect(tutorialState.practiceGame).to.be.instanceOf(GameState);
    });

    describe("start", () => {
        it("activates the tutorial and resets to the first step and entry", () => {
            const tutorialState = new TutorialState(new UIState());

            tutorialState.start(sequenceStepTutorial);

            expect(tutorialState.isActive).to.equal(true);
            expect(tutorialState.activeTutorial).to.equal(sequenceStepTutorial);
            expect(tutorialState.stepIndex).to.equal(0);
            expect(tutorialState.targetEntryIndex).to.equal(0);
            expect(tutorialState.currentStep).to.equal(sequenceStepTutorial.steps[0]);
            expect(tutorialState.currentTarget).to.equal(sequenceStepTutorial.steps[0].targets[0]);
        });

        it("gives the practice game fresh state on every start", () => {
            const tutorialState = new TutorialState(new UIState());
            const firstGame = tutorialState.practiceGame;

            tutorialState.start(sequenceStepTutorial);

            expect(tutorialState.practiceGame).to.not.equal(firstGame);
        });

        it("resets uiState.cycleIndex to 0, and end() restores the saved value", () => {
            const uiState = new UIState();
            uiState.setCycleIndex(5);
            const tutorialState = new TutorialState(uiState);

            tutorialState.start(sequenceStepTutorial);

            expect(uiState.cycleIndex).to.equal(0);

            tutorialState.end();

            expect(uiState.cycleIndex).to.equal(5);
        });

        it("keeps the original saved cycle index when a second tutorial starts mid-tutorial", () => {
            const uiState = new UIState();
            uiState.setCycleIndex(5);
            const tutorialState = new TutorialState(uiState);

            tutorialState.start(sequenceStepTutorial);
            tutorialState.start(branchStepTutorial);
            tutorialState.end();

            expect(uiState.cycleIndex).to.equal(5);
        });
    });

    describe("advance (SEQUENCE)", () => {
        it("moves to the next target entry within a multi-entry step", () => {
            const tutorialState = new TutorialState(new UIState());
            tutorialState.start(sequenceStepTutorial);
            tutorialState.advance(); // finishes step 0's only entry, moves to step 1 entry 0

            expect(tutorialState.stepIndex).to.equal(1);
            expect(tutorialState.targetEntryIndex).to.equal(0);

            tutorialState.advance(); // finishes step 1 entry 0, moves to step 1 entry 1

            expect(tutorialState.stepIndex).to.equal(1);
            expect(tutorialState.targetEntryIndex).to.equal(1);
        });

        it("ends the tutorial after advancing past the last entry of the last step", () => {
            const tutorialState = new TutorialState(new UIState());
            tutorialState.start(sequenceStepTutorial);
            tutorialState.advance();
            tutorialState.advance();
            tutorialState.advance();

            expect(tutorialState.isActive).to.equal(false);
        });

        it("restores uiState.cycleIndex when advancing past the last entry auto-ends the tutorial", () => {
            const uiState = new UIState();
            uiState.setCycleIndex(5);
            const tutorialState = new TutorialState(uiState);
            tutorialState.start(sequenceStepTutorial);
            tutorialState.advance();
            tutorialState.advance();
            tutorialState.advance();

            expect(tutorialState.isActive).to.equal(false);
            expect(uiState.cycleIndex).to.equal(5);
        });
    });

    describe("back", () => {
        it("moves back to the previous step's first entry", () => {
            const tutorialState = new TutorialState(new UIState());
            tutorialState.start(sequenceStepTutorial);
            tutorialState.advance();

            tutorialState.back();

            expect(tutorialState.stepIndex).to.equal(0);
            expect(tutorialState.targetEntryIndex).to.equal(0);
        });

        it("does nothing at the first step", () => {
            const tutorialState = new TutorialState(new UIState());
            tutorialState.start(sequenceStepTutorial);

            tutorialState.back();

            expect(tutorialState.stepIndex).to.equal(0);
        });
    });

    describe("BRANCH steps", () => {
        it("selectBranchEntry resolves the step to the chosen entry and advancing completes the step", () => {
            const tutorialState = new TutorialState(new UIState());
            tutorialState.start(branchStepTutorial);

            expect(tutorialState.currentTarget).to.equal(branchStepTutorial.steps[0].targets[0]);

            tutorialState.selectBranchEntry(1);

            expect(tutorialState.currentTarget).to.equal(branchStepTutorial.steps[0].targets[1]);

            tutorialState.advance();

            expect(tutorialState.isActive).to.equal(false);
        });
    });

    describe("end", () => {
        it("deactivates the tutorial and clears activeTutorial", () => {
            const tutorialState = new TutorialState(new UIState());
            tutorialState.start(sequenceStepTutorial);

            tutorialState.end();

            expect(tutorialState.isActive).to.equal(false);
            expect(tutorialState.activeTutorial).to.be.undefined;
        });

        it("hides the buzz menu", () => {
            const uiState = new UIState();
            const tutorialState = new TutorialState(uiState);
            tutorialState.start(sequenceStepTutorial);
            uiState.showBuzzMenu(true);

            tutorialState.end();

            expect(uiState.buzzMenuState.visible).to.equal(false);
        });
    });
});
