import BasicScoringSource from "./definitions/BasicScoring";
import { ITutorialDefinition } from "./ITutorialDefinition";
import { parseTutorial } from "./TutorialParser";

export const tutorialDefinitions: ITutorialDefinition[] = [parseTutorial(BasicScoringSource)];
