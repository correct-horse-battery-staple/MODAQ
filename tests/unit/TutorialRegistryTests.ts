import { expect } from "chai";

import { tutorialDefinitions } from "src/state/tutorials";

describe("TutorialRegistryTests", () => {
    it("every registered definition parses without throwing and has at least one step", () => {
        expect(tutorialDefinitions).to.be.an("array");

        for (const definition of tutorialDefinitions) {
            expect(definition.title).to.be.a("string").that.is.not.empty;
            expect(definition.steps.length).to.be.greaterThan(0);
        }
    });

    it("includes Basic Scoring", () => {
        expect(tutorialDefinitions.map((definition) => definition.title)).to.include("Basic Scoring");
    });
});
