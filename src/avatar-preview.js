// Keep the preview in the viewport even when an avatar sits near an edge.
export function avatarPreviewPosition({ anchor, width, height, viewportWidth, viewportHeight, gap = 10, margin = 12 }) {
  const maxLeft = Math.max(margin, viewportWidth - width - margin);
  const maxTop = Math.max(margin, viewportHeight - height - margin);
  const left = Math.min(maxLeft, Math.max(margin, anchor.left + anchor.width / 2 - width / 2));
  const above = anchor.top - height - gap;
  const below = anchor.bottom + gap;
  const preferredTop = above >= margin ? above : below + height <= viewportHeight - margin ? below : above;
  const top = Math.min(maxTop, Math.max(margin, preferredTop));
  return { left, top };
}

let previewCount = 0;

export function createAvatarPreview({ element, people, avatarUrls, renderDetails }) {
  const doc = element.ownerDocument;
  const win = doc.defaultView;
  const preview = doc.createElement("div");
  preview.className = "review-avatar-preview";
  preview.id = `review-avatar-preview-${++previewCount}`;
  preview.setAttribute("role", "tooltip");
  preview.hidden = true;
  const picture = doc.createElement("img");
  picture.alt = "";
  picture.width = 220;
  picture.height = 220;
  const name = doc.createElement("strong");
  preview.append(picture, name);
  doc.body.append(preview);

  let current = null;
  let pinned = false;
  let closeTimer;
  const listeners = [];
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };
  const triggerFor = (target) => {
    const trigger = target?.closest?.("[data-avatar-person]");
    return trigger && element.contains(trigger) ? trigger : null;
  };
  const cancelClose = () => win.clearTimeout(closeTimer);

  function hide() {
    cancelClose();
    current?.setAttribute("aria-expanded", "false");
    current?.removeAttribute("aria-describedby");
    current = null;
    pinned = false;
    preview.hidden = true;
  }

  function show(trigger, pin = false) {
    const person = people[trigger.dataset.avatarPerson];
    const source = person && avatarUrls[person.id];
    if (!source) return;
    cancelClose();
    const changedTrigger = current !== trigger;
    if (changedTrigger) {
      hide();
      current = trigger;
    }
    pinned = pin;
    current.setAttribute("aria-expanded", "true");
    current.setAttribute("aria-describedby", preview.id);
    const details = renderDetails?.(trigger, person);
    if (details) {
      preview.dataset.variant = "friend-table";
      preview.innerHTML = details;
      const detailPicture = preview.querySelector("[data-preview-avatar]");
      if (detailPicture) detailPicture.src = source;
    } else {
      delete preview.dataset.variant;
      preview.replaceChildren(picture, name);
      if (picture.getAttribute("src") !== source) picture.src = source;
      name.textContent = person.name;
    }
    preview.hidden = false;
    if (changedTrigger) preview.scrollTop = 0;
    const bounds = preview.getBoundingClientRect();
    const { left, top } = avatarPreviewPosition({
      anchor: trigger.getBoundingClientRect(),
      width: bounds.width,
      height: bounds.height,
      viewportWidth: doc.documentElement.clientWidth,
      viewportHeight: win.innerHeight,
    });
    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;
  }

  function scheduleClose() {
    if (pinned) return;
    cancelClose();
    closeTimer = win.setTimeout(() => {
      if (!pinned && !preview.matches(":hover") && !current?.matches(":hover, :focus")) hide();
    }, 160);
  }

  // Capture avatar clicks before a parent summary or card can act on them.
  listen(element, "click", (event) => {
    const trigger = triggerFor(event.target);
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    if (current === trigger && pinned) hide();
    else show(trigger, true);
  }, true);
  listen(element, "keydown", (event) => {
    const trigger = triggerFor(event.target);
    if (!trigger || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (current === trigger && pinned) hide();
    else show(trigger, true);
  }, true);
  listen(element, "pointerover", (event) => {
    if (event.pointerType === "touch") return;
    const trigger = triggerFor(event.target);
    if (trigger && !trigger.contains(event.relatedTarget)) show(trigger, current === trigger && pinned);
  });
  listen(element, "pointerout", (event) => {
    const trigger = triggerFor(event.target);
    if (trigger && trigger === current && !trigger.contains(event.relatedTarget)) scheduleClose();
  });
  listen(element, "focusin", (event) => {
    const trigger = triggerFor(event.target);
    if (trigger) show(trigger, current === trigger && pinned);
  });
  listen(element, "focusout", (event) => {
    if (triggerFor(event.target) === current) {
      pinned = false;
      scheduleClose();
    }
  });
  listen(preview, "pointerenter", cancelClose);
  listen(preview, "pointerleave", scheduleClose);
  listen(doc, "pointerdown", (event) => {
    if (current && !current.contains(event.target) && !preview.contains(event.target)) hide();
  }, true);
  listen(doc, "keydown", (event) => {
    if (event.key === "Escape" && current) {
      event.preventDefault();
      hide();
    } else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) {
      if (current && doc.activeElement === current && preview.dataset.variant === "friend-table"
        && preview.scrollHeight > preview.clientHeight) {
        event.preventDefault();
        const page = Math.max(40, preview.clientHeight - 32);
        const delta = { ArrowUp: -40, ArrowDown: 40, PageUp: -page, PageDown: page, Home: -preview.scrollHeight, End: preview.scrollHeight }[event.key];
        preview.scrollTop += delta;
      } else hide();
    }
  });
  // Focusing an offscreen avatar can scroll it into view after focusin. Keep
  // that preview anchored; explicit scroll gestures still dismiss it first.
  listen(win, "scroll", (event) => {
    if (preview.contains(event.target)) return;
    if (current && doc.activeElement === current) show(current, pinned);
    else hide();
  }, true);
  const dismissOnPageScroll = (event) => {
    if (!preview.contains(event.target)) hide();
  };
  listen(win, "wheel", dismissOnPageScroll, { capture: true, passive: true });
  listen(win, "touchmove", dismissOnPageScroll, { capture: true, passive: true });
  listen(win, "resize", hide);
  listen(win, "hashchange", hide);

  return {
    hide,
    destroy() {
      hide();
      listeners.forEach((remove) => remove());
      preview.remove();
    },
  };
}
