import { ODDS_CATEGORIES, ODDS_DECK, calculateOdds } from "./poker-odds.mjs";
import { ODDS_CATEGORY_KEYS as CATEGORY_KEYS } from "./odds-i18n.mjs";
import { CLOSE_ICON } from "./icons.mjs";
import {
  createCardSelection,
  activateSelectionSlot,
  pickSelectionCard,
  clearSelectionCard,
  commitCardSelection,
} from "./odds-selection.mjs";
const PICKER_SUITS = [
  { id: "spades", symbol: "♠", label: "cSpades" },
  { id: "hearts", symbol: "♥", label: "cHearts" },
  { id: "clubs", symbol: "♣", label: "cClubs" },
  { id: "diamonds", symbol: "♦", label: "cDiamonds" },
];
const PICKER_RANKS = [
  "A",
  "K",
  "Q",
  "J",
  "10",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
];
const keyOf = (card) => `${card.rank}:${card.suit}`;
const deckByKey = new Map(ODDS_DECK.map((card) => [keyOf(card), card]));
const emptyCards = (count) => Array(count).fill(null);
const percentage = (value) => `${(value * 100).toFixed(2)}%`;

export function createOddsCalculator({ element, translate, renderCard }) {
  const t = translate;
  const state = {
    hero: emptyCards(2),
    board: emptyCards(5),
    villain: emptyCards(2),
    stage: 3,
    useVillain: false,
    sort: "probability",
    player: "hero",
    result: null,
    busy: false,
    error: false,
    version: 0,
    picker: null,
    pickerSuit: "all",
    pickerError: false,
    undo: null,
  };
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const groupLabel = (group) =>
    t({ hero: "cHero", board: "cBoard", villain: "cVillain" }[group]);
  const knownCards = () =>
    [
      ...state.hero,
      ...state.board.slice(0, state.stage),
      ...(state.useVillain ? state.villain : []),
    ].filter(Boolean);
  const complete = () =>
    state.hero.every(Boolean) &&
    state.board.slice(0, state.stage).every(Boolean) &&
    (!state.useVillain || state.villain.every(Boolean));
  const cardName = (card) =>
    `${t(PICKER_SUITS.find((suit) => suit.id === card.suit).label)} ${card.rank}`;

  function invalidate() {
    state.version += 1;
    state.result = null;
    state.busy = false;
    state.error = false;
  }

  function slots(group, count) {
    return `<div class="odds-card-slots ${group === "board" ? "board-slots" : ""}">${state[
      group
    ]
      .slice(0, count)
      .map(
        (card, index) =>
          `<div class="odds-slot-wrap"><button type="button" class="odds-card-slot${card ? " is-filled" : ""}" data-slot-group="${group}" data-slot-index="${index}" aria-haspopup="dialog" aria-label="${escape(t(card ? "cReplaceCard" : "cSelectCard", { target: groupLabel(group), index: index + 1, card: card ? cardName(card) : "" }))}">${card ? renderCard(card, { fan: false }) : `<span class="slot-plus" aria-hidden="true">+</span><span>${t("cEmptyCard")}</span>`}</button></div>`,
      )
      .join("")}</div>`;
  }

  function readiness() {
    if (
      !state.hero.every(Boolean) ||
      !state.board.slice(0, state.stage).every(Boolean)
    )
      return t("cRequired", { count: state.stage });
    if (state.useVillain && !state.villain.every(Boolean))
      return t("cVillainRequired");
    return t("cReady");
  }

  function showdown() {
    if (!state.result?.showdown) return "";
    const { wins, ties, losses, equity } = state.result.showdown;
    const total = state.result.totalOutcomes;
    return `<section class="odds-showdown" aria-labelledby="showdown-heading"><div class="odds-panel-heading"><h2 id="showdown-heading">${t("cShowdown")}</h2><span class="odds-chip">${t("cHeadsUp")}</span></div><div class="showdown-stats"><div><span>${t("cWin")}</span><strong class="win-value">${percentage(wins / total)}</strong></div><div><span>${t("cTie")}</span><strong>${percentage(ties / total)}</strong></div><div><span>${t("cLose")}</span><strong>${percentage(losses / total)}</strong></div></div><div class="showdown-bar" aria-hidden="true"><span class="bar-win" style="width:${(wins / total) * 100}%"></span><span class="bar-tie" style="width:${(ties / total) * 100}%"></span><span class="bar-loss" style="width:${(losses / total) * 100}%"></span></div><div class="equity-line"><span>${t("cEquity")} <strong>${percentage(equity)}</strong></span><small>${t("cEquityNote")}</small></div></section>`;
  }

  function distribution() {
    const result = state.result;
    const playerResult = result?.[state.player];
    const counts = playerResult?.counts;
    const categories = [...ODDS_CATEGORIES].sort((a, b) =>
      state.sort === "probability" && counts
        ? counts[b] - counts[a] ||
          ODDS_CATEGORIES.indexOf(b) - ODDS_CATEGORIES.indexOf(a)
        : ODDS_CATEGORIES.indexOf(b) - ODDS_CATEGORIES.indexOf(a),
    );
    return `<section class="odds-distribution" aria-labelledby="distribution-heading"><div class="odds-panel-heading"><h2 id="distribution-heading">${t("cResults")}</h2><div class="odds-sort" role="group" aria-label="${t("cSort")}"><button type="button" data-odds-sort="probability" aria-pressed="${state.sort === "probability"}">${t("cByProbability")}</button><button type="button" data-odds-sort="strength" aria-pressed="${state.sort === "strength"}">${t("cByStrength")}</button></div></div>${result?.villain ? `<div class="distribution-players" role="group" aria-label="${t("cCompare")}"><button type="button" data-distribution-player="hero" aria-pressed="${state.player === "hero"}">${t("cHeroDistribution")}</button><button type="button" data-distribution-player="villain" aria-pressed="${state.player === "villain"}">${t("cOpponentDistribution")}</button></div>` : ""}${result ? `<div class="odds-result-context"><span class="odds-exact-dot" aria-hidden="true"></span>${t("cExact")}<span>·</span>${t("cTotalOutcomes", { count: result.totalOutcomes.toLocaleString() })}</div>` : `<div class="odds-empty"><span aria-hidden="true">♠</span><div><strong>${t("cNoResults")}</strong><p>${readiness()}</p></div></div>`}<table class="odds-probability-table"><thead><tr><th scope="col">${t("cCategory")}</th><th scope="col">${t("cProbability")}</th><th scope="col">${t("cOutcomes")}</th></tr></thead><tbody>${categories
      .map((category) => {
        const count = counts?.[category];
        const probability = result ? count / result.totalOutcomes : 0;
        return `<tr data-odds-category="${category}" data-probability="${probability}" class="${count === 0 ? "zero-probability" : ""}"><th scope="row"><span class="hand-strength-mark" aria-hidden="true">${String(ODDS_CATEGORIES.indexOf(category) + 1).padStart(2, "0")}</span>${t(CATEGORY_KEYS[category])}</th><td><div class="probability-meter"><span aria-hidden="true" style="width:${probability * 100}%"></span><strong>${result ? percentage(probability) : "—"}</strong></div></td><td>${result ? count.toLocaleString() : "—"}</td></tr>`;
      })
      .join(
        "",
      )}</tbody>${result ? `<tfoot><tr><th scope="row">${t("cPercentageTotal")}</th><td>100.00%</td><td>${result.totalOutcomes.toLocaleString()}</td></tr></tfoot>` : ""}</table><div class="odds-distribution-note"><span>${t("cFinalHand")}</span><p>${t("cDistributionNote")} ${t("cRounding")}</p></div>${playerResult ? `<div class="current-hand"><div><span>${t("cCurrentHand")}</span><strong>${t(CATEGORY_KEYS[playerResult.current.category])}</strong></div><div class="current-hand-cards">${playerResult.current.bestCards.map((card) => renderCard(card, { fan: false })).join("")}</div></div>` : ""}</section>`;
  }

  const slotSelector = (group, index) =>
    `[data-slot-group="${group}"][data-slot-index="${index}"]`;
  const dealSignature = () => JSON.stringify([
    state.hero, state.board, state.villain, state.stage, state.useVillain,
  ]);

  function changeDeal(update, focusSelector) {
    const before = dealSignature();
    const previous = {
      hero: state.hero.map((card) => card && { ...card }),
      board: state.board.map((card) => card && { ...card }),
      villain: state.villain.map((card) => card && { ...card }),
      stage: state.stage,
      useVillain: state.useVillain,
      player: state.player,
      result: state.result,
      error: state.error,
    };
    update();
    if (dealSignature() !== before) {
      state.undo = previous;
      invalidate();
    }
    render(focusSelector);
  }

  function undoChange() {
    if (!state.undo) return;
    const previous = state.undo;
    invalidate();
    Object.assign(state, previous);
    state.undo = null;
    render(slotSelector("hero", 0));
  }

  function removeCard(group, index) {
    if (!state[group]?.[index]) return;
    changeDeal(() => { state[group][index] = null; }, slotSelector(group, index));
  }

  function closePicker({ restoreFocus = true } = {}) {
    const picker = element.querySelector(".card-picker");
    const selection = state.picker;
    state.picker = null;
    state.pickerError = false;
    if (picker?.open) picker.close();
    document.body.classList.remove("card-picker-open");
    if (restoreFocus && selection)
      element.querySelector(slotSelector(selection.group, selection.originIndex))?.focus({ preventScroll: true });
  }

  function render(focusSelector) {
    closePicker({ restoreFocus: false });
    element.innerHTML = `<header class="odds-page-header"><h1 id="odds-title">${t("cTitle")}</h1><span>${t("cFinalHand")}<i aria-hidden="true">·</i>${t("cExact")}</span></header><div class="odds-layout"><section class="odds-input-panel" aria-label="${t("cKnownCards")}"><div class="odds-panel-heading"><h2>${t("cHero")}</h2><button type="button" class="odds-text-button" data-odds-example>${t("cExample")}</button></div>${slots("hero", 2)}<div class="odds-board-heading"><h2>${t("cBoard")}</h2><div class="odds-stage" role="group" aria-label="${t("cStage")}">${[3, 4, 5].map((stage) => `<button type="button" data-odds-stage="${stage}" aria-pressed="${state.stage === stage}">${t({ 3: "cFlop", 4: "cTurn", 5: "cRiver" }[stage])}<span>${stage}</span></button>`).join("")}</div></div>${slots("board", state.stage)}<div class="odds-villain-heading"><h2>${t("cVillain")}</h2><label class="odds-villain-toggle"><input type="checkbox" id="odds-use-villain" ${state.useVillain ? "checked" : ""}><span class="odds-toggle-track" aria-hidden="true"></span><span>${t(state.useVillain ? "cHeadsUp" : "cAddVillain")}</span></label></div>${state.useVillain ? slots("villain", 2) : `<p class="odds-opponent-note">${t("cNoOpponent")}</p>`}<div class="odds-form-actions"><button type="button" class="odds-calculate" data-odds-calculate ${!complete() || state.busy ? "disabled" : ""}>${t(state.busy ? "cCalculating" : "cCalculate")}<span aria-hidden="true">${state.busy ? "…" : "↗"}</span></button><button type="button" class="odds-reset" data-odds-reset>${t("cReset")}</button>${state.undo ? `<button type="button" class="odds-undo" data-odds-undo aria-label="${t("cUndoLabel")}">${t("cUndo")}</button>` : ""}</div><p class="odds-input-status${state.error ? " is-error" : ""}" role="status">${state.error ? t("cError") : state.result ? t("cResultStatus", { count: state.result.totalOutcomes.toLocaleString() }) : readiness()}</p><div class="odds-deck-count"><span>${t("cKnownCards")} <strong>${knownCards().length}</strong></span><span>${t("cRemainingCards", { count: 52 - knownCards().length })}</span></div></section><div class="odds-output" aria-busy="${state.busy}">${showdown()}${distribution()}</div></div><details class="odds-method"><summary>${t("cMethod")}<span aria-hidden="true">+</span></summary><p>${t("cCardRule")}</p><p>${t("cMethodNote")}</p><a href="https://www.pokerstars.com/poker/learn/lesson/poker-hand-rankings/" target="_blank" rel="noopener noreferrer">${t("cRankReference")} ↗</a></details><p class="odds-live-region" aria-live="polite">${state.result ? t("cResultStatus", { count: state.result.totalOutcomes.toLocaleString() }) : ""}</p><dialog class="card-picker" aria-labelledby="card-picker-title"><div class="card-picker-content"></div></dialog>`;
    const picker = element.querySelector(".card-picker");
    picker.addEventListener("cancel", (event) => {
      event.preventDefault();
      closePicker();
    });
    picker.addEventListener("close", () => {
      // A queued close can belong to a discarded dialog or an earlier opening.
      if (!picker.isConnected || picker.open || !state.picker) return;
      closePicker();
    });
    let backdropStart = false;
    const outside = (event) => {
      const rect = picker.getBoundingClientRect();
      return (
        event.target === picker &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom)
      );
    };
    picker.addEventListener("pointerdown", (event) => {
      backdropStart = outside(event);
    });
    picker.addEventListener("pointerup", (event) => {
      if (backdropStart && outside(event)) closePicker();
      backdropStart = false;
    });
    if (focusSelector)
      element.querySelector(focusSelector)?.focus({ preventScroll: true });
  }

  function renderPicker(focusSelector, resetScroll = false) {
    if (!state.picker) return;
    const { group, index, cards, blockedKeys } = state.picker;
    const selectedKeys = new Set(cards.filter(Boolean).map(keyOf));
    const scrollTop = resetScroll ? 0 : element.querySelector(".card-picker-deck")?.scrollTop ?? 0;
    const selectionSlots = cards.map((card, slotIndex) => {
      const label = t("cDraftSlot", { target: groupLabel(group), index: slotIndex + 1, card: card ? cardName(card) : t("cEmptyCard") });
      return `<div class="picker-slot-wrap"><button type="button" class="picker-slot" data-picker-slot="${slotIndex}" aria-pressed="${index === slotIndex}" aria-label="${escape(label)}"><small class="picker-slot-number">${slotIndex + 1}</small>${card ? renderCard(card, { fan: false }) : `<span class="slot-plus" aria-hidden="true">+</span>`}</button></div>`;
    }).join("");
    element.querySelector(".card-picker-content").innerHTML =
      `<header class="card-picker-header"><div><h2 id="card-picker-title">${t("cPickTitle")}</h2><p role="status">${t("cPickerFor", { target: groupLabel(group), index: index + 1 })}</p></div><button type="button" class="card-picker-close" data-picker-close aria-label="${t("cClose")}">${CLOSE_ICON}</button></header><div class="picker-selection"><div class="picker-selection-slots" role="group" aria-label="${groupLabel(group)}">${selectionSlots}</div><p class="picker-selection-hint">${t("cPickerHint")}</p>${state.pickerError ? `<p class="picker-error" role="alert">${t("cPickerError")}</p>` : ""}</div><div class="picker-suit-filters" role="group" aria-label="${t("cAllSuits")}"><button type="button" data-picker-suit="all" aria-pressed="${state.pickerSuit === "all"}">${t("cAllSuits")}</button>${PICKER_SUITS.map((suit) => `<button type="button" class="suit-${suit.id}" data-picker-suit="${suit.id}" aria-pressed="${state.pickerSuit === suit.id}" aria-label="${t(suit.label)}">${suit.symbol}</button>`).join("")}</div><div class="card-picker-deck">${PICKER_SUITS.filter(
        (suit) => state.pickerSuit === "all" || state.pickerSuit === suit.id,
      )
        .map(
          (suit) =>
            `<section class="picker-suit-group"><h3 class="suit-${suit.id}">${suit.symbol}<span>${t(suit.label)}</span></h3><div class="picker-card-grid">${PICKER_RANKS.map(
              (rank) => {
                const card = { rank, suit: suit.id },
                  key = keyOf(card),
                  unavailable = blockedKeys.has(key),
                  selected = selectedKeys.has(key);
                const label = unavailable
                  ? t("cUsedCard", { card: cardName(card) })
                  : selected ? t("cUnselectCard", { card: cardName(card) }) : cardName(card);
                return `<button type="button" class="picker-card${selected ? " is-selected" : ""}" data-pick-card="${key}" ${unavailable ? "disabled" : ""} aria-label="${escape(label)}" aria-pressed="${Boolean(selected)}">${renderCard(card, { fan: false })}</button>`;
              },
            ).join("")}</div></section>`,
        )
        .join(
          "",
        )}</div><footer class="card-picker-footer"><div class="picker-actions"><button type="button" class="picker-cancel" data-picker-close>${t("cCancel")}</button><button type="button" class="picker-done" data-picker-done>${t("cDone")}</button></div></footer>`;
    element.querySelector(".card-picker-deck").scrollTop = scrollTop;
    if (focusSelector)
      element.querySelector(focusSelector)?.focus({ preventScroll: true });
  }

  function openPicker(group, index) {
    state.picker = createCardSelection(state, group, index);
    state.pickerError = false;
    state.pickerSuit = "all";
    renderPicker(undefined, true);
    element.querySelector(".card-picker").showModal();
    document.body.classList.add("card-picker-open");
    element.querySelector(`[data-picker-slot="${index}"]`).focus({ preventScroll: true });
  }

  function chooseCard(key) {
    const card = deckByKey.get(key);
    if (!card || !state.picker) return;
    state.picker = pickSelectionCard(state.picker, card);
    state.pickerError = false;
    renderPicker(`[data-pick-card="${key}"]`);
  }

  function clearPickerCard(index = state.picker?.index) {
    if (!state.picker) return;
    state.picker = clearSelectionCard(state.picker, index);
    state.pickerError = false;
    renderPicker(`[data-picker-slot="${state.picker.index}"]`);
  }

  function finishPicker() {
    if (!state.picker) return;
    const selection = state.picker;
    let next;
    try {
      next = commitCardSelection(state, selection);
    } catch {
      state.pickerError = true;
      renderPicker("[data-picker-done]");
      return;
    }
    closePicker({ restoreFocus: false });
    changeDeal(() => { state[selection.group] = next[selection.group]; }, slotSelector(selection.group, selection.originIndex));
  }

  async function calculate() {
    if (!complete() || state.busy) return;
    const version = ++state.version;
    const input = {
      hero: state.hero.map((card) => ({ ...card })),
      board: state.board.slice(0, state.stage).map((card) => ({ ...card })),
      villain: state.useVillain
        ? state.villain.map((card) => ({ ...card }))
        : null,
    };
    state.busy = true;
    state.error = false;
    render();
    // Yield before the bounded postflop enumeration. At most 1,081 runouts are needed postflop.
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (version !== state.version) return;
    try {
      state.result = calculateOdds(input);
    } catch {
      state.result = null;
      state.error = true;
    }
    if (version !== state.version) return;
    state.busy = false;
    render("[data-odds-calculate]");
  }

  element.addEventListener("change", (event) => {
    if (event.target.id !== "odds-use-villain") return;
    changeDeal(() => {
      state.useVillain = event.target.checked;
      if (!state.useVillain) {
        state.villain = emptyCards(2);
        state.player = "hero";
      }
    }, "#odds-use-villain");
  });
  element.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.slotGroup)
      openPicker(button.dataset.slotGroup, Number(button.dataset.slotIndex));
    else if (button.hasAttribute("data-picker-slot")) {
      state.picker = activateSelectionSlot(state.picker, Number(button.dataset.pickerSlot));
      renderPicker(`[data-picker-slot="${state.picker.index}"]`);
    } else if (button.dataset.pickCard) chooseCard(button.dataset.pickCard);
    else if (button.dataset.pickerSuit) {
      state.pickerSuit = button.dataset.pickerSuit;
      renderPicker(`[data-picker-suit="${state.pickerSuit}"]`, true);
    } else if (button.hasAttribute("data-picker-close")) closePicker();
    else if (button.hasAttribute("data-picker-done")) finishPicker();
    else if (button.hasAttribute("data-odds-undo")) undoChange();
    else if (button.dataset.oddsStage) {
      if (state.stage === Number(button.dataset.oddsStage)) return;
      changeDeal(() => {
        state.stage = Number(button.dataset.oddsStage);
        for (let index = state.stage; index < 5; index++)
          state.board[index] = null;
      }, `[data-odds-stage="${button.dataset.oddsStage}"]`);
    } else if (button.dataset.oddsSort) {
      state.sort = button.dataset.oddsSort;
      render(`[data-odds-sort="${state.sort}"]`);
    } else if (button.dataset.distributionPlayer) {
      state.player = button.dataset.distributionPlayer;
      render(`[data-distribution-player="${state.player}"]`);
    } else if (button.hasAttribute("data-odds-calculate")) calculate();
    else if (button.hasAttribute("data-odds-reset")) {
      changeDeal(() => {
        state.hero = emptyCards(2);
        state.board = emptyCards(5);
        state.villain = emptyCards(2);
        state.stage = 3;
        state.useVillain = false;
        state.player = "hero";
      }, "[data-odds-reset]");
    } else if (button.hasAttribute("data-odds-example")) {
      changeDeal(() => {
        state.hero = [
          { rank: "A", suit: "spades" },
          { rank: "K", suit: "spades" },
        ];
        state.board = [
          { rank: "Q", suit: "spades" },
          { rank: "J", suit: "spades" },
          { rank: "2", suit: "diamonds" },
          null,
          null,
        ];
        state.villain = emptyCards(2);
        state.stage = 3;
        state.useVillain = false;
        state.player = "hero";
      });
      calculate();
    }
  });
  element.addEventListener("keydown", (event) => {
    const picker = element.querySelector(".card-picker");
    if (["Backspace", "Delete"].includes(event.key)) {
      const draftSlot = event.target.closest("[data-picker-slot]");
      const slot = event.target.closest("[data-slot-group]");
      if (picker?.open && draftSlot) {
        event.preventDefault();
        clearPickerCard(Number(draftSlot.dataset.pickerSlot));
      } else if (!picker?.open && slot) {
        event.preventDefault();
        removeCard(slot.dataset.slotGroup, Number(slot.dataset.slotIndex));
      }
      return;
    }
    if (!picker?.open || event.key !== "Tab") return;
    const buttons = [...picker.querySelectorAll("button:not([disabled])")];
    const first = buttons[0],
      last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  return { render, closePicker };
}
