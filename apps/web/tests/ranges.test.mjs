import test from "node:test";
import assert from "node:assert/strict";
import {
  HANDS_169,
  RANGE_RANKS,
  RANGE_STYLES,
  RANGE_POSITIONS,
  RANGE_NOTATION,
  expandRange,
  getOpeningRange,
  getRangeSummary,
  getHandCombinations,
  ENTRY_SCENARIOS,
  ENTRY_METADATA,
  ENTRY_NOTATION,
  getPriorPositions,
  getEntryStrategy,
} from "../src/ranges.mjs";

const ids = new Set(HANDS_169.map(({ id }) => id));
const sorted = (set) => [...set].sort();
const isSubset = (subset, superset) =>
  [...subset].every((id) => superset.has(id));

test("13×13 matrix accounts for all 1,326 distinct card combinations", () => {
  assert.equal(HANDS_169.length, 169);
  assert.equal(ids.size, 169);
  assert.equal(RANGE_RANKS.length, 13);
  assert.equal(
    HANDS_169.reduce((sum, { combos }) => sum + combos, 0),
    1326,
  );
  assert.deepEqual(getRangeSummary(ids), {
    hands: 169,
    combos: 1326,
    percent: 100,
    pairs: 13,
    suited: 78,
    offsuit: 78,
  });
  assert.deepEqual(HANDS_169[0], {
    id: "AA",
    high: "A",
    low: "A",
    kind: "pair",
    combos: 6,
    row: 0,
    col: 0,
  });
  assert.equal(HANDS_169[1].id, "AKs");
  assert.equal(HANDS_169[13].id, "AKo");
  assert.equal(HANDS_169.at(-1).id, "22");
  for (const hand of HANDS_169) {
    assert.equal(
      hand.kind,
      hand.row === hand.col
        ? "pair"
        : hand.row < hand.col
          ? "suited"
          : "offsuit",
    );
    assert.equal(hand.high, RANGE_RANKS[Math.min(hand.row, hand.col)]);
    assert.equal(hand.low, RANGE_RANKS[Math.max(hand.row, hand.col)]);
  }
});

test("notation expands fixed-high kickers, pairs and intervals without duplicates", () => {
  assert.deepEqual(sorted(expandRange("QQ+")), ["AA", "KK", "QQ"]);
  assert.deepEqual(sorted(expandRange("ATs+")), ["AJs", "AKs", "AQs", "ATs"]);
  assert.deepEqual(sorted(expandRange("KTo+")), ["KJo", "KQo", "KTo"]);
  assert.deepEqual(sorted(expandRange("A5s-A2s")), [
    "A2s",
    "A3s",
    "A4s",
    "A5s",
  ]);
  assert.deepEqual(sorted(expandRange("77-TT")), ["77", "88", "99", "TT"]);
  assert.deepEqual(sorted(expandRange("AKs AKs, AA, KK+")), [
    "AA",
    "AKs",
    "KK",
  ]);
  assert.equal(expandRange(" \n, ").size, 0);
  assert.deepEqual(
    sorted(expandRange("A2s-A5s")),
    sorted(expandRange("A5s-A2s")),
  );
});

test("ambiguous and invalid notation is rejected rather than silently rendered", () => {
  for (const notation of [
    "AK",
    "KAs",
    "AAs",
    "TTo",
    "10Ts",
    "22s",
    "A1s",
    "A5s-K5s",
    "A2s-A5o",
    "AA-KKs",
    "AA--KK",
    "AA++",
    "88-",
    "+",
  ]) {
    assert.throws(() => expandRange(notation), RangeError, notation);
  }
  for (const value of [null, undefined, [], 42])
    assert.throws(() => expandRange(value), TypeError);
});

test("all 15 opening presets contain legal hands and the premium core", () => {
  for (const style of RANGE_STYLES) {
    assert.equal(Object.keys(RANGE_NOTATION[style]).length, 5);
    for (const position of RANGE_POSITIONS.filter((value) => value !== "BB")) {
      const range = getOpeningRange(style, position);
      assert.ok(range instanceof Set);
      assert.ok(isSubset(range, ids));
      for (const premium of ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs"]) {
        assert.ok(
          range.has(premium),
          `${style}/${position} must include ${premium}`,
        );
      }
      const summary = getRangeSummary(range);
      assert.equal(
        summary.hands,
        summary.pairs + summary.suited + summary.offsuit,
      );
      assert.equal(
        summary.combos,
        summary.pairs * 6 + summary.suited * 4 + summary.offsuit * 12,
      );
      assert.ok(
        summary.percent > 10 && summary.percent < 65,
        `${style}/${position}: ${summary.percent}`,
      );
    }
  }
});

test("later non-blind positions widen each style while SB has its own strategy", () => {
  for (const style of RANGE_STYLES) {
    for (const [earlier, later] of [
      ["UTG", "HJ"],
      ["HJ", "CO"],
      ["CO", "BTN"],
    ]) {
      const first = getOpeningRange(style, earlier);
      const second = getOpeningRange(style, later);
      assert.ok(isSubset(first, second), `${style}: ${earlier} ⊆ ${later}`);
      assert.ok(second.size > first.size);
    }
    assert.ok(getOpeningRange(style, "BTN").has("87o") === (style !== "tag"));
  }
});

test("each position consistently widens from tight to standard to loose", () => {
  for (const position of RANGE_POSITIONS.filter((value) => value !== "BB")) {
    const tag = getOpeningRange("tag", position);
    const balanced = getOpeningRange("balanced", position);
    const lag = getOpeningRange("lag", position);
    assert.ok(isSubset(tag, balanced), `${position}: TAG ⊆ standard`);
    assert.ok(isSubset(balanced, lag), `${position}: standard ⊆ LAG`);
    assert.ok(tag.size < balanced.size && balanced.size < lag.size);
  }
});

test("combo weighting is not the percentage of colored matrix cells", () => {
  const summary = getRangeSummary(new Set(["AA", "AKs", "AKo"]));
  assert.deepEqual(summary, {
    hands: 3,
    combos: 22,
    percent: (22 / 1326) * 100,
    pairs: 1,
    suited: 1,
    offsuit: 1,
  });
  assert.notEqual(summary.percent, (3 / 169) * 100);
  assert.deepEqual(getRangeSummary(new Set()), {
    hands: 0,
    combos: 0,
    percent: 0,
    pairs: 0,
    suited: 0,
    offsuit: 0,
  });
  assert.throws(() => getRangeSummary(new Set(["AA", "bad"])), RangeError);
});

test("BB is explicitly unsupported rather than shown as a zero-opening strategy", () => {
  for (const style of RANGE_STYLES)
    assert.equal(getOpeningRange(style, "BB"), null);
  assert.equal(getRangeSummary(null), null);
  assert.throws(() => getOpeningRange("unknown", "BTN"), RangeError);
  assert.throws(() => getOpeningRange("tag", "UTG+1"), RangeError);
  assert.throws(() => getRangeSummary([]), TypeError);
});

test("consumer edits cannot mutate the source presets", () => {
  const range = getOpeningRange("tag", "UTG");
  range.clear();
  range.add("72o");
  assert.ok(getOpeningRange("tag", "UTG").has("AA"));
  assert.ok(!getOpeningRange("tag", "UTG").has("72o"));
  assert.ok(Object.isFrozen(HANDS_169));
  assert.ok(HANDS_169.every(Object.isFrozen));
});

test("concrete combinations cover all 1,326 legal two-card deals exactly once", () => {
  const allDeals = new Set();
  const validRanks = new Set([
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ]);
  const validSuits = new Set(["spades", "hearts", "clubs", "diamonds"]);
  const cardKey = ({ rank, suit }) => `${rank}:${suit}`;
  for (const hand of HANDS_169) {
    const combinations = getHandCombinations(hand.id);
    assert.equal(combinations.length, hand.combos, hand.id);
    for (const cards of combinations) {
      assert.equal(cards.length, 2);
      const [first, second] = cards;
      assert.ok(validRanks.has(first.rank) && validRanks.has(second.rank));
      assert.ok(validSuits.has(first.suit) && validSuits.has(second.suit));
      assert.notEqual(
        cardKey(first),
        cardKey(second),
        `${hand.id}: duplicate physical card`,
      );
      assert.equal(first.rank === second.rank, hand.kind === "pair");
      assert.equal(first.suit === second.suit, hand.kind === "suited");
      const deal = cards.map(cardKey).sort().join("|");
      assert.ok(!allDeals.has(deal), `${hand.id}: duplicate combination`);
      allDeals.add(deal);
    }
  }
  assert.equal(allDeals.size, 1326);
  assert.equal(getHandCombinations("TT")[0][0].rank, "10");
  assert.throws(() => getHandCombinations("AAo"), RangeError);
  const edited = getHandCombinations("AKs");
  edited[0][0].rank = "2";
  assert.equal(getHandCombinations("AKs")[0][0].rank, "A");
});

test("entry scenarios preserve genuine open raises and explicitly model walks", () => {
  assert.deepEqual(ENTRY_SCENARIOS, ["unopened", "limped", "raised"]);
  assert.deepEqual(getPriorPositions("UTG"), []);
  assert.deepEqual(getPriorPositions("CO"), ["UTG", "HJ"]);
  assert.deepEqual(getPriorPositions("BB"), ["UTG", "HJ", "CO", "BTN", "SB"]);
  const prior = getPriorPositions("CO");
  prior.push("BB");
  assert.deepEqual(getPriorPositions("CO"), ["UTG", "HJ"]);
  for (const style of RANGE_STYLES) {
    for (const hero of RANGE_POSITIONS.slice(0, -1)) {
      const strategy = getEntryStrategy(style, hero, "unopened");
      assert.ok(strategy.available);
      assert.equal(strategy.reason, null);
      assert.equal(strategy.opponent, null);
      assert.deepEqual(sorted(strategy.raise), sorted(getOpeningRange(style, hero)));
      assert.equal(strategy.call.size, 0);
      assert.equal(strategy.check.size, 0);
    }
    const walk = getEntryStrategy(style, "BB", "unopened");
    assert.equal(walk.available, false);
    assert.equal(walk.reason, "walk");
    assert.equal(walk.opponent, null);
    for (const action of ["raise", "call", "check", "fold", "continue"])
      assert.equal(walk[action].size, 0);
  }
});

test("all 105 available contexts partition every hand into exactly one legal action", () => {
  let checked = 0;
  for (const style of RANGE_STYLES) {
    for (const hero of RANGE_POSITIONS) {
      for (const scenario of ENTRY_SCENARIOS) {
        const opponents = scenario === "unopened" ? [undefined] : getPriorPositions(hero);
        for (const opponent of opponents) {
          const strategy = getEntryStrategy(style, hero, scenario, opponent);
          if (!strategy.available) continue;
          checked += 1;
          const label = `${style}/${hero}/${scenario}/${opponent}`;
          assert.equal(strategy.reason, null, label);
          assert.equal(strategy.scenario, scenario, label);
          const union = new Set();
          for (const action of ["raise", "call", "check", "fold"]) {
            assert.ok(strategy[action] instanceof Set, `${label}: ${action}`);
            for (const hand of strategy[action]) {
              assert.ok(ids.has(hand), `${label}: ${hand} must exist`);
              assert.ok(!union.has(hand), `${label}: ${hand} has multiple actions`);
              union.add(hand);
            }
          }
          assert.deepEqual(sorted(union), sorted(ids), `${label}: covers 169`);
          assert.deepEqual(
            sorted(strategy.continue),
            sorted(new Set([...strategy.raise, ...strategy.call, ...strategy.check])),
            `${label}: exact continuation union`,
          );
          for (const premium of ["AA", "KK"])
            assert.ok(strategy.raise.has(premium), `${label}: ${premium} raises`);
          if (scenario !== "limped" || hero !== "BB")
            assert.equal(strategy.check.size, 0, `${label}: cannot check facing a price`);
          const totals = ["raise", "call", "check", "fold"]
            .reduce((total, action) => total + getRangeSummary(strategy[action]).combos, 0);
          assert.equal(totals, 1326, `${label}: combo weights partition the deck`);
        }
      }
    }
  }
  assert.equal(checked, 105);
});

test("every matchup widens its continuation from TAG to standard to LAG", () => {
  for (const hero of RANGE_POSITIONS) {
    for (const scenario of ENTRY_SCENARIOS) {
      const opponents = scenario === "unopened" ? [undefined] : getPriorPositions(hero);
      for (const opponent of opponents) {
        const [tag, balanced, lag] = RANGE_STYLES.map((style) =>
          getEntryStrategy(style, hero, scenario, opponent),
        );
        const label = `${hero}/${scenario}/${opponent}`;
        assert.ok(isSubset(tag.continue, balanced.continue), `${label}: TAG ⊆ standard`);
        assert.ok(isSubset(balanced.continue, lag.continue), `${label}: standard ⊆ LAG`);
        if (tag.available && !(scenario === "limped" && hero === "BB")) {
          assert.ok(tag.continue.size < balanced.continue.size, label);
          assert.ok(balanced.continue.size < lag.continue.size, label);
        }
      }
    }
  }
});

test("a limper allows overlimping and SB completing while BB checks for free", () => {
  const overlimp = getEntryStrategy("tag", "BTN", "limped", "CO");
  assert.ok(overlimp.call.has("22"));
  assert.ok(overlimp.call.has("76s"));
  assert.ok(overlimp.raise.has("AA"));
  assert.ok(overlimp.fold.has("72o"));
  const complete = getEntryStrategy("tag", "SB", "limped", "BTN");
  assert.ok(complete.call.has("22"));
  assert.ok(complete.call.has("A2s"));
  for (const style of RANGE_STYLES) {
    for (const opponent of getPriorPositions("BB")) {
      const bb = getEntryStrategy(style, "BB", "limped", opponent);
      assert.equal(bb.call.size, 0);
      assert.equal(bb.fold.size, 0);
      assert.ok(bb.check.has("72o"));
      assert.ok(bb.raise.has("AA"));
      assert.equal(bb.raise.size + bb.check.size, 169);
      assert.equal(getRangeSummary(bb.continue).percent, 100);
      assert.ok(getRangeSummary(bb.raise).percent < 100,
        "active entry excludes free checks and is not 100%");
    }
  }
});

test("facing one raise distinguishes calls, 3-bets and opponent position", () => {
  const button = getEntryStrategy("tag", "BTN", "raised", "CO");
  assert.ok(button.raise.has("AA"));
  assert.ok(button.call.has("77"));
  assert.ok(button.call.has("KQs"));
  assert.ok(button.fold.has("72o"));
  const early = getEntryStrategy("balanced", "BB", "raised", "UTG");
  const blind = getEntryStrategy("balanced", "BB", "raised", "SB");
  assert.ok(early.fold.has("K8o"));
  assert.ok(blind.call.has("K8o"));
  assert.ok(getRangeSummary(blind.continue).percent > getRangeSummary(early.continue).percent + 20);
  for (const style of RANGE_STYLES) {
    for (const opponent of getPriorPositions("SB"))
      assert.equal(getEntryStrategy(style, "SB", "raised", opponent).call.size, 0,
        "SB deliberately uses simplified 3-bet/fold");
    for (const hero of ["CO", "BTN", "SB", "BB"]) {
      for (const scenario of ["limped", "raised"]) {
        const opponents = getPriorPositions(hero);
        const signatures = opponents.map((opponent) => {
          const strategy = getEntryStrategy(style, hero, scenario, opponent);
          return JSON.stringify([sorted(strategy.raise), sorted(strategy.call)]);
        });
        assert.equal(new Set(signatures).size, opponents.length,
          `${style}/${hero}/${scenario}: each prior seat has a distinct authored strategy`);
      }
    }
  }
});

test("unavailable UTG scenarios and invalid opponents cannot become misleading ranges", () => {
  for (const scenario of ["limped", "raised"]) {
    const strategy = getEntryStrategy("tag", "UTG", scenario);
    assert.equal(strategy.available, false);
    assert.equal(strategy.reason, "no-prior-player");
    assert.equal(strategy.opponent, null);
    for (const action of ["raise", "call", "check", "fold", "continue"])
      assert.equal(strategy[action].size, 0);
    assert.equal(getEntryStrategy("tag", "BTN", scenario).opponent, "CO");
    for (const opponent of ["BTN", "SB", "BB", "unknown", null])
      assert.throws(() => getEntryStrategy("tag", "BTN", scenario, opponent), RangeError);
  }
  assert.throws(() => getPriorPositions("unknown"), RangeError);
  assert.throws(() => getEntryStrategy("unknown", "BTN", "limped"), RangeError);
  assert.throws(() => getEntryStrategy("tag", "unknown", "raised"), RangeError);
  assert.throws(() => getEntryStrategy("tag", "BTN", "unknown"), RangeError);
});

test("entry action sets are independently owned and preset provenance is explicit", () => {
  const original = getEntryStrategy("balanced", "BB", "raised", "BTN");
  const before = getEntryStrategy("balanced", "BB", "raised", "BTN");
  for (const action of ["raise", "call", "check", "fold", "continue"]) {
    assert.notEqual(original[action], before[action]);
    original[action].clear();
    original[action].add("72o");
  }
  const after = getEntryStrategy("balanced", "BB", "raised", "BTN");
  for (const action of ["raise", "call", "check", "fold", "continue"])
    assert.deepEqual(sorted(after[action]), sorted(before[action]));
  after.raise.delete("AA");
  assert.ok(after.continue.has("AA"), "continue is not an alias for raise");
  assert.equal(ENTRY_METADATA.solverOutput, false);
  assert.equal(ENTRY_METADATA.limperSizeBB, 1);
  assert.equal(ENTRY_METADATA.openerSizeBB, 2.5);
  assert.equal(ENTRY_METADATA.smallBlindOpenerSizeBB, 3);
  assert.ok(ENTRY_METADATA.activeEntryDefinition.includes("excludes free checks"));
  assert.ok(Object.isFrozen(ENTRY_NOTATION.raised.BB.SB.balanced));
});
