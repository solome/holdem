/** Exact known-hand equity for a recorded Hold'em hand, including side pots. */
import { ODDS_CATEGORIES, ODDS_DECK } from "./poker-odds.mjs";

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS = ["spades", "hearts", "clubs", "diamonds"];
const UNIT = 15 ** 5;
const SPLIT_UNITS = 2520; // Divisible by every possible split among 2–10 players.
const STRAIGHT_HIGH = new Uint8Array(8192);
for (let mask = 0; mask < STRAIGHT_HIGH.length; mask += 1) {
  for (let high = 14; high >= 6; high -= 1) {
    const straight = 31 << (high - 6);
    if ((mask & straight) === straight) {
      STRAIGHT_HIGH[mask] = high;
      break;
    }
  }
  if (!STRAIGHT_HIGH[mask] && (mask & 4111) === 4111) STRAIGHT_HIGH[mask] = 5;
}

const highest = (mask) => 33 - Math.clz32(mask);
const rankBit = (rank) => 1 << (rank - 2);
const score = (category, a = 0, b = 0, c = 0, d = 0, e = 0) =>
  category * UNIT + a * 50625 + b * 3375 + c * 225 + d * 15 + e;

function highCardScore(category, mask) {
  let value = category * UNIT;
  let place = 50625;
  for (let index = 0; index < 5; index += 1) {
    const rank = highest(mask);
    value += rank * place;
    place /= 15;
    mask ^= rankBit(rank);
  }
  return value;
}

/** Rank masks avoid evaluating 21 separate five-card subsets per runout. */
function scoreEncoded(cards) {
  let once = 0;
  let twice = 0;
  let thrice = 0;
  let four = 0;
  let spades = 0;
  let hearts = 0;
  let clubs = 0;
  let diamonds = 0;
  let ns = 0;
  let nh = 0;
  let nc = 0;
  let nd = 0;
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    const bit = 1 << (card % 13);
    four |= thrice & bit;
    thrice |= twice & bit;
    twice |= once & bit;
    once |= bit;
    const suit = Math.floor(card / 13);
    if (suit === 0) { spades |= bit; ns += 1; }
    else if (suit === 1) { hearts |= bit; nh += 1; }
    else if (suit === 2) { clubs |= bit; nc += 1; }
    else { diamonds |= bit; nd += 1; }
  }
  const flush = ns >= 5 ? spades : nh >= 5 ? hearts : nc >= 5 ? clubs : nd >= 5 ? diamonds : 0;
  const straightFlush = STRAIGHT_HIGH[flush];
  if (straightFlush) return score(straightFlush === 14 ? 9 : 8, straightFlush);
  if (four) {
    const rank = highest(four);
    return score(7, rank, highest(once ^ rankBit(rank)));
  }
  if (thrice) {
    const rank = highest(thrice);
    const otherPairs = twice ^ rankBit(rank);
    if (otherPairs) return score(6, rank, highest(otherPairs));
  }
  if (flush) return highCardScore(5, flush);
  if (STRAIGHT_HIGH[once]) return score(4, STRAIGHT_HIGH[once]);
  if (thrice) {
    const rank = highest(thrice);
    const rest = once ^ rankBit(rank);
    const first = highest(rest);
    return score(3, rank, first, highest(rest ^ rankBit(first)));
  }
  if (twice) {
    const pair = highest(twice);
    const otherPairs = twice ^ rankBit(pair);
    if (otherPairs) {
      const second = highest(otherPairs);
      return score(2, pair, second, highest(once ^ rankBit(pair) ^ rankBit(second)));
    }
    let rest = once ^ rankBit(pair);
    const first = highest(rest);
    rest ^= rankBit(first);
    const second = highest(rest);
    return score(1, pair, first, second, highest(rest ^ rankBit(second)));
  }
  return highCardScore(0, once);
}

function encode(card) {
  if (!card || typeof card !== "object" || Array.isArray(card)) {
    throw new TypeError("Each card needs a valid rank string and suit.");
  }
  const rank = RANKS.indexOf(card.rank);
  const suit = SUITS.indexOf(card.suit);
  if (rank < 0 || suit < 0) throw new TypeError("Each card needs a valid rank string and suit.");
  return suit * 13 + rank;
}

function encodeDistinct(cards) {
  const encoded = [...cards].map(encode);
  if (new Set(encoded).size !== encoded.length) throw new RangeError("A card cannot appear more than once in a deal.");
  return encoded;
}

/** Same numeric score/categories as evaluateBest, without selecting bestCards. */
export function evaluateReviewHand(cards) {
  if (!Array.isArray(cards) || cards.length < 5 || cards.length > 7) {
    throw new RangeError("Hand evaluation requires five to seven cards.");
  }
  const value = scoreEncoded(encodeDistinct(cards));
  return { score: value, category: ODDS_CATEGORIES[Math.floor(value / UNIT)] };
}

/**
 * Each supplied hand is known dead-card information, even when its owner is
 * ineligible for a side pot. Supply only the board revealed at this street;
 * actual cards from later streets must remain possible future outcomes.
 * win = sole-winner probability; tie = probability of sharing first place;
 * equity = expected share (a three-way tie contributes 1/3, not 1/2).
 */
export function calculateReviewEquity({ players, board, pots } = {}) {
  if (!Array.isArray(players) || players.length < 2 || players.length > 10) {
    throw new RangeError("Equity requires two to ten players with known hands.");
  }
  const ids = players.map((player) => player?.id);
  if (ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) {
    throw new TypeError("Players require unique nonempty string IDs.");
  }
  if (players.some((player) => !Array.isArray(player.hand) || player.hand.length !== 2)) {
    throw new RangeError("Each player requires exactly two cards.");
  }
  if (!Array.isArray(board) || ![0, 3, 4, 5].includes(board.length)) {
    throw new RangeError("A recorded street requires zero, three, four, or five board cards.");
  }
  const known = encodeDistinct([...players.flatMap((player) => [...player.hand]), ...board]);
  const knownSet = new Set(known);
  const remaining = Array.from({ length: 52 }, (_, id) => id).filter((id) => !knownSet.has(id));
  const groups = pots ?? [{ id: "main", eligible: ids }];
  if (!Array.isArray(groups) || !groups.length || new Set(groups.map((pot) => pot?.id)).size !== groups.length) {
    throw new TypeError("Pots require unique IDs.");
  }
  for (const pot of groups) {
    if (!pot || typeof pot.id !== "string" || !pot.id || !Array.isArray(pot.eligible) || !pot.eligible.length ||
      new Set(pot.eligible).size !== pot.eligible.length || pot.eligible.some((id) => !ids.includes(id))) {
      throw new TypeError("Each pot requires a unique ID and known, distinct eligible players.");
    }
  }
  const mainIndex = groups.findIndex((pot) => pot.eligible.length === ids.length);
  // Always compute a common comparison alongside the eligible side pots.
  const scoringGroups = mainIndex >= 0 ? groups : [{ id: "__all", eligible: ids }, ...groups];
  const tallies = scoringGroups.map((pot) => ({
    indices: pot.eligible.map((id) => ids.indexOf(id)),
    wins: new Uint32Array(players.length),
    ties: new Uint32Array(players.length),
    units: new Float64Array(players.length),
  }));
  const finalBoard = new Uint8Array(5);
  finalBoard.set(known.slice(players.length * 2));
  const hands = players.map((_, index) => {
    const cards = new Uint8Array(7);
    cards[0] = known[index * 2];
    cards[1] = known[index * 2 + 1];
    return cards;
  });
  const scores = new Float64Array(players.length);
  let totalOutcomes = 0;

  function visit() {
    totalOutcomes += 1;
    for (let index = 0; index < players.length; index += 1) {
      const cards = hands[index];
      for (let b = 0; b < 5; b += 1) cards[b + 2] = finalBoard[b];
      scores[index] = scoreEncoded(cards);
    }
    for (const tally of tallies) {
      let best = -1;
      let winners = 0;
      for (const index of tally.indices) {
        if (scores[index] > best) { best = scores[index]; winners = 1; }
        else if (scores[index] === best) winners += 1;
      }
      for (const index of tally.indices) {
        if (scores[index] !== best) continue;
        if (winners === 1) tally.wins[index] += 1;
        else tally.ties[index] += 1;
        tally.units[index] += SPLIT_UNITS / winners;
      }
    }
  }

  function enumerate(start, position) {
    if (position === 5) { visit(); return; }
    for (let index = start; index <= remaining.length - (5 - position); index += 1) {
      finalBoard[position] = remaining[index];
      enumerate(index + 1, position + 1);
    }
  }
  enumerate(0, board.length);

  function probabilities(tally) {
    return tally.indices.map((index) => ({
      id: ids[index],
      win: tally.wins[index] / totalOutcomes,
      tie: tally.ties[index] / totalOutcomes,
      equity: tally.units[index] / (SPLIT_UNITS * totalOutcomes),
      wins: tally.wins[index],
      ties: tally.ties[index],
    }));
  }
  const offset = mainIndex >= 0 ? 0 : 1;
  return {
    exact: true,
    totalOutcomes,
    remainingCards: remaining.length,
    missingBoardCards: 5 - board.length,
    players: probabilities(tallies[mainIndex >= 0 ? mainIndex : 0]),
    pots: groups.map((pot, index) => ({ id: pot.id, eligible: [...pot.eligible], players: probabilities(tallies[index + offset]) })),
  };
}

/**
 * Split cumulative contributions into contestable pots and unmatched refunds.
 * Folded players contribute chips but are never eligible. A one-contributor
 * layer is returned as kind: "refund", with refundTo and no eligible players;
 * it must not be counted as a pot. Amounts use the same units as contributions.
 */
export function buildSidePots(players) {
  if (!Array.isArray(players) || !players.length) throw new TypeError("Players are required.");
  if (new Set(players.map((player) => player?.id)).size !== players.length || players.some((player) =>
    !player || typeof player.id !== "string" || !player.id || !Number.isFinite(player.contribution) || player.contribution < 0)) {
    throw new TypeError("Players require unique IDs and nonnegative finite contributions.");
  }
  const levels = [...new Set(players.map(({ contribution }) => contribution).filter((amount) => amount > 0))].sort((a, b) => a - b);
  let previous = 0;
  return levels.map((level) => {
    const contributors = players.filter(({ contribution }) => contribution >= level);
    const amount = (level - previous) * contributors.length;
    previous = level;
    if (contributors.length === 1) {
      return { kind: "refund", amount, refundTo: contributors[0].id, eligible: [], contributors: [contributors[0].id] };
    }
    const eligible = contributors.filter((player) => !player.folded).map(({ id }) => id);
    if (!eligible.length) throw new RangeError("A contested contribution layer has no live eligible player.");
    return { kind: "pot", amount, eligible, contributors: contributors.map(({ id }) => id) };
  });
}

/** Input fixtures used by the checked-in exact equity generator. */
const fromText = (text) => text.split(" ").map((value) => ODDS_DECK.find((card) =>
  card.rank === value.slice(0, -1) && card.suit === ({ s: "spades", h: "hearts", c: "clubs", d: "diamonds" })[value.at(-1)]));
export const REVIEW_EQUITY_DEALS = Object.freeze({
  fourWay: {
    players: [
      { id: "A", hand: fromText("Js Jc") },
      { id: "B", hand: fromText("7d 8d") },
      { id: "C", hand: fromText("Ah Ad") },
      { id: "D", hand: fromText("Ac 5c") },
    ],
    board: fromText("6s 5s 5d 10c 6h"),
    pots: [{ id: "main", eligible: ["A", "B", "C", "D"] }, { id: "side1", eligible: ["A", "C", "D"] }, { id: "side2", eligible: ["C", "D"] }],
  },
  headsUp: {
    players: [{ id: "A", hand: fromText("Qd Qc") }, { id: "B", hand: fromText("7s 9s") }],
    board: fromText("10d 8c 5h Js 7c"),
    pots: [{ id: "main", eligible: ["A", "B"] }],
  },
});
