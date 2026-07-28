import { expect } from "chai";

import { GameEvent, GameEventBus, GameEventType } from "src/state/GameEventBus";

describe("GameEventBusTests", () => {
    it("emit delivers the event to a subscriber", () => {
        const bus: GameEventBus = new GameEventBus();
        const received: GameEvent[] = [];
        bus.subscribe((event) => received.push(event));

        bus.emit({ type: GameEventType.TossupAnswered, correct: true });

        expect(received.length).to.equal(1);
        expect(received[0].type).to.equal(GameEventType.TossupAnswered);
    });

    it("emit delivers to every subscriber", () => {
        const bus: GameEventBus = new GameEventBus();
        let firstCount = 0;
        let secondCount = 0;
        bus.subscribe(() => firstCount++);
        bus.subscribe(() => secondCount++);

        bus.emit({ type: GameEventType.GameStarted });

        expect(firstCount).to.equal(1);
        expect(secondCount).to.equal(1);
    });

    it("the returned unsubscribe stops delivery", () => {
        const bus: GameEventBus = new GameEventBus();
        let count = 0;
        const unsubscribe: () => void = bus.subscribe(() => count++);

        bus.emit({ type: GameEventType.GameStarted });
        unsubscribe();
        bus.emit({ type: GameEventType.GameStarted });

        expect(count).to.equal(1);
    });

    it("unsubscribing one subscriber leaves the others", () => {
        const bus: GameEventBus = new GameEventBus();
        let firstCount = 0;
        let secondCount = 0;
        const unsubscribe: () => void = bus.subscribe(() => firstCount++);
        bus.subscribe(() => secondCount++);

        unsubscribe();
        bus.emit({ type: GameEventType.GameStarted });

        expect(firstCount).to.equal(0);
        expect(secondCount).to.equal(1);
    });

    it("emitting with no subscribers does not throw", () => {
        const bus: GameEventBus = new GameEventBus();
        bus.emit({ type: GameEventType.GameStarted });
    });

    it("a subscriber added during an emit does not receive that emit", () => {
        const bus: GameEventBus = new GameEventBus();
        let lateCount = 0;
        bus.subscribe(() => bus.subscribe(() => lateCount++));

        bus.emit({ type: GameEventType.GameStarted });

        expect(lateCount).to.equal(0);
    });
});
