import { ITutorialStep } from "./ITutorialStep";

export interface ITutorialDefinition {
    title: string;
    description: string;
    steps: ITutorialStep[];
}
