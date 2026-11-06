import test from "node:test";
import assert from "node:assert/strict";
import { enhanceNavMenu } from "../src/review-menu.js";
import { floatingMenuLayout } from "../src/select-menu.js";
import { pages, navigation } from "../scripts/site-pages.mjs";
import { SITE_TRANSLATIONS } from "../src/site-i18n.mjs";

// A small browser-event fixture exercises the real disclosure module without a
// second DOM library. Full routing and layout are checked in the browser.
class Element extends EventTarget {
  constructor(ownerDocument) {
    super();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.scrollHeight = 154;
    this.rect = { left: 600, right: 704, top: 32, bottom: 76, width: 104, height: 44 };
  }
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
  const panel = new Element(document);
  const links = [new Element(document), new Element(document), new Element(document), new Element(document)];
  panel.selectorLists = { a: links };
  panel.children = links;
  element.selectors = { summary: trigger, ".review-nav-links": panel };
  element.children = [trigger, panel];
  element.open = false;
  enhanceNavMenu(element);
  return { document, element, trigger, panel, links };
}

function dispatch(element, type, properties = {}) {
  const event = new Event(type, { cancelable: true });
  Object.entries(properties).forEach(([key, value]) => Object.defineProperty(event, key, { value }));
  element.dispatchEvent(event);
  return event;
}

test("every page puts the collection homepage first and odds last, with the current menu label", () => {
  for (const page of pages) {
    const nav = navigation(page);
    assert.match(nav, /^<a href="index.html"/);
    assert.deepEqual([...nav.matchAll(/<a href="([^"]+)"/g)].map(match => match[1]), [
      "index.html", "ranges.html", "cash.html", "review.html", "handbook.html", "tilt.html", "reading.html", "odds.html",
    ]);
    const key = page.chapter ? "cashNav" : page.label;
    assert.match(nav, new RegExp('data-i18n="' + key + '" aria-current='));
    if (!["achievements", "odds"].includes(page.id))
      assert.match(nav, new RegExp('review-nav-trigger active"><span data-i18n="' + key + '"'));
    for (const strings of Object.values(SITE_TRANSLATIONS)) assert.ok(strings[key]);
  }
});

test("keyboard opening exposes links and Escape restores focus to the current-page trigger", () => {
  const { trigger, links, document, element } = fixture();
  assert.equal(dispatch(trigger, "keydown", { key: "ArrowDown" }).defaultPrevented, true);
  assert.equal(element.open, true);
  assert.equal(document.activeElement, links[0]);
  assert.equal(dispatch(element, "keydown", { key: "Escape" }).defaultPrevented, true);
  assert.equal(element.open, false);
  assert.equal(document.activeElement, trigger);
  dispatch(trigger, "keydown", { key: "ArrowUp" });
  assert.equal(document.activeElement, links[3]);
});

test("selecting the current link closes the disclosure without requiring a hashchange", () => {
  const { element, links } = fixture();
  element.open = true;
  dispatch(element, "toggle");
  assert.equal(element.open, true);
  dispatch(links[3], "click");
  assert.equal(element.open, false);
});

test("focus inside retains the disclosure while outside focus or pointer closes it", () => {
  const { element, links, document } = fixture();
  element.open = true;
  dispatch(element, "toggle");
  dispatch(element, "focusout", { relatedTarget: links[0] });
  assert.equal(element.open, true);
  dispatch(element, "focusout", { relatedTarget: null });
  assert.equal(element.open, false);
  element.open = true;
  dispatch(element, "toggle");
  dispatch(document, "pointerdown", { target: links[1] });
  assert.equal(element.open, true);
  dispatch(document, "pointerdown", { target: new Element(document) });
  assert.equal(element.open, false);
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
  const { element, trigger, panel, document } = fixture();
  const view = document.defaultView;
  const viewport = view.visualViewport;
  viewport.width = 280;
  viewport.height = 320;
  trigger.rect = { left: 140, right: 244, top: 70, bottom: 114, width: 104 };
  element.open = true;
  dispatch(element, "toggle");
  assert.equal(element.open, true);
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
