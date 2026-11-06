import { ENTRY_SCENARIOS, HANDS_169, RANGE_POSITIONS, RANGE_STYLES, getPriorPositions } from "./ranges.mjs";

const defaults = { style: "tag", position: "BTN", scenario: "raised", opponent: "CO", hand: "AKs" };
const hands = HANDS_169.map(hand => hand.id);
const options = { position: RANGE_POSITIONS, scenario: ENTRY_SCENARIOS, style: RANGE_STYLES, hand: hands };

// Invalid bookmarks open the normal preset instead of silently showing a different matchup.
export function readRangeLocation(url) {
  const params = url.protocol === "file:" && url.hash.startsWith("#range?")
    ? new URLSearchParams(url.hash.slice(7)) : url.searchParams;
  const state = { ...defaults };
  for (const [key, allowed] of Object.entries(options)) {
    if (!params.has(key)) continue;
    const values = params.getAll(key);
    if (values.length !== 1 || !allowed.includes(values[0])) return { ...defaults };
    state[key] = values[0];
  }
  // UTG has no preceding seat. A link specifying only that position can still open its chart.
  if (state.position === "UTG" && !params.has("scenario")) state.scenario = "unopened";
  if (state.scenario === "unopened") {
    state.opponent = null;
  } else {
    const prior = getPriorPositions(state.position);
    const selected = params.getAll("opponent");
    state.opponent = selected[0] ?? prior.at(-1);
    if (selected.length > 1 || !prior.includes(state.opponent)) return { ...defaults };
  }
  return state;
}

export function writeRangeLocation(current, state) {
  const next = new URL(current);
  // Local files can accept query links, but browsers restrict changes to their query in place.
  const local = next.protocol === "file:";
  const params = local ? new URLSearchParams() : next.searchParams;
  for (const key of Object.keys(options)) params.set(key, state[key]);
  if (state.scenario === "unopened") params.delete("opponent");
  else params.set("opponent", state.opponent);
  if (local) next.hash = "range?" + params;
  return next;
}

export function replaceRangeLocation(win, state) {
  const url = new URL(win.location.href);
  const next = writeRangeLocation(url, state);
  if (url.href === next.href) return;
  try {
    win.history.replaceState(win.history.state, "", next.href);
  } catch { /* Sandboxed previews can forbid URL changes. The matrix still works. */ }
}
