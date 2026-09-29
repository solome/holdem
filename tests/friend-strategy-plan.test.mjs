import test from "node:test";
import assert from "node:assert/strict";
import { choosePreflopAction, analyzeFriendHand } from "../src/friend-table-policy.mjs";
import { buildHoldemCandidates } from "../src/holdem-decision-engine.mjs";
import { FRIEND_TABLE_POSITIONS } from "../src/friend-table.mjs";
import { createFriendPlayerBrain } from "../src/friend-player-brain.mjs";
import { friendStrategyContext, analyzeFriendStrategy } from "../scripts/friend-strategy-diagnostics.mjs";

const suits = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const hand = (text) => text.split(" ").map((value) => ({ rank: value.slice(0, -1), suit: suits[value.at(-1)] }));
function opening(cards, position, limpers = 0, overrides = {}) {
  const ownInvestment = position === "SB" ? 0.5 : position === "BB" ? 1 : 0;
  return choosePreflopAction({ holeCards: hand(cards), position, callCost: 1 - ownInvestment, pot: 1.5 + limpers,
    raiseTo: 1, raiseCount: 0, callerCount: limpers, ownInvestment, activeCount: 4, remaining: 200,
    effectiveStack: 190, minRaiseTo: 2, maxRaiseTo: 190, canRaise: true, isoSizing: 1, ...overrides });
}

test("AK and JJ open actively and isolation sizes grow with limpers and worse position", () => {
  for (const position of FRIEND_TABLE_POSITIONS.filter((position) => position !== "BB")) {
    for (const cards of ["As Kd", "As Ks", "Js Jd"]) {
      const action = opening(cards, position);
      assert.equal(action.type, "raise");
      assert.ok(action.to >= 3);
    }
  }
  // A BB walk has no decision; the legitimate free option is facing an SB limp.
  assert.equal(opening("As Kd", "BB", 1, { activeCount: 2 }).type, "raise");
  const one = opening("As Kd", "CO", 1);
  const three = opening("As Kd", "CO", 3);
  const blind = opening("As Kd", "SB", 3);
  assert.equal(one.reason, "preflop-isolate");
  assert.equal(three.reason, "preflop-isolate");
  assert.ok(three.to > one.to);
  assert.ok(blind.to > three.to);
});

test("3-bets scale with the prior raise and respect the full-raise increment and covered stack", () => {
  const sizes = [];
  for (const raiseTo of [3, 6, 10]) {
    const minRaiseTo = 2 * raiseTo - 1;
    const action = choosePreflopAction({ holeCards: hand("As Kd"), position: "BTN", callCost: raiseTo,
      pot: raiseTo + 1.5, raiseTo, raiseCount: 1, callerCount: 0, ownInvestment: 0, remaining: 200,
      effectiveStack: 180, openerPosition: "HJ", lastRaiserPosition: "HJ", minRaiseTo, maxRaiseTo: 180, canRaise: true });
    assert.equal(action.type, "raise");
    assert.ok(action.to >= minRaiseTo && action.to <= 180);
    sizes.push(action.to);
  }
  assert.ok(sizes[0] < sizes[1] && sizes[1] < sizes[2]);
  const blocked = choosePreflopAction({ holeCards: hand("As Ah"), position: "BTN", callCost: 18,
    pot: 19.5, raiseTo: 18, raiseCount: 1, ownInvestment: 0, remaining: 30, effectiveStack: 30,
    minRaiseTo: 35, maxRaiseTo: 29, canRaise: false });
  assert.notEqual(blocked.type, "raise");
});

test("overcards and backdoors are distinguished from immediate flush and straight outs", () => {
  const backdoor = analyzeFriendHand(hand("As Ks"), hand("Qs 7h 2d"));
  assert.equal(backdoor.overcards, 2);
  assert.deepEqual(new Set(backdoor.overcardRanks), new Set(["A", "K"]));
  assert.equal(backdoor.backdoorFlush, true);
  assert.equal(backdoor.backdoorStraight, true);
  assert.equal(backdoor.outCount, 0);
  assert.equal(backdoor.flushDraw, false);
  const flushDraw = analyzeFriendHand(hand("As Js"), hand("9s 4s 2d"));
  assert.equal(flushDraw.flushDraw, true);
  assert.equal(flushDraw.outCount, 9);
  const openEnded = analyzeFriendHand(hand("7s 9d"), hand("10c 8h 2d"));
  assert.equal(openEnded.straightDraw, true);
  assert.equal(openEnded.outCount, 8);
  assert.equal(openEnded.backdoorStraight, false);
  assert.equal(backdoor.boardTexture.dry, true);
  assert.equal(analyzeFriendHand(hand("As Ks"), hand("9h 8h 7c")).boardTexture.wet, true);
  const paired = analyzeFriendHand(hand("As Ks"), hand("8s 8h 4d"));
  assert.equal(paired.boardTexture.paired, true);
  assert.equal(paired.boardTexture.dry, true);
});

test("only the last preflop aggressor receives c-bet plans and low overpairs receive value protection", () => {
  const profile = createFriendPlayerBrain({ personId: "juyipeng" }).profile;
  for (const id of ["ak_q72_rainbow", "ak_884_rainbow"]) {
    const candidates = buildHoldemCandidates(friendStrategyContext(id), { profile });
    assert.ok(candidates.some((candidate) => candidate.type === "bet" && candidate.reason === "continuation-bet"));
  }
  for (const id of ["ak_cold_caller", "ak_called_three_bet"]) {
    const candidates = buildHoldemCandidates(friendStrategyContext(id), { profile });
    assert.ok(candidates.every((candidate) => candidate.reason !== "continuation-bet" && candidate.plan !== "cbet"));
  }
  for (const id of ["jj_t62_rainbow", "jj_832_rainbow"]) {
    assert.ok(buildHoldemCandidates(friendStrategyContext(id), { profile })
      .some((candidate) => candidate.reason === "value-protection-bet" && candidate.intent === "value"));
  }
});

test("turn plans distinguish improvement, delayed initiative and missed river draws", () => {
  const profile = createFriendPlayerBrain({ personId: "juyipeng" }).profile;
  assert.ok(buildHoldemCandidates(friendStrategyContext("ak_turn_draw"), { profile })
    .some((candidate) => candidate.reason === "turn-barrel"));
  assert.ok(buildHoldemCandidates(friendStrategyContext("ak_delayed_turn"), { profile })
    .some((candidate) => candidate.reason === "delayed-continuation-bet"));
  for (const id of ["ak_turn_blank", "ak_missed_river"]) {
    assert.ok(buildHoldemCandidates(friendStrategyContext(id), { profile })
      .every((candidate) => candidate.plan !== "second-barrel"));
  }
});

test("diagnostic c-bet statistics include value bets and exclude probes and lost initiative", () => {
  const results = analyzeFriendStrategy({ samplesPerProfile: 1, createBrain: () => ({ decide: (view) => ({
    type: view.callCost ? "fold" : "bet", to: view.callCost ? view.ownInvestment : 2,
    reason: view.callCost ? "ev-fold" : "value-protection-bet",
  }) }) });
  assert.equal(results.scenarios.jj_t62_rainbow.rates.continuationBet, 1);
  assert.equal(results.scenarios.jj_t62_rainbow.rates.valueProtection, 1);
  for (const id of ["ak_cold_caller", "ak_called_three_bet"]) {
    assert.equal(results.scenarios[id].rates.bet, 1);
    assert.equal(results.scenarios[id].counts.cbetOpportunities, 0);
    assert.equal(results.scenarios[id].counts.continuationBet, 0);
  }
});
