import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCardTokens } from "../src/card-notation.mjs";
import { calculateOdds, evaluateBest } from "../src/poker-odds.mjs";
import { examples } from "../src/cash/examples.mjs";
import { readFile } from "node:fs/promises";
import { chapters, prepareCashChapter } from "../src/cash/pages.mjs";
import { tagExamples } from "../src/cash/tag-examples.mjs";

// Check the educational result against the evaluator, independently of the prose and renderer.
test("all known showdowns match the seats and winning hands described in the lessons", () => {
  const results = {
    "price-the-draw": ["straight", "one-pair", true],
    "top-pair": ["one-pair", "three-kind", false],
    "one-street-value": ["one-pair", "one-pair", true],
    "thin-value": ["two-pair", "two-pair", true],
    "reassess-range": ["two-pair", "full-house", false],
    "table-image": ["one-pair", "one-pair", true],
    "tag-original-08": ["three-kind", "three-kind", false],
    "tag-original-15": ["two-pair", "straight", false],
    "tag-original-19": ["one-pair", "one-pair", true],
    "tag-nines-squeezed": ["two-pair", "one-pair", true],
  };
  assert.deepEqual(Object.keys(examples).filter(id => examples[id].showdown).sort(), Object.keys(results).sort());
  for (const [id, ex] of Object.entries(examples)) {
    if (!ex.showdown) { assert.ok(!(id in results), id); continue; }
    const board = parseCardTokens(ex.board);
    const hero = evaluateBest([...parseCardTokens(ex.hand), ...board]);
    const villain = evaluateBest([...parseCardTokens(ex.showdown.hand), ...board]);
    assert.deepEqual([hero.category, villain.category, hero.score > villain.score], results[id], id);
    assert.ok(!ex.stages.at(-1).folded?.includes(ex.showdown.seat), id + ": folded player cannot reach showdown");
  }
});

test("the 97s turn example has overlapping straight/flush outs and split pots against the revealed hand", () => {
  const ex = examples["price-the-draw"];
  const outcome = calculateOdds({ hero: parseCardTokens(ex.hand), villain: parseCardTokens(ex.showdown.hand),
    board: parseCardTokens(ex.board).slice(0, 4) });
  assert.equal(outcome.totalOutcomes, 44);
  assert.equal(outcome.showdown.wins, 11);
  assert.equal(outcome.showdown.ties, 3);
});

test("the third chapter retains one exercise per original problem, with the recorded hole cards", () => {
  const hands = [
    "3h 3s", "6h 4h", "9h 9s", "Td 9d", "9s 8s", "Td Tc", "Qh Qs", "4c 4d",
    "5c 5d", "As Ks", "Ah Ks", "Ad Jh", "Ah 7h", "Qc Jh", "Kh Js", "Qc Tc",
    "Kd Qs", "5d 4d", "Ad 9h", "Ad 4c", "Ah Td", "Ah Kc", "9d 9c", "6c 6h",
  ];
  const cases = Object.values(tagExamples).sort((a, b) => a.originalNumber - b.originalNumber);
  assert.equal(cases.length, hands.length);
  cases.forEach((example, index) => {
    assert.equal(example.originalNumber, index + 1);
    assert.equal(example.hand, hands[index], "source problem " + (index + 1));
  });
});

test("new framework examples keep the six previously assigned lesson numbers", async () => {
  const chapter = chapters.find(c => c.slug === "basics");
  const content = await readFile(new URL("../src/cash/basics.html", import.meta.url), "utf8");
  const { cases } = prepareCashChapter(chapter, 1, content);
  const ids = ["draw-price", "side-pot-outs", "straight-outs", "implied-price", "semi-bluff", "price-the-draw",
    "framework-river-value", "framework-deep-overpair", "framework-equity-denial"];
  assert.deepEqual(Object.keys(cases), ids);
  ids.forEach((id, i) => assert.equal(cases[id].number, "1-" + (i + 1)));
});

test("the fixed-hand equity-denial lesson has six losing rivers and a profitable immediate fold", () => {
  const example = examples["framework-equity-denial"];
  const outcome = calculateOdds({
    hero: parseCardTokens(example.hand),
    board: parseCardTokens(example.board),
    villain: parseCardTokens("Ah Qc"),
  });
  assert.equal(outcome.totalOutcomes, 44);
  assert.equal(outcome.showdown.wins, 38);
  assert.equal(outcome.showdown.losses, 6);
  assert.equal(outcome.showdown.ties, 0);
  assert.equal((outcome.showdown.equity * 100).toFixed(2), "86.36");
  assert.ok(6 / 44 < 20 / (100 + 20 + 20));
});
