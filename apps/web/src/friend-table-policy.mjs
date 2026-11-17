import { ODDS_DECK, evaluateBest } from "./poker-odds.mjs";
import { getEntryStrategy } from "./ranges.mjs";

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const rankValue = (card) => RANKS.indexOf(card.rank) + 2;
const cardKey = (card) => `${card.rank}:${card.suit}`;
const percentage = (value) => Math.round(value * 1000) / 10;
// Preflop planning defaults propose sizing and candidate reasons. The shared
// range/equity/EV engine makes the final decision; participation-frequency
// targets never override its value comparison. This is not a GTO solution.
const SOCIAL_ENTRY = Object.freeze({
  openTo: 3,
  maxColdCall: 10,
  maxLimpCompletion: 7,
  coldCallDepth: 10,
  limpCompletionDepth: 8,
});
// Reuse the product's balanced, one-opener BB defense. These immutable lookups
// are built once; callers, re-raises and short stacks use the narrower model.
const HEADS_UP_BB_CONTINUE = Object.freeze(Object.fromEntries(
  ["UTG", "HJ", "CO", "BTN", "SB"].map((opener) => [opener, Object.freeze(Object.fromEntries(
    [...getEntryStrategy("balanced", "BB", "raised", opener).continue].map((hand) => [hand, true]),
  ))]),
));

export const FRIEND_ACTION_REASONS = Object.freeze([
  "preflop-open", "preflop-three-bet", "preflop-call", "preflop-complete",
  "preflop-fold-range", "preflop-fold-price", "free-check", "value-bet",
  "value-call", "pair-call-price", "pair-fold-price", "draw-call",
  "draw-fold-price", "weak-fold", "pot-control-check",
  "board-danger-check", "board-danger-call", "board-danger-fold",
  "preflop-limp", "preflop-overlimp", "preflop-loose-call",
  "value-raise", "value-reraise", "check-raise", "slow-play-check",
  "semi-bluff-bet", "semi-bluff-raise", "bluff-bet", "bluff-raise", "pressure-fold", "profile-call",
  "preflop-isolate", "preflop-four-bet", "value-protection-bet", "continuation-bet",
  "delayed-continuation-bet", "turn-barrel", "multiway-wet-check", "barrel-give-up", "facing-aggression-fold",
  "ev-fold", "ev-call", "ev-check",
]);

function holeInfo(holeCards) {
  const [high, low] = holeCards.map(rankValue).sort((left, right) => right - left);
  return { high, low, pair: high === low, suited: holeCards[0].suit === holeCards[1].suit, gap: high - low };
}

function handNotation({ high, low, pair, suited }) {
  const symbols = [high, low].map((rank) => rank === 10 ? "T" : RANKS[rank - 2]);
  return symbols.join("") + (pair ? "" : suited ? "s" : "o");
}

function hasStraight(cards) {
  const ranks = new Set(cards.map(rankValue));
  if (ranks.has(14)) ranks.add(1);
  for (let low = 1; low <= 10; low += 1) {
    if (Array.from({ length: 5 }, (_, index) => low + index).every((rank) => ranks.has(rank))) return true;
  }
  return false;
}

function hasFlush(cards) {
  return ["spades", "hearts", "clubs", "diamonds"].some((suit) => cards.filter((card) => card.suit === suit).length >= 5);
}

function boardTexture(board) {
  const ranks = new Set(board.map(rankValue));
  const highestRank = Math.max(0, ...ranks);
  const paired = ranks.size < board.length;
  if (ranks.has(14)) ranks.add(1);
  const suitCounts = ["spades", "hearts", "clubs", "diamonds"].map((suit) => ({ suit, count: board.filter((card) => card.suit === suit).length }));
  const dominantSuit = suitCounts.sort((left, right) => right.count - left.count)[0];
  const connectivity = Math.max(0, ...Array.from({ length: 10 }, (_, index) => index + 1)
    .map((low) => Array.from({ length: 5 }, (_, index) => low + index).filter((rank) => ranks.has(rank)).length));
  const fourToStraight = connectivity >= 4;
  const threeConnected = connectivity >= 3 && !paired;
  const wet = dominantSuit.count >= 3 || fourToStraight || threeConnected;
  return { maxSuitCount: dominantSuit.count, dominantSuit: dominantSuit.suit, fourToStraight,
    connectivity, threeConnected, paired, highestRank, wet, dry: !wet && (dominantSuit.count <= 1 || paired) };
}

function backdoorStraight(holeCards, board, straightDraw) {
  if (board.length !== 3 || straightDraw || hasStraight([...holeCards, ...board])) return false;
  const boardRanks = new Set(board.map(rankValue));
  const ownRanks = new Set(holeCards.map(rankValue).filter((rank) => !boardRanks.has(rank)));
  const ranks = new Set([...holeCards, ...board].map(rankValue));
  if (ranks.has(14)) ranks.add(1);
  if (ownRanks.has(14)) ownRanks.add(1);
  return Array.from({ length: 10 }, (_, index) => index + 1).some((low) => {
    const window = Array.from({ length: 5 }, (_, index) => low + index);
    return window.filter((rank) => ranks.has(rank)).length === 3 && window.some((rank) => ownRanks.has(rank));
  });
}

function madeStrength(holeCards, board, hand) {
  const ranks = board.map(rankValue);
  const boardCounts = new Map(ranks.map((rank) => [rank, ranks.filter((value) => value === rank).length]));
  const holes = holeCards.map(rankValue);
  const pocketPair = holes[0] === holes[1];
  const pairedHoleRanks = [...new Set(holes.filter((rank) => boardCounts.has(rank)))];
  const boardPair = [...boardCounts.values()].some((count) => count >= 2);
  const boardQuads = [...boardCounts.values()].some((count) => count === 4);
  if (boardQuads || (board.length === 5 && evaluateBest(board).score === hand.score)) return "board-only";
  if (["straight", "flush", "full-house", "four-kind", "straight-flush", "royal-flush"].includes(hand.category)) return hand.category;
  if (hand.category === "three-kind") return pairedHoleRanks.length ? "trips" : "board-only";
  if (hand.category === "two-pair" && !boardPair) return "two-pair";
  if (!pocketPair && pairedHoleRanks.length === 0) return boardPair ? "board-only" : "unmade";
  const pairRank = pocketPair ? holes[0] : Math.max(...pairedHoleRanks);
  const distinctBoard = [...boardCounts.keys()].sort((left, right) => right - left);
  if (pocketPair && pairRank > distinctBoard[0]) return "overpair";
  if (pairRank === distinctBoard[0]) return "top-pair";
  return pairRank >= (distinctBoard[1] ?? distinctBoard[0]) ? "middle-pair" : "low-pair";
}

/** Uses only this player's cards and the public cards already on the table. */
export function analyzeFriendHand(holeCards, board) {
  if (board.length === 0) {
    return { category: null, score: null, bestCards: [], strength: "unmade", kicker: 0, boardTexture: boardTexture(board), flushDraw: false, straightDraw: false, outs: [], outCount: 0, drawChance: 0,
      overcards: 0, overcardRanks: [], backdoorFlush: false, backdoorStraight: false, pocketPair: holeCards[0].rank === holeCards[1].rank };
  }
  const visible = [...holeCards, ...board];
  const hand = evaluateBest(visible);
  const strength = madeStrength(holeCards, board, hand);
  const topBoardRank = Math.max(...board.map(rankValue));
  const kicker = Math.max(0, ...holeCards.map(rankValue).filter((rank) => rank !== topBoardRank));
  const known = new Set(visible.map(cardKey));
  const remaining = ODDS_DECK.filter((card) => !known.has(cardKey(card)));
  const outs = [];
  let flushDraw = false;
  let straightDraw = false;
  if (board.length < 5 && !["full-house", "four-kind", "straight-flush", "royal-flush"].includes(hand.category)) {
    const alreadyStraight = hasStraight(visible);
    const alreadyFlush = hasFlush(visible);
    for (const card of remaining) {
      const next = [...visible, card];
      const makesFlush = !alreadyFlush && hasFlush(next);
      const makesStraight = !alreadyStraight && hasStraight(next);
      if (!makesFlush && !makesStraight) continue;
      const nextHand = evaluateBest(next);
      if (nextHand.score <= hand.score) continue;
      // A river straight/flush entirely on the board is not a private drawing out.
      const nextBoard = [...board, card];
      if (nextBoard.length === 5 && nextHand.score <= evaluateBest(nextBoard).score) continue;
      flushDraw ||= makesFlush;
      straightDraw ||= makesStraight;
      outs.push(card);
    }
  }
  const overcardRanks = holeCards.filter((card) => rankValue(card) > topBoardRank).map((card) => card.rank);
  const backdoorFlush = board.length === 3 && !flushDraw && !hasFlush(visible)
    && ["spades", "hearts", "clubs", "diamonds"].some((suit) => visible.filter((card) => card.suit === suit).length === 3 && holeCards.some((card) => card.suit === suit));
  return { ...hand, strength, kicker, boardTexture: boardTexture(board), flushDraw, straightDraw, outs, outCount: outs.length, drawChance: outs.length / remaining.length,
    overcards: overcardRanks.length, overcardRanks, backdoorFlush, backdoorStraight: backdoorStraight(holeCards, board, straightDraw), pocketPair: holeCards[0].rank === holeCards[1].rank };
}

// Cheap entry: 22+, A2s+, A7o+, K2s+, KTo+, Q7s+, QTo+, J7s+, JTo,
// T8s+, T9o, 97s+, 98o, 86s+, 87o, 75s+, 64s+, 53s+, 43s.
// Premiums inside this set raise instead; lower suited two-gappers fold.
function likesCheapFlop(info) {
  const { high, low, pair, suited, gap } = info;
  if (pair || (high === 14 && (suited || low >= 7))) return true;
  if (suited) return high === 13 || (high >= 11 && low >= 7)
    || (high >= 5 && gap <= 2) || (high === 4 && low === 3);
  return (high === 13 && low >= 10) || (high === 12 && low >= 10)
    || (high === 11 && low === 10) || (high >= 8 && high <= 10 && gap === 1);
}

/** Cheap entry stays loose; strong hands charge limpers and react to real sizing. */
export function choosePreflopAction({
  holeCards, position, callCost, pot, raiseCount, remaining, effectiveStack, activeCount,
  openerPosition = null, lastRaiserPosition = null,
  raiseTo = raiseCount >= 2 ? 10 : raiseCount === 1 ? 3 : 1,
  ownInvestment = position === "SB" ? 0.5 : position === "BB" ? 1 : 0,
  callerCount = 0, minRaiseTo, maxRaiseTo, canRaise = true, isoSizing = 1, players = [],
}) {
  const info = holeInfo(holeCards);
  const { high, low, pair, suited, gap } = info;
  const aceKing = high === 14 && low === 13;
  const premium = (pair && high >= 11) || aceKing;
  const topPair = pair && high >= 13;
  const price = callCost / (pot + callCost);
  const blind = ["SB", "BB"].includes(position);
  const postflopOrder = ["SB", "BB", "UTG", "LJ", "HJ", "CO", "BTN"];
  const knownOpponents = players.filter((seat) => !seat.folded && seat.position !== position && seat.streetPaid >= raiseTo);
  const opponentPosition = lastRaiserPosition ?? openerPosition;
  const outOfPosition = knownOpponents.length
    ? knownOpponents.some((seat) => postflopOrder.indexOf(seat.position) > postflopOrder.indexOf(position))
    : opponentPosition ? postflopOrder.indexOf(position) < postflopOrder.indexOf(opponentPosition)
      : blind && !(position === "BB" && activeCount === 2 && callerCount === 1);
  const blindAmount = position === "SB" ? 0.5 : position === "BB" ? 1 : 0;
  const alreadyInvested = ownInvestment > blindAmount;
  const normalOpen = raiseTo <= 10 && callCost <= SOCIAL_ENTRY.maxColdCall && remaining > callCost;
  const minimum = minRaiseTo ?? (raiseCount === 0 ? 2 : raiseTo * 2 - 1);
  const maximum = maxRaiseTo ?? ownInvestment + remaining - 1;
  const raise = (desired, reason, reasonValues = {}) => {
    if (!canRaise || maximum < minimum) return { type: callCost ? "call" : "check", reason: callCost ? "preflop-call" : "free-check" };
    return { type: "raise", to: Math.min(maximum, Math.max(minimum, Math.round(desired * 2) / 2)), reason, reasonValues };
  };
  if (raiseCount === 0) {
    if (premium) {
      const isolation = callerCount > 0;
      const to = SOCIAL_ENTRY.openTo + callerCount * isoSizing + (isolation && blind && outOfPosition ? 1 : 0);
      return raise(to, isolation ? "preflop-isolate" : "preflop-open", { limpers: callerCount });
    }
    if (callCost === 0) return { type: "check", reason: "free-check" };
    if (likesCheapFlop(info)) return {
      type: "call", reason: position === "SB" ? "preflop-complete" : callerCount ? "preflop-overlimp" : "preflop-limp",
    };
    return { type: "fold", reason: "preflop-fold-range" };
  }
  if (callCost === 0) return { type: "check", reason: "free-check" };
  if (raiseCount === 1 && premium && normalOpen && effectiveStack >= Math.max(30, raiseTo * 4)) {
    const multiplier = outOfPosition ? 4 : 3;
    return raise(raiseTo * (multiplier + callerCount * 0.5), "preflop-three-bet", { callers: callerCount, multiplier });
  }
  if (raiseCount >= 2) {
    const lateReraise = ["CO", "BTN", "SB", "BB"].includes(lastRaiserPosition);
    const fourBetValue = topPair || (aceKing && suited && alreadyInvested && lateReraise && callerCount === 0 && effectiveStack >= 100 && raiseTo <= 14);
    if (raiseCount === 2 && fourBetValue && effectiveStack >= raiseTo * 2.5) {
      return raise(raiseTo * 2.2 + callerCount * raiseTo * 0.5, "preflop-four-bet");
    }
    if (topPair) return { type: "call", reason: "preflop-call" };
    const ordinaryReraise = raiseCount === 2 && raiseTo <= 28 && remaining > callCost;
    const continues = ordinaryReraise && (
      (aceKing && price <= 0.43 && callCost <= remaining * 0.35)
      || (pair && high >= 12 && price <= 0.4)
      || (pair && high >= 10 && alreadyInvested && price <= 0.35 && effectiveStack >= 4 * callCost)
      || (pair && high === 9 && alreadyInvested && effectiveStack >= 10 * callCost)
      || (suited && high === 14 && low === 12 && alreadyInvested && price <= 0.3 && effectiveStack >= 6 * callCost)
    ) || (raiseCount >= 3 && ((aceKing && suited && alreadyInvested && price <= 0.30)
      || (pair && high >= 12 && price <= 0.30)));
    return { type: continues ? "call" : "fold", reason: continues ? "preflop-call" : "preflop-fold-price" };
  }
  if (premium) return { type: "call", reason: "preflop-call" };
  if (!normalOpen) return { type: "fold", reason: "preflop-fold-price" };

  const source = openerPosition ?? "UTG";
  const matrixSource = source === "LJ" ? "UTG" : source;
  if (position === "BB" && raiseTo > 1 && raiseTo <= 3 && ownInvestment === 1 && callerCount === 0
    && (activeCount == null || activeCount === 2)
    && effectiveStack >= 60 && HEADS_UP_BB_CONTINUE[matrixSource]) {
    const continues = Boolean(HEADS_UP_BB_CONTINUE[matrixSource][handNotation(info)]);
    return { type: continues ? "call" : "fold", reason: continues ? "preflop-call" : "preflop-fold-range" };
  }
  const crowded = callerCount >= 2;
  const late = ["CO", "BTN"].includes(position);
  const setValue = pair && (effectiveStack >= 10 * callCost || (price <= 0.25 && effectiveStack >= 7 * callCost));
  const weakOffsuitAce = !suited && high === 14 && low < 10;
  const completesLimp = alreadyInvested && callCost <= SOCIAL_ENTRY.maxLimpCompletion && price <= 0.38 && likesCheapFlop(info)
    && effectiveStack >= SOCIAL_ENTRY.limpCompletionDepth * callCost && !(crowded && weakOffsuitAce);
  const suitedValue = suited && (high === 14 || (high === 13 && low >= 5) || (high >= 10 && low >= 8)
    || (high >= 5 && gap <= 2));
  const suitedEdge = suited && likesCheapFlop(info) && (late || blind) && price <= 0.3;
  const offsuitValue = !suited && ((high === 14 && low >= (crowded ? 11 : 10))
    || (high === 13 && low >= (crowded ? 12 : 10)) || (!crowded && high === 12 && low >= 10)
    || (!crowded && high >= 8 && high <= 11 && gap === 1));
  const coldCalls = effectiveStack >= SOCIAL_ENTRY.coldCallDepth * callCost && price <= 0.42 && (suitedValue || suitedEdge || offsuitValue);
  const continues = setValue || completesLimp || coldCalls;
  return { type: continues ? "call" : "fold", reason: continues ? "preflop-loose-call" : "preflop-fold-range" };
}

/** Conservative postflop baseline; player brains add raises, sizing and mixed actions. */
export function choosePostflopAction({ holeCards, board, callCost, pot, activeCount, remaining }) {
  const hand = analyzeFriendHand(holeCards, board);
  const price = callCost ? callCost / (pot + callCost) : 0;
  const strong = ["two-pair", "trips", "straight", "flush", "full-house", "four-kind", "straight-flush", "royal-flush"].includes(hand.strength);
  const bigPair = ["overpair", "top-pair"].includes(hand.strength);
  const { kicker, boardTexture: texture } = hand;
  const flushOrBetter = ["flush", "full-house", "four-kind", "straight-flush", "royal-flush"].includes(hand.strength);
  const straightOrBetter = hand.strength === "straight" || flushOrBetter;
  const visible = new Set([...holeCards, ...board].map(cardKey));
  const privateFlushRank = Math.max(0, ...holeCards.filter((card) => card.suit === texture.dominantSuit).map(rankValue));
  const unseenFlushRank = Math.max(0, ...ODDS_DECK.filter((card) => card.suit === texture.dominantSuit && !visible.has(cardKey(card))).map(rankValue));
  const lowFlush = texture.maxSuitCount >= 4 && hand.strength === "flush" && privateFlushRank < unseenFlushRank;
  const danger = (texture.maxSuitCount >= 4 && !flushOrBetter) || (texture.fourToStraight && !straightOrBetter) || lowFlush;
  if (danger) {
    if (callCost === 0) return { type: "check", reason: "board-danger-check" };
    const hasPrivateValue = !["unmade", "board-only"].includes(hand.strength);
    const limit = lowFlush ? (activeCount <= 2 ? 0.25 : 0.18) : 0.16;
    const calls = hasPrivateValue && price <= limit && (lowFlush || activeCount <= 2);
    return { type: calls ? "call" : "fold", reason: calls ? "board-danger-call" : "board-danger-fold", reasonValues: { potOdds: percentage(price) } };
  }
  if (callCost === 0) {
    if (strong || hand.strength === "overpair" || (hand.strength === "top-pair" && kicker >= 11 && activeCount <= 3)) {
      return { type: "bet", fraction: strong ? 0.5 : 1 / 3, reason: "value-bet" };
    }
    return { type: "check", reason: "pot-control-check" };
  }
  if (strong || hand.strength === "overpair" || (bigPair && price <= (activeCount <= 4 ? 0.34 : 0.28))) {
    return { type: "call", reason: "value-call" };
  }
  if (hand.outCount) {
    // Only a small, explicit allowance for future value when a flop draw is deep;
    // turn decisions use next-card pot odds with no assumed future payoff.
    const allowance = board.length === 3 && remaining >= 8 * callCost ? 0.08 : 0;
    const calls = price <= hand.drawChance + allowance;
    return {
      type: calls ? "call" : "fold", reason: calls ? "draw-call" : "draw-fold-price",
      reasonValues: { outs: hand.outCount, drawChance: percentage(hand.drawChance), potOdds: percentage(price), impliedAllowance: percentage(allowance) },
    };
  }
  const smallPair = ["middle-pair", "low-pair", "top-pair"].includes(hand.strength);
  if (smallPair) {
    const calls = hand.strength === "middle-pair" ? price <= 0.2 && activeCount <= 3
      : hand.strength === "low-pair" ? price <= 0.125 && activeCount <= 2 : price <= 0.28;
    return { type: calls ? "call" : "fold", reason: calls ? "pair-call-price" : "pair-fold-price", reasonValues: { potOdds: percentage(price) } };
  }
  return { type: "fold", reason: "weak-fold" };
}
