import test from "node:test";
import assert from "node:assert/strict";
import { HANDS_169 } from "../src/ranges.mjs";
import { resolveRangeHand } from "../src/range-ui.js";

test("hand lookup accepts all matrix labels and resolves common notation variants", () => {
  for (const { id } of HANDS_169) assert.equal(resolveRangeHand(id), id);
  assert.equal(resolveRangeHand(" 9 10 O "), "T9o");
  assert.equal(resolveRangeHand("kaS"), "AKs");
  assert.equal(resolveRangeHand("1010"), "TT");
});

test("hand lookup does not guess between suited and offsuit", () => {
  for (const value of ["AK", "AAo", "A1s", "AKos", "77+", ""]) {
    assert.equal(resolveRangeHand(value), null);
  }
});
