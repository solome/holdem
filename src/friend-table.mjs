import { ODDS_DECK, evaluateBest } from "./poker-odds.mjs";
import { runPokerHand, POKER_STREETS, POKER_BOARD_COUNTS } from "./poker-engine.mjs";
import { createFriendPlayerBrain } from "./friend-player-brain.mjs";
import { createHoldemDecisionEngine } from "./holdem-decision-engine.mjs";
export { analyzeFriendHand, FRIEND_ACTION_REASONS } from "./friend-table-policy.mjs";

export const FRIEND_TABLE_POSITIONS = Object.freeze(["UTG", "LJ", "HJ", "CO", "BTN", "SB", "BB"]);
export const FRIEND_TABLE_STORAGE_KEY = "holdem.friend-table.v1";
const VERSION = 3;
const POLICY_VERSION = 5;
const STREETS = POKER_STREETS;
const BOARD_COUNTS = POKER_BOARD_COUNTS;
const STARTING_RANKS = "23456789TJQKA";
const cardKey = (card) => `${card?.rank}:${card?.suit}`;
const deckKeys = new Set(ODDS_DECK.map(cardKey));

function validatePeopleIds(peopleIds) {
  if (!Array.isArray(peopleIds) || peopleIds.length !== FRIEND_TABLE_POSITIONS.length
    || peopleIds.some((id) => typeof id !== "string" || !id.trim()) || new Set(peopleIds).size !== peopleIds.length) {
    throw new TypeError(`A friend table needs ${FRIEND_TABLE_POSITIONS.length} distinct person IDs.`);
  }
}
function randomInteger(min, max, rng) {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("The random source must return a number in [0, 1).");
  return min + Math.floor(value * (max - min + 1));
}
function shuffled(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInteger(0, index, rng);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function validCardsAndStacks({ board, seats } = {}, peopleIds) {
  if (!Array.isArray(board) || board.length !== BOARD_COUNTS.river || !Array.isArray(seats)
    || seats.length !== FRIEND_TABLE_POSITIONS.length) return false;
  const ids = new Set();
  const cards = [...board];
  for (const [index, seat] of seats.entries()) {
    if (!seat || seat.position !== FRIEND_TABLE_POSITIONS[index] || typeof seat.personId !== "string" || !seat.personId.trim()
      || ids.has(seat.personId) || (peopleIds && !peopleIds.includes(seat.personId))
      || !Array.isArray(seat.holeCards) || seat.holeCards.length !== 2
      || typeof seat.initialStack !== "number" || !Number.isSafeInteger(seat.initialStack * 2)
      || seat.initialStack < 20 || seat.initialStack > 1_000_000) return false;
    ids.add(seat.personId);
    cards.push(...seat.holeCards);
  }
  return cards.every((card) => card && typeof card === "object" && !Array.isArray(card)
    && typeof card.rank === "string" && typeof card.suit === "string" && deckKeys.has(cardKey(card)))
    && new Set(cards.map(cardKey)).size === cards.length;
}

function physicalSeat(buttonSeat, positionIndex) {
  return (buttonSeat + positionIndex - 4 + FRIEND_TABLE_POSITIONS.length) % FRIEND_TABLE_POSITIONS.length;
}

function normalizedLayout({ seats, seatOrder, buttonSeat = 4, handNumber = 1 }, strict = false) {
  if (!Number.isInteger(buttonSeat) || buttonSeat < 0 || buttonSeat >= FRIEND_TABLE_POSITIONS.length
    || !Number.isSafeInteger(handNumber) || handNumber < 1 || (seatOrder !== undefined && !Array.isArray(seatOrder))) return null;
  const order = seatOrder === undefined ? new Array(seats.length) : [...seatOrder];
  if (seatOrder === undefined) {
    if (strict) return null;
    seats.forEach((seat, index) => { order[physicalSeat(buttonSeat, index)] = seat.personId; });
  }
  if (order.length !== seats.length || new Set(order).size !== seats.length) return null;
  for (const [index, seat] of seats.entries()) {
    const expectedIndex = physicalSeat(buttonSeat, index);
    if (order[expectedIndex] !== seat.personId || (strict && seat.seatIndex === undefined)
      || (seat.seatIndex !== undefined && seat.seatIndex !== expectedIndex)) return null;
  }
  return { seatOrder: order, buttonSeat, handNumber };
}

function seedForDeal(deal) {
  // Legacy records have no independent seed. Only public identity/seat/stack
  // metadata may seed brains; hidden cards and future board cards never do.
  let hash = 2166136261;
  const text = JSON.stringify(deal.seats.map(({ position, personId, initialStack }) => ({ position, personId, initialStack })));
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

export function simulateFriendTable({ board, seats, seed = 1, seatOrder, buttonSeat = 4, handNumber = 1, decisionEngine, engineOptions }) {
  if (!validCardsAndStacks({ board, seats })) throw new TypeError("A simulation needs a valid seven-person deal and positive covered stacks.");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError("The deal seed must be a uint32.");
  const layout = normalizedLayout({ seats, seatOrder, buttonSeat, handNumber });
  if (!layout) throw new TypeError("Physical seats must agree with the dealer button and betting positions.");
  const sharedEngine = decisionEngine ?? createHoldemDecisionEngine(engineOptions);
  const result = runPokerHand({
    board,
    seats: seats.map((seat, index) => ({ ...seat, seatIndex: physicalSeat(layout.buttonSeat, index) })),
    createBrain: ({ personId }) => createFriendPlayerBrain({ personId, seed, decisionEngine: sharedEngine }),
  });
  return freeze({ version: VERSION, policyVersion: POLICY_VERSION, seed, ...layout, ...result });
}

/** Shuffle people only for the first hand; subsequent hands keep their chairs. */
export function createFriendTable({ peopleIds, rng = Math.random, seatOrder, buttonSeat = 4, handNumber = 1, decisionEngine, engineOptions }) {
  validatePeopleIds(peopleIds);
  if (seatOrder !== undefined) {
    validatePeopleIds(seatOrder);
    if (seatOrder.some((id) => !peopleIds.includes(id))) throw new TypeError("The physical seating must contain the current friends.");
  }
  const order = seatOrder ? [...seatOrder] : shuffled(peopleIds, rng);
  const deck = shuffled(ODDS_DECK, rng);
  return simulateFriendTable({
    seed: randomInteger(0, 0xffffffff, rng), seatOrder: order, buttonSeat, handNumber, decisionEngine, engineOptions,
    board: deck.slice(order.length * 2, order.length * 2 + BOARD_COUNTS.river),
    seats: FRIEND_TABLE_POSITIONS.map((position, index) => {
      const seatIndex = physicalSeat(buttonSeat, index);
      return { position, seatIndex, personId: order[seatIndex], holeCards: deck.slice(index * 2, index * 2 + 2), initialStack: randomInteger(8, 25, rng) * 10 };
    }),
  });
}

function browserStorage() { try { return globalThis.localStorage ?? null; } catch { return null; } }

/** Saved deals are replayed with the current engine; reloading never moves BTN. */
export function createFriendTableStore({ peopleIds, storage = browserStorage(), rng = Math.random, decisionEngine, engineOptions }) {
  validatePeopleIds(peopleIds);
  const roster = [...peopleIds];
  let saved;
  const persist = (table) => {
    let persisted = false;
    try {
      if (storage && typeof storage.setItem === "function") { storage.setItem(FRIEND_TABLE_STORAGE_KEY, JSON.stringify(table)); persisted = true; }
    } catch { /* Keep the hand and its physical seating in memory if storage is unavailable. */ }
    saved = Object.freeze({ table, persisted });
    return saved;
  };
  const readSaved = () => {
    try {
      const raw = storage?.getItem(FRIEND_TABLE_STORAGE_KEY);
      if (!raw) return null;
      const record = JSON.parse(raw);
      if (![1, 2, VERSION].includes(record?.version) || !validCardsAndStacks(record, roster)) return null;
      const legacy = record.version !== VERSION;
      const layout = legacy
        ? { seatOrder: record.seats.map((seat) => seat.personId), buttonSeat: 4, handNumber: 1 }
        : normalizedLayout(record, true);
      if (!layout || (!legacy && (record.buttonSeat === undefined || record.handNumber === undefined))) return null;
      const seed = Number.isInteger(record.seed) && record.seed >= 0 && record.seed <= 0xffffffff ? record.seed : seedForDeal(record);
      const seats = legacy ? record.seats.map(({ seatIndex, ...seat }) => seat) : record.seats;
      const table = simulateFriendTable({ board: record.board, seats, seed, ...layout, decisionEngine, engineOptions });
      if (JSON.stringify(record) === JSON.stringify(table)) {
        saved = Object.freeze({ table, persisted: true });
        return saved;
      }
      return persist(table);
    } catch { return null; }
  };
  return {
    load() {
      return saved ?? readSaved() ?? persist(createFriendTable({ peopleIds: roster, rng, decisionEngine, engineOptions }));
    },
    dealAgain() {
      const previous = saved ?? readSaved();
      if (!previous) return persist(createFriendTable({ peopleIds: roster, rng, decisionEngine, engineOptions }));
      return persist(createFriendTable({
        peopleIds: roster, rng, seatOrder: previous.table.seatOrder,
        buttonSeat: (previous.table.buttonSeat + 1) % roster.length,
        handNumber: previous.table.handNumber + 1, decisionEngine, engineOptions,
      }));
    },
  };
}

function startingHand(holeCards) {
  const ranks = holeCards.map(({ rank }) => rank === "10" ? "T" : rank)
    .sort((left, right) => STARTING_RANKS.indexOf(right) - STARTING_RANKS.indexOf(left));
  return ranks.join("") + (ranks[0] === ranks[1] ? "" : holeCards[0].suit === holeCards[1].suit ? "s" : "o");
}

export function deriveFriendTable(table, requestedStreet = "preflop") {
  if (!Object.hasOwn(BOARD_COUNTS, requestedStreet)) throw new RangeError("Choose preflop, flop, turn, or river.");
  const endedStreet = table.endedStreet ?? "river";
  const endIndex = STREETS.indexOf(endedStreet);
  const streetIndex = Math.min(STREETS.indexOf(requestedStreet), endIndex);
  const street = STREETS[streetIndex];
  const ended = streetIndex === endIndex;
  const uncontested = ended && Boolean(table.uncontested);
  const board = table.board.slice(0, BOARD_COUNTS[street]);
  const visibleStreets = STREETS.slice(0, streetIndex + 1);
  const seats = table.seats.map((seat) => {
    const hand = street === "preflop" ? { category: null, bestCards: [], score: null } : evaluateBest([...seat.holeCards, ...board]);
    const contribution = seat.contributions[street];
    const actions = (table.history?.[street] ?? []).filter((action) => action.personId === seat.personId).map((action) => ({ ...action, street }));
    const allActions = visibleStreets.flatMap((stage) => (table.history?.[stage] ?? []).filter((action) => action.personId === seat.personId).map((action) => ({ ...action, street: stage })));
    const lastAction = allActions.at(-1) ?? null;
    return {
      ...seat, startingHand: startingHand(seat.holeCards), ...hand,
      foldStreet: seat.foldStreet ?? null, folded: seat.foldStreet != null && STREETS.indexOf(seat.foldStreet) <= streetIndex,
      contribution, remaining: seat.initialStack - contribution, winner: false,
      actions, lastAction, reason: lastAction?.reason ?? null,
      refund: visibleStreets.flatMap((stage) => table.refunds?.[stage] ?? []).filter((refund) => refund.personId === seat.personId).reduce((sum, refund) => sum + refund.amount, 0),
    };
  });
  const contenders = seats.filter((seat) => !seat.folded);
  const winningScore = ended && !uncontested ? Math.max(...contenders.map((seat) => seat.score)) : null;
  const winnerIds = ended ? contenders.filter((seat) => uncontested || seat.score === winningScore).map((seat) => seat.personId) : [];
  if (ended) for (const seat of seats) seat.winner = winnerIds.includes(seat.personId);
  return { street, board, pot: seats.reduce((sum, seat) => sum + seat.contribution, 0), seats, winnerIds, ended, endedStreet, uncontested,
    seatOrder: table.seatOrder, buttonSeat: table.buttonSeat, handNumber: table.handNumber };
}
