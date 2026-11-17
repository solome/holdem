// Verify the artifacts that Pages will serve, including under a project subpath.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { pages } from "./site-pages.mjs";
import { REVIEW_PEOPLE } from "../src/review-people.mjs";
import { buildPWA } from "./pwa.mjs";

const appleTouchIcon = "assets/brand/apple-touch-icon.png";

export async function verifySite(root) {
  const html = new Map(await Promise.all(pages.map(async ({ file }) =>
    [file, await readFile(new URL(file, root), "utf8")])));
  for (const p of pages) {
    const page = html.get(p.file);
    const assets = new Set();
    assert.match(page, /<link rel="manifest" href="manifest\.webmanifest">/, p.file + ": link the shared PWA manifest");
    assert.equal([...page.matchAll(/<script\b[^>]* src="([^"]+)"/g)].map(m => m[1]).join(),
      `assets/build/${p.entry}.js`, p.file + ": load only the current page script");
    for (const [, url] of page.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (url.startsWith("https://") || url.startsWith("http://")) continue;
      assert.ok(!url.startsWith("/") && !url.startsWith("data:"), p.file + ": " + url);
      const [relativeUrl, hash] = url.split("#");
      const [path] = relativeUrl.split("?");
      if (path && !html.has(path)) {
        await stat(new URL(path, root)); // Throws on unpublished assets.
        if (path !== appleTouchIcon) assets.add(path); // The Home Screen installation icon is not a page resource.
      }
      if (hash) assert.ok((html.get(path || p.file) ?? "").includes(`id="${hash}"`), p.file + ": " + url);
    }
    if (p.id === "review") {
      for (const id of Object.keys(REVIEW_PEOPLE)) assets.add(`assets/avatars/${id}.webp`);
      // These workers are loaded after the review is visible, including offline.
      for (const worker of ["friend-table-worker", "friend-table-offline"])
        await stat(new URL(`assets/build/${worker}.js`, root));
    }
    const sizes = await Promise.all([...assets].map(async path => (await stat(new URL(path, root))).size));
    const bytes = sizes.reduce((sum, size) => sum + size, Buffer.byteLength(page));
    // Uncompressed cold-load budget, including all seven avatars on the review page.
    assert.ok(bytes < 320 * 1024, p.file + ": page exceeds 320 KiB (" + bytes + " bytes)");
  }
  const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", root), "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  for (const icon of [...manifest.icons, { src: appleTouchIcon, sizes: "180x180" }]) {
    const png = await readFile(new URL(icon.src, root));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", icon.src + ": PNG icon");
    assert.equal(icon.sizes, `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`);
    assert.ok(icon.src.startsWith("assets/brand/"), icon.src + ": scoped icon URL");
  }
  assert.ok([192, 512].every(size => manifest.icons.some(icon => icon.purpose === "any" && icon.sizes === `${size}x${size}`)));
  assert.ok(manifest.icons.some(icon => icon.purpose === "maskable"));
  for (const { url } of manifest.shortcuts) assert.ok(html.has(url), url + ": valid shortcut target");
  const release = await buildPWA(root);
  assert.equal(await readFile(new URL("service-worker.js", root), "utf8"), release.worker, "packaged worker matches all published offline assets");
  assert.ok(release.bytes <= 2 * 1024 * 1024, "offline release exceeds 2 MiB: " + release.bytes + " bytes");
}
