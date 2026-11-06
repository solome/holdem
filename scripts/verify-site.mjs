// Verify the artifacts that Pages will serve, including under a project subpath.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { pages } from "./site-pages.mjs";
import { REVIEW_PEOPLE } from "../src/review-people.mjs";

export async function verifySite(root) {
  const html = new Map(await Promise.all(pages.map(async ({ file }) =>
    [file, await readFile(new URL(file, root), "utf8")])));
  for (const p of pages) {
    const page = html.get(p.file);
    const assets = new Set();
    assert.equal([...page.matchAll(/<script\b[^>]* src="([^"]+)"/g)].map(m => m[1]).join(),
      `assets/build/${p.entry}.js`, p.file + ": load only the current page script");
    for (const [, url] of page.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (url.startsWith("https://") || url.startsWith("http://")) continue;
      assert.ok(!url.startsWith("/") && !url.startsWith("data:"), p.file + ": " + url);
      const [relativeUrl, hash] = url.split("#");
      const [path] = relativeUrl.split("?");
      if (path && !html.has(path)) {
        await stat(new URL(path, root)); // Throws on unpublished assets.
        assets.add(path);
      }
      if (hash) assert.ok((html.get(path || p.file) ?? "").includes(`id="${hash}"`), p.file + ": " + url);
    }
    if (p.id === "review") for (const id of Object.keys(REVIEW_PEOPLE)) assets.add(`assets/avatars/${id}.webp`);
    const sizes = await Promise.all([...assets].map(async path => (await stat(new URL(path, root))).size));
    const bytes = sizes.reduce((sum, size) => sum + size, Buffer.byteLength(page));
    // Uncompressed cold-load budget, including all seven avatars on the review page.
    assert.ok(bytes < 320 * 1024, p.file + ": page exceeds 320 KiB (" + bytes + " bytes)");
  }
}
