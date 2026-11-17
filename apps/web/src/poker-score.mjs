// Exact integer ordering: category followed by five base-15 rank digits. Suits never break ties.
export const CATEGORY_UNIT = 15 ** 5;

// Pages that only use packScore don't need the 13-rank lookup table.
const STRAIGHT_HIGH = /* @__PURE__ */ buildStraightTable();
function buildStraightTable() {
  const table = new Uint8Array(8192);
  for (let mask = 0; mask < table.length; mask += 1) {
    for (let high = 14; high >= 6; high -= 1) {
      const straight = 31 << (high - 6);
      if ((mask & straight) === straight) {
        table[mask] = high;
        break;
      }
    }
    if (!table[mask] && (mask & 4111) === 4111) table[mask] = 5;
  }
  return table;
}

const highest = (mask) => 33 - Math.clz32(mask);
const rankBit = (rank) => 1 << (rank - 2);
export const packScore = (category, a = 0, b = 0, c = 0, d = 0, e = 0) =>
  category * CATEGORY_UNIT + a * 50625 + b * 3375 + c * 225 + d * 15 + e;

function highCardScore(category, mask) {
  let value = category * CATEGORY_UNIT;
  let place = 50625;
  for (let index = 0; index < 5; index += 1) {
    const rank = highest(mask);
    value += rank * place;
    place /= 15;
    mask ^= rankBit(rank);
  }
  return value;
}

/** Score 5–7 distinct deck IDs (four suits, then ranks 2 through A), without allocating. */
export function scoreCardIds(cards) {
  let once = 0;
  let twice = 0;
  let thrice = 0;
  let four = 0;
  let spades = 0;
  let hearts = 0;
  let clubs = 0;
  let diamonds = 0;
  let ns = 0;
  let nh = 0;
  let nc = 0;
  let nd = 0;
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    const bit = 1 << (card % 13);
    four |= thrice & bit;
    thrice |= twice & bit;
    twice |= once & bit;
    once |= bit;
    const suit = Math.floor(card / 13);
    if (suit === 0) { spades |= bit; ns += 1; }
    else if (suit === 1) { hearts |= bit; nh += 1; }
    else if (suit === 2) { clubs |= bit; nc += 1; }
    else { diamonds |= bit; nd += 1; }
  }
  const flush = ns >= 5 ? spades : nh >= 5 ? hearts : nc >= 5 ? clubs : nd >= 5 ? diamonds : 0;
  const straightFlush = STRAIGHT_HIGH[flush];
  if (straightFlush) return packScore(straightFlush === 14 ? 9 : 8, straightFlush);
  if (four) {
    const rank = highest(four);
    return packScore(7, rank, highest(once ^ rankBit(rank)));
  }
  if (thrice) {
    const rank = highest(thrice);
    const otherPairs = twice ^ rankBit(rank);
    if (otherPairs) return packScore(6, rank, highest(otherPairs));
  }
  if (flush) return highCardScore(5, flush);
  if (STRAIGHT_HIGH[once]) return packScore(4, STRAIGHT_HIGH[once]);
  if (thrice) {
    const rank = highest(thrice);
    const rest = once ^ rankBit(rank);
    const first = highest(rest);
    return packScore(3, rank, first, highest(rest ^ rankBit(first)));
  }
  if (twice) {
    const pair = highest(twice);
    const otherPairs = twice ^ rankBit(pair);
    if (otherPairs) {
      const second = highest(otherPairs);
      return packScore(2, pair, second, highest(once ^ rankBit(pair) ^ rankBit(second)));
    }
    let rest = once ^ rankBit(pair);
    const first = highest(rest);
    rest ^= rankBit(first);
    const second = highest(rest);
    return packScore(1, pair, first, second, highest(rest ^ rankBit(second)));
  }
  return highCardScore(0, once);
}
