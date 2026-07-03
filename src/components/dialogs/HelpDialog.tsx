import React from "react";
import { observer } from "mobx-react-lite";
import { DialogFooter, PrimaryButton, Label, Link, Stack, StackItem } from "@fluentui/react";
import { AppState } from "../../state/AppState";
import { useAppState } from "../../contexts/StateContext";
import { ModalVisibilityStatus } from "../../state/ModalVisibilityStatus";
import { ModalDialog } from "./ModalDialog";
import { ITutorialDefinition } from "../../state/tutorials/ITutorialDefinition";
import { tutorialDefinitions } from "../../state/tutorials";

export const HelpDialog = observer(function HelpDialog(): JSX.Element {
    const appState: AppState = useAppState();
    const closeHandler = (): void => hideDialog(appState);

    return (
        <ModalDialog
            title="Help"
            visibilityStatus={ModalVisibilityStatus.Help}
            maxWidth="30vw"
            onDismiss={closeHandler}
        >
            <HelpDialogBody appState={appState} />
            <DialogFooter>
                <PrimaryButton text="Close" onClick={closeHandler} />
            </DialogFooter>
        </ModalDialog>
    );
});

const HelpDialogBody = observer(function HelpDialogBody(props: IHelpDialogBodyProps): JSX.Element {
    const appState: AppState = props.appState;
    const version: string | undefined = appState.uiState.buildVersion && `Version: ${appState.uiState.buildVersion}`;

    // Starting a tutorial must also close this dialog: keyboard shortcuts and the game UI the tutorial
    // anchors to are unavailable while a modal is open.
    const startTutorialHandler = (definition: ITutorialDefinition): void => {
        hideDialog(appState);
        appState.tutorialState.start(definition);
    };

    return (
        <Stack>
            <StackItem>
                <Label>{version}</Label>
            </StackItem>
            <StackItem>
                <Link href="https://github.com/alopezlago/MODAQ/wiki" target="_blank">
                    How to use MODAQ
                </Link>
            </StackItem>
            {tutorialDefinitions.length > 0 && (
                <StackItem>
                    <Label>Tutorials</Label>
                </StackItem>
            )}
            {tutorialDefinitions.map((definition) => (
                <StackItem key={`tutorial_${definition.title}`}>
                    <Link
                        {...{ "data-testid": `tutorial-${definition.title}` }}
                        title={definition.description}
                        onClick={() => startTutorialHandler(definition)}
                    >
                        {definition.title}
                    </Link>
                </StackItem>
            ))}
        </Stack>
    );
});

interface IHelpDialogBodyProps {
    appState: AppState;
}

// This is simple enough where we don't really need a controller for testing
function hideDialog(appState: AppState): void {
    appState.uiState.dialogState.hideModalDialog();
}
