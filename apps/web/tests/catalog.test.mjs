import test from "node:test";
import assert from "node:assert/strict";
import {
  ACHIEVEMENTS,
  SUITS,
  getOpponentHand,
  getRecords,
  getStats,
  rankLabel,
  validateRecord,
} from "../src/catalog.mjs";

const find = (id) => ACHIEVEMENTS.find((achievement) => achievement.id === id);
const card = (rank, suit) => ({ rank, suit });
const cloneRecord = (id = "royal-diamonds") => structuredClone(find(id).records[0]);

test("catalog has 33 distinct achievements with the requested category coverage", () => {
  assert.equal(ACHIEVEMENTS.length, 33);
  assert.equal(new Set(ACHIEVEMENTS.map(({ id }) => id)).size, 33);
  assert.deepEqual(getStats(), {
    total: 33,
    unlocked: 5,
    remaining: 28,
    byCategory: {
      royal: { total: 4, unlocked: 1, remaining: 3 },
      "straight-flush": { total: 16, unlocked: 1, remaining: 15 },
      quads: { total: 13, unlocked: 3, remaining: 10 },
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
    [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((rank) => `quads-${rank}`),
  );
});

test("cards show all quad ranks and preserve the inclusive 10-high straight-flush boundary", () => {
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
  for (const rank of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]) {
    assert.deepEqual(
      find(`quads-${rank}`).cards,
      ["spades", "hearts", "clubs", "diamonds"].map((suit) =>
        card(rankLabel(rank), suit),
      ),
    );
  }
  assert.equal(
    ACHIEVEMENTS.some(
      ({ category, high }) => category === "straight-flush" && high < 10,
    ),
    false,
  );
  assert.equal(
    ACHIEVEMENTS.some(
      ({ category, high }) => category === "straight-flush" && high === 14,
    ),
    false,
  );
});

test("valid quads from 2222 through AAAA unlock only their matching rank", () => {
  for (const rank of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]) {
    const label = rankLabel(rank);
    const fillers = ["2", "3", "4", "5"]
      .filter((value) => value !== label)
      .slice(0, 3)
      .map((value) => card(value, "spades"));
    const record = {
      hole: [card(label, "spades"), card(label, "hearts")],
      board: [card(label, "clubs"), card(label, "diamonds"), ...fillers],
    };
    for (const achievement of ACHIEVEMENTS.filter(
      ({ category }) => category === "quads",
    )) {
      assert.equal(
        validateRecord(achievement, record),
        achievement.high === rank,
        `${label}${label}${label}${label} against ${achievement.id}`,
      );
    }
  }
});

test("quad achievement ranks outside 2–A or non-integer ranks are rejected", () => {
  const achievement = find("quads-2");
  const record = {
    hole: [card("2", "spades"), card("2", "hearts")],
    board: [
      card("2", "clubs"),
      card("2", "diamonds"),
      card("3", "spades"),
      card("4", "spades"),
      card("5", "spades"),
    ],
  };
  for (const high of [1, 15, 2.5, "2", null, NaN]) {
    assert.equal(validateRecord({ ...achievement, high }, record), false);
  }
});

test("the five records preserve dates, hole cards and board order exactly", () => {
  assert.deepEqual(
    ACHIEVEMENTS.filter(({ records }) => records.length).map(({ id }) => id),
    ["royal-diamonds", "straight-flush-spades-12", "quads-13", "quads-12", "quads-7"],
  );
  assert.deepEqual(find("royal-diamonds").records[0], {
    date: "2026-08-08",
    hole: [card("A", "diamonds"), card("K", "diamonds")],
    board: [
      card("10", "diamonds"),
      card("Q", "diamonds"),
      card("10", "clubs"),
      card("J", "diamonds"),
      card("8", "clubs"),
    ],
  });
  assert.deepEqual(find("straight-flush-spades-12").records[0], {
    date: "2026-08-01",
    hole: [card("10", "spades"), card("8", "spades")],
    board: [
      card("9", "spades"),
      card("Q", "spades"),
      card("J", "spades"),
      card("9", "hearts"),
      card("8", "diamonds"),
    ],
  });
  assert.deepEqual(find("quads-13").records[0], {
    date: "2026-08-22",
    hole: [card("K", "hearts"), card("4", "diamonds")],
    board: [
      card("K", "diamonds"),
      card("K", "clubs"),
      card("K", "spades"),
      card("6", "spades"),
      card("J", "spades"),
    ],
  });
  assert.deepEqual(find("quads-12").records[0], {
    date: "2026-10-26",
    hole: [card("Q", "spades"), card("K", "diamonds")],
    board: [
      card("Q", "clubs"),
      card("Q", "hearts"),
      card("K", "spades"),
      card("10", "clubs"),
      card("Q", "diamonds"),
    ],
    opponent: [card("K", "clubs"), card("9", "clubs")],
  });
  assert.deepEqual(find("quads-7").records[0], {
    date: "2026-09-24",
    hole: [card("7", "spades"), card("5", "spades")],
    board: [
      card("A", "hearts"),
      card("7", "clubs"),
      card("7", "hearts"),
      card("7", "diamonds"),
      card("3", "diamonds"),
    ],
    opponent: [card("K", "clubs"), card("A", "diamonds")],
  });
  for (const achievement of ACHIEVEMENTS) {
    assert.equal("record" in achievement, false);
    assert.ok(Array.isArray(achievement.records));
    assert.equal(achievement.records.length <= 1, true);
    for (const record of achievement.records) {
      assert.equal(validateRecord(achievement, record), true);
    }
  }
});

test("optional dates accept real ISO dates and keep older records compatible", () => {
  const achievement = find("royal-diamonds");
  const record = cloneRecord();
  delete record.date;
  assert.equal(validateRecord(achievement, record), true);
  for (const date of [
    null,
    undefined,
    "0001-01-01",
    "2026-01-31",
    "2026-04-30",
    "2024-02-29",
    "2000-02-29",
    "9999-12-31",
  ]) {
    assert.equal(
      validateRecord(achievement, { ...record, date }),
      true,
      String(date),
    );
  }
  for (const date of [
    "",
    "2026-2-01",
    "2026-02-1",
    "2026/02/01",
    "2026-08-08T00:00:00Z",
    "2026-08-08\n",
    "2026-02-29",
    "1900-02-29",
    "2026-04-31",
    "2026-00-01",
    "2026-13-01",
    "2026-01-00",
    "2026-01-32",
    "0000-01-01",
    20260924,
    false,
    new Date("2026-09-24"),
  ]) {
    assert.equal(
      validateRecord(achievement, { ...record, date }),
      false,
      String(date),
    );
  }
});

test("multiple hits are sorted newest first and count as one achieved target", () => {
  const earlier = { ...cloneRecord("quads-7"), date: "2026-08-01" };
  const latest = cloneRecord("quads-7");
  const undated = cloneRecord("quads-7");
  delete undated.date;
  const achievement = {
    ...find("quads-7"),
    records: [undated, earlier, latest],
  };
  assert.deepEqual(getRecords(achievement), [latest, earlier, undated]);
  assert.deepEqual(getStats([achievement]), {
    total: 1,
    unlocked: 1,
    remaining: 0,
    byCategory: {
      royal: { total: 0, unlocked: 0, remaining: 0 },
      "straight-flush": { total: 0, unlocked: 0, remaining: 0 },
      quads: { total: 1, unlocked: 1, remaining: 0 },
    },
  });
});

test("same-day hits remain distinct and retain their recorded order", () => {
  const first = cloneRecord("quads-7");
  const second = cloneRecord("quads-7");
  second.hole[1] = card("4", "spades");
  const withoutDate = { ...cloneRecord("quads-7"), date: null };
  const earlier = { ...cloneRecord("quads-7"), date: "2026-08-01" };
  const achievement = {
    ...find("quads-7"),
    records: [withoutDate, first, earlier, second],
  };
  const records = getRecords(achievement);
  assert.deepEqual(records, [first, second, earlier, withoutDate]);
  assert.equal(records[0], first);
  assert.equal(records[1], second);
});

test("record selection filters invalid hits without discarding valid siblings", () => {
  const valid = cloneRecord("quads-7");
  const invalidDate = { ...cloneRecord("quads-7"), date: "2026-02-29" };
  const invalidDeal = cloneRecord("quads-7");
  invalidDeal.board.pop();
  const achievement = {
    ...find("quads-7"),
    records: [invalidDate, null, invalidDeal, valid],
  };
  assert.deepEqual(getRecords(achievement), [valid]);
  assert.equal(getStats([achievement]).unlocked, 1);
});

test("reading records returns an independent array and never mutates input", () => {
  const latest = cloneRecord("quads-7");
  const earlier = { ...cloneRecord("quads-7"), date: "2026-08-01" };
  const achievement = { ...find("quads-7"), records: [earlier, latest] };
  const before = structuredClone(achievement);
  Object.freeze(achievement.records);
  const records = getRecords(achievement);
  assert.notEqual(records, achievement.records);
  assert.notEqual(records, getRecords(achievement));
  assert.deepEqual(records, [latest, earlier]);
  records.pop();
  assert.deepEqual(achievement, before);
});

test("legacy single records are accepted only when the records property is absent", () => {
  const { records, ...definition } = find("quads-7");
  const legacy = { ...definition, record: records[0] };
  assert.deepEqual(getRecords(legacy), records);
  assert.equal(getStats([legacy]).unlocked, 1);
  for (const explicitRecords of [[], null, undefined, {}, "invalid", [null]]) {
    const achievement = { ...legacy, records: explicitRecords };
    assert.deepEqual(getRecords(achievement), []);
    assert.equal(getStats([achievement]).unlocked, 0);
    assert.equal(getOpponentHand(achievement), null);
  }
  for (const invalid of [null, undefined, false, {}, []]) {
    assert.deepEqual(getRecords(invalid), []);
  }
});

test("opponent evaluation follows the selected hit and clears when none was recorded", () => {
  const fullHouse = cloneRecord("quads-7");
  const threeOfAKind = {
    ...cloneRecord("quads-7"),
    date: "2026-09-25",
    opponent: [card("Q", "clubs"), card("J", "diamonds")],
  };
  threeOfAKind.board[0] = card("2", "hearts");
  const noOpponent = { ...cloneRecord("quads-7"), date: "2026-09-26" };
  delete noOpponent.opponent;
  const achievement = {
    ...find("quads-7"),
    records: [fullHouse, noOpponent, threeOfAKind],
  };
  const before = structuredClone(achievement);
  assert.equal(getOpponentHand(achievement), null);
  assert.equal(getOpponentHand(achievement, fullHouse).category, "full-house");
  assert.equal(getOpponentHand(achievement, threeOfAKind).category, "three-kind");
  assert.deepEqual(getOpponentHand(achievement, threeOfAKind).bestCards, [
    card("Q", "clubs"),
    card("J", "diamonds"),
    card("7", "clubs"),
    card("7", "hearts"),
    card("7", "diamonds"),
  ]);
  assert.equal(getOpponentHand(achievement, noOpponent), null);
  assert.equal(getOpponentHand(achievement, fullHouse).category, "full-house");
  assert.equal(
    getOpponentHand(achievement, { ...fullHouse, date: "2026-02-29" }),
    null,
  );
  assert.equal(getOpponentHand(achievement, cloneRecord("quads-13")), null);
  assert.deepEqual(achievement, before);
});

test("opponent cards remain optional and absent opponents have no evaluated hand", () => {
  const achievement = find("royal-diamonds");
  for (const opponent of [null, undefined]) {
    const record = { ...cloneRecord(), opponent };
    assert.equal(validateRecord(achievement, record), true);
    assert.equal(getOpponentHand({ ...achievement, records: [record] }), null);
  }
  assert.equal(getOpponentHand(achievement), null);
  assert.equal(getOpponentHand(find("quads-2")), null);
  assert.equal(getOpponentHand(null), null);
});

test("opponents must have two legal cards distinct from the entire recorded deal", () => {
  const achievement = find("quads-7");
  const valid = cloneRecord("quads-7");
  for (const opponent of [
    [],
    "KA",
    {},
    [card("K", "clubs")],
    [...valid.opponent, card("2", "clubs")],
    [null, card("A", "diamonds")],
    [card(13, "clubs"), card("A", "diamonds")],
    [card("K", "stars"), card("A", "diamonds")],
    [card("K", "clubs"), card("K", "clubs")],
    [valid.hole[0], card("A", "diamonds")],
    [valid.board[0], card("A", "diamonds")],
    Array(2),
  ]) {
    const record = { ...valid, opponent };
    assert.equal(validateRecord(achievement, record), false);
    assert.equal(getOpponentHand({ ...achievement, records: [record] }), null);
    assert.equal(getStats([{ ...achievement, records: [record] }]).unlocked, 0);
  }
});

test("the seven-quads opponent makes sevens full of aces without mutating the record", () => {
  const achievement = find("quads-7");
  const before = structuredClone(achievement);
  const hand = getOpponentHand(achievement);
  assert.equal(hand.category, "full-house");
  assert.deepEqual(hand.bestCards, [
    card("A", "diamonds"),
    card("A", "hearts"),
    card("7", "clubs"),
    card("7", "hearts"),
    card("7", "diamonds"),
  ]);
  assert.deepEqual(achievement, before);
  assert.equal(
    getOpponentHand({
      ...achievement,
      records: [{ ...achievement.records[0], date: "2026-02-29" }],
    }),
    null,
  );
  assert.equal(getOpponentHand({ ...achievement, high: 8 }), null);
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
    assert.equal(validateRecord(achievement, original.records[0]), false);
  }
  const tampered = structuredClone(original);
  tampered.cards[0] = card("2", "diamonds");
  assert.equal(validateRecord(tampered, original.records[0]), false);

  const stats = getStats([
    { ...find("royal-spades"), records: original.records },
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
