import { AppState } from "../AppState";
import { Cycle } from "../Cycle";
import { GameState } from "../GameState";

export type TutorialTrigger =
    | "NEXT_CLICK"
    | "BUZZ_SELECTED"
    | "TOSSUP_ANSWERED"
    | "TOSSUP_ANSWERED_CORRECT"
    | "TOSSUP_ANSWERED_WRONG"
    | "BONUS_ANSWERED"
    | "BONUS_PART_ANSWERED"
    | "NEXT_CYCLE";

const allTutorialTriggers: readonly TutorialTrigger[] = [
    "NEXT_CLICK",
    "BUZZ_SELECTED",
    "TOSSUP_ANSWERED",
    "TOSSUP_ANSWERED_CORRECT",
    "TOSSUP_ANSWERED_WRONG",
    "BONUS_ANSWERED",
    "BONUS_PART_ANSWERED",
    "NEXT_CYCLE",
];

export function isTutorialTrigger(value: string): value is TutorialTrigger {
    return (allTutorialTriggers as readonly string[]).includes(value);
}

/**
 * Evaluates whether a tutorial trigger has fired.
 * - startCycleIndex: uiState.cycleIndex captured when the engine started watching (only NEXT_CYCLE uses it).
 * - entryIndexWithinStep: this entry's 0-based position among its step's targets (only BONUS_PART_ANSWERED uses it).
 */
export function evaluateTutorialTrigger(
    trigger: TutorialTrigger,
    appState: AppState,
    startCycleIndex: number,
    entryIndexWithinStep: number
): boolean {
    if (trigger === "NEXT_CLICK") {
        // No state predicate; TutorialState advances this directly when the user clicks Next.
        return false;
    }

    const game: GameState = appState.activeGame;
    const cycleIndex: number = appState.uiState.cycleIndex;
    const cycle: Cycle | undefined = game.cycles[cycleIndex];

    switch (trigger) {
        case "BUZZ_SELECTED":
            return appState.uiState.buzzMenuState.visible;
        case "TOSSUP_ANSWERED":
            return cycle?.correctBuzz != undefined || (cycle?.wrongBuzzes?.length ?? 0) > 0;
        case "TOSSUP_ANSWERED_CORRECT":
            return cycle?.correctBuzz != undefined;
        case "TOSSUP_ANSWERED_WRONG":
            return (cycle?.wrongBuzzes?.length ?? 0) > 0;
        case "BONUS_ANSWERED":
            return (
                cycle?.bonusAnswer != undefined && cycle.bonusAnswer.parts.every((part) => part.teamName !== "")
            );
        case "BONUS_PART_ANSWERED": {
            // Careful with the optional chain: if bonusAnswer (or the part) doesn't exist yet, the chain yields
            // undefined, and `undefined !== ""` is true — so an inequality check alone would fire the trigger
            // before the bonus even starts. Require a real, non-sentinel teamName.
            const partTeamName: string | undefined = cycle?.bonusAnswer?.parts[entryIndexWithinStep]?.teamName;
            return partTeamName != undefined && partTeamName !== "";
        }
        case "NEXT_CYCLE":
            return cycleIndex > startCycleIndex;
        default:
            return false;
    }
}
