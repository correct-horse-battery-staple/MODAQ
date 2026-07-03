import { ITutorialDefinition } from "./ITutorialDefinition";
import { ITutorialStep, TutorialStepMulti } from "./ITutorialStep";
import { ITutorialStepTarget } from "./ITutorialStepTarget";
import { isTutorialTrigger, TutorialTrigger } from "./TutorialTriggers";

export function parseTutorial(source: string): ITutorialDefinition {
    const lines: string[] = source.split("\n").map((line) => line.trimEnd());

    const titleLine: string | undefined = lines.find((line) => line.trim().length > 0);
    if (titleLine == undefined || !titleLine.startsWith("TUTORIAL:")) {
        throw new Error("Tutorial definition must start with a TUTORIAL: line");
    }

    const titleLineIndex: number = lines.indexOf(titleLine);
    const descriptionLine: string | undefined = lines[titleLineIndex + 1];
    if (descriptionLine == undefined || !descriptionLine.startsWith("DESCRIPTION:")) {
        throw new Error("Tutorial definition must have a DESCRIPTION: line immediately after TUTORIAL:");
    }

    const title: string = titleLine.substring("TUTORIAL:".length).trim();
    const description: string = descriptionLine.substring("DESCRIPTION:".length).trim();

    const bodyLines: string[] = lines.slice(titleLineIndex + 2);
    const stepBlocks: string[][] = splitOnMarker(bodyLines, "STEP").filter(
        (block) => block.some((line) => line.trim().length > 0)
    );

    if (stepBlocks.length === 0) {
        throw new Error("Tutorial definition must have at least one STEP block");
    }

    const steps: ITutorialStep[] = stepBlocks.map((block, stepIndex) => parseStep(block, stepIndex));

    return { title, description, steps };
}

/** Splits lines into blocks starting at (and excluding) each line exactly equal to `marker`. */
function splitOnMarker(lines: string[], marker: string): string[][] {
    const blocks: string[][] = [];
    let current: string[] | undefined;

    for (const line of lines) {
        if (line.trim() === marker) {
            current = [];
            blocks.push(current);
        } else if (current != undefined) {
            current.push(line);
        }
    }

    return blocks;
}

function parseStep(lines: string[], stepIndex: number): ITutorialStep {
    const nonBlank: string[] = lines.filter((line) => line.trim().length > 0);

    let multi: TutorialStepMulti = "SEQUENCE";
    let multiWasExplicit = false;
    let remaining: string[] = lines;
    if (nonBlank.length > 0 && nonBlank[0].startsWith("MULTI:")) {
        const multiValue: string = nonBlank[0].substring("MULTI:".length).trim();
        if (multiValue !== "SEQUENCE" && multiValue !== "BRANCH") {
            throw new Error(`Tutorial parse error (step ${stepIndex}): unrecognized MULTI value "${multiValue}"`);
        }

        multi = multiValue;
        multiWasExplicit = true;
        const multiLineIndex: number = lines.findIndex((line) => line.trim().startsWith("MULTI:"));
        remaining = lines.slice(multiLineIndex + 1);
    }

    // splitOnMarker requires an exact-match marker line, but TARGET: lines carry a value after the colon, so
    // find entry boundaries manually instead of reusing splitOnMarker here.
    const targetLineIndexes: number[] = remaining
        .map((line, index) => (line.trim().startsWith("TARGET:") ? index : -1))
        .filter((index) => index >= 0);

    let entries: string[][];
    if (targetLineIndexes.length === 0) {
        entries = [remaining];
    } else {
        entries = targetLineIndexes.map((start, i) => {
            const end: number = i + 1 < targetLineIndexes.length ? targetLineIndexes[i + 1] : remaining.length;
            return remaining.slice(start, end);
        });

        // The DSL allows a step's FIRST entry to be untargeted even when later entries have TARGET: lines,
        // so content before the first TARGET: line is that untargeted first entry - not junk to discard.
        const leading: string[] = remaining.slice(0, targetLineIndexes[0]);
        if (leading.some((line) => line.trim().length > 0)) {
            entries.unshift(leading);
        }
    }

    const targets: ITutorialStepTarget[] = entries.map((entry, entryIndex) =>
        parseTargetEntry(entry, stepIndex, entryIndex)
    );

    if (multiWasExplicit && targets.length < 2) {
        throw new Error(
            `Tutorial parse error (step ${stepIndex}): MULTI requires at least 2 target entries, found ${targets.length}`
        );
    }

    return { multi, targets };
}

function parseTargetEntry(lines: string[], stepIndex: number, entryIndex: number): ITutorialStepTarget {
    let target: string | undefined;
    let title: string | undefined;
    let text: string | undefined;
    let waitFor: TutorialTrigger | undefined;

    let index = 0;
    while (index < lines.length) {
        const line: string = lines[index];
        const trimmed: string = line.trim();

        if (trimmed.length === 0) {
            index++;
            continue;
        } else if (trimmed.startsWith("TARGET:")) {
            const targetValue: string = trimmed.substring("TARGET:".length).trim();
            target = targetValue.length === 0 ? undefined : targetValue;
            index++;
        } else if (trimmed.startsWith("TITLE:")) {
            title = trimmed.substring("TITLE:".length).trim();
            index++;
        } else if (trimmed.startsWith("TEXT:")) {
            const textLines: string[] = [trimmed.substring("TEXT:".length).trim()];
            index++;
            while (index < lines.length && !isKeyLine(lines[index])) {
                if (lines[index].trim().length > 0) {
                    textLines.push(lines[index].trim());
                }
                index++;
            }
            text = textLines.join("\n");
        } else if (trimmed.startsWith("WAIT_FOR:")) {
            const waitForValue: string = trimmed.substring("WAIT_FOR:".length).trim();
            if (!isTutorialTrigger(waitForValue)) {
                throw new Error(
                    `Tutorial parse error (step ${stepIndex}, entry ${entryIndex}): unrecognized WAIT_FOR value "${waitForValue}"`
                );
            }

            waitFor = waitForValue;
            index++;
        } else {
            throw new Error(
                `Tutorial parse error (step ${stepIndex}, entry ${entryIndex}): unrecognized line "${line}"`
            );
        }
    }

    if (title == undefined) {
        throw new Error(`Tutorial parse error (step ${stepIndex}, entry ${entryIndex}): missing required TITLE`);
    } else if (text == undefined) {
        throw new Error(`Tutorial parse error (step ${stepIndex}, entry ${entryIndex}): missing required TEXT`);
    } else if (waitFor == undefined) {
        throw new Error(`Tutorial parse error (step ${stepIndex}, entry ${entryIndex}): missing required WAIT_FOR`);
    }

    return { target, title, text, waitFor };
}

function isKeyLine(line: string): boolean {
    const trimmed: string = line.trim();
    return (
        trimmed.startsWith("TARGET:") ||
        trimmed.startsWith("TITLE:") ||
        trimmed.startsWith("TEXT:") ||
        trimmed.startsWith("WAIT_FOR:")
    );
}
