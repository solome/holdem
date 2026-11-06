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
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    if (anchor.bottom <= 0 || anchor.top >= height) return hide();
    const left = anchor.left + (anchor.width - tip.offsetWidth) / 2;
    const above = anchor.top - tip.offsetHeight - 4;
    const top = above >= gutter ? above : Math.min(anchor.bottom + 4, height - tip.offsetHeight - gutter);
    tip.style.left = Math.max(gutter, Math.min(left, width - tip.offsetWidth - gutter)) + "px";
    tip.style.top = Math.max(gutter, top) + "px";
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
  window.addEventListener("scroll", place, { capture: true, passive: true });
}
