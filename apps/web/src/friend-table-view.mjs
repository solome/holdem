import { evaluateBest } from "./poker-odds.mjs";
import { POKER_STREETS as STREETS, POKER_BOARD_COUNTS as BOARD_COUNTS } from "./poker-engine.mjs";

export const FRIEND_TABLE_STORAGE_KEY = "holdem.friend-table.v1";
const STARTING_RANKS = "23456789TJQKA";

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
