import { createRangeExplorer } from "./range-ui.js";
import { enhanceSelects } from "./select-menu.js";
import { RANGE_TRANSLATIONS } from "./range-i18n.mjs";
import { createOddsCalculator } from "./odds-ui.js";
import { ODDS_TRANSLATIONS, ODDS_CATEGORY_KEYS } from "./odds-i18n.mjs";
import { SUITS, ACHIEVEMENTS, rankLabel, getStats, getRecords, getOpponentHand } from "./catalog.mjs";
import { CLOSE_ICON } from "./icons.mjs";
import { createHandReview } from "./review-ui.js";
import { REVIEW_TRANSLATIONS } from "./review-i18n.mjs";

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
    emptyTitle: "暂无已达成成就",
    showAll: "查看全部",
    footer: "收藏好牌，记录高光。",
    royalDescription: "",
    flushDescription: "10–K",
    quadsDescription: "2–A",
    count: "{count} 项成就",
    groupProgress: "{unlocked} / {total} 已达成",
    royalName: "{suit}皇家同花顺",
    flushName: "{rank} 高同花顺",
    flushSuitName: "{suit} {rank} 高同花顺",
    quadsName: "{rank} 金刚",
    viewAchievement: "{name}，{state}，查看详情",
    achievedDate: "成就达成日期",
    moreHits: "+{count} 次",
    hitCount: "达成 {count} 次",
    recordLabel: "{date}，记录 {index}",
    unknownDate: "日期未记录",
    opponentCards: "对手手牌",
    opponentResult: "对手",
    close: "关闭详情",
    holeCards: "我的手牌",
    boardCards: "公共牌",
    replay: "重播发牌",
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
    emptyTitle: "暫無已達成成就",
    showAll: "查看全部",
    footer: "收藏好牌，記錄高光。",
    royalDescription: "",
    flushDescription: "10–K",
    quadsDescription: "2–A",
    count: "{count} 項成就",
    groupProgress: "{unlocked} / {total} 已達成",
    royalName: "{suit}皇家同花順",
    flushName: "{rank} 高同花順",
    flushSuitName: "{suit} {rank} 高同花順",
    quadsName: "{rank} 金剛",
    viewAchievement: "{name}，{state}，查看詳情",
    achievedDate: "成就達成日期",
    moreHits: "+{count} 次",
    hitCount: "達成 {count} 次",
    recordLabel: "{date}，紀錄 {index}",
    unknownDate: "日期未記錄",
    opponentCards: "對手手牌",
    opponentResult: "對手",
    close: "關閉詳情",
    holeCards: "我的手牌",
    boardCards: "公共牌",
    replay: "重播發牌",
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
    emptyTitle: "No achievements yet",
    showAll: "View all",
    footer: "Keep great hands. Remember the moments.",
    royalDescription: "",
    flushDescription: "10–K",
    quadsDescription: "2–A",
    count: "{count} achievements",
    groupProgress: "{unlocked} / {total} achieved",
    royalName: "Royal flush · {suit}",
    flushName: "{rank}-high straight flush",
    flushSuitName: "{rank}-high straight flush · {suit}",
    quadsName: "Four {rank}",
    viewAchievement: "{name}, {state}. View details",
    achievedDate: "Achievement dates",
    moreHits: "+{count} more",
    hitCount: "Achieved {count} times",
    recordLabel: "{date}, record {index}",
    unknownDate: "Date unrecorded",
    opponentCards: "Opponent",
    opponentResult: "Opponent",
    close: "Close details",
    holeCards: "My hand",
    boardCards: "Board",
    replay: "Replay deal",
    unknownCard: "Unrecorded card",
  },
};

for (const language of Object.keys(translations)) {
  Object.assign(
    translations[language],
    RANGE_TRANSLATIONS[language],
    ODDS_TRANSLATIONS[language],
    REVIEW_TRANSLATIONS[language],
  );
}

const CATEGORIES = [
  {
    id: "royal",
    label: "royal",
    description: "royalDescription",
    symbol: "♛",
  },
  {
    id: "straight-flush",
    label: "straightFlush",
    description: "flushDescription",
    symbol: "♠",
  },
  {
    id: "quads",
    label: "quads",
    description: "quadsDescription",
    symbol: "♣",
  },
];
const suitMap = Object.fromEntries(SUITS.map((suit) => [suit.id, suit]));
const stats = getStats();
const uiState = {
  language: "zh-CN",
  view:
    location.hash === "#review"
      ? "review"
      : location.hash === "#odds"
      ? "odds"
      : location.hash === "#ranges"
        ? "ranges"
        : "achievements",
  category: "all",
  onlyUnlocked: false,
  openAchievement: null,
  openRecordIndex: 0,
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
const handReview = createHandReview({
  element: $("#review-view"),
  translate: t,
  renderCard: cardMarkup,
  getLanguage: () => uiState.language,
});
const titleKey = () =>
  ({ achievements: "pageTitle", ranges: "mPageTitle", odds: "cPageTitle", review: "rPageTitle" })[
    uiState.view
  ];

const padCount = (value) => String(value).padStart(2, "0");
const uiCardKey = (value) => `${value.rank}:${value.suit}`;

function icon(name) {
  if (name === "close") return CLOSE_ICON;
  const paths = {
    check: '<path d="m5 12 4 4L19 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    replay: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ""}</svg>`;
}

function quadRank(high) {
  if (uiState.language !== "en") return rankLabel(high);
  return {
    2: "twos",
    3: "threes",
    4: "fours",
    5: "fives",
    6: "sixes",
    7: "sevens",
    8: "eights",
    9: "nines",
    10: "tens",
    11: "jacks",
    12: "queens",
    13: "kings",
    14: "aces",
  }[high];
}

function achievementName(achievement, includeSuit = false) {
  if (achievement.category === "royal")
    return includeSuit
      ? t("royalName", { suit: t(achievement.suit) })
      : t("royal");
  if (achievement.category === "quads")
    return t("quadsName", { rank: quadRank(achievement.high) });
  return t(includeSuit ? "flushSuitName" : "flushName", {
    rank: rankLabel(achievement.high),
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

function formatRecordDate(record) {
  if (!record?.date) return t("unknownDate");
  return new Intl.DateTimeFormat(uiState.language, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${record.date}T00:00:00Z`));
}

function recordDateMarkup(record, className = "") {
  const date = formatRecordDate(record);
  return record.date
    ? `<time class="${className}" datetime="${record.date}">${date}</time>`
    : `<span class="${className}">${date}</span>`;
}

function achievementDates(records, className = "achievement-dates") {
  if (!records.length) return "";
  return `<span class="${className}"><span class="achievement-dates-label">${t("achievedDate")}</span><span class="achievement-dates-values">${recordDateMarkup(records[0], "achievement-date")}${records.length > 1 ? `<span class="achievement-hit-count">${t("moreHits", { count: records.length - 1 })}</span>` : ""}</span></span>`;
}

function recordHistory(records) {
  if (!records.length) return "";
  const dates = records.length === 1
    ? recordDateMarkup(records[0], "detail-date")
    : records.map((record, index) => {
        const sameDate = records.filter((item) => item.date === record.date);
        const occurrence = records.slice(0, index + 1).filter((item) => item.date === record.date).length;
        const label = t("recordLabel", { date: formatRecordDate(record), index: index + 1 });
        return `<button type="button" class="record-date" data-record-index="${index}" aria-pressed="${uiState.openRecordIndex === index}" aria-label="${escapeHtml(label)}">${recordDateMarkup(record)}${sameDate.length > 1 ? `<span class="record-occurrence"> · ${occurrence}</span>` : ""}</button>`;
      }).join("");
  return `<div class="record-history"><span class="record-history-label" id="record-history-label">${t("achievedDate")}</span><div class="record-dates" role="group" aria-labelledby="record-history-label">${dates}</div></div>`;
}

function renderCard(achievement) {
  const records = getRecords(achievement);
  const achieved = records.length > 0;
  const stateText = t(achieved ? "unlocked" : "locked");
  const label = t("viewAchievement", {
    name: achievementName(achievement, true),
    state: [stateText, records.length ? `${t("achievedDate")} ${formatRecordDate(records[0])}` : "", records.length > 1 ? t("hitCount", { count: records.length }) : ""].filter(Boolean).join(" · "),
  });
  return `<button type="button" class="achievement-card ${achieved ? "is-unlocked" : "is-locked"}" data-achievement="${achievement.id}" data-category="${achievement.category}" aria-label="${escapeHtml(label)}" aria-haspopup="dialog"><span class="card-meta" aria-hidden="true"><span class="achievement-state" title="${stateText}">${icon(achieved ? "check" : "lock")}</span></span><span class="mini-fan" aria-hidden="true">${achievement.cards.map((value, index) => cardMarkup(value, { index, count: achievement.cards.length })).join("")}</span><span class="achievement-bottom"><span><span class="achievement-name">${achievementName(achievement, true)}</span>${achievementDates(records)}</span><span class="achievement-arrow" aria-hidden="true">↗</span></span></button>`;
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
      (!uiState.onlyUnlocked || getRecords(achievement).length > 0),
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

function detailHand(achievement, record, part) {
  const isBoard = part === "board";
  const isOpponent = part === "opponent";
  const count = isBoard ? 5 : 2;
  const values = record[part];
  const winningKeys = new Set(achievement.cards.map(uiCardKey));
  const title = isBoard ? "boardCards" : isOpponent ? "opponentCards" : "holeCards";
  const dealOffset = isBoard ? (record.opponent ? 4 : 2) : isOpponent ? 2 : 0;
  return `<section class="hand-section${isBoard ? " hand-section-board" : ""}"><h3>${t(title)}</h3><div class="detail-hand" data-hand="${part}">${values.map((value, index) => cardMarkup(value, { index, count, detail: true, dealIndex: index + dealOffset, winning: !isOpponent && winningKeys.has(uiCardKey(value)), unused: !isOpponent && !winningKeys.has(uiCardKey(value)) })).join("")}</div></section>`;
}

function resultCards(cards) {
  return cards.map(({ rank, suit }) =>
    `<span class="result-card suit-${suit}" role="img" aria-label="${t(suit)} ${rank}">${rank}${suitMap[suit].symbol}</span>`,
  ).join(" ");
}

function renderDetail(achievement) {
  const records = getRecords(achievement);
  uiState.openRecordIndex = Math.min(uiState.openRecordIndex, Math.max(0, records.length - 1));
  const record = records[uiState.openRecordIndex];
  const achieved = Boolean(record);
  const opponentHand = getOpponentHand(achievement, record);
  const opponentResult = opponentHand
    ? `<div class="opponent-result-hand"><strong>${t("opponentResult")} · ${t(ODDS_CATEGORY_KEYS[opponentHand.category])}</strong><span class="winning-result">${resultCards(opponentHand.bestCards)}</span></div>`
    : "";
  const table = achieved
    ? `<div class="deal-layout ${opponentHand ? "has-opponent" : "no-opponent"}">${detailHand(achievement, record, "hole")}${opponentHand ? detailHand(achievement, record, "opponent") : ""}${detailHand(achievement, record, "board")}</div>`
    : `<div class="detail-hand target-hand">${achievement.cards.map((value, index) => cardMarkup(value, { index, count: achievement.cards.length, detail: true })).join("")}</div>`;
  $("#dialog-content").innerHTML =
    `<header class="detail-header"><div><h2 id="detail-title">${achievementName(achievement, true)}</h2>${recordHistory(records)}${!achieved ? `<p class="detail-state">${t("locked")}</p>` : ""}</div><button class="close-button" type="button" data-close-dialog aria-label="${t("close")}" autofocus>${icon("close")}</button></header><div class="detail-table">${table}</div>${achieved ? `<footer class="detail-footer">${opponentResult}<button class="replay-button" type="button" data-replay>${icon("replay")}${t("replay")}</button></footer>` : ""}`;
}

function openAchievement(id) {
  const achievement = ACHIEVEMENTS.find((item) => item.id === id);
  if (!achievement) return;
  uiState.openAchievement = id;
  uiState.openRecordIndex = 0;
  renderDetail(achievement);
  document.body.classList.add("dialog-open");
  dialog.showModal();
}

function renderFooter() {
  const key = { achievements: "footer", ranges: "mFooter", odds: "cFooter", review: "rFooter" }[uiState.view];
  $("#footer-copy").textContent = t(key);
}

function setLanguage(language) {
  if (!Object.hasOwn(translations, language)) return;
  uiState.language = language;
  document.documentElement.lang = language;
  document.documentElement.classList.toggle("en", language === "en");
  document.title = t(titleKey());
  renderFooter();
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
  handReview.render();
  renderStatistics();
  renderTabs();
  renderGroups();
  const heroAchievement = ACHIEVEMENTS.find(
    ({ id }) => id === "royal-diamonds",
  );
  $("#hero-name").textContent = achievementName(heroAchievement, true);
  $("#hero-date").innerHTML = achievementDates(getRecords(heroAchievement), "hero-dates");
  $("#hero-fan").innerHTML = heroAchievement.cards
    .map((value, index) => cardMarkup(value, { index }))
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
  const recordButton = event.target.closest("[data-record-index]");
  if (recordButton) {
    const achievement = ACHIEVEMENTS.find(({ id }) => id === uiState.openAchievement);
    const index = Number(recordButton.dataset.recordIndex);
    if (!achievement || !Number.isInteger(index) || index < 0 || index >= getRecords(achievement).length)
      return;
    uiState.openRecordIndex = index;
    renderDetail(achievement);
    dialog.querySelector(`[data-record-index="${index}"]`).focus({ preventScroll: true });
  }
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
  uiState.openRecordIndex = 0;
  document.body.classList.remove("dialog-open");
});

function syncView() {
  const previousView = uiState.view;
  if (location.hash === "#ranges") uiState.view = "ranges";
  else if (location.hash === "#odds") uiState.view = "odds";
  else if (location.hash === "#review") uiState.view = "review";
  else if (["", "#", "#collection"].includes(location.hash))
    uiState.view = "achievements";
  if (previousView !== uiState.view) {
    if (dialog.open) dialog.close();
    oddsCalculator.closePicker();
  }
  $("#achievements-view").hidden = uiState.view !== "achievements";
  $("#ranges-view").hidden = uiState.view !== "ranges";
  $("#odds-view").hidden = uiState.view !== "odds";
  $("#review-view").hidden = uiState.view !== "review";
  document.querySelectorAll("[data-view]").forEach((link) => {
    const selected = link.dataset.view === uiState.view;
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.title = t(titleKey());
  renderFooter();
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
