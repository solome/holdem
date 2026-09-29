import test from "node:test";
import assert from "node:assert/strict";
import {
  activateSelectionSlot,
  clearSelectionCard,
  commitCardSelection,
  createCardSelection,
  pickSelectionCard,
  selectionChanged,
} from "../src/odds-selection.mjs";

const SUIT = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const card = (text) => ({ rank: text.slice(0, -1), suit: SUIT[text.at(-1)] });
const hand = (text) => text.split(" ").map(card);
const deal = (overrides = {}) => ({
  hero: [null, null],
  board: [null, null, null, null, null],
  villain: [null, null],
  stage: 3,
  useVillain: false,
  sort: "probability",
  result: { totalOutcomes: 1081 },
  ...overrides,
});
const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

test("opening, editing, and discarding a draft leaves the deal and its result intact", () => {
  const original = freeze(deal({ hero: hand("As Kh") }));
  const snapshot = structuredClone(original);
  const initial = createCardSelection(original, "hero", 0);
  assert.notEqual(initial.cards, original.hero);
  assert.notEqual(initial.cards[0], original.hero[0]);
  const supplied = card("Qd");
  const replacement = pickSelectionCard(initial, supplied);
  supplied.rank = "J";
  assert.deepEqual(replacement.cards, hand("Qd Kh"));
  assert.deepEqual(initial.cards, hand("As Kh"));
  assert.equal(initial.originIndex, 0);
  assert.equal(replacement.originIndex, 0);
  assert.equal(selectionChanged(original, initial), false);
  assert.equal(selectionChanged(original, replacement), true);
  assert.deepEqual(original, snapshot);
  assert.equal(original.result.totalOutcomes, 1081);
});

test("continuous selection wraps to earlier holes and stays open when the group fills", () => {
  const original = freeze(deal());
  let selection = createCardSelection(original, "board", 1);
  selection = pickSelectionCard(selection, card("As"));
  assert.equal(selection.index, 2);
  selection = pickSelectionCard(selection, card("Kh"));
  assert.equal(selection.index, 0);
  selection = pickSelectionCard(selection, card("Qd"));
  assert.equal(selection.index, 0);
  assert.deepEqual(selection.cards, hand("Qd As Kh"));
  assert.equal(selection.originIndex, 1);
  assert.deepEqual(original.board, [null, null, null, null, null]);
});

test("replacement stays on its slot and releases the previous card for another slot", () => {
  const original = deal({ hero: [card("As"), null] });
  const first = createCardSelection(original, "hero", 0);
  const replacement = pickSelectionCard(first, card("Kh"));
  assert.equal(replacement.index, 0);
  const nextSlot = activateSelectionSlot(replacement, 1);
  assert.equal(nextSlot.cards, replacement.cards);
  assert.equal(nextSlot.originIndex, 0);
  const filled = pickSelectionCard(nextSlot, card("As"));
  assert.deepEqual(filled.cards, hand("Kh As"));
  assert.deepEqual(original.hero, [card("As"), null]);
});

test("clicking an already selected card removes it, including from another draft slot", () => {
  const original = deal({ hero: hand("As Kh") });
  const selection = createCardSelection(original, "hero", 0);
  const currentRemoved = pickSelectionCard(selection, card("As"));
  assert.deepEqual(currentRemoved.cards, [null, card("Kh")]);
  assert.equal(currentRemoved.index, 0);
  const otherRemoved = pickSelectionCard(selection, card("Kh"));
  assert.deepEqual(otherRemoved.cards, [card("As"), null]);
  assert.equal(otherRemoved.index, 1);
  assert.deepEqual(selection.cards, hand("As Kh"));
  assert.equal(otherRemoved.originIndex, 0);
});

test("clearing a card keeps that slot active for immediate reselection", () => {
  const selection = createCardSelection(deal({ hero: hand("As Kh") }), "hero", 1);
  const cleared = clearSelectionCard(selection);
  assert.equal(cleared.index, 1);
  assert.deepEqual(cleared.cards, [card("As"), null]);
  assert.equal(clearSelectionCard(cleared), cleared);
  const another = clearSelectionCard(selection, 0);
  assert.equal(another.index, 0);
  assert.deepEqual(another.cards, [null, card("Kh")]);
  assert.deepEqual(pickSelectionCard(cleared, card("Qd")).cards, hand("As Qd"));
});

test("other visible groups block cards while hidden streets and disabled opponents do not", () => {
  const original = deal({
    hero: hand("As Kh"),
    board: [...hand("Qd Jc 2s 3h 4d")],
    villain: hand("Ah Kd"),
  });
  const selection = createCardSelection(original, "hero", 0);
  assert.deepEqual(
    selection.blockedKeys,
    new Set(["Q:diamonds", "J:clubs", "2:spades"]),
  );
  assert.equal(pickSelectionCard(selection, card("Qd")), selection);
  assert.notEqual(pickSelectionCard(selection, card("3h")), selection);
  assert.notEqual(pickSelectionCard(selection, card("Ah")), selection);
  const headsUp = createCardSelection(
    { ...original, useVillain: true },
    "hero",
    0,
  );
  assert.equal(pickSelectionCard(headsUp, card("Ah")), headsUp);
  const opponent = createCardSelection(
    { ...original, useVillain: true },
    "villain",
    0,
  );
  assert.equal(pickSelectionCard(opponent, card("As")), opponent);
  assert.equal(pickSelectionCard(opponent, card("Qd")), opponent);
});

test("commit changes only the edited group and clones draft cards without mutating inputs", () => {
  const original = freeze(deal({ board: [...hand("Qs Js 2d 3c 4h")] }));
  const initial = createCardSelection(original, "board", 1);
  const edited = freeze(pickSelectionCard(initial, card("As")));
  const committed = commitCardSelection(original, edited);
  assert.notEqual(committed, original);
  assert.notEqual(committed.board, original.board);
  assert.deepEqual(committed.board, hand("Qs As 2d 3c 4h"));
  assert.equal(committed.board.length, 5);
  assert.equal(committed.hero, original.hero);
  assert.equal(committed.villain, original.villain);
  assert.equal(committed.result, original.result);
  assert.equal(committed.sort, original.sort);
  assert.notEqual(committed.board[1], edited.cards[1]);
  assert.deepEqual(original.board, hand("Qs Js 2d 3c 4h"));
  assert.deepEqual(edited.cards, hand("Qs As 2d"));
});

test("unchanged selection and undoing an edit preserve deal identity and calculation results", () => {
  const original = deal({ hero: hand("As Kh") });
  const selection = createCardSelection(original, "hero", 0);
  assert.equal(commitCardSelection(original, selection), original);
  const removed = pickSelectionCard(selection, card("As"));
  const restored = pickSelectionCard(removed, card("As"));
  assert.equal(selectionChanged(original, restored), false);
  assert.equal(commitCardSelection(original, restored), original);
  const sameValues = { ...selection, cards: hand("As Kh") };
  assert.equal(selectionChanged(original, sameValues), false);
  assert.equal(commitCardSelection(original, sameValues), original);
  assert.equal(
    selectionChanged(original, { ...selection, cards: hand("Kh As") }),
    true,
  );
});

test("confirming removal saves the empty slot without altering the other groups", () => {
  const original = freeze(deal({
    hero: hand("As Kh"),
    villain: hand("Qd Jc"),
    useVillain: true,
  }));
  const selection = createCardSelection(original, "villain", 1);
  const cleared = clearSelectionCard(selection);
  const committed = commitCardSelection(original, cleared);
  assert.deepEqual(committed.villain, [card("Qd"), null]);
  assert.equal(committed.hero, original.hero);
  assert.equal(committed.board, original.board);
  assert.deepEqual(original.villain, hand("Qd Jc"));
});

test("commit rechecks cross-group conflicts introduced after the draft opened", () => {
  const original = deal();
  const draft = pickSelectionCard(
    createCardSelection(original, "hero", 0),
    card("As"),
  );
  const changedElsewhere = freeze({
    ...original,
    board: [card("As"), null, null, null, null],
  });
  assert.throws(
    () => commitCardSelection(changedElsewhere, draft),
    /more than once/,
  );
  const opponentEnabled = {
    ...original,
    useVillain: true,
    villain: [card("As"), null],
  };
  assert.throws(
    () => commitCardSelection(opponentEnabled, draft),
    /more than once/,
  );
  assert.deepEqual(changedElsewhere.hero, [null, null]);
});

test("only the current street and enabled opponent can be edited", () => {
  for (const stage of [3, 4, 5]) {
    const original = deal({ stage, useVillain: true });
    assert.equal(
      createCardSelection(original, "board", stage - 1).cards.length,
      stage,
    );
    assert.equal(createCardSelection(original, "hero", 1).cards.length, 2);
    assert.equal(createCardSelection(original, "villain", 1).cards.length, 2);
    assert.throws(() => createCardSelection(original, "board", stage), /slot/);
  }
  assert.throws(() => createCardSelection(deal(), "villain", 0), /Enable/);
  assert.throws(() => createCardSelection(deal(), "unknown", 0), /Unknown/);
  assert.throws(
    () => createCardSelection(deal({ stage: 2 }), "hero", 0),
    /flop/,
  );
  const selection = createCardSelection(deal(), "board", 0);
  assert.throws(
    () => commitCardSelection(deal({ stage: 4 }), selection),
    /stage changed/,
  );
  const opponent = createCardSelection(deal({ useVillain: true }), "villain", 0);
  assert.throws(() => commitCardSelection(deal(), opponent), /Enable/);
});

test("invalid actions are ignored and corrupted drafts cannot be committed", () => {
  const original = deal();
  const selection = createCardSelection(original, "hero", 0);
  for (const index of [-1, 2, 0.5, "1", null, NaN]) {
    assert.equal(activateSelectionSlot(selection, index), selection);
    assert.equal(clearSelectionCard(selection, index), selection);
    assert.throws(() => createCardSelection(original, "hero", index), /slot/);
  }
  for (const invalid of [
    null,
    undefined,
    [],
    {},
    { rank: 2, suit: "spades" },
    { rank: "A", suit: "stars" },
  ])
    assert.equal(pickSelectionCard(selection, invalid), selection);
  assert.throws(
    () => commitCardSelection(original, { ...selection, cards: hand("As As") }),
    /more than once/,
  );
  assert.throws(
    () => commitCardSelection(original, { ...selection, cards: [{}, null] }),
    /Invalid card/,
  );
});
