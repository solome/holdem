import { createFriendPlayerBrain } from "../src/friend-player-brain.mjs";
import { choosePreflopAction } from "../src/friend-table-policy.mjs";
import { FRIEND_TABLE_POSITIONS } from "../src/friend-table.mjs";

const IDS = ["tengteng", "kelin", "xingxing", "juyipeng", "minmin", "wangwang", "jianjian"];
const SUITS = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const cards = (text) => text.split(" ").map((value) => ({ rank: value.slice(0, -1), suit: SUITS[value.at(-1)] }));
const rounded = (value) => Math.round(value * 1_000_000) / 1_000_000;
const event = (personId, type, amount, to, potBefore, callCost = 0) => ({ personId, type, amount, to, potBefore, callCost });

export const FRIEND_STRATEGY_SCENARIOS = Object.freeze([
  { id: "ak_q72_rainbow", hand: "As Ks", flop: "Qs 7h 2d", players: 2 },
  { id: "ak_884_rainbow", hand: "As Ks", flop: "8s 8h 4d", players: 2 },
  { id: "ak_987_two_tone", hand: "As Ks", flop: "9h 8h 7c", players: 2 },
  { id: "ak_q72_four_way", hand: "As Ks", flop: "Qs 7h 2d", players: 4 },
  { id: "jj_t62_rainbow", hand: "Js Jc", flop: "10s 6h 2d", players: 2 },
  { id: "jj_832_rainbow", hand: "Js Jc", flop: "8h 3c 2d", players: 2 },
  { id: "ak_cold_caller", hand: "As Ks", flop: "Qs 7h 2d", players: 2, initiative: "opponent" },
  { id: "ak_called_three_bet", hand: "As Ks", flop: "Qs 7h 2d", players: 2, initiative: "three-bettor" },
  { id: "ak_faces_flop_raise", hand: "As Ks", flop: "Qs 7h 2d", players: 2, facingRaise: true },
  { id: "ak_turn_draw", hand: "As Ks", flop: "Qs 7h 2d", turn: "Js", players: 2, flopBet: true },
  { id: "ak_turn_blank", hand: "As Ks", flop: "Qs 7h 2d", turn: "4c", players: 2, flopBet: true },
  { id: "ak_delayed_turn", hand: "As Ks", flop: "Qs 7h 2d", turn: "Jh", players: 2, flopBet: false },
  { id: "ak_missed_river", hand: "As Ks", flop: "Qs 7h 2d", turn: "Jh", river: "4c", players: 2, flopBet: true },
]);

/** A fixed, legal public betting history; no opponent cards are supplied. */
export function friendStrategyContext(id, { personId = "juyipeng" } = {}) {
  const scenario = FRIEND_STRATEGY_SCENARIOS.find((candidate) => candidate.id === id);
  if (!scenario) throw new RangeError(`Unknown strategy diagnostic ${id}`);
  const otherIds = IDS.filter((value) => value !== personId);
  const opponent = otherIds[0];
  const extras = otherIds.slice(1, scenario.players - 1);
  const opponents = [opponent, ...extras];
  const positionOf = (id) => id === personId ? "BTN" : id === opponent ? scenario.initiative === "opponent" ? "CO" : "BB" : extras.indexOf(id) === 0 ? "HJ" : "CO";
  let pot = 1.5;
  const preflop = [];
  if (scenario.initiative === "opponent") {
    preflop.push(event(opponent, "raise", 3, 3, pot, 1)); pot += 3;
    preflop.push(event(personId, "call", 3, 3, pot, 3)); pot += 3;
  } else {
    for (const id of extras) { preflop.push(event(id, "call", 1, 1, pot, 1)); pot += 1; }
    preflop.push(event(personId, "raise", 3, 3, pot, 1)); pot += 3;
    if (scenario.initiative === "three-bettor") {
      preflop.push(event(opponent, "raise", 9, 10, pot, 2)); pot += 9;
      preflop.push(event(personId, "call", 7, 10, pot, 7)); pot += 7;
    } else {
      preflop.push(event(opponent, "call", 2, 3, pot, 2)); pot += 2;
      for (const id of extras) { preflop.push(event(id, "call", 2, 3, pot, 2)); pot += 2; }
    }
  }
  const priorHistory = { preflop };
  let board = cards(scenario.flop);
  let street = "flop";
  if (scenario.turn) {
    priorHistory.flop = [event(opponent, "check", 0, 0, pot)];
    if (scenario.flopBet) {
      priorHistory.flop.push(event(personId, "bet", 2.5, 2.5, pot)); pot += 2.5;
      priorHistory.flop.push(event(opponent, "call", 2.5, 2.5, pot, 2.5)); pot += 2.5;
    } else priorHistory.flop.push(event(personId, "check", 0, 0, pot));
    board = [...board, ...cards(scenario.turn)];
    street = "turn";
  }
  if (scenario.river) {
    priorHistory.turn = [event(opponent, "check", 0, 0, pot)];
    priorHistory.turn.push(event(personId, "bet", 5.5, 5.5, pot)); pot += 5.5;
    priorHistory.turn.push(event(opponent, "call", 5.5, 5.5, pot, 5.5)); pot += 5.5;
    board = [...board, ...cards(scenario.river)];
    street = "river";
  }
  const history = opponents.map((id) => event(id, "check", 0, 0, pot));
  const context = {
    personId, position: "BTN", seatIndex: 4, street, holeCards: cards(scenario.hand), board,
    pot, callCost: 0, raiseTo: 0, ownInvestment: 0, remaining: 150, effectiveStack: 150,
    activeCount: scenario.players, raiseCount: 0, lastFullRaise: 1, minRaiseTo: 1, maxRaiseTo: 149,
    canRaise: true, openerPosition: null, lastRaiserPosition: null, callerCount: 0,
    isLastToAct: true, history, priorHistory,
    players: [],
  };
  if (scenario.facingRaise) {
    history.push(event(personId, "bet", 2.5, 2.5, pot)); pot += 2.5;
    history.push(event(opponent, "raise", 10, 10, pot, 2.5)); pot += 10;
    Object.assign(context, { pot, callCost: 7.5, raiseTo: 10, ownInvestment: 2.5,
      raiseCount: 2, lastFullRaise: 7.5, minRaiseTo: 17.5 });
  }
  context.players = [personId, ...opponents].map((id) => {
    const streetPaid = context.history.filter((action) => action.personId === id).at(-1)?.to ?? 0;
    const invested = Object.values(context.priorHistory).reduce((sum, actions) =>
      sum + (actions.filter((action) => action.personId === id).at(-1)?.to ?? 0), streetPaid);
    const position = positionOf(id);
    return { personId: id, position, seatIndex: FRIEND_TABLE_POSITIONS.indexOf(position), remaining: 150,
      initialStack: invested + 150, invested, streetPaid, folded: false, foldStreet: null };
  });
  return context;
}

export function analyzeFriendStrategy({ samplesPerProfile = 16, equitySamples = 128, seedStart = 1,
  createBrain = createFriendPlayerBrain, preflopDecision = choosePreflopAction } = {}) {
  if (!Number.isSafeInteger(samplesPerProfile) || samplesPerProfile < 1) throw new RangeError("Positive samplesPerProfile required.");
  const scenarios = Object.fromEntries(FRIEND_STRATEGY_SCENARIOS.map((scenario) => {
    const counts = { bet: 0, check: 0, call: 0, raise: 0, fold: 0, cbetOpportunities: 0, continuationBet: 0, delayedOpportunities: 0, delayedContinuationBet: 0, barrelOpportunities: 0, turnBarrel: 0, valueProtection: 0 };
    const reasons = {};
    const profiles = {};
    let betSize = 0;
    for (const personId of IDS) {
      let bets = 0;
      const view = friendStrategyContext(scenario.id, { personId });
      const preflopAggressor = view.priorHistory.preflop.filter((action) => action.type === "raise").at(-1)?.personId;
      const flopAggressor = view.priorHistory.flop?.filter((action) => ["bet", "raise"].includes(action.type)).at(-1)?.personId;
      const unopenedStreet = view.callCost === 0 && !view.history.some((action) => ["bet", "raise"].includes(action.type));
      const cbetOpportunity = view.street === "flop" && unopenedStreet && preflopAggressor === personId;
      const delayedOpportunity = view.street === "turn" && unopenedStreet && preflopAggressor === personId && !flopAggressor;
      const barrelOpportunity = view.street === "turn" && unopenedStreet && flopAggressor === personId;
      for (let index = 0; index < samplesPerProfile; index += 1) {
        const action = createBrain({ personId, seed: seedStart + index, engineOptions: { samples: equitySamples } }).decide(structuredClone(view));
        counts[action.type] += 1;
        reasons[action.reason] = (reasons[action.reason] ?? 0) + 1;
        if (action.type === "bet") { bets += 1; betSize += action.to ?? 0; }
        if (cbetOpportunity) { counts.cbetOpportunities += 1; if (action.type === "bet") counts.continuationBet += 1; }
        if (delayedOpportunity) { counts.delayedOpportunities += 1; if (action.type === "bet") counts.delayedContinuationBet += 1; }
        if (barrelOpportunity) { counts.barrelOpportunities += 1; if (action.type === "bet") counts.turnBarrel += 1; }
        if (action.reason === "value-protection-bet") counts.valueProtection += 1;
      }
      profiles[personId] = { betCount: bets, betRate: rounded(bets / samplesPerProfile) };
    }
    const samples = IDS.length * samplesPerProfile;
    return [scenario.id, {
      street: scenario.river ? "river" : scenario.turn ? "turn" : "flop",
      hand: scenario.hand, board: [scenario.flop, scenario.turn, scenario.river].filter(Boolean).join(" "),
      activePlayers: scenario.players, initiative: scenario.initiative ?? "hero", samples,
      counts,
      rates: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, rounded(value / samples)])),
      meanBetTo: counts.bet ? rounded(betSize / counts.bet) : 0,
      opportunityRates: {
        continuationBet: counts.cbetOpportunities ? rounded(counts.continuationBet / counts.cbetOpportunities) : null,
        delayedContinuationBet: counts.delayedOpportunities ? rounded(counts.delayedContinuationBet / counts.delayedOpportunities) : null,
        turnBarrel: counts.barrelOpportunities ? rounded(counts.turnBarrel / counts.barrelOpportunities) : null,
      },
      reasons, profiles,
    }];
  }));
  const isolation = Object.fromEntries(FRIEND_TABLE_POSITIONS.map((position, positionIndex) => [position,
    Object.fromEntries([0, 1, 3].filter((limpers) => limpers <= positionIndex).map((limpers) => {
      if (position === "BB" && limpers === 0) return ["0", { action: "walk", to: null, reason: "No opponent remains; the big blind has no decision." }];
      const ownInvestment = position === "SB" ? 0.5 : position === "BB" ? 1 : 0;
      const action = preflopDecision({ holeCards: cards("As Kd"), position, street: "preflop", board: [],
        callCost: 1 - ownInvestment, raiseTo: 1, ownInvestment, pot: 1.5 + limpers,
        raiseCount: 0, callerCount: limpers, remaining: 200 - ownInvestment, effectiveStack: 190,
        activeCount: Math.max(2, 7 - FRIEND_TABLE_POSITIONS.indexOf(position)),
        minRaiseTo: 2, maxRaiseTo: 190, canRaise: true });
      return [String(limpers), { action: action.type, to: action.to ?? null, reason: action.reason }];
    })),
  ]));
  return {
    definition: "Observed decisions for fixed public histories over reproducible seeds and all seven simulation profiles. C-bets use the last preflop raiser and an unopened flop, including value bets; reason counts report policy branches separately. These are not population poker frequencies.",
    isolationDefinition: "Legal sizing proposals before EV selection; unreachable limper counts are omitted and a BB walk has no decision.",
    samplesPerProfile, equitySamplesPerDecision: equitySamples, seedStart, profileCount: IDS.length, scenarios, isolation,
  };
}
