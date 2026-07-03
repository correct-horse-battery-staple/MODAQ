import { TutorialTrigger } from "./TutorialTriggers";

export interface ITutorialStepTarget {
    target?: string;
    title: string;
    text: string;
    waitFor: TutorialTrigger;
}
