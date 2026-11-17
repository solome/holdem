// Intersect the visual viewport and safe area with the first continuous pane.
export function visibleViewportBounds(doc) {
  const win = doc.defaultView;
  const visual = win.visualViewport;
  const style = win.getComputedStyle(doc.documentElement);
  const inset = side => parseFloat(style.getPropertyValue(`--safe-area-${side}`)) || 0;
  const left = visual?.offsetLeft ?? 0;
  const top = visual?.offsetTop ?? 0;
  const segments = win.viewport?.segments;
  const pane = segments?.length > 1 && segments.find(({ left, top }) => left === 0 && top === 0);
  return {
    left: left + inset("left"),
    top: top + inset("top"),
    right: Math.min(left + (visual?.width ?? doc.documentElement.clientWidth) - inset("right"), pane?.right ?? Infinity),
    bottom: Math.min(top + (visual?.height ?? win.innerHeight) - inset("bottom"), pane?.bottom ?? Infinity),
  };
}

export function listenForSegmentChanges(win, callback) {
  const queries = ["horizontal", "vertical"].map(axis => win.matchMedia?.(`(${axis}-viewport-segments: 2)`));
  for (const query of queries) query?.addEventListener?.("change", callback);
  return () => {
    for (const query of queries) query?.removeEventListener?.("change", callback);
  };
}
