import test from "node:test";
import assert from "node:assert/strict";
import {
  FRIEND_SIMULATION_PROFILES,
  createFriendPlayerBrain as createFriendPlayerBrainDefault,
  decideFriendAction as decideFriendActionDefault,
  playerDecisionRandom,
} from "../src/friend-player-brain.mjs";
import { analyzeFriendHand } from "../src/friend-table-policy.mjs";
import { assertDecisionMetadata } from "./helpers/friend-table-assertions.mjs";

const createFriendPlayerBrain = (options) => createFriendPlayerBrainDefault({ engineOptions: { samples: 24 }, ...options });
const decideFriendAction = (view, options = {}) => decideFriendActionDefault(view, { engineOptions: { samples: 24 }, ...options });

const ids = ["tengteng", "kelin", "xingxing", "juyipeng", "minmin", "wangwang", "jianjian"];
const suits = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const hand = (text) => text.split(" ").map((value) => ({ rank: value.slice(0, -1), suit: suits[value.at(-1)] }));
const profileFor = (personId = ids[0], overrides = {}) => ({ ...createFriendPlayerBrain({ personId, seed: 1 }).profile, ...overrides });
function context(overrides = {}) {
  const view = {
    personId: ids[0], position: "BTN", seatIndex: 4,
    holeCards: hand("Ah 4s"), board: hand("Kc Qd 8s 2h 3c"), street: "river",
    pot: 20, callCost: 0, raiseTo: 0, ownInvestment: 0, remaining: 200, effectiveStack: 200,
    activeCount: 2, raiseCount: 0, lastFullRaise: 1, minRaiseTo: 1, maxRaiseTo: 199,
    canRaise: true, openerPosition: "BTN", lastRaiserPosition: null, callerCount: 0, isLastToAct: true,
    priorHistory: {}, ...overrides,
  };
  const otherIds = ids.filter((id) => id !== view.personId).slice(0, view.activeCount - 1);
  view.history = overrides.history ?? otherIds.map((id) => ({ personId: id, type: "check", amount: 0, to: 0, callCost: 0, potBefore: view.pot }));
  if (overrides.pot == null && overrides.history?.length) {
    const last = overrides.history.at(-1);
    view.pot = last.potBefore + last.amount;
  }
  if (!overrides.players) {
    const players = [view.personId, ...otherIds];
    const paid = players.map((id) => id === view.personId ? view.ownInvestment : view.history.filter((action) => action.personId === id).at(-1)?.to ?? 0);
    const priorPotUnits = Math.round((view.pot - paid.reduce((sum, amount) => sum + amount, 0)) * 2);
    assert.ok(priorPotUnits >= 0, "Test context must account for all chips in the public pot.");
    const positions = ["SB", "BB", "HJ", "CO", "UTG", "LJ", "BTN"].filter((position) => position !== view.position);
    view.players = players.map((personId, index) => {
      const invested = paid[index] + (Math.floor(priorPotUnits / players.length) + (index < priorPotUnits % players.length ? 1 : 0)) / 2;
      const position = index === 0 ? view.position : positions[index - 1];
      const remaining = index === 0 ? view.remaining : view.effectiveStack;
      return { personId, position, seatIndex: ["UTG", "LJ", "HJ", "CO", "BTN", "SB", "BB"].indexOf(position),
        remaining, invested, initialStack: invested + remaining, streetPaid: paid[index], folded: false, foldStreet: null };
    });
  }
  return view;
}

function checkDecision(action) {
  assertDecisionMetadata(action);
  return action;
}

test("each friend has a stable simulation profile while their random decision stream is independent", () => {
  assert.ok(FRIEND_SIMULATION_PROFILES);
  const profiles = ids.map((personId) => profileFor(personId));
  assert.equal(new Set(profiles.map((profile) => profile.id)).size, ids.length);
  for (const personId of ids) {
    const first = createFriendPlayerBrain({ personId, seed: 101 });
    const second = createFriendPlayerBrain({ personId, seed: 909 });
    assert.deepEqual(first.profile, second.profile, "A person's simulated temperament must not reset with the hand seed.");
    for (const key of ["valueAggression", "drawAggression", "bluffFrequency", "callTolerance", "betSizing"]) {
      assert.ok(Number.isFinite(first.profile[key]), `Missing ${personId} profile parameter ${key}`);
    }
  }
  const draws = (personId) => Array.from({ length: 20 }, (_, decisionIndex) =>
    playerDecisionRandom({ seed: 101, personId, street: "flop", decisionIndex, channel: "test" }));
  assert.deepEqual(draws(ids[0]), draws(ids[0]));
  assert.notDeepEqual(draws(ids[0]), draws(ids[1]));
  assert.ok(draws(ids[0]).every((value) => value >= 0 && value < 1));
});

test("same seed and actor decisions reproduce even when another brain takes extra decisions", () => {
  const first = createFriendPlayerBrain({ personId: ids[0], seed: 42 });
  const second = createFriendPlayerBrain({ personId: ids[0], seed: 42 });
  const unrelated = createFriendPlayerBrain({ personId: ids[1], seed: 42 });
  const view = context();
  for (let index = 0; index < 12; index += 1) {
    const expected = checkDecision(first.decide(structuredClone(view)));
    for (let extra = 0; extra < index; extra += 1) unrelated.decide(context({ personId: ids[1] }));
    assert.deepEqual(second.decide(structuredClone(view)), expected);
  }
});

// Bluff willingness no longer overrides EV. Controlled positive/negative-EV
// bluff cases are covered in holdem-decision-engine.test.mjs.


test("semi-bluffs require real drawing outs and extra opponents reduce aggression", () => {
  const strongDraw = context({ holeCards: hand("As Js"), board: hand("9s 4s 2d"), street: "flop" });
  const profile = profileFor(ids[0], { drawAggression: 1, bluffFrequency: 1 });
  const headsUp = checkDecision(decideFriendAction(strongDraw, { profile, random: () => 0 }));
  assert.equal(headsUp.intent, "semi-bluff");
  assert.ok(["bet", "raise"].includes(headsUp.type));
  assert.equal(analyzeFriendHand(strongDraw.holeCards, strongDraw.board).outCount, 9);
  const dry = context({ holeCards: hand("As Jh"), board: hand("9d 4c 2s"), street: "flop" });
  assert.notEqual(decideFriendAction(dry, { profile, random: () => 0 }).intent, "semi-bluff");
  const river = context();
  const single = checkDecision(decideFriendAction(river, { profile, random: () => 0 }));
  const crowded = checkDecision(decideFriendAction(context({ activeCount: 4 }), { profile, random: () => 0 }));
  assert.ok(crowded.bluffProbability < single.bluffProbability);
});

for (const [street, board] of [["flop", "Ac Ad 7c"], ["turn", "Ac Ad 7c 3d"], ["river", "Ac Ad 7c 3d 2s"]]) {
  test(`${street} strong-value decisions can raise and never label the nuts as a bluff`, () => {
    const view = context({ street, holeCards: hand("As Ah"), board: hand(board), callCost: 4, raiseTo: 4,
      raiseCount: 1, lastFullRaise: 4, minRaiseTo: 8, maxRaiseTo: 180,
      history: [{ personId: ids[1], type: "bet", amount: 4, to: 4, callCost: 0, potBefore: 16 }] });
    const profile = profileFor(ids[0], { valueAggression: 1, bluffFrequency: 1 });
    let raised = 0;
    for (let index = 0; index < 32; index += 1) {
      const action = checkDecision(decideFriendAction(view, { profile, random: () => (index + 0.5) / 32 }));
      assert.ok(["call", "raise"].includes(action.type));
      assert.ok(!["bluff", "semi-bluff"].includes(action.intent));
      if (action.type === "raise") {
        raised += 1;
        assert.ok(action.to >= view.minRaiseTo && action.to <= view.maxRaiseTo);
      }
    }
    assert.ok(raised > 0, "Strong value needs a real raising path, not an unconditional call.");
  });
}

test("a planned slow-play can become a check-raise against a subsequent bet", () => {
  const first = context({ street: "flop", position: "SB", seatIndex: 5, holeCards: hand("As Ah"),
    board: hand("Ac Ad 7c"), isLastToAct: false, history: [] });
  const facingBet = context({ ...first, pot: 24, callCost: 4, raiseTo: 4, raiseCount: 1, lastFullRaise: 4, minRaiseTo: 8, players: undefined,
    history: [
      { personId: ids[0], type: "check", amount: 0, to: 0, callCost: 0, potBefore: 20 },
      { personId: ids[1], type: "bet", amount: 4, to: 4, callCost: 0, potBefore: 20 },
    ] });
  let checkRaises = 0;
  for (let seed = 0; seed < 128; seed += 1) {
    const brain = createFriendPlayerBrain({ personId: ids[0], seed, profile: profileFor(ids[0], { valueAggression: 0.7 }) });
    const firstAction = checkDecision(brain.decide(first));
    if (firstAction.type !== "check") continue;
    const secondAction = checkDecision(brain.decide(facingBet));
    if (secondAction.type === "raise" && secondAction.reason === "check-raise") checkRaises += 1;
  }
  assert.ok(checkRaises > 0);
});

test("reraising after a completed check-raise is labeled a value reraise", () => {
  const view = context({ street: "flop", holeCards: hand("As Ah"), board: hand("Ac Ad 7c"),
    ownInvestment: 14, callCost: 16, raiseTo: 30, raiseCount: 3, lastFullRaise: 16, minRaiseTo: 46, maxRaiseTo: 180,
    history: [
      { personId: ids[0], type: "check", amount: 0, to: 0, callCost: 0, potBefore: 20 },
      { personId: ids[1], type: "bet", amount: 6, to: 6, callCost: 0, potBefore: 20 },
      { personId: ids[0], type: "raise", amount: 14, to: 14, callCost: 6, potBefore: 26 },
      { personId: ids[1], type: "raise", amount: 24, to: 30, callCost: 8, potBefore: 40 },
    ],
  });
  const action = checkDecision(decideFriendAction(view, { profile: profileFor(ids[0], { valueAggression: 1 }), random: () => 0 }));
  assert.equal(action.type, "raise");
  assert.equal(action.reason, "value-reraise");
});


test("a prior check followed by a call does not label a later raise as a check-raise", () => {
  const view = context({ street: "flop", position: "SB", seatIndex: 5, activeCount: 3,
    holeCards: hand("As Ah"), board: hand("Ac Ad 7c"), ownInvestment: 4, callCost: 8,
    raiseTo: 12, raiseCount: 2, lastFullRaise: 8, minRaiseTo: 20, maxRaiseTo: 180,
    history: [
      { personId: ids[0], type: "check", amount: 0, to: 0, callCost: 0, potBefore: 20 },
      { personId: ids[1], type: "check", amount: 0, to: 0, callCost: 0, potBefore: 20 },
      { personId: ids[2], type: "bet", amount: 4, to: 4, callCost: 0, potBefore: 20 },
      { personId: ids[0], type: "call", amount: 4, to: 4, callCost: 4, potBefore: 24 },
      { personId: ids[1], type: "raise", amount: 12, to: 12, callCost: 4, potBefore: 28 },
      { personId: ids[2], type: "call", amount: 8, to: 12, callCost: 8, potBefore: 40 },
    ],
  });
  const action = checkDecision(decideFriendAction(view, { profile: profileFor(ids[0], { valueAggression: 1 }), random: () => 0 }));
  assert.equal(action.type, "raise");
  assert.equal(action.reason, "value-reraise");
});
