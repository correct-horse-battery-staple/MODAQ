import * as GameFormats from "../GameFormats";
import { GameState } from "../GameState";
import { Bonus, PacketState, Tossup } from "../PacketState";
import { Player } from "../TeamState";

export function createPracticeGame(): GameState {
    const game = new GameState();
    game.setGameFormat(GameFormats.ACFGameFormat);
    game.loadPacket(createPracticePacket());
    game.setPlayers(createPracticePlayers());
    return game;
}

function createPracticePacket(): PacketState {
    const packet = new PacketState();
    packet.setName("Tutorial Practice Packet");
    packet.setTossups([
        new Tossup(
            "His farewell address warned against the dangers of political parties. For 10 points, name this " +
                "first president of the United States.",
            "George <b><u>Washington</u></b>"
        ),
    ]);
    packet.setBonuses([
        new Bonus("Answer some questions about Spain, for 10 points each.", [
            { question: "Name this capital of Spain.", answer: "<b><u>Madrid</u></b>", value: 10 },
            {
                question: "Name this second most populous city in Spain, where Catalan is spoken.",
                answer: "<b><u>Barcelona</u></b>",
                value: 10,
            },
            {
                question:
                    "Another language spoken in Spain comes from the northwest and is heavily influenced by " +
                    "Portuguese. Name it.",
                answer: "<b><u>Galician</u></b> (accept <b><u>gallego</u></b>)",
                value: 10,
            },
        ]),
    ]);
    return packet;
}

function createPracticePlayers(): Player[] {
    const players: Player[] = [];
    for (let i = 1; i <= 4; i++) {
        players.push(new Player(`Practice Player A${i}`, "Team A", true));
        players.push(new Player(`Practice Player B${i}`, "Team B", true));
    }
    return players;
}
