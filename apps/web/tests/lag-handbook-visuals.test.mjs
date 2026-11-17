import test from "node:test";
import assert from "node:assert/strict";
import { HANDBOOK_SECTIONS } from "../src/lag-handbook-content.mjs";
import { evaluateBest } from "../src/poker-odds.mjs";
import { CASE_86_COMPLETIONS, createHandbookVisuals, handbookHandTokens, parseHandbookCards, renderHandbookCards } from "../src/lag-handbook-visuals.mjs";

test("handbook card declarations preserve exact ranks and suits and reject impossible duplicates", () => {
  assert.deepEqual(parseHandbookCards("Kc 7d 2s"), [
    { rank: "K", suit: "clubs" }, { rank: "7", suit: "diamonds" }, { rank: "2", suit: "spades" },
  ]);
  assert.equal(parseHandbookCards("Th")[0].rank, "10");
  for (const tokens of ["", "1s", "Ahh", "As As", "10c Tc"]) assert.throws(() => parseHandbookCards(tokens));
  for (const section of HANDBOOK_SECTIONS) {
    for (const [, tokens] of section.body.matchAll(/data-handbook-cards="([^"]+)"/g)) parseHandbookCards(tokens);
    for (const [, hand] of section.body.matchAll(/data-handbook-hand="([^"]+)"/g)) {
      const cards = parseHandbookCards(handbookHandTokens(hand));
      assert.equal(cards[0].suit === cards[1].suit, hand.endsWith("s"));
    }
  }
});

test("all declared scenario diagrams render and use the shared card renderer without changing card order", () => {
  const calls = [];
  const renderCard = (card, options) => {
    calls.push({ ...card, ...options });
    return `<span class="playing-card">${card.rank}:${card.suit}</span>`;
  };
  const figures = createHandbookVisuals(renderCard);
  for (const section of HANDBOOK_SECTIONS) {
    for (const [, id] of section.body.matchAll(/data-handbook-visual="([^"]+)"/g)) {
      assert.equal(typeof figures[id], "function", id);
      assert.match(figures[id](), /<figure[\s>]/);
    }
  }
  calls.length = 0;
  assert.match(renderHandbookCards("Js 8s", renderCard), /playing-card/);
  assert.deepEqual(calls.map(({ rank }) => rank), ["J", "8"]);
  assert.ok(calls.every(({ fan, count }) => fan === false && count === 2));
});

test("86s visual counts fifteen distinct available completions and each actually makes a straight or flush", () => {
  const known = parseHandbookCards("8s 6s Kc 7d 2s 5s");
  const completions = parseHandbookCards(`${CASE_86_COMPLETIONS.straight} ${CASE_86_COMPLETIONS.otherFlush}`);
  assert.equal(completions.length, 15);
  const key = ({ rank, suit }) => `${rank}:${suit}`;
  const knownKeys = new Set(known.map(key));
  for (const completion of completions) {
    assert.equal(knownKeys.has(key(completion)), false);
    assert.ok(["straight", "flush", "straight-flush", "royal-flush"].includes(evaluateBest([...known, completion]).category));
  }
});
