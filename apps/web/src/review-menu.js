import { positionFloatingMenu } from "./select-menu.js";
import { listenForSegmentChanges } from "./visible-viewport.js";

// Ordinary links inside native disclosures also work before JS or without it.
export function enhanceNavMenu(element) {
  const trigger = element.querySelector("summary");
  const panel = element.querySelector(".review-nav-links");
  const links = [...panel.querySelectorAll("a")];
  const doc = element.ownerDocument;
  const win = doc.defaultView;
  let pendingLink;

  function close() {
    if (pendingLink) {
      delete pendingLink.dataset.navigating;
      pendingLink = undefined;
    }
    element.open = false;
  }

  function position() {
    if (element.open && !positionFloatingMenu(trigger, panel, "end")) close();
  }
  element.addEventListener("toggle", () => {
    if (element.open) position();
    else if (pendingLink) close();
  });
  win.addEventListener("resize", position);
  listenForSegmentChanges(win, position);
  win.visualViewport?.addEventListener("resize", position);
  win.visualViewport?.addEventListener("scroll", position);
  doc.addEventListener("scroll", (event) => {
    if (!panel.contains(event.target)) position();
  }, true);
  trigger.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    element.open = true;
    position();
    links[event.key === "ArrowDown" ? 0 : links.length - 1].focus();
  });
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !element.open) return;
    event.preventDefault();
    event.stopPropagation();
    close();
    trigger.focus({ preventScroll: true });
  });
  // WebKit can blur the summary without focusing the tapped link. Wait for
  // actual outside focus so the link is still present when its click arrives.
  doc.addEventListener("focusin", (event) => {
    if (element.open && !element.contains(event.target) && !event.target.contains(element)) close();
  });
  doc.addEventListener("pointerdown", (event) => {
    if (element.open && !element.contains(event.target)) close();
  });
  for (const link of links) link.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;
    if (pendingLink) delete pendingLink.dataset.navigating;
    pendingLink = link;
    link.dataset.navigating = "";
    // Keep the pressed state while the browser loads the destination.
  });
  win.addEventListener("pagehide", () => {
    if (element.open || pendingLink) close();
  });
}
