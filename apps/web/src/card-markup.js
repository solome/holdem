import { SUITS } from "./suits.mjs";

const suitMap = Object.fromEntries(SUITS.map((suit) => [suit.id, suit]));
export const uiCardKey = (value) => `${value.rank}:${value.suit}`;

export function createCardMarkup(t) {
  return function cardMarkup(value, options = {}) {
    if (options.inline) {
      const suit = suitMap[value.suit];
      if (!suit) return `<i class="playing-card rank-only">${value.rank}</i>`;
      return `<i class="playing-card suit-${suit.id}" data-card="${uiCardKey(value)}">${value.rank}<em>${suit.symbol}</em></i>`;
    }
    const {
      index = 0,
      count = 5,
      fan = true,
      detail = false,
      winning = false,
      unused = false,
      back = false,
    } = options;
    const midpoint = (count - 1) / 2;
    const angle = fan ? (index - midpoint) * (detail ? 3 : 7) : 0;
    const y = fan ? Math.abs(index - midpoint) * (detail ? 2 : 3) : 0;
    const style = `--angle:${angle}deg;--y:${y}px;--deal-index:${options.dealIndex ?? index};--deal-offset:${(midpoint - index) * 36}`;
    if (back)
      return `<span class="playing-card card-back" style="${style}" role="img" aria-label="${t("unknownCard")}"><span class="card-pip" aria-hidden="true">♠</span></span>`;
    const suit = suitMap[value.suit];
    const royalClass = ["J", "Q", "K"].includes(value.rank) ? " royal-card" : "";
    const classes = `playing-card suit-${suit.id}${royalClass}${winning ? " is-winning" : ""}${unused ? " is-unused" : ""}`;
    return `<span class="${classes}" style="${style}" role="img" aria-label="${t(value.suit)} ${value.rank}" data-card="${uiCardKey(value)}"><span class="card-corner" aria-hidden="true">${value.rank}<span class="corner-suit">${suit.symbol}</span></span><span class="card-pip" aria-hidden="true">${suit.symbol}</span><span class="card-corner bottom" aria-hidden="true">${value.rank}<span class="corner-suit">${suit.symbol}</span></span>${winning ? '<span class="winning-dot" aria-hidden="true"></span>' : ""}</span>`;
  };
}
