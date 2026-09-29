import { ODDS_DECK } from "./poker-odds.mjs";

const keyOf = (card) => `${card.rank}:${card.suit}`;
const cardKeys = new Set(ODDS_DECK.map(keyOf));
const validCard = (card) =>
  card !== null &&
  typeof card === "object" &&
  !Array.isArray(card) &&
  typeof card.rank === "string" &&
  typeof card.suit === "string" &&
  cardKeys.has(keyOf(card));
const cloneCard = (card) => (card ? { rank: card.rank, suit: card.suit } : null);
const validIndex = (cards, index) =>
  Number.isInteger(index) && index >= 0 && index < cards.length;

function groupSize(deal, group) {
  if (![3, 4, 5].includes(deal.stage))
    throw new RangeError("Card selection requires a flop, turn, or river.");
  if (!["hero", "board", "villain"].includes(group))
    throw new RangeError("Unknown card group.");
  if (group === "villain" && !deal.useVillain)
    throw new RangeError("Enable the opponent before selecting their cards.");
  return group === "board" ? deal.stage : 2;
}

function visibleCards(deal, group) {
  return Array.from({ length: groupSize(deal, group) }, (_, index) =>
    cloneCard(deal[group][index]),
  );
}

function blockedCards(deal, group) {
  const groups = ["hero", "board", ...(deal.useVillain ? ["villain"] : [])];
  return new Set(
    groups
      .filter((other) => other !== group)
      .flatMap((other) => visibleCards(deal, other))
      .filter(Boolean)
      .map(keyOf),
  );
}

/** A picker edits an isolated group draft until the user explicitly commits it. */
export function createCardSelection(deal, group, index) {
  const cards = visibleCards(deal, group);
  if (!validIndex(cards, index)) throw new RangeError("Invalid card slot.");
  return {
    group,
    originIndex: index,
    index,
    cards,
    blockedKeys: blockedCards(deal, group),
  };
}

export function activateSelectionSlot(selection, index) {
  if (!validIndex(selection.cards, index) || selection.index === index)
    return selection;
  return { ...selection, index };
}

export function clearSelectionCard(selection, index = selection.index) {
  if (!validIndex(selection.cards, index)) return selection;
  if (!selection.cards[index] && selection.index === index) return selection;
  const cards = selection.cards.slice();
  cards[index] = null;
  return { ...selection, cards, index };
}

export function pickSelectionCard(selection, card) {
  if (!validCard(card) || selection.blockedKeys.has(keyOf(card))) return selection;
  const selectedIndex = selection.cards.findIndex(
    (selected) => selected && keyOf(selected) === keyOf(card),
  );
  // Every card already in this draft remains clickable so it can be removed.
  if (selectedIndex >= 0) return clearSelectionCard(selection, selectedIndex);

  const cards = selection.cards.slice();
  let index = selection.index;
  if (!validIndex(cards, index)) return selection;
  const wasEmpty = !cards[index];
  cards[index] = cloneCard(card);
  if (wasEmpty) {
    // Continue filling empty slots, including holes before the active slot.
    for (let offset = 1; offset < cards.length; offset += 1) {
      const nextIndex = (index + offset) % cards.length;
      if (!cards[nextIndex]) {
        index = nextIndex;
        break;
      }
    }
  }
  return { ...selection, cards, index };
}

export function selectionChanged(deal, selection) {
  const current = visibleCards(deal, selection.group);
  return (
    current.length !== selection.cards.length ||
    current.some((card, index) => {
      const draftCard = selection.cards[index];
      return card || draftCard
        ? !card || !draftCard || keyOf(card) !== keyOf(draftCard)
        : false;
    })
  );
}

export function commitCardSelection(deal, selection) {
  const count = groupSize(deal, selection.group);
  if (selection.cards.length !== count)
    throw new RangeError("The board stage changed during card selection.");

  // Recheck the live deal because it may have changed since the picker opened.
  const used = blockedCards(deal, selection.group);
  for (const card of selection.cards) {
    if (card === null) continue;
    if (!validCard(card)) throw new TypeError("Invalid card in selection.");
    const key = keyOf(card);
    if (used.has(key)) throw new RangeError("A card cannot appear more than once.");
    used.add(key);
  }
  if (!selectionChanged(deal, selection)) return deal;
  const cards = deal[selection.group].slice();
  selection.cards.forEach((card, index) => {
    cards[index] = cloneCard(card);
  });
  return { ...deal, [selection.group]: cards };
}
