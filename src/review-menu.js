import { positionFloatingMenu } from "./select-menu.js";

// A disclosure containing ordinary navigation links keeps native Tab behaviour.
export function createReviewMenu({ element, translate }) {
  const trigger = element.querySelector("button");
  const currentLabel = trigger.querySelector("[data-review-current-label]");
  const panel = element.querySelector(".review-nav-links");
  const links = [...panel.querySelectorAll("a")];
  const ownerDocument = element.ownerDocument;
  const view = ownerDocument.defaultView;
  const isOpen = () => trigger.getAttribute("aria-expanded") === "true";

  function close({ restoreFocus = false } = {}) {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }

  function open() {
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    position();
  }

  function position() {
    if (isOpen() && !positionFloatingMenu(trigger, panel, "end")) close();
  }

  view.addEventListener("resize", position);
  view.visualViewport?.addEventListener("resize", position);
  view.visualViewport?.addEventListener("scroll", position);
  ownerDocument.addEventListener("scroll", (event) => {
    if (!panel.contains(event.target)) position();
  }, true);

  trigger.addEventListener("click", () => isOpen() ? close() : open());
  trigger.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    open();
    links[event.key === "ArrowDown" ? 0 : links.length - 1].focus();
  });
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    close({ restoreFocus: true });
  });
  element.addEventListener("focusout", (event) => {
    if (!element.contains(event.relatedTarget)) close();
  });
  ownerDocument.addEventListener("pointerdown", (event) => {
    if (!element.contains(event.target)) close();
  });
  // This also closes the menu when its already selected link is activated.
  links.forEach((link) => link.addEventListener("click", () => close()));

  return {
    close,
    sync(view) {
      const key = { review: "rNav", handbook: "hNav", tilt: "tNav", reading: "oNav" }[view] ?? "rNav";
      currentLabel.dataset.i18n = key;
      currentLabel.textContent = translate(key);
      trigger.classList.toggle("active", ["review", "handbook", "tilt", "reading"].includes(view));
      close();
    },
  };
}
