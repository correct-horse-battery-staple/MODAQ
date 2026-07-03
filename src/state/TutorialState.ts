import { makeAutoObservable, observable } from "mobx";

import { createPracticeGame } from "./tutorials/PracticeGame";
import { GameState } from "./GameState";
import { ITutorialDefinition } from "./tutorials/ITutorialDefinition";
import { ITutorialStep } from "./tutorials/ITutorialStep";
import { ITutorialStepTarget } from "./tutorials/ITutorialStepTarget";
import { UIState } from "./UIState";

export class TutorialState {
    public isActive: boolean;

    public practiceGame: GameState;

    public activeTutorial: ITutorialDefinition | undefined;

    public stepIndex: number;

    public targetEntryIndex: number;

    public branchResolvedEntryIndex: number | undefined;

    public savedCycleIndex: number | undefined;

    private readonly uiState: UIState;

    constructor(uiState: UIState) {
        // activeTutorial is set from a plain, externally-owned ITutorialDefinition object. Use observable.ref so
        // MobX doesn't deep-convert it (and its nested steps/targets) into observable proxies, which would break
        // reference equality checks against the original definition object.
        makeAutoObservable<this, "uiState">(this, { activeTutorial: observable.ref, uiState: false });

        this.uiState = uiState;
        this.isActive = false;
        this.practiceGame = new GameState();
        this.activeTutorial = undefined;
        this.stepIndex = 0;
        this.targetEntryIndex = 0;
        this.branchResolvedEntryIndex = undefined;
        this.savedCycleIndex = undefined;
    }

    public get currentStep(): ITutorialStep | undefined {
        return this.activeTutorial?.steps[this.stepIndex];
    }

    public get currentTarget(): ITutorialStepTarget | undefined {
        const step: ITutorialStep | undefined = this.currentStep;
        if (step == undefined) {
            return undefined;
        }

        const index: number =
            step.multi === "BRANCH" && this.branchResolvedEntryIndex != undefined
                ? this.branchResolvedEntryIndex
                : this.targetEntryIndex;
        return step.targets[index];
    }

    public start(definition: ITutorialDefinition): void {
        // Only capture the moderator's position when coming from the real game; starting another tutorial
        // mid-tutorial would otherwise overwrite it with the practice game's index and lose their place.
        if (!this.isActive) {
            this.savedCycleIndex = this.uiState.cycleIndex;
        }

        this.uiState.setCycleIndex(0);

        this.practiceGame = createPracticeGame();
        this.activeTutorial = definition;
        this.stepIndex = 0;
        this.targetEntryIndex = 0;
        this.branchResolvedEntryIndex = undefined;
        this.isActive = true;
    }

    /** Called by TutorialOverlay once one of a BRANCH step's triggers fires. */
    public selectBranchEntry(entryIndex: number): void {
        this.branchResolvedEntryIndex = entryIndex;
    }

    public advance(): void {
        const step: ITutorialStep | undefined = this.currentStep;
        if (step == undefined) {
            return;
        }

        if (step.multi === "BRANCH") {
            this.goToNextStep();
            return;
        }

        if (this.targetEntryIndex + 1 < step.targets.length) {
            this.targetEntryIndex++;
            return;
        }

        this.goToNextStep();
    }

    public back(): void {
        if (this.stepIndex === 0) {
            return;
        }

        this.stepIndex--;
        this.targetEntryIndex = 0;
        this.branchResolvedEntryIndex = undefined;
    }

    public end(): void {
        this.isActive = false;
        this.activeTutorial = undefined;
        this.stepIndex = 0;
        this.targetEntryIndex = 0;
        this.branchResolvedEntryIndex = undefined;

        if (this.savedCycleIndex != undefined) {
            this.uiState.setCycleIndex(this.savedCycleIndex);
            this.savedCycleIndex = undefined;
        }

        this.uiState.hideBuzzMenu();
    }

    private goToNextStep(): void {
        const totalSteps: number = this.activeTutorial?.steps.length ?? 0;
        if (this.stepIndex + 1 < totalSteps) {
            this.stepIndex++;
            this.targetEntryIndex = 0;
            this.branchResolvedEntryIndex = undefined;
            return;
        }

        this.end();
    }
}
