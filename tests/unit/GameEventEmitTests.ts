import { assert, expect } from "chai";

import * as GameFormats from "src/state/GameFormats";
import * as QBJ from "src/qbj/QBJ";
import { AppState } from "src/state/AppState";
import { GameEvent, GameEventType } from "src/state/GameEventBus";
import { GameState } from "src/state/GameState";
import { IMatch } from "src/qbj/QBJ";
import { IResult } from "src/IResult";
import { ModalVisibilityStatus } from "src/state/ModalVisibilityStatus";
import { Bonus, PacketState, Tossup } from "src/state/PacketState";
import { Player } from "src/state/TeamState";
import { UIState } from "src/state/UIState";

// Subscribes to the app's bus and returns the array that collects every event raised from here on.
function recordEvents(appState: AppState): GameEvent[] {
    const events: GameEvent[] = [];
    appState.gameEventBus.subscribe((event) => events.push(event));
    return events;
}

// A two-player, two-question game whose cycles are wired to the app's bus.
function loadedAppState(): AppState {
    const appState: AppState = new AppState();
    appState.game.addNewPlayers([new Player("Alice", "Alpha", true), new Player("Bob", "Beta", true)]);

    const packet: PacketState = new PacketState();
    packet.setTossups([
        new Tossup("This is the first question", "Answer"),
        new Tossup("This is the second question", "Second answer"),
    ]);
    packet.setBonuses([
        new Bonus("First leadin", [{ question: "Part 1", answer: "A1", value: 10 }]),
        new Bonus("Second leadin", [{ question: "Part 1", answer: "A1", value: 10 }]),
    ]);

    appState.game.loadPacket(packet);
    return appState;
}

describe("GameEventEmitTests", () => {
    describe("BuzzMenuOpened", () => {
        it("showBuzzMenu emits BuzzMenuOpened", () => {
            const appState: AppState = new AppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.showBuzzMenu(false);

            expect(events.length).to.equal(1);
            expect(events[0].type).to.equal(GameEventType.BuzzMenuOpened);
        });

        it("hideBuzzMenu emits nothing", () => {
            const appState: AppState = new AppState();
            appState.uiState.showBuzzMenu(false);
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.hideBuzzMenu();

            expect(events.length).to.equal(0);
        });
    });

    describe("DialogOpened", () => {
        it("showNewGameDialog emits DialogOpened with NewGame", () => {
            const appState: AppState = new AppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.dialogState.showNewGameDialog();

            expect(events.length).to.equal(1);
            const event: GameEvent = events[0];
            if (event.type !== GameEventType.DialogOpened) {
                assert.fail("Expected a DialogOpened event");
            }

            expect(event.dialog).to.equal(ModalVisibilityStatus.NewGame);
        });

        it("showAddPlayerDialog emits DialogOpened with AddPlayer", () => {
            const appState: AppState = new AppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.dialogState.showAddPlayerDialog("Alpha");

            expect(events.length).to.equal(1);
            const event: GameEvent = events[0];
            if (event.type !== GameEventType.DialogOpened) {
                assert.fail("Expected a DialogOpened event");
            }

            expect(event.dialog).to.equal(ModalVisibilityStatus.AddPlayer);
        });

        it("hideModalDialog emits nothing", () => {
            const appState: AppState = new AppState();
            appState.uiState.dialogState.showNewGameDialog();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.dialogState.hideModalDialog();

            expect(events.length).to.equal(0);
        });
    });

    describe("TossupAnswered", () => {
        it("addCorrectBuzz emits TossupAnswered with correct true", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].addCorrectBuzz(
                { player: appState.game.players[0], points: 10, position: 0 },
                0,
                GameFormats.UndefinedGameFormat,
                0,
                3
            );

            const answered: GameEvent[] = events.filter((event) => event.type === GameEventType.TossupAnswered);
            expect(answered.length).to.equal(1);
            const event: GameEvent = answered[0];
            if (event.type !== GameEventType.TossupAnswered) {
                assert.fail("Expected a TossupAnswered event");
            }

            expect(event.correct).to.equal(true);
        });

        it("addWrongBuzz emits TossupAnswered with correct false", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].addWrongBuzz(
                { player: appState.game.players[0], points: -5, position: 0 },
                0,
                GameFormats.UndefinedGameFormat
            );

            const answered: GameEvent[] = events.filter((event) => event.type === GameEventType.TossupAnswered);
            expect(answered.length).to.equal(1);
            const event: GameEvent = answered[0];
            if (event.type !== GameEventType.TossupAnswered) {
                assert.fail("Expected a TossupAnswered event");
            }

            expect(event.correct).to.equal(false);
        });
    });

    describe("other Cycle events", () => {
        it("addPlayerJoins emits PlayerJoined", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].addPlayerJoins(new Player("Carol", "Alpha", false), false);

            expect(events.filter((event) => event.type === GameEventType.PlayerJoined).length).to.equal(1);
        });

        it("addThrownOutTossup emits TossupThrownOut", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].addThrownOutTossup(0);

            expect(events.filter((event) => event.type === GameEventType.TossupThrownOut).length).to.equal(1);
        });

        it("addThrownOutBonus emits BonusThrownOut", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].addThrownOutBonus(0);

            expect(events.filter((event) => event.type === GameEventType.BonusThrownOut).length).to.equal(1);
        });

        it("removeCorrectBuzz emits TossupAnswerRemoved", () => {
            const appState: AppState = loadedAppState();
            appState.game.cycles[0].addCorrectBuzz(
                { player: appState.game.players[0], points: 10, position: 0 },
                0,
                GameFormats.UndefinedGameFormat,
                0,
                3
            );
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].removeCorrectBuzz();

            expect(events.filter((event) => event.type === GameEventType.TossupAnswerRemoved).length).to.equal(1);
        });

        it("removeWrongBuzz emits TossupAnswerRemoved", () => {
            const appState: AppState = loadedAppState();
            appState.game.cycles[0].addWrongBuzz(
                { player: appState.game.players[0], points: -5, position: 0 },
                0,
                GameFormats.UndefinedGameFormat
            );
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].removeWrongBuzz(appState.game.players[0], GameFormats.UndefinedGameFormat);

            expect(events.filter((event) => event.type === GameEventType.TossupAnswerRemoved).length).to.equal(1);
        });

        it("removeWrongBuzz for a player with no buzz emits nothing", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].removeWrongBuzz(appState.game.players[0], GameFormats.UndefinedGameFormat);

            expect(events.length).to.equal(0);
        });

        it("setBonusPartAnswer emits BonusPartAnswered with the part index", () => {
            const appState: AppState = loadedAppState();
            appState.game.cycles[0].addCorrectBuzz(
                { player: appState.game.players[0], points: 10, position: 0 },
                0,
                GameFormats.UndefinedGameFormat,
                0,
                3
            );
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].setBonusPartAnswer(1, "Alpha", 10);

            const parts: GameEvent[] = events.filter((event) => event.type === GameEventType.BonusPartAnswered);
            expect(parts.length).to.equal(1);
            const event: GameEvent = parts[0];
            if (event.type !== GameEventType.BonusPartAnswered) {
                assert.fail("Expected a BonusPartAnswered event");
            }

            expect(event.partIndex).to.equal(1);
        });

        it("setBonusPartAnswer with no bonus answer emits nothing", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.game.cycles[0].setBonusPartAnswer(0, "Alpha", 10);

            expect(events.length).to.equal(0);
        });
    });

    describe("QBJ import", () => {
        it("round-tripping a game through QBJ raises no events on a live app's bus", () => {
            const appState: AppState = loadedAppState();

            // Give the game something for the import to replay: without a buzz, fromQBJ would mutate nothing
            // and the test would pass vacuously.
            appState.game.cycles[0].addCorrectBuzz(
                { player: appState.game.players[0], points: 10, position: 0 },
                0,
                GameFormats.UndefinedGameFormat,
                0,
                3
            );

            const qbj: IMatch = QBJ.toQBJ(appState.game, "Test packet");
            const events: GameEvent[] = recordEvents(appState);

            const result: IResult<GameState> = QBJ.fromQBJ(qbj, appState.game.packet, appState.game.gameFormat);

            expect(result.success).to.equal(true);
            // The replay happened on a throwaway GameState that was never given a bus.
            expect(events.length).to.equal(0);
        });
    });

    describe("cycle navigation", () => {
        it("setCycleIndex emits CycleTo with from and to", () => {
            const appState: AppState = loadedAppState();
            appState.uiState.setCycleIndex(1);
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.setCycleIndex(0);

            expect(events.length).to.equal(1);
            const event: GameEvent = events[0];
            if (event.type !== GameEventType.CycleTo) {
                assert.fail("Expected a CycleTo event");
            }

            expect(event.from).to.equal(1);
            expect(event.to).to.equal(0);
        });

        it("setCycleIndex with a negative index emits nothing", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.setCycleIndex(-1);

            expect(events.length).to.equal(0);
        });

        it("nextCycle emits CycleTo then NextQuestion", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.nextCycle();

            expect(events.map((event) => event.type)).to.deep.equal([
                GameEventType.CycleTo,
                GameEventType.NextQuestion,
            ]);
        });

        it("previousCycle emits CycleTo then PreviousQuestion", () => {
            const appState: AppState = loadedAppState();
            appState.uiState.setCycleIndex(1);
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.previousCycle();

            expect(events.map((event) => event.type)).to.deep.equal([
                GameEventType.CycleTo,
                GameEventType.PreviousQuestion,
            ]);
        });

        it("previousCycle at question 1 emits nothing", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.previousCycle();

            expect(events.length).to.equal(0);
        });

        it("jumpToCycleIndex emits CycleTo then JumpToQuestion", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.jumpToCycleIndex(1);

            expect(events.map((event) => event.type)).to.deep.equal([
                GameEventType.CycleTo,
                GameEventType.JumpToQuestion,
            ]);
        });

        it("selectCycleFromEventLog emits CycleTo then ClickLogTo", () => {
            const appState: AppState = loadedAppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.selectCycleFromEventLog(1);

            expect(events.map((event) => event.type)).to.deep.equal([
                GameEventType.CycleTo,
                GameEventType.ClickLogTo,
            ]);
        });
    });

    describe("PacketLoaded", () => {
        it("setPendingNewGamePacket emits PacketLoaded", () => {
            const appState: AppState = new AppState();
            appState.uiState.createPendingNewGame();
            const events: GameEvent[] = recordEvents(appState);

            const packet: PacketState = new PacketState();
            packet.setTossups([new Tossup("This is the first question", "Answer")]);
            appState.uiState.setPendingNewGamePacket(packet);

            expect(events.filter((event) => event.type === GameEventType.PacketLoaded).length).to.equal(1);
            expect(appState.uiState.pendingNewGame?.packet.tossups.length).to.equal(1);
        });

        it("setPendingNewGamePacket with no pending game emits nothing", () => {
            // A fresh AppState has no pending new game until createPendingNewGame is called.
            const appState: AppState = new AppState();
            const events: GameEvent[] = recordEvents(appState);

            appState.uiState.setPendingNewGamePacket(new PacketState());

            expect(events.length).to.equal(0);
        });
    });

    describe("wiring", () => {
        it("a UIState built without a bus does not throw when emitting", () => {
            // The existing `new UIState()` / `new AppState()` sites across the tests must keep working, so
            // the bus is an optional injection everywhere.
            const standalone: UIState = new UIState();
            standalone.showBuzzMenu(false);
        });
    });
});
