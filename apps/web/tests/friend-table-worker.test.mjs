import assert from "node:assert/strict";
import { once } from "node:events";
import { Worker } from "node:worker_threads";
import test from "node:test";
import legacyDeal from "./fixtures/friend-ak-v1.json" with { type: "json" };

test("friend table worker restores a saved deal and rotates the dealer on the next hand", async (t) => {
  const worker = new Worker(`
    const { parentPort, workerData } = require("node:worker_threads");
    globalThis.self = { postMessage: data => parentPort.postMessage(data) };
    import(workerData).then(() => parentPort.on("message", data => self.onmessage({ data })));
  `, { eval: true, workerData: new URL("../src/friend-table-worker.js", import.meta.url).href });
  t.after(() => worker.terminate());
  const peopleIds = legacyDeal.seats.map(({ personId }) => personId);
  async function request(data) {
    const reply = once(worker, "message");
    worker.postMessage({ peopleIds, ...data });
    const [result] = await reply;
    assert.equal(result.error, undefined);
    return result;
  }

  const { table, record } = await request({ savedRecord: JSON.stringify(legacyDeal) });
  assert.equal(table.version, 3);
  assert.deepEqual(table.board, legacyDeal.board);
  assert.deepEqual(JSON.parse(record), table);
  const restored = await request({ savedRecord: record });
  assert.deepEqual(restored.table, table);
  assert.equal(restored.record, undefined);

  const { seatOrder, buttonSeat, handNumber } = table;
  const next = await request({ previous: { seatOrder, buttonSeat, handNumber } });
  assert.deepEqual(next.table.seatOrder, seatOrder);
  assert.equal(next.table.buttonSeat, (buttonSeat + 1) % seatOrder.length);
  assert.equal(next.table.handNumber, handNumber + 1);
  assert.deepEqual(JSON.parse(next.record), next.table);
});
