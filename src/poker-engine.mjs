import { ODDS_DECK, evaluateBest } from "./poker-odds.mjs";

export const POKER_STREETS = Object.freeze(["preflop", "flop", "turn", "river"]);
export const POKER_BOARD_COUNTS = Object.freeze({ preflop: 0, flop: 3, turn: 4, river: 5 });
const roundChips = (amount) => Math.round(amount * 2) / 2;
const emptyStreets = () => Object.fromEntries(POKER_STREETS.map((street) => [street, []]));
const copyCard = ({ rank, suit }) => ({ rank, suit });
const publicAction = ({ personId, type, amount, to, callCost, potBefore }) => ({ personId, type, amount, to, callCost, potBefore });
const cardKey = (card) => `${card?.rank}:${card?.suit}`;
const deckKeys = new Set(ODDS_DECK.map(cardKey));
function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

/**
 * Betting state machine, independent of player strategy. Seats arrive in
 * preflop action order, with SB/BB identified by position. This simulation
 * reserves 1 BB for every live player, so all bets remain covered and no
 * all-in/side-pot processing is needed. Raise counts are never rules-capped.
 */
export function runPokerHand({ board, seats, createBrain, decide }) {
  if (!Array.isArray(board) || board.length !== 5 || !Array.isArray(seats) || seats.length < 2
    || !seats.some((seat) => seat.position === "SB") || !seats.some((seat) => seat.position === "BB")) throw new TypeError("A hand needs a five-card deal, seats and both blinds.");
  if (new Set(seats.map((seat) => seat.personId)).size !== seats.length || new Set(seats.map((seat) => seat.position)).size !== seats.length
    || seats.some((seat) => typeof seat.personId !== "string" || !seat.personId.trim() || typeof seat.position !== "string"
      || !Array.isArray(seat.holeCards) || seat.holeCards.length !== 2 || typeof seat.initialStack !== "number"
      || !Number.isSafeInteger(seat.initialStack * 2) || seat.initialStack < 2 || seat.initialStack > 1_000_000)) throw new TypeError("Seats need unique identities, positions, two hole cards and covered numeric stacks.");
  const cards = [...board, ...seats.flatMap((seat) => seat.holeCards)];
  if (cards.some((card) => !card || typeof card.rank !== "string" || typeof card.suit !== "string" || !deckKeys.has(cardKey(card)))
    || new Set(cards.map(cardKey)).size !== cards.length) throw new TypeError("Cards must be valid and unique across the hand.");
  const players = seats.map(({ position, personId, seatIndex, holeCards, initialStack }) => ({
    position, personId, seatIndex, holeCards: holeCards.map(copyCard), initialStack,
    foldStreet: null, contributions: {}, invested: 0, streetPaid: 0,
  }));
  const brains = new Map(players.map(({ personId, position, seatIndex }) => {
    const brain = createBrain ? createBrain({ personId, position, seatIndex }) : { decide };
    if (typeof brain?.decide !== "function") throw new TypeError("Every player needs a decision function.");
    return [personId, brain];
  }));
  const history = emptyStreets();
  const refunds = emptyStreets();
  const blinds = [];
  const active = () => players.filter((player) => player.foldStreet === null);
  const pot = () => players.reduce((sum, player) => sum + player.invested, 0);
  const remaining = (player) => player.initialStack - player.invested;
  const pay = (player, amount) => {
    if (!Number.isFinite(amount) || amount < 0 || amount > remaining(player)) throw new RangeError("A wager must be covered by the player's stack.");
    player.invested += amount;
    player.streetPaid += amount;
  };
  for (const [position, amount] of [["SB", 0.5], ["BB", 1]]) {
    const player = players.find((seat) => seat.position === position);
    pay(player, amount);
    blinds.push({ personId: player.personId, position, amount });
  }
  let endedStreet = "river";
  let uncontested = false;
  for (const street of POKER_STREETS) {
    if (street !== "preflop") players.forEach((player) => { player.streetPaid = 0; });
    // A two-seat game has BTN on SB and BB acts first postflop. A full table
    // reduced to two live players keeps its original button and action order.
    const firstPostflopIndex = players.findIndex((player) => player.position === (players.length === 2 ? "BB" : "SB"));
    const order = street === "preflop" ? [...players] : [...players.slice(firstPostflopIndex), ...players.slice(0, firstPostflopIndex)];
    let pending = order.filter((player) => player.foldStreet === null);
    let target = street === "preflop" ? 1 : 0;
    let lastFullRaise = 1;
    let raiseCount = 0;
    let openerPosition = null;
    let lastRaiserPosition = null;
    const callers = new Set();
    while (pending.length && active().length > 1) {
      const player = pending.shift();
      if (player.foldStreet !== null) continue;
      const live = active();
      const callCost = target - player.streetPaid;
      const potBefore = pot();
      const minRaiseTo = target === 0 ? 1 : target + lastFullRaise;
      const maxRaiseTo = Math.min(...live.map((seat) => seat.streetPaid + remaining(seat) - 1));
      const actorContext = freeze({
        personId: player.personId, position: player.position, seatIndex: player.seatIndex,
        holeCards: player.holeCards.map(copyCard), board: board.slice(0, POKER_BOARD_COUNTS[street]).map(copyCard),
        street, pot: potBefore, callCost, raiseTo: target, ownInvestment: player.streetPaid,
        remaining: remaining(player), effectiveStack: Math.min(...live.map(remaining)), activeCount: live.length,
        raiseCount, lastFullRaise, minRaiseTo, maxRaiseTo, canRaise: maxRaiseTo >= minRaiseTo,
        openerPosition, lastRaiserPosition, callerCount: callers.size,
        isLastToAct: order.filter((seat) => seat.foldStreet === null).at(-1) === player,
        players: players.map((seat) => ({
          personId: seat.personId, position: seat.position, seatIndex: seat.seatIndex, initialStack: seat.initialStack,
          remaining: remaining(seat), invested: seat.invested, streetPaid: seat.streetPaid, folded: seat.foldStreet !== null, foldStreet: seat.foldStreet,
        })),
        history: history[street].map(publicAction),
        priorHistory: Object.fromEntries(POKER_STREETS.slice(0, POKER_STREETS.indexOf(street)).map((stage) => [stage, history[stage].map(publicAction)])),
      });
      let decision = brains.get(player.personId).decide(actorContext);
      if (!decision || !["check", "call", "fold", "bet", "raise"].includes(decision.type)) throw new TypeError("A brain must return a legal action type.");
      if (decision.type === "fold" && callCost === 0) decision = {
        ...decision, type: "check", reason: "free-check", intent: "control", bluffProbability: 0,
        decisionProbabilities: { check: 1, call: 0, bet: 0, raise: 0, fold: 0 },
      };
      if (decision.type === "check" && callCost !== 0) throw new RangeError("A player facing a bet cannot check.");
      let type = decision.type;
      let amount = 0;
      const priorRaiseSize = lastFullRaise;
      if (type === "bet" || type === "raise") {
        type = target === 0 ? "bet" : "raise";
        const proposed = decision.to ?? (decision.amount != null ? player.streetPaid + decision.amount : Math.max(1, roundChips(potBefore * decision.fraction)));
        if (!Number.isFinite(proposed) || !Number.isInteger(proposed * 2) || proposed < minRaiseTo) throw new RangeError("A raise must meet the last full raise increment.");
        if (proposed > maxRaiseTo) throw new RangeError("A raise exceeds this simulation's covered-stack limit.");
        amount = proposed - player.streetPaid;
        pay(player, amount);
        lastFullRaise = proposed - target;
        target = proposed;
        if (openerPosition === null) openerPosition = player.position;
        lastRaiserPosition = player.position;
        callers.clear();
        raiseCount += 1;
        const index = order.indexOf(player);
        pending = [...order.slice(index + 1), ...order.slice(0, index)].filter((seat) => seat.foldStreet === null);
      } else if (type === "call") {
        amount = callCost;
        pay(player, amount);
        callers.add(player.personId);
        if (callCost === 0) type = "check";
      } else if (type === "fold") player.foldStreet = street;
      if (type !== decision.type) decision = {
        ...decision, type, reason: type === "check" ? "free-check" : decision.reason,
        intent: type === "check" ? "control" : decision.intent,
        bluffProbability: type === "check" ? 0 : decision.bluffProbability,
        decisionProbabilities: Object.fromEntries(["check", "call", "bet", "raise", "fold"].map((action) => [action, Number(action === type)])),
      };
      history[street].push({
        personId: player.personId, type, amount, to: player.streetPaid,
        reason: decision.reason ?? (type === "check" ? "free-check" : "value-call"), reasonValues: decision.reasonValues ?? {},
        callCost, potBefore, lastFullRaise: priorRaiseSize,
        intent: decision.intent ?? (["fold", "check"].includes(type) ? "control" : "value"),
        profileId: decision.profileId ?? brains.get(player.personId).profile?.id ?? null,
        decisionIndex: decision.decisionIndex ?? null,
        bluffProbability: decision.bluffProbability ?? 0,
        decisionProbabilities: decision.decisionProbabilities ?? Object.fromEntries(["check", "call", "bet", "raise", "fold"].map((action) => [action, Number(action === type)])),
        ...(decision.plan ? { plan: decision.plan } : {}),
        ...(decision.analysis ? { analysis: decision.analysis } : {}),
      });
    }
    if (active().length === 1) {
      uncontested = true;
      endedStreet = street;
      const winner = active()[0];
      const matched = Math.max(0, ...players.filter((player) => player !== winner).map((player) => player.streetPaid));
      const uncalled = Math.max(0, winner.streetPaid - matched);
      if (uncalled) {
        winner.invested -= uncalled;
        winner.streetPaid -= uncalled;
        refunds[street].push({ personId: winner.personId, amount: uncalled });
      }
    }
    players.forEach((player) => { player.contributions[street] = player.invested; });
    if (uncontested) {
      for (const later of POKER_STREETS.slice(POKER_STREETS.indexOf(street) + 1)) players.forEach((player) => { player.contributions[later] = player.invested; });
      break;
    }
  }
  const contenders = active();
  const scores = uncontested ? [] : contenders.map((player) => evaluateBest([...player.holeCards, ...board]).score);
  const winningScore = Math.max(...scores);
  return freeze({
    board: board.map(copyCard),
    seats: players.map(({ invested, streetPaid, ...player }) => ({ ...player, profileId: brains.get(player.personId).profile?.id ?? null })),
    blinds, history, refunds, endedStreet, uncontested,
    winnerIds: contenders.filter((player, index) => uncontested || scores[index] === winningScore).map((player) => player.personId),
  });
}
