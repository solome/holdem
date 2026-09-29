import test from "node:test";
import assert from "node:assert/strict";
import {
  sampleOpponentWorlds,
  evaluateHoldemDecision,
  createHoldemDecisionEngine,
} from "../src/holdem-decision-engine.mjs";
import { createFriendPlayerBrain, decideFriendAction } from "../src/friend-player-brain.mjs";
import { ODDS_DECK, evaluateBest } from "../src/poker-odds.mjs";
import { friendStrategyContext } from "../scripts/friend-strategy-diagnostics.mjs";
import { assertDecisionMetadata } from "./helpers/friend-table-assertions.mjs";

const suits = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const hand = (text) => text.split(" ").map((value) => ({ rank: value.slice(0, -1), suit: suits[value.at(-1)] }));
const key = ({ rank, suit }) => `${rank}:${suit}`;
const profile = () => ({ ...createFriendPlayerBrain({ personId: "juyipeng", seed: 1 }).profile, bluffFrequency: 1 });
const types = new Set(["check", "call", "bet", "raise", "fold"]);

function riverContext({ hero = "8c 9d", board = "Ah Ad 7c 4d 2s", callCost = 8, ownInvestment = 0, pot = 40 } = {}) {
  const raiseTo = ownInvestment + callCost;
  const initialPot = pot - ownInvestment - raiseTo;
  const history = ownInvestment > 0 ? [{ personId: "juyipeng", type: "bet", amount: ownInvestment, to: ownInvestment, callCost: 0, potBefore: initialPot }] : [];
  if (callCost) history.push({ personId: "xingxing", type: ownInvestment ? "raise" : "bet", amount: raiseTo, to: raiseTo, callCost: ownInvestment, potBefore: initialPot + ownInvestment });
  else history.push({ personId: "xingxing", type: "check", amount: 0, to: 0, callCost: 0, potBefore: pot });
  const lastFullRaise = callCost || 1;
  return {
    personId: "juyipeng", position: "BTN", seatIndex: 4, holeCards: hand(hero), board: hand(board), street: "river",
    pot, callCost, raiseTo, ownInvestment, remaining: 200, effectiveStack: 200, activeCount: 2,
    raiseCount: callCost ? ownInvestment ? 2 : 1 : 0, lastFullRaise, minRaiseTo: raiseTo + lastFullRaise,
    maxRaiseTo: 199 + ownInvestment, canRaise: true, isLastToAct: true, openerPosition: null, lastRaiserPosition: callCost ? "BB" : null,
    callerCount: 0, history, priorHistory: {},
    players: [
      { personId: "juyipeng", position: "BTN", seatIndex: 4, initialStack: 200 + initialPot / 2 + ownInvestment,
        remaining: 200, invested: initialPot / 2 + ownInvestment, streetPaid: ownInvestment, folded: false, foldStreet: null },
      { personId: "xingxing", position: "BB", seatIndex: 6, initialStack: 200 + initialPot / 2 + raiseTo,
        remaining: 200, invested: initialPot / 2 + raiseTo, streetPaid: raiseTo, folded: false, foldStreet: null },
    ],
  };
}

const fixedRange = (cards, continuationProbability = () => 1, id = "fixed") => ({
  id, ranges: { xingxing: [{ holeCards: hand(cards), weight: 1 }] }, continuationProbability, realization: 1,
});
const callCandidate = (analysis) => {
  const result = analysis.candidates.find((candidate) => candidate.type === "call");
  assert.ok(result, "A facing-bet analysis must explain the EV of calling.");
  return result;
};

function assertAnalysis(analysis) {
  assert.ok(Number.isFinite(analysis.equity) && analysis.equity >= 0 && analysis.equity <= 1);
  assert.ok(Number.isFinite(analysis.potOdds) && analysis.potOdds >= 0 && analysis.potOdds <= 1);
  assert.ok(analysis.candidates.length > 0);
  for (const candidate of analysis.candidates) {
    assert.ok(types.has(candidate.type));
    assert.ok(Number.isFinite(candidate.ev), `${candidate.type} EV must be finite.`);
    if (candidate.foldEquity != null) assert.ok(candidate.foldEquity >= 0 && candidate.foldEquity <= 1);
    if (candidate.equityWhenCalled != null) assert.ok(candidate.equityWhenCalled >= 0 && candidate.equityWhenCalled <= 1);
  }
}

test("joint opponent worlds never collide with one another, the hero or the board", () => {
  const view = friendStrategyContext("ak_q72_four_way");
  const captured = [];
  const result = sampleOpponentWorlds(view, { samples: 48, seed: 981, onSample: (world) => captured.push(structuredClone(world)) });
  assert.equal(result.worlds.length, 48);
  assert.equal(captured.length, 48);
  for (const world of captured) {
    assert.equal(world.opponents.length, view.activeCount - 1);
    assert.equal(world.board.length, 5);
    assert.deepEqual(world.board.slice(0, view.board.length), view.board);
    const all = [...view.holeCards, ...world.board, ...world.opponents.flatMap((opponent) => opponent.holeCards)];
    assert.equal(all.length, 2 + 5 + 2 * (view.activeCount - 1));
    assert.equal(new Set(all.map(key)).size, all.length);
  }
  assert.deepEqual(sampleOpponentWorlds(view, { samples: 48, seed: 981 }).worlds, result.worlds);
  assert.notDeepEqual(sampleOpponentWorlds(view, { samples: 48, seed: 982 }).worlds, result.worlds);
});

test("incompatible or empty modeled ranges cannot manufacture overlapping worlds", () => {
  const view = friendStrategyContext("ak_q72_four_way");
  const opponents = view.players.filter((player) => player.personId !== view.personId);
  const impossible = { ranges: Object.fromEntries(opponents.map((opponent) => [opponent.personId, [{ holeCards: hand("Ah Ad"), weight: 1 }]])) };
  assert.throws(() => sampleOpponentWorlds(view, { samples: 4, seed: 1, rangeModel: impossible }));
  assert.throws(() => sampleOpponentWorlds(view, { samples: 4, seed: 1,
    rangeModel: { ranges: { [opponents[0].personId]: [] } } }));
});

test("zero equity with no fold equity rejects expensive calls and bluffs, even at maximum bluff preference", () => {
  const rangeModel = fixedRange("As Ac");
  for (const callCost of [0, 8]) {
    const view = riverContext({ callCost });
    const analysis = evaluateHoldemDecision(view, { samples: 16, seed: 9, rangeModel, profile: profile() });
    assertAnalysis(analysis);
    assert.equal(analysis.equity, 0);
    if (callCost) assert.equal(callCandidate(analysis).ev, -callCost);
    for (const candidate of analysis.candidates.filter((candidate) => ["bet", "raise"].includes(candidate.type))) {
      assert.equal(candidate.foldEquity, 0);
      assert.ok(candidate.ev < 0);
    }
    const action = createHoldemDecisionEngine({ samples: 16, rangeModel }).decide(view, { profile: profile(), seed: 9, random: () => 0 });
    assert.equal(action.type, callCost ? "fold" : "check");
    assert.notEqual(action.intent, "bluff");
    assertDecisionMetadata(action);
  }
});

test("the nuts continue at positive EV and already invested chips are not charged twice", () => {
  const rangeModel = fixedRange("8c 9d");
  for (const ownInvestment of [0, 4]) {
    const view = riverContext({ hero: "As Ac", ownInvestment });
    const analysis = evaluateHoldemDecision(view, { samples: 16, seed: 12, rangeModel, profile: profile() });
    assertAnalysis(analysis);
    assert.equal(analysis.equity, 1);
    assert.equal(callCandidate(analysis).ev, view.pot);
    const action = createHoldemDecisionEngine({ samples: 16, rangeModel }).decide(view, { profile: profile(), seed: 12, random: () => 0.7 });
    assert.ok(["call", "raise"].includes(action.type));
    assert.ok(!["bluff", "semi-bluff"].includes(action.intent));
  }
});

test("an uncalled bluff wins only the current pot regardless of how much was put forward", () => {
  const view = riverContext({ callCost: 0 });
  const rangeModel = fixedRange("As Ac", () => 0, "always-fold");
  const analysis = evaluateHoldemDecision(view, { samples: 16, seed: 42, rangeModel, profile: profile() });
  const bets = analysis.candidates.filter((candidate) => candidate.type === "bet");
  assert.ok(bets.length > 0);
  for (const candidate of bets) {
    assert.equal(candidate.foldEquity, 1);
    assert.equal(candidate.ev, view.pot, "Unmatched new chips are returned; they are not profit.");
  }
});

test("called-bet equity conditions on the continuing range instead of reusing overall equity", () => {
  const view = riverContext({ hero: "Ks Kh", board: "2h 7c 9d Js 3h", callCost: 0 });
  const rangeModel = { id: "strong-only-calls", ranges: { xingxing: [
    { holeCards: hand("As Ad"), weight: 1 }, { holeCards: hand("Qc Qd"), weight: 1 },
  ] }, continuationProbability: ({ holeCards }) => holeCards[0].rank === "A" ? 1 : 0, realization: 1 };
  const analysis = evaluateHoldemDecision(view, { samples: 96, seed: 710, rangeModel, profile: profile() });
  assert.ok(analysis.equity > 0.25 && analysis.equity < 0.75);
  const bets = analysis.candidates.filter((candidate) => candidate.type === "bet");
  assert.ok(bets.length > 0);
  assert.equal(new Set(bets.map((candidate) => candidate.foldEquity)).size, 1,
    "Common worlds and response draws should make this size-independent response model agree across bet sizes.");
  for (const candidate of bets) {
    assert.equal(candidate.equityWhenCalled, 0);
    const expected = candidate.foldEquity * view.pot - (1 - candidate.foldEquity) * candidate.to;
    assert.ok(Math.abs(candidate.ev - expected) < 1e-9);
  }
});

test("arbitrary distinct-card contexts produce finite EVs and reproducible legal choices", () => {
  const base = friendStrategyContext("ak_q72_rainbow");
  for (let index = 0; index < 18; index += 1) {
    const deck = [...ODDS_DECK];
    let state = index + 971;
    for (let remaining = deck.length - 1; remaining > 0; remaining -= 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const other = Math.floor(state / 4294967296 * (remaining + 1));
      [deck[remaining], deck[other]] = [deck[other], deck[remaining]];
    }
    const length = [3, 4, 5][index % 3];
    const view = { ...structuredClone(base), holeCards: deck.slice(0, 2), board: deck.slice(2, 2 + length),
      street: { 3: "flop", 4: "turn", 5: "river" }[length] };
    const options = { samples: 12, seed: 314 + index, profile: profile() };
    const first = evaluateHoldemDecision(view, options);
    const second = evaluateHoldemDecision(view, options);
    assertAnalysis(first);
    assert.deepEqual(second, first);
    const engine = createHoldemDecisionEngine({ samples: 12 });
    const action = engine.decide(view, { profile: profile(), seed: 314 + index, random: () => 0.4 });
    assertDecisionMetadata(action);
    assert.ok(["check", "bet"].includes(action.type));
    if (action.type === "bet") assert.ok(action.to >= view.minRaiseTo && action.to <= view.maxRaiseTo);
  }
});

test("all seven player brains and the pure decision entry point use the shared decision engine", () => {
  const seen = [];
  const spy = { decide(view, options) {
    seen.push({ personId: view.personId, profileId: options.profile.id });
    return { type: "check", intent: "control", reason: "ev-check", profileId: options.profile.id,
      bluffProbability: 0, decisionProbabilities: { check: 1, call: 0, bet: 0, raise: 0, fold: 0 },
      analysis: { equity: 0, potOdds: 0, samples: 0, method: "test-spy", assumptions: [], opponentRanges: [], candidates: [] } };
  } };
  const people = ["tengteng", "kelin", "xingxing", "juyipeng", "minmin", "wangwang", "jianjian"];
  for (const personId of people) {
    const view = friendStrategyContext("ak_q72_rainbow", { personId });
    const brain = createFriendPlayerBrain({ personId, seed: 3, decisionEngine: spy });
    assert.equal(brain.decide(view).type, "check");
  }
  decideFriendAction(friendStrategyContext("ak_q72_rainbow"), { profile: profile(), engine: spy, random: () => 0.5 });
  assert.equal(seen.length, people.length + 1);
  assert.deepEqual(seen.slice(0, people.length).map((entry) => entry.personId), people);
});

test("a zero-equity multiway hand cannot bluff opponents modeled as never folding", () => {
  const view = riverContext();
  Object.assign(view, { position: "UTG", seatIndex: 0, activeCount: 4, isLastToAct: false,
    players: [
      { personId: "juyipeng", position: "UTG", seatIndex: 0, initialStack: 208, remaining: 200, invested: 8, streetPaid: 0, folded: false },
      { personId: "xingxing", position: "BB", seatIndex: 6, initialStack: 216, remaining: 200, invested: 16, streetPaid: 8, folded: false },
      { personId: "kelin", position: "HJ", seatIndex: 2, initialStack: 208, remaining: 200, invested: 8, streetPaid: 0, folded: false },
      { personId: "tengteng", position: "CO", seatIndex: 3, initialStack: 208, remaining: 200, invested: 8, streetPaid: 0, folded: false },
    ] });
  const rangeModel = { id: "multiway-no-fold", ranges: {
    xingxing: [{ holeCards: hand("As Ac"), weight: 1 }], kelin: [{ holeCards: hand("Ks Kh"), weight: 1 }],
    tengteng: [{ holeCards: hand("Qs Qh"), weight: 1 }],
  }, continuationProbability: () => 1, realization: 1 };
  const action = createHoldemDecisionEngine({ samples: 16, rangeModel }).decide(view, { profile: profile(), seed: 71, random: () => 0 });
  assert.equal(action.type, "fold");
  assert.equal(action.analysis.equity, 0);
  assert.equal(action.bluffProbability, 0);
});

test("the same marginal hand stops calling when a higher price makes the call EV negative", () => {
  const rangeModel = { id: "price-test", ranges: { xingxing: [
    { holeCards: hand("As Ad"), weight: 3 }, { holeCards: hand("Qc Qd"), weight: 1 },
  ] }, continuationProbability: () => 1, realization: 1 };
  const cheap = riverContext({ hero: "Ks Kh", board: "2h 7c 9d Js 3h", callCost: 4 });
  const expensive = riverContext({ hero: "Ks Kh", board: "2h 7c 9d Js 3h", callCost: 20 });
  const engine = createHoldemDecisionEngine({ samples: 256, rangeModel });
  const low = engine.decide(cheap, { profile: profile(), seed: 85, random: () => 0.5 });
  const high = engine.decide(expensive, { profile: profile(), seed: 85, random: () => 0.5 });
  assert.ok(callCandidate(low.analysis).ev > 0);
  assert.ok(callCandidate(high.analysis).ev < 0);
  assert.ok(["call", "raise"].includes(low.type));
  assert.equal(high.type, "fold");
});

test("profitable pure bluffs may be selected, while a zero bluff preference can disable them", () => {
  const view = riverContext({ callCost: 0 });
  const rangeModel = fixedRange("As Ac", () => 0, "profitable-pure-bluff");
  const engine = createHoldemDecisionEngine({ samples: 16, rangeModel });
  const enabled = engine.decide(view, { profile: profile(), seed: 51, random: () => 0.25 });
  assert.equal(enabled.type, "bet");
  assert.equal(enabled.intent, "bluff");
  assert.ok(enabled.analysis.selected.ev > 0);
  const disabled = engine.decide(view, { profile: { ...profile(), bluffFrequency: 0 }, seed: 51, random: () => 0.25 });
  assert.equal(disabled.type, "check");
  assert.equal(disabled.bluffProbability, 0);
});

test("response models see only the current board and public action fields, not sampled future cards or the hero's cards", () => {
  const view = friendStrategyContext("ak_q72_rainbow");
  let responses = 0;
  evaluateHoldemDecision(view, { samples: 16, seed: 613, profile: profile(), rangeModel: {
    id: "public-response-view", continuationProbability({ board, context, action, features, holeCards }) {
      responses += 1;
      assert.deepEqual(board, view.board);
      assert.ok(!Object.hasOwn(context, "holeCards"));
      assert.ok(!Object.hasOwn(context, "futureBoard"));
      for (const name of ["plan", "reason", "intent", "analysis", "equityWhenCalled"]) assert.ok(!Object.hasOwn(action, name));
      assert.equal(features.category, evaluateBest([...holeCards, ...view.board]).category);
      return 0.5;
    },
  } });
  assert.ok(responses > 0);
});
