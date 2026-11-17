import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { pages } from "./site-pages.mjs";

export const pwaFiles = ["manifest.webmanifest", "service-worker.js"];
const offlineWorker = "assets/build/friend-table-offline.js";
const placeholder = "/* HOLDEM_RELEASE */ null";
const hash = value => createHash("sha256").update(value).digest("hex");

async function listAssets(root, directory) {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true });
  return (await Promise.all(entries.filter(entry => !entry.name.startsWith(".")).map(entry => {
    const path = directory + entry.name;
    return entry.isDirectory() ? listAssets(root, path + "/") : entry.isFile() ? [path] : [];
  }))).flat();
}

export async function buildPWA(root) {
  const source = await readFile(new URL("../src/pwa-worker.js", import.meta.url), "utf8");
  if (!source.includes(placeholder)) throw new Error("Missing Holdem service worker release marker");
  const paths = [...pages.map(page => page.file), "manifest.webmanifest",
    ...(await listAssets(root, "assets/")).filter(path => path !== offlineWorker).sort()];
  const assets = await Promise.all(paths.map(async path => {
    const contents = await readFile(new URL(path, root));
    return { path, digest: hash(contents), bytes: contents.length };
  }));
  const files = assets.map(({ path, digest }) => [path, digest]);
  const version = hash(source + JSON.stringify(files)).slice(0, 24);
  return {
    worker: source.replace(placeholder, JSON.stringify({ version, files })),
    bytes: assets.reduce((sum, { bytes }) => sum + bytes, 0),
    paths,
  };
}
