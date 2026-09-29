import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FRIEND_TABLE_POSITIONS,
  FRIEND_TABLE_STORAGE_KEY,
  createFriendTable as createFriendTableDefault,
  createFriendTableStore as createFriendTableStoreDefault,
  deriveFriendTable,
  simulateFriendTable as simulateFriendTableDefault,
  analyzeFriendHand,
} from "../src/friend-table.mjs";
import { ODDS_DECK } from "../src/poker-odds.mjs";
import { runPokerHand } from "../src/poker-engine.mjs";
import { createFriendPlayerBrain } from "../src/friend-player-brain.mjs";
import { choosePreflopAction, choosePostflopAction } from "../src/friend-table-policy.mjs";
import { analyzeFriendTables } from "../scripts/analyze-friend-table.mjs";
import { assertConserved, assertLegalHistory, assertDecisionMetadata } from "./helpers/friend-table-assertions.mjs";

// Structural and persistence regressions use a small deterministic MC budget;
// exact-EV and production-latency checks live in dedicated suites.
const createFriendTable = (options) => createFriendTableDefault({ engineOptions: { samples: 24 }, ...options });
const createFriendTableStore = (options) => createFriendTableStoreDefault({ engineOptions: { samples: 24 }, ...options });
const simulateFriendTable = (options) => simulateFriendTableDefault({ engineOptions: { samples: 24 }, ...options });

const originalAk = JSON.parse(readFileSync(new URL("./fixtures/friend-ak-v1.json", import.meta.url)));
const streets = ["preflop", "flop", "turn", "river"];
const peopleIds = ["tengteng", "kelin", "xingxing", "juyipeng", "minmin", "wangwang", "jianjian"];
const cardKey = ({ rank, suit }) => `${rank}:${suit}`;
const card = (rank, suit) => ({ rank, suit });

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function memoryStorage(initial = null) {
  const values = new Map(initial === null ? [] : [[FRIEND_TABLE_STORAGE_KEY, initial]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

// Settled input for the display/evaluator only; strategy behavior is tested through simulateFriendTable.
function fixture(board, hands) {
  return {
    version: 2,
    endedStreet: "river",
    uncontested: false,
    history: Object.fromEntries(streets.map((street) => [street, []])),
    refunds: Object.fromEntries(streets.map((street) => [street, []])),
    board,
    seats: peopleIds.map((personId, index) => ({
      position: FRIEND_TABLE_POSITIONS[index], personId, holeCards: hands[index], initialStack: 100,
      contributions: { preflop: 4, flop: 8, turn: 12, river: 20 },
    })),
  };
}

test("random tables deal every friend and card once and conserve chips through legal betting", () => {
  assert.deepEqual(FRIEND_TABLE_POSITIONS, ["UTG", "LJ", "HJ", "CO", "BTN", "SB", "BB"]);
  const generated = new Set();
  const lineups = new Set();
  const endings = new Set();
  const actionTypes = new Set();
  for (let seed = 1; seed <= 100; seed += 1) {
    const table = createFriendTable({ peopleIds, rng: seeded(seed) });
    assert.equal(table.version, 3);
    generated.add(JSON.stringify(table));
    lineups.add(table.seats.map((seat) => seat.personId).join(","));
    endings.add(table.endedStreet);
    Object.values(table.history).flat().forEach((action) => {
      actionTypes.add(action.type);
      assertDecisionMetadata(action);
    });
    assert.deepEqual(table.seats.map((seat) => seat.position), FRIEND_TABLE_POSITIONS);
    assert.deepEqual(table.seats.map((seat) => seat.personId).sort(), [...peopleIds].sort());
    const cards = [...table.board, ...table.seats.flatMap((seat) => seat.holeCards)];
    assert.equal(cards.length, 19);
    assert.equal(new Set(cards.map(cardKey)).size, 19);
    assertConserved(table);
    assertLegalHistory(table);
  }
  assert.equal(generated.size, 100);
  assert.ok(lineups.size > 20);
  assert.ok(endings.size > 1, "Hands can finish before the river.");
  for (const type of ["check", "call", "bet", "raise", "fold"]) assert.ok(actionTypes.has(type));
});

test("preflop is the default, with starting-hand notation but no future board, made hand or winner", () => {
  const table = fixture(
    [card("2", "hearts"), card("3", "hearts"), card("4", "diamonds"), card("6", "clubs"), card("7", "clubs")],
    [
      [card("A", "clubs"), card("A", "spades")],
      [card("K", "hearts"), card("A", "hearts")],
      [card("9", "diamonds"), card("10", "clubs")],
      [card("2", "spades"), card("J", "spades")],
      [card("10", "diamonds"), card("10", "spades")],
      [card("Q", "clubs"), card("5", "hearts")],
      [card("K", "diamonds"), card("K", "clubs")],
    ],
  );
  table.seats[0].foldStreet = "river";
  table.seats[0].contributions.river = table.seats[0].contributions.turn;
  table.seats[1].foldStreet = "preflop";
  table.seats[1].contributions = { preflop: 1, flop: 1, turn: 1, river: 1 };
  const preflop = deriveFriendTable(table);
  assert.equal(preflop.street, "preflop");
  assert.deepEqual(preflop, deriveFriendTable(table, "preflop"));
  assert.deepEqual(preflop.board, []);
  assert.deepEqual(preflop.winnerIds, []);
  assert.deepEqual(preflop.seats.map((seat) => seat.startingHand), ["AA", "AKs", "T9o", "J2s", "TT", "Q5o", "KK"]);
  assert.equal(preflop.seats[0].folded, false);
  assert.equal(preflop.seats[1].folded, true);
  assert.equal(preflop.pot, 1 + 4 * (peopleIds.length - 1));
  for (const seat of preflop.seats) {
    assert.equal(seat.category, null);
    assert.equal(seat.score, null);
    assert.deepEqual(seat.bestCards, []);
    assert.equal(seat.winner, false);
  }
  const flop = deriveFriendTable(table, "flop");
  assert.equal(flop.board.length, 3);
  assert.ok(flop.seats.every((seat) => typeof seat.category === "string" && seat.bestCards.length === 5));
  assert.deepEqual(flop.seats.map((seat) => seat.startingHand), preflop.seats.map((seat) => seat.startingHand));
});

test("each street evaluates only its visible board and river identifies the strongest set", () => {
  const ranks = ["A", "K", "Q", "J", "9", "7", "4"];
  const table = fixture(
    [card("A", "hearts"), card("K", "spades"), card("Q", "hearts"), card("J", "spades"), card("2", "clubs")],
    ranks.map((rank) => [card(rank, "clubs"), card(rank, "diamonds")]),
  );
  const flop = deriveFriendTable(table, "flop");
  assert.deepEqual(flop.seats.map((seat) => seat.category), ["three-kind", "three-kind", "three-kind", "one-pair", "one-pair", "one-pair", "one-pair"]);
  assert.ok(flop.seats.every((seat) => !seat.winner));
  assert.equal(flop.pot, 8 * peopleIds.length);
  assert.equal(deriveFriendTable(table, "turn").seats[3].category, "three-kind");
  const river = deriveFriendTable(table, "river");
  assert.deepEqual(river.winnerIds, [peopleIds[0]]);
  assert.deepEqual(river.seats.map((seat) => seat.winner), [true, false, false, false, false, false, false]);
  assert.equal(river.pot, 20 * peopleIds.length);
  assert.equal(river.seats[0].remaining, 80);
});

test("a royal flush on the board correctly gives all seven friends a shared win", () => {
  const table = fixture(
    ["10", "J", "Q", "K", "A"].map((rank) => card(rank, "hearts")),
    ["2", "3", "4", "5", "6", "7", "8"].map((rank) => [card(rank, "spades"), card(rank, "clubs")]),
  );
  const river = deriveFriendTable(table, "river");
  assert.deepEqual(river.winnerIds, peopleIds);
  for (const seat of river.seats) {
    assert.equal(seat.category, "royal-flush");
    assert.equal(seat.winner, true);
    assert.deepEqual(new Set(seat.bestCards.map(cardKey)), new Set(table.board.map(cardKey)));
  }
});

test("folded best hands cannot win, and their committed chips remain in the pot", () => {
  const table = fixture(
    [card("A", "hearts"), card("K", "spades"), card("Q", "hearts"), card("J", "spades"), card("2", "clubs")],
    ["A", "K", "Q", "J", "9", "7", "4"].map((rank) => [card(rank, "clubs"), card(rank, "diamonds")]),
  );
  table.seats[0].foldStreet = "flop";
  table.seats[0].contributions = { preflop: 4, flop: 4, turn: 4, river: 4 };
  table.seats[1].foldStreet = "river";
  table.seats[1].contributions.river = 12;
  assert.equal(deriveFriendTable(table, "flop").seats[0].folded, true);
  assert.equal(deriveFriendTable(table, "turn").seats[1].folded, false);
  const river = deriveFriendTable(table, "river");
  assert.deepEqual(river.winnerIds, [peopleIds[2]]);
  assert.ok(river.seats[0].score > river.seats[2].score);
  assert.equal(river.seats[0].category, "three-kind");
  assert.equal(river.seats[0].winner, false);
  assert.equal(river.seats[1].winner, false);
  assert.equal(river.pot, 4 + 12 + 20 * (peopleIds.length - 2));
  assert.equal(river.seats.reduce((sum, seat) => sum + seat.remaining, river.pot), peopleIds.length * 100);
});

test("shared board wins include only players who reached the river", () => {
  const table = fixture(
    ["10", "J", "Q", "K", "A"].map((rank) => card(rank, "hearts")),
    ["2", "3", "4", "5", "6", "7", "8"].map((rank) => [card(rank, "spades"), card(rank, "clubs")]),
  );
  for (const seat of table.seats.slice(0, 4)) {
    seat.foldStreet = "preflop";
    seat.contributions = { preflop: 1, flop: 1, turn: 1, river: 1 };
  }
  const river = deriveFriendTable(table, "river");
  assert.deepEqual(river.winnerIds, peopleIds.slice(4));
  assert.deepEqual(river.seats.map((seat) => seat.winner), [false, false, false, false, true, true, true]);
  assert.equal(river.pot, 4 + 20 * (peopleIds.length - 4));
});

test("reloads retain the saved seats, cards, stacks and contributions without drawing again", () => {
  const storage = memoryStorage();
  const first = createFriendTableStore({ peopleIds, storage, rng: seeded(20) });
  const firstLoad = first.load();
  assert.equal(firstLoad.persisted, true);
  assert.strictEqual(first.load(), firstLoad);
  const unexpectedRandom = () => assert.fail("A saved table must not be randomly dealt again.");
  const reloaded = createFriendTableStore({ peopleIds: [...peopleIds].reverse(), storage, rng: unexpectedRandom }).load();
  assert.equal(reloaded.persisted, true);
  assert.deepEqual(reloaded.table, firstLoad.table);
  assert.deepEqual(deriveFriendTable(reloaded.table, "river"), deriveFriendTable(firstLoad.table, "river"));
});

test("dealing again rotates the button while physical seats stay fixed and reloads retain the hand", () => {
  const storage = memoryStorage();
  const store = createFriendTableStore({ peopleIds, storage, rng: seeded(14) });
  const first = store.load();
  const second = store.dealAgain();
  assert.equal(second.persisted, true);
  assert.notDeepEqual(second.table, first.table);
  assert.notDeepEqual(second.table.board, first.table.board);
  assert.deepEqual(second.table.seatOrder, first.table.seatOrder);
  assert.equal(second.table.buttonSeat, (first.table.buttonSeat + 1) % peopleIds.length);
  assert.equal(second.table.handNumber, first.table.handNumber + 1);
  assert.notDeepEqual(second.table.seats.map((seat) => seat.personId), first.table.seats.map((seat) => seat.personId));
  for (const seat of first.table.seats) {
    assert.equal(second.table.seats.find((next) => next.personId === seat.personId).seatIndex, seat.seatIndex);
  }
  assert.notDeepEqual(second.table.seats.map((seat) => seat.holeCards), first.table.seats.map((seat) => seat.holeCards));
  assert.strictEqual(store.load(), second);
  assert.deepEqual(JSON.parse(storage.getItem(FRIEND_TABLE_STORAGE_KEY)), second.table);
  const reloaded = createFriendTableStore({
    peopleIds, storage, rng: () => assert.fail("Reload must reuse the newly dealt hand."),
  }).load();
  assert.deepEqual(reloaded.table, second.table);
  const third = store.dealAgain();
  assert.notDeepEqual(third.table, second.table);
  assert.strictEqual(store.load(), third);
  assert.deepEqual(deriveFriendTable(third.table).board, []);
});

test("dealing again still keeps the new hand in memory when saving fails", () => {
  const storage = memoryStorage();
  const store = createFriendTableStore({ peopleIds, storage, rng: seeded(10) });
  const first = store.load();
  storage.setItem = () => { throw new Error("Quota exceeded"); };
  const second = store.dealAgain();
  assert.equal(second.persisted, false);
  assert.notDeepEqual(second.table, first.table);
  assert.strictEqual(store.load(), second);
  assert.deepEqual(JSON.parse(storage.getItem(FRIEND_TABLE_STORAGE_KEY)), first.table);
  const memoryOnly = createFriendTableStore({ peopleIds, storage: null, rng: seeded(5) });
  const initialDeal = memoryOnly.dealAgain();
  assert.strictEqual(memoryOnly.load(), initialDeal);
  assert.equal(initialDeal.persisted, false);
  const nextDeal = memoryOnly.dealAgain();
  assert.notDeepEqual(nextDeal.table, initialDeal.table);
  assert.strictEqual(memoryOnly.load(), nextDeal);
});

test("a saved six-person table is replaced after the seventh friend joins", () => {
  const oldTable = structuredClone(createFriendTable({ peopleIds, rng: () => 0 }));
  oldTable.seats = oldTable.seats.filter((seat) => seat.personId !== "jianjian");
  const oldPositions = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
  oldTable.seats.forEach((seat, index) => { seat.position = oldPositions[index]; });
  const storage = memoryStorage(JSON.stringify(oldTable));
  const loaded = createFriendTableStore({ peopleIds, storage, rng: seeded(20) }).load();
  assert.equal(loaded.persisted, true);
  assert.equal(loaded.table.seats.length, 7);
  assert.deepEqual(loaded.table.seats.map((seat) => seat.position), FRIEND_TABLE_POSITIONS);
  assert.ok(loaded.table.seats.some((seat) => seat.personId === "jianjian"));
  assert.notDeepEqual(loaded.table.board, oldTable.board);
  assert.deepEqual(JSON.parse(storage.getItem(FRIEND_TABLE_STORAGE_KEY)), loaded.table);
});

test("v1 migration repairs the reported AK fold while preserving the actual deal", () => {
  const storage = memoryStorage(JSON.stringify(originalAk));
  const loaded = createFriendTableStore({
    peopleIds, storage, rng: () => assert.fail("Migrating a valid deal must not reshuffle it."),
  }).load();
  assert.equal(loaded.persisted, true);
  assert.equal(loaded.table.version, 3);
  assert.deepEqual(loaded.table.board, originalAk.board);
  assert.deepEqual(loaded.table.seats.map(({ position, personId, holeCards, initialStack }) =>
    ({ position, personId, holeCards, initialStack })), originalAk.seats.map(({ position, personId, holeCards, initialStack }) =>
    ({ position, personId, holeCards, initialStack })));
  const ak = loaded.table.seats.find((seat) => seat.personId === "juyipeng");
  const opening = loaded.table.history.preflop.find((action) => action.personId === ak.personId);
  assert.equal(opening.type, "raise");
  assert.ok(opening.to >= 3);
  assert.ok(ak.contributions.preflop >= opening.amount);
  // Later 3/4-bet pressure is a new decision; a justified fold then is allowed.
  assert.deepEqual(JSON.parse(storage.getItem(FRIEND_TABLE_STORAGE_KEY)), loaded.table);
  assertLegalHistory(loaded.table);
  assertConserved(loaded.table);
  assert.deepEqual(createFriendTableStore({ peopleIds, storage }).load().table, loaded.table);
});

test("v1 migration also repairs old records without fold fields and is deterministic", () => {
  const old = structuredClone(originalAk);
  old.seats.forEach((seat) => { delete seat.foldStreet; });
  const load = (data) => createFriendTableStore({ peopleIds, storage: memoryStorage(JSON.stringify(data)),
    rng: () => assert.fail("Migration must preserve an existing deal.") }).load();
  const first = load(old);
  assert.deepEqual(first.table.board, old.board);
  assert.deepEqual(first.table.seats.map((seat) => seat.holeCards), old.seats.map((seat) => seat.holeCards));
  assert.deepEqual(first.table, load(old).table);
  assert.equal(first.table.version, 3);
  assertLegalHistory(first.table);
});

test("saved fold histories reload without changing investments or drawing new cards", () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const storage = memoryStorage();
    const first = createFriendTableStore({ peopleIds, storage, rng: seeded(seed) }).load();
    const reloaded = createFriendTableStore({
      peopleIds, storage, rng: () => assert.fail("Valid saved fold histories must be retained."),
    }).load();
    assert.deepEqual(reloaded.table, first.table);
  }
});

test("clearing only this table's stored data produces a new deal on the next visit", () => {
  const storage = memoryStorage();
  const first = createFriendTableStore({ peopleIds, storage, rng: seeded(1) }).load();
  storage.removeItem(FRIEND_TABLE_STORAGE_KEY);
  const next = createFriendTableStore({ peopleIds, storage, rng: seeded(2) }).load();
  assert.notDeepEqual(next.table, first.table);
  assert.equal(next.persisted, true);
});

test("corrupt, incompatible, duplicate or inconsistent saved games are replaced", () => {
  const original = createFriendTable({ peopleIds, rng: seeded(3) });
  const change = (mutate) => {
    const result = structuredClone(original);
    mutate(result);
    return JSON.stringify(result);
  };
  const invalid = [
    "not json", "null", "{}",
    change((table) => { table.version = 0; }),
    change((table) => { table.seats[0].personId = "someone-else"; }),
    change((table) => { table.seats[0].personId = table.seats[1].personId; }),
    change((table) => { table.seats[0].position = "BB"; }),
    change((table) => { table.board[0] = table.seats[0].holeCards[0]; }),
    change((table) => { table.board[0].rank = "X"; }),
    change((table) => { table.seats[0].initialStack = 0; }),
  ];
  for (const raw of invalid) {
    const storage = memoryStorage(raw);
    const restored = createFriendTableStore({ peopleIds, storage, rng: seeded(50) }).load();
    assert.equal(restored.persisted, true);
    assert.deepEqual(restored.table, createFriendTable({ peopleIds, rng: seeded(50) }));
    assert.deepEqual(JSON.parse(storage.getItem(FRIEND_TABLE_STORAGE_KEY)), restored.table);
  }
});

test("a roster member replacement regenerates the table while simple roster reordering does not", () => {
  const storage = memoryStorage();
  createFriendTableStore({ peopleIds, storage, rng: seeded(1) }).load();
  const updatedPeople = [...peopleIds.slice(0, -1), "new-friend"];
  const next = createFriendTableStore({ peopleIds: updatedPeople, storage, rng: seeded(2) }).load();
  assert.deepEqual(next.table.seats.map((seat) => seat.personId).sort(), updatedPeople.sort());
});

test("unavailable or blocked browser storage retains one deal in memory for the visit", () => {
  for (const storage of [null, {
    getItem() { throw new Error("Blocked"); },
    setItem() { throw new Error("Blocked"); },
  }, {
    getItem() { return null; },
    setItem() { throw new Error("Quota exceeded"); },
  }]) {
    let draws = 0;
    const rng = seeded(10);
    const store = createFriendTableStore({ peopleIds, storage, rng: () => { draws += 1; return rng(); } });
    const first = store.load();
    const firstDrawCount = draws;
    assert.equal(first.persisted, false);
    assert.ok(firstDrawCount > 0);
    assert.strictEqual(store.load(), first);
    assert.equal(draws, firstDrawCount);
  }
});

test("invalid roster, street and random sources fail explicitly", () => {
  for (const roster of [[], peopleIds.slice(1), [...peopleIds.slice(1), peopleIds[1]], [...peopleIds.slice(1), ""]]) {
    assert.throws(() => createFriendTable({ peopleIds: roster }), TypeError);
  }
  for (const value of [-1, 1, NaN, Infinity]) {
    assert.throws(() => createFriendTable({ peopleIds, rng: () => value }), RangeError);
  }
  const table = createFriendTable({ peopleIds, rng: seeded(1) });
  assert.throws(() => deriveFriendTable(table, "unknown"), RangeError);
});

function scenario({ board = "2h 5c 9d 3s 10h", hands = ["As Kh", "2c 7d", "3c 8d", "4c 9c", "5s 10d", "6c Jd", "2s 7h"], seed = 1, samples = 24 } = {}) {
  const suits = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
  const parse = (value) => value.split(" ").map((text) => card(text.slice(0, -1), suits[text.at(-1)]));
  return simulateFriendTable({
    board: parse(board),
    seats: peopleIds.map((personId, index) => ({
      personId, position: FRIEND_TABLE_POSITIONS[index], holeCards: parse(hands[index]), initialStack: 200,
    })),
    seed, engineOptions: { samples },
  });
}

const hand = (text) => text.split(" ").map((value) => card(value.slice(0, -1),
  ({ s: "spades", h: "hearts", c: "clubs", d: "diamonds" })[value.at(-1)]));

test("premium opening decisions do not inherit arbitrary fold flags", () => {
  for (const premium of ["As Ah", "Ks Kh", "Qs Qh", "As Kh", "As Ks"]) {
    for (let seed = 1; seed <= 20; seed += 1) {
      const table = scenario({ hands: [premium, "2c 7d", "3c 8d", "4c 9c", "5s 10d", "6c Jd", "2s 7h"], seed, samples: 128 });
      const hero = table.seats[0];
      const first = table.history.preflop.find((action) => action.personId === hero.personId);
      assert.ok(["call", "raise"].includes(first.type), `${premium} seed ${seed}`);
      assert.ok(hero.contributions.preflop >= 1);
      assertLegalHistory(table);
    }
  }
});



test("changing unseen turn and river cards never changes preflop or flop decisions", () => {
  const boardA = originalAk.board;
  const used = new Set([...boardA.slice(0, 3), ...originalAk.seats.flatMap((seat) => seat.holeCards)].map(cardKey));
  const alternatives = ODDS_DECK.filter((card) => !used.has(cardKey(card))
    && !boardA.slice(3).some((later) => cardKey(later) === cardKey(card))).slice(0, 2);
  const boardB = [...boardA.slice(0, 3), ...alternatives];
  for (let seed = 1; seed <= 20; seed += 1) {
    const first = simulateFriendTable({ board: boardA, seats: originalAk.seats, seed });
    const changed = simulateFriendTable({ board: boardB, seats: originalAk.seats, seed });
    for (const street of ["preflop", "flop"]) {
      assert.deepEqual(first.history[street], changed.history[street]);
      assert.deepEqual(first.refunds[street], changed.refunds[street]);
      assert.deepEqual(first.seats.map((seat) => seat.contributions[street]), changed.seats.map((seat) => seat.contributions[street]));
    }
  }
});

test("an actor's first decision cannot depend on another player's hidden cards", () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const first = scenario({ seed });
    const changed = scenario({ seed, hands: ["As Kh", "Ac Ad", "3c 8d", "4c 9c", "5s 10d", "6c Jd", "2s 7h"] });
    assert.deepEqual(first.history.preflop[0], changed.history.preflop[0]);
  }
});

test("four suited cards create a real flush draw but two suited hole cards alone do not", () => {
  const draw = analyzeFriendHand(hand("As Js"), hand("9s 4s 2d"));
  assert.equal(draw.flushDraw, true);
  assert.equal(draw.straightDraw, false);
  assert.equal(draw.outCount, 9);
  assert.equal(draw.drawChance, 9 / 47);
  assert.equal(analyzeFriendHand(hand("As Js"), hand("9s 4s 2d 6h")).drawChance, 9 / 46);
  assert.equal(new Set(draw.outs.map(cardKey)).size, 9);
  assert.ok(draw.outs.every((card) => card.suit === "spades"));
  const backdoor = analyzeFriendHand(hand("As Js"), hand("9h 4s 2d"));
  assert.equal(backdoor.flushDraw, false);
  assert.equal(backdoor.outCount, 0);
  const bare = analyzeFriendHand(hand("As Js"), hand("9h 4c 2d"));
  assert.equal(bare.flushDraw, false);
  assert.equal(bare.outCount, 0);
});

test("open-ended, gutshot and overlapping draws count distinct immediate outs", () => {
  const openEnded = analyzeFriendHand(hand("7s 9d"), hand("10c 8h 2d"));
  assert.equal(openEnded.straightDraw, true);
  assert.equal(openEnded.outCount, 8);
  assert.equal(openEnded.drawChance, 8 / 47);
  assert.deepEqual(new Set(openEnded.outs.map((card) => card.rank)), new Set(["6", "J"]));
  const gutshot = analyzeFriendHand(hand("7s 9d"), hand("Jc 8h 2d"));
  assert.equal(gutshot.straightDraw, true);
  assert.equal(gutshot.outCount, 4);
  assert.deepEqual(new Set(gutshot.outs.map((card) => card.rank)), new Set(["10"]));
  const combo = analyzeFriendHand(hand("7s 9s"), hand("10s 8s 2d"));
  assert.equal(combo.flushDraw, true);
  assert.equal(combo.straightDraw, true);
  assert.equal(combo.outCount, 15);
  assert.equal(new Set(combo.outs.map(cardKey)).size, 15);
});

test("river cards cannot be described as a future draw and a board pair is not a hole-card pair", () => {
  const river = analyzeFriendHand(hand("As Js"), hand("9s 4s 2d 6h Kc"));
  assert.equal(river.flushDraw, false);
  assert.equal(river.straightDraw, false);
  assert.equal(river.outCount, 0);
  const boardPair = analyzeFriendHand(hand("As Kd"), hand("2s 2c 9h"));
  assert.equal(boardPair.category, "one-pair");
  assert.equal(boardPair.strength, "board-only");
});

test("saved records repair altered actions and contributions using the same deal and seed", () => {
  const original = createFriendTable({ peopleIds, rng: seeded(6) });
  for (const mutate of [
    (table) => { table.seats[0].contributions.river += 1; },
    (table) => { table.seats[0].contributions = null; },
    (table) => { table.seats.forEach((seat) => { seat.foldStreet = "river"; }); },
    (table) => { table.history.preflop[0].amount += 10; },
    (table) => { table.winnerIds = ["invented-player"]; },
  ]) {
    const damaged = structuredClone(original);
    mutate(damaged);
    const storage = memoryStorage(JSON.stringify(damaged));
    const restored = createFriendTableStore({ peopleIds, storage,
      rng: () => assert.fail("Repairing action history must preserve the original deal.") }).load();
    assert.deepEqual(restored.table, original);
    assert.deepEqual(JSON.parse(storage.getItem(FRIEND_TABLE_STORAGE_KEY)), original);
  }
});

test("a flopped four of a kind is never randomly folded to ordinary postflop betting", () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const table = scenario({
      board: "Ac Ad 2h 3d 4s",
      hands: ["As Ah", "2c 7d", "3c 8d", "4c 9c", "5s 10d", "Ks Kh", "2s 7h"], seed,
    });
    assert.notEqual(table.endedStreet, "preflop");
    assert.equal(table.seats[0].foldStreet, null);
    assert.ok(Object.values(table.history).flat().some((action) => action.personId === peopleIds[0]));
    const river = deriveFriendTable(table, "river");
    assert.ok(river.winnerIds.includes(peopleIds[0]));
    assertLegalHistory(table);
  }
});

test("the first flop actor cannot see another player's changed cards when public actions stay the same", () => {
  const board = hand("Qs Qh 2h 3d 4s");
  const holdings = ["Ah Kc", "2c 7d", "3c 8d", "4c 9c", "5s 10d", "Qc Qd", "2s 7h"];
  const run = (seed, firstHand) => runPokerHand({ board,
    seats: peopleIds.map((personId, index) => ({ personId, position: FRIEND_TABLE_POSITIONS[index], seatIndex: index,
      initialStack: 200, holeCards: hand(index === 0 ? firstHand : holdings[index]) })),
    createBrain: ({ personId }) => {
      const brain = createFriendPlayerBrain({ personId, seed, engineOptions: { samples: 24 } });
      return { decide(view) {
        if (personId === peopleIds[5] && view.street !== "preflop") return brain.decide(view);
        return { type: view.callCost ? "call" : "check", reason: "fixed-public-action", intent: "control" };
      } };
    },
  });
  for (let seed = 1; seed <= 5; seed += 1) {
    const first = run(seed, "Ah Kc");
    const changed = run(seed, "Ad Ks");
    assert.deepEqual(first.history.preflop, changed.history.preflop);
    assert.ok(first.history.flop.length > 0);
    assert.equal(first.history.flop[0].personId, peopleIds[5]);
    assert.deepEqual(first.history.flop[0], changed.history.flop[0]);
  }
});


test("migration preserves an existing deal even when the upgraded record cannot be saved", () => {
  const storage = memoryStorage(JSON.stringify(originalAk));
  storage.setItem = () => { throw new Error("Quota exceeded"); };
  const store = createFriendTableStore({ peopleIds, storage,
    rng: () => assert.fail("A failed migration write must not cause a fresh deal.") });
  const loaded = store.load();
  assert.equal(loaded.persisted, false);
  assert.equal(loaded.table.version, 3);
  assert.deepEqual(loaded.table.board, originalAk.board);
  assert.deepEqual(loaded.table.seats.map((seat) => seat.holeCards), originalAk.seats.map((seat) => seat.holeCards));
  assert.strictEqual(store.load(), loaded);
});






test("top-pair kickers use the unpaired hole card rather than the paired ace or king", () => {
  const decide = (holes, board) => choosePostflopAction({
    holeCards: hand(holes), board: hand(board), callCost: 0, pot: 6, activeCount: 2, remaining: 200,
  });
  assert.equal(decide("Ac 2d", "Ah 7s 4c").type, "check");
  assert.equal(decide("Ac Kd", "Ah 7s 4c").type, "bet");
  assert.equal(decide("Kc 2d", "Kh 7s 4c").type, "check");
  assert.equal(decide("Kc Ad", "Kh 7s 4c").type, "bet");
});

test("a made flush does not count lower-ranked straight completions as drawing outs", () => {
  const result = analyzeFriendHand(hand("As Ks"), hand("Js 9s 3d Qs"));
  assert.equal(result.category, "flush");
  assert.equal(result.outCount, 1);
  assert.deepEqual(result.outs, hand("10s"));
});

test("four-flush boards discourage betting or overcalling with a heartless straight", () => {
  const context = { holeCards: hand("Ks 8d"), board: hand("9h 10h Jh Qh 2s"),
    pot: 60, activeCount: 3, remaining: 200 };
  assert.equal(analyzeFriendHand(context.holeCards, context.board).category, "straight");
  assert.equal(choosePostflopAction({ ...context, callCost: 0 }).type, "check");
  assert.equal(choosePostflopAction({ ...context, callCost: 30 }).type, "fold");
});

test("actual nut straights and nut flushes keep value on threatening-looking boards", () => {
  for (const [holes, board] of [["As 3d", "10h Jc Qd Ks 2h"], ["Ah 5c", "Kh 9h 4h 2h 3s"]]) {
    const context = { holeCards: hand(holes), board: hand(board), pot: 60, activeCount: 3, remaining: 200 };
    assert.equal(choosePostflopAction({ ...context, callCost: 0 }).type, "bet");
    assert.equal(choosePostflopAction({ ...context, callCost: 30 }).type, "call");
  }
});


function preflopDecision(cards, overrides = {}) {
  return choosePreflopAction({
    holeCards: hand(cards), position: "BTN", callCost: 3, pot: 4.5,
    raiseCount: 1, remaining: 150, effectiveStack: 147, activeCount: 4,
    openerPosition: "HJ", lastRaiserPosition: "HJ", raiseTo: 3, ownInvestment: 0, callerCount: 0,
    ...overrides,
  });
}

test("late suited broadways and connectors can call an ordinary open with deep stacks", () => {
  for (const position of ["CO", "BTN"]) {
    for (const cards of ["Qs Js", "Js 10s", "10s 9s"]) {
      assert.equal(preflopDecision(cards, { position }).type, "call", `${position} ${cards}`);
    }
  }
});

test("small pocket pairs can continue cheaply with room to win a larger pot", () => {
  for (const cards of ["2s 2d", "4s 4d", "6s 6d"]) {
    assert.equal(preflopDecision(cards).type, "call");
    assert.equal(preflopDecision(cards, { callCost: 30, raiseTo: 30, pot: 31.5, remaining: 80, effectiveStack: 50 }).type, "fold");
  }
});

test("big-blind broadway defense accounts for a late opener and a discounted call", () => {
  const context = { position: "BB", callCost: 2, ownInvestment: 1,
    openerPosition: "BTN", lastRaiserPosition: "BTN", activeCount: 2 };
  for (const cards of ["Ks Qd", "Qs Jd", "As 10d"]) {
    assert.equal(preflopDecision(cards, context).type, "call", cards);
  }
  for (const cards of ["Qs Jd", "As 10d"]) {
    assert.equal(preflopDecision(cards, { ...context, openerPosition: "UTG", lastRaiserPosition: "UTG" }).type, "fold");
  }
  assert.equal(preflopDecision("Qs Jd", { position: "LJ", openerPosition: "UTG", lastRaiserPosition: "UTG",
    raiseTo: 20, callCost: 20, pot: 21.5 }).type, "fold");
});

test("wider ordinary-open calls do not turn trash, expensive opens or cold 3-bets into automatic calls", () => {
  assert.equal(preflopDecision("7s 4s", { position: "HJ", openerPosition: "UTG", lastRaiserPosition: "UTG" }).type, "fold");
  assert.equal(preflopDecision("7s 2d").type, "fold");
  assert.equal(preflopDecision("Js 3d", { position: "BB", callCost: 2, ownInvestment: 1,
    openerPosition: "BTN", lastRaiserPosition: "BTN" }).type, "fold");
  for (const cards of ["Qs Js", "10s 9s", "4s 4d"]) {
    assert.equal(preflopDecision(cards, { raiseTo: 20, callCost: 20, pot: 21.5 }).type, "fold");
    assert.equal(preflopDecision(cards, { raiseCount: 2, raiseTo: 10, callCost: 10,
      pot: 14.5, openerPosition: "UTG", lastRaiserPosition: "CO" }).type, "fold");
  }
});

test("multiple callers tighten dominated offsuit defenses even when the pot price improves", () => {
  const context = { position: "BB", callCost: 2, ownInvestment: 1,
    openerPosition: "CO", lastRaiserPosition: "CO", activeCount: 3 };
  assert.equal(preflopDecision("As 10d", context).type, "call");
  assert.equal(preflopDecision("As 10d", { ...context, callerCount: 2, pot: 10.5, activeCount: 4 }).type, "fold");
});




test("small reproducible samples report outcomes without forcing entertainment quotas", () => {
  // Frequencies are descriptive after EV-based decisions replace fixed targets.
  for (const seed of [20260929, 20261007]) {
    const sample = analyzeFriendTables({ hands: 24, seed, samples: 24 });
    assert.equal(Object.values(sample.endingStreets).reduce((sum, street) => sum + street.count, 0), 24);
    assert.equal(sample.sawFlop.count + sample.endingStreets.preflop.count, 24);
    assert.ok(sample.multiwayFlops.count >= 0 && sample.multiwayFlops.count <= sample.sawFlop.count);
    assert.ok(sample.flopPlayers.meanWhenFlopSeen === 0 || sample.flopPlayers.meanWhenFlopSeen >= 2);
  }
});






test("ordinary heads-up big-blind defense includes broadways and suited draws against early opens", () => {
  for (const openerPosition of ["UTG", "LJ"]) {
    for (const cards of ["Ks Qd", "As Jd", "5s 4s", "10s 8s"]) {
      assert.equal(preflopDecision(cards, { position: "BB", callCost: 2, ownInvestment: 1,
        openerPosition, lastRaiserPosition: openerPosition, activeCount: 2 }).type, "call");
    }
  }
});

test("wider blind defenses stay bounded to normal, affordable opens", () => {
  const context = { position: "BB", callCost: 2, ownInvestment: 1,
    openerPosition: "BTN", lastRaiserPosition: "BTN", activeCount: 2 };
  for (const cards of ["5s 4s", "4s 3s", "9s 8d"]) {
    assert.equal(preflopDecision(cards, context).type, "call", cards);
    assert.equal(preflopDecision(cards, { ...context, raiseTo: 2.5, callCost: 1.5, pot: 4 }).type, "call",
      "A cheaper normal open must not disable the same heads-up defense.");
    assert.equal(preflopDecision(cards, { ...context, raiseTo: 20, callCost: 19, pot: 21.5 }).type, "fold");
    assert.equal(preflopDecision(cards, { ...context, raiseCount: 2, raiseTo: 10, callCost: 9,
      pot: 14.5, openerPosition: "CO", lastRaiserPosition: "BTN" }).type, "fold");
  }
});



test("playable speculative cards may limp and overlimp for one blind in the loose table", () => {
  const context = { raiseCount: 0, raiseTo: 1, callCost: 1, ownInvestment: 0,
    openerPosition: null, lastRaiserPosition: null, pot: 1.5, callerCount: 0 };
  for (const cards of ["7s 6s", "As 5s", "4s 4d"]) {
    const first = preflopDecision(cards, context);
    const behind = preflopDecision(cards, { ...context, callerCount: 2, pot: 3.5 });
    assert.equal(first.type, "call");
    assert.equal(first.reason, "preflop-limp");
    assert.equal(behind.type, "call");
    assert.equal(behind.reason, "preflop-overlimp");
  }
});

test("a cheap speculative entry does not justify calling a large raise or 3-bet", () => {
  for (const cards of ["7s 6s", "As 5s", "4s 4d"]) {
    assert.equal(preflopDecision(cards, { ownInvestment: 1, callCost: 2, pot: 6.5 }).type, "call");
    assert.equal(preflopDecision(cards, { ownInvestment: 1, callCost: 19, raiseTo: 20, pot: 22.5 }).type, "fold");
    assert.equal(preflopDecision(cards, { ownInvestment: 1, raiseCount: 2, callCost: 9, raiseTo: 10,
      pot: 15.5, lastRaiserPosition: "UTG" }).type, "fold");
  }
});


function assertPhysicalLayout(table) {
  assert.equal(table.seatOrder.length, peopleIds.length);
  assert.equal(new Set(table.seatOrder).size, peopleIds.length);
  assert.ok(Number.isInteger(table.buttonSeat) && table.buttonSeat >= 0 && table.buttonSeat < peopleIds.length);
  assert.ok(Number.isInteger(table.handNumber) && table.handNumber >= 1);
  for (const [positionIndex, seat] of table.seats.entries()) {
    assert.equal(seat.position, FRIEND_TABLE_POSITIONS[positionIndex]);
    assert.equal(seat.seatIndex, (table.buttonSeat + positionIndex - 4 + peopleIds.length) % peopleIds.length);
    assert.equal(table.seatOrder[seat.seatIndex], seat.personId);
  }
}

test("seven redeals give everyone each position once without moving their physical seat", () => {
  const storage = memoryStorage();
  const store = createFriendTableStore({ peopleIds, storage, rng: seeded(241) });
  const initial = store.load().table;
  assert.equal(initial.buttonSeat, 4);
  assert.equal(initial.handNumber, 1);
  assertPhysicalLayout(initial);
  const seen = new Map(initial.seats.map((seat) => [seat.personId, new Set()]));
  let current = initial;
  for (let handIndex = 0; handIndex < 7; handIndex += 1) {
    assert.deepEqual(current.seatOrder, initial.seatOrder);
    assert.equal(current.handNumber, handIndex + 1);
    assert.equal(current.buttonSeat, (initial.buttonSeat + handIndex) % 7);
    assertPhysicalLayout(current);
    for (const seat of current.seats) {
      seen.get(seat.personId).add(seat.position);
      assert.equal(seat.profileId, initial.seats.find((first) => first.personId === seat.personId).profileId);
    }
    const reloaded = createFriendTableStore({ peopleIds, storage,
      rng: () => assert.fail("Reloading must not rotate the button or draw cards.") }).load().table;
    assert.deepEqual(reloaded, current);
    current = store.dealAgain().table;
  }
  for (const positions of seen.values()) assert.deepEqual([...positions].sort(), [...FRIEND_TABLE_POSITIONS].sort());
  assert.equal(current.buttonSeat, initial.buttonSeat);
  assert.deepEqual(current.seats.map((seat) => seat.personId), initial.seats.map((seat) => seat.personId));
  assert.equal(current.handNumber, 8);
});

test("legacy v1 and v2 deals gain physical-layout metadata without moving anybody", () => {
  const current = createFriendTable({ peopleIds, rng: seeded(71) });
  const v2 = structuredClone(current);
  v2.version = 2;
  v2.policyVersion = 3;
  delete v2.seatOrder;
  delete v2.buttonSeat;
  delete v2.handNumber;
  for (const seat of v2.seats) { delete seat.seatIndex; delete seat.profileId; }
  for (const legacy of [originalAk, v2]) {
    const storage = memoryStorage(JSON.stringify(legacy));
    const store = createFriendTableStore({ peopleIds, storage,
      rng: () => assert.fail("Migration must preserve cards and all existing positions.") });
    const table = store.load().table;
    assert.equal(table.version, 3);
    assertPhysicalLayout(table);
    assert.equal(table.buttonSeat, 4);
    assert.equal(table.handNumber, 1);
    assert.deepEqual(table.seatOrder, legacy.seats.map((seat) => seat.personId));
    assert.deepEqual(table.board, legacy.board);
    assert.deepEqual(table.seats.map(({ position, personId, holeCards, initialStack }) => ({ position, personId, holeCards, initialStack })),
      legacy.seats.map(({ position, personId, holeCards, initialStack }) => ({ position, personId, holeCards, initialStack })));
    assert.deepEqual(createFriendTableStore({ peopleIds, storage }).load().table, table);
  }
});
