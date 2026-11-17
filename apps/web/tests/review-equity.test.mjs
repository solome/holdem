import test from "node:test";
import assert from "node:assert/strict";
import { ODDS_DECK, evaluateBest, calculateOdds } from "../src/poker-odds.mjs";
import { evaluateReviewHand, calculateReviewEquity, buildSidePots, REVIEW_EQUITY_DEALS } from "../src/review-equity.mjs";
import { REVIEW_EQUITY } from "../src/review-equity-data.mjs";

const SUIT = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const hand = (text) => text.split(" ").map((value) => ({ rank: value.slice(0, -1), suit: SUIT[value.at(-1)] }));
const sum = (values) => values.reduce((total, value) => total + value, 0);

test("fast review evaluator matches independent five-card-subset evaluation on edge cases", () => {
  for (const cards of [
    "As Kh Qd Jc 9s", "As Ah Qd 7c 3s", "As Ah Qd Qc 3s", "As Ah Ad 7c 3s",
    "9s 8h 7d 6c 5s", "As Js 9s 7s 3s", "As Ah Ad 7c 7s", "As Ah Ad Ac 3s",
    "9s 8s 7s 6s 5s", "As Ks Qs Js 10s", "As 2h 3d 4c 5s Qd Kh", "Qs Kh Ad 2c 3s",
    "Ks Kh Kd As Ah Ad 2c", "As Ah Ks Kh Qs Qh 2c", "As Ks 9s 7s 4s 2s Qh",
    "10d Qd 10c Jd 8c Ad Kd", "As 2s 3s 4s 5s 6s 7s", "As Ah Ad Ac Ks Kh Kd",
    "As Ah Ad Ks Kh Kd Kc", "2s 3s 4s 5s 6s 8d 9c",
  ]) {
    const expected = evaluateBest(hand(cards));
    assert.deepEqual(evaluateReviewHand(hand(cards)), { score: expected.score, category: expected.category }, cards);
  }
});

test("fast evaluator cross-checks 2400 reproducible random five-, six-, and seven-card hands", () => {
  let seed = 147291;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let sample = 0; sample < 2400; sample += 1) {
    const pool = [...ODDS_DECK];
    const cards = [];
    for (let index = 0; index < 5 + sample % 3; index += 1) cards.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    assert.equal(evaluateReviewHand(cards).score, evaluateBest(cards).score, JSON.stringify(cards));
  }
});

test("stored exact results have correct combination counts and conserve every pot's equity", () => {
  const expectedCounts = { fourWay: [1086008, 820, 40, 1], headsUp: [1712304, 990, 44, 1] };
  for (const [caseId, streets] of Object.entries(REVIEW_EQUITY)) {
    assert.deepEqual(Object.values(streets).map(({ totalOutcomes }) => totalOutcomes), expectedCounts[caseId]);
    for (const stage of Object.values(streets)) {
      assert.equal(stage.exact, true);
      for (const players of [stage.players, ...stage.pots.map((pot) => pot.players)]) {
        assert.ok(Math.abs(sum(players.map((player) => player.equity)) - 1) < 1e-12);
        for (const player of players) {
          assert.equal(player.win, player.wins / stage.totalOutcomes);
          assert.equal(player.tie, player.ties / stage.totalOutcomes);
          assert.ok(player.win >= 0 && player.tie >= 0 && player.win + player.tie <= 1);
          assert.ok(player.equity >= player.win && player.equity <= player.win + player.tie);
        }
      }
    }
  }
});

test("all recorded probabilities, including exhaustive preflop enumeration, reproduce exactly", () => {
  for (const [caseId, deal] of Object.entries(REVIEW_EQUITY_DEALS)) {
    for (const [street, count] of [["preflop", 0], ["flop", 3], ["turn", 4], ["river", 5]]) {
      assert.deepEqual(calculateReviewEquity({ ...deal, board: deal.board.slice(0, count) }), REVIEW_EQUITY[caseId][street]);
    }
  }
});

test("heads-up equity agrees with the independent existing calculator and swaps symmetrically", () => {
  const { players, board } = REVIEW_EQUITY_DEALS.headsUp;
  const input = { players, board: board.slice(0, 3) };
  const computed = calculateReviewEquity(input);
  const old = calculateOdds({ hero: players[0].hand, villain: players[1].hand, board: input.board });
  assert.equal(computed.players[0].equity, old.showdown.equity);
  assert.equal(computed.players[0].wins, old.showdown.wins);
  assert.equal(computed.players[0].ties, old.showdown.ties);
  const reversed = calculateReviewEquity({ ...input, players: [...players].reverse() });
  assert.deepEqual(reversed.players, [...computed.players].reverse());
});

test("a shared board splits equity equally across four players and independently for each pot", () => {
  const result = calculateReviewEquity({
    players: [
      { id: "A", hand: hand("2s 3s") }, { id: "B", hand: hand("4s 5s") },
      { id: "C", hand: hand("6c 7c") }, { id: "D", hand: hand("8d 9d") },
    ],
    board: hand("10h Jh Qh Kh Ah"),
    pots: [{ id: "main", eligible: ["A", "B", "C", "D"] }, { id: "side", eligible: ["A", "C", "D"] }],
  });
  assert.ok(result.players.every(({ win, tie, equity }) => win === 0 && tie === 1 && equity === 0.25));
  assert.ok(result.pots[1].players.every(({ win, tie, equity }) => win === 0 && tie === 1 && equity === 1 / 3));
});

test("side pots keep other known hands blocked, and future actual board cards remain in the deck", () => {
  const deal = REVIEW_EQUITY_DEALS.fourWay;
  const result = calculateReviewEquity({ ...deal, board: deal.board.slice(0, 4) });
  assert.equal(result.remainingCards, 40); // 52 - 8 known hole cards - 4 current board cards.
  assert.equal(result.totalOutcomes, 40); // Includes the actual future river 6h.
  const side = result.pots.find(({ id }) => id === "side2");
  const expected = { C: { wins: 0, ties: 0 }, D: { wins: 0, ties: 0 } };
  const used = [...deal.players.flatMap(({ hand: cards }) => cards), ...deal.board.slice(0, 4)];
  for (const card of ODDS_DECK.filter((candidate) => !used.some((known) => candidate.rank === known.rank && candidate.suit === known.suit))) {
    const c = evaluateBest([...deal.players[2].hand, ...deal.board.slice(0, 4), card]).score;
    const d = evaluateBest([...deal.players[3].hand, ...deal.board.slice(0, 4), card]).score;
    if (c === d) { expected.C.ties += 1; expected.D.ties += 1; }
    else expected[c > d ? "C" : "D"].wins += 1;
  }
  for (const player of side.players) {
    assert.equal(player.wins, expected[player.id].wins);
    assert.equal(player.ties, expected[player.id].ties);
  }
});

test("both recorded winners have the correct final hands; the second river is the seven of clubs", () => {
  const first = REVIEW_EQUITY_DEALS.fourWay;
  assert.equal(evaluateReviewHand([...first.players[3].hand, ...first.board]).category, "full-house");
  assert.equal(REVIEW_EQUITY.fourWay.river.players.find(({ id }) => id === "D").win, 1);
  assert.ok(REVIEW_EQUITY.fourWay.river.pots.every((pot) => pot.players.find(({ id }) => id === "D").equity === 1));
  const second = REVIEW_EQUITY_DEALS.headsUp;
  assert.deepEqual(second.board.at(-1), hand("7c")[0]);
  assert.equal(evaluateReviewHand([...second.players[0].hand, ...second.board]).category, "one-pair");
  assert.equal(evaluateReviewHand([...second.players[1].hand, ...second.board]).category, "straight");
  assert.equal(REVIEW_EQUITY.headsUp.river.players.find(({ id }) => id === "B").win, 1);
});

test("the second turn straight is vulnerable to exactly three nines giving QQ a queen-high straight", () => {
  const deal = REVIEW_EQUITY_DEALS.headsUp;
  const result = calculateReviewEquity({ ...deal, board: deal.board.slice(0, 4) });
  assert.equal(result.players[0].wins, 3);
  assert.equal(result.players[1].wins, 41);
  assert.equal(result.players[1].equity, 41 / 44);
  for (const river of hand("9h 9c 9d")) {
    const board = [...deal.board.slice(0, 4), river];
    const a = evaluateBest([...deal.players[0].hand, ...board]);
    const b = evaluateBest([...deal.players[1].hand, ...board]);
    assert.equal(a.category, "straight");
    assert.equal(b.category, "straight");
    assert.ok(a.score > b.score);
  }
});

test("contributions yield the three recorded pots and conserve chips", () => {
  const result = buildSidePots([{ id: "A", contribution: 28 }, { id: "B", contribution: 20 }, { id: "C", contribution: 31 }, { id: "D", contribution: 31 }]);
  assert.deepEqual(result.map(({ kind, amount, eligible }) => ({ kind, amount, eligible })), [
    { kind: "pot", amount: 80, eligible: ["A", "B", "C", "D"] },
    { kind: "pot", amount: 24, eligible: ["A", "C", "D"] },
    { kind: "pot", amount: 6, eligible: ["C", "D"] },
  ]);
  assert.equal(sum(result.map(({ amount }) => amount)), 110);
});

test("260 vs 120 stacks create a 240 pot and 140 unmatched refund, never a one-player side pot", () => {
  const result = buildSidePots([{ id: "A", contribution: 260 }, { id: "B", contribution: 120 }]);
  assert.deepEqual(result, [
    { kind: "pot", amount: 240, eligible: ["A", "B"], contributors: ["A", "B"] },
    { kind: "refund", amount: 140, refundTo: "A", eligible: [], contributors: ["A"] },
  ]);
});

test("folded chips enter pots without restoring eligibility", () => {
  const result = buildSidePots([{ id: "A", contribution: 100 }, { id: "B", contribution: 50, folded: true }, { id: "C", contribution: 100 }]);
  assert.deepEqual(result.map(({ amount, eligible }) => ({ amount, eligible })), [{ amount: 150, eligible: ["A", "C"] }, { amount: 100, eligible: ["A", "C"] }]);
});

test("review evaluation and deals reject duplicates, malformed cards, and invalid eligibility", () => {
  assert.throws(() => evaluateReviewHand(hand("As As Qs Js 10s")), /more than once/);
  assert.throws(() => evaluateReviewHand(new Array(5)));
  const deal = REVIEW_EQUITY_DEALS.headsUp;
  const base = { ...deal, board: deal.board.slice(0, 3) };
  assert.throws(() => calculateReviewEquity({ ...base, board: [...base.board.slice(0, 2), deal.players[0].hand[0]] }), /more than once/);
  assert.throws(() => calculateReviewEquity({ ...base, players: [{ id: "A", hand: hand("As Ks") }, { id: "B", hand: hand("As Qs") }] }), /more than once/);
  assert.throws(() => calculateReviewEquity({ ...base, board: hand("As Ks") }));
  assert.throws(() => calculateReviewEquity({ ...base, pots: [{ id: "side", eligible: ["C"] }] }));
  assert.throws(() => calculateReviewEquity({ ...base, pots: [{ id: "side", eligible: ["A", "A"] }] }));
  assert.throws(() => calculateReviewEquity({ ...base, players: [{ id: "A", hand: hand("As Ks") }, { id: "A", hand: hand("Ah Kh") }] }));
  assert.throws(() => buildSidePots([{ id: "A", contribution: -1 }]));
  assert.throws(() => buildSidePots([{ id: "A", contribution: Infinity }]));
});
