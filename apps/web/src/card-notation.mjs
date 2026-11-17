const SUIT_IDS = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };

export function parseCardTokens(tokens) {
  const values = String(tokens).trim().split(/\s+/);
  if (!tokens || !values.length) throw new Error("Missing card tokens");
  const cards = values.map((token) => {
    const match = /^(10|[2-9TJQKA])([shcd])$/.exec(token);
    if (!match) throw new Error(`Invalid card: ${token}`);
    return { rank: match[1] === "T" ? "10" : match[1], suit: SUIT_IDS[match[2]] };
  });
  if (new Set(cards.map(({rank, suit}) => `${rank}:${suit}`)).size !== cards.length)
    throw new Error("Duplicate card");
  return cards;
}
