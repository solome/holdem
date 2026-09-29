import { createHoldemDecisionEngine } from "./holdem-decision-engine.mjs";

// These are editable simulation personalities, not claims about the people.
const profile = (id, labelKey, valueAggression, drawAggression, bluffFrequency, callTolerance, betSizing) => Object.freeze({
  id, labelKey, valueAggression, drawAggression, bluffFrequency, callTolerance, betSizing,
  cbetFrequency: 0.72 + valueAggression * 0.25,
  barrelFrequency: 0.35 + valueAggression * 0.35,
  slowPlayFrequency: 0.035 + (1 - valueAggression) * 0.06,
  isoSizing: 1,
});
export const FRIEND_SIMULATION_PROFILES = Object.freeze({
  tengteng: profile("simulation-01", "balanced", 0.70, 0.42, 0.10, 0.020, 0.50),
  kelin: profile("simulation-02", "patient", 0.60, 0.32, 0.07, 0.000, 0.42),
  xingxing: profile("simulation-03", "active", 0.86, 0.58, 0.20, 0.035, 0.60),
  juyipeng: profile("simulation-04", "curious", 0.74, 0.55, 0.14, 0.060, 0.50),
  minmin: profile("simulation-05", "careful", 0.58, 0.30, 0.06, -0.015, 0.40),
  wangwang: profile("simulation-06", "pressure", 0.90, 0.65, 0.22, 0.025, 0.66),
  jianjian: profile("simulation-07", "draw", 0.68, 0.70, 0.12, 0.040, 0.50),
});
const DEFAULT_PROFILE = profile("simulation-default", "balanced", 0.70, 0.45, 0.10, 0.02, 0.50);
export const FRIEND_PLAYER_PROFILES = FRIEND_SIMULATION_PROFILES;
export function getFriendSimulationProfile(personId) { return FRIEND_SIMULATION_PROFILES[personId] ?? DEFAULT_PROFILE; }
export const getFriendPlayerProfile = getFriendSimulationProfile;

const defaultDecisionEngine = createHoldemDecisionEngine();

function resolvedProfile(value, personId) {
  const result = { ...getFriendSimulationProfile(personId), ...value };
  for (const key of ["valueAggression", "drawAggression", "bluffFrequency", "cbetFrequency", "barrelFrequency", "slowPlayFrequency"]) {
    if (!Number.isFinite(result[key]) || result[key] < 0 || result[key] > 1) throw new RangeError(`Invalid ${key} probability.`);
  }
  if (!Number.isFinite(result.callTolerance) || result.callTolerance < -0.2 || result.callTolerance > 0.2
    || !Number.isFinite(result.betSizing) || result.betSizing < 0.25 || result.betSizing > 1
    || !Number.isFinite(result.isoSizing) || result.isoSizing < 0.5 || result.isoSizing > 2) throw new RangeError("Invalid simulated call tolerance or bet sizing.");
  return Object.freeze(result);
}

/** Independent of opponents' decisions, hole cards and the unrevealed board. */
export function playerDecisionRandom({ seed = 1, personId, street, decisionIndex, channel = "action" }) {
  let value = (2166136261 ^ seed) >>> 0;
  for (const character of `${personId}:${street}:${decisionIndex}:${channel}`) value = Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** Thin adapter: every player uses the same range/equity/EV algorithm. */
export function decideFriendAction(context, {
  profile: customProfile, random = () => 0.5, engine, decisionEngine, engineOptions, seed = 1, planState,
} = {}) {
  const currentProfile = resolvedProfile(customProfile, context.personId);
  const shared = engine ?? decisionEngine ?? (engineOptions ? createHoldemDecisionEngine(engineOptions) : defaultDecisionEngine);
  return shared.decide(context, { profile: currentProfile, random, seed, planState });
}

/** Profiles and RNG indices are per player. Default decision plans use public history;
 * the optional plan records below are diagnostic state, not an extra decision input.
 */
export function createFriendPlayerBrain({ personId, seed = 1, profile: customProfile, decisionEngine, engineOptions } = {}) {
  const currentProfile = resolvedProfile(customProfile, personId);
  const shared = decisionEngine ?? (engineOptions ? createHoldemDecisionEngine(engineOptions) : defaultDecisionEngine);
  const counters = new Map();
  const plans = new Map();
  return {
    profile: currentProfile,
    decide(context) {
      const index = counters.get(context.street) ?? 0;
      counters.set(context.street, index + 1);
      const equitySeed = Math.floor(playerDecisionRandom({ seed, personId, street: context.street, decisionIndex: index, channel: "equity" }) * 4294967296);
      const decision = shared.decide(context, {
        profile: currentProfile, seed: equitySeed,
        random: (channel = "action") => playerDecisionRandom({ seed, personId, street: context.street, decisionIndex: index, channel }),
        planState: Object.fromEntries(plans),
      });
      plans.set(context.street, { type: decision.type, plan: decision.plan ?? null });
      return { ...decision, profileId: currentProfile.id, decisionIndex: index };
    },
  };
}
