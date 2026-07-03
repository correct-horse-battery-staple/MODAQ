export default `TUTORIAL: Basic Scoring
DESCRIPTION: Learn how to score a tossup and bonus in a sample game.

STEP
TITLE: Welcome
TEXT: This tutorial walks you through scoring one full cycle: a tossup and a bonus. Use a practice game so nothing you do here affects any real game.
WAIT_FOR: NEXT_CLICK

STEP
TARGET: word-0
TITLE: Buzzing In
TEXT: Click a word to simulate a player buzzing in at that point.
WAIT_FOR: BUZZ_SELECTED

STEP
MULTI: BRANCH
TARGET: word-0
TITLE: Judging the Answer
TEXT: A menu just opened next to the word. Pick a player, then mark the answer Correct or Wrong. Try marking it correct.
WAIT_FOR: TOSSUP_ANSWERED_CORRECT

TARGET: word-0
TITLE: Negs
TEXT: Marking it wrong before the question ends negs the player: they lose points, and the other team gets a chance to answer.
WAIT_FOR: TOSSUP_ANSWERED_WRONG

STEP
MULTI: SEQUENCE
TARGET: bonus-part-1
TITLE: Scoring the Bonus
TEXT: A correct tossup answer earns a bonus. Click each part to mark it correct or incorrect. Start with part 1.
WAIT_FOR: BONUS_PART_ANSWERED

TARGET: bonus-part-2
TITLE: Part 2
TEXT: Now part 2.
WAIT_FOR: BONUS_PART_ANSWERED

TARGET: bonus-part-3
TITLE: Part 3
TEXT: And part 3. That's the whole bonus.
WAIT_FOR: BONUS_PART_ANSWERED

STEP
TITLE: All Done
TEXT: That's the core scoring loop. Explore the rest of MODAQ, or start a real game from the New game menu.
WAIT_FOR: NEXT_CLICK
`;
