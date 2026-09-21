import {
  RANGE_RANKS,
  RANGE_STYLES,
  RANGE_POSITIONS,
  ENTRY_SCENARIOS,
  HANDS_169,
  getPriorPositions,
  getEntryStrategy,
  getRangeSummary,
  getHandCombinations,
} from "./ranges.mjs";
import {
  enhanceSelects,
  closeSelectMenusWithin,
  focusSelectControl,
} from "./select-menu.js";

/** Owns scenario, opponent and hand selection independently of achievements. */
export function createRangeExplorer({ element, translate, renderCard }) {
  const state = {
    style: "tag",
    position: "BTN",
    scenario: "raised",
    opponent: "CO",
    hand: "AKs",
    positionAdjusted: false,
  };
  const t = translate;
  const handById = new Map(HANDS_169.map((hand) => [hand.id, hand]));
  const styleKeys = { tag: "mTag", balanced: "mBalanced", lag: "mLag" };
  const kindKeys = { pair: "mPair", suited: "mSuited", offsuit: "mOffsuit" };
  const scenarioKeys = {
    unopened: "mUnopened",
    limped: "mLimped",
    raised: "mRaised",
  };
  const seatCoordinates = [
    [24, 12],
    [76, 12],
    [94, 50],
    [76, 88],
    [24, 88],
    [6, 50],
  ];
  const suitSymbols = { spades: "♠", hearts: "♥", clubs: "♣", diamonds: "♦" };
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
  const percentage = (summary) =>
    summary ? `${summary.percent.toFixed(1)}%` : "—";

  function normalizeContext() {
    state.positionAdjusted = false;
    if (state.scenario !== "unopened" && state.position === "UTG") {
      state.position = "HJ";
      state.positionAdjusted = true;
    }
    const prior = getPriorPositions(state.position);
    if (!prior.includes(state.opponent)) state.opponent = prior.at(-1) ?? null;
  }

  const strategy = (style = state.style) =>
    getEntryStrategy(
      style,
      state.position,
      state.scenario,
      state.scenario === "unopened" ? undefined : state.opponent,
    );
  // Free checks continue the hand, but are not voluntary participation.
  const activeRange = (model) =>
    model.available ? new Set([...model.raise, ...model.call]) : null;
  const contextText = () =>
    state.scenario === "unopened"
      ? t("mUnopenedContext")
      : t(state.scenario === "limped" ? "mLimpedContext" : "mRaisedContext", {
          opponent: state.opponent,
          size: state.opponent === "SB" ? "3" : "2.5",
        });
  const values = () => ({
    style: t(styleKeys[state.style]),
    position: state.position,
    hand: state.hand,
    context: contextText(),
  });
  function actionFor(model, hand) {
    if (!model.available) return "none";
    return (
      ["raise", "call", "check"].find((action) => model[action].has(hand)) ??
      "fold"
    );
  }
  function actionLabel(action) {
    if (action === "raise")
      return t(
        state.scenario === "raised"
          ? "mReraise"
          : state.scenario === "limped"
            ? "mIsolate"
            : "mRaise",
      );
    if (action === "call")
      return t(
        state.position === "SB" && state.scenario === "limped"
          ? "mComplete"
          : "mCall",
      );
    return t({ check: "mCheck", fold: "mFold", none: "mNoAction" }[action]);
  }

  function matrix(model) {
    return `<div class="matrix-top-axis" aria-hidden="true">${RANGE_RANKS.map((rank) => `<span>${rank}</span>`).join("")}</div><div class="matrix-body"><div class="matrix-side-axis" aria-hidden="true">${RANGE_RANKS.map((rank) => `<span>${rank}</span>`).join("")}</div><div class="hand-matrix${!model.available ? " is-inapplicable" : ""}" role="grid" aria-label="${t("mOpeningChart")}" aria-rowcount="13" aria-colcount="13">${RANGE_RANKS.map(
      (_, row) =>
        `<div role="row" class="matrix-row">${HANDS_169.slice(
          row * 13,
          row * 13 + 13,
        )
          .map((hand) => {
            const action = actionFor(model, hand.id);
            return `<button type="button" role="gridcell" class="matrix-cell is-${action === "none" ? "unavailable" : action}${hand.kind === "pair" ? " is-pair" : ""}" data-hand-id="${hand.id}" data-action="${action}" aria-selected="${state.hand === hand.id}" tabindex="${state.hand === hand.id ? "0" : "-1"}" aria-label="${escape(t("mCellLabel", { hand: hand.id, kind: t(kindKeys[hand.kind]), action: actionLabel(action), combos: hand.combos }))}">${hand.id}</button>`;
          })
          .join("")}</div>`,
    ).join("")}</div></div>`;
  }

  function positionDiagram() {
    return `<div class="position-table" aria-label="${t("mAtTable")}"><div class="position-felt"><span>${state.position}</span><small>${t(`m${state.position}`)}</small>${state.scenario !== "unopened" ? `<em>vs ${state.opponent}</em>` : ""}</div>${RANGE_POSITIONS.map((position, index) => `<button type="button" class="table-seat${state.position === position ? " is-active" : ""}${state.scenario !== "unopened" && state.opponent === position ? " is-opponent" : ""}" style="--seat-x:${seatCoordinates[index][0]}%;--seat-y:${seatCoordinates[index][1]}%" data-seat="${position}" aria-pressed="${state.position === position}" aria-label="${position} · ${t(`m${position}`)}" ${state.scenario !== "unopened" && position === "UTG" ? `disabled title="${t("mNoPriorOption")}"` : ""}>${position}${position === "BTN" ? '<span class="dealer-chip" aria-hidden="true">D</span>' : ""}</button>`).join("")}</div>`;
  }

  function inspector(model) {
    const hand = handById.get(state.hand);
    const combinations = getHandCombinations(state.hand);
    const action = actionFor(model, state.hand);
    const combo = (cards) =>
      cards
        .map(
          (card) =>
            `<span class="result-card suit-${card.suit}">${card.rank}${suitSymbols[card.suit]}</span>`,
        )
        .join(" ");
    const note = model.available
      ? t("mActionHandNote", { ...values(), action: actionLabel(action) })
      : t(model.reason === "walk" ? "mBBHint" : "mNoPriorNote");
    return `<div class="inspector-top"><span class="range-small-label">${t("mSelectedHand")}</span><span class="action-badge is-${action}">${actionLabel(action)}</span></div><div class="inspector-hand"><div><h3>${state.hand}</h3><p>${t(kindKeys[hand.kind])} <span>·</span> ${t("mHandCombos", { count: hand.combos })}</p></div><div class="inspector-cards" aria-label="${state.hand}">${combinations[0].map((card, index) => renderCard(card, { index, count: 2 })).join("")}</div></div><p class="inspector-note">${note}</p><details class="hand-combinations"><summary>${t("mAllCombos")}<span>${hand.combos}</span></summary><div class="combo-list">${combinations.map((cards) => `<span class="combo-pair">${combo(cards)}</span>`).join("")}</div></details>`;
  }

  function comparison() {
    return RANGE_STYLES.map((style) => {
      const summary = getRangeSummary(activeRange(strategy(style)));
      return `<button type="button" class="comparison-row${state.style === style ? " is-selected" : ""}" data-compare="${style}" aria-pressed="${state.style === style}"><span>${t(styleKeys[style])}</span><span class="comparison-track" aria-hidden="true"><span style="width:${summary?.percent ?? 0}%"></span></span><strong>${percentage(summary)}</strong></button>`;
    }).join("");
  }

  function scenarioControls() {
    return `<section class="entry-scenarios" aria-label="${t("mPriorAction")}"><div class="scenario-control"><div class="range-control-label"><span>03</span>${t("mPriorAction")}</div><div class="scenario-options" role="group" aria-label="${t("mPriorAction")}">${ENTRY_SCENARIOS.map((scenario) => `<button type="button" data-scenario="${scenario}" aria-pressed="${state.scenario === scenario}">${t(scenarioKeys[scenario])}</button>`).join("")}</div></div>${
      state.scenario !== "unopened"
        ? `<div class="opponent-control"><span>${t(state.scenario === "raised" ? "mRaiser" : "mLimper")}</span><select id="entry-opponent" aria-label="${t("mOpponent")}">${getPriorPositions(
            state.position,
          )
            .map(
              (position) =>
                `<option value="${position}" ${state.opponent === position ? "selected" : ""}>${position} · ${t(`m${position}`)}</option>`,
            )
            .join(
              "",
            )}</select></div><p class="opponent-condition">${t("mSingleOpponent")}</p>`
        : ""
    }${state.positionAdjusted ? `<p class="scenario-notice" role="status">${t("mPositionAdjusted", { position: state.position })}</p>` : ""}</section>`;
  }

  function render(focusSelector) {
    closeSelectMenusWithin(element);
    const model = strategy();
    const range = activeRange(model);
    const summary = getRangeSummary(range);
    const rangeText = range
      ? HANDS_169.filter((hand) => range.has(hand.id))
          .map((hand) => hand.id)
          .join(", ")
      : "";
    const actions = ["raise", "call", "check", "fold"].filter(
      (action) => model[action].size > 0,
    );
    const actionCounts = Object.fromEntries(
      actions.map((action) => [action, getRangeSummary(model[action]).combos]),
    );
    element.innerHTML = `
      <header class="range-page-header"><div><h1 id="ranges-title">${t("mTitle")}</h1></div><div class="range-assumptions"><span>${t("mSixMax")}</span><span>100 BB</span><span>${t("mNoAnte")}</span><small>${t("mCash")}</small></div></header>
      <div class="range-context"><span class="context-dot" aria-hidden="true"></span><span>${contextText()}</span><span class="preset-tag">${t("mPresetLabel")}</span></div>
      <div class="range-controls"><div class="style-control"><div class="range-control-label"><span>01</span>${t("mStyle")}</div><div class="style-options" role="group" aria-label="${t("mStyle")}">${RANGE_STYLES.map((style) => `<button type="button" class="style-option" data-style="${style}" aria-pressed="${state.style === style}"><span>${t(styleKeys[style])}</span><small>${style === "balanced" ? "BASE" : style.toUpperCase()}</small></button>`).join("")}</div></div><div class="position-control"><div class="range-control-label"><span>02</span>${t("mPosition")}</div><div class="position-options" role="group" aria-label="${t("mPosition")}">${RANGE_POSITIONS.map((position) => `<button type="button" data-position="${position}" aria-pressed="${state.position === position}" ${state.scenario !== "unopened" && position === "UTG" ? `disabled title="${t("mNoPriorOption")}"` : ""}><strong>${position}</strong><small>${t(`m${position}`)}</small></button>`).join("")}</div></div></div>
      ${scenarioControls()}
      <div class="range-workspace"><section class="matrix-panel" aria-labelledby="matrix-heading"><div class="matrix-panel-header"><div><span class="range-small-label">${t("mRangeSubtitle", values())}${state.scenario !== "unopened" ? ` · vs ${state.opponent}` : ""} · ${t(scenarioKeys[state.scenario])}</span><h2 id="matrix-heading">${t("mRangeTitle")}</h2></div><div class="matrix-percent"><strong>${percentage(summary)}</strong><span>${t("mPlayRatio")}</span></div></div>${!model.available ? `<div class="bb-explanation"><strong>${t(model.reason === "walk" ? "mBBTitle" : "mNoPriorTitle")}</strong><p>${t(model.reason === "walk" ? "mBBNote" : "mNoPriorNote")}</p></div>` : ""}${matrix(model)}<div class="matrix-legend" aria-label="${t("mLegend")}">${model.available ? actions.map((action) => `<span><i class="legend-${action}"></i>${actionLabel(action)}</span>`).join("") : `<span><i class="legend-unavailable"></i>${t("mNoAction")}</span>`}<small>${summary ? t("mActiveCombos", { count: summary.combos }) : t("mNoAction")}</small></div><div class="matrix-notation">${t("mNotation")}</div>${model.check.size ? `<p class="free-check-note">${t("mFreeCheckNote")}</p>` : ""}</section>
      <aside class="range-sidebar"><section class="hand-inspector" id="hand-inspector" aria-live="polite">${inspector(model)}</section><section class="entry-action-panel"><h3>${t("mActionBreakdown")}</h3>${actions.map((action) => `<div class="entry-action-row"><span><i class="legend-${action}"></i>${actionLabel(action)}</span><strong>${t("mActionCombos", { count: actionCounts[action] })}</strong></div>`).join("")}${!model.available ? `<p>${t("mNoAction")}</p>` : ""}</section><section class="position-panel"><div class="position-panel-header"><span class="range-small-label">${t("mAtTable")}</span><span>${t("mSixMax")}</span></div>${positionDiagram()}<p class="position-note">${t(`m${state.position}Note`)}</p></section><section class="range-comparison"><h3>${t("mCompareTitle")}</h3><p>${t("mCompareDescription")}</p>${comparison()}</section></aside></div>
      <div class="range-bottom"><section class="range-breakdown"><div class="range-section-heading"><span class="range-small-label">${t("mRangeBreakdown")}</span><span>${summary ? t("mHands", { count: summary.hands }) : "—"}</span></div><div class="breakdown-items">${[
        ["pairs", "mPair", 6],
        ["suited", "mSuited", 4],
        ["offsuit", "mOffsuit", 12],
      ]
        .map(
          ([key, label, multiplier]) =>
            `<div><span>${t(label)}</span><strong>${summary ? summary[key] : "—"}<small>${summary ? t("mPairCount", { count: "" }) : ""}</small></strong><p>${summary ? t("mOfRange", { count: summary[key] * multiplier }) : "—"}</p></div>`,
        )
        .join(
          "",
        )}</div></section><section class="range-principles"><span class="range-small-label">${t("mPrinciplesTitle")}</span><h3>${t(`${styleKeys[state.style]}Caption`)}</h3><p>${t("mPrinciplesBody")}</p></section></div>
      <details class="range-sources"><summary>${t("mSourcesTitle")}<span aria-hidden="true">+</span></summary><div class="range-source-content"><p>${t("mConditions")}</p><p>${t("mPlayerOnly")}</p><p>${t("mMethodology")}</p><div class="source-links"><a href="https://www.pokerstars.com/poker/learn/lesson/pre-flop-essentials/" target="_blank" rel="noopener noreferrer">PokerStars · ${t("mSourcePreflop")} ↗</a><a href="https://upswingpoker.com/podcast/ep3-big-blind-defense/" target="_blank" rel="noopener noreferrer">Upswing · ${t("mSourceDefense")} ↗</a><a href="https://upswingpoker.com/limps-poker-open-limpers-strategy/" target="_blank" rel="noopener noreferrer">Upswing · ${t("mSourceLimp")} ↗</a></div>${model.available ? `<div class="range-export"><div><label for="range-notation">${t("mRangeText")}</label><button type="button" class="copy-range" data-copy-range>${t("mCopyRange")}</button></div><textarea id="range-notation" readonly rows="3">${rangeText}</textarea><span id="copy-status" role="status"></span></div>` : ""}</div></details>`;
    enhanceSelects(element);
    if (focusSelector) focusSelectControl(element.querySelector(focusSelector));
  }

  function selectHand(id, focus = false) {
    if (!handById.has(id)) return;
    state.hand = id;
    for (const cell of element.querySelectorAll("[data-hand-id]")) {
      const selected = cell.dataset.handId === id;
      cell.setAttribute("aria-selected", String(selected));
      cell.tabIndex = selected ? 0 : -1;
      if (selected && focus) cell.focus({ preventScroll: true });
    }
    element.querySelector("#hand-inspector").innerHTML = inspector(strategy());
  }

  element.addEventListener("change", (event) => {
    if (event.target.id !== "entry-opponent") return;
    state.opponent = event.target.value;
    state.positionAdjusted = false;
    render("#entry-opponent");
  });
  element.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.style || button.dataset.compare) {
      state.style = button.dataset.style ?? button.dataset.compare;
      state.positionAdjusted = false;
      render(
        `[${button.dataset.style ? "data-style" : "data-compare"}="${state.style}"]`,
      );
    } else if (button.dataset.scenario) {
      state.scenario = button.dataset.scenario;
      normalizeContext();
      render(`[data-scenario="${state.scenario}"]`);
    } else if (button.dataset.position || button.dataset.seat) {
      state.position = button.dataset.position ?? button.dataset.seat;
      normalizeContext();
      render(
        `[${button.dataset.position ? "data-position" : "data-seat"}="${state.position}"]`,
      );
    } else if (button.dataset.handId) {
      selectHand(button.dataset.handId);
    } else if (button.hasAttribute("data-copy-range")) {
      const input = element.querySelector("#range-notation"),
        status = element.querySelector("#copy-status");
      try {
        await navigator.clipboard.writeText(input.value);
        if (status.isConnected) status.textContent = t("mCopied");
      } catch {
        if (input.isConnected) {
          input.focus();
          input.select();
          status.textContent = t("mCopyFallback");
        }
      }
    }
  });
  element.addEventListener("keydown", (event) => {
    const cell = event.target.closest("[data-hand-id]");
    if (!cell) return;
    const index = HANDS_169.findIndex(
      (hand) => hand.id === cell.dataset.handId,
    );
    const row = Math.floor(index / 13),
      col = index % 13;
    let next;
    if (event.key === "ArrowRight") next = row * 13 + Math.min(12, col + 1);
    if (event.key === "ArrowLeft") next = row * 13 + Math.max(0, col - 1);
    if (event.key === "ArrowDown") next = Math.min(12, row + 1) * 13 + col;
    if (event.key === "ArrowUp") next = Math.max(0, row - 1) * 13 + col;
    if (event.key === "Home") next = event.ctrlKey ? 0 : row * 13;
    if (event.key === "End") next = event.ctrlKey ? 168 : row * 13 + 12;
    if (next === undefined) return;
    event.preventDefault();
    selectHand(HANDS_169[next].id, true);
  });
  return { render };
}
