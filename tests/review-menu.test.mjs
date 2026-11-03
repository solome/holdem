import test from "node:test";
import assert from "node:assert/strict";
import { createReviewMenu } from "../src/review-menu.js";
import { floatingMenuLayout } from "../src/select-menu.js";

// A small browser-event fixture exercises the real disclosure module without a
// second DOM library. Full routing and layout are checked in the browser.
class Element extends EventTarget {
  constructor(ownerDocument) {
    super();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.attributes = new Map();
    this.dataset = {};
    this.hidden = false;
    this.style = {};
    this.scrollHeight = 154;
    this.rect = { left: 600, right: 704, top: 32, bottom: 76, width: 104, height: 44 };
    this.classes = new Set();
    this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) };
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  focus() { this.ownerDocument.activeElement = this; }
  contains(target) { return this === target || this.children.some((child) => child.contains(target)); }
  querySelector(selector) { return this.selectors[selector]; }
  querySelectorAll(selector) { return this.selectorLists[selector]; }
  getBoundingClientRect() { return this.rect; }
}

function fixture() {
  const document = new EventTarget();
  document.documentElement = { clientWidth: 900 };
  document.defaultView = new EventTarget();
  document.defaultView.innerHeight = 800;
  document.defaultView.visualViewport = Object.assign(new EventTarget(), {
    offsetLeft: 0, offsetTop: 0, width: 900, height: 800,
  });
  document.defaultView.getComputedStyle = () => ({ getPropertyValue: () => "0px" });
  const element = new Element(document);
  const trigger = new Element(document);
  const label = new Element(document);
  const panel = new Element(document);
  const links = [new Element(document), new Element(document), new Element(document), new Element(document)];
  trigger.selectors = { "[data-review-current-label]": label };
  trigger.children = [label];
  panel.selectorLists = { a: links };
  panel.children = links;
  element.selectors = { button: trigger, ".review-nav-links": panel };
  element.children = [trigger, panel];
  trigger.setAttribute("aria-expanded", "false");
  panel.hidden = true;
  let language = "zh-CN";
  const strings = {
    "zh-CN": { hNav: "松凶手册", rNav: "牌局复盘", tNav: "情绪管理", oNav: "读人识牌" },
    "zh-TW": { hNav: "鬆兇手冊", rNav: "牌局復盤", tNav: "情緒管理", oNav: "讀人識牌" },
    en: { hNav: "LAG handbook", rNav: "Hand reviews", tNav: "Tilt control", oNav: "Hand reading" },
  };
  const menu = createReviewMenu({ element, translate: (key) => strings[language][key] });
  return { document, element, trigger, label, panel, links, menu, setLanguage: (value) => language = value };
}

function dispatch(element, type, properties = {}) {
  const event = new Event(type, { cancelable: true });
  Object.entries(properties).forEach(([key, value]) => Object.defineProperty(event, key, { value }));
  element.dispatchEvent(event);
  return event;
}

test("selected page and language determine the current menu label through repeated navigation", () => {
  const { menu, label, trigger, setLanguage } = fixture();
  for (const [view, expected, active] of [
    ["handbook", "松凶手册", true],
    ["review", "牌局复盘", true],
    ["tilt", "情绪管理", true],
    ["reading", "读人识牌", true],
    ["ranges", "牌局复盘", false],
    ["handbook", "松凶手册", true],
  ]) {
    menu.sync(view);
    assert.equal(label.textContent, expected);
    assert.equal(trigger.classes.has("active"), active);
    assert.equal(label.dataset.i18n, { handbook: "hNav", tilt: "tNav", reading: "oNav" }[view] ?? "rNav");
  }
  setLanguage("en");
  menu.sync("handbook");
  assert.equal(label.textContent, "LAG handbook");
  menu.sync("review");
  assert.equal(label.textContent, "Hand reviews");
  menu.sync("tilt");
  assert.equal(label.textContent, "Tilt control");
  menu.sync("reading");
  assert.equal(label.textContent, "Hand reading");
  setLanguage("zh-TW");
  menu.sync("handbook");
  assert.equal(label.textContent, "鬆兇手冊");
  menu.sync("tilt");
  assert.equal(label.textContent, "情緒管理");
  menu.sync("reading");
  assert.equal(label.textContent, "讀人識牌");
});

test("keyboard opening exposes links and Escape restores focus to the current-page trigger", () => {
  const { menu, trigger, panel, links, document, element } = fixture();
  menu.sync("handbook");
  assert.equal(dispatch(trigger, "keydown", { key: "ArrowDown" }).defaultPrevented, true);
  assert.equal(panel.hidden, false);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  assert.equal(document.activeElement, links[0]);
  assert.equal(dispatch(element, "keydown", { key: "Escape" }).defaultPrevented, true);
  assert.equal(panel.hidden, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(document.activeElement, trigger);
  dispatch(trigger, "keydown", { key: "ArrowUp" });
  assert.equal(document.activeElement, links[3]);
});

test("selecting the current link closes the disclosure without requiring a hashchange", () => {
  const { menu, trigger, label, links, panel } = fixture();
  menu.sync("reading");
  dispatch(trigger, "click");
  assert.equal(panel.hidden, false);
  dispatch(links[3], "click");
  assert.equal(panel.hidden, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(label.textContent, "读人识牌");
});

test("focus inside retains the disclosure while outside focus or pointer closes it", () => {
  const { trigger, element, links, document, panel } = fixture();
  dispatch(trigger, "click");
  dispatch(element, "focusout", { relatedTarget: links[0] });
  assert.equal(panel.hidden, false);
  dispatch(element, "focusout", { relatedTarget: null });
  assert.equal(panel.hidden, true);
  dispatch(trigger, "click");
  dispatch(document, "pointerdown", { target: links[1] });
  assert.equal(panel.hidden, false);
  dispatch(document, "pointerdown", { target: new Element(document) });
  assert.equal(panel.hidden, true);
});

test("floating menus fit narrow, short and inset viewports with a scrollable height", () => {
  for (const [viewport, anchor, expectedSide] of [
    [{ left: 0, right: 280, top: 0, bottom: 320 }, { left: 4, right: 108, width: 104, top: 76, bottom: 120 }, "bottom"],
    [{ left: 0, right: 320, top: 0, bottom: 180 }, { left: 200, right: 304, width: 104, top: 96, bottom: 140 }, "top"],
    [{ left: 44, right: 756, top: 0, bottom: 299 }, { left: 650, right: 744, width: 94, top: 180, bottom: 224 }, "top"],
    [{ left: 24, right: 244, top: 80, bottom: 240 }, { left: 140, right: 220, width: 80, top: 110, bottom: 154 }, "bottom"],
  ]) {
    const layout = floatingMenuLayout({ anchor, viewport, menuHeight: 154, align: "end" });
    assert.equal(layout.side, expectedSide);
    assert.ok(layout.left >= viewport.left + 10);
    assert.ok(layout.left + layout.width <= viewport.right - 10);
    assert.ok(layout.top >= viewport.top + 10);
    assert.ok(layout.top + Math.min(154, layout.maxHeight) <= viewport.bottom - 10);
    assert.ok(layout.maxHeight >= 32);
  }
  const short = floatingMenuLayout({
    anchor: { left: 200, right: 304, width: 104, top: 96, bottom: 140 },
    viewport: { left: 0, right: 320, top: 0, bottom: 180 }, menuHeight: 154,
  });
  assert.ok(short.maxHeight < 154, "short landscape views constrain the menu rather than clipping entries");
});

test("an open navigation menu repositions when a fold or visible viewport resize changes its bounds", () => {
  const { trigger, panel, document } = fixture();
  const view = document.defaultView;
  const viewport = view.visualViewport;
  viewport.width = 280;
  viewport.height = 320;
  trigger.rect = { left: 140, right: 244, top: 70, bottom: 114, width: 104 };
  dispatch(trigger, "click");
  assert.equal(panel.hidden, false);
  const narrowLeft = parseFloat(panel.style.left);
  assert.ok(narrowLeft >= 10 && narrowLeft + parseFloat(panel.style.width) <= 270);

  viewport.width = 540;
  trigger.rect = { left: 420, right: 524, top: 70, bottom: 114, width: 104 };
  dispatch(view, "resize");
  assert.ok(parseFloat(panel.style.left) > narrowLeft);
  assert.ok(parseFloat(panel.style.left) + parseFloat(panel.style.width) <= 530);

  viewport.height = 180;
  trigger.rect = { left: 420, right: 524, top: 88, bottom: 132, width: 104 };
  dispatch(viewport, "resize");
  assert.equal(panel.dataset.side, "top");
  assert.ok(parseFloat(panel.style.maxHeight) < panel.scrollHeight);
  assert.ok(parseFloat(panel.style.top) + parseFloat(panel.style.maxHeight) <= 170);
});
