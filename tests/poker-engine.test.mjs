import test from "node:test";
import assert from "node:assert/strict";
import { runPokerHand } from "../src/poker-engine.mjs";
import { deriveFriendTable, FRIEND_TABLE_POSITIONS } from "../src/friend-table.mjs";
import { assertConserved, assertLegalHistory, assertDecisionMetadata } from "./helpers/friend-table-assertions.mjs";

const suits = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const hand = (text) => text.split(" ").map((value) => ({ rank: value.slice(0, -1), suit: suits[value.at(-1)] }));
const streets = ["preflop", "flop", "turn", "river"];
const deal = () => ({
  board: hand("2h 5d 9c Js 4h"),
  seats: ["As Ah", "Ks Kh", "Qs Qh", "Jc Jd", "10c 10d", "8c 8d", "7c 7d"].map((cards, index) => ({
    personId: `seat-${index}`, position: FRIEND_TABLE_POSITIONS[index], seatIndex: index,
    initialStack: 200, holeCards: hand(cards),
  })),
});
const matchOrCheck = (context) => ({ type: context.callCost > 0 ? "call" : "check", reason: "scripted-control", intent: "control" });

test("a two-seat game acts SB first preflop and BB first postflop", () => {
  const source = deal();
  const table = runPokerHand({ board: source.board, seats: source.seats.slice(-2), decide: matchOrCheck });
  assert.deepEqual(table.history.preflop.map((action) => action.personId), ["seat-5", "seat-6"]);
  for (const street of ["flop", "turn", "river"]) {
    assert.deepEqual(table.history[street].map((action) => action.personId), ["seat-6", "seat-5"]);
  }
});

for (const targetStreet of ["flop", "turn", "river"]) {
  test(`${targetStreet} raises and reraises reopen action in order, including previous checks and calls`, () => {
    const actions = {
      SB: ["check", 14, 62, "call"],
      BB: [2, "call", "call", "call", "call"],
      UTG: ["call", "call", "call", "call", "call"],
      LJ: [6, 30, 126],
    };
    const table = runPokerHand({ ...deal(), createBrain: ({ personId, position }) => ({
      decide(context) {
        if (context.street !== targetStreet) return matchOrCheck(context);
        const previous = context.history.filter((action) => action.personId === personId).length;
        const planned = actions[position]?.[previous] ?? "call";
        if (typeof planned === "number") return {
          type: context.callCost > 0 ? "raise" : "bet", to: planned,
          reason: "scripted-value", intent: "value",
        };
        return planned === "check" ? { type: "check", reason: "scripted-control", intent: "control" } : matchOrCheck(context);
      },
    }) });
    const streetActions = table.history[targetStreet];
    const sb = streetActions.filter((action) => action.personId === "seat-5");
    const utg = streetActions.filter((action) => action.personId === "seat-0");
    assert.equal(sb[0].type, "check");
    assert.deepEqual(sb.filter((action) => action.type === "raise").map((action) => action.to), [14, 62]);
    assert.equal(utg[0].type, "call");
    assert.equal(utg[0].to, 2);
    assert.equal(utg.at(-1).to, 126);
    assert.equal(streetActions.filter((action) => action.type === "raise").length, 5,
      "The engine must not impose a fixed no-limit raise-count cap.");
    assert.equal(new Set(table.seats.map((seat) => seat.contributions[targetStreet])).size, 1);
    assert.equal(table.seats[0].contributions[targetStreet], 127);
    assertLegalHistory(table);
    assertConserved(table);
  });
}

test("an uncalled reraise is refunded and an uncontested flop prevents later board exposure", () => {
  const table = runPokerHand({ ...deal(), createBrain: ({ position }) => ({
    decide(context) {
      if (context.street !== "flop") return matchOrCheck(context);
      if (position === "SB" && context.callCost === 0) return { type: "bet", to: 4, intent: "value" };
      if (position === "BB") return { type: "raise", to: 12, intent: "value" };
      return { type: "fold", intent: "control" };
    },
  }) });
  assert.equal(table.endedStreet, "flop");
  assert.equal(table.uncontested, true);
  assert.deepEqual(table.winnerIds, ["seat-6"]);
  assert.deepEqual(table.refunds.flop, [{ personId: "seat-6", amount: 8 }]);
  assert.deepEqual(table.history.turn, []);
  assert.deepEqual(table.history.river, []);
  assert.equal(deriveFriendTable(table, "river").board.length, 3);
  assert.equal(deriveFriendTable(table, "river").pot, 15);
  assertLegalHistory(table);
  assertConserved(table);
});

test("the engine rejects an undersized full raise or a wager above its covered-chip cap", () => {
  for (const illegalTo of [6, 500]) {
    assert.throws(() => runPokerHand({ ...deal(), createBrain: ({ position }) => ({
      decide(context) {
        if (context.street !== "flop") return matchOrCheck(context);
        if (position === "SB" && context.callCost === 0) return { type: "bet", to: 4 };
        if (position === "BB") return { type: "raise", to: illegalTo };
        return matchOrCheck(context);
      },
    }) }), /raise|wager|bet|cover|legal|cap/i);
  }
});

test("brains receive only their own cards, visible board and public action history", () => {
  const source = deal();
  const seen = [];
  const table = runPokerHand({ ...source, createBrain: ({ personId, position }) => ({
    decide(context) {
      seen.push(structuredClone(context));
      assert.deepEqual(context.holeCards, source.seats.find((seat) => seat.personId === personId).holeCards);
      assert.deepEqual(context.board, source.board.slice(0, { preflop: 0, flop: 3, turn: 4, river: 5 }[context.street]));
      for (const player of context.players) {
        assert.ok(!Object.hasOwn(player, "holeCards"));
        assert.ok(!Object.hasOwn(player, "profile"));
      }
      const inspect = (value) => {
        if (!value || typeof value !== "object") return;
        for (const [key, child] of Object.entries(value)) {
          assert.ok(!["reason", "intent", "profileId", "bluffProbability", "decisionProbabilities", "decisionIndex", "plan", "holeCards"].includes(key),
            `Private field ${key} leaked into public action history.`);
          inspect(child);
        }
      };
      inspect(context.history);
      inspect(context.priorHistory);
      if (context.street === "flop" && position === "SB" && context.callCost === 0) {
        return { type: "bet", to: 2, reason: "bluff-bet", intent: "bluff", bluffProbability: 0.5, plan: "test-private-plan" };
      }
      return matchOrCheck(context);
    },
  }) });
  assert.equal(table.history.flop[0].intent, "bluff");
  assert.ok(seen.some((context) => context.street === "flop" && context.position === "BB" && context.history.length > 0));
  assert.ok(seen.some((context) => context.street === "turn"));
  assert.deepEqual(new Set(seen.map((context) => context.street)), new Set(streets));
  assertLegalHistory(table);
});


test("normalizing a free fold to a check also normalizes its probabilities and bluff intent", () => {
  const table = runPokerHand({ ...deal(), createBrain: () => ({
    decide(context) {
      if (context.callCost > 0) return matchOrCheck(context);
      return { type: "fold", reason: "weak-fold", intent: "bluff", bluffProbability: 0.7,
        decisionProbabilities: { check: 0, call: 0, bet: 0, raise: 0, fold: 1 } };
    },
  }) });
  const freeActions = Object.values(table.history).flat().filter((action) => action.callCost === 0);
  assert.ok(freeActions.length > 0);
  for (const action of freeActions) {
    assert.equal(action.type, "check");
    assert.equal(action.decisionProbabilities.check, 1);
    assert.equal(action.bluffProbability, 0);
    assertDecisionMetadata(action);
  }
  assertLegalHistory(table);
});

test("non-blind first-action folds cost nothing and an uncontested preflop raise returns its unmatched chips", () => {
  const table = runPokerHand({ ...deal(), createBrain: ({ position }) => ({ decide(context) {
    if (position === "UTG") return { type: "raise", to: 3, intent: "value" };
    return { type: context.callCost ? "fold" : "check", intent: "control" };
  } }) });
  assert.equal(table.endedStreet, "preflop");
  assert.deepEqual(table.winnerIds, ["seat-0"]);
  for (const seat of table.seats.slice(1, 5)) assert.equal(seat.contributions.preflop, 0);
  assert.deepEqual(table.refunds.preflop, [{ personId: "seat-0", amount: 2 }]);
  assert.equal(deriveFriendTable(table, "river").board.length, 0);
  assert.equal(deriveFriendTable(table).pot, 2.5);
  assertLegalHistory(table);
  assertConserved(table);
});

test("a two-blind limped pot accepts a one-blind bet but rejects a half-blind bet", () => {
  const play = (to) => runPokerHand({ ...deal(), createBrain: ({ position }) => ({ decide(context) {
    if (context.street === "preflop" && !["SB", "BB"].includes(position)) return { type: "fold", intent: "control" };
    if (context.street === "flop" && position === "BB" && context.callCost === 0) return { type: "bet", to, intent: "value" };
    return matchOrCheck(context);
  } }) });
  assert.throws(() => play(0.5), /minimum|raise|increment/i);
  const table = play(1);
  assert.equal(deriveFriendTable(table).pot, 2);
  assert.equal(table.history.flop.find((action) => action.type === "bet").amount, 1);
  assertLegalHistory(table);
});

test("the driver exposes limpers, prior investment and the latest raiser without forgetting waiting players", () => {
  const seen = [];
  const table = runPokerHand({ ...deal(), createBrain: ({ position }) => ({ decide(context) {
    seen.push(structuredClone(context));
    if (context.street !== "preflop") return matchOrCheck(context);
    if (position === "HJ" && context.raiseCount === 0) return { type: "raise", to: 5, intent: "value" };
    if (position === "BTN" && context.raiseCount === 1) return { type: "raise", to: 15, intent: "value" };
    if (position === "SB") return { type: "fold", intent: "control" };
    return matchOrCheck(context);
  } }) });
  const first = (position) => seen.find((view) => view.street === "preflop" && view.position === position);
  assert.equal(first("HJ").callerCount, 2);
  assert.equal(first("HJ").openerPosition, null);
  assert.equal(first("CO").openerPosition, "HJ");
  assert.equal(first("CO").raiseTo, 5);
  const bigBlind = first("BB");
  assert.equal(bigBlind.openerPosition, "HJ");
  assert.equal(bigBlind.lastRaiserPosition, "BTN");
  assert.equal(bigBlind.callerCount, 0);
  for (const position of ["UTG", "LJ"]) {
    const waiting = bigBlind.players.find((player) => player.position === position);
    assert.equal(waiting.folded, false);
    assert.equal(waiting.streetPaid, 1);
  }
  const reopening = seen.find((view) => view.street === "preflop" && view.position === "HJ" && view.raiseCount === 2);
  assert.equal(reopening.ownInvestment, 5);
  assert.equal(reopening.callCost, 10);
  assertLegalHistory(table);
});
