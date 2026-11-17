import test from "node:test";
import assert from "node:assert/strict";
import { REVIEW_CASES } from "../src/review-cases.mjs";
import { REVIEW_EQUITY_DEALS, buildSidePots } from "../src/review-equity.mjs";
import { evaluateBest } from "../src/poker-odds.mjs";
import { REVIEW_PEOPLE } from "../src/review-people.mjs";

test("friend identities persist across hands even when their local player IDs change", () => {
  assert.deepEqual(REVIEW_CASES[0].players.map(({ personId }) => personId), ["tengteng", "kelin", "xingxing", "juyipeng"]);
  assert.deepEqual(REVIEW_CASES[1].players.map(({ personId }) => personId), ["xingxing", "juyipeng"]);
  for (const record of REVIEW_CASES) {
    for (const player of record.players) assert.ok(REVIEW_PEOPLE[player.personId]);
    assert.equal(record.players.find(({ id }) => id === record.heroId).personId, "juyipeng");
    assert.ok(record.story.paragraphs.length > 0);
  }
  assert.equal(REVIEW_CASES[1].players[0].position, "SB");
  assert.equal(REVIEW_CASES[1].players[1].position, undefined);
  assert.equal(REVIEW_CASES[0].players[3].stack, null);
});

test("displayed records and each revealed street match the exact probability inputs", () => {
  assert.deepEqual(REVIEW_CASES.map(({ id }) => id), ["fourWay", "headsUp"]);
  for (const record of REVIEW_CASES) {
    const deal = REVIEW_EQUITY_DEALS[record.id];
    assert.deepEqual(record.players.map(({ id, hand }) => ({ id, hand })), deal.players);
    assert.deepEqual(record.streets.map(({ id }) => id), ["preflop", "flop", "turn", "river"]);
    record.streets.forEach((street, index) => {
      assert.deepEqual(street.board, deal.board.slice(0, [0, 3, 4, 5][index]));
      assert.ok(street.actions.every((action) => record.players.some(({ id }) => id === action.player)));
      assert.ok(street.analysis.every((entry) => record.players.some(({ id }) => id === entry.player)));
    });
  }
});

function contributions(record) {
  return record.players.map(({ id }) => ({
    id,
    contribution: record.streets.reduce((total, street) => total + Math.max(0,
      ...street.actions.filter((action) => action.player === id && Number.isFinite(action.to)).map(({ to }) => to)), 0),
  }));
}

test("recorded action totals yield the first hand's three pots and the second hand's refund", () => {
  const first = contributions(REVIEW_CASES[0]);
  assert.deepEqual(first.map(({ contribution }) => contribution), [28, 20, 31, 31]);
  const firstPots = buildSidePots(first);
  assert.deepEqual(firstPots.map(({ amount }) => amount), [80, 24, 6]);
  assert.deepEqual(firstPots.map(({ eligible }) => eligible), [["A", "B", "C", "D"], ["A", "C", "D"], ["C", "D"]]);
  const second = contributions(REVIEW_CASES[1]);
  assert.deepEqual(second.map(({ contribution }) => contribution), [260, 120]);
  assert.deepEqual(buildSidePots(second).map(({ kind, amount }) => ({ kind, amount })), [
    { kind: "pot", amount: 240 }, { kind: "refund", amount: 140 },
  ]);
});

test("both records identify the user and the winning five cards correctly", () => {
  for (const [index, record] of REVIEW_CASES.entries()) {
    assert.equal(record.heroId, index === 0 ? "D" : "B");
    assert.equal(record.result.winner, record.heroId);
    const board = record.streets.at(-1).board;
    const scores = record.players.map((player) => ({ id: player.id, hand: evaluateBest([...player.hand, ...board]) }));
    const winner = scores.find(({ id }) => id === record.heroId);
    assert.ok(scores.filter(({ id }) => id !== record.heroId).every(({ hand }) => hand.score < winner.hand.score));
    assert.deepEqual(winner.hand.bestCards.map(({ rank }) => rank), index === 0 ? ["6", "6", "5", "5", "5"] : ["J", "10", "9", "8", "7"]);
    assert.equal(record.streets[2].actions.length, 0);
    assert.equal(record.streets[3].actions.length, 0);
  }
});
