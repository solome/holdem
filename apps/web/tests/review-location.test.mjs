import test from "node:test";
import assert from "node:assert/strict";
import { readReviewLocation, writeReviewLocation } from "../src/review-location.mjs";

const page = new URL("https://player.github.io/holdem/review.html");
const caseIds = ["fourWay", "headsUp", "queenOnTheRiver"];

test("each case ID round-trips through a bookmark on the project site and from disk", () => {
  for (const base of [page.href, "file:///tmp/holdem/review.html"]) {
    for (const [index, caseId] of caseIds.entries()) {
      const shared = writeReviewLocation(base, caseId);
      assert.equal(shared.href, `${base}#case=${caseId}`);
      assert.equal(readReviewLocation(shared), index);
    }
  }
});

test("missing, unknown, and ambiguous case links open the first case", () => {
  for (const suffix of ["", "#review-heading", "#case=", "#case=3", "#case=unknown", "?case=headsUp",
    "#case=headsUp&case=queenOnTheRiver", "#case=queenOnTheRiver&case=queenOnTheRiver"]) {
    assert.equal(readReviewLocation(new URL(suffix, page)), 0, suffix);
  }
});

test("switching cases replaces the fragment and preserves the rest of the URL", () => {
  const original = new URL("?from=article&lang=zh-CN#case=headsUp", page);
  const shared = writeReviewLocation(original, "queenOnTheRiver");

  assert.equal(shared.href, `${page.href}?from=article&lang=zh-CN#case=queenOnTheRiver`);
  assert.equal(original.href, `${page.href}?from=article&lang=zh-CN#case=headsUp`);
});
