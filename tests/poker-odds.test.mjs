import test from "node:test";
import assert from "node:assert/strict";
import {
  ODDS_CATEGORIES,
  ODDS_DECK,
  evaluateBest,
  calculateOdds,
} from "../src/poker-odds.mjs";

const SUIT = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const hand = (text) =>
  text.split(" ").map((value) => ({
    rank: value.slice(0, -1),
    suit: SUIT[value.at(-1)],
  }));
const evaluate = (text) => evaluateBest(hand(text));
const sum = (counts) =>
  Object.values(counts).reduce((total, count) => total + count, 0);

test("the deck has 52 unique immutable cards and ten ordered categories", () => {
  assert.equal(ODDS_DECK.length, 52);
  assert.equal(
    new Set(ODDS_DECK.map(({ rank, suit }) => `${rank}:${suit}`)).size,
    52,
  );
  assert.equal(ODDS_CATEGORIES.length, 10);
  assert.ok(Object.isFrozen(ODDS_DECK));
  assert.ok(ODDS_DECK.every(Object.isFrozen));
});

const categoryHands = [
  ["high-card", "As Jh 9d 7c 3s"],
  ["one-pair", "As Ah Qd 7c 3s"],
  ["two-pair", "As Ah Qd Qc 3s"],
  ["three-kind", "As Ah Ad 7c 3s"],
  ["straight", "9s 8h 7d 6c 5s"],
  ["flush", "As Js 9s 7s 3s"],
  ["full-house", "As Ah Ad 7c 7s"],
  ["four-kind", "As Ah Ad Ac 3s"],
  ["straight-flush", "9s 8s 7s 6s 5s"],
  ["royal-flush", "As Ks Qs Js 10s"],
];

for (const [category, cards] of categoryHands) {
  test(`five-card evaluation identifies ${category}`, () => {
    const result = evaluate(cards);
    assert.equal(result.category, category);
    assert.equal(result.bestCards.length, 5);
    assert.equal(evaluateBest(result.bestCards).score, result.score);
  });
}

test("each category ranks above every preceding fixture", () => {
  const scores = categoryHands.map(([, cards]) => evaluate(cards).score);
  for (let index = 1; index < scores.length; index += 1)
    assert.ok(scores[index] > scores[index - 1]);
});

test("aces make a five-high wheel but never wrap a straight", () => {
  assert.equal(evaluate("As 2h 3d 4c 5s Qd Kh").category, "straight");
  assert.ok(
    evaluate("2s 3h 4d 5c 6s").score > evaluate("As 2h 3d 4c 5s").score,
  );
  assert.equal(evaluate("As 2s 3s 4s 5s").category, "straight-flush");
  assert.equal(evaluate("Qs Kh Ad 2c 3s").category, "high-card");
});

test("kickers and every significant rank decide equal-category hands", () => {
  const comparisons = [
    ["As Kh Qd Jc 9s", "Ah Kd Qc Js 8h"],
    ["As Ah Kd Qc 9s", "Ad Ac Ks Qh 8h"],
    ["As Ah Kd Kc Qs", "Ad Ac Ks Kh Jh"],
    ["As Ah Qd Qc 9s", "Ad Ac Js Jh Kh"],
    ["As Ah Ad Kc Qs", "Ac As Ah Kd Js"],
    ["As Ks Qs Js 8s", "Ah Kh Qh Jh 7h"],
    ["As Ah Ad Kc Ks", "Ac As Ah Qd Qh"],
    ["As Ah Ad Ac Ks", "As Ah Ad Ac Qs"],
  ];
  for (const [stronger, weaker] of comparisons)
    assert.ok(evaluate(stronger).score > evaluate(weaker).score);
  assert.equal(
    evaluate("As Kh Qd Jc 9s").score,
    evaluate("Ah Kd Qc Js 9h").score,
  );
});

test("two triples choose the higher full-house triple", () => {
  const result = evaluate("Ks Kh Kd As Ah Ad 2c");
  assert.equal(result.category, "full-house");
  assert.equal(result.score, evaluate("As Ah Ad Ks Kh").score);
});

test("three pairs use the highest two pairs and best remaining kicker", () => {
  const result = evaluate("As Ah Ks Kh Qs Qh 2c");
  assert.equal(result.category, "two-pair");
  assert.equal(result.score, evaluate("As Ah Ks Kh Qs").score);
});

test("six suited cards choose the strongest five and preserve original card objects", () => {
  const cards = hand("As Ks 9s 7s 4s 2s Qh");
  const result = evaluateBest(cards);
  assert.equal(result.category, "flush");
  assert.deepEqual(
    result.bestCards.map(({ rank }) => rank),
    ["A", "K", "9", "7", "4"],
  );
  assert.ok(result.bestCards.every((card) => cards.includes(card)));
});

test("a royal flush is a distinct final category", () => {
  const result = evaluate("10d Qd 10c Jd 8c Ad Kd");
  assert.equal(result.category, "royal-flush");
  assert.deepEqual(
    new Set(result.bestCards.map(({ rank }) => rank)),
    new Set(["10", "J", "Q", "K", "A"]),
  );
});

test("a pure board hand ties even with unequal hole-card ranks", () => {
  const result = calculateOdds({
    hero: hand("As Ad"),
    villain: hand("2c 3c"),
    board: hand("10h Jh Qh Kh Ah"),
  });
  assert.equal(result.totalOutcomes, 1);
  assert.equal(result.hero.counts["royal-flush"], 1);
  assert.equal(result.villain.counts["royal-flush"], 1);
  assert.deepEqual(result.showdown, {
    wins: 0,
    ties: 1,
    losses: 0,
    equity: 0.5,
  });
});

test("the best hand may use exactly one hole card", () => {
  const result = calculateOdds({
    hero: hand("As 2d"),
    board: hand("Ks Qs Js 10s 8h"),
  });
  assert.equal(result.hero.current.category, "royal-flush");
  assert.equal(
    result.hero.current.bestCards.some(({ rank }) => rank === "2"),
    false,
  );
});

test("solo flop, turn, and river enumerate 1081, 46, and 1 equally weighted outcomes", () => {
  const hero = hand("As Ks");
  const board = hand("Qs Js 2d 3c 4h");
  for (const [length, total] of [
    [3, 1081],
    [4, 46],
    [5, 1],
  ]) {
    const result = calculateOdds({ hero, board: board.slice(0, length) });
    assert.equal(result.totalOutcomes, total);
    assert.equal(sum(result.hero.counts), total);
    assert.equal(
      result.hero.current.score,
      evaluateBest([...hero, ...board.slice(0, length)]).score,
    );
    assert.equal(result.villain, null);
    assert.equal(result.showdown, null);
    assert.deepEqual(Object.keys(result.hero.counts), ODDS_CATEGORIES);
  }
});

test("heads-up flop, turn, and river enumerate 990, 44, and 1 outcomes with conserved totals", () => {
  const hero = hand("As Ks");
  const villain = hand("Ah Ad");
  const board = hand("Qs Js 2d 3c 4h");
  for (const [length, total] of [
    [3, 990],
    [4, 44],
    [5, 1],
  ]) {
    const result = calculateOdds({
      hero,
      villain,
      board: board.slice(0, length),
    });
    assert.equal(result.totalOutcomes, total);
    assert.equal(sum(result.hero.counts), total);
    assert.equal(sum(result.villain.counts), total);
    assert.equal(
      result.showdown.wins + result.showdown.ties + result.showdown.losses,
      total,
    );
    assert.equal(
      result.showdown.equity,
      (result.showdown.wins + result.showdown.ties / 2) / total,
    );
  }
});

test("a four-card royal draw has one royal out on the turn and 46 runouts on the flop", () => {
  const hero = hand("As Ks");
  const turn = calculateOdds({ hero, board: hand("Qs Js 2d 3c") });
  assert.equal(turn.hero.counts["royal-flush"], 1);
  assert.equal(turn.hero.counts.flush, 8);
  assert.equal(turn.hero.counts.straight, 3);
  assert.equal(turn.hero.counts["straight-flush"], 0);
  const flop = calculateOdds({ hero, board: hand("Qs Js 2d") });
  assert.equal(flop.hero.counts["royal-flush"], 46);
});

test("known opponent cards remove blocked flush outs from numerator and denominator", () => {
  const deal = { hero: hand("As Ks"), board: hand("2s 7s 9d Jc") };
  const solo = calculateOdds(deal);
  const headsUp = calculateOdds({ ...deal, villain: hand("Qs Js") });
  assert.equal(solo.hero.counts.flush, 9);
  assert.equal(solo.totalOutcomes, 46);
  assert.equal(headsUp.hero.counts.flush, 7);
  assert.equal(headsUp.totalOutcomes, 44);
});

test("an open-ended straight draw has eight outs and opponent blockers remove two", () => {
  const deal = { hero: hand("9s 8h"), board: hand("6d 7c Ks Ac") };
  assert.equal(calculateOdds(deal).hero.counts.straight, 8);
  assert.equal(
    calculateOdds({ ...deal, villain: hand("5s 10s") }).hero.counts.straight,
    6,
  );
});

test("overpair against underpair on a dry turn has exactly two losing outs", () => {
  const result = calculateOdds({
    hero: hand("As Ah"),
    villain: hand("Ks Kh"),
    board: hand("2c 7d 9s Jh"),
  });
  assert.deepEqual(result.showdown, {
    wins: 42,
    ties: 0,
    losses: 2,
    equity: 42 / 44,
  });
});

test("swapping players swaps wins and losses, distributions, and complements equity", () => {
  const hero = hand("As Kh");
  const villain = hand("Ac Qd");
  const board = hand("Ks Qh Jd 2c");
  const forward = calculateOdds({ hero, villain, board });
  const reverse = calculateOdds({ hero: villain, villain: hero, board });
  assert.ok(forward.showdown.wins > 0);
  assert.ok(forward.showdown.losses > 0);
  assert.ok(forward.showdown.ties > 0);
  assert.equal(forward.showdown.wins, reverse.showdown.losses);
  assert.equal(forward.showdown.losses, reverse.showdown.wins);
  assert.equal(forward.showdown.ties, reverse.showdown.ties);
  assert.deepEqual(forward.hero, reverse.villain);
  assert.deepEqual(forward.villain, reverse.hero);
  assert.equal(forward.showdown.equity + reverse.showdown.equity, 1);
});

test("hand and deal evaluation are invariant to card order and never mutate inputs", () => {
  const input = {
    hero: hand("As Kh"),
    villain: hand("Ac Qd"),
    board: hand("Ks Qh Jd 2c"),
  };
  const before = structuredClone(input);
  const result = calculateOdds(input);
  const reversed = calculateOdds({
    hero: input.hero.toReversed(),
    villain: input.villain.toReversed(),
    board: input.board.toReversed(),
  });
  assert.deepEqual(input, before);
  assert.equal(result.hero.current.score, reversed.hero.current.score);
  assert.deepEqual(result.hero.counts, reversed.hero.counts);
  assert.deepEqual(result.villain.counts, reversed.villain.counts);
  assert.deepEqual(result.showdown, reversed.showdown);
});

test("hand evaluation rejects malformed cards, bad counts, sparse arrays, and duplicates", () => {
  for (const invalid of [
    null,
    undefined,
    {},
    "As Ks Qs Js 10s",
    [],
    hand("As Ks Qs Js"),
    hand("As Ks Qs Js 10s 9s 8s 7s"),
    new Array(5),
  ]) {
    assert.throws(() => evaluateBest(invalid));
  }
  for (const invalidCard of [
    null,
    undefined,
    {},
    [],
    { rank: 2, suit: "spades" },
    { rank: "T", suit: "spades" },
    { rank: "1", suit: "spades" },
    { rank: "A", suit: "stars" },
  ]) {
    assert.throws(() => evaluateBest([...hand("As Ks Qs Js"), invalidCard]));
  }
  assert.throws(() => evaluate("As As Qs Js 10s"), /more than once/);
});

test("odds validation rejects malformed deal objects, unsupported streets, and partial opponent hands", () => {
  const deal = { hero: hand("As Ks"), board: hand("Qs Js 2d") };
  for (const invalid of [null, undefined, {}, [], "deal"])
    assert.throws(() => calculateOdds(invalid));
  for (const hero of [
    null,
    {},
    "As Ks",
    [],
    hand("As"),
    hand("As Ks 2c"),
    new Array(2),
  ]) {
    assert.throws(() => calculateOdds({ ...deal, hero }));
  }
  for (const board of [
    null,
    {},
    "Qs Js 2d",
    [],
    hand("Qs Js"),
    hand("Qs Js 2d 3d 4d 5d"),
    new Array(3),
  ]) {
    assert.throws(() => calculateOdds({ ...deal, board }));
  }
  for (const villain of [
    false,
    {},
    "Ah Kh",
    [],
    hand("Ah"),
    hand("Ah Kh 2c"),
    new Array(2),
  ]) {
    assert.throws(() => calculateOdds({ ...deal, villain }));
  }
});

test("duplicate cards are rejected within and across all three parts of a deal", () => {
  const deal = {
    hero: hand("As Ks"),
    villain: hand("Ah Kh"),
    board: hand("Qs Js 2d"),
  };
  for (const input of [
    { ...deal, hero: hand("As As") },
    { ...deal, villain: hand("Ah Ah") },
    { ...deal, board: hand("Qs Js Qs") },
    { ...deal, villain: hand("As Kh") },
    { ...deal, board: hand("Qs Js As") },
    { ...deal, board: hand("Qs Js Ah") },
  ])
    assert.throws(() => calculateOdds(input), /more than once/);
});
