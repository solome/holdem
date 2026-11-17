/* The build provides an exact version and digest for every offline file. */
const release = /* HOLDEM_RELEASE */ null;
const scope = new URL(self.registration.scope);
const cachePrefix = `holdem-pwa:${encodeURIComponent(scope.pathname)}:`;
const cacheName = cachePrefix + release.version;
const files = new Map(release.files);

function hex(buffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function precache() {
  const cache = await caches.open(cacheName);
  const entries = [...files];
  try {
    for (let i = 0; i < entries.length; i += 6) {
      await Promise.all(entries.slice(i, i + 6).map(async ([path, expected]) => {
        const key = new URL(path, scope);
        const source = new URL(key);
        source.searchParams.set("v", expected.slice(0, 16));
        const response = await fetch(source, { cache: "reload", redirect: "error" });
        if (!response.ok ||
            hex(await crypto.subtle.digest("SHA-256", await response.clone().arrayBuffer())) !== expected)
          throw new Error(`Incomplete Holdem release: ${path}`);
        await cache.put(key.href, response);
      }));
    }
  } catch (error) {
    await caches.delete(cacheName);
    throw error;
  }
}

self.addEventListener("install", event => {
  // Do not take over a page from another release while it is still open.
  event.waitUntil(precache());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("Range")) return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  let path = url.pathname.slice(scope.pathname.length);
  if (!path && request.mode === "navigate") path = "index.html";
  if (!files.has(path)) return;
  // The file is identical across query parameters; query-based matrix state
  // is still read from the original navigation URL by the document.
  const key = new URL(path, scope).href;
  event.respondWith(caches.match(key, { cacheName }).then(cached => cached ?? fetch(request)));
});
