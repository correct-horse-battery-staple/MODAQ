import { ITutorialStepTarget } from "./ITutorialStepTarget";

export type TutorialStepMulti = "SEQUENCE" | "BRANCH";

export interface ITutorialStep {
    multi: TutorialStepMulti;
    targets: ITutorialStepTarget[];
}
