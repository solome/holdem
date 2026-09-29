import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FRIEND_TABLE_POSITIONS, createFriendTable } from "../src/friend-table.mjs";
import { choosePreflopAction } from "../src/friend-table-policy.mjs";
import { ODDS_DECK } from "../src/poker-odds.mjs";
import { REVIEW_PEOPLE } from "../src/review-people.mjs";
import { createFriendPlayerBrain } from "../src/friend-player-brain.mjs";
import { analyzeFriendStrategy, FRIEND_STRATEGY_SCENARIOS, friendStrategyContext } from "./friend-strategy-diagnostics.mjs";

const STREETS = ["preflop", "flop", "turn", "river"];
const rounded = (value) => Math.round(value * 1_000_000) / 1_000_000;
const frequency = (count, total) => ({ count, rate: total ? rounded(count / total) : 0 });

/** A continuous stream: changing a policy cannot change the next shuffled deal. */
function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function countUnopenedRanges(entryPolicy = choosePreflopAction) {
  return Object.fromEntries(FRIEND_TABLE_POSITIONS.map((position) => {
    // BB has no first-in raise opportunity after six folds. Use its actual
    // optional action against an SB limp and label that different context.
    const context = {
      position,
      callCost: position === "BB" ? 0 : position === "SB" ? 0.5 : 1,
      pot: position === "BB" ? 2 : 1.5,
      raiseCount: 0,
      remaining: position === "BB" ? 99 : position === "SB" ? 99.5 : 100,
      effectiveStack: 99,
      activeCount: position === "SB" || position === "BB" ? 2 : 7 - FRIEND_TABLE_POSITIONS.indexOf(position),
    };
    const counts = { raise: 0, call: 0, check: 0, fold: 0 };
    let combinations = 0;
    for (let first = 0; first < ODDS_DECK.length; first += 1) {
      for (let second = first + 1; second < ODDS_DECK.length; second += 1) {
        const action = entryPolicy({ ...context, holeCards: [ODDS_DECK[first], ODDS_DECK[second]] });
        counts[action.type] += 1;
        combinations += 1;
      }
    }
    return [position, {
      context: position === "BB" ? "vs-sb-limp" : "unopened",
      combinations,
      actions: Object.fromEntries(Object.entries(counts).map(([action, count]) => [action, frequency(count, combinations)])),
    }];
  }));
}

/** Exact observations of generated tables, with all rates represented as 0..1. */
export function analyzeFriendTables({ hands = 192, seed = 20260929, samples = 24,
  createTable = createFriendTable, entryPolicy = choosePreflopAction, includeDiagnostics = false, diagnosticSeeds = 16,
  diagnosticSamples = 128, measurePerformance = false, includeBenchmark = false } = {}) {
  if (!Number.isSafeInteger(hands) || hands < 1) throw new RangeError("--hands must be a positive safe integer.");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError("--seed must be a uint32.");
  if (!Number.isSafeInteger(samples) || samples < 1 || samples > 4096) throw new RangeError("--samples must be an integer from 1 to 4096.");
  const peopleIds = Object.keys(REVIEW_PEOPLE);
  const stream = seededRandom(seed);
  let randomCalls = 0;
  const rng = () => { randomCalls += 1; return stream(); };
  const dealHash = createHash("sha256");
  const endings = Object.fromEntries(STREETS.map((street) => [street, 0]));
  const streetActions = Object.fromEntries(STREETS.map((street) => [street, {
    handsReached: 0, totalActions: 0, bets: 0, raises: 0, bluffs: 0, semiBluffs: 0,
    checkRaises: 0, handsWithRaise: 0, isolations: 0, cbetOpportunities: 0, continuationBets: 0,
    delayedOpportunities: 0, delayedContinuationBets: 0, barrelOpportunities: 0, turnBarrels: 0,
    reasons: {},
  }]));
  const positions = Object.fromEntries(FRIEND_TABLE_POSITIONS.map((position) => [position, {
    vpipHands: 0, openRaiseHands: 0, facedOpen: 0, foldedToOpen: 0, facedThreeBet: 0, foldedToThreeBet: 0,
  }]));
  const handTimes = [];
  let analyzedDecisions = 0;
  let loggedEquitySamples = 0;
  const simulationStarted = performance.now();
  let tableVersion;
  let policyVersion;
  let sawFlop = 0;
  let limpedHands = 0;
  let overlimpedHands = 0;
  let totalFlopPlayers = 0;
  let multiwayFlops = 0;
  let currentPreflopEndingStreak = 0;
  let maxConsecutivePreflopEndings = 0;
  for (let index = 0; index < hands; index += 1) {
    const started = performance.now();
    const table = createTable({ peopleIds, rng, engineOptions: { samples } });
    handTimes.push(performance.now() - started);
    tableVersion = table.version;
    policyVersion = table.policyVersion;
    // Deliberately exclude action history and policyVersion from this digest.
    // Matching hashes prove baseline and after used identical seats/cards/stacks.
    dealHash.update(JSON.stringify({ seed: table.seed, board: table.board,
      seats: table.seats.map(({ position, personId, holeCards, initialStack }) => ({ position, personId, holeCards, initialStack })) }));
    dealHash.update("\n");
    endings[table.endedStreet] += 1;
    const preflopAggressor = table.history.preflop.filter((action) => action.type === "raise").at(-1)?.personId;
    const flopAggressor = table.history.flop.filter((action) => ["bet", "raise"].includes(action.type)).at(-1)?.personId;
    for (const street of STREETS) {
      if (STREETS.indexOf(street) <= STREETS.indexOf(table.endedStreet)) streetActions[street].handsReached += 1;
      const actions = table.history[street];
      const stats = streetActions[street];
      const checked = new Set();
      let hasRaise = false;
      let hasAggression = false;
      let limpersBeforeOpen = 0;
      stats.totalActions += actions.length;
      for (const action of actions) {
        if (Number.isFinite(action.analysis?.samples)) { analyzedDecisions += 1; loggedEquitySamples += action.analysis.samples; }
        stats.reasons[action.reason] = (stats.reasons[action.reason] ?? 0) + 1;
        if (street === "preflop" && !hasAggression && action.type === "call") limpersBeforeOpen += 1;
        if (street === "preflop" && !hasAggression && action.type === "raise" && limpersBeforeOpen > 0) stats.isolations += 1;
        const freeFirstAction = !hasAggression && action.callCost === 0;
        if (street === "flop" && freeFirstAction && action.personId === preflopAggressor) {
          stats.cbetOpportunities += 1;
          if (action.type === "bet") stats.continuationBets += 1;
        }
        if (street === "turn" && freeFirstAction && action.personId === preflopAggressor && !flopAggressor) {
          stats.delayedOpportunities += 1;
          if (action.type === "bet") stats.delayedContinuationBets += 1;
        }
        if (street === "turn" && freeFirstAction && action.personId === flopAggressor) {
          stats.barrelOpportunities += 1;
          if (action.type === "bet") stats.turnBarrels += 1;
        }
        if (action.type === "check") checked.add(action.personId);
        if (action.type === "bet") stats.bets += 1;
        if (action.type === "raise") {
          stats.raises += 1;
          hasRaise = true;
          if (checked.has(action.personId)) stats.checkRaises += 1;
        }
        if (["bet", "raise"].includes(action.type)) {
          if (action.intent === "bluff") stats.bluffs += 1;
          if (action.intent === "semi-bluff") stats.semiBluffs += 1;
        }
        if (action.type !== "check") checked.delete(action.personId);
        if (["bet", "raise"].includes(action.type)) hasAggression = true;
      }
      if (hasRaise) stats.handsWithRaise += 1;
    }
    if (table.endedStreet === "preflop") {
      currentPreflopEndingStreak += 1;
      maxConsecutivePreflopEndings = Math.max(maxConsecutivePreflopEndings, currentPreflopEndingStreak);
    } else {
      currentPreflopEndingStreak = 0;
      sawFlop += 1;
      const players = table.seats.filter((seat) => seat.foldStreet !== "preflop").length;
      totalFlopPlayers += players;
      if (players >= 3) multiwayFlops += 1;
    }
    const seatPositions = new Map(table.seats.map((seat) => [seat.personId, seat.position]));
    const vpip = new Set();
    let raiseCount = 0;
    let limpCount = 0;
    for (const action of table.history.preflop) {
      const position = seatPositions.get(action.personId);
      const stats = positions[position];
      if (action.type === "call" && action.amount > 0 && raiseCount === 0) limpCount += 1;
      if (action.callCost > 0 && raiseCount === 1) {
        stats.facedOpen += 1;
        if (action.type === "fold") stats.foldedToOpen += 1;
      } else if (action.callCost > 0 && raiseCount >= 2) {
        stats.facedThreeBet += 1;
        if (action.type === "fold") stats.foldedToThreeBet += 1;
      }
      if (action.amount > 0 && ["call", "raise"].includes(action.type)) vpip.add(position);
      if (action.type === "raise") {
        if (raiseCount === 0) stats.openRaiseHands += 1;
        raiseCount += 1;
      }
    }
    if (limpCount > 0) limpedHands += 1;
    if (limpCount > 1) overlimpedHands += 1;
    for (const position of vpip) positions[position].vpipHands += 1;
  }
  const simulationElapsedMs = performance.now() - simulationStarted;
  return {
    hands, seed, tableVersion, policyVersion, requestedDecisionSamples: samples, randomCalls,
    dealDigest: dealHash.digest("hex"),
    endingStreets: Object.fromEntries(STREETS.map((street) => [street, frequency(endings[street], hands)])),
    sawFlop: frequency(sawFlop, hands),
    limpedHands: frequency(limpedHands, hands),
    overlimpedHands: frequency(overlimpedHands, hands),
    flopPlayers: { total: totalFlopPlayers, meanPerHand: rounded(totalFlopPlayers / hands), meanWhenFlopSeen: sawFlop ? rounded(totalFlopPlayers / sawFlop) : 0 },
    multiwayFlops: { count: multiwayFlops, ratePerHand: rounded(multiwayFlops / hands), rateWhenFlopSeen: sawFlop ? rounded(multiwayFlops / sawFlop) : 0 },
    maxConsecutivePreflopEndings,
    actionRateDefinition: "Observed action counts / all recorded actions on that street; these are not a player's decision probabilities.",
    profileDefinition: "Fictional simulation parameters, not descriptions of the real people.",
    continuationDefinition: "C-bet opportunities use the last preflop raiser facing no flop bet. Value bets count too. Delayed c-bets require a checked-through flop; turn barrels continue the last flop aggressor. Policy reasons are counted separately.",
    actionsByStreet: Object.fromEntries(Object.entries(streetActions).map(([street, stats]) => [street, {
      handsReached: stats.handsReached,
      totalActions: stats.totalActions,
      bets: frequency(stats.bets, stats.totalActions),
      raises: frequency(stats.raises, stats.totalActions),
      bluffs: frequency(stats.bluffs, stats.totalActions),
      semiBluffs: frequency(stats.semiBluffs, stats.totalActions),
      checkRaises: frequency(stats.checkRaises, stats.totalActions),
      handsWithRaise: { count: stats.handsWithRaise, rateOfReachedHands: stats.handsReached ? rounded(stats.handsWithRaise / stats.handsReached) : 0 },
      isolations: frequency(stats.isolations, stats.totalActions),
      continuationBets: { opportunities: stats.cbetOpportunities, count: stats.continuationBets,
        rateOfOpportunities: stats.cbetOpportunities ? rounded(stats.continuationBets / stats.cbetOpportunities) : null },
      delayedContinuationBets: { opportunities: stats.delayedOpportunities, count: stats.delayedContinuationBets,
        rateOfOpportunities: stats.delayedOpportunities ? rounded(stats.delayedContinuationBets / stats.delayedOpportunities) : null },
      turnBarrels: { opportunities: stats.barrelOpportunities, count: stats.turnBarrels,
        rateOfOpportunities: stats.barrelOpportunities ? rounded(stats.turnBarrels / stats.barrelOpportunities) : null },
      reasons: stats.reasons,
    }])),
    positions: Object.fromEntries(Object.entries(positions).map(([position, stats]) => [position, {
      vpip: frequency(stats.vpipHands, hands),
      openRaise: frequency(stats.openRaiseHands, hands),
      foldToOpen: { opportunities: stats.facedOpen, ...frequency(stats.foldedToOpen, stats.facedOpen) },
      foldToThreeBet: { opportunities: stats.facedThreeBet, ...frequency(stats.foldedToThreeBet, stats.facedThreeBet) },
    }])),
    unopenedRangeMethod: "Exact 1326-combination enumeration of entry and sizing proposals before shared EV selection; these are not observed action frequencies.",
    unopenedRanges: countUnopenedRanges(entryPolicy),
    ...(measurePerformance ? { performance: {
      simulationElapsedMs: rounded(simulationElapsedMs), handLatencyMs: summarizeLatencies(handTimes),
      analyzedDecisions, loggedEquitySamples,
      note: "Logged samples describe estimates attached to actions; cached worlds may be reused. Timings are measured on this machine, not deterministic output.",
    } } : {}),
    ...(includeDiagnostics ? { strategyDiagnostics: analyzeFriendStrategy({ samplesPerProfile: diagnosticSeeds, equitySamples: diagnosticSamples }) } : {}),
    ...(includeBenchmark ? { productionBenchmark: benchmarkFriendEngine() } : {}),
  };
}

function summarizeLatencies(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return { count: values.length, mean: rounded(values.reduce((sum, value) => sum + value, 0) / values.length),
    p95: rounded(sorted[Math.max(0, Math.ceil(values.length * 0.95) - 1)]),
    min: rounded(sorted[0]), max: rounded(sorted.at(-1)) };
}

export function benchmarkFriendEngine({ samples = 128, decisions = 32, hands = 8, seed = 20261019 } = {}) {
  const peopleIds = Object.keys(REVIEW_PEOPLE);
  const decisionTimes = [];
  for (let index = 0; index < decisions; index += 1) {
    const personId = peopleIds[index % peopleIds.length];
    const view = friendStrategyContext(FRIEND_STRATEGY_SCENARIOS[index % FRIEND_STRATEGY_SCENARIOS.length].id, { personId });
    const started = performance.now();
    createFriendPlayerBrain({ personId, seed: seed + index, engineOptions: { samples } }).decide(view);
    decisionTimes.push(performance.now() - started);
  }
  const rng = seededRandom(seed);
  const handTimes = [];
  let actions = 0;
  for (let index = 0; index < hands; index += 1) {
    const started = performance.now();
    const table = createFriendTable({ peopleIds, rng, engineOptions: { samples } });
    handTimes.push(performance.now() - started);
    actions += Object.values(table.history).flat().length;
  }
  return { samplesPerDecision: samples, seed, firstDecisionMs: rounded(decisionTimes[0]), decisionLatencyMs: summarizeLatencies(decisionTimes),
    handLatencyMs: summarizeLatencies(handTimes), loggedActions: actions,
    note: "Fresh decision engines and complete hands measured at production sampling; wall times vary by machine and process warm-up.",
  };
}

const USAGE = "Usage: node scripts/analyze-friend-table.mjs [--hands 192] [--seed 20260929] [--samples 24] [--diagnostics] [--diagnostic-seeds 16] [--diagnostic-samples 128] [--benchmark]";
function optionsFromArguments(args) {
  const options = { measurePerformance: true };
  const names = { "--hands": "hands", "--seed": "seed", "--samples": "samples",
    "--diagnostic-seeds": "diagnosticSeeds", "--diagnostic-samples": "diagnosticSamples" };
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--diagnostics") { options.includeDiagnostics = true; continue; }
    if (option === "--benchmark") { options.includeBenchmark = true; continue; }
    if (!names[option] || !/^\d+$/.test(args[index + 1] ?? "")) throw new TypeError(USAGE);
    options[names[option]] = Number(args[++index]);
  }
  return options;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    if (process.argv.slice(2).includes("--help")) {
      process.stdout.write(`${USAGE}\nAll rates are fractions. Seeded decisions are reproducible; measured wall times are not.\n`);
    } else {
      process.stdout.write(`${JSON.stringify(analyzeFriendTables(optionsFromArguments(process.argv.slice(2))), null, 2)}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
