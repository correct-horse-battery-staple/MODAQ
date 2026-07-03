import { expect } from "chai";

import { createPracticeGame } from "src/state/tutorials/PracticeGame";
import { GameState } from "src/state/GameState";

describe("PracticeGameTests", () => {
    it("creates a fresh, playable game with one cycle and two full teams", () => {
        const game: GameState = createPracticeGame();

        expect(game.isLoaded).to.equal(true);
        expect(game.cycles).to.have.lengthOf(1);
        expect(game.packet.tossups).to.have.lengthOf(1);
        expect(game.packet.bonuses).to.have.lengthOf(1);
        expect(game.packet.bonuses[0].parts).to.have.lengthOf(3);
        expect(game.teamNames).to.have.lengthOf(2);
        expect(game.players).to.have.lengthOf(8);
        expect(game.players.every((player) => player.isStarter)).to.equal(true);
    });

    it("creates a new, independent GameState instance on every call", () => {
        const first: GameState = createPracticeGame();
        const second: GameState = createPracticeGame();

        expect(first).to.not.equal(second);
        expect(first.cycles[0]).to.not.equal(second.cycles[0]);
    });
});
