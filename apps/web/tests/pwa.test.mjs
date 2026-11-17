import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../src/pwa-worker.js", import.meta.url), "utf8");
const scope = "https://example.test/holdem/";
const cachePrefix = "holdem-pwa:%2Fholdem%2F:";
const files = new Map([["index.html", "homepage"], ["ranges.html", "matrix"], ["assets/build/ranges.js", "script"]]);

function fixture({ corrupt = false } = {}) {
  const entries = new Map([[cachePrefix + "previous", new Map()], ["another-app", new Map()]]);
  const handlers = new Map();
  let claimed = false;
  const release = { version: "next", files: [...files].map(([path, value]) =>
    [path, createHash("sha256").update(value).digest("hex")]) };
  vm.runInNewContext(source.replace("/* HOLDEM_RELEASE */ null", JSON.stringify(release)), {
    URL, crypto: webcrypto,
    self: {
      registration: { scope },
      clients: { claim: () => { claimed = true; } },
      addEventListener: (name, handler) => handlers.set(name, handler),
    },
    caches: {
      async open(name) {
        if (!entries.has(name)) entries.set(name, new Map());
        return { put: (key, value) => entries.get(name).set(key, value) };
      },
      async match(key, { cacheName }) { return entries.get(cacheName)?.get(key); },
      async keys() { return [...entries.keys()]; },
      async delete(name) { entries.delete(name); },
    },
    async fetch(url) {
      assert.ok(url.href.startsWith(scope), "fetches must remain in scope");
      assert.ok(url.searchParams.has("v"), "bypass earlier HTTP-cache deployments");
      const path = url.pathname.slice(new URL(scope).pathname.length);
      return new Response(corrupt && path === "ranges.html" ? "<html>unexpected</html>" : files.get(path));
    },
  });
  const dispatch = (type, fields = {}) => {
    let response;
    handlers.get(type)({
      waitUntil(result) { response = result; },
      respondWith(result) { response = result; },
      ...fields,
    });
    return response;
  };
  const navigate = (url, fields = {}) =>
    dispatch("fetch", { request: { url, method: "GET", mode: "navigate", headers: new Headers(), ...fields } });
  return { entries, dispatch, navigate, claimed: () => claimed };
}

test("offline navigation under the Pages subpath serves home and query-linked pages only", async () => {
  const { entries, dispatch, navigate, claimed } = fixture();
  await dispatch("install");
  assert.equal(claimed(), false, "a new worker must wait until the current release closes");
  assert.deepEqual([...entries.keys()], [cachePrefix + "previous", "another-app", cachePrefix + "next"]);
  await dispatch("activate");
  assert.equal(claimed(), true);
  assert.deepEqual([...entries.keys()], ["another-app", cachePrefix + "next"]);
  assert.equal(await (await navigate(scope)).text(), "homepage");
  assert.equal(await (await navigate(scope + "ranges.html?hand=KQo")).text(), "matrix");
  assert.equal(await (await navigate(scope + "assets/build/ranges.js", { mode: "cors" })).text(), "script");
  assert.equal(navigate(scope + "api/lookup"), undefined);
  assert.equal(navigate(scope + "ranges.html", { method: "POST" }), undefined);
  assert.equal(navigate("https://example.test/holdem-other/ranges.html"), undefined);
  assert.equal(navigate("https://other.test/holdem/ranges.html"), undefined);
});

test("a mismatched CDN response cannot replace a working offline release", async () => {
  const { entries, dispatch } = fixture({ corrupt: true });
  await assert.rejects(dispatch("install"), /Incomplete Holdem release: ranges.html/);
  assert.deepEqual([...entries.keys()], [cachePrefix + "previous", "another-app"]);
});
