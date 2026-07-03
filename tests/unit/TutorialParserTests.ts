import { expect } from "chai";

import { parseTutorial } from "src/state/tutorials/TutorialParser";
import { ITutorialDefinition } from "src/state/tutorials/ITutorialDefinition";

describe("TutorialParserTests", () => {
    it("parses a single untargeted step with NEXT_CLICK", () => {
        const source = `TUTORIAL: Basic Scoring
DESCRIPTION: Learn how to score a tossup and bonus in a sample game.

STEP
TITLE: Welcome
TEXT: This tutorial walks you through scoring one full cycle.
WAIT_FOR: NEXT_CLICK
`;

        const definition: ITutorialDefinition = parseTutorial(source);

        expect(definition.title).to.equal("Basic Scoring");
        expect(definition.description).to.equal("Learn how to score a tossup and bonus in a sample game.");
        expect(definition.steps).to.have.lengthOf(1);
        expect(definition.steps[0].multi).to.equal("SEQUENCE");
        expect(definition.steps[0].targets).to.have.lengthOf(1);
        expect(definition.steps[0].targets[0]).to.deep.equal({
            target: undefined,
            title: "Welcome",
            text: "This tutorial walks you through scoring one full cycle.",
            waitFor: "NEXT_CLICK",
        });
    });

    it("parses a targeted step and multi-line TEXT", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
TARGET: word-0
TITLE: Buzzing In
TEXT: Click a word to simulate a player buzzing in.
It happens at any point during the question.
WAIT_FOR: BUZZ_SELECTED
`;

        const definition: ITutorialDefinition = parseTutorial(source);

        expect(definition.steps[0].targets[0].target).to.equal("word-0");
        expect(definition.steps[0].targets[0].text).to.equal(
            "Click a word to simulate a player buzzing in.\nIt happens at any point during the question."
        );
        expect(definition.steps[0].targets[0].waitFor).to.equal("BUZZ_SELECTED");
    });

    it("parses an empty TARGET: value as an untargeted entry", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
TARGET:
TITLE: Welcome
TEXT: This step has no target.
WAIT_FOR: NEXT_CLICK
`;

        const definition: ITutorialDefinition = parseTutorial(source);

        expect(definition.steps[0].targets[0].target).to.be.undefined;
    });

    it("parses a SEQUENCE step with three targets", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
MULTI: SEQUENCE
TARGET: bonus-part-1
TITLE: Part 1
TEXT: Mark part 1.
WAIT_FOR: BONUS_PART_ANSWERED

TARGET: bonus-part-2
TITLE: Part 2
TEXT: Mark part 2.
WAIT_FOR: BONUS_PART_ANSWERED

TARGET: bonus-part-3
TITLE: Part 3
TEXT: Mark part 3.
WAIT_FOR: BONUS_PART_ANSWERED
`;

        const definition: ITutorialDefinition = parseTutorial(source);

        expect(definition.steps).to.have.lengthOf(1);
        expect(definition.steps[0].multi).to.equal("SEQUENCE");
        expect(definition.steps[0].targets).to.have.lengthOf(3);
        expect(definition.steps[0].targets.map((t) => t.target)).to.deep.equal([
            "bonus-part-1",
            "bonus-part-2",
            "bonus-part-3",
        ]);
    });

    it("parses a BRANCH step with two targets", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
MULTI: BRANCH
TARGET: word-0
TITLE: Correct
TEXT: Mark it correct.
WAIT_FOR: TOSSUP_ANSWERED_CORRECT

TARGET: word-0
TITLE: Wrong
TEXT: Mark it wrong.
WAIT_FOR: TOSSUP_ANSWERED_WRONG
`;

        const definition: ITutorialDefinition = parseTutorial(source);

        expect(definition.steps[0].multi).to.equal("BRANCH");
        expect(definition.steps[0].targets).to.have.lengthOf(2);
        expect(definition.steps[0].targets[0].waitFor).to.equal("TOSSUP_ANSWERED_CORRECT");
        expect(definition.steps[0].targets[1].waitFor).to.equal("TOSSUP_ANSWERED_WRONG");
    });

    it("throws on an entry missing TITLE", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
TEXT: no title here
WAIT_FOR: NEXT_CLICK
`;

        expect(() => parseTutorial(source)).to.throw(/TITLE/);
    });

    it("throws on an entry missing TEXT", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
TITLE: No text
WAIT_FOR: NEXT_CLICK
`;

        expect(() => parseTutorial(source)).to.throw(/TEXT/);
    });

    it("throws on an entry missing WAIT_FOR", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
TITLE: No wait_for
TEXT: text
`;

        expect(() => parseTutorial(source)).to.throw(/WAIT_FOR/);
    });

    it("throws on an unrecognized WAIT_FOR value", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
TITLE: Bad trigger
TEXT: text
WAIT_FOR: NOT_A_REAL_TRIGGER
`;

        expect(() => parseTutorial(source)).to.throw(/WAIT_FOR/);
    });

    it("throws on an unrecognized MULTI value", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
MULTI: PARALLEL
TARGET: a
TITLE: A
TEXT: a
WAIT_FOR: NEXT_CLICK

TARGET: b
TITLE: B
TEXT: b
WAIT_FOR: NEXT_CLICK
`;

        expect(() => parseTutorial(source)).to.throw(/MULTI/);
    });

    it("throws when MULTI: BRANCH is present with only one target entry", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
MULTI: BRANCH
TARGET: a
TITLE: A
TEXT: a
WAIT_FOR: NEXT_CLICK
`;

        expect(() => parseTutorial(source)).to.throw(/MULTI/);
    });

    it("throws when MULTI: SEQUENCE is explicitly present with only one target entry", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
MULTI: SEQUENCE
TARGET: a
TITLE: A
TEXT: a
WAIT_FOR: NEXT_CLICK
`;

        expect(() => parseTutorial(source)).to.throw(/MULTI/);
    });

    it("does not throw for an implicit multi-entry SEQUENCE step (no MULTI line at all)", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
TARGET: a
TITLE: A
TEXT: a
WAIT_FOR: NEXT_CLICK

TARGET: b
TITLE: B
TEXT: b
WAIT_FOR: NEXT_CLICK
`;

        const definition: ITutorialDefinition = parseTutorial(source);

        expect(definition.steps[0].multi).to.equal("SEQUENCE");
        expect(definition.steps[0].targets).to.have.lengthOf(2);
    });

    it("throws when the file has no TUTORIAL/DESCRIPTION header", () => {
        expect(() => parseTutorial("STEP\nTITLE: x\nTEXT: x\nWAIT_FOR: NEXT_CLICK\n")).to.throw(/TUTORIAL/);
    });

    it("parses a step whose first entry is untargeted when later entries have targets", () => {
        const source = `TUTORIAL: T
DESCRIPTION: D

STEP
TITLE: A
TEXT: a
WAIT_FOR: NEXT_CLICK

TARGET: b
TITLE: B
TEXT: b
WAIT_FOR: NEXT_CLICK
`;

        const definition: ITutorialDefinition = parseTutorial(source);

        expect(definition.steps[0].targets).to.have.lengthOf(2);
        expect(definition.steps[0].targets[0]).to.deep.equal({
            target: undefined,
            title: "A",
            text: "a",
            waitFor: "NEXT_CLICK",
        });
        expect(definition.steps[0].targets[1].target).to.equal("b");
    });
});
