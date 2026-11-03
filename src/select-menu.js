const instances = new WeakMap();
let openMenu = null;
let listenersInstalled = false;
let nextId = 0;

const chevron =
  '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const checkmark =
  '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8 3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function sync(instance) {
  const { select, button, value } = instance;
  value.textContent = select.selectedOptions[0]?.textContent ?? "";
  button.disabled = select.disabled;
  button.setAttribute(
    "aria-label",
    select.getAttribute("aria-label") ?? select.name ?? value.textContent,
  );
}

export function closeSelectMenu({ restoreFocus = false } = {}) {
  if (!openMenu) return;
  const { instance, panel, observer } = openMenu;
  openMenu = null;
  observer.disconnect();
  panel.remove();
  instance.button.setAttribute("aria-expanded", "false");
  instance.button.removeAttribute("aria-activedescendant");
  if (restoreFocus && instance.button.isConnected)
    instance.button.focus({ preventScroll: true });
}

export function closeSelectMenusWithin(root) {
  if (openMenu && root.contains(openMenu.instance.select)) closeSelectMenu();
}

export function focusSelectControl(control) {
  if (!control) return;
  (instances.get(control)?.button ?? control).focus({ preventScroll: true });
}

// Both header menus use the same viewport bounds and scrolling limits.
export function floatingMenuLayout({ anchor, viewport, menuHeight, align = "start" }) {
  const margin = 10;
  const gap = 7;
  const leftEdge = viewport.left + margin;
  const rightEdge = viewport.right - margin;
  const topEdge = viewport.top + margin;
  const bottomEdge = viewport.bottom - margin;
  if (rightEdge <= leftEdge || bottomEdge <= topEdge || !anchor.width ||
      anchor.bottom < viewport.top || anchor.top > viewport.bottom ||
      anchor.right < viewport.left || anchor.left > viewport.right) return null;
  const width = Math.min(Math.max(anchor.width, 184), rightEdge - leftEdge);
  const below = Math.max(0, bottomEdge - anchor.bottom - gap);
  const above = Math.max(0, anchor.top - gap - topEdge);
  const desiredHeight = Math.min(menuHeight, 310);
  const opensAbove = below < Math.min(desiredHeight, 150) && above > below;
  const maxHeight = Math.min(310, Math.max(32, opensAbove ? above : below), bottomEdge - topEdge);
  const height = Math.min(menuHeight, maxHeight);
  const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
  return {
    width,
    maxHeight,
    left: clamp(align === "end" ? anchor.right - width : anchor.left, leftEdge, rightEdge - width),
    top: clamp(opensAbove ? anchor.top - gap - height : anchor.bottom + gap, topEdge, bottomEdge - height),
    side: opensAbove ? "top" : "bottom",
  };
}

export function positionFloatingMenu(anchor, panel, align = "start") {
  const ownerDocument = anchor.ownerDocument;
  const view = ownerDocument.defaultView;
  const visualViewport = view.visualViewport;
  const rootStyle = view.getComputedStyle(ownerDocument.documentElement);
  const inset = (side) => parseFloat(rootStyle.getPropertyValue(`--safe-area-${side}`)) || 0;
  const viewportLeft = visualViewport?.offsetLeft ?? 0;
  const viewportTop = visualViewport?.offsetTop ?? 0;
  const viewport = {
    left: viewportLeft + inset("left"),
    top: viewportTop + inset("top"),
    right: viewportLeft + (visualViewport?.width ?? ownerDocument.documentElement.clientWidth) - inset("right"),
    bottom: viewportTop + (visualViewport?.height ?? view.innerHeight) - inset("bottom"),
  };
  const rect = anchor.getBoundingClientRect();
  let layout = floatingMenuLayout({ anchor: rect, viewport, menuHeight: panel.scrollHeight, align });
  if (!layout) return false;
  panel.style.width = `${layout.width}px`;
  // Width can change when an unfolded screen becomes a narrow outer screen.
  layout = floatingMenuLayout({ anchor: rect, viewport, menuHeight: panel.scrollHeight, align });
  panel.style.maxHeight = `${layout.maxHeight}px`;
  panel.style.left = `${layout.left}px`;
  panel.style.top = `${layout.top}px`;
  panel.dataset.side = layout.side;
  return true;
}

function positionMenu() {
  if (!openMenu) return;
  const { instance, panel } = openMenu;
  if (!instance.button.isConnected || !positionFloatingMenu(instance.button, panel, instance.select.dataset.menuAlign)) {
    closeSelectMenu();
    return;
  }
}

function activate(index, scroll = true) {
  if (!openMenu) return;
  const { rows, instance } = openMenu;
  const enabled = rows
    .map((row, item) => (row.disabled ? -1 : item))
    .filter((item) => item >= 0);
  if (!enabled.length) return;
  if (!enabled.includes(index)) index = enabled[0];
  openMenu.activeIndex = index;
  rows.forEach((row, item) =>
    row.element.classList.toggle("is-active", item === index),
  );
  instance.button.setAttribute("aria-activedescendant", rows[index].element.id);
  if (scroll) rows[index].element.scrollIntoView({ block: "nearest" });
}

function moveActive(direction) {
  if (!openMenu) return;
  const enabled = openMenu.rows
    .map((row, index) => (row.disabled ? -1 : index))
    .filter((index) => index >= 0);
  const current = enabled.indexOf(openMenu.activeIndex);
  activate(
    enabled[Math.max(0, Math.min(enabled.length - 1, current + direction))],
  );
}

function commit(index, restoreFocus = true) {
  if (!openMenu) return;
  const { instance, rows } = openMenu;
  const row = rows[index];
  if (!row || row.disabled) return;
  const id = instance.select.id;
  const changed = instance.select.value !== row.value;
  closeSelectMenu();
  instance.select.value = row.value;
  sync(instance);
  // A change handler can synchronously replace the entire field. Close the
  // portal first, then resolve the current field by ID when restoring focus.
  if (changed)
    instance.select.dispatchEvent(new Event("change", { bubbles: true }));
  if (restoreFocus) focusSelectControl(document.getElementById(id));
}

function open(instance, edge) {
  if (instance.select.disabled) return;
  closeSelectMenu();
  const panel = document.createElement("div");
  panel.className = "select-menu";
  panel.id = instance.listId;
  panel.setAttribute("role", "listbox");
  panel.setAttribute("aria-label", instance.button.getAttribute("aria-label"));
  const rows = [...instance.select.options].map((option, index) => {
    const element = document.createElement("div");
    element.className = "select-menu-option";
    element.id = `${instance.listId}-option-${index}`;
    element.setAttribute("role", "option");
    element.setAttribute("aria-selected", String(option.selected));
    element.dataset.value = option.value;
    if (option.disabled) element.setAttribute("aria-disabled", "true");
    const label = document.createElement("span");
    label.className = "select-option-label";
    label.textContent = option.textContent;
    const check = document.createElement("span");
    check.className = "select-option-check";
    check.innerHTML = checkmark;
    element.append(label, check);
    element.addEventListener("pointermove", () => {
      if (!option.disabled) activate(index, false);
    });
    element.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") event.preventDefault();
    });
    element.addEventListener("click", () => commit(index));
    panel.append(element);
    return { element, value: option.value, disabled: option.disabled };
  });
  const observer = new MutationObserver(() => {
    if (
      !instance.button.isConnected ||
      !instance.button.getClientRects().length
    )
      closeSelectMenu();
  });
  openMenu = {
    instance,
    panel,
    rows,
    activeIndex: -1,
    observer,
    search: "",
    lastTyped: 0,
  };
  document.body.append(panel);
  instance.button.setAttribute("aria-expanded", "true");
  positionMenu();
  if (!openMenu) return;
  const index =
    edge === "first"
      ? 0
      : edge === "last"
        ? rows.length - 1
        : instance.select.selectedIndex;
  activate(index);
  observer.observe(document.body, { childList: true, subtree: true });
}

function keyboard(instance, event) {
  const isOpen = openMenu?.instance === instance;
  if (event.key === "Tab") {
    if (isOpen) commit(openMenu.activeIndex, false);
    return;
  }
  if (event.key === "Escape") {
    if (isOpen) {
      event.preventDefault();
      event.stopPropagation();
      closeSelectMenu({ restoreFocus: true });
    }
    return;
  }
  if (
    ["Enter", " ", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
  ) {
    event.preventDefault();
    if (!isOpen) {
      open(
        instance,
        event.key === "Home"
          ? "first"
          : event.key === "End"
            ? "last"
            : undefined,
      );
      return;
    }
    if (event.key === "Enter" || event.key === " ")
      commit(openMenu.activeIndex);
    else if (event.key === "ArrowDown") moveActive(1);
    else if (event.key === "ArrowUp") moveActive(-1);
    else activate(event.key === "Home" ? 0 : openMenu.rows.length - 1);
    return;
  }
  if (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    if (!isOpen) open(instance);
    if (!openMenu) return;
    const now = Date.now();
    openMenu.search =
      now - openMenu.lastTyped > 700 ? event.key : openMenu.search + event.key;
    openMenu.lastTyped = now;
    const index = openMenu.rows.findIndex(
      (row) =>
        !row.disabled &&
        row.element.textContent
          .toLocaleLowerCase()
          .startsWith(openMenu.search.toLocaleLowerCase()),
    );
    if (index >= 0) activate(index);
  }
}

function installListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        openMenu &&
        !openMenu.panel.contains(event.target) &&
        !openMenu.instance.button.contains(event.target)
      )
        closeSelectMenu();
    },
    true,
  );
  document.addEventListener("focusin", (event) => {
    if (
      openMenu &&
      !openMenu.panel.contains(event.target) &&
      event.target !== openMenu.instance.button
    )
      closeSelectMenu();
  });
  document.addEventListener(
    "scroll",
    (event) => {
      if (openMenu && !openMenu.panel.contains(event.target)) positionMenu();
    },
    true,
  );
  window.addEventListener("resize", positionMenu);
  window.visualViewport?.addEventListener("resize", positionMenu);
  window.visualViewport?.addEventListener("scroll", positionMenu);
  window.addEventListener("hashchange", () => closeSelectMenu());
}

/** Keeps native values/change events as the single form state. */
export function enhanceSelects(root = document) {
  installListeners();
  for (const select of root.querySelectorAll("select")) {
    let instance = instances.get(select);
    if (!instance) {
      if (!select.id) select.id = `select-${++nextId}`;
      const wrapper = document.createElement("div");
      wrapper.className = "custom-select";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "select-trigger";
      button.id = `${select.id}-trigger`;
      button.setAttribute("role", "combobox");
      button.setAttribute("aria-haspopup", "listbox");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", `${select.id}-listbox`);
      const value = document.createElement("span");
      value.className = "select-value";
      const arrow = document.createElement("span");
      arrow.className = "select-chevron";
      arrow.innerHTML = chevron;
      button.append(value, arrow);
      select.before(wrapper);
      wrapper.append(select, button);
      select.hidden = true;
      select.tabIndex = -1;
      select.setAttribute("aria-hidden", "true");
      instance = { select, button, value, listId: `${select.id}-listbox` };
      instances.set(select, instance);
      button.addEventListener("click", () =>
        openMenu?.instance === instance ? closeSelectMenu() : open(instance),
      );
      button.addEventListener("keydown", (event) => keyboard(instance, event));
      select.addEventListener("change", () => sync(instance));
    }
    sync(instance);
  }
}
