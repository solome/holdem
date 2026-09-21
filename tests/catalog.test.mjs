import test from "node:test";
import assert from "node:assert/strict";
import {
  ACHIEVEMENTS,
  SUITS,
  getStats,
  rankLabel,
  validateRecord,
} from "../src/catalog.mjs";

const find = (id) => ACHIEVEMENTS.find((achievement) => achievement.id === id);
const card = (rank, suit) => ({ rank, suit });
const cloneRecord = (id = "royal-diamonds") => structuredClone(find(id).record);

test("catalog has 25 distinct achievements with the requested category coverage", () => {
  assert.equal(ACHIEVEMENTS.length, 25);
  assert.equal(new Set(ACHIEVEMENTS.map(({ id }) => id)).size, 25);
  assert.deepEqual(getStats(), {
    total: 25,
    unlocked: 3,
    remaining: 22,
    byCategory: {
      royal: { total: 4, unlocked: 1, remaining: 3 },
      "straight-flush": { total: 16, unlocked: 1, remaining: 15 },
      quads: { total: 5, unlocked: 1, remaining: 4 },
    },
  });
});

test("catalog ordering is royal, descending straight flushes, then descending quads", () => {
  const suitOrder = ["spades", "hearts", "clubs", "diamonds"];
  assert.deepEqual(
    SUITS.map(({ id }) => id),
    suitOrder,
  );
  assert.deepEqual(
    ACHIEVEMENTS.slice(0, 4).map(({ id }) => id),
    suitOrder.map((suit) => `royal-${suit}`),
  );
  assert.deepEqual(
    ACHIEVEMENTS.slice(4, 20).map(({ id }) => id),
    [13, 12, 11, 10].flatMap((high) =>
      suitOrder.map((suit) => `straight-flush-${suit}-${high}`),
    ),
  );
  assert.deepEqual(
    ACHIEVEMENTS.slice(20).map(({ id }) => id),
    ["quads-14", "quads-13", "quads-12", "quads-11", "quads-10"],
  );
});

test("cards show all suits, four cards for quads, and the inclusive 10-high boundary", () => {
  for (const suit of ["spades", "hearts", "clubs", "diamonds"]) {
    assert.deepEqual(
      find(`royal-${suit}`).cards,
      ["10", "J", "Q", "K", "A"].map((rank) => card(rank, suit)),
    );
    assert.deepEqual(
      find(`straight-flush-${suit}-10`).cards,
      ["6", "7", "8", "9", "10"].map((rank) => card(rank, suit)),
    );
  }
  assert.deepEqual(
    find("quads-10").cards,
    ["spades", "hearts", "clubs", "diamonds"].map((suit) => card("10", suit)),
  );
  assert.equal(
    ACHIEVEMENTS.some(({ high }) => high < 10),
    false,
  );
  assert.equal(
    ACHIEVEMENTS.some(
      ({ category, high }) => category === "straight-flush" && high === 14,
    ),
    false,
  );
});

test("the three original records preserve hole cards and board order exactly", () => {
  assert.deepEqual(
    ACHIEVEMENTS.filter(({ record }) => record).map(({ id }) => id),
    ["royal-diamonds", "straight-flush-spades-12", "quads-13"],
  );
  assert.deepEqual(find("royal-diamonds").record, {
    hole: [card("A", "diamonds"), card("K", "diamonds")],
    board: [
      card("10", "diamonds"),
      card("Q", "diamonds"),
      card("10", "clubs"),
      card("J", "diamonds"),
      card("8", "clubs"),
    ],
  });
  assert.deepEqual(find("straight-flush-spades-12").record, {
    hole: [card("10", "spades"), card("8", "spades")],
    board: [
      card("9", "spades"),
      card("Q", "spades"),
      card("J", "spades"),
      card("9", "hearts"),
      card("8", "diamonds"),
    ],
  });
  assert.deepEqual(find("quads-13").record, {
    hole: [card("K", "hearts"), card("4", "diamonds")],
    board: [
      card("K", "diamonds"),
      card("K", "clubs"),
      card("K", "spades"),
      card("6", "spades"),
      card("J", "spades"),
    ],
  });
  for (const achievement of ACHIEVEMENTS) {
    assert.equal(
      validateRecord(achievement, achievement.record),
      achievement.record !== null,
    );
  }
});

test("record validation rejects incomplete deals, invalid cards, and duplicates", () => {
  const achievement = find("royal-diamonds");
  for (const malformed of [
    null,
    {},
    { hole: [], board: [] },
    { hole: "AK", board: [] },
  ]) {
    assert.equal(validateRecord(achievement, malformed), false);
  }
  const shortBoard = cloneRecord();
  shortBoard.board.pop();
  assert.equal(validateRecord(achievement, shortBoard), false);
  const threeHoleCards = cloneRecord();
  threeHoleCards.hole.push(card("2", "clubs"));
  assert.equal(validateRecord(achievement, threeHoleCards), false);

  for (const invalid of [
    null,
    card("1", "clubs"),
    card("15", "clubs"),
    card(10, "clubs"),
    card("T", "clubs"),
    card("2", "stars"),
  ]) {
    const record = cloneRecord();
    record.board[4] = invalid;
    assert.equal(validateRecord(achievement, record), false);
  }

  const repeatedHoleCard = cloneRecord();
  repeatedHoleCard.board[4] = repeatedHoleCard.hole[0];
  assert.equal(validateRecord(achievement, repeatedHoleCard), false);
  const repeatedBoardCard = cloneRecord();
  repeatedBoardCard.board[4] = repeatedBoardCard.board[2];
  assert.equal(validateRecord(achievement, repeatedBoardCard), false);
});

test("valid seven-card deals cannot unlock a different suit, height, or quad rank", () => {
  assert.equal(validateRecord(find("royal-spades"), cloneRecord()), false);
  assert.equal(
    validateRecord(
      find("straight-flush-spades-13"),
      cloneRecord("straight-flush-spades-12"),
    ),
    false,
  );
  assert.equal(
    validateRecord(find("quads-14"), cloneRecord("quads-13")),
    false,
  );

  const missingRoyalCard = cloneRecord();
  missingRoyalCard.board[1] = card("Q", "hearts");
  assert.equal(validateRecord(find("royal-diamonds"), missingRoyalCard), false);

  const missingFourthKing = cloneRecord("quads-13");
  missingFourthKing.board[0] = card("Q", "diamonds");
  assert.equal(validateRecord(find("quads-13"), missingFourthKing), false);
});

test("playing the board is valid and record validation does not mutate input", () => {
  const achievement = find("straight-flush-clubs-10");
  const record = {
    hole: [card("A", "hearts"), card("K", "spades")],
    board: ["10", "6", "8", "7", "9"].map((rank) => card(rank, "clubs")),
  };
  const before = structuredClone(record);
  assert.equal(validateRecord(achievement, record), true);
  assert.deepEqual(record, before);
});

test("malformed achievement definitions cannot unlock records or inflate statistics", () => {
  const original = find("royal-diamonds");
  for (const achievement of [
    null,
    {},
    { ...original, high: 13 },
    { ...original, category: "unknown" },
    { ...original, cards: [] },
  ]) {
    assert.equal(validateRecord(achievement, original.record), false);
  }
  const tampered = structuredClone(original);
  tampered.cards[0] = card("2", "diamonds");
  assert.equal(validateRecord(tampered, original.record), false);

  const stats = getStats([
    { ...find("royal-spades"), record: original.record },
  ]);
  assert.equal(stats.unlocked, 0);
  assert.equal(stats.remaining, 1);
});

test("rank labels are canonical and out-of-deck values are rejected", () => {
  assert.deepEqual([2, 9, 10, 11, 12, 13, 14].map(rankLabel), [
    "2",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ]);
  for (const invalid of [1, 15, 10.5, "10", null, NaN]) {
    assert.throws(() => rankLabel(invalid), RangeError);
  }
});
