import { createHoldemDecisionEngine } from "./holdem-decision-engine.mjs";

import { getFriendSimulationProfile } from "./friend-player-profiles.mjs";
export { FRIEND_SIMULATION_PROFILES, FRIEND_PLAYER_PROFILES, getFriendSimulationProfile, getFriendPlayerProfile } from "./friend-player-profiles.mjs";

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
