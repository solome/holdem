import { ACHIEVEMENTS, SUITS, rankLabel, getStats, getRecords, getOpponentHand } from "./catalog.mjs";
import { ODDS_CATEGORY_KEYS } from "./hand-category-i18n.mjs";
import { CLOSE_ICON } from "./icons.mjs";
import { uiCardKey } from "./card-markup.js";

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
export function createAchievements({ translate: t, renderCard: cardMarkup, getLanguage }) {
  const uiState = {
    category: "all",
    onlyUnlocked: false,
    openAchievement: null,
    openRecordIndex: 0,
  };
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
  const padCount = (value) => String(value).padStart(2, "0");
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
    if (getLanguage() !== "en") return rankLabel(high);
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

  function formatRecordDate(record) {
    if (!record?.date) return t("unknownDate");
    return new Intl.DateTimeFormat(getLanguage(), {
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

  return { render() {
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
  } };
}
