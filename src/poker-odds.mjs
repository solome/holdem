/**
 * Exact Texas Hold'em odds after the flop. Categories describe the best five
 * cards at the river, using any zero, one, or two hole cards. No simulations,
 * opponent-range assumptions, or independent-event approximations are used.
 */
export const ODDS_CATEGORIES = Object.freeze([
  "high-card",
  "one-pair",
  "two-pair",
  "three-kind",
  "straight",
  "flush",
  "full-house",
  "four-kind",
  "straight-flush",
  "royal-flush",
]);

const RANKS = Object.freeze([
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
]);
const SUITS = Object.freeze(["spades", "hearts", "clubs", "diamonds"]);
const RANK_VALUES = new Map(RANKS.map((rank, index) => [rank, index + 2]));
const SUIT_VALUES = new Map(SUITS.map((suit, index) => [suit, index]));

export const ODDS_DECK = Object.freeze(
  SUITS.flatMap((suit) => RANKS.map((rank) => Object.freeze({ rank, suit }))),
);

// Five base-15 rank digits leave category and every kicker significant. Suits
// never break ties. Scores are exact integers, comfortably below 2 ** 53.
const CATEGORY_UNIT = 15 ** 5;
const score = (category, a = 0, b = 0, c = 0, d = 0, e = 0) =>
  category * CATEGORY_UNIT +
  a * 15 ** 4 +
  b * 15 ** 3 +
  c * 15 ** 2 +
  d * 15 +
  e;

function encodeCard(card) {
  if (
    card === null ||
    typeof card !== "object" ||
    Array.isArray(card) ||
    !RANK_VALUES.has(card.rank) ||
    !SUIT_VALUES.has(card.suit)
  ) {
    throw new TypeError("Each card needs a valid rank string and suit.");
  }
  const rank = RANK_VALUES.get(card.rank);
  const suit = SUIT_VALUES.get(card.suit);
  return { card, rank, suit, id: suit * 13 + rank - 2 };
}

function encodeDistinct(cards) {
  const encoded = cards.map(encodeCard);
  if (new Set(encoded.map(({ id }) => id)).size !== encoded.length) {
    throw new RangeError("A card cannot appear more than once in a deal.");
  }
  return encoded;
}

/** Evaluate exactly five already validated cards. */
function fiveScore(cards) {
  const ranks = cards.map(({ rank }) => rank).sort((a, b) => b - a);
  const flush = cards.every(({ suit }) => suit === cards[0].suit);
  const unique = [...new Set(ranks)];
  const straightHigh =
    unique.length === 5
      ? ranks[0] - ranks[4] === 4
        ? ranks[0]
        : ranks.join(",") === "14,5,4,3,2"
          ? 5
          : 0
      : 0;
  if (flush && straightHigh)
    return score(straightHigh === 14 ? 9 : 8, straightHigh);

  const groups = unique
    .map((rank) => ({
      rank,
      count: ranks.filter((value) => value === rank).length,
    }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
  if (groups[0].count === 4) return score(7, groups[0].rank, groups[1].rank);
  if (groups[0].count === 3 && groups[1].count === 2)
    return score(6, groups[0].rank, groups[1].rank);
  if (flush) return score(5, ...ranks);
  if (straightHigh) return score(4, straightHigh);
  if (groups[0].count === 3) return score(3, ...groups.map(({ rank }) => rank));
  if (groups[0].count === 2 && groups[1].count === 2)
    return score(2, ...groups.map(({ rank }) => rank));
  if (groups[0].count === 2) return score(1, ...groups.map(({ rank }) => rank));
  return score(0, ...ranks);
}

function evaluateEncoded(cards) {
  let bestScore = -1;
  let bestCards;
  // At most 21 five-card subsets. This also handles two triples, three pairs,
  // six/seven-card flushes, wheel straights, and playing only the board.
  for (let a = 0; a < cards.length - 4; a += 1) {
    for (let b = a + 1; b < cards.length - 3; b += 1) {
      for (let c = b + 1; c < cards.length - 2; c += 1) {
        for (let d = c + 1; d < cards.length - 1; d += 1) {
          for (let e = d + 1; e < cards.length; e += 1) {
            const candidate = [
              cards[a],
              cards[b],
              cards[c],
              cards[d],
              cards[e],
            ];
            const candidateScore = fiveScore(candidate);
            if (candidateScore > bestScore) {
              bestScore = candidateScore;
              bestCards = candidate;
            }
          }
        }
      }
    }
  }
  return {
    category: ODDS_CATEGORIES[Math.floor(bestScore / CATEGORY_UNIT)],
    score: bestScore,
    bestCards: bestCards
      .slice()
      .sort((a, b) => b.rank - a.rank)
      .map(({ card }) => card),
  };
}

/** Return the strongest five-card hand from five, six, or seven unique cards. */
export function evaluateBest(cards) {
  if (!Array.isArray(cards) || cards.length < 5 || cards.length > 7) {
    throw new RangeError("Hand evaluation requires five to seven cards.");
  }
  // Spread also exposes sparse array slots to validation.
  return evaluateEncoded(encodeDistinct([...cards]));
}

const emptyCounts = () =>
  Object.fromEntries(ODDS_CATEGORIES.map((category) => [category, 0]));

/**
 * Enumerate unordered runouts to a five-card board, excluding every known card
 * (including an optional opponent's cards). Each possible runout has equal
 * weight. Equity is wins plus half the ties, divided by total runouts.
 */
export function calculateOdds(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Odds require a deal object.");
  }
  const { hero, board, villain = null } = input;
  if (!Array.isArray(hero) || hero.length !== 2) {
    throw new RangeError("Your hand requires exactly two cards.");
  }
  if (!Array.isArray(board) || ![3, 4, 5].includes(board.length)) {
    throw new RangeError("The board requires three, four, or five cards.");
  }
  if (villain !== null && (!Array.isArray(villain) || villain.length !== 2)) {
    throw new RangeError("An opponent's hand requires exactly two cards.");
  }

  const known = encodeDistinct([...hero, ...board, ...(villain ?? [])]);
  const heroCards = known.slice(0, 2);
  const boardCards = known.slice(2, 2 + board.length);
  const villainCards = villain === null ? null : known.slice(2 + board.length);
  const knownIds = new Set(known.map(({ id }) => id));
  const remaining = ODDS_DECK.map(encodeCard).filter(
    ({ id }) => !knownIds.has(id),
  );
  const result = {
    totalOutcomes: 0,
    hero: {
      counts: emptyCounts(),
      current: evaluateEncoded([...heroCards, ...boardCards]),
    },
    villain:
      villainCards === null
        ? null
        : {
            counts: emptyCounts(),
            current: evaluateEncoded([...villainCards, ...boardCards]),
          },
    showdown:
      villainCards === null ? null : { wins: 0, ties: 0, losses: 0, equity: 0 },
  };

  function visit(runout) {
    const finalBoard = [...boardCards, ...runout];
    const heroHand = evaluateEncoded([...heroCards, ...finalBoard]);
    result.hero.counts[heroHand.category] += 1;
    result.totalOutcomes += 1;
    if (villainCards !== null) {
      const villainHand = evaluateEncoded([...villainCards, ...finalBoard]);
      result.villain.counts[villainHand.category] += 1;
      if (heroHand.score > villainHand.score) result.showdown.wins += 1;
      else if (heroHand.score < villainHand.score) result.showdown.losses += 1;
      else result.showdown.ties += 1;
    }
  }

  const missing = 5 - board.length;
  if (missing === 0) visit([]);
  else if (missing === 1) {
    for (const card of remaining) visit([card]);
  } else {
    for (let first = 0; first < remaining.length - 1; first += 1) {
      for (let second = first + 1; second < remaining.length; second += 1) {
        visit([remaining[first], remaining[second]]);
      }
    }
  }
  if (result.showdown !== null) {
    result.showdown.equity =
      (result.showdown.wins + result.showdown.ties / 2) / result.totalOutcomes;
  }
  return result;
}
