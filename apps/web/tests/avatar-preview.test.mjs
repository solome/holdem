import test from "node:test";
import assert from "node:assert/strict";
import { avatarPreviewPosition } from "../src/avatar-preview.js";

test("avatar preview opens above a centered trigger with enough space", () => {
  assert.deepEqual(avatarPreviewPosition({
    anchor: { left: 486, top: 400, bottom: 428, width: 28 },
    width: 244, height: 282, viewportWidth: 1000, viewportHeight: 800,
  }), { left: 378, top: 108 });
});

test("avatar preview flips below a trigger near the top", () => {
  assert.deepEqual(avatarPreviewPosition({
    anchor: { left: 486, top: 20, bottom: 48, width: 28 },
    width: 244, height: 282, viewportWidth: 1000, viewportHeight: 800,
  }), { left: 378, top: 58 });
});

test("avatar preview stays inside narrow and short viewports", () => {
  for (const left of [0, 10, 140, 292]) {
    for (const top of [-400, 0, 12, 170, 340, 372, 3000]) {
      const position = avatarPreviewPosition({
        anchor: { left, top, bottom: top + 28, width: 28 },
        width: 244, height: 282, viewportWidth: 320, viewportHeight: 400,
      });
      assert.ok(position.left >= 12 && position.left + 244 <= 308);
      assert.ok(position.top >= 12 && position.top + 282 <= 388);
    }
  }
});
