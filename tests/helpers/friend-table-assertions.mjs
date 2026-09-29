import assert from "node:assert/strict";
import { deriveFriendTable } from "../../src/friend-table.mjs";

const streets = ["preflop", "flop", "turn", "river"];

export function assertConserved(table) {
  const initial = table.seats.reduce((sum, seat) => sum + seat.initialStack, 0);
  let previousPot = 0;
  for (const street of streets) {
    const view = deriveFriendTable(table, street);
    const effectiveStreet = streets[Math.min(streets.indexOf(street), streets.indexOf(table.endedStreet))];
    assert.equal(view.street, effectiveStreet);
    assert.equal(view.board.length, { preflop: 0, flop: 3, turn: 4, river: 5 }[effectiveStreet]);
    assert.equal(view.pot, view.seats.reduce((sum, seat) => sum + seat.contribution, 0));
    assert.ok(view.pot >= previousPot);
    previousPot = view.pot;
    for (const seat of view.seats) {
      assert.ok(seat.remaining >= 0);
      assert.equal(seat.remaining + seat.contribution, seat.initialStack);
      assert.ok(seat.contribution >= 0);
      assert.equal(seat.contribution * 2, Math.round(seat.contribution * 2));
      if (seat.folded) assert.equal(seat.winner, false);
    }
    const active = view.seats.filter((seat) => !seat.folded);
    assert.ok(active.length >= 1);
    if (active.length > 1) assert.equal(new Set(active.map((seat) => seat.contribution)).size, 1);
    assert.equal(view.seats.reduce((sum, seat) => sum + seat.remaining, view.pot), initial);
    if (streets.indexOf(street) < streets.indexOf(table.endedStreet)) assert.deepEqual(view.winnerIds, []);
    else assert.ok(view.winnerIds.length >= 1);
  }
}

/** Replay public actions independently of the strategy's reasons or random choices. */
export function assertLegalHistory(table) {
  const paid = new Map(table.seats.map((seat) => [seat.personId, 0]));
  const folded = new Set();
  for (const street of streets) {
    if (streets.indexOf(street) > streets.indexOf(table.endedStreet)) assert.deepEqual(table.history[street], []);
    const streetPaid = new Map(table.seats.map((seat) => [seat.personId, 0]));
    let high = 0;
    if (street === "preflop") {
      assert.deepEqual(table.blinds.map(({ position, amount }) => ({ position, amount })), [
        { position: "SB", amount: 0.5 }, { position: "BB", amount: 1 },
      ]);
      for (const blind of table.blinds) {
        assert.equal(table.seats.find((seat) => seat.personId === blind.personId).position, blind.position);
        paid.set(blind.personId, blind.amount);
        streetPaid.set(blind.personId, blind.amount);
      }
      high = 1;
    }
    const order = table.seats.map((seat) => seat.personId);
    const pending = new Set(order.filter((id) => !folded.has(id)));
    let cursor = street === "preflop" ? -1 : 4;
    let lastRaise = 1;
    for (const action of table.history[street]) {
      let expected = null;
      for (let offset = 1; offset <= order.length; offset += 1) {
        const candidate = order[(cursor + offset) % order.length];
        if (pending.has(candidate)) { expected = candidate; break; }
      }
      assert.equal(action.personId, expected, "Actions must follow UTG-first preflop and SB-first postflop order.");
      cursor = order.indexOf(action.personId);
      pending.delete(action.personId);
      assert.ok(paid.has(action.personId));
      assert.ok(!folded.has(action.personId), "A folded player must not act again.");
      assert.equal(action.potBefore, [...paid.values()].reduce((sum, amount) => sum + amount, 0));
      const before = streetPaid.get(action.personId);
      const facing = high - before;
      assert.equal(action.callCost, facing);
      assert.ok(action.amount >= 0);
      if (action.type === "fold") {
        assert.ok(facing > 0, "A free check must never be turned into a fold.");
        assert.equal(action.amount, 0);
        folded.add(action.personId);
      } else if (action.type === "check") {
        assert.equal(facing, 0);
        assert.equal(action.amount, 0);
      } else if (action.type === "call") {
        assert.ok(facing > 0, "Calls need an outstanding bet.");
        assert.equal(action.amount, facing);
      } else if (action.type === "bet") {
        assert.equal(high, 0);
        assert.ok(action.amount >= 1);
        lastRaise = action.amount;
      } else if (action.type === "raise") {
        assert.ok(high > 0);
        assert.ok(before + action.amount > high);
        assert.ok(before + action.amount - high >= lastRaise, "A full raise must match the previous raise size.");
        lastRaise = before + action.amount - high;
      } else assert.fail(`Unknown action ${action.type}`);
      if (action.type === "bet" || action.type === "raise") {
        order.filter((id) => id !== action.personId && !folded.has(id)).forEach((id) => pending.add(id));
      }
      paid.set(action.personId, paid.get(action.personId) + action.amount);
      streetPaid.set(action.personId, before + action.amount);
      assert.equal(action.to, streetPaid.get(action.personId));
      high = Math.max(high, action.to);
      assert.ok(paid.get(action.personId) <= table.seats.find((seat) => seat.personId === action.personId).initialStack);
    }
    if (streets.indexOf(street) <= streets.indexOf(table.endedStreet) && order.length - folded.size > 1) {
      assert.equal(pending.size, 0, "Every continuing player must have answered the last bet.");
    }
    for (const refund of table.refunds[street]) {
      assert.ok(refund.amount > 0);
      assert.ok(refund.amount <= streetPaid.get(refund.personId));
      const otherMaximum = Math.max(...[...streetPaid].filter(([id]) => id !== refund.personId).map(([, amount]) => amount));
      assert.equal(refund.amount, streetPaid.get(refund.personId) - otherMaximum,
        "Only the unmatched part of the largest bet can be returned.");
      paid.set(refund.personId, paid.get(refund.personId) - refund.amount);
      streetPaid.set(refund.personId, streetPaid.get(refund.personId) - refund.amount);
    }
    for (const seat of table.seats) assert.equal(seat.contributions[street], paid.get(seat.personId));
  }
}


export function assertDecisionMetadata(action) {
  const choices = ["bet", "call", "check", "fold", "raise"];
  assert.deepEqual(Object.keys(action.decisionProbabilities).sort(), choices);
  for (const value of Object.values(action.decisionProbabilities)) assert.ok(value >= 0 && value <= 1);
  assert.ok(Math.abs(Object.values(action.decisionProbabilities).reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
  assert.ok(action.decisionProbabilities[action.type] > 0, "The logged decision must have positive assigned probability.");
  assert.ok(Number.isFinite(action.bluffProbability) && action.bluffProbability >= 0 && action.bluffProbability <= 1);
  if (action.analysis?.selected) {
    assert.equal(action.analysis.selected.type, action.type);
    assert.ok(Number.isFinite(action.analysis.selected.ev) && action.analysis.selected.ev >= -1e-9,
      "The shared engine must not select an explicitly negative-EV candidate.");
  }
  if (["bluff", "semi-bluff"].includes(action.intent)) {
    assert.ok(["bet", "raise"].includes(action.type), "A passive action must not retain a bluff label.");
  }
}
