import { ODDS_DECK } from "./poker-odds.mjs";
import { evaluateReviewHand } from "./review-equity.mjs";
import { getOpeningRange } from "./ranges.mjs";

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const cardKey = (card) => `${card.rank}:${card.suit}`;
const rank = (card) => ranks.indexOf(card.rank) + 2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const pairs = ODDS_DECK.flatMap((first, index) => ODDS_DECK.slice(index + 1).map((second) => [first, second]));
const opening = Object.fromEntries(["UTG", "HJ", "CO", "BTN", "SB"].map((position) => [position, getOpeningRange("balanced", position)]));
const rangeCache = new Map();
const featureCache = new Map();
export const DEFAULT_HOLDEM_RANGE_MODEL = Object.freeze({ id: "public-actions-soft-ranges-v1" });

function handId(cards) {
  const sorted = [...cards].sort((left, right) => rank(right) - rank(left));
  return sorted.map((card) => card.rank === "10" ? "T" : card.rank).join("")
    + (sorted[0].rank === sorted[1].rank ? "" : sorted[0].suit === sorted[1].suit ? "s" : "o");
}

/** Visible-card features for range likelihoods, not a claim of exact equity. */
function computeVisibleRangeFeatures(holeCards, board) {
  const values = holeCards.map(rank).sort((left, right) => right - left);
  const [high, low] = values;
  const pair = high === low;
  const suited = holeCards[0].suit === holeCards[1].suit;
  const strength = clamp(pair ? 0.55 + (high - 2) / 12 * 0.3
    : 0.2 + (high - 2) / 12 * 0.22 + (low - 2) / 12 * 0.2 + (suited ? 0.07 : 0)
      + (high - low === 1 ? 0.055 : 0) - Math.max(0, high - low - 3) * 0.015, 0.05, 0.95);
  if (board.length < 3) return { strength, high, low, pair, suited, category: null, made: 0, draw: 0 };
  const hand = evaluateReviewHand([...holeCards, ...board]);
  const boardRanks = board.map(rank);
  const pairedRanks = values.filter((value) => boardRanks.includes(value));
  const top = Math.max(...boardRanks);
  const privatePair = pair || pairedRanks.length > 0;
  const playsBoard = board.length === 5 && evaluateReviewHand(board).score === hand.score;
  let made = 0.14 + values.filter((value) => value > top).length * 0.035;
  if (!playsBoard && ["royal-flush", "straight-flush", "four-kind", "full-house"].includes(hand.category)) made = 0.98;
  else if (!playsBoard && hand.category === "flush") made = 0.92;
  else if (!playsBoard && hand.category === "straight") made = 0.86;
  else if (hand.category === "three-kind" && pairedRanks.length) made = 0.83;
  else if (hand.category === "two-pair" && new Set(boardRanks).size === board.length) made = 0.76;
  else if (privatePair) made = pair && high > top ? 0.7 : pairedRanks.includes(top) ? 0.63 : 0.38;
  let draw = 0;
  if (board.length < 5) {
    const visible = [...holeCards, ...board];
    if (["spades", "hearts", "clubs", "diamonds"].some((suit) => visible.filter((card) => card.suit === suit).length === 4 && holeCards.some((card) => card.suit === suit))) draw = 0.19;
    const distinct = new Set(visible.map(rank));
    if (distinct.has(14)) distinct.add(1);
    const windows = Array.from({ length: 10 }, (_, index) => index + 1).filter((start) => Array.from({ length: 5 }, (_, index) => start + index).filter((value) => distinct.has(value)).length === 4);
    if (windows.length) draw = Math.max(draw, windows.length > 1 ? 0.17 : 0.085);
  }
  const suits = ["spades", "hearts", "clubs", "diamonds"].map((suit) => board.filter((card) => card.suit === suit).length);
  if (Math.max(...suits) >= 4 && made < 0.9) made *= 0.6;
  return { strength, high, low, pair, suited, category: hand.category, made, draw };
}

export function visibleRangeFeatures(holeCards, board) {
  const boardKey = board.map(cardKey).join("/");
  let cache = featureCache.get(boardKey);
  if (!cache) {
    cache = new Map(); featureCache.set(boardKey, cache);
    if (featureCache.size > 24) featureCache.delete(featureCache.keys().next().value);
  }
  const key = holeCards.map(cardKey).sort().join("/");
  if (!cache.has(key)) cache.set(key, Object.freeze(computeVisibleRangeFeatures(holeCards, board)));
  return cache.get(key);
}

export function publicOpponents(context) {
  if (Array.isArray(context.players) && context.players.length) return context.players.filter((player) => !player.folded && player.personId !== context.personId)
    .map(({ personId, position, streetPaid, remaining, invested }) => ({ personId, position, streetPaid, remaining, invested }));
  const all = [...(context.priorHistory?.preflop ?? []), ...(context.history ?? [])];
  const seen = [...new Set(all.map((action) => action.personId))].filter((id) => id !== context.personId);
  return Array.from({ length: Math.max(1, (context.activeCount ?? 2) - 1) }, (_, index) => ({
    personId: seen[index] ?? `modeled-opponent-${index + 1}`, position: index === 0 ? context.lastRaiserPosition ?? context.openerPosition ?? "BB" : "CO",
    remaining: context.effectiveStack ?? 100, streetPaid: context.raiseTo ?? (context.ownInvestment ?? 0) + context.callCost,
  }));
}

function defaultWeight(opponent, holeCards, board, preflopActions, streetActions) {
  const features = visibleRangeFeatures(holeCards, []);
  const id = handId(holeCards);
  const own = preflopActions.filter((action) => action.personId === opponent.personId);
  let weight = 1;
  for (const action of own) {
    if (action.type === "raise" || action.type === "bet") {
      const level = preflopActions.slice(0, preflopActions.indexOf(action) + 1).filter((entry) => ["raise", "bet"].includes(entry.type)).length;
      if (level === 1) {
        const position = opponent.position === "LJ" ? "UTG" : opponent.position === "BB" ? "SB" : opponent.position;
        weight *= opening[position]?.has(id) ? 1.3 : 0.08;
      } else weight *= features.strength >= 0.75 ? 2 : features.strength >= 0.64 ? 0.55 : 0.025;
    } else if (action.type === "call") {
      const small = (action.to ?? action.amount) <= 1;
      weight *= small ? features.strength >= 0.43 || features.suited || features.pair ? 1 : 0.16
        : features.strength >= 0.54 || (features.suited && features.strength >= 0.4) ? 1.2 : 0.08;
    }
  }
  for (const [street, actions] of Object.entries(streetActions)) {
    const count = { flop: 3, turn: 4, river: 5 }[street];
    if (!count || board.length < count) continue;
    const featuresNow = visibleRangeFeatures(holeCards, board.slice(0, count));
    for (const action of actions.filter((entry) => entry.personId === opponent.personId)) {
      if (action.type === "bet") weight *= featuresNow.made >= 0.6 ? 2.2 : featuresNow.draw >= 0.08 ? 1.1 : 0.24;
      else if (action.type === "raise") weight *= featuresNow.made >= 0.75 ? 3.2 : featuresNow.made >= 0.6 || featuresNow.draw >= 0.15 ? 0.7 : 0.045;
      else if (action.type === "call") weight *= featuresNow.made >= 0.35 || featuresNow.draw >= 0.08 ? 1.2 : 0.2;
      else if (action.type === "check" && featuresNow.made >= 0.8) weight *= 0.8;
    }
  }
  return clamp(weight, 0.0001, 100);
}

/** Soft ranges inferred from actions; real opponents' hole cards are never read. */
export function buildPublicOpponentRanges(context, model = DEFAULT_HOLDEM_RANGE_MODEL) {
  const known = new Set([...context.holeCards, ...context.board].map(cardKey));
  const preflopActions = context.street === "preflop" ? context.history ?? [] : context.priorHistory?.preflop ?? [];
  const streetActions = { ...context.priorHistory, [context.street]: context.history ?? [] };
  delete streetActions.preflop;
  return publicOpponents(context).map((opponent) => {
    const supplied = model.ranges?.[opponent.personId];
    const cacheable = !supplied && !model.handWeight;
    const cacheKey = JSON.stringify([opponent.position, opponent.personId, context.board, preflopActions, streetActions]);
    let base = cacheable ? rangeCache.get(cacheKey) : null;
    if (!base) {
      const publicCards = new Set(context.board.map(cardKey));
      base = (supplied ?? pairs.map((holeCards) => ({ holeCards, weight: 1 }))).filter(({ holeCards }) => {
        if (!Array.isArray(holeCards) || holeCards.length !== 2) return false;
        return cardKey(holeCards[0]) !== cardKey(holeCards[1]) && holeCards.every((card) => !publicCards.has(cardKey(card)));
      }).map(({ holeCards, weight }) => ({
        holeCards,
        weight: supplied ? weight : model.handWeight
          ? model.handWeight({ personId: opponent.personId, position: opponent.position, holeCards, board: context.board, preflopActions, postflopActions: streetActions })
          : defaultWeight(opponent, holeCards, context.board, preflopActions, streetActions),
        features: visibleRangeFeatures(holeCards, context.board),
      })).filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0);
      if (cacheable) {
        rangeCache.set(cacheKey, base);
        if (rangeCache.size > 48) rangeCache.delete(rangeCache.keys().next().value);
      }
    }
    let totalWeight = 0;
    const combinations = base.filter((entry) => entry.holeCards.every((card) => !known.has(cardKey(card)))).map((entry) => ({ ...entry, cumulative: totalWeight += entry.weight }));
    if (!combinations.length) throw new RangeError(`No legal modeled combinations remain for ${opponent.personId}.`);
    return { ...opponent, combinations, totalWeight, combinationCount: combinations.length };
  });
}

/** Hypothetical response uses only the sampled hole cards and CURRENT board. */
export function continuationLikelihood({ features, callCost, potOdds, action, context, ...rest }, model = DEFAULT_HOLDEM_RANGE_MODEL) {
  if (callCost <= 0) return 1;
  if (model.continuationProbability) {
    const publicContext = {
      personId: context.personId, position: context.position, street: context.street, board: context.board,
      pot: context.pot, raiseTo: context.raiseTo, callCost: context.callCost, ownInvestment: context.ownInvestment,
      activeCount: context.activeCount, raiseCount: context.raiseCount, history: context.history, priorHistory: context.priorHistory,
      players: context.players?.map(({ personId, position, streetPaid, remaining, invested, folded }) => ({ personId, position, streetPaid, remaining, invested, folded })),
    };
    const publicBet = { type: action.type, to: action.to, amount: action.cost };
    const result = model.continuationProbability({ ...rest, features, callCost, potOdds, action: publicBet, context: publicContext, board: context.board });
    if (!Number.isFinite(result)) throw new RangeError("A continuation probability must be finite.");
    return clamp(result, 0, 1);
  }
  let value;
  if (context.street === "preflop") {
    const pressure = Math.min(0.18, Math.max(0, Math.log2(Math.max(1, action.to / 3))) * 0.05);
    value = (features.strength - (0.32 + potOdds * 0.8 + pressure)) * 14;
    const probability = 1 / (1 + Math.exp(-value));
    // Large sizing must not make the model assume even the top of a range
    // disappears. These are conservative response assumptions, not known hands.
    const floor = features.pair && features.high >= 13 ? 0.98 : features.pair && features.high === 12 ? 0.72
      : features.high === 14 && features.low === 13 ? action.to <= 20 ? 0.65 : 0.32 : 0.015;
    return clamp(Math.max(floor, probability), 0.015, 0.995);
  } else {
    const potential = Math.max(features.made, features.made * 0.45 + features.draw);
    const pressure = Math.max(0, (context.raiseCount ?? 0) - 1) * 0.06;
    value = (potential - (potOdds + 0.07 + pressure)) * 9;
  }
  return clamp(1 / (1 + Math.exp(-value)), 0.015, 0.995);
}
