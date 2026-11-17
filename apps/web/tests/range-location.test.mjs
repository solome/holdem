import test from "node:test";
import assert from "node:assert/strict";
import { readRangeLocation, writeRangeLocation } from "../src/range-location.mjs";

const page = new URL("https://example.test/holdem/ranges.html");
const read = search => readRangeLocation(new URL(search, page));
const defaults = { position: "BTN", scenario: "raised", style: "tag", hand: "AKs", opponent: "CO" };

test("range bookmarks select an opening hand or one legal earlier opponent", () => {
  assert.deepEqual(read("?position=BTN&scenario=unopened&style=tag&hand=76s"), {
    ...defaults, scenario: "unopened", hand: "76s", opponent: null,
  });
  assert.deepEqual(read("?position=BB&scenario=limped&opponent=HJ&style=lag&hand=AA"), {
    position: "BB", scenario: "limped", opponent: "HJ", style: "lag", hand: "AA",
  });
  assert.deepEqual(read("?position=HJ"), { ...defaults, position: "HJ", opponent: "UTG" });
  assert.deepEqual(read("?position=UTG"), { ...defaults, position: "UTG", scenario: "unopened", opponent: null });
});

test("ambiguous, unsupported or impossible scenarios use the original default preset", () => {
  for (const query of ["", "?from=article", "?position=EP", "?scenario=3bet", "?style=gto",
    "?hand=KAs", "?hand=AA&hand=KK", "?position=HJ&scenario=raised&opponent=CO", "?position=UTG&scenario=limped"])
    assert.deepEqual(read(query), defaults, query);
});

test("sharing round-trips the hand and action, preserves unrelated web parameters and works from disk", () => {
  const before = new URL("?from=article&opponent=HJ#matrix-heading", page);
  const opening = read("?position=HJ&scenario=unopened&style=balanced&hand=76s");
  const shared = writeRangeLocation(before, opening);
  assert.deepEqual(readRangeLocation(shared), opening);
  assert.equal(shared.searchParams.get("from"), "article");
  assert.equal(shared.searchParams.has("opponent"), false);
  assert.equal(shared.hash, "#matrix-heading");
  assert.deepEqual(readRangeLocation(writeRangeLocation(shared, defaults)), defaults);

  const disk = new URL("file:///tmp/holdem/ranges.html?position=HJ");
  assert.equal(readRangeLocation(disk).position, "HJ");
  const offlineLink = writeRangeLocation(disk, opening);
  assert.equal(offlineLink.search, disk.search);
  assert.deepEqual(readRangeLocation(offlineLink), opening);
});
