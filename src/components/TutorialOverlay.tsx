import * as React from "react";
import { observer } from "mobx-react-lite";
import { DefaultButton, DirectionalHint, ITeachingBubbleProps, PrimaryButton, TeachingBubble } from "@fluentui/react";

import { useAppState } from "../contexts/StateContext";
import { AppState } from "../state/AppState";
import { ITutorialStep } from "../state/tutorials/ITutorialStep";
import { ITutorialStepTarget } from "../state/tutorials/ITutorialStepTarget";
import { evaluateTutorialTrigger } from "../state/tutorials/TutorialTriggers";
import { TutorialState } from "../state/TutorialState";

const highlightClassName = "modaq-tutorial-highlight";

function injectHighlightStyleOnce(): void {
    if (document.getElementById("modaq-tutorial-highlight-style") != null) {
        return;
    }

    const style = document.createElement("style");
    style.id = "modaq-tutorial-highlight-style";
    style.textContent = `
.${highlightClassName} {
    outline: 3px solid var(--modaq-tutorial-highlight-color, #0078d4);
    outline-offset: 2px;
    animation: modaq-tutorial-pulse 1.4s ease-in-out infinite;
}

@keyframes modaq-tutorial-pulse {
    0% { outline-color: var(--modaq-tutorial-highlight-color, #0078d4); }
    50% { outline-color: transparent; }
    100% { outline-color: var(--modaq-tutorial-highlight-color, #0078d4); }
}

@media (prefers-reduced-motion: reduce) {
    .${highlightClassName} {
        animation: none;
    }
}
`;
    document.head.appendChild(style);
}

function getEntryTargetKeys(step: ITutorialStep): string[] {
    return step.targets.map((entry) => entry.target).filter((key): key is string => key != undefined);
}

export const TutorialOverlay = observer(function TutorialOverlay(): JSX.Element {
    const appState: AppState = useAppState();
    const tutorialState: TutorialState = appState.tutorialState;

    const step: ITutorialStep | undefined = tutorialState.currentStep;
    const target: ITutorialStepTarget | undefined = tutorialState.currentTarget;

    // Hooks must run unconditionally on every render (Rules of Hooks), so all of them live above the early
    // returns below, and internally no-op when there's no active step/target to watch.

    // Captures the cycle index NEXT_CYCLE compares against; reset whenever the active step/entry changes.
    const startCycleIndexRef = React.useRef<number>(appState.uiState.cycleIndex);
    React.useEffect(() => {
        startCycleIndexRef.current = appState.uiState.cycleIndex;
    }, [tutorialState.stepIndex, tutorialState.targetEntryIndex]);

    // Reactive trigger evaluation: reading appState.activeGame/uiState here (inside this observer component)
    // means TutorialOverlay re-renders whenever the relevant game state changes, so this is always current —
    // no separate mobx `reaction()` needed, the component's own re-render IS the watch.
    const isBranch: boolean = step?.multi === "BRANCH" && tutorialState.branchResolvedEntryIndex == undefined;
    let firedEntryIndex: number | undefined;
    if (step != undefined) {
        if (isBranch) {
            const index: number = step.targets.findIndex((entry, entryIndex) =>
                evaluateTutorialTrigger(entry.waitFor, appState, startCycleIndexRef.current, entryIndex)
            );
            firedEntryIndex = index >= 0 ? index : undefined;
        } else if (
            step.multi !== "BRANCH" &&
            target != undefined &&
            evaluateTutorialTrigger(target.waitFor, appState, startCycleIndexRef.current, tutorialState.targetEntryIndex)
        ) {
            // The BRANCH exclusion matters: once a BRANCH step is resolved, its winning entry's trigger is
            // (by definition) already true, so re-evaluating it here would advance the step instantly and the
            // user would never see the branch text. Resolved BRANCH steps advance only via the Next button.
            firedEntryIndex = tutorialState.targetEntryIndex;
        }
    }

    React.useEffect(() => {
        if (firedEntryIndex == undefined) {
            return;
        }

        if (isBranch) {
            // Only resolve the branch — don't advance. The winning entry's TITLE/TEXT stays on screen with a
            // Next button (see showNextButton below), and clicking Next completes the step. Advancing here
            // would blow past the branch text before the user could read it.
            tutorialState.selectBranchEntry(firedEntryIndex);
        } else {
            tutorialState.advance();
        }
        // isBranch/tutorialState are stable/derived every render; only re-fire this effect when the trigger
        // itself flips from not-fired to fired.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firedEntryIndex]);

    React.useEffect(() => {
        injectHighlightStyleOnce();

        if (!tutorialState.isActive || step == undefined) {
            return;
        }

        const keysToHighlight: string[] =
            step.multi === "BRANCH" && tutorialState.branchResolvedEntryIndex == undefined
                ? getEntryTargetKeys(step)
                : target?.target != undefined
                ? [target.target]
                : [];

        const highlightedElements: HTMLElement[] = keysToHighlight
            .map((key) => document.querySelector<HTMLElement>(`[data-testid="${key}"]`))
            .filter((element): element is HTMLElement => element != null);

        for (const element of highlightedElements) {
            element.classList.add(highlightClassName);
        }

        return () => {
            for (const element of highlightedElements) {
                element.classList.remove(highlightClassName);
            }
        };
    }, [tutorialState.isActive, tutorialState.stepIndex, tutorialState.targetEntryIndex, tutorialState.branchResolvedEntryIndex, step, target]);

    if (!tutorialState.isActive || step == undefined || target == undefined) {
        return <></>;
    }

    const targetElement: HTMLElement | null =
        target.target != undefined
            ? document.querySelector(`[data-testid="${target.target}"]`)
            : null;

    if (target.target != undefined && targetElement == null) {
        // eslint-disable-next-line no-console
        console.warn(`Tutorial target "${target.target}" was not found in the DOM; showing an untargeted callout.`);
    }

    const teachingBubbleProps: ITeachingBubbleProps = {
        headline: target.title,
        hasCloseButton: false,
        // The bubble must never take (or reclaim) focus on mount/re-anchor: stealing focus dismisses the
        // buzz menu the user is being told to use. Three independent Fluent focus behaviors have to be
        // disabled together, or any one of them alone re-steals focus from the open ContextualMenu:
        //   - Callout's own useAutoFocus (calloutProps.setInitialFocus, default true) focuses the callout
        //     on mount.
        //   - TeachingBubbleContent's inner FocusTrapZone also focuses its first child on mount
        //     (focusTrapZoneProps.disableFirstFocus, default false) independently of the callout setting.
        //   - That same FocusTrapZone additionally installs a window-level capturing "focus" listener
        //     (active whenever focusTrapZoneProps.forceFocusInsideTrap is true, its default) that yanks
        //     focus back inside the bubble every time focus moves anywhere outside it - not just on
        //     mount - which is what fights the ContextualMenu for focus after the menu opens.
        calloutProps: { directionalHint: DirectionalHint.bottomAutoEdge, setInitialFocus: false },
        focusTrapZoneProps: { disableFirstFocus: true, forceFocusInsideTrap: false },
        target: targetElement ?? undefined,
    };

    const branchResolved: boolean = step.multi === "BRANCH" && tutorialState.branchResolvedEntryIndex != undefined;
    const isLastStep: boolean = tutorialState.stepIndex === (tutorialState.activeTutorial?.steps.length ?? 0) - 1;
    const isLastEntry: boolean =
        step.multi === "BRANCH" ? branchResolved : tutorialState.targetEntryIndex === step.targets.length - 1;
    const showNextButton: boolean = target.waitFor === "NEXT_CLICK" || branchResolved;

    return (
        <TeachingBubble {...teachingBubbleProps}>
            <p>{target.text}</p>
            <DefaultButton
                text="Back"
                disabled={tutorialState.stepIndex === 0}
                onClick={() => tutorialState.back()}
            />
            {showNextButton && (
                <PrimaryButton
                    text={isLastStep && isLastEntry ? "Finish" : "Next"}
                    onClick={() => tutorialState.advance()}
                />
            )}
            <DefaultButton text="End Tutorial" onClick={() => tutorialState.end()} />
        </TeachingBubble>
    );
});
