import assert from "node:assert/strict";
import test from "node:test";
import { visibleViewportBounds } from "../src/visible-viewport.js";

const doc = ({ width, height, visualViewport, segments, insets = {} }) => ({
  documentElement: { clientWidth: width },
  defaultView: {
    innerHeight: height,
    visualViewport,
    viewport: segments && { segments },
    getComputedStyle: () => ({
      getPropertyValue: key => insets[key.replace("--safe-area-", "")] ?? "0px",
    }),
  },
});

test("portrait menu bounds use the visual viewport and exclude physical safe insets", () => {
  assert.deepEqual(visibleViewportBounds(doc({
    width: 390, height: 844, visualViewport: { offsetLeft: 4, offsetTop: 16, width: 380, height: 620 },
    insets: { top: "8px", right: "2px", bottom: "20px" },
  })), { left: 4, top: 24, right: 382, bottom: 616 });
});

test("an open fold keeps overlays in the first continuous pane", () => {
  const left = { left: 0, top: 0, right: 540, bottom: 720 };
  const right = { left: 574, top: 0, right: 1114, bottom: 720 };
  assert.deepEqual(visibleViewportBounds(doc({ width: 1114, height: 720, segments: [left, right] })),
    { left: 0, top: 0, right: 540, bottom: 720 });
  const top = { left: 0, top: 0, right: 720, bottom: 540 };
  const bottom = { left: 0, top: 574, right: 720, bottom: 1114 };
  assert.deepEqual(visibleViewportBounds(doc({ width: 720, height: 1114, segments: [top, bottom] })),
    { left: 0, top: 0, right: 720, bottom: 540 });
});
