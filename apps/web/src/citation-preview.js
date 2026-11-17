import { listenForSegmentChanges, visibleViewportBounds } from "./visible-viewport.js";

// Leave fragment navigation to the browser. Only the preview needs positioning.
export function enhanceCitationPreviews() {
  const citations = document.querySelectorAll(".citation");
  if (!citations.length) return;
  let current;
  let hideTimer;

  function hide() {
    clearTimeout(hideTimer);
    current?.removeAttribute("data-preview-open");
    current = null;
  }
  function place() {
    if (!current) return;
    const anchor = current.querySelector(".citation-mark").getBoundingClientRect();
    const tip = current.querySelector(".citation-tip");
    const gutter = 12;
    const viewport = visibleViewportBounds(document);
    if (anchor.bottom <= viewport.top || anchor.top >= viewport.bottom ||
        anchor.right <= viewport.left || anchor.left >= viewport.right) return hide();
    tip.style.maxWidth = Math.max(0, viewport.right - viewport.left - 2 * gutter) + "px";
    tip.style.maxHeight = Math.max(0, viewport.bottom - viewport.top - 2 * gutter) + "px";
    const left = anchor.left + (anchor.width - tip.offsetWidth) / 2;
    const above = anchor.top - tip.offsetHeight - 4;
    const top = above >= viewport.top + gutter ? above : Math.min(anchor.bottom + 4, viewport.bottom - tip.offsetHeight - gutter);
    tip.style.left = Math.max(viewport.left + gutter, Math.min(left, viewport.right - tip.offsetWidth - gutter)) + "px";
    tip.style.top = Math.max(viewport.top + gutter, top) + "px";
  }
  function show(citation) {
    hide();
    current = citation;
    current.setAttribute("data-preview-open", "");
    place();
  }
  for (const citation of citations) {
    const anchor = citation.querySelector(".citation-mark");
    citation.setAttribute("data-preview-ready", "");
    citation.addEventListener("pointerenter", event => {
      if (event.pointerType === "mouse") show(citation);
    });
    citation.addEventListener("pointerleave", () => {
      if (current === citation && !anchor.matches(":focus-visible")) {
        hideTimer = setTimeout(hide, 160);
      }
    });
    anchor.addEventListener("focus", () => {
      if (anchor.matches(":focus-visible")) show(citation);
    });
    anchor.addEventListener("blur", () => {
      if (current === citation) hide();
    });
    anchor.addEventListener("click", hide);
  }
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") hide();
  });
  window.addEventListener("resize", place);
  listenForSegmentChanges(window, place);
  window.addEventListener("scroll", place, { capture: true, passive: true });
}
