import { ModalVisibilityStatus } from "./ModalVisibilityStatus";

/**
 * Game events raised by the code paths that cause them. These are edge-triggered notifications: an event is
 * raised at the moment a transition happens, and is never re-raised for a state that is merely still true.
 *
 * Emit sites follow one rule: a site emits only when it *is* the transition. A site that would have to inspect
 * state to decide whether a transition occurred is the wrong site.
 */
export enum GameEventType {
    // Game state, raised by Cycle
    TossupAnswered = "TOSSUP_ANSWERED",
    BonusPartAnswered = "BONUS_PART_ANSWERED",
    PlayerJoined = "PLAYER_JOINED",
    TossupThrownOut = "TOSSUP_THROWN_OUT",
    BonusThrownOut = "BONUS_THROWN_OUT",
    TossupAnswerRemoved = "TOSSUP_ANSWER_REMOVED",

    // UI shell, raised by UIState and DialogState
    BuzzMenuOpened = "BUZZ_MENU_OPENED",
    DialogOpened = "DIALOG_OPENED",

    // Cycle navigation. CycleTo is agnostic and fires on every path, including resets; the others identify
    // which path was taken and are raised alongside it.
    CycleTo = "CYCLE_TO",
    NextQuestion = "NEXT_QUESTION",
    PreviousQuestion = "PREVIOUS_QUESTION",
    JumpToQuestion = "JUMP_TO_QUESTION",
    ClickLogTo = "CLICK_LOG_TO",

    // Transitions owned by the dialogs that perform them
    PacketLoaded = "PACKET_LOADED",
    GameStarted = "GAME_STARTED",
}

export type GameEvent =
    | { type: GameEventType.TossupAnswered; correct: boolean }
    | { type: GameEventType.BonusPartAnswered; partIndex: number }
    | { type: GameEventType.PlayerJoined }
    | { type: GameEventType.TossupThrownOut }
    | { type: GameEventType.BonusThrownOut }
    | { type: GameEventType.TossupAnswerRemoved }
    | { type: GameEventType.BuzzMenuOpened }
    | { type: GameEventType.DialogOpened; dialog: ModalVisibilityStatus }
    | { type: GameEventType.CycleTo; from: number; to: number }
    | { type: GameEventType.NextQuestion }
    | { type: GameEventType.PreviousQuestion }
    | { type: GameEventType.JumpToQuestion }
    | { type: GameEventType.ClickLogTo }
    | { type: GameEventType.PacketLoaded }
    | { type: GameEventType.GameStarted };

/**
 * A synchronous, in-process notification channel for game events. Deliberately minimal: no priorities, no async
 * delivery, no wildcard subscription, no replay buffer.
 *
 * This is NOT a MobX observable, and instances of it must never be made observable or persisted. See the
 * `@ignore` annotations on every field that holds one.
 */
export class GameEventBus {
    private handlers: ((event: GameEvent) => void)[] = [];

    public subscribe(handler: (event: GameEvent) => void): () => void {
        this.handlers.push(handler);

        return () => {
            this.handlers = this.handlers.filter((existing) => existing !== handler);
        };
    }

    public emit(event: GameEvent): void {
        // Iterate a copy so a handler that subscribes or unsubscribes during delivery cannot disturb this pass.
        for (const handler of [...this.handlers]) {
            handler(event);
        }
    }
}
