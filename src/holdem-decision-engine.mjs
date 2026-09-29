import { ODDS_DECK } from "./poker-odds.mjs";
import { evaluateReviewHand } from "./review-equity.mjs";
import { analyzeFriendHand, choosePreflopAction } from "./friend-table-policy.mjs";
import { buildPublicOpponentRanges, continuationLikelihood, publicOpponents, DEFAULT_HOLDEM_RANGE_MODEL } from "./holdem-ranges.mjs";

const cardKey = (card) => `${card.rank}:${card.suit}`;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const roundChips = (value) => Math.round(value * 2) / 2;
const actions = ["check", "call", "bet", "raise", "fold"];
const postflopPositions = ["SB", "BB", "UTG", "LJ", "HJ", "CO", "BTN"];
const defaultProfile = Object.freeze({ id: "shared-default", valueAggression: 0.75, drawAggression: 0.5, bluffFrequency: 0.12,
  callTolerance: 0.02, betSizing: 0.5, cbetFrequency: 0.9, barrelFrequency: 0.6, slowPlayFrequency: 0.05, isoSizing: 1 });

function randomSource(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
function normalizedContext(context) {
  const street = context.street ?? ({ 0: "preflop", 3: "flop", 4: "turn", 5: "river" }[context.board?.length ?? 0]);
  if (!Array.isArray(context.holeCards) || context.holeCards.length !== 2 || !Array.isArray(context.board)
    || ![0, 3, 4, 5].includes(context.board.length) || !Number.isFinite(context.pot) || context.pot < 0
    || !Number.isFinite(context.callCost) || context.callCost < 0
    || ({ preflop: 0, flop: 3, turn: 4, river: 5 }[street]) !== context.board.length) throw new TypeError("A decision needs two private cards, the board matching its street, pot and call cost.");
  if ([...context.holeCards, ...context.board].some((card) => !card || typeof card.rank !== "string" || typeof card.suit !== "string")) throw new TypeError("Card ranks and suits must be strings.");
  const known = [...context.holeCards, ...context.board].map(cardKey);
  if (new Set(known).size !== known.length || known.some((id) => !ODDS_DECK.some((card) => cardKey(card) === id))) throw new TypeError("Known cards must be valid and distinct.");
  const ownInvestment = context.ownInvestment ?? 0;
  const raiseTo = context.raiseTo ?? ownInvestment + context.callCost;
  const remaining = context.remaining ?? 100;
  if (!Number.isFinite(ownInvestment) || ownInvestment < 0 || !Number.isFinite(raiseTo) || raiseTo < ownInvestment
    || Math.abs(raiseTo - ownInvestment - context.callCost) > 1e-9 || !Number.isFinite(remaining) || remaining < context.callCost) throw new RangeError("Call cost, street investment, target and remaining chips must agree.");
  const maxRaiseTo = context.maxRaiseTo ?? ownInvestment + remaining - 1;
  const minRaiseTo = context.minRaiseTo ?? (raiseTo ? raiseTo + (context.lastFullRaise ?? Math.max(1, raiseTo)) : 1);
  if (!Number.isFinite(maxRaiseTo) || maxRaiseTo > ownInvestment + remaining - 1 || !Number.isFinite(minRaiseTo)
    || minRaiseTo <= raiseTo || minRaiseTo < 1 || (context.lastFullRaise !== undefined && (!Number.isFinite(context.lastFullRaise) || context.lastFullRaise <= 0))
    || (context.lastFullRaise !== undefined && minRaiseTo < (raiseTo ? raiseTo + context.lastFullRaise : 1))) throw new RangeError("Raise bounds must respect the stack and last full raise.");
  const publicAction = ({ personId, type, amount, to, callCost, potBefore }) => ({ personId, type, amount, to, callCost, potBefore });
  const previous = ["preflop", "flop", "turn", "river"].slice(0, ["preflop", "flop", "turn", "river"].indexOf(street));
  return { ...context, street, ownInvestment, raiseTo, remaining, maxRaiseTo, minRaiseTo,
    effectiveStack: context.effectiveStack ?? remaining, canRaise: (context.canRaise ?? true) && maxRaiseTo >= minRaiseTo,
    history: (context.history ?? []).map(publicAction), priorHistory: Object.fromEntries(previous.map((stage) => [stage, (context.priorHistory?.[stage] ?? []).map(publicAction)])) };
}
function pickCombination(range, used, random) {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const target = random() * range.totalWeight;
    let low = 0, high = range.combinations.length - 1;
    while (low < high) { const mid = (low + high) >>> 1; if (range.combinations[mid].cumulative < target) low = mid + 1; else high = mid; }
    const selected = range.combinations[low];
    if (selected.holeCards.every((card) => !used.has(cardKey(card)))) return selected;
  }
  const available = range.combinations.filter((entry) => entry.holeCards.every((card) => !used.has(cardKey(card))));
  let target = random() * available.reduce((sum, entry) => sum + entry.weight, 0);
  for (const entry of available) { target -= entry.weight; if (target <= 0) return entry; }
  return available.at(-1) ?? null;
}
function share(heroScore, opponents) {
  let tied = 1;
  for (const opponent of opponents) {
    if (opponent.score > heroScore) return 0;
    if (opponent.score === heroScore) tied += 1;
  }
  return 1 / tied;
}

/** Jointly disjoint hypothetical hands/runouts; never reads real opponent cards. */
export function sampleOpponentWorlds(rawContext, { samples = 128, seed = 1, rangeModel = DEFAULT_HOLDEM_RANGE_MODEL, onSample } = {}) {
  const context = normalizedContext(rawContext);
  if (!Number.isSafeInteger(samples) || samples < 1 || samples > 4096) throw new RangeError("Use 1–4096 equity samples.");
  const ranges = buildPublicOpponentRanges(context, rangeModel);
  const random = randomSource(seed);
  const worlds = [];
  for (let index = 0; index < samples; index += 1) {
    let chosen = null;
    for (let retry = 0; retry < 2000 && !chosen; retry += 1) {
      const used = new Set([...context.holeCards, ...context.board].map(cardKey));
      const order = ranges.map((_, rangeIndex) => rangeIndex);
      for (let cursor = order.length - 1; cursor > 0; cursor -= 1) {
        const other = Math.floor(random() * (cursor + 1));
        [order[cursor], order[other]] = [order[other], order[cursor]];
      }
      const opponents = new Array(ranges.length);
      let failed = false;
      for (const opponentIndex of order) {
        const range = ranges[opponentIndex];
        // Independently draw from each full blocked range; a collision rejects
        // the ENTIRE joint proposal, preserving product weights conditioned on
        // distinct cards rather than favoring whoever was sampled first.
        const entry = pickCombination(range, new Set(), random);
        if (!entry || entry.holeCards.some((card) => used.has(cardKey(card)))) { failed = true; break; }
        entry.holeCards.forEach((card) => used.add(cardKey(card)));
        opponents[opponentIndex] = { personId: range.personId, position: range.position,
          streetPaid: range.streetPaid ?? 0, remaining: range.remaining ?? context.effectiveStack,
          holeCards: entry.holeCards, features: entry.features, responseRoll: random() };
      }
      if (failed) continue;
      const deck = ODDS_DECK.filter((card) => !used.has(cardKey(card)));
      const board = [...context.board];
      while (board.length < 5) { const selected = Math.floor(random() * deck.length); board.push(deck.splice(selected, 1)[0]); }
      const heroScore = evaluateReviewHand([...context.holeCards, ...board]).score;
      const scored = opponents.map((opponent) => ({ ...opponent, score: evaluateReviewHand([...opponent.holeCards, ...board]).score }));
      chosen = { board, opponents: scored, heroScore, equity: share(heroScore, scored) };
    }
    if (!chosen) throw new RangeError("The modeled opponent ranges cannot form a collision-free joint deal.");
    worlds.push(chosen);
    onSample?.({ heroHoleCards: context.holeCards, board: chosen.board, opponents: chosen.opponents.map(({ personId, holeCards }) => ({ personId, holeCards })) });
  }
  return { worlds, opponentRanges: ranges.map((range) => ({ personId: range.personId, position: range.position, combinations: range.combinationCount })) };
}

function latestAggressor(history) { return history.filter((action) => ["bet", "raise"].includes(action.type)).at(-1)?.personId; }
function plannedAggression(context, hand, profile) {
  const strong = ["two-pair", "trips", "straight", "flush", "full-house", "four-kind", "straight-flush", "royal-flush"].includes(hand.strength);
  const privatePair = ["low-pair", "middle-pair", "top-pair", "overpair"].includes(hand.strength);
  const intent = strong || privatePair ? "value" : hand.outCount > 0 ? "semi-bluff" : "bluff";
  const checked = context.history.filter((action) => action.personId === context.personId).at(-1)?.type === "check";
  if (context.callCost > 0) return { intent, reason: intent === "value" ? checked ? "check-raise" : context.raiseCount >= 2 ? "value-reraise" : "value-raise"
    : intent === "semi-bluff" ? "semi-bluff-raise" : "bluff-raise", cap: intent === "bluff" ? profile.bluffFrequency * 0.25 : 1 };
  if (hand.strength === "overpair" || (hand.strength === "top-pair" && hand.kicker >= 11)) return { intent: "value", reason: "value-protection-bet", plan: "value-protection", cap: 1 - profile.slowPlayFrequency };
  if (strong) return { intent: "value", reason: "value-bet", cap: Math.max(0.8, profile.valueAggression) };
  const preflopAggressor = latestAggressor(context.priorHistory.preflop ?? []);
  const ownInitiative = preflopAggressor === context.personId;
  const textureFactor = hand.boardTexture.wet ? context.activeCount > 2 ? 0.08 : 0.3 : context.activeCount > 3 ? 0.12 : context.activeCount === 3 ? 0.6 : 1;
  if (context.street === "flop" && ownInitiative) return { intent, reason: "continuation-bet", plan: "cbet",
    cap: profile.cbetFrequency * textureFactor };
  if (context.street === "turn") {
    const previous = context.priorHistory.flop ?? [];
    const flopAggressor = latestAggressor(previous);
    const before = analyzeFriendHand(context.holeCards, context.board.slice(0, 3));
    const improved = hand.outCount > before.outCount || (privatePair && !["low-pair", "middle-pair", "top-pair", "overpair"].includes(before.strength));
    const ranks = { A: 14, K: 13, Q: 12, J: 11 };
    const turnRank = ranks[context.board[3].rank] ?? Number(context.board[3].rank);
    const scareCard = turnRank >= 11 && turnRank > before.boardTexture.highestRank;
    if (flopAggressor === context.personId && (improved || hand.outCount >= 4 || (scareCard && context.activeCount <= 2))) return {
      intent, reason: "turn-barrel", plan: "second-barrel", cap: profile.barrelFrequency * textureFactor,
    };
    if (!flopAggressor && ownInitiative) return { intent, reason: "delayed-continuation-bet", plan: "delayed-cbet", cap: profile.cbetFrequency * 0.7 * textureFactor };
  }
  return { intent, reason: intent === "value" ? "value-bet" : intent === "semi-bluff" ? "semi-bluff-bet" : "bluff-bet",
    cap: intent === "bluff" ? profile.bluffFrequency * (context.isLastToAct ? 1 : 0.35) : intent === "semi-bluff" ? profile.drawAggression : 1 };
}

/** Plans generate legal alternatives; their EV, not a hand-name rule, selects play. */
export function buildHoldemCandidates(rawContext, { profile: customProfile } = {}) {
  const context = normalizedContext(rawContext);
  const profile = { ...defaultProfile, ...customProfile };
  const candidates = [{ type: context.callCost ? "fold" : "check", to: context.ownInvestment, cost: 0,
    reason: context.callCost ? "ev-fold" : "ev-check", intent: "control", cap: 1 }];
  if (context.callCost > 0) candidates.push({ type: "call", to: context.raiseTo, cost: context.callCost, reason: "ev-call", intent: "value", cap: 1 });
  if (!context.canRaise) return candidates;
  let proposals;
  if (context.street === "preflop") {
    const proposal = choosePreflopAction({ ...context, isoSizing: profile.isoSizing });
    const price = context.raiseCount >= 2 ? context.raiseTo * 2.2
      : context.raiseCount ? context.raiseTo * (["SB", "BB"].includes(context.position) ? 4 : 3) : 3 + (context.callerCount ?? 0) * profile.isoSizing;
    const to = proposal.type === "raise" ? proposal.to : clamp(roundChips(price), context.minRaiseTo, context.maxRaiseTo);
    const intent = proposal.type === "raise" ? "value" : "bluff";
    proposals = [{ type: "raise", to, reason: proposal.type === "raise" ? proposal.reason : context.raiseCount >= 2 ? "preflop-four-bet" : context.raiseCount ? "preflop-three-bet" : context.callerCount ? "preflop-isolate" : "preflop-open",
      reasonValues: proposal.reasonValues ?? {}, intent, cap: intent === "bluff" ? profile.bluffFrequency : 1 }];
  } else {
    const hand = analyzeFriendHand(context.holeCards, context.board);
    const plan = plannedAggression(context, hand, profile);
    const sizes = context.callCost > 0 ? [profile.betSizing, 0.75] : [1 / 3, profile.betSizing, 0.75];
    proposals = sizes.map((fraction) => ({ ...plan, type: context.raiseTo > 0 ? "raise" : "bet",
      to: clamp(roundChips(context.raiseTo > 0 ? context.raiseTo + fraction * (context.pot + context.callCost) : context.pot * fraction), context.minRaiseTo, context.maxRaiseTo),
      reasonValues: { overcards: hand.overcards, outs: hand.outCount },
    }));
  }
  const seen = new Set();
  for (const proposal of proposals) {
    if (!Number.isFinite(proposal.to) || proposal.to < context.minRaiseTo || proposal.to > context.maxRaiseTo || seen.has(proposal.to)) continue;
    seen.add(proposal.to);
    candidates.push({ ...proposal, cost: proposal.to - context.ownInvestment });
  }
  return candidates;
}

function responseOrder(context, opponents) {
  const order = context.street === "preflop" ? ["UTG", "LJ", "HJ", "CO", "BTN", "SB", "BB"] : postflopPositions;
  const actor = order.indexOf(context.position);
  return [...opponents].sort((left, right) => ((order.indexOf(left.position) - actor + order.length) % order.length)
    - ((order.indexOf(right.position) - actor + order.length) % order.length));
}
function realizationFor(context, action, model) {
  const configured = typeof model.realization === "function" ? model.realization({ context, action }) : model.realization;
  if (configured !== undefined) {
    if (!Number.isFinite(configured) || configured < 0 || configured > 1) throw new RangeError("Equity realization must be a finite probability.");
    return configured;
  }
  return { preflop: 0.85, flop: 0.92, turn: 0.97, river: 1 }[context.street];
}

function candidateValue(context, candidate, worlds, model) {
  if (candidate.type === "fold") return { ...candidate, ev: 0, foldEquity: 0, equityWhenCalled: null, expectedCallers: 0, realization: 1 };
  const target = candidate.type === "check" ? context.raiseTo : candidate.to;
  const cost = candidate.cost;
  const realization = realizationFor(context, candidate, model);
  let value = 0, folds = 0, equity = 0, called = 0, callers = 0, finalPotTotal = 0;
  for (const world of worlds) {
    let currentPot = context.pot + cost;
    const continuing = [];
    for (const opponent of responseOrder(context, world.opponents)) {
      const callCost = Math.max(0, target - opponent.streetPaid);
      const probability = continuationLikelihood({ personId: opponent.personId, holeCards: opponent.holeCards,
        features: opponent.features, callCost, potOdds: callCost / (currentPot + callCost), action: candidate, context }, model);
      if (callCost === 0 || opponent.responseRoll < probability) {
        continuing.push(opponent);
        currentPot += callCost;
      }
    }
    if (!continuing.length) { value += context.pot; folds += 1; finalPotTotal += context.pot; }
    else {
      const owned = share(world.heroScore, continuing);
      value += owned * realization * currentPot - cost;
      equity += owned;
      called += 1;
      callers += continuing.length;
      finalPotTotal += currentPot;
    }
  }
  const equityWhenCalled = called ? equity / called : null;
  const fairShare = called ? 1 / (1 + callers / called) : 1;
  const samplingMargin = called ? Math.sqrt(Math.max(0.01, equityWhenCalled * (1 - equityWhenCalled)) / called) : 1;
  // Upgrade an exploratory preflop raise to value only when the conditional
  // callers actually leave a substantial equity edge, not just a face card.
  const valueEdge = context.street === "preflop" && candidate.type === "raise" && candidate.intent === "bluff"
    && called >= Math.max(8, worlds.length * 0.08) && equityWhenCalled - samplingMargin > fairShare + 0.05;
  return { ...candidate, ...(valueEdge ? { intent: "value", cap: 1 } : {}), ev: value / worlds.length, foldEquity: folds / worlds.length,
    equityWhenCalled, expectedCallers: callers / worlds.length,
    expectedPot: finalPotTotal / worlds.length, realization };
}

export function evaluateHoldemDecision(rawContext, options = {}) {
  const context = normalizedContext(rawContext);
  const model = options.rangeModel ?? DEFAULT_HOLDEM_RANGE_MODEL;
  const sampled = options.sampled ?? sampleOpponentWorlds(context, options);
  const candidates = (options.candidates ?? buildHoldemCandidates(context, options)).map((candidate) => candidateValue(context, candidate, sampled.worlds, model));
  const equity = sampled.worlds.reduce((sum, world) => sum + world.equity, 0) / sampled.worlds.length;
  return { equity, potOdds: context.callCost ? context.callCost / (context.pot + context.callCost) : 0, samples: sampled.worlds.length,
    method: "public-range-monte-carlo-one-response-ev", opponentRanges: sampled.opponentRanges, candidates,
    assumptions: ["soft-public-action-ranges", "joint-disjoint-hands-and-runouts", "one-response-round",
      "no-future-raises-or-bets", "no-rake", "approximate-equity-realization"],
  };
}

function selectDecision(context, analysis, profile, random) {
  const legal = analysis.candidates.filter((candidate) => Number.isFinite(candidate.ev) && candidate.ev >= -1e-10);
  const safe = legal.filter((candidate) => !["bet", "raise"].includes(candidate.type)).reduce((best, candidate) => !best || candidate.ev > best.ev ? candidate : best, null);
  const best = Math.max(...legal.map((candidate) => candidate.ev));
  const tolerance = Math.max(0.025, context.pot * 0.015);
  const competitive = legal.filter((candidate) => candidate.ev >= best - tolerance);
  let weights = competitive.map((candidate) => ({ candidate, weight: Math.exp((candidate.ev - best) / Math.max(0.05, context.pot * 0.04))
    * (candidate.type === "call" ? 1 + profile.callTolerance * 3 : ["bet", "raise"].includes(candidate.type) && candidate.intent === "value" ? 1 + profile.valueAggression : 1) }));
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  weights = weights.map((entry) => ({ ...entry, probability: entry.weight / total }));
  let remainder = 0;
  for (const entry of weights) {
    if (["bet", "raise"].includes(entry.candidate.type)) {
      const retained = entry.probability * clamp(entry.candidate.cap ?? 1);
      remainder += entry.probability - retained;
      entry.probability = retained;
    }
  }
  if (remainder > 0 && safe) {
    const found = weights.find((entry) => entry.candidate === safe);
    if (found) found.probability += remainder;
    else weights.push({ candidate: safe, probability: remainder });
  }
  weights = weights.filter((entry) => entry.probability > 0);
  const probabilities = Object.fromEntries(actions.map((type) => [type, 0]));
  let bluffProbability = 0;
  for (const entry of weights) {
    probabilities[entry.candidate.type] += entry.probability;
    if (entry.candidate.intent === "bluff") bluffProbability += entry.probability;
  }
  let point = random("action");
  if (!Number.isFinite(point) || point < 0 || point > 1) throw new RangeError("Decision randomness must be in [0,1].");
  let selected = weights.at(-1).candidate;
  for (const entry of weights) { point -= entry.probability; if (point < 0) { selected = entry.candidate; break; } }
  const { type, to, reason, reasonValues, intent, plan } = selected;
  return { type, to, reason, reasonValues: reasonValues ?? {}, intent, ...(plan ? { plan } : {}), profileId: profile.id,
    decisionProbabilities: probabilities, bluffProbability, analysis: { ...analysis, selected: { type, to, ev: selected.ev } } };
}

/** Mix profitable candidates; style frequency caps fall back to the best passive EV. */
export function createHoldemDecisionEngine({ samples = 128, cacheSize = 128, rangeModel = DEFAULT_HOLDEM_RANGE_MODEL } = {}) {
  const cache = new Map();
  return {
    decide(rawContext, { profile: customProfile, seed = 1, random = () => 0.5 } = {}) {
      const context = normalizedContext(rawContext);
      const profile = { ...defaultProfile, ...customProfile };
      const key = JSON.stringify([seed, samples, context.personId, context.position, context.street, context.holeCards, context.board,
        publicOpponents(context), context.raiseTo, context.ownInvestment, context.callCost, context.effectiveStack,
        context.history, context.priorHistory, context.activeCount]);
      let sampled = cache.get(key);
      if (!sampled) {
        sampled = sampleOpponentWorlds(context, { samples, seed, rangeModel });
        cache.set(key, sampled);
        if (cache.size > cacheSize) cache.delete(cache.keys().next().value);
      }
      const analysis = evaluateHoldemDecision(context, { sampled, profile, rangeModel });
      return selectDecision(context, analysis, profile, random);
    },
    evaluate(context, options = {}) { return evaluateHoldemDecision(context, { samples, rangeModel, ...options }); },
    clearCache() { cache.clear(); },
  };
}
