import { listenForSegmentChanges, visibleViewportBounds } from "./visible-viewport.js";

// Chapter URLs and scrolling work natively. Highlight the current section as the reader moves.
export function enhanceGuideNavigation(root = document) {
  const doc = root.ownerDocument ?? root;
  const win = doc.defaultView;
  const contents = root.querySelector("[data-reading-toc]");
  const caption = contents?.querySelector("[data-reading-current]");
  const destinations = new Map();
  for (const link of root.querySelectorAll(".handbook-toc li a[href^='#'], .reading-toc-links li a[href^='#']")) {
    const section = doc.getElementById(link.hash.slice(1));
    if (!section) continue;
    if (!destinations.has(section)) destinations.set(section, []);
    destinations.get(section).push(link);
  }
  const entries = [...destinations];
  if (!entries.length) return;

  let previous;
  function update() {
    const viewport = visibleViewportBounds(doc);
    const threshold = viewport.top + Math.max(80, (viewport.bottom - viewport.top) * 0.25);
    const current = entries.filter(([section]) => section.getBoundingClientRect().top <= threshold).at(-1) ?? entries[0];
    if (previous !== current) {
      previous?.[1].forEach(link => link.removeAttribute("aria-current"));
      current[1].forEach(link => link.setAttribute("aria-current", "location"));
      if (caption) {
        const link = current[1][0];
        caption.textContent = (link.querySelector("[data-reading-label]") ?? link).textContent.trim();
      }
      previous = current;
    }
  }
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    win.requestAnimationFrame(() => {
      pending = false;
      update();
    });
  }
  update();
  win.addEventListener("scroll", schedule, { capture: true, passive: true });
  win.addEventListener("resize", schedule);
  listenForSegmentChanges(win, schedule);
  win.addEventListener("pageshow", schedule);

  if (!contents) return;
  const summary = contents.querySelector("summary");
  const followsLink = event => !event.defaultPrevented && event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  root.querySelector("[data-reading-shortcut]")?.addEventListener("click", (event) => {
    if (!followsLink(event)) return;
    win.requestAnimationFrame(() => {
      if (win.location.hash !== `#${summary.id}`) return;
      contents.open = true;
      summary.focus({ preventScroll: true });
    });
  });
  contents.addEventListener("toggle", () => {
    if (!contents.open) return;
    const panel = contents.querySelector(".reading-toc-links");
    if (panel.getBoundingClientRect().bottom > visibleViewportBounds(doc).bottom)
      contents.scrollIntoView({ block: "start" });
  });
  contents.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link || !followsLink(event)) return;
    const section = doc.getElementById(link.hash.slice(1));
    // Let the native jump and history update finish before hiding its link.
    win.requestAnimationFrame(() => {
      if (win.location.hash !== link.hash) return;
      contents.open = false;
      section?.focus({ preventScroll: true });
      schedule();
    });
  });
  function closeFromOutside(event) {
    if (contents.open && !contents.contains(event.target)) contents.open = false;
  }
  doc.addEventListener("pointerdown", closeFromOutside, { passive: true });
  contents.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && contents.open) {
      win.requestAnimationFrame(() => {
        if (!contents.contains(doc.activeElement)) contents.open = false;
      });
    }
    if (event.key !== "Escape" || !contents.open) return;
    event.preventDefault();
    contents.open = false;
    summary.focus({ preventScroll: true });
  });
}
