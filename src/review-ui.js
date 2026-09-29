import { REVIEW_CASES, REVIEW_SOURCES } from "./review-cases.mjs";
import { REVIEW_EQUITY } from "./review-equity-data.mjs";
import { buildSidePots } from "./review-equity.mjs";
import { REVIEW_PEOPLE } from "./review-people.mjs";
import { AVATAR_URLS } from "./review-avatar-urls.js";
import { createAvatarPreview } from "./avatar-preview.js";
import { createFriendTableStore, deriveFriendTable } from "./friend-table.mjs";
import { ODDS_CATEGORY_KEYS } from "./odds-i18n.mjs";
import { getFriendSimulationProfile } from "./friend-player-brain.mjs";

const STREETS = ["preflop", "flop", "turn", "river"];
const STREET_KEYS = { preflop: "rPreflop", flop: "rFlop", turn: "rTurn", river: "rRiver" };
const POT_KEYS = { main: "rMainPot", side1: "rSidePot1", side2: "rSidePot2" };
const FRIEND_STREETS = ["preflop", "flop", "turn", "river"];
const FRIEND_PROFILE_KEYS = {
  balanced: "rFriendProfileBalanced",
  patient: "rFriendProfilePatient",
  active: "rFriendProfileActive",
  curious: "rFriendProfileCurious",
  careful: "rFriendProfileCareful",
  pressure: "rFriendProfilePressure",
  draw: "rFriendProfileDraw",
};
const FRIEND_ACTION_KEYS = { check: "rFriendActionCheck", call: "rFriendActionCall", bet: "rFriendActionBet", raise: "rFriendActionRaise", fold: "rFriendActionFold" };
const FRIEND_REASON_KEYS = {
  "preflop-open": "rFriendReasonOpen",
  "preflop-three-bet": "rFriendReasonThreeBet",
  "preflop-call": "rFriendReasonPreflopCall",
  "preflop-complete": "rFriendReasonComplete",
  "preflop-limp": "rFriendReasonLimp",
  "preflop-overlimp": "rFriendReasonOverlimp",
  "preflop-loose-call": "rFriendReasonLooseCall",
  "preflop-fold-range": "rFriendReasonFoldRange",
  "preflop-fold-price": "rFriendReasonFoldPrice",
  "free-check": "rFriendReasonFreeCheck",
  "value-bet": "rFriendReasonValueBet",
  "value-call": "rFriendReasonValueCall",
  "pair-call-price": "rFriendReasonPairCall",
  "pair-fold-price": "rFriendReasonPairFold",
  "draw-call": "rFriendReasonDrawCall",
  "draw-fold-price": "rFriendReasonDrawFold",
  "weak-fold": "rFriendReasonWeakFold",
  "pot-control-check": "rFriendReasonPotControl",
  "board-danger-check": "rFriendReasonDangerCheck",
  "board-danger-call": "rFriendReasonDangerCall",
  "board-danger-fold": "rFriendReasonDangerFold",
  "value-raise": "rFriendReasonValueRaise",
  "value-reraise": "rFriendReasonValueReraise",
  "check-raise": "rFriendReasonCheckRaise",
  "slow-play-check": "rFriendReasonSlowPlay",
  "semi-bluff-bet": "rFriendReasonSemiBluffBet",
  "semi-bluff-raise": "rFriendReasonSemiBluffRaise",
  "bluff-bet": "rFriendReasonBluffBet",
  "bluff-raise": "rFriendReasonBluffRaise",
  "pressure-fold": "rFriendReasonPressureFold",
  "profile-call": "rFriendReasonProfileCall",
  "preflop-isolate": "rFriendReasonIsolate",
  "preflop-four-bet": "rFriendReasonFourBet",
  "value-protection-bet": "rFriendReasonValueProtection",
  "continuation-bet": "rFriendReasonContinuationBet",
  "delayed-continuation-bet": "rFriendReasonDelayedContinuationBet",
  "turn-barrel": "rFriendReasonTurnBarrel",
  "multiway-wet-check": "rFriendReasonMultiwayWetCheck",
  "barrel-give-up": "rFriendReasonBarrelGiveUp",
  "facing-aggression-fold": "rFriendReasonFacingAggressionFold",
  "ev-fold": "rFriendReasonEvFold",
  "ev-call": "rFriendReasonEvCall",
  "ev-check": "rFriendReasonEvCheck",
};
const arrow = (direction) => `<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="${direction === "left" ? "M12 5 7 10l5 5" : "m8 5 5 5-5 5"}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const percentage = (value) => `${(value * 100).toFixed(2)}%`;

export function createHandReview({ element, translate, renderCard, getLanguage = () => "zh-CN" }) {
  const t = (key, values) => escapeHtml(translate(key, values));
  const local = (value) => escapeHtml(typeof value === "string" ? value : value?.[getLanguage()] ?? value?.["zh-CN"] ?? "");
  const state = { caseIndex: 0, streetIndex: 0, pot: "main", expanded: new Map(), friendStreet: "preflop" };
  const friendTableStore = createFriendTableStore({ peopleIds: Object.keys(REVIEW_PEOPLE) });
  const avatarPreview = createAvatarPreview({ element, people: REVIEW_PEOPLE, avatarUrls: AVATAR_URLS, renderDetails: friendPreviewMarkup });
  const personFor = (hand, id) => REVIEW_PEOPLE[hand.players.find((player) => player.id === id)?.personId];
  const avatar = (person, position = null, folded = false) => person
    ? `<span class="review-avatar" data-avatar-person="${escapeHtml(person.id)}"${position ? ' data-avatar-table="true"' : ""} role="button" tabindex="0" aria-label="${position ? t(folded ? "rFriendTableViewFolded" : "rFriendTableView", { name: person.name, position }) : t("rViewAvatar", { name: person.name })}" aria-expanded="false"><img data-avatar-image="${escapeHtml(person.id)}" alt="" width="72" height="72" decoding="async" draggable="false"></span>`
    : "";
  const playerName = (hand, id) => {
    const person = personFor(hand, id);
    return `<span class="review-person">${avatar(person)}<span class="review-person-name">${person ? escapeHtml(person.name) : t("rFriend")}</span></span>`;
  };
  const recordedPots = (hand, streetIndex) => {
    const streets = hand.streets.slice(0, streetIndex + 1);
    const contributions = hand.players.map(({ id }) => ({
      id,
      contribution: streets.reduce((total, street) => total + Math.max(0,
        ...street.actions.filter((action) => action.player === id && Number.isFinite(action.to)).map(({ to }) => to)), 0),
    }));
    return buildSidePots(contributions).filter(({ kind }) => kind === "pot")
      .map((pot, index) => ({ ...pot, id: index === 0 ? "main" : `side${index}` }));
  };
  const potAmount = (hand, streetIndex, pot = null) => {
    const pots = recordedPots(hand, streetIndex);
    return pot ? pots.find(({ id }) => id === pot)?.amount ?? 0 : pots.reduce((sum, item) => sum + item.amount, 0);
  };
  const amountLabel = (hand, streetIndex, amount) => t(hand.id === "headsUp" && streetIndex > 0 ? "rPotApprox" : "rPotExact", { amount });

  function casesMarkup() {
    return `<div class="review-cases" role="group" aria-label="${t("rCases")}">${REVIEW_CASES.map((hand, index) => `<div class="review-case" data-selected="${index === state.caseIndex}"><button type="button" class="review-case-select" data-review-case="${index}" aria-pressed="${index === state.caseIndex}"><span class="review-case-meta"><span>${t("rCaseNumber", { number: String(index + 1).padStart(2, "0") })}</span><span>${t("rPlayers", { count: hand.players.length })}</span></span><strong>${local(hand.title)}</strong><span class="review-case-description">${local(hand.subtitle)}</span><span class="review-case-arrow" aria-hidden="true">↗</span></button><span class="review-case-people">${hand.players.map((player) => avatar(personFor(hand, player.id))).join("")}</span></div>`).join("")}</div>`;
  }

  function storyMarkup(hand) {
    if (!hand.story) return `<p class="review-overview">${local(hand.overview)}</p>`;
    return `<section class="review-story" aria-labelledby="review-story-title"><div class="review-story-copy"><span class="review-story-eyebrow">${local(hand.story.eyebrow)}</span><h2 id="review-story-title">${local(hand.story.title)}</h2><div class="review-story-paragraphs">${hand.story.paragraphs.map((paragraph) => `<p>${local(paragraph)}</p>`).join("")}</div></div>${hand.story.quote ? `<blockquote class="review-story-quote"><p>${local(hand.story.quote)}</p><cite class="review-story-attribution">${escapeHtml(REVIEW_PEOPLE.juyipeng.name)}</cite></blockquote>` : ""}</section>`;
  }

  function stageMarkup() {
    return `<div class="review-stage-controls"><nav class="review-stages" aria-label="${t("rStreets")}">${STREETS.map((id, index) => `<button type="button" class="review-stage${index < state.streetIndex ? " review-stage-past" : ""}" data-review-street="${index}"${index === state.streetIndex ? ' aria-current="step"' : ""}><span class="review-stage-number" aria-hidden="true">${index + 1}</span><span>${t(STREET_KEYS[id])}</span></button>`).join("")}</nav><div class="review-step-buttons"><button type="button" data-review-step="-1" aria-label="${t("rPrevious")}"${state.streetIndex === 0 ? " disabled" : ""}>${arrow("left")}<span>${t("rPrevious")}</span></button><button type="button" data-review-step="1" aria-label="${t("rNext")}"${state.streetIndex === 3 ? " disabled" : ""}><span>${t("rNext")}</span>${arrow("right")}</button></div></div>`;
  }

  function tableMarkup(hand, street) {
    return `<section class="review-table" aria-labelledby="review-board-title"><div class="review-table-heading"><h2 id="review-board-title">${t("rBoard")}</h2><span>${t(STREET_KEYS[street.id])}</span></div><div class="review-board">${Array.from({ length: 5 }, (_, index) => street.board[index] ? renderCard(street.board[index], { fan: false }) : `<span class="review-card-empty" role="img" aria-label="${t("rUnrevealed")}"><span aria-hidden="true">♠</span></span>`).join("")}</div><div class="review-pot-total"><div><span>${t("rPot")}</span><strong>${amountLabel(hand, state.streetIndex, potAmount(hand, state.streetIndex))}</strong></div><span>${t("rAfterActions")}</span></div><div class="review-players${hand.players.length === 2 ? " review-players-two" : ""}">${hand.players.map((player) => `<div class="review-player${player.id === hand.heroId ? " review-player-hero" : ""}"><div class="review-player-top"><h3>${playerName(hand, player.id)}</h3>${player.position === "SB" ? `<span class="review-position-tag">${t("rSmallBlind")}</span>` : ""}</div><div class="review-hole-cards" aria-label="${t("rHoleCards")}">${player.hand.map((card) => renderCard(card, { fan: false })).join("")}</div><span class="review-stack">${player.stackNote ? local(player.stackNote) : player.stack == null ? t("rUnknownStack") : t(player.stackApprox ? "rApproxInitialStack" : "rInitialStack", { amount: player.stack })}</span></div>`).join("")}</div></section>`;
  }

  function equityMarkup(hand, street) {
    const stage = REVIEW_EQUITY[hand.id][street.id];
    const activePots = recordedPots(hand, state.streetIndex);
    const pots = stage.pots.filter((pot) => activePots.some(({ id }) => id === pot.id));
    const selectedPot = pots.find((pot) => pot.id === state.pot) ?? pots[0];
    const eligible = selectedPot.eligible ?? selectedPot.players.map((player) => player.id);
    const rows = selectedPot.players ?? stage.players;
    return `<section class="review-equity review-panel" aria-labelledby="review-equity-title"><div class="review-panel-heading"><h2 id="review-equity-title">${t("rEquityTitle")}</h2></div>${pots.length > 1 ? `<div class="review-pots" role="group" aria-label="${t("rPotSelection")}">${pots.map((pot) => `<button type="button" data-review-pot="${escapeHtml(pot.id)}" aria-pressed="${pot.id === selectedPot.id}"><span>${t(POT_KEYS[pot.id])}</span><strong>${amountLabel(hand, state.streetIndex, potAmount(hand, state.streetIndex, pot.id))}</strong></button>`).join("")}</div>` : ""}<table class="review-equity-table"><thead><tr><th scope="col">${t("rPlayerColumn")}</th><th scope="col">${t("rEquity")}</th><th scope="col">${t("rWin")}</th><th scope="col">${t("rTie")}</th></tr></thead><tbody>${hand.players.map((player) => {
      const result = rows.find((row) => row.id === player.id);
      const participates = eligible.includes(player.id) && result;
      return `<tr class="${player.id === hand.heroId ? "review-equity-hero" : ""}${!participates ? " review-equity-excluded" : ""}"><th scope="row">${playerName(hand, player.id)}</th>${participates ? `<td><div class="review-equity-value"><strong>${percentage(result.equity)}</strong><span class="review-equity-track" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, result.equity * 100))}%"></span></span></div></td><td>${percentage(result.win)}</td><td>${percentage(result.tie)}</td>` : `<td colspan="3">${t("rNotEligible")}</td>`}</tr>`;
    }).join("")}</tbody></table><p class="review-enumeration">${street.id === "river" ? t("rFinalCount") : t("rExactCount", { count: stage.totalOutcomes.toLocaleString(getLanguage()) })}</p><p class="review-equity-note">${t("rEquityNote")}</p></section>`;
  }

  function actionMarkup(hand, street) {
    return `<section class="review-actions review-panel" aria-labelledby="review-actions-title"><div class="review-panel-heading"><h2 id="review-actions-title">${t("rActions")}</h2><span>${t(STREET_KEYS[street.id])}</span></div>${street.actions.length ? `<ol class="review-action-list">${street.actions.map((action, index) => `<li class="review-action${action.player === hand.heroId ? " review-action-hero" : ""}"><span class="review-action-index" aria-hidden="true">${index + 1}</span><div>${action.player ? `<strong>${playerName(hand, action.player)}</strong>` : ""}<p>${local(action.label)}</p></div></li>`).join("")}</ol>` : `<p class="review-empty-actions">${t(street.id === "river" ? "rShowdownOnly" : "rNoActions")}</p>`}${street.note ? `<p class="review-street-note">${local(street.note)}</p>` : ""}</section>`;
  }

  function callMathMarkup(hand, street) {
    if (hand.id !== "headsUp" || street.id !== "flop") return "";
    const equity = REVIEW_EQUITY.headsUp.flop.players.find((player) => player.id === "B").equity;
    return `<section class="review-call-math" aria-labelledby="review-call-title"><h2 id="review-call-title">${t("rCallMath")}</h2><dl><div><dt>${t("rCallRemaining")}</dt><dd>≈52 BB</dd></div><div><dt>${t("rCallPot")}</dt><dd>≈240 BB</dd></div><div><dt>${t("rCallThreshold")}</dt><dd>≈${percentage(52 / 240)}</dd></div><div class="review-call-actual"><dt>${t("rCallEquity")}</dt><dd>${percentage(equity)}</dd></div></dl><p>${t("rCallMathNote")}</p></section>`;
  }

  function analysisMarkup(hand, street) {
    return `<section class="review-analysis" aria-labelledby="review-analysis-title"><div class="review-panel-heading"><h2 id="review-analysis-title">${t("rAnalysis")}</h2></div><div class="review-analysis-list">${street.analysis.map((item, index) => {
      const key = `${hand.id}:${street.id}:${index}`;
      const open = state.expanded.has(key) ? state.expanded.get(key) : item.player === hand.heroId;
      return `<details class="review-decision${item.player === hand.heroId ? " review-decision-hero" : ""}" data-review-analysis="${key}"${open ? " open" : ""}><summary><span class="review-decision-name">${item.player ? playerName(hand, item.player) : t("rAnalysis")}</span><strong>${local(item.verdict)}</strong><span class="review-disclosure" aria-hidden="true">${arrow("right")}</span></summary><p>${local(item.body)}</p></details>`;
    }).join("")}</div></section>`;
  }

  function resultMarkup(hand) {
    if (state.streetIndex !== 3) return "";
    return `<section class="review-result" aria-labelledby="review-result-title"><div class="review-result-heading"><span class="review-result-symbol" aria-hidden="true">♠</span><div><span>${t("rResult")}</span><h2 id="review-result-title">${local(hand.result.label)}</h2></div></div><p>${local(hand.result.body)}</p></section><section class="review-takeaways" aria-labelledby="review-takeaways-title"><h2 id="review-takeaways-title">${t("rTakeaways")}</h2><ul>${hand.takeaways.map((item) => `<li>${local(item)}</li>`).join("")}</ul></section>`;
  }

  function notesMarkup(hand) {
    const sources = (hand.sources ?? REVIEW_SOURCES).map((source, index) => {
      const url = typeof source === "string" ? source : source.url;
      if (!/^https?:\/\//.test(url ?? "")) return "";
      const title = typeof source === "object" && (source.title || source.label) ? local(source.title || source.label) : escapeHtml(new URL(url).hostname);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${title || t("rSource", { number: index + 1 })} <span aria-hidden="true">↗</span></a>`;
    }).filter(Boolean);
    return `<details class="review-notes"><summary>${t("rRecordNotes")}</summary><div class="review-notes-body"><p>${t("rMethodNote")}</p><ul>${hand.assumptions.map((note) => `<li>${local(note)}</li>`).join("")}</ul>${hand.potNote ? `<p>${local(hand.potNote)}</p>` : ""}${sources.length ? `<div class="review-sources"><strong>${t("rSources")}</strong>${sources.join("")}</div>` : ""}</div></details>`;
  }

  function friendsMarkup() {
    return `<section class="review-friends" aria-labelledby="review-friends-title"><div class="review-friends-heading"><div><h2 id="review-friends-title">${t("rFriends")}</h2><span class="friend-table-label">${t("rFriendTableLabel")}</span></div><button type="button" class="friend-table-redeal" data-friend-redeal>${t("rFriendTableRedeal")}</button></div>${friendTableMarkup()}</section>`;
  }

  function friendTableMarkup() {
    const { table } = friendTableStore.load();
    const deal = deriveFriendTable(table, state.friendStreet);
    state.friendStreet = deal.street;
    const winnerNames = deal.winnerIds.map((id) => REVIEW_PEOPLE[id].name).join(getLanguage() === "en" ? " & " : "、");
    const result = deal.ended
      ? t(deal.uncontested ? "rFriendTableUncontested" : deal.winnerIds.length === 1 ? "rFriendTableWinner" : "rFriendTableTie", { names: winnerNames })
      : t({ preflop: "rFriendTablePreflopNote", flop: "rFriendTableFlopNote", turn: "rFriendTableTurnNote" }[state.friendStreet]);
    return `<div class="friend-table"><div class="friend-table-center"><div class="friend-table-stage" role="group" aria-label="${t("rFriendTableStages")}">${FRIEND_STREETS.map((street, index) => `<button type="button" data-friend-street="${street}" aria-pressed="${street === state.friendStreet}"${deal.ended && index > FRIEND_STREETS.indexOf(deal.endedStreet) ? " disabled" : ""}>${t(STREET_KEYS[street])}</button>`).join("")}</div><div class="friend-table-board" role="group" aria-label="${t("rBoard")}">${Array.from({ length: 5 }, (_, index) => deal.board[index] ? renderCard(deal.board[index], { fan: false }) : `<span class="review-card-empty" role="img" aria-label="${t(deal.ended ? "rFriendTableUndealt" : "rUnrevealed")}"><span aria-hidden="true">♠</span></span>`).join("")}</div><div class="friend-table-pot"><span>${t("rFriendTablePot")}</span><strong>${deal.pot} BB</strong></div><p class="friend-table-result" role="status" aria-live="polite">${result}</p></div><ol class="friend-table-seats">${[...deal.seats].sort((left, right) => left.seatIndex - right.seatIndex).map((seat) => {
      const person = REVIEW_PEOPLE[seat.personId];
      return `<li class="friend-seat" data-seat="${seat.seatIndex}" data-position="${seat.position}" data-winner="${seat.winner}" data-folded="${seat.folded}"><span class="friend-seat-position">${seat.position}</span><span class="friend-seat-portrait">${avatar(person, seat.position, seat.folded)}${seat.folded ? `<span class="friend-seat-folded" aria-hidden="true">${t("rFriendTableFoldedBadge")}</span>` : ""}</span></li>`;
    }).join("")}</ol></div>`;
  }

  function friendPreviewMarkup(trigger, person) {
    if (!trigger.dataset.avatarTable) return null;
    const deal = deriveFriendTable(friendTableStore.load().table, state.friendStreet);
    const seat = deal.seats.find((item) => item.personId === person.id);
    if (!seat) return null;
    const status = seat.folded
      ? t("rFriendTableFolded", { stage: translate(STREET_KEYS[seat.foldStreet]) })
      : seat.winner ? t(deal.winnerIds.length === 1 ? "rFriendTableCollect" : "rFriendTableSplit")
      : t(state.friendStreet === "river" ? "rFriendTableShowdown" : "rFriendTableInHand");
    const handLabel = state.friendStreet === "preflop"
      ? `${escapeHtml(seat.startingHand)} · ${t(seat.holeCards[0].rank === seat.holeCards[1].rank ? "rFriendTablePocketPair" : seat.holeCards[0].suit === seat.holeCards[1].suit ? "rFriendTableSuited" : "rFriendTableOffsuit")}`
      : `${t(STREET_KEYS[state.friendStreet])} ${t(ODDS_CATEGORY_KEYS[seat.category])}`;
    const actions = seat.actions.length ? seat.actions : seat.lastAction ? [seat.lastAction] : [];
    const profile = getFriendSimulationProfile(person.id);
    const formatChance = new Intl.NumberFormat(getLanguage(), { style: "percent", maximumFractionDigits: 1 });
    const bluffBaseline = formatChance.format(profile.bluffFrequency);
    const cbetBaseline = formatChance.format(profile.cbetFrequency);
    return `<header class="friend-preview-heading"><img class="friend-preview-avatar" data-preview-avatar alt="" width="72" height="72"><div><strong>${escapeHtml(person.name)}</strong><span class="friend-preview-position">${seat.position}</span></div></header><p class="friend-preview-profile">${t("rFriendSimulationProfile", { style: translate(FRIEND_PROFILE_KEYS[profile.labelKey]) })}<br>${t("rFriendSimulationBaselines", { cbet: cbetBaseline, bluff: bluffBaseline })}</p><span class="friend-preview-status" data-folded="${seat.folded}">${status}</span><div class="friend-preview-cards" role="group" aria-label="${t("rHoleCards")}">${seat.holeCards.map((card) => renderCard(card, { fan: false })).join("")}</div><p class="friend-preview-hand">${handLabel}</p><ul class="friend-preview-decisions">${actions.map((action) => `<li><strong>${t(STREET_KEYS[action.street])} · ${t(["preflop-limp", "preflop-overlimp"].includes(action.reason) ? "rFriendActionLimp" : FRIEND_ACTION_KEYS[action.type], { amount: action.type === "raise" ? action.to : action.amount })}</strong>${FRIEND_REASON_KEYS[action.reason] ? `<p>${t(FRIEND_REASON_KEYS[action.reason], action.reasonValues)}</p>` : ""}</li>`).join("")}</ul><dl class="friend-preview-chips"><div><dt>${t("rFriendTableInvested")}</dt><dd>${seat.contribution} BB</dd></div><div><dt>${t("rFriendTableBehind")}</dt><dd>${seat.remaining} BB</dd></div></dl>${seat.refund > 0 ? `<p class="friend-preview-refund">${t("rFriendTableRefund", { amount: seat.refund })}</p>` : ""}${person.traits?.length ? `<ul class="review-friend-traits">${person.traits.map((trait) => `<li>${local(trait)}</li>`).join("")}</ul>` : ""}`;
  }

  function refreshFriendTable(focusSelector) {
    avatarPreview.hide();
    element.querySelector(".friend-table").outerHTML = friendTableMarkup();
    hydrateAvatars(element.querySelector(".friend-table"));
    const target = element.querySelector(focusSelector);
    (target?.disabled ? element.querySelector('[data-friend-street][aria-pressed="true"]') : target)?.focus({ preventScroll: true });
  }

  function hydrateAvatars(container = element) {
    container.querySelectorAll("[data-avatar-image]").forEach((image) => {
      image.src = AVATAR_URLS[image.dataset.avatarImage];
    });
  }

  function render(focusSelector) {
    avatarPreview.hide();
    const hand = REVIEW_CASES[state.caseIndex];
    const street = hand.streets[state.streetIndex];
    element.innerHTML = `<div class="review-content"><header class="review-page-header"><h1 id="review-title">${t("rTitle")}</h1><p>${t("rIntro")}</p></header>${casesMarkup()}${storyMarkup(hand)}${stageMarkup()}<div class="review-layout"><div class="review-visual-column">${tableMarkup(hand, street)}${equityMarkup(hand, street)}${callMathMarkup(hand, street)}</div><div class="review-detail-column">${actionMarkup(hand, street)}${analysisMarkup(hand, street)}</div></div>${resultMarkup(hand)}${notesMarkup(hand)}${friendsMarkup()}<span class="review-live-status" role="status" aria-live="polite">${t("rSelectedStage", { number: state.caseIndex + 1, stage: translate(STREET_KEYS[street.id]) })}</span></div>`;
    hydrateAvatars();
    if (focusSelector) element.querySelector(focusSelector)?.focus({ preventScroll: true });
  }

  element.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || !element.contains(button) || button.disabled) return;
    if (button.dataset.friendRedeal !== undefined) {
      friendTableStore.dealAgain();
      state.friendStreet = "preflop";
      refreshFriendTable("[data-friend-redeal]");
      element.querySelector(".review-live-status").textContent = translate("rFriendTableDealt");
    } else if (FRIEND_STREETS.includes(button.dataset.friendStreet)) {
      if (state.friendStreet === button.dataset.friendStreet) return;
      state.friendStreet = button.dataset.friendStreet;
      refreshFriendTable(`[data-friend-street="${state.friendStreet}"]`);
      element.querySelector(".review-live-status").textContent = translate("rFriendTableStageStatus", { stage: translate(STREET_KEYS[state.friendStreet]) });
    } else if (button.dataset.reviewCase !== undefined) {
      state.caseIndex = Number(button.dataset.reviewCase);
      state.streetIndex = 0;
      state.pot = "main";
      render(`[data-review-case="${state.caseIndex}"]`);
    } else if (button.dataset.reviewStreet !== undefined || button.dataset.reviewStep !== undefined) {
      state.streetIndex = button.dataset.reviewStreet !== undefined ? Number(button.dataset.reviewStreet) : Math.max(0, Math.min(3, state.streetIndex + Number(button.dataset.reviewStep)));
      if (state.streetIndex === 0 && state.pot === "side2") state.pot = "main";
      render(button.dataset.reviewStreet !== undefined ? `[data-review-street="${state.streetIndex}"]` : `[data-review-step="${button.dataset.reviewStep}"]:not(:disabled), [data-review-street="${state.streetIndex}"]`);
    } else if (button.dataset.reviewPot) {
      state.pot = button.dataset.reviewPot;
      render(`[data-review-pot="${state.pot}"]`);
    }
  });
  element.addEventListener("toggle", (event) => {
    if (event.target.matches("details[data-review-analysis]") && element.contains(event.target)) state.expanded.set(event.target.dataset.reviewAnalysis, event.target.open);
  }, true);
  return { render };
}
