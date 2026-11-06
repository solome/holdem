import { parseCardTokens } from "../card-notation.mjs";
import { handbookHandTokens } from "../lag-handbook-visuals.mjs";
import { SUITS } from "../suits.mjs";

const symbols = Object.fromEntries(SUITS.map(suit => [suit.id, suit.symbol]));
const rank = token => token === "T" ? "10" : token;

function inlineHand(hand, renderCard, kind, tokens) {
  const match = /^([2-9TJQKA])([2-9TJQKA])([so])?$/.exec(hand);
  if (!match || (match[1] === match[2] && match[3])) throw new Error("Invalid hand class: " + hand);
  const ranks = [rank(match[1]), rank(match[2])];
  const example = tokens ?? (match[3] ? handbookHandTokens(hand) : undefined);
  const cards = example ? parseCardTokens(example) : ranks.map(rank => ({ rank }));
  if (cards.length !== 2 || cards.some((card, i) => card.rank !== ranks[i]))
    throw new Error(`Hand ${hand} does not describe ${example}`);
  const suited = cards[0].suit === cards[1].suit;
  if (match[3] && suited !== (match[3] === "s")) throw new Error(`Wrong suits for ${hand}: ${example}`);

  const faces = cards.map(card => renderCard(card, { inline: true })).join("");
  const label = !example ? hand + "，花色未指定" :
    `${hand}，${kind === "cards" ? "具体手牌" : "示意"} ${cards.map(c => c.rank + symbols[c.suit]).join(" ")}`;
  return `<span class="cash-inline-hand" role="img" aria-label="${label}"><b>${hand}</b><span class="cash-hand-cards">${faces}</span></span>`;
}

// Authored markers preserve exact/repeated deals and distinguish a hypothetical
// suit assignment from a recorded hand. Numeric pairs are marked explicitly.
export function renderCashHands(body, renderCard) {
  return body.replace(/<cash-hand(?: (cards|example)="([^"]+)")?>([^<]+)<\/cash-hand>/g,
    (_, kind, tokens, hand) => inlineHand(hand, renderCard, kind, tokens));
}

// Plain explanatory text in the drills/replays: only unambiguous shorthand.
// Never guess whether a two-digit number is a pair, a bet or an equity figure.
export function renderHandText(text, renderCard) {
  const annotated = text.replace(/<cash-hand\b[^>]*>[^<]+<\/cash-hand>|(?<![A-Za-z0-9])([AKQJT][AKQJT2-9][so]?|[2-9][2-9][so])(?![A-Za-z0-9])/g,
    (token, hand) => hand ? `<cash-hand>${hand}</cash-hand>` : token);
  return renderCashHands(annotated, renderCard);
}
