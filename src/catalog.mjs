import { evaluateBest } from "./poker-odds.mjs";

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
  !Array.isArray(value) &&
  RANKS.has(value.rank) &&
  SUIT_IDS.has(value.suit);

function isRecordDate(value) {
  if (
    typeof value !== "string" ||
    value.length !== 10 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  )
    return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

function targetCards(achievement) {
  if (!achievement || !Number.isInteger(achievement.high)) return null;
  const { category, high, suit } = achievement;

  if (category === "quads") {
    if (high < 2 || high > 14 || suit !== null) return null;
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
 * An optional date must be a real YYYY-MM-DD date. An optional opponent must
 * have two legal cards distinct from each other and the seven player cards.
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
    record.board.length !== 5 ||
    (record.date != null && !isRecordDate(record.date)) ||
    (record.opponent != null &&
      (!Array.isArray(record.opponent) || record.opponent.length !== 2))
  )
    return false;
  const sevenCards = [...record.hole, ...record.board];
  const allCards = [...sevenCards, ...(record.opponent ?? [])];
  if (!allCards.every(isCard)) return false;

  const sevenKeys = new Set(sevenCards.map(cardKey));
  return (
    new Set(allCards.map(cardKey)).size === allCards.length &&
    target.every((value) => sevenKeys.has(cardKey(value)))
  );
}

/** Return verified records newest first without changing their stored order. */
export function getRecords(achievement) {
  if (!achievement || typeof achievement !== "object") return [];
  const records =
    "records" in achievement
      ? achievement.records
      : achievement.record == null
        ? []
        : [achievement.record];
  if (!Array.isArray(records)) return [];
  return records
    .filter((record) => validateRecord(achievement, record))
    .sort((first, second) =>
      (second.date ?? "").localeCompare(first.date ?? ""),
    );
}

/** Evaluate the opponent in the selected record, defaulting to the latest. */
export function getOpponentHand(achievement, record = getRecords(achievement)[0]) {
  if (!validateRecord(achievement, record) || record.opponent == null)
    return null;
  return evaluateBest([...record.opponent, ...record.board]);
}

const RECORDS = {
  "royal-diamonds": [
    {
      date: "2026-08-08",
      hole: [card("A", "diamonds"), card("K", "diamonds")],
      board: [
        card("10", "diamonds"),
        card("Q", "diamonds"),
        card("10", "clubs"),
        card("J", "diamonds"),
        card("8", "clubs"),
      ],
    },
  ],
  "straight-flush-spades-12": [
    {
      date: "2026-08-01",
      hole: [card("10", "spades"), card("8", "spades")],
      board: [
        card("9", "spades"),
        card("Q", "spades"),
        card("J", "spades"),
        card("9", "hearts"),
        card("8", "diamonds"),
      ],
    },
  ],
  "quads-13": [
    {
      date: "2026-08-22",
      hole: [card("K", "hearts"), card("4", "diamonds")],
      board: [
        card("K", "diamonds"),
        card("K", "clubs"),
        card("K", "spades"),
        card("6", "spades"),
        card("J", "spades"),
      ],
    },
  ],
  "quads-12": [
    {
      date: "2026-10-26",
      hole: [card("Q", "spades"), card("K", "diamonds")],
      board: [
        card("Q", "clubs"),
        card("Q", "hearts"),
        card("K", "spades"),
        card("10", "clubs"),
        card("Q", "diamonds"),
      ],
      opponent: [card("K", "clubs"), card("9", "clubs")],
    },
  ],
  "quads-7": [
    {
      date: "2026-09-24",
      hole: [card("7", "spades"), card("5", "spades")],
      board: [
        card("A", "hearts"),
        card("7", "clubs"),
        card("7", "hearts"),
        card("7", "diamonds"),
        card("3", "diamonds"),
      ],
      opponent: [card("K", "clubs"), card("A", "diamonds")],
    },
  ],
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
  achievement.records = RECORDS[id] ?? [];
  achievement.records = getRecords(achievement);
  return achievement;
}

export const ACHIEVEMENTS = [
  ...SUITS.map(({ id }) => createAchievement("royal", 14, id)),
  ...[13, 12, 11, 10].flatMap((high) =>
    SUITS.map(({ id }) => createAchievement("straight-flush", high, id)),
  ),
  ...Array.from({ length: 13 }, (_, index) =>
    createAchievement("quads", 14 - index),
  ),
];

/** Count achieved targets once, even when a target has several records. */
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
    const achieved = getRecords(achievement).length > 0;
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
