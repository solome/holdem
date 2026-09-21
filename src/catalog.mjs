/**
 * The complete achievement catalog. Ranks are canonical strings so the same
 * data can be rendered without a locale-dependent conversion.
 */
export const SUITS = Object.freeze([
  Object.freeze({ id: "spades", symbol: "♠" }),
  Object.freeze({ id: "hearts", symbol: "♥" }),
  Object.freeze({ id: "clubs", symbol: "♣" }),
  Object.freeze({ id: "diamonds", symbol: "♦" }),
]);

const SUIT_IDS = new Set(SUITS.map(({ id }) => id));
const FACE_RANKS = { 11: "J", 12: "Q", 13: "K", 14: "A" };

export function rankLabel(rank) {
  if (!Number.isInteger(rank) || rank < 2 || rank > 14) {
    throw new RangeError("A card rank must be an integer from 2 to 14.");
  }
  return FACE_RANKS[rank] ?? String(rank);
}

const RANKS = new Set(
  Array.from({ length: 13 }, (_, index) => rankLabel(index + 2)),
);
const card = (rank, suit) => ({
  rank: typeof rank === "number" ? rankLabel(rank) : rank,
  suit,
});
const cardKey = ({ rank, suit }) => `${rank}:${suit}`;
const isCard = (value) =>
  value !== null &&
  typeof value === "object" &&
  RANKS.has(value.rank) &&
  SUIT_IDS.has(value.suit);

function targetCards(achievement) {
  if (!achievement || !Number.isInteger(achievement.high)) return null;
  const { category, high, suit } = achievement;

  if (category === "quads") {
    if (high < 10 || high > 14 || suit !== null) return null;
    return SUITS.map(({ id }) => card(high, id));
  }

  if (!SUIT_IDS.has(suit)) return null;
  if (category === "royal" && high !== 14) return null;
  if (category === "straight-flush" && (high < 10 || high > 13)) return null;
  if (category !== "royal" && category !== "straight-flush") return null;
  return Array.from({ length: 5 }, (_, index) => card(high - 4 + index, suit));
}

/**
 * A record must have exactly two hole cards and five board cards. All seven
 * cards must be legal, distinct, and contain the achievement's exact target.
 * This accepts any valid selection from seven cards, including playing the
 * board, as Texas Hold'em does not require using a hole card.
 */
export function validateRecord(achievement, record) {
  const target = targetCards(achievement);
  if (
    !target ||
    !Array.isArray(achievement.cards) ||
    achievement.cards.length !== target.length ||
    !achievement.cards.every(isCard)
  )
    return false;

  const declaredKeys = new Set(achievement.cards.map(cardKey));
  if (
    declaredKeys.size !== target.length ||
    !target.every((value) => declaredKeys.has(cardKey(value)))
  )
    return false;

  if (
    !record ||
    !Array.isArray(record.hole) ||
    record.hole.length !== 2 ||
    !Array.isArray(record.board) ||
    record.board.length !== 5
  )
    return false;
  const sevenCards = [...record.hole, ...record.board];
  if (!sevenCards.every(isCard)) return false;

  const sevenKeys = new Set(sevenCards.map(cardKey));
  return (
    sevenKeys.size === 7 &&
    target.every((value) => sevenKeys.has(cardKey(value)))
  );
}

const RECORDS = {
  "royal-diamonds": {
    hole: [card("A", "diamonds"), card("K", "diamonds")],
    board: [
      card("10", "diamonds"),
      card("Q", "diamonds"),
      card("10", "clubs"),
      card("J", "diamonds"),
      card("8", "clubs"),
    ],
  },
  "straight-flush-spades-12": {
    hole: [card("10", "spades"), card("8", "spades")],
    board: [
      card("9", "spades"),
      card("Q", "spades"),
      card("J", "spades"),
      card("9", "hearts"),
      card("8", "diamonds"),
    ],
  },
  "quads-13": {
    hole: [card("K", "hearts"), card("4", "diamonds")],
    board: [
      card("K", "diamonds"),
      card("K", "clubs"),
      card("K", "spades"),
      card("6", "spades"),
      card("J", "spades"),
    ],
  },
};

function createAchievement(category, high, suit = null) {
  const id =
    category === "quads"
      ? `quads-${high}`
      : category === "royal"
        ? `royal-${suit}`
        : `straight-flush-${suit}-${high}`;
  const achievement = { id, category, high, suit };
  achievement.cards = targetCards(achievement);
  const record = RECORDS[id] ?? null;
  achievement.record = validateRecord(achievement, record) ? record : null;
  return achievement;
}

export const ACHIEVEMENTS = [
  ...SUITS.map(({ id }) => createAchievement("royal", 14, id)),
  ...[13, 12, 11, 10].flatMap((high) =>
    SUITS.map(({ id }) => createAchievement("straight-flush", high, id)),
  ),
  ...[14, 13, 12, 11, 10].map((high) => createAchievement("quads", high)),
];

/** Count only verified records, including when called with an edited catalog. */
export function getStats(achievements = ACHIEVEMENTS) {
  const byCategory = Object.fromEntries(
    ["royal", "straight-flush", "quads"].map((category) => [
      category,
      { total: 0, unlocked: 0, remaining: 0 },
    ]),
  );
  let unlocked = 0;
  for (const achievement of achievements) {
    const category = byCategory[achievement.category];
    const achieved = validateRecord(achievement, achievement.record);
    if (achieved) unlocked += 1;
    if (category) {
      category.total += 1;
      category.unlocked += Number(achieved);
      category.remaining += Number(!achieved);
    }
  }
  return {
    total: achievements.length,
    unlocked,
    remaining: achievements.length - unlocked,
    byCategory,
  };
}
