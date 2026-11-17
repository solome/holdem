/**
 * Original educational entry presets, not solver output or copied charts.
 * Scope: six-handed NLHE cash, 100 BB effective, no ante. Opening presets apply
 * only when everyone before hero folds; the entry model below also distinguishes
 * a single 1 BB limper from a single 2.5 BB opener (3 BB when SB opens).
 * UTG is also called LJ in six-handed play; HJ is sometimes called MP.
 *
 * The references explain RFI, limpers, positional and opponent-dependent
 * adjustments, and BB defense. The individual cells below are
 * authored here to compare a tight, standard, and loose aggressive approach.
 * No preset guarantees positive EV; rake, sizing and opponents change ranges.
 */
export const SOURCE_URLS = Object.freeze([
  "https://www.pokerstars.com/poker/learn/lesson/opening-the-pot/",
  "https://upswingpoker.com/6-handed-max-poker-strategy/",
  "https://upswingpoker.com/preflop-open-strategy-rfi-explained/",
  "https://www.pokerstars.com/poker/learn/lesson/pre-flop-essentials/",
  "https://upswingpoker.com/podcast/ep3-big-blind-defense/",
  "https://upswingpoker.com/limps-poker-open-limpers-strategy/",
]);

export const ENTRY_SCENARIOS = Object.freeze(["unopened", "limped", "raised"]);
export const ENTRY_METADATA = Object.freeze({
  provenance: "original-simplified-educational-presets",
  solverOutput: false,
  players: 6,
  effectiveStackBB: 100,
  anteBB: 0,
  opponentsAlreadyEntered: 1,
  otherCallers: 0,
  limperSizeBB: 1,
  openerSizeBB: 2.5,
  smallBlindOpenerSizeBB: 3,
  raisesBeforeHero: 1,
  smallBlindFacingRaise: "simplified-three-bet-or-fold",
  continueDefinition: "raise + call + check; includes free big-blind checks",
  activeEntryDefinition: "raise + call; excludes free checks; not observed VPIP",
  sources: SOURCE_URLS,
});

export const RANGE_RANKS = Object.freeze([
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
]);
export const RANGE_STYLES = Object.freeze(["tag", "balanced", "lag"]);
export const RANGE_POSITIONS = Object.freeze([
  "UTG",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
]);

/** Row-major matrix: pairs on the diagonal, suited above, offsuit below. */
export const HANDS_169 = Object.freeze(
  RANGE_RANKS.flatMap((rowRank, row) =>
    RANGE_RANKS.map((colRank, col) => {
      const high = RANGE_RANKS[Math.min(row, col)];
      const low = RANGE_RANKS[Math.max(row, col)];
      const kind = row === col ? "pair" : row < col ? "suited" : "offsuit";
      const suffix = kind === "pair" ? "" : kind === "suited" ? "s" : "o";
      return Object.freeze({
        id: `${high}${low}${suffix}`,
        high,
        low,
        kind,
        combos: kind === "pair" ? 6 : kind === "suited" ? 4 : 12,
        row,
        col,
      });
    }),
  ),
);

const HAND_BY_ID = new Map(HANDS_169.map((hand) => [hand.id, hand]));

function parseHand(value) {
  const hand = HAND_BY_ID.get(value);
  if (!hand) throw new RangeError(`Unknown starting hand: ${value}`);
  return hand;
}

/** Concrete, unordered card pairs; numeric ten uses the achievement format. */
export function getHandCombinations(handId) {
  const hand = parseHand(handId);
  const suits = ["spades", "hearts", "clubs", "diamonds"];
  const combinations = [];
  const high = hand.high === "T" ? "10" : hand.high;
  const low = hand.low === "T" ? "10" : hand.low;
  for (let first = 0; first < suits.length; first += 1) {
    for (let second = 0; second < suits.length; second += 1) {
      if (hand.kind === "pair" && first >= second) continue;
      if (hand.kind === "suited" && first !== second) continue;
      if (hand.kind === "offsuit" && first === second) continue;
      combinations.push([
        { rank: high, suit: suits[first] },
        { rank: low, suit: suits[second] },
      ]);
    }
  }
  return combinations;
}

/**
 * Expand comma/space-separated canonical notation into unique matrix IDs.
 * 77+ = 77 through AA; ATs+ = ATs/AJs/AQs/AKs (fixed high card).
 * A5s-A2s and TT-77 expand inclusive intervals, in either endpoint order.
 * Mixed-kind intervals and diagonal connector intervals are deliberately
 * rejected so the shorthand always has one unambiguous meaning.
 */
export function expandRange(notation) {
  if (typeof notation !== "string")
    throw new TypeError("Range notation must be a string.");
  const result = new Set();
  for (const token of notation.split(/[,\s]+/).filter(Boolean)) {
    if (token.endsWith("+")) {
      const hand = parseHand(token.slice(0, -1));
      if (hand.kind === "pair") {
        for (let index = 0; index <= hand.row; index += 1) {
          result.add(RANGE_RANKS[index].repeat(2));
        }
      } else {
        const highIndex = RANGE_RANKS.indexOf(hand.high);
        const lowIndex = RANGE_RANKS.indexOf(hand.low);
        for (let index = highIndex + 1; index <= lowIndex; index += 1) {
          result.add(
            `${hand.high}${RANGE_RANKS[index]}${hand.kind === "suited" ? "s" : "o"}`,
          );
        }
      }
      continue;
    }

    const endpoints = token.split("-");
    if (endpoints.length === 1) {
      result.add(parseHand(token).id);
      continue;
    }
    if (endpoints.length !== 2)
      throw new RangeError(`Invalid interval: ${token}`);
    const [first, last] = endpoints.map(parseHand);
    if (
      first.kind !== last.kind ||
      (first.kind !== "pair" && first.high !== last.high)
    ) {
      throw new RangeError(`Incompatible interval endpoints: ${token}`);
    }
    const firstIndex = RANGE_RANKS.indexOf(first.low);
    const lastIndex = RANGE_RANKS.indexOf(last.low);
    for (
      let index = Math.min(firstIndex, lastIndex);
      index <= Math.max(firstIndex, lastIndex);
      index += 1
    ) {
      const rank = RANGE_RANKS[index];
      result.add(
        first.kind === "pair"
          ? rank.repeat(2)
          : `${first.high}${rank}${first.kind === "suited" ? "s" : "o"}`,
      );
    }
  }
  return result;
}

// Explicit, reviewable hand classes rather than a percentage or equity cutoff.
// TAG trims marginal low pairs, weak offsuit aces and suited gaps. Standard
// restores board coverage; LAG expands steals and marginal playable holdings.
// Each later non-blind seat retains the earlier seat's entire opening range.
// SB is independent: one opponent remains, but hero will be out of position.
export const RANGE_NOTATION = Object.freeze({
  tag: Object.freeze({
    UTG: "66+, A9s+, A5s-A2s, KTs+, QTs+, JTs, T9s, 98s, 87s, AJo+, KQo",
    HJ: "55+, A7s+, A5s-A2s, K9s+, QTs+, JTs, T9s, 98s, 87s, 76s, ATo+, KJo+, QJo",
    CO: "44+, A2s+, K8s+, Q9s+, J9s+, T8s+, 98s, 87s, 76s, 65s, A9o+, KTo+, QTo+, JTo",
    BTN: "22+, A2s+, K4s+, Q7s+, J7s+, T7s+, 97s+, 86s+, 75s+, 65s, 54s, A5o+, K9o+, Q9o+, J9o+, T9o",
    SB: "22+, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, A8o+, KTo+, QTo+, JTo",
  }),
  balanced: Object.freeze({
    UTG: "55+, A2s+, KTs+, QTs+, JTs, T9s, 98s, 87s, 76s, 65s, ATo+, KJo+, QJo",
    HJ: "44+, A2s+, K9s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, A9o+, KTo+, QTo+, JTo",
    CO: "22+, A2s+, K7s+, Q8s+, J8s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, A8o+, K9o+, QTo+, JTo, T9o",
    BTN: "22+, A2s+, K2s+, Q4s+, J5s+, T6s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K8o+, Q8o+, J8o+, T8o+, 98o, 87o",
    SB: "22+, A2s+, K3s+, Q6s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A4o+, K9o+, Q9o+, J9o+, T9o, 98o",
  }),
  lag: Object.freeze({
    UTG: "44+, A2s+, K9s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, 65s, A9o+, KTo+, QTo+, JTo",
    HJ: "33+, A2s+, K8s+, Q8s+, J8s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A8o+, K9o+, Q9o+, JTo, T9o",
    CO: "22+, A2s+, K5s+, Q6s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, 43s, A5o+, K8o+, Q8o+, J8o+, T8o+, 98o",
    BTN: "22+, A2s+, K2s+, Q2s+, J3s+, T5s+, 95s+, 84s+, 74s+, 63s+, 53s+, 43s, 32s, A2o+, K7o+, Q7o+, J7o+, T7o+, 97o+, 86o+, 76o",
    SB: "22+, A2s+, K2s+, Q4s+, J5s+, T6s+, 95s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K8o+, Q8o+, J8o+, T8o+, 98o, 87o",
  }),
});

const OPENING_RANGES = Object.fromEntries(
  RANGE_STYLES.map((style) => [
    style,
    Object.fromEntries(
      Object.entries(RANGE_NOTATION[style]).map(([position, notation]) => [
        position,
        expandRange(notation),
      ]),
    ),
  ]),
);

/** Returns a fresh Set; BB is unsupported (null), never an all-fold range. */
export function getOpeningRange(style, position) {
  if (!RANGE_STYLES.includes(style))
    throw new RangeError(`Unknown playing style: ${style}`);
  if (!RANGE_POSITIONS.includes(position))
    throw new RangeError(`Unknown position: ${position}`);
  return position === "BB" ? null : new Set(OPENING_RANGES[style][position]);
}

/** Seats acting before hero in the first preflop betting round. */
export function getPriorPositions(hero) {
  const index = RANGE_POSITIONS.indexOf(hero);
  if (index < 0) throw new RangeError(`Unknown position: ${hero}`);
  return RANGE_POSITIONS.slice(0, index);
}

/*
 * Each row is an authored hero/opponent matchup. Arguments are TAG raise/call,
 * then standard additions, then LAG additions. Cumulative notation makes the
 * tight → standard → loose continuation relationship explicit and reviewable.
 * Raise takes precedence if an added raise promotes a hand previously called.
 * This is a deterministic teaching simplification: no mixed frequencies, rake
 * model, re-raises, multiple limpers, callers of a raise, or opponent tendencies.
 * Later players may still act; these are hero's immediate decisions, not a
 * promise of reaching the flop for the current price.
 */
function entryPreset(
  tagRaise, tagCall, standardRaise = "", standardCall = "",
  looseRaise = "", looseCall = "",
) {
  return Object.freeze({
    tag: Object.freeze({ raise: tagRaise, call: tagCall }),
    balanced: Object.freeze({
      raise: `${tagRaise}, ${standardRaise}`,
      call: `${tagCall}, ${standardCall}`,
    }),
    lag: Object.freeze({
      raise: `${tagRaise}, ${standardRaise}, ${looseRaise}`,
      call: `${tagCall}, ${standardCall}, ${looseCall}`,
    }),
  });
}

// These strings describe intended actions, not the charts at SOURCE_URLS.
// A single limper has put in 1 BB and everyone else before hero has folded.
// Calls are overlimps (or SB completes). BB instead checks every non-raise hand.
const LIMPED_NOTATION = Object.freeze({
  HJ: Object.freeze({
    UTG: entryPreset(
      "77+, ATs+, KJs+, QJs, AJo+, KQo", "55-66, JTs, T9s, 98s",
      "66, A9s, KTs, QTs, ATo", "22-44, A5s-A2s, 87s, 76s",
      "55, A8s, K9s, Q9s, JTs, KJo, QJo", "A7s-A6s, J9s, T8s, 97s, 86s, 65s",
    ),
  }),
  CO: Object.freeze({
    UTG: entryPreset(
      "66+, A9s+, KTs+, QTs+, JTs, ATo+, KQo", "22-55, A5s-A2s, T9s, 98s, 87s, 76s",
      "55, A8s, K9s, Q9s, KJo, QJo", "A7s-A6s, J9s, T8s, 97s, 86s, 65s, 54s",
      "44, A7s, K8s, J9s, A9o, KTo, QTo, JTo", "Q8s, J8s, T7s, 96s, 75s, 64s",
    ),
    HJ: entryPreset(
      "66+, A8s+, KTs+, QTs+, JTs, ATo+, KJo+, QJo", "22-55, A5s-A2s, T9s, 98s, 87s, 76s",
      "55, A7s, K9s, Q9s, J9s, A9o, KTo, QTo, JTo", "A6s, T8s, 97s, 86s, 65s, 54s",
      "44, A6s, K8s, Q8s, T9s, A8o", "J8s, T7s, 96s, 75s, 64s, 43s",
    ),
  }),
  BTN: Object.freeze({
    UTG: entryPreset(
      "55+, A8s+, KTs+, QTs+, JTs, ATo+, KJo+, QJo", "22-44, A5s-A2s, T9s, 98s, 87s, 76s, 65s",
      "44, A7s, K9s, Q9s, J9s, A9o, KTo, QTo, JTo", "A6s, T8s, 97s, 86s, 75s, 54s",
      "33, A6s, K8s, Q8s, T9s, A8o", "J8s, T7s, 96s, 85s, 64s, 43s",
    ),
    HJ: entryPreset(
      "55+, A7s+, K9s+, QTs+, JTs, A9o+, KJo+, QJo", "22-44, A6s-A2s, T9s, 98s, 87s, 76s, 65s",
      "44, A6s, K8s, Q9s, J9s, T9s, A8o, KTo, QTo, JTo", "T8s, 97s, 86s, 75s, 54s",
      "33, A5s, K7s, Q8s, J8s, A7o, K9o", "T7s, 96s, 85s, 64s, 43s, T9o",
    ),
    CO: entryPreset(
      "44+, A5s+, K9s+, Q9s+, J9s+, T9s, A8o+, KTo+, QTo+, JTo", "22-33, A4s-A2s, 98s, 87s, 76s, 65s, 54s",
      "33, A4s-A2s, K7s-K8s, Q8s, J8s, T8s, A7o, K9o", "97s, 86s, 75s, 64s, 43s, T9o",
      "22, K5s-K6s, Q7s, J7s, T7s, 98s, A5o-A6o, Q9o, J9o", "96s, 85s, 74s, 53s, 98o",
    ),
  }),
  SB: Object.freeze({
    UTG: entryPreset(
      "88+, AJs+, KQs, AQo+", "22-77, A2s+, KTs-KJs, QTs+, JTs, T9s, 98s, 87s, 76s, 65s, AJo, KQo",
      "77, ATs, KJs, AJo", "K9s, Q9s, J9s, T8s, 97s, 86s, 75s, 54s, ATo, KJo, QJo",
      "66, A9s, KTs, QJs, ATo, KQo", "K8s, Q8s, J8s, T7s, 96s, 85s, 64s, A9o, KTo, QTo, JTo",
    ),
    HJ: entryPreset(
      "77+, ATs+, KJs+, QJs, AJo+, KQo", "22-66, A2s+, KTs, QTs, JTs, T9s, 98s, 87s, 76s, 65s, ATo, KJo, QJo",
      "66, A9s, KTs, QTs, ATo", "K8s-K9s, Q9s, J9s, T8s, 97s, 86s, 75s, 54s, A9o, KTo, QTo, JTo",
      "55, A8s, K9s, JTs, KJo, QJo", "K7s, Q8s, J8s, T7s, 96s, 85s, 64s, A8o, T9o",
    ),
    CO: entryPreset(
      "66+, A9s+, KTs+, QTs+, JTs, ATo+, KJo+, QJo", "22-55, A2s+, K8s-K9s, Q9s, J9s, T9s, 98s, 87s, 76s, 65s, A9o, KTo, QTo, JTo",
      "55, A8s, K9s, Q9s, J9s, A9o, KTo, QTo, JTo", "K6s-K7s, Q8s, J8s, T8s, 97s, 86s, 75s, 54s, A8o, T9o",
      "44, A7s, K8s, T9s, A8o, K9o", "K5s, Q7s, J7s, T7s, 96s, 85s, 64s, 43s, A7o, Q9o, J9o, 98o",
    ),
    BTN: entryPreset(
      "55+, A8s+, KTs+, QTs+, JTs, A9o+, KJo+, QJo", "22-44, A2s+, K7s-K9s, Q8s-Q9s, J9s, T8s+, 98s, 87s, 76s, 65s, 54s, A8o, KTo, QTo, JTo",
      "44, A7s, K9s, Q9s, J9s, T9s, A8o, KTo, QTo, JTo", "K4s-K6s, Q6s-Q7s, J8s, T7s, 97s, 86s, 75s, 64s, 43s, A6o-A7o, K9o, Q9o, J9o, T9o",
      "33, A5s-A6s, K8s, Q8s, J8s, A7o, K9o", "K2s-K3s, Q5s, J7s, T6s, 96s, 85s, 74s, 53s, A4o-A5o, K8o, Q8o, J8o, T8o, 98o, 87o",
    ),
  }),
  BB: Object.freeze({
    UTG: entryPreset(
      "88+, AJs+, KQs, AQo+", "",
      "77, ATs, KJs, QJs, AJo", "",
      "66, A9s, KTs, QTs, JTs, ATo, KQo", "",
    ),
    HJ: entryPreset(
      "77+, ATs+, KJs+, QJs, AJo+, KQo", "",
      "66, A9s, KTs, QTs, JTs, ATo", "",
      "55, A8s, K9s, Q9s, J9s, T9s, A9o, KJo, QJo", "",
    ),
    CO: entryPreset(
      "66+, A9s+, KTs+, QTs+, JTs, ATo+, KJo+, QJo", "",
      "55, A8s, K9s, Q9s, J9s, T9s, A9o, KTo, QTo, JTo", "",
      "44, A7s, K8s, Q8s, J8s, T8s, 98s, A8o, K9o", "",
    ),
    BTN: entryPreset(
      "55+, A8s+, K9s+, Q9s+, J9s+, T9s, A9o+, KTo+, QTo+, JTo", "",
      "44, A7s, K8s, Q8s, J8s, T8s, 98s, A8o, K9o", "",
      "33, A5s-A6s, K7s, Q7s, J7s, T7s, 97s, 87s, A7o, Q9o, J9o, T9o", "",
    ),
    SB: entryPreset(
      "44+, A5s+, K8s+, Q9s+, J9s+, T9s, A8o+, KTo+, QTo+, JTo", "",
      "33, A4s-A2s, K6s-K7s, Q8s, J8s, T8s, 98s, 87s, A7o, K9o, Q9o, J9o", "",
      "22, K4s-K5s, Q7s, J7s, T7s, 97s, 86s, 76s, 65s, A5o-A6o, K8o, Q8o, J8o, T9o, 98o", "",
    ),
  }),
});

// Exactly one open-raise, no cold callers and no re-raise. Hero has position
// against earlier non-blind seats, except SB/BB; BB has position against SB.
// SB deliberately uses three-bet/fold here to avoid a wide out-of-position
// cold-call strategy with BB still to act. This is a teaching simplification.
const RAISED_NOTATION = Object.freeze({
  HJ: Object.freeze({
    UTG: entryPreset(
      "QQ+, AKs, AKo", "TT-JJ, AQs",
      "A5s", "88-99, AJs, KQs, AQo",
      "JJ, AQs, A4s", "77, ATs, KJs, QJs, JTs",
    ),
  }),
  CO: Object.freeze({
    UTG: entryPreset(
      "QQ+, AKs, AKo", "99-JJ, AJs+, KQs, AQo",
      "A5s", "77-88, ATs, KJs, QJs, JTs",
      "JJ, AQs, A4s", "66, A9s, KTs, QTs, T9s, 98s",
    ),
    HJ: entryPreset(
      "JJ+, AQs+, AKo", "88-TT, AJs, KQs, AQo",
      "A5s", "66-77, ATs, KJs, QJs, JTs, T9s",
      "TT, AJs, AQo, A4s", "55, A9s, KTs, QTs, J9s, 98s",
    ),
  }),
  BTN: Object.freeze({
    UTG: entryPreset(
      "QQ+, AKs, AKo", "88-JJ, AJs+, KQs, AQo",
      "A5s", "66-77, ATs, KJs, QJs, JTs, T9s, 98s",
      "JJ, AQs, A4s", "55, A9s, KTs, QTs, J9s, 87s, 76s",
    ),
    HJ: entryPreset(
      "JJ+, AQs+, AKo", "77-TT, AJs, KQs, AQo",
      "A5s", "55-66, ATs, KJs, QJs, JTs, T9s, 98s, 87s",
      "TT, AJs, AQo, A4s", "44, A9s, KTs, QTs, J9s, T8s, 76s",
    ),
    CO: entryPreset(
      "TT+, AQs+, AQo+", "55-99, ATs-AJs, KTs+, QTs+, JTs, KQo",
      "A5s, AJs, KQs", "33-44, A8s-A9s, J9s, T9s, 98s, 87s, 76s, AJo",
      "99, ATs, KJs, A4s", "22, A6s-A7s, K9s, Q9s, T8s, 97s, 86s, 65s, 54s, ATo, KJo, QJo",
    ),
  }),
  SB: Object.freeze({
    UTG: entryPreset(
      "QQ+, AQs+, AKo", "",
      "JJ, AJs, KQs, A5s, AQo", "",
      "TT, ATs, KJs, QJs, A4s", "",
    ),
    HJ: entryPreset(
      "JJ+, AQs+, AKo", "",
      "TT, AJs, KQs, A5s, AQo", "",
      "99, ATs, KJs, QJs, A4s, AJo", "",
    ),
    CO: entryPreset(
      "TT+, AJs+, KQs, AQo+", "",
      "99, ATs, KJs, QJs, A5s, AJo", "",
      "88, A9s, KTs, QTs, JTs, A4s, KQo", "",
    ),
    BTN: entryPreset(
      "99+, ATs+, KJs+, QJs, AJo+, KQo", "",
      "88, A9s, KTs, QTs, JTs, A5s-A4s, ATo, KJo", "",
      "77, A8s, K9s, Q9s, J9s, T9s, A3s-A2s, KTo, QJo", "",
    ),
  }),
  BB: Object.freeze({
    UTG: entryPreset(
      "QQ+, AKs, AKo", "66-JJ, A9s+, A5s-A2s, KTs+, QTs+, JTs, T9s, 98s, 87s, AQo",
      "JJ, AQs, A5s", "22-55, A6s-A8s, K9s, Q9s, J9s, T8s, 97s, 86s, 76s, 65s, 54s, AJo, KQo",
      "TT, AJs, A4s, KQs", "K8s, Q8s, J8s, T7s, 96s, 85s, 75s, 64s, ATo, KJo, QJo",
    ),
    HJ: entryPreset(
      "JJ+, AQs+, AKo", "55-TT, A8s+, A5s-A2s, KTs+, QTs+, JTs, T9s, 98s, 87s, AQo",
      "TT, AJs, A5s", "22-44, A6s-A7s, K8s-K9s, Q9s, J9s, T8s, 97s, 86s, 76s, 65s, 54s, AJo, KQo",
      "99, ATs, A4s, KQs, AQo", "K7s, Q8s, J8s, T7s, 96s, 85s, 75s, 64s, 43s, ATo, KJo, QJo, JTo",
    ),
    CO: entryPreset(
      "TT+, AQs+, AQo+", "44-99, A2s+, K9s+, Q9s+, J9s+, T8s+, 98s, 87s, 76s, 65s, AJo, KQo",
      "99, AJs, KQs, A5s", "22-33, K7s-K8s, Q8s, J8s, T7s, 97s, 86s, 75s, 64s, 54s, ATo, KJo, QJo, JTo, T9o",
      "88, ATs, KJs, A4s, AJo", "K5s-K6s, Q7s, J7s, 96s, 85s, 74s, 63s, 53s, 43s, A9o, KTo, QTo, 98o",
    ),
    BTN: entryPreset(
      "99+, AJs+, KQs, AQo+", "22-88, A2s+, K7s+, Q8s+, J8s+, T7s+, 97s+, 86s+, 75s+, 65s, 54s, ATo-AJo, KJo+, QJo, JTo",
      "88, ATs, KJs, A5s-A4s, AJo", "K4s-K6s, Q6s-Q7s, J7s, 96s, 85s, 74s, 64s, 53s, 43s, A7o-A9o, KTo, QTo, T9o, 98o",
      "77, A9s, KTs, QJs, A3s-A2s, ATo, KQo", "K2s-K3s, Q4s-Q5s, J5s-J6s, T6s, 95s, 84s, 73s, 63s, 52s, 42s, 32s, A2o-A6o, K9o, Q9o, J9o, T8o, 97o, 87o, 76o",
    ),
    SB: entryPreset(
      "88+, ATs+, KJs+, AQo+", "22-77, A2s+, K5s+, Q7s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, 43s, A7o+, KTo+, QTo+, JTo, T9o, 98o, 87o",
      "77, A9s, KTs, QJs, A5s-A4s, AJo, KQo", "K2s-K4s, Q4s-Q6s, J5s-J6s, T6s, 95s, 85s, 74s, 63s, 53s, 42s, 32s, A2o-A6o, K8o-K9o, Q9o, J9o, T8o, 97o, 76o",
      "66, A8s, K9s, QTs, JTs, A3s-A2s, ATo, KJo", "Q2s-Q3s, J3s-J4s, T4s-T5s, 94s, 84s, 73s, 62s, 52s, K5o-K7o, Q7o-Q8o, J7o-J8o, T7o, 96o, 86o, 75o, 65o, 54o",
    ),
  }),
});

export const ENTRY_NOTATION = Object.freeze({
  limped: LIMPED_NOTATION,
  raised: RAISED_NOTATION,
});

/**
 * Fresh, mutually exclusive action sets covering all 169 hands when available.
 * An omitted opponent defaults to the closest preceding seat. Explicit invalid
 * opponents throw so consumers can normalize their selection on seat changes.
 * Unopened BB is a walk, not a 0% defense or a decision to fold all hands.
 */
export function getEntryStrategy(style, hero, scenario, opponent = undefined) {
  if (!RANGE_STYLES.includes(style))
    throw new RangeError(`Unknown playing style: ${style}`);
  const priorPositions = getPriorPositions(hero);
  if (!ENTRY_SCENARIOS.includes(scenario))
    throw new RangeError(`Unknown entry scenario: ${scenario}`);

  const result = {
    available: true,
    reason: null,
    raise: new Set(),
    call: new Set(),
    check: new Set(),
    fold: new Set(),
    continue: new Set(),
    opponent: null,
    scenario,
  };
  if (scenario === "unopened") {
    if (hero === "BB") {
      result.available = false;
      result.reason = "walk";
      return result;
    }
    result.raise = getOpeningRange(style, hero);
  } else {
    if (priorPositions.length === 0) {
      result.available = false;
      result.reason = "no-prior-player";
      return result;
    }
    const selectedOpponent = opponent === undefined ? priorPositions.at(-1) : opponent;
    if (!priorPositions.includes(selectedOpponent))
      throw new RangeError(`Invalid prior player ${selectedOpponent} for ${hero}`);
    result.opponent = selectedOpponent;
    const notation = ENTRY_NOTATION[scenario][hero][selectedOpponent][style];
    result.raise = expandRange(notation.raise);
    result.call = expandRange(notation.call);
    // Promoting a call to a raise never removes it from the continuation set.
    for (const hand of result.raise) result.call.delete(hand);
  }
  for (const { id } of HANDS_169) {
    if (result.raise.has(id) || result.call.has(id)) continue;
    if (scenario === "limped" && hero === "BB") result.check.add(id);
    else result.fold.add(id);
  }
  result.continue = new Set([...result.raise, ...result.call, ...result.check]);
  return result;
}

/** pairs/suited/offsuit count matrix cells; percent counts the 1,326 combos. */
export function getRangeSummary(range) {
  if (range === null) return null;
  if (!(range instanceof Set))
    throw new TypeError("A range must be a Set of hand IDs or null.");
  const summary = {
    hands: range.size,
    combos: 0,
    percent: 0,
    pairs: 0,
    suited: 0,
    offsuit: 0,
  };
  for (const id of range) {
    const hand = parseHand(id);
    summary.combos += hand.combos;
    summary[hand.kind === "pair" ? "pairs" : hand.kind] += 1;
  }
  summary.percent = (summary.combos / 1326) * 100;
  return summary;
}
