import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderCashHands, renderHandText } from "../src/cash/inline-hands.mjs";

test("the opening KQo comparison shows the same hero hand and both possible opponents", async () => {
  const lesson = await readFile(new URL("../src/cash/preflop-tag.html", import.meta.url), "utf8");
  const firstParagraph = lesson.match(/<p>([\s\S]*?)<\/p>/)[1];
  const groups = [...firstParagraph.matchAll(/<cash-hand\b[^>]*>[^<]+<\/cash-hand>/g)].map(([marker]) => {
    const cards = [];
    renderCashHands(marker, card => { cards.push(card.rank + ":" + card.suit); return ""; });
    return cards;
  });
  const [hero, repeated, ak, aq] = groups;
  assert.equal(groups.length, 4);
  assert.deepEqual(repeated, hero);
  assert.notEqual(hero[0].split(":")[1], hero[1].split(":")[1]);
  for (const [opponent, ranks] of [[ak, ["A", "K"]], [aq, ["A", "Q"]]]) {
    assert.deepEqual(opponent.map(c => c.split(":")[0]), ranks);
    assert.equal(new Set([...hero, ...opponent]).size, 4);
  }
});

test("explanatory text distinguishes unspecified hands from prices and cards that are already known", () => {
  const cards = [];
  renderHandText('AK 或 AQ，补 44，剩 99 BB。<cash-hand cards="9d 9c">99</cash-hand>',
    card => { cards.push(card); return ""; });
  assert.deepEqual(cards.map(c => c.rank), ["A", "K", "A", "Q", "9", "9"]);
  assert.ok(cards.slice(0, 4).every(c => c.suit === undefined));
  assert.deepEqual(cards.slice(-2).map(c => c.suit), ["diamonds", "clubs"]);
  assert.throws(() => renderCashHands('<cash-hand example="Ks Qs">KQo</cash-hand>', () => ""));
});
