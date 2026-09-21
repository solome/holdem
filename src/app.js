import { createRangeExplorer } from "./range-ui.js";
import { enhanceSelects } from "./select-menu.js";
import { RANGE_TRANSLATIONS } from "./range-i18n.mjs";
import { createOddsCalculator } from "./odds-ui.js";
import { ODDS_TRANSLATIONS } from "./odds-i18n.mjs";
import { SUITS, ACHIEVEMENTS, rankLabel, getStats } from "./catalog.mjs";

const translations = {
  "zh-CN": {
    pageTitle: "Holdem — 掬一捧的德州好牌图鉴",
    skip: "跳至主要内容",
    navigation: "导航",
    collection: "成就图鉴",
    language: "选择语言",
    heroTitle: "好牌，值得<br><span>被记住。</span>",
    heroDescription: "有些牌，千载难逢。<br>把牌桌上的高光时刻，收藏在这里。",
    explore: "探索我的成就",
    personalBest: "个人最高成就",
    heroAria: "查看方片皇家同花顺的牌局详情",
    royal: "皇家同花顺",
    straightFlush: "同花顺",
    quads: "四条金刚",
    spades: "黑桃",
    hearts: "红桃",
    clubs: "梅花",
    diamonds: "方片",
    allSuits: "四种花色",
    unlocked: "已达成",
    locked: "未达成",
    statistics: "成就统计",
    totalProgress: "收藏进度",
    collectionTitle: "把传奇，一手手集齐。",
    onlyUnlocked: "只看已达成",
    categoryFilter: "牌型筛选",
    all: "全部成就",
    emptyTitle: "下一份成就，等你来点亮",
    emptyDescription: "这个分类还没有已达成的记录，先看看完整图鉴吧。",
    showAll: "查看全部成就",
    footer: "读懂牌局，做出更好的选择。",
    royalDescription: "同一花色的 10 · J · Q · K · A",
    flushDescription: "同一花色的五张连牌，最高牌 10 至 K",
    quadsDescription: "四种花色，同一点数；10 至 A",
    count: "{count} 项成就",
    groupProgress: "{unlocked} / {total} 已达成",
    royalName: "{suit}皇家同花顺",
    flushName: "{rank} 高同花顺",
    quadsName: "{rank} 金刚",
    royalCode: "皇家",
    flushCode: "同花顺",
    quadsCode: "金刚",
    highRange: "{low} — {high} · {suit}",
    quadsSubtitle: "四条 {rank} · 四种花色",
    viewAchievement: "{name}，{suit}，{state}，查看详情",
    detailUnlocked: "已珍藏的高光时刻",
    detailLocked: "待点亮的成就",
    detailDescription: "{suit} · {range} · {state}",
    quadsDetailDescription: "四张 {rank} · {state}",
    close: "关闭详情",
    tableLabel: "牌局回顾",
    lockedTableLabel: "等待你的这手好牌",
    holeCards: "我的起手牌",
    boardCards: "五张公共牌",
    twoCards: "2 张",
    fiveCards: "5 张",
    holeCaption: "从这两张牌开始",
    boardCaption: "按记录顺序展示",
    winningLegend: "金色描边标记组成成就的牌",
    winningHand: "成就牌型",
    replay: "重播发牌",
    noHoleCaption: "等待你的起手牌",
    noBoardCaption: "等待完整牌局",
    noRecord: "尚无达成记录。下一次高光，也许就是这一手。",
    requirementLabel: "达成条件",
    royalRequirement: "在七张牌中凑齐 {suit} 10、J、Q、K、A。",
    flushRequirement: "在七张牌中凑齐 {suit} {ranks}。",
    quadsRequirement: "在七张牌中凑齐四种花色的 {rank}。",
    unknownCard: "尚未记录的牌",
  },
  "zh-TW": {
    pageTitle: "Holdem — 掬一捧的德州好牌圖鑑",
    skip: "跳至主要內容",
    navigation: "導覽",
    collection: "成就圖鑑",
    language: "選擇語言",
    heroTitle: "好牌，值得<br><span>被記住。</span>",
    heroDescription: "有些牌，千載難逢。<br>把牌桌上的高光時刻，收藏在這裡。",
    explore: "探索我的成就",
    personalBest: "個人最高成就",
    heroAria: "查看方塊皇家同花順的牌局詳情",
    royal: "皇家同花順",
    straightFlush: "同花順",
    quads: "四條金剛",
    spades: "黑桃",
    hearts: "紅心",
    clubs: "梅花",
    diamonds: "方塊",
    allSuits: "四種花色",
    unlocked: "已達成",
    locked: "未達成",
    statistics: "成就統計",
    totalProgress: "收藏進度",
    collectionTitle: "把傳奇，一手手集齊。",
    onlyUnlocked: "只看已達成",
    categoryFilter: "牌型篩選",
    all: "全部成就",
    emptyTitle: "下一份成就，等你來點亮",
    emptyDescription: "這個分類還沒有已達成的紀錄，先看看完整圖鑑吧。",
    showAll: "查看全部成就",
    footer: "讀懂牌局，做出更好的選擇。",
    royalDescription: "同一花色的 10 · J · Q · K · A",
    flushDescription: "同一花色的五張連牌，最高牌 10 至 K",
    quadsDescription: "四種花色，相同點數；10 至 A",
    count: "{count} 項成就",
    groupProgress: "{unlocked} / {total} 已達成",
    royalName: "{suit}皇家同花順",
    flushName: "{rank} 高同花順",
    quadsName: "{rank} 金剛",
    royalCode: "皇家",
    flushCode: "同花順",
    quadsCode: "金剛",
    highRange: "{low} — {high} · {suit}",
    quadsSubtitle: "四條 {rank} · 四種花色",
    viewAchievement: "{name}，{suit}，{state}，查看詳情",
    detailUnlocked: "已珍藏的高光時刻",
    detailLocked: "待點亮的成就",
    detailDescription: "{suit} · {range} · {state}",
    quadsDetailDescription: "四張 {rank} · {state}",
    close: "關閉詳情",
    tableLabel: "牌局回顧",
    lockedTableLabel: "等待你的這手好牌",
    holeCards: "我的起手牌",
    boardCards: "五張公共牌",
    twoCards: "2 張",
    fiveCards: "5 張",
    holeCaption: "從這兩張牌開始",
    boardCaption: "按紀錄順序顯示",
    winningLegend: "金色外框標記組成成就的牌",
    winningHand: "成就牌型",
    replay: "重播發牌",
    noHoleCaption: "等待你的起手牌",
    noBoardCaption: "等待完整牌局",
    noRecord: "尚無達成紀錄。下一次高光，也許就是這一手。",
    requirementLabel: "達成條件",
    royalRequirement: "在七張牌中湊齊 {suit} 10、J、Q、K、A。",
    flushRequirement: "在七張牌中湊齊 {suit} {ranks}。",
    quadsRequirement: "在七張牌中湊齊四種花色的 {rank}。",
    unknownCard: "尚未記錄的牌",
  },
  en: {
    pageTitle: "Holdem — 掬一捧’s Hold’em Hand Collection",
    skip: "Skip to main content",
    navigation: "Navigation",
    collection: "The collection",
    language: "Choose language",
    heroTitle: "Great hands.<br><span>Lasting stories.</span>",
    heroDescription:
      "Some hands come once in a lifetime.<br>Keep your unforgettable moments at the table, here.",
    explore: "Explore my collection",
    personalBest: "PERSONAL BEST",
    heroAria: "View the diamond royal flush hand",
    royal: "Royal flush",
    straightFlush: "Straight flush",
    quads: "Four of a kind",
    spades: "Spades",
    hearts: "Hearts",
    clubs: "Clubs",
    diamonds: "Diamonds",
    allSuits: "All four suits",
    unlocked: "Achieved",
    locked: "Unachieved",
    statistics: "Achievement statistics",
    totalProgress: "Collection progress",
    collectionTitle: "Legends, one hand at a time.",
    onlyUnlocked: "Achieved only",
    categoryFilter: "Filter by hand",
    all: "All hands",
    emptyTitle: "Your next achievement is waiting",
    emptyDescription:
      "No recorded hands in this category yet. Explore the full collection.",
    showAll: "View all achievements",
    footer: "Read the game. Make better decisions.",
    royalDescription: "10 · J · Q · K · A, all of one suit",
    flushDescription: "Five in a row, one suit. 10-high to K-high.",
    quadsDescription: "One rank, four suits. Tens through aces.",
    count: "{count} achievements",
    groupProgress: "{unlocked} / {total} achieved",
    royalName: "Royal flush · {suit}",
    flushName: "{rank}-high straight flush",
    quadsName: "Four {rank}",
    royalCode: "ROYAL",
    flushCode: "STRAIGHT FLUSH",
    quadsCode: "QUADS",
    highRange: "{low} — {high} · {suit}",
    quadsSubtitle: "Four of a kind · All suits",
    viewAchievement: "{name}, {suit}, {state}. View details",
    detailUnlocked: "A MOMENT TO REMEMBER",
    detailLocked: "A HAND STILL TO COME",
    detailDescription: "{suit} · {range} · {state}",
    quadsDetailDescription: "Four {rank} · {state}",
    close: "Close details",
    tableLabel: "THE HAND, UNFOLDED",
    lockedTableLabel: "YOUR NEXT GREAT HAND",
    holeCards: "My hole cards",
    boardCards: "The five community cards",
    twoCards: "2 cards",
    fiveCards: "5 cards",
    holeCaption: "Where the story started",
    boardCaption: "Shown in recorded order",
    winningLegend: "Gold outlines mark the cards in this achievement",
    winningHand: "THE ACHIEVEMENT HAND",
    replay: "Replay deal",
    noHoleCaption: "Your hole cards will appear here",
    noBoardCaption: "Waiting for your hand",
    noRecord: "No hand recorded yet. Your next great moment could be this one.",
    requirementLabel: "HOW TO ACHIEVE IT",
    royalRequirement: "Make 10, J, Q, K, A of {suit} from your seven cards.",
    flushRequirement: "Make {ranks} of {suit} from your seven cards.",
    quadsRequirement:
      "Make four {rank}, one of each suit, from your seven cards.",
    unknownCard: "Unrecorded card",
  },
};

for (const language of Object.keys(translations)) {
  Object.assign(
    translations[language],
    RANGE_TRANSLATIONS[language],
    ODDS_TRANSLATIONS[language],
  );
}

const CATEGORIES = [
  {
    id: "royal",
    label: "royal",
    description: "royalDescription",
    code: "royalCode",
    symbol: "♛",
  },
  {
    id: "straight-flush",
    label: "straightFlush",
    description: "flushDescription",
    code: "flushCode",
    symbol: "♠",
  },
  {
    id: "quads",
    label: "quads",
    description: "quadsDescription",
    code: "quadsCode",
    symbol: "♣",
  },
];
const suitMap = Object.fromEntries(SUITS.map((suit) => [suit.id, suit]));
const stats = getStats();
const uiState = {
  language: "zh-CN",
  view:
    location.hash === "#odds"
      ? "odds"
      : location.hash === "#ranges"
        ? "ranges"
        : "achievements",
  category: "all",
  onlyUnlocked: false,
  openAchievement: null,
};
try {
  const storedLanguage = localStorage.getItem("holdem.language");
  if (Object.hasOwn(translations, storedLanguage))
    uiState.language = storedLanguage;
} catch {
  /* File previews and private browsing may disable storage. */
}

const $ = (selector) => document.querySelector(selector);
const dialog = $("#achievement-dialog");
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const t = (key, values = {}) =>
  (
    translations[uiState.language][key] ??
    translations["zh-CN"][key] ??
    key
  ).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
const rangeExplorer = createRangeExplorer({
  element: $("#ranges-view"),
  translate: t,
  renderCard: cardMarkup,
});
const oddsCalculator = createOddsCalculator({
  element: $("#odds-view"),
  translate: t,
  renderCard: cardMarkup,
});
const titleKey = () =>
  ({ achievements: "pageTitle", ranges: "mPageTitle", odds: "cPageTitle" })[
    uiState.view
  ];

const padCount = (value) => String(value).padStart(2, "0");
const uiCardKey = (value) => `${value.rank}:${value.suit}`;

function icon(name) {
  const paths = {
    check: '<path d="m5 12 4 4L19 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    replay: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ""}</svg>`;
}

function quadRank(high) {
  if (uiState.language !== "en") return rankLabel(high);
  return { 10: "tens", 11: "jacks", 12: "queens", 13: "kings", 14: "aces" }[
    high
  ];
}

function achievementName(achievement, includeSuit = false) {
  if (achievement.category === "royal")
    return includeSuit
      ? t("royalName", { suit: t(achievement.suit) })
      : t("royal");
  if (achievement.category === "quads")
    return t("quadsName", { rank: quadRank(achievement.high) });
  return t("flushName", { rank: rankLabel(achievement.high) });
}

function achievementSubtitle(achievement) {
  if (achievement.category === "quads")
    return t("quadsSubtitle", { rank: rankLabel(achievement.high) });
  return t("highRange", {
    low: rankLabel(achievement.high - 4),
    high: rankLabel(achievement.high),
    suit: t(achievement.suit),
  });
}

function cardMarkup(value, options = {}) {
  const {
    index = 0,
    count = 5,
    fan = true,
    detail = false,
    winning = false,
    unused = false,
    back = false,
  } = options;
  const midpoint = (count - 1) / 2;
  const angle = fan ? (index - midpoint) * (detail ? 3 : 7) : 0;
  const y = fan ? Math.abs(index - midpoint) * (detail ? 2 : 3) : 0;
  const style = `--angle:${angle}deg;--y:${y}px;--deal-index:${options.dealIndex ?? index};--deal-offset:${(midpoint - index) * 36}`;
  if (back)
    return `<span class="playing-card card-back" style="${style}" role="img" aria-label="${t("unknownCard")}"><span class="card-pip" aria-hidden="true">♠</span></span>`;
  const suit = suitMap[value.suit];
  const royalClass = ["J", "Q", "K"].includes(value.rank) ? " royal-card" : "";
  const classes = `playing-card suit-${suit.id}${royalClass}${winning ? " is-winning" : ""}${unused ? " is-unused" : ""}`;
  return `<span class="${classes}" style="${style}" role="img" aria-label="${t(value.suit)} ${value.rank}" data-card="${uiCardKey(value)}"><span class="card-corner" aria-hidden="true">${value.rank}<span class="corner-suit">${suit.symbol}</span></span><span class="card-pip" aria-hidden="true">${suit.symbol}</span><span class="card-corner bottom" aria-hidden="true">${value.rank}<span class="corner-suit">${suit.symbol}</span></span>${winning ? '<span class="winning-dot" aria-hidden="true"></span>' : ""}</span>`;
}

function renderCard(achievement) {
  const achieved = Boolean(achievement.record);
  const stateText = t(achieved ? "unlocked" : "locked");
  const category = CATEGORIES.find(({ id }) => id === achievement.category);
  const id = padCount(ACHIEVEMENTS.indexOf(achievement) + 1);
  const label = t("viewAchievement", {
    name: achievementName(achievement),
    suit: t(achievement.suit ?? "allSuits"),
    state: stateText,
  });
  return `<button type="button" class="achievement-card ${achieved ? "is-unlocked" : "is-locked"}" data-achievement="${achievement.id}" data-category="${achievement.category}" aria-label="${escapeHtml(label)}" aria-haspopup="dialog"><span class="card-meta"><span class="achievement-id">${t(category.code)} · ${id}</span><span class="achievement-state">${icon(achieved ? "check" : "lock")}${stateText}</span></span><span class="mini-fan" aria-hidden="true">${achievement.cards.map((value, index) => cardMarkup(value, { index, count: achievement.cards.length })).join("")}</span><span class="achievement-bottom"><span><span class="achievement-name">${achievementName(achievement)}</span><span class="achievement-subtitle">${achievementSubtitle(achievement)}</span></span><span class="achievement-arrow" aria-hidden="true">↗</span></span></button>`;
}

function renderTabs() {
  $("#category-tabs").innerHTML = [{ id: "all", label: "all" }, ...CATEGORIES]
    .map(({ id, label }) => {
      const count = id === "all" ? stats.total : stats.byCategory[id].total;
      return `<button type="button" class="category-tab" data-category="${id}" aria-pressed="${uiState.category === id}" aria-controls="achievement-groups">${t(label)}<span class="tab-count">${count}</span></button>`;
    })
    .join("");
}

function renderGroups() {
  const visible = ACHIEVEMENTS.filter(
    (achievement) =>
      (uiState.category === "all" ||
        achievement.category === uiState.category) &&
      (!uiState.onlyUnlocked || achievement.record),
  );
  $("#achievement-groups").innerHTML = CATEGORIES.map((category) => {
    const items = visible.filter(
      (achievement) => achievement.category === category.id,
    );
    if (!items.length) return "";
    const categoryStats = stats.byCategory[category.id];
    return `<section class="achievement-group" aria-labelledby="group-${category.id}"><div class="group-heading"><span class="group-icon" aria-hidden="true">${category.symbol}</span><h3 id="group-${category.id}">${t(category.label)}</h3><span class="group-description">${t(category.description)}</span><span class="group-progress">${t("groupProgress", categoryStats)}</span></div><div class="achievement-grid">${items.map(renderCard).join("")}</div></section>`;
  }).join("");
  $("#results-count").textContent = t("count", { count: visible.length });
  $("#empty-state").hidden = visible.length > 0;
  $("#unlocked-only").checked = uiState.onlyUnlocked;
  document
    .querySelectorAll(".category-tab")
    .forEach((tab) =>
      tab.setAttribute(
        "aria-pressed",
        String(tab.dataset.category === uiState.category),
      ),
    );
}

function renderStatistics() {
  $("#total-count").textContent = padCount(stats.unlocked);
  $("#total-count").nextElementSibling.textContent = ` / ${stats.total}`;
  const percentage = Math.round((stats.unlocked / stats.total) * 100);
  const ring = $("#progress-ring");
  ring.style.background = `conic-gradient(var(--green) ${percentage}%,#e5e7dc 0)`;
  ring.innerHTML = `<span>${percentage}<small>%</small></span>`;
  for (const [category, element] of [
    ["royal", "#royal-count"],
    ["straight-flush", "#flush-count"],
    ["quads", "#quads-count"],
  ]) {
    const data = stats.byCategory[category];
    $(element).innerHTML =
      `${padCount(data.unlocked)}<span class="stat-denominator"> / ${padCount(data.total)}</span>`;
  }
}

function requirement(achievement) {
  const values = {
    suit: t(achievement.suit ?? "allSuits"),
    ranks: achievement.cards.map(({ rank }) => rank).join(" · "),
    rank: quadRank(achievement.high),
  };
  return t(
    achievement.category === "royal"
      ? "royalRequirement"
      : achievement.category === "quads"
        ? "quadsRequirement"
        : "flushRequirement",
    values,
  );
}

function detailHand(achievement, part) {
  const isHole = part === "hole";
  const count = isHole ? 2 : 5;
  const values = achievement.record
    ? achievement.record[part]
    : Array(count).fill(null);
  const winningKeys = new Set(achievement.cards.map(uiCardKey));
  return `<section class="hand-section"><h3>${t(isHole ? "holeCards" : "boardCards")}<small>${t(isHole ? "twoCards" : "fiveCards")}</small></h3><div class="detail-hand" data-hand="${part}">${values.map((value, index) => cardMarkup(value, { index, count, detail: true, dealIndex: index + (isHole ? 0 : 2), winning: Boolean(value && winningKeys.has(uiCardKey(value))), unused: Boolean(value && !winningKeys.has(uiCardKey(value))), back: !value })).join("")}</div><p class="hand-caption">${t(achievement.record ? (isHole ? "holeCaption" : "boardCaption") : isHole ? "noHoleCaption" : "noBoardCaption")}</p></section>`;
}

function renderDetail(achievement) {
  const achieved = Boolean(achievement.record);
  const description =
    achievement.category === "quads"
      ? t("quadsDetailDescription", {
          rank: quadRank(achievement.high),
          state: t(achieved ? "unlocked" : "locked"),
        })
      : t("detailDescription", {
          suit: t(achievement.suit),
          range: `${rankLabel(achievement.high - 4)} — ${rankLabel(achievement.high)}`,
          state: t(achieved ? "unlocked" : "locked"),
        });
  const result = achievement.cards
    .map(
      ({ rank, suit }) =>
        `<span class="result-card suit-${suit}">${rank}${suitMap[suit].symbol}</span>`,
    )
    .join(" ");
  $("#dialog-content").innerHTML =
    `<header class="detail-header"><div><div class="detail-eyebrow">${icon(achieved ? "check" : "lock")}${t(achieved ? "detailUnlocked" : "detailLocked")}</div><h2 id="detail-title">${achievementName(achievement, true)}</h2><p id="detail-description">${description}</p></div><button class="close-button" type="button" data-close-dialog aria-label="${t("close")}" autofocus>${icon("close")}</button></header><div class="detail-table"><div class="detail-table-top"><span>${t(achieved ? "tableLabel" : "lockedTableLabel")}</span><span aria-hidden="true">♠ ♥ ♣ ♦</span></div><div class="deal-layout">${detailHand(achievement, "hole")}${detailHand(achievement, "board")}</div>${achieved ? `<div class="table-legend"><span class="legend-dot" aria-hidden="true"></span>${t("winningLegend")}</div>` : `<p class="locked-record-note">${t("noRecord")}</p>`}</div>${achieved ? `<footer class="detail-footer"><div><span class="detail-result-label">${t("winningHand")}</span><span class="winning-result">${result}</span></div><button class="replay-button" type="button" data-replay>${icon("replay")}${t("replay")}</button></footer>` : `<footer class="detail-footer is-locked-footer"><span class="detail-result-label">${t("requirementLabel")}</span><p class="detail-requirement">${requirement(achievement)}</p></footer>`}`;
}

function openAchievement(id) {
  const achievement = ACHIEVEMENTS.find((item) => item.id === id);
  if (!achievement) return;
  uiState.openAchievement = id;
  renderDetail(achievement);
  document.body.classList.add("dialog-open");
  dialog.showModal();
}

function setLanguage(language) {
  if (!Object.hasOwn(translations, language)) return;
  uiState.language = language;
  document.documentElement.lang = language;
  document.documentElement.classList.toggle("en", language === "en");
  document.title = t(titleKey());
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    // Markup is restricted to these local editorial strings; no user HTML is rendered.
    const key = element.dataset.i18n;
    if (["heroTitle", "heroDescription"].includes(key))
      element.innerHTML = t(key);
    else element.textContent = t(key);
  });
  document
    .querySelectorAll("[data-i18n-aria]")
    .forEach((element) =>
      element.setAttribute("aria-label", t(element.dataset.i18nAria)),
    );
  $("#language").value = language;
  $("#language").setAttribute("aria-label", t("language"));
  enhanceSelects($(".language-picker"));
  rangeExplorer.render();
  oddsCalculator.render();
  renderStatistics();
  renderTabs();
  renderGroups();
  $("#hero-fan").innerHTML = ACHIEVEMENTS.find(
    ({ id }) => id === "royal-diamonds",
  )
    .cards.map((value, index) => cardMarkup(value, { index }))
    .join("");
  if (uiState.openAchievement)
    renderDetail(ACHIEVEMENTS.find(({ id }) => id === uiState.openAchievement));
  try {
    localStorage.setItem("holdem.language", language);
  } catch {
    /* The page remains usable without storage. */
  }
}

$("#language").addEventListener("change", (event) =>
  setLanguage(event.target.value),
);
$("#category-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-category]");
  if (!tab) return;
  uiState.category = tab.dataset.category;
  renderGroups();
});
$("#unlocked-only").addEventListener("change", (event) => {
  uiState.onlyUnlocked = event.target.checked;
  renderGroups();
});
$("#reset-filters").addEventListener("click", () => {
  uiState.category = "all";
  uiState.onlyUnlocked = false;
  renderGroups();
});
$("#achievement-groups").addEventListener("click", (event) => {
  const button = event.target.closest("[data-achievement]");
  if (button) openAchievement(button.dataset.achievement);
});
$("#hero-achievement").addEventListener("click", () =>
  openAchievement("royal-diamonds"),
);
dialog.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-dialog]")) dialog.close();
  if (event.target.closest("[data-replay]")) {
    // Restart only the deal animations so focus stays on the replay button.
    for (const animation of dialog.getAnimations({ subtree: true })) {
      if (animation.animationName === "deal-card") {
        animation.cancel();
        animation.play();
      }
    }
  }
});
let pointerStartedOnBackdrop = false;
dialog.addEventListener("pointerdown", (event) => {
  const rect = dialog.getBoundingClientRect();
  pointerStartedOnBackdrop =
    event.target === dialog &&
    (event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom);
});
dialog.addEventListener("pointerup", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (
    pointerStartedOnBackdrop &&
    event.target === dialog &&
    (event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom)
  )
    dialog.close();
  pointerStartedOnBackdrop = false;
});
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const buttons = [...dialog.querySelectorAll("button:not([disabled])")];
  const first = buttons[0];
  const last = buttons.at(-1);
  if (!first) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
dialog.addEventListener("close", () => {
  uiState.openAchievement = null;
  document.body.classList.remove("dialog-open");
});

function syncView() {
  const previousView = uiState.view;
  if (location.hash === "#ranges") uiState.view = "ranges";
  else if (location.hash === "#odds") uiState.view = "odds";
  else if (["", "#", "#collection"].includes(location.hash))
    uiState.view = "achievements";
  if (previousView !== uiState.view) {
    if (dialog.open) dialog.close();
    oddsCalculator.closePicker();
  }
  $("#achievements-view").hidden = uiState.view !== "achievements";
  $("#ranges-view").hidden = uiState.view !== "ranges";
  $("#odds-view").hidden = uiState.view !== "odds";
  document.querySelectorAll("[data-view]").forEach((link) => {
    const selected = link.dataset.view === uiState.view;
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.title = t(titleKey());
  if (previousView !== uiState.view)
    window.scrollTo({ top: 0, behavior: "instant" });
}
window.addEventListener("hashchange", syncView);
$(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  const main = $("#main-content");
  main.tabIndex = -1;
  main.focus({ preventScroll: true });
  main.scrollIntoView({ behavior: "instant" });
});
setLanguage(uiState.language);
syncView();
