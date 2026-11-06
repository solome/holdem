import { positionFloatingMenu } from "./select-menu.js";

// Ordinary links inside native disclosures also work before JS or without it.
export function enhanceNavMenu(element) {
  const trigger = element.querySelector("summary");
  const panel = element.querySelector(".review-nav-links");
  const links = [...panel.querySelectorAll("a")];
  const doc = element.ownerDocument;
  const win = doc.defaultView;

  function position() {
    if (element.open && !positionFloatingMenu(trigger, panel, "end")) element.open = false;
  }
  element.addEventListener("toggle", position);
  win.addEventListener("resize", position);
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
    element.open = false;
    trigger.focus({ preventScroll: true });
  });
  element.addEventListener("focusout", (event) => {
    if (!element.contains(event.relatedTarget)) element.open = false;
  });
  doc.addEventListener("pointerdown", (event) => {
    if (!element.contains(event.target)) element.open = false;
  });
  for (const link of links) link.addEventListener("click", () => { element.open = false; });
}
