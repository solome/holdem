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
